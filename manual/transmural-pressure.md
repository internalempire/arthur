# Transmural pressure

> Every structure in the chest is distended by the difference between the pressure inside it and the pressure around it. The model computes that difference explicitly for every compartment, which is why a rising central venous pressure can mean less filling rather than more.

---

## Physiology

Internal pressure alone does not determine distension. The relevant mechanical load includes the difference across the wall:

$$
P_{\text{transmural}} = P_{\text{inside}} - P_{\text{surrounding}}
$$

- $P_{\text{transmural}}$ — distending pressure across the wall, mmHg
- $P_{\text{inside}}$ — pressure in the lumen or cavity, mmHg; this is what a catheter reads
- $P_{\text{surrounding}}$ — pressure in the space the structure sits in, mmHg

That difference is the distending pressure. The resulting volume also depends on wall stiffness, geometry and, in a cardiac chamber, the phase and strength of contraction. Everything else in heart–lung interaction follows from the fact that mechanical ventilation changes the *surrounding* term while a catheter measures the *inside* one.

The thorax contains structures with four different surroundings. The great vessels outside the chest see atmospheric pressure. Extra-alveolar intrathoracic vessels are influenced by [pleural pressure](pleural-pressure.md), whereas alveolar microvessels also experience alveolar pressure. Lung distension depends on alveolar minus pleural pressure. The cardiac chambers see pleural pressure plus whatever the pericardium adds. The splanchnic venous reservoir sees [abdominal pressure](abdominal-pressure.md). A single number quoted "in mmHg" therefore means something different depending on which of these it was measured in.

### Why this makes filling pressures untrustworthy

A central venous catheter reports pressure referenced to atmosphere. Right ventricular filling depends on right atrial pressure referenced to the pericardial space. Applying PEEP can raise pleural pressure and measured central venous pressure while reducing venous return and transmural filling pressure. Transmural atrial pressure is more informative about distension than atmospheric CVP alone, but ventricular filling still depends on chamber compliance, atrioventricular flow and pericardial constraint.

The measured number and the transmural estimate can therefore move in **opposite directions**. The magnitude and even the net change depend on volume status, chest-wall mechanics, pericardial constraint and the timing of measurement, so the example should be used as a mechanism rather than a universal rule.

