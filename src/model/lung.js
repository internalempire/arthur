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
// What this deliberately does *not* do is change the mechanics. Recruited units
// add compliance in a real lung, so the pressure–volume relationship here is
// still linear where a real one stiffens at both ends. That is a separate change
// with its own stability questions, and folding it in would make this one
// impossible to audit.

import { clamp } from './units.js';

// Pleural pressure at the relaxation volume, duplicated from the respiratory
// module rather than imported: that module needs the resistance model, so
// importing back the other way would make a cycle out of two files that each
// only need one constant from the other.
const PPL_FRC = -5; // cmH2O

// The resting volume of a fully open lung. Collapse is measured against this,
// not against the patient's own relaxation volume — a patient whose FRC is
// 1.35 L is not a small normal lung, they are a normal lung with a third of it
// shut.
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

/**
 * Transpulmonary pressure at a given lung volume.
 *
 * Pl = Palv - Ppl, and both muscle pressure and the chest wall cancel out of
 * that difference, so it depends on lung volume and lung compliance alone:
 *
 *   Pl = (V - FRC) / Clung - PPL_FRC
 *
 * At the relaxation volume this leaves the recoil pressure that holds the lung
 * open against the chest wall, which is why it is not zero there.
 */
export function transpulmonaryAt(p, lungVolume) {
  return ((lungVolume - p.frc) * 1000) / p.clung - PPL_FRC;
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
export function lungRegions(p, lungVolume) {
  // The share of a normal lung that disease has shut at the patient's own
  // resting volume.
  const diseased = clamp((NORMAL_FRC - p.frc) / NORMAL_FRC, 0, 0.95);
  const recruitable = clamp(p.recruitable ?? 0, 0, 1);
  const pl = transpulmonaryAt(p, lungVolume);

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

// Alveolar vessels are compressed by the units around them, so their resistance
// rises with strain. Extra-alveolar vessels are held open by radial traction
// from the same parenchyma, so theirs falls with it. Their sum is the J.
//
// The nadir sits where the two derivatives cancel, F_ALV * K_ALV = F_EXTRA *
// K_EXTRA, which is a constraint on these four constants rather than a number to
// be tuned separately.
const K_ALV = 1.6;
const K_EXTRA = 2.4;
const F_ALV = 0.6;
const F_EXTRA = 0.4;

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
  const perUnitExtra = p.pvrBase * F_EXTRA * Math.exp(-K_EXTRA * r.strain);
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
