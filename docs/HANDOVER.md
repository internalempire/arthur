# Project handover

Updated: 2026-09-06

## Cardiac phase and forward-output correction — September 6

Forward LV/RV stroke volumes now integrate the actual limited aortic/pulmonic flows. CO and pulmonary transit use the measured duration of the same completed beat, including when HR changes during it. The oscillator preserves phase on HR changes. Geometric EDV/ESV are sampled at first/end forward ejection and remain separate for EF and PV-loop geometry; beat history stores duration and CO for matched-window means.

The original LV-failure preset combined Ees 0.6 with an exponential diastolic stiffness of 0.040. Its very high atrial pressure allowed late-diastolic mitral-to-aortic throughflow through ideal pressure-driven valves. LV stiffness is 0.027 in the corrected preset; the other preset parameters and the atrial pressure law are retained. This is a didactic phenotype with low EF and elevated filling pressure, selected for admissible chamber/arterial pressure ordering, not fitted to a patient or retuned to preserve a PEEP-output benefit. PEEP 0 to 10 gives mean integrated aortic output 3.121 to 2.965 L/min, with zero overlap and zero diastolic aortic volume at dt 0.00025 and 0.000125 s. The displayed output agrees within 0.00002 L/min in the audit windows.

Ventricular pressure is passive pressure plus a non-negative active increment toward the selected systolic envelope. If that envelope falls below the passive relation, the state is explicitly outside the model domain; the numerical continuation no longer lets contraction reduce pressure. Both ventricles also receive a completed-beat throughflow/diastolic-flow domain check, without forcibly closing either valve. Invalid readouts are suspended through the existing UI mechanism.

The double-Hill time scale is capped at half a cycle, and a smooth terminal taper completes relaxation by 80% of the cycle, before atrial activation. This removes the high-rate clock-wrap discontinuity. These timing choices are documented didactic boundaries, not externally validated tachycardia physiology. Low-rate reference snapshots are stable to rounding; septic, embolism and tamponade snapshots change modestly with timing and matched flow measurement, while the LV-failure snapshot changes with its revised stiffness. Snapshot regeneration was reviewed rather than used to preserve the false intervention claim.

Four cardiac audit findings are promoted to permanent regression checks. Dedicated tests independently integrate both valve flows through mid-beat HR changes, check the measured duration, inspect all 12 preset phase/pressure domains, and require invalid flags for extreme pressure-envelope and throughflow states. The remaining four respiratory/venous findings remain open. The manual, preset note, generated examples and scenario contract teach pressure unloading with lower filling and slightly lower mean forward output.

The LV-stiffness slider uses 0.001 increments so the 0.027 preset is represented exactly by the native browser control; its range and reference value are unchanged. Browser inspection confirmed the updated preset note, reduced EF and elevated wedge pressure, and readout suspension after imposing the extreme 0.040/PEEP-zero combination.

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
