# Pulmonary circulation controls

> Three controls separate baseline open-lung vascular load, selective tone in derecruited lung and inflation-driven pulmonary blood displacement.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| open-lung PVR at FRC | 0.03–0.60 mmHg·s/mL | reference resistance coefficient of the fully open pathway at its vascular minimum |
| hypoxic vasoconstriction | 0–3 × | selective resistance gain in the derecruited pathway |
| pulmonary capacitance coupling | 0–200 mL/L | blood displaced toward the left atrium per litre of lung inflation |

### Open-lung PVR at FRC

This coefficient scales the complete volume-dependent pulmonary resistance construction. It is not the same as catheter-derived $(mPAP-wedge)/CO$. Increasing it can represent aggregate pulmonary vascular load, including a pulmonary-embolism teaching phenotype, but does not identify whether that load came from obstruction, vasomotor tone, viscosity or lost vascular area.

### Hypoxic vasoconstriction

The control raises resistance only in the pathway associated with derecruited units and can redirect flow toward open lung. Because there is no oxygen model, it is a surrogate for selective tone rather than oxygen-driven HPV. See [hypoxic vasoconstriction](hypoxic-vasoconstriction.md).

### Pulmonary capacitance coupling

Inflation can displace blood from the compliant pulmonary reservoir toward the left atrium, producing an immediate left-sided filling effect. The coefficient sets the strength of this “venous piston”. It does not change mean blood volume and is independent of the delayed change in RV output crossing the lung.

The piston is one contributor to respiratory stroke-volume variation, not its universal driver. During positive-pressure ventilation, reduced RV preload and cyclic RV afterload can reduce RV output; that change reaches the left heart later because blood must cross the pulmonary circulation. Which component dominates depends on filling, lung mechanics, RV function and pulmonary vascular conditions. Vieillard-Baron and colleagues demonstrated both the immediate inspiratory increase in pulmonary venous flow and the opposite-phase variation of right- and left-ventricular output; the observation supports the mechanism, but not a claim that it dominates every phenotype.

## Why three controls

The separation prevents three different mechanisms from being reduced to a generic “PVR” slider: steady vascular load, regional redistribution and phasic pulmonary blood displacement. More detailed determinants are documented as omissions rather than exposed as extra bedside-like knobs.

## Limits

- The baseline resistance is an aggregate coefficient; no explicit clot burden, viscosity, vessel recruitment, vasodilator pharmacology or regional obstruction.
- No pulmonary arterial impedance, wave reflection or frequency-dependent afterload.
- HPV is not driven by alveolar oxygen and cannot predict oxygenation.
- The piston is a linear, instantaneous displacement coefficient and not a measured pulmonary venous flow model.
- Pulmonary capillary fluid exchange and oedema formation are absent.

## References

- Sylvester JT, Shimoda LA, Aaronson PI, Ward JPT. Hypoxic pulmonary vasoconstriction. *Physiol Rev*. 2012;92:367–520. [doi:10.1152/physrev.00041.2010](https://doi.org/10.1152/physrev.00041.2010)
- Pinsky MR. Heart lung interactions during mechanical ventilation. *Curr Opin Crit Care*. 2012;18:256–260. [doi:10.1097/MCC.0b013e3283532b73](https://doi.org/10.1097/MCC.0b013e3283532b73)
- Brower R, Wise RA, Hassapoyannes C, et al. Effect of lung inflation on lung blood volume and pulmonary venous flow. *J Appl Physiol*. 1985;58:954–963.
- Vieillard-Baron A, Chergui K, Augarde R, et al. Cyclic changes in arterial pulse during respiratory support revisited by Doppler echocardiography. *Am J Respir Crit Care Med*. 2003;168:671–676. [doi:10.1164/rccm.200301-135OC](https://doi.org/10.1164/rccm.200301-135OC)

---

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Hypoxic vasoconstriction](hypoxic-vasoconstriction.md) · [Pulmonary transit](pulmonary-transit.md) · [The right ventricle](the-right-ventricle.md) · [PVR panel](panel-pvr-curve.md)
