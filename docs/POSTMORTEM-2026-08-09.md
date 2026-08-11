# What went wrong, and how it was caught

> **Historical record.** The PPV calibration, 13% decision threshold,
> tidal-volume challenge and Michard-derived afterload warning described below
> were retired on 2026-08-11. See [MODEL_DECISIONS.md](MODEL_DECISIONS.md) for the
> current rationale. The account is preserved because it documents how the
> earlier conclusions were reached, not because those features remain active.

A retrospective on two days of work: the pressure–volume curve gaining a ceiling,
the J-curve being anchored to primary measurements, recruitment hysteresis, the
stress index, and a long hunt for a defect in pulse pressure variation that did
not exist.

It is written up because the errors are more instructive than the code. Almost
every one of them was a *test* being wrong rather than the model, and the same
few failure modes recurred in different disguises. `LITERATURE_RANGES.md` records
where the model stands against published work and `PHYSIOLOGY.md` records what it
cannot do; neither records how the mistakes were made.

---

## The failure modes, in order of how much time they cost

### 1. Writing a row from memory of a finding instead of from the finding

The two recruitability rows asked for "a rise" and "within ±10%". Both were
written from a description of Cappio Borlino et al. rather than from the paper.
When its abstract arrived, the measured figures were **+52%** and **+5%**, and
the model was giving 0% and −13% — out by about fifty percentage points across
the board.

The row had been *passing* the whole time, because a row that asks only for a
direction is satisfied by the sign. A model wrong by an order of magnitude in
effect size looked calibrated for weeks.

The same thing had happened to `pvr-j-shape`, which asserted resistance was "at
least 1.5× the nadir" at two volumes — a bound with no source, sitting under a
citation to Simmons 1961. It has been replaced by four rows off Thomas Fig. 6 and
Hakim Fig. 3, three of which failed on arrival.

**The pattern:** a row weak enough to be satisfied by a direction is not a test.
Where a paper reports a number, the row has to carry the number.

### 2. Comparing two quantities that share a name

The recruitability rows held the model's own J-curve *coefficient* against a
figure Cappio Borlino measured through a pulmonary artery catheter. In this model
those move in opposite directions: raising PEEP from 4 to 14 in a poorly
recruitable lung **lowers** the coefficient by 13% while **raising** the derived
(mPAP − wedge)/CO by 28%, because cardiac output falls faster than resistance
does. Compared like with like the rows pass.

This is the exact distinction the interpretability machinery in this model exists
to enforce — measurement, derived index, internal coefficient — and it had been
violated in the tests since they were written.

A smaller instance of the same thing: pulmonary vascular resistance was published
in the docs as a single figure when it is instantaneous and follows lung volume.
In a patient with a large tidal excursion it swings by a third within the breath.
The number quoted was a reading at a phase.

### 3. Applying a published number outside the conditions it was measured in

This one cost most of a day.

The model appeared to under-read pulse pressure variation: it called patients
preload dependent — a bolus buying 21% of cardiac output — while their variation
read 5.8%, against a threshold of 13%. A pulmonary capillary transport delay was
designed, built with exact volume conservation, and thrown away when it changed
the answer by under a percentage point. Pulmonary compliance, the piston, the
septum and the pericardium were eliminated one by one.

The answer was in Michard's **Figure 1**, not in the model. That figure is a
recording, and its airway pressure trace swings from about 7 to about 40 cmH₂O —
a driving pressure near 30, which is what ventilating an ARDS lung looked like in
2000. The 13% threshold and the regression were measured *there*. Put the model
on that ventilation:

| | slope | intercept |
|---|---|---|
| Michard Fig. 3, upper panel | 1.01 | −1.46 (r² 0.85) |
| this model at 30 cmH₂O driving pressure | 0.87 | +3.90 |
| this model at 6 cmH₂O | 5.13 | −4.30 |

Variation really is smaller at a small tidal volume. That is not a defect; it is
why the tidal volume challenge was invented, and the model's own validity rules
say so. The test bypassed them.

**The pattern:** before concluding the model is wrong, check that the published
number's measurement conditions are the ones being reproduced.

### 4. Reasoning by elimination from a quantity that was never measured

Holding tidal volume and chest wall compliance fixed and varying only lung
compliance, the pleural swing is unchanged at 2.79 cmH₂O while variation runs
from 6% to 39%. The conclusion written down was that the variation therefore
travels by "the alveolar route" rather than the pleural one, and that this was an
assumption the literature had not described.

