# Vascular waterfalls

> Once a collapsible vessel develops a flow-limiting segment, further reductions in downstream pressure have little effect on flow. The same principle helps explain caval collapse and alveolar vascular compression, and the model uses aggregate versions of it in both places.

---

## Physiology

Rigid tubes obey a simple rule: flow is the pressure difference across the tube divided by its resistance. Collapsible tubes surrounded by a pressure do not.

Consider a floppy vessel passing through a chamber held at pressure $P_c$. While the pressure inside the vessel exceeds $P_c$ everywhere along it, the vessel is open and behaves normally. As downstream pressure falls sufficiently below the pressure surrounding a compliant segment, narrowing can make flow insensitive to further downstream pressure reduction. Flow can continue; flutter is possible but is not required to explain a plateau. An idealised relation is:

$$
\dot{Q} = \frac{P_{\text{up}} - \max(P_{\text{down}},\ P_c)}{R}
$$

- $\dot{Q}$ — flow through the vessel
- $P_{\text{up}}$, $P_{\text{down}}$ — pressures at the upstream and downstream ends
- $P_c$ — pressure in the chamber surrounding the vessel
- $R$ — resistance of the open vessel

In the idealised equation, lowering $P_{\text{down}}$ further changes nothing. This is the **waterfall**: like water falling over a weir, the height of the drop below the lip does not affect the rate of flow over it. The classical name is a Starling resistor.

The critical point for clinical reasoning is that downstream pressure ceases to be the sole effective back-pressure once a flow-limiting segment has formed. A downstream measurement can then become a poor guide to the pressure governing flow; it does not become physiologically meaningless in every respect.

### Two places it happens

**The great veins entering the thorax.** Venous return rises as right atrial pressure falls — until right atrial pressure drops below the pressure surrounding the veins, at which point the vessels collapse and flow plateaus. This is the flat part of the venous return curve, and it is a property of the veins, not of the heart. The surrounding pressure is [pleural](pleural-pressure.md) for the superior route and [abdominal](abdominal-pressure.md) for the inferior one, which is why raising intra-abdominal pressure raises the closing pressure and truncates venous return earlier.

**The pulmonary capillaries in the alveolus.** Where alveolar pressure exceeds pulmonary venous pressure, the alveolar vessels are compressed and the effective downstream pressure becomes alveolar. This is West zone 2. This can increase the effective opposition to flow without being identical to a rise in the intrinsic resistance coefficient. If the occluded catheter branch loses a patent column to the left atrium, wedge pressure can become influenced by alveolar pressure and cease to represent left atrial pressure reliably. Regional catheter position matters; a high PEEP does not invalidate every wedge measurement.

The two are the same physics in different vessels, which is why they are one page.

---

## In the model

### On the venous side

The aggregate closing pressure is abdominal pressure less a selected compression allowance. The waterfall lives on the downstream segment only — the [inferior vena cava](inferior-vena-cava.md) is a separate compliant compartment. This represents flow limitation in the conduit; it does not calculate vessel-wall collapse and reopening:

$$
P_{crit} = P_{ab,\mathrm{mmHg}} - \left(0.7356\ \frac{\mathrm{mmHg}}{\mathrm{cmH_2O}}\right)\left(5\ \mathrm{cmH_2O}\right)
$$

- $P_{crit}$ — aggregate critical closing pressure, mmHg relative to atmosphere
- $P_{ab,\mathrm{mmHg}}$ — [abdominal pressure](abdominal-pressure.md) after conversion to mmHg
- the 5 cmH₂O is a model compression allowance, not a measured threshold for an individual cava

The forward-return relation smooths the transition between atrial and closing pressure over about a millimetre of mercury:

$$
P_{\text{back}} = P_{crit} + k \ln\!\left(1 + e^{(P_{ra} - P_{crit})/k}\right), \qquad k = 1.1\ \text{mmHg}
$$

$$
\dot{Q}_{vr} = \max\!\left(0,\ \frac{P_{msf} - P_{\text{back}}}{R_{vr}}\right)
$$

