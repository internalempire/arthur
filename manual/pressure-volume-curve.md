# The pressure–volume curve

> The model separates two properties that should not share one control: **aerated-lung compliance** determines the local pressure–volume slope, while **maximum lung capacity** determines the upper volume limit. Collapse and recruitment separately determine how much of that capacity is available at a given moment.

---

## Physiology

The relation between transpulmonary pressure and lung volume is sigmoid. Its lower limb is dominated by units opening, its middle region is approximately linear, and its upper limb flattens as further distending pressure produces progressively less volume.

These regions answer different clinical questions:

- **Compliance** describes how much volume is gained for a pressure increment at the current operating region.
- **Maximum capacity** describes the volume limit of the completely open lung.
- **Recruitment** changes how much lung is participating.

They are related in a real patient, but they are not interchangeable. A low measured respiratory-system compliance may result from intrinsically less compliant aerated tissue, a small aerated baby lung, a stiff chest wall, or a combination of these. Conversely, a lung can have relatively preserved aerated-tissue compliance and still overdistend if the ventilated fraction is small.

This distinction matters for heart–lung interaction. Lung volume and strain move the pulmonary circulation along its [PVR curve](pulmonary-vascular-resistance.md), while the pressure needed to produce that volume affects pleural and cardiac transmural pressures.

---

## In the model

The volume held by one completely open lung's worth of aerated tissue is represented by a compliance line that approaches an independent upper ceiling smoothly:

$$
V_{unit}(P_l) = \max\!\left[0,\;\operatorname{softmin}\left(V_0 + C_LP_l,\;V_{max}\right)\right]
$$

with

$$
\operatorname{softmin}(x,M)
= \min(x,M)-w\ln\!\left(1+e^{-|x-M|/w}\right),
\qquad w=0.18M
$$

- $P_l$ — transpulmonary pressure, cmH₂O
- $C_L$ — the `clung` setting, converted from mL/cmH₂O to L/cmH₂O
- $V_{max}$ — the `lungCapacity` setting, L; default 6 L
- $V_0$ — the zero-pressure volume scale
- $w$ — the width over which the straight relation bends towards its ceiling

The formula is easier to interpret than it may appear. Far from the ceiling, an additional 1 cmH₂O changes aerated-tissue volume by approximately `clung`. Near the ceiling, the same pressure increment produces progressively less volume. At very high pressure, volume approaches `lungCapacity` regardless of the selected compliance.

The smooth transition is a numerical and didactic choice, not a fitted human tissue constant. A hard cap would create a sudden discontinuity in compliance and would make the [stress index](stress-index.md) unstable precisely where it should demonstrate progressive overdistension.

### What `clung` means now

`clung` is the local compliance assigned to **aerated tissue while it is not close to its volume ceiling**. It is used continuously in the pressure–volume relation; it no longer determines maximum lung size.

The live compliance displayed by the model is not required to equal this setting. It also contains:

- the fraction of lung currently open;
- volume gained or lost through recruitment and derecruitment;
- upper-limb stiffening near maximum capacity;
- chest-wall mechanics when respiratory-system compliance is reported.

Thus `clung` is a constitutive tissue input, while live respiratory-system compliance is the current bedside-like output. The distinction is necessary rather than optional: one parameter cannot simultaneously be an instantaneous readout and the anatomical volume ceiling.

### What maximum lung capacity means

`lungCapacity` is the asymptotic volume of a completely open lung. It is adjustable from 2 to 9 L and defaults to 6 L. It is entered directly in litres; the model does not currently predict it from height, sex, age or reference equations.

It is not necessarily the volume the simulated patient can reach:

$$
V(P_l)=\varphi(P_l)\,V_{unit}(P_l)
$$

where $\varphi$ is the [open fraction](two-population-lung.md). If only 60% of the lung is open, the instantaneous accessible ceiling is approximately 60% of `lungCapacity`. Recruitment raises that accessible share; permanently non-openable tissue does not.

This is how the model now separates three lesions:

| control | primary meaning | does not automatically mean |
|---|---|---|
| `clung` | local stiffness of aerated tissue | a smaller maximum lung |
| `lungCapacity` | size of the completely open lung | low compliance or collapse |
| `collapsed` | fraction unavailable at low pressure | intrinsically stiff aerated tissue |

![Pressure–volume curves with independent compliance and capacity](figure/pv-curve.svg)

### What the model shows

<!-- BEGIN GENERATED: pv-tissue -->
*Direct evaluation of the fully open tissue relation (`collapsed = 0`, open fraction fixed to 1).*

