# The model

What the simulator computes, why it is built this way, and where it stops being
trustworthy.

Notation follows the sources: respiratory pressures in cmH₂O, vascular pressures
in mmHg, converted at 1 mmHg = 1.3595 cmH₂O in `src/model/units.js`.

---

## The model itself

The README is the project overview. Clinician-facing physiology, implementation
choices and limits live in the [web manual](../manual/home.md); the code and
executable tests remain the source of truth for exact equations and numerical
contracts. Keeping several prose copies of exact numbers is how earlier versions
of this file drifted from the model.

This technical overview summarises current assumptions, their teaching purpose and their evidential limits. It complements rather than replaces the clinician-facing manual. Dated development decisions are kept in [MODEL_DECISIONS.md](MODEL_DECISIONS.md); corrections are recorded in [HANDOVER.md](HANDOVER.md).

Tests constrain conservation, numerical convergence, selected physiological directions and agreement between the solver, displayed constructions and generated documentation. They do not establish clinical predictive accuracy. See [validation](../manual/validation.md) for the distinction between an internally correct result and an externally supported effect size.

## 1. Reference state and evidence

The neutral parameter set is passive volume control, VT 450 mL, PEEP 5 cmH₂O and respiratory rate 14/min, with the baroreflex off. The application opens on the separate **Healthy, breathing spontaneously** preset. That preset also changes blood volume, systemic resistance and RV contractility; comparing their settled outputs cannot isolate ventilation mode.

Current outputs, complete scenario settings and matched interventions are generated directly from the model in [clinical scenarios](../manual/scenarios.md), [transmural pressure](../manual/transmural-pressure.md), [venous return](../manual/venous-return.md) and [expiratory flow limitation](../manual/expiratory-flow-limitation.md). They are not duplicated as hand-maintained calibration numbers here. In particular, the internal PVR coefficient is not a catheter-derived PVR, and the reservoir-based Pmsf is not an independently measured human zero-flow pressure.

The teaching relationships checked include:

- Raising PEEP can raise both atmospheric CVP and upstream venous pressure while reducing flow. Abdominal transmission can partly preserve the gradient; filling, resistance to return, pulmonary loading and ventricular reserve determine the net result.
- Spontaneous inspiration lowers atmospheric CVP and can increase venous inflow. LV output need not rise at the same instant: pulmonary storage, transit and ventricular interaction separate the responses.
- Adding blood to an underfilled circulation increases output more than adding the same amount on its flatter filling-response limb. This does not validate a clinical fluid dose or PPV cutoff.
- The ARDS/RV phenotype is checked jointly against respiratory pressures, volume, compliance, filling pressures and RV loading. At the same high PEEP, its reopenable component reduces the pulmonary vascular and RV cost relative to a non-reopenable component. This is distinct from claiming that raising PEEP increases output from its own baseline.
- In the COPD example, longer available expiratory time reduces trapping. External PEEP below the represented choke mainly substitutes for intrinsic PEEP; above it, total PEEP and lung volume rise. The threshold is a model property, not a patient-specific titration rule.
- High abdominal pressure can raise the upstream pressure estimate while restricting caval return. The independent chest-wall load is a separate prescribed pathway.

Published physiology supports these mechanisms under defined conditions. The small clinical studies and experimental preparations cited below do not jointly validate every coefficient, phenotype or combination of controls. [Scenario evidence](SCENARIO_VALIDATION.md) states those boundaries for each preset.

---

## 2. The lung and chest wall are independent elastic elements

The normal reference is calibrated to 2.2 L, where lung recoil is +5 cmH₂O and
relaxed wall recoil is −5 cmH₂O. That normal reference does not define the equilibrium of every lung
phenotype. The wall has its own sigmoid pressure–volume relation: approximately
linear around tidal breathing, with progressive stiffening toward the volume
extremes. Passive volume is solved from the point at which lung and wall recoil
are equal and opposite.

The lung and wall intersect at a volume determined by both structures. A collapsed, stiff
lung meets the unchanged wall at a lower volume and a higher transpulmonary
pressure. A lung with lost recoil meets it higher. Neither result is supplied as
an FRC input. The `ccw` control changes local wall slope; the separate `cwLoad`
control shifts the relaxed curve and resting pressure. The obesity and abdominal-
hypertension presets can therefore contain stiffness and load without treating
them as the same lesion.

