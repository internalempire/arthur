# The two-population lung

> Gas can enter more lung because additional units open, because already open units expand, or both. Arthur represents these two contributions separately, using one shared gas volume and two populations with different opening behaviour.

---

## Physiology

An injured lung is not uniformly stiff. It contains aerated tissue alongside collapsed or consolidated regions, and the specific compliance of the aerated fraction may be closer to normal than whole-lung compliance suggests. The aerated part receives the tidal volume, so its strain rises as the available **baby lung** becomes smaller. The exact proportionality depends on regional volume and tissue mechanics. For a fixed tidal volume, gas displacement per participating unit rises as the open fraction falls; that does not make the model's reference-based strain interchangeable with clinical tidal strain.

Non-aerated lung is not necessarily reopenable within the pressures and duration of a given manoeuvre. Collapse, flooding and consolidation can coexist, and CT density alone does not identify a universal opening threshold. In the CT study by Gattinoni and colleagues, recruitment was the change in aerated tissue between specified airway-pressure holds, not a declaration that tissue could or could not open at any conceivable pressure. Two lungs with similar global compliance can therefore respond differently to PEEP. Arthur simplifies this distinction into potentially reopenable and permanently closed shares of a compromised component; this is a modelling assumption, not a histological diagnosis. See [opening profiles](recruitment-and-ri.md).

Units also do not all open at one pressure. They open along a distribution, which is why recruitment is progressive rather than a step, and why a recruitment manoeuvre has a dose.

---

## In the model

One volume, two populations of units sharing it.

**Normal units** — a fraction $1 - d$ of the lung — open along a narrow logistic centred near zero transpulmonary pressure. Their open fraction changes smoothly around zero transpulmonary pressure: half of the normal population is open at zero in this teaching relation, and most is open at ordinary positive recoil. It is not an abrupt zero-pressure switch.

**Diseased units** — a fraction $d$, the Compromised lung control (`collapsed`) — are split again. Only a fraction of them is *openable*; the rest is assigned no opening pathway within the model. This is a fixed non-reopenable share, not a diagnosis of consolidation. The openable ones follow a logistic centred on the `pOpen` control.

$$
\varphi(P_l) = (1-d)\,\sigma\!\left(\frac{P_l - 0}{1.3}\right) + d\,\omega\,\sigma\!\left(\frac{P_l - P_{open}}{0.75}\right)
$$

This is the equilibrium relation used when hysteresis is off. With [recruitment hysteresis](hysteresis.md) enabled, only the collapsed but recruitable contribution retains memory; the already-aerated contribution continues to follow the current pressure. Their sum remains the total open fraction used elsewhere in the model.

- $\varphi$ — open fraction of the lung, clamped to the range 0.05 to 1
- $\sigma(x) = 1/(1+e^{-x})$ — the logistic
- $d$ — the `collapsed` control, the diseased fraction
- $\omega$ — the openable share of the diseased compartment, selected through an [opening profile or advanced setting](recruitment-and-ri.md); it stays fixed during chest-wall interventions
- $P_l$ — transpulmonary pressure, cmH₂O
- $P_{open}$ — the `pOpen` control, cmH₂O
- 1.3 and <!-- CONSISTENCY: diseased-recruitment-width -->0.75 cmH₂O<!-- /CONSISTENCY --> — the widths of the two distributions

