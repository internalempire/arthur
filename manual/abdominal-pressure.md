# Abdominal pressure

> The abdomen is the other pressure the circulation lives against. Raising it can either help venous return or obstruct it, and which one happens depends on how full the splanchnic reservoir is.

---

## Physiology

The diaphragm separates two compartments that are mechanically coupled and behave differently. During inspiration the diaphragm descends: pleural pressure falls (or rises less than it otherwise would), and abdominal pressure rises. The splanchnic venous bed, which holds a substantial share of the body's blood volume, sits in the compartment whose pressure is going up.

This has two consequences that oppose each other, and the older teaching that "diaphragmatic descent aids venous return" is only half of it.

**When the splanchnic bed is full**, the rise in abdominal pressure squeezes blood out of a distended reservoir toward the thorax. Abdominal pressure adds to the pressure head driving venous return — [mean systemic filling pressure](venous-return.md) rises, and the fall in venous return that positive-pressure inspiration would otherwise cause is partly defended.

**When the splanchnic bed is empty**, there is nothing to squeeze. The same abdominal pressure instead compresses the capacitance vessels toward closure, and it raises the pressure at which the inferior vena cava collapses. What rises is the *resistance* to venous return, and the closing pressure of the [waterfall](vascular-waterfalls.md) — not the driving pressure.

The balance can therefore shift with vascular filling: compression of a distended abdominal reservoir may support the pressure head, whereas compression of an underfilled or collapsible bed may predominantly impede return. This helps explain why hypovolaemia worsens tolerance of raised intra-abdominal pressure and why abdominal compression is not equivalent to volume expansion.

Abdominal pressure also reaches the thorax from the other side. A raised, splinted diaphragm stiffens the chest wall, and a stiffer chest wall transmits more of each breath to the [pleural space](pleural-pressure.md). Obesity, ascites, ileus and an abdomen closed under tension all do this.

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

The two opposing consequences are separated by one state variable: how distended the venous reservoir is. The model reads that from the elastic pressure the reservoir already generates, and forms a zone index between 0 and 1:

$$
z = \operatorname{clamp}\left(\frac{P_{msf,\text{elastic}} - 2}{8},\ 0,\ 1\right)
$$

- $z$ — dimensionless distension index, 0 for an empty reservoir and 1 for a full one
- $P_{msf,\text{elastic}}$ — the pressure the venous reservoir generates from its own stressed volume alone, mmHg, before any abdominal contribution

The respiratory calculation is converted to mmHg before it enters the circulation:

$$
P_{ab,\mathrm{mmHg}} = 0.7356\,P_{ab,\mathrm{cmH_2O}}
$$

Abdominal pressure then acts on the two pathways in proportion:

$$
P_{msf} = P_{msf,\text{elastic}} + 0.6 \cdot P_{ab,\mathrm{mmHg}} \cdot z
$$

$$
R_{vr,\text{eff}} = R_{vr}\left(1 + 0.5\,(1-z)\,\frac{\max(0,\ P_{ab,\mathrm{mmHg}}-2\ \mathrm{mmHg})}{4\ \mathrm{mmHg}}\right)
$$

- $P_{msf}$ — mean systemic filling pressure, mmHg
- $P_{ab,\mathrm{mmHg}}$ — abdominal pressure after conversion to mmHg
- $R_{vr}$ — resistance to venous return as set by its control, mmHg·s/mL
- $R_{vr,\text{eff}}$ — the value the integrator actually uses

Within this interpolation, a full reservoir ($z = 1$) contributes abdominal pressure only to the pressure head, whereas an empty reservoir ($z = 0$) contributes only to effective resistance. Intermediate states combine both effects. These are model rules, not discrete physiological zones inferred at the bedside.

The coefficient 0.6 is the share of the systemic venous reservoir treated as intra-abdominal: limb and cervical veins see atmosphere, so abdominal pressure reaches mean systemic filling pressure at less than unity.

Abdominal pressure also sets the closing pressure of the great veins, which is why it appears again in [vascular waterfalls](vascular-waterfalls.md).

### What the model shows

