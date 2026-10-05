# Inferior vena cava

> The inferior vena cava is the compliant conduit that delivers blood from the systemic venous reservoir to the right atrium. Its displayed calibre follows its own blood volume rather than instantaneous right-atrial pressure, so it remains dilated but can retain a small respiratory excursion in tamponade.

---

## Physiology

The inferior vena cava is a thin-walled, highly compliant vessel that spans the abdomen and the thorax. Its intra-abdominal portion is surrounded by [abdominal pressure](abdominal-pressure.md); its intra-thoracic portion enters the chest just below the right atrium.

Two mechanical properties matter for heart–lung interaction, and both follow from the fact that the IVC is a collapsible tube in series with the rest of the venous system.

**The IVC is a volume buffer.** Its capacity to change volume with distending pressure lets it accept or release blood during the breath. That behaviour depends on shape, surrounding pressure and the length of vessel considered; a local ultrasound diameter change is not a measurement of whole-caval volume compliance. This smooths the respiratory oscillations in venous return before they reach the right atrium.

**The inferior caval pathway can develop a vascular waterfall.** The [vascular waterfall](vascular-waterfalls.md) that produces the plateau of the venous return curve can arise where surrounding pressure narrows the returning venous pathway. Thoracic and abdominal surroundings differ along that pathway. Once flow limitation occurs, further lowering atrial pressure can fail to increase return. A fixed closing allowance or obligatory wall flutter should not be inferred from the schematic.

Two clinical consequences follow.

**In a healthy, spontaneously breathing patient**, inspiration lowers pleural pressure, increases the gradient for venous return, and pulls blood out of the IVC toward the right atrium. The IVC empties and can collapse — this is the "sniff test" used in echocardiography.

**In cardiac tamponade**, the right heart cannot readily accept the increased venous return because the [pericardium](ventricular-interdependence.md) leaves little room. The IVC therefore remains distended and plethoric. Clinically this means a dilated IVC with **blunted** inspiratory collapse; it does not require the diameter to be completely motionless.

The IVC therefore links storage, venous return and collapse-limited flow. Its behaviour is influenced by upstream filling and downstream cardiac pressure; neither a large diameter nor a small respiratory excursion alone proves a need for fluid.

---

## In the model

### A separate compliant compartment

The IVC is a distinct compliant compartment between the systemic venous reservoir and the right atrium. Its volume changes with the balance of inflow and outflow, and its pressure is determined by its own compliance:

$$
P_{IVC,tm} = \frac{V_{IVC} - V_{u,IVC}}{C_{IVC}}
$$

$$
P_{IVC,atm} = \max\left(0.01\ \mathrm{mmHg},\ P_{IVC,tm} + P_{ab}\right)
$$

- $V_{IVC}$ — blood volume held in the IVC, mL
- $V_{u,IVC} = 50$ mL — unstressed volume assigned to the IVC
- $C_{IVC} = 20$ mL/mmHg — selected aggregate IVC compliance, not a validated human whole-caval measurement
- $P_{ab}$ — abdominal pressure, mmHg; the represented conduit uses this surrounding pressure throughout

The 0.01 mmHg minimum is an explicit numerical floor on atmospheric conduit pressure. Where it is active, atmospheric pressure minus abdominal pressure no longer equals the unconstrained elastic term above. Near this limit, the compartment must not be read as a complete physiological pressure–volume relation.

With both manual and reflex capacity shifts at zero, combined systemic venous unstressed volume is 2,800 mL: 2,750 mL in the systemic venous reservoir and 50 mL in the IVC. Manual and reflex capacity reductions change the reservoir intercept; the IVC zero-pressure volume stays at 50 mL. Applying **Blood volume change** adds or removes blood in the systemic venous reservoir; IVC volume follows the balance of inflow and outflow and is not a second user input.

### Split resistance to venous return

The resistance to venous return (`rvr`) is divided into two series segments:

| segment | fraction | from | to | Starling resistor? |
|---|---:|---|---|---|
| upstream | 33% | systemic venous reservoir | IVC | no — the abdominal reservoir does not collapse |
| downstream | 67% | IVC | right atrium | yes — caval collapse at $P_{crit}$ |