The implementation deliberately stops at one aggregate wall. It has no rib-
cage/diaphragm separation, pleural gradient or anthropometric load prediction.
Rahn et al. and Agostoni and Hyatt establish the independent relaxation-curve
construction; Pereira et al. support a sigmoid representation in mechanically
ventilated acute respiratory failure. These sources support the topology, not
the model's remote asymptotes as universal human constants.

## 3. Volume, venous tone and compliance are separate

The internal `stressedVolume` prescription sets the initial amount above the
systemic venous zero-pressure volume. It is an internal initial-volume prescription, not a direct measurement of current whole-circuit stressed blood.
The UI prepares a **Blood volume change** dose; only pressing Apply or Remove
adds or removes actual blood one-for-one. The selector returns to zero after
application. A separate cumulative balance uses the stored starting-patient
reference, while Pin compares actual total blood rather than a pending dose.
The current total is independently summed across all ten blood compartments and displayed in litres. The reference is presentation metadata:
changing it cannot alter pressure, volume or flow. Scenario selection establishes
its own zero, Custom reset and Pin retain it, and version-2 files save it as
optional metadata; older files use their prescribed volume as zero.

The sidebar shows actual systemic reservoir blood, current V₀ (unstressed volume), their difference (stressed volume), and separate manual/reflex reductions in V₀. The user-facing **Venous tone effect** remains the existing `venousCapacityReduction` parameter; IDs, range and saved files are unchanged. Observations include edits while paused without integrating or settling another circulation.

The stressed percentage is current systemic venous stressed volume divided by
current systemic venous blood volume, excluding IVC and all other compartments.
It follows redistribution and is never used as feedback. An impossible fraction
is unavailable. Sidebar observations use current controls/state even during
historical waveform inspection and respond to paused volume/capacity edits.

The independent `venousCapacityReduction` control shifts the systemic venous
zero-transmural-pressure volume, whose neutral value is 2,750 mL (the separate
IVC conduit has another 50 mL). Positive settings reduce capacity, negative
settings increase it: −200 to +200 mL in 25 mL steps, default zero. Actual blood
volume and the selected compliance are unchanged. The optional baroreflex adds
200 mL per unit of bounded sympathetic outflow (−0.25 to 1), so its contribution
ranges from −50 to +200 mL. Disabling it removes only that contribution.

The elastic component of mean systemic filling pressure is current stressed
volume divided by compliance; abdominal pressure contributes separately.
At equal compliance, adding a volume to the reservoir and reducing its capacity
by the same amount yield the same elastic pressure. Their full pressure/flow
trajectories can coincide under this aggregate law outside donor-volume limits,
while total blood differs. This symmetry is intentional, not a therapeutic
comparison. Returning capacity to zero restores the pressure-volume relation;
redistribution from the preceding intervention resolves dynamically.

Human septic-shock data support a fluid-like effect of venoconstriction, but
norepinephrine also changes resistance and cardiac loading. Neither the manual
range nor the reflex coefficient is a calibrated human dose-response or reserve.
Pin copies the capacity setting and full state; version-2 patient files retain
the setting, with absent values defaulting to zero. Deep CO freezes the combined
manual-plus-reflex shift once. The independent control adds only algebra, with
no new dynamic state, compartment, worker or integration pass.

---

## 4. Pulmonary transit is a volume-to-flow relation, not a pressure delay

The pulmonary artery and vein are pressure-bearing compartments in series with an eight-stage, pressureless blood-transport pathway. Its initial 160 mL is included in conserved total blood. It buffers the transmission of changes in flow without imposing the same delay on pressure.

Mean PA-to-LA transit is estimated from the central-volume relation:

`mean transit time = represented pulmonary blood volume / mean RV output`.

Represented pulmonary blood volume is the sum of the PA, staged pathway and PV
compartments. The integrated pulmonic volume divided by the measured completed-beat duration supplies a
mean forward flow without treating the normal zero pulmonic-valve flow of
diastole as circulatory arrest. The eight stages use the share of whole-circuit
time corresponding to their original 160 mL allocation, bounded to 0.8–6 s and
adapted over 2 s to prevent respiratory beat-to-beat aliasing.

