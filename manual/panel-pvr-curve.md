# The PVR–lung-volume panel

> The panel reconstructs the classical two-limb pulmonary vascular relation and places the current patient on it without confusing derecruitment with either mechanical limb.

---

## Physiology

As lung volume rises, radial traction opens extra-alveolar vessels and lowers their resistance. At high lung volume, expanding alveoli narrow and lengthen alveolar vessels, increasing their resistance. The two contributions act in series within the perfused open pathway, producing a J-shaped total relation with a minimum near an intermediate volume.

See [pulmonary vascular resistance](pulmonary-vascular-resistance.md) for the full physiology and the distinction between a resistance coefficient and catheter-derived PVR.

## How to read the panel

The horizontal axis spans model residual volume (RV), the vascular minimum near FRC and model TLC. Each landmark carries its current absolute volume in litres. The green extra-alveolar limb falls, the orange dashed alveolar limb rises, and their purple sum is total mechanical open-lung PVR.

Volume is used on the horizontal axis deliberately. Inflation and deflation experiments show that the mechanical resistance relation is organised more consistently by lung volume than by transpulmonary pressure, while also showing separate pressure-reference and Starling-resistor effects. The panel displays the former; the running circulation retains the latter. See [why the mechanical curve uses volume](pulmonary-vascular-resistance.md#why-the-mechanical-curve-uses-volume).

The FRC marker is also a design choice, not an inferred measurement. The opposing slopes are constructed to cancel at zero strain, which places the fully open reference minimum near the tissue's resting volume. The panel can therefore demonstrate movement to either limb, but it cannot determine where the human nadir ought to be. The animal experiments place their minimum nearer half maximal volume; the model instead follows the human clinical teaching geometry and human in-vivo magnitude constraints. See [why the minimum is placed at FRC](pulmonary-vascular-resistance.md#the-minimum-is-placed-at-frc-and-this-is-a-genuine-choice).

The grey vertical band is the lung-volume excursion already traversed during the current breath. The white *Patient* point uses the current open fraction and HPV state, so it may sit above the fully open mechanical curve when derecruited lung adds load.

The `+`, `−` and percentage/Fit buttons change only the vertical view. Zoom is centred on the patient point when possible and never changes model state. The full RV-to-TLC horizontal range is retained so neither limb disappears.

## In the model

The two reference limbs are calculated with the open fraction fixed at one. Their sum is exactly the open vascular pathway used by the flow equations. The patient point is calculated separately from the parallel open and closed beds. This prevents the earlier visual error in which recruitment and HPV distorted the named alveolar and extra-alveolar curves.

Model RV is the completely open lung volume at zero transpulmonary pressure; model TLC is the selected `lungCapacity`. These are graphical model landmarks, not spirometric measurements in the current patient.

## Limits

- The component curves are conceptual aggregate resistances; alveolar and extra-alveolar vessels are not independently measured in vivo.
- The vertical coefficients are tuned for didactic direction and selected human in-vivo constraints, not a universal PVR–volume curve.
- The location of the minimum is imposed by the model equations; it is not an independently validated output.
- The patient point includes collapse and HPV but not pulsatile impedance, viscosity, explicit obstruction or regional perfusion.
- RV, FRC and TLC are model landmarks and cannot be compared directly with bedside lung-volume measurements.
- Zoom can make small absolute differences look large; read the axis after changing it.

## References

- Whittenberger JL, McGregor M, Berglund E, Borst HG. Influence of state of inflation of the lung on pulmonary vascular resistance. *J Appl Physiol*. 1960;15:878–882. [doi:10.1152/jappl.1960.15.5.878](https://doi.org/10.1152/jappl.1960.15.5.878)
- Thomas LJ, Griffo ZJ, Roos A. Effect of negative-pressure inflation of the lung on pulmonary vascular resistance. *J Appl Physiol*. 1961;16:451–456. [doi:10.1152/jappl.1961.16.3.451](https://doi.org/10.1152/jappl.1961.16.3.451)
- Hakim TS, Michel RP, Chang HK. Effect of lung inflation on pulmonary vascular resistance by arterial and venous occlusion. *J Appl Physiol*. 1982;53:1110–1115. [doi:10.1152/jappl.1982.53.5.1110](https://doi.org/10.1152/jappl.1982.53.5.1110)
- Peták F, Albu G, Lele E, et al. Lung mechanical and vascular changes during positive- and negative-pressure lung inflations: importance of reference pressures in the pulmonary vasculature. *J Appl Physiol*. 2009;106:935–942. [doi:10.1152/japplphysiol.00831.2007](https://doi.org/10.1152/japplphysiol.00831.2007)
- West JB, Dollery CT, Naimark A. Distribution of blood flow in isolated lung; relation to vascular and alveolar pressures. *J Appl Physiol*. 1964;19:713–724. [doi:10.1152/jappl.1964.19.4.713](https://doi.org/10.1152/jappl.1964.19.4.713)

---

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Hypoxic vasoconstriction](hypoxic-vasoconstriction.md) · [Recruitment and R/I](recruitment-and-ri.md) · [The right ventricle](the-right-ventricle.md) · [Pulmonary controls](controls-pulmonary.md)
