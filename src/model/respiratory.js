// Respiratory mechanics, split into the two series elements the Campbell diagram
// draws separately: the lung and the chest wall. State volume remains litres
// above passive equilibrium for legible waveforms, but both elastic elements are
// evaluated from the same absolute thoracic volume; pressures are cmH2O.
//
//   Ppl  = Pcw(V_absolute) - Pmus           chest wall, independent sigmoid
//   Pl   = transpulmonaryAt(V_absolute)    lung, sigmoid — see lung.js
//   Palv = Ppl + Pl
//   flow = (Pao - Palv) / Raw
//
// In a passive subject pleural pressure follows the chest-wall curve. Active
// inspiratory pressure displaces it to the left, including briefly after neural
// inspiration while post-inspiratory activity brakes early expiration. Alveolar
// pressure follows the sum of both elastic elements — the distinction that makes
// airway pressure a poor proxy for the pressure the heart actually feels.
//
// The lung element is no longer a constant compliance. Once recruitment is part
// of the model the pressure–volume relationship has to be sigmoid, because units
// that open accept gas. The chest wall now has its own sigmoid relaxation curve;
// `relaxationVolume(p)` is the intersection of the two independent elements, not
// the lung volume selected by a fixed 5 cmH2O recoil.

import { clamp } from './units.js';
import {
  transpulmonaryAt, transpulmonaryAtRecruitmentState, relaxationVolume, lungComplianceAt,
  stepRecruitedFraction, recruitmentBand, openFractionFromRecruitmentState,
  hysteresisGap, staticEndExpiratoryVolume, staticEndExpiratoryVolumeAtRecruitmentState,
  chestWallPressure, chestWallComplianceAt, CHEST_WALL_REFERENCE_PRESSURE,
} from './lung.js';

// Compatibility name for drawings and text that refer to the normal reference.
// It is no longer imposed at every phenotype's passive equilibrium.
export const PPL_FRC = CHEST_WALL_REFERENCE_PRESSURE;

// A flow-limited airway behaves like a Starling resistor: once the passive
// expiratory flow reaches the choke point, a larger alveolar-to-mouth gradient
// cannot empty the lung faster. We express the cap as a minimum emptying time
// constant, so maximal flow still rises with lung volume instead of becoming an
// arbitrary fixed L/s. The 4.5 s envelope is a didactic severe-obstruction anchor,
// not a universal COPD constant; `raw` continues to carry ordinary resistance.
export const EXPIRATORY_FLOW_LIMIT = {
  minimumTimeConstant: 4.5, // s
};

// Pressure support is patient-triggered rather than neurally commanded. A
// conventional pneumatic ventilator cannot see the model's neural state: the
// patient must first lower alveolar pressure enough to reverse expiratory flow
// and create a small inspiratory signal at the airway. The fixed threshold and
// rise time keep that bedside sequence visible without turning ventilator
// engineering into another group of controls. Flow cycling remains independent
// of neural inspiratory time, so a short respiratory time constant can still
// produce genuine early cycling instead of having synchrony scripted into it.
export const PRESSURE_SUPPORT = Object.freeze({
  triggerFlow: 1 / 60, // L/s (1 L/min)
  riseTime: 0.10, // s from PEEP to the selected pressure support
  cycleFraction: 0.25, // fraction of peak inspiratory flow
  earlyCycleDriveThreshold: 0.05, // dimensionless neural drive
});

// Effective pressure-generating activity is not identical to the neural switch.
// Conscious adults retain inspiratory muscle pressure into expiration: Shee et
// al. measured a mean half-decay at about 23% of expiratory time and near-complete
// release late in expiration. One activation state captures that behaviour
// without adding a separate muscle compartment or drawing a Campbell-loop limb
// by hand. Scaling relaxation to expiratory time also preserves the observed
// relation between decay rate and breathing pattern.
export const POST_INSPIRATORY_ACTIVITY = Object.freeze({
  activationTimeConstant: 0.06, // s; fast pressure recruitment during inspiration
  relaxationTimeFraction: 0.30, // exponential tau as a fraction of expiratory time
  silentFraction: 0.005,        // avoid carrying a numerically irrelevant tail
});

