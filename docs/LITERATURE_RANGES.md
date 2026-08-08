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
| `peep-euvolaemia` | PEEP 5 → 10 at a protective tidal volume in a euvolaemic patient costs little cardiac output: between −5% and 0%. The abdomen defends the gradient, so mean systemic filling pressure rises by 1–3 mmHg. | not yet | Berger et al., *Am J Physiol Heart Circ Physiol* 2016;311:H794–806 |
| `peep-volume-status` | The haemodynamic cost of PEEP depends on volume status: raising PEEP from 5 to 15 costs a hypovolaemic patient at least 1.5 times what it costs a euvolaemic one. | agrees | Fougères et al., *Crit Care Med* 2010;38:802–7 |
| `pvr-recruitability-low` | In a poorly recruitable lung, PEEP 4 → 14 raises pulmonary vascular resistance. | agrees | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `pvr-recruitability-high` | In a highly recruitable lung, the same PEEP change leaves pulmonary vascular resistance essentially unchanged: within ±10%. Recruitment offsets the distension penalty rather than beating it. | not yet | Cappio Borlino et al., *Am J Respir Crit Care Med* 2024;210(7) |
| `transmission-chest-wall` | For the same PEEP, a stiff chest wall transmits more pressure to the pleural space than a compliant one. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `transmission-lung` | For the same PEEP, a stiff lung transmits less pressure to the pleural space than a compliant one, because it recruits less volume per cmH₂O. | agrees | Jardin et al., *Chest* 1985;88:653–8 |
| `pvr-j-shape` | Pulmonary vascular resistance is minimal near functional residual capacity and at least 50% higher at both 1.2 L and 3.8 L. | agrees | Simmons et al., *Circ Res* 1961;9:465–71 |
| `ppv-responder` | A passive patient at 8 mL/kg who is preload dependent shows pulse pressure variation of at least 13%, and the index reports itself interpretable. | agrees | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ppv-suspended-spontaneous` | The same patient breathing spontaneously has the index withheld rather than reported. | agrees | Teboul et al., *Am J Respir Crit Care Med* 2019;199:22–31 |
| `ph-classification` | A hypervolaemic failing left ventricle with a wedge above 15 mmHg and a mean pulmonary artery pressure above 20 is classified post-capillary; a lung with a high vascular resistance and a low wedge is classified pre-capillary. | agrees | Humbert et al., ESC/ERS guidelines, *Eur Heart J* 2022;43:3618–731 |
| `venous-return-plateau` | Venous return stops rising once right atrial pressure falls below the pressure surrounding the great veins: the curve has a plateau. | agrees | Guyton et al., *Am J Physiol* 1957;189:609–15 |

## Open rows

**`peep-euvolaemia`** — the model currently loses about 10% of cardiac output
where Berger found essentially none. The missing mechanism is the baroreflex:
with no reflex compensation every fall in output is unopposed. This row is the
acceptance test for that work.

**`pvr-recruitability-high`** — the model gives a highly recruitable lung a 15%
fall in resistance where the trial found no change. Referencing distension to
the patient's own resting volume improved this from 28%, but the rest is
structural rather than a matter of tuning, and it is worth stating exactly why.

In this model the two phenotypes are the same lung at different resting volumes,
so raising PEEP from 4 to 14 gives them **identical** distending stimuli:

| | volume gain | transpulmonary pressure | openness |
|---|---|---|---|
| High recruiter (FRC 1.35 L) | 0.116 → 0.407 L | 8.4 → 17.0 cmH₂O | −0.33 → −0.20 |
| Low recruiter (FRC 2.10 L) | 0.116 → 0.407 L | 8.4 → 17.0 cmH₂O | +0.01 → +0.14 |

The only thing that differs is how much lung is open — and in a homogeneous
model, more open lung always means less resistance. So no formulation of the
distension limb, whether driven by volume, by strain or by transpulmonary
pressure, can make the recruiter's resistance stay flat: the distending stimulus
is literally the same in both.

What the trial measured is *heterogeneity* — units opening while their
neighbours stretch, which is what the R/I ratio quantifies. A one-compartment
lung cannot hold that. Reproducing it needs a lung split into at least two
regions with different opening pressures, which is the same structural change
that would give the model a real right-to-left transit delay. Two open rows,
one fix.

A parameter search was run before concluding this. Combinations that satisfy the
row exist, but only by driving the distension exponent to the edge of the search
space and making resistance at 3.8 L nearly seven times the nadir — far outside
what Simmons and Permutt measured. Passing a row by deforming the curve is not
passing it.

## What this file is not

These are directional and order-of-magnitude checks against published group
means. Passing them is evidence that the model reproduces a documented
relationship, not that it would predict an individual patient — see the
limitations in [PHYSIOLOGY.md](PHYSIOLOGY.md).
