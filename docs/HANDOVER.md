# Project handover

Updated: 2026-09-08

## Current pulmonary law retained; manual describes current behavior — September 8

The clinician explicitly chose to retain the production pulmonary resistance
law after the private distensibility and ventricular-loading experiments.
Pressure-dependent vascular distensibility has not been adopted. This is a
documentation-only revision: physiological equations, coefficients, scenarios,
numerical timestep and application behavior remain unchanged.

The explanatory manual describes implemented mechanisms in the present tense,
without comparing them with previous implementations. This is a standing rule
for every future documentation update, recorded in `AGENTS.md` and
`manual/_schema.md`. The schema's contrary instruction to narrate reversals was
replaced. Correction history belongs in this handover and `manual/_log.md`;
physiological before/after manoeuvres remain appropriate in the manual.

Current explanations cover conservative bidirectional caval transfer, actual
forward stroke-volume/output measurement, pulmonary transit, independent lung
and chest-wall mechanics, recruitment and reflex behavior. The Guyton manual
already documents the current Live/Mean clocks and optional Deep protocol.
Pulmonary pages distinguish the strain/open-fraction/HPV resistance law from
compliant blood storage and pressure gradients: PA pressure opposes RV ejection,
and resistance, vascular pressures, filling and output evolve together.
Lower resistance is not a promise of lower RV ejection pressure or higher CO.
The volume-versus-pressure and FRC-nadir pages explain current assumptions and
measurement boundaries; they do not claim volume is the sole vascular cause.

Private experiments remain under `codex-notes/` and `outputs/`. The open
respiratory audit findings are unchanged; no further substantive model or UI
revision is automatically authorized. Numerical examples and physiological
figures are not hand-edited. Windows synchronization has not been verified.

The review also found `undefined–undefined` in the generated R/I cohort table:
the renderer indexed calculated compliance numbers as though they were the
source IQR arrays. It now reads the observed ranges from the cohort definitions
and the calculated values from the evaluation, and labels compliance units.
The correction belongs to the documentation generator; model results and
cohort acceptance criteria are unchanged. Regenerate with `manual:examples`.

## Distensibility and ventricular loading assessed together — September 7

After requesting a clearer clinical explanation, the clinician emphasized
that intravascular distension and increased ventricular loading can coexist.
They authorized three bounded comparisons in private copies: imposed flow
through a frozen vascular bed, higher downstream pressure, and higher
reference pulmonary resistance. The full-circuit downstream experiment raises
LV diastolic stiffness and lets LA pressure emerge; it does not overwrite
atrial pressure or claim to isolate all consequences of that intervention.

Actual forward flow, RV ejection pressure relative to pleural plus pericardial
pressure, stroke volume and net pressure-volume work are measured together.
The distensible variant can exhibit lower pathway resistance with higher RV
ejection pressure and lower output after downstream congestion. Lower work per
beat can accompany lower ejected volume and must not alone be called reduced
afterload. Higher reference resistance raises RV pressure/work and lowers
output in all versions; distensibility attenuates rather than reverses these
changes. The production model already retains pressure opposing RV ejection.

Targeted conservation, domain, settlement and timestep-refinement checks pass.
The laws are those already timed; neither another Deep run nor a duplicate
performance benchmark was needed. These are internally checked mechanistic
comparisons, not a fit to matched human data or validation of pulsatile
impedance and pressure-dependent arterial compliance, which remain omitted.
The recommendation is to retain the current production law for now; no
substantive adoption or new research sequence is automatically authorized.
The clinician-facing report is private at
`codex-notes/Arthur-distensibilita-postcarico-2026-09-07.md`; runners, copies,
numerical results and logs use `outputs/Arthur-distensibility-coupling-*`.
Model, scenario, current manual and UI behavior are unchanged. Windows has
not been verified.

## Pulmonary distensibility experiments remain private — September 7

The clinician authorized an isolated comparison, then assessment of how
distensibility could be assigned to different vascular phenotypes. No candidate
has been adopted in the production model, presets or interface. The audited
runtime is `5424125`; reports are in
`codex-notes/Arthur-distensibilita-polmonare-esperimento-2026-09-07.md` and
`codex-notes/Arthur-distensibilita-fenotipi-2026-09-07.md`, with reproducible
copies, runners and numerical results under the corresponding private
`outputs/Arthur-distensibility-*` prefixes.

A minimal pressure-sensitive factor on the aerated resistive pathway changes
whole-circuit responses most in the high-pulmonary-load experiment. Limiting
the pressure-responsive share attenuates those effects. That share is a
sensitivity parameter, not an anatomical embolization fraction. Elevated PVR
alone cannot identify residual vessel distensibility: loss of parallel paths,
serial obstruction, tone and vascular remodeling are different assumptions.
Exercise-derived human coefficients must not be assigned to embolism or
positive-pressure ventilation without matching the law and measurement
conditions. The midpoint PA/PV approximation for local vascular pressure and
the phenotype-specific reference anchors remain experimental limitations.

Targeted probes preserve blood volume, finite positive states, settlement and
timestep agreement. Ordinary numerical updates remain inexpensive in the VPS
benchmarks, which exclude browser rendering. The existing optional Deep
experiment can change its admissible upper loading point; numerical acceptance
does not validate a human cardiac reserve. No new Deep solve, timestep or state
variable is needed by these algebraic prototypes. Long calculations for a small
teaching benefit remain explicitly unacceptable to the clinician.

Keep reference resistance and pressure sensitivity conceptually independent;
do not add a slider for every uncertain mechanism or silently promote these
trials to calibrated presets. Further substantive adoption still requires
confirmation. Pulmonary flow directionality, pressureless transit stages and
the open respiratory audit findings retain their prior status. This entry
records research conclusions only; the current manual, generated examples and
production source are unchanged. Windows has not been verified.

