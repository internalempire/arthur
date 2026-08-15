# Vascular waterfalls

> Once a collapsible vessel develops a flow-limiting segment, further reductions in downstream pressure have little effect on flow. The same principle helps explain caval collapse and alveolar vascular compression, and the model uses aggregate versions of it in both places.

---

## Physiology

Rigid tubes obey a simple rule: flow is the pressure difference across the tube divided by its resistance. Collapsible tubes surrounded by a pressure do not.

Consider a floppy vessel passing through a chamber held at pressure $P_c$. While the pressure inside the vessel exceeds $P_c$ everywhere along it, the vessel is open and behaves normally. As the downstream pressure falls below $P_c$, the vessel's downstream end is squeezed shut. Flow does not stop — inflow pushes it open again — but the vessel now flutters at the point of closure, and the effective downstream pressure is pinned at $P_c$:

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

**The great veins at the thoracic inlet.** Venous return rises as right atrial pressure falls — until right atrial pressure drops below the pressure surrounding the veins, at which point the vessels collapse and flow plateaus. This is the flat part of the venous return curve, and it is a property of the veins, not of the heart. The surrounding pressure is [pleural](pleural-pressure.md) for the superior route and [abdominal](abdominal-pressure.md) for the inferior one, which is why raising intra-abdominal pressure raises the closing pressure and truncates venous return earlier.

**The pulmonary capillaries in the alveolus.** Where alveolar pressure exceeds pulmonary venous pressure, the alveolar vessels are compressed and the effective downstream pressure becomes alveolar. This is West zone 2. Its consequences are that pulmonary vascular resistance rises with lung inflation, and that a wedge pressure stops reporting left atrial pressure — the catheter is now reading alveolar pressure through a column of blood interrupted by a waterfall.

The two are the same physics in different vessels, which is why they are one page.

---

## In the model

### On the venous side

The closing pressure is abdominal pressure less the compression the cava tolerates before it shuts:

$$
P_{crit} = P_{ab,\mathrm{mmHg}} - \left(0.7356\ \frac{\mathrm{mmHg}}{\mathrm{cmH_2O}}\right)\left(5\ \mathrm{cmH_2O}\right)
$$

- $P_{crit}$ — right atrial pressure below which the great veins collapse, mmHg
- $P_{ab,\mathrm{mmHg}}$ — [abdominal pressure](abdominal-pressure.md) after conversion to mmHg
- the 5 cmH₂O is the transmural compression the vena cava tolerates before shutting

Collapse is progressive rather than a hard knee. As right atrial pressure approaches the closing pressure the vessel flutters, so sensitivity fades over about a millimetre of mercury instead of vanishing at a point:

$$
P_{\text{back}} = P_{crit} + k \ln\!\left(1 + e^{(P_{ra} - P_{crit})/k}\right), \qquad k = 1.1\ \text{mmHg}
$$

$$
\dot{Q}_{vr} = \max\!\left(0,\ \frac{P_{msf} - P_{\text{back}}}{R_{vr}}\right)
$$

- $P_{\text{back}}$ — the effective back-pressure venous return sees, mmHg
- $P_{ra}$ — right atrial pressure, mmHg
- $k$ — width of the collapse knee, 1.1 mmHg
- $P_{msf}$ — mean systemic filling pressure, mmHg
- $R_{vr}$ — resistance to venous return
- $\dot{Q}_{vr}$ — venous return, mL/s

This softplus approaches $P_{ra}$ well above the closing pressure and $P_{crit}$ well below it. The smoothing is not cosmetic: a hard `max()` puts a corner in the derivative, and a forward-Euler integrator crossing that corner at the respiratory rate produces a kink that looks like physiology.

### On the pulmonary side

Only the alveolar microvascular share of the bed sees the alveolar waterfall. The effective downstream pressure of the pulmonary circuit is a weighted blend:

$$
P_{\text{down}} = (1-w)\,P_{pv} + w \cdot \max(P_{pv},\, P_{alv}), \qquad w = 0.45
$$

- $P_{\text{down}}$ — effective downstream pressure of the pulmonary circuit, mmHg
- $P_{pv}$ — pulmonary venous pressure, mmHg
- $P_{alv}$ — alveolar pressure, mmHg
- $w$ — share of the pulmonary bed exposed to alveolar pressure

An earlier version put the *entire* pulmonary resistance behind `max(Ppv, Palv)`. A small crossing of those two mean pressures then switched the whole lung from zone III to zone II at once and added several Wood units at high PEEP. Real lungs contain alveolar and extra-alveolar segments in series and regions in different zones simultaneously; the fractional treatment is a deliberately transparent aggregate. See [pulmonary vascular resistance](pulmonary-vascular-resistance.md).

The model also tracks a **zone III index** — how far pulmonary venous pressure sits above alveolar pressure — and uses it to qualify the displayed [wedge surrogate](pulmonary-artery-wedge-pressure.md) rather than to switch the vascular behaviour. It is a normalised pressure margin, not the anatomical fraction of lung in zone III.

### What the model shows

Raising baseline abdominal pressure in a passive patient at PEEP 5:

| `pab0` | P<sub>crit</sub> | mean P<sub>ra</sub> | P<sub>msf</sub> | cardiac output |
|---|---|---|---|---|
| 0 | −1.95 mmHg | 1.1 mmHg | 7.5 mmHg | 5.01 L/min |
| 5 | 1.73 | 0.9 | 9.2 | 4.91 |
| 12 | 6.88 | 0.2 | 13.3 | 4.38 |
| 20 | 12.76 | −0.3 | 18.2 | 3.85 |

