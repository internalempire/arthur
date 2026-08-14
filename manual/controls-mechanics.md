# Respiratory mechanics controls

> Mechanics controls determine how applied pressure is divided between lung, chest wall and airway, how much lung is available, and whether opening or emptying has memory.

---

## Basic mechanics

| control | range | model meaning |
|---|---:|---|
| body position | supine, prone | applies a coarse coordinated change in chest wall, abdomen and recruitment distribution |
| lung compliance, fully open | 20–420 mL/cmH₂O | tissue compliance if the represented lung were completely open |
| chest-wall compliance | 40–300 mL/cmH₂O | linear chest-wall pressure–volume slope |
| airway resistance | 1–40 cmH₂O/L/s | linear resistance applied during flow |
| expiratory flow limitation | off/on | activates a collapsible-airway choke during expiration |

`Lung compliance, fully open` is not the compliance a ventilator would report when part of the lung is closed. Measured respiratory-system compliance also depends on open fraction and chest-wall mechanics. This separation lets recruitment enlarge the functional baby lung without pretending that tissue itself became more compliant.

High fully-open compliance means low elastic recoil. The pressure–volume curve then rests at a higher volume, which permits an emphysema-like hyperinflation phenotype without a separate FRC slider.

Airway resistance remains linear; EFL adds a separate expiratory choke. This distinction matters because increasing expiratory driving pressure still raises flow through a linear resistor but not once a waterfall is active.

## Collapse and recruitment

| control | range | model meaning |
|---|---:|---|
| collapsed lung | 0–0.80 | fraction unavailable at low pressure before recruitment |
| R/I ratio | 0–2.0 | target recruitment relative to inflation for model PEEP 5→15 |
| opening pressure | 5–40 cmH₂O | centre of the opening range of recruitable diseased units |
| recruitment hysteresis | off/on | permits recruited diseased units to remain open on falling pressure |
| closing pressure | 2–40 cmH₂O | centre of the closing range; active only with hysteresis on |

Collapse answers “how much lung is initially unavailable”; R/I answers “how much of it opens over the reference pressure step”; opening pressure answers “where along transpulmonary pressure the opening occurs”. These are separate questions and the controls should not be used as interchangeable severity sliders.

Opening and closing pressures are the centres of broad recruitment ranges, not single thresholds at which the entire lung flips state. Hysteresis applies only to the recruitable diseased population; already aerated lung follows the ordinary pressure–volume relation without recruitment memory.

## Abdomen and thorax

| control | range | model meaning |
|---|---:|---|
| baseline abdominal pressure | 0–30 cmH₂O | abdominal surrounding pressure and critical closing pressure for the aggregate IVC pathway |
| diaphragm–abdomen coupling | 0–12 cmH₂O/L | rise in abdominal pressure per litre of lung inflation |

Abdominal pressure can raise upstream systemic venous pressure while also increasing resistance or critical closing behaviour in venous return. The net effect depends on reservoir filling and right atrial pressure; it cannot be inferred from Pab alone.

Prone position is deliberately coarse. It combines directional changes intended to provoke thought about competing mechanics, not to predict an individual response.

## Limits

- One lung and one chest wall replace regional stress, dependent collapse and pleural-pressure gradients.
- Chest-wall compliance is linear and its resting reference cannot be adjusted independently.
- R/I is mapped to a standard model manoeuvre and is not recalculated from an actual bedside pressure–volume acquisition.
- Recruitment has one diseased population; opening pressures are distributed but not spatially assigned.
- EFL has one choke and no small-airway heterogeneity, airway closure or gas compression.
- Prone effects are directional and not patient-specific.

## References

- Chen L, Del Sorbo L, Grieco DL, et al. Potential for lung recruitment estimated by the recruitment-to-inflation ratio in ARDS. *Am J Respir Crit Care Med*. 2020;201:178–187. [doi:10.1164/rccm.201902-0334OC](https://doi.org/10.1164/rccm.201902-0334OC)
- Mead J, Turner JM, Macklem PT, Little JB. Significance of the relationship between lung recoil and maximum expiratory flow. *J Appl Physiol*. 1967;22:95–108. [doi:10.1152/jappl.1967.22.1.95](https://doi.org/10.1152/jappl.1967.22.1.95)
- Pelosi P, D'Andrea L, Vitale G, et al. Vertical gradient of regional lung inflation in adult respiratory distress syndrome. *Am J Respir Crit Care Med*. 1994;149:8–13.

---

## See also

[Pressure–volume curve](pressure-volume-curve.md) · [Two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Hysteresis](hysteresis.md) · [Abdominal pressure](abdominal-pressure.md) · [Expiratory flow limitation](expiratory-flow-limitation.md)
