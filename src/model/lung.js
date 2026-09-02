// The lung as two populations of units rather than one compartment.
//
// A single-compartment lung has one number for how inflated it is, and every
// consequence has to be a function of that number. That is enough for most of
// this simulator, but it makes one class of question unanswerable: anything
// where the answer depends on units *opening* while their neighbours *stretch*.
//
// The clearest example is what raising PEEP does to pulmonary vascular
// resistance. Cappio Borlino et al. (AJRCCM 2024;210(7)) found it rises in a
// poorly recruitable lung and does not move in a highly recruitable one. In a
// one-compartment model those two patients are the same lung at different
// resting volumes, so the same PEEP change gives them identical volume gain and
// identical transpulmonary pressure — nothing is left to tell them apart, and no
// formulation of the resistance curve can separate them.
//
// So the units are split into two populations by how hard they are to open:
// normal units, which close on deflation and reopen at low pressure, and
// diseased units, which are shut at rest and reopen only if they are
// recruitable at all. Consolidated lung is collapsed and stays collapsed however
// hard it is pushed. The user describes recruitability with the bedside R/I
// ratio; the fraction of diseased units that can open is an internal consequence
// of that measurement, not a second user-facing definition of the same concept.
//
// Units are treated as either open at full size or shut — the sponge
// idealisation. It is why the arithmetic below works, and it is also the reason
// the model says a deflated lung stretches its remaining open units: with half
// the units shut, the gas that is left has nowhere else to go.
//
// Recruitment changes the mechanics too, and that is where most of its clinical
// weight sits. Units that open accept gas, so the lung's compliance follows how
// many of them are open, and the resting volume rises when pressure opens more.
// The pressure–volume relationship is therefore sigmoid rather than linear, and
// it is sigmoid because of the unit population rather than because a sigmoid was
// fitted to it.
//
// `clung` and lung size are deliberately independent. `clung` is the local
// compliance of aerated tissue while it is away from its upper-volume limit;
// `lungCapacity` is that limit for a completely open lung. The open fraction
// decides how much of the capacity is currently available. This separation is
// essential: reducing compliance and closing units are different lesions and
// must not both shrink the same baby lung.

import { clamp } from './units.js';

// The resting volume of a normal, fully open lung, with normal compliance.
// Collapse is measured against this rather than against the patient's own
// resting volume — a patient sitting at 1.35 L is not a small normal lung, they
// are a normal lung with a third of it shut.
//
// Note what is no longer a parameter: resting volume itself. It is an outcome of
// how much lung is open and how compliant it is, which is what makes recruitment
// able to raise it. A lung that has lost recoil rests high, a lung that has
// collapsed rests low, and neither is set by hand.
export const NORMAL_FRC = 2.2; // L

// Normal units close as the lung empties and reopen almost as soon as there is
// any distending pressure, so their threshold sits near zero transpulmonary
// pressure with a narrow spread.
const PL_EASY = 0;
const SPREAD_EASY = 1.3; // cmH2O

// Diseased units open along a distribution, rather than at one threshold. This
// width is a didactic shape coefficient, not a claimed anatomical measurement.
// It is deliberately narrower than the former 2 cmH2O construction. With that
// width, a shared ARDS phenotype could reproduce the observed R/I and recruited
// volumes of the Cappio Borlino groups only by making high-PEEP local lung
// compliance exceed the cohort IQR. A 0.75 cmH2O transition keeps both groups'
// recruited volume and low/high-PEEP compliance inside their reported IQRs
// without changing collapse, tissue compliance or opening pressure between
// them. This is a cohort-constrained aggregate distribution, not an anatomical
// alveolar threshold variance.
export const DISEASED_RECRUITMENT_WIDTH = 0.75; // cmH2O
const SPREAD_HARD = DISEASED_RECRUITMENT_WIDTH;

// The reference manoeuvre used by Chen et al. and by the human PVR calibration:
// R/I is protocol-dependent, so these pressures belong in the definition and
// must not be hidden in a test fixture.
export const RI_LOW_PEEP = 5;
export const RI_HIGH_PEEP = 15;

const logistic = (x) => 1 / (1 + Math.exp(-x));

/**
 * Fraction of the diseased compartment that is capable of reopening.
 *
 * Resolved simulator parameters carry this value explicitly. Direct callers of
 * the lung helpers (tests, diagrams and small analyses) may pass only `riRatio`;
 * in that case the same calibration is performed lazily. Keeping this internal
 * avoids presenting a fraction of units and a bedside R/I as interchangeable
 * patient inputs — they are not.
 */
