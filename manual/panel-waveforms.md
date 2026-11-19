# The waveform panel

> Follow pressures, lung volume and selected air and blood flows over the same 12 seconds. Open **Pressure history** to follow one patient across a longer manoeuvre.

---

## How to read it

The first strip shows airway-opening pressure (Paw), alveolar pressure (Palv) and pleural pressure (Ppl) on one cmH₂O axis. During flow, the gap between Paw and Palv is the pressure spent overcoming airway resistance. Ppl is the pressure surrounding the lung and intrathoracic circulation.

The strip immediately below shows transpulmonary pressure ($P_L=P_{alv}-P_{pl}$) on its own cmH₂O axis. It is the pressure across the lung itself.

The separate $P_L$ strip is a graphical choice, not a different equation. On one shared numerical axis, positive $P_L$ would correctly appear above a near-zero Paw and a negative Ppl. Giving it a time-aligned strip below Paw and Ppl preserves the true value while keeping the visual and numerical reading order consistent.

### Why model and bedside transpulmonary pressure traces can differ

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

The vascular strip shows systemic arterial, pulmonary arterial and central venous pressure in mmHg. The bottom strip shows lung volume above the calculated resting reference in mL. Light vertical bands identify inward airflow across the displayed strips, allowing events to be aligned without mentally matching different time axes.

The rail on the right mixes two kinds of readout deliberately. Paw, Palv, Ppl and $P_L$ show the current model state at the rail's readable update rate. During passive ventilation, Paw retains the calculated Pplat in parentheses as breath-level context. During PSV or spontaneous effort, the routine Pplat is omitted because an ordinary assisted breath has no passive plateau. An [end-inspiratory hold](manoeuvres.md#what-an-inspiratory-hold-shows-during-pressure-support) can still reveal a plateau if flow is zero and muscle activity relaxes; that level is read directly from the live Paw trace rather than inserted into the routine tile. The Ppl row similarly keeps the latest breath's swing in parentheses. Systemic and pulmonary systolic/diastolic pressure, CVP and tidal volume remain the slower summaries used in the numerical tiles. $P_L$ is placed in the second rail beside its own curve. The curves themselves remain continuous at the model's trace sampling rate.

During PSV, the help panel also reports trigger delay and whether the latest completed breath cycled before neural inspiration ended. **Early cycling** means Paw has returned to PEEP while inspiratory drive is still present; Ppl can therefore continue to fall during the ventilator's expiratory phase. “No early cycling detected” is deliberately narrower than “fully synchronous”: the model does not classify every form of asynchrony.

Each strip fits its vertical range again when a control or scenario changes. The preceding waveform remains visible as temporal context, but its former extremes no longer determine the scale of the new state. Within one unchanged state, the range expands if a new value would otherwise be clipped and contracts only after the signal has remained comfortably inside it. This keeps clinically important changes visible without making the axes follow every sample.

Respiratory and vascular pressures deliberately do not share an axis. Their units and magnitudes differ, and a dual axis would make visual crossings physiologically meaningless.

## Follow air and blood during the same breath

Select **Airway flow** to see gas enter the lung above zero and leave below zero (L/min). In an obstructed lung, check whether expiration still carries gas out when the next inspiration begins. Read this together with end-expiratory gas volume and intrinsic PEEP. **Caval flow** plots the model's systemic caval connection to the right atrium (L/min). A negative value means transient backflow. Compare its timing with pleural pressure and CVP as you change PEEP.

Select **Aortic flow & stroke volume** to see two separate scales. The flow curve shows how rapidly blood crosses the aortic valve at each instant (L/min). Each dot below it gives the total volume ejected in one completed LV beat (mL/beat), placed at the end of that beat. A high narrow flow peak can eject less blood than a broader, lower peak. Read the sequence across breaths; a phase difference between caval inflow and LV ejection cannot measure pulmonary transit time. **Enlarge** gives space to all selected signals. **Restore size** returns to the monitor.

Beside transpulmonary pressure, **end-exp / end-insp** gives the two phase-end pressures from the latest complete uninterrupted breath, in cmH₂O. These are internal alveolar-minus-pleural pressures sampled before the next phase moves gas. They need no airway occlusion. A coloured strip at the top of each plot marks an actual occlusion; a vertical line marks the final reading of a completed hold. Its caption records simulated time, airway and transpulmonary pressures and airway flow. While an assisted patient is relaxing, follow Paw during the hold as well as its endpoint.

## Record a pressure history

Choose **Pressure history → Start recording** before changing a control. Collect four full breaths at baseline. Change PEEP, observe several breaths, then restore the original PEEP with the same lung properties and tidal volume. In **From** and **Compare with**, select two intervals. Each setting change carries its time since recording began. The selected windows show their start and end times, the time since the chosen intervention and the number of beat endings. **Stop recording** freezes the result for inspection. Pausing the simulator also pauses acquisition.

Read the rows down the page:

