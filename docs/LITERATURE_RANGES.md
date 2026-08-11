# Literature ranges

Published findings the model can be held to, each as a manoeuvre with an
expected result and a source. `node tests/run.mjs` executes every row.

Retired calibrations are not kept as passing rows: see
[MODEL_DECISIONS.md](MODEL_DECISIONS.md) for the current decision and the dated
postmortem for the historical investigation.

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
| `pvr-recruitability-low` | In a low-recruitability human ARDS phenotype, PEEP 4 → 14 keeps derived PVR inside the trial's two IQRs (1.50–3.71 → 2.08–4.75 WU) and raises it by 20–80%. The ratio of cohort medians was +52%, but is not a median within-patient change. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-high` | In a high-recruitability phenotype, the same manoeuvre stays inside 2.31–3.61 → 2.10–3.75 WU and changes PVR by −10% to +20%; the trial's cohort medians changed +5%, P = 0.55. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-dissociation` | Sweeping the model's recruitability control from 0 to 1 progressively attenuates the PEEP-related PVR rise by at least 15 percentage points. No sign change is required: the measured high-recruiter median was still +5%. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `transmission-chest-wall` | For the same PEEP, a stiff chest wall transmits more pressure to the pleural space than a compliant one. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `transmission-lung` | For the same PEEP, a stiff lung transmits less pressure to the pleural space than a compliant one, because it recruits less volume per cmH₂O. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `pvr-human-frc-nadir` | The fully open mechanical J-curve has its minimum within 0.15 L of the model's 2.2 L human FRC. | agrees | Cecconi, Collino & Pinsky, *Intensive Care Med* 2026, Fig. 1C (clinical synthesis: minimum near FRC) |
| `pvr-human-j-direction` | Both marked deflation (1.2 L) and overdistension (4.5 L) raise resistance above the value near FRC. This is a directional human teaching target, not a numerical fit to maximal animal inflation. | agrees | Cecconi, Collino & Pinsky 2026, Fig. 1C; Thomas et al. 1961 and Hakim et al. 1982 for qualitative mechanism |
| `ppv-suspended-spontaneous` | During spontaneous breathing, pulse pressure variation is withheld rather than presented as an interpretable dynamic index. | agrees | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ph-classification` | A hypervolaemic failing left ventricle with a wedge above 15 mmHg and a mean pulmonary artery pressure above 20 is classified post-capillary; a lung with a high vascular resistance and a low wedge is classified pre-capillary. | agrees | Humbert et al., ESC/ERS guidelines, *Eur Heart J* 2022;43:3618–731 |
| `venous-return-plateau` | Venous return stops rising once right atrial pressure falls below the pressure surrounding the great veins: the curve has a plateau. | agrees | Guyton et al., *Am J Physiol* 1957;189:609–15 |

## Current phase-2 calibration

The active calibration is deliberately hierarchical:

1. Human in-vivo catheter measurements constrain the absolute PVR and the
   response to PEEP in low- and high-recruitability ARDS phenotypes.
2. The contemporary clinical review constrains the human teaching geometry:
   the mechanical minimum lies near FRC and both deflation and overdistension
   raise RV afterload.
3. Thomas, Hakim and the isolated-lung work constrain only the qualitative
   volume-dependent mechanism. Their exact nadir, maximal-inflation ratios and
   vascular partitions are no longer executable human targets.

The model now gives 2.71 → 3.35 WU (+24%) in the low-recruitability calibration
phenotype and 2.45 → 2.64 WU (+8%) in the high-recruitability phenotype after 45
s of equilibration. All four values fall within the published IQRs. The first
response is smaller than the +52% ratio of cohort medians; it is retained rather
than overfitted because the paper does not report the median paired percentage
change and this remains a teaching model.

The calibration phenotype is not the shipped “ARDS with right ventricular
failure” preset. It uses normal RV contractility and `pvrBase=0.09`, because the
study did not describe a uniform severe-RV-failure cohort. Reusing the extreme
preset made its internally high afterload validate itself and produced values
around 10–16 WU, far outside the human measurements.

## Historical calibration notes (superseded)

The sections below preserve how earlier formulations were investigated. Their
numerical outputs and passing-row claims are historical; the table above and
[MODEL_DECISIONS.md](MODEL_DECISIONS.md) are the current specification.

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

## What the two papers actually say

Nicola supplied Thomas et al. 1961 and Hakim et al. 1982. Both were read, and
both contradict the model in ways the old rows could not see, because the old
rows asserted bounds I had invented rather than values anyone had measured.

**Thomas, Griffo & Roos** inflated excised dog lungs by lowering the pressure
around them, holding the vascular pressures constant and measuring under static
conditions — so no Starling resistance and essentially no hypoxic
vasoconstriction, which makes it the cleanest available look at the mechanical
effect alone. Reading Fig. 6 and the Discussion:

