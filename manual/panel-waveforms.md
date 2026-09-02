# The waveform panel

> Four time-aligned strips show airway, alveolar and pleural pressure; transpulmonary pressure; vascular pressure; and lung volume over the same 12 seconds.

---

## How to read it

The first strip shows airway-opening pressure (Paw), alveolar pressure (Palv) and pleural pressure (Ppl) on one cmH₂O axis. During flow, the gap between Paw and Palv is the pressure spent overcoming airway resistance. Ppl is the pressure surrounding the lung and intrathoracic circulation.

The strip immediately below shows transpulmonary pressure ($P_L=P_{alv}-P_{pl}$) on its own cmH₂O axis. It is the pressure across the lung itself.

The separate $P_L$ strip is a graphical choice, not a different equation. On one shared numerical axis, positive $P_L$ would correctly appear above a near-zero Paw and a negative Ppl. Giving it a time-aligned strip below Paw and Ppl preserves the true value while keeping the visual and numerical reading order consistent.

### Why the model trace can differ from bedside dynamic $P_L$

The model knows the pressure inside its alveolar compartment and therefore displays the pressure actually acting across the lung:

$$
P_L=P_{alv}-P_{pl}
$$

At the bedside, pleural pressure is commonly approximated with oesophageal pressure and alveolar pressure cannot be measured continuously. During assisted ventilation, the dynamic quantity is therefore often plotted as:

$$
P_{L,aw}=P_{aw}-P_{es}
$$

These are not identical while gas is flowing. Paw includes the pressure needed to overcome airway resistance, whereas Palv is the pressure after that resistive drop. The bedside Paw-minus-Pes trace therefore contains both lung-distending pressure and the airway-resistive component. During a valid zero-flow pause, Paw and Palv equilibrate and the two constructions approach the same static value, apart from the fact that Pes remains a regional and imperfect surrogate for Ppl.

This distinction explains why a published dynamic Paw−Pes waveform need not have exactly the same contour or amplitude as the model's Palv−Ppl waveform. It is a difference in what is being plotted, not an alternative equation for the model state.

The third strip shows systemic arterial, pulmonary arterial and central venous pressure in mmHg. The bottom strip shows lung volume above the calculated resting reference in mL. Light vertical bands identify inspiration in all four strips, allowing events to be aligned without mentally matching different time axes.

The rail on the right mixes two kinds of readout deliberately. Paw, Palv, Ppl and $P_L$ show the current model state at the rail's readable update rate. During passive ventilation, Paw retains the calculated Pplat in parentheses as breath-level context. During PSV or spontaneous effort, the routine Pplat is omitted because an ordinary assisted breath has no passive plateau. An [end-inspiratory hold](manoeuvres.md#what-an-inspiratory-hold-shows-during-pressure-support) can still reveal a plateau if flow is zero and muscle activity relaxes; that level is read directly from the live Paw trace rather than inserted into the routine tile. The Ppl row similarly keeps the latest breath's swing in parentheses. Systemic and pulmonary systolic/diastolic pressure, CVP and tidal volume remain the slower summaries used in the numerical tiles. $P_L$ is placed in the second rail beside its own curve. The curves themselves remain continuous at the model's trace sampling rate.

During PSV, the help panel also reports trigger delay and whether the latest completed breath cycled before neural inspiration ended. **Early cycling** means Paw has returned to PEEP while inspiratory drive is still present; Ppl can therefore continue to fall during the ventilator's expiratory phase. “No early cycling detected” is deliberately narrower than “fully synchronous”: the model does not classify every form of asynchrony.

Each strip fits its vertical range again when a control or scenario changes. The preceding waveform remains visible as temporal context, but its former extremes no longer determine the scale of the new state. Within one unchanged state, the range expands if a new value would otherwise be clipped and contracts only after the signal has remained comfortably inside it. This keeps clinically important changes visible without making the axes follow every sample.

Respiratory and vascular pressures deliberately do not share an axis. Their units and magnitudes differ, and a dual axis would make visual crossings physiologically meaningless.

## Pause and inspect one instant

