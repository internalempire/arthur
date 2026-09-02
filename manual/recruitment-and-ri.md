# Recruitment and R/I

> Recruitability is a control in this model, and it is expressed as the ratio a clinician measures — recruitment-to-inflation — rather than as an internal fraction of units. The model solves for the internal fraction that reproduces the requested ratio under the reference manoeuvre.

---

## Physiology

Applying PEEP to an injured lung does two things at once. It inflates the lung that is already open, and it may open lung that was shut. The first is unavoidable and carries a risk of overdistension; the second is the reason for doing it. Nothing measurable at the bedside separates them directly — end-expiratory lung volume rises either way.

The **recruitment-to-inflation ratio** separates them by subtraction. Step PEEP down from a high to a low value and measure the volume released. Some of it is the passive deflation predicted by the compliance at the low PEEP; the rest, by difference, must have come from lung that closed.

$$
R/I = \frac{C_{rec}}{C_{low}}, \qquad C_{rec} = \frac{\Delta V_{EELV} - C_{low}\,\Delta P}{\Delta P}
$$

- $R/I$ — recruitment-to-inflation ratio, dimensionless
- $C_{low}$ — respiratory system compliance at the low PEEP, mL/cmH₂O
- $C_{rec}$ — "recruited compliance": the extra volume per unit pressure attributable to opening, mL/cmH₂O
- $\Delta V_{EELV}$ — measured change in end-expiratory lung volume, mL
- $\Delta P$ — the PEEP step, cmH₂O

A value near zero means the PEEP step only inflated. A high value means much of the volume came from lung that opened. A conventional split at 0.5 is used to separate higher from lower recruiters in the published cohorts.

The index is **protocol-dependent**: it is defined by a particular PEEP step, and a different step gives a different number for the same patient. That is a property of the measurement, not a defect of it, and it is why the pressures belong in the definition.

---

## In the model

The user sets `riRatio`. The model does **not** use it directly. It solves for the internal openable fraction that would produce that ratio under the reference manoeuvre.

**The reference manoeuvre** is PEEP <!-- CONSISTENCY: ri-reference-step -->5 → 15<!-- /CONSISTENCY --> cmH₂O, held as constants in the lung module rather than hidden in a test fixture, because the number means nothing without them.

**The solve.** For a candidate openable fraction, the model computes the static end-expiratory volume at both PEEP levels, takes the tangent respiratory system compliance at the low one, and applies the R/I formula. It samples twelve candidates, finds the maximum achievable ratio for this phenotype, then bisects to the requested value. This is a static analogue of the bedside method, not a simulation of its single-breath measurement protocol.

**The result is capped by the lung.** The collapsed compartment is finite and the opening pressure is a separate control, so a patient may not be able to reach the requested ratio. The model then reports the achieved value and raises a caution rather than silently pretending.

**Matching R/I does not validate the whole pressure–volume state.** The same ratio can be produced by different combinations of pleural pressure, transpulmonary pressure, opening range, tissue compliance and collapsed volume. Scenario validation must therefore check the absolute pressure window, EELV, plateau pressure and measured compliance as well as the achieved ratio. The ARDS preset is tested this way; moving `pOpen` merely to preserve R/I while those other quantities drift is explicitly rejected.

| requested R/I | achieved | maximum for this patient | recruited volume | end-expiratory volume |
|---|---|---|---|---|
| 0 | 0.00 | — | −20 mL | 1.06 L |
| 0.2 | 0.20 | 1.07 | 36 | 1.09 |
| 0.5 | 0.50 | 1.07 | 93 | 1.12 |
| 0.8 | 0.80 | 1.07 | 158 | 1.16 |
| 1.2 | **1.07** | 1.07 | 228 | 1.21 |

The last row is the interesting one: the request is refused and the readout says so.

The negative recruited volume at R/I 0 is not a bug. It means the average compliance over the step was *lower* than its low-PEEP tangent — pure inflation with a touch of overdistension. Bedside R/I is reported from zero upward, so the clinical readout is floored while the raw value stays available to the tests.

### Cohort constraint on the latent mapping

The internal openable fraction is not observed in the Cappio Borlino cohort. It can nevertheless be constrained indirectly: one shared mechanical phenotype is evaluated at the published median R/I of the low- and high-recruiter groups, then its recruited volume and lung compliance at low and high PEEP are required to remain inside the corresponding Table 2 interquartile ranges. Collapse, tissue compliance, maximum capacity, chest wall and opening midpoint do not change between the rows.

<!-- BEGIN GENERATED: ri-cohort-mapping -->
*Executable shared phenotype: collapsed compartment 30%, aerated-lung compliance 55 mL/cmH₂O, maximum capacity 6.0 L, chest-wall compliance 200 mL/cmH₂O, no external wall load and diseased opening midpoint 17 cmH₂O. Only the cohort median R/I changes between rows.*

| cohort group | requested / achieved R/I | latent openable share of diseased compartment | latent openable share of whole lung | recruited volume, model / observed IQR (mL) | low-PEEP C<sub>L</sub>, model / observed IQR | high-PEEP C<sub>L</sub>, model / observed IQR |
|---|---:|---:|---:|---:|---:|---:|
| low recruiters | 0.35 / 0.35 | 24% | 7% | 118 / 90–202 | 41 / undefined–undefined | 41 / undefined–undefined |
| high recruiters | 0.72 / 0.72 | 53% | 16% | 263 / 181–421 | 45 / undefined–undefined | 49 / undefined–undefined |
<!-- END GENERATED: ri-cohort-mapping -->