- $P_{\text{back}}$ — the effective back-pressure venous return sees, mmHg
- $P_{ra}$ — right atrial pressure, mmHg relative to atmosphere
- $k$ — width of the collapse knee, 1.1 mmHg
- $P_{msf}$ — mean systemic filling pressure, mmHg
- $R_{vr}$ — resistance to venous return, mmHg·s/mL in this equation
- $\dot{Q}_{vr}$ — venous return, mL/s

This softplus approaches $P_{ra}$ well above the closing pressure and $P_{crit}$ well below it. The equation above is the **forward analytic Guyton relation** for the combined pathway. Its determinants follow the selected Live/Mean clock described in the [panel manual](panel-guyton.md).

The integrated **IVC–right-atrial segment** instead uses instantaneous pressures at its own ends and only its downstream resistance. Define $B(b)=P_{crit}+k\ln(1+e^{(b-P_{crit})/k})$ and $F(a,b,R)=\max(0,(a-B(b))/R)$. Its signed flow is:

$$
Q_{cav} =
\begin{cases}
F(P_{IVC},P_{ra},R_{down}) & P_{IVC}\geq P_{ra} \\
-F(P_{ra},P_{IVC},R_{down}) & P_{IVC}<P_{ra}
\end{cases}
$$

All endpoint pressures and $P_{crit}$ are in mmHg relative to atmosphere; $R_{down}$ is in mmHg·s/mL. Positive $Q_{cav}$ (mL/s) enters the right atrium; negative flow returns blood to the cava. The same closing-pressure law applies in both directions, with source and receiving ends exchanged. At equal pressures flow is zero. The same volume transfer is subtracted from one compartment and added to the other, including during reversal.

The pressure smoothing does not make the entire flow law smooth: the non-negative clamp retains a small zero-flow interval near pressure equality, especially near the closing pressure. This is a mathematical limitation, not a simulated valve or a measured reopening threshold. Net inflow averages subtract backward volume. The forward Guyton curve uses mean determinants, so it need not reproduce that net average in a pulsatile circulation.

### On the pulmonary side

The pulmonary artery, alveolar-exposed middle compartment and pulmonary veins each store blood and carry pressure. The artery feeds the middle compartment through an extra-alveolar resistance. The middle compartment drains toward the pulmonary veins through a segment whose conductance falls when its internal pressure is below alveolar pressure. The veins then drain to the LA through the remaining ordinary extra-alveolar resistance and a fixed outlet resistance. Excess baseline resistance and the HPV-associated increment are assigned before the middle store, so an arterial load does not also become a venous obstruction. See [pulmonary storage](pulmonary-transit.md).

Both pressure at the entrance to the middle outlet and pressure at its venous end matter. If both exceed alveolar pressure, that segment has its reference geometric resistance. As either end falls below alveolar pressure, the represented segment narrows. Lowering venous pressure further then produces progressively less extra forward flow. This is a smooth approach to a waterfall, rather than a discontinuous whole-lung switch. The same law allows backward flow when the endpoint pressure order reverses; equal pressures produce exactly zero flow.

For readers who want the constitutive detail, define pressure relative to the segment's surroundings as $x=P-P_{alv}$. Relative local conductance is:

$$
g(x)=\begin{cases}1,&x\geq0,\\ \exp(2x/s),&x<0,\end{cases}
\qquad s=V_{0,m}/C_m
$$

- $g$ — dimensionless conductance relative to the distended reference;
- $x$ — local intravascular pressure minus alveolar pressure, in mmHg;
- $s$ — pressure scale, in mmHg, formed from the middle store's $V_{0,m}=60$ mL and $C_m=8.4$ mL/mmHg.

The pressure–volume law's compressed branch motivates a quadratic volume/area proxy for conductance, giving the exponent 2. This is an explicit idealisation of narrowing, not a measured human capillary cross-section law. Distended vascular storage and the short resistive segment are different aggregate elements: further distension above zero transmural pressure does not automatically reduce its reference resistance. The geometric resistance curve and the storage relation do not derive a unique shared vessel radius; they summarise different contributions of a distributed bed.

