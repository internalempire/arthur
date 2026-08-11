// Body position.
//
// Turning a patient prone changes three mechanical things at once, and the
// haemodynamic result is the sum of effects that pull in opposite directions —
// which is why the published haemodynamic findings are mixed. Rather than
// assert an outcome, the model applies the three mechanical changes and lets
// the outcome fall out of them, so the balance can be inspected.

import {
  calibrateRecruitmentToInflation, recruitmentToInflation,
} from './lung.js';

export const PRONE = {
  // The anterior chest wall now rests against the bed and cannot expand, so the
  // chest wall stiffens. Reported reductions in compliance cluster around a
  // third.
  chestWallFactor: 0.65,

  // The abdomen is compressed unless it is deliberately suspended. This raises
  // the pressure surrounding the splanchnic reservoir, which raises mean
  // systemic filling pressure — and also the pressure at which the vena cava
  // closes.
  abdominalRise: 2, // cmH2O

  // Dorsal regions recruit — but proning does not add lung, it redistributes the
  // pleural pressure gradient so that dependent units reach their opening
  // pressure at a lower airway pressure. So the change belongs to the opening
  // pressure, not to the resting volume. A patient with nothing recruitable
  // gains nothing from it, which is why proning is not a recruitment manoeuvre
  // in a lung that is consolidated rather than collapsed.
  openingPressureDrop: 6, // cmH2O
};

/**
 * The parameters the model actually integrates with. Supine adds only the
 * R/I-derived internal state; prone then applies the three mechanical changes
 * above.
 *
 * Position is resolved here rather than written back into the controls so that
 * the sliders keep showing the patient's supine mechanics — turning someone
 * over does not change how stiff their lung is.
 *
 * R/I is calibrated in the supine mechanics shown by the controls. Proning then
 * changes the pressure distribution while holding the latent openable fraction
 * fixed: recalibrating it after turning the patient would force the same R/I in
 * both positions and erase the recruitment effect that position is meant to
 * demonstrate.
 */
export function resolveParams(p) {
  const calibration = calibrateRecruitmentToInflation(p);
  const supine = {
    ...p,
    openableDiseasedFraction: calibration.openableFraction,
    riTarget: calibration.target,
    riAchieved: calibration.achieved,
    riMaximum: calibration.maximum,
    riLimited: calibration.limited,
    riAssessment: calibration.assessment,
  };
  if (p.position !== 'prone') return supine;

  const positioned = {
    ...supine,
    ccw: p.ccw * PRONE.chestWallFactor,
    pab0: p.pab0 + PRONE.abdominalRise,
    pOpen: Math.max(5, (p.pOpen ?? 20) - PRONE.openingPressureDrop),
  };
  if (Number(p.collapsed ?? 0) <= 0) return positioned;
  const assessment = recruitmentToInflation(positioned);
  return {
    ...positioned,
    riAchieved: assessment.ratio,
    riAssessment: assessment,
  };
}
