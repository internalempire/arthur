# Model decisions

This is the durable decision log for substantive physiological changes. It
records why a behaviour was added, changed or retired so that later work — by a
person or another language model — does not have to reconstruct the rationale
from code or commit history alone.

Historical investigations remain in the dated postmortem. This file records the
current decision.

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
  and mobilises the same volume as stressed, without adding blood; the
  user-facing reflex gain can scale this response.
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
`recruitable` control also remains a fraction of collapsed units that can open,
not the measured recruitment-to-inflation ratio. Replacing it with R/I requires
a separate calibration and is not hidden inside this phase.

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
