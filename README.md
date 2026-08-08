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
python3 -m http.server 8422
```

Then open <http://localhost:8422>. Any static server works.

While editing, note that browsers cache ES modules aggressively and a plain
reload can leave you looking at the previous version of a module. Hard-reload,
or serve with `Cache-Control: no-store`.

---

## 2. What makes it a model rather than an animation

Nothing in the display is scripted. The circulation is a closed loop of eight
compliant compartments with conserved volume, integrated at 0.25 ms. The single
design decision that produces every classical teaching point is that **each
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
time constant `τ = Raw · Crs`, volume does not return to the relaxation volume
and end-expiratory alveolar pressure exceeds the set PEEP. The COPD preset
generates 6.4 cmH₂O this way with no change to the set PEEP.

### Abdominal coupling

```
Pab = Pab₀ + abdCoupling · V
```

Diaphragmatic descent pressurises the abdomen in proportion to the volume moved.
This single term produces both of the effects described in §4.

---

## 4. The circulation

`src/model/circulation.js`. Eight compliant compartments, volume conserved,
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

Three things can be done *to* the patient rather than set on them. All of them
change what the ventilator delivers without moving the sliders, because a
manoeuvre is not a new setting.

### Occlusion holds

End-expiratory and end-inspiratory holds freeze the airway, so alveolar pressure
equilibrates with the airway and the circulation settles at a fixed lung volume.
Each hold contributes one measured point to the Guyton diagram; several at
different airway pressures draw a venous return curve the way the bedside draws
one.

### The tidal volume challenge

```
window 1   thirty seconds at the patient's own tidal volume
window 2   thirty seconds at 8 mL/kg
ΔPPV       mean variation in window 2 − mean in window 1
```

Variation needs a breath big enough to load and unload the heart, and protective
ventilation does not provide one — which is why the model withholds the index
below 8 mL/kg. Myatra et al. (*Crit Care Med* 2017;45:415–21) turned that into a
manoeuvre: raise the volume, read the *change*, put the ventilator back. A rise
above 3.5 percentage points identifies a preload-dependent patient, the reasoning
being that a slope is still readable from a small perturbation even where the
absolute value is not.

Both windows are averaged over their settled portion. That is not fussiness:
variation is computed from the beats in one respiratory cycle, so at four or five
beats per breath a single reading moves by more than a point depending on which
beats land where in the cycle. Comparing an instantaneous baseline against an
averaged result puts that noise straight into the delta.

**Where it holds and where it does not.** The ordering is right — ΔPPV falls
3.4 → 0.1 points as stressed volume goes 300 → 1100 mL, in the same order as
those patients' actual response to a bolus. The threshold is crossed in the
septic responder preset (4.5 points), which is the patient the trial studied.
A patient merely dry at a resting heart rate sits at 3.4–3.6, straddling the
line; at a heart rate of 130 the same manoeuvre gives 5.2. The threshold is left
at the published value rather than lowered to what the model reaches, because a
model that cannot fall short of a number cannot be shown to be wrong about it.

The manoeuvre refuses rather than misreports. A spontaneously breathing patient
has no set tidal volume to raise, and one already at 8 mL/kg has nothing to raise
it from; in both cases the button declines and says why.

## 6. The pulmonary circulation

### The lung as two populations of units

The lung is not one compartment. Its units are split by how hard they are to
open: normal ones, which close as the lung empties and reopen at almost any
distending pressure, and diseased ones, which are shut at rest and reopen only if
they can be reopened at all. Consolidated lung is collapsed and stays collapsed
however hard it is pushed.

```
open(Pl)  = (1 - collapsed)*sigma((Pl - 0)/1.3) + collapsed*recruitable*sigma((Pl - pOpen)/7)
perUnit   = max(0, V0 + C_lung*Pl)          V0 = 1.247 L, fixed
V(Pl)     = open(Pl) * perUnit(Pl)          the pressure-volume curve
V_rest    = V(5)                            recoil balancing the chest wall
strain    = V / (2.2 L * open) - 1          volume per *open* unit
```

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
without being told to: the COPD preset is `clung=300` and nothing else, and it
sits at 2.69 L before a breath is delivered.

There is no closed form for the inverse once the open fraction is in it, so
transpulmonary pressure is found numerically. In the integrator the solve is
warm-started from the previous step - the lung moves about a tenth of a
millilitre per step - and agrees with a fresh bisection to 2 parts in 10^9.

**What is still missing: hysteresis.** Units here open and close at the same
pressure, so inflation and deflation follow one curve. Real lungs do not, which
is why a recruitment manoeuvre followed by a decremental PEEP trial finds a lower
optimum than an incremental one. That needs the opening and closing thresholds to
differ, and it is the next honest thing to add.

### The J-curve

```
traction        = Pl / 5 - 1
relief          = 0.35 + 0.65 * exp(-1.713 * traction)
R_alveolar      = 0.6 * PVR0 * exp(1.6*strain) / open * hypoxic
R_extraalveolar = 0.4 * PVR0 * relief          / open * hypoxic
hypoxic         = 1 + hpv * 1.1 * (1 - open)
PVR             = R_alveolar + R_extraalveolar
```

**The two limbs are driven by two different quantities**, and conflating them was
an error that stayed hidden while the mechanics were linear. Alveolar vessels are
squeezed by the units around them, so their resistance follows how distended
those units are - the strain. Extra-alveolar vessels are held open by radial
traction, and traction is a *stress*, not a volume: it follows transpulmonary
pressure. In stiff or oedematous tissue the same pressure holds those vessels
open just as well while the lung holds much less gas, so a strain-driven
extra-alveolar limb calls such a lung derecruited when it is merely stiff - and
then claims PEEP relieves that, in a lung with nothing to recruit.

While compliance was a constant the two quantities were proportional and the
mistake had no consequences. Making recruitment change the mechanics broke that
proportionality and surfaced it, in a test that had been passing for the wrong
reason.

**Traction saturates.** It pulls extra-alveolar vessels open to their full
calibre and then has nothing left to do, so beyond that only alveolar compression
remains. Without the floor the extra-alveolar limb falls by 86% between
transpulmonary pressures of 8 and 18 and swamps everything else - which is what a
lung reaching those pressures does, so the omission only appeared once one did.
The floor of 0.35 is a judgement; the exponent is not, being fixed by requiring
the two limbs' derivatives to cancel at a normal lung's resting point. The nadir
lands at 2.32 L.

Two separate things push the left limb up, and separating them is what the two
populations buy. Vessels in units that remain open are narrowed by low strain.
Units that are *shut* remove their vessels from the circuit entirely, which is
the `1/open` term, and hypoxic vasoconstriction makes what perfusion still
reaches them expensive. In a badly collapsed lung the second effect dominates the
first, which is why derecruitment costs so much more than deflation.

**Why this replaced a single compartment.** With one compartment, a recruiter and
a non-recruiter were the same lung at different resting volumes, so raising PEEP
gave them identical volume gain and identical transpulmonary pressure and there
was nothing left to tell them apart. Recruitability was being inferred from
resting volume rather than represented. It is now the `recruitable` parameter,
and the response to PEEP 4 → 14 runs from +15% to −21% across its range. The same
change fixed an error in the other direction: distension used to be referenced to
the patient's own resting volume, so a chronically hyperinflated lung had zero
strain by definition and hyperinflation was free. Note that this resistance is
instantaneous and follows lung volume, so in a patient with a large tidal
excursion it swings within the breath — 3.16 to 4.49 Wood units in the COPD
preset. Quote the cycle mean, not a sample.

**What it deliberately does not do.** Recruited units add compliance in a real
lung; here the pressure–volume relationship is still linear. Recruitment is a
vascular and gas-exchange event in this model, not a mechanical one. That is why
proning changes the opening pressure rather than the resting volume, and why
end-expiratory lung volume does not rise when units open.

### Vascular waterfall and West zones

```
Q_pul = max(0, (Ppa − max(Ppv, Palv)) / PVR)
```

Where alveolar pressure exceeds pulmonary venous pressure, alveolar pressure —
not left atrial pressure — is the downstream pressure for flow (Permutt). West
zone 1 stops flow entirely.

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
airway pressures — vary the tidal volume, or the PEEP — draw a venous return
curve the way Maas and Berger do at the bedside, with mean systemic filling
pressure as the extrapolated x-intercept.

The measured line does not lie on the analytic curve, and that is the point of
having both. Four holds from 8 to 14 cmH₂O of plateau give a slope of
0.27 L/min per mmHg against the model's own 0.73, and extrapolate to a mean
systemic filling pressure of 20 mmHg against an actual 8.8. The reason is in the
model and is real: every occlusion raises lung volume, which raises abdominal
pressure, which raises mean systemic filling pressure — so each hold shifts the
curve it is trying to sample, and the sampled line is flatter than the true one.
The bedside method has exactly this confound.

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
| `collapsed` | Fraction of the lung shut at rest | — | 0 | 0 – 0.8 |
| `pab0` | Baseline abdominal pressure | cmH₂O | 4 | 0 – 30 |
| `abdCoupling` | Diaphragm–abdomen coupling | cmH₂O/L | 4 | 0 – 12 |

### Volume and vascular tone

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `stressedVolume` | Stressed volume | mL | 700 | 200 – 1800 |
| `csv` | Venous compliance | mL/mmHg | 100 | 30 – 200 |
| `rvr` | Resistance to venous return | mmHg·s/mL | 0.072 | 0.02 – 0.30 |
| `svr` | Systemic vascular resistance | mmHg·s/mL | 1.05 | 0.25 – 3.0 |

Changing `stressedVolume` moves blood into or out of the venous reservoir — a
fluid bolus or a diuresis — rather than silently rescaling the model.

### Cardiac function

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `hr` | Heart rate, before reflex modulation | /min | 75 | 40 – 170 |
| `baroreflex` | Baroreflex gain | × | 1.0 | 0 – 2 |
| `baroSetPoint` | Pressure the reflex defends | mmHg | 90 | 55 – 110 |
| `eesLv` | LV end-systolic elastance | mmHg/mL | 3.0 | 0.3 – 6.0 |
| `eesRv` | RV end-systolic elastance | mmHg/mL | 0.58 | 0.08 – 1.6 |
| `lvStiff` | LV diastolic stiffness (the `B` of the LV EDPVR) | 1/mL | 0.028 | 0.010 – 0.080 |
| `pericardium` | Pericardial constraint gain | × | 1.0 | 0 – 4 |
| `septal` | Diastolic septal coupling gain | × | 1.0 | 0 – 4 |

### Pulmonary circulation

| Symbol | Meaning | Unit | Default | Range |
|---|---|---|---|---|
| `pvrBase` | Resistance coefficient at the J-curve nadir | mmHg·s/mL | 0.07 | 0.03 – 0.60 |
| `hpv` | Hypoxic vasoconstriction gain | × | 1.0 | 0 – 3 |
| `recruitable` | Fraction of the collapsed lung that can be reopened | × | 0.4 | 0 – 1 |
| `pOpen` | Transpulmonary pressure at which half the recruitable lung is open | cmH₂O | 20 | 5 – 40 |
| `piston` | Pulmonary capacitance coupling | mL/L | 85 | 0 – 200 |

To convert a resistance to clinical units: Wood units = mmHg·s/mL × 1000/60;
dyn·s·cm⁻⁵ = mmHg·s/mL × 80000/60.

### The baroreflex

One sympathetic outflow with a 15 s time constant, driven by the error between
mean arterial pressure and a set point, acting on heart rate, systemic
resistance, venous compliance and contractility together. Real arcs have
different latencies; this is the level at which the teaching points live.

The response is asymmetric — a quarter gain when pressure is above the set point
— because resting sympathetic tone is low and there is far more room to increase
outflow than to withdraw it. Without that, a patient a few mmHg above the set
point acquires an implausible bradycardia.

What it changes is not subtle. Setting the gain to zero recovers the model as it
was before, and the comparison is the lesson:

| Septic shock preset | Reflex off | Reflex on |
|---|---|---|
| Mean arterial pressure | 58 mmHg | 80 mmHg |
| Heart rate | 105 | 131 |
| Cardiac output | 3.6 L/min | 4.2 L/min |
| Pulse pressure variation | 17% | 17% |
| Cardiac output after 500 mL | +71% | +46% |

With the reflex on, the pressure looks nearly acceptable while the patient is
just as volume-depleted. The rate says otherwise, the pulse pressure variation
says otherwise, and the fluid still works. That is compensated shock, and a
simulator without a reflex cannot show it — every patient simply becomes
hypotensive in proportion to the insult.

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
| ARDS preset, supine → prone | 1.70 → 1.89 L | 5.5 → 4.5 WU | 2.26 → 2.03 | 2.68 → 2.90 L/min |
| Healthy preset, supine → prone | 2.77 → 2.64 L | 1.31 → 1.25 WU | 0.88 → 0.85 | 5.04 → 4.92 L/min |

The recruitable lung gains; the normal one pays the stiffer chest wall and
receives nothing back. The controls keep showing the supine mechanics
throughout — turning someone over does not change how stiff their lung is — and
`src/model/position.js` resolves the effective values the integrator uses.

### Two different pulmonary resistances

`pvrBase` sets the coefficient the integrator divides by. That is **not** the
number a catheter gives you, and the app shows both:

- **Pulmonary resistance coefficient** — the model's own J-curve value.
- **PVR, derived** — (mPAP − wedge) / CO, computed the way a clinician would.

They agree at baseline (1.44 against 1.46 Wood units) and diverge by up to 46%
in scenarios where the alveolar waterfall and zone conditions carry part of the
load that the catheter formula folds into a single resistance. Reporting the
coefficient alone under the name PVR, as an earlier version did, invites reading
a model constant as a measurement.

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

### The variables each scenario sets

| Scenario (`id`) | Overrides |
|---|---|
| Healthy, breathing spontaneously (`healthy-spont`) | `mode=spont`, `pmus=8`, `peep=0`, `rr=14` |
| Healthy, passive volume control (`healthy-vcv`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=5`, `rr=14` |
| PEEP escalation (`peep-escalation`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=14`, `rr=14` |
| Septic shock, fluid responsive (`septic-responder`) | `mode=vcv`, `pmus=0`, `vt=560`, `peep=8`, `rr=18`, `ccw=150`, `stressedVolume=330`, `svr=0.85`, `hr=105` |
| Big pleural swings, no variation (`swing-no-variation`) | `mode=spont`, `pmus=22`, `peep=6`, `rr=24`, `ccw=100`, `stressedVolume=950`, `svr=0.75`, `hr=100` |
| ARDS with right ventricular failure (`ards-rv`) | `mode=vcv`, `pmus=0`, `vt=350`, `peep=12`, `rr=24`, `collapsed=0.42`, `clung=40`, `eesRv=0.28`, `pvrBase=0.17`, `hpv=1.6`, `recruitable=0.55`, `pOpen=20` |
| Acute pulmonary embolism (`pulmonary-embolism`) | `mode=spont`, `pmus=6`, `peep=0`, `rr=24`, `pvrBase=0.44`, `eesRv=0.32`, `stressedVolume=1050`, `svr=1.25`, `hr=118` |
| Cardiogenic pulmonary oedema (`lv-failure`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=10`, `rr=18`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=95` |
| Weaning the failing left ventricle (`weaning`) | `mode=spont`, `pmus=10`, `peep=0`, `rr=26`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=110` |
| Stiff chest wall (`obesity`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=8`, `rr=16`, `ccw=75`, `pab0=12` |
| COPD with dynamic hyperinflation (`copd`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=5`, `rr=26`, `ti=0.9`, `raw=24`, `clung=300` |
| Intra-abdominal hypertension (`iah`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=8`, `rr=16`, `pab0=22`, `abdCoupling=6` |

### What each one settles at

Steady state after 30 s of simulated time. Pressures in mmHg, flow in L/min, PVR
in Wood units.

| Scenario | CO | MAP | CVP | PA | Wedge | PVR | RV:LV | PPV |
|---|---|---|---|---|---|---|---|---|
| Healthy, breathing spontaneously | 5.39 | 96 | −0.8 | 23/10 | 9 | 1.2 | 0.92 | 8% |
| Healthy, passive volume control | 4.91 | 93 | 1.6 | 22/13 | 10 | 1.3 | 0.89 | 2% |
| PEEP escalation | 4.34 | 89 | 4.4 | 27/18 | 9 | 2.1 | 0.93 | 6% |
| Septic shock, fluid responsive | 4.21 | 80 | 2.0 | 19/13 | 4 | 1.5 | 0.79 | 18% |
| Big pleural swings, no variation | 6.76 | 94 | 1.9 | 27/17 | 10 | 1.2 | 0.94 | 4% |
| ARDS with right ventricular failure | 3.60 | 83 | 4.0 | 34/28 | 3 | 5.5 | 2.03 | 8% |
| Acute pulmonary embolism | 3.96 | 92 | 5.8 | 39/33 | 4 | 7.3 | 2.02 | 8% |
| Cardiogenic pulmonary oedema | 3.47 | 86 | 5.0 | 44/38 | 34 | 1.8 | 0.88 | 6% |
| Weaning the failing left ventricle | 3.61 | 87 | 0.6 | 40/31 | 32 | 1.3 | 0.89 | 20% |
| Stiff chest wall | 4.26 | 90 | 3.5 | 18/10 | 9 | 1.3 | 0.82 | 4% |
| COPD with dynamic hyperinflation | 4.15 | 88 | 4.9 | 23/13 | 10 | 1.7 | 0.89 | 6% |
| Intra-abdominal hypertension | 3.40 | 86 | 1.1 | 15/8 | 4 | 1.4 | 0.79 | 8% |

### How the presets are built

Each one is designed around a single question, and the parameters chosen are the
smallest set that makes that question answerable.

- **The two healthy presets** differ only in the sign of the pressure. Same
  lungs, same heart; the only change is `mode`, and central venous pressure goes
  from −1.0 to +1.5 while cardiac output falls.
- **Septic shock** is low `stressedVolume` and low `svr`, with a large enough
  `vt` and a reduced `ccw` for the pleural swing to reach the circulation.
  Raising `stressedVolume` by 500 mL lifts cardiac output from 3.7 to
  6.2 L/min — 68% — and collapses the variation. The true positive.
- **Big pleural swings, no variation** is the same patient resuscitated, with a
  very large `pmus` against a stiff `ccw`. The pleural swing exceeds 20 cmH₂O
  and pulse pressure variation stays near 6%, because a swing is necessary for
  variation but the flat part of the Starling curve decides whether any of it
  reaches the stroke volume.
- **ARDS** is a small, stiff, collapsed lung (`collapsed`, `clung`) with a weak right
  ventricle, a raised `pvrBase`, and — as shipped — over half of the collapse
  reopenable (`recruitable=0.55`). Across a PEEP titration from 0 to 20 the
  resistance coefficient falls 7.6 → 6.0 Wood units, but cardiac output falls
  the whole way, 3.56 → 2.89 L/min: the preload cost outruns the afterload
  benefit at every step. Filling the patient to `stressedVolume=1050` lifts the
  whole curve (3.80 → 3.32) without changing its shape.

  Set `recruitable=0` — the same collapsed lung, now consolidated rather than
  closed — and the titration inverts. Resistance now *rises* with PEEP, 8.0 →
  10.4, and output falls twice as fast, 3.38 → 2.02. Nothing else about the
  patient changed. That is the comparison this preset exists for, and it is the
  one a single-compartment lung could not show.

  A PEEP that buys output does exist, but only in a lung that is both highly
  recruitable and well filled: at `recruitable=0.9`, `pOpen=12` and
  `stressedVolume=1400`, resistance falls 6.4 → 3.8 and output holds a broad
  plateau out to PEEP 12–16 before declining. The plateau is shallow — the
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
- **Stiff chest wall**, **COPD** and **intra-abdominal hypertension** each vary
  one mechanical parameter group and leave the heart entirely at default, so the
  haemodynamic change can only have come from mechanics.

---

## 12. Fixed constants

Not user-facing, but part of the model. In `src/model/circulation.js` and
`src/model/respiratory.js`.

### Compartments

| Constant | Value | Meaning |
|---|---|---|
| `vuSa`, `cSa` | 700 mL, 1.35 mL/mmHg | systemic arterial unstressed volume and compliance |
| `vuSv` | 2800 mL | systemic venous unstressed volume |
| `vuPa`, `cPa` | 90 mL, 4.2 mL/mmHg | pulmonary arterial |
| `vuPv`, `cPv` | 180 mL, 8.5 mL/mmHg | pulmonary venous |
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
| `NORMAL_FRC` | 2.2 L | resting volume of a fully open lung; collapse is measured against it |
| `PL_EASY`, `SPREAD_EASY` | 0, 1.3 cmH₂O | opening threshold and spread for normal units |
| `SPREAD_HARD` | 7 cmH₂O | spread of opening pressures for diseased units |
| `HPV_GAIN` | 1.1 | resistance added per unit of closed lung |
| `UNSTRESSED_VOLUME` | 1.247 L | gas a fully open lung holds at zero transpulmonary pressure |
| `RECOIL_AT_FRC` | 5 cmH₂O | recoil balancing the chest wall; defines the resting volume |
| `EXTRA_FLOOR` | 0.35 | how far traction can take the extra-alveolar limb before it saturates |
| `PRELOAD_STEEP` | 0.10 /mmHg | reserve above which filling buys output; calibrated against the model's own response to 500 mL, not published |
| `TIDAL_CHALLENGE.threshold` | 3.5 points | Myatra 2017; published, not calibrated |
| `K_ALV`, `K_EXTRA` | 1.6, 2.4 | J-curve exponents |
| `F_ALV`, `F_EXTRA` | 0.6, 0.4 | J-curve weights |

---

## 13. Project layout

```
index.html
styles/app.css
docs/PHYSIOLOGY.md        calibration, verification against the sources, limitations
src/
  main.js                 transport, scenario wiring, animation loop
  model/
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

72 checks, no framework and no dependencies:

- **Volume conservation** across every scenario, to 0.01 mL.
- **Compartment positivity** across every scenario and across a deterministic
  250-configuration sweep of the whole control space, with a fixed generator so
  a failure is reproducible.
- **Convergence** under time-step refinement, measured on continuous quantities.
  Cardiac output is deliberately not used: it is latched at a beat boundary, so
  which sample lands on the boundary shifts with the step.
- **Determinism** — identical parameters give identical results.
- **Eleven physiological relations**, by direction rather than by value: PEEP
  raises CVP and lowers output, spontaneous breathing lowers measured CVP while
  raising transmural pressure and output, hypovolaemia raises pulse pressure
  variation, a short expiratory time traps gas, a stiff chest wall raises the
  pleural swing, RV failure dilates the RV, removing septal coupling lets the LV
  fill.
- **The J-curve's nadir found by search**, not asserted — the test would fail if
  the curve were monotonic.
- **Integrator/drawing agreement** — the simulated state lies on the drawn
  venous return curve, and the curve and the equation return the same flow.
- **Scenario snapshots**, regenerated deliberately with
  `node tests/generate-snapshots.mjs` so a change in behaviour has to be
  acknowledged rather than discovered.
- **Documentation** — the scenario table in this file is checked against a fresh
  run of the model.

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

- **No autonomic control.** No baroreflex, no chemoreflex. Real patients defend
  their blood pressure; this one does not, so falls in cardiac output are larger
  and more sustained than at the bedside.
- **No gas exchange.** No oxygen, CO₂, pH or shunt. Hypoxic vasoconstriction is
  a coefficient on derecruited lung, not a consequence of an alveolar oxygen
  tension.
- **Pulse pressure variation reproduces the true positive, and one false
  positive weakly.** Above about 900 mL of stressed volume the zone III fraction
  reaches 96–100% and the lung starts squeezing blood forward into the left
  atrium with each breath, so variation rises again — 1.7% at 900 mL to 3.6% at
  1400 mL — in patients who gain nothing from a bolus. That is the classical
  direct-filling component, and it appears where it should. It is weak: the real
  thing reaches double figures. The other classical sources, irregular effort and
  arrhythmia, are genuinely absent.
- **The tidal volume challenge is marginal in the patient it should be clearest
  in.** It orders patients correctly and crosses the published threshold in the
  tachycardic septic responder, but a patient merely dry at a resting heart rate
  sits at 3.4–3.6 points against a threshold of 3.5.
- **Almost no transit delay between the ventricles**, and at very high PVR the
  pulmonary artery diastolic pressure runs higher than it should because the
  vascular compartment's time constant exceeds the cardiac cycle. This is about
  the pulmonary vessels, not the lung units, which are now two populations.
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
  identifiability analysis. This is a mechanistic teaching model calibrated to
  reproduce qualitative relationships, not a patient-specific predictor.

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