The same softplus collapse law described under [vascular waterfalls](vascular-waterfalls.md) applies only to the downstream segment. The upstream segment has no waterfall switch. Its resistance can nevertheless rise with abdominal pressure when both reservoir and IVC are poorly distended; [abdominal pressure](abdominal-pressure.md) describes that separate restriction. Omitting an upstream waterfall is a model choice, not a claim that real abdominal veins cannot collapse.

The downstream segment permits brief reversal when atrial pressure exceeds IVC pressure: blood then leaves the atrium and returns to the IVC. Both directions use the same closing-pressure law, with upstream and downstream ends exchanged for reversal. The upstream segment remains forward-only. The volume balance uses signed downstream flow, so reversal fills the cava rather than creating blood.

For steady forward flow the two resistances add. In a pulsatile circulation, a curve evaluated at mean pressures need not equal the mean signed flow through the two segments. The product of compliance and upstream resistance has units of time and describes one filling scale. It is not the relaxation time of the whole conduit: outflow, collapse and both surrounding pressures also affect the response. Signed flow in either direction uses these same compartment balances.

### What the thorax panel shows

The IVC width on the [thorax panel](panel-thorax.md) follows **IVC blood volume** rather than instantaneous right-atrial pressure. The vessel is treated schematically as a tube of approximately fixed length: cross-sectional area follows distending volume, so displayed calibre follows its square root.

$$
\text{calibre}_{display} =
\operatorname{clamp}\!\left(
\sqrt{\frac{\max(V_{IVC}-50,\ 0)}{20\times5}},\ 0,\ 1.4
\right)
$$

Below its unstressed volume of 50 mL the IVC collapses to a slender line. A volume of about 150 mL—equivalent to 5 mmHg of model transmural distension—defines the **reference dilated calibre**, not a hard maximum. Above that point the drawing can widen further, up to a distant safety guardrail, so a plethoric IVC does not lose every visible respiratory change merely because it is dilated.

This is not an echocardiographic diameter equation. It is a visually compressed transformation of an aggregate volume state. Its purpose is to preserve two simultaneous observations: the vessel is larger in tamponade, and its remaining respiratory excursion is smaller but not forced to zero.

### IVC behaviour across scenarios

<!-- BEGIN GENERATED: ivc-respiratory-calibre -->
*Executable setup: each preset is settled for 45 s, then IVC volume is averaged by respiratory phase over 30 s. These are ordinary model breaths, not a deep-inspiration or sniff test.*

| state | mean IVC volume (mL) | respiratory volume swing (% of mean) | change in displayed calibre (%) |
|---|---:|---:|---:|
| healthy spontaneous preset | 93 | 16.8 | 15.2 |
| cardiac-tamponade preset | 168 | 10.8 | 7.0 |
| same tamponade state, capacity restored | 107 | 14.0 | 11.3 |
<!-- END GENERATED: ivc-respiratory-calibre -->

The respiratory volume swing is not the same as ultrasound collapsibility. The displayed-calibre column reports only how much the schematic width changes after the square-root transformation. In the tamponade preset, the underlying IVC volume varies through the breath and the drawing displays that small excursion. A distended cava can therefore remain visibly distended while still changing calibre.