The same reasoning explains why raised intrathoracic pressure unloads the left ventricle. One component of LV afterload is the systolic pressure generated relative to its surroundings. During ejection, aortic pressure minus pressure around the heart approximates this pressure burden; ventricular geometry, arterial impedance and the time course of pressure also matter. Raising pleural pressure lowers that difference at constant arterial pressure, which is why positive pressure can help a failing left ventricle and why removing it at extubation can precipitate failure. The [LV-failure preset](scenarios.md#lv-failure) demonstrates reduced transmural ejection pressure, while forward output falls modestly because filling also falls. Arthur does not reproduce the oedema, ischaemia, changing effort and other mechanisms required to simulate weaning-induced cardiac failure as a complete syndrome.

---

## In the model

For the represented vascular reservoirs and cardiac chambers, an elastic relation gives pressure relative to the surroundings; external pressure is then added to obtain atmospheric pressure. The simplest linear form is shown below. Ventricular passive stiffness is nonlinear and contraction changes throughout the beat; the staged pulmonary transport store has no separate pressure measurement.

```
transmural = elastance × (volume − unstressed volume)
measured   = transmural + surrounding
```

The surrounding pressure differs by compartment:

| compartment | surrounded by |
|---|---|
| systemic arteries | atmosphere (zero) |
| systemic venous reservoir | an effective fractional abdominal contribution described under [abdominal pressure](abdominal-pressure.md); elastic recoil is the pressure generated within the reservoir, not its surroundings |
| aggregate IVC conduit | abdominal pressure, with a model lower bound on atmospheric conduit pressure |
| pulmonary artery, pulmonary vein | pleural pressure |
| all four cardiac chambers | pleural pressure **+** pericardial pressure |
| alveoli | pleural pressure |

The cardiac chambers share one external pressure, `pExtCardiac`, which is why the [pericardium](ventricular-interdependence.md) couples them: anything that raises it lifts all four measured pressures together without changing any of them relative to each other.

Pressures generated in cmH₂O by the respiratory model are converted once, at the boundary, so no equation mixes units. See [glossary](glossary.md).

### What the model shows

Raising PEEP in a passive patient at 500 mL and 14 breaths per minute:

<!-- BEGIN GENERATED: transmural-peep -->
*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s.*

| PEEP (cmH₂O) | measured CVP (mmHg) | transmural CVP (mmHg) | cardiac output (L/min) |
|---:|---:|---:|---:|
| 0 | -0.6 | 2.7 | 5.56 |
| 5 | 1.1 | 2.6 | 5.55 |
| 10 | 2.6 | 2.3 | 5.30 |
| 15 | 4.2 | 2.1 | 4.89 |
| 20 | 5.8 | 2.0 | 4.60 |

Across this sweep, measured CVP rises by 6.4 mmHg while transmural CVP falls by 0.7 mmHg.
<!-- END GENERATED: transmural-peep -->

Reading the rise in measured CVP as improved filling would give the wrong conclusion in this experiment: transmural filling pressure and output move in the opposite direction. Pin the settled starting state, change PEEP, and compare CVP with transmural CVP and ventricular end-diastolic volume. Allow the new state to settle before comparing the magnitude; the readouts use different averaging windows.

The app reports measured and transmural CVP together. It also places the **Wedge surrogate**, smoothed with a three-second time constant, beside a separately synchronised **LA transmural pressure** tile, so left-sided external pressure transmission can be inspected without subtracting an instantaneous respiratory value from a smoothed vascular value. See [numeric tiles](numeric-tiles.md) and [pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md).

---

## Why this and not something else

A lumped circulation can be written entirely in gauge pressures, with ventilation entering as a correction applied where it is judged to matter. That is simpler and it is how many teaching models are built.

The model carries surrounding pressure explicitly because these corrections are the subject. Pleural transmission to the right atrium, the abdominal contribution to mean systemic filling pressure, left ventricular transmural afterload and the [vascular waterfalls](vascular-waterfalls.md) are therefore computed through shared relations. Their coefficients and compartment assignments remain explicit modelling assumptions.

The cost is that every compartment must have a defensible answer to "what surrounds this?", including compartments where the honest answer is a simplification — the splanchnic fraction of the venous reservoir being the clearest case.

---

## Limits

### Of the construction

- **Pleural pressure is one number for the whole thorax.** There is no vertical gradient, so no dependent-versus-non-dependent difference in surrounding pressure. This is the assumption that most limits the model's account of position and of regional behaviour.
- **No gravitational hydrostatic column.** Vessels have no height, so nothing is referenced to a phlebostatic axis and there is no zone I–III geography, only the fractional treatment described under [vascular waterfalls](vascular-waterfalls.md).
- **The pericardium is a lumped constraint** on total heart volume, not a surface with regional contact pressures.
- **Only a fraction of the systemic venous reservoir is treated as abdominal.** Limb and cervical veins see atmosphere, and the split is a single coefficient rather than separate beds.

### Of clinical application

- The model's "measured" pressures are clean. A real catheter adds zero drift, transducer level error, respiratory swing read at the wrong point of the cycle, and over- or under-damping — none of which exist here. The model can show why a filling pressure misleads *in principle*; it cannot show the measurement artefacts that mislead in practice.
- Nothing here licenses a numeric threshold. The point is the direction of the discrepancy between measured and transmural pressure, not its size in an individual.
- Oesophageal pressure is not simulated as a measurement, with its own positional and elastance errors. The model's pleural pressure is the true value, which is precisely what a clinician does not have.

---

## References

The distinction between arterial pressure and transmural ejection pressure has direct human experimental support: [Buda et al.](https://pubmed.ncbi.nlm.nih.gov/460363/) studied eight patients during Müller and Valsalva manoeuvres. That protocol supports the mechanism, not a universal cardiac-output response to PEEP.

- Buda AJ, Pinsky MR, Ingels NB Jr, et al. Effect of intrathoracic pressure on left ventricular performance. *N Engl J Med*. 1979;301:453–459. [doi:10.1056/NEJM197908303010901](https://doi.org/10.1056/NEJM197908303010901)

- Pinsky MR. Cardiopulmonary interactions: physiologic basis and clinical applications. *Ann Am Thorac Soc* 2018;15(Suppl 1):S45–S48. [doi:10.1513/AnnalsATS.201704-339FR](https://doi.org/10.1513/AnnalsATS.201704-339FR)
- Magder S. Central venous pressure: a useful but not so simple measurement. *Crit Care Med* 2006;34:2224–7. [doi:10.1097/01.CCM.0000227646.98423.98](https://doi.org/10.1097/01.CCM.0000227646.98423.98)
- Mahmood SS, Pinsky MR. Heart–lung interactions during mechanical ventilation: the basics. *Ann Transl Med* 2018;6:349. [doi:10.21037/atm.2018.04.29](https://doi.org/10.21037/atm.2018.04.29)
- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical bedside implications. *Intensive Care Med* 2026;52:2031–2034. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3)
- Jardin F, Farcot JC, Boisante L, et al. Influence of positive end-expiratory pressure on left ventricular performance. *N Engl J Med* 1981;304:387–92. [doi:10.1056/NEJM198102123040703](https://doi.org/10.1056/NEJM198102123040703)

---

## See also

[Pleural pressure](pleural-pressure.md) · [Abdominal pressure](abdominal-pressure.md) · [Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Ventricular interdependence](ventricular-interdependence.md) · [The four effects of a breath](the-four-effects-of-a-breath.md) · [Interpretability](interpretability.md)