| | measured | this model |
|---|---|---|
| Nadir | 45–60% of maximal volume (n = 55) | **39%** |
| At maximal inflation | 1.8–2.1× the minimum | **8.9×** |
| At 30% of maximal volume | ~1.2× the minimum | 1.19× |

The low-volume limb is right, and that is worth noting because it was never
tested against a value before. The high-volume limb overstates overdistension by
four to five times. `K_ALV` is what sets it.

Their conclusion is the second finding, and it bears on a choice made in this
model rather than on a constant: *"pulmonary vascular resistance is
volume-dependent rather than pressure-dependent when inflation is accomplished by
lowering the pressure around the lung."* Resistance plotted against
transpulmonary pressure showed wide hysteresis between inflation and deflation;
plotted against volume it did not. This model drives the extra-alveolar limb by
transpulmonary pressure.

**Hakim, Michel & Chang** partitioned the pressure drop with arterial and venous
occlusion. Their Fig. 3, negative-pressure inflation, n = 7, over transpulmonary
pressures 0 to 20 mmHg:

| segment | Ptp 0 | 5 | 10 | 15 | 20 |
|---|---|---|---|---|---|
| Total | 11.8 | **9.2** | 9.5 | 11.8 | 14.3 |
| Venous | 5.5 | 4.6 | 4.6 | 5.5 | 5.9 |
| Arterial | 3.7 | 3.2 | 3.1 | 3.6 | 4.0 |
| Middle | 2.6 | **1.3** | 1.4 | 2.9 | 4.2 |

Every segment is U-shaped, not only the total. The arterial and venous segments
are the large indistensible extra-alveolar vessels, and together they run 9.2 →
7.8 → 9.9: a fall of 15% and then a rise of 27%. This model's extra-alveolar limb
falls by 65% to a floor and never returns. Their conclusion is explicit —
inflation produces *"a volume-dependent increase in the resistance of both
alveolar and extra-alveolar vessels"* — and that the volume-related changes are
identical under positive- and negative-pressure inflation while the
pressure-related ones are not.

**A third measurement, in the range that matters.** Nicola's search returned a
figure from the Peták group's 2008 paper on isolated perfused rat lung: sweeping
transpulmonary pressure from 2.5 to 22 cmH₂O changes resistance by **+15 ± 1%**
under positive-pressure inflation and **−3 ± 0.3%** under negative, and the
hysteresis seen against transpulmonary pressure disappears when the same data are
plotted against volume. That last clause is the third independent statement of
the volume-versus-pressure point.

This is the tightest constraint of the three, because 2.5 to 22 cmH₂O is the
range every ventilated patient in this simulator occupies, where Thomas's
"maximal inflation" is beyond it. **The model gives +193% over that span.**

Unlike Thomas and Hakim, whose figures were read here directly, this one is
reported rather than read, and the row records that difference. It is the same
provenance that put the recruitability rows wrong, so it is stated as a lead with
a wide band rather than as a tight target.

**On `F_ALV`: the answer is that there is no answer.** The published partitions
of pulmonary vascular resistance do not agree, because they do not measure the
same thing:

| share of total resistance | value | method |
|---|---|---|
| capillaries | 34% | Brody 1968, low-viscosity bolus, dog lobe |
| alveolar-wall capillaries | 45% | Bhattacharya & Staub 1980, servo-null micropuncture |
| middle distensible segment | < 16% | Hakim 1982, arterial and venous occlusion |
| middle segment, by haematocrit | 7% at Hct 18 → 53% at Hct 66 | Julien et al. 1985 |

Sixteen to forty-five percent depending on method, and a sevenfold swing with
haematocrit alone. None was measured at a stated FRC. The model's 0.60 is above
all of them, but the more useful conclusion is that this constant cannot be
anchored by measurement at all, and should be documented as a modelling choice
rather than left looking like one that evidence is pending on.

**What this means for the model, not yet done.** Two changes, and they are
structural rather than a retune:

1. `K_ALV` is roughly two and a half times too large. The arithmetic suggests
   about 0.65 against the present 1.6, with `K_EXTRA` following from the nadir
   condition as it always has.
2. The extra-alveolar limb needs to turn up rather than approach a floor, and
   both papers say the driving variable should be volume rather than
   transpulmonary pressure. That is the opposite of a change made earlier in this
   file's history, which was argued from first principles about radial traction
   being a stress. The principle is sound and the measurement disagrees with it.

Neither is attempted here. Four rows now state what was measured, three of them
fail, and that is a better position than one row stating a bound I made up and
passing.

## What changed when the limbs were rebuilt

Both limbs now follow volume, and they share the exponential that makes them
rise. The old split — alveolar by strain, extra-alveolar by transpulmonary
pressure — was argued from first principles and contradicted by three
measurements, so it is gone. The three constants were fitted to four published
figures, which is one more constraint than there are constants, so the fit could
have failed.

