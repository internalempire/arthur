# Numerical tiles

> The readout layer is a physiological map, not a list of monitor values: each tile should be read as **state or waveform → calculation → meaning → validity condition**.

---

## How a model state becomes a number

The circulation is integrated at every time step, but most bedside quantities are not instantaneous. Systolic and diastolic pressures come from the latest completed cardiac cycle. Cardiac output uses the latest left ventricular stroke volume and current effective heart rate. Mean vascular pressures are exponential three-second averages. Respiratory quantities generally come from the latest completed breath. A tile can therefore lag an animated chamber or instantaneous waveform without either being wrong.

After measurement, the interface may apply a calculation such as $(mPAP-wedge)/CO$, $VT/\Delta P$ or respiratory variation. It then asks whether the assumptions needed to give that calculation its clinical name are present. Finally, a colour may draw attention to a teaching state. These four stages are separate:

| layer | example | what it establishes |
|---|---|---|
| simulated state | left atrial volume and surrounding pressure | what exists inside the model now |
| model measurement | smoothed atmospheric left atrial pressure | what the model can report from that state |
| derived interpretation | “wedge surrogate” and derived PVR | what clinical construction the number resembles |
| status annotation | “above 2 WU” or “low output” | a didactic threshold, not a diagnosis |

The category shown on each tile is part of the result:

- **model measurement** — obtained directly from a simulated state, beat or breath;
- **derived index** — calculated from measurements and dependent on interpretation assumptions;
- **internal model coefficient** — used by the equations but not measured the same way at the bedside.

An exactly known latent model state can still be clinically unmeasurable. Conversely, a bedside-derived index can remain useful despite measurement uncertainty. [Interpretability](interpretability.md) explains the badge rules.

---

## Systemic flow, pressure and filling

### Cardiac output

The tile multiplies the latest completed left ventricular stroke volume by effective heart rate. It is the systemic output of the closed loop, not an independently simulated thermodilution or indicator-dilution measurement. Read it with arterial pressure: baroreflex and systemic vascular resistance can preserve one while the other changes.

Related pages: [Ventriculo-arterial coupling](ventriculo-arterial-coupling.md) · [Baroreflex](baroreflex.md) · [Pulmonary transit](pulmonary-transit.md)

### Heart rate

The main number is the **effective** heart rate used to time the cardiac cycle and calculate output. Its subtitle separates the baseline rate selected by the user from the additive baroreflex contribution. With the reflex off the two are identical; with it on they can diverge without moving the baseline control.

This distinction prevents a compensated output from being mistaken for the phenotype originally selected. The baroreflex contribution is a bounded model effector, not a prediction of an individual patient's chronotropic reserve.

Related pages: [Heart controls](controls-heart.md) · [Baroreflex](baroreflex.md)

### Arterial pressure

Systolic and diastolic values are extrema from the latest completed beat; mean arterial pressure is a smoothed pressure of the systemic arterial compartment. Pressure depends on flow, arterial storage and systemic resistance. It cannot by itself distinguish preserved output from vasoconstrictor compensation.

Related pages: [Baroreflex](baroreflex.md) · [Ventriculo-arterial coupling](ventriculo-arterial-coupling.md)

### Systemic vascular resistance

The main number is the effective resistance coefficient used in the systemic outflow equation, reported in dyn·s·cm⁻⁵. The subtitle shows the selected baseline resistance and, when the baroreflex is active, its percentage contribution. The tile therefore belongs beside arterial pressure: a defended MAP may reflect higher resistance rather than preserved flow. Its dotted category marker identifies it as an internal model coefficient.

This is an aggregate model resistance, not a thermodilution-derived bedside measurement and not a regional distribution of vascular tone. It does not represent a vasopressor dose.

Related pages: [Volume and vascular controls](controls-volume.md) · [Baroreflex](baroreflex.md) · [Ventriculo-arterial coupling](ventriculo-arterial-coupling.md)

### CVP

CVP is the smoothed right atrial cavity pressure relative to atmosphere. The subtitle subtracts smoothed pleural and pericardial pressure to estimate right atrial transmural pressure. The two may move in opposite directions during a breath: an increase in measured CVP can coexist with less right-heart distension.

Related pages: [Transmural pressure](transmural-pressure.md) · [Pleural pressure](pleural-pressure.md) · [Venous return](venous-return.md)

### Mean systemic filling pressure

Pmsf is the elastic pressure generated by stressed systemic venous volume, modified by abdominal transmission where the reservoir remains distended. The subtitle reports the effective gradient between Pmsf and the back-pressure seen by venous return; near caval collapse that back-pressure is not simply right atrial pressure.