Press **Pause**, then drag the time cursor above the strips or drag directly across any waveform. The vertical cursor crosses all four strips on one clock. Numerical tiles and the live point in each diagram move to the model state nearest that instant, allowing Paw, Ppl, CVP, ventricular position and lung position to be read together rather than estimated by eye.

The waveform itself remains sampled at 250 Hz. The complete state needed by the other panels is retained every 50 ms, so their selected point can differ from the cursor by at most about 25 ms. This lighter presentation history does not rewind the simulator and is cleared when a scenario, patient file or reset creates a fresh simulation.

Static relations are recalculated from the parameters stored at the selected instant. A single instant cannot define an entire respiratory or cardiac loop: the cursor therefore moves the live point, but it does not invent a historical full-cycle trace.

The parameter sidebar always remains an editor for the **current** patient. It does not move back to historical settings while the cursor is inspecting an older state; the cursor time and diagram positions identify that the displayed readouts are historical.

## Useful comparisons

- In spontaneous breathing at Paw zero, watch Palv become negative during inspiration and positive during expiration. This Paw–Palv gradient explains why $P_L$ is not an exact mirror of Ppl while gas is flowing.
- In volume control, compare how Paw, Palv, Ppl and $P_L$ divide the pressure required to deliver the rising volume.
- In pressure support, look for a small fall in Ppl before Paw rises. If Ppl continues to fall after Paw returns to PEEP, open the values panel and check for early cycling.
- During an inspiratory hold in pressure support, follow the zero-flow Paw level as inspiratory activity relaxes: an initial resistive drop may precede a rise toward the passive plateau.
- With flow limitation, identify incomplete return of lung volume before the next breath and compare it with auto-PEEP.
- After changing RV load, look for the delayed left-sided arterial response over subsequent beats rather than expecting an immediate mirror image.

## In the model

Each trace contains the most recent 12 seconds sampled at 250 Hz. Palv and $P_L$ are stored on the same clock as Paw and Ppl, so every plotted point represents one internally consistent respiratory state. Vertical ranges expand immediately to prevent clipping but shrink only after the data have remained comfortably inside the current range for four simulated seconds. This stabilises visual amplitude while the physiology is steady.

The synchronised cursor uses a separate 20 Hz presentation history containing pressures, volumes, summary measurements and the state needed by the analytical panels. It is read-only and does not enter any physiological equation.

The panel shows no airflow trace. Expiratory flow limitation must be inferred from volume not returning, auto-PEEP and the EFL readout; the manifest previously described this panel as containing flow and has been corrected.

## Limits

- The traces are noise-free internal signals: no catheter resonance, damping, transducer levelling error, airway leak or monitor filtering is simulated.
- The panel does not plot flow, so PSV trigger and cycling are reported numerically rather than marked directly on a flow waveform.
- Because flow is not plotted, a flat assisted-hold pressure must not be treated as a complete bedside validity check; zero flow is imposed internally by the model.
- Arterial pressure is a central model compartment, not a peripheral waveform.
- The 12-second window can conceal slower adaptation, including the 15-second aggregate baroreflex.
- Automatic rescaling means screen height cannot be compared between widely separated states without reading the axes.
- The cursor selects the nearest retained 50 ms presentation sample; it is not intended for millisecond timing measurements.
- Absence of an airflow trace limits direct evaluation of expiratory flow contour and zero-flow holds.

## References

- Pinsky MR. Functional hemodynamic monitoring. *Crit Care Clin*. 2015;31:89–111. [doi:10.1016/j.ccc.2014.08.005](https://doi.org/10.1016/j.ccc.2014.08.005)
- Tobin MJ. *Principles and Practice of Mechanical Ventilation*. 3rd ed. McGraw-Hill; 2013.
- Mojoli F, Pozzi M, Orlando A, et al. Timing of inspiratory muscle activity detected from airway pressure and flow during pressure support ventilation: the waveform method. *Crit Care*. 2022;26:32. [doi:10.1186/s13054-022-03895-4](https://doi.org/10.1186/s13054-022-03895-4)

---

## See also

[Pleural pressure](pleural-pressure.md) · [The Campbell diagram](panel-campbell.md) · [The four effects of a breath](the-four-effects-of-a-breath.md) · [Pulmonary transit](pulmonary-transit.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Numerical tiles](numeric-tiles.md)
