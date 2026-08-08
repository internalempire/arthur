# The model

What the simulator computes, why it is built this way, and where it stops being
trustworthy.

Notation follows the sources: respiratory pressures in cmH₂O, vascular pressures
in mmHg, converted at 1 mmHg = 1.3595 cmH₂O in `src/model/units.js`.

---

## The model itself

The equations, the constants, every parameter and every scenario variable are
documented in [the README](../README.md), which is the single source of truth
for them. Keeping a second copy here is how this file came to quote three
numbers the model no longer produced.

What follows is the part that does not belong in a reference: how the model was
calibrated, what was checked against the sources, and where it stops being
trustworthy.

Since the August 2026 audit the numbers here are also guarded by
`node tests/run.mjs`, which checks volume conservation, compartment positivity
across a sweep of the whole control space, convergence, the direction of eleven
established relationships, agreement between the integrator and the curves drawn
from it, and the scenario table in the README.

---

## 1. Calibration

Baseline (70 kg adult, passive volume control, VT 450 mL, PEEP 5, RR 14):

| | Model | Expected |
|---|---|---|
| Cardiac output | 4.9 L/min | 4.5–6.0 |
| Arterial pressure | 111/75, mean 93 | — |
| Heart rate (after reflex) | 73 | — |
| CVP | 1.5 mmHg | 0–6 |
| Pulmonary artery | 22/13, mean 17 | 15–25 / 8–15 |
| Wedge | 10 mmHg | 6–12 |
| Mean systemic filling pressure | 8.8 mmHg | 8–12 |
| PVR | 1.3 Wood units | 0.3–2.0 |
| LV ejection fraction | 50% | 55–70 (see limitations) |
| Plateau pressure | 9.5 cmH₂O | — |

The baroreflex sits slightly withdrawn at rest, because the baseline pressure is
a little above its set point — which is why heart rate reads 73 rather than the
75 on the control.

Behaviour was checked against the sources rather than only against resting
numbers. The following all reproduce:

- PEEP 0 → 20: cardiac output 5.2 → 3.7 L/min, CVP 0.5 → 4.5, Pmsf 7.6 → 12.5.
  The gradient for venous return is partly defended by the abdomen, as Fessler
  and van den Berg describe.
- Spontaneous inspiration lowers CVP below zero while cardiac output rises.
- Hypovolaemia: pulse pressure variation 15%, and a 500 mL bolus raises cardiac
  output from 4.7 to 6.3 L/min. At euvolaemia the same bolus gains about 12%
  and variation is 2%.
- ARDS with right ventricular failure: RV:LV end-diastolic ratio 2.2, resistance
  coefficient 6.6 Wood units against 9.2 derived from mean pulmonary artery
  pressure, wedge and output. Across a PEEP titration from 0 to 20 the
  coefficient falls 7.6 → 6.0 while cardiac output falls throughout,
  3.56 → 2.89 L/min: the preload cost outruns the afterload benefit at every
  step, and filling the patient lifts the curve without changing its shape.
  Setting `recruitable` to zero inverts it — the same collapsed lung,
  consolidated rather than closed, gives 8.0 → 10.4 Wood units and 3.38 → 2.02
  L/min.
- COPD with a short expiratory time: 6.4 cmH₂O of intrinsic PEEP appears with no
  change in the set PEEP.
- Intra-abdominal hypertension raises Pmsf to 19 mmHg while *lowering* cardiac
  output, because the closing pressure of the vena cava rises with it.

---

## 2. What the occlusion manoeuvres show

Holding the airway freezes lung volume and pleural pressure, and the circulation
settles. Each hold contributes one measured pressure–flow pair, and a series of
them draws a venous return curve — the bedside method.

The model reproduces the method's known confound rather than hiding it. Four
inspiratory holds at plateau pressures from 8 to 14 cmH₂O give a fitted slope of
0.27 L/min per mmHg where the model's own resistance to venous return implies
0.73, and an extrapolated mean systemic filling pressure of 20 mmHg where the
model's is 8.8. Both protocols behave the same way — varying tidal volume at
fixed PEEP, or varying PEEP between holds — so it is not a protocol artefact.

The mechanism is the abdominal coupling: an occlusion holds the lung inflated,
which pressurises the splanchnic reservoir, which raises mean systemic filling
pressure. The curve therefore moves to the right by an amount that grows with
the plateau pressure, and the points sample a family of curves rather than one.
Reading the resulting intercept as a mean systemic filling pressure overestimates
it. The magnitude here is larger than published comparisons suggest, which is a
reason to treat the number as a demonstration of the bias rather than a
calibrated estimate of it.

