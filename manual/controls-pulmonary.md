# Pulmonary circulation controls

> Three controls separate baseline open-lung vascular load, selective tone in derecruited lung and inflation-driven pulmonary blood displacement.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| open-lung PVR at FRC | 0.03–0.60 mmHg·s/mL | reference resistance coefficient of the fully open pathway at its vascular minimum |
| hypoxic vasoconstriction | 0–3 × | selective resistance gain in the derecruited pathway |
| pulmonary capacitance coupling | 0–200 mL/L | scale of inflation-related pulmonary venous capacity reduction, gated by the zone-3 index |

### Open-lung PVR at FRC

This coefficient scales the complete volume-dependent pulmonary resistance construction. It is not the same as catheter-derived $(mPAP-wedge)/CO$. Increasing it can represent aggregate pulmonary vascular load, including a pulmonary-embolism teaching phenotype, but does not identify whether that load came from obstruction, vasomotor tone, viscosity or lost vascular area.

### Hypoxic vasoconstriction

The control raises resistance only in the pathway associated with derecruited units and can redirect flow toward open lung. Because there is no oxygen model, it is a surrogate for selective tone rather than oxygen-driven HPV. See [hypoxic vasoconstriction](hypoxic-vasoconstriction.md).

### Pulmonary capacitance coupling

Inflation can raise pulmonary venous pressure and drive blood toward the left atrium before the delayed change in RV output arrives. The coefficient sets the strength of this “venous piston”: inflation above the model's passive reference reduces the zero-pressure capacity of the pulmonary venous reservoir, weighted by its aggregate zone-3 index. Below that reference the extra displacement term is zero. When the zone-3 condition deteriorates, the piston contribution is attenuated.

This conserves **total circulating blood**, but can change the amount stored in the pulmonary reservoir and its distribution elsewhere. It neither prescribes a fixed delivered bolus nor sets pulmonary venous compliance; actual flow follows the resulting pressures. It is separate from the delayed transmission of changing RV output through the lung.

Brower and colleagues found opposite pulmonary venous-flow responses during inflation of isolated canine lungs depending on whether zone 2 or zone 3 predominated. Arthur represents a zone-3-weighted forward piston and other pressure-gradient effects; attenuating this piston is not a complete reproduction of the experimental zone-2 storage mechanism.

The piston is one contributor to respiratory stroke-volume variation, not its universal driver. During positive-pressure ventilation, reduced RV preload and cyclic RV afterload can reduce RV output; that change reaches the left heart later because blood must cross the pulmonary circulation. Which component dominates depends on filling, lung mechanics, RV function and pulmonary vascular conditions. Vieillard-Baron and colleagues demonstrated both the immediate inspiratory increase in pulmonary venous flow and the opposite-phase variation of right- and left-ventricular output; the observation supports the mechanism, but not a claim that it dominates every phenotype.

## Compliance, capacity and filling are different

There is no user control for the intrinsic compliance of the pulmonary veins or left atrium. **Compliance** describes how much volume changes for a pressure increment. **Zero-transmural-pressure volume** describes how much the compartment holds when inside and outside pressures are equal. **Blood present** is its actual current volume. Changing one does not mean that the others have been directly adjusted.

| compartment | intrinsic pressure–volume relation in Arthur | what the controls can change |
|---|---|---|
| pulmonary veins | fixed compliance coefficient of 8.5 mL/mmHg | inflation-related zero-transmural-pressure volume, surrounding pleural pressure and blood present |
| left atrium | prescribed stiffness varying through the heartbeat; relaxed compliance about 7.4 mL/mmHg, about 3.3 at peak atrial activation | surrounding pleural/pericardial pressure, filling and emptying conditions, and cycle duration |

These are internal coefficients, not human normal ranges. The atrial values are the inverse of the prescribed instantaneous stiffness: 0.135 mmHg/mL when relaxed and 0.30 at peak activation. Atrial transmural pressure subtracts both pleural and additional pericardial pressure. Pulmonary venous pressure references pleural pressure. Neither intrinsic relation automatically stiffens with congestion or acquired atrial disease.

**Pulmonary capacitance coupling** shifts the pulmonary venous zero-pressure volume, without changing its fixed compliance coefficient. Its pressure-dependent zone-3 weighting can nevertheless change the combined pressure–volume response. Likewise, pericardial pressure can make atrial filling harder without changing the atrial wall coefficient. A higher pressure therefore does not establish that the wall became intrinsically stiffer.

The **Venous compliance (slope)** and **Venous tone effect** controls act on the systemic reservoir. They can redistribute blood toward or away from the pulmonary circulation without directly adjusting pulmonary venous compliance or atrial stiffness. LV contractility and diastolic stiffness alter the atrium's emptying conditions; baseline heart rate and the baroreflex can change the duration of atrial relaxation and contraction, without changing the prescribed atrial stiffness limits. See [volume controls](controls-volume.md) and [heart controls](controls-heart.md).

## Why three controls

The separation prevents three different mechanisms from being reduced to a generic “PVR” slider: steady vascular load, regional redistribution and phasic pulmonary blood displacement. More detailed determinants are documented as omissions rather than exposed as extra bedside-like knobs.

## Limits

- The baseline resistance is an aggregate coefficient; no explicit clot burden, viscosity, vessel recruitment, vasodilator pharmacology or regional obstruction.
- Pulsatile pulmonary loading comes from aggregate resistance, fixed arterial compliance and the waterfall. There is no separately resolved characteristic impedance, wave reflection or prescribed relation between resistance and arterial compliance.
- HPV is not driven by alveolar oxygen and cannot predict oxygenation.
- The piston is an instantaneous capacity shift proportional to positive inflation above the reference and modulated by the zone-3 index. It is not a measured pulmonary venous flow model or an oxygenation response.
- Pulmonary capillary fluid exchange and oedema formation are absent.

## References

- Sylvester JT, Shimoda LA, Aaronson PI, Ward JPT. Hypoxic pulmonary vasoconstriction. *Physiol Rev*. 2012;92:367–520. [doi:10.1152/physrev.00041.2010](https://doi.org/10.1152/physrev.00041.2010)
- Pinsky MR. Heart lung interactions during mechanical ventilation. *Curr Opin Crit Care*. 2012;18:256–260. [doi:10.1097/MCC.0b013e3283532b73](https://doi.org/10.1097/MCC.0b013e3283532b73)
- Brower R, Wise RA, Hassapoyannes C, et al. Effect of lung inflation on lung blood volume and pulmonary venous flow. *J Appl Physiol*. 1985;58:954–963. [doi:10.1152/jappl.1985.58.3.954](https://doi.org/10.1152/jappl.1985.58.3.954)
- Vieillard-Baron A, Chergui K, Augarde R, et al. Cyclic changes in arterial pulse during respiratory support revisited by Doppler echocardiography. *Am J Respir Crit Care Med*. 2003;168:671–676. [doi:10.1164/rccm.200301-135OC](https://doi.org/10.1164/rccm.200301-135OC)

---

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Hypoxic vasoconstriction](hypoxic-vasoconstriction.md) · [Pulmonary transit](pulmonary-transit.md) · [The right ventricle](the-right-ventricle.md) · [PVR panel](panel-pvr-curve.md)