Pmsf is an exactly known model state. A patient value requires an occlusion or extrapolation and carries much greater uncertainty.

Related pages: [Stressed volume](stressed-volume.md) · [Venous tone](venous-tone.md) · [Venous return](venous-return.md) · [Pmsf and occlusions](pmsf-and-occlusions.md)

### Preload reserve

The model perturbs the analytic Guyton operating point and reports the local fractional gain in predicted steady flow per mmHg of additional filling pressure. The ascending relation calculates RV output from RV filling and current pulmonary arterial load; it does not independently test LV reserve. The subtitle also shows the absolute slope and whether the point lies on the steep limb or plateau. This is an internal analytic construction, not a validated bedside index or a fluid prescription.

Related page: [Preload reserve](preload-reserve.md)

---

## Pulmonary circulation and right-heart load

### Pulmonary artery

Systolic and diastolic values come from the latest pulmonary arterial beat; mPAP is a three-second mean. The subtitle includes the left-atrial-pressure wedge surrogate so the upstream and downstream pressures remain visible together. mPAP depends on flow, downstream pressure and the complete pulmonary vascular load, and a failing RV may be unable to generate a striking pressure despite severe afterload.

The pulmonary-hypertension status uses the model's mPAP, wedge surrogate and derived PVR. It is descriptive, not diagnostic, and its pre-/post-capillary wording is uncertain whenever the wedge surrogate is cautioned.

Related pages: [The right ventricle](the-right-ventricle.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md)

### Wedge surrogate

The tile is a three-second mean of atmospheric left atrial pressure. It is not produced by a catheter occlusion and is not sampled specifically at end-expiration. Pleural and pericardial pressure are included in the displayed value, so it must not be equated automatically with transmural left-heart filling pressure.

The subtitle reports a **zone 3 index**, a normalised pulmonary-venous-to-alveolar pressure margin. It is not an anatomical percentage of lung. The tile is cautioned when this index does not support an uninterrupted downstream pressure column.

Related page: [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md)

### PVR, derived

This tile applies the catheter form:

$$
PVR_{derived}=\frac{mPAP-P_{w,surr}}{CO}
$$

Because cardiac output is in the denominator, derived PVR can rise when flow falls even if the internal resistance coefficient barely changes. It is unavailable near zero forward flow and now inherits any zone-3 caution from the wedge surrogate.

Related pages: [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Vascular waterfalls](vascular-waterfalls.md)

### Pulmonary resistance coefficient

This is the resistance used inside the pulmonary flow equation after the alveolar and extra-alveolar J-curve, open and derecruited pathways and hypoxic-tone surrogate have been combined. The waterfall pressure is handled separately in the circulation. It is displayed in Wood units and dyn·s·cm⁻⁵ for scale, but it is not a catheter measurement and need not equal derived PVR.

Related pages: [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Hypoxic vasoconstriction](hypoxic-vasoconstriction.md)

### RV:LV end-diastolic volume

The ratio compares the model chambers' end-diastolic volumes and prints both absolute volumes. It helps reveal ventricular imbalance and septal competition, but it is not the mid-cavity diameter ratio used in echocardiography. Its colour describes a model geometry; it does not diagnose acute cor pulmonale.

Related pages: [The right ventricle](the-right-ventricle.md) · [Ventricular interdependence](ventricular-interdependence.md) · [PV loops](panel-pv-loops.md)

### LV ejection fraction

The latest completed left ventricular stroke volume is divided by end-diastolic volume. The subtitle retains stroke volume because the same EF can accompany very different forward outputs and filling states. The model has no valvular regurgitation, so total and forward stroke volume are the same by construction.

Related pages: [PV loops](panel-pv-loops.md) · [Ventriculo-arterial coupling](ventriculo-arterial-coupling.md)

---

## Respiratory mechanics

### Respiratory system compliance

The tile reports the ventilator-like breathwise ratio $VT/\Delta P$, using total PEEP when intrinsic PEEP is present. It is not the aerated-tissue compliance control. Recruitment, accessible lung size, the current local slope of the independent chest-wall curve, wall load and proximity to maximum lung capacity can all change the measured value, which is why the subtitle shows open fraction.

Related pages: [Equation of motion](equation-of-motion.md) · [Pressure–volume curve](pressure-volume-curve.md) · [Two-population lung](two-population-lung.md)

### Plateau pressure

The model calculates static end-inspiratory recoil at the delivered volume. The ventilator does not perform a true inspiratory pause, so this is a model plateau rather than a sampled hold waveform. Driving pressure subtracts applied plus intrinsic PEEP. The tile is withheld during spontaneous effort because the passive interpretation is absent.

