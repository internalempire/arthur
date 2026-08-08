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

---

## 1. Calibration

Baseline (70 kg adult, passive volume control, VT 450 mL, PEEP 5, RR 14):

| | Model | Expected |
|---|---|---|
| Cardiac output | 5.0 L/min | 4.5–6.0 |
| Arterial pressure | 120/82, mean 96 | — |
| CVP | 1.5 mmHg | 0–6 |
| Pulmonary artery | 22/12, mean 17 | 15–25 / 8–15 |
| Wedge | 10 mmHg | 6–12 |
| Mean systemic filling pressure | 9 mmHg | 8–12 |
| PVR | 1.3 Wood units | 0.3–2.0 |
| LV ejection fraction | 49% | 55–70 (see limitations) |
| Plateau pressure | 9.5 cmH₂O | — |

Behaviour was checked against the sources rather than only against resting
numbers. The following all reproduce:

- PEEP 0 → 20: cardiac output 5.2 → 3.7 L/min, CVP 0.5 → 4.5, Pmsf 7.6 → 12.5.
  The gradient for venous return is partly defended by the abdomen, as Fessler
  and van den Berg describe.
- Spontaneous inspiration lowers CVP below zero while cardiac output rises.
- Hypovolaemia: pulse pressure variation 15%, and a 500 mL bolus raises cardiac
  output from 3.7 to 6.2 L/min. At euvolaemia the same bolus gains about 20%
  and variation is 3%.
- ARDS with right ventricular failure: RV:LV end-diastolic ratio 1.9, PVR 4.1
  Wood units. Across a PEEP titration PVR falls steadily (6.3 Wood units at
  PEEP 0 to 3.3 at PEEP 20) as the collapsed lung is recruited toward the
  J-curve nadir. Whether that buys output depends on filling: at the preset's
  stressed volume it does not, and cardiac output falls throughout
  (3.51 → 2.65 L/min); at 1050 mL of stressed volume a broad optimum appears
  around PEEP 3–8.
- COPD with a short expiratory time: 6.4 cmH₂O of intrinsic PEEP appears with no
  change in the set PEEP.
- Intra-abdominal hypertension raises Pmsf to 19 mmHg while *lowering* cardiac
  output, because the closing pressure of the vena cava rises with it.

---

## 2. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.

- **No autonomic control.** No baroreflex, no chemoreflex. Heart rate, vascular
  tone and contractility only change when you change them. Real patients defend
  their blood pressure; this one does not, so falls in cardiac output are larger
  and more sustained than you would see at the bedside.
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
- **Forward Euler.** Stable at the shipped time step and parameter ranges, but
  extreme combinations at the ends of several sliders at once can be pushed into
  oscillation. Reset restores a settled state.
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
