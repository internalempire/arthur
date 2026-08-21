# Inferior vena cava

> The inferior vena cava is the compliant conduit that delivers blood from the splanchnic reservoir to the right atrium. Its displayed calibre follows its own blood volume rather than instantaneous right-atrial pressure, so it remains dilated but can retain a small respiratory excursion in tamponade.

---

## Physiology

The inferior vena cava is a thin-walled, highly compliant vessel that spans the abdomen and the thorax. Its intra-abdominal portion is surrounded by [abdominal pressure](abdominal-pressure.md); its intra-thoracic portion enters the chest just below the right atrium.

Two mechanical properties matter for heart–lung interaction, and both follow from the fact that the IVC is a collapsible tube in series with the rest of the venous system.

**The IVC is a volume buffer.** Its compliance — roughly 15–40 mL/mmHg in humans — means it can accept or release tens of millilitres of blood without a large pressure change. This smooths the respiratory oscillations in venous return before they reach the right atrium.

**The IVC is the site of the caval waterfall.** The [vascular waterfall](vascular-waterfalls.md) that produces the plateau of the venous return curve occurs where the IVC enters the thorax. There the vessel is surrounded by a pressure that is part abdominal and part pleural; when the internal pressure falls below that external pressure (minus a few cmH₂O that the vessel wall can withstand), the IVC flutters shut and flow stops rising even as right atrial pressure falls further.

Two clinical consequences follow.

**In a healthy, spontaneously breathing patient**, inspiration lowers pleural pressure, increases the gradient for venous return, and pulls blood out of the IVC toward the right atrium. The IVC empties and can collapse — this is the "sniff test" used in echocardiography.

**In cardiac tamponade**, the right heart cannot readily accept the increased venous return because the [pericardium](ventricular-interdependence.md) leaves little room. The IVC therefore remains distended and plethoric. Clinically this means a dilated IVC with **blunted** inspiratory collapse; it does not require the diameter to be completely motionless.

The IVC therefore sits at the junction of three teaching concepts: stressed volume, venous return, and the caval waterfall. Its behaviour is a readout of all three, not a mechanism of its own.

---

## In the model

### A separate compliant compartment

The IVC is now a distinct compliant compartment between the splanchnic reservoir and the right atrium. Its volume changes with the balance of inflow and outflow, and its pressure is determined by its own compliance:

$$
P_{IVC,tm} = \frac{V_{IVC} - V_{u,IVC}}{C_{IVC}}
$$

$$
P_{IVC,atm} = P_{IVC,tm} + P_{ab}
$$

- $V_{IVC}$ — blood volume held in the IVC, mL
- $V_{u,IVC} = 50$ mL — unstressed IVC volume, reallocated from the splanchnic reservoir
- $C_{IVC} = 20$ mL/mmHg — IVC compliance, within the published range of 15–40 mL/mmHg
- $P_{ab}$ — abdominal pressure, mmHg; the IVC is intra-abdominal

Total systemic venous unstressed volume is unchanged (2,800 mL before, now 2,750 mL splanchnic + 50 mL IVC). The `stressedVolume` control continues to add blood to the splanchnic reservoir; the IVC is a downstream conduit whose volume is a consequence of the dynamics, not a second user input.

### Split resistance to venous return

The resistance to venous return (`rvr`) is divided into two series segments:

| segment | fraction | from | to | Starling resistor? |
|---|---:|---|---|---|
| upstream | 33% | splanchnic reservoir | IVC | no — the abdominal reservoir does not collapse |
| downstream | 67% | IVC | right atrium | yes — caval collapse at $P_{crit}$ |

The same softplus collapse law described under [vascular waterfalls](vascular-waterfalls.md) applies only to the downstream segment. The upstream segment carries no collapse: the splanchnic bed is a capacious reservoir whose pressure is set by stressed volume and venous compliance, not by a surrounding pressure that can compress it shut.

In steady state, total flow is the same as before because `rvr_up + rvr_down = rvr_total`. The IVC adds an RC time constant of about 0.6 s (filling: $C_{IVC} \times rvr_{up}$), which buffers the respiratory oscillations in venous return.

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
| healthy spontaneous preset | 84 | 17.3 | 18.7 |
| cardiac-tamponade preset | 172 | 11.5 | 7.5 |
| same tamponade state, capacity restored | 114 | 13.7 | 10.8 |
<!-- END GENERATED: ivc-respiratory-calibre -->

The respiratory volume swing is not the same as ultrasound collapsibility. The displayed-calibre column reports only how much the schematic width changes after the square-root transformation. In the tamponade preset, the underlying IVC volume continues to vary through the breath; the drawing now shows that small excursion rather than clipping every value above 150 mL to the same width.

The magnitude is deliberately not calibrated to an ultrasound cutoff. In Himelman and colleagues' cohort, IVC plethora was defined as less than 50% reduction with deep inspiration, and the plethora group showed a mean reduction of 18%. The model uses ordinary regular breaths, has no ultrasound plane or longitudinal vessel deformation, and should therefore reproduce only the direction: **dilated and less collapsible**, not a particular diagnostic percentage.

---

## Why this and not something else

**Why a separate compartment rather than a pressure-driven schematic.** Drawing the IVC from instantaneous right-atrial pressure reproduces the correct *direction* of respiratory variation in many states, but can make the vessel oscillate strongly even when it should be plethoric. In tamponade the impaired right heart cannot readily accept the returning blood, so the IVC remains dilated while its respiratory excursion is blunted. The compartment makes that distension a volume state rather than an instantaneous pressure proxy.

**Why a square-root display rather than a hard ceiling.** A linear fullness scale previously reached its maximum at 150 mL. The tamponade preset varied from roughly 160 to 180 mL by respiratory phase, so genuine model variation was hidden and the vessel looked completely immobile. Relating diameter to the square root of distending volume is a simple geometric approximation that retains this change while compressing high volumes. It improves visual honesty without changing venous return or any physiological equation.

**Why the Starling resistor sits on the downstream segment only.** The splanchnic reservoir is a capacious bed whose surrounding pressure (abdominal) actually helps squeeze blood forward when the abdomen is distended (zone III). It does not flutter shut the way the IVC does at the thoracic inlet — the collapse is a property of the conduit, not of the reservoir. Moving the resistor downstream preserves the abdominal zone conditions described under [abdominal pressure](abdominal-pressure.md) without changing the behaviour the diagram was built to teach.

**Why 20 mL/mmHg for the IVC.** The published range of human caval distensibility spans 15–40 mL/mmHg. A middle value was chosen — large enough to produce a visible buffering effect, small enough that the IVC does not become a dominant capacitance. The value is a didactic choice and must not be read as a measured patient parameter.

---

## Limits

### Of the construction

- **One aggregate IVC.** There is no separate superior and inferior caval route and no azygos bypass. The model therefore cannot show selective SVC collapse or the differential response of the two routes to raised abdominal pressure.
- **No hepatic waterfall or portal system.** The splanchnic reservoir is one compartment that drains directly into the IVC.
- **The IVC is surrounded by abdominal pressure throughout.** In reality the intra-thoracic IVC sees pleural pressure, creating a pressure gradient along the vessel that the lumped compartment does not resolve.
- **No venous valves, no gravitational gradient, no orthostatic redistribution.**
- The unstressed volume (50 mL) and compliance (20 mL/mmHg) are aggregate teaching coefficients anchored to the plausible physiological range, not to a specific patient measurement.
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
