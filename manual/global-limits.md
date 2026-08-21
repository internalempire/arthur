# Global limits

> The model is a compact mechanical argument about heart–lung interaction; it is not a complete cardiopulmonary patient, and every scenario inherits the omissions below.

---

## What the model can legitimately show

The strongest claims are causal and comparative: how the sign of pleural pressure changes venous return; how lung volume and recruitment alter pulmonary vascular load; how a pressure change around the heart differs from transmural filling; how RV output reaches the LV after transit; and how ventricular interaction changes the response to a load.

Absolute outputs are useful for orientation and internal consistency, especially where constrained by human in-vivo data. They are not individual predictions, normal ranges or treatment targets.

## Respiratory physiology not represented

- No oxygen, carbon dioxide, pH, oxygen content, shunt, dead space or alveolar ventilation calculation.
- No respiratory drive controller, chemoreflex, sedation, neuromuscular blockade or respiratory muscle fatigue.
- One aggregate lung without lobes, gravitational gradients, pendelluft, regional stress, regional time constants or spatial ventilation–perfusion matching.
- One pleural pressure and one aggregate sigmoid chest wall, without regional gradients, separate rib-cage/diaphragm mechanics or oesophageal-pressure artefact.
- Chest-wall load is an independently selected pressure offset, not a prediction from anthropometry, posture or abdominal pressure.
- No airway leak, gas compression, secretions, airway closure, bronchodilator response, trigger delay or patient–ventilator dyssynchrony.
- EFL is one collapsible-airway choke, not a regional COPD model.
- Recruitment uses two unit populations and one distributed opening range; tissue and surfactant hysteresis are absent.
- No capillary filtration, lymphatic drainage or time-dependent pulmonary oedema.

Consequently, the model cannot predict oxygenation, ventilatory efficiency, mechanical power injury, work-of-breathing failure or the gas-exchange response to recruitment, prone positioning or pulmonary vasodilation.

## Pulmonary circulation not represented

- Open and derecruited beds are aggregate parallel pathways, not regional vessels.
- HPV is selected tone in the derecruited pathway, not a response calculated from alveolar oxygen.
- Thrombotic obstruction, blood viscosity, haematocrit, vascular remodelling and non-alveolar critical closing pressure are not separately resolved.
- Pressure/flow-dependent vascular recruitment and distension are simplified into effective coefficients.
- No characteristic impedance, wave reflection, pulmonary arterial wave velocity or frequency-dependent RV afterload.
- West-zone behaviour is aggregate; the [wedge tile](pulmonary-artery-wedge-pressure.md) uses smoothed left atrial pressure as a surrogate, not a catheter occlusion, and derived PVR inherits its zone-3 caution.
- Pulmonary transit uses eight pressureless mixing stages and is not a contrast-bolus or regional capillary model.

The pulmonary-embolism scenario therefore raises one aggregate vascular load. It can show the mechanical RV consequence but cannot identify clot burden or partition resistance from obstruction, calibre, viscosity and tone.

## Cardiovascular physiology not represented

- No coronary circulation, myocardial oxygen balance, ischaemia, infarction or pressure-dependent RV coronary perfusion.
- No arrhythmia, conduction disease, pacing, force–frequency relation or beat-to-beat autonomic variability.
- No valvular stenosis, regurgitation, prolapse or prosthesis.
- Atria have no selectable pathology; the RV has no independent diastolic-stiffness control.
- Ventricles are lumped elastance chambers, not spatial myocardium; the RV:LV ratio is a model-volume ratio rather than an imaging ratio.
- Pericardial capacity supports a directional tamponade phenotype, but there is no fluid compartment, accumulation rate, loculation, echocardiographic chamber collapse or clinically calibrated pressure–volume relation.
- One systemic arterial and one venous reservoir replace organ beds, regional autoregulation, capillary exchange and microcirculation.
- No renal fluid balance, hormonal control, vascular stress relaxation or long-term remodelling.