## Conservative caval backflow adopted — September 7

The clinician explicitly authorized adoption and documentation after the
private comparison below. This section supersedes that comparison's pending
adoption status. The starting checkout was `f56c6cf` on `main`.

`cavalFlow` in `src/model/circulation.js` preserves the existing forward branch
and mirrors its endpoints for reverse IVC–RA flow. Its output remains signed
mL/s; the existing donor limiter and volume balances transfer backward blood
from the atrium to the cava. No new state, coefficient, timestep, preset or UI
behavior is introduced. Upstream systemic-to-IVC flow, pulmonary arterial
inflow and the single abdominal closing pressure retain their prior laws.

Manual pages now distinguish signed net inflow from the forward analytic
Guyton curve, document the retained near-equilibrium zero-flow interval, and
qualify the scope of human Doppler support. Related stale respiratory-only
descriptions of the default Live curve were corrected: Live uses heartbeat
determinants, Mean uses breath determinants, the measured marker retains its
respiratory clock, and only Mean shows the predicted crossing. The curve at
measured RAP and the predicted crossing are different comparisons; neither
marker is moved to manufacture agreement.

The `venous-reversal` audit entry is promoted to resolved, with permanent
direction, no-flow, forward-branch, pressure-reference, donor and volume-balance
regression checks. The four cardiac entries remain resolved and the three
respiratory entries remain open. This is not an assertion that all
cardiorespiratory physiology has been externally validated.

Official snapshot/example generators reproduce the reviewed private-copy diff:
three snapshot rows, the embolism pulmonary-volume example (548 to 546 mL),
and two ARDS high-PEEP outputs (3.79 to 3.78 and 3.53 to 3.50 L/min). No
tolerance was widened. All 19 figures were regenerated and have no diff.
Snapshot and example protocols retain their own windows; these values must
not be substituted for the earlier trial's directly integrated 60 s means.

The 14 targeted caval checks, 44 UI smoke contracts, 10 verification-harness
checks and syntax checks of 56 modules pass. The independent audit exits 0
with five PASS and three KNOWN_FAILURE entries. Manual build/lint passes:
53 pages, 18 generated blocks, 57 files, 145 bibliography entries, no errors
or warnings. One intermediate lint run caught a stale search index after
a final prose edit; rebuilding the index and rerunning lint resolved it.
Chromium checks cover healthy passive and embolism Live/Mean rendering,
Deep opt-in/cancellation, and four manual pages including mathematical
rendering, with no page errors or failed HTTP requests. The browser check
does not claim completion of the deep loading experiment. Browser tooling
and extracted libraries are temporary and add no project dependencies.
The complete adopted-source `npm test` run passes: 390 checks, zero failures,
including the refreshed snapshot and documentation contracts. This is a full
suite run, superseding the private trial's 373-pass/three-reference-mismatch
result. `git diff --check` passes. The exact source is committed and pushed
after these checks; the final local/remote SHA is recorded in the private report.

The private adoption record is
`codex-notes/Arthur-adozione-reflusso-cavale-2026-09-07.md`; numerical
artifacts and logs use `outputs/Arthur-caval-adoption-*`. Neither directory is
committed. The Windows copy has not been verified.

## Test caval backflow alternatives without adopting them — September 7

The clinician authorized comparing the computational and teaching consequences
of a limited caval-backflow correction. All candidate equations remain in
private copies under `outputs/Arthur-caval-trials-2026-09-07/`; production model,
presets, curve formulas and UI are unchanged. No candidate has been adopted.
The private report is `codex-notes/Arthur-prova-reflusso-cavale-2026-09-07.md`;
runner, manifests, measurements and logs share the `Arthur-caval-trials` prefix.

Simply removing the zero clamp fails the equal-pressure/no-flow requirement
because the original downstream softplus exceeds actual pressure. Two bounded
alternatives were tested on the IVC-to-RA segment only. The conservative mirror
law preserves the original forward branch exactly and swaps endpoints for
reverse flow; it retains the original small zero-flow region near equilibrium.
A difference of two softplus pressures instead smooths both directions but
also changes forward collapse behavior and permits small subthreshold leakage.
Neither adds a state variable, coefficient, worker or UI control. The upstream
systemic clamp, separate SVC/IVC question and pulmonary directionality are not
silently included in this experiment.

The 12 presets plus healthy passive PEEP 15 were compared in all three versions
after 135 s preparation and two 60 s observation windows. The conservative law
changes mean output only in ARDS/RV, embolism and tamponade (about -0.19%,
-0.42% and -0.003%); the other ten comparisons are identical. Five conditions
repeated at half the timestep differ by at most 0.017% in mean CO across all
versions, with conserved positive blood volumes and no cardiac-domain or
volume-limit flags in the sampled windows. Measured heartbeat/breath inflow
remains positive. In embolism, the mean VR-curve-minus-measured-inflow gap grows
from about 0.024 to 0.149 L/min; it is distinct from CO error and from the much
smaller flow gap at the RV/VR crossing. Do not conceal it by moving a measured
marker onto the analytic curve.

A sequential VPS Node benchmark includes integration, metrics and both fast
curve constructions; other audit computation was suspended during measurement.
Five rotated timing blocks per condition show roughly 0.66–0.72 ms per call,
with conservative median changes from -3.4% to +0.9%. This is no meaningful
observed overhead in these probes, not a browser rendering benchmark or proof
of a speed improvement. Source copies preserve numerical-step and state count.
The full conservative-copy `npm test` run exits 1 with 373 passed and three
numerical-reference mismatches: the embolism snapshot and the pulmonary-transit
and ARDS manual examples. All mechanism/stability checks pass. Official
`npm run snapshots` and `npm run manual:examples` regenerate those references
only in the private copy. The reviewed diff changes three snapshot rows, the
embolism example's pulmonary volume by 2 mL and high-PEEP ARDS example outputs
by 0.01/0.03 L/min. A bounded rerun of the original snapshot contract passes
all 12 cases with unchanged tolerances; private `npm run manual:build` and
`npm run manual:lint` pass, including all 18 numerical blocks and 57 files.
Do not describe this as a second full-suite run. The 44 UI smoke contracts
also pass in the private copy; no new visual browser check is claimed.

