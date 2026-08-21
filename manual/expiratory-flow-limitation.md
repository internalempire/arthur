# Expiratory flow limitation

> In severe obstruction, expiratory flow can reach a ceiling that is insensitive to further reductions in downstream pressure. This airway choke explains why some applied PEEP may initially substitute for intrinsic PEEP without increasing end-expiratory volume.

---

## Physiology

Forcing air out of a normal lung faster requires only a larger pressure difference. In emphysema it does not. As expiration proceeds, the pressure inside the airway falls below the pressure surrounding it, and airways that have lost their parenchymal tethering are compressed. Beyond that point flow is set by the alveolar-to-compression-point gradient alone: lowering mouth pressure further widens the gradient downstream of a choke and changes nothing upstream of it.

Two clinical consequences follow, and they are the reason this belongs in a heart–lung model rather than a ventilator manual.

**Incomplete emptying raises end-expiratory alveolar pressure above the applied PEEP.** That is intrinsic PEEP. During positive-pressure ventilation it raises mean [pleural pressure](pleural-pressure.md), can impede venous return and contributes to the haemodynamic cost of obstruction.

**Applied PEEP below the choke may substitute rather than add.** In a flow-limited patient, raising downstream pressure below the critical level may leave expiratory flow and end-expiratory volume nearly unchanged. Above that level, applied PEEP adds to the load and can increase hyperinflation. The transition is patient-specific; it is not a universal fraction of intrinsic PEEP.

The therapeutic lever that does work is **time**. Slowing the respiratory rate lengthens expiration and lets the lung reach a lower volume.

---

## In the model

Loss of recoil (`clung`), linear airway resistance (`raw`) and available expiratory time already existed and remain separate. Flow limitation adds one binary control, `efl`.

With it on, passive expiratory flow may not exceed a volume-dependent maximal-flow envelope, expressed as a minimum emptying time constant of **4.5 s**. Ordinary resistive flow still applies whenever it is the slower of the two: the cap only ever removes flow, never adds it.

$$
\dot{V}_{exp} = \max\!\left(\dot{V}_{resistive},\ -\frac{\max(0,\ V-V_{relax,0})}{\tau_{min}}\right), \qquad \tau_{min} = 4.5\ \text{s}
$$

- $\dot{V}_{exp}$ — expiratory flow, negative outward, L/s
- $\dot{V}_{resistive}$ — the flow ordinary $R_{aw} \times C_{rs}$ mechanics would give
- $V$ — current lung volume, L
- $V_{relax,0}$ — the model's zero-PEEP relaxation reference, L
- $\tau_{min}$ — the minimum emptying time constant

This reference is not the passive equilibrium volume at the currently applied PEEP. The latter is used separately when dynamic trapped volume is reported.

**Dynamic trapped volume** is measured as actual end-expiratory lung volume minus the passive equilibrium volume at the *same* applied PEEP. Subtracting at the same PEEP is what separates breath-to-breath gas trapping from the static hyperinflation of emphysema, which is a property of the tissue and not a failure to empty.

The 4.5 s envelope is a **didactic shape coefficient**: it preserves the order of magnitude of severe obstructive emptying and produces a visible low-PEEP plateau. It is not fitted to a published critical fraction and must not be used as a bedside PEEP threshold.

### What the model shows

An obstructed phenotype at 26 breaths per minute:

<!-- BEGIN GENERATED: efl-peep -->
*Executable setup: passive volume control, VT 500 mL, 26/min, inspiratory time 0.9 s, airway resistance 24 cmH₂O·s/L, aerated-lung compliance 300 mL/cmH₂O, EFL on; each level is settled for 45 s.*

| applied PEEP (cmH₂O) | total PEEP (cmH₂O) | dynamic trapped volume (mL) | end-expiratory volume (L) | cardiac output (L/min) |
|---:|---:|---:|---:|---:|
| 0 | 11.6 | 1361 | 4.03 | 4.66 |
| 5 | 11.8 | 781 | 4.05 | 4.65 |
| 6 | 12.5 | 742 | 4.13 | 4.60 |
| 8 | 14.4 | 715 | 4.34 | 4.48 |
| 10 | 16.3 | 693 | 4.54 | 4.36 |
| 13 | 19.2 | 650 | 4.84 | 4.19 |
<!-- END GENERATED: efl-peep -->

For this phenotype, total PEEP and end-expiratory volume are essentially unchanged from applied PEEP 0 to 5 cmH₂O. The departure becomes detectable just above 5 and is clear by 8–10 cmH₂O: applied pressure is then adding to absolute lung volume rather than merely substituting for part of intrinsic pressure. Dynamic trapped volume can fall while absolute end-expiratory volume rises because it is measured above the passive equilibrium volume at the same applied PEEP.

