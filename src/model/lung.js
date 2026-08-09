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
// hard it is pushed. Recruitability is now a property of the patient rather than
// a consequence of their resting volume.
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
export const PVR_NADIR_VOLUME = NORMAL_FRC;

// Normal units close as the lung empties and reopen almost as soon as there is
// any distending pressure, so their threshold sits near zero transpulmonary
// pressure with a narrow spread.
const PL_EASY = 0;
const SPREAD_EASY = 1.3; // cmH2O

// Diseased units open progressively over tens of cmH2O, which is why a
// recruitment manoeuvre is a ramp and not a switch.
const SPREAD_HARD = 7; // cmH2O

const logistic = (x) => 1 / (1 + Math.exp(-x));

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
  const recruitable = clamp(p.recruitable ?? 0, 0, 1);
  const normalOpen = (1 - diseased) * logistic((pl - (PL_EASY - shift)) / SPREAD_EASY);
  const recruited = diseased * recruitable
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
  const recruitable = clamp(p.recruitable ?? 0, 0, 1);
  const pl = plKnown ?? transpulmonaryAt(p, lungVolume);

  const easy = logistic((pl - PL_EASY) / SPREAD_EASY);
  const hard = logistic((pl - (p.pOpen ?? 20)) / SPREAD_HARD);

  const normalOpen = (1 - diseased) * easy;
  const recruited = diseased * recruitable * hard;
  // With hysteresis running, how much is open is a state rather than a function
  // of the present pressure, and the resistance has to be read off the state.
  const openFraction = phiKnown ?? clamp(normalOpen + recruited, 0.05, 1);
  const closedFraction = 1 - openFraction;

  // Volume per open unit, referenced to what those units would hold at a normal
  // resting volume.
  const strain = lungVolume / (NORMAL_FRC * openFraction) - 1;

  return { diseased, recruited, easy, hard, openFraction, closedFraction, strain, pl };
}

// Both limbs are driven by volume, and they share the term that makes them rise.
//
// This replaces a version in which the alveolar limb followed strain and the
// extra-alveolar one followed transpulmonary pressure. That split was argued from
// first principles — radial traction is a stress, so it should follow a pressure —
// and three measurements disagree with it:
//
//   Thomas, Griffo & Roos 1961, excised dog lung, negative-pressure inflation at
//   constant vascular pressures: resistance plotted against transpulmonary
//   pressure shows wide hysteresis between inflation and deflation; plotted
//   against volume it does not. Their conclusion is that resistance is
//   "volume-dependent rather than pressure-dependent".
//
//   Hakim, Michel & Chang 1982, arterial and venous occlusion: the volume-related
//   changes are identical under positive- and negative-pressure inflation while
//   the pressure-related ones are not, and inflation produces "a volume-dependent
//   increase in the resistance of both alveolar and extra-alveolar vessels".
//
//   The Petak group 2008, isolated perfused rat lung: hysteresis against
//   transpulmonary pressure is abolished when the same data are plotted against
//   volume.
//
// So `stretch` is a single exponential in strain applied to *both* compartments,
// which is Hakim's sentence written as arithmetic: inflation narrows every
// vessel. What separates them is that the extra-alveolar compartment also gets
// unfurled by the surrounding parenchyma as the lung leaves collapse, and that
// term falls with strain toward a floor. Their sum is the J, and the
// extra-alveolar limb is itself U-shaped — falling, then overtaken by stretch —
// which is what Hakim's arterial and venous segments do.
//
// The three constants are fitted to four published figures, listed in
// docs/LITERATURE_RANGES.md and each an executable row: where the nadir sits, the
// ratio at maximal inflation, the ratio at low volume, and the change across the
// transpulmonary pressures this simulator actually runs in. Four constraints on
// three constants, so the fit can fail — and the previous constants failed three
// of the four by factors of up to five.
const K_ALV = 0.515;      // stretch: how steeply inflation narrows every vessel
const K_EXTRA = 3.35;     // unfurling: how quickly leaving collapse opens the
                          // extra-alveolar vessels
const EXTRA_FLOOR = 0.17; // what is left of that once they are fully unfurled
const F_ALV = 0.6;
const F_EXTRA = 0.4;

// F_ALV is a modelling choice and cannot be made anything else. The published
// partitions do not measure the same boundary and do not agree: capillaries 34%
// by bolus, alveolar-wall capillaries 45% by micropuncture, the middle
// distensible segment under 16% by occlusion — and that segment swings from 7%
// to 53% with haematocrit alone. No measurement settles this one.

const unfurled = (strain) =>
  EXTRA_FLOOR + (1 - EXTRA_FLOOR) * Math.exp(-K_EXTRA * strain);

// How much resistance hypoxic vasoconstriction adds per unit of closed lung.
const HPV_GAIN = 1.1;

/**
 * Pulmonary vascular resistance, as the parallel sum of the open units.
 *
 * Two things set it. Each open unit's resistance follows the J above, driven by
 * the strain in that unit. And the units conduct in parallel, so halving how
 * many are open doubles the resistance — the 1/openFraction term, which is where
 * derecruitment does most of its damage.
 *
 * Closed units are not simply removed: they are still perfused, badly, and
 * hypoxic vasoconstriction is what makes that expensive.
 */
export function pvrComponents(p, lungVolume, plKnown = null, phiKnown = null) {
  const r = lungRegions(p, lungVolume, plKnown, phiKnown);
  const hypoxic = 1 + p.hpv * HPV_GAIN * r.closedFraction;
  const stretch = Math.exp(K_ALV * r.strain);
  const perUnitAlveolar = p.pvrBase * F_ALV * stretch;
  const perUnitExtra = p.pvrBase * F_EXTRA * unfurled(r.strain) * stretch;
  const alveolar = (perUnitAlveolar / r.openFraction) * hypoxic;
  const extraAlveolar = (perUnitExtra / r.openFraction) * hypoxic;
  return {
    alveolar,
    extraAlveolar,
    total: alveolar + extraAlveolar,
    openFraction: r.openFraction,
    closedFraction: r.closedFraction,
    recruited: r.recruited,
    strain: r.strain,
    pl: r.pl,
    // Kept under its old name for the panels that label the axis with it.
    x: r.strain,
  };
}

export function pvrAt(p, lungVolume, plKnown = null, phiKnown = null) {
  return clamp(pvrComponents(p, lungVolume, plKnown, phiKnown).total, 0.005, 5);
}