function openableDiseasedFraction(p) {
  if (Number.isFinite(p.openableDiseasedFraction)) {
    return clamp(p.openableDiseasedFraction, 0, 1);
  }
  return calibrateRecruitmentToInflation(p).openableFraction;
}

// Transpulmonary pressure at the relaxation volume: the recoil that holds the
// normal lung open at the reference operating point. It calibrates the lung
// curve only; the actual passive equilibrium is now solved against an
// independent chest-wall curve below.
export const RECOIL_AT_FRC = 5; // cmH2O

// ---------------------------------------------------------------- chest wall
//
// The chest wall is an independent elastic element. Earlier versions silently
// moved its zero-pressure relation whenever lung compliance, capacity or open
// fraction changed: every lung phenotype was assigned Ppl = -5 cmH2O at the
// volume that happened to correspond to Pl = +5. That preserved the normal
// calibration but made a diseased lung drag an otherwise unchanged rib cage to
// a new reference volume.
//
// Human relaxation curves are approximately linear around tidal breathing and
// stiffen toward both volume extremes. A Boltzmann volume-pressure relation has
// that shape and an analytic inverse, used here as Pcw(V). The broad asymptotes
// are numerical shape anchors outside ordinary breathing, not anatomical RV or
// TLC. The curve is calibrated so the default wall has Pcw = -5 cmH2O and the
// selected local compliance at the normal 2.2 L operating point.
export const CHEST_WALL_REFERENCE_PRESSURE = -5; // cmH2O at NORMAL_FRC before load
// The lower mathematical asymptote lies outside the physical volume range. That
// keeps the wall close to linear across low-volume ICU breathing while the
// upper asymptote still supplies the measured stiffening toward maximal
// expansion. Neither asymptote is an anatomical RV or TLC.
export const CHEST_WALL_MIN_VOLUME = -5; // L, lower Boltzmann shape anchor
export const CHEST_WALL_MAX_VOLUME = 10; // L, broad upper shape anchor

const CW_RANGE = CHEST_WALL_MAX_VOLUME - CHEST_WALL_MIN_VOLUME;
const CW_Q_REFERENCE = (NORMAL_FRC - CHEST_WALL_MIN_VOLUME) / CW_RANGE;
const logit = (x) => Math.log(x / (1 - x));
const invLogit = (x) => 1 / (1 + Math.exp(-x));
const cwFraction = (volume) => clamp(
  (volume - CHEST_WALL_MIN_VOLUME) / CW_RANGE,
  1e-6,
  1 - 1e-6,
);

const chestWallScale = (p) => {
  const compliance = Math.max(1e-6, (p.ccw ?? 200) / 1000); // L/cmH2O
  // For V = NORMAL_FRC, dV/dP is exactly the selected `ccw`.
  return (CW_RANGE * CW_Q_REFERENCE * (1 - CW_Q_REFERENCE)) / compliance;
};

/** Relaxed chest-wall recoil pressure at an absolute thoracic volume. */
export function chestWallPressure(p, volume) {
  const q = cwFraction(volume);
  return CHEST_WALL_REFERENCE_PRESSURE + Number(p.cwLoad ?? 0)
    + chestWallScale(p) * (logit(q) - logit(CW_Q_REFERENCE));
}

/** Local chest-wall compliance, rather than one slope imposed at all volumes. */
export function chestWallComplianceAt(p, volume) {
  const q = cwFraction(volume);
  return (CW_RANGE * q * (1 - q) / chestWallScale(p)) * 1000; // mL/cmH2O
}

/** Absolute volume at which the relaxed chest wall has zero recoil. */
export function chestWallNeutralVolume(p) {
  const targetLogit = logit(CW_Q_REFERENCE)
    - (CHEST_WALL_REFERENCE_PRESSURE + Number(p.cwLoad ?? 0)) / chestWallScale(p);
  return CHEST_WALL_MIN_VOLUME + CW_RANGE * invLogit(targetLogit);
}

/** The already-aerated share follows present pressure and carries no memory. */
export function normalOpenFractionAt(p, pl) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  return (1 - diseased) * logistic((pl - PL_EASY) / SPREAD_EASY);
}

/**
 * Share of the whole lung represented by open, recruitable diseased units.
 *
 * `shift` applies only to this compartment. It moves the centre of its
 * threshold distribution from `pOpen` to `pClose` on the closing branch. The
 * normal compartment must not inherit an ARDS recruitment threshold.
 */
export function recruitableOpenFractionAt(p, pl, shift = 0) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  return diseased * openableDiseasedFraction(p)
    * logistic((pl - ((p.pOpen ?? 20) - shift)) / SPREAD_HARD);
}

