# The waveform panel

> Four time-aligned strips show airway and pleural pressure, transpulmonary pressure, vascular pressure and lung volume over the same 12 seconds.

---

## How to read it

The first strip shows airway pressure (Paw) and pleural pressure (Ppl) in cmH₂O. The strip immediately below shows transpulmonary pressure ($P_L=P_{alv}-P_{pl}$) on its own cmH₂O axis. Ppl is the pressure surrounding the lung and intrathoracic circulation; $P_L$ is the pressure across the lung itself.

The separate $P_L$ strip is a graphical choice, not a different equation. On one shared numerical axis, positive $P_L$ would correctly appear above a near-zero Paw and a negative Ppl. Giving it a time-aligned strip below Paw and Ppl preserves the true value while keeping the visual and numerical reading order consistent.

The third strip shows systemic arterial, pulmonary arterial and central venous pressure in mmHg. The bottom strip shows lung volume above the calculated resting reference in mL. Light vertical bands identify inspiration in all four strips, allowing events to be aligned without mentally matching different time axes.

The rail on the right mixes two kinds of readout deliberately. Plateau pressure, systemic and pulmonary systolic/diastolic pressure, CVP and tidal volume remain the slower summaries used in the numerical tiles. Ppl and $P_L$ show the current model state at the rail's readable update rate. The Ppl row also keeps the latest breath's swing in parentheses. $P_L$ is placed in the second rail beside its own curve. The curves themselves remain continuous at the model's trace sampling rate.

Respiratory and vascular pressures deliberately do not share an axis. Their units and magnitudes differ, and a dual axis would make visual crossings physiologically meaningless.

## Useful comparisons

- In spontaneous breathing, locate the fall in Ppl and measured CVP during inspiration; compare it with the rise in $P_L$, then inspect transmural CVP in the tile.
- In volume control, compare how Paw, Ppl and $P_L$ divide the pressure required to deliver the rising volume.
- With flow limitation, identify incomplete return of lung volume before the next breath and compare it with auto-PEEP.
- After changing RV load, look for the delayed left-sided arterial response over subsequent beats rather than expecting an immediate mirror image.

## In the model

Each trace contains the most recent 12 seconds sampled at 250 Hz. $P_L$ is stored on the same clock as Paw and Ppl, so every plotted point represents one internally consistent respiratory state. Vertical ranges expand immediately to prevent clipping but shrink only after the data have remained comfortably inside the current range for four simulated seconds. This stabilises visual amplitude while the physiology is steady.

The panel shows no airflow trace. Expiratory flow limitation must be inferred from volume not returning, auto-PEEP and the EFL readout; the manifest previously described this panel as containing flow and has been corrected.

## Limits

- The traces are noise-free internal signals: no catheter resonance, damping, transducer levelling error, airway leak or monitor filtering is simulated.
- Arterial pressure is a central model compartment, not a peripheral waveform.
- The 12-second window can conceal slower adaptation, including the 15-second aggregate baroreflex.
- Automatic rescaling means screen height cannot be compared between widely separated states without reading the axes.
- Absence of an airflow trace limits direct evaluation of expiratory flow contour and zero-flow holds.

## References

- Pinsky MR. Functional hemodynamic monitoring. *Crit Care Clin*. 2015;31:89–111. [doi:10.1016/j.ccc.2014.08.005](https://doi.org/10.1016/j.ccc.2014.08.005)
- Tobin MJ. *Principles and Practice of Mechanical Ventilation*. 3rd ed. McGraw-Hill; 2013.

---

## See also

[Pleural pressure](pleural-pressure.md) · [The Campbell diagram](panel-campbell.md) · [The four effects of a breath](the-four-effects-of-a-breath.md) · [Pulmonary transit](pulmonary-transit.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Numerical tiles](numeric-tiles.md)
