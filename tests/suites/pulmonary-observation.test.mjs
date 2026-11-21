// Pressure-margin interpretation is a respiratory observation, independent of
// the instantaneous display frame. Observe the actual integrator rather than
// manufacturing a prescribed pressure waveform or a clinical target value.
import { section, check, settled, SCENARIOS } from '../support/model.mjs';

section('Pulmonary complete-breath pressure observation');
const s = settled({ mode: 'vcv', pmus: 0, vt: 600, peep: 10, stressedVolume: 500 }, 20);
check('settled initialization has a completed pulmonary pressure observation',
  Number.isFinite(s.metrics.lastBreathPulmonaryMargin));

const initialBreath = s.resp.breathCount;
const observed = new Map();
const displayed = new Map();
const frames = [];
const accumulate = s.accumulate;
// Read the real pressure pair at every integration step, without modifying it.
s.accumulate = function () {
  const count = this.resp.breathCount;
  const margin = this.circ.p.pv - this.circ.p.palv;
  const entry = observed.get(count) ?? { min: Infinity, max: -Infinity, count: 0 };
  entry.min = Math.min(entry.min, margin);
  entry.max = Math.max(entry.max, margin);
  entry.count++;
  observed.set(count, entry);
  accumulate.call(this);
};
let stableWithinBreath = true;
while (s.resp.breathCount < initialBreath + 4) {
  s.advance(0.02, true);
  const count = s.resp.breathCount;
  const m = s.metrics;
  if (displayed.has(count)) stableWithinBreath &&= displayed.get(count) === m.lastBreathPulmonaryMargin;
  else displayed.set(count, m.lastBreathPulmonaryMargin);
  frames.push({ margin: m.capillaryDownstreamTransmural,
    wedge: m.interpretability.wedge.level, pvr: m.interpretability.pvrDerived.level });
}
delete s.accumulate;
const complete = [...observed].filter(([count]) => count > initialBreath && displayed.has(count + 1));
check('the published minimum equals the observed pressure difference over complete breaths',
  complete.length >= 2 && complete.every(([count, value]) =>
    Math.abs(displayed.get(count + 1) - value.min) < 1e-12));
check('the pressure observation stays fixed within a breath while instantaneous pressure changes',
  stableWithinBreath && complete.every(([, value]) => value.max > value.min));
check('an expiratory positive margin cannot clear the completed-breath compression caution',
  frames.some(f => f.margin < 0) && frames.some(f => f.margin > 0)
    && frames.every(f => f.wedge === 'caution' && f.pvr === 'caution'));

function nextBoundary(sim) {
  const before = sim.resp.breathCount;
  const limit = 2 * 60 / sim.params.rr;
  for (let t = 0; sim.resp.breathCount === before && t < limit; t += 0.02) sim.advance(0.02, true);
  return sim.resp.breathCount > before;
}
s.setParam('peep', s.params.peep + 0.5);
check('a paused parameter edit immediately invalidates wedge and derived-PVR interpretation',
  s.metrics.lastBreathPulmonaryMargin === null && s.metrics.pvrSwing === null
    && s.metrics.interpretability.wedge.level === 'caution'
    && s.metrics.interpretability.pvrDerived.level === 'caution'
    && s.metrics.interpretability.wedge.reasons.some(reason => reason.includes('pending')));
check('the first boundary after an edit discards the incomplete breath',
  nextBoundary(s) && s.metrics.lastBreathPulmonaryMargin === null && s.metrics.pvrSwing === null);
check('the following boundary publishes one complete fresh breath',
  nextBoundary(s) && Number.isFinite(s.metrics.lastBreathPulmonaryMargin));

const parentMinimum = s.metrics.lastBreathPulmonaryMargin;
const parentAccumulator = s.pulmonaryMarginMin;
const pin = s.fork();
check('a Pin retains the completed observation and its in-progress minimum',
  pin.metrics.lastBreathPulmonaryMargin === parentMinimum
    && pin.pulmonaryMarginMin === parentAccumulator
    && pin.pulmonaryMarginStartedAtBoundary === s.pulmonaryMarginStartedAtBoundary);
pin.setParam('peep', pin.params.peep + 1);
check('invalidating a Pin leaves the other circulation observation intact',
  pin.metrics.lastBreathPulmonaryMargin === null
    && s.metrics.lastBreathPulmonaryMargin === parentMinimum
    && s.pulmonaryMarginMin === parentAccumulator);

const armed = s.startHold('inspiratory', 2);
check('arming an occlusion invalidates the complete-breath observation immediately',
  armed && s.metrics.lastBreathPulmonaryMargin === null && s.metrics.pvrSwing === null);
for (let t = 0; !s.resp.hold && t < 2 * 60 / s.params.rr; t += 0.02) s.advance(0.02, true);
s.advance(0.2, true);
check('an interrupted respiratory cycle cannot publish a complete-breath pressure minimum',
  !!s.resp.hold && s.metrics.lastBreathPulmonaryMargin === null && s.metrics.pvrSwing === null
    && s.metrics.interpretability.wedge.level === 'caution');
