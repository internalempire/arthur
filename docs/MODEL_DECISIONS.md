# Model decisions

This is the durable decision log for substantive physiological changes. It
records why a behaviour was added, changed or retired so that later work — by a
person or another language model — does not have to reconstruct the rationale
from code or commit history alone.

Historical investigations remain in the dated postmortem. This file records the
current decision.

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
