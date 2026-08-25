# Model decisions

This is the durable decision log for substantive physiological changes. It
records why a behaviour was added, changed or retired so that later work — by a
person or another language model — does not have to reconstruct the rationale
from code or commit history alone.

Historical investigations remain in the dated postmortem. This file records the
current decision.

## 2026-08-14 — Make pulmonary transit depend on blood volume and flow

### Decision

- Replace the fixed 2.0 s pulmonary buffer time with the central-volume
  relation: estimated PA-to-LA mean transit time is represented pulmonary blood
  volume divided by mean right-ventricular output.
- Define represented pulmonary blood volume as the blood physically held in
  the pulmonary arterial compartment, the pressureless staged pathway and the
  pulmonary venous compartment. No new blood or disease-specific correction is
  added.
- Keep the eight-stage pathway. It supplies only the fraction of total transit
  corresponding to its original 160 mL allocation; PA and PV already contribute
  their own pressure-bearing storage dynamics.
- Let the target transit adapt over 2 s so sustained low or high flow changes
  transport velocity without allowing respiratory alternation between
  individual RV beats to alias the phase of the LV response.
- Bound the staged part to 0.8–6.0 s. The unbounded central-volume estimate
  remains visible; the bound prevents extreme low flow from creating an
  arbitrarily long numerical memory.
- Expose pulmonary vascular blood volume, the estimated whole-circuit mean time
  and the active staged-buffer time as separate readouts.

### Why

The previous fixed delay preserved the clinically important ordering described
by Pinsky — an RV-output change reaches LV preload after two to three beats —
but made a low-output congested circulation and a high-output circulation move
blood through the lung at the same speed. Indicator-dilution physiology gives a
simple relation that fixes this without adding a regional lung model:

`pulmonary blood volume = cardiac output × mean transit time`.

The model already contains both terms needed to invert that relation. Using the
last complete RV beat avoids the zero instantaneous pulmonic flow of diastole.
Using all three pulmonary vascular volumes avoids making transit depend on the
arbitrary current filling of the pressureless subcompartment alone; that first
prototype could shorten the delay in pulmonary embolism as the staged volume
drained, which was physiologically backwards.

In a matched passive experiment at HR 75/min, RR 18/min, VT 450 mL and PEEP 5,
the current model estimates approximately 5.4 s and 419 mL in the reference
circulation, 9.6 s and 525 mL in pulmonary embolism, and 21.5 s and 756 mL in
congested low-output LV failure. These values demonstrate the required ordering.
They are not fits to those disease populations; the severe LV phenotype reaches
the staged 6 s numerical ceiling.

### Deliberate limits

The estimate is a model PA-to-LA central-volume calculation, not a simulated
contrast bolus and not interchangeable with RV-to-LV CMR timing. The pulmonary
bed remains one aggregate path with no regional perfusion, capillary recruitment
distribution, bronchial flow, shunt or recirculation. The 160/375 staged share,
2 s adaptation and 0.8–6 s bounds are transparent implementation choices, not
human reference ranges. Absolute transit in the named scenarios must therefore
be read as model state; the defensible result is that more pulmonary blood and
less forward flow prolong delivery to the left heart.

## 2026-08-14 — Separate spontaneous pressure swing from preload reserve

### Decision

- Rename `swing-no-variation` to `swing-limited-reserve` and remove every claim
  based on its hidden PPV value.
- Preserve the vigorous spontaneous effort and full circulation, but use the
  local slope of the Guyton operating point as the demonstrating readout.
- Require the preset to generate a pleural swing above 15 cmH2O, remain below
  the model's 8%/mmHg steep-limb threshold and label PPV unavailable.

### Why

PPV assumes passive, regular ventilation and cannot validate a lesson in a
patient making strong spontaneous efforts. The previous preset correctly
withheld PPV in the interface but contradicted that safeguard in its name and
note by teaching from an unstable internal value. Preload sensitivity is a
different quantity: it asks how the settled intersection of venous return and
the model RV-function curve moves with filling pressure, so it remains defined
in this phenotype. It does not independently test LV reserve. The revised
scenario therefore teaches the narrower and defensible
point that a large transmitted pressure swing does not by itself establish
preload reserve.

### Deliberate limits

The local slope is a property of the model's right-sided Guyton construction,
not a validated bedside cutoff or a replacement for a fluid challenge. Irregular
effort, arrhythmia, changing tidal volume and arterial waveform measurement
error remain outside the scenario.

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
24.7 mmHg while the model's actual Pmsf is about 10.0 mmHg. The direction agrees
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