The signed flow is:

$$
Q_{m\to pv}=\frac{F(P_m-P_{alv})-F(P_{pv}-P_{alv})}{R_{m,geom}},\qquad
F(x)=\begin{cases}x,&x\geq0,\\(s/2)[\exp(2x/s)-1],&x<0.\end{cases}
$$

- $Q_{m\to pv}$ — flow from the middle store toward pulmonary veins, mL/s; a negative value means reversal;
- $P_m$ and $P_{pv}$ — middle and pulmonary venous pressures relative to atmosphere, mmHg;
- $P_{alv}$ — alveolar pressure relative to atmosphere, mmHg;
- $R_{m,geom}$ — the middle outlet's geometric resistance, mmHg·s/mL;
- $F$ — the integral of relative conductance with respect to pressure, in mmHg.

The relation joins continuously across zero transmural pressure. It introduces neither a target flow nor a prescribed respiratory phase. Actual transfer also respects the shared donor-volume protection, which is a numerical safeguard and not a physiological closure mechanism.

The narrowing law has a specific asymptotic limitation. If venous pressure falls far below alveolar pressure while middle pressure remains at or above it, $F(P_{pv}-P_{alv})$ approaches $-s/2$. Flow then approaches:

$$
Q_{m\to pv}\approx\frac{P_m-(P_{alv}-s/2)}{R_{m,geom}}.
$$

Thus the apparent downstream pressure in this limit is $P_{alv}-s/2$, about 3.6 mmHg below alveolar pressure with the current coefficients. This offset follows from the chosen mathematical shape; it is not a measured critical closing pressure. It is also not a hard zero-flow threshold: when upstream pressure is below alveolar pressure, the exponential branch must be used, and finite conductance remains. The law represents progressive flow limitation, not an exact anatomical collapse pressure.

The instantaneous **Pv − Palv** margin is pressure at the venous end relative to alveolar pressure, in mmHg. The [wedge surrogate](pulmonary-artery-wedge-pressure.md) and derived PVR are cautioned when the minimum of that margin over the last complete breath is negative. After a setting change or hold, caution remains pending until an entirely new breath has been measured. The instantaneous value does not clear the badge between compressed phases. Neither quantity is a percentage of lung in zone 3, and an entirely non-negative breath does not validate a real catheter position.

### Recognise a plateau without calling it zero flow

In the **Mean** Guyton view, inspect the flat part of the venous-return relation at low right atrial pressure. It means that lowering atrial pressure further buys little additional return; it does not mean that return has stopped. Raise abdominal pressure and watch the closing-pressure marker and effective gradient as well as Pmsf. A higher Pmsf can coexist with lower flow if the effective back-pressure also rises.

