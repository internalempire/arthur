# Project handover

Updated: 2026-09-06

## Whole-heart Guyton response — September 6

The clinician requested reconstruction of the RV-only choice and restoration of the classical cardiac-output view. The original August 8 implementation already calculated a fast RV relation. PR #43 / ef86743 (August 21) renamed the existing calculation for honesty rather than replacing an LV model with an RV model. The August 25 change 494b166 anchored that RV relation to measured mean RV EDV/ESV to avoid equating mean RAP with RV end-diastolic transmural pressure and to repair clock/operating-point mismatch after adding IVC storage. Its reference-point agreement was therefore explicitly not independent validation.

The new displayed relation uses controlled RA inflow in disposable biventricular/pulmonary simulations. The reference supplies the same normalized inflow waveform, respiratory trajectory and systemic source-pressure trajectory. Copies retain systemic arterial impedance and all cardiac/pulmonary equations. Mean RAP is measured as the pressure needed to pass each flow; aortic and pulmonic flows are integrated independently. Inflow minus aortic outflow must equal central volume change. Only finite, settled, domain-valid points are drawn, with gaps at rejected points and no invented plateau. The panel keeps atmospheric RAP on the horizontal axis and labels the response Cardiac output (LV), meaning whole-heart output measured at the LV outlet.

The worker freezes the supplied effective autonomic drive, uses paired minute windows and cancels obsolete calculations when controls change. Recalculate CO refreshes that reference. A new directly integrated aortic-flow history places a mean LV-output marker beside the distinct mean venous-inflow marker; the faint trail remains venous inflow. The fast RV preload coefficient remains analytically unchanged, now explicitly titled RV preload reserve, and is no longer highlighted on the global curve. The patient integrator's pressure, valve and volume equations and presets remain unchanged.

This is a reference-conditioned loading experiment, not a universally validated patient-specific CO curve. Its scale-one reference agreement is a consistency check; sensitivity to changed LV contractility under identical boundaries is tested separately. Frozen vascular properties do not mean fixed aortic pressure: the retained arterial resistance and compliance allow pressure to respond to each flow. Curve position must not be presented as an isolated contractility measurement.

The worker snapshot preserves raw posture settings and selectively freezes HR, Ees, systemic resistance and venous-tone recruitment. Reference settlement retains the sampled venous tone explicitly instead of losing it when feedback is disabled. A prone/frozen-tone regression checks these boundaries. RAP stability is checked alongside flow settlement, using a between-window tolerance of 0.05 mmHg plus 0.5% of its magnitude.

Validation: 11 focused response/worker/marker checks, 36 UI checks, 10 verification-harness checks, 18 generated examples and 53 manual pages passed. The full local model run exercised 376 checks; its sole failure was the public-export allowlist missing the two new browser entry points. That explicit list was updated and all 81 contracts passed on rerun. The mandatory publishing workflow repeats the complete suite on the published revision. The independent audit retains the same four known respiratory/venous failures. The two-level response sweep accepted the sampled points in all 12 presets. Browser inspection covered healthy and LV-failure curves, paused calculation, live VR switching, status and the manual figure; curve type uses line style consistently in that figure.

The reproducible `tools/experiments/guyton-response.mjs` probe was replayed on VPS Node 22 against local Node 24: identical model-source hashes and accepted/rejected points, maximum CO difference 9.33e-15 L/min and RAP difference 7.82e-14 mmHg. The weak-LV matched-boundary comparison passes at 40% reference inflow; its 60% point is outside the domain and is not used to claim an effect magnitude. The LV-failure curve accepts seven of eight sampled loads and excludes the invalid 140% tail. The Italian clinician report and both numerical reports are saved in VPS `outputs/` as `Arthur-Guyton-LV-*2026-09-06.*`. This change does not establish a sustained PEEP-output benefit in LV failure.

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