> Historical implementation record. Its fixed-time decision was superseded on
> 2026-08-14 by the flow- and pulmonary-volume-dependent relation above; the
> eight-stage, pressureless, volume-conserving architecture was retained.

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

## 2026-08-15 — Separate aerated-lung compliance from maximum lung capacity

### Decision

- Define `clung` as the local pressure–volume slope of aerated tissue while it is
  away from its upper-volume limit.
- Add `lungCapacity` as an independent user control in litres, default 6 L and
  adjustable from 2 to 9 L.
- Replace the compliance-scaled exponential capacity with a smooth independent
  ceiling. The transition width is 18% of capacity so the upper limb bends
  progressively and remains differentiable.
- Continue to multiply per-unit tissue volume by open fraction. Collapse
  therefore reduces accessible capacity and recruitment restores part of it
  without changing either the tissue slope or the anatomical ceiling.

### Why

The previous `clung` control did two jobs: it changed pressure–volume slope and
also changed maximum expandable volume. `collapsed` then removed available lung
a second time. Phenotypes using both controls could therefore make the baby lung
small twice while presenting the result as two independent abnormalities.

The new construction makes the causal axes explicit. Low `clung` means greater
pressure is needed for a given volume increment; low `lungCapacity` means the
upper limb is reached at a smaller absolute volume; high `collapsed` means only
a fraction of that ceiling is currently ventilated. Live respiratory-system
compliance remains an output and may differ from `clung` because it also contains
recruitment, ceiling effects and chest-wall mechanics.

### Deliberate limits

`lungCapacity` is a teaching-scale input, not predicted TLC. No height, sex, age
or reference equation has been added. The 18% smoothing width is a transparent
didactic coefficient rather than a human in-vivo calibration. The default lung
still rests at 2.2 L at 5 cmH₂O recoil and approaches its 6 L ceiling smoothly;
it is no longer forced to equal 6 L at one finite pressure.

## 2026-08-15 — Treat wedge as a qualified left-atrial-pressure surrogate

### Decision

- Keep the existing three-second mean of atmospheric left atrial pressure, but
  label it **Wedge surrogate** rather than implying a simulated catheter
  occlusion.
- Rename the accompanying display from “zone 3 fraction” to “zone 3 index”. It
  is the normalised pulmonary-venous-to-alveolar pressure margin, not an
  anatomical fraction of perfused lung.
- Propagate wedge caution to catheter-form derived PVR. The arithmetic remains
  available, but it cannot be presented as unqualified when its downstream
  pressure is uncertain.
- Do not add a scripted balloon or occlusion waveform to the current aggregate
  pulmonary bed.

### Why

The model knows left atrial volume, time-varying elastance, pleural pressure and
pericardial pressure, so it can calculate atmospheric left atrial pressure
exactly inside its own topology. A real PAWP is different: a balloon occludes a
regional pulmonary arterial branch and a static blood column transmits pressure
from the pulmonary veins and left atrium only under suitable vascular-zone and
measurement conditions. Calling the latent model pressure simply “wedge” hid
that distinction, and leaving derived PVR green beside a cautioned surrogate
made a dependent calculation look more trustworthy than its input.

### Deliberate limits

The zone 3 index remains a conservative heuristic: `clamp((Ppv_raw - Palv) / 4,
0, 1)`, with caution below 0.95. Neither the 4 mmHg scale nor that threshold is a
regional human measurement. The model still has no catheter position,
end-expiratory sampling, a/v-wave selection, mitral disease or pulmonary venous
obstruction. A genuine occlusion model would require regional topology rather
than another number in the existing lumped compartment.

## 2026-08-16 — Make pericardial capacity explicit and add a tamponade phenotype

### Decision

- Preserve one pericardial pressure shared by both atria and both ventricles.
- Replace the fixed 430 mL onset volume with `pericardialCapacity`, adjustable
  from 100 to 600 mL and defaulting to the previous 430 mL value.
- Preserve the previous exponential shape and normal gain. Capacity moves the
  knee of the relation; the `pericardium` control continues to change its gain.
- Add a spontaneously breathing cardiac-tamponade preset and define
  decompression as restoring capacity while leaving every other input unchanged.
- Expose end-diastolic ventricular cavity pressures so the scenario contract can
  assess diastolic convergence without sampling a random cardiac phase.

### Why