Optional Deep CO was compared at all eight default loads in both affected
phenotypes. Embolism accepts six points at 180 s, rejects 140% for domain and
leaves 120% unsettled at five minutes; ARDS/RV accepts seven at 180 s and rejects
140%. Acceptance, rejection reasons and window counts are identical before and
after the conservative change. Completed points include rejections: an interim
statement calling seven completed embolism points accepted was corrected.

Production documentation build/lint also passes (53 pages, 18 generated blocks,
57 files, no errors/warnings); production snapshots and numerical examples are
unchanged. `git diff --check` passes. The source hash remains that of the audited
runtime. Substantive adoption still requires the clinician's confirmation;
Windows has not been verified.

## Cardiorespiratory review before respiratory revision — September 7

The clinician authorized reviewing pulmonary transit, pulmonary vascular load
and venous return, while requiring explicit discussion and confirmation before
substantive physiology or UI changes. This review changes neither production
code nor coefficients, presets, numerical acceptance or display behavior.
It examines model revision `0c7f6fd`; the report and reproducible probes remain
private in `codex-notes/Arthur-audit-cardiorespiratorio-2026-09-07.md` and
`outputs/Arthur-cardiorespiratory-review-2026-09-07-*`.

All 12 presets plus healthy passive PEEP 15 were sampled after 135 s preparation
in two 60 s windows, using actual transferred flows and retaining preset reflex
settings. Blood is conserved and cardiac domain/volume-limit flags remain clear.
The septic preset retains a small autonomic drift rather than exact settlement.
An independent passive tracer, including signed PV–LA exchange, confirms
pulmonary mean residence against pulmonary blood volume/mean flow in three
isolated, nonventilating states at dt 0.00025 and 0.000125 s. Paired RV-elastance
steps preserve the delayed LV response. These are internal checks, not external
validation of contrast timing or every respiratory phase delay. An initial
first-arrival tracer discarded LA-to-PV returns and measured a different
quantity; its shorter times are not evidence of a transport defect. The final
interpretation uses the complete tracer and explicitly defined boundaries.

A frozen-lung, zone-3 pressure-flow bench confirms that the resistive coefficient
does not respond to intravascular distension, an already documented omission.
PA/PV reservoir compliance exists and must not be confused with distensibility
of the resistive bed or a catheter-derived compliance index. Clinical PVR
comparisons require matched pressure references, territory and measurement
windows. This review verified the Cappio Borlino 2024 primary abstract, not its
complete measurement protocol; it does not promote coefficient calibration
outside zone 3 to independent catheter-PVR validation.

The known caval reverse-flow clamp acts in ordinary ARDS/RV, embolism and
tamponade presets even when RAP exceeds caval pressure and both are above the
model closing threshold. A further structural question is the unidirectional
PA-to-transport flow: LV failure and the large-swing preset have intervals with
PA below PV while both exceed alveolar pressure, yet this pathway permits no
reverse flow. These observations persist at half the timestep. Time fractions
of blocked flow are not estimates of CO error; no alternative circulation was
implemented to establish effect size. The pressureless transport stages make
a pulmonary bidirectional formulation a separate design question, not a blind
removal of a numerical maximum. Keep these proposals distinct from accepted
roadmap work. The current review does not justify replacing the transit model
or retuning PVR to force an LV-output benefit.

Verification: `npm test` reports 376 passed, 0 failed, exit 0. The separate
`npm run test:audit` exits 0 with four cardiac PASS criteria and the same four
KNOWN_FAILURE criteria (R/I protocol, hysteresis convergence, chest-wall
intervention and caval reversal). Known failures remain physiological failures.
All private survey, bench, transit, tracer and timestep-refinement probes
complete with exit 0. No UI/browser rerun is claimed for unchanged behavior.
`npm run manual:build` writes/indexes 53 pages without generated-file changes;
`npm run manual:lint` confirms 18 generated blocks and checks 57 files with
zero errors or warnings. `git diff --check` passes. The Windows checkout has
not been verified from this session.

## Align the physiological summary with the current Guyton display — September 7

The clinician authorized correcting section 7 of `docs/PHYSIOLOGY.md`, which
still described the RV curve only on a respiratory-mean window. It now explains
the default heartbeat-averaged Live curves, the full-breath Mean construction,
the distinct inflow marker and trail, and the Mean-only equilibrium marker.
The optional Deep CO experiment is summarized with its reference conditions,
validity boundary and cancellation behavior, linking to the existing panel
manual for details. This is a documentation correction; model equations,
coefficients, presets and UI behavior are unchanged. Further model revision
awaits the clinician's next instruction.

Verification on VPS: `npm run manual:build` completes with 53 written/indexed
pages and no generated-file changes; `npm run manual:lint` confirms all 18
generated numerical blocks and checks 57 files with zero errors or warnings.
`git diff --check` passes. Model/UI suites were not rerun for this prose-only
change. Logs are in `outputs/Arthur-physiology-doc-2026-09-07-*.log`; the private
continuity note is in `codex-notes/Arthur-PHYSIOLOGY-Guyton-2026-09-07.md`.
The Windows checkout has not been verified from this session.

## Restore respiratory RV excursion and inspect healthy PEEP 5 to 15 — September 6