---

## 3. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.

- **One reflex arc, no chemoreflex.** The arterial baroreflex is present as a
  single sympathetic outflow with one time constant; the real arcs to heart rate,
  resistance, venous tone and contractility have different latencies, and there
  is no chemoreflex at all. Set the gain to zero to see the uncompensated model.
- **No gas exchange.** There is no oxygen, CO₂, pH or shunt. Hypoxic pulmonary
  vasoconstriction is a coefficient on derecruited lung, not a consequence of an
  alveolar oxygen tension.
- **Pulse pressure variation is underdamped in the false-positive direction.**
  The model reproduces the *true* positive well — high variation in the fluid
  responder, low in the non-responder. It does **not** reproduce the classic
  false positives. A well-filled patient making 20 cmH₂O pleural swings still
  shows about 4% variation, because the preload pathway is the only route to
  variation here and that ventricle is on the flat part of its Starling curve.
  Real false positives come largely from irregular, variable-depth efforts and
  from arrhythmia, neither of which this model has: effort is a perfectly
  reproducible half-sine and the rhythm is metronomic.
- **Ejection fraction runs low** (≈50% at baseline). Ejection ends when cavity
  pressure falls below aortic pressure, and with a double-hill activation that
  happens a little early. Stroke volume, cardiac output and the loop shape are
  right; the ratio is pessimistic by roughly 5–10 points.
- **Two pulmonary compartments give almost no transit delay.** In a real chest
  the fall in right ventricular output reaches the left ventricle two or three
  beats later, which separates the Δup and Δdown components of pulse pressure
  variation. Here they largely overlap and partly cancel.
- **The pulmonary circulation is lumped.** One PVR and one zone-III fraction for
  the whole lung. Regional heterogeneity — the thing that actually makes ARDS
  ARDS — is absent.
- **Forward Euler.** Stable across the shipped ranges, and flows are now limited
  so no compartment can be drained past a 1 mL floor; a 250-configuration sweep
  of the whole control space finds no negative volume, no non-finite value and
  no ejection fraction outside 0–100%. Extreme combinations still reach states
  the equations do not describe — those suspend the readouts and say why, rather
  than continuing to print numbers.
- **Face validity, not quantitative validation.** What is verified is internal
  consistency, conservation, convergence and the *direction* of established
  relationships. There is no calibration source for each empirical constant, no
  sensitivity analysis, no comparison against experimental time series, and no
  identifiability analysis — different parameter combinations can produce the
  same output. This is a mechanistic teaching model calibrated to reproduce
  qualitative relationships, not a patient-specific predictor.
- **No valvular disease, no arrhythmia, no bronchospasm heterogeneity, no
  recruitment hysteresis.**

## Sources

1. Kenny JE. *An Approach to Mechanical Heart-Lung Interaction*, 1st ed.
   Toronto: Spectral Envelope, 2020. Chapters 1–4 supply the integration of the
   Campbell and Guyton diagrams that this simulator is organised around.
2. Mahmood SS, Pinsky MR. Heart-lung interactions during mechanical ventilation:
   the basics. *Ann Transl Med* 2018;6(18):349.
3. Yuriditsky E, Mireles-Cabodevila E, Alviar CL. How I Teach: Heart–Lung
   Interactions during Mechanical Ventilation. Positive Pressure and the Right
   Ventricle. *ATS Scholar* 2025;6(1):94–108.
4. Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various
   right atrial pressures and the normal venous return curve. *Am J Physiol*
   1957;189:609–15.
5. Permutt S, Riley RL. Hemodynamics of collapsible vessels with tone: the
   vascular waterfall. *J Appl Physiol* 1963;18:924–32.
6. Simmons DH, Linde LM, Miller JH, O'Reilly RJ. Relation between lung volume
   and pulmonary vascular resistance. *Circ Res* 1961;9:465–71.
7. Suga H, Sagawa K. Instantaneous pressure-volume relationships and their ratio
   in the excised, supported canine left ventricle. *Circ Res* 1974;35:117–26.
8. Fessler HE, Brower RG, Wise RA, Permutt S. Effects of positive end-expiratory
   pressure on the gradient for venous return. *Am Rev Respir Dis* 1991;143:19–24.
9. Jardin F, Genevray B, Brun-Ney D, Bourdarias JP. Influence of lung and chest
   wall compliances on transmission of airway pressure to the pleural space in
   critically ill patients. *Chest* 1985;88:653–8.
10. Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation
    with mechanical ventilation. *Am J Respir Crit Care Med* 2019;199:22–31.
