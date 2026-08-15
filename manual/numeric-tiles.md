# Numerical tiles

> The tiles report direct model measurements, derived indices and internal coefficients; the label beneath a number is part of the result, not decoration.

---

## Haemodynamics

| tile | category | what it reports |
|---|---|---|
| cardiac output | model measurement | cycle-averaged systemic forward flow, L/min |
| arterial pressure | model measurement | systolic/diastolic and mean systemic arterial pressure, mmHg |
| CVP | model measurement | atmospheric right atrial pressure and its transmural value, mmHg |
| pulmonary artery | model measurement | systolic/diastolic and mean PA pressure, plus the left-atrial-pressure wedge surrogate |
| PVR, derived | derived index | $(mPAP-wedge)/CO$, Wood units |
| pulmonary resistance coefficient | internal coefficient | the resistance used by the pulmonary flow construction, shown in Wood units and dyn·s·cm⁻⁵ |
| RV:LV end-diastolic volume | internal coefficient | ratio of model chamber volumes, with both EDVs in mL |
| mean systemic filling | derived model quantity | Pmsf and the current Pmsf–right-atrial-pressure gradient, mmHg |
| wedge | derived index | left atrial pressure as a PAWP surrogate and represented zone-3 fraction |
| LV ejection fraction | model measurement | model LV ejection fraction and stroke volume |

The derived PVR and pulmonary resistance coefficient answer different questions. The coefficient is used inside the pulmonary flow equation; the derived value is a catheter-like aggregate affected by flow and waterfall conditions. Do not expect them to be identical.

The RV:LV value is a lumped-volume ratio, not the mid-cavity diameter ratio used in echocardiography. Its colour describes model chamber imbalance and does not diagnose acute cor pulmonale.

## Respiratory mechanics and dynamic indices

| tile | category | what it reports |
|---|---|---|
| pulse pressure variation | derived index | PPV and SVV over respiratory cycles, with validity qualifications |
| preload reserve | internal coefficient | local cardiac-function slope, relative gain per mmHg and steep-limb/plateau label |
| respiratory system compliance | derived index | measured tidal compliance and current open-lung fraction |
| recruitment-to-inflation | derived index | achieved R/I for a model PEEP 5→15 manoeuvre, target and recruited volume |
| stress index | derived index | pressure-curve exponent during passive constant-flow volume control |
| plateau pressure | model measurement | calculated plateau and driving pressure, cmH₂O |
| total PEEP | model measurement | total and intrinsic PEEP, trapped volume and EFL state |
| pleural swing | model measurement | recent pleural-pressure amplitude and current Ppl |

The detailed assumptions are on [Interpretability](interpretability.md). In particular, PPV is withheld with spontaneous effort and qualified for small VT, low heart-beat-to-breath ratio, RV dilatation or high abdominal pressure. Stress index requires passive volume control. R/I is unavailable when no collapsed compartment exists.

## Status colours

Some tiles attach descriptive thresholds—for example low output, hypotension, gas trapping or reduced model EF. These thresholds help find a state worth inspecting. They do not convert a teaching model into a diagnostic monitor, and absence of colour does not establish normal physiology.

Pulmonary hypertension classification follows the model's mPAP, wedge and derived-PVR logic. Because PAWP is a surrogate and the pulmonary bed is lumped, the label is descriptive rather than diagnostic.

## When all numbers disappear

If the integrator reaches an out-of-domain state, the model displays an invalid banner and suppresses every tile. Examples include non-finite values, a compartment at its protective volume floor, impossible EF or a lung clamped at capacity. Continuing to print precise numbers would invite interpretation of a numerical artefact.

## Limits

- Tiles mix different averaging windows; small transient discrepancies with an instantaneous panel are expected.
- Thresholds are selected clinical or didactic annotations, not a comprehensive alarm system.
- Exact internal quantities can be less clinically measurable than imperfect derived indices.
- The model cannot flag confounders it does not represent, including arrhythmia, measurement artefact and changing vasoactive drug concentration.
- Derived PVR currently does not automatically inherit the zone-3 caution attached to its wedge surrogate; read both badges together.

## References

- Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation with mechanical ventilation. *Am J Respir Crit Care Med*. 2019;199:22–31. [doi:10.1164/rccm.201801-0088CI](https://doi.org/10.1164/rccm.201801-0088CI)
- Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for pulmonary hypertension. *Eur Heart J*. 2022;43:3618–3731. [doi:10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)
- Pinsky MR, Payen D. Functional hemodynamic monitoring. *Crit Care*. 2005;9:566–572. [doi:10.1186/cc3927](https://doi.org/10.1186/cc3927)

---

## See also

[Interpretability](interpretability.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [Preload reserve](preload-reserve.md) · [Stress index](stress-index.md) · [Global limits](global-limits.md)
