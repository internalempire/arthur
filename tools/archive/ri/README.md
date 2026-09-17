# Isolated R/I archive

Frozen from Arthur `21178fbd0c0965c04740c5c60c890a74a53d4da2` on 2026-09-17.
The clinician retired R/I from the active model and its acceptance criteria.
These copies are for explicit recovery and research, not current physiology or
an independently validated clinical R/I measurement. No application, active
model test, audit or manual generator imports them. Every relative code import
within this directory stays within it; the directory can be moved as a unit.

`lung.js` retains the static assessment, calibration and the exact mechanical
helpers on which they depended. `units.js`, `parameters.js`, `recruitment.js`
and `patient-state.js` freeze the dependencies required to convert version-1
prescriptions. `recruitment-cohort.mjs` retains the historical cohort mapping.
The discontinued finite-volume audit is recoverable from the source commit's
`tests/support/audit-probes.mjs`; its failed comparison was retired, not fixed
or reclassified as a passing clinical measurement.

To recover a version-1 patient file, explicitly run:

```sh
node tools/archive/ri/convert-patient.mjs input-v1.json output-v2.json
```

Then load the version-2 output in Arthur. The converter never overwrites a
file. It uses the archived full supine prescription before position is applied,
including the historical default ratio when absent, and preserves explicit
values at full precision. Inspect any reported unknown settings. Nothing from
this tool runs in the browser or during normal tests/builds. No version-1 file
is silently interpreted as a current non-reopenable phenotype.

Active PVR and mechanics regression fixtures use frozen explicit shares;
their equations, values and tolerances are unchanged. Recovering or adopting
an R/I feature in future requires a separate decision and validation.
