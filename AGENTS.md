# Project instructions

Arthur is a browser-based teaching model of mechanical heart-lung interaction.
It is not a medical device, a patient-specific model, or a treatment calculator.

## Start here

Before changing the project, read these files in order:

1. `docs/HANDOVER.md`
2. `README.md`
3. `manual/home.md`
4. `docs/MODEL_DECISIONS.md`
5. `docs/PHYSIOLOGY.md`
6. `docs/SCENARIO_VALIDATION.md`
7. `manual/_todo.md`

Use `manual/_log.md` when reconstructing why an existing implementation or
documentation choice was made.

## Scope and implementation

- Keep the runtime dependency-free and written in vanilla JavaScript unless the
  user explicitly approves an architectural change.
- Preserve the separation between aerated-lung compliance (`clung`), maximum
  lung capacity (`lungCapacity`), collapsed fraction, and recruitability.
- Do not silently change physiological assumptions, coefficients, units,
  scenario targets, or interpretability rules.
- Distinguish internal model coefficients, catheter-derived indices, and direct
  measurements. A shared name does not make them interchangeable.
- Match published values only under the conditions in which they were measured.
  Prefer primary literature and record the applicable population, manoeuvre,
  phase of the breath, and reference pressure.
- Treat the model as a causal teaching argument. When a mechanism is deliberately
  omitted, document the boundary instead of implying clinical completeness.
- Propose substantive physiological changes before applying them unless the
  current user request explicitly authorizes implementation.

## Documentation

- Write the manual for clinicians first, then explain implementation details.
- Keep symbols, units, pressure references, averaging windows, and respiratory
  phase explicit.
- Do not hand-edit generated numerical examples or figures. Use the generators
  referenced by `package.json` and `manual/model-examples.mjs`.
- Append material changes and corrected conclusions to `manual/_log.md`.
- Put only genuinely unresolved, actionable gaps in `manual/_todo.md`.

## Verification

Run checks in proportion to the change:

- model, scenario, or shared logic: `npm test`
- UI behavior: `npm run test:ui` plus a browser check
- manual or generated examples: `npm run manual:build` and
  `npm run manual:lint`
- snapshot-affecting model changes: regenerate with `npm run snapshots`, inspect
  the diff, then rerun the relevant suites

Never hide a failing command behind a pipeline whose exit status belongs to a
later command. Report the exact checks run and any checks that could not run.
