# Heart–Lung Interaction

A real-time, web-based simulator of mechanical heart–lung interaction. Change a
ventilator setting or a circulatory parameter and watch the consequences appear
at once on the Guyton diagram, the Campbell diagram, both ventricular
pressure–volume loops, the pulmonary vascular J-curve, a live monitor and an
animated thoracic schematic.

Built from Jon-Emile Kenny's *An Approach to Mechanical Heart-Lung Interaction*
(1st ed., 2020), Mahmood & Pinsky (*Ann Transl Med* 2018;6:349) and Yuriditsky,
Mireles-Cabodevila & Alviar (*ATS Scholar* 2025;6:94–108).

> **For teaching only.** This is a deliberate simplification of human
> physiology. It must not be used to guide the care of a patient.

---

## Contents

1. [Running it](#1-running-it)
2. [What makes it a model rather than an animation](#2-what-makes-it-a-model-rather-than-an-animation)
3. [The respiratory system](#3-the-respiratory-system)
4. [The circulation](#4-the-circulation)
5. [The pulmonary circulation](#5-the-pulmonary-circulation)
6. [Ventricular interdependence](#6-ventricular-interdependence)
7. [Integration and derived measurements](#7-integration-and-derived-measurements)
8. [The derived curves](#8-the-derived-curves)
9. [Parameters](#9-parameters)
10. [Scenarios](#10-scenarios)
11. [Fixed constants](#11-fixed-constants)
12. [Project layout](#12-project-layout)
13. [Tests](#13-tests)
14. [Scripting it](#14-scripting-it)
15. [Accessibility and colour](#15-accessibility-and-colour)
16. [Limitations](#16-limitations)
17. [Sources](#17-sources)

---

## 1. Running it

No build step and no dependencies. Serve the directory over HTTP — ES modules
will not load from `file://`:

```bash
npm run serve
```

Then open <http://localhost:8422>. Any static server works.

**While editing, use the other one:**

```bash
npm run serve:dev
```

That is `node tools/serve.mjs`, on port 8499, and the only thing it does
differently is send `Cache-Control: no-store`. Browsers cache ES modules hard
enough that a plain reload can serve you the previous version of a module while
you are staring at the new source. That is not a hypothetical: a real bug in this
repository survived several rounds of "that change did nothing" before it was
found, and it was found by serving with no-store.

---

## 2. What makes it a model rather than an animation

Nothing in the display is scripted. The circulation is a closed loop of eight
pressure-bearing compliant compartments plus one pressureless eight-stage
pulmonary transport pathway, with conserved volume and integration at 0.25 ms.
The single design decision that produces every classical teaching point is that **each
compartment is referenced to the pressure that actually surrounds it**:

| Compartment | Symbol | Surrounding pressure |
|---|---|---|
| Systemic arteries | `vSa` | atmosphere |
| Systemic veins (splanchnic reservoir) | `vSv` | abdominal pressure `Pab` |
| Right atrium, right ventricle | `vRa`, `vRv` | pleural + pericardial |
| Left atrium, left ventricle | `vLa`, `vLv` | pleural + pericardial |
| Pulmonary arteries, pulmonary veins | `vPa`, `vPv` | pleural |

From that table alone, and nothing else:

- **Raising intrathoracic pressure reduces venous return.** It lifts right
  atrial pressure but not the systemic venous reservoir, so the gradient falls.
- **Raising intrathoracic pressure unloads the left ventricle.** Cavity pressure
  rises while aortic pressure does not, so ejection begins sooner.
- **Intrathoracic pressure does not change right ventricular afterload.** The RV
  and the pulmonary artery are lifted equally. Only lung volume moves PVR.
- **Central venous pressure falls during spontaneous inspiration while filling
  rises.** The measured pressure follows pleural pressure down; the transmural
  pressure goes up.

Units follow the sources: respiratory pressures in cmH₂O, vascular pressures in
mmHg, converted at 1 mmHg = 1.35951 cmH₂O in `src/model/units.js`. Volumes are
mL, flows mL/s internally and L/min on screen, resistances mmHg·s/mL internally
and Wood units or dyn·s·cm⁻⁵ on screen.

---

## 3. The respiratory system

`src/model/respiratory.js`. The lung and chest wall are two elastic elements in
series — which is exactly what the Campbell diagram draws. With `V` the volume
above the relaxation volume (litres):

```
1/Crs = 1/Clung + 1/Ccw

Palv = V / Crs − Pmus
Ppl  = Ppl(FRC) + V / Ccw − Pmus
flow = (Pao − Palv) / Raw
```

With expiratory flow limitation on, that passive outward flow is capped by a
maximal expiratory flow–volume envelope:

```
maximum expiratory flow = volume above zero-PEEP relaxation / 4.5 s
```

The lower of passive resistive flow and this maximum empties the lung. Below
the choke, lowering downstream airway pressure further cannot increase flow;
once external PEEP is high enough to reduce passive flow below the cap, it
becomes true back-pressure again. This is one aggregate Starling-resistor-like
airway, not a regional COPD lung.

`Ppl(FRC) = −5 cmH₂O`, so transpulmonary recoil at the relaxation volume is
+5 cmH₂O and alveolar pressure there is zero.

The consequence that matters clinically is that **pleural pressure follows the
chest wall compliance curve, while airway pressure follows the respiratory
system curve**. For a given tidal volume, pleural pressure rises by `VT / Ccw` —
lung compliance does not appear in that expression. This is why:

- The same tidal volume costs the same venous return in ARDS as in a normal
  lung, but the same *PEEP* costs far less, because a stiff lung recruits less
  volume per cmH₂O of airway pressure.
- A stiff chest wall raises the haemodynamic cost of every breath.

### Ventilatory modes

| Mode | Inspiration | Cycling |
|---|---|---|
| `spont` | `Pao = PEEP` (CPAP level), driven by `Pmus` | time, at the neural inspiratory time |
| `vcv` | constant flow `VT / Ti`; airway pressure is whatever it takes | time, at `Ti` |
| `pcv` | `Pao = PEEP + Pinsp` | time, at `Ti` |
| `psv` | `Pao = PEEP + Pinsp` | flow, at 25% of peak inspiratory flow |

`Pmus` can be added to any mode, which is how a patient triggering against a
ventilator is represented. Muscle pressure is a single continuous rise and
release over the neural inspiratory time `min(Ti, T_resp/2)`:

```
Pmus(t) = pmus · sin(π t / t_neural)^1.2
```

It has to reach zero at both ends; a discontinuity here makes the phase detector
chatter and the breath fragment.

### Intrinsic PEEP

Emergent, not configured. If expiratory time is short relative to the expiratory
time constant `τ = Raw · Crs`, volume does not return to static equilibrium and
end-expiratory alveolar pressure exceeds the set PEEP. With EFL on, the reported
emptying time is at least 4.5 s because maximal expiratory flow can become slower
than the linear resistance predicts.

The COPD preset generates about 7.1 cmH₂O of intrinsic PEEP and 782 mL of
dynamic trapped volume at external PEEP 5. Trapped volume means actual EELV
minus the passive equilibrium volume at the same applied PEEP; it therefore does
not mislabel loss-of-recoil static hyperinflation as dynamic trapping. At low
external PEEP the choke can hold total PEEP and absolute EELV nearly constant;
above it, PEEP adds volume and haemodynamic cost. This is a directional teaching
relation, not a bedside PEEP titration rule.

### Abdominal coupling

```
Pab = Pab₀ + abdCoupling · V
```

Diaphragmatic descent pressurises the abdomen in proportion to the volume moved.
This single term produces both of the effects described in §4.

---

## 4. The circulation

`src/model/circulation.js`. Eight pressure-bearing compliant compartments and
one eight-stage pulmonary flow-transport pathway, volume conserved,
integrated with forward Euler at dt = 0.25 ms — small relative to the shortest
time constant in the system, the valve resistances at ≈7.5 ms.

### Chamber pressures

Ventricles use time-varying elastance with a double-hill activation:

```
e(tn) = [ g₁/(1+g₁) ] · [ 1/(1+g₂) ] / 0.885
        g₁ = (tn/0.28)^1.9,  g₂ = (tn/0.46)^18,  tn = t / T_cardiac

P_transmural = e(tn)·Ees·(V − V0s) + (1 − e(tn))·A·(exp(B·(V − V0d)) − 1)
P_cavity     = P_transmural + Ppl + P_pericardial
```

Atria use the same form with a linear elastance ramp, activated over the last
fifth of the cardiac cycle:

```
a(tn) = sin(π (tn − 0.8) / 0.2)²   for tn ≥ 0.8, else 0
E_atrium = E_min + (E_max − E_min)·a(tn)
P_transmural = E_atrium · (V − V0)
```

Valves are diodes with a small series resistance: `Q = (P_up − P_down)/R` when
the gradient is positive, otherwise zero.

### Venous return and the Starling resistor

```
Pmsf_elastic = (vSv − Vu,sv) / Csv
zone         = clamp((Pmsf_elastic − 2)/8, 0, 1)
Pmsf         = Pmsf_elastic + 0.6 · Pab · zone
Rvr_eff      = Rvr · (1 + 0.5·(1 − zone)·max(0, Pab − 2)/4)

Pcrit    = Pab − 5 cmH₂O
P_eff    = Pcrit + k · ln(1 + exp((Pra − Pcrit)/k)),   k = 1.1 mmHg
Q_vr     = max(0, (Pmsf − P_eff) / Rvr_eff)
```

Two things are happening here, both from the sources.

**The Starling resistor.** `P_eff` is right atrial pressure while the vein is
open and the critical closing pressure once it collapses — Kenny's figure of the
inferior vena cava tolerating about 5 cmH₂O of transmural compression. The
transition is smoothed over ≈1 mmHg with a softplus rather than a hard `max()`,
because collapse is a flutter rather than a switch, and a hard knee makes venous
return completely insensitive to intrathoracic pressure in hypovolaemia — which
would remove exactly the physiology the simulator exists to show.

**Abdominal zone conditions** (Kenny ch. 3, fig. 3). Whether abdominal pressure
helps or hinders depends on how full the splanchnic bed is. A full abdomen
squeezed by the diaphragm pushes blood forward and raises the pressure head
(zone III). An empty one is obliterated instead, and the same pressure raises
resistance (zone I/II). This is why PEEP costs a hypovolaemic patient much more
than a hypervolaemic one, and why fluid loading changes the *shape* of the
response to PEEP rather than just its size.

### Systemic circuit

```
Psa   = (vSa − Vu,sa) / Csa
Q_sys = (Psa − Pmsf) / SVR
```

Aortic pressure is referenced to atmosphere. Because left ventricular cavity
pressure carries `+Ppl` and aortic pressure does not, raising intrathoracic
pressure makes the ventricle eject sooner — the afterload reduction falls out of
the reference frame rather than being applied as a term.

---

## 5. Manoeuvres

Two occlusion manoeuvres can be done *to* the patient rather than set on them.
They change what the ventilator delivers without moving the sliders, because a
manoeuvre is not a new setting.

### Occlusion holds

End-expiratory and end-inspiratory holds freeze the airway, so alveolar pressure
equilibrates with the airway and the circulation settles at a fixed lung volume.
Each hold contributes one measured point to the Guyton diagram; several at
different airway pressures draw a venous return curve the way the bedside draws
one.

## 6. The pulmonary circulation

### The lung as two populations of units

The lung is not one compartment. Its units are split by how hard they are to
open: normal ones, which close as the lung empties and reopen at almost any
distending pressure, and diseased ones, which are shut at rest and reopen only if
they can be reopened at all. Consolidated lung is collapsed and stays collapsed
however hard it is pushed.

```
f_openable = calibrate(R/I, collapsed, C_lung, C_cw, pOpen; PEEP 5 -> 15)
open(Pl)  = (1 - collapsed)*sigma((Pl - 0)/1.3) + collapsed*f_openable*sigma((Pl - pOpen)/2)
room      = CAPACITY - V0
perUnit   = V0 + room*(1 - exp(-C_lung*Pl/room))     saturating above Pl = 0
          = max(0, V0 + C_lung*Pl)                   linear below it
V(Pl)     = open(Pl) * perUnit(Pl)                   the pressure-volume curve
V_rest    = V(5)                                     recoil balancing the chest wall
strain    = V / (2.2 L * open) - 1                   volume per *open* unit
```

`f_openable` is deliberately internal. The user supplies the bedside
recruitment-to-inflation ratio, and the model finds the smallest fraction of the
collapsed compartment that reproduces it during a passive PEEP 5 → 15 cmH₂O
reference manoeuvre:

```
V_recruited = ΔEELV - Crs_low * ΔPEEP
R/I         = (V_recruited / ΔPEEP) / Crs_low
```

Collapse, tissue compliance and R/I therefore remain separate. A high requested
R/I cannot create units that are not collapsed; if the finite collapsed
compartment or the selected opening pressure cannot supply it, the model reports
the lower achieved R/I and marks the readout for caution.

`V0` and `CAPACITY` are not chosen, they are solved, from two textbook volumes: a
normal fully open lung rests at 2.2 L when its recoil is 5 cmH₂O, and reaches
total lung capacity, 6 L, at 35 cmH₂O. Both are asserted by the test suite to six
and three decimals. `CAPACITY` comes out near 10 L, which is not a volume any
lung reaches — it is the scale of the exponential, and the physical claims are
the two anchors.

Units are treated as either open at full size or shut - the sponge idealisation.
`strain` is therefore volume per **open** unit, and it is the quantity a
single-compartment lung cannot produce. With a third of the lung open, a litre of
gas strains each unit half again as much as it would with two thirds open: the
baby lung, written as arithmetic.

### Recruitment changes the mechanics, not only the resistance

The curve above is a product of two factors, and the shape comes from that
product: how many units are open is a sigmoid in pressure, how much each open one
holds is linear in it. Three things follow, none of which a linear lung can do.

**The pressure-volume curve has a lower inflection.** A recruitable lung is
stiffest where its baby lung is being stretched alone and gets *less* stiff as
pressure opens more of it - local slope 38 to 51 mL/cmH2O between transpulmonary
pressures of 8 and 22. A consolidated one only stiffens, 25 to 23. A normal lung
sits on the flat top of the recruitment sigmoid, so its curve is nearly straight,
which is why this looked like a line for as long as it did.

**Measured compliance tracks aerated lung size, not tissue stiffness.** What a
ventilator computes is the open fraction times the tissue value, which is the
baby lung as something that gets printed on a screen. `clung` is therefore the
compliance of the lung *with all of it open*, not what you would measure. The
ARDS preset carries `clung=40` and reads 36 mL/cmH2O at the bedside.

**Resting volume is an outcome, so it can move.** It is where the lung's recoil
balances the chest wall, `V(5)`, and it rises when pressure opens more units -
which is why proning now adds volume instead of only opening units, and why `frc`
is gone as a parameter. A lung that has lost its elastic recoil rests high
without being told to: raising `clung` to the COPD preset's 300 is sufficient to
put its pre-breath relaxation volume around 2.66 L. Airway resistance and EFL
then determine the additional dynamic volume; they do not set this static one.

There is no closed form for the inverse once the open fraction is in it, so
transpulmonary pressure is found numerically. In the integrator the solve is
warm-started from the previous step - the lung moves about a tenth of a
millilitre per step - and agrees with a fresh bisection to 2 parts in 10^9.

### The stress index

```
fit  Paw = a*t^b + c   over the constant-flow part of the breath;  report b
```

Above 1 the airway pressure curls upward: the lung is running out of room, and
the breath is finishing on stiffer tissue than it started on. Below 1 it curls
the other way, because units are still opening as the breath goes in and each one
that opens takes pressure off the rest — tidal recruitment, and a sign the PEEP
underneath is too low.

This needs the tissue to have a ceiling, which is why it did not exist before.
With a linear pressure–volume relation the airway pressure rose in a straight
line however hard a lung was inflated, and the index could not exceed 1 whatever
was done to the patient — measured at 0.92 with a tidal volume of 1200 mL on a
normal lung, where it should have been well above 1.

| | stress index |
|---|---|
| Normal lung, 450 mL | 1.03 |
| Normal lung, 1400 mL | 1.07 |
| Stiff collapsed lung, 900 mL at PEEP 20 | 1.19 |
| Recruitable lung at PEEP 2 | **0.89** |
| The same lung at PEEP 14 | **1.05** |

That last pair is the point: the same patient reads below 1 when the PEEP under
the breath is too low to hold the lung open, and above 1 once it is not.

It reads the shape of a constant-flow inflation, so it is withheld outside one —
in pressure control, or with any inspiratory effort, the curve it would be
fitting is not the curve it is named after. The fit is a hundred candidate
exponents against forty samples, once per breath: a few thousand operations
against the four thousand integration steps the same second already costs.

### Hysteresis, optionally

With `hysteresis` off, units open and close at the same pressure, how much lung
is open is a function of the pressure of the moment, and nothing you do to the
lung lasts. Switch it on and units close at `pClose`, below the `pOpen` they
opened at, which makes the open fraction a **state with a history**:

```
band(Pl)  = { lo: open(Pl, 0), hi: open(Pl, pOpen - pClose) }
phi       <- min(max(phi, lo), hi)        every step
```

A play operator. Below `lo` the pressure is prising units open and drags the
state up; above `hi` it is letting them shut and drags it down; in between
nothing moves, and that gap is the memory. Within a step the fraction is frozen,
which makes the lung a straight line and the inverse a closed form rather than a
solve.

A lung that has never been inflated starts on the opening branch, so there is
something for a manoeuvre to do.

**What this buys.** Taking the ARDS preset to 35 cmH₂O for thirty seconds and
back to PEEP 10, with `pClose=6`: the lung goes from 75% open to 79% and stays
there, the resistance coefficient falls 3.21 to 2.90 Wood units, and the
right-to-left end-diastolic ratio falls 1.66 to 1.62. The manoeuvre is not a
button — raise PEEP, wait, lower it — because with hysteresis the model does not
need one.

**And what it does not.** Run the same manoeuvre with `pClose=14` and it buys
exactly nothing: 71.6% open before and after. End-expiratory transpulmonary
pressure is 13.0, below the closing pressure, so everything recruited shuts again
on the first expiration. That is the clinical point about recruitment manoeuvres
stated as arithmetic — the manoeuvre opens the lung, the PEEP after it is what
keeps it open, and without the second the first is a transient.

**Incremental and decremental PEEP trials stop being the same experiment.** Walk
up from 4 and down from 35 through the same rungs and the descending limb sits 3
to 4 points more open at every one, with a resistance about 0.3 Wood units lower
and a higher cardiac output. Same patient, same PEEP, different lung.

Setting `pClose` equal to `pOpen` is the same as switching the flag off, and the
test suite asserts that rather than the documentation claiming it.

**Still missing:** the operator is instantaneous, so a unit opens within the step
that reaches its threshold. Real recruitment has a time course over seconds to
minutes, which is why manoeuvres are held rather than touched. Nothing here
resolves that, so the length of a manoeuvre does not matter, only its pressure.

### The J-curve

```
vascular_FRC = volume held by fully open tissue at resting recoil
strain       = lung_volume / (open * vascular_FRC) - 1
deflation    = max(0, -strain)
stretch      = exp(0.58 * strain)
unfurled     = 0.30 + 0.70 * exp(-0.829 * strain)
R_alveolar   = PVR0 * 0.5 * stretch
R_extra      = PVR0 * (0.5 * unfurled + 4 * deflation^2)
R_open       = R_alveolar + R_extra
R_closed     = 3 * PVR0 * (1 + 1.1 * hpv)
conductance  = open / R_open + (1 - open) / R_closed
PVR          = 1 / conductance
```

**The curve is human-centred and the pathways are parallel.** The fully open
curve reaches its minimum at 2.25 L, within 50 mL of the model's 2.2 L normal
FRC. The old minimum at 2.87 L and its maximal-inflation ratios were fitted to
excised dog lungs. Those experiments remain useful for the volume-dependent
mechanism, but their exact numerical geometry is no longer treated as a human
in-vivo target.

Both mechanical limbs still follow volume:

- Thomas, Griffo & Roos 1961: resistance plotted against transpulmonary pressure
  shows wide hysteresis between inflation and deflation, and plotted against
  volume it does not.
- Hakim, Michel & Chang 1982: the volume-related changes are identical under
  positive- and negative-pressure inflation while the pressure-related ones are
  not.
- The Peták group 2008: hysteresis against transpulmonary pressure is abolished
  when the same data are plotted against volume.

`K_UNFURL≈0.829` is derived so that unfurling and stretch have equal and opposite
slopes at zero strain. The quadratic low-volume term is zero in both value and
slope at FRC: it makes loss of radial traction visible without moving the nadir.
Neither coefficient is a fit to an animal maximal inflation. Strain is referenced
to what this patient's fully open tissue would hold at resting recoil, so a small
stiff ARDS lung can reach the right limb at a total volume below 2.2 L.

Open and derecruited units are two vascular pathways in parallel. Open units
follow the J-curve. Derecruited units remain poorly perfused and HPV raises only
their resistance. Their conductances add; their resistances do not. The previous
formula divided by the open fraction and multiplied the entire lung by HPV while
describing closed units as still perfused. Numerically that removed their pathway
and drove the severe ARDS phenotype to roughly 10–16 WU.

**Why this replaced a single compartment.** With one compartment, a recruiter and
a non-recruiter were the same lung at different resting volumes, so raising PEEP
gave them identical volume gain and identical transpulmonary pressure and there
was nothing left to tell them apart. Recruitability is now explicit and uses the
same numerical R/I definition as the study. In the human calibration phenotype,
PEEP 4 → 14 gives 2.63 → 3.18 WU (+21%) at R/I 0.05 and 2.53 → 2.65 WU (+5%) at
R/I 0.50. All four values lie inside the IQRs reported by Cappio Borlino et al.;
the response is not fitted to the ratio of cohort medians.

**Limits.** The model has no separately measured airway-opening pressure, so its
R/I uses the applied 10 cmH₂O step rather than Chen's airway-opening correction.
R/I is protocol-dependent, and a high value does not prove that high PEEP avoids
overdistension. The opening-sigmoid width and threefold closed-path factor are
aggregate teaching coefficients, not measured anatomical constants. Regional
perfusion, flow-dependent vascular recruitment and distension, vascular
remodelling, hypercapnia, viscosity and hypoxic tone outside derecruited units
are not represented here. Thrombotic obstruction is not a separate anatomical
mechanism: the acute pulmonary embolism preset uses `pvrBase` as an aggregate
effective pulmonary vascular load.

### Vascular waterfall and West zones

```
P_downstream = Ppv + 0.45 * max(0, Palv - Ppv)
Q_pul        = max(0, (Ppa - P_downstream) / PVR)
```

Where alveolar pressure exceeds pulmonary venous pressure, alveolar pressure —
not left atrial pressure — contributes to the downstream pressure for flow
(Permutt). It applies to 45% of the aggregate bed, at the upper end of published
34–45% alveolar-capillary partitions. The previous all-or-none formula put the
entire pulmonary circulation behind the waterfall: crossing `Palv=Ppv` could
therefore add several Wood units abruptly. The current fraction represents a
mixture of vascular segments and West zones without adding regional compartments.

### The pulmonary piston

```
zone3    = clamp((Ppv_raw − Palv) / 4, 0, 1)
Vu,pv_eff = Vu,pv − piston · max(0, V_lung − FRC) · zone3
Ppv       = (vPv − Vu,pv_eff) / Cpv + Ppl
```

Lung inflation reduces pulmonary venous unstressed volume in proportion to the
zone III fraction, discharging blood toward the left atrium during inspiration.
This is the main source of left ventricular stroke volume variation during
positive-pressure ventilation.

---

## 7. Ventricular interdependence

Three mechanisms, deliberately separated.

**Pericardium** — one exponential pressure–volume relation applied to the sum of
all four chamber volumes, added to every chamber's surrounding pressure, so
interdependence emerges rather than being asserted:

```
V_heart = vRa + vRv + vLa + vLv
P_peri  = pericardium · 0.55 · (exp((V_heart − 430)/62) − 1)   for V_heart > 430
```

**Diastolic septal shift** — a direct term added to left ventricular diastolic
pressure proportional to right ventricular volume above a threshold, and a much
smaller reverse term:

```
septal→LV = septal · 0.085 · max(0, vRv − 145)
septal→RV = septal · 0.014 · max(0, vLv − 135)
```

**Systolic interdependence** — the left ventricle generating a large share of
right ventricular systolic pressure through shared myofibres:

```
lvAssist = 0.042 · e(tn) · Ees_lv · max(0, vLv − V0s_lv)
```

This last one is **not** on the `septal` control, because it is anatomy rather
than septal geometry. Putting it on the same slider made "turn off septal
coupling" weaken the right ventricle, which is the opposite of the demonstration
the control exists for.

---

## 8. Integration and derived measurements

| Quantity | Method |
|---|---|
| Integration | forward Euler, dt = 0.25 ms |
| Waveform traces | ring buffers at 250 Hz, 12 s window |
| Mean arterial / venous / PA / wedge pressures | exponential moving average, τ = 3 s of **simulated** time |
| Stroke volume | end-diastolic volume latched at the beat boundary, minus the minimum reached during that beat |
| Pulse pressure variation | (PPmax − PPmin)/PPmean over the beats in the last respiratory cycle |
| Guyton operating point and curves | boxcar average over exactly one cardiac cycle |

Two of these deserve a note.

**Stroke volume is latched at the beat boundary**, not taken as a maximum over a
window. Taking the maximum pairs one beat's end-systolic volume with the *next*
beat's end-diastolic volume, which smooths away exactly the respiratory
variation the simulator is meant to show.

**The Guyton diagram is averaged over one cardiac cycle.** It is a steady-state
construction — its axes are mean pressure and mean flow — and right atrial
pressure swings around 3 mmHg every beat through its a, c and v waves, roughly a
third of the width of the plot. A boxcar exactly one cardiac cycle long nulls
that ripple while passing the respiratory cycle essentially untouched, which is
the motion the diagram exists to show.

---

## 9. The derived curves

The Guyton diagram is not drawn from a lookup table. Both curves are computed
from the same constants the integrator uses, so they move with the live state.

**Venous return** is the equation in §4, swept over right atrial pressure.

**Cardiac function** converts each candidate filling pressure to a transmural
pressure, inverts the right ventricular EDPVR to an end-diastolic volume, and
applies the single-beat elastance relation with the arterial elastance the right
ventricle currently faces:

```
Ptm = Pra − (Ppl + P_peri)
EDV = V0d + ln(Ptm/A + 1) / B                    (inverting the EDPVR)
Ea  = (P_es,rv − Ppl) / SV_rv
SV  = Ees_rv·(EDV − V0s) / (Ees_rv + Ea)
CO  = SV · HR
```

The x-intercept sits at pleural plus pericardial pressure, so a breath visibly
slides the curve along the axis — which is the mechanism by which ventilation
changes cardiac output, drawn directly.

**Two markers, because they are two different things.** A filled marker shows
the simulated state — the cycle-mean right atrial pressure against the
cycle-mean venous return, which is where the integrated model actually is. A
hollow marker shows the analytic equilibrium, the crossing of the two curves
found by bisection. They are close but not identical: the cardiac function curve
is a single-beat approximation rather than something the integrator computes.
Drawing only the crossing, as this panel once did, presents a derived
equilibrium as if it were the patient.

Both curves call the same exported functions the integrator uses, so a curve
cannot drift away from the model. The simulated state sits on the drawn venous
return curve to within 0.02–0.33 L/min across every preset, and a test asserts
it.

### Building the curve from measurements

**Exp hold** and **Insp hold** occlude the airway for twelve seconds. With no
flow, alveolar pressure equilibrates with the airway and the circulation settles
at a fixed lung volume; the mean right atrial pressure and flow over the last
part of the hold are plotted as a small square. Several holds at different
airway pressures — vary the tidal volume, or the PEEP — draw an extrapolated
pressure–flow relation. The approach has been used at the bedside in
postoperative patients and tested experimentally by Berger et al. in pigs. Its
zero-flow intercept is an estimate, not a direct measurement of mean systemic
filling pressure.

The measured line does not lie on the analytic curve, and that is the point of
having both. Four inspiratory holds at 300, 500, 700 and 900 mL (about
8.3–15.3 cmH₂O) give a slope near 0.19 L/min per mmHg against roughly 0.73
implied by the model's resistance, and extrapolate to an intercept around
28 mmHg against an actual Pmsf around 8.8. The reason is in the model and is
physiologically plausible:
every occlusion raises lung volume and abdominal pressure, shifting the relation
it is trying to sample. Berger demonstrated the direction in pigs, but observed
a much smaller mean excess of 3.0 mmHg with wide dispersion. The simulator
therefore presents the value as an **extrapolated intercept**, not as a
calibrated Pmsf measurement.

---

### Preload reserve

The two curves already carry the answer to "would filling help", so it is read
off them rather than asserted:

```
sensitivity = d(CO*)/d(Pmsf)      from re-intersecting at Pmsf ± 0.5 mmHg
reserve     = sensitivity / CO*    fraction of output per mmHg of filling
steep limb  = reserve ≥ 0.10
```

Adding volume translates the venous return curve to the right and leaves cardiac
function where it is, so the question is how far the crossing climbs when it
does. On the steep limb it climbs; on the plateau it slides sideways along a flat
cardiac function curve and output barely moves. Both curves matter — a stiff
venous system moves the crossing further for the same volume, and a flat cardiac
function curve stops that counting for anything.

Every crossing lies on the cardiac function curve by construction, so sweeping
filling pressure traces a segment of that curve rather than a new one. The panel
therefore thickens the stretch where the reserve is above threshold instead of
drawing a second line, which makes "on the steep part of the Starling curve" a
place on the picture rather than a claim in a tile.

**It is deliberately expressed per mmHg of filling pressure, not per millilitre
of fluid.** Converting needs an assumption about how much of a bolus stays in the
capacitance vessels — which is precisely what a fluid challenge is testing, so
building it in would beg the question.

**The threshold is calibrated against this model, not taken from a paper.** The
clinical convention is that 500 mL raising cardiac output by 15% means fluid
responsive, so the reserve that corresponds to that was measured rather than
assumed. Across 60 randomised configurations varying stressed volume, systemic
resistance, heart rate, right ventricular contractility, venous compliance, PEEP,
resistance to venous return and abdominal pressure, a threshold of 0.10
classifies about 90% of them the same way the model's own response to 500 mL
does, and the test asserts that.

The cases it gets wrong fall into two groups, both instructive. A patient can
have a steep local slope and gain little, because 500 mL walks them past the knee
and the gain saturates — the reserve is a derivative and a bolus is not
infinitesimal. And a patient with low venous compliance gains more than their
slope suggests, because the same bolus buys more filling pressure. That second
one is the assumption left out on purpose.

**Why it earns its place next to pulse pressure variation.** It is read off the
curves rather than off the arterial waveform, so it survives the conditions that
withhold the dynamic indices: spontaneous breathing, a tidal volume below
8 mL/kg, an irregular rhythm. It is also not fooled by the one false positive
this model does produce — at 1400 mL of stressed volume, variation is raised by
the lung squeezing blood forward while the reserve correctly reads the plateau.

## 10. Parameters

Every user-facing knob, defined in `src/model/parameters.js`. The control panel
builds itself from this list, so adding an entry there is enough to make it
appear in the UI and in every scenario.

### Ventilation

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `mode` | Ventilatory mode | — | `vcv` | `spont` / `vcv` / `pcv` / `psv` |
| `rr` | Respiratory rate | /min | 14 | 6 – 40 |
| `vt` | Tidal volume (volume control only) | mL | 450 | 150 – 900 |
| `pinsp` | Inspiratory pressure above PEEP (pressure modes) | cmH₂O | 14 | 4 – 40 |
| `peep` | PEEP | cmH₂O | 5 | 0 – 24 |
| `ti` | Inspiratory time | s | 1.2 | 0.4 – 2.5 |
| `pmus` | Inspiratory effort | cmH₂O | 0 | 0 – 30 |

### Respiratory mechanics

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `position` | Body position | — | `supine` | `supine` / `prone` |
| `clung` | Lung compliance with all of it open | mL/cmH₂O | 200 | 20 – 420 |
| `ccw` | Chest wall compliance | mL/cmH₂O | 200 | 40 – 300 |
| `raw` | Airway resistance | cmH₂O/L/s | 5 | 1 – 40 |
| `efl` | Expiratory flow limitation | off/on | off | — |
| `collapsed` | Fraction of the lung shut at rest | — | 0 | 0 – 0.8 |
| `pab0` | Baseline abdominal pressure | cmH₂O | 4 | 0 – 30 |
| `abdCoupling` | Diaphragm–abdomen coupling | cmH₂O/L | 4 | 0 – 12 |

### Volume and vascular tone

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `stressedVolume` | Baseline stressed volume | mL | 700 | 200 – 1800 |
| `csv` | Venous compliance (slope) | mL/mmHg | 100 | 30 – 200 |
| `rvr` | Resistance to venous return | mmHg·s/mL | 0.072 | 0.02 – 0.30 |
| `svr` | Systemic vascular resistance | mmHg·s/mL | 1.05 | 0.25 – 3.0 |

Changing `stressedVolume` moves blood into or out of the venous reservoir — a
fluid bolus or a diuresis — rather than silently rescaling the model. Venous
tone is separate: it lowers the reservoir's zero-pressure volume and mobilises
the same amount into stressed volume without adding blood. Changing `csv`
changes the pressure–volume slope; it does not stand in for venoconstriction.

### Cardiac function

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `hr` | Heart rate, before reflex modulation | /min | 75 | 40 – 170 |
| `baroreflex` | Baroreflex sensitivity | × | 1.0 | 0 – 2 |
| `baroSetPoint` | Pressure the reflex defends | mmHg | 90 | 55 – 110 |
| `eesLv` | LV end-systolic elastance | mmHg/mL | 3.0 | 0.3 – 6.0 |
| `eesRv` | RV end-systolic elastance | mmHg/mL | 0.58 | 0.08 – 1.6 |
| `lvStiff` | LV diastolic stiffness (the `B` of the LV EDPVR) | 1/mL | 0.028 | 0.010 – 0.080 |
| `pericardium` | Pericardial constraint gain | × | 1.0 | 0 – 4 |
| `septal` | Diastolic septal coupling gain | × | 1.0 | 0 – 4 |

### Pulmonary circulation

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `pvrBase` | Resistance coefficient of a fully open lung at its resting-volume nadir | mmHg·s/mL | 0.07 | 0.03 – 0.60 |
| `hpv` | Hypoxic vasoconstriction gain | × | 1.0 | 0 – 3 |
| `riRatio` | R/I over the passive PEEP 5 → 15 reference manoeuvre | ratio | 0.5 | 0 – 2 |
| `pOpen` | Transpulmonary pressure at which half the internally openable compartment is open | cmH₂O | 20 | 5 – 40 |
| `hysteresis` | Whether units close at a lower pressure than they opened at | off/on | off | — |
| `pClose` | Pressure at which open units start to shut, with hysteresis on | cmH₂O | 12 | 2 – 40 |
| `piston` | Pulmonary capacitance coupling | mL/L | 85 | 0 – 200 |

To convert a resistance to clinical units: Wood units = mmHg·s/mL × 1000/60;
dyn·s·cm⁻⁵ = mmHg·s/mL × 80000/60.

### The baroreflex

One bounded sympathetic outflow with a 15 s time constant, driven by the error
between mean arterial pressure and a set point, acting on heart rate, systemic
resistance, unstressed-to-stressed venous volume recruitment and contractility
together. The sensitivity control changes how quickly pressure error approaches
full response; it cannot make the outflow exceed full response. Zero disables
the compensator.

This is a slow aggregate teaching mechanism, not a reconstruction of human
beat-to-beat autonomic control. Human cardiac responses can begin within one
beat ([Borst et al. 1983](https://doi.org/10.1016/0165-1838(83)90004-8)), and
the cardiac delay itself changes with autonomic state
([Keyl et al. 2001](https://pubmed.ncbi.nlm.nih.gov/11408442/)); sympathetic
cardiac and vascular effects have different, slower time courses. The model
deliberately does not add separate vagal, cardiac-sympathetic, arterial and
venous states. Its 15 s constant should therefore be used to compare
compensated and uncompensated steady states, not to interpret reflex latency.

At unit positive outflow the venous effector shifts 200 mL out of unstressed
volume. It changes neither total blood volume nor venous compliance. The heart
rate effector adds at most 42/min rather than multiplying the selected baseline
rate: a phenotype already set to 105 or 170/min must not acquire a larger reflex
solely because it began tachycardic. Both coefficients preserve the former
model's order of magnitude at the 75/min reference state; neither is a measured
universal reserve or a vasopressor dose–response calibration.

The response is asymmetric — withdrawal is limited to one quarter of full
positive outflow when pressure is above the set point — because resting
sympathetic tone is low and there is far more room to increase outflow than to
withdraw it. Without that, a patient a few mmHg above the set point acquires an
implausible bradycardia.

What it changes is not subtle. Setting the sensitivity to zero recovers the
model as it was before, and the comparison is the lesson:

| Septic shock preset | Reflex off | Reflex on |
|---|---|---|
| Mean arterial pressure | 63 mmHg | 82 mmHg |
| Heart rate | 105 | 122 |
| Cardiac output | 3.9 L/min | 4.4 L/min |
| Local preload reserve | 14.8%/mmHg | 13.9%/mmHg |
| Cardiac output after 500 mL | +57% | +40% |

With the reflex on, the pressure looks nearly acceptable while the patient is
still on the steep part of the cardiac-function curve, and the fluid still
works. That is compensated shock, and a simulator without a reflex cannot show
it — every patient simply becomes hypotensive in proportion to the insult.

### Body position

Proning is not a single effect, and the model does not assert one. It applies
three mechanical changes and lets the haemodynamics fall out of their balance:

| Change | Value | Why |
|---|---|---|
| Chest wall compliance | × 0.65 | The anterior chest wall rests against the bed and cannot expand |
| Abdominal pressure | + 2 cmH₂O | The abdomen is compressed unless deliberately suspended |
| Resting lung volume | + 0.25 × (2.2 L − FRC) | Dorsal regions recruit, in proportion to how much is collapsed |

The third term is why proning a normal lung is not a recruitment manoeuvre: with
nothing collapsed, the gain is zero. The consequence is that the same
intervention helps one patient and costs another, which is what the published
haemodynamic findings look like:

| | Lung volume | PVR | RV:LV | Cardiac output |
|---|---|---|---|---|
| ARDS preset, supine → prone | 1.20 → 1.25 L | 4.09 → 3.89 WU | 1.65 → 1.61 | 3.91 → 3.88 L/min |
| Healthy preset, supine → prone | 2.74 → 2.62 L | 1.18 → 1.18 WU | 0.90 → 0.85 | 5.03 → 4.88 L/min |

The recruitable lung gains; the normal one pays the stiffer chest wall and
receives nothing back. The controls keep showing the supine mechanics
throughout — turning someone over does not change how stiff their lung is — and
`src/model/position.js` resolves the effective values the integrator uses.

### Two different pulmonary resistances

`pvrBase` is the fully open reference from which the parallel open/derecruited
bed coefficient is computed. That resulting coefficient is **not** necessarily
the number a catheter gives you, and the app shows both:

- **Pulmonary resistance coefficient** — the model's own J-curve value.
- **PVR, derived** — (mPAP − wedge) / CO, computed the way a clinician would.

They are close at baseline (about 1.18 against 1.29 Wood units) and diverge when
the alveolar waterfall contributes a pressure load that the catheter formula
folds into its single resistance. Reporting the coefficient alone under the name
PVR, as an earlier version did, invites reading a model constant as a
measurement.

### What each readout is, and whether it can be read

Every readout is marked as a **measurement** the model makes, a **derived index**
computed from those, or an **internal coefficient**. Indices additionally carry
their validity conditions and are withheld when those are not met:

| Readout | Withheld when | Qualified when |
|---|---|---|
| Pulse pressure variation, SVV | spontaneous effort | VT below 8 mL/kg, fewer than 3.6 beats per breath, RV dilated, raised abdominal pressure |
| Plateau and driving pressure | spontaneous effort | — |
| PVR, derived | no forward flow | — |
| Wedge | — | zone 3 fraction below 95% |

Pulmonary hypertension follows ESC/ERS 2022: mean pulmonary artery pressure
above 20 mmHg, classified pre-capillary when PVR exceeds 2 Wood units with a
wedge of 15 mmHg or less, post-capillary above that.

When the model is driven outside the range where its equations hold — a
compartment being drained faster than it can supply — every clinical readout is
suspended and the reason stated, rather than continuing to print numbers.

---

## 11. Scenarios

`src/model/scenarios.js`. A scenario is a **partial override of the defaults**,
applied to the defaults and not to whatever the previous scenario left behind —
so a preset describes the same patient regardless of which one you opened first.
Touching any control switches the picker to *Custom*, so a scenario name is
never attached to a patient it no longer describes.

Twenty of the twenty-six parameters are used by at least one scenario. The six
never varied are `pinsp`, `csv`, `rvr`, `pericardium`, `septal` and `piston` —
those are left for the user to explore by hand, which is what the pericardial
and septal gains in particular are for.

Presets are settled phenotypes, not simulations of disease onset. In particular,
the pulmonary-embolism preset's selected tachycardia, systemic resistance and
filling state already encode a compensated clinical presentation. Its baroreflex
can subsequently react only to systemic MAP; it does not sense PVR, mPAP, right-
heart distension or hypoxaemia directly.

### The variables each scenario sets

| Scenario (`id`) | Overrides |
|---|---|
| Healthy, breathing spontaneously (`healthy-spont`) | `mode=spont`, `pmus=8`, `peep=0`, `rr=14` |
| Healthy, passive volume control (`healthy-vcv`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=5`, `rr=14` |
| PEEP escalation (`peep-escalation`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=14`, `rr=14` |
| Septic shock, fluid responsive (`septic-responder`) | `mode=vcv`, `pmus=0`, `vt=560`, `peep=8`, `rr=18`, `ccw=150`, `stressedVolume=330`, `svr=0.85`, `hr=105` |
| Big pleural swings, no variation (`swing-no-variation`) | `mode=spont`, `pmus=22`, `peep=6`, `rr=24`, `ccw=100`, `stressedVolume=950`, `svr=0.75`, `hr=100` |
| ARDS with right ventricular failure (`ards-rv`) | `mode=vcv`, `pmus=0`, `vt=350`, `peep=12`, `rr=24`, `collapsed=0.42`, `clung=40`, `eesRv=0.28`, `pvrBase=0.17`, `hpv=1.6`, `riRatio=0.7`, `pOpen=18` |
| Acute pulmonary embolism (`pulmonary-embolism`) | `mode=spont`, `pmus=6`, `peep=0`, `rr=24`, `pvrBase=0.44`, `eesRv=0.32`, `stressedVolume=1050`, `svr=1.25`, `hr=118` |
| Cardiogenic pulmonary oedema (`lv-failure`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=10`, `rr=18`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=95` |
| Weaning the failing left ventricle (`weaning`) | `mode=spont`, `pmus=10`, `peep=0`, `rr=26`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=110` |
| Stiff chest wall (`obesity`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=8`, `rr=16`, `ccw=75`, `pab0=12` |
| COPD with dynamic hyperinflation (`copd`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=5`, `rr=26`, `ti=0.9`, `raw=24`, `clung=300`, `efl=on` |
| Intra-abdominal hypertension (`iah`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=8`, `rr=16`, `pab0=22`, `abdCoupling=6` |

### What each one settles at

Steady state after 30 s of simulated time. Pressures in mmHg, flow in L/min; the
PVR column is the model resistance coefficient in Wood units. The
catheter-derived value is separately labelled in the app.

| Scenario | CO | MAP | CVP | PA | Wedge | PVR | RV:LV | PPV |
|---|---|---|---|---|---|---|---|---|
| Healthy, breathing spontaneously | 5.29 | 95 | −1.0 | 21/9 | 9 | 1.2 | 0.93 | 6% |
| Healthy, passive volume control | 4.91 | 93 | 1.4 | 21/12 | 10 | 1.2 | 0.88 | 2% |
| PEEP escalation | 4.54 | 90 | 3.8 | 22/13 | 10 | 1.3 | 0.87 | 1% |
| Septic shock, fluid responsive | 4.36 | 81 | 1.8 | 16/9 | 4 | 1.2 | 0.72 | 1% |
| Big pleural swings, no variation | 6.77 | 92 | 1.1 | 24/15 | 9 | 1.2 | 0.88 | 5% |
| ARDS with right ventricular failure | 3.98 | 85 | 3.6 | 27/19 | 4 | 4.3 | 1.64 | 1% |
| Acute pulmonary embolism | 4.06 | 94 | 5.8 | 39/32 | 4 | 7.5 | 2.03 | 9% |
| Cardiogenic pulmonary oedema | 3.52 | 87 | 5.0 | 44/38 | 35 | 1.2 | 0.86 | 6% |
| Weaning the failing left ventricle | 3.55 | 87 | 1.2 | 40/31 | 33 | 1.2 | 0.91 | 17% |
| Stiff chest wall | 4.37 | 90 | 3.3 | 18/10 | 9 | 1.2 | 0.82 | 4% |
| COPD with dynamic hyperinflation | 4.54 | 91 | 4.5 | 20/12 | 10 | 1.3 | 0.84 | 4% |
| Intra-abdominal hypertension | 3.55 | 87 | 0.8 | 13/7 | 5 | 1.2 | 0.74 | 1% |

### How the presets are built

Each one is designed around a single question, and the parameters chosen are the
smallest set that makes that question answerable.

- **The two healthy presets** differ only in the sign of the pressure. Same
  lungs, same heart; the only change is `mode`, and central venous pressure goes
  from −1.0 to +1.5 while cardiac output falls.
- **Septic shock** is low `stressedVolume` and low `svr`, with a large enough
  `vt` and a reduced `ccw` for the pleural swing to reach the circulation. A
  fluid increment raises output because the patient lies on the steep Guyton
  limb; PPV remains a descriptive waveform output, not the verdict.
- **Big pleural swings, no variation** is the same patient resuscitated, with a
  very large `pmus` against a stiff `ccw`. The pleural swing exceeds 20 cmH₂O
  and pulse pressure variation stays near 6%, because a swing is necessary for
  variation but the flat part of the Starling curve decides whether any of it
  reaches the stroke volume.
- **ARDS** is a small, stiff, collapsed lung (`collapsed`, `clung`) with a weak right
  ventricle, a raised `pvrBase`, and — as shipped — a high-recruiter phenotype
  (`riRatio=0.7`). Across a PEEP titration from 0 to 20 the resistance
  coefficient falls 4.57 → 3.66 Wood units, but derived PVR rises 4.67 → 5.28 WU
  and cardiac output falls 4.10 → 3.82 L/min: the preload and
  waterfall costs outrun the coefficient benefit.

  Set `riRatio=0` — the same collapsed lung, now consolidated rather than
  closed — and the titration separates further. The coefficient rises 4.57 →
  4.62 WU, derived PVR rises 4.92 → 7.08 WU, and output falls 4.03 → 3.60.
  Nothing else about the patient changed. That is the comparison this preset
  exists for, and it is the one a single-compartment lung could not show.

  A PEEP that buys output does exist, but only in a lung that is both highly
  recruitable and well filled: at `riRatio=0.8`, `pOpen=16` and
  `stressedVolume=1400`, derived PVR stays around 4.1–4.5 WU and output holds a
  broad plateau from PEEP 4–16 before declining. The plateau is shallow — the
  differences along it are comparable to the respiratory swing, so it should be
  read as "PEEP stops costing anything here", not as a peak to titrate to. The
  optimal PEEP for a failing right ventricle is a property of neither the lung
  nor the filling alone.
- **Pulmonary embolism** is the deliberate mirror: `clung`, `ccw` and `collapsed` are
  all left at normal, and the entire abnormality is `pvrBase` with a right
  ventricle that cannot meet it. Because the lung is compliant, pleural
  transmission is full — so switching this preset to `vcv` at PEEP 5 costs 11%
  of cardiac output, and PEEP 12 costs 39%.
- **The two left-heart presets** share their cardiac parameters and differ only
  in ventilation, which isolates what weaning does to a failing ventricle.
- **Stiff chest wall**, **COPD** and **intra-abdominal hypertension** leave the
  heart entirely at default, so the haemodynamic change can only have come from
  mechanics. COPD deliberately separates three existing ideas: high `clung`
  raises the static resting volume, high `raw` slows ordinary emptying, and EFL
  caps maximal expiratory flow. Short available expiratory time then determines
  how much additional gas is dynamically trapped. Slowing the rate unloads the
  circulation without changing the heart; low external PEEP is absorbed below
  the choke, while higher PEEP adds volume, CVP and output cost.

---

## 12. Fixed constants

Not user-facing, but part of the model. In `src/model/circulation.js` and
`src/model/respiratory.js`.

### Compartments

| Constant | Value | Meaning |
|---|---|---|
| `vuSa`, `cSa` | 700 mL, 1.35 mL/mmHg | systemic arterial unstressed volume and compliance |
| `vuSv` | 2800 mL | systemic venous unstressed volume at neutral tone |
| `vuPa`, `cPa` | 50 mL, 4.2 mL/mmHg | pulmonary arterial; resting stressed volume unchanged |
| `PULMONARY_TRANSIT` | 160 mL, 2.0 s, 8 stages | pressureless pathway with a fixed mean flow-transport time |
| `vuPv`, `cPv` | 60 mL, 8.5 mL/mmHg | pulmonary venous; resting stressed volume unchanged |
| `rPulVen` | 0.008 mmHg·s/mL | pulmonary venous resistance |
| Valve resistances | 0.004 – 0.006 mmHg·s/mL | tricuspid, pulmonic, mitral, aortic |

### Chambers

| Chamber | `V0s` | `V0d` | `A` | `B` | `E_min` → `E_max` |
|---|---|---|---|---|---|
| Left ventricle | 15 mL | 10 mL | 0.45 | `lvStiff` | — |
| Right ventricle | 10 mL | 10 mL | 0.32 | 0.021 | — |
| Right atrium | — | 8 mL | — | — | 0.072 → 0.20 mmHg/mL |
| Left atrium | — | 10 mL | — | — | 0.135 → 0.30 mmHg/mL |

### Coupling

| Constant | Value | Meaning |
|---|---|---|
| `PERI.v0`, `scale`, `k` | 430 mL, 62 mL, 0.55 | pericardial pressure–volume relation |
| `ABD_VENOUS_FRACTION` | 0.6 | splanchnic share of the venous reservoir |
| `SEPTAL.rvToLv` / `lvToRv` | 0.085 / 0.014 mmHg/mL | diastolic septal gains |
| `SEPTAL.rvRef` / `lvRef` | 145 / 135 mL | volumes above which the septum shifts |
| `SEPTAL.systolic` | 0.042 | systolic interdependence gain |
| `PPL_FRC` | −5 cmH₂O | pleural pressure at the relaxation volume |
| `EXPIRATORY_FLOW_LIMIT.minimumTimeConstant` | 4.5 s | severe-obstruction maximal-flow envelope when EFL is on; a didactic anchor, not a universal COPD constant |
| `NORMAL_FRC` | 2.2 L | resting volume of a fully open lung; collapse is measured against it |
| `PL_EASY`, `SPREAD_EASY` | 0, 1.3 cmH₂O | opening threshold and spread for normal units |
| `SPREAD_HARD` | 7 cmH₂O | spread of opening pressures for diseased units |
| `HPV_GAIN` | 1.1 | resistance added per unit of closed lung |
| `UNSTRESSED_VOLUME` | 1.247 L | gas a fully open lung holds at zero transpulmonary pressure |
| `RECOIL_AT_FRC` | 5 cmH₂O | recoil balancing the chest wall; defines the resting volume |
| `TOTAL_LUNG_CAPACITY` | 6.0 L | reached at `TLC_PRESSURE`; with the resting volume, pins the tissue curve |
| `TLC_PRESSURE` | 35 cmH₂O | transpulmonary pressure at total lung capacity |
| `PRELOAD_STEEP` | 0.10 /mmHg | reserve above which filling buys output; calibrated against the model's own response to 500 mL, not published |
| `K_STRETCH` | 0.58 | exponential high-volume alveolar limb |
| `K_UNFURL` | ≈0.829, derived | decay of the extra-alveolar unfurling term; chosen to balance slopes at FRC |
| `EXTRA_FLOOR` | 0.30 | residual extra-alveolar contribution after unfurling |
| `F_ALV`, `F_EXTRA` | 0.5, 0.5 | didactic crossover of the two series components at FRC, not an anatomical partition |
| `LOW_VOLUME_TRACTION_GAIN` | 4 | quadratic loss of radial traction below FRC; zero in value and slope at FRC |

---

## 13. Project layout

```
index.html
styles/app.css
tools/serve.mjs           static server that refuses to be cached, for editing
docs/PHYSIOLOGY.md        calibration, verification against the sources, limitations
docs/LITERATURE_RANGES.md published findings as executable rows, and where the model fails them
docs/MODEL_DECISIONS.md   dated rationale for substantive modelling changes
docs/POSTMORTEM-2026-08-09.md  the errors made while anchoring the J-curve, and how they were caught
docs/HANDOVER-2026-08-11.md    current project state and the ordered roadmap for the next session
src/
  main.js                 transport, scenario wiring, animation loop
  model/
    index.js              selective public API consumed by main and the UI
    units.js              cmH2O / mmHg conversion — the only place it happens
    parameters.js         every user-facing knob; the panel builds itself from this
    scenarios.js          presets, each with the question it is meant to answer
    respiratory.js        equation of motion, Campbell mechanics, holds
    lung.js               two populations of units, recruitment, the PVR J-curve
    circulation.js        the closed loop, ventricular elastance, derived curves
    simulator.js          integration, trace ring buffers, derived measurements
  ui/
    theme.js              one palette, consumed by both CSS and canvas
    plot.js               cartesian canvas primitives
    controls.js           parameter panel
    stats.js              monitor readouts
    panels/               the six visualisations
```

---

## 14. Tests

```bash
node tests/run.mjs
```

200 checks, no framework and no dependencies:

- **Volume conservation** across every scenario, to 0.01 mL.
- **Compartment positivity** across every scenario and across a deterministic
  250-configuration sweep of the whole control space, with a fixed generator so
  a failure is reproducible.
- **Convergence** under time-step refinement, measured on continuous quantities.
  Cardiac output is deliberately not used: it is latched at a beat boundary, so
  which sample lands on the boundary shifts with the step.
- **Determinism** — identical parameters give identical results.
- **Physiological relations**, by direction rather than by value: PEEP
  raises CVP and lowers output, spontaneous breathing lowers measured CVP while
  raising transmural pressure and output, a fluid increment raises output more
  when underfilled, a short expiratory time traps gas, a stiff chest wall raises
  the pleural swing, RV failure dilates the RV, and removing septal coupling lets
  the LV fill. PPV is deliberately not required to separate filling states.
- **The J-curve's nadir found by search**, not asserted — the test would fail if
  the curve were monotonic.
- **Integrator/drawing agreement** — the simulated state lies on the drawn
  venous return curve, and the curve and the equation return the same flow.
- **Scenario snapshots**, regenerated deliberately with
  `node tests/generate-snapshots.mjs` so a change in behaviour has to be
  acknowledged rather than discovered.
- **Documentation** — the scenario table in this file is checked against a fresh
  run of the model.
- **Public API boundary** — browser modules can consume the model only through
  `src/model/index.js`, whose selective export surface is itself checked.

---

## 15. Scripting it

The page exposes a handle for driving the model from the console or an embedding
page:

```js
heartLung.sim.setParam('peep', 15);
heartLung.step(20);        // advance 20 s of model time and repaint
heartLung.sim.metrics;     // every derived measurement
heartLung.sim.applyScenario(scenario);
```

The model alone runs about 300× faster than real time: 0.05 ms to simulate the
16.7 ms of patient that one 60 fps frame represents. Repainting all six panels
costs a further 1.0 ms, so a live frame uses about 6% of the 16.7 ms budget. A
titration swept in a loop, repainting once at the end, runs at the full 300×.

---

## 16. Accessibility and colour

The categorical palette was validated for colour-vision deficiency, and no
series is identified by hue alone: every trace and curve carries a direct label,
and every status readout carries a word as well as a colour. Strokes and text
use separate tokens — a colour that reads well as a 2 px line is often too light
as 10 px type — with the text tokens computed to clear the WCAG AA ratio of
4.5:1 against the surface they are drawn on, in both themes. Every canvas
carries a live one-sentence summary for assistive technology and an openable
table of its values. The space bar toggles the transport only when no control
has focus, so native keyboard behaviour is never intercepted. Respiratory and
haemodynamic pressures are kept on separate strips rather than sharing one plot
with two y-axes, because cmH₂O and mmHg are different scales and a dual axis
would invite reading one against the other. Light and dark themes are separately
specified rather than inverted; the theme button cycles auto → light → dark.

---

## 17. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.
The full list, with the measurements behind it, is in
[docs/PHYSIOLOGY.md](docs/PHYSIOLOGY.md). In short:

- **Simplified autonomic control.** One aggregate baroreflex modulates heart
  rate, systemic resistance, venous stressed-volume recruitment and
  contractility; there is no chemoreflex, vagal limb or separate efferent time
  course. Its bounded output and additive 42/min chronotropic reserve prevent
  super-physiological high-gain responses, but do not turn the aggregate 15 s
  state into a human transient model; its afferent signal is low-pass mean
  pressure rather than pulsatile arterial-wall stretch. The 200 mL-per-unit
  venous recruitment coefficient is didactic, not a calibrated norepinephrine
  dose–response relationship. It senses only filtered systemic MAP, not PVR,
  mPAP, right-heart distension or hypoxaemia. Some clinical presets therefore
  encode autonomic compensation in their selected baseline heart rate,
  resistance and filling state rather than generating it from the disease.
  Coronary circulation is absent, so raising systemic pressure does not directly
  improve right-ventricular coronary perfusion in the model.
- **No gas exchange.** No oxygen, CO₂, pH or shunt. Hypoxic vasoconstriction is
  a coefficient on derecruited lung, not a consequence of an alveolar oxygen
  tension.
- **One expiratory choke, not a regional COPD lung.** EFL imposes one binary,
  volume-dependent maximal-flow envelope with a fixed 4.5 s anchor. It can show
  downstream-pressure independence, dynamic trapping and their haemodynamic
  cost, but not heterogeneous time constants, secretions, bronchodilation,
  airway closure, inspiratory threshold work, triggering or dyssynchrony. Its
  low-versus-high external-PEEP comparison is not a titration rule.
- **No regional pulmonary circulation.** Open and derecruited vascular pathways
  are aggregate parallel conductances. Dependent regions, local West zones,
  gravitational gradients, hypercapnia and vascular remodelling are absent.
- **Pulmonary vascular load is aggregated.** The model separates its mechanical
  J-curve coefficient from catheter-derived PVR and includes one fractional
  alveolar waterfall, but does not separately resolve thrombotic obstruction,
  non-alveolar critical closing pressure, blood viscosity or haematocrit,
  pressure/flow-dependent vascular recruitment and distension, characteristic
  impedance or wave reflection. The pulmonary-embolism preset therefore raises
  an effective aggregate `pvrBase`; it does not identify which physical
  determinant produced that bedside load.
- **Pulse pressure variation is descriptive, not a fluid-responsiveness
  decision.** The model shows how respiratory mechanics alter PPV and SVV, but
  does not apply a 13% cutoff or calibrate variation against response to a model
  bolus. Low tidal volume, spontaneous effort and the other applicability limits
  remain visible. Above about 900 mL of stressed volume the zone III fraction
  reaches 96–100% and the lung starts squeezing blood forward into the left
  atrium with each breath, so variation rises again — 1.5% at 900 mL to 3.8% at
  1400 mL — in patients who gain nothing from a bolus. That is the classical
  direct-filling component, and it appears where it should. It is weak: the real
  thing reaches double figures. The other classical sources, irregular effort and
  arrhythmia, are genuinely absent.
- **No tidal-volume challenge.** The model's PPV amplitude and pulmonary transit
  are not quantitatively validated for a 3.5-point diagnostic threshold;
  presenting the manoeuvre would risk teaching a model-specific false result.
- **Simplified pulmonary transit.** Eight pressureless mixing stages with a
  fixed 2.0 s mean transport time delay flow but not pressure. They reproduce
  the 2–3-beat ordering of RV and LV changes and place the LV nadir in expiration
  without imposing a rigid echo. They are not regional capillary paths, do not
  adapt their mean time to cardiac output or disease, and are not equivalent to
  contrast transit time. At very high PVR the pulmonary artery diastolic pressure
  can still run higher than it should because the arterial vascular time
  constant exceeds the cardiac cycle.
- **Ejection fraction runs low** by roughly 5–10 points; stroke volume, cardiac
  output and loop shape are right, the ratio is pessimistic.
- **Forward Euler**, with flows limited so no compartment can be drained past a
  1 mL floor. A 250-configuration sweep of the control space finds no negative
  volume, no non-finite value and no ejection fraction outside 0–100%. Extreme
  combinations still reach states the equations do not describe; those suspend
  the readouts and say why.
- **Face validity rather than quantitative validation.** Internal consistency,
  conservation, convergence and the direction of established relationships are
  tested. There is no calibration source for each empirical constant, no
  sensitivity analysis, no comparison against experimental series and no
  identifiability analysis. The PEEP/MSFP anchor from Berger is a nine-pig
  experiment, not a human range, and the hold-derived intercept is explicitly
  uncalibrated. This is a mechanistic teaching model calibrated to reproduce
  qualitative relationships, not a patient-specific predictor.

---

## 18. Sources

1. Kenny JE. *An Approach to Mechanical Heart-Lung Interaction*, 1st ed.
   Toronto: Spectral Envelope, 2020. Chapters 1–4 supply the integration of the
   Campbell and Guyton diagrams that this simulator is organised around.
2. Mahmood SS, Pinsky MR. Heart-lung interactions during mechanical ventilation:
   the basics. *Ann Transl Med* 2018;6(18):349.
3. Yuriditsky E, Mireles-Cabodevila E, Alviar CL. How I Teach: Heart–Lung
   Interactions during Mechanical Ventilation. Positive Pressure and the Right
   Ventricle. *ATS Scholar* 2025;6(1):94–108.
4. Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various
   right atrial pressures and the normal venous return curve. *Am J Physiol*
   1957;189:609–15.
5. Permutt S, Riley RL. Hemodynamics of collapsible vessels with tone: the
   vascular waterfall. *J Appl Physiol* 1963;18:924–32.
6. Simmons DH, Linde LM, Miller JH, O'Reilly RJ. Relation between lung volume
   and pulmonary vascular resistance. *Circ Res* 1961;9:465–71.
7. Suga H, Sagawa K. Instantaneous pressure-volume relationships and their ratio
   in the excised, supported canine left ventricle. *Circ Res* 1974;35:117–26.
8. Fessler HE, Brower RG, Wise RA, Permutt S. Effects of positive end-expiratory
   pressure on the gradient for venous return. *Am Rev Respir Dis* 1991;143:19–24.
9. Jardin F, Genevray B, Brun-Ney D, Bourdarias JP. Influence of lung and chest
   wall compliances on transmission of airway pressure to the pleural space in
   critically ill patients. *Chest* 1985;88:653–8.
10. Teboul JL, Monnet X, Chemla D, Michard F. Arterial pulse pressure variation
    with mechanical ventilation. *Am J Respir Crit Care Med* 2019;199:22–31.
11. Cappio Borlino S, et al. The effect of positive end-expiratory pressure on
    pulmonary vascular resistance depends on lung recruitability in patients
    with ARDS. *Am J Respir Crit Care Med* 2024;210:900–907.
    doi:10.1164/rccm.202402-0383OC.
12. Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS: practical
    bedside implications. *Intensive Care Med* 2026.
    doi:10.1007/s00134-026-08583-3.
13. Thomas LJ Jr, Griffo ZJ, Roos A. Effect of negative pressure inflation of
    the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–456.
14. Hakim TS, Michel RP, Chang HK. Effect of lung inflation on pulmonary
    vascular resistance by arterial and venous occlusion. *J Appl Physiol*
    1982;53:1110–1115.
15. Young DB. Venous return. In: *Control of Cardiac Output*. Morgan & Claypool
    Life Sciences; 2010. NCBI Bookshelf NBK54476.
16. Adda I, Lai C, Teboul JL, et al. Norepinephrine potentiates the efficacy of
    volume expansion on mean systemic pressure in septic shock. *Crit Care*
    2021;25:302. doi:10.1186/s13054-021-03711-5.
17. Pinsky MR. The effects of mechanical ventilation on the cardiovascular
    system. *Crit Care Clin* 1990;6:663–678.
18. Fougères E, Teboul JL, Richard C, et al. Hemodynamic impact of a positive
    end-expiratory pressure setting in acute respiratory distress syndrome:
    importance of the volume status. *Crit Care Med* 2010;38:802–807.
19. Chen L, Del Sorbo L, Grieco DL, et al. Potential for lung recruitment
    estimated by the recruitment-to-inflation ratio in acute respiratory
    distress syndrome. *Am J Respir Crit Care Med* 2020;201:178–187.
    doi:10.1164/rccm.201902-0334OC.
20. Berger D, Moller PW, Weber A, et al. Effect of PEEP, blood volume, and
    inspiratory hold maneuvers on venous return. *Am J Physiol Heart Circ
    Physiol* 2016;311:H794–H806. doi:10.1152/ajpheart.00931.2015.
21. Maas JJ, Pinsky MR, Geerts BF, et al. Estimation of mean systemic filling
    pressure in postoperative cardiac surgery patients with three methods.
    *Intensive Care Med* 2012;38:1452–1460.
    doi:10.1007/s00134-012-2586-0.
22. Ranieri VM, Giuliani R, Cinnella G, et al. Physiologic effects of positive
    end-expiratory pressure in patients with chronic obstructive pulmonary
    disease during acute ventilatory failure and controlled mechanical
    ventilation. *Am Rev Respir Dis* 1993;147:5–13.
23. van den Berg B, Stam H, Bogaard JM. Effects of PEEP on respiratory
    mechanics in patients with COPD on mechanical ventilation. *Eur Respir J*
    1991;4:561–567.
24. Pepe PE, Marini JJ. Occult positive end-expiratory pressure in mechanically
    ventilated patients with airflow obstruction: the auto-PEEP effect.
    *Am Rev Respir Dis* 1982;126:166–170.
25. Tuxen DV, Lane S. The effects of ventilatory pattern on hyperinflation,
    airway pressures, and circulation in mechanical ventilation of patients
    with severe air-flow obstruction. *Am Rev Respir Dis* 1987;136:872–879.
