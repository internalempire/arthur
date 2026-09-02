# The model

What the simulator computes, why it is built this way, and where it stops being
trustworthy.

Notation follows the sources: respiratory pressures in cmH₂O, vascular pressures
in mmHg, converted at 1 mmHg = 1.3595 cmH₂O in `src/model/units.js`.

---

## The model itself

The README is the project overview. Clinician-facing physiology, implementation
choices and limits live in the [web manual](../manual/home.md); the code and
executable tests remain the source of truth for exact equations and numerical
contracts. Keeping several prose copies of exact numbers is how earlier versions
of this file drifted from the model.

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
| Cardiac output | 5.4 L/min | 4.5–6.0 |
| Arterial pressure | 119/81, mean 102 | — |
| Heart rate (baseline = effective, reflex off) | 75 | — |
| CVP | 0.9 mmHg | 0–6 |
| Pulmonary artery | 19/9, mean 14 | 15–25 / 8–15 |
| Wedge surrogate | 7 mmHg | 6–12 |
| Mean systemic filling pressure | approximately 9 mmHg | 8–12 |
| PVR coefficient | 1.2 Wood units | 0.3–2.0 |
| LV ejection fraction | 56% | 55–70 |
| Plateau pressure | 9.6 cmH₂O | — |

The aggregate baroreflex is off in this reference state. The selected baseline
rate and the effective rate are therefore both 75/min. This deliberately exposes
the unopposed mechanical model before autonomic compensation is added.

Behaviour was checked against the sources rather than only against resting
numbers. The following all reproduce:

- PEEP 0 → 20: cardiac output 5.5 → 4.3 L/min, CVP −0.7 → 5.6, Pmsf 7.4 → 12.4.
  The gradient for venous return is partly defended by the abdomen, as Fessler
  and van den Berg describe.
- Spontaneous inspiration lowers CVP below zero while cardiac output rises.
- Hypovolaemia: a 500 mL stressed-volume step raises cardiac output more from an
  underfilled starting point than from the plateau of the model RV-function curve.
  PPV is displayed descriptively but is not used as the validation target.
- ARDS with right ventricular failure is checked as a multi-observable
  phenotype rather than accepted because its R/I ratio alone is plausible. At
  the shipped PEEP, end-expiratory pleural and transpulmonary pressure, plateau
  pressure, measured respiratory compliance, filling pressures, pulmonary
  vascular load and RV:LV size must all occupy the declared teaching range.
  At high PEEP the recruitable and non-recruitable versions must then separate:
  recruitment opens more lung and reduces the pulmonary vascular and RV cost.
  Current numerical outputs are generated from the executable preset in the
  manual and enforced by the scenario-interpretability suite.
- COPD with expiratory flow limitation: at external PEEP 5, about 6.8 cmH₂O of
  intrinsic PEEP and 781 mL of dynamic trapped volume raise CVP while cardiac
  output falls. Slowing respiratory rate from 26 to 12/min reduces those to
  about 1.3 cmH₂O and 150 mL and restores output. External PEEP 0 → 5 leaves
  total PEEP and absolute EELV almost unchanged below the choke; higher PEEP
  becomes true back-pressure. The hyperinflated lung remains on the right limb
  of the J-curve, but its resistance coefficient changes only modestly, around
  1.20–1.27 WU within a breath. The acute lesson is impaired filling from
  persistent intrathoracic pressure, not simulated chronic pulmonary vascular
  disease.
- Intra-abdominal hypertension raises Pmsf to 21 mmHg while *lowering* cardiac
  output, because the closing pressure of the vena cava rises with it.

---

## 2. The lung and chest wall are independent elastic elements

The normal reference is calibrated to 2.2 L, where lung recoil is +5 cmH₂O and
relaxed wall recoil is −5 cmH₂O. That calibration no longer follows every lung
phenotype. The wall has its own sigmoid pressure–volume relation: approximately
linear around tidal breathing, with progressive stiffening toward the volume
extremes. Passive volume is solved from the point at which lung and wall recoil
are equal and opposite.

