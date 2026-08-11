# Model decisions

This is the durable decision log for substantive physiological changes. It
records why a behaviour was added, changed or retired so that later work — by a
person or another language model — does not have to reconstruct the rationale
from code or commit history alone.

Historical investigations remain in the dated postmortem. This file records the
current decision.

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
| Low recruitability | 2.71 → 3.35 WU, +24% | 2.00 [1.50–3.71] → 3.04 [2.08–4.75] WU, +52% ratio of medians |
| Higher recruitability | 2.45 → 2.64 WU, +8% | 2.80 [2.31–3.61] → 2.94 [2.10–3.75] WU, +5% ratio of medians |

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
