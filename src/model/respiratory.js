// Respiratory mechanics, built on the equation of motion and split into the two
// series elements the Campbell diagram draws separately: the lung and the chest
// wall. Volumes are litres above the relaxation volume (FRC); pressures cmH2O.
//
//   Palv = V / Crs - Pmus
//   Ppl  = PPL_FRC + V / Ccw - Pmus
//   flow = (Pao - Palv) / Raw
//
// Pleural pressure therefore follows the chest wall compliance curve while
// alveolar pressure follows the respiratory system curve — the distinction that
// makes airway pressure a poor proxy for the pressure the heart actually feels.

import { clamp } from './units.js';

// Pleural pressure at the relaxation volume. Its negative is the
// transpulmonary recoil at FRC, which is why alveolar pressure there is zero.
export const PPL_FRC = -5; // cmH2O

export function createRespiratoryState() {
  return {
    v: 0, // L above relaxation volume
    flow: 0, // L/s, positive = inspiratory
    phase: 'exp',
    tCycle: 0,
    tPhase: 0,
    pmus: 0,
    prevPhase: 'exp',
    canTrigger: true,
    breathCount: 0,
    // Occlusion manoeuvres. `holdPending` is armed by the caller and becomes an
    // active hold at the right moment in the breath, because an end-expiratory
    // hold has to start at end-expiration to mean anything.
    holdPending: null,
    hold: null,
    peakInspFlow: 0,
    // Latched once per breath for the readouts.
    lastPplat: 0,
    lastPpeak: 0,
    lastVt: 0,
    lastAutoPeep: 0,
    lastPplSwing: 0,
    pplatCandidate: 0,
    pplMin: Infinity,
    pplMax: -Infinity,
    vtAccum: 0,
    ppeakAccum: -Infinity,
  };
}

export function respiratorySystemCompliance(p) {
  return 1 / (1 / p.clung + 1 / p.ccw);
}

// How long the inspiratory muscles are active. Capped at half the respiratory
// cycle so effort never runs into the next breath.
function neuralInspiratoryTime(p, period) {
  return Math.min(p.ti, period * 0.5);
}

// Inspiratory muscle pressure: one continuous rise-and-release over the neural
// inspiratory time, zero in a fully passive patient. It has to reach zero at
// both ends — a discontinuity here would make the phase detector chatter.
function musclePressure(p, tCycle, period) {
  if (p.pmus <= 0) return 0;
  const tNeural = neuralInspiratoryTime(p, period);
  if (tCycle >= tNeural) return 0;
  return p.pmus * Math.sin((Math.PI * tCycle) / tNeural) ** 1.2;
}

// Airway opening pressure applied by the ventilator for the current phase.
function airwayOpeningPressure(p, r, period) {
  switch (p.mode) {
    case 'spont':
      return p.peep; // CPAP level; zero means an unsupported breath
    case 'vcv':
      return null; // flow is imposed instead
    case 'pcv':
      return r.phase === 'insp' ? p.peep + p.pinsp : p.peep;
    case 'psv':
      return r.phase === 'insp' ? p.peep + p.pinsp : p.peep;
    default:
      return p.peep;
  }
}

