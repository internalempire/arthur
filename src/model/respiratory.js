// Respiratory mechanics, split into the two series elements the Campbell diagram
// draws separately: the lung and the chest wall. Volumes are litres above the
// relaxation volume; pressures cmH2O.
//
//   Ppl  = PPL_FRC + V / Ccw - Pmus        chest wall, linear
//   Pl   = transpulmonaryAt(V_absolute)    lung, sigmoid — see lung.js
//   Palv = Ppl + Pl
//   flow = (Pao - Palv) / Raw
//
// Pleural pressure therefore follows the chest wall compliance curve while
// alveolar pressure follows the sum of both — the distinction that makes airway
// pressure a poor proxy for the pressure the heart actually feels.
//
// The lung element is no longer a constant compliance. Once recruitment is part
// of the model the pressure–volume relationship has to be sigmoid, because units
// that open accept gas, and the resting volume itself becomes an outcome rather
// than a setting: `relaxationVolume(p)` is where the lung's recoil balances the
// chest wall, and it rises when pressure opens more units. That is the point of
// doing it this way, and it is why `frc` is now a description of how much lung
// is shut rather than a volume the model is told to sit at.

import { clamp } from './units.js';
import {
  transpulmonaryAt, transpulmonaryAtFixed, relaxationVolume, lungComplianceAt,
  stepOpenFraction, openBand, RECOIL_AT_FRC,
} from './lung.js';

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
    relaxVolume: 0,
    plSolved: null,
    // Null until the first step decides which branch this lung starts on.
    openFraction: null,
    pplatCandidate: 0,
    pplMin: Infinity,
    pplMax: -Infinity,
    vtAccum: 0,
    ppeakAccum: -Infinity,
  };
}

/**
 * The two elements in series, at the volume the patient is currently at.
 *
 * State-dependent now, because the lung element is. Passing the volume is not
 * optional bookkeeping: at the same settings a recruitable lung is a different
 * spring at PEEP 5 and at PEEP 15, and that difference is most of what a
 * recruitment manoeuvre is for.
 */
export function respiratorySystemCompliance(p, lungVolume = null) {
  const v = lungVolume ?? relaxationVolume(p);
  const clungLocal = lungComplianceAt(p, v);
  return 1 / (1 / clungLocal + 1 / p.ccw);
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
  const ccw = p.ccw / 1000;
  // The reference the chest wall is measured from: where this lung would rest if
  // it were on its equilibrium branch. Deliberately not the volume the lung is
  // actually resting at, which with hysteresis depends on what was done to it —
  // the chest wall knows how much gas is in the chest, not how it got there.
  const vRelax = relaxationVolume(p);
  const hysteretic = p.hysteresis === 'on';
  if (hysteretic && !(r.openFraction > 0)) {
    // A lung that has never been inflated sits on the opening branch.
    r.openFraction = openBand(p, RECOIL_AT_FRC).lo;
  }

  // Alveolar pressure at a given volume above that reference: the chest wall's
  // linear element plus the lung's sigmoid one. One function, used for the flow
  // calculation and for the pressures reported afterwards, so they cannot drift
  // apart.
  //
  // With hysteresis the open fraction is frozen for the step — it is a state the
  // step then updates — which makes the lung a straight line within the step and
  // the inverse a closed form. Without it, the fraction follows the pressure and
  // the inverse is a solve, warm-started from the last answer.
  const alveolar = (v, pmus) => {
    r.plSolved = hysteretic
      ? transpulmonaryAtFixed(p, vRelax + v, r.openFraction)
      : transpulmonaryAt(p, vRelax + v, r.plSolved);
    return (PPL_FRC + v / ccw - pmus) + r.plSolved;
  };

  r.tCycle += dt;
  r.tPhase += dt;

  r.pmus = musclePressure(p, r.tCycle, period);

  // --- occlusion manoeuvres ------------------------------------------------
  // A hold freezes the airway: no flow, so alveolar pressure equilibrates with
  // the airway and the circulation settles at a fixed lung volume and pleural
  // pressure. That steady state is the point of the manoeuvre.
  if (r.hold) {
    r.flow = 0;
    const palvHeld = alveolar(r.v, r.pmus);
    r.palv = palvHeld;
    r.ppl = PPL_FRC + r.v / ccw - r.pmus;
    // With no flow the airway reads alveolar pressure — that is what a hold is
    // for, and it is why a plateau is measured this way.
    r.paw = palvHeld;
    r.pl = palvHeld - r.ppl;
    r.lungVolume = vRelax + r.v;
    r.relaxVolume = vRelax;
    r.pab = p.pab0 + p.abdCoupling * r.v;
    if (hysteretic) r.openFraction = stepOpenFraction(p, r.openFraction, r.pl);
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
  const palv = alveolar(r.v, r.pmus);
  const pao = airwayOpeningPressure(p, r, period);

  if (p.mode === 'vcv' && r.phase === 'insp') {
    // Constant inspiratory flow; airway pressure is whatever it takes.
    r.flow = p.vt / 1000 / p.ti;
  } else {
    const target = pao === null ? p.peep : pao;
    r.flow = (target - palv) / p.raw;
  }

  // The floor is the emptiest the lung can get, not the relaxation volume:
  // expiration below the resting point is what a Campbell diagram's lower half
  // is about, and with a sigmoid lung the model no longer needs to be protected
  // from it.
  r.v = Math.max(-vRelax * 0.9, r.v + r.flow * dt);
  if (r.flow > 0) r.vtAccum += r.flow * dt;

  // --- derived pressures ---------------------------------------------------
  const palvNew = alveolar(r.v, r.pmus);
  const ppl = PPL_FRC + r.v / ccw - r.pmus;
  const paw = p.mode === 'vcv' && r.phase === 'insp'
    ? palvNew + r.flow * p.raw
    : (pao === null ? p.peep : pao);

  r.palv = palvNew;
  r.ppl = ppl;
  r.paw = paw;
  r.pl = palvNew - ppl; // transpulmonary pressure
  r.lungVolume = vRelax + r.v; // absolute, L
  r.relaxVolume = vRelax;
  r.pab = p.pab0 + p.abdCoupling * r.v;
  // The state the next step will read. Updated after the pressures rather than
  // before them, so what is reported and what the flow was computed from are the
  // same lung.
  if (hysteretic) r.openFraction = stepOpenFraction(p, r.openFraction, r.pl);

  // --- per-breath bookkeeping ----------------------------------------------
  r.pplMin = Math.min(r.pplMin, ppl);
  r.pplMax = Math.max(r.pplMax, ppl);
  r.ppeakAccum = Math.max(r.ppeakAccum, paw);
  // Static recoil pressure at end-inspiration, i.e. the plateau the ventilator
  // would show after an inspiratory hold. Read from the same relation as
  // everything else rather than from a compliance that no longer exists as a
  // single number.
  if (r.phase === 'insp') r.pplatCandidate = alveolar(r.v, 0);

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
