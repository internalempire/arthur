# Lung opening profiles

> Specify how much lung belongs to the compromised component and how that component can open. Read the resulting closed fraction at end expiration and the opening excursion during the breath. These are internal teaching quantities, not CT measurements or a bedside R/I.

---

## The clinical question

Raising PEEP can distend already open lung and, if sufficient transpulmonary pressure is reached, open part of the compromised component. Opening may distribute gas over more lung and change pulmonary vascular load; higher pressures also affect venous return and ventricular loading. The net effect on cardiac output must emerge from the coupled simulation.

A recruitment manoeuvre and maintenance PEEP have different pressure histories. With opening memory enabled, a high pressure can open units that remain open at a lower pressure. This does not imply that PEEP cannot recruit, or that a manoeuvre necessarily provides additional persistent opening: both depend on which pressures have already been reached and on subsequent closing pressure.

## What to set

**Compromised lung** is the percentage assigned to the diseased population. It includes both potentially reopenable and permanently closed units. It is a patient characteristic in the model, not the percentage currently closed. The internal parameter name is `collapsed`.

**Opening profile** specifies the behaviour of that component. The non-reopenable profile leaves it closed; pressure-dependent opening follows current transpulmonary pressure; opening with memory also depends on the preceding inflation and deflation. These are illustrative prescriptions, not patient classifications or recommended ventilator settings.

<!-- BEGIN GENERATED: opening-profiles -->
*Generated from the profile prescriptions. Fractions refer to the compromised component; pressures are transpulmonary midpoints, in cmH₂O.*

| profile | potentially reopenable share | opening midpoint | closing midpoint | memory |
|---|---:|---:|---:|---|
| Non-reopenable | 0.0% | inactive | same as opening | off |
| Pressure-dependent opening | 38.9% | 15.5 | same as opening | off |
| Opening with memory | 38.9% | 15.5 | 6 | on |
<!-- END GENERATED: opening-profiles -->

Selecting a profile leaves ventilation, aerated-tissue compliance, maximum capacity and cardiovascular settings unchanged. The gas already present is preserved. While memory remains enabled, the retained diseased opening is kept but cannot exceed the newly specified potential. Switching memory off clears that retained state; enabling it starts from the opening branch rather than preloading the entire reopenable compartment as open. With no compromised component, the profile has no effect. Adding a compromised component to the default healthy prescription gives non-reopenable lung until another profile or an advanced share is selected.

### Advanced opening settings

- **Reopenable share of compromised lung:** 0–100%. This is the maximum share of the compromised component that can participate in opening. Multiply it by the compromised fraction to obtain the corresponding share of the whole model lung. It is not the amount already open or the amount that will open during a particular PEEP step.
- **Opening midpoint:** 5–40 cmH₂O transpulmonary pressure. It locates the centre of the opening distribution, not an airway-pressure threshold or a prescribed PEEP.
- **Opening memory:** off/on. Off, opening and closing follow the same pressure relation. On, previously opened diseased units can remain open at lower pressure.
- **Closing midpoint:** 2 cmH₂O up to the selected opening midpoint. It is relevant only with memory on. Equality removes the pressure gap and therefore the memory effect. Reducing the opening midpoint below the selected closing value also lowers the closing value to preserve this ordering.

Editing one of these details selects **Custom**. Their numerical values are saved without rounding to the displayed percentage. Changing a preset selects its specified values again. Distribution width and solver settings are not exposed as advanced controls.

