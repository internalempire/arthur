import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Simulator } from '../../src/model/simulator.js';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';
import { stepRespiratory } from '../../src/model/respiratory.js';
import { stepCirculation, venousReturnBackPressure, curveIntersection } from '../../src/model/circulation.js';
import { fastGuytonCurves } from '../../src/ui/panels/guyton.js';

const output = process.argv[2];
if (!output) throw new Error('Usage: node tools/experiments/healthy-peep.mjs output.json');
const compartments = ['vSa','vSv','vIVC','vRa','vRv','vPa','vPt','vPv','vLa','vLv'];
const volume = c => compartments.reduce((sum, key) => sum + c[key], 0);
const s = new Simulator();
s.applyScenario(SCENARIO_BY_ID.get('healthy-vcv'));
const initialParameters = { ...s.params };
assert.equal(s.params.baroreflexEnabled, false);
s.advance(60, true); s.advance(60, true);

// Sequential intervention in one closed circulation. Time integrals span 60 s:
// 75 whole heartbeats and 14 breaths at the unchanged preset HR/RR.
function sample(seconds = 60) {
  const c = s.circ, p = s.effective, dt = s.dt, before = volume(c);
  const sums = {}, trace = [];
  const add = (key, value) => { assert.ok(Number.isFinite(value), key); sums[key] = (sums[key] ?? 0) + value * dt; };
  let invalid = false, lvOverlap = 0, rvOverlap = 0;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    stepRespiratory(p, s.resp, dt); stepCirculation(p, c, s.resp, dt);
    s.time += dt; s.accumulate();
    for (const key of ['av','pv','vr']) add(key, c.q[key] * .06);
    for (const key of ['ra','raTm','la','laTm','ppl','pab','pPeri','pmsf','pCrit','rvrEff','pvr','sa','pa','stressedVenous','abdZone']) add(key, c.p[key]);
    const elastic = c.p.stressedVenous / p.csv;
    add('pmsfElastic', elastic); add('pmsfAbdominal', c.p.pmsf - elastic);
    add('venousGradient', c.p.pmsf - venousReturnBackPressure(c.p.ra, c.p.pCrit));
    add('lungVolume', s.resp.lungVolume);
    for (const key of ['vSv','vIVC','rvEdv','rvEsv','lvEdv','lvEsv']) add(key, c[key]);
    invalid ||= c.pressureDomainInvalid || c.cardiacPhaseInvalid || c.limitTicks > 0;
    if (c.q.mv > 1e-6 && c.q.av > 1e-6) lvOverlap += c.q.av * dt;
    if (c.q.tv > 1e-6 && c.q.pv > 1e-6) rvOverlap += c.q.pv * dt;
    // Last two breaths: matched display clocks, not a new deep experiment.
    if (i * dt >= seconds - 120 / p.rr && i % Math.round(.05 / dt) === 0) {
      s.metrics = s.computeMetrics();
      const live = fastGuytonCurves(s), mean = fastGuytonCurves(s, 'mean');
      trace.push({ time: s.time, phase: s.resp.phase, lungVolume: s.resp.lungVolume,
        ppl: c.p.ppl, pab: c.p.pab,
        liveRvZero: live.cf.xIntercept, meanRvZero: mean.cf.xIntercept,
        livePmsf: live.vr.pmsf, meanPmsf: mean.vr.pmsf,
        meanCrossing: curveIntersection(mean.vr.points, mean.cf.points) });
    }
  }
  s.metrics = s.computeMetrics();
  const means = Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, value / seconds]));
  const range = key => [Math.min(...trace.map(t => t[key])), Math.max(...trace.map(t => t[key]))];
  const quality = { invalid, lvOverlap, rvOverlap, volumeError: volume(c) - before };
  assert.ok(!invalid && lvOverlap === 0 && rvOverlap === 0 && Math.abs(quality.volumeError) < 1e-6);
  assert.ok(Math.abs(means.av - means.vr) / means.av < .005);
  return { means, quality, ranges: Object.fromEntries(['lungVolume','ppl','pab','liveRvZero','meanRvZero','livePmsf','meanPmsf'].map(k => [k, range(k)])),
    displayed: { pplat: s.metrics.pplat, totalPeep: s.metrics.totalPeep, co: s.metrics.co }, trace };
}
const conditions = [];
for (const peep of [5, 15]) {
  if (peep === 15) { s.setParam('peep', 15); s.advance(60, true); s.advance(60, true); }
  const changed = Object.keys(initialParameters).filter(k => initialParameters[k] !== s.params[k]);
  assert.deepEqual(changed, peep === 5 ? [] : ['peep']);
  const first = sample(), second = sample();
  assert.ok(Math.abs(first.means.av - second.means.av) / second.means.av < .005);
  conditions.push({ peep, changed, parameters: { ...s.params }, first, second });
  console.log('Measured healthy-vcv PEEP', peep, 'CO', second.means.av, 'Pmsf', second.means.pmsf);
}
const modelFiles = ['circulation.js','respiratory.js','parameters.js','scenarios.js','simulator.js','lung.js'];
const hashes = Object.fromEntries(modelFiles.map(f => [f, createHash('sha256').update(readFileSync(new URL('../../src/model/' + f, import.meta.url))).digest('hex')]));
writeFileSync(output, JSON.stringify({ revision: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), node: process.version, hashes,
  scriptSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  uiSha256: createHash('sha256').update(readFileSync(new URL('../../src/ui/panels/guyton.js', import.meta.url))).digest('hex'),
  protocol: { scenario:'healthy-vcv', intervention:'Sequential PEEP 5 to 15; only peep changes; baroreflex remains off', baselineSettlementSeconds:135,
    postChangeSettlementSeconds:120, windows:2, windowSeconds:60, dt:s.dt,
    units:'pressures mmHg; PEEP/pplat/totalPeep cmH2O; flows L/min; blood volumes mL; lung volume L; resistance mmHg.s/mL (multiply by 1000/60 for WU)',
    means:'direct time integrals; ventricular EDV/ESV time means of completed-beat latched endpoints',
    range:'last two breaths sampled at 20 Hz; lung-volume minimum approximates EELV',
    scope:'model explanation, not patient calibration; production equations and prescribed settings unchanged except PEEP' }, conditions }, null, 2) + '\n');
console.log('Saved', output);