/** Total open lung for a known state of the recruitable diseased compartment. */
export function openFractionFromRecruitmentState(p, pl, recruitedFraction) {
  return clamp(normalOpenFractionAt(p, pl) + Math.max(0, recruitedFraction), 0.05, 1);
}

/** How much of the lung is open at a pressure when no history is retained. */
export function openFractionAt(p, pl, shift = 0) {
  return openFractionFromRecruitmentState(p, pl, recruitableOpenFractionAt(p, pl, shift));
}

/** How far below the opening pressure units hang on before they shut again. */
export function hysteresisGap(p) {
  if (p.hysteresis !== 'on') return 0;
  return Math.max(0, (p.pOpen ?? 20) - (p.pClose ?? 12));
}

/**
 * The band of open fractions this pressure is consistent with.
 *
 * Below `lo` the lung is being pushed open; above `hi` it is being let shut.
 * Between them nothing moves, and that gap is the hysteresis: the same
 * transpulmonary pressure leaves a lung that has just been inflated more open
 * than one that has just been deflated to it.
 */
export function openBand(p, pl) {
  const normalOpen = normalOpenFractionAt(p, pl);
  const { lo, hi } = recruitmentBand(p, pl);
  return {
    lo: clamp(normalOpen + lo, 0.05, 1),
    hi: clamp(normalOpen + hi, 0.05, 1),
  };
}

/** Opening and closing limits for the recruitable diseased compartment only. */
export function recruitmentBand(p, pl) {
  const gap = hysteresisGap(p);
  return {
    lo: recruitableOpenFractionAt(p, pl, 0),
    hi: recruitableOpenFractionAt(p, pl, gap),
  };
}

/**
 * Advance the recruited diseased fraction, given where it currently is.
 *
 * A play operator: the state is dragged along by whichever edge of the band it
 * has run into, and sits still in between. Instantaneous rather than rate-based,
 * because in this model an alveolus opens within a breath and nothing here
 * resolves the milliseconds it takes.
 */
export function stepRecruitedFraction(p, recruitedFraction, pl) {
  const { lo, hi } = recruitmentBand(p, pl);
  if (!(recruitedFraction >= 0)) return lo;
  return Math.min(Math.max(recruitedFraction, lo), hi);
}

/**
 * Compatibility helper for diagrams that only carry total open fraction.
 *
 * The simulator does not use this function: a total fraction cannot preserve
 * the distinction between pressure-responsive normal lung and recruitment
 * memory. New stateful code should carry `recruitedFraction` and call
 * `stepRecruitedFraction` instead.
 */
export function stepOpenFraction(p, phi, pl) {
  const recruited = Math.max(0, phi - normalOpenFractionAt(p, pl));
  return openFractionFromRecruitmentState(p, pl, stepRecruitedFraction(p, recruited, pl));
}

// The open fraction of an undiseased lung at its resting recoil is a constant —
// the diseased population is zero, so only the easy limb contributes. Written as
// one rather than derived per call, because deriving it meant spreading the
// parameter object tens of thousands of times a simulated second and cost more
// than every other part of the lung model together.
const OPEN_AT_REST = 1 / (1 + Math.exp(-(RECOIL_AT_FRC - PL_EASY) / SPREAD_EASY));

// The tissue relation is a straight compliance line passed through a smooth
// upper-volume ceiling. This makes the meaning of both user controls literal:
// away from the ceiling dV/dP is `clung`; at very high pressure volume tends to
// `lungCapacity`, whatever `clung` is. A soft rather than hard minimum keeps the
// derivative continuous for the pressure inversions and stress-index fit.
export const DEFAULT_LUNG_CAPACITY = 6; // L, completely open lung
const NORMAL_COMPLIANCE = 0.2;          // L/cmH2O
const CAPACITY_SOFTNESS = 0.18;         // fraction of capacity over which the ceiling engages

const capacityOf = (p) => {
  const selected = Number(p.lungCapacity ?? DEFAULT_LUNG_CAPACITY);
  return Number.isFinite(selected) ? Math.max(0.5, selected) : DEFAULT_LUNG_CAPACITY;
};
const softnessOf = (capacity) => Math.max(1e-4, capacity * CAPACITY_SOFTNESS);

function softMinimum(linearVolume, capacity) {
  const width = softnessOf(capacity);
  const lo = Math.min(linearVolume, capacity);
  const hi = Math.max(linearVolume, capacity);
  return lo - width * Math.log1p(Math.exp(-(hi - lo) / width));
}

