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

## Development review and validation

The model, code, tests, interface and manual were generated primarily with GPT-5.6-Sol using the high reasoning setting, under human-in-the-loop direction and revision. Other LLMs cross-reviewed internal consistency, physiological claims against the available literature and agreement between implementation and documentation. Human clinical review selected the scope and literature, challenged results, tested the interface and approved substantive changes.

These layers can expose contradictions, stale documentation and implausible directions, but they are not independent scientific validation. LLM reviewers may share assumptions and failure modes, while human review of a teaching model is not a blinded comparison with external patient data. The evidence level therefore depends on the executable and experimental anchors described below, not on the number or identity of reviewers.

## The executable suite

`npm test` runs dependency-free checks across the model's numerical, physiological and documentary domains. The exact count is intentionally not embedded here because every new contract would otherwise make the validation page stale.

### Safety and numerical behaviour

- total blood volume is conserved to 0.01 mL in every scenario unless the volume control intentionally adds or removes blood;
- every compartment remains positive in every preset and a deterministic 250-configuration control-space sweep;
- repeated simulations with identical input produce identical output;
- selected continuous outputs converge when the time step is halved;
- non-finite, capacity-clamped or volume-floor states suspend clinical readouts.

### Core physiological contracts

The tests change one variable and require a direction: passive PEEP raises measured CVP and commonly lowers output in the reference state; spontaneous inspiration lowers measured CVP while raising transmural filling and RV end-diastolic volume; post-inspiratory pressure persists into early expiration and then decays; added volume helps more when underfilled; short expiration traps gas; a stiff chest wall transmits more pleural pressure; raised pulmonary load dilates a vulnerable RV; disabling septal coupling relieves its LV filling penalty.

Pressure-support timing has separate executable contracts. Patient effort must lower Ppl while Paw remains at PEEP before triggering; Paw must then rise over the fixed 100 ms interval. In the obstructed phenotype, external PEEP must shorten the pre-trigger delay, while an effort too weak to overcome intrinsic PEEP must remain ineffective. A restrictive short-time-constant setup must be able to cycle while neural inspiration is still active and report that state as early cycling.

These tests demonstrate that the encoded mechanism has not reversed. They do not specify how large the response should be in a patient.

Interpretability is also executable physiology. A zone-3 state must leave the [wedge surrogate](pulmonary-artery-wedge-pressure.md) and derived PVR unqualified; when the pressure-margin heuristic fails, both must carry the same caution. This prevents a valid division from concealing an uncertain downstream pressure. Likewise, the same end-expiratory volume and pressure fields must be described as active-breath EELV when inspiratory effort is present, while the intrinsic-PEEP and trapped-gas labels remain reserved for passive emptying.

### Published literature rows

[`LITERATURE_RANGES.md`](../docs/LITERATURE_RANGES.md) converts selected published findings into executable manoeuvres. Current rows include:

- human ARDS absolute PVR and PEEP response in low- and high-recruitability calibration phenotypes;
- human ARDS group recruited volume and low/high-PEEP lung compliance for one shared latent R/I-mapping phenotype;
- a PVR minimum near model FRC and the correct direction of both J-curve limbs;
- chest-wall and lung effects on pressure transmission;
- greater haemodynamic PEEP cost at lower filling;
- COPD waterfall behaviour below and above the expiratory choke;
- venous-return plateau, venous-tone volume shift and pulmonary-transit ordering;
- withholding PPV during spontaneous breathing and pulmonary-hypertension classification logic.

The source table records whether each row currently agrees. Its status field is itself tested, so documentation cannot continue to say *agrees* after the executable predicate fails.

The manual has two narrower implementation guards as well. A generated search index is compared byte-for-byte with current page text, and explicitly marked repeated facts must agree across pages and with selected exported model constants. The latter catches known numerical contradictions; it is not a semantic proof that all unmarked prose agrees.

### Scenario contracts

Every preset is tested for safety and a settled snapshot. The parameter-difference tables in the [scenario page](scenarios.md#preset-parameter-changes) are generated directly from `defaultParams()` and `SCENARIOS`; manual validation fails if the documented tables no longer match the code. [`SCENARIO_VALIDATION.md`](../docs/SCENARIO_VALIDATION.md) asks the more important question: does the proposed intervention actually demonstrate the claim written beside it? Presets are labelled supported, qualified or needing correction. The former weaning preset was removed because the model lacked enough of its mechanism to reproduce the intended lesson.

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

There is no systematic global sensitivity or uncertainty analysis, no parameter-identifiability study, no external patient dataset, no formal calibration likelihood and no blinded prospective evaluation. Several anchors are small studies or animal experiments. Extreme combinations are safety-tested more broadly than they are physiologically validated.

## How to run the checks

```bash
npm test
npm run manual:build
npm run manual:lint
```

Snapshot regeneration is intentionally separate: `npm run snapshots`. A changed snapshot must be reviewed as a model change, not automatically accepted as a test fix.

Pull requests use three verification profiles. Documentation-only changes rebuild and lint the manual; application-shell and UI-only changes run syntax plus a small module-and-mount-point smoke suite; any change to the physiological model, scenarios, tests, generated numerical examples or workflow runs the full suite. A weekly scheduled run also executes the full profile. This avoids repeating slow settling experiments for prose-only work without allowing a model change to bypass them.

## References

- Oberkampf WL, Roy CJ. *Verification and Validation in Scientific Computing*. Cambridge University Press; 2010. [doi:10.1017/CBO9780511760396](https://doi.org/10.1017/CBO9780511760396)
- Cappio Borlino S, Hagry J, Lai C, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med*. 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC)
- Fougères E, Teboul JL, Richard C, et al. Haemodynamic impact of a positive end-expiratory pressure setting in ARDS. *Crit Care Med*. 2010;38:802–807. [doi:10.1097/CCM.0b013e3181c587fd](https://doi.org/10.1097/CCM.0b013e3181c587fd)
- Ranieri VM, Dambrosio M, Brienza N. Intrinsic PEEP and cardiopulmonary interaction in COPD. *Eur Respir J*. 1996;9:1283–1292. [doi:10.1183/09031936.96.09061283](https://doi.org/10.1183/09031936.96.09061283)

---

## See also

[Model architecture](model-architecture.md) · [Global limits](global-limits.md) · [Interpretability](interpretability.md) · [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) · [Clinical scenarios](scenarios.md) · [`LITERATURE_RANGES.md`](../docs/LITERATURE_RANGES.md) · [`SCENARIO_VALIDATION.md`](../docs/SCENARIO_VALIDATION.md)
