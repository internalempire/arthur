# Model decisions

This is the durable decision log for substantive physiological changes. It
records why a behaviour was added, changed or retired so that later work — by a
person or another language model — does not have to reconstruct the rationale
from code or commit history alone.

Historical investigations remain in the dated postmortem. This file records the
current decision.

## 2026-08-14 — Retire weaning and make LV unloading an explicit matched experiment

### Decision

- Remove the `weaning` preset. The physiological phenomenon remains real, but
  the compact model cannot reproduce it with enough clinical fidelity to make a
  preset more informative than misleading.
- Retain one `lv-failure` preset and make its teaching experiment explicit:
  compare the same settled patient at PEEP 0 and 10 cmH2O.
- Select a severe, afterload-sensitive phenotype (`eesLv=0.6`,
  `lvStiff=0.040`) with a stiff thoracic envelope (`ccw=75`). The latter is
  required to transmit enough airway pressure to pleural pressure for afterload
  relief to exceed the simultaneous loss of venous return.
- Judge the intervention from cardiac output averaged over several respiratory
  cycles, not the last completed beat. The beat-level tile deliberately retains
  respiratory variation and is therefore phase-dependent.
- Require the causal signature in an executable check: PEEP must lower LV
  transmural end-systolic pressure, end-systolic volume must fall more than
  end-diastolic volume, and mean output must rise by at least 5%.

### Why

The former two-preset comparison was not controlled: heart rate and respiratory
rate differed as well as ventilatory mode. When those variables were matched,
spontaneous breathing did not raise mean PAOP or lower output. Reproducing
weaning-induced pulmonary oedema would require important mechanisms that are
absent here — work of breathing and myocardial oxygen demand, sympathetic
activation, ischaemia, dynamic mitral regurgitation, central blood-volume
redistribution, fluid filtration and the time course of a spontaneous breathing
trial. Keeping the preset would make a familiar clinical label substitute for a
mechanism the model does not generate.

The LV afterload mechanism itself is already physically present: pleural
pressure is added to LV cavity pressure but not to systemic arterial pressure,
so raising pleural pressure lowers the transmural pressure required for
ejection. In the former `lv-failure` phenotype, preload loss still outweighed
that benefit and output fell slightly. The revised phenotype does not change the
equation; it moves the demonstration to an afterload-dominant part of the same
model. Its low output, high filling pressure and stiff thoracic envelope are
therefore part of the lesson and must remain visible as limitations, not be
presented as the typical cardiogenic-pulmonary-oedema patient.

### Deliberate limits

The revised preset demonstrates one possible haemodynamic response to positive
pressure, not a treatment prediction. It still has no gas exchange, respiratory
muscle work, myocardial oxygen balance, coronary circulation, mitral
regurgitation or pulmonary-oedema fluid kinetics. A different balance of
contractility, filling, vascular resistance and pressure transmission can
produce no output change or a fall despite the same reduction in LV transmural
afterload.

## 2026-08-11 — Keep pulmonary vascular load aggregated at the bedside level

### Decision

- Do not add a separate thrombotic-obstruction or non-alveolar critical-closing-
  pressure state to the pulmonary circuit.
- In the acute pulmonary embolism preset, treat the raised `pvrBase` as an
  **effective aggregate pulmonary vascular load**. It produces the pressure,
  flow and right-ventricular consequences of obstruction without claiming that
  calibre, clot, viscosity, vasomotor tone and closing pressure have been
  anatomically separated.
- Continue to report the model's mechanical resistance coefficient separately
  from catheter-derived `(mPAP − wedge) / CO`. Neither is labelled a pure
  Poiseuille resistance.
- Remove the claim that equal tidal volume guarantees equal PVR. Tidal volume
  moves the lung along the volume-dependent curve, but absolute lung volume,
  aerated-lung strain, recruitment, flow and the alveolar waterfall can still
  make the pulmonary load differ.
- Keep one systemic arterial baroreflex. It responds to filtered systemic MAP,
  not directly to PVR, mPAP, right-heart distension or hypoxaemia. A scenario's
  selected heart rate, systemic resistance and filling can therefore describe
  compensation already present at the moment represented by the preset.

