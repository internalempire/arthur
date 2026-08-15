# Interpretability

> A number is useful only if its name still means what the reader thinks it means under the current conditions; the model separates measurements, derived indices and internal coefficients, and can qualify or withhold them.

---

## Physiology

Haemodynamic numbers belong to different epistemic categories.

| category | example | what can invalidate it |
|---|---|---|
| direct model measurement | arterial pressure, chamber volume | the model leaving its numerical or physiological domain |
| derived physiological index | PPV, stress index, catheter-derived PVR | the assumptions needed to interpret the calculation |
| internal coefficient | the resistance used inside the pulmonary flow equation | confusing a model parameter with a bedside measurement |
| model-only latent state | stressed volume, open fraction, true Pmsf | treating an exactly known simulation variable as something directly measurable in a patient |

The arithmetic of a derived index can remain correct while its clinical meaning disappears. PPV can still be calculated during spontaneous effort, but it no longer tests the controlled ventilation mechanism for which it was validated. Left atrial pressure can still be subtracted from mPAP, but it is not necessarily equivalent to an occluded pulmonary artery pressure outside West zone 3. A number should therefore be withheld or qualified at the point where its assumptions fail, not merely accompanied by a warning elsewhere.

---

## In the model

Each supported derived index has one of three states:

- **ok** — the model contains the conditions it requires;
- **caution** — the number is shown, but one or more known confounders make its usual interpretation uncertain;
- **unavailable** — the required measurement or physiological condition is absent, so the model withholds the interpretation.

This is separate from the model-wide validity flag. The global flag detects numerical or domain failures such as a compartment reaching its volume floor, non-finite output, an impossible ejection fraction or a lung clamped at capacity. An individual index may be unavailable in an otherwise valid simulation.

### Current index rules

| index | unavailable when | caution when |
|---|---|---|
| stress index | not passive volume control, or no complete breath | — |
| preload reserve | the Guyton curves have no finite crossing | — |
| PPV | spontaneous effort | VT below 8 mL/kg for an assumed 70 kg reference, fewer than 3.6 beats/breath, RV/LV EDV ratio above 1.2, or abdominal pressure above 12 cmH₂O |
| R/I | no collapsed compartment | the requested ratio exceeds what the selected lung can recruit |
| plateau pressure | spontaneous effort | — |
| wedge surrogate | — | the zone 3 pressure-margin index is below 0.95 |
| derived PVR | no meaningful forward flow | the wedge surrogate is cautioned |

The list is intentionally inspectable rather than hidden in scenario-specific prose. Dependencies are propagated: derived PVR inherits the caution of its [wedge surrogate](pulmonary-artery-wedge-pressure.md), because valid arithmetic cannot repair an uncertain downstream pressure.

### Similar names that are deliberately separated

The pulmonary circulation reports both the model's resistance coefficient and $(mPAP-P_{LA})/CO$. The first is what the integrator uses; the second is the catheter-like aggregate resulting from resistance, waterfall conditions and flow. They need not change by the same percentage.

The Guyton panel reports the simulated cycle-mean point and the analytic crossing separately. The first is integrated state; the second is a steady-state construction.

The pulmonary-transit page separates represented blood volume, the central-volume estimate and the bounded staged-buffer time. None is labelled as a contrast-bolus measurement.

---

## Why this and not something else

Silently suppressing every imperfect number would remove useful teaching signals. Printing every computable number without qualification would imply a false precision. Three levels preserve the distinction between “cannot be interpreted”, “can be inspected with caution” and “is represented under its stated assumptions”.

The rules are mechanism-specific rather than scenario-specific. A spontaneous patient makes PPV unavailable whether that patient came from a preset or from manual controls. This prevents a scenario label from acting as an unearned validation.

---

## Limits

### Of the construction

- Interpretability rules cover known, encoded confounders only; they cannot detect phenomena the model does not contain, such as arrhythmia or measurement artefact.
- Several thresholds are pragmatic model rules rather than universal clinical boundaries.
- A green badge means the model has the required conditions, not that the model is quantitatively validated for that use.
- The current linter checks rendering and links, not contradictions between the manual, code and literature.
- The zone 3 rule is a conservative pressure-margin heuristic in a non-regional lung, not a measured fraction of perfused human lung.

### Of clinical application

- The badges must not be converted into treatment recommendations.
- “Unavailable” means the model declines the interpretation; it does not mean the corresponding bedside question is unknowable by another method.
- “Ok” is not a diagnostic accuracy claim and does not validate a cutoff for an individual patient.

---

## Validation

Contract tests require spontaneous breathing to withhold PPV and stress index where appropriate, low tidal volume and RV dilatation to qualify PPV, R/I to be unavailable without collapsed lung, and every scenario audit statement to agree with the active badges. Separate safety tests detect non-finite or out-of-domain global states.

---

## References

- Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation with mechanical ventilation. *Am J Respir Crit Care Med*. 2019;199:22–31. [doi:10.1164/rccm.201801-0088CI](https://doi.org/10.1164/rccm.201801-0088CI)
- Monnet X, Marik PE, Teboul JL. Prediction of fluid responsiveness: an update. *Ann Intensive Care*. 2016;6:111. [doi:10.1186/s13613-016-0216-7](https://doi.org/10.1186/s13613-016-0216-7)
- Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension. *Eur Heart J*. 2022;43:3618–3731. [doi:10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)
- Pinsky MR, Payen D. Functional hemodynamic monitoring. *Crit Care*. 2005;9:566–572. [doi:10.1186/cc3927](https://doi.org/10.1186/cc3927)

---

## See also

[Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [Preload reserve](preload-reserve.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Stress index](stress-index.md) · [Global limits](global-limits.md)