export function createRespiratoryState() {
  return {
    v: 0, // L above relaxation volume
    flow: 0, // L/s, positive = inspiratory
    phase: 'exp',
    tCycle: 0,
    tPhase: 0,
    pmus: 0,
    neuralDrive: 0,
    inspiratoryActivation: 0,
    prevPhase: 'exp',
    canTrigger: true,
    supportPressure: 0,
    lastPsvTriggerDelay: null,
    lastPsvTriggerFlow: null,
    lastPsvCycleStatus: null,
    lastPsvCycleDrive: null,
    lastPsvCycleTime: null,
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
    // Latched at the transition into inspiration. Dynamic hyperinflation is the
    // end-expiratory volume above the passive equilibrium at the same applied
    // PEEP — not total FRC and not the tidal volume still being delivered.
    lastEndExpiratoryVolume: 0,
    lastTrappedVolume: 0,
    eflLimitedThisBreath: false,
    lastEflActive: false,
    relaxVolume: 0,
    plSolved: null,
    atCapacity: false,
    hitCapacity: false,
    siSamples: [],
    siClock: 0,
    lastStressIndex: null,
    // Total open fraction is retained for circulation and display. The actual
    // hysteretic state is only the share of whole lung made of recruited,
    // diseased units; already-aerated lung continues to follow present pressure.
    openFraction: null,
    recruitedFraction: null,
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
  const ccwLocal = chestWallComplianceAt(p, v);
  return 1 / (1 / clungLocal + 1 / ccwLocal);
}

// How long the inspiratory muscles are active. Capped at half the respiratory
// cycle so effort never runs into the next breath.
function neuralInspiratoryTime(p, period) {
  return Math.min(p.ti, period * 0.5);
}

// Inspiratory neural drive rises smoothly until the neural switch-off. The
// pressure-generating state below follows it quickly on the way up and relaxes
// more slowly on the way down. This separation is what lets post-inspiratory
// braking emerge without confusing it with active expiratory-muscle pressure.
function neuralInspiratoryDrive(p, tCycle, period) {
  if (p.pmus <= 0) return 0;
  const tNeural = neuralInspiratoryTime(p, period);
  if (tCycle >= tNeural) return 0;
  return Math.sin((Math.PI * 0.5 * tCycle) / tNeural) ** 1.2;
}

function stepInspiratoryActivation(p, r, dt, period) {
  if (p.pmus <= 0) {
    r.neuralDrive = 0;
    r.inspiratoryActivation = 0;
    return 0;
  }

  const drive = neuralInspiratoryDrive(p, r.tCycle, period);
  const tNeural = neuralInspiratoryTime(p, period);
  const expiratoryTime = Math.max(0.2, period - tNeural);
  const tau = drive > r.inspiratoryActivation
    ? POST_INSPIRATORY_ACTIVITY.activationTimeConstant
    : POST_INSPIRATORY_ACTIVITY.relaxationTimeFraction * expiratoryTime;

  // Exact integration of a first-order activation step keeps the result stable
  // when the numerical timestep is halved in convergence tests.
  const weight = 1 - Math.exp(-dt / tau);
  r.inspiratoryActivation += (drive - r.inspiratoryActivation) * weight;
  r.inspiratoryActivation = clamp(r.inspiratoryActivation, 0, 1);
  if (drive === 0
    && r.inspiratoryActivation < POST_INSPIRATORY_ACTIVITY.silentFraction) {
    r.inspiratoryActivation = 0;
  }
  r.neuralDrive = drive;
  return p.pmus * r.inspiratoryActivation;
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
      return p.peep + (r.phase === 'insp' ? r.supportPressure : 0);
    default:
      return p.peep;
  }
}

/**
 * The stress index: fit Paw = a*t^b + c over the constant-flow part of a breath
 * and report b.
 *
 * Above 1 the airway pressure curls upward and the lung is running out of room —
 * tidal overdistension. Below 1 it curls the other way, because units are still
 * opening as the breath goes in and each one that opens takes pressure off the
 * rest — tidal recruitment, and a sign the PEEP underneath is too low. It only
 * means anything during constant flow in a passive patient, which is why it is
 * withheld rather than estimated otherwise.
 *
 * `b` is found by a grid search with a least-squares fit of a and c at each
 * candidate. Forty samples and a hundred candidates, once per breath, is a few
 * thousand operations — beneath noticing next to the four thousand integration
 * steps the same second costs.
 */