### Why

Kenny's separation of Poiseuille resistance from a right-shifted pressure-flow
relation is analytically useful, particularly in pulmonary embolism. Adding the
second pressure term here would not add a comparably distinct bedside lesson:
the simulator's purpose is to show how an increased effective pulmonary load is
integrated by the right ventricle and then transmitted to left-heart filling and
systemic pressure. A new control would invite unsupported decomposition of a
catheter-derived aggregate while making the central interaction harder to read.

The same restraint does not justify calling the aggregate complete. Real PVR
also varies with pressure/flow-dependent recruitment and distension, viscosity,
haematocrit, regional perfusion, gas tensions, vascular tone and remodelling.
These omissions are interpretability limits, not hidden zero-valued mechanisms.

### Documentation obligation

The future multi-page manual must include a global, scenario-by-scenario audit
of interpretability. For every clinical preset it should distinguish mechanisms
generated by the equations from phenotype already encoded in its starting
parameters, and state which clinically important mechanisms are absent. The
acute pulmonary embolism preset is the immediate example: its tachycardia,
systemic resistance and filling state are selected inputs, while the baroreflex
only adjusts them in response to subsequent systemic MAP error.

### Deliberate limits

There is still no anatomical clot burden, embolic distribution, pulmonary
pressure-flow recruitment curve, blood-rheology model, regional West-zone
network, characteristic impedance, wave reflection, gas exchange, chemoreflex
or coronary circulation. In particular, defending systemic pressure does not
directly improve right-ventricular coronary perfusion in this model. These
features should remain absent unless a later teaching question cannot be
answered honestly without one of them.

## 2026-08-11 — Add one expiratory choke, not a regional COPD lung

### Decision

- Keep loss of recoil (`clung`), linear airway resistance (`raw`) and available
  expiratory time as separate existing mechanisms.
- Add one binary `efl` control. When on, passive expiratory flow cannot exceed a
  volume-dependent maximal-flow envelope. The envelope is expressed as a 4.5 s
  minimum emptying time constant; ordinary `Raw × Crs` flow still applies when
  it is slower.
- Do not add fast and slow lung units, regional airway resistances or new gas
  compartments. The flow cap is the airway analogue of a Starling resistor: at
  the choke, lowering downstream pressure further cannot accelerate expiration.
- Measure dynamic trapped volume as actual end-expiratory lung volume minus the
  passive equilibrium volume at the same applied PEEP. This keeps emphysematous
  static hyperinflation separate from breath-to-breath gas trapping.
- Enable EFL in the COPD preset and leave it off by default elsewhere.

### Why

The former single linear resistance could generate auto-PEEP when expiration
was short, but it could not represent expiratory flow limitation: every change
in mouth pressure changed flow. Consequently, in the COPD preset, external PEEP
0 → 5 cmH₂O raised total PEEP about 6.5 → 11.4 cmH₂O, increased end-expiratory
volume about 3.41 → 3.95 L and reduced cardiac output. That is a reasonable
response for simple resistive incomplete emptying, but not for the flow-limited
phenotype the preset claimed.