The model does not contain a single pressure parameter called the choke pressure. Its flow envelope and ordinary resistive emptying compete at every step, so the end of the flat region is the crossover between those mechanisms in this particular experiment. Baseline total PEEP must not be read as that crossover or as a bedside PEEP target.

Without the flow cap the same phenotype behaves differently: PEEP 0 → 5 raises total PEEP from about 6.5 to 11.4 cmH₂O and end-expiratory volume from 3.41 to 3.95 L, with output falling. That is the model's response to resistive incomplete emptying without an explicit choke; it is not evidence that every non-flow-limited patient behaves that way.

Time still works. At the shipped PEEP, slowing the rate from 26 to 12 breaths per minute markedly reduces intrinsic PEEP and dynamic trapping and restores output. These are phenotype-specific model effects, not quantitative COPD targets.

---

## Why this and not something else

**One aggregate choke rather than fast and slow lung units.** A richer regional model could produce a maximal-flow envelope together with heterogeneous time constants, pendelluft and regional trapping. It was not added here: the heart–lung lesson is the *existence* of a choke and its consequence for mean intrathoracic pressure, and a second lung compartment would need its own vascular bed to be worth the state it adds. See [the equation of motion](equation-of-motion.md) for the same argument in general form.

**A flow envelope rather than a variable resistance.** Raising resistance as volume falls would slow expiration but would preserve the property that matters most — that mouth pressure still controls flow. The whole point of a choke is that it does not.

**Binary rather than graded.** A continuous severity would be more realistic and would need a second coefficient with nothing to anchor it. The control asserts a phenotype, and `clung` and `raw` already provide the graded axes.

**Why the envelope is not calibrated.** The human studies establish that PEEP below a critical fraction of intrinsic PEEP leaves volume and haemodynamics substantially unchanged, and that above it hyperinflation and circulatory cost follow. That is a *shape*, and the model reproduces it. The published critical fraction is a measurement in a small cohort under one protocol; fitting a single aggregate envelope to it would present a coincidence as a calibration.

---

## Limits

### Of the construction

- **One envelope for the whole lung.** No volume-dependent airway compression, no heterogeneous regional time constants, no airway closure, no collateral ventilation.
- **Binary.** There is no partial flow limitation and no patient-specific choke point.
- **No CO₂, no dead space, no V/Q** — so nothing about the gas-exchange consequences of trapping, which is half the clinical problem.
- **No bronchodilator, no secretions, no dynamic airway collapse during forced effort.**
- Dynamic trapped volume is a model-derived separation from the model's own static equilibrium, not a measurement of occult regional trapping.
- No inspiratory threshold load, so the model cannot show the work a spontaneously breathing patient does to overcome intrinsic PEEP before flow begins — one of the main reasons flow limitation matters in an awake patient.

### Of clinical application

- **The comparison of applied PEEP levels is valid for the passive controlled phenotype** used in the human studies, not for titrating PEEP during assisted ventilation.
- **The 4.5 s envelope is not a threshold.** Do not read the PEEP at which the plateau ends as a recommendation for a patient.
- The absolute intrinsic PEEP values are properties of this phenotype at this rate. The transferable content is the flat region and its end.
- The model cannot represent the commonest clinical reason to accept some intrinsic PEEP — the trade against dead space and CO₂ clearance — because it has neither.

---

## References

- Pepe PE, Marini JJ. Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: the auto-PEEP effect. *Am Rev Respir Dis* 1982;126:166–70.
- Tuxen DV, Lane S. The effects of ventilatory pattern on hyperinflation, airway pressures, and circulation in mechanical ventilation of patients with severe air-flow obstruction. *Am Rev Respir Dis* 1987;136:872–9.
- Ranieri VM, Giuliani R, Cinnella G, et al. Physiologic effects of positive end-expiratory pressure in patients with chronic obstructive pulmonary disease during acute ventilatory failure and controlled mechanical ventilation. *Am Rev Respir Dis* 1993;147:5–13.
- van den Berg B, Aerts JGJV, Bogaard JM. Effect of continuous positive airway pressure (CPAP) in patients with chronic obstructive pulmonary disease (COPD) depending on intrinsic PEEP levels. *Eur Respir J* 1991;4:561–7.

---

## See also

[Equation of motion](equation-of-motion.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md) · [COPD with dynamic hyperinflation](scenarios.md#copd-with-dynamic-hyperinflation) · [Numeric tiles](numeric-tiles.md) · [Controls: mechanics](controls-mechanics.md)
