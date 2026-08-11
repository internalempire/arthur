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
// The consequence for `clung` is worth stating plainly: it is the compliance of
// this patient's lung *with all of it open*, not the compliance a ventilator
// would measure. The measured value is the open fraction times that, which is
// the baby lung as a readout — compliance tracks how much lung is being
// ventilated rather than how stiff the tissue is.

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
// It is deliberately narrower than the former 7 cmH2O: that broad curve made
// even a completely openable ARDS compartment produce R/I < 0.15 during the
// standard 5 -> 15 cmH2O manoeuvre, outside the human range the control names.
const SPREAD_HARD = 2; // cmH2O

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
// lung open against the chest wall, and the negative of pleural pressure there.
export const RECOIL_AT_FRC = 5; // cmH2O

/**
 * How much of the lung is open at a given transpulmonary pressure.
 *
 * `shift` moves both thresholds down, which is what makes the closing branch the
 * closing branch: a unit that needed 20 cmH2O to open will not close again until
 * pressure falls well below that.
 */
export function openFractionAt(p, pl, shift = 0) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  const openable = openableDiseasedFraction(p);
  const normalOpen = (1 - diseased) * logistic((pl - (PL_EASY - shift)) / SPREAD_EASY);
  const recruited = diseased * openable
    * logistic((pl - ((p.pOpen ?? 20) - shift)) / SPREAD_HARD);
  return clamp(normalOpen + recruited, 0.05, 1);
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
  const gap = hysteresisGap(p);
  return {
    lo: openFractionAt(p, pl, 0),      // opens only what this pressure can open
    hi: openFractionAt(p, pl, gap),    // keeps open everything already open
  };
}

/**
 * Advance the open fraction one step, given where the lung currently is.
 *
 * A play operator: the state is dragged along by whichever edge of the band it
 * has run into, and sits still in between. Instantaneous rather than rate-based,
 * because in this model an alveolus opens within a breath and nothing here
 * resolves the milliseconds it takes.
 */
export function stepOpenFraction(p, phi, pl) {
  const { lo, hi } = openBand(p, pl);
  if (!(phi > 0)) return lo;
  return Math.min(Math.max(phi, lo), hi);
}

// The open fraction of an undiseased lung at its resting recoil is a constant —
// the diseased population is zero, so only the easy limb contributes. Written as
// one rather than derived per call, because deriving it meant spreading the
// parameter object tens of thousands of times a simulated second and cost more
// than every other part of the lung model together.
const OPEN_AT_REST = 1 / (1 + Math.exp(-(RECOIL_AT_FRC - PL_EASY) / SPREAD_EASY));

// The tissue's own pressure-volume curve, pinned by two textbook volumes rather
// than by constants chosen to look right.
//
//   a normal fully open lung rests at NORMAL_FRC when its recoil is 5 cmH2O
//   the same lung reaches total lung capacity, 6 L, at 35 cmH2O
//
// Two anchors, two unknowns: the volume the tissue holds at no distending
// pressure, and the pressure scale over which it stiffens.
//
// The scale is a pressure, and the same pressure for every lung. That is the
// substance of it. Collagen engages at a strain, and a strain corresponds to a
// pressure, so a stiff lung should run out of room at the *same pressures* as a
// soft one — it just holds much less when it gets there. Writing the ceiling as
// an absolute volume instead, as a first version did, made the scale
// proportional to 1/compliance and put a stiff lung's stiffening at 195 cmH2O,
// so the baby lung was the one place the model stayed straight. Which is exactly
// where the question was asked.
//
// Capacity now follows from compliance: V0 + clung * P_SCALE. A normal lung
// tends to 9.4 L, an ARDS lung at 45 mL/cmH2O to 3.1 L. Small stiff lungs are
// small.
const TOTAL_LUNG_CAPACITY = 6.0;   // L, reached at
const TLC_PRESSURE = 35;           // cmH2O
const NORMAL_COMPLIANCE = 0.2;     // L/cmH2O, the compliance the anchors assume

/**
 * How much one fully open lung's worth of tissue holds at a transpulmonary
 * pressure, given its compliance at rest.
 *
 * Linear below zero and saturating above it, joined so that both the value and
 * the slope are continuous at the join, so `clung` still means the compliance at
 * rest.
 *
 * Below zero the curve is left linear on purpose. What empties a lung at
 * negative distending pressure is units shutting, and the open fraction already
 * does that; making the tissue term collapse as well would count it twice.
 */
function saturating(v0, scale, c, pl) {
  if (pl <= 0) return Math.max(0, v0 + c * pl);
  return v0 + c * scale * (1 - Math.exp(-pl / scale));
}

// Solved rather than written down, so the two anchors are enforced by the code
// instead of being numbers somebody has to keep true by hand.
const [UNSTRESSED_VOLUME, PRESSURE_SCALE] = (() => {
  const openAt = (pl) => 1 / (1 + Math.exp(-(pl - PL_EASY) / SPREAD_EASY));
  const atRest = NORMAL_FRC / openAt(RECOIL_AT_FRC);
  const atCapacity = TOTAL_LUNG_CAPACITY / openAt(TLC_PRESSURE);
  // For any scale, the resting anchor fixes the unstressed volume outright.
  const unstressedFor = (scale) =>
    atRest - NORMAL_COMPLIANCE * scale * (1 - Math.exp(-RECOIL_AT_FRC / scale));
  let lo = 1, hi = 400;
  for (let i = 0; i < 200; i++) {
    const scale = (lo + hi) / 2;
    if (saturating(unstressedFor(scale), scale, NORMAL_COMPLIANCE, TLC_PRESSURE) < atCapacity) {
      lo = scale;
    } else {
      hi = scale;
    }
  }
  const scale = (lo + hi) / 2;
  return [unstressedFor(scale), scale];
})();