This changes the disease logic without adding a compartment. A collapsed, stiff
lung meets the unchanged wall at a lower volume and a higher transpulmonary
pressure. A lung with lost recoil meets it higher. Neither result is supplied as
an FRC input. The `ccw` control changes local wall slope; the separate `cwLoad`
control shifts the relaxed curve and resting pressure. The obesity and abdominal-
hypertension presets can therefore contain stiffness and load without treating
them as the same lesion.

The implementation deliberately stops at one aggregate wall. It has no rib-
cage/diaphragm separation, pleural gradient or anthropometric load prediction.
Rahn et al. and Agostoni and Hyatt establish the independent relaxation-curve
construction; Pereira et al. support a sigmoid representation in mechanically
ventilated acute respiratory failure. These sources support the topology, not
the model's remote asymptotes as universal human constants.

## 3. Volume, venous tone and compliance are separate

The adjustable `stressedVolume` is the baseline amount above the systemic
venous zero-pressure volume. Moving the control by 500 mL adds or removes 500 mL
of actual blood from that reservoir. It is an instantaneous teaching manoeuvre,
not a model of infusion kinetics or transcapillary redistribution.

When enabled, the baroreflex does something different. Each unit of positive sympathetic
outflow lowers the unstressed volume by 200 mL and therefore mobilises the same
amount as stressed volume. The checkbox is off by default; the retained
user-facing sensitivity changes how rapidly a
pressure error approaches full response, but the outflow is bounded and cannot
mobilise more than 200 mL. Total blood and the selected compliance remain
unchanged.
The elastic component of mean systemic filling pressure is then stressed volume
divided by compliance; abdominal pressure contributes separately through the
splanchnic coupling already present in the model.

This is the important physiological distinction. Increased vascular tone shifts
the volume–pressure relation left with little change in slope, and human septic
shock data support the “fluid-like” increase in stressed volume and mean
systemic pressure produced by norepinephrine. The model does not claim that 200
mL is a measured universal value: it was selected to preserve the prior
macroscopic response while correcting the mechanism. In the shipped septic
phenotype, the optional reflex mobilises part of that reserve at unchanged
total blood volume and venous compliance. Exact scenario values belong to the
executable scenario checks rather than this mechanistic summary.

---

## 4. Pulmonary transit is a volume-to-flow relation, not a pressure delay

The pulmonary artery and vein were already compartments in series, but their
small compliance time constants transmitted an isolated fall in RV output to LV
stroke volume after roughly one beat. The model places a 160 mL pressureless
transport pathway between pulmonary arterial inflow and pulmonary venous
delivery. Its physical blood volume remains part of the conserved circulation.

Mean PA-to-LA transit is now estimated from the central-volume relation:

`mean transit time = represented pulmonary blood volume / mean RV output`.

Represented pulmonary blood volume is the sum of the PA, staged pathway and PV
compartments. The last completed RV stroke volume times heart rate supplies a
mean forward flow without treating the normal zero pulmonic-valve flow of
diastole as circulatory arrest. The eight stages use the share of whole-circuit
time corresponding to their original 160 mL allocation, bounded to 0.8–6 s and
adapted over 2 s to prevent respiratory beat-to-beat aliasing.

This distinction matters. Pulmonary venous pressure still acts immediately on
the pressure gradient across the lung; a pressure wave is not held back with the
blood volume.
What is buffered is blood flow: after an isolated fall in RV contractility the
first LV beat remains essentially unchanged, the second changes little, and the
effect becomes detectable over the next two to three beats. During positive-
pressure ventilation this places the delayed LV stroke-volume nadir in
expiration, after the inspiratory reduction in RV filling.

The pathway adds no blood. Its initial 160 mL was reallocated from the former
pulmonary arterial and venous zero-pressure volumes while preserving their
stressed volumes and resting pressures. It also leaves the direct pulmonary
venous “piston” route intact: inflation can still squeeze blood already on the
venous side toward the LV before the RV effect arrives.

At the healthy operating point the staged part remains close to the former 2.0 s
calibration, preserving the reported 2–3-beat ordering. It now shortens when
forward flow is high relative to pulmonary volume and lengthens when output is
low or blood accumulates in the pulmonary circuit. Eight stages introduce some
dispersion rather than returning a rigid delayed copy of the RV signal.

