# The four effects of a breath

> A single breath acts on both ventricles, in both phases, and the effects do not arrive together. This page is the synthesis: what happens, in what order, and why the arterial pressure moves several seconds after the cause.

---

## Physiology

A positive-pressure inspiration activates four interacting pathways. The directions below describe a common passive-breath pattern, not four inevitable outcomes: abdominal pressure, recruitment, filling and ventricular reserve can alter the balance.

**1 · Right ventricular preload falls.** Pleural pressure rises, so right atrial pressure rises, so the gradient driving [venous return](venous-return.md) narrows. Less blood arrives at the right ventricle. Near caval collapse, the [waterfall](vascular-waterfalls.md) limits the benefit of lowering atrial pressure further. A flow plateau is not cessation of venous return.

**2 · Right ventricular afterload rises.** Lung inflation moves the lung along the [J-shaped resistance curve](pulmonary-vascular-resistance.md). On its high-volume limb, alveolar-vessel compression can increase resistance; where alveolar pressure exceeds pulmonary venous pressure, the alveolar segment sits behind a waterfall. The right ventricle ejects less for the same filling.

**3 · Left ventricular preload can rise briefly before falling.** Inflation can squeeze blood out of the pulmonary vascular bed toward the left atrium — the *piston* effect — while the reduced right ventricular output arrives later. The observed sequence depends on pulmonary vascular volume, zone conditions, flow and transit time; the early rise is not obligatory in every patient.

**4 · Left ventricular afterload falls.** The pressure component of LV afterload depends on ejection pressure relative to pressure around the heart, approximately aortic pressure minus pleural and pericardial pressure during ejection — see [transmural pressure](transmural-pressure.md). Raising pleural pressure lowers it, so a given contraction can eject more at the same filling. The [LV-failure preset](scenarios.md#lv-failure) demonstrates pressure unloading together with reduced filling and a modest fall in forward output; the net response depends on both effects.

### Why the timing matters

Effects (1) and (2) act on the right ventricle *during* inspiration. The reduced RV delivery in effect (3) can influence LV filling **later and more gradually** because the pulmonary circulation stores and releases blood. This is a storage-mediated mechanical response, not a strict waiting period for the same parcel of blood to reach the LA; pressure effects can be immediate. The model's staged buffering component is close to two seconds in the reference circulation, while its whole PA-to-LA central-volume estimate is longer. Both change with pulmonary blood volume and forward flow.

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
| LV afterload | pleural and pericardial pressures are added to intrinsic LV pressure to obtain cavity pressure; at a given aortic pressure, a rise in surrounding pressure reduces the transmural pressure required for ejection |
| the delay | storage and release through the eight-stage [pulmonary transit](pulmonary-transit.md) pathway, with mean time derived from pulmonary blood volume and RV output; this does not impose a strict dead time |

The **Pulmonary capacitance coupling** control sets the piston coefficient. Arthur weights that effect with its zone III pressure-margin index. This is a chosen aggregate rule, not a measured fraction of open capillaries or proof that pulmonary blood displacement vanishes outside zone III.

### What the model shows

After an isolated sustained fall in RV contractility, the first affected RV beat has not yet changed LV stroke volume. The left-sided response becomes detectable over the following two to three beats. Total blood volume remains conserved while the staged pulmonary compartment supplies that interval.

The delay depends on pulmonary blood volume and RV output. In matched passive experiments, pulmonary embolism lengthens the PA-to-LA estimate relative to the reference circulation, and congested low-output LV failure lengthens it further. The [pulmonary transit](pulmonary-transit.md) page gives the experiment, the three separate readouts and their limits.

This timing result does not validate PPV or SVV amplitude. The compliant pulmonary circuit filters the RV variation, while the piston, septum, pericardium and LV afterload act through separate immediate routes. Their superposition determines the final arterial waveform.

---

## Why this and not something else

The model computes the four effects through shared compartment pressures and flows, allowing them to reinforce or offset one another. This coupling provides internal consistency, but each relation still carries its own physiological assumptions.

Here they arise from a shared set of pressure, volume and flow relations rather than four waveform-level effects. The model can therefore be run to ask whether its piston or afterload term dominates in a given simulated phenotype, whether raising PEEP helps or harms that phenotype, and whether variation is driven mainly by preload or afterload. Those answers describe the model and require external validation before they are transferred to a patient.

[Pulmonary transit](pulmonary-transit.md) represents the timing and dispersion of blood delivery from the right to the left heart. Its mean depends on represented pulmonary blood volume and RV output; it is distinct from pressure-wave propagation.

---

## Limits

### Of the construction

- **The four effects are the four this model has.** Bronchial circulation, direct compression of the heart by inflated lung, and the mechanical effect of lung volume on cardiac fossa geometry are absent.
- **Transit remains aggregate.** Its mean changes with represented pulmonary blood volume and RV output, but one staged path cannot reproduce regional capillary transit, shunt or contrast kinetics. The staged portion is bounded to 0.8–6 s for numerical stability.
- **One pleural pressure**, so no regional differences in how the breath reaches different parts of the heart.
- The piston is a single coefficient acting on pulmonary venous unstressed volume. It is a stand-in for a distributed squeezing of a compliant bed, not a representation of it.
- Spontaneous effort is one aggregate activation with one amplitude control and a regular post-inspiratory decay. Pressure support includes an inspiratory trigger threshold and can show delayed or ineffective triggering with trapped pressure. There is no separately recruited expiratory-muscle pressure, fatigue adaptation or complete dyssynchrony model.

### Of clinical application

- The timing examples belong to specified model phenotypes. They demonstrate a sequence, not a fixed delay or effect size to expect in a patient.
- **The delay is the most transferable finding on this page and the least quantitative.** That the arterial consequence follows the right-sided cause is robust; its exact interval and respiratory phase depend on the selected model state.
- Nothing here tells you which of the four dominates in a given patient. The model can be used to explore its own phenotypes, but it cannot identify the dominant mechanism in an individual patient from a table or waveform alone.

---

## References

- Pinsky MR. Cardiopulmonary interactions: physiologic basis and clinical applications. *Ann Am Thorac Soc* 2018;15(Suppl 1):S45–S48. [doi:10.1513/AnnalsATS.201704-339FR](https://doi.org/10.1513/AnnalsATS.201704-339FR)
- Mahmood SS, Pinsky MR. Heart–lung interactions during mechanical ventilation: the basics. *Ann Transl Med* 2018;6:349. [doi:10.21037/atm.2018.04.29](https://doi.org/10.21037/atm.2018.04.29)
- Yuriditsky E, Mireles-Cabodevila E, Alviar CL. How I Teach: Heart–Lung Interactions during Mechanical Ventilation. Positive Pressure and the Right Ventricle. *ATS Scholar* 2025;6:94–108. [doi:10.34197/ats-scholar.2024-0059HT](https://doi.org/10.34197/ats-scholar.2024-0059HT)
- Vieillard-Baron A, Chergui K, Augarde R, et al. Cyclic changes in arterial pulse during respiratory support revisited by Doppler echocardiography. *Am J Respir Crit Care Med*. 2003;168:671–676. [doi:10.1164/rccm.200301-135OC](https://doi.org/10.1164/rccm.200301-135OC)
- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical bedside implications. *Intensive Care Med* 2026;52:2031–2034. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Pulmonary transit](pulmonary-transit.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [The right ventricle](the-right-ventricle.md) · [Clinical scenarios](scenarios.md)
