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
| `pvr-recruitability-low` | In a poorly recruitable lung (R/I < 0.5), PEEP 4 → 14 raises pulmonary vascular resistance by at least 25%. The trial's medians give 160 → 243 dyn·s·cm⁻⁵, +52%, P < 0.01. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-high` | In a highly recruitable lung (R/I ≥ 0.5), the same PEEP change leaves resistance essentially unchanged: between −10% and +20%, the measured +5% with a band of ±15 either side of it. The trial's medians give 224 → 235 dyn·s·cm⁻⁵, +5%, P = 0.55. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-dissociation` | Sweeping recruitability from 0 to 1 with everything else held identical moves the response monotonically from a rise to a fall, crossing zero once. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `transmission-chest-wall` | For the same PEEP, a stiff chest wall transmits more pressure to the pleural space than a compliant one. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `transmission-lung` | For the same PEEP, a stiff lung transmits less pressure to the pleural space than a compliant one, because it recruits less volume per cmH₂O. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `pvr-nadir-position` | Resistance is minimal at 45–60% of maximal lung volume. | agrees | Thomas, Griffo & Roos, *J Appl Physiol* 1961;16:451–6, Discussion (n = 55 lungs) |
| `pvr-at-maximal-inflation` | At maximal inflation resistance is 1.6–2.4× its minimum. | agrees | Thomas et al. 1961, Fig. 6 (both experiments give 1.8–2.1×) |
| `pvr-at-low-volume` | At 30% of maximal volume it is only 1.05–1.4× the minimum — the deflation limb is far flatter than the inflation limb. | agrees | Thomas et al. 1961, Fig. 6 (~1.2× in both) |
| `pvr-clinical-range` | Across transpulmonary pressures of 2.5 to 22 cmH₂O — the range this simulator runs in — resistance changes by between −20% and +40%. | agrees | Peták group, *J Appl Physiol* 2008, doi:10.1152/japplphysiol.00831.2007 — **reported, not read here**: +15 ± 1% with positive-pressure inflation, −3 ± 0.3% with negative, hysteresis against Ptp abolished when plotted against volume |
| `pvr-extraalveolar-shape` | The extra-alveolar limb is itself U-shaped: it falls, then turns back up, ending at least 1.1× its minimum at maximal inflation. | agrees | Hakim, Michel & Chang, *J Appl Physiol* 1982;53:1110–5, Fig. 3 (arterial + venous segments: 9.2 → 7.8 → 9.9 mmHg over Ptp 0 → 20) |
| `tidal-challenge-ordering` | Raising the tidal volume from 6 to 8 mL/kg raises pulse pressure variation more in a preload-dependent patient than in a filled one, so the change orders patients by their response to fluid. | agrees | Myatra et al., *Crit Care Med* 2017;45:415–21 |
| `tidal-challenge-threshold` | In the septic fluid-responsive preset ventilated at 6 mL/kg, that change exceeds 3.5 percentage points and the manoeuvre calls the patient preload dependent. | agrees | Myatra et al., *Crit Care Med* 2017;45:415–21 |
| `ppv-responder` | Ventilated as Michard's patients were — a stiff lung at a driving pressure near 30 cmH₂O — every patient the model calls preload dependent shows variation of at least 13%, and the index reports itself interpretable. | agrees |
| `ppv-fluid-response-relation` | Across that same range, the gain in cardiac output after volume expansion rises with baseline variation on a line of slope 0.70–1.35. | agrees | Michard et al., *Am J Respir Crit Care Med* 2000;162:134–8, Fig. 3 upper panel: ΔCI% = 1.01·ΔPP% − 1.46, r² = 0.85 | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ppv-falsely-low-at-low-tidal-volume` | The same preload-responsive patient reads below 13% at 6 mL/kg and above it at 10 mL/kg. | agrees | Cecconi, Collino & Pinsky, *Intensive Care Med* 2026, doi:10.1007/s00134-026-08583-3 |
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

