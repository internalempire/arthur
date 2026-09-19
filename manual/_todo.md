# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Model

### Demonstrate a sustained LV output benefit under a defined positive-pressure protocol

The isolated LV probe demonstrates greater forward ejection at fixed starting volume and aortic pressure, but the intact `lv-failure` preset loses enough filling to reduce settled output. The September 6 exploratory comparisons also test loading, passive LV stiffness, venous compliance, RV contractility and coupling. They do not establish impossibility across the control space or justify changing the preset solely to force a positive result. Define a clinical comparison with explicit respiratory effort, pressure reference and measurement timing; examine systemic venous pressure transmission and blood redistribution before proposing a mechanistic or phenotype change. Retain independent flow integration, valid phases, plausible absolute pressures/volumes and numerical convergence as separate conditions. See `tools/experiments/lv-afterload.mjs` and the handover.

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

### Validate opening profiles as coupled respiratory–circulatory phenotypes

Constrain the magnitude of within-breath opening and its plateau/compliance consequences against measurements obtained under a matched pressure-history protocol. The September 18 study identifies a large opening contribution in the memory-off profile. The September 19 matched before/after experiment confirms that retained additional opening can lower plateau and raise compliance in one unchanged lung; comparing memory-off and memory-on profiles cannot test that intervention. The unresolved question is the quantitative realism of cyclic opening, including whether a bounded sensitivity study of the fixed opening-distribution width is warranted before changing it. Keep gas-volume contributions distinct from CT tissue fractions. Extend joint checks beyond the passive ARDS/RV phenotype to other mechanics and ventilatory modes. Define which vascular comparisons are defensible when the aggregate zone-3 condition fails; do not treat internal fractions as anatomy or an atrial-pressure ratio as a validated catheter measurement. Preserve the current constitutive laws unless a clinically explained, materially useful correction is authorized.
