# Pulmonary circulation controls

> The pulmonary controls set the reference vascular load and selective tone in compromised lung. Blood storage and respiratory displacement emerge from the pressures and volumes in the pulmonary circuit.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| reference open-lung resistance at FRC | 0.03–0.60 mmHg·s/mL | reference resistance coefficient of the fully open pathway near its normal vascular minimum |
| hypoxic vasoconstriction | 0–3 × | selective resistance gain in the derecruited pathway |

### Reference open-lung resistance at FRC

This coefficient scales the volume-dependent pulmonary resistance construction. It is not catheter-derived $(mPAP-wedge)/CO$, and the current flow also depends on vascular pressure, storage and narrowing of the alveolar-exposed outlet. The additional resistance above its neutral 0.07 mmHg·s/mL setting is placed upstream of the middle pulmonary store. A high setting therefore represents aggregate precapillary load, including an embolism teaching phenotype, without also prescribing venous obstruction. It does not identify clot burden, individual vascular calibre, viscosity or the number of lost paths.

### Hypoxic vasoconstriction

The control raises the reference resistance associated with derecruited units and changes the aggregate conductance mixture. The resulting additional resistance is placed upstream of the middle store, representing precapillary vasoconstrictor load. Because there is no oxygen model, it is a surrogate for selective tone rather than oxygen-driven HPV. It does not identify a map of regional blood flow. See [hypoxic vasoconstriction](hypoxic-vasoconstriction.md).

## What makes pulmonary blood move during a breath

There is no separate control prescribing how much pulmonary blood inflation must expel. The circulation contains a pulmonary arterial store, an alveolar-exposed middle store and a pulmonary venous store. All contain conserved blood and carry pressure.

Alveolar pressure surrounds the middle store. Increasing that pressure can drive blood out if the pressure inside does not rise equally. Extra-alveolar arterial and venous stores experience pleural pressure and a traction contribution from lung expansion. Greater traction lowers their external pressure, permitting more blood at a given intravascular pressure. These competing effects can increase or reduce delivery to the LA. Resistance and the actual inlet/outlet gradients determine the amount and direction of transfer.

The [storage and transit page](pulmonary-transit.md) gives the equations and distinguishes actual blood, intrinsic zero-pressure volume and compliance. The [waterfall page](vascular-waterfalls.md) explains why a compressed vascular segment can restrict flow even when the anatomical outlet pressure falls further.

## Compliance, capacity and filling are different

**Compliance** is the change in blood volume for a change in pressure across the vascular wall. **Zero-transmural-pressure volume**, $V_0$, is the volume held when inside and outside pressures are equal. **Blood present** is the current volume. They are different quantities.

There is no user control for intrinsic pulmonary or left-atrial compliance. The pulmonary stores have fixed $V_0$ and a linear positive-transmural-pressure branch, with a continuously joined exponential branch below zero. The latter allows emptying without negative blood volume and reduces compliance as the store empties.

| compartment | intrinsic pressure–volume relation in the model | what user interventions can alter indirectly |
|---|---|---|
| pulmonary artery | $V_0$ 50 mL; distended compliance 4.2 mL/mmHg | surrounding pleural/traction pressure, stored blood and upstream RV ejection |
| alveolar-exposed middle store | $V_0$ 60 mL; distended compliance 8.4 mL/mmHg | surrounding alveolar pressure, filling and outlet narrowing |
| pulmonary veins | $V_0$ 60 mL; distended compliance 8.5 mL/mmHg | surrounding pleural/traction pressure, stored blood and delivery to LA |
| left atrium | prescribed stiffness varying through the beat; relaxed compliance about 7.4 mL/mmHg, about 3.3 at peak activation | surrounding pleural/pericardial pressure, filling, emptying and cycle duration |

These are internal teaching coefficients, not human normal ranges. Atrial compliance is the inverse of prescribed stiffness: 0.135 mmHg/mL when relaxed and 0.30 at peak activation. The atrium's external pressure includes both pleural and additional pericardial pressure. Pulmonary extra-alveolar pressure includes traction and is therefore not simply pleural pressure.

A rise in surrounding pressure can raise intravascular pressure without changing the wall coefficient. Conversely, lowering surrounding pressure can increase the volume held at a given atmospheric pressure without changing intrinsic $V_0$. Read pressure references before calling a vessel stiffer or assigning a change to venous tone.

The systemic **Venous compliance (slope)** and **Venous tone effect** controls act only on the systemic reservoir. They can redistribute blood into or out of the lung without directly adjusting pulmonary coefficients. LV contractility and diastolic stiffness change the atrium's emptying conditions; pericardial controls alter external restraint; heart rate changes the time available for filling. See [volume controls](controls-volume.md) and [heart controls](controls-heart.md).

## A controlled comparison

Pin a settled patient and change PEEP alone. Follow alveolar and pleural pressures, lung volume, pulmonary blood volume, RV output and LV filling together. A smaller lung blood volume means the pulmonary circuit has released blood; it does not establish that every pulmonary segment emptied. A greater volume means accumulation; it does not by itself establish a lower resistance. The [PVR panel](panel-pvr-curve.md) supplies the reference geometric coefficient, while pressures and actual flow show the complete circuit response.

## Limits

- Baseline resistance is aggregate: no explicit clot burden, viscosity, drug dose or regional obstruction.
- Distended-branch compliances and extra-alveolar traction are fixed teaching coefficients. They do not identify human segmental compliance or a validated recruitment pressure for vessels.
- The alveolar-exposed store uses one global alveolar pressure; regional pressures in open and closed lung are absent.
- Pressure-dependent outlet narrowing is represented; widening of the already distended resistance bed is not. No law links arterial compliance to resistance, and characteristic impedance and reflected waves are absent.
- HPV cannot predict oxygenation. Capillary filtration and pulmonary oedema formation are absent.

## References

- Howell JBL, Permutt S, Proctor DF, Riley RL. Effect of inflation of the lung on different parts of pulmonary vascular bed. *J Appl Physiol*. 1961;16:71–76. [doi:10.1152/jappl.1961.16.1.71](https://doi.org/10.1152/jappl.1961.16.1.71)
- Brower R, Wise RA, Hassapoyannes C, et al. Effect of lung inflation on lung blood volume and pulmonary venous flow. *J Appl Physiol*. 1985;58:954–963. [doi:10.1152/jappl.1985.58.3.954](https://doi.org/10.1152/jappl.1985.58.3.954)
- Sylvester JT, Shimoda LA, Aaronson PI, Ward JPT. Hypoxic pulmonary vasoconstriction. *Physiol Rev*. 2012;92:367–520. [doi:10.1152/physrev.00041.2010](https://doi.org/10.1152/physrev.00041.2010)

---

## See also

[Pulmonary storage and transit](pulmonary-transit.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Vascular waterfalls](vascular-waterfalls.md) · [The right ventricle](the-right-ventricle.md) · [PVR panel](panel-pvr-curve.md)