s.cancelHold();
const incompleteDiscarded = nextBoundary(s) && s.metrics.lastBreathPulmonaryMargin === null;
check('a released occlusion requires a new uninterrupted breath before interpretation resumes',
  incompleteDiscarded && nextBoundary(s) && Number.isFinite(s.metrics.lastBreathPulmonaryMargin));

// A large prescribed resistance change inside a breath must not be counted as
// a respiratory resistance excursion. No expected physiological amplitude is
// imposed: compare with independently observed extrema of the fresh cycle.
const resistanceByBreath = new Map();
s.accumulate = function () {
  const key = this.resp.breathCount;
  const entry = resistanceByBreath.get(key) ?? { min: Infinity, max: -Infinity };
  entry.min = Math.min(entry.min, this.circ.p.pvrEffective);
  entry.max = Math.max(entry.max, this.circ.p.pvrEffective);
  resistanceByBreath.set(key, entry);
  accumulate.call(this);
};
s.setParam('pvrBase', 0.60);
check('a prescribed resistance jump immediately invalidates respiratory resistance swing',
  s.metrics.pvrSwing === null && s.lastPvrSwing === null);
check('a breath containing the controller jump cannot publish a resistance swing',
  nextBoundary(s) && s.metrics.pvrSwing === null);
const freshBreath = s.resp.breathCount;
const finishedFresh = nextBoundary(s);
delete s.accumulate;
const extrema = resistanceByBreath.get(freshBreath);
const observedSwing = (extrema.max - extrema.min) / ((extrema.max + extrema.min) / 2);
check('the first new resistance swing uses only the independently observed complete fresh breath',
  finishedFresh && Number.isFinite(s.metrics.pvrSwing)
    && Math.abs(s.metrics.pvrSwing - observedSwing) < 1e-12);

section('Read measurements from one complete breath at the selected settings');
{
  const ards = settled({ ...SCENARIOS.find(scenario => scenario.id === 'ards-rv').params, peep: 5 }, 30);
  const pin = ards.fork();
  const pending = m => m.pplat === null && m.drivingPressure === null && m.crsMeasured === null
    && m.stressIndex === null && m.interpretability.plateau.level === 'unavailable'
    && m.interpretability.compliance.level === 'unavailable';
  ards.setParam('peep', 10);
  ards.advance(0.05, true);
  ards.setParam('peep', 15);
  check('a repeated PEEP change immediately withholds mixed-cycle measures and preserves the Pin',
    pending(ards.metrics) && Number.isFinite(pin.metrics.crsMeasured) && pin.params.peep === 5);
  check('the first inspiration after the change still lacks a complete fresh cycle',
    nextBoundary(ards) && pending(ards.metrics));
  // Sample every integration step of the next full cycle, including the
  // first inspiratory step, independently of the display refresh interval.
  const start = ards.resp.breathCount + 1;
  let inspiredMl = 0, recoil, baseline;
  const stop = ards.observeManoeuvre({ sample(world) {
    const r = world.resp;
    if (r.breathCount === start - 1 && r.phase === 'exp') baseline = r.palv;
    if (r.breathCount !== start) return;
    if (r.phase === 'insp') {
      inspiredMl += Math.max(0, r.flow) * world.dt * 1000;
      recoil = r.pplatCandidate;
    }
  } });
  nextBoundary(ards);
  nextBoundary(ards);
  stop();
  const m = ards.metrics;
  const driving = recoil - baseline;
  check('plateau, driving pressure and compliance agree with measurements from the same breath',
    m.pplat === recoil && Math.abs(m.drivingPressure - driving) < 1e-6
      && Math.abs(m.crsMeasured - inspiredMl / driving) < 1e-6);
  check('elevated pulmonary pressure with a cautioned wedge has no haemodynamic subtype',
    m.phPresent && m.interpretability.wedge.level === 'caution' && m.phClass === null);
  // Raise PEEP just before the next insufflation, while the resting lung is
  // still at the old volume. Read its two pressure-volume endpoints directly.
  const jump = pin.fork();
  const period = 60 / jump.params.rr;
  jump.advance(Math.max(0, period - jump.resp.tCycle - 2 * jump.dt), true);
  const first = jump.resp.breathCount + 1;
  let before = [jump.resp.palv, jump.resp.lungVolume], after;
  jump.setParam('peep', 15);
  const observeJump = jump.observeManoeuvre({ sample(world) {
    const r = world.resp;
    if (r.breathCount === first - 1 && r.phase === 'exp') before = [r.palv, r.lungVolume];
    if (r.breathCount === first && r.phase === 'insp') after = [r.palv, r.lungVolume];
  } });
  nextBoundary(jump);
  nextBoundary(jump);
  observeJump();
  const expected = 1000 * (after[1] - before[1]) / (after[0] - before[0]);
  check('the first inflation after a PEEP step uses its starting pressure even as resting volume changes',
    Math.abs(jump.resp.endExpiratoryPl - pin.resp.endExpiratoryPl) > 1
      && Math.abs(jump.metrics.crsMeasured - expected) < 0.001);
  ards.startHold('expiratory', 2);
  check('a hold clears the previously completed mechanical measurements', pending(ards.metrics));
  ards.cancelHold();
  ards.setParam('pmus', 5);
  ards.advance(7, true);
  check('a completed assisted breath does not supply passive compliance or driving pressure',
    pending(ards.metrics));
}