/** Linear volume whose soft-capped value is `volume`. */
function inverseSoftMinimum(volume, capacity) {
  const width = softnessOf(capacity);
  const gap = (capacity - volume) / width;
  if (gap > 50) return volume;
  if (gap <= 1e-9) return Infinity;
  return capacity - width * Math.log(Math.expm1(gap));
}

// Preserve the familiar default resting point without tying every phenotype's
// capacity to its compliance. The zero-pressure gas volume scales with the
// optional capacity control as an anatomical size term; the compliance then
// adds real volume per unit pressure on top of it.
const NORMAL_PER_UNIT_AT_REST = NORMAL_FRC / OPEN_AT_REST;
const DEFAULT_LINEAR_AT_REST = inverseSoftMinimum(
  NORMAL_PER_UNIT_AT_REST, DEFAULT_LUNG_CAPACITY,
);
const DEFAULT_UNSTRESSED_VOLUME = DEFAULT_LINEAR_AT_REST
  - NORMAL_COMPLIANCE * RECOIL_AT_FRC;
const UNSTRESSED_FRACTION = DEFAULT_UNSTRESSED_VOLUME / DEFAULT_LUNG_CAPACITY;

function perUnitVolume(p, pl) {
  const capacity = capacityOf(p);
  const v0 = capacity * UNSTRESSED_FRACTION;
  const linear = v0 + (p.clung / 1000) * pl;
  return Math.max(0, softMinimum(linear, capacity));
}

/** Inverse of the soft-capped compliance line, in closed form. */
function perUnitPressure(p, volume) {
  const capacity = capacityOf(p);
  const c = Math.max(1e-9, p.clung / 1000);
  const v0 = capacity * UNSTRESSED_FRACTION;
  const linear = inverseSoftMinimum(volume, capacity);
  if (!Number.isFinite(linear)) return 80;
  return (linear - v0) / c;
}

/**
 * Lung volume at a given transpulmonary pressure — the pressure–volume curve.
 *
 * Two factors, and the shape comes from their product. How many units are open
 * is a sigmoid in pressure; how much each open unit holds is locally linear and
 * then bends smoothly towards its independent capacity ceiling. A collapsed
 * but recruitable lung can therefore gain slope as units open before losing it
 * again as the aerated tissue approaches maximum volume.
 */
export function lungVolumeAtPl(p, pl, phi = null) {
  return (phi ?? openFractionAt(p, pl)) * perUnitVolume(p, pl);
}

/** Volume when recruitment memory is fixed but normal lung still follows pressure. */
export function lungVolumeAtRecruitmentState(p, pl, recruitedFraction) {
  return openFractionFromRecruitmentState(p, pl, recruitedFraction) * perUnitVolume(p, pl);
}

/**
 * Passive zero-airway-pressure equilibrium of the independent lung and wall.
 *
 * Passing a total open fraction is retained for static analyses. The dynamic
 * hysteresis path instead carries only recruited diseased lung and uses its own
 * equilibrium helper below, so normal lung remains pressure-responsive.
 */
export function relaxationVolume(p, phi = null) {
  return staticEndExpiratoryVolume(p, 0, phi);
}

/**
 * Transpulmonary pressure at a volume, with the open fraction held fixed.
 *
 * Closed form because, once the fraction is frozen, only the tissue curve must
 * be inverted and `perUnitPressure` is its analytic inverse. The tissue curve
 * itself is soft-capped at `lungCapacity`; it is not a straight line.
 */
export function transpulmonaryAtFixed(p, lungVolume, phi) {
  return clamp(perUnitPressure(p, lungVolume / Math.max(phi, 1e-6)), -25, 80);
}

/**
 * Transpulmonary pressure at a given lung volume: the inverse of the curve
 * above, by bisection.
 *
 * There is no closed form once the open fraction is part of it, and inverting
 * numerically is the honest alternative to linearising and calling it the same
 * thing. The map is monotone — more pressure opens more units and fills the open
 * ones further — so a bisection is safe.
 */