The previous fast-view restoration retained a respiratory-mean RV curve while VR live alone oscillated. The clinician explicitly requested restoring RV respiratory movement as the default, with a mean selector at most. The fast display now defaults to Live and switches both RV and VR together to Mean. Both live relations use one-heartbeat averages. The existing anchored RV formula is retained; `operatingPoint` now additionally exposes RV EDV/ESV, HR and Ees on that same heartbeat window. This prevents the live path from falling back to a different, pleural-pressure-only filling anchor. Patient integration equations, coefficients, preset parameters and deep experiments are unchanged.

Deep mode has a separate mean/live VR clock; its opt-in and cancellation behavior is retained. The mean venous-inflow marker and breath-resolving trail remain distinct, and the equilibrium marker is restricted to mean mode because within-breath storage prevents an instantaneous equilibrium interpretation. The RV preload tile remains a respiratory-mean coefficient; the fast highlight follows the chosen curve clock. Help text documents both views. Curve labels remain below the header controls.

The reproducible `tools/experiments/healthy-peep.mjs` performs a sequential intervention in the same closed circulation, with every prescription field checked unchanged except PEEP. Baseline settles for 135 s, and the PEEP step settles for 120 s; each condition then has two 60 s windows (75 beats, 14 breaths). Direct flow integration, volume conservation, finite state, phase/domain and repeated-window agreement are checked. Respiratory trace samples measure live and mean curve excursion. Local PEEP 5/15 output is about 5.514/4.884 L/min; RAP 1.180/4.310 mmHg; transmural RAP 2.562/2.131; Pmsf 8.585/10.802. The elastic Pmsf contribution rises 6.846 to 7.607 and its abdominal contribution 1.738 to 3.195 mmHg. Venous resistance stays 0.072 mmHg·s/mL, pericardial excess pressure zero and reflex off. This separates blood redistribution and abdominal pressure from an unsupported reflex explanation. The model's single abdominal caval closing-pressure approximation remains a known limitation.

UI regressions exercise the actual healthy simulator and require visible RV excursion in Live, strong suppression in Mean and consistent RV/VR clocks with valid chamber anchors, alongside zero default deep workers and opt-in cancellation. The full model suite is rerun because the shared metrics object gains four heartbeat summaries. The dated Italian explanation, numerical reports and verification logs are saved locally and on VPS.

Final verification: 44 UI checks pass locally and on VPS. The full run reports 374 passed and two outdated textual contracts for the previous Guyton call sites; after updating those contracts to require the shared fast clock and separate deep clock, all 81 cross-layer contracts pass. No physiological acceptance threshold changes. Manual build/lint reports 53 pages, 57 files, zero errors/warnings; all 18 generated numerical blocks agree. Browser checks cover Live/Mean, paused selection, optional deep launch and cancellation by PEEP change, with no browser errors. The sequential PEEP probe was replayed on VPS Node 22 and local Node 24 with identical source hashes and parameter vectors; maximum absolute difference across pressure, flow and volume means is 3.2e-12 in the respective units. Reports identify the runtime measurement revision separately from the final documentation/test-contract update.

## Dynamic Guyton view restored; deep response is opt-in — September 6

The clinician rejected replacing the fast dynamic CO/VR teaching display with an automatically computed, separately settled whole-heart curve. The deep experiment answered a different question and imposed a computational/interaction cost that had not been agreed. They explicitly requested the previous UX as default while retaining the deep calculation as an opt-in.

The default panel again calls the existing local `cardiacFunctionCurve` and `preloadLimbs` on every redraw, with the same respiratory-mean anchoring, VR mean/live switch, venous-inflow trail, equilibrium marker, axes and steep-limb highlight as the earlier fast view. It is honestly labelled RV function. The RV/LV pressure-volume panels retain their live behavior. The additional LV-output marker, settled whole-heart curve, loading status and deep-analysis warning appear only in the optional mode.

Deep CO explicitly enables a one-prescription experiment. Live RV cancels the timer/worker and clears its result. Any parameter/scenario change or reset also revokes the opt-in, restores the fast graph and requires a new explicit choice. No worker, parameter snapshot or loading computation is created by the default rendering path. A controller gate additionally refuses unsolicited requests; stale worker replies remain rejected by the existing generation check. The selection is UI state and is not persisted in patient files or across reloads.

The manual describes both present modes, and the default PEEP figure again uses the fast RV construction. The deep figure is retained separately. The figure generator accepts optional filenames so updating a fast-view illustration need not regenerate the deep loading experiment. No patient equations, presets or deep-experiment acceptance criteria were changed in this UX correction.

Verification includes 42 passing UI checks. New lifecycle tests explicitly count zero workers under repeated default requests/parameter changes, one worker after opt-in, cancellation on a new prescription, rejection of late results, and cancellation both before and after worker launch. Browser checks cover immediate fast display, matching fast description, explicit opt-in, return to Live RV and automatic cancellation on a PEEP change. Manual build/lint reports 53 pages with no errors or warnings. The historical deep-analysis reports remain in remote outputs and are superseded for default-UX instructions by the opt-in report.

All 81 cross-layer contracts pass after adapting the figure-generator registration check to its lazy function registry. Browser verification also completed the optional LV-failure experiment while paused, returned immediately to the fast view, and confirmed reload/scenario selection and VR live without automatic deep computation. The fast RV label is kept inside the visible pressure range in narrow panels. The full model source tree has no diff from 307a37f; this correction was verified as UI/documentation work, with the mandatory publishing pipeline providing the full model rerun.

## Whole-heart Guyton response — September 6