This distinction matters. Pulmonary venous pressure still acts immediately on
the pressure gradient across the lung; a pressure wave is not held back with the
blood volume.
What is buffered is blood flow: in the reference experiment, after an isolated fall in RV contractility the
first LV beat remains essentially unchanged, the second changes little, and the
effect becomes detectable over the next two to three beats. In the tested passive reference, the delayed LV stroke-volume nadir occurs in expiration. Other heart rates, respiratory periods and pulmonary storage states can change this timing; the staged pathway does not impose a universal beat count or strict dead time.

The transport pathway stores actual blood already included in total circulating volume. The separate pulmonary venous “piston” remains active: inflation can displace blood already on the venous side toward the LV before the change in RV output arrives. Eight stages disperse the flow signal rather than producing a rigid delayed copy. Their response shortens when flow is high relative to represented pulmonary volume and lengthens when flow is low. The whole-circuit volume/flow estimate and the staged delay are different quantities; neither is the time to an identical visible fall in LV output under every intervention.

The displayed whole-circuit value is still a model estimate, not a contrast
transit measurement. Measurement landmarks matter: an RV-to-LV CMR bolus time
includes chamber and sampling effects that this PA-to-LA volume relation does
not. Regional capillary perfusion and patient-specific transit distributions
remain absent.

---

## 5. Explicit opening potential and breathwise state

The main controls specify a compromised fraction (`collapsed`) and an opening
profile. The compromised component includes permanently closed units and a
potentially reopenable share (`reopenable`). Their product is the maximum
reopenable fraction of the whole model lung. Neither is the fraction currently
closed, a CT fraction or a manoeuvre-derived R/I. Aerated-tissue compliance
(`clung`) and completely open capacity (`lungCapacity`) remain independent.

The profiles select non-reopenable, pressure-dependent or memory-dependent
opening. Advanced controls expose the reopenable share, transpulmonary opening
midpoint, memory switch and closing midpoint. Closing cannot exceed opening;
equality removes the memory gap. Custom values retain full precision in saved
patient prescriptions. See the generated profile table in the
[manual](../manual/recruitment-and-ri.md) for their exact prescriptions.

Chest-wall compliance, wall load and position do not recalibrate potential.
They can change actual opening by changing the transpulmonary pressure reached;
prone position also applies its explicit opening-midpoint transformation.
Pressure, recruitment and circulatory response remain jointly determined.

The numeric tile reports closed fraction at end expiration and the maximum
minus minimum open fraction over the same completed breath. Parameter changes,
reset and occlusions invalidate both until a complete breath at the new settings
is available. They are internal state measurements, not recruited volume or
injury indices, and require no additional deep calculation.

The active model neither calculates nor accepts R/I. Opening potential is an
explicit coefficient; external validation must assess pressure, volume,
compliance and circulatory response jointly. Version-2 patient files store the
explicit share, profile and pressure settings. Version-1 files require the
isolated offline recovery tool before loading; the application does not import
that archived calculation.

Optional recruitment hysteresis retains only the recruitable diseased fraction;
already-aerated lung follows current transpulmonary pressure. Each respiratory
step solves the gas-volume relation and the opening/closing memory constraint
together, using the same previously accepted recruitment for preliminary flow
and final-volume evaluations. The final pressure and recruitment therefore
describe the same lung. Plateau bookkeeping reuses that state with muscle
pressure removed. This is a rate-independent memory law: it has no biological
opening or closing time constant. See [Recruitment hysteresis](../manual/hysteresis.md)
for the current calculation, numerical checks and physiological limits.

---

## 6. What the occlusion manoeuvres show

Closing the airway holds lung volume while the circulation continues. In a passive breath, recoil pressure is held at that volume. During assisted breathing, inspiratory muscles can relax: pleural, alveolar and airway pressures then change despite fixed volume. Each hold contributes one measured pressure–flow pair, and a series of
them draws an extrapolated venous return relation. The points are measured; its
zero-flow intercept is not.

The model reproduces the method's known confound rather than hiding it. Four
inspiratory holds at increasing tidal volumes produce a much flatter fitted
pressure–flow relation than the model's effective resistance to venous return
would predict, and the extrapolated zero-flow intercept lies far above the
internal Pmsf. The current values and exact protocol are generated directly in
the [manual page](../manual/pmsf-and-occlusions.md). Both protocols behave the
same way — varying tidal volume at fixed PEEP, or varying PEEP between holds —
so it is not merely a plotting artefact.

