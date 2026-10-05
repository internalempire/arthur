# The thorax panel

> The anatomical panel is a pressure-chamber schematic: it shows what surrounds the heart, how lung volume changes, and how the two ventricles interact.

---

## How to read it

The outline is the thorax. Its size follows lung inflation above the patient’s calculated relaxation volume, and its colour wash follows pleural pressure: cooler for subatmospheric pressure and warmer for positive pressure. The lung shapes expand with inflation but do not represent regional aeration.

The central disc represents both ventricles. Its total size follows combined RV and LV volume; the septum divides its area according to their volume ratio and bows according to the model's septal pressure interaction. The drawing therefore makes RV dilatation and leftward septal displacement visible, but it is not an echocardiographic view.

The dashed outer ring appears only when model pericardial pressure is appreciably above zero. The inferior vena cava narrows and widens with its own blood volume rather than with instantaneous right-atrial pressure, so it remains dilated with a blunted respiratory excursion in tamponade and narrows more during an effective inspiratory draw; see [inferior vena cava](inferior-vena-cava.md).

The left annotations show current pleural, alveolar and abdominal pressure in cmH₂O, relative to atmosphere. The right annotations show three-second exponentially smoothed CVP and transmural CVP in mmHg, plus the latest beat’s RV:LV end-diastolic volume ratio. The chamber areas, by contrast, follow instantaneous ventricular volumes. These different clocks explain why the moving picture and the end-diastolic ratio need not agree at every instant.

## A reading sequence

First identify the pressure surrounding the heart, then compare the chamber sizes, then read output in the tiles. For example, a warmer thoracic wash with a higher CVP does not prove better filling: compare transmural CVP and RV end-diastolic volume. A large RV beside a smaller LV suggests unequal filling or emptying; the picture alone cannot identify whether the cause is pulmonary load, weak contraction or pericardial competition. Use the [PV loops](panel-pv-loops.md) and [pulmonary panel](panel-pvr-curve.md) to follow those alternatives.

## Useful comparisons

- Compare spontaneous and positive-pressure inspiration: the colour wash reverses with pleural pressure.
- Raise abdominal pressure: follow IVC calibre together with the venous driving gradient. The calibre changes as blood redistributes through the IVC; raising surrounding pressure alone does not instantly change a drawing driven by stored volume.
- Raise pulmonary vascular load: watch RV enlargement, septal displacement and LV filling together.
- Load the cardiac-tamponade preset: the dashed ring follows pericardial pressure and the IVC remains dilated but still moves slightly with its represented blood volume; restoring pericardial capacity permits both ventricles to refill.
- Increase PEEP in a recruitable and a non-recruitable lung: the same airway pressure can produce different lung volume and RV load.

## In the model

Every moving element is bound to a state variable. The septal line is solved so that its curved partition preserves the ventricular area ratio, so the two areas agree with the instantaneous volume ratio. The separately printed end-diastolic ratio describes a different moment in the cardiac cycle. Pleural colour and vessel calibre are bounded for legibility, so changes near the visual limits are not proportional.

## Why a schematic and not anatomy

A realistic illustration would imply regional and geometric information the lumped model does not possess. The schematic instead exposes pressure reference, chamber volume and coupling—the relations the equations actually contain.

## Limits

- The lungs have no lobes, dependent regions, perfusion map or regional pleural-pressure gradient.
- Chamber area is a visual encoding of lumped volume, not a diameter or area measured in an imaging plane.
- Septal curvature is qualitative and must not be interpreted as D-shaping severity.
- IVC calibre follows the IVC compartment's own blood volume, not an ultrasound measurement of collapsibility or separate SVC/IVC flow. See [inferior vena cava](inferior-vena-cava.md).
- The pericardial ring follows model pressure, not effusion size, chamber collapse or an echocardiographic diagnosis of tamponade.

## References

- Jardin F, Vieillard-Baron A. Right ventricular function and positive pressure ventilation in clinical practice: from hemodynamic subsets to respirator settings. *Intensive Care Med*. 2003;29:1426–1434. [doi:10.1007/s00134-003-1873-1](https://doi.org/10.1007/s00134-003-1873-1)
- Magder S. Heart–lung interaction in spontaneous breathing subjects: the basics. *Ann Transl Med*. 2018;6:348. [doi:10.21037/atm.2018.06.19](https://doi.org/10.21037/atm.2018.06.19)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Ventricular interdependence](ventricular-interdependence.md) · [Cardiac tamponade](cardiac-tamponade.md) · [The right ventricle](the-right-ventricle.md) · [Inferior vena cava](inferior-vena-cava.md) · [Numerical tiles](numeric-tiles.md)
