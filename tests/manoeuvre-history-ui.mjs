import { Simulator, SCENARIO_BY_ID } from '../src/model/index.js';
import { createRecording, pinOutput } from '../src/ui/manoeuvre-recording.js';

export function checkManoeuvreHistory(check) {
  const patient = new Simulator();
  patient.applyScenario(SCENARIO_BY_ID.get('healthy-vcv'));
  const unchanged = patient.fork();
  const chunked = patient.fork(), oneCall = patient.fork();
  for (let frame = 0; frame < 20; frame++) chunked.advance(0.017);
  oneCall.advance(0.34);
  const a = chunked.trace('caval'), b = oneCall.trace('caval');
  check('caval samples retain the same 250 Hz clock across uneven animation frames',
    a.n === 85 && b.n === a.n && a.data.slice(0,a.n).every((v,i) => v === b.data[i]));
  const pin = patient.fork();
  pin.setParam('rr', 11);
  const log = createRecording(patient, { id: 2, sim: pin });
  const pinSamples = [];
  const accumulate = pin.accumulate;
  // Independent per-integration-step cumulative volume at patient-clock boundaries.
  let ml = 0;
  pin.accumulate = function () {
    ml += this.circ.q.av * this.dt;
    pinSamples.push(ml);
    accumulate.call(this);
  };
  function step(t) { patient.advance(t, true); pin.advance(t, true); }
  step(24);
  unchanged.advance(24,true);
  const window = log.segments[0].window;
  const integral = t => pinSamples[Math.round(t/pin.dt)-1] ?? 0;
  const exact = (integral(window.end)-integral(window.start)) * 0.06 / (window.end-window.start);
  check('manoeuvre observes the patient without changing its trajectory',
    JSON.stringify(patient.circ) === JSON.stringify(unchanged.circ));
  check('Pin output includes exactly the same elapsed interval at a different respiratory rate',
    Math.abs(pinOutput(window) - exact) < 1e-7);
  check('active observation is not inherited by a newly created Pin',
    (() => {const count = log.rows.length; patient.fork().advance(5,true); return count === log.rows.length;})());
  patient.setParam('peep', 15);
  check('prescription event opens a separate interval and clears the phase-end pair',
    log.segments.length === 2 && log.segments[1].window === null && patient.metrics.breathPressures === null);
  step(9);
  check('a partial follow-up window retains respiratory observations but withholds mean output',
    log.segments[1].count > 0 && log.segments[1].count < 4 && log.rows.at(-1).co === null);
  step(15);
  check('a new output window contains only fresh breaths at one PEEP',
    log.segments[1].window.start >= 24 && log.segments[1].window.peep === 15);
  patient.startHold('inspiratory',1); step(8);
  check('occlusion interrupts both intervals and timestamps a zero-flow reading',
    log.segments.some(s=>s.label === 'Hold completed') && patient.measuredPoints.at(-1)?.airFlow === 0);
  patient.setParam('clung',patient.params.clung + 1);
  const frozen = log.rows.length;
  step(4);
  check('changing the lung closes the recording and preserves the prior history',
    !log.active && log.rows.length === frozen && log.segments[0].window === window);
  const newLog = createRecording(patient);
  patient.reset();
  check('patient reset stops acquisition before settling a new trajectory', !newLog.active && newLog.rows.length===0);
}
