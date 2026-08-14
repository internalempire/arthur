# Validation

> A green test means that one explicit numerical, mechanistic or documentary contract still holds; it does not make the model a validated patient predictor.

---

## Four levels of confidence

| level | question | what exists |
|---|---|---|
| numerical verification | does the code solve its own equations consistently? | conservation, positivity, determinism and time-step-refinement checks |
| implementation verification | do panels, controls and documentation match the model? | public-API, registry, curve-agreement, snapshot and documentation contracts |
| physiological face validity | does a controlled manoeuvre move variables in the established direction? | mechanism tests and scenario intervention audits |
| quantitative external validation | does the model predict independent human measurements across patients? | not established |

The first three levels are valuable, but they cannot be promoted into the fourth by increasing the number of tests.

## The executable suite

`npm test` runs 200 dependency-free checks across eight suites.

### Safety and numerical behaviour

- total blood volume is conserved to 0.01 mL in every scenario unless the volume control intentionally adds or removes blood;
- every compartment remains positive in every preset and a deterministic 250-configuration control-space sweep;
- repeated simulations with identical input produce identical output;
- selected continuous outputs converge when the time step is halved;
- non-finite, capacity-clamped or volume-floor states suspend clinical readouts.

### Core physiological contracts

The tests change one variable and require a direction: passive PEEP raises measured CVP and commonly lowers output in the reference state; spontaneous inspiration lowers measured CVP while raising transmural filling; added volume helps more when underfilled; short expiration traps gas; a stiff chest wall transmits more pleural pressure; raised pulmonary load dilates a vulnerable RV; disabling septal coupling relieves its LV filling penalty.

These tests demonstrate that the encoded mechanism has not reversed. They do not specify how large the response should be in a patient.

### Published literature rows

[`LITERATURE_RANGES.md`](../docs/LITERATURE_RANGES.md) converts selected published findings into executable manoeuvres. Current rows include:

- human ARDS absolute PVR and PEEP response in low- and high-recruitability calibration phenotypes;
- a PVR minimum near model FRC and the correct direction of both J-curve limbs;
- chest-wall and lung effects on pressure transmission;
- greater haemodynamic PEEP cost at lower filling;
- COPD waterfall behaviour below and above the expiratory choke;
- venous-return plateau, venous-tone volume shift and pulmonary-transit ordering;
- withholding PPV during spontaneous breathing and pulmonary-hypertension classification logic.

The source table records whether each row currently agrees. Its status field is itself tested, so documentation cannot continue to say *agrees* after the executable predicate fails.

### Scenario contracts

Every preset is tested for safety and a settled snapshot. [`SCENARIO_VALIDATION.md`](../docs/SCENARIO_VALIDATION.md) asks the more important question: does the proposed intervention actually demonstrate the claim written beside it? Presets are labelled supported, qualified or needing correction. The former weaning preset was removed because the model lacked enough of its mechanism to reproduce the intended lesson.

## Calibration hierarchy

Human in-vivo measurements take priority when an appropriate matched quantity exists. Contemporary clinical syntheses constrain teaching geometry and direction. Animal, isolated-lung and ex-vivo studies support mechanism when human decomposition is unavailable, but their numerical extrema are not imported as human targets.

Not every coefficient has a source. A coefficient chosen to make an established but unquantified relationship visible is labelled a didactic shape coefficient. Attaching a paper to it would imply a calibration that did not occur.

## What green does not mean

- It does not establish diagnostic accuracy, patient-specific prediction or treatment benefit.
- It does not prove that a passing directional relationship has the correct magnitude.
- It does not validate physiology omitted from the state equations.
- It does not make two similarly named quantities interchangeable—for example, pulmonary resistance coefficient and catheter-derived PVR.
- It does not establish parameter identifiability: different control combinations can produce similar visible states.
- It does not replace prospective comparison against independent human data.

## Limits

There is no systematic global sensitivity or uncertainty analysis, no parameter-identifiability study, no external patient dataset, no formal calibration likelihood and no blinded prospective evaluation. Several anchors are small studies or animal experiments. Ejection fraction remains approximately 5–10 percentage points lower than desired despite plausible stroke volume, output and loop shape. Extreme combinations are safety-tested more broadly than they are physiologically validated.

## How to run the checks

```bash
npm test
npm run manual:build
npm run manual:lint
```

Snapshot regeneration is intentionally separate: `npm run snapshots`. A changed snapshot must be reviewed as a model change, not automatically accepted as a test fix.

## References

- Oberkampf WL, Roy CJ. *Verification and Validation in Scientific Computing*. Cambridge University Press; 2010.
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med*. 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC)
- Fougères E, Teboul JL, Richard C, et al. Haemodynamic impact of a positive end-expiratory pressure setting in ARDS. *Crit Care Med*. 2010;38:802–807.
- Ranieri VM, Dambrosio M, Brienza N. Intrinsic PEEP and cardiopulmonary interaction in COPD. *Eur Respir J*. 1996;9:1283–1292. [PubMed](https://pubmed.ncbi.nlm.nih.gov/8804950/)

---

## See also

[Model architecture](model-architecture.md) · [Global limits](global-limits.md) · [Interpretability](interpretability.md) · [Clinical scenarios](scenarios.md) · [`LITERATURE_RANGES.md`](../docs/LITERATURE_RANGES.md) · [`SCENARIO_VALIDATION.md`](../docs/SCENARIO_VALIDATION.md)