The clinician requested reconstruction of the RV-only choice and restoration of the classical cardiac-output view. The original August 8 implementation already calculated a fast RV relation. PR #43 / ef86743 (August 21) renamed the existing calculation for honesty rather than replacing an LV model with an RV model. The August 25 change 494b166 anchored that RV relation to measured mean RV EDV/ESV to avoid equating mean RAP with RV end-diastolic transmural pressure and to repair clock/operating-point mismatch after adding IVC storage. Its reference-point agreement was therefore explicitly not independent validation.

The new displayed relation uses controlled RA inflow in disposable biventricular/pulmonary simulations. The reference supplies the same normalized inflow waveform, respiratory trajectory and systemic source-pressure trajectory. Copies retain systemic arterial impedance and all cardiac/pulmonary equations. Mean RAP is measured as the pressure needed to pass each flow; aortic and pulmonic flows are integrated independently. Inflow minus aortic outflow must equal central volume change. Only finite, settled, domain-valid points are drawn, with gaps at rejected points and no invented plateau. The panel keeps atmospheric RAP on the horizontal axis and labels the response Cardiac output (LV), meaning whole-heart output measured at the LV outlet.

The worker freezes the supplied effective autonomic drive, uses paired minute windows and cancels obsolete calculations when controls change. Recalculate CO refreshes that reference. A new directly integrated aortic-flow history places a mean LV-output marker beside the distinct mean venous-inflow marker; the faint trail remains venous inflow. The fast RV preload coefficient remains analytically unchanged, now explicitly titled RV preload reserve, and is no longer highlighted on the global curve. The patient integrator's pressure, valve and volume equations and presets remain unchanged.

This is a reference-conditioned loading experiment, not a universally validated patient-specific CO curve. Its scale-one reference agreement is a consistency check; sensitivity to changed LV contractility under identical boundaries is tested separately. Frozen vascular properties do not mean fixed aortic pressure: the retained arterial resistance and compliance allow pressure to respond to each flow. Curve position must not be presented as an isolated contractility measurement.

The worker snapshot preserves raw posture settings and selectively freezes HR, Ees, systemic resistance and venous-tone recruitment. Reference settlement retains the sampled venous tone explicitly instead of losing it when feedback is disabled. A prone/frozen-tone regression checks these boundaries. RAP stability is checked alongside flow settlement, using a between-window tolerance of 0.05 mmHg plus 0.5% of its magnitude.

Validation: 11 focused response/worker/marker checks, 36 UI checks, 10 verification-harness checks, 18 generated examples and 53 manual pages passed. The full local model run exercised 376 checks; its sole failure was the public-export allowlist missing the two new browser entry points. That explicit list was updated and all 81 contracts passed on rerun. The mandatory publishing workflow repeats the complete suite on the published revision. The independent audit retains the same four known respiratory/venous failures. The two-level response sweep accepted the sampled points in all 12 presets. Browser inspection covered healthy and LV-failure curves, paused calculation, live VR switching, status and the manual figure; curve type uses line style consistently in that figure.

The reproducible `tools/experiments/guyton-response.mjs` probe was replayed on VPS Node 22 against local Node 24: identical model-source hashes and accepted/rejected points, maximum CO difference 9.33e-15 L/min and RAP difference 7.82e-14 mmHg. The weak-LV matched-boundary comparison passes at 40% reference inflow; its 60% point is outside the domain and is not used to claim an effect magnitude. The LV-failure curve accepts seven of eight sampled loads and excludes the invalid 140% tail. The Italian clinician report and both numerical reports are saved in VPS `outputs/` as `Arthur-Guyton-LV-*2026-09-06.*`. This change does not establish a sustained PEEP-output benefit in LV failure.

Final presentation review extended the patient-domain guard to the new LV-output marker and its text equivalents: raw aortic flow from an invalid state cannot be labelled as interpretable output. A direct valid/invalid/non-finite presentation check brings the UI suite to 37 checks. The independent loading curve retains its separate reference validity checks.

## LV afterload exploration — September 6

The clinician challenged the loss of a useful sustained PEEP-output benefit in the LV-failure lesson and authorized exploration: first isolate the LV response at controlled filling, then investigate the intact circulation. Production equations, coefficients, controls and preset values are unchanged in this exploration. Future substantive changes must be explained for a clinician: mechanism, observable consequence, code implementation and remaining evidential limit. The manual describes current behavior; this handover records changes and investigative decisions.

`node tools/experiments/lv-afterload.mjs /path/to/report.json` reuses the production circulation integrator. It records source and script hashes, model revision, Node version, units and protocol. The open single-beat rig clamps non-LV volumes, uses no mitral inflow, and disables septal/pericardial coupling. With Ees 0.6, starting volume 180 mL and fixed atmospheric aortic pressure 80 mmHg, increasing external pressure from 0 to 5 mmHg increases integrated SV from approximately 30.65 to 38.99 mL. These are rig values, not PEEP settings or a fitted patient. A stronger Ees comparator is 2.2, not the default normal preset.

The closed-loop exploration compares 13 configurations at PEEP 0, 5 and 10: current LV failure; higher systemic resistance; more stressed volume; their combination; stronger RV; pericardium off; septal coupling off; two lower passive LV stiffnesses with Ees 0.6 or 0.4; and two lower systemic venous compliances. These selected probes are not a search proving that a positive response is impossible. Coupling-off conditions are mechanistic interventions, not proposed patients. Each settled comparison uses 135 s preparation and two 60 s windows (95 beats and 18 breaths per window). Shorter preliminary 30 s windows contained half a beat and alternated in apparent flow; their combined 60 s means agreed with the independent audit. Final output uses matched 60 s windows.