The fixed threshold made the pericardium irrelevant in most states and could
only be engaged by making the heart extremely large. Tamponade instead represents
loss of room inside a pressurised sac. Making available capacity explicit lets a
normal-sized heart encounter the steep part of the same relation and makes the
intervention falsifiable: pressure and output must improve when capacity is
restored.

The control is not named effusion volume. Human tamponade depends on accumulation
rate, pericardial distensibility, chamber filling pressure and fluid distribution;
the same literal fluid volume is not portable across patients. Available model
capacity collapses those determinants into one didactic variable without a new
fluid compartment or a scripted output.

### Executable contract

The constrained preset must generate more than 8 mmHg mean pericardial pressure,
bring mean RA, RV end-diastolic, PA diastolic and wedge-surrogate pressures into
an 8 mmHg band, and reduce output. Restoring capacity to 430 mL must reduce
pericardial pressure below 1 mmHg, lower CVP by more than 5 mmHg, raise cardiac
output by at least 35% and MAP by more than 15 mmHg, and restore proportionally
more RV than LV end-diastolic volume.

### Deliberate limits

There is no pericardial fluid state, accumulation rate, loculation, drainage
flow, chamber-wall collapse, Doppler inflow or coronary circulation. Respiratory
arterial variation is directional but the model does not reproduce a calibrated
clinical pulsus-paradoxus measurement and the spontaneous-breathing PPV tile
remains unavailable. The preset is a qualified mechanical phenotype, not a
diagnostic or therapeutic simulator.

## 2026-08-18 — Separate baroreflex activation from sensitivity

### Decision

- Add a dedicated `baroreflexEnabled` checkbox and leave it off in the default
  parameter set. Keep the sensitivity at 1.0 so an off/on comparison does not
  erase the selected gain.
- Force aggregate outflow to zero immediately while disabled. Sensitivity and
  set point remain visible but inactive in the interface.
- Keep the septic responder preset explicitly compensated because its teaching
  question is whether pressure defence can conceal inadequate filling. Other
  presets inherit the uncompensated default and may already encode prior
  clinical compensation in their selected rate, resistance and volume.
- Rename the heart-rate input as baseline rate. Add effective heart-rate and
  effective systemic-resistance tiles that show the selected input and reflex
  contribution separately.

### Why

Using zero sensitivity as both an off switch and a gain setting hid the
experimental comparison. The control appeared to remain at the user-selected
heart rate even though the integrator used an effective rate modified by the
reflex. A separate activation state makes the intended sequence explicit:
observe unopposed mechanical heart–lung interaction first, then add aggregate
pressure defence without changing the patient inputs.

### Deliberate limits

Off is an idealised teaching reference, not a healthy human phenotype. On still
uses one 15 s state for chronotropy, systemic resistance, venous recruitment and
contractility, despite their different human pathways and latencies. The two new
tiles expose internal effective values; they are not independent bedside
measurements of autonomic activity.

## 2026-08-21 — Restore unit-normalised, heart-rate-aware ventricular activation

### Decision

- Replace the phase-based approximation of ventricular activation with the
  canonical normalised double-Hill form.
- Define normalised time from `Tmax = 0.2 + 0.15 × cycle duration` rather than
  forcing systole to occupy the same fraction of every cardiac cycle.
- Apply the correction to both ventricles. An LV or RV Ees control now denotes
  the peak active elastance actually reached by that chamber.
- Recalibrate the internal preload-reserve classifier from 10% to 8% of output
  per mmHg after repeating its deterministic 60-state comparison with a 500 mL
  model volume challenge.

### Why

The old function was documented as normalised to one but its actual peak was
0.702. Every selected end-systolic elastance was therefore reduced silently by
about 30%; at the normal reference, LV Ees 3 mmHg/mL behaved as approximately
2.1 mmHg/mL. This was the main cause of the long-declared 5–10 point deficit in
baseline ejection fraction. Adding an offset to the displayed EF or increasing
the default Ees would have hidden the inconsistency while leaving the control's
units false.

The corrected waveform peaks at approximately one from 45 to 140/min and gives
a reference EF of about 56% from the model's measured EDV and ESV. It also
preserves the established relation between heart rate and systolic duration:
systole occupies a larger fraction of a short tachycardic cycle.

The preload classifier is a construction internal to this model, not a clinical
cutoff. With the corrected pump, an 8%/mmHg boundary agrees with the model's own
15% response to 500 mL in 52 of 60 deterministic configurations (87%), compared
with 47 of 60 at the former boundary.

### Deliberate limits

