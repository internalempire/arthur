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
| `peep-volume-status` | The haemodynamic cost of PEEP depends on volume status: raising PEEP from 5 to 15 costs a hypovolaemic patient at least 1.5 times what it costs a euvolaemic one. | not yet | Fougères et al., *Crit Care Med* 2010;38:802–7 |
| `pvr-recruitability-low` | In a poorly recruitable lung (R/I < 0.5), PEEP 4 → 14 raises pulmonary vascular resistance by at least 25%. The trial's medians give 160 → 243 dyn·s·cm⁻⁵, +52%, P < 0.01. | not yet | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-high` | In a highly recruitable lung (R/I ≥ 0.5), the same PEEP change leaves resistance essentially unchanged: between −10% and +20%, the measured +5% with a band of ±15 either side of it. The trial's medians give 224 → 235 dyn·s·cm⁻⁵, +5%, P = 0.55. | not yet | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
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
right limb of the curve. It is now 2.97 over a breath, and the note is true.

A caution about reading that number, which caught me out. Pulmonary vascular
resistance here is instantaneous, and it follows lung volume, so in a patient
with a large tidal excursion it swings within the breath — 2.55 to 3.52 Wood
units in this preset, a swing of 0.97. A single reading is a reading at a phase,
not a property of the patient, and I quoted one as though it were the latter. The
figures in this file are cycle means where the swing is material.

**A correction.** An earlier version of this file said the two-region lung was
"the same structural change that would give the model a real right-to-left
transit delay." That was wrong. The pulmonary circulation is already two
compartments in series, and transit delay is a question about their volumes and
compliances — parallel lung regions have nothing to do with it. Transit delay
remains open and is unrelated to this work.

## What making recruitment mechanical changed

Recruitment used to alter resistance and gas exchange but not mechanics, so a
recruited lung gained no compliance and no resting volume. Closing that gap moved
three things, and one of them was an error rather than an omission.

**Resting volume stopped being a parameter.** It is now where the lung's recoil
balances the chest wall, so it rises when pressure opens units — which is what
lets proning add volume rather than only opening units. `frc` is gone; what
carries the disease is `collapsed`, the share of the lung that is shut, and
`clung` now means the compliance of the lung with all of it open. A lung that has
lost its elastic recoil rests hyperinflated without being told to, which is how
the COPD preset works now.

**The extra-alveolar limb was being driven by the wrong quantity.** It followed
strain — volume per open unit — where radial traction is a stress and follows
transpulmonary pressure. While compliance was constant the two were proportional
and it made no difference. Once the mechanics became nonlinear it did: stiff
tissue at a normal distending pressure holds much less gas, and a strain-driven
limb called such a lung derecruited when it was merely stiff, then credited PEEP
with relieving that in a lung with nothing to recruit. The recruitability rows
below failed, which is how it was found — a test that had been passing for the
wrong reason.

**Traction needed a floor.** It opens extra-alveolar vessels to their full
calibre and then stops. Without saturation the limb fell 86% between
transpulmonary pressures of 8 and 18 and swamped everything else. The floor of
0.35 is a judgement; the exponent that goes with it is fixed by the nadir
condition rather than chosen.

One claim that had been in this file was retired at the same time: that PEEP
raises pulmonary vascular resistance in a consolidated lung across the whole
range. It does not below about PEEP 4, because even a consolidated lung is still
reopening its *normal* units down there, and it therefore has a shallow
resistance optimum of its own near PEEP 8. The row now measures from 4.

## Two rows that giving the tissue a ceiling pushed just outside

The lung's pressure–volume relation used to be a straight line above the
recruitment sigmoid, so airway pressure rose linearly however hard a lung was
inflated and the stress index could not exceed 1 whatever was done to the
patient. Tissue runs out of extensibility; the relation now saturates.

That is right on its own terms, and it moved two rows from inside their bands to
just outside them:

| row | before | after | wanted |
|---|---|---|---|
| `pvr-recruitability-low` | +6% | −1% | a rise |
| `pvr-recruitability-high` | −9% | −13% | within ±10% |
| `peep-volume-status` | 1.6× | 1.47× | at least 1.5× |

The first of those is the row the two-compartment lung was built for, so losing
it is not a detail. The dissociation itself survives — across recruitability 0 to
1 the response still runs 0% to −23%, monotone, so recruitable and consolidated
lungs still behave differently — but the consolidated end no longer rises, it
sits flat.

