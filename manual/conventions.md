# How to read the manual and the model

> The manual separates established physiology, model implementation and bedside interpretation so that a precise calculation is not mistaken for a validated clinical measurement.

---

## Three kinds of statement

Each concept page begins with the physiology, then explains the model only when the implementation changes what a reader should infer. The section *Why this and not something else* records important alternatives or reversals. *Limits* separates what the construction cannot represent from what must not be concluded clinically.

A statement can therefore be true at one of three levels:

| level | example | appropriate reading |
|---|---|---|
| established physiology | positive pleural pressure reduces LV transmural ejection pressure at unchanged arterial pressure | a general mechanism, still dependent on context |
| model implementation | derecruited lung has a separate vascular pathway whose resistance rises with the HPV control | exactly how this simulator expresses the mechanism |
| model result | output fell after PEEP in one preset | the consequence of that implementation and starting state, not a patient prediction |

## Numbers on the screen

The model labels three numerical categories:

- **model measurement** — measured directly from the simulated state or waveform, such as arterial pressure or cardiac output;
- **derived index** — calculated from model measurements and meaningful only when its assumptions hold, such as PPV or stress index;
- **internal model coefficient** — a parameter used by the equations, such as the pulmonary resistance coefficient from the J-curve.

Some latent quantities, including true open fraction and stressed volume, are exactly known because this is a simulation. They are not directly measurable with the same certainty in a patient. [Interpretability](interpretability.md) gives the complete distinction.

## Quality messages

| state | meaning |
|---|---|
| no message | the encoded prerequisites are present; this is not proof of external clinical validity |
| interpret with caution | the number remains visible, but at least one known confounder applies |
| not interpretable | a required condition is absent, so the value is withheld |

The model-wide invalid banner is different. It suppresses readouts when the numerical state has left the domain for which the equations are intended.

## Pressure conventions

Airway, alveolar, pleural and abdominal pressure are displayed in cmH₂O. Vascular and chamber pressures are displayed in mmHg. When the same physical pressure crosses between respiratory and circulatory equations, the model converts units explicitly.

Measured vascular pressure is referenced to atmosphere. Transmural pressure is inside minus surrounding pressure. A rise in CVP during positive-pressure inspiration can therefore coexist with a fall in right atrial distension.

Flow is positive in the forward physiological direction. Lung volume in the waveforms is volume above the calculated resting reference, while the PVR panel uses absolute lung volume in litres.

## Time conventions

Waveforms show the most recent <!-- CONSISTENCY: trace-window-seconds -->12<!-- /CONSISTENCY --> seconds. Numerical haemodynamic values are generally beat or cycle measurements smoothed for readability; the instantaneous drawing may therefore lead or lag a tile slightly. On the Guyton panel, the faint trail uses one-heartbeat means of right atrial pressure and IVC-to-right-atrial venous inflow. The filled point averages those variables over one complete breath so it can be compared with the hollow analytic crossing. Neither venous-inflow display is a direct cardiac-output measurement.

Simulation speed changes wall-clock playback only. Pause freezes state; it is not an occlusion. Respiratory holds are model manoeuvres and continue according to simulated time.

## Mathematical notation

Equations are included only where they prevent an ambiguous physiological interpretation or expose a relevant simplification. Every symbol is defined immediately below the equation. A coefficient described as a **didactic shape coefficient** was selected to express a qualitative relationship and must not be read as a measured human constant.

## References and links

Literature citations support physiological principles or quantitative constraints. They are not attached to arbitrary coefficients merely because a paper describes the same broad mechanism. Links between pages are part of the explanation: follow them when a term carries more assumptions than can fit in one paragraph.

## Limits

The manual can document a known confounder only after it has been recognised. A clean page, a rendered formula and a green test cannot establish that an omitted mechanism is harmless. When the implementation and literature diverge, [global limits](global-limits.md) and the page-specific limits take precedence over a reassuring label.

## References

- International Bureau of Weights and Measures. *The International System of Units (SI Brochure)*. 9th ed. 2019, updated 2022. <https://www.bipm.org/en/publications/si-brochure>
- Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension. *Eur Heart J*. 2022;43:3618–3731. [doi:10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)

---

## See also

[Interpretability](interpretability.md) · [Glossary](glossary.md) · [Validation](validation.md) · [Global limits](global-limits.md) · [Model architecture](model-architecture.md)
