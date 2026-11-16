# Pulmonary storage and transit

> Blood can accumulate in the pulmonary vessels or leave them faster than the right ventricle supplies it. That changing store links right-heart output to left-heart filling; its response follows pressures, vascular compliance and resistance.

---

## Physiology

The two ventricles are connected through vessels that contain a substantial blood volume. Their instantaneous outputs need not be equal. If the right ventricle ejects more than the pulmonary veins deliver to the left atrium, blood accumulates in the lung. If pulmonary venous delivery is greater, the lung releases previously stored blood. No blood is created or lost in either case.

Inflation affects that store in two opposing ways. Rising pressure around **alveolar vessels** can compress them and expel blood. At the same time, expanding lung tissue pulls **extra-alveolar arteries and veins** open, allowing them to accommodate more blood. Which effect dominates depends on the pressures inside the vessels, the pressures around them and the paths available for blood to enter or leave. Inflation therefore need not always increase pulmonary venous flow.

Brower and colleagues demonstrated this distinction in eight isolated, perfused canine lungs with constant arterial inflow. Inflation predominantly under zone-3 conditions transiently increased venous outflow and reduced total lung blood volume; predominantly zone-2 conditions produced the opposite response. These were open-chest preparations with controlled outlet pressure, not closed human circulations undergoing an ordinary breath. The measured blood-volume change belonged to the whole lung, not specifically to its veins.

### Three different meanings of time

**Blood residence time** asks how long blood stays between defined entry and exit boundaries. At steady through-flow, the central-volume relation is:

$$
T_{pul}=\frac{V_{pul}}{Q_{RV}}
$$

Here $V_{pul}$ is contained pulmonary blood in mL and $Q_{RV}$ is mean forward RV output in mL/s, giving seconds. At unchanged volume, lower flow lengthens this estimate; at unchanged flow, more contained blood also lengthens it.

**The time course of LV filling** asks how pulmonary pressures and outflow respond after RV output changes. Blood already in the lung can continue supplying the left heart. Storage can spread the response over subsequent beats, while altered surrounding pressures have immediate effects. A blood cell's travel time is not a compulsory waiting period before any LV response. The two-to-three-beat sequence often used in clinical teaching is not a universal transport constant.

**Arterial pressure-decay time** describes a different process. For one compliant reservoir emptying through a resistance, with no inflow and a fixed downstream pressure, pressure above that downstream level decays with time constant $R\,C$. Resistance in mmHg·s/mL multiplied by compliance in mL/mmHg gives seconds. A larger compliance releases more blood for the same fall in pressure, so that pressure fall takes longer at the same resistance. A pulmonary circulation with several stores, cardiac ejection and changing surrounding pressures does not have one universal exponential decay.

---

## In the model

The model contains three pulmonary blood stores in series:

| compartment | what it represents | pressure around it |
|---|---|---|
| pulmonary artery | aggregate arterial storage before the alveolar-exposed bed | pleural pressure minus the model's extra-alveolar traction contribution |
| middle vascular compartment | an aggregate blood store compressed by alveolar pressure | alveolar pressure |
| pulmonary veins | aggregate venous storage delivering blood to the left atrium | pleural pressure minus the same traction contribution |

The middle compartment is a mechanical representation, not a measured anatomical capillary volume. The boundaries between alveolar and extra-alveolar vessels cannot be identified exactly from the supplied isolated-lung experiments. All three stores carry pressure, and all are included in total circulating blood. The traction term applies to the entire aggregate PA store, including the volume that would anatomically belong to extrapulmonary arteries. Those proximal vessels do not experience the same parenchymal traction as intrapulmonary branches; their separate surroundings are not represented.

### How inflation changes the available space

For the extra-alveolar stores, surrounding pressure is:

$$
P_{ext,extra}=P_{pl}-kP_L,\qquad P_L=P_{alv}-P_{pl},\qquad k=0.20
$$

All terms are expressed in mmHg in the circulation calculation. $P_L$ is transpulmonary pressure, converted from the respiratory model's cmH₂O. The dimensionless $k$ represents parenchymal traction: at unchanged pleural pressure, greater lung distending pressure lowers the pressure outside the extra-alveolar vessels. At the same intravascular pressure they can then hold more blood. At unchanged blood volume their intravascular pressure initially falls, changing inflow and outflow until redistribution follows.

The middle compartment instead has $P_{ext,middle}=P_{alv}$. At unchanged blood volume, a rise in alveolar pressure raises its intravascular pressure. This can drive blood out, while simultaneously altering the pressure differences that admit blood from the pulmonary artery and deliver it toward the pulmonary veins. If intravascular pressure rises as much as surrounding pressure, the compartment need not lose blood.