The mechanism is the same in both. A lung that stiffens as it fills takes less
volume for each additional cmH₂O of PEEP, so it transmits less to the pleural
space, so the haemodynamic cost of PEEP is smaller — and the *difference* in that
cost between a full patient and an empty one is smaller with it.

Both would come back inside with a small change to a single constant. That is
exactly why they are marked `not yet` instead: a model that can be nudged back
onto a row whenever it drifts off one is not being tested by the row. What is
recorded here is that a defensible change to the mechanics cost two percent on
one row and two points on another, and that neither was paid for by moving a
number to avoid saying so.

## What the published numbers turned out to be

The two recruitability rows were written from a description of Cappio Borlino et
al. rather than from its figures, so they asked for a *direction* and a band I
invented — "a rise", and "within ±10%". Nicola obtained the trial's abstract.
The real numbers, at the trial's own PEEP levels of 4 [2–5] → 14 [12–15] cmH₂O:

| | low recruiters (R/I < 0.5, n=10) | high recruiters (R/I ≥ 0.5, n=13) |
|---|---|---|
| PVR | 160 [120–297] → 243 [166–380] | 224 [185–289] → 235 [168–300] dyn·s·cm⁻⁵ |
| Change | **+52%**, P < 0.01 | **+5%**, P = 0.55 |

And the model, across the whole range of its recruitability parameter:

| recruitable | 0 | 0.25 | 0.5 | 0.75 | 1 |
|---|---|---|---|---|---|
| ΔPVR | 0% | −7% | −13% | −18% | −23% |

**It never rises at all.** The dissociation is there — the two ends differ by 23
points — but the whole response sits about fifty percentage points below where
the trial puts it. That is not a calibration question, and no single constant
closes a gap that size.

The uncomfortable part is that this was true before as well. The model gave +6%
for the consolidated lung when the row was passing, against a published +52%, and
the row passed because it only asked for a rise. A row weak enough to be
satisfied by the sign let a model that is wrong by an order of magnitude in the
effect size look calibrated for weeks. That is precisely the failure this file
exists to prevent, and I built it into the row myself by writing down what I
remembered of a finding instead of what it measured.

Both rows are now stated against the trial's numbers. They fail, and they fail
much harder than they did when they were failing before.

One detail worth recording, because it nearly went the other way. A band of ±15%
around *zero* would have admitted the model's −14% and marked the row as
agreeing. But the trial measured +5%, and −14% is not the same as +5% — it is
the opposite direction by nineteen points. The band is centred on the
measurement instead, which is where a band belongs.

## Leads on the model's structure, not yet acted on

These came back from the same search and are recorded because they bear on
choices the model has already made. **None has been read in the original** —
they are abstracts relayed by a language model, which is the provenance that got
these rows into trouble in the first place, so they are leads and not evidence.

- **The J-curve figure usually attributed to Simmons et al. 1961 may be a
  redrawing rather than data.** One source warns it is "a highly gentrified and
  speculative interpretation", and redirects to **Thomas, Griffo & Roos, *J Appl
  Physiol* 1961;16:451–6**, whose abstract reportedly states resistance is
  "lowest at approximately half maximal lung volume". This model's
  `pvr-j-shape` row cites Simmons.

- **The extra-alveolar limb may turn up rather than plateau.** Hakim, Michel &
  Chang, *J Appl Physiol* 1982;53:1110–5: under negative-pressure inflation the
  total pressure drop first falls, as extra-alveolar resistance falls, and then
  rises again through "a volume-dependent increase in the resistance of all
  vessels". `EXTRA_FLOOR` asymptotes instead, so the functional form may be
  wrong at high volume. Permutt and Howell 1961 are reported as monotonic, so
  the sources disagree.

- **The alveolar / extra-alveolar split cannot be anchored.** Published
  partitions measure a different boundary and disagree with each other: the
  capillary fraction of total resistance is reported at 34% (Brody, bolus), 45%
  (Bhattacharya & Staub, micropuncture) and under 16% (Hakim, occlusion). `F_ALV`
  is 0.60. There is no number here to move it to.

- **Resistance may be volume-dependent rather than pressure-dependent.** Thomas
  1961 is reported as concluding exactly that for negative-pressure inflation,
  and a Michel/Hakim surface-tension paper as finding different resistance at
  equal transpulmonary pressure but different volume. The extra-alveolar limb
  here is driven by pressure, which that would count against.

- **Two confounders the model has no term for**: the resistance–volume curve
  shifts downward at high blood flow, and it shows hysteresis between the
  inflation and deflation limbs.

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