The displayed whole-circuit value is still a model estimate, not a contrast
transit measurement. Measurement landmarks matter: an RV-to-LV CMR bolus time
includes chamber and sampling effects that this PA-to-LA volume relation does
not. Regional capillary perfusion and patient-specific transit distributions
remain absent.

---

## 5. R/I is a manoeuvre-defined phenotype

The user-facing recruitability control is the recruitment-to-inflation ratio
measured over a passive PEEP 5 → 15 cmH₂O reference manoeuvre. The model computes
the change in end-expiratory lung volume, subtracts the volume predicted from
low-PEEP respiratory-system compliance, and divides the resulting recruited
compliance by that low-PEEP compliance. It then solves for the smallest internal
fraction of diseased units that reproduces the requested R/I.

This prevents four concepts from collapsing into one slider: `collapsed` is how
much lung is closed, `clung` is the local compliance of aerated tissue,
`lungCapacity` is the completely open volume ceiling, and R/I is how much
recruitment the specified pressure step produces relative to inflation of the
baby lung. The internal openable fraction is capped at one. If
the requested R/I would require more lung than is collapsed, or the selected
opening pressure lies outside the manoeuvre, the achieved value is shown with a
caution instead of silently changing collapse.

The latent translation is constrained against the Cappio Borlino cohort with
one shared mechanical phenotype. At group-median R/I 0.35 and 0.72, model
recruited volume and lung compliance at low and high PEEP must remain inside the
corresponding Table 2 IQRs. The resulting openable shares increase from about 7%
to 16% of the whole lung. Those shares are model inferences, not measurements:
the paper reports grouped respiratory mechanics and does not identify an
anatomical recruitable fraction or patient-level parameter combination.

The 0.5 split is retained only as the cohort median used by Chen et al. and by
Cappio Borlino et al.; it is not a validated treatment threshold. The model also
lacks a separate airway-opening-pressure measurement, so it cannot apply that
bedside correction. Finally, R/I does not establish that high PEEP avoids
overdistension, and the simulator does not present it as an optimal-PEEP rule.

---

## 6. What the occlusion manoeuvres show

Holding the airway freezes lung volume and pleural pressure, and the circulation
settles. Each hold contributes one measured pressure–flow pair, and a series of
them draws an extrapolated venous return relation. The points are measured; its
zero-flow intercept is not.

The model reproduces the method's known confound rather than hiding it. Four
inspiratory holds at increasing tidal volumes produce a much flatter fitted
pressure–flow relation than the model's effective resistance to venous return
would predict, and the extrapolated zero-flow intercept lies far above the
internal Pmsf. The current values and exact protocol are generated directly in
the [manual page](../manual/pmsf-and-occlusions.md). Both protocols behave the
same way — varying tidal volume at fixed PEEP, or varying PEEP between holds —
so it is not merely a plotting artefact.

The mechanism is the abdominal coupling: an occlusion holds the lung inflated,
which pressurises the splanchnic reservoir, which raises mean systemic filling
pressure. The curve therefore moves to the right by an amount that grows with
the plateau pressure, and the points sample a family of curves rather than one.
Reading the resulting intercept as a direct mean systemic filling pressure
overestimates it. Berger et al. found an excess of 3.0 (SD 5.1) mmHg across 37
paired measurements in anaesthetised pigs, much smaller than this model's gap.
Conversely, human postoperative and septic studies using the hold method report
absolute estimates around 15–33 mmHg, so the porcine difference is not a safe
human calibration target. The interface therefore names the value for what it
is — an extrapolated intercept — and uses it to teach the bias, not quantify a
patient's Pmsf.

---

## 7. The Guyton panel uses two time scales

The explicit IVC is a compliant compartment, so venous inflow into the right
atrium can briefly differ from RV output even during passive ventilation. A
one-heartbeat mean removes atrial pulsation but does not remove that respiratory
storage. It is therefore retained as the moving trail, not used as the settled
operating point.