These are external-pressure effects. The intrinsic zero-transmural-pressure volume $V_0$ remains fixed; it is not shifted by breathing or by systemic venous tone. A change in the volume a vessel can hold at a given **atmospheric** pressure is distinct from changing its intrinsic $V_0$.

### Pressure follows the blood actually present

Each pulmonary store uses the same form of pressure–volume relation:

$$
V(P_{tm})=\begin{cases}
V_0+C P_{tm}, & P_{tm}\geq0,\\
V_0\exp(CP_{tm}/V_0), & P_{tm}<0,
\end{cases}
\qquad P_{tm}=P_{inside}-P_{ext}
$$

Here $V$ is stored blood volume in mL, $V_0$ is the volume at zero transmural pressure in mL, $C$ is the distended-branch compliance in mL/mmHg, and $P_{tm}$ is internal minus surrounding pressure in mmHg. The positive-pressure branch has constant compliance $C$. On the negative-pressure branch, volume remains positive and compliance decreases as the store empties. Pressure and slope join continuously at zero transmural pressure. This is a compact constitutive assumption, not a reconstruction of a vessel’s cross-sectional shape.

| store | $V_0$ (mL) | distended-branch $C$ (mL/mmHg) |
|---|---:|---:|
| pulmonary artery | 50 | 4.2 |
| middle compartment | 60 | 8.4 |
| pulmonary veins | 60 | 8.5 |

The storage relation and geometric resistance law do not identify a unique shared vascular radius or length. These are aggregate teaching coefficients. The traction coefficient is informed by the displacement of the extra-alveolar pressure–volume curves in Howell's isolated canine-lobe experiment; neither that graphical estimate nor the compartment coefficients are identified human normal values. Permutt and Howell support opposing storage effects and pressure-dependent emptying, not these complete human-scale parameter values.

### Flow and conservation

Blood passes from PA to the middle store, from the middle store to PV, and from PV to LA according to their current pressure differences and resistance. Resistance above the neutral baseline and the HPV-associated increment are assigned upstream of the middle store; these represent precapillary load rather than venous obstruction. These vascular connections permit reversal. Cardiac valves remain one-way. A smooth narrowing law restricts the alveolar-exposed outlet when its internal pressure falls below alveolar pressure; [vascular waterfalls](vascular-waterfalls.md) explains the flow relation.

For each store:

$$
\frac{dV}{dt}=Q_{in}-Q_{out}
$$

Here $t$ is time in seconds, and $Q_{in}$ and $Q_{out}$ are signed inflow and outflow in mL/s. Exactly the same transfer leaves one compartment and enters the next. A change in pressure redistributes existing blood; it does not prescribe a bolus or a target LV waveform. No independently selected transit time controls these flows.

### What the readouts mean

Pulmonary blood volume is the instantaneous sum of PA, middle and PV blood. The middle-compartment volume and pressure describe the same represented store. Its pressure is relative to atmosphere, not a measured pulmonary capillary pressure or an oedema threshold.

The PA-to-LA residence estimate divides total pulmonary blood by RV forward flow from the most recent completed beat. It is an observation only: changing that calculated estimate does not change a flow, a resistance or a compartment. In a transient, the denominator and volume do not describe a steady tracer experiment, so the number is a descriptive approximation.

### Why LV variation can be smaller

A change in right-heart delivery can temporarily fill pulmonary stores instead of crossing the mitral valve immediately. Pulmonary venous and left-atrial storage can further reduce the variation reaching the LV. The missing instantaneous flow remains as blood volume and can be released later; after net storage settles, long-window mean flows must agree.

Breathing also changes vascular surrounding pressures, cardiac surrounding pressure and ventricular interaction. Their effects can reinforce or oppose the response to RV output. A longer volume/flow residence estimate therefore does not prove stronger attenuation or predict PPV in one direction. Both the size and phase of respiratory LV variation remain quantitative limitations of this model.

