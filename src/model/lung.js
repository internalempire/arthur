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

/** How much of the lung is open at a given transpulmonary pressure. */
export function openFractionAt(p, pl) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  const recruitable = clamp(p.recruitable ?? 0, 0, 1);
  const normalOpen = (1 - diseased) * logistic((pl - PL_EASY) / SPREAD_EASY);
  const recruited = diseased * recruitable * logistic((pl - (p.pOpen ?? 20)) / SPREAD_HARD);
  return clamp(normalOpen + recruited, 0.05, 1);
}

// The open fraction of an undiseased lung at its resting recoil is a constant —
// the diseased population is zero, so only the easy limb contributes. Written as
// one rather than derived per call, because deriving it meant spreading the
// parameter object tens of thousands of times a simulated second and cost more
// than every other part of the lung model together.
const OPEN_AT_REST = 1 / (1 + Math.exp(-(RECOIL_AT_FRC - PL_EASY) / SPREAD_EASY));

// Volume of a fully open lung at zero transpulmonary pressure — the gas that
// stays in it when nothing is distending it. Fixed, so that a lung which has
// lost its elastic recoil rests at a *higher* volume: emphysema is a compliance
// that is too high, not a resting volume that is set by hand. The value is
// chosen so that a normal lung, with normal compliance, rests at NORMAL_FRC.
const UNSTRESSED_VOLUME = NORMAL_FRC / OPEN_AT_REST - RECOIL_AT_FRC * 0.2; // L

function perUnitVolume(p, pl) {
  return Math.max(0, UNSTRESSED_VOLUME + (p.clung / 1000) * pl);
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
export function lungVolumeAtPl(p, pl) {
  return openFractionAt(p, pl) * perUnitVolume(p, pl);
}

/** The volume the lung settles at when its recoil balances the chest wall. */
export function relaxationVolume(p) {
  return lungVolumeAtPl(p, RECOIL_AT_FRC);
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
export function lungRegions(p, lungVolume, plKnown = null) {
  const diseased = clamp(p.collapsed ?? 0, 0, 0.95);
  const recruitable = clamp(p.recruitable ?? 0, 0, 1);
  const pl = plKnown ?? transpulmonaryAt(p, lungVolume);

  const easy = logistic((pl - PL_EASY) / SPREAD_EASY);
  const hard = logistic((pl - (p.pOpen ?? 20)) / SPREAD_HARD);

  const normalOpen = (1 - diseased) * easy;
  const recruited = diseased * recruitable * hard;
  const openFraction = clamp(normalOpen + recruited, 0.05, 1);
  const closedFraction = 1 - openFraction;

  // Volume per open unit, referenced to what those units would hold at a normal
  // resting volume.
  const strain = lungVolume / (NORMAL_FRC * openFraction) - 1;

  return { diseased, recruited, easy, hard, openFraction, closedFraction, strain, pl };
}

// The two limbs are driven by two different quantities, and conflating them was
// an error that stayed hidden while the mechanics were linear.
//
// Alveolar vessels are squeezed by the units around them, so their resistance
// follows how distended those units are: volume per open unit, the strain.
//
// Extra-alveolar vessels are held open by radial traction from the surrounding
// parenchyma, and traction is a *stress*, not a volume. It follows
// transpulmonary pressure. In tissue that is stiff or oedematous the same
// pressure holds the vessels open just as well while the lung holds much less
// gas, so a strain-driven extra-alveolar term says such a lung is derecruited
// when it is merely stiff — and then claims PEEP relieves that, in a lung with
// nothing to recruit.
//
// While compliance was a constant the two were proportional and the mistake had
// no consequences. Making recruitment change the mechanics broke that
// proportionality and surfaced it, in a test that had been passing for the wrong
// reason.
const K_ALV = 1.6;
const F_ALV = 0.6;
const F_EXTRA = 0.4;

// Traction saturates. It pulls extra-alveolar vessels open up to their full
// calibre and then has nothing left to do, so beyond that point more inflation
// can only compress the alveolar ones. Without a floor the extra-alveolar limb
// falls by 86% between transpulmonary pressures of 8 and 18 and swamps
// everything else — which is what a lung reaching those pressures does, so the
// omission only showed up once one did.
//
// The floor is a judgement: a third of the resting value is how far this model
// lets traction take it. K_EXTRA is not a judgement — it is fixed by requiring
// the two limbs' derivatives to cancel at a normal lung's resting point, which
// is where the J-curve is calibrated.
const EXTRA_FLOOR = 0.35;
const K_EXTRA = 1.713;

// Traction relative to a normal lung's resting recoil, so the exponent is zero
// where the J-curve is calibrated.
const traction = (pl) => pl / RECOIL_AT_FRC - 1;
const tractionRelief = (pl) =>
  EXTRA_FLOOR + (1 - EXTRA_FLOOR) * Math.exp(-K_EXTRA * traction(pl));

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
export function pvrComponents(p, lungVolume) {
  const r = lungRegions(p, lungVolume);
  const hypoxic = 1 + p.hpv * HPV_GAIN * r.closedFraction;
  const perUnitAlveolar = p.pvrBase * F_ALV * Math.exp(K_ALV * r.strain);
  const perUnitExtra = p.pvrBase * F_EXTRA * tractionRelief(r.pl);
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

export function pvrAt(p, lungVolume) {
  return clamp(pvrComponents(p, lungVolume).total, 0.005, 5);
}
