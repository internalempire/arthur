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

  // Dorsal regions recruit. The gain is proportional to how much lung is
  // collapsed in the first place: a normal lung has nothing to recruit and
  // gains nothing, which is why proning a normal patient is not a lung
  // recruitment manoeuvre.
  recruitmentGain: 0.25,
};

const NORMAL_FRC = 2.2; // L — the volume the recruitment gain aims at

/**
 * The parameters the model actually integrates with. Supine returns the user's
 * values unchanged; prone applies the three mechanical changes above.
 *
 * Position is resolved here rather than written back into the controls so that
 * the sliders keep showing the patient's supine mechanics — turning someone
 * over does not change how stiff their lung is.
 */
export function resolveParams(p) {
  if (p.position !== 'prone') return p;
  return {
    ...p,
    ccw: p.ccw * PRONE.chestWallFactor,
    pab0: p.pab0 + PRONE.abdominalRise,
    frc: p.frc + PRONE.recruitmentGain * Math.max(0, NORMAL_FRC - p.frc),
  };
}