A separate pressure-only counterfactual increases the pleural-pressure input to circulation while preserving the respiratory trajectory and pulmonary resistance. It must not be described as a clinical PEEP manoeuvre. A paired transient starts two identical settled PEEP-zero states and changes only one to PEEP 10, comparing 5 s integrated flows. The effective parameter cache is explicitly refreshed after setting PEEP, as the normal Simulator.advance path would do. Early greater aortic flow coexists with reduced RV flow; later the aortic benefit disappears. This cannot isolate unloading from pulmonary blood displacement or validate the model's transit times against patients.

The research runner checks volume balance, finite observations, both ventricular phase domains, agreement of systemic/aortic steady flows, repeated settlement windows and two-step-size agreement for the isolated rig and current preset. It does not require a positive PEEP response or promote these exploratory comparisons to clinically validated scenarios. Machine-readable results and the clinician-facing report are saved locally and under `/home/ubuntu/arthur/outputs/Arthur-esplorazione-LV-2026-09-06.*`.

The next unresolved question is how loading and systemic venous pressure/volume redistribution determine the settled response under a clinically specified protocol. A useful comparison source is De Hoyos et al., Clin Sci 1995, doi:10.1042/cs0880173 (PMID 7720341): CPAP at 5 and 10, measurements after 10 minutes, CHF subgroups by filling pressure and normal controls. Do not copy its indexed group outcomes into this passive-VCV preset: respiratory conditions, indexing, timing and pressure references require a matched protocol. No proposed retuning has been adopted.

The clinician further emphasized that reduced venous return may be desirable when it relieves congestion. Do not classify every reduction in filling or every small fall in output as clinical deterioration. Keep relief of congestion, reduced ejection pressure burden and preserved/increased flow as separate outcomes. A move to lower filling pressure is not by itself a demonstrated leftward/upward shift of a cardiac-function relation. In Arthur the plotted ascending curve is explicitly an anchored local RV relation, not an independently sampled LV or global function curve; the horizontal axis is atmospheric RAP. In the current settled preset, PEEP 0 to 10 raises mean atmospheric RAP from about 1.23 to 4.86 mmHg while transmural RAP falls from 2.21 to 1.84; interpreting direction without the pressure reference is misleading. Mean LA transmural pressure falls from about 30.87 to 24.37 mmHg, while mean aortic output falls about 5%. This is a useful unloading observation, not proof of improved intrinsic contractility or a validated clinical tradeoff. Naughton et al., Circulation 1995, doi:10.1161/01.CIR.91.6.1725 (PMID 7882480), is a distinct benchmark for reduced systolic transmural pressure with preserved cardiac index in CHF; it is not interchangeable with the De Hoyos output-increase subgroup. The desired positive-output teaching case remains open alongside the broader unloading objective.

## Cardiac phase and forward-output correction — September 6

Forward LV/RV stroke volumes now integrate the actual limited aortic/pulmonic flows. CO and pulmonary transit use the measured duration of the same completed beat, including when HR changes during it. The oscillator preserves phase on HR changes. Geometric EDV/ESV are sampled at first/end forward ejection and remain separate for EF and PV-loop geometry; beat history stores duration and CO for matched-window means.

The original LV-failure preset combined Ees 0.6 with an exponential diastolic stiffness of 0.040. Its very high atrial pressure allowed late-diastolic mitral-to-aortic throughflow through ideal pressure-driven valves. LV stiffness is 0.027 in the corrected preset; the other preset parameters and the atrial pressure law are retained. This is a didactic phenotype with low EF and elevated filling pressure, selected for admissible chamber/arterial pressure ordering, not fitted to a patient or retuned to preserve a PEEP-output benefit. PEEP 0 to 10 gives mean integrated aortic output 3.121 to 2.965 L/min, with zero overlap and zero diastolic aortic volume at dt 0.00025 and 0.000125 s. The displayed output agrees within 0.00002 L/min in the audit windows.

Ventricular pressure is passive pressure plus a non-negative active increment toward the selected systolic envelope. If that envelope falls below the passive relation, the state is explicitly outside the model domain; the numerical continuation no longer lets contraction reduce pressure. Both ventricles also receive a completed-beat throughflow/diastolic-flow domain check, without forcibly closing either valve. Invalid readouts are suspended through the existing UI mechanism.

The double-Hill time scale is capped at half a cycle, and a smooth terminal taper completes relaxation by 80% of the cycle, before atrial activation. This removes the high-rate clock-wrap discontinuity. These timing choices are documented didactic boundaries, not externally validated tachycardia physiology. Low-rate reference snapshots are stable to rounding; septic, embolism and tamponade snapshots change modestly with timing and matched flow measurement, while the LV-failure snapshot changes with its revised stiffness. Snapshot regeneration was reviewed rather than used to preserve the false intervention claim.

Four cardiac audit findings are promoted to permanent regression checks. Dedicated tests independently integrate both valve flows through mid-beat HR changes, check the measured duration, inspect all 12 preset phase/pressure domains, and require invalid flags for extreme pressure-envelope and throughflow states. The remaining four respiratory/venous findings remain open. The manual, preset note, generated examples and scenario contract teach pressure unloading with lower filling and slightly lower mean forward output.

The LV-stiffness slider uses 0.001 increments so the 0.027 preset is represented exactly by the native browser control; its range and reference value are unchanged. Browser inspection confirmed the updated preset note, reduced EF and elevated wedge pressure, and readout suspension after imposing the extreme 0.040/PEEP-zero combination.

The broad control-space sweep exposed eight extreme states where filling during forward flow makes end-ejection volume exceed pre-ejection volume. Geometric EF is explicitly unavailable (`null`) with an invalid-state reason in that case, rather than clipped to zero. The sweep requires either a finite 0–100% EF or that specific unavailable/invalid contract. Normal preset EF remains numerical.

