# Why the PVR nadir is at FRC

> The minimum of the pulmonary vascular resistance–volume curve sits at functional residual capacity by construction, not by measurement. This page records why that decision was made, what it replaced, and what it means for anyone teaching from the J-curve.

---

## What the nadir is

The J-curve of [pulmonary vascular resistance](pulmonary-vascular-resistance.md) has a minimum: the lung volume at which the total resistance of the open vascular bed is lowest. Above it, alveolar compression dominates; below it, loss of radial traction narrows the extra-alveolar vessels. The position of that minimum determines where a given patient sits on the curve — on the shallow bottom, or on a steep limb.

---

## What was there before: 2.87 L, following animal measurements

The first version placed the nadir at 2.87 L — approximately 48% of a fixed 6 L maximal capacity. This followed primary measurements in excised and isolated animal lungs:

- Thomas 1961 (n = 55, excised dog lung): nadir at 45–60% of maximal volume.
- Simmons 1961 and isolated-lung work: the minimum resistance fell near half of total lung capacity.

The tests guarding this position asked only that resistance be "at least 1.5× the nadir" at two volumes — a bound with no source, sitting under a citation. A model wrong by an order of magnitude in effect size could satisfy a row that asked only for a direction.

---

## The problem: ARDS PVR was far outside human measurements

When the model was calibrated against human in-vivo catheter data (Cappio Borlino et al. 2024), the ARDS phenotype produced approximately **10–16 Wood units**. The published cohort interquartile ranges spanned roughly **1.5–4.75 WU**.

An order of magnitude of excess. Three causes were identified, and all three were corrected in the same revision.

### Cause 1 — Division by the open fraction

The equation said closed units remained perfused, but divided resistance by the open fraction — silently removing their vascular pathway rather than making it narrow. With 42% of the lung collapsed, this multiplied resistance by 1/0.58 ≈ 1.72.

### Cause 2 — HPV applied to the whole lung

Hypoxic vasoconstriction should raise resistance only in the derecruited pathway. Instead it was applied to the entire pulmonary bed. With the ARDS preset's `hpv = 1.6`, this multiplied everything by approximately 2.76.

### Cause 3 — The nadir above FRC

With the nadir at 2.87 L, an ARDS lung resting at ~1.3 L sat on the steep left limb of the J-curve, where the quadratic traction-loss term and the exponential extra-alveolar rise compounded the other two faults. At that volume, the extra-alveolar component alone was approximately 1.8× its value at the nadir.

### The compounded effect

| factor | multiplier |
|---|---|
| Strain negative (nadir at 2.87 L, lung at ~1.3 L) | ~1.8× |
| Division by open fraction (φ = 0.58) | ×1.72 |
| HPV on whole lung (hpv = 1.6) | ×2.76 |
| **Combined** | **~8.5× the nadir** |

This is how the model reached 10–16 WU against a human range of 1.5–4.75.

---

## The decision: move the nadir to FRC

The revision of 2026-08-11 placed the fully open mechanical minimum near the model's human FRC (2.25 L against a nominal 2.2 L). The reasoning had three strands:

### Clinical schematics place the minimum at FRC

The contemporary clinical review the model follows — Cecconi, Collino & Pinsky 2026, Fig. 1C — draws the minimum at or near functional residual capacity. The animal nadir at 45–60% of maximal volume sits above FRC, where no human teaching diagram puts it.

### The animal nadir produced inhuman values

With the nadir at 2.87 L, even after the structural faults were identified, an ARDS lung resting below 1.5 L would remain on the steep left limb. The model was reproducing an animal figure precisely while being far outside every available human in-vivo measurement.

### The faults could not be decomposed

Because the structural faults and the nadir position were corrected in the same revision, it was not separately established how much of the 10–16 WU each was responsible for:

> *Because those faults were fixed in the same revision, it was not separately established how much of the 10–16 WU the nadir position was responsible for.*

The decision was therefore: correct the structural faults, and place the nadir where the clinical synthesis puts it — at FRC — rather than where the excised-animal measurements put it.

---

## How it is implemented

The nadir is not fitted to FRC. It is constructed there. The extra-alveolar decay constant is derived, not chosen:

$$
K_{\text{unfurl}} = \frac{f_a \cdot k_{\text{stretch}}}{f_e \cdot (1 - c)} = \frac{0.5 \times 0.58}{0.5 \times 0.70} = 0.829
$$

This formula imposes that the derivative of total resistance with respect to strain is zero at zero strain — i.e. the minimum sits exactly at the volume the fully open tissue holds at resting recoil (2.25 L). The quadratic low-volume traction term is zero in both value and slope at that point, so it steepens the left limb without moving the minimum.

---

## What this means

The model **cannot** be used to ask where the nadir belongs. That question is settled by assumption before the simulation starts. The animal measurements (Thomas, Hakim, Simmons) are retained as qualitative support for volume dependence and for the opposing limbs; their exact nadir position and maximal-inflation ratios are no longer executable human targets.

Anyone teaching from the J-curve figure should state this explicitly: the minimum is at FRC by construction, not because the model independently discovered it there. The defensible result is the shape — both limbs rise away from a minimum near the resting volume — not the exact position of that minimum.

---

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Why PVR follows volume](pvr-volume-vs-pressure.md) · [The two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md) · [Interpretability](interpretability.md)

---

## References

- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS. *Intensive Care Med* 2026. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3) — Fig. 1C is the clinical two-limb synthesis this page follows.
- Thomas LJ, Griffo ZJ, Roos A. Effect of negative pressure inflation of the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–6. [doi:10.1152/jappl.1961.16.3.451](https://doi.org/10.1152/jappl.1961.16.3.451) — excised dog lungs; nadir at 45–60% of maximal volume. Retained as qualitative support, no longer an executable target.
- Hakim TS, Michel RP, Chang HK. Partitioning of pulmonary vascular resistance in dogs by arterial and venous occlusion. *J Appl Physiol* 1982;52:710–5. [doi:10.1152/jappl.1982.52.3.710](https://doi.org/10.1152/jappl.1982.52.3.710)
- Cappio Borlino S, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med* 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC) — the human in-vivo cohort whose IQRs the ARDS PVR is now calibrated against.
