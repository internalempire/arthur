# The four effects of a breath

> A single breath acts on both ventricles, in both phases, and the effects do not arrive together. This page is the synthesis: what happens, in what order, and why the arterial pressure moves several seconds after the cause.

---

## Physiology

One positive-pressure inspiration does four things at once. Taken separately each is simple; the confusion at the bedside comes from the fact that they overlap in time and two of them oppose each other.

**1 · Right ventricular preload falls.** Pleural pressure rises, so right atrial pressure rises, so the gradient driving [venous return](venous-return.md) narrows. Less blood arrives at the right ventricle. Where the great veins are already near collapse, this is where the [waterfall](vascular-waterfalls.md) truncates flow entirely.

**2 · Right ventricular afterload rises.** Lung inflation moves the lung along the [J-shaped resistance curve](pulmonary-vascular-resistance.md). Above functional residual capacity, alveolar vessels are compressed and resistance rises; where alveolar pressure exceeds pulmonary venous pressure, the alveolar segment sits behind a waterfall. The right ventricle ejects less for the same filling.

**3 · Left ventricular preload can rise briefly before falling.** Inflation can squeeze blood out of the pulmonary vascular bed toward the left atrium — the *piston* effect — while the reduced right ventricular output arrives later. The observed sequence depends on pulmonary vascular volume, zone conditions, flow and transit time; the early rise is not obligatory in every patient.

**4 · Left ventricular afterload falls.** The transmural systolic pressure the left ventricle must generate is aortic pressure minus pleural pressure — see [transmural pressure](transmural-pressure.md). Raising pleural pressure lowers it, so a given contraction ejects more. This is why positive pressure helps the failing left ventricle, and why removing it at extubation can precipitate failure: see [weaning](scenario-weaning.md).

### Why the timing matters

Effects (1) and (2) act on the right ventricle *during* inspiration. Effect (3), the fall, acts on the left ventricle **later** — because the blood whose ejection was reduced has to cross the lung first. In a normal circulation that takes on the order of two seconds, several heartbeats.

At common heart and respiratory rates, the arterial pressure trough caused by inspiration often appears in **expiration**. A clinician who expects cause and effect to coincide may attribute the fall to the wrong phase of the breath. The exact phase depends on heart rate, respiratory rate and pulmonary transit.

Spontaneous inspiration reverses the sign of (1) and (4): pleural pressure falls, venous return increases, and left ventricular afterload *rises*. The two ventricles are affected in opposite directions from a ventilated breath, which is the physiological basis of pulsus paradoxus and of weaning-induced cardiac failure.

---

## In the model

The four effects are not added as corrections to the displayed waveforms, but neither are they assumption-free. Each arises from an explicit model relation: surrounding pressure alters filling and afterload, lung volume shapes PVR, a piston coefficient shifts pulmonary venous unstressed volume, and a transport pathway delays volume delivery.

| effect | where it comes from |
|---|---|
| RV preload | pleural pressure enters the pressure surrounding the right atrium, narrowing the venous return gradient |
| RV afterload | lung volume enters `pvrAt`, and alveolar pressure enters the effective downstream pressure of the pulmonary circuit |
| LV preload, piston | lung volume above resting volume lowers the pulmonary venous unstressed volume, in proportion to the zone III index |
| LV afterload | pleural pressure is added to the left ventricle's transmural pressure, so aortic ejection meets a lower transmural load |
| the delay | the eight-stage [pulmonary transit](pulmonary-transit.md) pathway, 2.0 s mean time |

The piston is on its own control (`piston`) and is gated by the zone III index, because squeezing the pulmonary bed only works where the capillaries are open.

### What the model shows

One breath at 600 mL and 12 per minute, in a moderately underfilled patient with a lung compliance of 60:

| | range within the breath | swing |
|---|---|---|
| pleural pressure | −3.87 → −0.86 cmH₂O | 3.00 |
| right ventricular stroke volume | 18.2 → 26.6 mL | 8.4 |
| left ventricular stroke volume | 22.0 → 26.0 mL | 4.0 |

Pulse pressure variation reads 18.8% and stroke volume variation 16.6%, over 9.1 heartbeats per breath.

Two things in that table carry the page. The left ventricular swing is **half** the right ventricular one: the pulmonary compartments are compliant, and they buffer the oscillation rather than transmitting it intact. The trough of left ventricular stroke volume arrives **1.64 s after** the right ventricular trough. That exact lag is produced by the staged transport pathway, whose total mean time is itself fixed at 2.0 s.

---

## Why this and not something else

The four effects could have been added directly to the output as four independent corrections. Instead, the model computes them through shared compartment pressures and flows, allowing the represented effects to reinforce or offset one another. This improves internal consistency, but it does not remove the assumptions embedded in each relation.

Here they arise from a shared set of pressure, volume and flow relations rather than four waveform-level effects. The model can therefore be run to ask whether its piston or afterload term dominates in a given simulated phenotype, whether raising PEEP helps or harms that phenotype, and whether variation is driven mainly by preload or afterload. Those answers describe the model and require external validation before they are transferred to a patient.

The delay is the one place where a mechanism was added specifically to get the *timing* right rather than the magnitude. Its justification, and the alternatives that were tried and rejected, are on the [pulmonary transit](pulmonary-transit.md) page.

---

## Limits

### Of the construction

- **The four effects are the four this model has.** Bronchial circulation, direct compression of the heart by inflated lung, and the mechanical effect of lung volume on cardiac fossa geometry are absent.
- **The transit time is fixed at 2.0 s.** A real lung's transit distribution changes with flow, vascular volume, recruitment and disease, so the lag between right and left ventricular events is more variable than the model makes it.
- **One pleural pressure**, so no regional differences in how the breath reaches different parts of the heart.
- The piston is a single coefficient acting on pulmonary venous unstressed volume. It is a stand-in for a distributed squeezing of a compliant bed, not a representation of it.
- Spontaneous effort is one waveform with one amplitude control: no inspiratory threshold load, no expiratory muscle recruitment, no dyssynchrony.

### Of clinical application

- The magnitudes above belong to one phenotype at one setting. They demonstrate an ordering and a ratio, not values to expect in a patient.
- **The delay is the most transferable finding on this page and the least quantitative.** That the arterial trough follows the inspiratory cause by several beats is robust; that it is 1.64 s is a property of this model's transit pathway.
- Nothing here tells you which of the four dominates in a given patient. The model can be used to explore its own phenotypes, but it cannot identify the dominant mechanism in an individual patient from a table or waveform alone.

---

## References

- Pinsky MR. Cardiopulmonary interactions: physiologic basis and clinical applications. *Ann Am Thorac Soc* 2018;15(Suppl 1):S45–S48.
- Mahmood SS, Pinsky MR. Heart–lung interactions during mechanical ventilation. *Ann Transl Med* 2018;6:349.
- Yuriditsky E, Mireles-Cabodevila E, Alviar CL. Heart–lung interactions. *ATS Scholar* 2025;6:94–108.
- Vieillard-Baron A, Chergui K, Augarde R, et al. Cyclic changes in arterial pulse during respiratory support revisited by Doppler echocardiography. *Am J Respir Crit Care Med* 2003;168:671–6.
- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS. *Intensive Care Med* 2026. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Pulmonary transit](pulmonary-transit.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [The right ventricle](the-right-ventricle.md) · [Weaning](scenario-weaning.md)
