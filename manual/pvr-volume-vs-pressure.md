# Why PVR follows volume, not pressure

> Three independent preparations show that pulmonary vascular resistance is volume-dependent rather than pressure-dependent. The argument rests on hysteresis: if a variable causes PVR, plotting PVR against it destroys hysteresis; if it does not, hysteresis persists as an artefact of the lung's own pressure–volume hysteresis.

---

## The question

The extra-alveolar vessels are held open by radial traction from the surrounding parenchyma. Traction is a *stress*, and stress follows transpulmonary pressure. It was therefore tempting to drive the extra-alveolar limb of the [J-curve](pulmonary-vascular-resistance.md) with transpulmonary pressure rather than volume.

Three measurements disagree. They show that resistance tracks lung volume, not the pressure that produced it. The principle — traction is a stress — is correct about the mechanism. It is wrong about which variable dominates.

---

## The hysteresis argument

The lung itself has a pressure–volume curve with hysteresis: at the same transpulmonary pressure, the lung holds different volumes during inflation and deflation. Pressure and volume are therefore not in one-to-one correspondence during a cycle.

This is what makes hysteresis a diagnostic tool. Suppose PVR is caused by one of the two variables:

**If volume is the cause** — at a given volume, PVR is the same regardless of direction. Plotting PVR against volume gives a single curve (no hysteresis). Plotting PVR against pressure shows hysteresis, because the same pressure corresponds to different volumes on the way up and the way down.

**If pressure is the cause** — at a given pressure, PVR is the same regardless of direction. Plotting PVR against pressure gives a single curve (no hysteresis). Plotting PVR against volume shows hysteresis, because the same volume corresponds to different pressures.

| PVR plotted against | if volume is the cause | if pressure is the cause |
|---|---|---|
| **volume** | no hysteresis | hysteresis |
| **pressure** | hysteresis | no hysteresis |

Hysteresis against a variable is the signature that it is *not* the cause. Its absence is the signature that it is.

---

## The three measurements

### Thomas, Griffo & Roos 1961 — excised dog lung (n = 55)

Inflated excised dog lungs by lowering the pressure around them, holding vascular pressures constant and measuring under static conditions — the cleanest available isolation of the mechanical effect, with no Starling resistance and essentially no hypoxic vasoconstriction.

PVR plotted against transpulmonary pressure showed wide hysteresis between inflation and deflation. The same data plotted against volume showed none.

Their conclusion:

> *Pulmonary vascular resistance is volume-dependent rather than pressure-dependent when inflation is accomplished by lowering the pressure around the lung.*

### Hakim, Michel & Chang 1982 — arterial and venous occlusion (n = 7)

Partitioned the pressure drop with arterial and venous occlusion into three segments: arterial, middle (distensible capillary), and venous. Compared positive- and negative-pressure inflation over transpulmonary pressures 0–20 mmHg.

Two findings converge:

- **Volume-related changes are identical** under both inflation modes. If PVR followed pressure, the two modes — which generate the same transpulmonary pressure with different mechanics — should give different responses. They do not.
- **Pressure-related changes are not identical** between the two modes. These are exactly what a pressure-driven model would need to reproduce, and they are mode-dependent.

Every segment is U-shaped, not only the total. The arterial and venous segments (extra-alveolar) together fall 9.2 → 7.8 and then rise to 9.9. The middle segment (alveolar capillaries) falls 2.6 → 1.3 and rises to 4.2.

Their conclusion:

> *Inflation produces a volume-dependent increase in the resistance of both alveolar and extra-alveolar vessels.*

### Peták group 2008 — isolated perfused rat lung

Swept transpulmonary pressure from 2.5 to 22 cmH₂O — the range every ventilated patient in this simulator occupies.

- Positive-pressure inflation: +15 ± 1%
- Negative-pressure inflation: −3 ± 0.3%

The hysteresis seen against transpulmonary pressure disappears when the same data are plotted against volume. This is the third independent statement that volume is the causal variable.

---

## Why a correct principle gave the wrong answer

The argument for driving the extra-alveolar limb with transpulmonary pressure was:

> *Radial traction is a stress, not a volume, so it should follow a pressure.*

The reasoning is sound about the mechanism: traction is indeed a stress, and stress is linked to transpulmonary pressure. But the measurements say that, at equal pressure, the volume (which pressure does not uniquely determine) explains the resistance. A principle that is correct about a mechanism can still be wrong about which variable dominates — perhaps because traction is mediated by parenchymal geometry, which tracks volume more directly than pressure, or because other volume-dependent mechanisms (capillary recruitment, distension) outweigh the pure traction contribution.

---

## What this means for the model

Both limbs of the J-curve are now driven by strain — volume per open unit — not by transpulmonary pressure. The change moved seven rows in [`LITERATURE_RANGES.md`](../docs/LITERATURE_RANGES.md) from `not yet` to `agrees`, including every row anchored to Thomas, Hakim and Peták.

The alveolar limb (exponential rise with stretch) is qualitatively consistent with the measurements. The extra-alveolar limb has a known residual discrepancy: Hakim shows it should turn upward at high volume, while the model gives it a floor and no return. See [pulmonary vascular resistance](pulmonary-vascular-resistance.md) for that limit.

---

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [PVR nadir at FRC](pvr-nadir-at-frc.md) · [Transmural pressure](transmural-pressure.md) · [The two-population lung](two-population-lung.md) · [Vascular waterfalls](vascular-waterfalls.md)

---

## References

- Thomas LJ, Griffo ZJ, Roos A. Effect of negative pressure inflation of the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–6. [doi:10.1152/jappl.1961.16.3.451](https://doi.org/10.1152/jappl.1961.16.3.451)
- Hakim TS, Michel RP, Chang HK. Partitioning of pulmonary vascular resistance in dogs by arterial and venous occlusion. *J Appl Physiol* 1982;52:710–5. [doi:10.1152/jappl.1982.52.3.710](https://doi.org/10.1152/jappl.1982.52.3.710)
- Peták F, et al. Pulmonary vascular response to lung inflation: the effect of lung volume history. *Respir Physiol Neurobiol* 2008.
