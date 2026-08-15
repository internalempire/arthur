# Clinical scenarios
> All clinical presets, the question each asks, and the limits of the answer.

The presets are not miniature patient records and they do not predict treatment response. Each is a settled phenotype chosen to make one heart–lung interaction easy to interrogate. Use the preset to establish the starting state, change one control, allow several breaths for the circulation to settle, and ask whether the causal chain visible in the panels matches the question below.

## Physiology

### Healthy spontaneous breathing

**Question.** How can measured central venous pressure fall during inspiration while right-heart filling rises?

**Try.** Compare inspiratory and expiratory CVP, then compare measured CVP with transmural CVP.

**Read.** Negative [pleural pressure](pleural-pressure.md) lowers the pressure measured relative to atmosphere while increasing the pressure gradient for [venous return](venous-return.md). The rise in forward flow is a respiratory-phase effect. PPV is unavailable because the patient is breathing spontaneously.

### Healthy passive volume control

**Question.** What reverses when the ventilator, rather than the respiratory muscles, generates inspiration?

**Try.** Compare the direction of CVP and forward flow during inflation with the spontaneous preset.

**Read.** Positive pleural pressure raises measured intrathoracic vascular pressure and transiently opposes venous return. The later left-heart response is separated from the right-heart response by [pulmonary transit](pulmonary-transit.md).

### PEEP escalation

**Question.** Why can PEEP raise both CVP and mean systemic filling pressure while cardiac output still falls?

**Try.** Move PEEP between 5 and 14 cmH2O and follow CVP, Pmsf, the venous-return gradient and the Guyton operating point.

**Read.** PEEP raises the pressure surrounding the right atrium, but abdominal transmission can also raise upstream systemic venous pressure. Flow depends on the effective gradient and the resistance to return, not on either pressure alone. The size of the response is illustrative and depends on filling, pressure transmission and pulmonary vascular load.

### Septic shock, fluid responsive

**Question.** Can an apparently survivable arterial pressure conceal low effective filling?

**Try.** Increase stressed volume, then return to the preset and set baroreflex sensitivity to zero.

**Read.** Added [stressed volume](stressed-volume.md) raises Pmsf and output because the operating point has preload reserve. Removing the aggregate [baroreflex](baroreflex.md) exposes the pressure and flow that the selected circulation would generate without compensation. The fluid step and reflex coefficients are teaching choices, not resuscitation targets.

### Large pleural swings, limited preload reserve

**Question.** Why is a large pleural-pressure swing not itself evidence of preload responsiveness?

**Try.** Observe the pleural swing and the position of the operating point on the cardiac-function relation; then inspect the preload-reserve readout and the PPV interpretability warning.

**Read.** The preset is spontaneously breathing, so PPV is withheld even though an internal waveform variation exists. The pleural swing exceeds 20 cmH₂O while the local preload reserve remains below the model's steep-limb threshold. The useful lesson is that transmitted pressure and position on the filling curve are different quantities. Do not use the hidden PPV value as the demonstration.

### ARDS with right ventricular failure

**Question.** How does recruitability change the balance between opening lung and loading the right ventricle?

**Try.** Compare PEEP levels with the preset R/I, then set R/I to zero while keeping collapse and tissue compliance unchanged. Prone positioning can be explored as a separate, deliberately coarse transformation.

**Read.** In the recruiter, added pressure opens units and shares gas among more aerated lung; in the non-recruiter, the same pressure mainly distends the remaining open lung. The preset leaves maximum lung capacity at the 6 L default: collapse makes the accessible baby lung smaller, while reduced `clung` independently makes its aerated tissue less compliant. Follow derived PVR, its wedge-dependent quality badge, RV/LV ratio, septal interaction and output together. Extreme PEEP can generate plateau pressures outside a useful quantitative range and can invalidate the catheter interpretation of the wedge surrogate; prone response is directional rather than patient-specific. See [recruitment and R/I](recruitment-and-ri.md), [pulmonary vascular resistance](pulmonary-vascular-resistance.md), [pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) and [ventricular interdependence](ventricular-interdependence.md).

