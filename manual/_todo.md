# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Pulmonary review checkpoint

**Pulmonary arterial pulse pressure and RV ejection** are the next proposed check. Start with the healthy passive circulation. Increase only precapillary resistance, keeping the ventilator settings, heart rate and prescribed blood volume fixed. At the same respiratory phase compare pulmonary arterial systolic, diastolic and mean pressures, RV stroke volume and the pressure decay after the pulmonary valve closes. Compare with human measurements under compatible flow and downstream filling pressures. Clinical catheter data show that the relation between resistance and compliance depends on wedge pressure. Consider a change to arterial compliance only if a discrepancy alters the teaching interpretation of RV load. [Tedford et al., human catheterisation data](https://pubmed.ncbi.nlm.nih.gov/22131357/)

The size of the resistance increase under positive inflation in the Peták preparation also remains an open comparison. Revisit it when the experimental pressure boundaries and the model conditions can be matched.

Seek matched evidence for absolute pulmonary blood volume and the size and timing of RV-to-LV respiratory variation. The fixed storage coefficients, extra-alveolar traction and degree of pressure-dependent narrowing have limited quantitative validation in humans. Varying middle compliance also changes the pressure scale for narrowing. Keep both effects explicit when interpreting a storage experiment.

## Model

### Resolve the prone prescription's pressure response

The current ARDS position transformation combines increased opening with a stiffer chest wall and higher abdominal pressure. Plateau rises substantially and the whole-circuit RV/LV volume ratio does not fall, despite lower isolated geometric resistance. First examine the respiratory pressure response under a declared comparison; clinical prone unloading studies also changed airway pressure and PaCO2, and the latter mechanism is absent here. Keep the original RV/LV criterion visibly open. Do not tune the pulmonary law or substitute a favorable component readout for net RV unloading.

### Resolve the remaining tamponade phenotype criteria

The shared pericardial constraint and its release are represented, but the original diastolic-spread and normalized IVC-volume-excursion criteria remain open in the independent audit. Reconcile the pressures' sampling windows and distinguish compartment volume from ultrasound diameter before proposing a correction. The high output and arterial pressure after decompression also remain an absolute-plausibility limitation. No preset or threshold should be adjusted solely to make these tests pass.

### Revisit LV/CPAP only after agreeing a new teaching question

The isolated LV probe demonstrates greater ejection at fixed starting volume and aortic pressure. In the intact LV-failure preset, reduced filling offsets that benefit. The September 6 exploration and September 23 passive-VCV, fixed-effort CPAP and parameter-screening experiments do not establish a sustained, meaningful isolated LV-ejection benefit. The latest combined reopenable-lung/weak-RV case does produce a small reproducible output increase, but preserves LV filling through a coupled response and is sensitive to the prescribed effort; it must not become a clinically validated preset or be labelled pure LV unloading. The clinician has paused this line of exploration. It is not the next scheduled model task. If it is reopened, first agree a discriminating question about loss of LV filling versus available ejection benefit, with pulmonary loading and ventricular interaction explicit; do not resume broad parameter searches automatically. Respiratory fatigue and automatic effort adaptation remain outside the clinician's scope. Do not adjust coefficients to force higher output or treat a missing clinical effect as proof of a numerical defect. External comparisons require compatible pressure references, timing and respiratory conditions. See the handover and `tools/experiments/lv-afterload.mjs`.

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

### Validate opening profiles as coupled respiratory–circulatory phenotypes

Constrain the magnitude of within-breath opening and its plateau/compliance consequences against measurements obtained under a matched pressure-history protocol. The September 18 study identifies a large opening contribution in the memory-off profile. The September 19 matched before/after experiment confirms that retained additional opening can lower plateau and raise compliance in one unchanged lung; comparing memory-off and memory-on profiles cannot test that intervention. The September 20 width-sensitivity study finds substantial plateau/compliance changes but small same-PEEP output changes in the two tested memory-off phenotypes, without selecting a more physiological width. The unresolved question is quantitative realism: identify a respiratory teaching target and matched measurements before proposing a replacement, and separately check retained-opening behavior for any candidate. Keep gas-volume contributions distinct from CT tissue fractions. Extend joint checks beyond the passive ARDS/RV phenotype to other mechanics and ventilatory modes. Define which vascular comparisons are defensible when the middle vascular outlet is compressed; do not treat internal fractions as anatomy or an atrial-pressure ratio as a validated catheter measurement. Preserve the current constitutive laws unless a clinically explained, materially useful correction is authorized.
