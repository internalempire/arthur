# The waveform panel

> Three time-aligned strips show respiratory pressure, vascular pressure and lung volume over the same 12 seconds.

---

## How to read it

The top strip shows airway pressure (Paw) and pleural pressure (Ppl) in cmH₂O. Their separation helps distinguish pressure applied at the airway from pressure transmitted to the thorax.

The middle strip shows systemic arterial, pulmonary arterial and central venous pressure in mmHg. The bottom strip shows lung volume above the calculated resting reference in mL. Light vertical bands identify inspiration in all three strips, allowing events to be aligned without mentally matching different time axes.

Respiratory and vascular pressures deliberately do not share an axis. Their units and magnitudes differ, and a dual axis would make visual crossings physiologically meaningless.

## Useful comparisons

- In spontaneous breathing, locate the fall in Ppl and measured CVP during inspiration; then inspect transmural CVP in the tile.
- In volume control, compare the pressure response with the linear rise in volume.
- With flow limitation, identify incomplete return of lung volume before the next breath and compare it with auto-PEEP.
- After changing RV load, look for the delayed left-sided arterial response over subsequent beats rather than expecting an immediate mirror image.

## In the model

Each trace contains the most recent 12 seconds sampled at 250 Hz. Vertical ranges expand immediately to prevent clipping but shrink only after the data have remained comfortably inside the current range for four simulated seconds. This stabilises visual amplitude while the physiology is steady.

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

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Pulmonary transit](pulmonary-transit.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Numerical tiles](numeric-tiles.md)
