# The two-population lung

> The lung is one volume containing two kinds of unit: normal ones that open at almost any distending pressure, and diseased ones that open only above a threshold and only if they are openable at all. Strain is volume per **open** unit, which is what makes the baby lung arithmetic rather than a metaphor.

---

## Physiology

An injured lung is not uniformly stiff. It contains aerated tissue alongside collapsed or consolidated regions, and the specific compliance of the aerated fraction may be closer to normal than whole-lung compliance suggests. The aerated part receives the tidal volume, so its strain rises as the available **baby lung** becomes smaller. The exact proportionality depends on regional volume and tissue mechanics; the one-third example becomes exactly threefold only in the model's equal-unit idealisation.

The distinction that matters clinically is between collapsed and consolidated. Collapsed units can be reopened by pressure; consolidated ones cannot, at any pressure. Two patients with identical compliance, identical plateau pressure and identical CT-measured non-aerated volume can therefore respond to PEEP in opposite directions. This is [recruitability](recruitment-and-ri.md), and it is a property that a single-compartment description has no way to hold.

Units also do not all open at one pressure. They open along a distribution, which is why recruitment is progressive rather than a step, and why a recruitment manoeuvre has a dose.

---

## In the model

One volume, two populations of units sharing it.

**Normal units** — a fraction $1 - d$ of the lung — open along a narrow logistic centred near zero transpulmonary pressure. They are shut only at frankly negative distending pressure and reopen almost as soon as there is any.

**Diseased units** — a fraction $d$, the `collapsed` control — are split again. Only a fraction of them is *openable*; the rest never opens at any pressure and stands for consolidation. The openable ones follow a logistic centred on the `pOpen` control.

$$
\varphi(P_l) = (1-d)\,\sigma\!\left(\frac{P_l - 0}{1.3}\right) + d\,\omega\,\sigma\!\left(\frac{P_l - P_{open}}{2}\right)
$$

This is the equilibrium relation used when hysteresis is off. With [recruitment hysteresis](hysteresis.md) enabled, only the collapsed but recruitable contribution retains memory; the already-aerated contribution continues to follow the current pressure. Their sum remains the total open fraction used elsewhere in the model.

- $\varphi$ — open fraction of the lung, clamped to the range 0.05 to 1
- $\sigma(x) = 1/(1+e^{-x})$ — the logistic
- $d$ — the `collapsed` control, the diseased fraction
- $\omega$ — the openable share of the diseased compartment, **not** a user control; it is solved from the requested [R/I ratio](recruitment-and-ri.md)
- $P_l$ — transpulmonary pressure, cmH₂O
- $P_{open}$ — the `pOpen` control, cmH₂O
- 1.3 and 2 cmH₂O — the widths of the two distributions

The 2 cmH₂O width of the diseased distribution is a **didactic shape coefficient**. It was narrowed from 7: the broader curve made even a completely openable ARDS compartment produce an R/I below 0.15 during the standard manoeuvre, outside the human range the control is named after.

### The sponge idealisation

A unit is open at full size or shut. There is no partially inflated unit. All the graded behaviour comes from *how many* units are open, not from units being half-open. This is the standard sponge model, and it is what makes the arithmetic below exact rather than approximate.

### Strain

Volume per open unit, referenced to what this patient's aerated tissue would hold at resting recoil:

$$
\varepsilon = \frac{V}{V_{\text{unit}} \cdot \varphi} - 1
$$

- $\varepsilon$ — strain, dimensionless; zero at resting recoil
- $V$ — absolute lung volume, L
- $V_{\text{unit}}$ — volume one completely open lung's worth of this patient's aerated tissue holds at 5 cmH₂O; it depends on both aerated-lung compliance and maximum capacity
- $\varphi$ — open fraction

Two things follow. Total lung volume alone says nothing about distension: a stiff lung holding 1.6 L can be distended while a normal lung holding 1.6 L is under-inflated. And strain drives the [pulmonary vascular resistance](pulmonary-vascular-resistance.md) limbs, so opening lung reduces vascular load through this term as well as by adding pathway.