Normalising activation does not make model EF an echocardiographic measurement.
The ventricle remains one lumped chamber without geometry, regional wall motion,
valvular regurgitation, coronary perfusion or force-frequency coupling. The
double-Hill timing is a population-level waveform, not patient-specific
electromechanical activation or relaxation.

## 2026-08-21 — Give the chest wall an independent relaxation curve

### Decision

- Replace the phenotype-recentred linear wall with one aggregate sigmoid
  pressure–volume relation evaluated from absolute lung volume.
- Preserve the normal reference at 2.2 L, with chest-wall recoil −5 cmH₂O and
  local compliance 200 mL/cmH₂O. Let the curve stiffen progressively away from
  the middle-volume range rather than imposing one slope at all volumes.
- Calculate passive volume from the intersection of lung and wall recoil. At a
  static PEEP, solve the same balance after adding the applied airway pressure.
- Keep `ccw` as the local slope near the normal reference and add `cwLoad` as a
  separate pressure offset. Stiffness and external loading must not be aliases.
- Keep one aggregate wall. Do not add separate rib-cage, diaphragm and abdominal
  compartments.
- Retune the ARDS opening-range centre from 18 to 21 cmH₂O so its selected R/I
  remains attainable and its human PVR–recruitability constraints remain true
  after the corrected passive transpulmonary pressure is introduced.

### Why

The former construction calculated each lung phenotype's volume at 5 cmH₂O
transpulmonary pressure and assigned −5 cmH₂O pleural pressure there. This made
the normal calibration look correct but silently translated the chest-wall
relation whenever lung compliance, collapse or capacity changed. A diseased
lung therefore could not find a new equilibrium against an unchanged thorax.

With the independent relation, the default still rests at 2.2 L. A collapsed,
stiff, non-recruitable lung instead settles near 1.0 L with lung and wall recoil
near +11 and −11 cmH₂O; a high-compliance lung settles higher, near 2.4 L. These
are consequences of the two curves meeting, not separately assigned FRC values.
A 6 cmH₂O wall load shifts the same normal lung to a lower passive volume while
preserving the selected reference compliance.

The sigmoid form follows the established human relaxation-curve topology:
approximately linear over tidal breathing, with reduced compliance toward the
volume extremes. Its broad shape anchors were chosen for stable, legible ICU-
range behaviour and were not fitted as individual human RV or TLC measurements.

### Executable contract

Tests require the default operating point and local wall compliance, outward
recoil below the wall's neutral volume, inward recoil above it, and progressive
stiffening at low and high volume. Changing `clung`, `collapsed` or
`lungCapacity` must leave wall pressure at a given absolute volume bit-identical.
Normal, collapsed-stiff and lost-recoil lungs must each satisfy
`Pcw + Pl = 0` at their own passive volume. `cwLoad` must shift wall pressure
without changing its selected local compliance.

### Deliberate limits

There is one wall pressure and no regional pleural gradient. Rib cage,
diaphragm, abdominal wall and zone-of-apposition geometry remain absent.
`cwLoad` is a selected aggregate offset rather than a prediction from body mass,
ascites or abdominal pressure. Chest-wall curvature can contribute to airway-
pressure curvature at extreme volume, so stress index is a respiratory-system
measurement rather than proof of a purely pulmonary mechanism.

## 2026-08-21 — Preserve respiratory IVC motion above the reference dilated calibre

### Decision

- Leave the separate IVC compartment, its compliance, resistance split and
  circulation equations unchanged.
- Replace the panel's linear fullness scale, which hard-clipped at the volume
  corresponding to 5 mmHg transmural pressure, with a square-root transformation
  from distending volume to displayed calibre.
- Treat 5 mmHg as the reference dilated width rather than the maximum width. A
  higher emergency guardrail remains only to protect the drawing from extreme
  out-of-domain sizes.
- Require the tamponade preset to keep a larger mean IVC volume and a smaller,
  non-zero respiratory volume swing than the same state after restored
  pericardial capacity.

### Why

The tamponade circulation was not static: after respiratory-phase averaging,
its IVC volume varied by about 11% around a mean near 172 mL. The old drawing
nevertheless showed zero movement because the entire cycle remained above its
150 mL ceiling. That converted a blunted response into a categorical absence
and made the visual statement stronger than both the model state and human
echocardiographic evidence support.

For a tube of approximately fixed length, cross-sectional area is proportional
to distending volume and diameter follows its square root. This is sufficient to
compress the high-volume range while retaining a small change. It is a display
mapping, not a new physiological equation and not an ultrasound calibration.

