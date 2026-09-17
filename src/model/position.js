// Body position.
//
// Turning a patient prone changes three mechanical things at once, and the
// haemodynamic result is the sum of effects that pull in opposite directions —
// which is why the published haemodynamic findings are mixed. Rather than
// assert an outcome, the model applies the three mechanical changes and lets
// the outcome fall out of them, so the balance can be inspected.

import { normalizeRecruitmentParameters } from './recruitment.js';

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

/** Position changes pressures and mechanics, preserving the lung's potential. */
export function resolveParams(parameters) {
  // Compatibility for isolated analyses with an old prescription. Simulator
  // normalizes at reset, so live integration never enters this branch.
  const p = Object.hasOwn(parameters, 'riRatio')
    ? normalizeRecruitmentParameters(parameters) : parameters;
  const supine = { ...p, openableDiseasedFraction: p.reopenable ?? 0 };
  if (p.position !== 'prone') return supine;
  return {
    ...supine,
    ccw: p.ccw * PRONE.chestWallFactor,
    pab0: p.pab0 + PRONE.abdominalRise,
    pOpen: Math.max(5, (p.pOpen ?? 20) - PRONE.openingPressureDrop),
  };
}
