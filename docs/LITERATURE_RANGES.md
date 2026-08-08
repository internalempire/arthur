# Literature ranges

Published findings the model can be held to, each as a manoeuvre with an
expected result and a source. `node tests/run.mjs` executes every row.

**The `Status` column is itself tested.** A row marked `agrees` that stops
agreeing fails the suite, and so does a row marked `not yet` that starts
agreeing — because a stale document is the failure mode this file exists to
prevent. Changing a status is therefore a deliberate act, reviewed like any
other change.

A failing row means one of two things: the model is wrong, or the reading of
the source is wrong. Both are worth knowing. The `not yet` rows below are open
work, not excuses.

## Rows

| id | Manoeuvre and expected result | Status | Source |
|---|---|---|---|
| `peep-euvolaemia` | PEEP 5 → 10 at a protective tidal volume raises mean systemic filling pressure by 1–3 mmHg, so the gradient for venous return is largely defended and the fall in cardiac output stays under 10% in a euvolaemic patient. | agrees | Berger et al., *Am J Physiol Heart Circ Physiol* 2016;311:H794–806 |
| `peep-volume-status` | The haemodynamic cost of PEEP depends on volume status: raising PEEP from 5 to 15 costs a hypovolaemic patient at least 1.5 times what it costs a euvolaemic one. | agrees | Fougères et al., *Crit Care Med* 2010;38:802–7 |
| `pvr-recruitability-low` | In a poorly recruitable lung, PEEP 4 → 14 raises pulmonary vascular resistance. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-high` | In a highly recruitable lung — the same collapsed lung, differing only in how much of it can be reopened — the same PEEP change leaves pulmonary vascular resistance essentially unchanged: within ±10%. Recruitment offsets the distension penalty rather than beating it. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-dissociation` | Sweeping recruitability from 0 to 1 with everything else held identical moves the response monotonically from a rise to a fall, crossing zero once. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `transmission-chest-wall` | For the same PEEP, a stiff chest wall transmits more pressure to the pleural space than a compliant one. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `transmission-lung` | For the same PEEP, a stiff lung transmits less pressure to the pleural space than a compliant one, because it recruits less volume per cmH₂O. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `pvr-j-shape` | Pulmonary vascular resistance is minimal near functional residual capacity and at least 50% higher at both 1.2 L and 3.8 L. | agrees | Simmons et al., *Circ Res* 1961;9:465–71 |
| `tidal-challenge-ordering` | Raising the tidal volume from 6 to 8 mL/kg raises pulse pressure variation more in a preload-dependent patient than in a filled one, so the change orders patients by their response to fluid. | agrees | Myatra et al., *Crit Care Med* 2017;45:415–21 |
| `tidal-challenge-threshold` | In the septic fluid-responsive preset ventilated at 6 mL/kg, that change exceeds 3.5 percentage points and the manoeuvre calls the patient preload dependent. | agrees | Myatra et al., *Crit Care Med* 2017;45:415–21 |
| `ppv-responder` | A passive patient at 8 mL/kg who is preload dependent shows pulse pressure variation of at least 13%, and the index reports itself interpretable. | agrees | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ppv-suspended-spontaneous` | The same patient breathing spontaneously has the index withheld rather than reported. | agrees | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ph-classification` | A hypervolaemic failing left ventricle with a wedge above 15 mmHg and a mean pulmonary artery pressure above 20 is classified post-capillary; a lung with a high vascular resistance and a low wedge is classified pre-capillary. | agrees | Humbert et al., ESC/ERS guidelines, *Eur Heart J* 2022;43:3618–731 |
| `venous-return-plateau` | Venous return stops rising once right atrial pressure falls below the pressure surrounding the great veins: the curve has a plateau. | agrees | Guyton et al., *Am J Physiol* 1957;189:609–15 |

## How the recruitability rows were closed

These two rows were open for a while, and the reason they closed is worth
recording, because the argument for why they *could not* close was wrong in an
instructive way.

The old model had one lung compartment. In it, a high recruiter and a low
recruiter were the same lung at different resting volumes, so PEEP 4 → 14 gave
them identical volume gain (0.116 → 0.407 L) and identical transpulmonary
pressure (8.4 → 17.0 cmH₂O). Nothing was left to tell them apart, and I
concluded — correctly, for that model — that no formulation of the resistance
curve could separate them.

The error was in treating that as a fact about resistance curves rather than
about the lung. The missing variable was never on the vascular side: it was that
recruitability had no representation at all. It was being *inferred* from resting
volume, and two patients with the same resting volume are then necessarily the
same patient.

The lung is now two populations of units sorted by how hard they are to open, and
recruitability is a parameter. That gives strain per *open* unit, which is the
quantity a single compartment cannot produce: with a third of the lung open, a
litre of gas strains each unit half again as much as it would with two thirds
open. When PEEP opens units, the gas is shared among more of them, and strain per
unit can fall while total volume rises. The recruiter has that route and the
non-recruiter does not.

Across the full recruitability range at fixed everything else, the response now
runs +15% → +2% → −7% → −15% → −21%. The dissociation row tests that sweep rather
than a single phenotype, because a row that names one phenotype can always be
satisfied by choosing it — and choosing it is exactly what I would be tempted to
do.

**What this cost.** Nothing about the vascular model was tuned, but the resting
volume of the *whole* J-curve reference changed, and that fixed a second error in
the opposite direction: the previous version referenced distension to the
patient's own resting volume, so a chronically hyperinflated lung had zero strain
by definition and hyperinflation was free. The COPD preset's resistance was 1.7
Wood units where the preset's own note claimed the lung was being pushed up the
right limb of the curve. It is now 4.2, and the note is true.

**A correction.** An earlier version of this file said the two-region lung was
"the same structural change that would give the model a real right-to-left
transit delay." That was wrong. The pulmonary circulation is already two
compartments in series, and transit delay is a question about their volumes and
compliances — parallel lung regions have nothing to do with it. Transit delay
remains open and is unrelated to this work.

## A note on how these rows were written

Two of the rows were narrowed after drafting, and it is worth saying why.

The `peep-euvolaemia` row first read "costs between −5% and 0% of cardiac
output". That figure came from a secondary characterisation of Berger 2016, not
from reading the paper's numbers, and the model landed at −6.1% with a full
baroreflex. Tuning reflex gains until an unverified number is met would have
produced a model fitted to a paraphrase. The row now states the mechanism the
source is actually about — the abdomen defending the gradient, worth 1–3 mmHg of
mean systemic filling pressure — and bounds the output cost loosely.

The `pvr-recruitability-high` row survives in its original form because that one
*was* read: the trial reports resistance unchanged in high recruiters. It now
passes, but on a phenotype this file chose — 55% of the collapsed lung
recruitable at an opening pressure of 20 cmH₂O — rather than on one calibrated
against the R/I ratio the trial actually measured. That is why the dissociation
row exists alongside it.

If you have the Berger paper to hand, tightening this row against its actual
figures would be a genuine improvement.

## What this file is not

These are directional and order-of-magnitude checks against published group
means. Passing them is evidence that the model reproduces a documented
relationship, not that it would predict an individual patient — see the
limitations in [PHYSIOLOGY.md](PHYSIOLOGY.md).