Ejection fraction is typically around 5–10 percentage points lower than intended even when stroke volume, output and loop shape are plausible. Treat it as a model measurement, not an echocardiographic calibration.

## Autonomic and therapeutic limits

One bounded 15-second sympathetic signal senses filtered systemic MAP and changes heart rate, SVR, venous tone and contractility together. There is no separate vagal limb, chemoreflex, cardiopulmonary receptor, afferent response to mPAP/PVR/RV stretch, or effector-specific kinetics.

Controls do not represent drug dose. Fluid is placed instantaneously in the venous reservoir; vasopressor effects are not receptor-specific; inotropes have no oxygen cost; pulmonary vasodilators have no systemic spill-over or gas-exchange effect. The model cannot compare therapies on risk, outcome or dose.

## Numerical and measurement limits

- Forward Euler uses a fixed 0.25 ms step and a protective 1 mL volume floor.
- Reset settles for 15 seconds; extreme states may require longer to reach a slow equilibrium.
- Traces are noise-free and lack transducer, catheter and ventilator measurement artefacts.
- Several quantities—true Pmsf, stressed volume, open fraction—are latent states known exactly in simulation but not directly in vivo.
- Plateau pressure is calculated rather than measured during a zero-flow pause.
- The model-wide validity flag catches encoded numerical failures, not every physiologically impossible combination.
- Different parameter combinations can produce similar outputs; controls are not identifiable patient estimates.

## Limits of indices and scenarios

PPV and SVV are descriptive and deliberately not tied to a diagnostic fluid-responsiveness threshold. There is no tidal-volume challenge because the model is not quantitatively calibrated to its proposed PPV increment. R/I is a teaching analogue of a fixed PEEP manoeuvre and can be bounded by available collapsed lung. Preload reserve is the slope of an analytic model curve, not a validated bedside index.

Every scenario is a phenotype designed around one question. None contains the full disease named in its title. ARDS lacks gas exchange, inflammatory and thrombotic biology; COPD lacks regional obstruction; sepsis lacks endothelial and organ physiology; LV failure lacks fluid kinetics and mitral regurgitation; pulmonary embolism lacks explicit clot; tamponade lacks pericardial fluid dynamics and diagnostic imaging. Prone position is a coarse immediate transformation. The weaning scenario was removed because too much of its causal physiology was missing.

## Validation boundary

The model has numerical verification, executable literature constraints and scenario-level mechanism audits. It does not have comprehensive quantitative human validation, global sensitivity analysis, uncertainty propagation, parameter identifiability or prospective clinical evaluation. A passing test establishes only the contract named by that test.

## Safe interpretation

Use the model to ask “which mechanism could produce this direction, and in what temporal order?” Do not use it to ask “what setting should I choose for this patient?” Any bedside decision still requires measurements, diagnosis, uncertainty and physiology absent from the simulator.

## References

- Pinsky MR. Heart lung interactions during mechanical ventilation. *Curr Opin Crit Care*. 2012;18:256–260. [doi:10.1097/MCC.0b013e3283532b73](https://doi.org/10.1097/MCC.0b013e3283532b73)
- Mahmood SS, Pinsky MR. Heart–lung interactions during mechanical ventilation: the basics. *Ann Transl Med*. 2018;6:349. [doi:10.21037/atm.2018.04.29](https://doi.org/10.21037/atm.2018.04.29)
- Ventetuolo CE, Klinger JR. Management of acute right ventricular failure in the intensive care unit. *Ann Am Thorac Soc*. 2014;11:811–822. [doi:10.1513/AnnalsATS.201312-446FR](https://doi.org/10.1513/AnnalsATS.201312-446FR)
- Oberkampf WL, Roy CJ. *Verification and Validation in Scientific Computing*. Cambridge University Press; 2010.

---

## See also

[Validation](validation.md) · [Interpretability](interpretability.md) · [Clinical scenarios](scenarios.md) · [Cardiac tamponade](cardiac-tamponade.md) · [Model architecture](model-architecture.md) · [Bibliography](bibliography.md) · [Planned work](_todo.md)