The higher median R/I therefore maps to a larger latent recruitable share without using a different lung phenotype to obtain the answer. The diseased opening transition has a <!-- CONSISTENCY: diseased-recruitment-width -->0.75 cmH₂O<!-- /CONSISTENCY --> width because the previous 2 cmH₂O transition could not keep recruited volume and both compliance measurements inside the reported group ranges simultaneously. This is an aggregate cohort constraint on the translation, not direct anatomical validation of the latent percentages: the study did not measure those percentages, and its IQRs do not preserve patient-level covariance.

### What recruitment then does

Because the open fraction feeds the [pressure–volume curve](pressure-volume-curve.md) and the [strain](two-population-lung.md) term, opening lung changes the mechanics rather than being recorded alongside them:

- respiratory system compliance rises, because there is more lung to inflate;
- resting volume rises, because a more open lung comes to rest higher;
- strain falls at constant tidal volume, because the same volume is shared among more units;
- [pulmonary vascular resistance](pulmonary-vascular-resistance.md) changes in two ways at once — more vascular pathway in parallel, and a different position on the J-curve.

That last coupling is why a PEEP step in a poorly recruitable lung raises derived PVR by 20% while in a recruitable one it changes it by 4%.

---

## Why this and not something else

**Replacing the fraction with the measured index.** The control used to be "what fraction of the collapsed compartment can ever open". That is a useful internal state and not a measurable quantity, and renaming it R/I would have been false. Chen's definition was implemented instead, and the internal fraction is solved to match it.

The difference was not cosmetic. With the earlier opening distribution, the reference phenotype produced R/I below 0.15 even when every collapsed unit was allowed to open — a number that could not occur in the cohorts the control is named for. Making the control honest exposed that the distribution was wrong, which a rename would have hidden.

**Solving numerically rather than inverting analytically.** The relation between openable fraction and R/I passes through two static pressure–volume solves and a tangent compliance, and has no closed form. Twelve samples plus a bisection is cheap and, because it is the *same* code path the assessment uses, cannot disagree with it.

**Reporting the achieved value and a caution.** The alternative is to clamp silently. A control that accepts a number while delivering another would be misleading in a teaching model.

---

## Limits

### Of the construction

- **R/I is protocol-dependent and the model fixes one protocol.** Its <!-- CONSISTENCY: ri-reference-step -->5 → 15<!-- /CONSISTENCY --> step is the reference; a patient's measured value from a different step is not the same quantity.
- **No airway opening pressure.** Chen's method corrects for the case where airway opening pressure exceeds the low PEEP; the model has no such measurement, so its 10 cmH₂O effective step cannot reproduce that correction.
- **The solve is static.** It uses equilibrium volumes, not a single-breath manoeuvre with its flow and timing.
- **The calibration ignores hysteretic history.** The internal mapping from requested R/I to openable fraction does not include `pClose` or the path by which the lung reached either pressure. When hysteresis is enabled, the actual decremental response can therefore differ from the static reference mapping.
- The maximum achievable ratio depends on `collapsed` and `pOpen`, so the control's usable range moves with the rest of the phenotype.
- Recruitment here is instantaneous with pressure except where [hysteresis](hysteresis.md) is enabled. There is no time-dependent recruitment, no slow opening over minutes.

### Of clinical application

- **A high R/I does not mean high PEEP is safe or beneficial.** The model deliberately does not turn its PEEP response into a recommendation, and there is no outcome in it to optimise.
- **The 0.5 split is a teaching convention** taken from the published cohorts, not a validated decision threshold.
- The model has no oxygenation, no dead space and no CO₂, so it can show only the mechanical and haemodynamic half of a PEEP trial. Three of the four readings a bedside PEEP step is judged on are unavailable here.
- Recruited volume in millilitres is a model quantity computed from its own equilibrium volumes, not a measurement.

---

## References

- Chen L, Del Sorbo L, Grieco DL, et al. [Potential for lung recruitment estimated by the recruitment-to-inflation ratio in ARDS: a clinical trial](https://doi.org/10.1164/rccm.201902-0334OC). *Am J Respir Crit Care Med* 2020;201:178–87.
- Chen L, Chen G-Q, Shore K, et al. Implementing a bedside assessment of respiratory mechanics in patients with acute respiratory distress syndrome. *Crit Care* 2017;21:84. [doi:10.1186/s13054-017-1671-8](https://doi.org/10.1186/s13054-017-1671-8)
- Gattinoni L, Caironi P, Cressoni M, et al. Lung recruitment in patients with the acute respiratory distress syndrome. *N Engl J Med* 2006;354:1775–86. [doi:10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of positive end-expiratory pressure on pulmonary vascular resistance depends on lung recruitability in patients with acute respiratory distress syndrome. *Am J Respir Crit Care Med* 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC)

---

## See also

[The two-population lung](two-population-lung.md) · [Pressure–volume curve](pressure-volume-curve.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Interpretability](interpretability.md) · [ARDS with right ventricular failure](scenarios.md#ards-with-right-ventricular-failure) · [Controls: mechanics](controls-mechanics.md)