The systemic **Venous compliance (slope)** control does not adjust pulmonary or atrial compliance. See [pulmonary controls](controls-pulmonary.md#compliance-capacity-and-filling-are-different) for the fixed internal coefficients and indirect effects of user controls.

### A matched model experiment

The following table is generated from a declared model protocol. It compares represented storage and its volume/flow estimate, not measured human contrast timing.

<!-- BEGIN GENERATED: pulmonary-transit -->
*Executable setup: passive volume control, HR 75/min, RR 18/min, VT 450 mL, inspiratory time 1.0 s and PEEP 5 cmH₂O; baroreflex disabled; each phenotype is sampled after automatic initialization (15 s) and 45 additional seconds (60 s total).*

| phenotype | pulmonary blood volume (mL) | PBV / last-beat RV flow (s) | middle-store volume (mL) |
|---|---:|---:|---:|
| reference circulation | 409 | 4.5 | 129.5 |
| pulmonary embolism | 455 | 6.7 | 109.1 |
| congested low-output LV failure | 789 | 15.5 | 272.2 |
<!-- END GENERATED: pulmonary-transit -->

The disease labels describe selected model phenotypes. Their absolute blood volumes and residence estimates are not clinical reference ranges. Low flow and congestion can both lengthen the estimate; the response of LV output must still be inspected separately. Near arrest a finite numerical display cannot be interpreted as a finite physiological zero-flow transit time.

---

## Limits

- The pulmonary circuit has one aggregate alveolar-exposed store and two extra-alveolar stores. It has no regional perfusion, gravitational pressure gradient, bronchial circulation, shunt, tracer recirculation or measured distribution of transit paths.
- The middle store uses the global alveolar pressure even when some lung is compromised. Different surrounding pressures in open and closed regions are not represented; open/closed conductances still influence the reference resistance mixture.
- The distended branches have fixed compliance. No resistance–compliance law imposes a constant pulmonary arterial RC time, and arterial pulse pressure is not quantitatively validated by conservation or the central-volume identity.
- Collapse alters the middle outlet's conductance. Pressure-dependent widening of a fully distended resistance bed is not represented. More contained blood does not automatically mean less resistance: vascular length, geometry and perfused pathways also matter.
- Absolute storage changes, PPV amplitude and RV-to-LV timing are not calibrated human predictions. The model is not required to place a nadir in a selected respiratory phase.

## Validation

Checks distinguish physical consistency from external evidence: conserve blood, allow pressure-driven reversal, produce no flow at equal endpoint pressures, maintain positive storage and agree after time-step refinement. Isolated-lung comparisons must state whether flow or vascular pressure is held fixed and whether pressures are referenced to atmosphere or to lung surroundings. A matching direction under those conditions does not validate every coefficient or the complete intact-human response.

## Scope of the experimental support

The supplied isolated-lung studies support opposing alveolar compression and extra-alveolar expansion, but do not identify a complete human compartment model. Pressure-matched protocol analogues expose further limits: the model overstates the resistance rise during positive-pressure inflation compared with Peták's rat preparation, and does not reproduce Hakim's slight high-inflation increase in the venous pressure drop. These are specific discrepancies, in addition to differences in species, scale and segment definitions. See the [resistance comparison](pulmonary-vascular-resistance.md#what-the-isolated-lung-comparisons-do-and-do-not-establish).

Consequently, conservation of blood and the emergence of a plausible redistribution mechanism do not establish a quantitatively correct venous pulse, PPV amplitude or RV-to-LV response delay. Those outputs must be read as conditional model responses.

## References

- Permutt S, Howell JBL, Proctor DF, Riley RL. Effect of lung inflation on static pressure-volume characteristics of pulmonary vessels. *J Appl Physiol*. 1961;16:64–70. [doi:10.1152/jappl.1961.16.1.64](https://doi.org/10.1152/jappl.1961.16.1.64)
- Howell JBL, Permutt S, Proctor DF, Riley RL. Effect of inflation of the lung on different parts of pulmonary vascular bed. *J Appl Physiol*. 1961;16:71–76. [doi:10.1152/jappl.1961.16.1.71](https://doi.org/10.1152/jappl.1961.16.1.71)
- Brower R, Wise RA, Hassapoyannes C, et al. Effect of lung inflation on lung blood volume and pulmonary venous flow. *J Appl Physiol*. 1985;58:954–963. [doi:10.1152/jappl.1985.58.3.954](https://doi.org/10.1152/jappl.1985.58.3.954)
- Levinson GE, Frank MJ, Hellems HK. The pulmonary vascular volume in man: measurement from atrial dilution curves. *Am Heart J*. 1964;67:734–741. [doi:10.1016/0002-8703(64)90174-7](https://doi.org/10.1016/0002-8703(64)90174-7)
- Seraphim A, Knott KD, Menacho K, et al. Prognostic value of pulmonary transit time and pulmonary blood volume estimation using myocardial perfusion CMR. *JACC Cardiovasc Imaging*. 2021;14:2107–2119. [doi:10.1016/j.jcmg.2021.03.029](https://doi.org/10.1016/j.jcmg.2021.03.029)
- Pinsky MR. The effects of mechanical ventilation on the cardiovascular system. *Crit Care Clin*. 1990;6:663–678. [doi:10.1016/S0749-0704(18)30360-9](https://doi.org/10.1016/S0749-0704(18)30360-9)

---

## See also

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Pulmonary controls](controls-pulmonary.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Transmural pressure](transmural-pressure.md)
