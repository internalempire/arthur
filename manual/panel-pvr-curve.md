# The PVR–lung-volume panel

> The panel shows how lung inflation and opening alter a geometric resistance reference. Actual pulmonary flow additionally depends on vascular pressures, blood storage and narrowing of the alveolar-exposed outlet.

---

## Physiology

As lung volume rises, radial traction opens extra-alveolar vessels and lowers their resistance. At high lung volume, expanding alveoli narrow and lengthen alveolar vessels, increasing their resistance. The two contributions act in series within the perfused open pathway, producing a J-shaped total relation with a minimum near an intermediate volume.

See [pulmonary vascular resistance](pulmonary-vascular-resistance.md) for the full physiology and the distinction between a resistance coefficient and catheter-derived PVR.

## How to read the panel

The horizontal axis spans model residual volume (RV), the vascular minimum near FRC and model TLC. Each landmark carries its current absolute volume in litres. The orange dashed line shows the geometric middle-outlet component. The green line combines the extra-alveolar component with any added precapillary resistance; the purple sum is the **Open-lung reference** with the middle outlet distended. At the neutral resistance setting the lines show the familiar falling extra-alveolar and rising alveolar contributions. It does not include that outlet's pressure-dependent narrowing or the fixed distal venous resistance.

Volume is used on the horizontal axis deliberately. Inflation and deflation experiments show that the mechanical resistance relation is organised more consistently by lung volume than by transpulmonary pressure, while also showing separate pressure-reference and Starling-resistor effects. The panel displays the former; the running circulation retains the latter. See [why the mechanical curve uses volume](pulmonary-vascular-resistance.md#why-the-mechanical-curve-uses-volume).

The FRC marker is also a design choice, not an inferred measurement. The opposing slopes are constructed to cancel at zero strain, which places the fully open reference minimum near the tissue's resting volume. The panel can therefore demonstrate movement to either limb, but it cannot determine where the human nadir ought to be. The animal experiments place their minimum nearer half maximal volume; the model follows the familiar clinical teaching geometry. Human pressure–flow data provide a separate comparison under the conditions of each study. See [why the minimum is placed at FRC](pulmonary-vascular-resistance.md#the-minimum-is-placed-at-frc-and-this-is-a-genuine-choice).

The grey vertical band is the lung-volume excursion already traversed during the current breath. The **Current reference** point uses the current open fraction and HPV state, so it may sit above the fully open curve when derecruited lung increases the reference coefficient. It represents current geometry, not measured flow resistance under the current vascular pressures.

The `+`, `−` and percentage/Fit buttons change only the vertical view. Zoom is centred on the current-reference point when possible and never changes model state. The full RV-to-TLC horizontal range is retained so neither limb disappears.

The panel can also display **Derived PVR: use with caution**. This warning is propagated from the wedge surrogate when the minimum Pv − Palv over the last complete breath is negative, or a fresh complete breath is still pending after a setting change or hold. It qualifies the catheter-style calculation $(mPAP-wedge)/CO$; it does not invalidate the mechanical component curves or their current-reference point.

The inspector reports the **current segmental resistance sum** separately. It includes narrowing at the actual vascular pressures and the distal outlet resistance. Derived PVR is different again: it divides smoothed PA-minus-LA pressure by completed-beat aortic output. In a transient, unequal flows between stores prevent either quantity from being read directly from this reference curve.

## Follow the point, then check the circulation

Raise PEEP while keeping the other settings fixed and follow three observations: lung volume, the Current reference point, and RV output/filling. More inflation may move the open pathway up its high-volume limb; opening additional lung can also change the parallel vascular mixture. These effects can oppose each other. The net result must be read from the Current reference point and the running circulation, not from the slope of a reference limb alone.

The lowest point of the purple curve is therefore not an “optimal PEEP” target. This panel does not balance oxygenation, regional injury, systemic venous return or total cardiac output. If a substantially closed lung lies below the displayed fully open RV landmark, the Current reference point is outside the horizontal domain and is omitted; that is a plotting limit, not evidence that the simulation has stopped.

## In the model

The two reference limbs are calculated with the open fraction fixed at one. Their sum is the fully open geometric reference. The Current reference point is calculated separately from the equivalent parallel open/closed conductance mixture. Recruitment and HPV affect that mixture; the reference limbs retain a fully open population. The same reference coefficient is partitioned across the three connections in the running circuit, where middle-outlet narrowing and the distal venous resistance add to its load.

Model RV is the completely open lung volume at zero transpulmonary pressure; model TLC is the selected `lungCapacity`. These are graphical model landmarks, not spirometric measurements in the current patient.

## Limits

- The component curves are conceptual aggregate resistances; alveolar and extra-alveolar vessels are not independently measured in vivo.
- The vertical coefficients express a didactic reference shape. They are not an independently identified human PVR–volume curve.
- The location of the minimum is imposed by the model equations; it is not an independently validated output.
- The Current reference point includes the open/closed lung mixture and HPV. It excludes pressure-dependent vascular narrowing, the fixed distal venous resistance, pulsatile impedance, viscosity, explicit obstruction and regional perfusion.
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

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Hypoxic vasoconstriction](hypoxic-vasoconstriction.md) · [Lung opening profiles](recruitment-and-ri.md) · [The right ventricle](the-right-ventricle.md) · [Pulmonary controls](controls-pulmonary.md)