**Grey controls indicate an absent prerequisite.** Opening midpoint and Opening memory require both Compromised lung and its reopenable share to be above 0%; Closing midpoint also requires memory On. Custom does not bypass these conditions. Hover over a disabled control or its label, or open its **i** explanation, to see the current reason and how to enable it. See [mechanics controls](controls-mechanics.md#why-an-opening-control-is-grey) for the complete rules, including why the share itself remains editable when the compromised component is zero.

### Why the chest wall matters

The potential reopenable share is fixed when chest-wall compliance or load changes. The actual fraction open may change because transpulmonary pressure is alveolar minus pleural pressure. A chest-wall intervention can therefore change the pressure available to open the lung without changing which units are capable of opening. Prone position retains the same potential share while applying its documented coarse changes to chest wall, abdominal pressure and opening midpoint.

## What to read

**Closed at end expiration** is 100 × (1 − open fraction), sampled immediately before the next inspiration. Its subtitle gives the maximum minus minimum open fraction during that same completed breath, in **percentage points**. This excursion describes within-breath variation; it is not cumulative opening traffic, recruited millilitres or a measure of injury.

Both values describe the whole model lung, including its normal pressure-dependent population. A small excursion is therefore possible even when the compromised component is non-reopenable. Results require one complete breath under the current settings. Parameter changes, reset and an occlusion clear them; an incomplete breath after the change is excluded. They do not require Deep CO or an additional settling calculation.

The instantaneous open fraction remains available beside respiratory compliance. Compare pressures, volume, derived PVR, RV/LV volumes and output together; a higher open fraction does not guarantee a haemodynamic benefit.

**A lower plateau does not by itself mean more stable aeration.** With memory off, units can open during inspiration and close again over the same pressure range during expiration. That opening can account for a substantial part of the volume gained during the breath, increasing respiratory-system compliance without making the already aerated tissue more compliant. With memory on, previously opened units may remain open at end expiration. When little additional opening occurs during the next inspiration, the tidal volume mainly distends the open lung. The balance depends on the pressure trajectory and closing setting. Read plateau and compliance together with end-expiratory closure and within-breath excursion. The magnitude of this contribution is a model result, not a clinically validated partition of tidal volume.

**Changing an opening profile is not a before/after recruitment experiment.** Switching memory changes the rule by which units close. To assess what a manoeuvre leaves behind, keep the same opening and closing properties, leave memory enabled throughout, and compare the lung before and after returning to the same PEEP and tidal volume. Retained opening can increase the tissue available to share that volume and reduce plateau pressure. Ordinary distension of open units does not by itself establish overdistension. See [hysteresis](hysteresis.md#interpreting-the-mechanical-response) for the comparison and its limits.

## How the model represents opening

The lung contains a normal population and a compromised population sharing one gas volume. Only the specified reopenable share of the latter follows its diseased opening distribution. The distribution width is <!-- CONSISTENCY: diseased-recruitment-width -->0.75 cmH₂O<!-- /CONSISTENCY -->, an internal shape coefficient rather than a measured anatomical variance. [The two-population lung](two-population-lung.md) gives the equation.

Opening changes accessible volume and the effective pressure–volume relation. It also changes gas volume per open unit and the parallel vascular pathways represented in the pulmonary resistance law. With memory enabled, pressure and recruitment state are solved together at each respiratory step. There is no biological opening time constant or slow recruitment over minutes.

## Scope of the quantities

Arthur specifies opening potential directly and measures the resulting model state. It does not calculate or accept a recruitment-to-inflation ratio (R/I), nor use one to calibrate opening or assess model validity. The compromised fraction, reopenable share and actual closed fraction describe different parts of the model; none is a measured anatomical percentage.

## Limits

- Compromised, reopenable and actually closed fractions are different model quantities. None is calibrated as a CT tissue fraction.
- Opening has one aggregate pressure distribution; regional pressures, airway closure, pendelluft and separate regional time constants are absent.
- The 5% numerical floor on total open fraction limits interpretation at extreme closure.
- Opening excursion is descriptive. It has no validated injury threshold and is not a recruitment-volume measurement.
- There is no gas exchange or oxygenation benefit to balance against circulatory effects. The model cannot select optimal PEEP or recommend a recruitment manoeuvre.
- External validation still requires joint assessment of pressures, volumes, compliance and circulatory response under a specified protocol; a plausible fraction alone is insufficient.

---

## References

- Chen L, Del Sorbo L, Grieco DL, et al. [Potential for lung recruitment estimated by the recruitment-to-inflation ratio in ARDS: a clinical trial](https://doi.org/10.1164/rccm.201902-0334OC). *Am J Respir Crit Care Med* 2020;201:178–87.
- Chen L, Chen G-Q, Shore K, et al. Implementing a bedside assessment of respiratory mechanics in patients with acute respiratory distress syndrome. *Crit Care* 2017;21:84. [doi:10.1186/s13054-017-1671-8](https://doi.org/10.1186/s13054-017-1671-8)
- Gattinoni L, Caironi P, Cressoni M, et al. Lung recruitment in patients with the acute respiratory distress syndrome. *N Engl J Med* 2006;354:1775–86. [doi:10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of positive end-expiratory pressure on pulmonary vascular resistance depends on lung recruitability in patients with acute respiratory distress syndrome. *Am J Respir Crit Care Med* 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC)

---

## See also

[The two-population lung](two-population-lung.md) · [Pressure–volume curve](pressure-volume-curve.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Interpretability](interpretability.md) · [ARDS with right ventricular failure](scenarios.md#ards-with-right-ventricular-failure) · [Controls: mechanics](controls-mechanics.md)
