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
trustworthy. Dated rationale for changes to those claims is kept in
[MODEL_DECISIONS.md](MODEL_DECISIONS.md).

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
- ARDS with right ventricular failure: at its shipped PEEP the RV:LV
  end-diastolic ratio is 1.65, the resistance coefficient is 4.09 WU and the
  catheter-derived value is about 4.98 WU. Across PEEP 0 → 20 the coefficient
  falls 4.42 → 3.89 while derived PVR rises 4.44 → 5.55 WU and output falls
  4.14 → 3.73 L/min. Setting `recruitable` to zero separates the response: the
  coefficient rises 4.57 → 4.62, derived PVR 4.93 → 7.85 and output falls
  3.97 → 3.24 L/min.
- COPD with a short expiratory time: 6.4 cmH₂O of intrinsic PEEP appears with no
  change in the set PEEP, and the hyperinflated lung sits on the right limb of
  the J-curve at 1.25 Wood units averaged over a breath. That resistance swings
  from 1.23 to 1.28 within the breath, because it is instantaneous and follows
  lung volume; in presets with a smaller tidal excursion the swing is 0.3 or
  less.
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
- **Variation can report right ventricular afterload rather than preload.** As
  lung compliance falls, airway pressure swings the pulmonary
  vessels harder within each breath, and more of the pulse pressure variation is
  the right ventricle ejecting against a cyclically varying afterload. The model
  exposes that afterload swing as a mechanistic output, but the spatially lumped
  PVR cannot support a quantitative ARDS cutoff or magnitude claim. Right
  ventricular dilatation remains an applicability caution, but is a late and
  incomplete proxy for the mechanism.
- **No gas exchange.** There is no oxygen, CO₂, pH or shunt. Hypoxic pulmonary
  vasoconstriction is a coefficient on derecruited lung, not a consequence of an
  alveolar oxygen tension.
- **Pulse pressure variation reproduces one false positive, weakly, and misses
  the rest.** The true positive is reproduced well — high variation in the fluid
  responder, low in the non-responder. This entry previously said the model
  produced no false positives at all; that was written before the well-filled end
  of the range was examined, and it is wrong.

  There is one, and it has a mechanism. Above about 900 mL of stressed volume the
  West zone III fraction reaches 96–100%, and with the capillaries open along
  their whole length the lung can squeeze blood forward into the left atrium with
  each breath — the `piston` term. Variation then rises again, from 1.7% at 900 mL
  to 3.6% at 1400 mL, in patients who gain nothing from a bolus. Setting `piston`
  to zero collapses it to 1.1%, which is how the mechanism was identified. This is
  the direct-filling component of the classical Δup, and it appears exactly where
  it should: only when the patient is full enough for zone III to be everywhere.

  It is a weak false positive — 3.6% would not mislead anyone, where the real
  thing reaches double figures. And the other classical sources are still absent:
  irregular, variable-depth efforts and arrhythmia, neither of which this model
  has, since effort is a reproducible half-sine and the rhythm is metronomic.

  The preload reserve is not fooled by it, because it reads the curves rather
  than the waveform. That is the argument for having both on screen.

- **Variation is not quantitatively validated as a fluid-response test.** It
  scales with driving pressure and retains the expected qualitative dependence
  on loading conditions, but no 13% cutoff or PPV–fluid-response regression is
  applied. An earlier version reproduced the Michard 2000 relation under the
  study's high-driving-pressure ventilation and promoted that agreement to a
  model calibration. That use has been retired because it is not generalisable
  enough for this didactic model. Low tidal volume remains an applicability
  caution; it is not “corrected” by a tidal-volume challenge.
- **Ejection fraction runs low** (≈50% at baseline). Ejection ends when cavity
  pressure falls below aortic pressure, and with a double-hill activation that
  happens a little early. Stroke volume, cardiac output and the loop shape are
  right; the ratio is pessimistic by roughly 5–10 points.
- **Two pulmonary compartments give almost no transit delay.** In a real chest
  the fall in right ventricular output reaches the left ventricle two or three
  beats later, which separates the Δup and Δdown components of pulse pressure
  variation. Here they largely overlap and partly cancel. This is a question
  about the volumes and compliances of the two vascular compartments in series,
  and is unrelated to the lung being split into two populations of units.
- **Hysteresis is optional and instantaneous.** With the flag off, units open and
  close at the same pressure and nothing done to the lung lasts. With it on they
  close at `pClose`, so a recruitment manoeuvre leaves something behind and a
  decremental PEEP trial lands somewhere different from an incremental one. What
  is still missing is the time course: a unit opens within the step that reaches
  its threshold, so how long a manoeuvre is held makes no difference, only how
  high it goes. Real recruitment takes seconds to minutes, which is why
  manoeuvres are held rather than touched.
- **The pulmonary circulation remains spatially lumped.** Open and derecruited
  unit populations now have separate vascular conductances in parallel, and the
  alveolar waterfall is limited to a fixed aggregate share. There are still no
  dependent/non-dependent regions, gravitational pressure gradients, local West
  zones or regional HPV. This corrects the previous all-or-none whole-lung
  behaviour without claiming to reproduce the heterogeneity that makes ARDS
  ARDS.
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
- **No valvular disease, no arrhythmia and no bronchospasm heterogeneity.**

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
11. Cappio Borlino S, et al. The effect of positive end-expiratory pressure on
    pulmonary vascular resistance depends on lung recruitability in patients
    with ARDS. *Am J Respir Crit Care Med* 2024;210:900–907.
    doi:10.1164/rccm.202402-0383OC.
12. Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical
    bedside implications. *Intensive Care Med* 2026.
    doi:10.1007/s00134-026-08583-3.
13. Thomas LJ Jr, Griffo ZJ, Roos A. Effect of negative pressure inflation of
    the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–456.
14. Hakim TS, Michel RP, Chang HK. Effect of lung inflation on pulmonary
    vascular resistance by arterial and venous occlusion. *J Appl Physiol*
    1982;53:1110–1115.
