# Inferior vena cava

> The inferior vena cava is the compliant conduit that delivers blood from the splanchnic reservoir to the right atrium. Its diameter follows its own blood volume rather than the instantaneous right atrial pressure, so it stays full in tamponade and collapses during strong inspiratory draw.

---

## Physiology

The inferior vena cava is a thin-walled, highly compliant vessel that spans the abdomen and the thorax. Its intra-abdominal portion is surrounded by [abdominal pressure](abdominal-pressure.md); its intra-thoracic portion enters the chest just below the right atrium.

Two mechanical properties matter for heart–lung interaction, and both follow from the fact that the IVC is a collapsible tube in series with the rest of the venous system.

**The IVC is a volume buffer.** Its compliance — roughly 15–40 mL/mmHg in humans — means it can accept or release tens of millilitres of blood without a large pressure change. This smooths the respiratory oscillations in venous return before they reach the right atrium.

**The IVC is the site of the caval waterfall.** The [vascular waterfall](vascular-waterfalls.md) that produces the plateau of the venous return curve occurs where the IVC enters the thorax. There the vessel is surrounded by a pressure that is part abdominal and part pleural; when the internal pressure falls below that external pressure (minus a few cmH₂O that the vessel wall can withstand), the IVC flutters shut and flow stops rising even as right atrial pressure falls further.

Two clinical consequences follow.

**In a healthy, spontaneously breathing patient**, inspiration lowers pleural pressure, increases the gradient for venous return, and pulls blood out of the IVC toward the right atrium. The IVC empties and can collapse — this is the "sniff test" used in echocardiography.

**In cardiac tamponade**, the right heart cannot accept the increased venous return because the [pericardium](ventricular-interdependence.md) leaves no room. The IVC cannot empty; it stays distended and plethoric. The echocardiographic sign is a dilated IVC with blunted or absent inspiratory collapse.

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

The IVC width on the [thorax panel](panel-thorax.md) follows **IVC blood volume** rather than instantaneous right atrial pressure. Fullness is normalised to the volume that 5 mmHg of transmural distension would hold:

$$
\text{fullness} = \operatorname{clamp}\!\left(\frac{V_{IVC} - 50}{20 \times 5},\ 0,\ 1\right)
$$

Below its unstressed volume (50 mL) the IVC collapses to a slender line. At or above 5 mmHg of distension (~150 mL) it reaches its maximum drawn width.

This is a deliberate change from the earlier version, which drove the IVC from the instantaneous `Pra − Pcrit`. That formulation could not distinguish a high-pressure IVC that is emptying (tamponade, where the vein stays full because blood cannot drain) from one that is emptying despite high pressure (strong inspiration), because both share a similar pressure difference while their volumes differ.

### IVC fullness across scenarios

| scenario | IVC volume (mL, mean) | respiratory swing | visual description |
|:---|---:|---|---|
| cardiac tamponade | ~175 | small (~15%) | **dilated and fixed** — fullness at maximum throughout the breath |
| pulmonary embolism | ~125 | moderate (~19%) | dilated, some respiratory variation |
| healthy, spontaneous | ~80 | moderate (~22%) | narrows with each inspiration |
| healthy, passive VCV | ~80 | small (~10%) | stable, minimal respiratory change |

In tamponade the IVC remains at its maximum visual width for the entire respiratory cycle: the blood cannot drain into the obstructed right heart, so the conduit stays full. In spontaneous breathing the IVC narrows during inspiration as blood is drawn toward the right atrium. Both behaviours emerge from the compartment's own volume dynamics rather than being scripted into the drawing.

---

## Why this and not something else

**Why a separate compartment rather than a pressure-driven schematic.** Drawing the IVC from the instantaneous right atrial pressure reproduces the correct *direction* of respiratory variation in most states, but makes the vessel oscillate strongly even when it should be plethoric and fixed. Real cardiac tamponade produces a dilated, non-collapsing IVC because the right heart cannot accept the blood — a volume phenomenon that a pressure-driven schematic cannot represent. The compartment makes "fullness" a model state rather than an instantaneous reading.

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
- "Fullness" and "plethora" are model quantities derived from a lumped compartment. They convey the right direction and ordering but not the magnitude a clinician would measure.
- The IVC is not a separate user control and offers no independent diagnostic threshold.

---

## References

- Moreno AH, Katz AI, Gold LD, Reddy RV. Mechanics of distension of dog veins and other very thin-walled tubular structures. *Circ Res*. 1970;27:1069–1080. [doi:10.1161/01.RES.27.6.1069](https://doi.org/10.1161/01.RES.27.6.1069)
- Greenway CV, Lautt WW. Blood volume, the venous system, preload, and cardiac output. *Can J Physiol Pharmacol*. 1986;64:383–387. [doi:10.1139/y86-062](https://doi.org/10.1139/y86-062)
- Barbier C, Loubieres Y, Schmit C, et al. Respiratory changes in inferior vena cava diameter are helpful in predicting fluid responsiveness in ventilated septic patients. *Intensive Care Med*. 2004;30:1740–1746. [doi:10.1007/s00134-004-2259-8](https://doi.org/10.1007/s00134-004-2259-8)
- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol*. 1990;69:1961–1972. [doi:10.1152/jappl.1990.69.6.1961](https://doi.org/10.1152/jappl.1990.69.6.1961)
- Permutt S, Riley RL. Hemodynamics of collapsible vessels with tone: the vascular waterfall. *J Appl Physiol*. 1963;18:924–932. [doi:10.1152/jappl.1963.18.5.924](https://doi.org/10.1152/jappl.1963.18.5.924)

---

## See also

[Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Abdominal pressure](abdominal-pressure.md) · [Cardiac tamponade](cardiac-tamponade.md) · [The thorax panel](panel-thorax.md) · [Transmural pressure](transmural-pressure.md)