### Acute pulmonary embolism

**Question.** What happens when a normal mechanical lung is coupled to a high pulmonary vascular load and a vulnerable right ventricle?

**Try.** Inspect the high mPAP, low wedge surrogate, high model hydraulic gradient and RV dilatation; then switch to passive ventilation and raise PEEP. Watch the wedge and derived-PVR caution badges rather than treating the displayed arithmetic as a valid catheter classification.

**Read.** The preset uses one effective aggregate pulmonary load. It does not separate clot obstruction, calibre, viscosity, vasomotor tone or critical closing pressure. Its low downstream pressure also makes the aggregate zone-3 surrogate cautious, even though a real catheter could be deliberately placed in a dependent zone-3 region; this is a limitation of the non-regional model, not a claim that PAWP is unobtainable in pulmonary embolism. The selected tachycardia, systemic resistance and filling describe compensation already present; the model baroreflex senses systemic MAP rather than embolus, PVR or mPAP directly. Positive pressure demonstrates vulnerability, not an individual intubation-risk estimate.

### Cardiogenic pulmonary oedema

**Question.** Can positive intrathoracic pressure increase output when a failing left ventricle is more afterload-sensitive than preload-dependent?

**Try.** Start from the preset at PEEP 10, set PEEP to zero and allow the model to settle, then return PEEP to 10. Compare several respiratory cycles rather than one beat. Follow the LV pressure–volume loop, end-diastolic and end-systolic volume, pleural pressure and output.

**Read.** This is a deliberately severe, afterload-dominant phenotype with low LV contractility, high diastolic stiffness, high filling pressure and a stiff thoracic envelope. PEEP raises pleural pressure, reducing the [transmural pressure](transmural-pressure.md) required for LV ejection. End-diastolic volume falls slightly, but end-systolic volume falls more and respiratory-cycle-averaged output rises by about 9%. This demonstrates one possible response; a more preload-dependent patient can show no gain or a fall.

### Stiff chest wall

**Question.** Why can the same delivered tidal volume create a much larger intrathoracic-pressure swing?

**Try.** Compare the preset with a more compliant chest wall while holding tidal volume and PEEP constant.

**Read.** A stiff wall allocates more airway pressure to the chest wall and pleural space, raising measured CVP and the haemodynamic cost of ventilation. The preset also includes raised abdominal pressure and is a mechanical phenotype rather than a complete model of obesity. PPV is under caution in this setup.

### COPD with dynamic hyperinflation

**Question.** How do expiratory flow limitation, expiratory time and external PEEP interact?

**Try.** Slow respiratory rate, shorten inspiratory time, and compare external PEEP below and above the expiratory choke.

**Read.** Slower expiration reduces trapped gas, intrinsic PEEP and circulatory loading. High `clung` raises the relaxation volume through loss of recoil but no longer enlarges maximum capacity, which remains at the 6 L default. Below the choke, external PEEP mainly substitutes for intrinsic pressure; above it, total PEEP and lung volume rise and output falls. This is a qualitative waterfall demonstration, not a universal fraction-of-auto-PEEP titration rule. See [expiratory flow limitation](expiratory-flow-limitation.md) and [vascular waterfalls](vascular-waterfalls.md).

### Intra-abdominal hypertension

**Question.** How can abdominal pressure both mobilise upstream venous pressure and obstruct venous return?

**Try.** Change stressed volume at high abdominal pressure, then compare with normal abdominal pressure.

**Read.** A filled abdominal venous reservoir can transmit pressure into Pmsf, while the same abdominal pressure raises the critical pressure for caval collapse. Filling determines which effect dominates. The model uses one aggregate venous-return pathway and does not separate SVC from IVC flow. See [abdominal pressure](abdominal-pressure.md) and [venous return](venous-return.md).

## In the model

Selecting a scenario replaces the current controls with defaults plus that scenario's explicit overrides. It does not apply a scripted sequence, preserve the previous patient's state or force an outcome after the selection. Touching any control changes the label to *Custom* because the patient no longer matches the preset.