### Deliberate limits

The model has one aggregate IVC with no measurement plane, longitudinal motion,
elliptical collapse, separate thoracic and abdominal segments or deep-inspiration
manoeuvre. The displayed percentage must therefore be read only as the direction
and relative ordering of calibre change. It is not an IVC collapsibility index
and is not compared with the bedside 50% threshold.

## 2026-08-25 — Separate Guyton respiratory dynamics from equilibrium

### Decision

- Keep one-heartbeat means of right atrial pressure and IVC-to-RA inflow as the
  moving respiratory trail.
- Add a separate one-breath mean for the filled simulated equilibrium point and
  evaluate the displayed venous-return and RV-function curves on that same
  clock.
- Evaluate the preload-reserve tile and highlighted limb on the same full-breath
  construction rather than retaining a phase-selected heartbeat.
- Anchor the local RV curve to respiratory-mean RV EDV and ESV. Reconstruct its
  effective arterial elastance as `Ees × (ESV - V0) / SV`, rather than pairing a
  mean filling pressure with one arbitrarily phased end-systolic pressure.
- Require a settled healthy passive state to retain a respiratory trail while
  its full-breath simulated mean converges on the analytic crossing.
- Retune the `swing-limited-reserve` preset from 950 mL/100 min⁻¹ to 1200 mL/70
  min⁻¹ selected stressed volume/heart rate. This preserves a non-steep reserve
  (about 7.4%/mmHg), an approximately 20 cmH₂O pleural swing and compensated
  output and pressure after the time-base correction.

### Why

The explicit compliant IVC introduced a real short-term store between the
systemic reservoir and right atrium. After that change, IVC inflow and RV output
could differ over one heartbeat even in passive ventilation. The former filled
point therefore compared a dynamic one-beat measurement with a steady-state
crossing and no longer converged as the panel implied.

A complete respiratory cycle is the shortest interval over which a settled
periodic circulation must return every compliant compartment to its starting
volume. Using that interval restores a like-for-like comparison without erasing
the within-breath path. Anchoring the RV curve to measured chamber volumes also
removes the false assumption that mean right atrial pressure directly equals RV
end-diastolic transmural pressure.

### Deliberate limits

The analytic RV curve is now explicitly local and partly anchored to integrated
model state. Its agreement with the filled point is therefore a consistency
check, not independent validation. It holds contractility and effective
arterial load fixed while right atrial pressure is swept and does not integrate
a new closed-loop beat at every plotted pressure. Immediately after a parameter
change, even the full-breath window contains redistribution and the points may
remain temporarily separated.

## 2026-08-25 — Stabilise haemodynamic panels and anchor the displayed ESPVR

### Decision

- Hold Guyton and ventricular PV-loop axes fixed within one parameter state.
  A domain may expand when a mark would leave the panel but cannot contract
  until a control or scenario change explicitly resets it.
- Give RV and LV loops separate default domains, reflecting their different
  physiological pressure ranges, and preserve headroom for ordinary states.
- Remove the “filling helps here” text from the Guyton plot while retaining the
  subtle highlighted part of the RV-function curve.
- Draw each local ESPVR from the model zero-pressure volume through the actual
  end-systolic pressure–volume point of the completed beat.
- Keep Ea as the line joining `(EDV, 0)` to `(ESV, Pes)`.
- Clear a beat's stored end-systolic pressure after it is consumed, preventing a
  beat with no forward ejection from inheriting the previous beat's value.

### Why

Recomputing a tight domain from every animation frame made the axes move with
the physiology and obscured the very respiratory or beat-to-beat displacement
the panels are intended to teach. An expanding-only view preserves a spatial
reference without clipping a genuinely new state.

The former RV ESPVR used only the selected intrinsic RV Ees, while the simulated
end-systolic RV pressure also contained LV and septal systolic support. In the
healthy presets the stored RV point consequently sat roughly 23–31% above the
drawn line, with larger discrepancies in some low-load states. Removing the
interdependence term would make the picture tidy by deleting physiology. The new
single-beat effective line instead preserves interdependence and passes through
the point that defines it.

### Deliberate limits

The displayed ESPVR is a local single-beat construction anchored to the model's
fixed V0. A physiological ESPVR is more rigorously estimated from a family of
loops obtained while loading changes, and may be mildly nonlinear. The selected
Ees remains the intrinsic active-elastance control; the effective displayed
slope also reflects ventricular interdependence and end-systolic timing.