The final documentation review also corrected two cross-page claims that still described an afterload-dominant output benefit. A separate pulmonary-transit example used a non-preset congested LV state with the same phase problem; its LV stiffness is 0.030 and it retains the delayed-transit lesson in a valid state. The matched transit test now requires all three states to be valid, and the shared manual settlement helper rejects invalid examples instead of publishing their clinical-looking numbers.

## Verification guardrails — September 6

The user authorized verification hardening first, followed by correction of cardiac filling/ejection overlap and output accounting, with local, VPS and GitHub synchronization at each completed stage. Manual pages describe current behavior; this handover records changes and their rationale.

The shallow-checkout path classifier could silently skip model and UI checks when its Git comparison failed. It is replaced by one full verification command on every PR and scheduled run. Pages uses that same reusable workflow as a prerequisite on its own checkout. Child-process failures propagate directly, and generated content must leave the checkout unchanged.

Independent probes now integrate actual aortic and systemic flows, enforce LV/RV flow-volume balance, and measure diastolic throughflow, pressure activation, high-rate continuity, finite-volume R/I, hysteresis refinement, wall-intervention invariance and open-caval reversal. Eight explicitly registered findings remain open in this stage. Known failures are printed and archived, never counted as physiological passes; strict audit fails on them. Missing, malformed and non-finite results, unexpected passes and regressions fail the normal gate. Harness tests exercise that policy.

The LV-failure output claim is suspended pending the cardiac correction: the September audit found approximately 1.63 to 1.90 L/min displayed output with PEEP 0 to 10, while directly integrated aortic flow fell from 2.42 to 2.24 L/min. At PEEP zero, about 29% of aortic volume occurred during simultaneous mitral inflow. Do not restore the clinical claim by changing only the displayed formula or imposing arbitrary valve mutual exclusion. Remaining respiratory/venous audit findings are separate follow-up work.

This document transfers the operational context of the Codex task
`Analizza app e affidabilità fisiolog (2)`
(`019fed8c-1aba-7c70-a331-e6760cfdbbd7`) from its local macOS worktree to the
standalone clone at `/home/ubuntu/arthur` on `nicmaf`.

## Transfer status

- Source worktree: `/Users/nicola/.codex/worktrees/d9e1/heart-lung-sim`
- Destination clone: `/home/ubuntu/arthur`
- Branch: `main`
- Source and destination state: `e834f684943b661d2e7f97ce218bf81e02fd640d`
- Remote: `https://github.com/internalempire/arthur.git` for fetch, SSH for push
- State at transfer: clean and aligned with `origin/main`

The desktop application's native cross-host handoff was unavailable from the
destination host and had previously failed project matching from the source.
The code transfer is nevertheless exact: the destination is a standalone clone
at the same commit as the final source worktree. The conversation itself was not
copied byte for byte. Its recent turns, decisions, final audit, and repository
history were read and consolidated here so the actionable context survives chat
compaction and future clones.

## Purpose and working stance

Arthur is an interactive teaching model that joins respiratory mechanics,
venous return, pulmonary vascular load, biventricular function, and circulatory
timing. It should be used comparatively to explain causal mechanisms, not as a
patient-specific predictor.

The original task began as a review of physiological reliability, code quality,
and final rendering, with changes proposed before implementation. Subsequent
changes were implemented only after explicit approval. The project has since
undergone extensive model, scenario, documentation, test, and UI revision.

The strongest parts of the current model are:

- a closed circulation with conserved represented blood volume;
- explicit measured-versus-transmural pressure handling;
- separate lung and chest-wall mechanics;
- venous return, stressed volume, vascular tone, and waterfall behavior;
- biventricular interaction and shared pericardial constraint;
- delayed RV-to-LV coupling through state-dependent pulmonary transit;
- executable interpretability rules that can mark derived quantities as caution
  or unavailable.

## Latest completed work

### PR #74 — scenario recalibration

Merged as `b745eda`.

- Recalibrated the ARDS scenario using multiple mechanical and hemodynamic
  constraints instead of R/I alone.
- Kept `clung`, `lungCapacity`, collapse, and recruitability independent.
- Corrected the large-pleural-swing scenario from an implausibly large tidal
  volume to an interpretable phenotype.
- Clarified atmospheric versus transmural CVP in pulmonary embolism.
- Updated prone-position and pulmonary-transit limitations.
- Removed the obsolete claim that LV ejection fraction is systematically low.
- Made ARDS, large-swing, and baroreflex numerical examples executable.

At merge, verification was 322/322 model tests, 28/28 UI checks, and 53/53
manual pages with generated examples and lint clean.

### PR #75 — interrogable and comparable UI states

Merged as `e834f68`.

- A common cursor can inspect all waveforms while the simulation is paused.
- Numerical tiles and diagram points follow the selected historical instant
  without rewinding the physiological integrator.
- Ventricular loops show a neutral time marker rather than a ghost loop.
- Pin/Unpin stores displayed tile values for comparison.
- Controls that differ from the neutral reference are identified without being
  labelled abnormal.
- Guyton and PVR panels show compact interpretability warnings.
- The manual documents behavior, meaning, and limits of these features.

At merge, verification was 322/322 model tests, 35/35 UI checks, 53/53 manual
pages, a browser check, and a visual UI review. These counts describe the source
commit; rerun the suites after any new work rather than treating them as current
forever.

## Decisions that must not be accidentally reversed

### Lung compliance is not lung size

`clung` is the local slope of already aerated tissue. `lungCapacity` is the
maximum size of a completely open lung. Collapse determines the unavailable
share, while recruitability determines how much of that share can reopen.
Recoupling compliance and capacity would reintroduce the baby-lung
double-counting that the project deliberately removed.

### R/I is an observable manoeuvre, not a complete phenotype

