# Abdominal pressure

> The abdomen is the other pressure the circulation lives against. Raising it can either help venous return or obstruct it, and which one happens depends on how full the splanchnic reservoir is.

---

## Physiology

The diaphragm separates two compartments that are mechanically coupled and behave differently. During inspiration the diaphragm descends: pleural pressure falls (or rises less than it otherwise would), and abdominal pressure rises. The splanchnic venous bed, which holds a substantial share of the body's blood volume, sits in the compartment whose pressure is going up.

This has two consequences that oppose each other, and the older teaching that "diaphragmatic descent aids venous return" is only half of it.

**When the splanchnic bed is full**, the rise in abdominal pressure squeezes blood out of a distended reservoir toward the thorax. Abdominal pressure adds to the pressure head driving venous return — [mean systemic filling pressure](venous-return.md) rises, and the fall in venous return that positive-pressure inspiration would otherwise cause is partly defended.

**When the splanchnic bed and IVC are poorly distended**, there is less blood to mobilise. Abdominal pressure can then narrow the upstream abdominal venous pathway, while the raised pressure surrounding the IVC brings the downstream segment closer to collapse. The first effect raises resistance; the second raises the closing pressure of the [waterfall](vascular-waterfalls.md). They are represented separately so the same caval obstruction is not counted twice.

The balance can therefore shift with vascular filling: compression of a distended abdominal reservoir may support the pressure head, whereas compression of an underfilled or collapsible bed may predominantly impede return. This helps explain why hypovolaemia worsens tolerance of raised intra-abdominal pressure and why abdominal compression is not equivalent to volume expansion.

Abdominal pressure also reaches the thorax from the other side. A raised diaphragm and abdominal distension can increase resting thoracic load and alter chest-wall mechanics. The size of the transmitted [pleural pressure](pleural-pressure.md) and any stiffness change depend on anatomy and the clinical state; external load and compliance are distinct quantities.

---

## In the model

Abdominal pressure has a baseline and a respiratory component:

$$
P_{ab,\mathrm{cmH_2O}} = P_{ab,0} + k_{\text{coupling}} \cdot V_{\text{above relax}}
$$

- $P_{ab,\mathrm{cmH_2O}}$ — abdominal pressure, cmH₂O
- $P_{ab,0}$ — baseline intra-abdominal pressure, cmH₂O (the `pab0` control)
- $k_{\text{coupling}}$ — how strongly lung volume raises abdominal pressure, cmH₂O/L (the `abdCoupling` control)
- $V_{\text{above relax}}$ — lung volume above the model's zero-PEEP relaxation reference, L

`pab0` is the patient's intra-abdominal pressure and `abdCoupling` is how strongly lung volume raises it — the diaphragm's descent expressed as a coefficient rather than as geometry.

The pressure load transmitted to the thorax is represented separately by `cwLoad`. It shifts the independent [chest-wall relaxation curve](pleural-pressure.md) and can raise resting pleural pressure without changing the selected wall compliance. `pab0` does **not** automatically determine `cwLoad`: abdominal-to-thoracic transmission depends on posture, diaphragm configuration and abdominal compliance, none of which is resolved. The intra-abdominal-hypertension preset selects both values to construct one teaching phenotype; it does not encode a universal transmission fraction.

In practical terms, Arthur lets abdominal pressure support upstream pressure when blood is available to mobilise. When both the reservoir and caval conduit are poorly distended, it also permits extra resistance. The following coefficients specify that choice; they are not measurements to enter from a patient.

<details>
<summary>Model equations: filling-dependent abdominal pressure and resistance</summary>

The opposing consequences first depend on how distended the venous reservoir is. The model reads that from the elastic pressure the reservoir already generates, and forms an index between 0 and 1:

$$
z = \operatorname{clamp}\left(\frac{P_{msf,\text{elastic}} - 2}{8},\ 0,\ 1\right)
$$