| aerated-lung compliance (mL/cmH₂O) | maximum capacity (L) | volume at P<sub>l</sub> 5 (L) | volume at P<sub>l</sub> 35 (L) | asymptotic volume (L) |
|---:|---:|---:|---:|---:|
| 200 | 6.0 | 2.25 | 5.88 | 6.00 |
| 100 | 6.0 | 1.76 | 4.48 | 6.00 |
| 45 | 6.0 | 1.49 | 2.80 | 6.00 |
| 100 | 4.0 | 1.34 | 3.66 | 4.00 |
| 100 | 8.0 | 2.18 | 5.01 | 8.00 |
<!-- END GENERATED: pv-tissue -->

The first three rows change compliance while preserving the same 6 L ceiling. They therefore have different slopes and reach different volumes at a finite pressure, but converge to the same maximum. The last two rows preserve compliance and change the ceiling.

### The resting reference is calculated

There is no independent FRC control. The model calculates the volume held at 5 cmH₂O of transpulmonary recoil, then references chest-wall displacement to that volume. The default combination — `clung` 200 mL/cmH₂O, `lungCapacity` 6 L and no collapse — is calibrated to a relaxation volume of 2.2 L.

Changing maximum capacity also scales the zero-pressure volume term, because a smaller anatomical lung should not retain the same absolute baseline volume as a larger one. Changing `clung` changes the volume gained above that baseline. Collapse then multiplies the result by the open fraction.

<!-- BEGIN GENERATED: pv-eelv -->
*Static respiratory-system equilibrium at applied PEEP 5 cmH₂O, with recruitment hysteresis off.*

| phenotype | end-expiratory volume (L) |
|---|---:|
| normal | 2.71 |
| 30% collapsed | 1.96 |
| 50% collapsed | 1.44 |
| emphysematous, aerated-lung compliance 400 mL/cmH₂O | 3.79 |
| smaller 4.0 L maximum-capacity lung | 2.28 |
<!-- END GENERATED: pv-eelv -->

End-expiratory volume is therefore an outcome of lung recoil, capacity, open fraction, chest-wall compliance and applied PEEP. It is not a renamed capacity input.

---

## Why this implementation

**Separate controls prevent double-counting.** Previously, reducing `clung` reduced both the slope and the expandable volume of the tissue curve. Increasing `collapsed` then removed lung again. An ARDS preset using both controls could therefore make the baby lung small twice without saying so.

**The lower and upper limbs remain separate mechanisms.** Unit opening produces the lower-limb sigmoid through $\varphi(P_l)$. The soft capacity ceiling produces upper-limb flattening. Adding another full logistic tissue curve would duplicate recruitment at low pressure.

**A smooth ceiling is preferable to a hard stop.** Progressive curvature preserves a continuous derivative for pressure inversion and for stress-index fitting. The 18% transition width is a transparent model coefficient selected for a visible but gradual upper limb; it is not presented as a measured universal human value.

**Capacity is entered in litres for now.** Predicted TLC would require anthropometric inputs and reference equations that add little to the present focus on heart–lung interaction. Direct litre scaling is sufficient for teaching, provided it is not interpreted as spirometric prediction.

---

## Limits

- The relation is static and single-valued. Tissue, surfactant and viscoelastic hysteresis are not represented; recruitment hysteresis is a separate mechanism.
- One curve replaces regional differences in stress, strain and capacity.
- `lungCapacity` is not predicted TLC and has not been calibrated against individual spirometry.
- The 18% soft-transition width is a didactic coefficient, not a patient-specific measurement.
- A measured bedside pressure–volume curve also contains resistance, recruitment and time dependence; this tissue relation should not be interpreted as a directly acquired low-flow P–V loop.
- The model does not supply lower or upper inflection pressures as ventilator-setting recommendations.

---

## References

- Venegas JG, Harris RS, Simon BA. A comprehensive equation for the pulmonary pressure–volume curve. *J Appl Physiol*. 1998;84:389–395.
- Harris RS. Pressure–volume curves of the respiratory system. *Respir Care*. 2005;50:78–98.
- Gattinoni L, Pesenti A. The concept of “baby lung”. *Intensive Care Med*. 2005;31:776–784.
- Chiumello D, Carlesso E, Cadringher P, et al. Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *Am J Respir Crit Care Med*. 2008;178:346–355.

---

## See also

[Equation of motion](equation-of-motion.md) · [The two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Stress index](stress-index.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Controls: mechanics](controls-mechanics.md)