Both halves were wrong. Varying lung compliance moves the entire pulmonary
operating point, not just alveolar pressure, so a constant pleural *swing* says
nothing about whether that route is inert. And the alternative is described — in
the very review being assessed at the time.

Measured rather than inferred:

| | compliance 200 | compliance 30 |
|---|---|---|
| pleural swing | 2.79 | 2.79 cmH₂O |
| venous return swing | 1.45 | 1.64 L/min |
| right ventricular filling swing | 7.1 | 11.7 mL |
| right ventricular stroke volume swing | 7.9 | **27.0 mL** |
| resistance swing within the breath | 0.04 | 0.34 Wood units |

Venous return barely moves; stroke volume triples. The amplification between
filling and stroke volume is the right ventricle ejecting against an afterload
that swings with the breath — Cecconi, Collino and Pinsky's caution, reproduced.

It led somewhere useful. The model had that phenomenon and was not flagging it:
the only guard was a rule on right ventricular dilatation, and at a lung
compliance of 30 the right ventricle is still smaller than the left while
variation reads 22%. Dilatation is a late sign. The model now measures the cause.

### 5. Arguing from first principles against a measurement

The extra-alveolar limb of the J-curve was moved from strain to transpulmonary
pressure on the reasoning that radial traction is a *stress*, not a volume, so it
should follow a pressure. The argument is sound. Three measurements disagree with
it — Thomas 1961 (hysteresis against pressure, none against volume), Hakim 1982
(volume-related changes identical under both inflation modes, pressure-related
ones not), the Peták group 2008 (hysteresis against pressure abolished when
plotted against volume) — and the change has been reversed.

A principle that is correct about a mechanism can still be wrong about which
variable dominates.

### 6. Tests that passed for the wrong reason

While lung compliance was a constant, strain and transpulmonary pressure were
proportional, so driving the two limbs by different quantities made no
difference and the rows passed either way. Making recruitment change the
mechanics broke that proportionality and three rows failed at once — which is how
the error above was found.

A test that cannot distinguish two models is not testing the one you think.

### 7. Fixing before diagnosing

The transport delay is the clearest case: a plausible mechanism, carefully
implemented, for a defect that was not there. It also had a subtler lesson —
its first version used eight queue slots, whose quantisation beat against the
cardiac cycle and produced non-monotone results that looked like physiology.
Two hundred slots removed the noise and revealed the change did nothing.

Cost: several hours, and it was reverted whole.

### 8. A process failure worth recording

One commit landed with a failing test. The command piped test output to `tail`,
so the pipeline's exit status was `tail`'s and the `&&` chain proceeded. Fixed in
the next commit, which says so.

---

## What was actually built, once the errors are subtracted

- **The tissue has a ceiling.** The pressure–volume relation saturates, so airway
  pressure no longer rises in a straight line however hard a lung is inflated,
  and the stress index can exceed 1. Two constants solved from two textbook
  volumes rather than chosen. A first version wrote the ceiling as an absolute
  volume, which made a stiff lung stiffen at 195 cmH₂O — the baby lung was the
  one place the model stayed straight, which is exactly where the question had
  been asked. The scale is a pressure now, and capacity follows from compliance.

- **The J-curve is anchored.** Both limbs follow volume and share the exponential
  that makes them rise. Three constants fitted to four published figures, so the
  fit could have failed. The nadir moved to 48% of maximal volume — above
  functional residual capacity, where Thomas measured it and where the textbooks
  do not put it.

- **Recruitment changes the mechanics**, so compliance tracks aerated lung size
  and resting volume can move. `frc` is gone as a parameter, because resting
  volume became an outcome; `collapsed` says what it used to mean.

- **Optional hysteresis**, which makes a recruitment manoeuvre leave something
  behind — and only when the PEEP after it exceeds the closing pressure, which is
  the clinical point falling out of the arithmetic rather than being asserted.

- **A caution for cyclic right ventricular afterload**, thresholded where this
  model's own relation between variation and fluid response crosses Michard's
  slope.

---

## The one rule that would have prevented most of this

Every row in `LITERATURE_RANGES.md` should carry the number the paper reports and
the conditions under which it was measured. Where it carries a direction, a
band of my own choosing, or a threshold detached from its ventilation, it is not
testing the model — it is recording an opinion, and the model will drift behind
it without anything going red.