The mechanism is the abdominal coupling: an occlusion holds the lung inflated,
which pressurises the aggregate systemic venous reservoir, which raises mean systemic filling
pressure. The curve therefore moves to the right by an amount that grows with
the plateau pressure, and the points sample a family of curves rather than one.
Reading the resulting intercept as a direct mean systemic filling pressure
overestimates it. Berger et al. found an excess of 3.0 (SD 5.1) mmHg across 37
paired measurements in anaesthetised pigs, much smaller than this model's gap.
Conversely, human postoperative and septic studies using the hold method report
absolute estimates around 15–33 mmHg, so the porcine difference is not a safe
human calibration target. The interface therefore names the value for what it
is — an extrapolated intercept — and uses it to teach the bias, not quantify a
patient's Pmsf.

---

## 7. The Guyton panel separates Live, Mean and optional Deep CO

The default **Live** view shows respiratory movement of both the local
RV-function curve and the venous-return curve. Both use determinants averaged
over one heartbeat, attenuating cardiac pulsation while preserving respiratory
variation. **Mean** constructs both curves from determinants averaged over a
sliding one-breath-duration window of heartbeat means; it does not average the drawn lines point by point. The
horizontal axis is right atrial pressure relative to atmosphere, in mmHg, and
the vertical axis is flow in L/min.

The local RV-function curve is anchored to RV end-diastolic and end-systolic
volumes on the selected heartbeat or respiratory window, together with matching
right atrial pressure, heart rate and RV contractility. This avoids assuming
that mean right atrial pressure equals RV end-diastolic transmural pressure.
It remains a local analytic approximation, not an independently measured LV
response or an instantaneous cardiac-output measurement.

The dark marker averages right atrial pressure and IVC-to-right-atrial inflow
over that sliding breath-duration window in both views. The faint trail retains one-heartbeat
means. The compliant IVC and other compartments can temporarily store or release
blood, so venous inflow, RV output and LV output can differ within a breath.
Only Mean shows the hollow predicted-equilibrium marker at the crossing of the
two respiratory-mean curves. Once storage has settled, mean flows should agree
and the measured inflow marker should be close to that local crossing. Their
agreement is an internal consistency check, not independent clinical validation.

The caval segment permits pressure-driven reversal: the forward law
is mirrored with the IVC and atrial endpoints exchanged when atrial pressure
is higher. Positive flow enters the atrium and negative flow returns blood to
the IVC; beat and breath averages report the net transfer. Equal pressures give
zero flow, with the existing small zero-flow interval near equilibrium retained.
The upstream
reservoir-to-IVC segment remains forward-only.

The descending Guyton curve remains the forward analytic reduction of the
combined pathway. Nonlinear collapse and brief reversal mean that evaluating
it at mean RAP need not give measured mean net inflow, even after net storage
settles. This curve-to-marker gap is distinct from the distance between the
measured marker and the predicted crossing, particularly in pulmonary embolism.
See [vascular waterfalls](../manual/vascular-waterfalls.md) for equations,
pressure references and the remaining anatomical and mathematical limits.

**Deep CO** is an optional loading experiment in separate copies containing both
ventricles and the pulmonary circulation. It imposes eight levels of right
atrial inflow and plots the resulting mean atmospheric right atrial pressure
against independently integrated aortic output. Only settled, domain-valid
points are drawn. The reference fixes autonomic drive and shares respiratory
and systemic source-pressure trajectories across the copies; arterial pressure
can still respond to their flow. This reference-conditioned analysis is
available only by explicit selection. Leaving Deep CO,
changing a parameter or scenario, or resetting cancels it and requires a fresh
opt-in. See the [Guyton panel manual](../manual/panel-guyton.md) for its separate
VR mean/live selector, measurement windows and acceptance limits.

## 8. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.

- **One reflex arc, no chemoreflex.** The optional arterial baroreflex is present as a
  bounded, single sympathetic outflow with one 15 s time constant; the real
  vagal and sympathetic arcs to heart rate, resistance, venous tone and
  contractility have different latencies, and there is no chemoreflex at all.
  Heart rate receives an additive reserve rather than a percentage of the
  selected baseline, but it is not a
  patient-specific chronotropic model. Venous tone has one fixed recruitment
  coefficient rather than a drug-specific dose response. It is off by default;
  use the Off/On control to compare uncompensated mechanics with aggregate pressure
  defence, and do not use the transient to infer a
  human baroreflex latency. The afferent signal is low-pass mean pressure rather
  than pulsatile arterial-wall stretch. It does not sense PVR, mPAP, right-heart
  distension or hypoxaemia directly: an increased pulmonary load recruits the
  reflex only if its downstream effect lowers systemic MAP. Clinical presets
  may already encode compensation in their selected heart rate, systemic
  resistance and filling state. There is no coronary circulation, so the model
  also omits the direct benefit that defending systemic pressure can have on
  right-ventricular coronary perfusion.
