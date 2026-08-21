# Planned work

> Things the model or the manual should acquire, with enough context to act on without reconstructing the argument. Not a wish list: an item earns a place here when a teaching question cannot be answered honestly without it, or when a simplification has been identified as one that should not survive.

---

## Model

### Separate superior and inferior caval closing pressures

The superior vena cava is surrounded by pleural pressure and the inferior by abdominal pressure, and the model uses one closing pressure derived from the abdomen alone. The consequences, and why this survived while the analogous pulmonary simplification did not, are set out under [vascular waterfalls](vascular-waterfalls.md).

### Map the recruitable compartment onto measured R/I from within-group data

Open since the J-curve work. Cappio Borlino's within-group R/I values and Table 2 respiratory mechanics would let the internal openable fraction be checked against the cohort rather than solved to a target the user selects. See [recruitment and R/I](recruitment-and-ri.md).

---

## Manual

- Full-text search. The viewer currently searches page titles and summaries only; a generated index over page text would make 56 pages navigable.
- A lint pass for contradictions between pages. The current linter checks that a page renders and that its links resolve; it cannot tell whether two pages disagree, or whether a number has gone stale since the model changed.
- Fix in-page table-of-contents links. The current hash router treats a URL such as `#/hysteresis#a-reproducible-experiment` as the slug of a new page and renders “Not found” instead of scrolling within the current page. This was reproduced in the local viewer during the hysteresis-page QA.
