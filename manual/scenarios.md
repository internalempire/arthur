# Clinical scenarios
> All clinical presets, the question each asks, and the limits of the answer.

The presets are not miniature patient records and they do not predict treatment response. Each is a settled phenotype chosen to make one heart–lung interaction easy to interrogate. Use the preset to establish the starting state, change one control, allow several breaths for the circulation to settle, and ask whether the causal chain visible in the panels matches the question below. The exact controls that construct every phenotype are listed under [preset parameter changes](#preset-parameter-changes).

## Physiology

### Healthy spontaneous breathing

**Question.** How can measured central venous pressure fall during inspiration while right-heart filling rises?

**Try.** Compare inspiratory and expiratory CVP, then compare measured CVP with transmural CVP.

**Read.** Negative [pleural pressure](pleural-pressure.md) lowers the pressure measured relative to atmosphere while increasing the pressure gradient for [venous return](venous-return.md). The rise in forward flow is a respiratory-phase effect. PPV is unavailable because the patient is breathing spontaneously. The preset starts with a normal-range tidal volume, arterial and pulmonary pressures, output and RV ejection, just beyond the model's steep preload limb; this keeps the landing state neutral and does not imply that a healthy person can never increase output after additional filling.

### Healthy passive volume control

**Question.** What reverses when the ventilator, rather than the respiratory muscles, generates inspiration?

**Try.** Compare the direction of CVP during inflation, then compare settled cardiac output with the spontaneous preset.

**Read.** Positive pleural pressure raises measured intrathoracic vascular pressure and transiently opposes venous return. Aortic flow can briefly rise as inflation displaces pulmonary blood, while the later left-heart consequence of reduced right-heart output is separated by [pulmonary transit](pulmonary-transit.md).

### PEEP escalation

**Question.** Why can PEEP raise both CVP and mean systemic filling pressure while cardiac output still falls?

**Try.** Move PEEP between 5 and 14 cmH2O and follow CVP, Pmsf, the venous-return gradient and the Guyton operating point.

**Read.** PEEP raises the pressure surrounding the right atrium, but abdominal transmission can also raise upstream systemic venous pressure. Flow depends on the effective gradient and the resistance to return, not on either pressure alone. The size of the response is illustrative and depends on filling, pressure transmission and pulmonary vascular load.

### Septic shock, fluid responsive

**Question.** Can an apparently survivable arterial pressure conceal low effective filling?

**Try.** Increase stressed volume, then return to the preset and switch the baroreflex off.

**Read.** Added [stressed volume](stressed-volume.md) raises Pmsf and output because the operating point has preload reserve. Removing the aggregate [baroreflex](baroreflex.md) exposes the pressure and flow that the selected circulation would generate without compensation. The fluid step and reflex coefficients are teaching choices, not resuscitation targets.

### Large pleural swings, limited preload reserve

**Question.** Why is a large pleural-pressure swing not itself evidence of preload responsiveness?

**Try.** Observe the pleural swing and the position of the operating point on the model RV-function relation; then inspect the preload-reserve readout and the PPV interpretability warning.

**Read.** The preset is spontaneously breathing, so PPV is withheld even though an internal waveform variation exists. Vigorous effort acts against a moderately stiff, resistive respiratory system: pleural pressure changes substantially while tidal volume remains within a plausible teaching range. The local preload reserve nevertheless remains below the model's steep-limb threshold. Transmitted pressure, respiratory load and position on the filling curve are different quantities; do not use the hidden PPV value as the demonstration.

<!-- BEGIN GENERATED: swing-scenario -->
*Executable preset output after 45 s of settling.*

| inspiratory effort (cmH₂O) | delivered VT (mL) | minute ventilation (L/min) | pleural swing (cmH₂O) | preload reserve (% output/mmHg) |
|---:|---:|---:|---:|---:|
| 22 | 452 | 10.8 | 17.9 | 6.4 |
<!-- END GENERATED: swing-scenario -->

### ARDS with right ventricular failure

**Question.** How does recruitability change the balance between opening lung and loading the right ventricle?

**Try.** Compare PEEP levels with the preset R/I, then set R/I to zero while keeping collapse and tissue compliance unchanged. Prone positioning can be explored as a separate, deliberately coarse transformation.

**Read.** In the recruiter, added pressure opens units and shares gas among more aerated lung; in the non-recruiter, the same pressure mainly distends the remaining open lung. The preset leaves maximum lung capacity at the 6 L default: collapse makes the accessible baby lung smaller, while reduced `clung` independently makes its aerated tissue less compliant. A separate supine thoracic load shifts resting pleural pressure without changing chest-wall compliance. Follow end-expiratory Ppl and PL, plateau pressure, achieved R/I, derived PVR, its wedge-dependent quality badge, RV/LV ratio, septal interaction and output together. Extreme PEEP can still generate plateau pressures outside a useful quantitative range and can invalidate the catheter interpretation of the wedge surrogate; prone response is directional rather than patient-specific. See [recruitment and R/I](recruitment-and-ri.md), [pulmonary vascular resistance](pulmonary-vascular-resistance.md), [pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) and [ventricular interdependence](ventricular-interdependence.md).

R/I is one constraint, not the validator of the whole preset. The current opening-range centre is 15.5 cmH₂O and the requested R/I remains 0.70, but the scenario tests also constrain end-expiratory Ppl and PL, EELV, plateau pressure, measured respiratory-system compliance, filling pressures and the RV phenotype. If those absolute mechanics drift, preserving R/I alone is no longer sufficient for the scenario to pass.

<!-- BEGIN GENERATED: ards-scenario -->
*Executable preset outputs after 45 s of settling. End-expiratory Ppl is read from the selected chest-wall relation at measured EELV; PL is total PEEP minus that pressure.*

| state | EELV (L) | end-expiratory Ppl / PL (cmH₂O) | plateau (cmH₂O) | achieved R/I | open lung | derived PVR (WU) | RV/LV | CO (L/min) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| recruitable baseline | 0.94 | -1.4 / 13.4 | 19.6 | 0.70 | 59% | 5.3 | 1.72 | 4.00 |
| recruitable, high PEEP | 1.30 | 0.4 / 19.6 | 41.0 | 0.70 | 74% | 5.8 | 1.77 | 3.79 |
| non-recruitable, high PEEP | 1.03 | -0.9 / 20.9 | 46.6 | 0.00 | 58% | 7.2 | 1.97 | 3.53 |
<!-- END GENERATED: ards-scenario -->

### Acute pulmonary embolism

**Question.** What happens when a normal mechanical lung is coupled to a high pulmonary vascular load and a vulnerable right ventricle?

**Try.** Inspect the high mPAP, low wedge surrogate, high model hydraulic gradient and RV dilatation; then switch to passive ventilation and raise PEEP. Watch the wedge and derived-PVR caution badges rather than treating the displayed arithmetic as a valid catheter classification.

**Read.** The preset uses one effective aggregate pulmonary load. It does not separate clot obstruction, calibre, viscosity, vasomotor tone or critical closing pressure. During spontaneous breathing the atmospheric CVP is only about 3 mmHg, while transmural right-atrial pressure is higher because pleural pressure is negative; it is therefore incorrect to describe the displayed CVP simply as “high”. The low downstream pressure also makes the aggregate zone-3 surrogate cautious, even though a real catheter could be deliberately placed in a dependent zone-3 region; this is a limitation of the non-regional model, not a claim that PAWP is unobtainable in pulmonary embolism. The selected tachycardia, systemic resistance and filling describe compensation already present; the model baroreflex senses systemic MAP rather than embolus, PVR or mPAP directly. Positive pressure demonstrates vulnerability, not an individual intubation-risk estimate.

### Cardiac tamponade

**Question.** What happens when the four chambers must compete for a pericardial space that can no longer expand?

**Try.** Inspect pericardial pressure, CVP, RV and LV end-diastolic volume, output and the dashed pericardial ring. Then increase pericardial capacity from 100 to 430 mL and allow the circulation to settle.

**Read.** The constrained state raises a shared external pressure, brings the main diastolic pressures into a broad common range and restricts the lower-pressure RV proportionally more than the LV. Restoring capacity represents decompression: pericardial pressure and CVP fall while both ventricles refill and output rises. The capacity is not an effusion-volume estimate, and the scenario does not provide a calibrated pulsus-paradoxus threshold. See [cardiac tamponade](cardiac-tamponade.md) and [ventricular interdependence](ventricular-interdependence.md).

### LV failure

**Question.** Can positive intrathoracic pressure increase output when a failing left ventricle is more afterload-sensitive than preload-dependent?

**Try.** Start from the preset at PEEP 10, set PEEP to zero and allow the model to settle, then return PEEP to 10. Compare several respiratory cycles rather than one beat. Follow the LV pressure–volume loop, end-diastolic and end-systolic volume, pleural pressure and output.

**Read.** This is a deliberately severe, afterload-dominant phenotype with low LV contractility, high diastolic stiffness, high filling pressure and a stiff thoracic envelope. PEEP raises pleural pressure, reducing the [transmural pressure](transmural-pressure.md) required for LV ejection. End-diastolic volume falls slightly, but end-systolic volume falls more and respiratory-cycle-averaged output rises. This demonstrates one possible response; a more preload-dependent failing ventricle can show no gain or a fall.

The preset isolates that mechanical competition. It does **not** create hydrostatic pulmonary oedema from the high filling pressure and does not add the associated fall in lung compliance, loss of aerated volume, rise in airway resistance, gas-exchange impairment or compensatory respiratory drive. Those variables remain independently selectable so the same cardiac phenotype can be studied with different lungs and ventilatory patterns. The name therefore describes LV failure, not a complete cardiogenic-pulmonary-oedema syndrome.

### Stiff chest wall

**Question.** Why can the same delivered tidal volume create a much larger intrathoracic-pressure swing?

**Try.** First raise `Chest wall compliance` while holding tidal volume and PEEP constant. Then return to the preset and set `Chest wall load` to zero. These are different interventions.

**Read.** Low compliance makes the pleural-pressure swing larger for the same delivered volume. The positive wall load shifts resting pressure around the heart even before inspiration. The preset also includes raised abdominal pressure; it is a combined mechanical phenotype rather than a complete model of obesity. PPV is under caution in this setup. See [pleural pressure](pleural-pressure.md) and [the equation of motion](equation-of-motion.md).

### COPD with dynamic hyperinflation

**Question.** How do expiratory flow limitation, expiratory time and external PEEP interact?

**Try.** Slow respiratory rate, shorten inspiratory time, and compare external PEEP below and above the expiratory choke.

**Read.** Slower expiration reduces trapped gas, intrinsic PEEP and circulatory loading. High `clung` raises the relaxation volume through loss of recoil but no longer enlarges maximum capacity, which remains at the 6 L default. Below the choke, external PEEP mainly substitutes for intrinsic pressure; above it, total PEEP and lung volume rise and output falls. This is a qualitative waterfall demonstration, not a universal fraction-of-auto-PEEP titration rule. See [expiratory flow limitation](expiratory-flow-limitation.md) and [vascular waterfalls](vascular-waterfalls.md).

### Intra-abdominal hypertension

**Question.** How can abdominal pressure both mobilise upstream venous pressure and obstruct venous return?

**Try.** Change stressed volume at high abdominal pressure, then compare with normal abdominal pressure.

**Read.** A filled abdominal venous reservoir can transmit pressure into Pmsf, while the same abdominal pressure raises the critical pressure for caval collapse. The preset also applies a separate positive chest-wall load to represent diaphragmatic transmission into the thorax. Filling determines which circulatory effect dominates. The pressure transfer is selected, not calculated from anatomy, and the model uses one aggregate venous-return pathway without separate SVC and IVC flow. See [abdominal pressure](abdominal-pressure.md), [pleural pressure](pleural-pressure.md) and [venous return](venous-return.md).

## In the model

Selecting a scenario first restores `defaultParams()` and then applies that scenario's explicit overrides. It does not inherit controls from the previously selected preset, apply a scripted sequence or force an outcome after selection. The application opens with *Healthy, breathing spontaneously*, but that opening preset is not the baseline from which the other scenarios are built. The code reference is the passive volume-control default shown below. Touching any control changes the label to *Custom* because the patient no longer matches the preset.

The parameter sidebar marks every current setting that differs from this reference with a coloured dot and reports the total above the controls. The marks remain useful after the scenario label changes to *Custom*: they show which controls construct the present phenotype, not whether a value is abnormal or unsafe.

### Preset parameter changes

<!-- BEGIN GENERATED: scenario-overrides -->
*Generated directly from `defaultParams()` and `SCENARIOS`. The reference is the model's passive volume-control default, not the healthy spontaneous preset shown when the application opens.*

Only values that actually differ from the reference are listed. A preset may repeat an unchanged value in the source code to make its intended ventilation explicit; such repetitions are omitted here because they do not alter the simulated patient.

#### Healthy, breathing spontaneously

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | PEEP | 5 cmH₂O | 0 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 6.0 cmH₂O |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 850 mL |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 0.90 mmHg·s/mL |
| Cardiac function | RV contractility (Ees) | 0.58 mmHg/mL | 0.35 mmHg/mL |

#### Healthy, passive volume control

*No control differs from the model reference. This preset names the default passive volume-control state.*

#### PEEP escalation

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | PEEP | 5 cmH₂O | 14 cmH₂O |

#### Septic shock, fluid responsive

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 18 /min |
| Ventilation | Tidal volume | 450 mL | 560 mL |
| Ventilation | PEEP | 5 cmH₂O | 8 cmH₂O |
| Respiratory mechanics | Chest wall compliance | 200 mL/cmH₂O | 150 mL/cmH₂O |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 330 mL |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 0.85 mmHg·s/mL |
| Cardiac function | Baseline heart rate | 75 /min | 105 /min |
| Cardiac function | Baroreflex | Off | On |

#### Large pleural swings, limited preload reserve

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | Respiratory rate | 14 /min | 24 /min |
| Ventilation | PEEP | 5 cmH₂O | 6 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 22.0 cmH₂O |
| Respiratory mechanics | Aerated-lung compliance | 200 mL/cmH₂O | 60 mL/cmH₂O |
| Respiratory mechanics | Chest wall compliance | 200 mL/cmH₂O | 120 mL/cmH₂O |
| Respiratory mechanics | Airway resistance | 5.0 cmH₂O/L/s | 15.0 cmH₂O/L/s |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 1300 mL |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 0.75 mmHg·s/mL |
| Cardiac function | Baseline heart rate | 75 /min | 70 /min |

#### ARDS with right ventricular failure

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 24 /min |
| Ventilation | Tidal volume | 450 mL | 350 mL |
| Ventilation | PEEP | 5 cmH₂O | 12 cmH₂O |
| Respiratory mechanics | Aerated-lung compliance | 200 mL/cmH₂O | 25 mL/cmH₂O |
| Respiratory mechanics | Chest wall load | 0.0 cmH₂O | 10.0 cmH₂O |
| Respiratory mechanics | Collapsed lung | 0% | 42% |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 900 mL |
| Cardiac function | RV contractility (Ees) | 0.58 mmHg/mL | 0.26 mmHg/mL |
| Pulmonary circulation | Open-lung PVR at FRC | 0.07 mmHg·s/mL | 0.19 mmHg·s/mL |
| Respiratory mechanics | Recruitment-to-inflation ratio | 0.50 R/I | 0.70 R/I |
| Respiratory mechanics | Opening pressure | 20.0 cmH₂O | 15.5 cmH₂O |
| Pulmonary circulation | Hypoxic vasoconstriction | 1.0 × | 1.6 × |

#### Acute pulmonary embolism

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | Respiratory rate | 14 /min | 24 /min |
| Ventilation | PEEP | 5 cmH₂O | 0 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 6.0 cmH₂O |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 1050 mL |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 1.25 mmHg·s/mL |
| Cardiac function | Baseline heart rate | 75 /min | 118 /min |
| Cardiac function | RV contractility (Ees) | 0.58 mmHg/mL | 0.32 mmHg/mL |
| Pulmonary circulation | Open-lung PVR at FRC | 0.07 mmHg·s/mL | 0.44 mmHg·s/mL |

#### Cardiac tamponade

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | Respiratory rate | 14 /min | 20 /min |
| Ventilation | PEEP | 5 cmH₂O | 0 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 10.0 cmH₂O |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 1050 mL |
| Cardiac function | Baseline heart rate | 75 /min | 105 /min |
| Cardiac function | Pericardial constraint | 1.0 × | 4.0 × |
| Cardiac function | Pericardial capacity | 430 mL | 100 mL |

#### LV failure

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 18 /min |
| Ventilation | PEEP | 5 cmH₂O | 10 cmH₂O |
| Respiratory mechanics | Chest wall compliance | 200 mL/cmH₂O | 75 mL/cmH₂O |
| Volume & vascular tone | Baseline stressed volume | 700 mL | 1050 mL |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 1.25 mmHg·s/mL |
| Cardiac function | Baseline heart rate | 75 /min | 95 /min |
| Cardiac function | LV contractility (Ees) | 3.0 mmHg/mL | 0.6 mmHg/mL |
| Cardiac function | LV diastolic stiffness | 0.028 1/mL | 0.040 1/mL |

#### Stiff chest wall

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 16 /min |
| Ventilation | Tidal volume | 450 mL | 500 mL |
| Ventilation | PEEP | 5 cmH₂O | 8 cmH₂O |
| Respiratory mechanics | Chest wall compliance | 200 mL/cmH₂O | 75 mL/cmH₂O |
| Respiratory mechanics | Chest wall load | 0.0 cmH₂O | 6.0 cmH₂O |
| Respiratory mechanics | Baseline abdominal pressure | 4 cmH₂O | 12 cmH₂O |

#### COPD with dynamic hyperinflation

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 26 /min |
| Ventilation | Tidal volume | 450 mL | 500 mL |
| Ventilation | Inspiratory time | 1.20 s | 0.90 s |
| Respiratory mechanics | Aerated-lung compliance | 200 mL/cmH₂O | 300 mL/cmH₂O |
| Respiratory mechanics | Airway resistance | 5.0 cmH₂O/L/s | 24.0 cmH₂O/L/s |
| Respiratory mechanics | Expiratory flow limitation | Off | On |

#### Intra-abdominal hypertension

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 16 /min |
| Ventilation | PEEP | 5 cmH₂O | 8 cmH₂O |
| Respiratory mechanics | Chest wall load | 0.0 cmH₂O | 6.0 cmH₂O |
| Respiratory mechanics | Baseline abdominal pressure | 4 cmH₂O | 22 cmH₂O |
| Respiratory mechanics | Diaphragm–abdomen coupling | 4.0 cmH₂O/L | 6.0 cmH₂O/L |
<!-- END GENERATED: scenario-overrides -->

These tables describe how each starting phenotype is assembled, not what every control means or what outcome it guarantees. The control pages explain the mechanisms in more detail: [ventilation](controls-ventilation.md), [respiratory mechanics](controls-mechanics.md), [volume and vascular tone](controls-volume.md), [heart](controls-heart.md) and [pulmonary circulation](controls-pulmonary.md).

Two presets have an explicit intervention contract beyond their settled snapshot. In LV failure, the PEEP 0-to-10 comparison requires mean output to rise, LV transmural end-systolic pressure to fall, and end-systolic volume to fall more than end-diastolic volume. In cardiac tamponade, restoring pericardial capacity must lower pericardial pressure and CVP, increase pressure and output, and restore proportionally more RV than LV end-diastolic volume. These conditions distinguish the proposed mechanisms from a plausible-looking resting state.

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
- Fougères E, Teboul JL, Richard C, et al. Haemodynamic impact of a positive end-expiratory pressure setting in acute respiratory distress syndrome. *Crit Care Med*. 2010;38:802–807. [doi:10.1097/CCM.0b013e3181c587fd](https://doi.org/10.1097/CCM.0b013e3181c587fd)
- Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of volume expansion on mean systemic pressure in septic shock. *Crit Care*. 2021;25:302. <https://doi.org/10.1186/s13054-021-03711-5>
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med*. 2024;210:900–907. <https://doi.org/10.1164/rccm.202402-0383OC>
- Talmor D, Sarge T, O'Donnell CR, et al. Esophageal and transpulmonary pressures in acute respiratory failure. *Crit Care Med*. 2006;34:1389–1394. <https://doi.org/10.1097/01.CCM.0000215515.49001.A2>
- Vieillard-Baron A, Charron C, Caille V, et al. Prone positioning unloads the right ventricle in severe ARDS. *Chest*. 2007;132:1440–1446. <https://doi.org/10.1378/chest.07-1013>
- Ranieri VM, Dambrosio M, Brienza N. Intrinsic PEEP and cardiopulmonary interaction in patients with COPD and acute ventilatory failure. *Eur Respir J*. 1996;9:1283–1292. [doi:10.1183/09031936.96.09061283](https://doi.org/10.1183/09031936.96.09061283)
- Schulz-Menger J, Collini V, Gröschel J, et al. 2025 ESC Guidelines for the management of myocarditis and pericarditis. *Eur Heart J*. 2025;46:3952–4041. <https://doi.org/10.1093/eurheartj/ehaf192>

## See also

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Transmural pressure](transmural-pressure.md) · [Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Interpretability](interpretability.md) · [Global limits](global-limits.md)