- $z$ — dimensionless distension index, 0 for the low-distension end of the chosen transition and 1 for its high-distension end; these do not mean anatomically empty or full
- $P_{msf,\text{elastic}}$ — the pressure the venous reservoir generates from its own stressed volume alone, mmHg, before any abdominal contribution

The respiratory calculation is converted to mmHg before it enters the circulation:

$$
P_{ab,\mathrm{mmHg}} = 0.7356\,P_{ab,\mathrm{cmH_2O}}
$$

Abdominal pressure contributes to the pressure head in proportion to that reservoir distension:

$$
P_{msf} = P_{msf,\text{elastic}} + 0.6 \cdot P_{ab,\mathrm{mmHg}} \cdot z
$$

- $P_{msf}$ — mean systemic filling pressure, mmHg
- $P_{ab,\mathrm{mmHg}}$ — abdominal pressure after conversion to mmHg

An increase in linear resistance requires two findings at the same time: an underfilled reservoir and a poorly distended IVC. The model converts each into a smooth depletion index:

$$
d_{reservoir}=\operatorname{clamp}\left(\frac{0.60-z}{0.30},0,1\right)
$$

$$
d_{IVC}=\operatorname{clamp}\left(\frac{1.5-P_{IVC,tm}}{1.5},0,1\right)
$$

Only the upstream one-third of the selected resistance receives the abdominal multiplier:

$$
R_{up}=0.33R_{vr}\left[1+0.5\,d_{reservoir}d_{IVC}
\frac{\max(0,P_{ab}-2)}{4}\right]
$$

$$
R_{down}=0.67R_{vr}, \qquad R_{vr,eff}=R_{up}+R_{down}
$$

- $P_{IVC,tm}$ — IVC pressure relative to the abdominal pressure surrounding it, mmHg
- $R_{vr}$ — resistance to venous return selected by the user, mmHg·s/mL
- $R_{vr,eff}$ — the total linear resistance used by the integrator

In a normally filled subject either depletion index is zero, so quiet inspiration does not create a global resistance penalty. At low right atrial pressure, caval flow can still reach a plateau because abdominal pressure independently raises the critical closing pressure. In severe depletion, an additional upstream resistance can appear without also multiplying the downstream segment that already contains the waterfall. The numerical transition points are model coefficients, not bedside thresholds.

The coefficient 0.6 is the share of the systemic venous reservoir treated as intra-abdominal: limb and cervical veins see atmosphere, so abdominal pressure reaches mean systemic filling pressure at less than unity.

Abdominal pressure also sets the closing pressure of the great veins, which is why it appears again in [vascular waterfalls](vascular-waterfalls.md).

</details>

### Explore the competing effects

Pin a settled passive state and raise **Abdominal pressure** while keeping PEEP, tidal volume and thoracic wall load unchanged. Follow internal Pmsf, the effective venous-return gradient, the IVC and cardiac output together. A higher upstream pressure can coexist with less flow if the pressure limiting caval return rises more. Repeat from a lower blood volume using **Blood volume change** and **Remove**, then allow redistribution to settle: underfilling also permits the additional upstream resistance to appear.

This comparison isolates Arthur's abdominal vascular pathway. To explore an added thoracic load, change that control as a separate intervention. Raising abdominal pressure alone does not automatically stiffen or load the chest wall in this model. The [intra-abdominal hypertension scenario](scenarios.md#intra-abdominal-hypertension) combines selected vascular and thoracic changes; it is a phenotype, not an abdominal pressure threshold test.

---

## Why this and not something else

The simplest alternative is to make abdominal pressure add to mean systemic filling pressure with a fixed coefficient. That represents compression of a distended reservoir but omits the simultaneous increase in closing pressure and, in severe depletion, upstream resistance.

The additional upstream resistance is conditional on poor filling of the reservoir and IVC. Abdominal pressure does not multiply the entire resistance to venous return indiscriminately: upstream narrowing and the downstream caval waterfall are separate contributions.

