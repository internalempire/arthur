# Recruitment hysteresis

> Optional. Collapsed units may need a high pressure to reopen but a much lower pressure to remain open. The model retains this recruitment history without attempting to reproduce the complete respiratory pressure–volume loop.

---

## Physiology

Opening and keeping an injured lung open are not the same mechanical problem. A collapsed unit may reopen only after a relatively high critical pressure is reached, yet remain aerated until pressure falls to a lower closing range. Surfactant behaviour, geometry, parenchymal interdependence and time all contribute to this difference in vivo.

The result is path dependence: at the same transpulmonary pressure, more lung may be aerated after recruitment than before it. This is the rationale for pairing a recruitment manoeuvre with sufficient pressure afterwards. The high pressure opens units; the pressure that follows determines whether the gain is retained.

If pressure subsequently crosses the closing range, the recruited units close again. A manoeuvre may therefore produce a transient mechanical effect without leaving a persistent benefit.

A classical respiratory pressure–volume loop contains more than recruitment and derecruitment. It also reflects surfactant dynamics, tissue viscoelasticity, stress relaxation and the duration and flow of the manoeuvre. Those components are not represented here.

---

## In the model

Hysteresis is off by default. When it is enabled, two controls describe the recruitable part of the collapsed lung:

- `pOpen` locates the **opening range**. Opening is gradual: at this transpulmonary pressure half of the units that can be recruited have opened during rising pressure.
- `pClose` locates the lower **closing range**. During falling pressure, half of those recruitable units remain open at this pressure.

Both are transpulmonary pressures. They are not airway pressures, PEEP values or sharply defined thresholds at which every unit changes state.

The model treats the lung as two contributions:

1. The already-aerated fraction follows the current transpulmonary pressure. It does not remember a recruitment manoeuvre.
2. The collapsed but recruitable fraction can retain its previous state between the opening and closing ranges.

This distinction is important. In an earlier implementation, recruitment memory was applied to the whole lung. That made the already-aerated fraction behave as if it had the same opening and closing pressures as injured lung. The current implementation confines memory to the compartment for which `pOpen` and `pClose` are defined.

The calculation can be summarised as:

$$
\varphi(P_l) = \varphi_{aerated}(P_l) + r
$$

- $\varphi$ — total open fraction of the lung
- $\varphi_{aerated}$ — already-aerated fraction open at the present transpulmonary pressure
- $r$ — fraction of the whole lung currently represented by open, recruitable diseased units
- $P_l$ — transpulmonary pressure, cmH₂O

At each simulation step, $r$ is compared with the amount that the present pressure can open and the amount it can keep open. It rises when pressure enters the opening range, falls when pressure enters the closing range, and otherwise remains unchanged. This bounded memory rule is rate-independent: pressure history matters, but the time spent at a pressure does not.

The resulting total open fraction is used by lung mechanics, strain and [pulmonary vascular resistance](pulmonary-vascular-resistance.md). A lung with no collapsed compartment now behaves identically with hysteresis on or off.

### A reproducible experiment

Consider a recruitable ARDS phenotype under volume control: tidal volume 250 mL, respiratory rate 20/min, `clung` 45 mL/cmH₂O, `collapsed` 0.45, R/I 0.6, `pOpen` 22 cmH₂O and `pClose` 6 cmH₂O. After equilibration at PEEP 10, PEEP is raised to 35 for 30 seconds and then returned to 10.

| | before | after |
|---|---|---|
| lung open | 80.3% | **96.2%** |
| pulmonary resistance coefficient | 1.41 WU | 1.21 WU |

At the same final PEEP, 15.9 percentage points more lung remain open. Within the model, the larger aerated fraction also lowers the pulmonary resistance coefficient.

Walking the same simulated lung upward and then downward through a PEEP sequence produces two recruitment-state paths:

![Open fraction during an incremental and decremental PEEP sequence](figure/hysteresis.svg)

| PEEP | incremental: P<sub>l</sub> / open | decremental: P<sub>l</sub> / open |
|---|---|---|
| 6 cmH₂O | 9.2 / 69.9% | 7.9 / **87.5%** |
| 8 | 10.6 / 75.0% | 9.3 / **92.7%** |
| 10 | 12.0 / 80.2% | 10.8 / **96.2%** |
| 14 | 14.7 / 90.4% | 14.0 / **99.2%** |
| 22 | 20.9 / 99.6% | 20.9 / 100.0% |

The two paths meet at high pressure, where almost all recruitable units are open, and separate as pressure falls through the range in which recruitment can be retained. The exact horizontal coordinates differ between the paths because the same PEEP does not produce the same transpulmonary pressure when aerated volume differs.

The vertical axis is open fraction, not lung volume. The figure is therefore **not** the classical inflation–deflation pressure–volume loop and should not be interpreted as one. Its narrower vertical scale is a display choice that makes the separation visible; it is not a physiological boundary.