Seven rows moved from `not yet` to `agrees`, including every one anchored to
Thomas, Hakim and Peták, and both recruitability rows.

**One of those needed a correction to the row rather than to the model.** The
recruitability rows compared the model's own J-curve coefficient against a number
Cappio Borlino measured with a pulmonary artery catheter. Those are different
quantities, and in this model they move in opposite directions: raising PEEP from
4 to 14 in a poorly recruitable lung *lowers* the coefficient by 13% while
*raising* the catheter-derived (mPAP − wedge)/CO by 28%, because cardiac output
falls faster than resistance does. Compared like against like, the low recruiter
gives +28% against a published +52% and the high recruiter +2% against +5%, and
the dissociation runs +39% to −6% across the recruitability range.

That was a category error of exactly the kind this project spends most of its
interpretability machinery avoiding everywhere else, and it had been sitting in
the rows since they were written.

## Checked against Cecconi, Collino & Pinsky 2026

A short review of heart–lung interaction in ARDS, read in full. Every mechanism
it names is already in the model, and one of its statements is now a row.

**What it asserts, and where the model stands.** Raised intrathoracic pressure
unloading the left ventricle; the lung as a Starling resistor under West zone 2;
the right ventricle as the integrator; pleural transmission varying with lung
compliance and amplified by abdominal pressure; diaphragmatic descent raising
abdominal pressure and partly defending venous return; variation reflecting right
ventricular afterload rather than preload when the right ventricle is failing.
All present, most already tested.

Its caution that variation can be *falsely low* under low tidal volumes remains
an applicability warning. It is deliberately not encoded as a responder cutoff,
because PPV is no longer calibrated as a fluid-responsiveness decision.

**What it asks for that the model cannot do.** The review's central practical
proposal is to use a PEEP step as a bedside test, reading oxygenation, compliance,
dead space and haemodynamics together. Three of those four are available —
compliance, cardiac output, right ventricular size and resistance all respond to
a PEEP step here. Dead space and oxygenation are not, because there is no gas
exchange, so the model can show half of that test and should not pretend
otherwise. The same gap makes its argument about oxygen delivery — that better
oxygenation can cost more cardiac output than it gains in content —
unreproducible, though the cardiac output half of it is exactly what the model
does show.

**Where the model disagrees with it.** The legend to its Figure 1C places the
minimum of the resistance–volume curve *at* functional residual capacity. Thomas,
Griffo & Roos measured it at 45–60% of maximal lung volume in 55 lungs, which is
above FRC, and this model follows the measurement: its nadir sits at 2.87 L
against an FRC of 2.2. The review is restating the textbook position, which is
what almost every source does. Anyone teaching from this simulator should know
that it takes the primary measurement over the restatement, and why.

**One thing the review prompted, first written up wrongly.** Holding tidal volume
and chest wall compliance fixed and varying only lung compliance, the pleural
swing is unchanged at 2.8 cmH₂O — it must be, being tidal volume over chest wall
compliance — yet the variation a preload-responsive patient shows runs from 6% to
39% as lung compliance falls from 200 to 30 mL/cmH₂O.

The first version of this note concluded that the variation must therefore travel
by "the alveolar route" rather than the pleural one. That was reasoning by
elimination from a quantity I had not measured, and it was wrong twice over:
varying lung compliance moves the whole pulmonary operating point, not just
alveolar pressure, so a constant pleural *swing* does not mean the pleural route
is inert; and the conclusion was stated as something the literature had not
described when the review names it explicitly.

Measured rather than inferred, the chain is:

| | compliance 200 | compliance 30 |
|---|---|---|
| pleural swing | 2.79 | 2.79 cmH₂O |
| venous return swing | 1.45 | 1.64 L/min |
| right ventricular filling swing | 7.1 | 11.7 mL |
| right ventricular **stroke volume** swing | 7.9 | **27.0 mL** |
| resistance swing within the breath | 0.04 | 0.34 Wood units |

Venous return — what the pleural route delivers — barely moves. Filling moves
moderately. Stroke volume triples, and the amplification between filling and
stroke volume is not preload: it is the right ventricle ejecting against an
afterload that is itself swinging with the breath.

Which is the review's own caution: *"in patients with impaired right ventricular
function or increased PVR, such variations may predominantly reflect cyclic
changes in right ventricular afterload induced by intrathoracic pressure swings,
rather than true preload dependency."* Not an undescribed assumption — a
documented phenomenon the model reproduces.

The model measures and exposes the within-breath resistance swing, so the
mechanism remains available for teaching and testing. It no longer converts that
measurement into a 15% PPV warning threshold: the cutoff depended on the retired
Michard calibration. Right ventricular dilatation remains a caution, with the
explicit limitation that it is a late proxy for cyclic afterload.

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
