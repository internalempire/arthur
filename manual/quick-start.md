# Quick start

> This ten-minute sequence introduces the model by changing one cause at a time and following its effects from pressure to flow.

---

## Before touching a control

The application opens on the settled *Healthy, breathing spontaneously* reference circulation. Spend one breath locating three signals: airway pressure in the waveforms, pleural pressure in the thorax and waveforms, and cardiac output above the monitor. Every panel follows the same patient. The Guyton diagram sits beside the traces on wide screens and follows them on a phone. Other diagrams, numerical tiles and Pin comparisons follow below. On a narrow screen, **Show parameters** opens the settings. **Close parameters** at the top of the drawer returns you to the monitor, including when you have scrolled down the controls. Escape also closes it.

## Minute 1–3: reverse the sign of inspiration

The two healthy presets describe different circulations. They differ in initial blood volume, systemic vascular resistance and RV contractility. Use the following comparison to see **which way the pressures move during inspiration**.

1. In *Healthy, breathing spontaneously*, select **Caval flow** above the traces. Let one complete breath pass, then press **Pause**. Move the **Time cursor** across the most recent inspiration, identified by rising lung volume. On the same time axis, follow pleural pressure, CVP and blood flow into the right atrium. Compare the pattern across the breath, allowing for fluctuations with each heartbeat. Press **Play** to continue.
2. Select *Healthy, passive volume control*.
3. Compare the direction of the pleural-pressure and measured-CVP swings.

During positive-pressure inflation, pleural pressure rises; during spontaneous inspiration, it falls. Measured CVP follows surrounding thoracic pressure, whereas transmural CVP more closely reflects chamber distending pressure. This shows why an atmospheric pressure reading is not the same as preload. To study **cardiac output in the same circulation**, return to *Healthy, breathing spontaneously* and press **Pin**. Note tidal volume and respiratory rate. Change only the respiratory controls: select **Volume control** (effort drops to zero), keep PEEP and rate at their starting values, and set tidal volume as close as the control allows to the observed spontaneous value. After successive breaths repeat, compare pleural pressure, caval flow and aortic output with the selected Pin. The Pin table shows exactly which settings differ. See [transmural pressure](transmural-pressure.md).

## Minute 3–6: raise PEEP

### Why can CVP rise while venous return falls?

**Why does CVP rise?** With higher PEEP, the lungs remain more inflated between breaths and push the chest wall farther out. Pleural pressure rises around the right atrium. A catheter zeroed to atmosphere reads the sum of the pressure outside the atrium and the pressure stretching its wall. Here the external pressure rises more than the catheter reading does. Subtracting the external pressure from CVP shows that the distending pressure (*transmural CVP*) has actually fallen.

**Why does less blood reach the heart?** The right atrium is the **receiving end** of the systemic veins. A higher pressure there makes it harder for venous blood to enter. Upstream, abdominal pressure increases around the systemic venous reservoir and some blood redistributes into it. Both raise pressure in the reservoir. If upstream and downstream pressures rose equally, their difference would be preserved. Here the downstream rise is larger. The pressure difference driving blood forward shrinks and, at the same resistance, less blood passes through the cava each minute.

<!-- BEGIN GENERATED: healthy-cvp-return -->
| What changes in the same patient? | PEEP 5 cmH₂O | PEEP 15 cmH₂O |
|---|---:|---:|
| Pressure distending the atrium (CVP − pressure outside the heart), mmHg | 1.1 − (-1.4) = **2.5** | 4.4 − 2.2 = **2.2** |
| Pressure driving venous return (upstream − effective downstream pressure), mmHg | 8.6 − 1.9 = **6.7** | 11.2 − 5.0 = **6.2** |
| Net blood flow entering the right atrium from the cava, L/min | **5.60** | **5.17** |

*Both states start from the same patient, with fixed blood volume and the baroreflex off. Each column is a one-minute mean after 120 simulated seconds at that PEEP. Inside and outside pressures share the atmospheric zero.*
<!-- END GENERATED: healthy-cvp-return -->

The first subtraction is **across the atrial wall**. The second is **along the path blood travels**, from the systemic venous reservoir through the abdominal vena cava to the right atrium. Its upstream term is the pressure in that reservoir (Arthur’s mean systemic filling pressure). **Effective downstream pressure** means the backpressure that returning blood must overcome. When the cava is held open and atrial pressure is well above the cava’s closing pressure, atrial pressure sets that backpressure. When atrial pressure falls well below the closing pressure, the surrounding abdomen can narrow the cava. Lowering atrial pressure further then draws little extra blood through the narrowed segment. Raising abdominal pressure can raise this closing pressure even at the same atrial pressure. Arthur makes the transition gradual as the two pressures approach each other.

In this PEEP exercise, both atrial pressure and the cava’s closing pressure rise. To see which is higher in a given patient, open **?** on **Guyton diagram** and compare **Right atrial pressure (respiratory mean)** with **Critical closing pressure (respiratory mean)**. **Gradient for venous return** gives the remaining driving pressure. Subtract that gradient from **Mean systemic filling pressure (respiratory mean)** to recover the effective downstream pressure to the precision displayed. Read **Venous inflow (respiratory mean)** for the resulting flow in L/min.

