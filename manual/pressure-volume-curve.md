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

### Resting volume is the intersection with an independent chest wall

There is no independent FRC control. The default lung is calibrated to meet the default [chest-wall relaxation curve](pleural-pressure.md) at 2.2 L, but disease phenotypes are not forced to preserve either pressure at that point. Passive equilibrium is solved from:

$$
P_l(V_{relax})+P_{cw}(V_{relax})=0
$$

Changing maximum capacity scales the lung's zero-pressure volume term, because a smaller anatomical lung should not retain the same absolute baseline volume as a larger one. Changing `clung` changes the volume gained for a pressure increment. Collapse multiplies the result by the open fraction. The chest-wall curve remains unchanged unless `ccw`, `cwLoad` or body position is changed.

This distinction changes the meaning of disease states. A collapsed, stiff lung settles at a lower volume and requires greater transpulmonary pressure to balance the stronger outward recoil of the same wall. A lung with lost recoil settles higher. A positive external wall load moves equilibrium lower without being mislabelled as reduced compliance.

<!-- BEGIN GENERATED: lung-wall-equilibrium -->
*Direct static solution at zero applied airway pressure. The passive volume is where lung and chest-wall recoil are equal and opposite.*

| phenotype | passive volume (L) | chest-wall recoil P<sub>cw</sub> (cmH₂O) | transpulmonary recoil P<sub>l</sub> (cmH₂O) |
|---|---:|---:|---:|
| normal reference | 2.20 | -5.0 | 5.0 |
| collapsed, stiff and non-recruitable lung | 0.99 | -11.1 | 11.1 |
| lost lung recoil | 2.38 | -4.1 | 4.1 |
| normal lung with a 6 cmH₂O external wall load | 1.52 | -2.4 | 2.4 |
<!-- END GENERATED: lung-wall-equilibrium -->

<!-- BEGIN GENERATED: pv-eelv -->
*Static respiratory-system equilibrium at applied PEEP 5 cmH₂O, with recruitment hysteresis off.*

| phenotype | end-expiratory volume (L) |
|---|---:|
| normal | 2.71 |
| 30% collapsed | 2.23 |
| 50% collapsed | 1.81 |
| emphysematous, aerated-lung compliance 400 mL/cmH₂O | 3.18 |
| smaller 4.0 L maximum-capacity lung | 2.48 |
<!-- END GENERATED: pv-eelv -->

End-expiratory volume is therefore an outcome of lung recoil, capacity, open fraction, the independent chest-wall curve and applied PEEP. It is not a renamed capacity input.

---

## Why this implementation

**Separate controls prevent double-counting.** Previously, reducing `clung` reduced both the slope and the expandable volume of the tissue curve. Increasing `collapsed` then removed lung again. An ARDS preset using both controls could therefore make the baby lung small twice without saying so.

**The lower and upper limbs remain separate mechanisms.** Unit opening produces the lower-limb sigmoid through $\varphi(P_l)$. The soft capacity ceiling produces upper-limb flattening. Adding another full logistic tissue curve would duplicate recruitment at low pressure.

**A smooth ceiling is preferable to a hard stop.** Progressive curvature preserves a continuous derivative for pressure inversion and for stress-index fitting. The 18% transition width is a transparent model coefficient selected for a visible but gradual upper limb; it is not presented as a measured universal human value.

**Capacity is entered in litres for now.** Predicted TLC would require anthropometric inputs and reference equations that add little to the present focus on heart–lung interaction. Direct litre scaling is sufficient for teaching, provided it is not interpreted as spirometric prediction.

**The wall is solved, not recentered.** Preserving −5 cmH₂O pleural pressure at every phenotype's lung-derived reference made the two elastic elements mathematically inseparable. Solving their intersection allows lung disease, wall stiffness and external thoracic load to have different causal meanings.

---

## Limits

- The relation is static and single-valued. Tissue, surfactant and viscoelastic hysteresis are not represented; recruitment hysteresis is a separate mechanism.
- One curve replaces regional differences in stress, strain and capacity.
- `lungCapacity` is not predicted TLC and has not been calibrated against individual spirometry.
- The 18% soft-transition width is a didactic coefficient, not a patient-specific measurement.
- A measured bedside pressure–volume curve also contains resistance, recruitment and time dependence; this tissue relation should not be interpreted as a directly acquired low-flow P–V loop.
- The model does not supply lower or upper inflection pressures as ventilator-setting recommendations.
- The chest wall is one aggregate sigmoid relation. Rib cage, diaphragm and abdomen are not separate mechanical compartments.
- Remote wall curvature is a physiological shape constraint rather than a patient-specific fit.

---

## References

- Venegas JG, Harris RS, Simon BA. A comprehensive equation for the pulmonary pressure–volume curve. *J Appl Physiol*. 1998;84:389–395. [doi:10.1152/jappl.1998.84.1.389](https://doi.org/10.1152/jappl.1998.84.1.389)
- Harris RS. Pressure–volume curves of the respiratory system. *Respir Care*. 2005;50:78–98.
- Gattinoni L, Pesenti A. The concept of “baby lung”. *Intensive Care Med*. 2005;31:776–784. [doi:10.1007/s00134-005-2627-z](https://doi.org/10.1007/s00134-005-2627-z)
- Chiumello D, Carlesso E, Cadringher P, et al. Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. *Am J Respir Crit Care Med*. 2008;178:346–355. [doi:10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)
- Rahn H, Otis AB, Chadwick LE, Fenn WO. The pressure-volume diagram of the thorax and lung. *Am J Physiol*. 1946;146:161–178. [doi:10.1152/ajplegacy.1946.146.2.161](https://doi.org/10.1152/ajplegacy.1946.146.2.161)
- Agostoni E, Hyatt RE. Static behavior of the respiratory system. In: *Handbook of Physiology, The Respiratory System*. 1986:113–130. [doi:10.1002/cphy.cp030309](https://doi.org/10.1002/cphy.cp030309)
- Pereira C, Bohé J, Rosselli S, et al. Sigmoidal equation for lung and chest wall volume-pressure curves in acute respiratory failure. *J Appl Physiol*. 2003;95:2064–2071. [doi:10.1152/japplphysiol.00385.2003](https://doi.org/10.1152/japplphysiol.00385.2003)

---

## See also

[Equation of motion](equation-of-motion.md) · [The two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Stress index](stress-index.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Controls: mechanics](controls-mechanics.md)