### When the manoeuvre leaves little or nothing

Three examples are useful at the bedside:

**Pressure afterwards is too low.** If pressure falls through the closing range, recently opened units close again. In the example above, raising `pClose` to 14 cmH₂O leaves essentially no persistent gain after return to PEEP 10.

**Ordinary breaths already reach the opening range.** Increasing tidal volume from 250 to 400 mL leaves only a 2.3-point gain after the manoeuvre because the preceding breaths had already recruited much of the available compartment. This is a model illustration, not a recommendation to use a larger tidal volume.

**The collapsed lung is poorly recruitable.** Pressure cannot retain units that the model has classified as non-openable consolidation.

---

## Why this and not something else

**A physiological memory rather than a manoeuvre button.** A button could impose a prewritten improvement after high pressure. Carrying the recruited fraction as a state allows the result to depend on the pressure reached, the tidal excursion and what happens afterwards.

**Memory only in the recruitable compartment.** The controls describe injured units that can open and close. Applying the same history to already-aerated lung would be mathematically convenient but physiologically incoherent.

**Off by default.** With path dependence, identical current settings can produce different states depending on what happened earlier. That behaviour is useful but can confuse a first reading, so it remains optional.

**No time constant.** Recruitment in vivo depends on both pressure and duration. A time-dependent implementation would require one or more poorly anchored rates and would add complexity beyond the present teaching aim. The model therefore changes recruitment as soon as the relevant pressure range is crossed.

---

## Limits

### Of the construction

- **Only recruitment and derecruitment memory are represented.** The tissue pressure–volume relation itself is single-valued. Surfactant dynamics, viscoelasticity, stress relaxation and the area of a measured respiratory pressure–volume loop are absent.
- **No time dependence.** Holding the same pressure for one second or one minute produces no additional recruitment or derecruitment.
- **Shared opening and closing distributions.** All recruitable units belong to two smooth pressure ranges with fixed widths; there is no patient-specific distribution of regional thresholds.
- **One global recruitment state.** Dependent and non-dependent regions cannot open or close differently.
- `pOpen` and `pClose` are model inputs. The model does not estimate them from a bedside manoeuvre.

### Of clinical application

- The model gives no guidance on whether or how to perform a recruitment manoeuvre and represents few of its risks. Acute haemodynamic effects are present; barotrauma and ventilator-induced lung injury are not.
- The example values belong to one simulated phenotype and should not be transferred to a patient.
- Oxygenation, dead space and CO₂ are absent. The model can therefore show only mechanical and haemodynamic consequences of a PEEP trial.
- A decremental path that looks favourable here cannot define an optimal clinical PEEP.

---

## Validation

Executable tests require the following properties:

- a recruitment manoeuvre can leave a recruitable lung more open at the original PEEP;
- the decremental path remains above the incremental path within the retention range;
- retained recruitment lowers the model pulmonary resistance coefficient;
- returning below the closing range removes the gain;
- a lung with no collapsed compartment has no recruitment hysteresis and gives bit-identical mechanics with the feature on or off;
- setting `pClose` equal to `pOpen` is equivalent to switching hysteresis off.

---

## References

- Rimensberger PC, Cox PN, Frndova H, Bryan AC. The open lung during small tidal volume ventilation: concepts of recruitment and "optimal" positive end-expiratory pressure. *Crit Care Med* 1999;27:1946–52. [doi:10.1097/00003246-199909000-00038](https://doi.org/10.1097/00003246-199909000-00038)
- Hickling KG. Best compliance during a decremental, but not incremental, positive end-expiratory pressure trial is related to open-lung positive end-expiratory pressure. *Am J Respir Crit Care Med* 2001;163:69–78. [doi:10.1164/ajrccm.163.1.9905084](https://doi.org/10.1164/ajrccm.163.1.9905084)
- Crotti S, Mascheroni D, Caironi P, et al. Recruitment and derecruitment during acute respiratory failure: a clinical study. *Am J Respir Crit Care Med* 2001;164:131–40. [doi:10.1164/ajrccm.164.1.2007011](https://doi.org/10.1164/ajrccm.164.1.2007011)
- Albert SP, DiRocco J, Allen GB, et al. The role of time and pressure on alveolar recruitment. *J Appl Physiol* 2009;106:757–65. [doi:10.1152/japplphysiol.90735.2008](https://doi.org/10.1152/japplphysiol.90735.2008)
- Albert RK. The role of ventilation-induced surfactant dysfunction and atelectasis in causing acute respiratory distress syndrome. *Am J Respir Crit Care Med* 2012;185:702–8. [doi:10.1164/rccm.201109-1667PP](https://doi.org/10.1164/rccm.201109-1667PP)

---

## See also

[The two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Pressure–volume curve](pressure-volume-curve.md) · [Stress index](stress-index.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [The Campbell panel](panel-campbell.md) · [Controls: mechanics](controls-mechanics.md)