The filled simulated-mean point averages right atrial pressure and IVC inflow
over one complete breath. In a settled periodic circulation, every compartment
returns to its starting volume over that interval, so mean venous return, RV
output and LV output must agree. The hollow crossing is evaluated from curves
using the same respiratory mean.

The local RV-function curve is anchored to respiratory-mean RV end-diastolic
and end-systolic volumes. This avoids assuming that mean right atrial pressure
is the same as RV end-diastolic transmural pressure. The resulting overlap is an
internal conservation and curve-consistency check; it is not an independent
validation against human cardiac-function data.

## 8. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.

- **One reflex arc, no chemoreflex.** The optional arterial baroreflex is present as a
  bounded, single sympathetic outflow with one 15 s time constant; the real
  vagal and sympathetic arcs to heart rate, resistance, venous tone and
  contractility have different latencies, and there is no chemoreflex at all.
  Heart rate receives an additive reserve rather than a percentage of the
  selected baseline, but this only removes an extreme double count: it is not a
  patient-specific chronotropic model. Venous tone has one fixed recruitment
  coefficient rather than a drug-specific dose response. It is off by default;
  use the checkbox to compare uncompensated mechanics with aggregate pressure
  defence, and do not use the transient to infer a
  human baroreflex latency. The afferent signal is low-pass mean pressure rather
  than pulsatile arterial-wall stretch. It does not sense PVR, mPAP, right-heart
  distension or hypoxaemia directly: an increased pulmonary load recruits the
  reflex only if its downstream effect lowers systemic MAP. Clinical presets
  may already encode compensation in their selected heart rate, systemic
  resistance and filling state. There is no coronary circulation, so the model
  also omits the direct benefit that defending systemic pressure can have on
  right-ventricular coronary perfusion.
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
- **Pulse pressure variation is non-monotonic at both filling extremes.** The
  model no longer claims a monotonic separation between a fluid responder and
  non-responder. At severe underfilling, absent zone-III piston contribution and
  stronger low-flow pulmonary filtering can produce a small arterial variation
  despite marked preload reserve. This is documented as a quantitative model
  limitation, not a human hypovolaemia rule. At high filling, the direct
  pulmonary venous piston can raise variation again even when additional filling
  buys little output.

  The filled-end rise has a represented mechanism. Once the capillaries are open
  along their whole length, lung inflation can squeeze blood forward into the
  left atrium with each breath — the `piston` term. Removing that term suppresses
  the rise. This is the direct-filling component of the classical Δup.

  The other classical sources are still absent:
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
- **Ejection fraction is not an echocardiographic calibration.** The canonical
  double-Hill activation now reaches a true unit peak, so the selected Ees is the
  peak active elastance and baseline EF is about 56%. The number still belongs
  to a lumped chamber with no ventricular geometry, regional wall motion,
  valvular regurgitation or imaging method, and must not be compared directly
  with an individual patient's EF.
- **The PV panel separates intrinsic activation from effective chamber ESPVR.**
  The selected Ees is the active term inside the ventricular pressure equation.
  Total end-systolic pressure also contains ventricular-interdependence terms,
  especially LV and septal support of RV pressure. The displayed local ESPVR
  therefore passes through the actual end-systolic point and may have a steeper
  effective slope than the selected intrinsic RV Ees. It is a single-beat visual
  construction, not a multi-load conductance-catheter measurement.
- **Pulmonary transit is an eight-stage aggregate approximation.** Its mean time
  now changes with represented pulmonary blood volume and RV output, but it
  still has no regional perfusion, shunt, bronchial flow or contrast kinetics.
  The 0.8–6 s staged bounds and 2 s adaptation are numerical guardrails, and the
  displayed PA-to-LA estimate must not be interpreted as a measured RV-to-LV
  contrast transit time or as quantitative PPV validation.
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
- **Pulmonary vascular load is an effective aggregate.** The mechanical
  coefficient integrated by the model is reported separately from catheter-
  derived `(mPAP − wedge) / CO`, and an alveolar waterfall contributes its own
  closing-pressure load. The model does not additionally separate thrombotic
  obstruction, non-alveolar critical closing pressure, blood viscosity or
  haematocrit, pressure/flow-dependent vascular recruitment and distension,
  characteristic impedance or wave reflection. Acute pulmonary embolism is
  therefore represented by a raised effective `pvrBase`, not by clot anatomy or
  a claim that calibre alone explains the load. This is sufficient to study the
  RV response but not to infer the physical composition of a measured PVR.