export function transpulmonaryAt(p, lungVolume, hint = null) {
  const TOL = 1e-6; // L

  // The integrator moves the lung by about a tenth of a millilitre per step, so
  // last step's answer is a very good starting point and Newton lands in one or
  // two iterations. Without this the bisection below runs four thousand times a
  // simulated second and costs an order of magnitude more than the rest of the
  // model put together.
  if (hint !== null && Number.isFinite(hint)) {
    let pl = hint;
    for (let i = 0; i < 4; i++) {
      const f = lungVolumeAtPl(p, pl) - lungVolume;
      if (Math.abs(f) < TOL) return pl;
      const h = 0.05;
      const slope = (lungVolumeAtPl(p, pl + h) - lungVolumeAtPl(p, pl - h)) / (2 * h);
      if (!(slope > 1e-9)) break; // flat: Newton has nothing to work with
      pl -= f / slope;
      if (!Number.isFinite(pl) || pl < -25 || pl > 80) break;
    }
  }

  let lo = -25, hi = 80;
  if (lungVolume <= lungVolumeAtPl(p, lo)) return lo;
  if (lungVolume >= lungVolumeAtPl(p, hi)) return hi;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (lungVolumeAtPl(p, mid) < lungVolume) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Invert lung volume while holding only recruitment memory fixed.
 *
 * The normal compartment remains pressure-responsive during the solve. This is
 * intentionally different from `transpulmonaryAtFixed`, which freezes the
 * entire open fraction and is retained for static analytic uses.
 */
export function transpulmonaryAtRecruitmentState(p, lungVolume, recruitedFraction, hint = null) {
  const TOL = 1e-6; // L
  const volumeAt = (pl) => lungVolumeAtRecruitmentState(p, pl, recruitedFraction);

  if (hint !== null && Number.isFinite(hint)) {
    let pl = hint;
    for (let i = 0; i < 4; i++) {
      const f = volumeAt(pl) - lungVolume;
      if (Math.abs(f) < TOL) return pl;
      const h = 0.05;
      const slope = (volumeAt(pl + h) - volumeAt(pl - h)) / (2 * h);
      if (!(slope > 1e-9)) break;
      pl -= f / slope;
      if (!Number.isFinite(pl) || pl < -25 || pl > 80) break;
    }
  }

  let lo = -25, hi = 80;
  if (lungVolume <= volumeAt(lo)) return lo;
  if (lungVolume >= volumeAt(hi)) return hi;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (volumeAt(mid) < lungVolume) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The compliance a ventilator would measure: the slope of the curve here, not
 * the tissue property.
 *
 * In a lung with units still opening this exceeds the open fraction times
 * `clung`, because part of the volume accepted by a pressure step goes into
 * units that were shut before it. That is the same thing that makes a
 * recruitable lung look more compliant at higher PEEP.
 */
export function lungComplianceAt(p, lungVolume, eps = 0.25) {
  const pl = transpulmonaryAt(p, lungVolume);
  const dv = lungVolumeAtPl(p, pl + eps) - lungVolumeAtPl(p, pl - eps);
  return (dv / (2 * eps)) * 1000; // mL/cmH2O
}

/** End-expiratory equilibrium volume during a passive static PEEP step. */
export function staticEndExpiratoryVolume(p, peep, phi = null) {
  const balance = (volume) =>
    chestWallPressure(p, volume)
    + (phi === null ? transpulmonaryAt(p, volume) : transpulmonaryAtFixed(p, volume, phi))
    - peep;

  let lo = 0.02;
  let hi = CHEST_WALL_MAX_VOLUME - 1e-5;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2;
    if (balance(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Passive EELV for a known recruitment state and pressure-responsive normal lung. */
export function staticEndExpiratoryVolumeAtRecruitmentState(p, peep, recruitedFraction) {
  // Recruitment changes the lung branch, while the independently defined wall
  // remains at exactly the same absolute-volume relation.
  const balance = (volume) => chestWallPressure(p, volume)
    + transpulmonaryAtRecruitmentState(p, volume, recruitedFraction) - peep;

  let lo = 0.02;
  let hi = CHEST_WALL_MAX_VOLUME - 1e-5;
  for (let i = 0; i < 44; i++) {
    const mid = (lo + hi) / 2;
    if (balance(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Apply the bedside recruitment-to-inflation arithmetic to this model lung.
 *
 * Chen et al.'s single-breath method subtracts the volume expected from low-
 * PEEP respiratory-system compliance from the measured change in EELV. The
 * remainder is recruited volume; its compliance divided by low-PEEP Crs is
 * R/I. The simulator has no separate airway-opening pressure, so the effective
 * pressure step is the applied 10 cmH2O step. That limitation is surfaced in
 * the UI and documentation rather than silently borrowing `pOpen`, which is a
 * transpulmonary alveolar opening pressure and is not the same measurement.
 */
function assessRecruitmentToInflation(p) {
  const lowEelv = staticEndExpiratoryVolume(p, RI_LOW_PEEP);
  const highEelv = staticEndExpiratoryVolume(p, RI_HIGH_PEEP);
  const lungCompliance = lungComplianceAt(p, lowEelv);
  // Bedside low-PEEP Crs contains the wall compliance at that actual volume,
  // not the registry's reference slope. This distinction becomes essential
  // once the independent wall stiffens toward its lower volume range.
  const wallCompliance = chestWallComplianceAt(p, lowEelv);
  const lowCompliance = 1 / (1 / lungCompliance + 1 / wallCompliance);
  const pressureStep = RI_HIGH_PEEP - RI_LOW_PEEP;
  const deltaEelv = (highEelv - lowEelv) * 1000;
  const predictedInflation = lowCompliance * pressureStep;
  const recruitedVolume = deltaEelv - predictedInflation;
  const rawRatio = predictedInflation > 1e-9 ? recruitedVolume / predictedInflation : 0;

  return {
    lowPeep: RI_LOW_PEEP,
    highPeep: RI_HIGH_PEEP,
    lowEelv,
    highEelv,
    deltaEelv,
    lowCompliance,
    predictedInflation,
    recruitedVolume,
    recruitedCompliance: recruitedVolume / pressureStep,
    // A negative value means the average compliance over the step was lower
    // than its low-PEEP tangent (pure inflation/overdistension), not "negative
    // recruitment". Bedside R/I is reported from zero upward, so the clinical
    // readout is floored while the raw value remains available for tests.
    rawRatio,
    ratio: Math.max(0, rawRatio),
  };
}

const riAssessmentCache = new Map();
let lastCalibrationKey = null;
let lastCalibration = null;

const recruitmentKey = (p, fraction = '') => [
  Number(p.collapsed ?? 0), Number(p.clung ?? 200), Number(p.lungCapacity ?? 6),
  Number(p.ccw ?? 200), Number(p.cwLoad ?? 0),
  Number(p.pOpen ?? 20), Number(p.riRatio ?? 0), fraction,
].join('|');

/**
 * The model-implied R/I for the standard 5 -> 15 cmH2O reference manoeuvre.
 * The result is cached because panels may ask for it repeatedly while the
 * patient parameters have not changed.
 */
export function recruitmentToInflation(p) {
  const openableFraction = openableDiseasedFraction(p);
  const key = recruitmentKey(p, openableFraction.toFixed(8));
  if (riAssessmentCache.has(key)) return riAssessmentCache.get(key);
  const result = assessRecruitmentToInflation({ ...p, openableDiseasedFraction: openableFraction });
  if (riAssessmentCache.size >= 128) riAssessmentCache.clear();
  riAssessmentCache.set(key, result);
  return result;
}

/**
 * Translate a requested bedside R/I into the latent fraction of diseased units
 * that may reopen. R/I and "fraction recruitable" are not synonyms, so this is
 * a numerical calibration against the same static PEEP manoeuvre used to label
 * the control.
 *
 * The collapsed compartment is a hard physical ceiling. If the requested R/I
 * would require more than all of it, the closest attainable phenotype is
 * returned with `limited: true`; callers can then warn instead of inventing
 * additional lung. A short scan makes the solve robust when an opening pressure
 * lies outside the reference manoeuvre and the response is not monotone.
 */
export function calibrateRecruitmentToInflation(p) {
  const target = clamp(Number(p.riRatio ?? 0), 0, 2);
  const key = recruitmentKey(p);
  if (key === lastCalibrationKey && lastCalibration) return lastCalibration;

  // Most simulator phenotypes have no collapsed compartment. Their R/I is not
  // zero but inapplicable, and running two nested pressure-volume solves merely
  // to discover that no units can recruit would dominate startup and test time.
  if (Number(p.collapsed ?? 0) <= 0) {
    const result = {
      target,
      openableFraction: 0,
      achieved: 0,
      maximum: 0,
      assessment: null,
      limited: target > 0,
    };
    lastCalibrationKey = key;
    lastCalibration = result;
    return result;
  }

  const at = (openableFraction) => {
    const assessment = assessRecruitmentToInflation({
      ...p,
      openableDiseasedFraction: clamp(openableFraction, 0, 1),
    });
    return { openableFraction, assessment };
  };

  // R/I zero deliberately means no hard-to-open compartment. The uncorrected
  // tissue curve can have a slightly negative raw ratio through overdistension;
  // it must not be cancelled by adding a small amount of occult recruitment.
  let chosen = at(0);
  let maximum = chosen;
  if (target > 0 && Number(p.collapsed ?? 0) > 0) {
    const samples = [chosen];
    for (let i = 1; i <= 12; i++) {
      const sample = at(i / 12);
      samples.push(sample);
      if (sample.assessment.ratio > maximum.assessment.ratio) maximum = sample;
    }

    if (target >= maximum.assessment.ratio - 1e-5) {
      chosen = maximum;
    } else {
      // Use the first upward crossing: it is the smallest latent compartment
      // consistent with the measured ratio and avoids choosing a second branch
      // when the opening sigmoid lies partly outside the pressure step.
      let lower = null;
      let upper = null;
      for (let i = 1; i < samples.length; i++) {
        if (samples[i - 1].assessment.ratio <= target
            && samples[i].assessment.ratio >= target) {
          lower = samples[i - 1];
          upper = samples[i];
          break;
        }
      }
      if (lower && upper) {
        for (let i = 0; i < 24; i++) {
          const middle = at((lower.openableFraction + upper.openableFraction) / 2);
          if (middle.assessment.ratio < target) lower = middle; else upper = middle;
        }
        chosen = upper;
      } else {
        chosen = maximum;
      }
    }
  }

  const result = {
    target,
    openableFraction: clamp(chosen.openableFraction, 0, 1),
    achieved: chosen.assessment.ratio,
    maximum: maximum.assessment.ratio,
    assessment: chosen.assessment,
    limited: target > chosen.assessment.ratio + 0.01,
  };
  lastCalibrationKey = key;
  lastCalibration = result;
  return result;
}

/**
 * How much of the lung is open, and how hard the open part is being stretched.
 *
 * The strain figure is the one that matters and the one a single-compartment
 * model cannot produce. It is volume per *open* unit, so the same litre of gas
 * strains a lung with a third of its units open half again as much as one with
 * two thirds open — the baby lung, stated as arithmetic. When PEEP opens units,
 * the gas it adds is shared among more of them, and the strain per unit can fall
 * even as total volume rises. That is the mechanism the recruiter has and the
 * non-recruiter does not, and it is the whole reason for this file.
 */
export function lungRegions(p, lungVolume, plKnown = null, phiKnown = null) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  const openable = openableDiseasedFraction(p);
  const pl = plKnown ?? transpulmonaryAt(p, lungVolume);

  const easy = logistic((pl - PL_EASY) / SPREAD_EASY);
  const hard = logistic((pl - (p.pOpen ?? 20)) / SPREAD_HARD);

  const normalOpen = (1 - diseased) * easy;
  const equilibriumRecruited = diseased * openable * hard;
  // With hysteresis running, how much is open is a state rather than a function
  // of the present pressure, and the resistance has to be read off the state.
  const openFraction = phiKnown ?? clamp(normalOpen + equilibriumRecruited, 0.05, 1);
  // Under hysteresis the known total contains a pressure-responsive normal share
  // plus recruitment memory. Report the latter rather than the equilibrium
  // opening-branch value, otherwise the metrics disagree with the mechanics.
  const recruited = phiKnown === null
    ? equilibriumRecruited
    : clamp(openFraction - normalOpen, 0, diseased * openable);
  const closedFraction = 1 - openFraction;

  // Volume per open unit, referenced to what this patient's fully open tissue
  // would hold at resting recoil. This is the clinically relevant FRC for the
  // mechanical J-curve: a stiff ARDS baby lung can be distended at a total
  // volume far below 2.2 L. Using the healthy absolute FRC here made such a lung
  // appear under-inflated even at high plateau pressure.
  const vascularFrc = perUnitVolume(p, RECOIL_AT_FRC);
  const strain = lungVolume / (vascularFrc * openFraction) - 1;

  return { diseased, recruited, easy, hard, openFraction, closedFraction, strain, pl, vascularFrc };
}

// Both mechanical limbs are driven by volume, but the clinical teaching curve
// assigns them opposite roles: alveolar compression produces the high-volume
// limb, while loss of radial traction narrows extra-alveolar vessels at low
// volume. Hakim 1982 also found a smaller high-volume increase outside the
// alveolar segment in isolated dog lobes; that secondary effect is not imported
// into this human didactic decomposition, and no animal ratio is used as a
// quantitative target.
//
// For the didactic human curve the fully open lung has its minimum at NORMAL_FRC.
// Clinical reviews draw the J-curve this way, whereas the old 2.87 L minimum was
// inherited from excised dog lungs. K_UNFURL is derived, not fitted: at zero
// strain it makes the negative slope from parenchymal unfurling exactly cancel
// the positive slope from vascular stretch. The right limb then rises gradually
// over the volumes the simulator can plausibly reach instead of reproducing an
// animal maximal-inflation experiment.
const K_STRETCH = 0.58;
const EXTRA_FLOOR = 0.30;
const F_ALV = 0.5;
const F_EXTRA = 0.5;
const K_UNFURL = (F_ALV * K_STRETCH) / (F_EXTRA * (1 - EXTRA_FLOOR));
const LOW_VOLUME_TRACTION_GAIN = 4;

// F_ALV is a modelling choice and cannot be made anything else. The published
// partitions do not measure the same boundary and do not agree: capillaries 34%
// by bolus, alveolar-wall capillaries 45% by micropuncture, the middle
// distensible segment under 16% by occlusion — and that segment swings from 7%
// to 53% with haematocrit alone. No measurement settles this one. Equal shares
// at FRC are therefore a didactic crossover, not an anatomical claim: they make
// the clinical transition from extra-alveolar to alveolar predominance visible.
//
// The earlier exponential alone made PVR at RV only about 5% higher than at FRC.
// LOW_VOLUME_TRACTION_GAIN adds the nonlinear narrowing expected when radial
// parenchymal traction is lost below FRC. Its quadratic form is zero in both
// value and slope at FRC, so it strengthens only the left limb without moving
// the calibrated nadir or changing the open-lung PVR assigned there. The gain is
// a transparent teaching coefficient; the Cecconi schematic has no numerical
// y-axis and is not treated as a source of measured ratios.

const unfurled = (strain) =>
  EXTRA_FLOOR + (1 - EXTRA_FLOOR) * Math.exp(-K_UNFURL * strain);

// A derecruited unit is poorly perfused, not absent. Its intrinsic pathway is
// narrower even with HPV disabled; HPV then raises only this pathway's
// resistance. CLOSED_PATH_FACTOR is a deliberately coarse teaching coefficient,
// constrained together with the ARDS phenotype by the human in-vivo PEEP trial
// in tests/literature.mjs rather than presented as a measured anatomical ratio.
const CLOSED_PATH_FACTOR = 3;
const HPV_GAIN = 1.1;

/**
 * Pulmonary vascular resistance, as the equivalent of two parallel pathways.
 *
 * Open units follow the volume-dependent J above. Derecruited units retain a
 * high-resistance pathway whose tone is increased by HPV. Each population's
 * conductance is proportional to how much lung belongs to it, and the two
 * conductances add. This matters physiologically and numerically: the previous
 * formula said closed units were still perfused but divided only by the open
 * fraction and applied HPV to the whole lung, which actually removed their
 * pathway and over-amplified absolute PVR in ARDS.
 */
export function pvrComponents(p, lungVolume, plKnown = null, phiKnown = null) {
  const r = lungRegions(p, lungVolume, plKnown, phiKnown);
  const stretch = Math.exp(K_STRETCH * r.strain);
  const deflation = Math.max(0, -r.strain);
  const perUnitAlveolar = p.pvrBase * F_ALV * stretch;
  const perUnitExtra = p.pvrBase * (
    F_EXTRA * unfurled(r.strain)
    + LOW_VOLUME_TRACTION_GAIN * deflation * deflation
  );
  const openPath = perUnitAlveolar + perUnitExtra;
  const closedPath = p.pvrBase * CLOSED_PATH_FACTOR * (1 + (p.hpv ?? 0) * HPV_GAIN);
  const openConductance = r.openFraction / openPath;
  const closedConductance = r.closedFraction / closedPath;
  const totalConductance = openConductance + closedConductance;
  return {
    // The two series elements of the open vascular path are exposed so the
    // teaching plot can show the classical opposing limbs explicitly. They are
    // not two parallel perfusion beds: alveolar and extra-alveolar resistance
    // add in series to make `openPath`.
    alveolarPath: perUnitAlveolar,
    extraAlveolarPath: perUnitExtra,
    openPath,
    closedPath,
    openBed: openPath / r.openFraction,
    // No closed compartment means the bed is absent, not infinitely resistant.
    // `null` keeps that semantic explicit and prevents an otherwise valid fully
    // open state from leaking a non-finite metric into exports and tests.
    closedBed: r.closedFraction > 0 ? closedPath / r.closedFraction : null,
    openFlowShare: openConductance / totalConductance,
    total: 1 / totalConductance,
    openFraction: r.openFraction,
    closedFraction: r.closedFraction,
    recruited: r.recruited,
    strain: r.strain,
    vascularFrc: r.vascularFrc,
    pl: r.pl,
    // Kept under its old name for the panels that label the axis with it.
    x: r.strain,
  };
}

export function pvrAt(p, lungVolume, plKnown = null, phiKnown = null) {
  return clamp(pvrComponents(p, lungVolume, plKnown, phiKnown).total, 0.005, 5);
}
