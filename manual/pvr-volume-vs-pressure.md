# Why the mechanical PVR curve uses lung volume

> Lung volume describes the inflation component of the model's pulmonary resistance law. Pressure still determines vascular filling, driving gradients, the alveolar waterfall and the load opposing RV ejection.

---

## Physiology

Lung inflation alters vascular geometry through septal stretch and radial traction. Intravascular pressure and the pressure surrounding a vessel also matter. Lung volume and transpulmonary pressure are related, but they are not interchangeable: with lung hysteresis, the same pressure can accompany different volumes during inflation and deflation.

Comparing resistance against each variable can reveal which better organises the measurements in a particular preparation. If inflation and deflation points lie closer together when plotted against volume, volume is a useful descriptor of that mechanical relation. This does not prove that pressure has no independent vascular effect, or that volume alone determines resistance under all conditions.

## What the experiments establish

**Thomas, Griffo and Roos** studied static negative-pressure inflation of excised dog lungs while holding vascular pressures constant. Resistance was more consistently related to volume than to transpulmonary pressure across inflation and deflation. This supports volume as a descriptor under those conditions.

**Hakim, Michel and Chang** compared positive- and negative-pressure inflation in isolated canine lobes at constant flow, using arterial and venous occlusion to partition pressure drops. Their findings separate volume-related effects from effects of vascular reference pressure and inflation mode. The middle segment includes small distensible extra-alveolar vessels as well as alveolar vessels; it is not a pure anatomical capillary measurement.

**Peták and colleagues** studied isolated perfused rat lungs. Positive-pressure inflation and negative-pressure expansion produced different vascular responses over a comparable transpulmonary-pressure range. Their comparison reinforces the need to state how pressure is applied and which reference is held fixed.

Together these experiments support distinguishing inflation geometry from vascular pressure effects. They do not validate a pressure-independent pulmonary circulation or provide universal human coefficients for the model.

## In the model

Both limbs of the [mechanical J-curve](pulmonary-vascular-resistance.md) use strain: volume per open unit relative to that tissue's resting volume. Open and closed vascular pathways contribute conductances in parallel, and hypoxic vasoconstriction raises resistance in the closed pathway.

Pressure also enters the circulation explicitly:

- PA pressure opposes RV ejection and drives flow into the middle pulmonary store.
- Alveolar pressure surrounds that middle store and affects narrowing of its outlet toward PV.
- Pleural pressure and transpulmonary traction determine the external pressure around the arterial and venous stores.
- The pressure–volume relations convert the blood actually stored into intravascular pressure. Those pressures drive the three signed vascular flows and determine further redistribution.

The graph displays the **geometric resistance reference**, with a distended middle outlet. The running circulation's current segmental resistance sum additionally includes pressure-dependent narrowing and the fixed distal venous resistance. A catheter-style $(mPAP-wedge)/CO$ estimate is a third quantity, with different measurements and assumptions.

**For the user:** matching airway pressure is insufficient for comparing two states. Record how inflation is produced, pleural and alveolar pressure, lung volume and open fraction, and upstream/downstream vascular pressures. The same PEEP or transpulmonary pressure can coexist with different vascular filling and RV ejection load.

## Why keep these mechanisms separate

Storage volume does not uniquely identify resistance. A vessel can become longer while containing more blood; local calibre, number of flowing paths and shape also matter. The model therefore represents pressure-dependent storage and a specified narrowing law, without turning every extra millilitre into a universal reduction in resistance. The geometric reference supplies the remaining inflation dependence.

## Limits

The model cannot determine how much a patient's already-distended vessels widen or recruit when intravascular pressure rises. It omits regional vascular networks, regional pressure references, resistance-dependent arterial compliance and wave reflection. Its extra-alveolar geometric limb approaches a floor at high volume; it does not reproduce every segmental high-volume rise in isolated-lung experiments. Peták's rat-lung pressure protocol and quantitative response are not established human calibration targets for this circuit.

A lower geometric reference does not guarantee higher output: PA pressure, downstream pressure, ventricular filling and flow evolve together. Read [RV function](the-right-ventricle.md), vascular pressures and actual forward flow alongside the curve.

## References

- Thomas LJ, Griffo ZJ, Roos A. Effect of negative pressure inflation of the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–6. [doi:10.1152/jappl.1961.16.3.451](https://doi.org/10.1152/jappl.1961.16.3.451)
- Hakim TS, Michel RP, Chang HK. Effect of lung inflation on pulmonary vascular resistance by arterial and venous occlusion. *J Appl Physiol* 1982;53:1110–5. [doi:10.1152/jappl.1982.53.5.1110](https://doi.org/10.1152/jappl.1982.53.5.1110)
- Peták F, Albu G, Lele E, et al. Lung mechanical and vascular changes during positive- and negative-pressure lung inflations: importance of reference pressures in the pulmonary vasculature. *J Appl Physiol* 2009;106:935–42. [doi:10.1152/japplphysiol.00831.2007](https://doi.org/10.1152/japplphysiol.00831.2007)

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [PVR nadir at FRC](pvr-nadir-at-frc.md) · [Transmural pressure](transmural-pressure.md) · [The two-population lung](two-population-lung.md) · [Vascular waterfalls](vascular-waterfalls.md)