The recruitment-to-inflation ratio is calculated from the volume response to a
specified PEEP manoeuvre. A numerically correct R/I does not establish plausible
pleural pressure, transpulmonary pressure, EELV, plateau pressure, open fraction,
or hemodynamics. Scenario calibration must constrain those quantities together;
do not force a target R/I by moving opening pressure in isolation.

### Pressure reference is part of the variable

Atmospheric CVP can rise while transmural filling pressure falls. A cardiac
function curve plotted against atmospheric right-atrial pressure shifts with
external pressure even when intrinsic cardiac function is unchanged. Always
name the reference pressure rather than treating measured and transmural values
as interchangeable.

### Derived PVR is not the internal resistance coefficient

The internal J-curve coefficient, instantaneous pulmonary flow resistance, and
catheter-style `(mPAP - wedge) / CO` are different quantities. Respiratory phase,
West-zone assumptions, flow, and averaging can make them move differently.

## Unresolved findings from the final physiological audit

These findings were discussed but not implemented after the final literature
review. Reproduce them before deciding whether they still require code changes.

### 1. PVR is the main structural question

`src/model/lung.js::pvrComponents` builds the open-bed coefficient from lung
volume/strain, transpulmonary pressure, open fraction, low-volume behavior, a
high-resistance closed path, and optional HPV. `src/model/circulation.js` applies
the coefficient with a separate downstream waterfall.

The resistance law does not receive pulmonary flow, transmural pulmonary
arterial or venous pressure, or resistance-vessel distensibility. At equal lung
volume and open fraction, its coefficient is therefore the same at very
different flows. This represents the classical volume-dependent teaching curve,
not a general pressure-flow law for a distensible pulmonary vascular bed.

Recommended order:

1. audit the claims in `manual/pulmonary-vascular-resistance.md`,
   `manual/pvr-volume-vs-pressure.md`, and `manual/pvr-nadir-at-frc.md`;
2. qualify the current curve as a mechanical map at implicit vascular conditions
   if any language is too universal;
3. only then evaluate a minimal pressure/flow/distensibility extension, with
   primary-source targets and tests that distinguish it from the current law.

Do not remove the current curve merely because it is incomplete. It remains
useful for teaching derecruitment, loss of extra-alveolar traction, recruitment,
and overdistension.

### 2. Advanced tamponade may be too compliant

The model correctly uses a common nonlinear pericardial pressure, chamber
competition, preferential right-heart restriction, and a reversible capacity
control. The final audit nevertheless measured the stabilized preset over a
breath at approximately:

- total four-chamber volume: 179-233 mL, about 54 mL excursion;
- pericardial pressure: 5.6-16.6 mmHg, about 11 mmHg excursion.

That is directionally useful for severe pericardial constraint, but may not
represent the nearly fixed total intrapericardial volume described for advanced
hemodynamically manifest tamponade. Before changing
`src/model/circulation.js::pericardialPressure`, define the teaching target and
test effects on atrial waves, y descent, pulsus paradoxus, chamber-volume
exchange, and respiratory pericardial-pressure variation. Capacity is a model
surrogate for available space, not effusion volume.

### 3. Important deliberate omissions

- The baroreflex is an aggregate defense of MAP; it has no inflation-related
  vagal braking.
- Respiratory muscle pressure has no oxygen cost, fatigue, perfusion limit, or
  metaboreflex. Large effort is a mechanical experiment, not a prediction of
  sustainable work.
- Hysteresis is recruitment/derecruitment hysteresis only. Aerated tissue has no
  surfactant or viscoelastic hysteresis.
- The lung is nonregional. Reported stress, strain, and transpulmonary pressure
  do not predict local stress raisers or regional VILI.
- The RV has no characteristic impedance, wave reflections, coronary perfusion,
  ischemic feedback, or regional geometry.
- The wedge readout is a smoothed LA-pressure surrogate, not a simulated PA
  occlusion and not a complete pulmonary venous pressure drop.

Most of these omissions are appropriate to the teaching scope. Strengthen their
documentation before expanding the model unless a concrete teaching question
cannot otherwise be answered.

## Existing planned work

`manual/_todo.md` is authoritative for accepted open work. At transfer it lists:

- separate superior and inferior caval closing pressures;
- validate the latent recruitable compartment against within-group measured R/I
  data;
- full-text search in the manual viewer;
- contradiction linting across manual pages.

The PVR and tamponade findings above are audit questions rather than approved
implementation tasks and are therefore kept here, not silently added to the
project roadmap.

## Reading map

Read in this order before substantive work:

1. `README.md` — project scope, architecture, interface, and commands.
2. `manual/home.md` — clinician-facing documentation map.
3. `docs/MODEL_DECISIONS.md` — accepted model choices and reversals.
4. `docs/PHYSIOLOGY.md` — represented physiology and known limits.
5. `docs/SCENARIO_VALIDATION.md` — scenario-specific validation boundaries.
6. `manual/_log.md` — chronological rationale, including corrected conclusions.
7. `manual/_todo.md` — only the currently accepted planned work.

For the two main unresolved findings also read:

- `manual/pulmonary-vascular-resistance.md`
- `manual/pvr-volume-vs-pressure.md`
- `manual/pvr-nadir-at-frc.md`
- `manual/cardiac-tamponade.md`
- `manual/global-limits.md`
- `src/model/lung.js`
- `src/model/circulation.js`
- `tests/literature.mjs`
- `tests/suites/circulation.test.mjs`
- `tests/suites/lung-mechanics.test.mjs`

## Local workflow on nicmaf

```bash
cd /home/ubuntu/arthur
git status --short --branch
npm test
npm run test:ui
npm run manual:build
npm run manual:lint
```

The project has no runtime dependencies or build step. Serve the application and
manual with:

```bash
npm run serve:dev
```

The development server listens on port 8499. Use an SSH tunnel rather than
exposing it publicly when viewing it from another computer.