function fitStressIndex(samples) {
  if (samples.length < 12) return null;
  // The first tenth is dropped, as the bedside method does: flow is still
  // building there and the pressure step at its onset is resistive, not elastic.
  const from = Math.floor(samples.length * 0.1);
  const t = [], y = [];
  for (let i = from; i < samples.length; i += 2) { t.push(samples[i]); y.push(samples[i + 1]); }
  if (t.length < 6) return null;

  let bestB = 1, bestErr = Infinity;
  for (let k = 0; k <= 100; k++) {
    const b = 0.4 + (k * 1.8) / 100;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    const n = t.length;
    for (let i = 0; i < n; i++) {
      const x = t[i] ** b;
      sx += x; sy += y[i]; sxx += x * x; sxy += x * y[i];
    }
    const det = n * sxx - sx * sx;
    if (Math.abs(det) < 1e-12) continue;
    const a = (n * sxy - sx * sy) / det;
    const c = (sy - a * sx) / n;
    let err = 0;
    for (let i = 0; i < n; i++) { const e = a * (t[i] ** b) + c - y[i]; err += e * e; }
    if (err < bestErr) { bestErr = err; bestB = b; }
  }
  return bestB;
}

export function stepRespiratory(p, r, dt) {
  const period = 60 / p.rr;
  // The passive equilibrium is expensive enough to solve once per public
  // `advance`, not four thousand times per simulated second. Direct callers can
  // still omit the cached internal value and receive the same calculation.
  const vRelax = p._relaxVolume ?? relaxationVolume(p);
  // With no opening/closing gap there is no memory to integrate. Solving the
  // equilibrium curve directly is not just cheaper but necessary: treating an
  // algebraic curve as a lagged state creates a spurious collapse feedback when
  // the recruitment transition is steep. Thus pClose === pOpen is exactly the
  // same model as hysteresis off, as the control promises.
  const hysteretic = p.hysteresis === 'on' && hysteresisGap(p) > 1e-9;
  if (hysteretic && !(r.recruitedFraction >= 0)) {
    // A lung that has never been inflated starts on the opening branch. This
    // state is an absolute fraction of the whole lung, not a second user input.
    const plRelax = transpulmonaryAt(p, vRelax);
    r.recruitedFraction = recruitmentBand(p, plRelax).lo;
  } else if (!hysteretic) {
    // Do not resurrect stale recruitment if hysteresis is switched off and on.
    r.recruitedFraction = null;
  }

  // Alveolar pressure at a given volume above passive equilibrium: independent
  // chest-wall and lung recoil evaluated at the same absolute volume. One
  // function is used for flow and reported pressure so they cannot drift apart.
  //
  // With hysteresis only the recruitable diseased share is frozen for the step.
  // Normal lung still follows present pressure, so both branches require a
  // warm-started inverse solve. Freezing the total open fraction here was the
  // structural error that gave normal lung an ARDS-like memory.
  const alveolar = (v, pmus) => {
    const absoluteVolume = vRelax + v;
    r.plSolved = hysteretic
      ? transpulmonaryAtRecruitmentState(p, absoluteVolume, r.recruitedFraction, r.plSolved)
      : transpulmonaryAt(p, absoluteVolume, r.plSolved);
    r.openFraction = hysteretic
      ? openFractionFromRecruitmentState(p, r.plSolved, r.recruitedFraction)
      : null;
    return chestWallPressure(p, absoluteVolume) - pmus + r.plSolved;
  };

  r.tCycle += dt;
  r.tPhase += dt;

  r.pmus = stepInspiratoryActivation(p, r, dt, period);

  // --- occlusion manoeuvres ------------------------------------------------
  // A hold freezes the airway: no flow, so alveolar pressure equilibrates with
  // the airway and the circulation settles at a fixed lung volume and pleural
  // pressure. That steady state is the point of the manoeuvre.
  if (r.hold) {
    r.flow = 0;
    const palvHeld = alveolar(r.v, r.pmus);
    r.palv = palvHeld;
    r.ppl = chestWallPressure(p, vRelax + r.v) - r.pmus;
    // With no flow the airway reads alveolar pressure — that is what a hold is
    // for, and it is why a plateau is measured this way.
    r.paw = palvHeld;
    r.pl = palvHeld - r.ppl;
    r.lungVolume = vRelax + r.v;
    r.relaxVolume = vRelax;
    r.pab = p.pab0 + p.abdCoupling * r.v;
    if (hysteretic) {
      r.recruitedFraction = stepRecruitedFraction(p, r.recruitedFraction, r.pl);
      r.openFraction = openFractionFromRecruitmentState(p, r.pl, r.recruitedFraction);
    }
    r.prevPhase = r.phase;
    return r;
  }

  // --- phase machine -------------------------------------------------------
  if (p.mode === 'psv') {
    // Patient-triggered, flow-cycled. Before support begins, the patient sees
    // only PEEP. The pressure gradient below is therefore the inspiratory flow
    // the effort would generate at the airway opening. Intrinsic PEEP delays it
    // automatically because Palv must first fall below applied PEEP; an effort
    // that never reaches the trigger flow remains ineffective.
    const palvBeforeAssist = alveolar(r.v, r.pmus);
    const patientTriggerFlow = (p.peep - palvBeforeAssist) / p.raw;

    // The ventilator will not trigger again until effort has fallen away and a
    // fresh one begins, so cycling off during an effort cannot immediately
    // retrigger the same breath.
    if (r.neuralDrive < 0.02
      && r.inspiratoryActivation < 0.05
      && r.flow <= 0) r.canTrigger = true;
    if (r.phase === 'exp' && r.canTrigger
      && patientTriggerFlow >= PRESSURE_SUPPORT.triggerFlow) {
      r.phase = 'insp';
      r.tPhase = 0;
      r.peakInspFlow = 0;
      r.canTrigger = false;
      r.supportPressure = 0;
      r.lastPsvTriggerDelay = r.tCycle;
      r.lastPsvTriggerFlow = patientTriggerFlow;
    } else if (r.phase === 'insp') {
      r.peakInspFlow = Math.max(r.peakInspFlow, r.flow);
      if (r.flow < PRESSURE_SUPPORT.cycleFraction * r.peakInspFlow
        && r.tPhase > 0.2) {
        r.lastPsvCycleStatus = r.neuralDrive > PRESSURE_SUPPORT.earlyCycleDriveThreshold
          ? 'early'
          : 'not-early';
        r.lastPsvCycleDrive = r.neuralDrive;
        r.lastPsvCycleTime = r.tCycle;
        r.phase = 'exp';
        r.tPhase = 0;
        r.supportPressure = 0;
      }
    }
  } else if (p.mode === 'spont') {
    r.supportPressure = 0;
    // Neural inspiration starts the breath, but mechanical inspiration ends
    // only when flow reverses. Post-inspiratory activation can therefore brake
    // expiration without making a still-inward flow count as expiration.
    if (r.phase === 'exp' && r.neuralDrive > 0 && r.flow > 0) {
      r.phase = 'insp';
      r.tPhase = 0;
    } else if (r.phase === 'insp'
      && r.neuralDrive === 0 && r.flow <= 0) {
      r.phase = 'exp';
      r.tPhase = 0;
    }
  } else {
    r.supportPressure = 0;
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

  // A real pressure-support breath takes finite time to pressurise. A linear
  // 100 ms rise is intentionally simpler than a ventilator-specific servo, but
  // it prevents an airway-pressure step from expanding the chest wall before
  // the patient-generated trigger is visible. PCV retains its ideal pressure
  // boundary because this timing contract is specific to assisted breaths.
  if (p.mode === 'psv' && r.phase === 'insp') {
    r.supportPressure = Math.min(
      p.pinsp,
      r.supportPressure + (p.pinsp * dt) / PRESSURE_SUPPORT.riseTime,
    );
  }

  // An armed hold engages at the phase it is named after.
  if (r.holdPending === 'expiratory' && r.prevPhase === 'exp' && r.tCycle > period * 0.9) {
    r.hold = 'expiratory';
    r.holdPending = null;
  } else if (r.holdPending === 'inspiratory' && r.prevPhase === 'insp' && r.phase === 'exp') {
    r.hold = 'inspiratory';
    r.holdPending = null;
  }

  // Capture end-expiratory volume before the first inspiratory integration
  // step adds gas. Comparing it with the static equilibrium at the same applied
  // PEEP keeps loss-of-recoil hyperinflation separate from dynamically trapped
  // volume. With hysteresis on, use the branch the lung is actually occupying.
  if (r.prevPhase === 'exp' && r.phase === 'insp') {
    r.lastEndExpiratoryVolume = vRelax + r.v;
    const staticEelv = hysteretic
      ? staticEndExpiratoryVolumeAtRecruitmentState(p, p.peep, r.recruitedFraction)
      : staticEndExpiratoryVolume(p, p.peep);
    r.lastTrappedVolume = Math.max(0, (r.lastEndExpiratoryVolume - staticEelv) * 1000);
    r.lastEflActive = r.eflLimitedThisBreath;
    r.eflLimitedThisBreath = false;
  }

  // --- flow ----------------------------------------------------------------
  const palv = alveolar(r.v, r.pmus);
  const pao = airwayOpeningPressure(p, r, period);

  if (p.mode === 'vcv' && r.phase === 'insp') {
    // Constant inspiratory flow; airway pressure is whatever it takes.
    r.flow = p.vt / 1000 / p.ti;
  } else {
    const target = pao === null ? p.peep : pao;
    const passiveFlow = (target - palv) / p.raw;
    if (r.phase === 'exp' && p.efl === 'on' && passiveFlow < 0) {
      // `r.v` is gas above the zero-PEEP relaxation volume. Its ratio to the
      // minimum emptying time is the maximal outward flow. Below the choke
      // point downstream pressure no longer accelerates expiration; once PEEP
      // is high enough that passive flow falls below the cap, it acts as true
      // back-pressure again. This is the airway analogue of the vascular
      // waterfall already used in the venous-return model.
      const maxOutwardFlow = Math.max(0, r.v) / EXPIRATORY_FLOW_LIMIT.minimumTimeConstant;
      r.flow = Math.max(passiveFlow, -maxOutwardFlow);
      if (r.flow > passiveFlow + 1e-12) r.eflLimitedThisBreath = true;
    } else {
      r.flow = passiveFlow;
    }
  }

  // The floor is the emptiest the lung can get, not the relaxation volume:
  // expiration below the resting point is what a Campbell diagram's lower half
  // is about, and with a sigmoid lung the model no longer needs to be protected
  // from it.
  r.v = Math.max(-vRelax * 0.9, r.v + r.flow * dt);
  if (r.flow > 0) r.vtAccum += r.flow * dt;

  // Airway pressure through the constant-flow part of the breath, for the stress
  // index. Sampled sparsely — the shape is what matters, not the resolution —
  // and only where the index means something.
  const flowIsSet = p.mode === 'vcv' && r.phase === 'insp' && p.pmus === 0;
  if (flowIsSet) {
    r.siClock += dt;
    if (r.siClock >= 0.03) {
      r.siClock = 0;
      r.siSamples.push(r.tPhase, r.paw ?? 0);
      if (r.siSamples.length > 200) r.siSamples.splice(0, 2);
    }
  }

  // --- derived pressures ---------------------------------------------------
  const palvNew = alveolar(r.v, r.pmus);
  const ppl = chestWallPressure(p, vRelax + r.v) - r.pmus;
  const paw = p.mode === 'vcv' && r.phase === 'insp'
    ? palvNew + r.flow * p.raw
    : (pao === null ? p.peep : pao);

  r.palv = palvNew;
  r.ppl = ppl;
  r.paw = paw;
  r.pl = palvNew - ppl; // transpulmonary pressure
  r.lungVolume = vRelax + r.v; // absolute, L
  r.relaxVolume = vRelax;
  // The tissue has a ceiling now, so a tidal volume can be asked for that the
  // lung cannot physically hold. The pressure is clamped to keep the integrator
  // finite, which means the number on the screen would be fiction — so the state
  // says so instead of quietly showing it.
  // Latched for the breath: reaching the ceiling happens at end-inspiration and
  // is gone a moment later, so a metric sampled at the end of an advance would
  // miss it entirely and report a fabricated pressure as a result.
  if (r.plSolved >= 79.5) r.hitCapacity = true;
  r.pab = p.pab0 + p.abdCoupling * r.v;
  // The state the next step will read. Updated after the pressures rather than
  // before them, so what is reported and what the flow was computed from are the
  // same lung.
  if (hysteretic) {
    r.recruitedFraction = stepRecruitedFraction(p, r.recruitedFraction, r.pl);
    r.openFraction = openFractionFromRecruitmentState(p, r.pl, r.recruitedFraction);
  }

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
    r.atCapacity = r.hitCapacity;
    r.hitCapacity = false;
    r.lastStressIndex = fitStressIndex(r.siSamples);
    r.siSamples = [];
    r.siClock = 0;
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
