# Pulmonary transit

> A change in right ventricular output does not reach the left heart immediately, and the delay becomes longer when more blood crosses the lung at a lower flow.

---

## Physiology

The ventricles are coupled in series. A fall in right ventricular stroke volume reduces left ventricular filling only after the affected blood volume has crossed the pulmonary circulation. Pinsky's useful bedside description is temporal rather than anatomical: after a sustained change in right-sided output, the left-sided consequence becomes evident over the following two to three beats.

That beat count is not a universal transit time. The same number of seconds contains more beats during tachycardia, and the pulmonary circulation can hold different volumes of blood. Congestion, pulmonary vascular disease, cardiac output and the landmarks used to start and stop a contrast measurement all change the reported interval.

The governing relation is the central-volume principle:

$$
T_{pul} = \frac{V_{pul}}{Q_{RV}}
$$

- $T_{pul}$ is mean pulmonary transit time, in seconds.
- $V_{pul}$ is the blood volume between the selected pulmonary arterial and left-sided landmarks, in millilitres.
- $Q_{RV}$ is mean forward right ventricular output, in millilitres per second.

The implication is more important than any single normal value. At the same pulmonary blood volume, halving flow doubles mean transit time. At the same flow, pulmonary vascular engorgement lengthens it. This is why a congested low-output circulation can retain an important right-to-left delay even when heart rate is high.

### Why the phase of the arterial response moves

During positive-pressure inspiration, right ventricular filling and sometimes right ventricular ejection fall first. The left ventricular consequence arrives after pulmonary transit and may therefore appear during expiration. Its exact phase depends on heart rate, respiratory rate, pulmonary blood volume, forward flow and competing immediate effects such as pulmonary venous emptying and reduced [left ventricular transmural afterload](transmural-pressure.md).

The delay should therefore be used to understand sequence, not to assign every expiratory arterial trough to one mechanism. A different clock ratio or a dominant direct-filling effect can move the observed nadir.

---

## In the model

The represented pulmonary blood volume is the blood physically contained in three serial compartments: pulmonary artery, the pressureless transport pathway and pulmonary vein. Mean RV flow is obtained from the most recent complete right ventricular stroke volume multiplied by heart rate. The displayed whole-circuit estimate is their ratio.

Eight well-mixed stages sit between pulmonary arterial inflow and pulmonary venous delivery. They distribute the delayed response in time; one reservoir would attenuate respiratory variation too strongly, while a pure time shift would return an unrealistically rigid copy of the right-sided waveform.

The stages do not use the whole PA-to-LA time because pulmonary artery and pulmonary vein already store blood as pressure-bearing compliant compartments. They use the fraction corresponding to the pathway's original 160 mL allocation within the initial 375 mL pulmonary circuit:

$$
T_{stage,target} = T_{pul} \times \frac{160}{375}
$$

- $T_{stage,target}$ is the target mean time of the eight-stage pathway, in seconds.
- $T_{pul}$ is the whole-circuit estimate defined above.
- $160/375$ is the explicit pathway's initial share of represented pulmonary blood volume.

The active staged time adapts toward that target over 2 seconds and is limited to 0.8–6 seconds. Adaptation prevents respiratory alternation between individual RV beats from repeatedly changing transport velocity and moving the LV response by numerical aliasing. The bounds allow stored pulmonary blood to continue draining during profound low flow without creating an arbitrarily long numerical memory. The fraction, adaptation time and bounds are implementation choices, not measured human reference ranges.

Three readouts are deliberately kept separate:

| readout | meaning |
|---|---|
| pulmonary vascular blood volume | blood currently held in PA, staged pathway and PV |
| estimated PA-to-LA mean transit | central-volume estimate, pulmonary blood volume divided by RV output |
| explicit staged buffer time | the bounded portion actually used by the eight transport stages |

### A matched model experiment

With passive ventilation, HR 75/min, RR 18/min, VT 450 mL and PEEP 5 cmH2O held constant:

<!-- BEGIN GENERATED: pulmonary-transit -->
*Executable setup: passive volume control, HR 75/min, RR 18/min, VT 450 mL, inspiratory time 1.0 s and PEEP 5 cmH₂O; baroreflex disabled; each phenotype is settled for 45 s.*

| phenotype | pulmonary blood volume (mL) | estimated PA-to-LA transit (s) | staged buffer (s) |
|---|---:|---:|---:|
| reference circulation | 419 | 5.2 | 2.3 |
| pulmonary embolism | 525 | 9.4 | 4.1 |
| congested low-output LV failure | 756 | 22.2 | 6.0 |
<!-- END GENERATED: pulmonary-transit -->

