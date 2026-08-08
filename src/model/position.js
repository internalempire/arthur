// Body position.
//
// Turning a patient prone changes three mechanical things at once, and the
// haemodynamic result is the sum of effects that pull in opposite directions —
// which is why the published haemodynamic findings are mixed. Rather than
// assert an outcome, the model applies the three mechanical changes and lets
// the outcome fall out of them, so the balance can be inspected.

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
 * The parameters the model actually integrates with. Supine returns the user's
 * values unchanged; prone applies the three mechanical changes above.
 *
 * Position is resolved here rather than written back into the controls so that
 * the sliders keep showing the patient's supine mechanics — turning someone
 * over does not change how stiff their lung is.
 *
 * Note what is missing: end-expiratory lung volume does not rise here, though it
 * does in a recruitable patient at the bedside. That is the same gap stated in
 * lung.js — recruited units are a vascular and gas-exchange event in this model,
 * not a mechanical one — and it is left in one place rather than patched here.
 */
export function resolveParams(p) {
  if (p.position !== 'prone') return p;
  return {
    ...p,
    ccw: p.ccw * PRONE.chestWallFactor,
    pab0: p.pab0 + PRONE.abdominalRise,
    pOpen: Math.max(5, (p.pOpen ?? 20) - PRONE.openingPressureDrop),
  };
}