A passive patient at 500 mL, PEEP 5, with the baseline abdominal pressure raised:

| `pab0` | P<sub>ab</sub> | P<sub>msf</sub> | CVP | cardiac output |
|---|---|---|---|---|
| 0 | 1.9 cmH₂O | 7.5 mmHg | 1.3 mmHg | 5.01 L/min |
| 5 | 6.9 | 9.2 | 1.2 | 4.91 |
| 12 | 13.9 | 13.3 | 0.4 | 4.38 |
| 20 | 21.9 | 18.2 | 0.0 | 3.85 |

In this model run, mean systemic filling pressure rises by more than 10 mmHg while output falls by about a quarter. The example illustrates how an increased pressure head can be outweighed by increased closing pressure and resistance. The accompanying fall in central venous pressure is a model result, not a general diagnostic pattern of intra-abdominal hypertension.

---

## Why this and not something else

The simplest alternative is to make abdominal pressure add to mean systemic filling pressure with a fixed coefficient. That represents compression of a distended reservoir but omits the simultaneous increase in closing pressure and resistance, particularly relevant in an underfilled circulation.

Splitting the effect required one new quantity, and the model uses a state it already has rather than a new control: the elastic pressure of the venous reservoir is a direct read-out of how distended it is. The alternative, giving the abdomen its own compliant venous compartment with its own volume, would represent the zone behaviour properly. It was not done because it adds a compartment, two constants and a second reservoir to conserve volume across, for a distinction the single index already makes visible.

The `0.6` splanchnic fraction, the transition window and the resistance coefficient are **didactic shape coefficients**. They set where the balance tips, and no measurement fixes them for an aggregate model with one venous reservoir.

---

## Limits

### Of the construction

- **One venous reservoir with a fractional abdominal share.** There is no separate splanchnic compartment, no hepatic waterfall, no portal bed, and no distinction between superior and inferior caval return. A real abdomen redistributes blood between these; the model can only scale one pooled compartment.
- **The zone index is inferred, not measured.** It is a function of the reservoir's own elastic pressure, so it is an internal coefficient in the sense used under [interpretability](interpretability.md) — never displayed as though it were a zone diagnosis.
- **The diaphragm has no geometry.** Its descent is a coefficient on lung volume, so there is no zone of apposition, no rib cage expansion from diaphragmatic contraction, and no distinction between the abdominal pressure a passive descent produces and that of a vigorous contraction.
- Abdominal compliance is not represented: the same volume displacement produces the same pressure rise regardless of whether the abdomen is lax or tense.

### Of clinical application

- **This is not a model of abdominal compartment syndrome.** There is no organ perfusion, no renal or splanchnic blood flow, no filtration pressure, and no gut ischaemia. The model shows only the venous return and chest wall consequences.
- The `pab0` control is an intra-abdominal pressure in cmH₂O, but nothing in the model corresponds to the bladder-pressure measurement technique or its errors.
- The transition between the two behaviours is a smooth ramp with coefficients chosen for legibility. Do not read the crossover as a threshold at which a patient's physiology changes.
- Nothing here predicts the response to decompression, to neuromuscular blockade, or to body position beyond the three fixed changes described under [pleural pressure](pleural-pressure.md).

---

## References

- Takata M, Wise RA, Robotham JL. Effects of abdominal pressure on venous return: abdominal vascular zone conditions. *J Appl Physiol* 1990;69:1961–72.
- Malbrain MLNG, Cheatham ML, Kirkpatrick A, et al. Results from the International Conference of Experts on Intra-abdominal Hypertension and Abdominal Compartment Syndrome. *Intensive Care Med* 2006;32:1722–32.
- Kirkpatrick AW, Roberts DJ, De Waele J, et al. Intra-abdominal hypertension and the abdominal compartment syndrome: updated consensus definitions and clinical practice guidelines. *Intensive Care Med* 2013;39:1190–206.
- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS. *Intensive Care Med* 2026. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Obesity and the abdomen](scenario-abdomen-and-chest-wall.md) · [Controls: mechanics](controls-mechanics.md)
