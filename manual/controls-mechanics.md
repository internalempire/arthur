# Respiratory mechanics controls

> Mechanics controls determine how applied pressure is divided between lung, chest wall and airway, how much lung is available, and whether opening or emptying has memory.

---

## Basic mechanics

| control | range | model meaning |
|---|---:|---|
| body position | supine, prone | applies a coarse coordinated change in chest wall, abdomen and recruitment distribution |
| aerated-lung compliance | 20–420 mL/cmH₂O | local pressure–volume slope of aerated tissue away from its upper-volume limit |
| maximum lung capacity | 2–9 L | volume ceiling of a completely open lung; default 6 L |
| chest-wall compliance | 40–300 mL/cmH₂O | local slope of the independent wall curve near the normal reference volume |
| chest-wall load | −5–20 cmH₂O | pressure offset that shifts the relaxed wall curve without changing its selected slope |
| airway resistance | 1–40 cmH₂O/L/s | linear resistance applied during flow |
| expiratory flow limitation | off/on | activates a collapsible-airway choke during expiration |

`Aerated-lung compliance` is not the compliance a ventilator would report when part of the lung is closed. It is the local tissue slope used at the current operating point, before recruitment and chest-wall effects are added. Measured respiratory-system compliance also depends on open fraction, proximity to maximum capacity and chest-wall mechanics.

`Maximum lung capacity` is independent of that slope. It is a direct teaching-scale input in litres, not an anthropometric predicted TLC. Collapse reduces the fraction of this ceiling currently accessible; recruitment can restore part of it. This separation prevents low compliance and collapse from shrinking the same baby lung twice.

High aerated-lung compliance means low elastic recoil. The pressure–volume curve then rests at a higher volume, which permits an emphysema-like hyperinflation phenotype without a separate FRC slider. It does not automatically enlarge maximum capacity.

Chest-wall compliance and chest-wall load answer different questions. Reducing `ccw` makes the pleural-pressure swing larger for a given delivered volume. Raising `cwLoad` changes the resting relation, making pleural pressure less negative or positive and moving the passive lung–wall equilibrium. Obesity and intra-abdominal hypertension can contain both changes, but the model does not assume a fixed conversion from body mass or abdominal pressure to thoracic load.

The wall is nonlinear at the volume extremes and approximately linear around tidal breathing. The displayed compliance control is therefore a **reference local slope**, not one value imposed at every volume. See [pleural pressure](pleural-pressure.md).

Airway resistance remains linear; EFL adds a separate expiratory choke. This distinction matters because increasing expiratory driving pressure still raises flow through a linear resistor but not once a waterfall is active.

## Collapse and recruitment

| control | range | model meaning |
|---|---:|---|
| collapsed lung | 0–0.80 | fraction unavailable at low pressure before recruitment |
| R/I ratio | 0–2.0 | target recruitment relative to inflation for model PEEP <!-- CONSISTENCY: ri-reference-step -->5 → 15<!-- /CONSISTENCY --> |
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

`pab0` does not automatically set `cwLoad`. The abdomen-to-thorax pressure transfer depends on posture, diaphragm geometry and abdominal mechanics that the model does not resolve. The intra-abdominal-hypertension preset selects both controls explicitly, while leaving them independent for exploration.

Prone position is deliberately coarse. It combines directional changes intended to provoke thought about competing mechanics, not to predict an individual response.

## Limits

- One lung and one chest wall replace regional stress, dependent collapse and pleural-pressure gradients.
- Maximum capacity is entered directly in litres; height-, sex- and age-based prediction is not implemented.
- The chest wall has one aggregate sigmoid curve; rib cage, diaphragm and abdominal wall are not separate compartments.
- Chest-wall load is selected directly rather than predicted from anthropometry, posture or abdominal pressure.
- R/I is mapped to a standard model manoeuvre and is not recalculated from an actual bedside pressure–volume acquisition.
- Recruitment has one diseased population; opening pressures are distributed but not spatially assigned.
- EFL has one choke and no small-airway heterogeneity, airway closure or gas compression.
- Prone effects are directional and not patient-specific.

## References

- Chen L, Del Sorbo L, Grieco DL, et al. Potential for lung recruitment estimated by the recruitment-to-inflation ratio in ARDS. *Am J Respir Crit Care Med*. 2020;201:178–187. [doi:10.1164/rccm.201902-0334OC](https://doi.org/10.1164/rccm.201902-0334OC)
- Mead J, Turner JM, Macklem PT, Little JB. Significance of the relationship between lung recoil and maximum expiratory flow. *J Appl Physiol*. 1967;22:95–108. [doi:10.1152/jappl.1967.22.1.95](https://doi.org/10.1152/jappl.1967.22.1.95)
- Pelosi P, D'Andrea L, Vitale G, et al. Vertical gradient of regional lung inflation in adult respiratory distress syndrome. *Am J Respir Crit Care Med*. 1994;149:8–13. [doi:10.1164/ajrccm.149.1.8111603](https://doi.org/10.1164/ajrccm.149.1.8111603)
- Agostoni E, Hyatt RE. Static behavior of the respiratory system. In: *Handbook of Physiology, The Respiratory System*. 1986:113–130. [doi:10.1002/cphy.cp030309](https://doi.org/10.1002/cphy.cp030309)
- Pereira C, Bohé J, Rosselli S, et al. Sigmoidal equation for lung and chest wall volume-pressure curves in acute respiratory failure. *J Appl Physiol*. 2003;95:2064–2071. [doi:10.1152/japplphysiol.00385.2003](https://doi.org/10.1152/japplphysiol.00385.2003)
- Behazin N, Jones SB, Cohen RI, Loring SH. Respiratory restriction and elevated pleural and esophageal pressures in morbid obesity. *J Appl Physiol*. 2010;108:212–218. [doi:10.1152/japplphysiol.91356.2008](https://doi.org/10.1152/japplphysiol.91356.2008)

---

## See also

[Pressure–volume curve](pressure-volume-curve.md) · [Two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Hysteresis](hysteresis.md) · [Abdominal pressure](abdominal-pressure.md) · [Expiratory flow limitation](expiratory-flow-limitation.md)