By `pab0` 12 the closing pressure has risen above right atrial pressure: the veins are collapsed and the circulation is sitting on the plateau. Output falls even though the filling pressure has risen by 6 mmHg, because the head is being measured against a floor that rose faster.

On the pulmonary side, the zone III index falls from 0.70 at PEEP 5 to 0.00 at PEEP 15 in the same patient. At that point the model marks the wedge surrogate with a caution: left atrial pressure can stand in for an occlusion pressure only under the zone III assumption, and that assumption no longer holds.

---

## Why this and not something else

**The smooth collapse law.** A hard `max()` is the textbook form and is what most lumped models use. It was replaced because the model is integrated explicitly at a fixed time step and the discontinuity in the derivative was visible in the output as a beat-frequency artefact near the plateau. The softplus reproduces the same two asymptotes with a knee about a millimetre wide, which is also closer to what a fluttering vessel does than an instantaneous switch.

**A fraction rather than a switch on the pulmonary side.** A whole-lung switch is an all-or-none behaviour standing in for a regional one. The model has no regional geography, so a fractional exposure is a transparent way to express that only part of the aggregate bed is affected. The value 0.45 is a didactic coefficient informed by published vascular partitions; it is not a measured fraction of the whole human bed that enters a waterfall simultaneously.

**Why the venous side is not treated the same way, and what that costs.**

The two waterfalls are handled with different degrees of care, and the reason is not principled.

On the pulmonary side the bed is split: 45% of it sits behind the alveolar waterfall, the rest does not. On the venous side there is a single closing pressure for all venous return. The venous anatomy presents an analogous regional problem: the superior vena cava is surrounded predominantly by **pleural** pressure, while the inferior route is strongly influenced by **abdominal** pressure. Those pressures can diverge — for example with high PEEP and a soft abdomen, or intra-abdominal hypertension at modest PEEP — so the two routes need not approach collapse at the same pressure or time in the breath.

The model collapses both at one pressure, derived from the abdomen alone. Two things follow that a clinician should know before teaching from the plateau. Raising PEEP in this model does not selectively truncate superior caval return, and raising abdominal pressure does not selectively truncate the inferior route: both act through one closing pressure, so the model shows a single blended plateau instead of two limbs reaching their own. And because the closing pressure is built from abdominal pressure alone, ventilation reaches it only indirectly.

The asymmetry survives for a reason worth stating plainly. The pulmonary simplification had a **quantitative consequence that a test caught**: with the whole bed behind `max(Ppv, Palv)`, derived pulmonary vascular resistance in ARDS reached 10–16 Wood units against human cohort ranges of about 1.5–4.75, and the executable rows in [validation](validation.md) failed. The venous simplification produces no comparable violation — no published row it is checked against distinguishes one closing pressure from two — so nothing forced it to be fixed.

That is a statement about what the tests happen to constrain, not about which simplification is more defensible. It is recorded here rather than in a commit message because it is exactly the kind of thing a reader is entitled to know is unfinished.

---

## Limits

### Of the construction

- **One closing pressure for all venous return.** No separate superior and inferior caval routes, no hepatic waterfall, no azygos rerouting. A real hold manoeuvre recruits these differently, which is one reason the model's [extrapolated intercept](pmsf-and-occlusions.md) does not match the porcine measurement.
- **The 5 cmH₂O of tolerated transmural compression is a single coefficient**, not a measured caval property, and does not vary with vessel filling or tone.
- **No West zone map.** There is no gravitational gradient and no vertical distribution of blood flow, so zones are a fraction and an index rather than regions. The model cannot show zone I at all.
- **The knee width is a numerical choice** as much as a physiological one.
- The zone III index qualifies a readout; it does not change the perfusion distribution, because there is no distribution to change.

### Of clinical application

- The model can show *why* a left-atrial-pressure surrogate becomes unreliable when alveolar pressure governs part of the downstream bed. It cannot determine whether a particular patient's measured wedge is valid, and the zone III index must not be read as a measurement.
- The arithmetic $(\overline{P}_{pa}-P_{la})/\dot Q$ remains computable when the wedge surrogate is flagged, but the derived-PVR tile now inherits the same caution and must be read as an internal hydraulic gradient rather than a catheter-derived PVR.
- The closing pressure is not a bedside quantity. Nothing here supports estimating a patient's critical closing pressure from an abdominal pressure measurement.
- The plateau of the venous return curve in a patient is reached through mechanisms the model does not have, including vessel tone and reflex responses that alter caval collapsibility.

---

## References

- Permutt S, Riley RL. [Hemodynamics of collapsible vessels with tone: the vascular waterfall](https://doi.org/10.1152/jappl.1963.18.5.924). *J Appl Physiol* 1963;18:924–32.
- West JB, Dollery CT, Naimark A. [Distribution of blood flow in isolated lung; relation to vascular and alveolar pressures](https://doi.org/10.1152/jappl.1964.19.4.713). *J Appl Physiol* 1964;19:713–24.
- Permutt S, Bromberger-Barnea B, Bane HN. Alveolar pressure, pulmonary venous pressure and the vascular waterfall. *Med Thorac* 1962;19:239–60.
- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol* 1990;69:1961–72.
- Magder S. Starling resistor versus compliance. Which explains the zero-flow pressure of a dynamic arterial pressure-flow relation? *Circ Res* 1990;67:209–20.

---

## See also

[Venous return](venous-return.md) · [Abdominal pressure](abdominal-pressure.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Transmural pressure](transmural-pressure.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [Interpretability](interpretability.md) · [The Guyton panel](panel-guyton.md)