**Two rows went the other way, and they share a cause.** `ppv-responder` and
`tidal-challenge-ordering` now fail because pulse pressure variation is too low
for the degree of preload dependence the model itself reports:

| stressed volume | 300 | 400 | 500 | 700 |
|---|---|---|---|---|
| gain from 500 mL | +37% | +32% | +28% | +19% |
| variation | 11.9% | 9.5% | 6.2% | 2.8% |

Every one of those is preload dependent by the 15% rule, and only the driest
comes near the 13% threshold that is supposed to identify them. The old
`ppv-responder` row asserted a single stressed volume and passed at 13.0%; after
the change it read 12.9% and looked like a rounding accident. It was not — the
arbitrary choice of patient had been hiding a false-negative problem across the
whole range. The row now tests the relationship instead, and fails properly.

This is the mirror of the false-positive limitation already recorded, and it is
new: the model under-reads variation in patients who would respond to fluid.

## The variation was never under-reading

For most of a day this file recorded that the model under-read pulse pressure
variation: patients it called preload dependent showed 3 to 12% where the
threshold that identifies them is 13%. A capillary transport delay was built to
fix it and thrown away when it changed nothing. Compliance, the piston, the
septum and the pericardium were eliminated one by one.

Nicola supplied Michard et al. 2000, and the answer was in Figure 1 rather than
in the model. That figure is a recording, and its airway pressure trace swings
from about 7 to about 40 cmH₂O — a driving pressure near 30, which is what
ventilating an ARDS lung looked like in 2000. The 13% threshold and the whole
relation were measured *there*.

The row that was failing asked for 13% from a normal lung at 8 mL/kg, where the
driving pressure is 6 cmH₂O. Put the model on Michard's ventilation instead and
it reproduces his regression:

| | slope | intercept |
|---|---|---|
| Michard Fig. 3, upper panel | 1.01 | −1.46 (r² = 0.85) |
| this model, driving pressure 30 | 0.87 | +3.90 |
| this model, driving pressure 6 | 5.13 | −4.30 |

The individual patients land on his line too — 29% variation at a 26% gain, 20%
at 23%, 18% at 19%, 9% at 16%.

**So the error was mine, and it was a specific one.** I applied a threshold
outside the conditions it was measured in — which is the exact failure the
interpretability rules in this model exist to prevent, and which those rules
would have caught if I had listened to them instead of writing a test that
bypassed them. Variation really is smaller at a small tidal volume. That is not a
defect; it is the reason the tidal volume challenge was invented.

Both rows are now stated at Michard's ventilation, and a new one tests the
relation rather than the threshold, which constrains the whole line instead of
one point on it.

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

Its caution that variation can be *falsely low* under low tidal volumes is the
same thing that took a day to establish here from Michard's Figure 1, and it is
now a row: the same responder reads below 13% at 6 mL/kg and above it at 10.

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

**And it was not being flagged.** The only guard was a rule on right ventricular
dilatation, and at a lung compliance of 30 the right ventricle is still smaller
than the left while variation reads 22%. Dilatation is a late sign. The model can
measure the cause directly, so it now does: when afterload swings by more than
15% of its mean within a breath, the variation says so.

One consequence worth recording, because it looked like a failure and is not.
The new caution fires on Michard's own patients — ARDS lungs at a driving
pressure near 30 are precisely where afterload swings hardest — and that broke
`ppv-responder`, which had required no caveat at all. The caution is correct and
his prediction still held at r² = 0.85, so the row now asks that the number be
readable and above the threshold rather than unqualified. A caution is
information; only `unavailable` means the reading is not a reading.

That threshold is where this model's own relation between variation and fluid
response crosses Michard's slope of 1.01. Below it the slope is steeper than his,
so variation understates the response; above it the slope falls through 1 and
keeps going, so variation starts to overstate it. Anchored to a published slope
rather than chosen.

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