### Collapse is measured against a normal lung

The `collapsed` control is a fraction of a **normal** lung, not of the patient's own resting volume. A patient sitting at 1.35 L is not a small normal lung; they are a normal lung with a third of it shut. Anchoring collapse to the patient's own volume would make the control self-referential and unable to express that distinction.

---

## Why this and not something else

**Two populations, not two compartments.** A two-compartment lung — two volumes, two compliances, two resistances, gas moving between them — would give pendelluft and regional time constants. It would also need two vascular beds to be worth having in a heart–lung model, and would double the state to be conserved. Two *populations of units sharing one volume* costs one extra state variable and delivers the thing that was actually missing: recruitability.

**Why the split was needed at all.** An earlier claim in this project was that a one-compartment lung could not express recruitability. That was wrong in an instructive way: recruitability had no representation not because one compartment forbade it, but because resting volume was a *control* (`frc`) and recruitment was therefore something that could only be recorded, never produced. Removing `frc` and making resting volume an outcome is what made recruitment mechanical. The population split is what made it *selective*.

**The openable share is not a control.** It would be easy to expose "what fraction of the collapsed lung can open" as a slider. It is hidden because it is an internal coefficient, and the quantity a clinician measures is R/I. Presenting a latent fraction and a bedside index as interchangeable patient inputs would be exactly the category error the model's [interpretability](interpretability.md) rules exist to prevent.

---

## Limits

### Of the construction

- **Units are open or shut.** No partial inflation, no distension of individual units, no distinction between an open unit at low and high volume other than through the shared tissue curve.
- **No spatial arrangement.** No dependent and non-dependent regions, no gravitational gradient, no anatomical distribution of collapse. "Collapsed" is a number, not a place.
- **No pendelluft and no regional time constants**, because there is only one volume.
- **The open fraction is floored at 0.05**, a numerical guard rather than a physiological statement.
- Consolidation is represented only as tissue that never opens. It has no separate compliance, weight or perfusion.
- The two distribution widths are chosen, not measured.
- **Aerated compliance, maximum capacity and collapse are independent controls.** `clung` changes the local tissue slope, `lungCapacity` changes the completely open ceiling, and `collapsed` changes the share currently available. They can coexist in a phenotype, but none silently substitutes for another.

### Of clinical application

- **`collapsed` is not a CT non-aerated fraction.** It behaves like one for teaching, but nothing calibrates it against imaging.
- **The model cannot tell you whether a patient's non-aerated lung is collapsed or consolidated.** That is the input, not the output — which is precisely the clinical difficulty the page exists to make visible.
- Strain here is computed against the model's own reference volume. It is not the strain measured by the published methods, which reference end-expiratory lung volume obtained by gas dilution.

---

## References

- Gattinoni L, Pesenti A. The concept of "baby lung". *Intensive Care Med* 2005;31:776–84.
- Gattinoni L, Caironi P, Cressoni M, et al. Lung recruitment in patients with the acute respiratory distress syndrome. *N Engl J Med* 2006;354:1775–86.
- Crotti S, Mascheroni D, Caironi P, et al. Recruitment and derecruitment during acute respiratory failure: a clinical study. *Am J Respir Crit Care Med* 2001;164:131–40.
- Cressoni M, Cadringher P, Chiurazzi C, et al. Lung inhomogeneity in patients with acute respiratory distress syndrome. *Am J Respir Crit Care Med* 2014;189:149–58.
- Chiumello D, Carlesso E, Cadringher P, et al. Lung stress and strain during mechanical ventilation for ARDS. *Am J Respir Crit Care Med* 2008;178:346–55.

---

## See also

[Pressure–volume curve](pressure-volume-curve.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Hysteresis](hysteresis.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Stress index](stress-index.md) · [Interpretability](interpretability.md) · [Controls: mechanics](controls-mechanics.md)
