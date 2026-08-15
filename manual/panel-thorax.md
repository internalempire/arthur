# The thorax panel

> The anatomical panel is a pressure-chamber schematic: it shows what surrounds the heart, how lung volume changes, and how the two ventricles interact.

---

## How to read it

The outline is the thorax. Its size follows absolute lung volume, and its colour wash follows pleural pressure: cooler for subatmospheric pressure and warmer for positive pressure. The lung shapes expand with inflation but do not represent regional aeration.

The central disc represents both ventricles. Its total size follows combined RV and LV volume; the septum divides its area according to their volume ratio and bows according to the model's septal pressure interaction. The drawing therefore makes RV dilatation and leftward septal displacement visible, but it is not an echocardiographic view.

The dashed outer ring appears only when model pericardial pressure is appreciably above zero. The inferior vena cava narrows as right atrial pressure approaches the abdominal critical closing pressure, illustrating a [vascular waterfall](vascular-waterfalls.md).

The annotations keep atmospheric and transmural quantities together: airway, alveolar, pleural and abdominal pressure on the left; CVP, transmural CVP and the model RV:LV end-diastolic volume ratio on the right.

## Useful comparisons

- Compare spontaneous and positive-pressure inspiration: the colour wash reverses with pleural pressure.
- Raise abdominal pressure: the IVC narrows when surrounding pressure approaches right atrial pressure.
- Raise pulmonary vascular load: watch RV enlargement, septal displacement and LV filling together.
- Increase PEEP in a recruitable and a non-recruitable lung: the same airway pressure can produce different lung volume and RV load.

## In the model

Every moving element is bound to a state variable. The septal line is solved so that its curved partition preserves the ventricular area ratio; otherwise the picture would disagree with the numerical RV:LV ratio. Pleural colour and vessel calibre are bounded for legibility, so changes near the visual limits are not proportional.

## Why a schematic and not anatomy

A realistic illustration would imply regional and geometric information the lumped model does not possess. The schematic instead exposes pressure reference, chamber volume and coupling—the relations the equations actually contain.

## Limits

- The lungs have no lobes, dependent regions, perfusion map or regional pleural-pressure gradient.
- Chamber area is a visual encoding of lumped volume, not a diameter or area measured in an imaging plane.
- Septal curvature is qualitative and must not be interpreted as D-shaping severity.
- IVC calibre represents one aggregate pressure relation and not ultrasound collapsibility or separate SVC/IVC flow.
- The pericardial ring does not diagnose tamponade; the model lacks a pericardial-volume control and realistic pressure–volume curve.

## References

- Jardin F, Vieillard-Baron A. Right ventricular function and positive pressure ventilation in clinical practice. *Crit Care*. 2003;7:217–223.
- Magder S. Heart–lung interaction in spontaneous breathing subjects: the basics. *Ann Transl Med*. 2018;6:348. [doi:10.21037/atm.2018.06.19](https://doi.org/10.21037/atm.2018.06.19)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Ventricular interdependence](ventricular-interdependence.md) · [The right ventricle](the-right-ventricle.md) · [Numerical tiles](numeric-tiles.md)
