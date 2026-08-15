# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Model

### Cardiac tamponade — a scenario and the mechanics to support it

**Wanted:** a tamponade preset, and a pericardium capable of producing it.

**Why it does not work today.** The pericardium is one exponential constraint on total heart volume that engages above 430 mL and is soft even well beyond it: a frankly dilated heart at 501 mL loses under 2% of cardiac output to it. See [ventricular interdependence](ventricular-interdependence.md) for the measurement. There is no pericardial fluid, no effusion volume, and no way to make the sac small.

**What it would need.** A pericardial volume that is itself a control, so a small sac can be imposed on a normal heart rather than requiring an enormous heart to meet a fixed one. Tamponade's characteristic findings then follow from what the model already has: equalisation of diastolic pressures across all four chambers, because they share one external pressure; exaggerated ventricular interdependence, because filling one chamber must empty another; and pulsus paradoxus, because inspiration redistributes filling between ventricles inside a fixed total volume. The last of these is the reason it belongs in a heart–lung simulator at all — it is a heart–lung interaction, not a cardiology topic.

**What to check it against.** The model should reproduce the equalisation of right atrial, right ventricular diastolic, pulmonary artery diastolic and wedge pressures, and an inspiratory fall in systolic pressure that is larger with the pericardium constrained than without. Whether the magnitudes can be calibrated is an open question — this would likely be a directional constraint rather than a numerical one.

### Make the chest-wall reference independent of the lung

The respiratory model recalculates `relaxationVolume(p)` from aerated-lung compliance, maximum capacity and open fraction, then assigns −5 cmH₂O pleural pressure at that volume. This shifts the chest-wall relation with every lung phenotype. A future implementation should give the chest wall its own relaxation volume or pressure–volume relation and solve the zero-flow equilibrium from the intersection of lung and chest-wall recoil. The change must preserve a legible within-breath equation of motion and be tested across normal, ARDS and emphysema phenotypes.

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

### Map the recruitable compartment onto measured R/I from within-group data

Open since the J-curve work. Cappio Borlino's within-group R/I values and Table 2 respiratory mechanics would let the internal openable fraction be checked against the cohort rather than solved to a target the user selects. See [recruitment and R/I](recruitment-and-ri.md).

---

## Manual

- Full-text search. The viewer currently searches page titles and summaries only; a generated index over page text would make 56 pages navigable.
- A lint pass for contradictions between pages. The current linter checks that a page renders and that its links resolve; it cannot tell whether two pages disagree, or whether a number has gone stale since the model changed.
- Fix in-page table-of-contents links. The current hash router treats a URL such as `#/hysteresis#a-reproducible-experiment` as the slug of a new page and renders “Not found” instead of scrolling within the current page. This was reproduced in the local viewer during the hysteresis-page QA.