Two existing states determine the response: the elastic pressure of the venous reservoir indicates whether blood is available to mobilise, and IVC transmural pressure indicates how well the conduit is distended. There is no additional regional abdominal venous compartment; the aggregate response cannot resolve regional abdominal blood redistribution.

The `0.6` splanchnic fraction, the transition window and the resistance coefficient are **didactic shape coefficients**. They set where the balance tips, and no measurement fixes them for an aggregate model with one venous reservoir.

---

## Limits

### Of the construction

- **One venous reservoir with a fractional abdominal share.** There is no separate splanchnic compartment, no hepatic waterfall, no portal bed, and no distinction between superior and inferior caval return. A real abdomen redistributes blood between these; the model can only scale one pooled compartment.
- **The reservoir and IVC depletion indices are inferred, not measured.** They are internal coefficients used to decide when an additional upstream resistance is allowed; they are not bedside diagnoses or thresholds.
- **The diaphragm has no geometry.** Its descent is a coefficient on lung volume, so there is no zone of apposition, no rib cage expansion from diaphragmatic contraction, and no distinction between the abdominal pressure a passive descent produces and that of a vigorous contraction.
- Abdominal compliance is represented only through the selected pressure–volume coupling: stronger coupling gives a greater pressure rise for the same displacement. There is no separate nonlinear abdominal pressure–volume curve or anatomical geometry; the selected coupling remains fixed during a run.
- Thoracic wall load is selected independently from abdominal pressure. The model cannot predict how much of a measured Pab reaches pleural pressure in a particular patient.

### Of clinical application

- **This is not a model of abdominal compartment syndrome.** There is no organ perfusion, no renal or splanchnic blood flow, no filtration pressure, and no gut ischaemia. The model shows only the venous return and chest wall consequences.
- The `pab0` control is an intra-abdominal pressure in cmH₂O, but nothing in the model corresponds to the bladder-pressure measurement technique or its errors.
- The transition between the two behaviours is a smooth ramp with coefficients chosen for legibility. Do not read the crossover as a threshold at which a patient's physiology changes.
- Nothing here predicts the response to decompression, to neuromuscular blockade, or to body position beyond the three fixed changes described under [pleural pressure](pleural-pressure.md).

---

## References

[Takata et al.](https://pubmed.ncbi.nlm.nih.gov/2076989/) tested the opposing effects of abdominal pressure in 12 canine experiments with an open-chest IVC bypass and phrenic stimulation. Return increased or decreased according to caval distending pressure. This supports the competing mechanisms; it does not validate Arthur's human-scale coefficients or crossover.

- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol* 1990;69:1961–72. [doi:10.1152/jappl.1990.69.6.1961](https://doi.org/10.1152/jappl.1990.69.6.1961)
- Malbrain MLNG, Cheatham ML, Kirkpatrick A, et al. Results from the International Conference of Experts on Intra-abdominal Hypertension and Abdominal Compartment Syndrome. I. Definitions. *Intensive Care Med* 2006;32:1722–32. [doi:10.1007/s00134-006-0349-5](https://doi.org/10.1007/s00134-006-0349-5)
- Kirkpatrick AW, Roberts DJ, De Waele J, et al. Intra-abdominal hypertension and the abdominal compartment syndrome: updated consensus definitions and clinical practice guidelines. *Intensive Care Med* 2013;39:1190–206. [doi:10.1007/s00134-013-2906-z](https://doi.org/10.1007/s00134-013-2906-z)
- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical bedside implications. *Intensive Care Med* 2026;52:2031–2034. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3)
- Behazin N, Jones SB, Cohen RI, Loring SH. Respiratory restriction and elevated pleural and esophageal pressures in morbid obesity. *J Appl Physiol*. 2010;108:212–218. [doi:10.1152/japplphysiol.91356.2008](https://doi.org/10.1152/japplphysiol.91356.2008)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Chest-wall and abdominal scenarios](scenarios.md#stiff-chest-wall) · [Controls: mechanics](controls-mechanics.md)