The cardiogenic-pulmonary-oedema comparison is the only preset with an explicit two-state contract beyond its settled snapshot. At PEEP 0 and 10, the same parameters are used; the test averages stroke volume over several breaths and requires mean output to rise by at least 5%, LV transmural end-systolic pressure to fall, and end-systolic volume to fall more than end-diastolic volume. These conditions distinguish afterload relief from a simple preload increase.

The former weaning preset was removed. A matched experiment did not reproduce the expected rise in filling pressure or fall in output, and the model lacks work of breathing, myocardial oxygen demand, sympathetic activation, ischaemia, dynamic mitral regurgitation, fluid redistribution and time-dependent pulmonary oedema. The physiology of weaning-induced pulmonary oedema is real; a preset that merely carries its name without generating enough of its mechanism is not useful teaching.

## Why presets and not scripted cases

A preset should expose a mechanism already present in the equations. A button that directly writes the expected output would make the lesson impossible to falsify. The scenarios therefore define starting phenotypes and proposed manoeuvres, while the circulation and respiratory model determine the response.

The same rule explains why numerical matching is selective. Human in-vivo data constrain the ARDS PVR–recruitability interaction and the COPD waterfall direction. Many other coefficients were selected to make a known qualitative relation visible and are not attributed to a paper as though they were measured human constants.

## Limits

No preset is a diagnosis, a treatment recommendation or a claim that the selected numbers commonly coexist. The values are internally consistent outputs from a compact closed-loop model, not reference ranges for an individual patient.

The scenarios omit gas exchange, hypoxaemia, hypercapnia, acid–base effects, coronary perfusion, myocardial oxygen balance, renal and capillary fluid kinetics, regional ventilation and perfusion, vasoactive drug doses and most disease time courses. A preset can therefore teach a mechanical heart–lung interaction while remaining unable to reproduce the full clinical syndrome named in its title.

Dynamic indices retain their own validity conditions inside a preset. A displayed or internally calculated number is not automatically interpretable because the starting phenotype has a clinical name. Follow the warning attached to the index and see [interpretability](interpretability.md).

## Validation

Every active preset has a volume-conservation, compartment-positivity and snapshot check. [The scenario validation audit](../docs/SCENARIO_VALIDATION.md) adds a separate contract for the teaching manoeuvre and classifies each preset as supported, qualified or needing correction. A green test means that the current implementation still agrees with the documented claim; it does not make the claim a validated clinical prediction.

Published manoeuvre constraints live in [the literature ranges](../docs/LITERATURE_RANGES.md). The rationale for retiring weaning and selecting the current LV phenotype is recorded in [the model decision log](../docs/MODEL_DECISIONS.md).

## References

- Buda AJ, Pinsky MR, Ingels NB Jr, et al. Effect of intrathoracic pressure on left ventricular performance. *N Engl J Med*. 1979;301:453–459. <https://doi.org/10.1056/NEJM197908303010901>
- Fougères E, Teboul JL, Richard C, et al. Haemodynamic impact of a positive end-expiratory pressure setting in acute respiratory distress syndrome. *Crit Care Med*. 2010;38:802–807.
- Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of volume expansion on mean systemic pressure in septic shock. *Crit Care*. 2021;25:302. <https://doi.org/10.1186/s13054-021-03711-5>
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med*. 2024;210:900–907. <https://doi.org/10.1164/rccm.202402-0383OC>
- Vieillard-Baron A, Charron C, Caille V, et al. Prone positioning unloads the right ventricle in severe ARDS. *Chest*. 2007;132:1440–1446. <https://doi.org/10.1378/chest.07-1013>
- Ranieri VM, Dambrosio M, Brienza N. Intrinsic PEEP and cardiopulmonary interaction in patients with COPD and acute ventilatory failure. *Eur Respir J*. 1996;9:1283–1292. <https://pubmed.ncbi.nlm.nih.gov/8804950/>

## See also

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Transmural pressure](transmural-pressure.md) · [Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Interpretability](interpretability.md) · [Global limits](global-limits.md)