export function stepRespiratory(p, r, dt) {
  const period = 60 / p.rr;
  const crs = respiratorySystemCompliance(p) / 1000; // L/cmH2O
  const ccw = p.ccw / 1000;

  r.tCycle += dt;
  r.tPhase += dt;

  r.pmus = musclePressure(p, r.tCycle, period);

  // --- occlusion manoeuvres ------------------------------------------------
  // A hold freezes the airway: no flow, so alveolar pressure equilibrates with
  // the airway and the circulation settles at a fixed lung volume and pleural
  // pressure. That steady state is the point of the manoeuvre.
  if (r.hold) {
    r.flow = 0;
    const palvHeld = r.v / crs - r.pmus;
    r.palv = palvHeld;
    r.ppl = PPL_FRC + r.v / ccw - r.pmus;
    // With no flow the airway reads alveolar pressure — that is what a hold is
    // for, and it is why a plateau is measured this way.
    r.paw = palvHeld;
    r.pl = palvHeld - r.ppl;
    r.lungVolume = p.frc + r.v;
    r.pab = p.pab0 + p.abdCoupling * r.v;
    r.prevPhase = r.phase;
    return r;
  }

  // --- phase machine -------------------------------------------------------
  if (p.mode === 'psv') {
    // Patient-triggered, flow-cycled. The ventilator will not trigger again
    // until effort has fallen away and a fresh one begins, so cycling off in
    // the middle of an effort cannot immediately retrigger the same breath.
    if (r.pmus < 0.2) r.canTrigger = true;
    if (r.phase === 'exp' && r.canTrigger && r.pmus > 0.5) {
      r.phase = 'insp';
      r.tPhase = 0;
      r.peakInspFlow = 0;
      r.canTrigger = false;
    } else if (r.phase === 'insp') {
      r.peakInspFlow = Math.max(r.peakInspFlow, r.flow);
      if (r.flow < 0.25 * r.peakInspFlow && r.tPhase > 0.2) {
        r.phase = 'exp';
        r.tPhase = 0;
      }
    }
  } else if (p.mode === 'spont') {
    // Driven by the clock rather than by the muscle pressure, so the phase
    // cannot flicker at the two instants where effort passes through zero.
    r.phase = r.tCycle < neuralInspiratoryTime(p, period) ? 'insp' : 'exp';
  } else {
    if (r.phase === 'exp' && r.tCycle >= period) {
      r.phase = 'insp';
      r.tPhase = 0;
      r.tCycle = 0;
    } else if (r.phase === 'insp' && r.tPhase >= p.ti) {
      r.phase = 'exp';
      r.tPhase = 0;
    }
  }
  if (r.tCycle >= period && p.mode !== 'vcv' && p.mode !== 'pcv') r.tCycle = 0;

  // An armed hold engages at the phase it is named after.
  if (r.holdPending === 'expiratory' && r.prevPhase === 'exp' && r.tCycle > period * 0.9) {
    r.hold = 'expiratory';
    r.holdPending = null;
  } else if (r.holdPending === 'inspiratory' && r.prevPhase === 'insp' && r.phase === 'exp') {
    r.hold = 'inspiratory';
    r.holdPending = null;
  }

  // --- flow ----------------------------------------------------------------
  const palv = r.v / crs - r.pmus;
  const pao = airwayOpeningPressure(p, r, period);

  if (p.mode === 'vcv' && r.phase === 'insp') {
    // Constant inspiratory flow; airway pressure is whatever it takes.
    r.flow = p.vt / 1000 / p.ti;
  } else {
    const target = pao === null ? p.peep : pao;
    r.flow = (target - palv) / p.raw;
  }

  r.v = Math.max(0, r.v + r.flow * dt);
  if (r.flow > 0) r.vtAccum += r.flow * dt;

  // --- derived pressures ---------------------------------------------------
  const palvNew = r.v / crs - r.pmus;
  const ppl = PPL_FRC + r.v / ccw - r.pmus;
  const paw = p.mode === 'vcv' && r.phase === 'insp'
    ? palvNew + r.flow * p.raw
    : (pao === null ? p.peep : pao);

  r.palv = palvNew;
  r.ppl = ppl;
  r.paw = paw;
  r.pl = palvNew - ppl; // transpulmonary pressure
  r.lungVolume = p.frc + r.v; // absolute, L
  r.pab = p.pab0 + p.abdCoupling * r.v;

  // --- per-breath bookkeeping ----------------------------------------------
  r.pplMin = Math.min(r.pplMin, ppl);
  r.pplMax = Math.max(r.pplMax, ppl);
  r.ppeakAccum = Math.max(r.ppeakAccum, paw);
  // Static recoil pressure at end-inspiration, i.e. the plateau the ventilator
  // would show after an inspiratory hold.
  if (r.phase === 'insp') r.pplatCandidate = r.v / crs;

  // Everything reported per breath is latched exactly once, at the moment
  // inspiration ends — not on a time window that can fire twice.
  if (r.prevPhase === 'exp' && r.phase === 'insp') r.breathCount++;

  if (r.prevPhase === 'insp' && r.phase === 'exp') {
    r.lastPplat = r.pplatCandidate ?? 0;
    r.lastPpeak = r.ppeakAccum;
    r.lastPplSwing = r.pplMax - r.pplMin;
    r.lastVt = r.vtAccum * 1000;
    r.ppeakAccum = -Infinity;
    r.pplMin = ppl;
    r.pplMax = ppl;
    r.vtAccum = 0;
  }
  r.prevPhase = r.phase;

  // Intrinsic PEEP: alveolar pressure still above the set PEEP when the next
  // breath is about to be delivered.
  if (r.phase === 'exp' && r.tCycle > period * 0.95) {
    r.lastAutoPeep = Math.max(0, palvNew - p.peep);
  }

  return r;
}