The 0.75 cmH₂O width of the diseased distribution is a **didactic shape coefficient**, not an anatomical estimate of alveolar opening-pressure variance. Grouped cohort ranges provide only an indirect constraint on its scale. They do not validate the anatomical percentages or the finite-breath recruitment response; see [the scope of opening quantities](recruitment-and-ri.md#scope-of-the-quantities).

### Opening and distension both add gas volume

The model separates **whether a unit participates** from **how much gas an open unit holds**. Participation is represented by the open fraction. Once open, units expand along the shared aerated-tissue pressure–volume relation; they are not fixed-size boxes.

Consequently, more gas at the same pressure can reflect more open units, while more gas in the same open fraction represents distension. During a breath, both can occur together. The model assumes equal tissue mechanics for participating units and does not track individual alveoli, regional shapes or gas movement between regions.

### Strain

Volume per open unit, referenced to what this patient's aerated tissue would hold at resting recoil:

$$
\varepsilon = \frac{V}{V_{\text{unit}} \cdot \varphi} - 1
$$

- $\varepsilon$ — strain, dimensionless; zero at resting recoil
- $V$ — absolute lung volume, L
- $V_{\text{unit}}$ — volume one completely open lung's worth of this patient's aerated tissue holds at 5 cmH₂O; it depends on both aerated-lung compliance and maximum capacity
- $\varphi$ — open fraction

Two things follow. Total lung volume alone says nothing about distension: a stiff lung holding 1.6 L can be distended while a normal lung holding 1.6 L is under-inflated. Strain also drives the [pulmonary vascular resistance](pulmonary-vascular-resistance.md) limbs. Opening therefore changes both inflation-related loading and the mixture of vascular pathways. Because the strain relation has two limbs, the net resistance change must be read from the combined result rather than assumed from opening alone.

### The denominator is the whole model lung

**Compromised lung** describes a share of the whole model lung, whose maximum capacity is selected independently. It is not a fraction of its current gas volume. A low end-expiratory gas volume alone cannot tell you whether the lung is small, stiff, compressed by the chest wall or partly closed. Read the capacity, compliance and opening controls separately before interpreting that volume.

---

## Why this and not something else

**Two populations, not two compartments.** A two-compartment lung — two volumes, two compliances, two resistances, gas moving between them — would give pendelluft and regional time constants. It would also need two vascular beds to be worth having in a heart–lung model, and would double the state to be conserved. Two *populations of units sharing one volume* represent selective recruitability without regional gas exchange or separate regional blood volumes.

**Selective recruitment.** Resting volume is an outcome of lung and chest-wall mechanics. Opening additional units therefore changes the volume that the lung holds at a given pressure. The population split confines recruitability to the diseased fraction while preserving the separate mechanics of already-aerated tissue.

**The openable share is an explicit internal coefficient.** A profile selects it, and the advanced settings permit a custom value. It is identified as model potential, distinct from a bedside R/I, from imaging and from the actual closed fraction at a given pressure.

---

## Limits

### Of the construction

- **Opening is aggregate; distension follows one shared tissue curve.** Individual alveolar geometry, differing regional compliances and partial aeration within a unit are not resolved.
- **No spatial arrangement.** No dependent and non-dependent regions, no gravitational gradient, no anatomical distribution of collapse. "Collapsed" is a number, not a place.
- **No pendelluft and no regional time constants**, because there is only one volume.
- **The open fraction is floored at 0.05**, a numerical guard rather than a physiological statement.
- Consolidation is represented only as tissue that never opens. It has no separate compliance, weight or perfusion.
- The two distribution widths are chosen, not measured.
- **Aerated compliance, maximum capacity and collapse are independent controls.** `clung` changes the local tissue slope, `lungCapacity` changes the completely open ceiling, and `collapsed` changes the size of the compromised component. They can coexist in a phenotype, but none silently substitutes for another.

### Of clinical application

- **Compromised lung is not a CT non-aerated fraction.** CT tissue fractions and model participating-unit fractions have different definitions and denominators; they are not interchangeable.
- **The model cannot tell you whether a patient's non-aerated lung is collapsed or consolidated.** That is the input, not the output — which is precisely the clinical difficulty the page exists to make visible.
- Strain here is computed against the model's own open-tissue reference at 5 cmH₂O transpulmonary pressure. Published strain measurements depend on the chosen gas-volume reference and manoeuvre; this internal index is not a gas-dilution measurement or an injury threshold.

---

## References

- Gattinoni L, Pesenti A. The concept of "baby lung". *Intensive Care Med* 2005;31:776–84. [doi:10.1007/s00134-005-2627-z](https://doi.org/10.1007/s00134-005-2627-z)
- Gattinoni L, Caironi P, Cressoni M, et al. Lung recruitment in patients with the acute respiratory distress syndrome. *N Engl J Med* 2006;354:1775–86. [doi:10.1056/NEJMoa052052](https://doi.org/10.1056/NEJMoa052052)
- Crotti S, Mascheroni D, Caironi P, et al. Recruitment and derecruitment during acute respiratory failure: a clinical study. *Am J Respir Crit Care Med* 2001;164:131–40. [doi:10.1164/ajrccm.164.1.2007011](https://doi.org/10.1164/ajrccm.164.1.2007011)
- Cressoni M, Cadringher P, Chiurazzi C, et al. Lung inhomogeneity in patients with acute respiratory distress syndrome. *Am J Respir Crit Care Med* 2014;189:149–58. [doi:10.1164/rccm.201308-1567OC](https://doi.org/10.1164/rccm.201308-1567OC)
- Chiumello D, Carlesso E, Cadringher P, et al. Lung stress and strain during mechanical ventilation for ARDS. *Am J Respir Crit Care Med* 2008;178:346–55. [doi:10.1164/rccm.200710-1589OC](https://doi.org/10.1164/rccm.200710-1589OC)

---

## See also

[Pressure–volume curve](pressure-volume-curve.md) · [Lung opening profiles](recruitment-and-ri.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Stress index](stress-index.md) · [Interpretability](interpretability.md) · [Controls: mechanics](controls-mechanics.md)
