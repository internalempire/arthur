# Quick start

> This ten-minute sequence introduces the model by changing one cause at a time and following its effects from pressure to flow.

---

## Before touching a control

The application opens on the settled *Healthy, breathing spontaneously* reference circulation. Spend one breath locating three signals: airway pressure in the waveforms, pleural pressure in the thorax and waveforms, and cardiac output in the numerical tiles. The panels show one shared simulation, not independent demonstrations.

## Minute 1–3: reverse the sign of inspiration

1. In *Healthy, breathing spontaneously*, watch pleural pressure, CVP and the Guyton operating point during inspiration.
2. Select *Healthy, passive volume control*.
3. Compare the direction of the pleural-pressure and measured-CVP swings.

During positive-pressure inflation, pleural pressure rises; during spontaneous inspiration, it falls. Measured CVP follows surrounding thoracic pressure, whereas transmural CVP more closely reflects chamber distending pressure. This shows why an atmospheric pressure reading is not the same as preload. Compare the direction within each breath here: the two presets also differ in blood volume, systemic resistance and RV contractility, so their settled outputs do not isolate the effect of ventilation. See [transmural pressure](transmural-pressure.md).

## Minute 3–6: raise PEEP

1. Return to *Healthy, passive volume control*.
2. Press **Pin** to retain an independently evolving reference, then increase PEEP from 5 to 12 cmH₂O.
3. Watch the first response, then wait until successive breaths repeat a similar pattern. Several breaths are a starting observation period, not a guarantee of equilibrium.
4. Follow pleural pressure, measured and transmural CVP, Pmsf, the venous-return gradient, PVR and output.

PEEP does several things at once. It raises the pressure around the right atrium, changes abdominal pressure and, depending on the abdominal load, can alter resistance to venous return, moves the lung along the PVR–volume relation and changes LV transmural afterload. [The four effects of a breath](the-four-effects-of-a-breath.md) separates these pathways.

Do not expect one universal direction for cardiac output. The point of the experiment is to identify which mechanism dominates in this selected circulation.

## Minute 6–8: compare recruitment with distension

1. Select *ARDS with right ventricular failure*.
2. Note compromised fraction, opening profile, closed fraction at end expiration, opening excursion, plateau pressure, both the internal PVR coefficient and derived PVR with its quality badge, and RV:LV volume ratio.
3. Raise PEEP gradually.
4. Return to the preset, select the Non-reopenable opening profile, and repeat the same PEEP change.

With recruitable lung, some added pressure opens units and distributes inflation across a larger aerated volume. Without recruitment, more of the pressure distends the already open lung. Compare both lungs at the same PEEP as well as each lung before and after the step. A recruitable lung can have a lower RV cost than a non-reopenable lung at high PEEP while its own output still falls after the increase. This distinction prevents “less harmful” from becoming “improved output”. The comparison demonstrates why equal PEEP is not equal lung stress or equal RV load. See [lung opening profiles](recruitment-and-ri.md) and [pulmonary vascular resistance](pulmonary-vascular-resistance.md).

## Minute 8–10: inspect a ventricular response

1. Select *Acute pulmonary embolism*.
2. Inspect mPAP, the [wedge surrogate](pulmonary-artery-wedge-pressure.md), derived PVR and its quality badge, RV:LV volume ratio, the thoracic septum and the RV pressure–volume loop.
3. For a passive positive-pressure comparison, select **Volume control** and set **Inspiratory effort** to zero. Let that state settle, press **Pin**, then raise PEEP by a small amount and follow the response.

This preset combines high aggregate pulmonary vascular load with a vulnerable right ventricle. The displayed change is not an intubation-risk prediction; it is a way to see how increased RV load can enlarge the RV, reduce left-sided filling through serial coupling and shift the septum. See [the right ventricle](the-right-ventricle.md).

## Reading rules that prevent common mistakes

- Compare a state with itself after one controlled change; do not compare unrelated presets as though they were cohorts.
- Read trends over several breaths. Pulmonary storage buffers and spreads the response to changing RV output; [pulmonary transit](pulmonary-transit.md) is not a strict delay before every LV response.
- A tile marked *caution* remains visible but has a known confounder. A value marked *unavailable* is intentionally withheld.
- A small warning on a diagram qualifies the named derived interpretation, not every construction in that panel. For example, **Derived PVR: use with caution** does not invalidate the mechanical PVR–volume curve.
- Controls with a coloured dot differ from the model's neutral reference parameter set. The mark explains how the present phenotype was constructed; it does not label that setting abnormal or unsafe.
- Reselect the named preset before starting a new baseline. **Reset** restarts the current prescription; in *Custom* it keeps your settings and applied blood. It also clears occlusion points from the Guyton panel.
- Use Play/Pause and the waveform time cursor to inspect a frame; pausing does not create a physiological hold.
- Use **Pin** to create up to four independently evolving references. Select a row below the tiles to show that state beneath the current values; each row has **Unpin**, and **Unpin all** clears the comparison. [Live comparisons](numeric-tiles.md#pin-values-for-a-comparison) explains timing and parameter differences.
- Absolute numbers are model outputs, not patient targets.

## Save and reload a custom patient

Use **Save patient** after creating a useful phenotype. The application downloads a small, readable JSON file containing the complete set of current controls and a list of those that differ from the defaults. The file remains on the local device and can be renamed, archived with a bug report or shared with another reviewer.

**Load patient** validates that file, labels the result *Custom*, starts a fresh simulation and allows it to settle. The same parameter set is therefore reproduced without carrying across the arbitrary cardiac phase, respiratory phase, pressures or compartment volumes present when Save was clicked. This distinction is intentional: the feature reproduces a patient definition and experiment, not one frozen animation frame.

The file preserves applied blood, its starting-volume reference and the resulting balance. A prepared but unsubmitted dose is not saved. Opening settings retain their full precision even when a displayed percentage is rounded. Loading a file discards any pending dose.

The application accepts version-2 files. If a file is rejected, the current patient is unchanged. Unknown settings are reported and ignored; a known setting outside its allowed range is rejected. Recovery of older files is an optional technical task, described in the [offline recovery instructions](https://github.com/internalempire/arthur/blob/main/tools/archive/ri/README.md); it is not needed to use Save and Load with current files.

## Limits

This sequence samples only a few mechanisms. It does not validate a clinical intervention, reproduce gas exchange or show the full physiology of ARDS, pulmonary embolism or shock. The selected control values are for a nominal adult model and are not dosing instructions.

## References

- Pinsky MR. Cardiovascular issues in respiratory care. *Chest*. 2005;128:592S–597S. [doi:10.1378/chest.128.5_suppl_2.592S](https://doi.org/10.1378/chest.128.5_suppl_2.592S)
- Teboul JL, Monnet X, Richard C. Weaning failure of cardiac origin: recent advances. *Crit Care*. 2010;14:211. [doi:10.1186/cc8852](https://doi.org/10.1186/cc8852)

---

## See also

[Home](home.md) · [Conventions](conventions.md) · [Numerical tiles](numeric-tiles.md) · [Clinical scenarios](scenarios.md) · [Global limits](global-limits.md)