Related pages: [Equation of motion](equation-of-motion.md) · [Stress index](stress-index.md) · [Manoeuvres](manoeuvres.md)

### Total PEEP

Total PEEP is applied PEEP plus intrinsic PEEP from the last breath. Dynamic trapped volume is actual end-expiratory volume above the passive equilibrium volume at the same applied PEEP; loss-of-recoil hyperinflation is therefore not automatically labelled dynamic trapping. The EFL label reports whether the expiratory choke constrained flow during that breath.

Related page: [Expiratory flow limitation](expiratory-flow-limitation.md)

### Pleural swing

The amplitude comes from the latest completed breath; the subtitle is instantaneous pleural pressure. Pleural pressure links ventilation to vascular and chamber pressures. Wall compliance primarily changes the swing, while wall load can shift its resting level; the same numerical swing can still have different consequences depending on stressed volume, vascular waterfalls and ventricular reserve.

Related pages: [Pleural pressure](pleural-pressure.md) · [The four effects of a breath](the-four-effects-of-a-breath.md)

---

## Recruitment and dynamic indices

### Recruitment-to-inflation

The tile reports the R/I achieved by the model during a standard static PEEP 5→15 cmH₂O assessment, alongside the requested target and recruited volume. It is unavailable without a collapsed compartment and cautioned when the requested target exceeds what the selected collapsed and recruitable lung can provide.

Related page: [Recruitment and R/I](recruitment-and-ri.md)

### Stress index

The exponent is fitted to the pressure rise during passive constant-flow volume control after the initial resistive onset. Values below one indicate downward curvature compatible with intratidal recruitment in this model; values above one indicate upward curvature as the accessible lung approaches its capacity. It is withheld when effort or ventilatory mode removes the constant-flow passive assumptions.

Related page: [Stress index](stress-index.md)

### Pulse pressure variation

PPV and SVV compare extrema over recent complete respiratory cycles. The tile explicitly labels them as descriptive rather than a verdict on filling state, and the model deliberately does not colour them with a fluid-responsiveness cutoff. In particular, a low PPV can coexist with substantial [preload reserve](preload-reserve.md) when severe underfilling weakens transmission through the pulmonary circulation. Spontaneous effort makes the tile unavailable; low tidal volume, too few beats per breath, RV dilatation or high abdominal pressure add caution because they weaken or confound the usual mechanism.

Related page: [Pulse pressure variation](pulse-pressure-variation.md)

---

## Status colours and withheld values

Colours identify selected teaching states such as low output, hypotension, high driving pressure, gas trapping or chamber imbalance. They are not a comprehensive alarm system, and a tile without colour is not proof of normal human physiology.

When an individual index loses a necessary assumption, the model either shows it with **interpret with caution** or withholds it as **not interpretable**. If the entire integrator reaches an out-of-domain state—non-finite values, a compartment at its protective floor, impossible EF or lung volume clamped at capacity—the invalid banner suppresses every tile rather than printing numerical artefacts.

---

## Limits

- Different measurement windows mean that small transient discrepancies between a tile, waveform and animated panel are expected.
- The interface cannot flag confounders absent from the model, including arrhythmia, catheter artefact, valvular disease, changing vasoactive drug concentration and gas-exchange abnormalities.
- Clinical thresholds are used only as descriptive annotations; they do not create treatment recommendations.
- Internal quantities can be exact inside the model and still be unmeasurable in a patient.
- A green or unqualified index means that encoded prerequisites are present, not that patient-level quantitative validation has been established.

---

## References

- Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for the diagnosis and treatment of pulmonary hypertension. *Eur Heart J*. 2022;43:3618–3731. [doi:10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)
- Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation with mechanical ventilation. *Am J Respir Crit Care Med*. 2019;199:22–31. [doi:10.1164/rccm.201801-0088CI](https://doi.org/10.1164/rccm.201801-0088CI)
- Pinsky MR, Payen D. Functional hemodynamic monitoring. *Crit Care*. 2005;9:566–572. [doi:10.1186/cc3927](https://doi.org/10.1186/cc3927)
- Pinsky MR, Vincent JL, De Smet JM. Estimating left ventricular filling pressure during positive end-expiratory pressure in humans. *Am Rev Respir Dis*. 1991;143:25–31. [doi:10.1164/ajrccm/143.1.25](https://doi.org/10.1164/ajrccm/143.1.25)

---

## See also

[Interpretability](interpretability.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Transmural pressure](transmural-pressure.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [Preload reserve](preload-reserve.md) · [Stress index](stress-index.md) · [Global limits](global-limits.md)