*Where does the closing pressure come from?* Open **?** on **Thoracic schematic** to find **Abdominal pressure** in cmH₂O. Arthur assumes the cava can withstand 5 cmH₂O of external compression. It subtracts this allowance from abdominal pressure and converts the result to mmHg for the Guyton diagram. The allowance is a fixed model assumption. The thoracic schematic gives a current reading and the Guyton rows above average across a breath. Arthur represents one aggregate caval pathway, so these readings cannot separate flows from the upper and lower body.

**See it on the monitor**

1. Select **Healthy, passive volume control** at PEEP 5 cmH₂O. Scroll **below the graphs** to **Numerical tiles** and expand it if closed. Find **CVP** (if hidden, choose **+** and then **CVP**). The large number is the pressure a catheter zeroed to atmosphere would read. The smaller **transmural** value underneath subtracts the pressure around the heart (pleural pressure plus any additional pericardial pressure). The CVP beside the vascular waveform is the atmospheric reading. Return to **Guyton diagram** and select **Mean**. The filled dot shows right atrial pressure horizontally and net caval inflow vertically. Open **?** for **Venous inflow (respiratory mean)** and **Gradient for venous return**.
2. Press **Pin** and raise only PEEP to **15 cmH₂O**. Watch pleural pressure rise. Select **Caval flow** to follow blood entering the atrium during each breath.
3. Once the pattern repeats, the mean dot lies **further right and lower**, showing higher pressure in the receiving chamber and less blood arriving per minute. Compare the transmural readings at similar phases of the breath. The tile smooths pressures over three seconds and the dot averages inflow over a breath, so individual screen readings can differ slightly from the minute means above.

## Minute 6–8: compare recruitment with distension

1. Select *ARDS with right ventricular failure*. Keep the preset opening profile and set PEEP to **5 cmH₂O**.
2. After settling, start **Pressure history** and record four complete breaths. Raise only PEEP to **15 cmH₂O**. Once the circulation settles again, compare end-expiratory closure and mean aortic output in the two intervals.
3. Note the readings, reselect the preset and choose **Non-reopenable**. Repeat the same 5 to 15 cmH₂O step with a new recording. Which profile loses more output relative to its own baseline? [Compare your readings with the two reference runs](scenarios.md#ards-with-right-ventricular-failure).

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
- Use **Pin** to create up to four independently evolving references. The first Pin opens **Live comparisons** above the plots. Read each state’s settings under **Reference** and the settings of the patient you control under **Current**. Select a state to see its measurements below the current tile values. Turn on **Show reference traces** to see that same reference as dashed curves in Guyton, Campbell, the ventricular loops and the pulmonary vascular plot. Each state has **Unpin**, and **Unpin all** clears the comparison. [Live comparisons](numeric-tiles.md#pin-values-for-a-comparison) explains timing and parameter differences.
- Absolute numbers are model outputs, not patient targets.

## Save and reload a custom patient

Use **Save patient** after creating a useful phenotype. The application downloads a small, readable JSON file containing the complete set of current controls and a list of those that differ from the defaults. The file remains on the local device and can be renamed, archived with a bug report or shared with another reviewer.

**Load patient** validates that file, labels the result *Custom*, starts a fresh simulation and allows it to settle. The same parameter set is therefore reproduced without carrying across the arbitrary cardiac phase, respiratory phase, pressures or compartment volumes present when Save was clicked. This distinction is intentional: the feature reproduces a patient definition and experiment, not one frozen animation frame.

The file preserves applied blood, its starting-volume reference and the resulting balance. A prepared but unsubmitted dose is not saved. Opening settings retain their full precision even when a displayed percentage is rounded. Loading a file discards any pending dose.

The application accepts version-2 files. If a file is rejected, the current patient is unchanged. Unknown settings are reported and ignored; this includes a saved `piston` value, which does not control the pulmonary circulation. A known setting outside its allowed range is rejected. Recovery of older files is an optional technical task, described in the [offline recovery instructions](https://github.com/internalempire/arthur/blob/main/tools/archive/ri/README.md); it is not needed to use Save and Load with current files.

## Limits

This sequence samples only a few mechanisms. It does not validate a clinical intervention, reproduce gas exchange or show the full physiology of ARDS, pulmonary embolism or shock. The selected control values are for a nominal adult model and are not dosing instructions.

## References

- Pinsky MR. Cardiovascular issues in respiratory care. *Chest*. 2005;128:592S–597S. [doi:10.1378/chest.128.5_suppl_2.592S](https://doi.org/10.1378/chest.128.5_suppl_2.592S)
- Teboul JL, Monnet X, Richard C. Weaning failure of cardiac origin: recent advances. *Crit Care*. 2010;14:211. [doi:10.1186/cc8852](https://doi.org/10.1186/cc8852)

---

## See also

[Home](home.md) · [Conventions](conventions.md) · [Numerical tiles](numeric-tiles.md) · [Clinical scenarios](scenarios.md) · [Global limits](global-limits.md)