function perUnitVolume(p, pl) {
  return saturating(UNSTRESSED_VOLUME, PRESSURE_SCALE, p.clung / 1000, pl);
}

/** The inverse of `saturating`, in closed form. */
function perUnitPressure(p, volume) {
  const c = p.clung / 1000;
  if (volume <= UNSTRESSED_VOLUME) return (volume - UNSTRESSED_VOLUME) / c;
  const room = c * PRESSURE_SCALE;              // all the tissue has left
  const left = UNSTRESSED_VOLUME + room - volume;
  if (left <= 1e-6) return 80;                  // at capacity: no pressure gets more in
  return PRESSURE_SCALE * Math.log(room / left);
}

/**
 * Lung volume at a given transpulmonary pressure — the pressure–volume curve.
 *
 * Two factors, and the shape comes from their product. How many units are open
 * is a sigmoid in pressure; how much each open unit holds is linear in it. A
 * normal lung sits on the flat top of the first factor, so its curve is nearly
 * straight. A collapsed but recruitable lung sits on the rising part, so its
 * curve has the lower inflection a bedside pressure–volume manoeuvre draws.
 */
export function lungVolumeAtPl(p, pl, phi = null) {
  return (phi ?? openFractionAt(p, pl)) * perUnitVolume(p, pl);
}

/**
 * The volume the lung settles at when its recoil balances the chest wall.
 *
 * With hysteresis on this is no longer a property of the parameters alone — the
 * same lung rests at two different volumes depending on whether it was last
 * inflated or last emptied — so the caller passes the open fraction it is
 * actually at. Omitting it gives the equilibrium branch, which is what the
 * non-hysteresis model has always used.
 */
export function relaxationVolume(p, phi = null) {
  return lungVolumeAtPl(p, RECOIL_AT_FRC, phi);
}

/**
 * Transpulmonary pressure at a volume, with the open fraction held fixed.
 *
 * Closed form, because with the fraction frozen the curve is a straight line:
 * V = phi * (V0 + C*Pl). Within a step the fraction *is* frozen — it is a state
 * that the step then updates — so this is both exact and cheaper than the
 * bisection the equilibrium branch needs.
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
  const vRelax = relaxationVolume(p, phi);
  const ccw = Math.max(1e-6, (p.ccw ?? 200) / 1000);
  const balance = (volume) =>
    -RECOIL_AT_FRC + (volume - vRelax) / ccw
    + (phi === null ? transpulmonaryAt(p, volume) : transpulmonaryAtFixed(p, volume, phi)) - peep;

  let lo = 0.02;
  let hi = Math.max(12, lungVolumeAtPl(p, 80) * 1.05);
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
  const lowCompliance = 1 / (1 / lungCompliance + 1 / Math.max(1e-6, p.ccw ?? 200));
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
  Number(p.collapsed ?? 0), Number(p.clung ?? 200), Number(p.ccw ?? 200),
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
  const recruited = diseased * openable * hard;
  // With hysteresis running, how much is open is a state rather than a function
  // of the present pressure, and the resistance has to be read off the state.
  const openFraction = phiKnown ?? clamp(normalOpen + recruited, 0.05, 1);
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

// Both mechanical limbs are driven by volume, and they share the term that makes
// them rise with overdistension. Thomas 1961 and Hakim 1982 support this
// qualitative mechanism, but both are animal preparations; their exact ratios
// are no longer used as human calibration targets.
//
// For the didactic human curve the fully open lung has its minimum at NORMAL_FRC.
// Clinical reviews draw the J-curve this way, whereas the old 2.87 L minimum was
// inherited from excised dog lungs. K_UNFURL is derived, not fitted: at zero
// strain it makes the negative slope from parenchymal unfurling exactly cancel
// the positive slope from vascular stretch. The right limb then rises gradually
// over the volumes the simulator can plausibly reach instead of reproducing an
// animal maximal-inflation experiment.
const K_STRETCH = 0.515;
const EXTRA_FLOOR = 0.17;
const F_ALV = 0.6;
const F_EXTRA = 0.4;
const K_UNFURL = K_STRETCH / (F_EXTRA * (1 - EXTRA_FLOOR));

// F_ALV is a modelling choice and cannot be made anything else. The published
// partitions do not measure the same boundary and do not agree: capillaries 34%
// by bolus, alveolar-wall capillaries 45% by micropuncture, the middle
// distensible segment under 16% by occlusion — and that segment swings from 7%
// to 53% with haematocrit alone. No measurement settles this one.

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
  const perUnitAlveolar = p.pvrBase * F_ALV * stretch;
  const perUnitExtra = p.pvrBase * F_EXTRA * unfurled(r.strain) * stretch;
  const openPath = perUnitAlveolar + perUnitExtra;
  const closedPath = p.pvrBase * CLOSED_PATH_FACTOR * (1 + (p.hpv ?? 0) * HPV_GAIN);
  const openConductance = r.openFraction / openPath;
  const closedConductance = r.closedFraction / closedPath;
  const totalConductance = openConductance + closedConductance;
  return {
    openPath,
    closedPath,
    openBed: openPath / r.openFraction,
    closedBed: r.closedFraction > 0 ? closedPath / r.closedFraction : Infinity,
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