- **Variation can report right ventricular afterload rather than preload.** As
  lung compliance falls, airway pressure swings the pulmonary
  vessels harder within each breath, and more of the pulse pressure variation is
  the right ventricle ejecting against a cyclically varying afterload. The model
  exposes that afterload swing as a mechanistic output, but the spatially lumped
  PVR cannot support a quantitative ARDS cutoff or magnitude claim. Right
  ventricular dilatation remains an applicability caution, but is a late and
  incomplete proxy for the mechanism.
- **No gas exchange.** There is no oxygen, CO₂, pH or shunt. Hypoxic pulmonary
  vasoconstriction is a coefficient on derecruited lung, not a consequence of an
  alveolar oxygen tension.
- **Pulse pressure variation is non-monotonic at both filling extremes.** The
  model does not support a monotonic separation between a fluid responder and
  non-responder. At severe underfilling, absent zone-III piston contribution and
  stronger low-flow pulmonary filtering can produce a small arterial variation
  despite marked preload reserve. This is documented as a quantitative model
  limitation, not a human hypovolaemia rule. At high filling, the direct
  pulmonary venous piston can raise variation again even when additional filling
  buys little output.

  The filled-end rise has a represented mechanism. Once the capillaries are open
  along their whole length, lung inflation can squeeze blood forward into the
  left atrium with each breath — the `piston` term. Removing that term suppresses
  the rise. This is the direct-filling component of the classical Δup.

  The other classical sources are still absent:
  irregular, variable-depth efforts and arrhythmia, neither of which this model
  has, since neural effort follows a reproducible rising waveform with activation and post-inspiratory relaxation, and the cardiac rhythm is regular.

  The analytic RV preload-reserve measure asks a different question from PPV: the local response of the fast RV/venous-return construction to increased filling pressure. It does not independently test LV reserve or validate clinical fluid responsiveness.

- **Variation is not quantitatively validated as a fluid-response test.** It
  scales with driving pressure and retains the expected qualitative dependence
  on loading conditions, but no 13% cutoff or PPV–fluid-response regression is
  applied. Low tidal volume remains an applicability
  caution; it is not “corrected” by a tidal-volume challenge.
- **Ejection fraction is not an echocardiographic calibration.** The canonical
  double-Hill activation reaches an approximately unit peak, so the selected Ees is the
  peak active elastance and EF remains a model quantity. The number still belongs
  to a lumped chamber with no ventricular geometry, regional wall motion,
  valvular regurgitation or imaging method, and must not be compared directly
  with an individual patient's EF.
- **The PV panel separates intrinsic activation from effective chamber ESPVR.**
  The selected Ees is the active term inside the ventricular pressure equation.
  Total end-systolic pressure also contains ventricular-interdependence terms,
  especially LV and septal support of RV pressure. The displayed local ESPVR
  therefore passes through the actual end-systolic point and may have a steeper
  effective slope than the selected intrinsic RV Ees. It is a single-beat visual
  construction, not a multi-load conductance-catheter measurement.
- **Pulmonary transit is an eight-stage aggregate approximation.** Its mean time
  changes with represented pulmonary blood volume and RV output, but it
  still has no regional perfusion, shunt, bronchial flow or contrast kinetics.
  The 0.8–6 s staged bounds and 2 s adaptation are numerical guardrails, and the
  displayed PA-to-LA estimate must not be interpreted as a measured RV-to-LV
  contrast transit time or as quantitative PPV validation.
- **Hysteresis is optional and instantaneous.** With the flag off, opening is a function of current transpulmonary pressure without an opening-state memory gap. This does not remove gas trapping, muscle-activation dynamics or circulatory storage. With it on, previously opened units close across a pressure distribution centred on `pClose`; retained opening depends on the pressure history. Incremental and decremental pressure paths can therefore differ. What
  is still missing is the time course: a unit opens within the step that reaches
  its threshold, so there is no additional biological time-dependent recruitment at fixed transpulmonary pressure. Duration can still affect the pressure reached, gas flow and circulatory settlement. Real opening kinetics depend on both pressure and time, beyond this memory law.