- Set PEEP is the prescribed airway pressure in expiration. Transpulmonary pressure shows the minimum and maximum actually reached across the lung in each breath. The vertical marks span that measured range.
- The fraction open and the litres of gas are read at **end expiration**. More gas can reflect expansion of already open units. Read gas volume together with opening to decide whether the simulated lung also retains newly opened units. The percentage belongs to the model's entire lung.
- Pleural pressure is averaged over the breath and referenced to atmosphere. A change can affect the pressure surrounding the heart. It does not by itself give transmural atrial pressure.
- Aortic output sums the blood crossing the valve over four consecutive complete breaths and divides by their actual duration. A partial heartbeat at a window boundary can contribute to small differences. A passive plateau is calculated from end-inspiratory recoil in passive controlled ventilation. Read both outputs: retaining opening at the original PEEP can lower plateau at the same tidal volume while cardiac output remains near baseline.

The two numerical columns use the latest four complete valid breaths within each selected interval. Phase-end quantities and per-breath extrema are averaged over those breaths. Pleural pressure and aortic output are averaged over the elapsed time. Four breaths define the measurement window; they do not establish equilibrium. Interruptions create gaps. To compare with an untreated circulation, pin the **same patient before the intervention**, select that Pin and start recording. The optional Pin line integrates its aortic flow over the patient's exact elapsed intervals even if their respiratory rates diverge. Changing the selected Pin ends further reference collection for that recording. With no Pin the patient's history works independently.

Closing the panel, starting a new recording, loading a patient or resetting clears the displayed history. Changing the lung or chest-wall properties ends acquisition and leaves the recording available. Holds mark an interruption, and ordinary settings such as PEEP create a new interval. Storage is limited to 360 completed breaths or 120 intervals per recording. No simulation is rerun to reconstruct earlier data. See the [same-PEEP recruitment example](hysteresis.md#interpreting-the-mechanical-response).

## Follow one intervention across the strips

After a PEEP increase, read the airway-pressure change first, then the accompanying Ppl and $P_L$, then the vascular response. Ppl explains changed pressure around the heart; $P_L$ and lung volume describe the inflation imposed on the lung. The arterial response can develop over subsequent beats as pulmonary blood storage and LV filling change. The strips show timing together, but temporal association alone does not separate these simultaneous mechanisms. Use a [live Pin](numeric-tiles.md#pin-values-for-a-comparison) to retain the untreated state while observing the new trajectory.

## Pause and inspect one instant

Press **Pause**, then drag the time cursor above the strips or drag directly across any waveform. The vertical cursor crosses every visible strip on one clock. Numerical tiles and each diagram’s current-state representation move to the retained model state nearest that instant, allowing Paw, Ppl, CVP, ventricular position and lung position to be read together rather than estimated by eye.

The waveform itself remains sampled at <!-- CONSISTENCY: trace-sample-rate -->250 Hz<!-- /CONSISTENCY -->. The complete state needed by the other panels is retained every 50 ms, so their selected point can differ from the cursor by at most about 25 ms. This lighter presentation history does not rewind the simulator and is cleared when a scenario, patient file or reset creates a fresh simulation.

Static relations are recalculated from the parameters stored at the selected instant. A single instant cannot define an entire respiratory or cardiac loop: the cursor therefore moves the live point, but it does not invent a historical full-cycle trace.

The parameter sidebar always remains an editor for the **current** patient. It does not move back to historical settings while the cursor is inspecting an older state; the cursor time and diagram positions identify that the displayed readouts are historical.

[Live pin comparisons](numeric-tiles.md#pin-values-for-a-comparison) use the current simulated clock. While the cursor inspects an earlier instant, their tile lines are hidden and Pin is disabled. Returning to the latest instant or pressing Play restores the comparison. Pause stops the current patient and every reference together; the reference simulations do not have separate historical cursors.

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

The flow and pressure curves share a sample clock. During initial settlement the monitor acquires waveforms; the paused cursor can visit the part for which a full presentation state has been retained.

## Limits

- The traces are noise-free internal signals: no catheter resonance, damping, transducer levelling error, airway leak or monitor filtering is simulated.
- PSV trigger and cycling timing are available in the values disclosure. The flow trace shows measured gas movement.
- During a hold the simulator imposes zero airway flow. A flat pressure in an assisted patient does not independently establish muscle relaxation.
- Arterial pressure is a central model compartment, not a peripheral waveform.
- The 12-second window can conceal slower adaptation, including the 15-second aggregate baroreflex.
- Automatic rescaling means screen height cannot be compared between widely separated states without reading the axes.
- The cursor selects the nearest retained 50 ms presentation sample; it is not intended for millisecond timing measurements.

## References

- Pinsky MR. Functional hemodynamic monitoring. *Crit Care Clin*. 2015;31:89–111. [doi:10.1016/j.ccc.2014.08.005](https://doi.org/10.1016/j.ccc.2014.08.005)
- Tobin MJ. *Principles and Practice of Mechanical Ventilation*. 3rd ed. McGraw-Hill; 2013.
- Mojoli F, Pozzi M, Orlando A, et al. Timing of inspiratory muscle activity detected from airway pressure and flow during pressure support ventilation: the waveform method. *Crit Care*. 2022;26:32. [doi:10.1186/s13054-022-03895-4](https://doi.org/10.1186/s13054-022-03895-4)

---

## See also

[Pleural pressure](pleural-pressure.md) · [The Campbell diagram](panel-campbell.md) · [The four effects of a breath](the-four-effects-of-a-breath.md) · [Pulmonary transit](pulmonary-transit.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Numerical tiles](numeric-tiles.md)
