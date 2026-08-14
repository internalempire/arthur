# The equation of motion

> How the model turns a breath into pressures. The chest wall gives pleural pressure, the lung gives transpulmonary pressure, and the airway sees their sum — in that order, which is what lets the two be told apart.

---

## Physiology

The respiratory system is two elastic structures in series, sharing one volume. The airway pressure needed to hold that volume is the sum of what each requires:

$$
P_{aw} = \underbrace{P_{pl}}_{\text{chest wall}} + \underbrace{P_{l}}_{\text{lung}} + \underbrace{\dot{V} R_{aw}}_{\text{airway}}
$$

- $P_{aw}$ — airway pressure, cmH₂O
- $P_{pl}$ — pleural pressure, cmH₂O: what the chest wall requires
- $P_{l}$ — transpulmonary pressure, cmH₂O: what the lung tissue requires
- $\dot{V}$ — flow, L/s
- $R_{aw}$ — airway resistance, cmH₂O·s/L

During a hold, flow is zero and the resistive term vanishes, which is why a plateau pressure is an elastic measurement and a peak pressure is not.

The clinically important consequence is that airway pressure cannot tell you where the pressure went. A plateau of 30 cmH₂O may be almost all lung — a stiff lung in a normal chest wall, where the mediastinum sees little of it — or largely chest wall, where the [pleural space](pleural-pressure.md) sees most of it and the circulation pays. Only a measurement that separates the two, such as an oesophageal balloon, distinguishes them; and it is the lung's share that stresses the tissue, while it is the chest wall's share that reaches the heart.

---

## In the model

The three terms are evaluated in a fixed order at every time step:

$$
P_{pl} = P_{pl,FRC} + \frac{V}{C_{cw}} - P_{mus}
$$

$$
P_{l} = P_{l}(V_{\text{absolute}})
$$

$$
P_{alv} = P_{pl} + P_{l}
$$

- $V$ — volume above the model's lung-derived relaxation reference, mL
- $V_{\text{absolute}}$ — absolute lung volume, L, which is what the tissue actually feels
- $C_{cw}$ — chest wall compliance, mL/cmH₂O
- $P_{mus}$ — inspiratory muscle pressure, cmH₂O
- $P_{alv}$ — alveolar pressure, cmH₂O

Airway pressure is then alveolar pressure plus the resistive drop, in whichever direction gas is moving.

The asymmetry between the two elastic elements is deliberate and is the structural claim of the model:

| element | form | why |
|---|---|---|
| chest wall | **linear**, one compliance | close to linear over the tidal range; keeps it out of the way |
| lung | **sigmoid with a saturating ceiling** | recruitment at the bottom, tissue limit at the top |

Because the chest wall is linear, every departure from a straight line in the airway pressure trace belongs to the lung. That is what makes the [stress index](stress-index.md) interpretable. If both elements bent, the curvature could not be attributed.

And because $P_l$ is a function of *absolute* lung volume rather than of tidal excursion, a lung that recruits during the breath moves along a different part of its own curve — so [recruitment changes the mechanics](recruitment-and-ri.md) rather than being a separate bookkeeping entry.

### Modes

Volume control delivers a constant inspiratory flow, so volume is the driven variable and pressure is the outcome. Pressure control applies a fixed airway pressure and lets flow decay as the alveolar pressure approaches it. Spontaneous and assisted breaths add $P_{mus}$, a half-sine over the neural inspiratory time raised to a power slightly above one, so the rise is a little slower than the fall. A patient who generates enough effort during expiration triggers the ventilator.

---

## Why this and not something else

**One compartment, not many.** A multi-compartment lung with parallel time constants would produce pendelluft, regional overdistension and the slow-compartment behaviour of obstructive disease. The model has one compartment because the questions it exists to answer are about the *circulation*, and every additional respiratory compartment would have to be given a vascular bed to be worth having. The one place where a single compartment failed badly — the inability to represent recruitability — was fixed by splitting the lung into two *populations of units* sharing one volume, which is a different thing from two compartments; see [the two-population lung](two-population-lung.md).

**Resistance is linear and constant.** Real airway resistance is flow-dependent and differs between inspiration and expiration. The one behaviour that mattered enough to add explicitly is expiratory flow limitation, which is not a resistance at all but a [choke](expiratory-flow-limitation.md).

**Forward Euler at 0.25 ms.** Explicit and small rather than implicit and large. The model must be legible line by line to be teachable, and an implicit solver is not. The cost is that discontinuities in derivatives have to be avoided deliberately — the reason the venous [collapse law](vascular-waterfalls.md) is smoothed rather than a hard `max()`.

---

## Limits

### Of the construction

- **No gas.** No oxygen, no carbon dioxide, no dead space, no V/Q. Ventilation moves volume, not gas exchange, so nothing in the model can answer a question about oxygenation.
- **One alveolar compartment**, so no pendelluft, no regional time constants, no distinction between fast and slow units.
- **The chest wall is linear at all volumes**, including where a real one is not.
- **The chest-wall reference is recentered on each lung phenotype.** The model assigns −5 cmH₂O pleural pressure at the lung-derived relaxation volume instead of solving the intersection of independent lung and chest-wall curves. See [pleural pressure](pleural-pressure.md).
- **No inspiratory threshold load, no expiratory muscle activity, no dyssynchrony, no fatigue.** Effort is one waveform with one amplitude.
- Airway resistance does not vary with flow, volume or direction.
- The ventilator is idealised: no trigger delay, no rise-time setting, no leak, no circuit compliance.

### Of clinical application

- **The model's partition between lung and chest wall is exact**; a clinician's is an oesophageal estimate with its own artefacts. Use the model to understand why the partition matters, not to justify a number.
- Airway pressures the model produces are properties of its own compliances. A plateau of 36.9 cmH₂O in the table on the [pleural pressure](pleural-pressure.md) page is what these settings give, not a prediction.
- Nothing here supports a ventilator setting for a patient.

---

## References

- Bates JHT. *Lung Mechanics: An Inverse Modeling Approach*. Cambridge University Press, 2009.
- Gattinoni L, Carlesso E, Cadringher P, et al. Physical and biological triggers of ventilator-induced lung injury and its prevention. *Eur Respir J* 2003;22(Suppl 47):15s–25s.
- Akoumianaki E, Maggiore SM, Valenza F, et al. The application of esophageal pressure measurement in patients with respiratory failure. *Am J Respir Crit Care Med* 2014;189:520–31.
- Grinnan DC, Truwit JD. Clinical review: respiratory mechanics in spontaneous and assisted ventilation. *Crit Care* 2005;9:472–84.

---

## See also

[Pleural pressure](pleural-pressure.md) · [Pressure–volume curve](pressure-volume-curve.md) · [The two-population lung](two-population-lung.md) · [Stress index](stress-index.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Model architecture](model-architecture.md) · [Controls: ventilation](controls-ventilation.md)