- **The pulmonary circulation remains spatially lumped.** Open and derecruited
  unit populations have separate vascular conductances in parallel, and the
  alveolar waterfall is limited to a fixed aggregate share. There are still no
  dependent/non-dependent regions, gravitational pressure gradients, local West
  zones or regional HPV. This aggregate split does not reproduce spatial perfusion or the full heterogeneity of ARDS.
- **Pulmonary vascular load is an effective aggregate.** The mechanical
  coefficient integrated by the model is reported separately from catheter-
  derived `(mPAP − wedge) / CO`, and an alveolar waterfall contributes its own
  closing-pressure load. The model does not additionally separate thrombotic
  obstruction, non-alveolar critical closing pressure, blood viscosity or
  haematocrit, pressure/flow-dependent vascular recruitment and distension,
  characteristic impedance or wave reflection. Acute pulmonary embolism is
  therefore represented by a raised effective `pvrBase`, not by clot anatomy or
  a claim that calibre alone explains the load. This is sufficient to study the
  RV response but not to infer the physical composition of a measured PVR.
- **EFL is one expiratory choke.** It is a binary maximal-flow envelope with a
  fixed 4.5 s severe-obstruction anchor, not a distribution of fast and slow
  units. It reproduces the directional low-PEEP plateau and the haemodynamic
  cost above the choke, but not regional trapping, separate peripheral-airway closure, secretions, bronchodilation or CO₂. Pneumatic PSV triggering, flow cycling and an intrinsic-PEEP threshold load are represented; irregular neural efforts and clinical dyssynchrony patterns are not comprehensively modelled. The Campbell loop depicts mechanical loading, not metabolic effort or fatigue. Dynamic
  trapped volume is measured against this model's own static equilibrium and
  external PEEP must not be titrated from its threshold.
- **Forward Euler.** Checked across the shipped ranges; flows are limited
  so no compartment can be drained past a 1 mL floor; a 250-configuration sweep
  of the whole control space finds no negative volume, no non-finite value and
  no ejection fraction outside 0–100%. Extreme combinations still reach states
  the equations do not describe — those suspend the readouts and say why, rather
  than continuing to print numbers.
- **Face validity, not quantitative validation.** What is verified is internal
  consistency, conservation, convergence and the *direction* of established
  relationships. There is no calibration source for each empirical constant, no comprehensive global
  sensitivity analysis, no independent experimental time-series validation, and no
  identifiability analysis — different parameter combinations can produce the
  same output. This is a mechanistic teaching model calibrated to reproduce
  qualitative relationships, not a patient-specific predictor.
- **No valvular disease, no arrhythmia and no bronchospasm heterogeneity.**

## Sources

1. Kenny JE. *An Approach to Mechanical Heart-Lung Interaction*, 1st ed.
   Toronto: Spectral Envelope, 2020. Chapters 1–4 supply the integration of the
   Campbell and Guyton diagrams that this simulator is organised around.
2. Mahmood SS, Pinsky MR. Heart-lung interactions during mechanical ventilation:
   the basics. *Ann Transl Med* 2018;6(18):349.
3. Yuriditsky E, Mireles-Cabodevila E, Alviar CL. How I Teach: Heart–Lung
   Interactions during Mechanical Ventilation. Positive Pressure and the Right
   Ventricle. *ATS Scholar* 2025;6(1):94–108.
4. Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various
   right atrial pressures and the normal venous return curve. *Am J Physiol*
   1957;189:609–15.
5. Permutt S, Riley RL. Hemodynamics of collapsible vessels with tone: the
   vascular waterfall. *J Appl Physiol* 1963;18:924–32.
6. Simmons DH, Linde LM, Miller JH, O'Reilly RJ. Relation between lung volume
   and pulmonary vascular resistance. *Circ Res* 1961;9:465–71.
7. Suga H, Sagawa K. Instantaneous pressure-volume relationships and their ratio
   in the excised, supported canine left ventricle. *Circ Res* 1974;35:117–26.
8. Fessler HE, Brower RG, Wise RA, Permutt S. Effects of positive end-expiratory
   pressure on the gradient for venous return. *Am Rev Respir Dis* 1991;143:19–24.
