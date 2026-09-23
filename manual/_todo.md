# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Model

### Define any further LV/CPAP experiment by a specific mechanical question

The isolated LV probe demonstrates greater ejection at fixed starting volume and aortic pressure. In the intact LV-failure preset, reduced filling offsets that benefit. The September 6 exploration and September 23 passive-VCV, fixed-effort CPAP and parameter-screening experiments do not establish a sustained, meaningful isolated LV-ejection benefit. The latest combined reopenable-lung/weak-RV case does produce a small reproducible output increase, but preserves LV filling through a coupled response and is sensitive to the prescribed effort; it must not become a clinically validated preset or be labelled pure LV unloading. The next useful question is which pathway limits the response: loss of LV filling versus the available ejection benefit, with pulmonary loading and ventricular interaction kept explicit. Define a discriminating mechanical experiment before extending the search. Respiratory fatigue and automatic effort adaptation remain outside the clinician's scope. Do not adjust coefficients to force higher output or treat a missing clinical effect as proof of a numerical defect. External comparisons require compatible pressure references, timing and respiratory conditions. See the handover and `tools/experiments/lv-afterload.mjs`.

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

### Validate opening profiles as coupled respiratory–circulatory phenotypes

Constrain the magnitude of within-breath opening and its plateau/compliance consequences against measurements obtained under a matched pressure-history protocol. The September 18 study identifies a large opening contribution in the memory-off profile. The September 19 matched before/after experiment confirms that retained additional opening can lower plateau and raise compliance in one unchanged lung; comparing memory-off and memory-on profiles cannot test that intervention. The September 20 width-sensitivity study finds substantial plateau/compliance changes but small same-PEEP output changes in the two tested memory-off phenotypes, without selecting a more physiological width. The unresolved question is quantitative realism: identify a respiratory teaching target and matched measurements before proposing a replacement, and separately check retained-opening behavior for any candidate. Keep gas-volume contributions distinct from CT tissue fractions. Extend joint checks beyond the passive ARDS/RV phenotype to other mechanics and ventilatory modes. Define which vascular comparisons are defensible when the aggregate zone-3 condition fails; do not treat internal fractions as anatomy or an atrial-pressure ratio as a validated catheter measurement. Preserve the current constitutive laws unless a clinically explained, materially useful correction is authorized.

## Teaching presentation — discuss before implementation

The clinician wants a reminder to revisit the Neel Clinical Skills ideas after the LV/CPAP assessment, when discussing how to present the mechanisms. Review blood-volume redistribution using existing compartments, comparisons of previous and current states, guided single-variable experiments and clear labels for prescribed, calculated and derived quantities. Arthur already has several related facilities; identify a concrete teaching gain before adding controls or panels. This is a pending discussion, not authorization to change the interface or physiology. Private review: `codex-notes/Arthur-spunti-Neel-Clinical-Skills-2026-09-23.md`.