The ordering is the lesson. The embolism and LV-failure numbers are outputs of selected model phenotypes, not expected clinical values or diagnostic thresholds. The LV phenotype reaches the staged numerical ceiling, while the unbounded whole-circuit estimate remains visible.

Pressure is not delayed with blood. Pulmonary venous pressure still enters the pulmonary pressure gradient immediately, and [ventricular interdependence](ventricular-interdependence.md), pericardial interaction and the pulmonary venous piston remain immediate mechanical routes. The stages delay delivery of changing blood flow only.

---

## Why this and not something else

Keeping a fixed 2-second delay preserved one useful reference sequence but made every circulation transport blood at the same speed. Deriving time from volume and flow adds the clinically important dependence without adding a regional lung network or another user control.

Using only the current volume inside the pressureless pathway was rejected during implementation. That volume can drain while the pressure-bearing pulmonary artery fills, so the calculation could shorten transit in pulmonary embolism despite an enlarged total pulmonary reservoir. Summing PA, pathway and PV prevents that reversal.

A detailed contrast-kinetic model was also rejected. It would require injection and sampling landmarks, recirculation, regional path lengths and a definition of what imaging sequence is being reproduced. Those additions would explain an imaging biomarker more precisely but would add little to the central heart–lung teaching question: when does a right-sided flow change reach left ventricular preload?

---

## Limits

### Of the construction

- One aggregate pulmonary pathway: no regional perfusion distribution, shunt, dead-space pathway, bronchial circulation or gravity-dependent transit.
- Pulmonary vascular blood volume is the sum of lumped compartments, not a directly simulated indicator-dilution volume.
- RV output comes from the most recent complete beat. Arrhythmia and beat-to-beat variation in transit velocity are not represented.
- The staged pathway is pressureless. PA and PV carry pressure and compliance; the buffer carries timing.
- The 2-second adaptation is a numerical stabiliser, not vascular recruitment kinetics.

### Of clinical application

- The displayed estimate is PA-to-LA within the model. CMR studies often measure RV-to-LV or RV-to-LA contrast timing, so their absolute values are not interchangeable with this readout.
- A long transit time does not diagnose pulmonary embolism or heart failure. It can result from low flow, increased pulmonary blood volume, different measurement landmarks or several simultaneous abnormalities.
- The model does not reproduce contrast curves and cannot be used to infer a patient's pulmonary blood volume from an observed bolus time.
- The robust teaching claim is directional: lower forward flow and a larger pulmonary blood reservoir delay transmission of right-sided output changes to the left heart.

---

## Validation

Executable checks require the model to conserve total blood during transport, preserve the two-to-three-beat response after an isolated RV-output fall, obey the central-volume relation at fixed volume or flow, and prolong transit in matched pulmonary-embolism and congested low-output experiments. The reference ventilated circulation must retain a delayed LV stroke-volume nadir in expiration.

The full constraints are recorded in [literature ranges](../docs/LITERATURE_RANGES.md) and the implementation rationale in [model decisions](../docs/MODEL_DECISIONS.md).

---

## References

- Levinson GE, Frank MJ, Hellems HK. The pulmonary vascular volume in man: measurement from atrial dilution curves. *Am Heart J*. 1964;67:734–741. [doi:10.1016/0002-8703(64)90174-7](https://doi.org/10.1016/0002-8703(64)90174-7)
- Pinsky MR. The effects of mechanical ventilation on the cardiovascular system. *Crit Care Clin*. 1990;6:663–678. [doi:10.1016/S0749-0704(18)30360-9](https://doi.org/10.1016/S0749-0704(18)30360-9)
- Seraphim A, Knott KD, Menacho K, et al. Prognostic value of pulmonary transit time and pulmonary blood volume estimation using myocardial perfusion CMR. *JACC Cardiovasc Imaging*. 2021;14:2107–2119. [doi:10.1016/j.jcmg.2021.03.029](https://doi.org/10.1016/j.jcmg.2021.03.029)
- Chase SC, Taylor BJ, Cross TJ, et al. Influence of thoracic fluid compartments on pulmonary congestion in chronic heart failure. *J Card Fail*. 2017;23:690–696. [doi:10.1016/j.cardfail.2017.07.394](https://doi.org/10.1016/j.cardfail.2017.07.394)

---

## See also

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Ventricular interdependence](ventricular-interdependence.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Transmural pressure](transmural-pressure.md) · [Clinical scenarios](scenarios.md)
