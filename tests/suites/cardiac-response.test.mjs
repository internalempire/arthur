import { section, check, Simulator } from '../support/model.mjs';
import { cardiacResponseCurve } from '../../src/model/cardiac-response.js';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';
import { createCardiacResponseJob } from '../../src/ui/cardiac-response-job.js';
import { cardiacResponseParameters } from '../../src/model/cardiac-response-client.js';
import { resolveParams } from '../../src/model/position.js';

section('Whole-heart cardiac output response');
const healthy = SCENARIO_BY_ID.get('healthy-vcv').params;
const normal = cardiacResponseCurve(healthy, { scales: [0.4, 0.6, 1] });
const weak = cardiacResponseCurve(healthy, { scales: [0.4, 0.6], heartOverrides: { eesLv: 0.6 } });
const lowNormal = normal.samples[0], lowWeak = weak.samples[0];
check('lower LV contractility raises the RAP required for matched flow under identical boundaries',
  lowNormal.valid && lowWeak.valid && lowWeak.ra > lowNormal.ra + 0.1
    && Math.abs(lowWeak.co - lowNormal.co) / lowNormal.co < 0.005,
  `RAP ${lowNormal.ra.toFixed(3)} -> ${lowWeak.ra.toFixed(3)}; flow ${lowNormal.co.toFixed(3)} -> ${lowWeak.co.toFixed(3)}`);
const center = normal.samples.find(sample => sample.scale === 1);
check('the unperturbed loading experiment reproduces the reference aortic output and RAP',
  center.valid && Math.abs(center.co - normal.reference.co) < 0.01
    && Math.abs(center.ra - normal.reference.ra) < 0.05);
check('accepted loading points conserve central volume and pass all three measured flows',
  [...normal.samples, ...weak.samples].filter(s => s.valid).every(s =>
    Math.abs(s.balanceError) < 1e-5 && !s.invalid && s.mismatch < 0.005 && s.drift < 0.005));

const lv = SCENARIO_BY_ID.get('lv-failure').params;
const failing = cardiacResponseCurve(lv, { scales: [0.6, 1, 1.4] });
const refined = cardiacResponseCurve(lv, { scales: [0.6, 1], dt: 0.000125 });
check('LV failure response remains converged when the integration step is halved',
  refined.samples.every((s, i) => s.valid && failing.samples[i].valid
    && Math.abs(s.co - failing.samples[i].co) / Math.max(s.co, 0.1) < 0.005
    && Math.abs(s.ra - failing.samples[i].ra) < 0.05));
const tail = failing.samples.at(-1);
check('an invalid overloaded tail is reported and never plotted as a plateau',
  !tail.valid && tail.reason.includes('domain')
    && !failing.segments.flat().some((v, i) => i % 2 === 0 && v === tail.ra));

const prone = new Simulator();
prone.applyScenario({ params: { ...healthy, position: 'prone' } });
const effective = { ...prone.effective, venousToneVolume: 100 };
const frozen = cardiacResponseParameters(prone.params, effective);
const compensated = cardiacResponseCurve(frozen, { scales: [0.6, 1] });
check('a frozen response preserves venous recruitment and applies posture exactly once',
  compensated.valid && compensated.conditions.venousToneVolume === 100
    && compensated.conditions.ccw === resolveParams(prone.params).ccw
    && compensated.conditions.pab0 === resolveParams(prone.params).pab0
    && frozen.ccw === prone.params.ccw);

section('Measured LV output marker');
const patient = new Simulator();
patient.applyScenario({ params: { ...lv, peep: 0, hr: 90, rr: 15 } });
patient.advance(60, true);
let aorticVolume = 0;
const accumulate = patient.accumulate.bind(patient);
patient.accumulate = function () {
  aorticVolume += this.circ.q.av * this.dt;
  accumulate();
};
patient.advance(60, true);
check('the LV marker agrees with independently integrated aortic output in a settled circulation',
  Math.abs(patient.metrics.respiratoryOperatingPoint.aorticFlow - aorticVolume / 60 * 0.06) < 0.02);
patient.params.peep = 10;
patient.advance(4, true);
const transient = patient.metrics.respiratoryOperatingPoint;
check('the LV marker retains the output/inflow separation during pulmonary redistribution',
  transient.aorticFlow > transient.flow + 0.2);

section('Cardiac response worker lifecycle');
const workers = [];
const job = createCardiacResponseJob(() => {
  const worker = { terminate() { this.terminated = true; }, postMessage(message) { this.message = message; } };
  workers.push(worker);
  return worker;
}, () => {}, 0);
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const params = { eesLv: 3 };
job.request('first', params);
params.eesLv = 0.6;
await tick();
const first = workers[0];
job.request('second', params);
await tick();
first.onmessage({ data: { type: 'result', result: { valid: true, tag: 'obsolete' } } });
check('obsolete worker results are rejected and the source prescription is copied',
  first.terminated && first.message.params.eesLv === 3 && job.getState().result === null);
workers[1].onmessage({ data: { type: 'result', result: { valid: true, tag: 'current' } } });
check('the current result completes the worker and becomes visible',
  workers[1].terminated && job.getState().result.tag === 'current' && job.getState().status === 'ready');
job.request('third', {});
await tick();
workers[2].onerror();
check('worker failure clears the curve rather than retaining another patient response',
  job.getState().status === 'error' && job.getState().result === null);
job.reset();
