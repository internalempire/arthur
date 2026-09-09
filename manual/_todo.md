# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Model

### Demonstrate a sustained LV output benefit under a defined positive-pressure protocol

The isolated LV probe demonstrates greater forward ejection at fixed starting volume and aortic pressure, but the intact `lv-failure` preset loses enough filling to reduce settled output. The September 6 exploratory comparisons also test loading, passive LV stiffness, venous compliance, RV contractility and coupling. They do not establish impossibility across the control space or justify changing the preset solely to force a positive result. Define a clinical comparison with explicit respiratory effort, pressure reference and measurement timing; examine systemic venous pressure transmission and blood redistribution before proposing a mechanistic or phenotype change. Retain independent flow integration, valid phases, plausible absolute pressures/volumes and numerical convergence as separate conditions. See `tools/experiments/lv-afterload.mjs` and the handover.

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

- Resolve the separately tracked finite-volume R/I and chest-wall intervention findings. See the audit registry and handover.
