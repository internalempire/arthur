# Clinical scenarios
> All clinical presets, the question each asks, and the limits of the answer.

The presets are not miniature patient records and they do not predict treatment response. Each is a settled phenotype chosen to make one heart–lung interaction easy to interrogate. Use the preset to establish the starting state, allow repeating breaths to settle, then press **Pin** and change one control. Watch both the first breaths and the later repeating pattern. Current values stay large in the tiles; the selected reference continues evolving underneath. Reselect the named preset before a fresh baseline: **Reset** in *Custom* retains your settings and applied blood. Ask whether the causal chain visible in the panels matches the question below. The exact controls that construct every phenotype are listed under [preset parameter changes](#preset-parameter-changes).

## Physiology

### Healthy spontaneous breathing

**Question.** How can measured central venous pressure fall during inspiration while right-heart filling rises?

**Try.** Compare inspiratory and expiratory CVP, then compare measured CVP with transmural CVP.

**Read.** Negative [pleural pressure](pleural-pressure.md) lowers the pressure measured relative to atmosphere while increasing the pressure gradient for [venous return](venous-return.md). The rise in venous inflow is a respiratory-phase effect; it does not imply an immediate equal increase in LV output. PPV is unavailable because the patient is breathing spontaneously. The preset starts with a normal-range tidal volume, arterial and pulmonary pressures, output and RV ejection, just beyond the model's steep preload limb; this keeps the landing state neutral and does not imply that a healthy person can never increase output after additional filling.

### Healthy passive volume control

**Question.** What reverses when the ventilator, rather than the respiratory muscles, generates inspiration?

**Try.** Observe inspiratory pleural pressure, measured CVP and the Guyton venous-inflow trail. Compare their direction with spontaneous inspiration.

**Read.** Positive pleural pressure raises measured intrathoracic vascular pressure and transiently opposes venous return. Aortic flow can briefly rise as inflation displaces pulmonary blood, while pulmonary storage buffers and spreads the serial response to changing right-heart output. See [pulmonary transit](pulmonary-transit.md); it is not a strict waiting period before any LV change.

**Boundary.** The healthy spontaneous preset also changes starting blood volume, systemic resistance and RV contractility. A difference between their settled outputs cannot be attributed to ventilation alone. A controlled intervention must keep those settings fixed.

### PEEP escalation

**Question.** Why can PEEP raise both CVP and mean systemic filling pressure while cardiac output still falls?

**Try.** This preset starts at PEEP 14 cmH₂O. First set PEEP to 5, let the state settle and press **Pin**. Return PEEP to 14 and follow CVP, transmural CVP, Pmsf, the venous-return gradient and the Guyton operating point.

**Read.** PEEP raises the pressure surrounding the right atrium, but abdominal transmission can also raise upstream systemic venous pressure. Flow depends on the effective gradient and the resistance to return, not on either pressure alone. The size of the response is illustrative and depends on filling, pressure transmission and pulmonary vascular load.

### Septic shock, fluid responsive

**Question.** Can an apparently survivable arterial pressure conceal low effective filling?

**Try.** Pin the settled preset, select +500 mL in **Blood volume change** and press **Apply** once. The selector returns to zero while total blood and cumulative balance retain the addition. Compare the settled output and Pmsf, then reselect the preset and switch the baroreflex off as a separate experiment.

**Read.** Added blood enters the systemic venous reservoir and redistributes through the closed circulation. It raises the pressure-generating [stressed volume](stressed-volume.md), Pmsf and output in this underfilled state because the operating point has preload reserve. Removing the aggregate [baroreflex](baroreflex.md) exposes the pressure and flow that the selected circulation would generate without compensation. The fluid step and reflex coefficients are teaching choices, not resuscitation targets.

### Large pleural swings, limited preload reserve

**Question.** Why is a large pleural-pressure swing not itself evidence of preload responsiveness?

**Try.** Observe the pleural swing, the moving venous-inflow path and the highlighted steep segment of the RV-function curve. Read the RV preload-reserve tile, then inspect the PPV interpretability warning.

**Read.** The preset is spontaneously breathing, so PPV is withheld even though an internal waveform variation exists. Vigorous effort acts against a moderately stiff, resistive respiratory system: pleural pressure changes substantially while tidal volume remains within a plausible teaching range. The local preload reserve nevertheless remains below the model's steep-limb threshold. Transmitted pressure, respiratory load and position on the filling curve are different quantities; do not use the hidden PPV value as the demonstration.

<!-- BEGIN GENERATED: swing-scenario -->
*Executable preset output after 45 s of settling.*

| inspiratory effort (cmH₂O) | delivered VT (mL) | minute ventilation (L/min) | pleural swing (cmH₂O) | preload reserve (% output/mmHg) |
|---:|---:|---:|---:|---:|
| 22 | 452 | 10.8 | 17.9 | 6.4 |
<!-- END GENERATED: swing-scenario -->

### ARDS with right ventricular failure

**Question.** How does recruitability change the balance between opening lung and loading the right ventricle?

**Try.** Pin the settled starting state at PEEP 12. Increase PEEP in small steps and follow opening and output together. At the chosen higher PEEP, create a second pin before selecting **Non-reopenable**, keeping compromised fraction, tissue compliance, capacity and cardiac controls unchanged. This separates the effect of raising PEEP from the effect of opening potential at the same PEEP. Prone positioning is a separate comparison.

**Read.** In the recruiter, added pressure opens units and shares gas among more aerated lung; in the non-recruiter, the same pressure mainly distends the remaining open lung. The preset leaves maximum lung capacity at the 6 L default: collapse makes the accessible baby lung smaller, while reduced aerated-lung compliance independently makes its open tissue less compliant. A separate supine thoracic load shifts resting pleural pressure without changing chest-wall compliance. Follow end-expiratory Ppl and PL, plateau pressure, closed fraction at end expiration and opening excursion, derived PVR, its wedge-dependent quality badge, RV/LV ratio, septal interaction and output together. Extreme PEEP can still generate plateau pressures outside a useful quantitative range and can invalidate the catheter interpretation of the wedge surrogate; prone response is directional rather than patient-specific. See [lung opening profiles](recruitment-and-ri.md), [pulmonary vascular resistance](pulmonary-vascular-resistance.md), [pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) and [ventricular interdependence](ventricular-interdependence.md).

The preset uses pressure-dependent opening without memory. Its potential reopenable share and opening midpoint are listed in the generated settings below. Scenario tests constrain end-expiratory Ppl and PL, EELV, plateau pressure, model-computed respiratory-system compliance, filling pressures and the RV phenotype together. Preserving one opening parameter alone is insufficient for validation. At high PEEP the recruitable example has less RV loading than the non-reopenable example, but its output is still lower than its own baseline. Opening does not guarantee an increase in output. The high-PEEP row below is a mechanistic stress test, not a recommended ventilator setting.

<!-- BEGIN GENERATED: ards-scenario -->
*Executable preset outputs after 45 s of settling. End-expiratory Ppl is read from the selected chest-wall relation at measured EELV; PL is total PEEP minus that pressure.*

| state | EELV (L) | end-expiratory Ppl / PL (cmH₂O) | plateau (cmH₂O) | closed at end expiration | open lung (instantaneous) | derived PVR (WU) | RV/LV | CO (L/min) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| recruitable baseline | 0.94 | -1.4 / 13.4 | 19.6 | 41.1% | 59% | 5.3 | 1.72 | 4.00 |
| recruitable, high PEEP | 1.30 | 0.4 / 19.6 | 41.0 | 25.7% | 74% | 5.8 | 1.77 | 3.78 |
| non-reopenable, high PEEP | 1.03 | -0.9 / 20.9 | 46.6 | 42.0% | 58% | 7.2 | 1.97 | 3.50 |
<!-- END GENERATED: ards-scenario -->

### Acute pulmonary embolism

**Question.** What happens when a normal mechanical lung is coupled to a high pulmonary vascular load and a vulnerable right ventricle?

**Try.** Inspect the high mPAP, low wedge surrogate, high model hydraulic gradient and RV dilatation; then select **Volume control**, set **Inspiratory effort** to zero, settle and Pin before raising PEEP. Watch the wedge and derived-PVR caution badges rather than treating the displayed arithmetic as a valid catheter classification.

**Read.** The preset uses one effective aggregate pulmonary load. It does not separate clot obstruction, calibre, viscosity, vasomotor tone or critical closing pressure. During spontaneous breathing the atmospheric CVP is only about 3 mmHg, while transmural right-atrial pressure is higher because pleural pressure is negative; it is therefore incorrect to describe the displayed CVP simply as “high”. The low downstream pressure also makes the aggregate zone-3 surrogate cautious, even though a real catheter could be deliberately placed in a dependent zone-3 region; this is a limitation of the non-regional model, not a claim that PAWP is unobtainable in pulmonary embolism. The selected tachycardia, systemic resistance and filling describe compensation already present; the model baroreflex senses systemic MAP rather than embolus, PVR or mPAP directly. Positive pressure demonstrates vulnerability, not an individual intubation-risk estimate.

### Cardiac tamponade

**Question.** What happens when the four chambers must compete for a pericardial space that increasingly opposes expansion?

**Try.** Inspect pericardial pressure, CVP, RV and LV end-diastolic volume, output and the dashed pericardial ring. Then increase pericardial capacity from 100 to 430 mL and allow the circulation to settle.

**Read.** The constrained state raises a shared external pressure, brings the main diastolic pressures into a broad common range and restricts the lower-pressure RV proportionally more than the LV. Restoring capacity represents decompression: pericardial pressure and CVP fall while both ventricles refill and output rises. The capacity is not an effusion-volume estimate, and the scenario does not provide a calibrated pulsus-paradoxus threshold. See [cardiac tamponade](cardiac-tamponade.md) and [ventricular interdependence](ventricular-interdependence.md).

### LV failure

**Question.** Does reducing LV transmural ejection pressure necessarily increase cardiac output?

**Try.** Start from the preset at PEEP 10, set PEEP to zero and allow the model to settle, press **Pin**, then return PEEP to 10. Compare several respiratory cycles rather than one beat. Follow the LV pressure–volume loop, end-diastolic and end-systolic volume, pleural pressure and output.

**Read.** Low LV contractility and elevated filling pressure coexist with reduced EF. PEEP raises pleural pressure and lowers transmural ejection pressure, but reduced filling lowers forward output in this preset. The clinical lesson is the competition between unloading and loss of filling; pressure unloading alone does not establish improved pumping.

Read filling pressure with its reference explicit: atmospheric atrial pressure includes the pressure surrounding the chamber, whereas transmural pressure subtracts pleural and pericardial pressure. A higher measured CVP therefore need not mean greater right-heart filling. At settled PEEP levels, blood can redistribute from pulmonary vessels and cardiac chambers into systemic veins without any loss of total blood volume. Lower LV ejection pressure also does not guarantee lower net pressure–volume work: the area of the loop depends on both ejection and filling. Myocardial oxygen consumption is not represented. See [transmural pressure](transmural-pressure.md) and [ventriculo-arterial coupling](ventriculo-arterial-coupling.md).

The preset isolates that mechanical competition. It does **not** create hydrostatic pulmonary oedema from the high filling pressure and does not add the associated fall in lung compliance, loss of aerated volume, rise in airway resistance, gas-exchange impairment or compensatory respiratory drive. Those variables remain independently selectable so the same cardiac phenotype can be studied with different lungs and ventilatory patterns. The name therefore describes LV failure, not a complete cardiogenic-pulmonary-oedema syndrome.

**Distinguish timing from mechanism.** A PEEP step can temporarily raise aortic flow while right-heart output is falling. Pulmonary blood displacement and transit contribute, so the early rise cannot be assigned to LV unloading alone. Once the circulation settles, filling and emptying must be assessed together. This preset does not demonstrate a sustained output benefit from PEEP.

**Relation to clinical observations.** In a small study of spontaneously breathing patients with heart failure, CPAP increased output in the subgroup with higher baseline wedge pressure; patients with lower wedge pressure and healthy controls had a different response. Another study found lower transmural LV systolic pressure with maintained output in heart failure. Those observations support competing loading effects, not a universal rule that PEEP raises output. The preset is passive volume control, and has no automatic change in effort, oedema or gas exchange; its conditions are not the clinical CPAP protocols. See De Hoyos and Naughton in the references.

**Less filling is not automatically worse.** Relief of excessive filling pressure can be clinically useful, and maintaining output at a lower pressure burden is a different useful result from increasing output. Judge congestion, ejection load and forward flow separately. A single move to lower filling pressure does not establish an improved cardiac-function curve: that requires comparing flow at matched filling pressure, or the filling pressure needed for matched flow, with the same pressure reference. At whole-circuit steady state mean venous return equals mean cardiac output; a transient reduction in inflow and a maintained or increased LV output can coexist while blood redistributes. The [Guyton panel](panel-guyton.md) uses atmospheric right atrial pressure and a fast local RV-function relation by default. Its optional Deep CO mode measures a whole-heart response at the LV outlet. Curve position combines the represented loading effects and does not, by itself, measure a change in intrinsic LV contractility.

### Stiff chest wall

**Question.** Why can the same delivered tidal volume create a much larger intrathoracic-pressure swing?

**Try.** Pin the preset and raise **Chest wall compliance** from 75 to 200 mL/cmH₂O while holding tidal volume and PEEP constant. Reselect the preset, Pin again and set **Chest wall load** from 6 to zero cmH₂O. These are different interventions.

**Read.** Low compliance makes the pleural-pressure swing larger for the same delivered volume. The positive wall load shifts resting pressure around the heart even before inspiration. The preset also includes raised abdominal pressure; it is a combined mechanical phenotype rather than a complete model of obesity. PPV is under caution in this setup. See [pleural pressure](pleural-pressure.md) and [the equation of motion](equation-of-motion.md).

### COPD with dynamic hyperinflation

**Question.** How do expiratory flow limitation, expiratory time and external PEEP interact?

**Try.** Pin the settled preset, then lower respiratory rate from 26 to 12/min while holding inspiratory time fixed. Observe the expiratory volume decline, trapped volume, total PEEP, pleural pressure and output. Reselect the preset before a separate external-PEEP comparison: first 0 versus 5 cmH₂O, then higher steps while watching whether total PEEP and EELV begin rising.

**Read.** More time available for expiration allows additional emptying and reduces trapped gas, intrinsic PEEP and circulatory loading. High aerated-lung compliance raises the relaxation volume through loss of recoil while maximum capacity is independently set at the 6 L default. Below the choke, external PEEP mainly substitutes for intrinsic pressure; above it, total PEEP and lung volume rise and output falls. This is a qualitative waterfall demonstration, not a universal fraction-of-auto-PEEP titration rule. See [expiratory flow limitation](expiratory-flow-limitation.md) and [vascular waterfalls](vascular-waterfalls.md).

### Intra-abdominal hypertension

**Question.** How can abdominal pressure both mobilise upstream venous pressure and obstruct venous return?

**Try.** Pin the preset, then reduce **Baseline abdominal pressure** while holding blood volume and chest-wall load fixed. Follow Pmsf, CVP, the caval waterfall and output. Reselect the preset before testing a blood addition or removal at its original abdominal pressure.

**Read.** A filled abdominal venous reservoir can transmit pressure into Pmsf, while the same abdominal pressure raises the critical pressure for caval collapse. The preset also applies a separate positive chest-wall load to represent diaphragmatic transmission into the thorax. Changing abdominal pressure alone does not remove the separately prescribed chest-wall load; this isolates one pathway rather than simulating a complete abdominal decompression. Filling determines which circulatory effect dominates. The pressure transfer is selected, not calculated from anatomy, and the model uses one aggregate venous-return pathway without separate SVC and IVC flow. See [abdominal pressure](abdominal-pressure.md), [pleural pressure](pleural-pressure.md) and [venous return](venous-return.md).

## In the model

Selecting a scenario starts from a shared neutral parameter set and applies the settings listed below. It does not inherit controls from the previously selected preset, apply a scripted sequence or force an outcome after selection. The application opens with *Healthy, breathing spontaneously*, but that opening preset is not the baseline from which the other scenarios are built. The comparison reference is the passive volume-control parameter set shown below. Applying a physiological setting changes the label to *Custom*. Preparing a blood dose, changing playback speed or selecting a panel does not alter the phenotype.

The parameter sidebar marks every current setting that differs from this reference with a coloured dot and reports the total above the controls. The marks remain useful after the scenario label changes to *Custom*: they show which controls construct the present phenotype, not whether a value is abnormal or unsafe.

Each loaded scenario starts with the **Blood volume change** selector at 0 mL and zero cumulative blood added/removed relative to its own starting patient volume. Where presets differ in blood volume, the table reports the **starting total blood volume in litres**, calculated by summing the compartments. That quantity can differ from the model reference while the intervention control reads zero.

### Preset parameter changes

<!-- BEGIN GENERATED: scenario-overrides -->
*Generated from the current scenario definitions. The comparison reference is the neutral passive volume-control parameter set; it is not the healthy spontaneous preset shown when the application opens.*

Only values that actually differ from the reference are listed. A preset may repeat an unchanged value in the source code to make its intended ventilation explicit; such repetitions are omitted here because they do not alter the simulated patient.

#### Healthy, breathing spontaneously

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | PEEP | 5 cmH₂O | 0 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 6.0 cmH₂O |
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.23 L |
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
| Volume & vascular tone | Starting total blood volume | 5.08 L | 4.71 L |
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
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.68 L |
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
| Respiratory mechanics | Compromised lung | 0.0% | 42.0% |
| Respiratory mechanics | Opening profile | Non-reopenable | Reopenable, no memory |
| Respiratory mechanics | Reopenable share of compromised lung | 0.0% | 38.9% |
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.28 L |
| Cardiac function | RV contractility (Ees) | 0.58 mmHg/mL | 0.26 mmHg/mL |
| Pulmonary circulation | Open-lung PVR at FRC | 0.07 mmHg·s/mL | 0.19 mmHg·s/mL |
| Respiratory mechanics | Opening midpoint (transpulmonary) | 20.0 cmH₂O | 15.5 cmH₂O |
| Pulmonary circulation | Hypoxic vasoconstriction | 1.0 × | 1.6 × |

#### Acute pulmonary embolism

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Ventilatory mode | Volume control | Spontaneous |
| Ventilation | Respiratory rate | 14 /min | 24 /min |
| Ventilation | PEEP | 5 cmH₂O | 0 cmH₂O |
| Ventilation | Inspiratory effort | 0.0 cmH₂O | 6.0 cmH₂O |
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.43 L |
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
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.43 L |
| Cardiac function | Baseline heart rate | 75 /min | 105 /min |
| Cardiac function | Pericardial constraint | 1.0 × | 4.0 × |
| Cardiac function | Pericardial capacity | 430 mL | 100 mL |

#### LV failure

| domain | control | model reference | preset value |
|---|---|---:|---:|
| Ventilation | Respiratory rate | 14 /min | 18 /min |
| Ventilation | PEEP | 5 cmH₂O | 10 cmH₂O |
| Respiratory mechanics | Chest wall compliance | 200 mL/cmH₂O | 75 mL/cmH₂O |
| Volume & vascular tone | Starting total blood volume | 5.08 L | 5.43 L |
| Volume & vascular tone | Systemic vascular resistance | 1.05 mmHg·s/mL | 1.25 mmHg·s/mL |
| Cardiac function | Baseline heart rate | 75 /min | 95 /min |
| Cardiac function | LV contractility (Ees) | 3.0 mmHg/mL | 0.6 mmHg/mL |
| Cardiac function | LV diastolic stiffness | 0.028 1/mL | 0.027 1/mL |

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

The LV-failure intervention requires valid cardiac phases, elevated filling pressure, reduced EF, lower transmural ejection pressure and lower filling with PEEP; its modest fall in integrated forward output is part of that explicit contract. In cardiac tamponade, restoring pericardial capacity must lower pericardial pressure and CVP, increase pressure and output, and restore proportionally more RV than LV end-diastolic volume.

Weaning-induced pulmonary oedema is outside the available scenario set. The model shows mechanical breathing loads, aggregate MAP-driven compensation and intravascular redistribution. It omits their metabolic cost, syndrome-specific respiratory and autonomic drive, myocardial oxygen demand, ischaemia, dynamic mitral regurgitation, extravascular fluid transfer and time-dependent pulmonary oedema. Its mechanical response to removing positive pressure cannot represent the complete syndrome.

## Why presets and not scripted cases

A preset should expose a mechanism already present in the equations. A button that directly writes the expected output would make the lesson impossible to falsify. The scenarios therefore define starting phenotypes and proposed manoeuvres, while the circulation and respiratory model determine the response.

The same rule explains why numerical matching is selective. Human in-vivo data constrain the ARDS PVR–recruitability interaction and the COPD waterfall direction. Many other coefficients were selected to make a known qualitative relation visible and are not attributed to a paper as though they were measured human constants.

## Limits

No preset is a diagnosis, a treatment recommendation or a claim that the selected numbers commonly coexist. The values are internally consistent outputs from a compact closed-loop model, not reference ranges for an individual patient.

The scenarios omit gas exchange, hypoxaemia, hypercapnia, acid–base effects, coronary perfusion, myocardial oxygen balance, renal and capillary fluid kinetics, regional ventilation and perfusion, vasoactive drug doses and most disease time courses. A preset can therefore teach a mechanical heart–lung interaction while remaining unable to reproduce the full clinical syndrome named in its title.

Dynamic indices retain their own validity conditions inside a preset. A displayed or internally calculated number is not automatically interpretable because the starting phenotype has a clinical name. Follow the warning attached to the index and see [interpretability](interpretability.md).

## Validation

Every active preset has a volume-conservation, compartment-positivity and snapshot check. [The scenario validation audit](../docs/SCENARIO_VALIDATION.md) adds a separate contract for the teaching manoeuvre and classifies each preset as supported, qualified or needing correction. A green test means that the current implementation still agrees with the documented claim; it does not make the claim a validated clinical prediction.

Published manoeuvre constraints live in [the literature ranges](../docs/LITERATURE_RANGES.md). Dated development decisions are recorded separately in [the model decision log](../docs/MODEL_DECISIONS.md).

## References

- De Hoyos A, Liu PP, Benard DC, Bradley TD. Haemodynamic effects of continuous positive airway pressure in humans with normal and impaired left ventricular function. *Clin Sci*. 1995;88:173–178. [doi:10.1042/cs0880173](https://doi.org/10.1042/cs0880173) — 16 patients with heart failure and 5 controls; CPAP 5 and 10 cmH₂O, measured after 10 minutes at each pressure.
- Naughton MT, Rahman MA, Hara K, et al. Effect of continuous positive airway pressure on intrathoracic and left ventricular transmural pressures in patients with congestive heart failure. *Circulation*. 1995;91:1725–1731. [doi:10.1161/01.CIR.91.6.1725](https://doi.org/10.1161/01.CIR.91.6.1725) — 15 patients with heart failure and 9 healthy subjects; graduated CPAP up to 10 cmH₂O, with oesophageal pressure as the intrathoracic-pressure estimate.

- Buda AJ, Pinsky MR, Ingels NB Jr, et al. Effect of intrathoracic pressure on left ventricular performance. *N Engl J Med*. 1979;301:453–459. [doi:10.1056/NEJM197908303010901](https://doi.org/10.1056/NEJM197908303010901)
- Fougères E, Teboul JL, Richard C, et al. Haemodynamic impact of a positive end-expiratory pressure setting in acute respiratory distress syndrome. *Crit Care Med*. 2010;38:802–807. [doi:10.1097/CCM.0b013e3181c587fd](https://doi.org/10.1097/CCM.0b013e3181c587fd)
- Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of volume expansion on mean systemic pressure in septic shock. *Crit Care*. 2021;25:302. [doi:10.1186/s13054-021-03711-5](https://doi.org/10.1186/s13054-021-03711-5)
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med*. 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC)
- Talmor D, Sarge T, O'Donnell CR, et al. Esophageal and transpulmonary pressures in acute respiratory failure. *Crit Care Med*. 2006;34:1389–1394. [Article DOI](https://doi.org/10.1097/01.CCM.0000215515.49001.A2)
- Vieillard-Baron A, Charron C, Caille V, et al. Prone positioning unloads the right ventricle in severe ARDS. *Chest*. 2007;132:1440–1446. [doi:10.1378/chest.07-1013](https://doi.org/10.1378/chest.07-1013)
- Ranieri VM, Dambrosio M, Brienza N. Intrinsic PEEP and cardiopulmonary interaction in patients with COPD and acute ventilatory failure. *Eur Respir J*. 1996;9:1283–1292. [doi:10.1183/09031936.96.09061283](https://doi.org/10.1183/09031936.96.09061283)
- Schulz-Menger J, Collini V, Gröschel J, et al. 2025 ESC Guidelines for the management of myocarditis and pericarditis. *Eur Heart J*. 2025;46:3952–4041. [doi:10.1093/eurheartj/ehaf192](https://doi.org/10.1093/eurheartj/ehaf192)

## See also

[The four effects of a breath](the-four-effects-of-a-breath.md) · [Transmural pressure](transmural-pressure.md) · [Venous return](venous-return.md) · [Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Interpretability](interpretability.md) · [Global limits](global-limits.md)