For the pulmonary counterpart, compare PEEP states using the worked examples on [wedge pressure](pulmonary-artery-wedge-pressure.md#worked-examples). Follow Pv − Palv and the caution badge alongside the actual LA pressure surrogate. The model does not replace that surrogate with alveolar pressure: it flags the limits of its catheter-like interpretation.

---

## Why this and not something else

**The smoothed closing-pressure transition.** The softplus connects the open-vessel and flow-limited asymptotes without a sharp corner in effective back-pressure. Its width is a numerical and didactic choice. It does not calculate wall motion or flutter. Exchanging the source and receiving ends applies the same collapse relation to backward flow. The near-equilibrium zero-flow interval remains a limitation of the law.

**One alveolar-exposed compartment is an anatomical simplification.** Alveolar compression and extra-alveolar traction are assigned to different pressure-bearing stores, so their storage effects can oppose each other. However, one global alveolar pressure surrounds the middle store. The model does not resolve gravity-dependent regions or different vascular surroundings in aerated and nonaerated lung. A smooth collapse law does not supply that missing geography.

**The systemic venous approximation is different.** The superior caval route is mainly exposed to pleural pressure and the inferior route to abdominal pressure. Those pressures can diverge, yet systemic return uses one aggregate closing pressure derived from the abdomen. It cannot show one route collapsing while the other remains patent. The executable checks therefore do not validate regional SVC/IVC behaviour; the model shows one combined venous-return plateau.

---

## Limits

### Of the construction

- **One closing pressure for all venous return.** No separate superior and inferior caval routes, no hepatic waterfall, no azygos rerouting. A real hold manoeuvre recruits these differently, which is one reason the model's [extrapolated intercept](pmsf-and-occlusions.md) does not match the porcine measurement.
- **The 5 cmH₂O of tolerated transmural compression is a single coefficient**, not a measured caval property, and does not vary with vessel filling or tone.
- **No West zone map.** There is no gravitational gradient or distribution of regional vascular pressures. The aggregate middle outlet can become poorly conductive at negative transmural pressure, but this is not a measurement of the extent of zone I or zone II.
- **The knee width is a numerical choice** as much as a physiological one.
- **Systemic reservoir-to-IVC flow remains forward-only.** The three pulmonary vascular connections permit reversal; the caval law also permits reversal but is not a fitted human pressure-flow relation. Cardiac valves remain one-way.
- The pulmonary pressure margin qualifies a readout. It does not identify regional perfusion, capillary recruitment or a clinical wedge measurement.

### Of clinical application

- The model can show *why* a left-atrial-pressure surrogate becomes unreliable when alveolar pressure governs part of the downstream bed. It cannot determine whether a particular patient's measured wedge is valid, and the aggregate Pv − Palv margin is not a regional measurement.
- The arithmetic $(\overline{P}_{pa}-P_{la})/\dot Q$ remains computable when the wedge surrogate is flagged, but the derived-PVR tile inherits the same caution and must be read as an internal hydraulic gradient rather than a catheter-derived PVR.
- The closing pressure is not a bedside quantity. Nothing here supports estimating a patient's critical closing pressure from an abdominal pressure measurement.
- The plateau of the venous return curve in a patient is reached through mechanisms the model does not have, including vessel tone and reflex responses that alter caval collapsibility.

---

## References

[West et al.](https://journals.physiology.org/doi/abs/10.1152/jappl.1964.19.4.713) varied vascular and alveolar pressures in an isolated, perfused dog lung and measured regional flow. The study supports pressure-dependent zone behaviour, not the model's particular smooth narrowing law or its aggregate pressure-margin caution.

- Permutt S, Riley RL. [Hemodynamics of collapsible vessels with tone: the vascular waterfall](https://doi.org/10.1152/jappl.1963.18.5.924). *J Appl Physiol* 1963;18:924–32.
- West JB, Dollery CT, Naimark A. [Distribution of blood flow in isolated lung; relation to vascular and alveolar pressures](https://doi.org/10.1152/jappl.1964.19.4.713). *J Appl Physiol* 1964;19:713–24.
- Permutt S, Bromberger-Barnea B, Bane HN. Alveolar pressure, pulmonary venous pressure and the vascular waterfall. *Med Thorac* 1962;19:239–60. [doi:10.1159/000192224](https://doi.org/10.1159/000192224)
- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol* 1990;69:1961–72. [doi:10.1152/jappl.1990.69.6.1961](https://doi.org/10.1152/jappl.1990.69.6.1961)
- Magder S. Starling resistor versus compliance. Which explains the zero-flow pressure of a dynamic arterial pressure-flow relation? *Circ Res* 1990;67:209–20. [doi:10.1161/01.RES.67.1.209](https://doi.org/10.1161/01.RES.67.1.209)

---

## See also

[Venous return](venous-return.md) · [Abdominal pressure](abdominal-pressure.md) · [Inferior vena cava](inferior-vena-cava.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Transmural pressure](transmural-pressure.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [Interpretability](interpretability.md) · [The Guyton panel](panel-guyton.md)