9. Jardin F, Genevray B, Brun-Ney D, Bourdarias JP. Influence of lung and chest
   wall compliances on transmission of airway pressure to the pleural space in
   critically ill patients. *Chest* 1985;88:653–8.
10. Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation
    with mechanical ventilation. *Am J Respir Crit Care Med* 2019;199:22–31.
11. Cappio Borlino S, et al. The effect of positive end-expiratory pressure on
    pulmonary vascular resistance depends on lung recruitability in patients
    with ARDS. *Am J Respir Crit Care Med* 2024;210:900–907.
    doi:10.1164/rccm.202402-0383OC.
12. Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical
    bedside implications. *Intensive Care Med* 2026.
    doi:10.1007/s00134-026-08583-3.
13. Thomas LJ Jr, Griffo ZJ, Roos A. Effect of negative pressure inflation of
    the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–456.
14. Hakim TS, Michel RP, Chang HK. Effect of lung inflation on pulmonary
    vascular resistance by arterial and venous occlusion. *J Appl Physiol*
    1982;53:1110–1115.
15. Young DB. Venous return. In: *Control of Cardiac Output*. Morgan & Claypool
    Life Sciences; 2010. NCBI Bookshelf NBK54476.
16. Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of
    volume expansion on mean systemic pressure in septic shock. *Crit Care*
    2021;25:302. doi:10.1186/s13054-021-03711-5.
17. Pinsky MR. The effects of mechanical ventilation on the cardiovascular
    system. *Crit Care Clin* 1990;6:663–678.
18. Fougères E, Teboul JL, Richard C, et al. Hemodynamic impact of a positive
    end-expiratory pressure setting in acute respiratory distress syndrome:
    importance of the volume status. *Crit Care Med* 2010;38:802–807.
19. Chen L, Del Sorbo L, Grieco DL, et al. Potential for lung recruitment
    estimated by the recruitment-to-inflation ratio in acute respiratory
    distress syndrome. *Am J Respir Crit Care Med* 2020;201:178–187.
    doi:10.1164/rccm.201902-0334OC.
20. Berger D, Moller PW, Weber A, et al. Effect of PEEP, blood volume, and
    inspiratory hold maneuvers on venous return. *Am J Physiol Heart Circ
    Physiol* 2016;311:H794–H806. doi:10.1152/ajpheart.00931.2015.
21. Maas JJ, Pinsky MR, Geerts BF, et al. Estimation of mean systemic filling
    pressure in postoperative cardiac surgery patients with three methods.
    *Intensive Care Med* 2012;38:1452–1460.
    doi:10.1007/s00134-012-2586-0.
22. Ranieri VM, Giuliani R, Cinnella G, et al. Physiologic effects of positive
    end-expiratory pressure in patients with chronic obstructive pulmonary
    disease during acute ventilatory failure and controlled mechanical
    ventilation. *Am Rev Respir Dis* 1993;147:5–13.
23. van den Berg B, Stam H, Bogaard JM. Effects of PEEP on respiratory
    mechanics in patients with COPD on mechanical ventilation. *Eur Respir J*
    1991;4:561–567.
24. Pepe PE, Marini JJ. Occult positive end-expiratory pressure in mechanically
    ventilated patients with airflow obstruction: the auto-PEEP effect.
    *Am Rev Respir Dis* 1982;126:166–170.
25. Tuxen DV, Lane S. The effects of ventilatory pattern on hyperinflation,
    airway pressures, and circulation in mechanical ventilation of patients
    with severe air-flow obstruction. *Am Rev Respir Dis* 1987;136:872–879.
26. Rahn H, Otis AB, Chadwick LE, Fenn WO. The pressure-volume diagram of the
    thorax and lung. *Am J Physiol* 1946;146:161–178.
    doi:10.1152/ajplegacy.1946.146.2.161.
27. Agostoni E, Hyatt RE. Static behavior of the respiratory system. In:
    *Handbook of Physiology, The Respiratory System*. 1986:113–130.
    doi:10.1002/cphy.cp030309.
28. Pereira C, Bohé J, Rosselli S, et al. Sigmoidal equation for lung and chest
    wall volume-pressure curves in acute respiratory failure. *J Appl Physiol*
    2003;95:2064–2071. doi:10.1152/japplphysiol.00385.2003.