In nine passively ventilated COPD patients, PEEP below the critical fraction of
intrinsic PEEP left end-expiratory volume, total PEEP and haemodynamics
substantially unchanged; above the choke it caused further hyperinflation and
reduced cardiac index
([Ranieri et al. 1993](https://pubmed.ncbi.nlm.nih.gov/8420430/)). Similar
downstream-pressure independence below PEEPi was observed by
[van den Berg et al. 1991](https://pubmed.ncbi.nlm.nih.gov/1936227/). Earlier
human studies established occult PEEPi and the circulatory cost of inadvertent
hyperinflation ([Pepe and Marini 1982](https://pubmed.ncbi.nlm.nih.gov/7046541/);
[Tuxen and Lane 1987](https://doi.org/10.1164/ajrccm/136.4.872)). The key
heart–lung lesson is therefore the existence of a choke, not a detailed model
of small-airway anatomy.

### Calibration result

With EFL on in the obstructed phenotype, external PEEP 0 → 5 leaves total PEEP
at about 12.1 cmH₂O and EELV at about 4.02 L. Applied PEEP substitutes for part
of the intrinsic pressure rather than adding to absolute lung volume. At PEEP
13, total PEEP rises to about 19.3 cmH₂O, EELV to 4.79 L, CVP to 7.0 mmHg and
cardiac output falls from about 4.38 to 4.18 L/min.

At the shipped PEEP of 5, increasing expiratory time by slowing respiratory
rate from 26 to 12/min reduces intrinsic PEEP from about 7.1 to 1.3 cmH₂O,
dynamic trapped volume from about 782 to 146 mL and restores cardiac output from
about 4.38 to 4.85 L/min. The acute vascular coefficient changes much less than
the filling pathway; chronic COPD pulmonary vascular disease is not silently
added to the preset.

The 4.5 s envelope preserves the order of magnitude of severe obstructive
emptying and a visible low-PEEP plateau. It is not fitted to the published 85%
critical fraction and must not be used as a bedside PEEP threshold.

### Deliberate limits

`efl` is binary and the maximal-flow envelope is one aggregate curve. Real COPD
has volume-dependent airway compression, heterogeneous regional time constants,
airway closure, collateral ventilation and patient-specific responses to PEEP.
The model has none of those. It also does not model CO₂, dead space, V/Q,
bronchodilators, secretions, inspiratory threshold work, triggering or
dyssynchrony. The external-PEEP comparison is intended for the passive
controlled phenotype used in the human studies, not assisted-ventilation
titration.

Dynamic trapped volume is a model-derived separation from its own static
pressure–volume equilibrium, not a bedside measurement of occult regional
trapping. The feature exists only to connect incomplete expiration to mean
intrathoracic pressure, measured-versus-transmural filling and cardiac output.

## 2026-08-11 — Bound the aggregate baroreflex without adding new arcs

### Decision

- Keep one aggregate sympathetic state and its 15 s time constant. Do not add
  separate vagal, cardiac-sympathetic, arterial-resistance and venous-tone
  states solely to make the transient look more physiological.
- Reinterpret the user-facing `baroreflex` control as **sensitivity**. It now
  acts inside the saturating pressure-error relation, so positive outflow stays
  between zero and one and withdrawal stays between zero and −0.25. Raising
  sensitivity reaches full response at a smaller error; it cannot create a
  response larger than full.
- Make the chronotropic effector additive: full positive outflow adds 42/min to
  the selected heart rate. The previous proportional effector increased an
  already selected tachycardia a second time.
- Keep systemic resistance and contractility as relative effectors and venous
  recruitment at 200 mL per unit outflow. These remain aggregate teaching
  coefficients, not identified human dose–response relationships.

### Why

The former equations allowed the sensitivity control to scale the maximum
outflow itself. In a deliberately severe but permitted corner of the control
space — baseline heart rate 170/min, stressed volume 200 mL, systemic resistance
0.25, set point 110 mmHg and sensitivity 2 — outflow reached 1.945. The
proportional chronotropic term then produced 351.9/min and the venous term
mobilised 389 mL. This was false precision rather than a useful demonstration:
the selected baseline rate already describes the patient's phenotype, and
“twice the sensitivity” does not identify a biologically meaningful
twice-maximal sympathetic state.

The alternative of splitting the controller into several efferent arcs was
rejected for this didactic model. Human experiments show that sinus-node and
vascular responses do not share one latency: direct carotid stimulation changed
the pulse interval after about 0.5–0.6 s and arterial pressure after 2–3 s
([Borst et al. 1983](https://doi.org/10.1016/0165-1838(83)90004-8)), while the
measured vagal cardiac delay varies with autonomic state
([Keyl et al. 2001](https://pubmed.ncbi.nlm.nih.gov/11408442/)). A prospective
study in 21 patients with septic shock also found materially different autonomic
control despite achievement of the same mean-pressure target
([Carrara et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5991174/)). One
extra “more realistic” time constant would therefore not solve the
identifiability problem; it would add an unsupported parameter.

### Calibration result

The additive 42/min reserve preserves the old full-response increment at the
75/min reference state (75 × 0.55 = 41.25/min, rounded for the teaching
coefficient). It is not claimed as a universal human chronotropic reserve. In
the severe control-space corner above, the new outflow is 0.993, effective heart
rate 211.7/min and venous recruitment 198.6 mL. Pressure remains frankly low at
about 43 mmHg rather than being normalised by a super-response.

In the shipped septic phenotype, disabling versus enabling the reflex changes
MAP from about 63 to 82 mmHg, heart rate from 105 to 122/min and cardiac output
from 3.9 to 4.4 L/min. Local preload reserve remains steep and a 500 mL volume
increase still raises output by about 40% with the reflex on. The intended lesson
— compensation can mask severe underfilling — is therefore retained without
using pulse-pressure variation as a diagnostic cutoff.

### Deliberate limits

The 15 s first-order state is a slow aggregate compensator, not a simulation of
human beat-to-beat baroreflex latency. After an abrupt fall in pressure the
model's chronotropic response is still small at 3 s and incomplete at 15 s. It
should be used for compensated-versus-uncompensated steady-state comparisons,
not autonomic function testing, heart-rate variability, reflex timing or
vasopressor prediction. Its afferent signal is a low-pass mean pressure, not
pulsatile arterial-wall stretch. The fixed set point, withdrawal asymmetry and
effector coefficients are didactic choices; ageing, sedation, neuropathy,
sepsis, pre-existing sympathetic activation and chemoreflexes are not
represented.

## 2026-08-11 — Treat Berger as an animal anchor, not a human calibration

### Decision

- Identify the PEEP 5 → 10 experiment explicitly as a study in nine
  anaesthetised pigs ventilated at 7.7 mL/kg.
- Tighten its executable check around the published paired means: MSFP measured
  by right-atrial balloon occlusion rose 12.9 → 14.0 mmHg, while pulmonary
  arterial flow changed 2.75 → 2.56 L/min (−6.9%, `p=0.094`). The tolerance
  remains broader than those means because it is an order-of-magnitude anchor,
  not a reconstructed confidence interval.
- Do not use the study to calibrate the human baroreflex. Reflexes were not
  blocked, and the composite steady-state response cannot identify a reflex
  gain separately from mechanical and vascular compensation.
- Keep inspiratory holds as a demonstration that pressure–flow extrapolation can
  be biased, but call their zero-flow crossing an **extrapolated intercept**, not
  a measured Pmsf.
- Do not tune the magnitude of that bias to the porcine mean. Record the current
  mismatch and keep it outside quantitative human validation.

### Why

The earlier row described a “euvolaemic patient”, allowed a 1–3 mmHg Pmsf rise
and attributed the small output cost to the baroreflex. None of those
interpretations follows from the experiment. The measured Pmsf rise was
1.1 mmHg, the output change was small but not zero, and all observations came
from healthy pigs under anaesthesia.

The same paper found that inspiratory-hold extrapolation exceeded balloon-
occlusion MSFP by 3.0 (SD 5.1) mmHg across 37 paired measurements. That is
evidence for direction and uncertainty, not a portable human error term.
Postoperative human studies using the hold method report substantially higher
absolute estimates, and Berger explicitly notes that patient volume shifts may
make the pressure–flow displacement larger than in this preparation.

A trial implementation separated end-expiratory from tidal abdominal-pressure
transmission. It could reduce the simulated intercept only by also weakening
the immediate caval/waterfall response documented in the experiment. That would
replace one known simplification with an unmeasured hold-specific coefficient
and alter ordinary heart–lung interaction throughout the app. It was therefore
rejected and is not present in the model.

### Calibration result

At the model's 70 kg reference weight and the study-equivalent 540 mL tidal
volume, PEEP 5 → 10 produces ΔPmsf +1.18 mmHg and ΔCO −6.3%, close to the
published +1.1 mmHg and −6.9%. This agreement is encouraging face validity, not
human validation.

In contrast, four inspiratory holds at 300, 500, 700 and 900 mL (airway
pressures about 8.3–15.3 cmH₂O) produce an extrapolated intercept around
28 mmHg while the model's actual Pmsf is about 8.8 mmHg. The direction agrees
with Berger; the magnitude does not. The interface and documentation now say so
directly rather than naming the intercept as a measurement.

### Deliberate limits

The simulator has one systemic venous reservoir and one aggregate caval closing
pressure. It cannot reproduce separate SVC, IVC, portal, hepatic-waterfall and
azygos responses, which Berger invokes to explain flow recovery during a hold.
Adding those beds solely to match one porcine protocol would obscure the
didactic model and still would not establish a human target. Quantitative use of
the extrapolated intercept therefore remains out of scope.

## 2026-08-11 — Add a volume-conserving pulmonary transit pathway

### Decision

- Insert a pressureless transport volume between pulmonary arterial flow and
  pulmonary venous delivery. Eight serial well-mixed stages give it a fixed
  2.0 s mean transport time with a finite spread of transit times.
- Keep pulmonary venous pressure in the instantaneous PVR gradient. The new
  state delays volume and flow, not propagation of a pressure wave.
- Reallocate 160 mL of zero-pressure volume from the existing pulmonary artery
  and vein to initialise the pathway. Total blood volume, their stressed
  volumes and their resting pressures therefore remain unchanged.
- Keep the direct pulmonary venous piston, septal interaction and pericardial
  interaction outside the delay. They are immediate mechanical routes and are
  not blood newly traversing the pulmonary circuit.
- Use transit only as a mechanistic timing constraint. Do not restore the tidal-
  volume challenge, a PPV cutoff or the retired Michard calibration.

### Why

The pre-phase audit showed some buffering but too little separation. After an
isolated fall in RV contractility, the first LV beat was preserved but the next
beat had already fallen; in ventilation, the RV-to-LV lag was about one beat.
Pinsky describes a sustained RV-output reduction appearing in LV preload and
output after two to three beats. The contemporary ATS teaching synthesis also
places the lower pulse pressure in expiration because of pulmonary transit.

Increasing pulmonary arterial or venous compliance enough to create this lag
would also alter resting pressure–volume behaviour and worsen the already slow
pulmonary arterial decay at high PVR. Three pressureless alternatives were
therefore compared:

- one first-order 1.5 s reservoir conserved volume but filtered the respiratory
  signal too strongly;
- a pure circular delay retained amplitude but returned an unrealistically rigid
  copy of each perturbation, moved the ventilated LV nadir into inspiration at
  1.0 s, and disturbed the Guyton operating-point agreement in the weaning
  scenario;
- eight serial stages retained a distributed response without the rigid echo.
  At 1.5 s their respiratory phase was still too early; 2.0 s was the shortest
  tested mean time that placed the LV nadir in expiration while preserving the
  2–3-beat step response.

The retained internal state is eight `Float64` volumes (64 bytes per simulator)
and eight simple transport updates per circulation step. `vPt` is their visible
sum and keeps this blood explicit in the volume-conservation checks.

### Calibration result

With ventilation, baroreflex, piston, septal and pericardial effects removed, an
abrupt RV contractility reduction changes RV stroke volume from about 70.3 to
49.9 mL on the first affected beat. LV stroke volume remains about 70.3 mL for
the first two observations, then reads 70.1 and 68.8 mL: the transported effect
is detectable by the third following beat. Total blood remains 5080 mL.
Under passive positive-pressure ventilation, the LV stroke-volume nadir remains
in expiration rather than moving into inspiration.

Re-running the older constraints exposed two stale numerical claims. The
Michard-derived requirement that hypovolaemia produce at least five more PPV
points than a fuller state was removed, consistently with the phase-1 decision
that PPV is descriptive rather than calibrated. The Fougères paper was also
re-read: it reports a 13±9% cardiac-index fall with higher PEEP and 14±10%
recovery with passive leg raising at high PEEP, not the ≥1.5-fold between-volume
ratio previously attributed to it. Its executable constraint now retains the
supported direction only: greater central filling attenuates the PEEP cost.

### Deliberate limits

The 2.0 s mean time is a teaching calibration, not a universal physiological
constant. A real lung has a distribution of regional pathways and transit times
that changes with flow, vascular volume, recruitment and disease. Eight serial
mixing stages approximate only a distribution in time; they do not reproduce
regional capillary perfusion, contrast transit time or patient-specific PPV
amplitude. The mean time itself remains fixed. Pressure effects remain
instantaneous by design; only delivery of changing flow is buffered.

## 2026-08-11 — Separate fluid, venous tone and venous compliance

### Decision

- Keep `stressedVolume` as an explicit change in systemic venous blood volume:
  moving the control by 500 mL changes both the reservoir and total circulating
  volume by 500 mL.
- Model sympathetic venous tone as a shift of zero-pressure volume. One unit of
  positive baroreflex outflow lowers systemic venous unstressed volume by 200 mL
  and mobilises the same volume as stressed, without adding blood. The later
  baroreflex-boundary decision keeps that outflow at or below one.
- Keep `csv` as an independent pressure–volume slope. The baroreflex no longer
  changes it.
- Expose stressed volume, unstressed volume, tone-mobilised volume and effective
  compliance in the Guyton data table so the distinction is inspectable rather
  than only documented.

### Why

The previous baroreflex raised mean systemic filling pressure by reducing venous
compliance. That produced a plausible pressure but conflated two different
teaching mechanisms. At fixed blood volume, increasing vascular tone primarily
shifts the pressure–volume relation left: unstressed volume decreases while the
slope can remain substantially unchanged ([Young, chapter 2](https://www.ncbi.nlm.nih.gov/books/NBK54476/)).
Human septic-shock observations also describe norepinephrine as increasing
stressed volume and mean systemic pressure through venous contraction
([Adda et al. 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8379760/)).

### Calibration result

The 200 mL coefficient was chosen to preserve the old model's macroscopic venous
effect rather than introduce a new haemodynamic calibration. In the shipped
septic phenotype, baroreflex outflow is about 0.42: the new implementation
mobilises about 83 mL, leaves compliance at 100 mL/mmHg and total blood at 4710
mL, while producing MAP 81 mmHg and cardiac output 4.28 L/min. The prior
compliance-based implementation produced MAP 81 mmHg and output 4.28 L/min.

### Deliberate limits

The model has one systemic venous reservoir, not separate splanchnic, cutaneous
and muscular capacitance beds. The 200 mL-per-unit coefficient is not a
norepinephrine dose response, and all baroreflex effectors still share one time
constant. Fluid is instantaneously placed in the venous compartment; stress
relaxation, transcapillary escape and distribution kinetics are absent. These
limits keep the mechanism legible and prevent the control from being mistaken
for a bedside fluid or vasopressor predictor.

## 2026-08-11 — Re-centre pulmonary vascular calibration on human in-vivo data

### Decision

- Put the fully open mechanical J-curve minimum near the model's human FRC
  (2.25 versus 2.2 L), rather than at 2.87 L / 48% of a fixed 6 L capacity.
- Retain Thomas 1961, Hakim 1982 and the isolated-lung work as qualitative
  support for volume dependence and opposing mechanical limbs, but retire their
  exact animal nadir and maximal-inflation ratios as executable human targets.
- Reference vascular strain to the volume this patient's fully open tissue
  would hold at resting recoil. A small stiff ARDS lung can therefore be
  distended despite a total volume below the normal 2.2 L FRC.
- Represent open and derecruited vascular beds as conductances in parallel.
  Hypoxic vasoconstriction raises only the derecruited pathway's resistance.
- Apply the alveolar waterfall to 45% of the aggregate pulmonary bed rather than
  placing the entire circulation behind `max(Ppv, Palv)`.
- Calibrate absolute derived PVR and the PEEP response against Cappio Borlino et
  al. 2024 using a human ARDS phenotype with normal RV contractility and
  `pvrBase=0.09`; do not reuse the deliberately severe ARDS/RV-failure preset as
  a study cohort.

### Why

The prior J-curve passed precise numerical tests taken from excised or isolated
animal lungs while disagreeing with the clinically used human schematic, which
places the minimum near FRC. More importantly, its ARDS values were far outside
the available human in-vivo measurements. In the Cappio Borlino manoeuvre the
model produced approximately 10–16 WU, versus cohort IQRs spanning roughly
1.5–4.75 WU.

Two structural inconsistencies caused most of the excess. The documentation said
closed units remained perfused, but the equation divided by the open fraction,
which removed their vascular pathway, then multiplied the whole lung by HPV. In
the circulation, a mean-pressure crossing from `Ppv>Palv` to `Palv>Ppv` placed
the whole pulmonary bed abruptly behind an alveolar waterfall. Both choices
amplified a regional mechanism into a whole-lung penalty.

### Human calibration result

After 45 s of equilibration, PEEP 4 → 14 produces:

| Phenotype | Model | Human cohort medians [IQR] |
|---|---|---|
| Low recruitability | 2.68 → 3.28 WU, +22% | 2.00 [1.50–3.71] → 3.04 [2.08–4.75] WU, +52% ratio of medians |
| Higher recruitability | 2.45 → 2.62 WU, +7% | 2.80 [2.31–3.61] → 2.94 [2.10–3.75] WU, +5% ratio of medians |

All four absolute model values are inside the published IQRs. The low-recruiter
response is intentionally not forced to +52%: a ratio of cohort medians is not
the median paired percentage change, and the simulator is not a patient-specific
fit.

### Deliberate limits

The 45% waterfall share and threefold intrinsic resistance of the derecruited
path are transparent aggregate coefficients. They avoid a false all-or-none
whole-lung effect; they do not reproduce regional perfusion anatomy. The
`recruitable` control at the end of this phase was still a fraction of collapsed
units, not measured R/I. That limitation is historical: the following phase
replaces the control explicitly rather than hiding a reinterpretation here.

## 2026-08-11 — Replace fractional recruitability with measured R/I

### Decision

- Replace the user-facing fraction of collapsed units with `riRatio`, defined by
  a passive PEEP 5 → 15 cmH₂O reference manoeuvre.
- Keep total collapse, fully-open tissue compliance and transpulmonary opening
  pressure as independent inputs.
- Translate R/I into an internal openable fraction numerically; never expose that
  latent fraction as though it were the bedside index.
- Cap the internal fraction at the available collapsed compartment. Report the
  achieved R/I and a caution when the requested value is not attainable.
- Retain 0.5 as a teaching split used in the published cohorts, not as an
  outcome-validated prescription for high PEEP.

### Why

Chen et al. define recruited volume as the measured change in end-expiratory
lung volume minus the inflation predicted from low-PEEP respiratory-system
compliance. Recruited compliance divided by that low-PEEP compliance is R/I.
The former `recruitable` parameter instead meant the maximum fraction of the
collapsed compartment that might ever open. It was a useful internal state but
not the measured quantity, and a rename would have been false.

The difference was not cosmetic. In the reference ARDS phenotype, the former
opening distribution produced R/I below 0.15 even when every collapsed unit was
allowed to open. The diseased-unit sigmoid is now narrower (2 cmH₂O rather than
7) and explicitly documented as a didactic shape coefficient. For each patient,
the solver then finds the smallest openable fraction that reproduces the target
R/I under the reference manoeuvre. The finite collapsed compartment and selected
opening pressure remain hard constraints.

### Human calibration result

For the Cappio Borlino phenotype, PEEP 4 → 14 now gives 2.64 → 3.16 WU (+20%) at
R/I 0.05 and 2.54 → 2.64 WU (+4%) at R/I 0.50. Across R/I 0 → 0.8, the derived
PVR response changes monotonically from +24% to −4%. The four cohort-comparison
values remain inside the reported IQRs.

### Deliberate limits

R/I is protocol-dependent and may combine recruitment, inflation and
overdistension. The simulator has no separately measured airway-opening pressure,
so its 10 cmH₂O effective step cannot reproduce Chen's correction when airway
opening pressure exceeds low PEEP. A high R/I also does not prove that high PEEP
is safe or optimal. These limitations are shown in the control help and readout;
the app does not turn R/I into a PEEP recommendation.

## 2026-08-11 — Retire diagnostic PPV calibration and the tidal-volume challenge

### Decision

- Keep PPV and SVV as descriptive outputs of cardiopulmonary interaction.
- Keep their applicability cautions, including spontaneous effort and a tidal
  volume below 8 mL/kg.
- Remove the 13% PPV cutoff and the claim that it identifies preload dependence.
- Remove the Michard 2000 PPV–fluid-response regression from executable
  validation and from any calibration or interpretability threshold.
- Remove the tidal-volume challenge, its 3.5-point verdict, and its user-facing
  control.
- Keep the within-breath pulmonary-resistance swing as a mechanistic output, but
  do not use the former 15% cutoff to decide whether PPV represents preload. That
  cutoff was derived by crossing this model's response with the retired Michard
  regression and therefore cannot survive independently of it.

### Why

The simulator is intended to teach mechanisms, not to predict fluid
responsiveness in an individual patient. The Michard cohort was measured under a
specific, older ventilation strategy and does not justify a general calibration
of this model. More importantly, the model's “bolus” changes stressed volume in a
highly simplified circulation, so fitting PPV to its response would make two
model assumptions validate one another rather than provide independent in-vivo
validation.

The tidal-volume challenge magnifies the same problem. Its published 3.5-point
threshold is clinically meaningful only if the model reproduces the absolute PPV
response and the cardiopulmonary timing closely enough. It currently does not:
the challenge was marginal around its cutoff and the pulmonary transit delay is
too short. A binary result could therefore be model-specific, confusing a
didactic demonstration with a bedside prediction.

### What remains teachable

The model still shows that hypovolaemia tends to increase respiratory variation,
that variation depends on the size and timing of the breath, and that cyclic
right-ventricular afterload can contribute to it. These are tested as mechanisms
or directions, without translating them into a diagnostic verdict.

### Reconsideration criteria

A diagnostic PPV feature should return only after validation against independent
human in-vivo data across contemporary ventilatory conditions, with an adequate
pulmonary transit representation and without defining the reference response by
the model's own stressed-volume manipulation.

## 2026-08-11 — Restore the physiological dominance of both PVR limbs

### Decision

- Keep the open-lung PVR value and the curve minimum at FRC unchanged.
- Split that FRC resistance equally between alveolar and extra-alveolar series
  components so the change in the dominant mechanism occurs near FRC.
- Add a quadratic loss-of-radial-traction term only below FRC. It is zero in
  both value and slope at FRC, so it steepens the left limb without moving the
  nadir or retuning the calibrated operating point.
- Preserve the gradual right limb and the separate parallel pathway for closed
  units. No new vascular compartment or state variable is introduced.

### Why

The preceding calibration fixed absolute human PVR values and correctly placed
the minimum near FRC, but its visual decomposition was physiologically weak. In
the normal reference lung, PVR at RV was only about 1.05 times the FRC value and
the alveolar and extra-alveolar components crossed close to RV. Thus the total
curve passed a merely directional test while failing to teach the mechanism in
Cecconi, Collino and Pinsky 2026 Fig. 1C: extra-alveolar narrowing dominates at
low volume, the components become comparable near FRC, and alveolar compression
dominates toward TLC.

With the revised shape, the normal fully open reference is approximately 1.74
times the FRC value at RV and 1.56 times it at TLC. At RV, extra-alveolar
resistance is about 3.4 times alveolar resistance; at TLC the relation reverses,
with alveolar resistance about 5.5 times extra-alveolar resistance.

### Deliberate limits

Figure 1C is an unscaled clinical synthesis, not an in-vivo measurement from
which those ratios can be estimated. The 50/50 FRC split and the low-volume gain
are therefore explicit didactic shape coefficients. Thomas 1961 and Hakim 1982
support volume dependence and vascular partitioning in animal preparations;
Hakim also found a small high-volume increase outside the alveolar segment that
the simpler clinical two-limb diagram does not show. This app follows the latter
for clarity and does not use either source as a portable quantitative human
target. Absolute human PVR and the PEEP response in ARDS remain constrained
separately by the Cappio Borlino cohort tests.