The magnitude is deliberately not calibrated to an ultrasound cutoff. [Himelman and colleagues](https://www.jacc.org/doi/10.1016/S0735-1097%2888%2980011-1) reviewed 115 patients with moderate or large pericardial effusions, including 33 with tamponade. Plethora was defined as less than 50% diameter reduction with deep inspiration; the 83 patients with plethora averaged an 18% reduction. That subgroup was not composed exclusively of tamponade patients. The model uses ordinary regular breaths, has no ultrasound plane or longitudinal vessel deformation, and should therefore reproduce only the direction: **dilated and less collapsible**, not a particular diagnostic percentage.

---

## Why this and not something else

**Why a separate compartment rather than a pressure-driven schematic.** Drawing the IVC from instantaneous right-atrial pressure reproduces the correct *direction* of respiratory variation in many states, but can make the vessel oscillate strongly even when it should be plethoric. In tamponade the impaired right heart cannot readily accept the returning blood, so the IVC remains dilated while its respiratory excursion is blunted. The compartment makes that distension a volume state rather than an instantaneous pressure proxy.

**Displayed calibre follows distending volume.** Relating diameter to the square root of distending volume is a geometric approximation that preserves small excursions while compressing the display of high volumes. The 150 mL reference is a display reference, not an upper limit on IVC volume. The width calculation does not enter the physiological flow equations.

**Why the Starling resistor sits on the downstream segment only.** Arthur separates an aggregate reservoir from a conduit to distinguish mobilising upstream pressure from limiting return. In the reservoir, abdominal pressure contributes to the driving head according to filling. In the downstream segment it raises the closing pressure; additional upstream resistance is permitted during depletion. Real abdominal zone behaviour is more distributed than this two-part representation.

**Why 20 mL/mmHg for the IVC.** This is an aggregate teaching coefficient that gives the conduit a visible storage effect without making it the principal reservoir. The cited experiments on canine veins support pressure-dependent distension, not a human whole-caval compliance range or this exact value.

---

## Limits

### Of the construction

- **One aggregate IVC.** There is no separate superior and inferior caval route and no azygos bypass. The model therefore cannot show selective SVC collapse or the differential response of the two routes to raised abdominal pressure.
- **No hepatic waterfall or portal system.** The systemic venous reservoir is one compartment that drains directly into the IVC.
- **The IVC is surrounded by abdominal pressure throughout.** In reality the intra-thoracic IVC sees pleural pressure, creating a pressure gradient along the vessel that the lumped compartment does not resolve.
- **No venous valves, no gravitational gradient, no orthostatic redistribution.**
- The unstressed volume (50 mL) and compliance (20 mL/mmHg) are aggregate teaching coefficients without a matched human measurement validating their magnitude.
- The 33/67 resistance split is a didactic choice. No published measurement partitions the resistance to venous return at this exact boundary.

### Of clinical application

- The IVC diameter in the thorax panel is a visual encoding of a model state; it is not an ultrasound measurement and cannot be compared to a patient's IVC diameter in centimetres.
- Displayed calibre and "plethora" are model quantities derived from a lumped compartment. They convey the right direction and ordering but not the magnitude a clinician would measure.
- The IVC is not a separate user control and offers no independent diagnostic threshold.

---

## References

- Moreno AH, Katz AI, Gold LD, Reddy RV. Mechanics of distension of dog veins and other very thin-walled tubular structures. *Circ Res*. 1970;27:1069–1080. [doi:10.1161/01.RES.27.6.1069](https://doi.org/10.1161/01.RES.27.6.1069)
- Himelman RB, Kircher B, Rockey DC, Schiller NB. Inferior vena cava plethora with blunted respiratory response: a sensitive echocardiographic sign of cardiac tamponade. *J Am Coll Cardiol*. 1988;12:1470–1477. [doi:10.1016/S0735-1097(88)80011-1](https://doi.org/10.1016/S0735-1097(88)80011-1)
- Greenway CV, Lautt WW. Blood volume, the venous system, preload, and cardiac output. *Can J Physiol Pharmacol*. 1986;64:383–387. [doi:10.1139/y86-062](https://doi.org/10.1139/y86-062)
- Barbier C, Loubieres Y, Schmit C, et al. Respiratory changes in inferior vena cava diameter are helpful in predicting fluid responsiveness in ventilated septic patients. *Intensive Care Med*. 2004;30:1740–1746. [doi:10.1007/s00134-004-2259-8](https://doi.org/10.1007/s00134-004-2259-8)
- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol*. 1990;69:1961–1972. [doi:10.1152/jappl.1990.69.6.1961](https://doi.org/10.1152/jappl.1990.69.6.1961)
- Permutt S, Riley RL. Hemodynamics of collapsible vessels with tone: the vascular waterfall. *J Appl Physiol*. 1963;18:924–932. [doi:10.1152/jappl.1963.18.5.924](https://doi.org/10.1152/jappl.1963.18.5.924)

---

## See also

[Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Abdominal pressure](abdominal-pressure.md) · [Cardiac tamponade](cardiac-tamponade.md) · [The thorax panel](panel-thorax.md) · [Transmural pressure](transmural-pressure.md)