- **EFL is one expiratory choke.** It is a binary maximal-flow envelope with a
  fixed 4.5 s severe-obstruction anchor, not a distribution of fast and slow
  units. It reproduces the directional low-PEEP plateau and the haemodynamic
  cost above the choke, but not regional trapping, airway closure, secretions,
  bronchodilation, CO₂, work of breathing, triggering or dyssynchrony. Dynamic
  trapped volume is measured against this model's own static equilibrium and
  external PEEP must not be titrated from its threshold.
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
15. Young DB. Venous return. In: *Control of Cardiac Output*. Morgan & Claypool
    Life Sciences; 2010. NCBI Bookshelf NBK54476.
16. Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of
    volume expansion on mean systemic pressure in septic shock. *Crit Care*
    2021;25:302. doi:10.1186/s13054-021-03711-5.
17. Pinsky MR. The effects of mechanical ventilation on the cardiovascular
    system. *Crit Care Clin* 1990;6:663–678.
18. Fougères E, Teboul JL, Richard C, et al. Hemodynamic impact of a positive
    end-expiratory pressure setting in acute respiratory distress syndrome:
    importance of the volume status. *Crit Care Med* 2010;38:802–807.
19. Chen L, Del Sorbo L, Grieco DL, et al. Potential for lung recruitment
    estimated by the recruitment-to-inflation ratio in acute respiratory
    distress syndrome. *Am J Respir Crit Care Med* 2020;201:178–187.
    doi:10.1164/rccm.201902-0334OC.
20. Berger D, Moller PW, Weber A, et al. Effect of PEEP, blood volume, and
    inspiratory hold maneuvers on venous return. *Am J Physiol Heart Circ
    Physiol* 2016;311:H794–H806. doi:10.1152/ajpheart.00931.2015.
21. Maas JJ, Pinsky MR, Geerts BF, et al. Estimation of mean systemic filling
    pressure in postoperative cardiac surgery patients with three methods.
    *Intensive Care Med* 2012;38:1452–1460.
    doi:10.1007/s00134-012-2586-0.
22. Ranieri VM, Giuliani R, Cinnella G, et al. Physiologic effects of positive
    end-expiratory pressure in patients with chronic obstructive pulmonary
    disease during acute ventilatory failure and controlled mechanical
    ventilation. *Am Rev Respir Dis* 1993;147:5–13.
23. van den Berg B, Stam H, Bogaard JM. Effects of PEEP on respiratory
    mechanics in patients with COPD on mechanical ventilation. *Eur Respir J*
    1991;4:561–567.
24. Pepe PE, Marini JJ. Occult positive end-expiratory pressure in mechanically
    ventilated patients with airflow obstruction: the auto-PEEP effect.
    *Am Rev Respir Dis* 1982;126:166–170.
25. Tuxen DV, Lane S. The effects of ventilatory pattern on hyperinflation,
    airway pressures, and circulation in mechanical ventilation of patients
    with severe air-flow obstruction. *Am Rev Respir Dis* 1987;136:872–879.
26. Rahn H, Otis AB, Chadwick LE, Fenn WO. The pressure-volume diagram of the
    thorax and lung. *Am J Physiol* 1946;146:161–178.
    doi:10.1152/ajplegacy.1946.146.2.161.
27. Agostoni E, Hyatt RE. Static behavior of the respiratory system. In:
    *Handbook of Physiology, The Respiratory System*. 1986:113–130.
    doi:10.1002/cphy.cp030309.
28. Pereira C, Bohé J, Rosselli S, et al. Sigmoidal equation for lung and chest
    wall volume-pressure curves in acute respiratory failure. *J Appl Physiol*
    2003;95:2064–2071. doi:10.1152/japplphysiol.00385.2003.
