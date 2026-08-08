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

## 5. The pulmonary circulation

### The J-curve

PVR is the sum of two exponential terms in lung volume:

```
x               = (V_lung − 2.2 L) / 2.2 L
R_alveolar      = 0.6 · PVR₀ · exp( 1.6·x)
R_extraalveolar = 0.4 · PVR₀ · exp(−2.4·x) · (1 + hpv·1.4·max(0, −x))
PVR             = R_alveolar + R_extraalveolar
```

Intra-alveolar vessels are compressed by inflation; extra-alveolar vessels are
tethered open by it. Their sum is J-shaped with its nadir at x = 0, so both
atelectasis and overdistension load the right ventricle.

**The reference volume is a normal FRC (2.2 L), not the patient's own relaxation
volume.** A collapsed ARDS lung therefore sits on the left limb, where
recruitment lowers PVR. Without this, taking PEEP away could only ever lower
PVR, and the clinical point of the J-curve would be lost. The hypoxic
vasoconstriction term acts only on derecruited lung (x < 0).

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

## 6. Ventricular interdependence

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

## 7. Integration and derived measurements

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

## 8. The derived curves

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

---

## 9. Parameters

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
| `clung` | Lung compliance | mL/cmH₂O | 200 | 15 – 260 |
| `ccw` | Chest wall compliance | mL/cmH₂O | 200 | 40 – 300 |
| `raw` | Airway resistance | cmH₂O/L/s | 5 | 1 – 40 |
| `frc` | Functional residual capacity | L | 2.2 | 0.8 – 4.0 |
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
| `hr` | Heart rate | /min | 75 | 40 – 170 |
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
| `piston` | Pulmonary capacitance coupling | mL/L | 85 | 0 – 200 |

To convert a resistance to clinical units: Wood units = mmHg·s/mL × 1000/60;
dyn·s·cm⁻⁵ = mmHg·s/mL × 80000/60.

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

## 10. Scenarios

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
| ARDS with right ventricular failure (`ards-rv`) | `mode=vcv`, `pmus=0`, `vt=350`, `peep=12`, `rr=24`, `frc=1.35`, `clung=34`, `eesRv=0.28`, `pvrBase=0.17`, `hpv=1.6` |
| Acute pulmonary embolism (`pulmonary-embolism`) | `mode=spont`, `pmus=6`, `peep=0`, `rr=24`, `pvrBase=0.44`, `eesRv=0.32`, `stressedVolume=1050`, `svr=1.25`, `hr=118` |
| Cardiogenic pulmonary oedema (`lv-failure`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=10`, `rr=18`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=95` |
| Weaning the failing left ventricle (`weaning`) | `mode=spont`, `pmus=10`, `peep=0`, `rr=26`, `eesLv=1.2`, `lvStiff=0.034`, `stressedVolume=1050`, `svr=1.25`, `hr=110` |
| Stiff chest wall (`obesity`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=8`, `rr=16`, `ccw=75`, `pab0=12` |
| COPD with dynamic hyperinflation (`copd`) | `mode=vcv`, `pmus=0`, `vt=500`, `peep=5`, `rr=26`, `ti=0.9`, `raw=24`, `clung=240`, `frc=3.0` |
| Intra-abdominal hypertension (`iah`) | `mode=vcv`, `pmus=0`, `vt=450`, `peep=8`, `rr=16`, `pab0=22`, `abdCoupling=6` |

### What each one settles at

Steady state after 30 s of simulated time. Pressures in mmHg, flow in L/min, PVR
in Wood units.

| Scenario | CO | MAP | CVP | PA | Wedge | PVR | RV:LV | PPV |
|---|---|---|---|---|---|---|---|---|
| Healthy, breathing spontaneously | 5.6 | 99 | −1.0 | 24/13 | 9 | 1.2 | 0.89 | 8% |
| Healthy, passive volume control | 5.0 | 96 | 1.5 | 23/13 | 10 | 1.3 | 0.88 | 2% |
| PEEP escalation | 4.2 | 85 | 4.3 | 27/18 | 9 | 2.1 | 0.94 | 6% |
| Septic shock, fluid responsive | 3.7 | 59 | 2.0 | 17/11 | 4 | 1.5 | 0.90 | 15% |
| Big pleural swings, no variation | 6.8 | 97 | 1.7 | 30/18 | 10 | 1.2 | 0.99 | 6% |
| ARDS with right ventricular failure | 3.2 | 65 | 4.2 | 27/20 | 3 | 4.1 | 1.92 | 6% |
| Acute pulmonary embolism | 4.1 | 97 | 5.5 | 39/33 | 4 | 7.3 | 2.01 | 10% |
| Cardiogenic pulmonary oedema | 3.4 | 78 | 5.0 | 43/37 | 32 | 1.8 | 0.90 | 6% |
| Weaning the failing left ventricle | 3.2 | 80 | 0.7 | 35/28 | 31 | 1.3 | 0.92 | 19% |
| Stiff chest wall | 4.2 | 87 | 3.4 | 18/10 | 9 | 1.3 | 0.84 | 5% |
| COPD with dynamic hyperinflation | 4.1 | 81 | 4.4 | 29/19 | 8 | 4.2 | 1.09 | 5% |
| Intra-abdominal hypertension | 2.9 | 71 | 0.9 | 14/8 | 3 | 1.4 | 0.84 | 9% |

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
- **ARDS** is a small, stiff, collapsed lung (`frc`, `clung`) with a weak right
  ventricle and a raised `pvrBase`. Because `frc` sits well below the J-curve
  nadir, PEEP recruits toward it and PVR falls steadily — 6.3 Wood units at
  PEEP 0 down to 3.3 at PEEP 20. Whether that buys any output depends on
  filling, which is the point worth making: as shipped the patient is
  relatively underfilled and cardiac output falls throughout the titration
  (3.51 → 2.65 L/min), because the preload cost outruns the afterload benefit.
  Raise `stressedVolume` to 1050 mL and a broad optimum appears around PEEP
  3–8, where output is higher than at zero. The optimal PEEP for a failing
  right ventricle is not a property of the lung alone.
- **Pulmonary embolism** is the deliberate mirror: `clung`, `ccw` and `frc` are
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

## 11. Fixed constants

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
| `PVR_NADIR_VOLUME` | 2.2 L | lung volume at the J-curve nadir |
| `K_ALV`, `K_EXTRA` | 1.6, 2.4 | J-curve exponents |
| `F_ALV`, `F_EXTRA` | 0.6, 0.4 | J-curve weights |

---

## 12. Project layout

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
    respiratory.js        equation of motion, Campbell mechanics, the PVR J-curve
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

## 13. Tests

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

## 14. Scripting it

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

## 15. Accessibility and colour

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

## 16. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.
The full list, with the measurements behind it, is in
[docs/PHYSIOLOGY.md](docs/PHYSIOLOGY.md). In short:

- **No autonomic control.** No baroreflex, no chemoreflex. Real patients defend
  their blood pressure; this one does not, so falls in cardiac output are larger
  and more sustained than at the bedside.
- **No gas exchange.** No oxygen, CO₂, pH or shunt. Hypoxic vasoconstriction is
  a coefficient on derecruited lung, not a consequence of an alveolar oxygen
  tension.
- **Pulse pressure variation reproduces the true positive but not the classic
  false positives**, which come largely from irregular effort and arrhythmia —
  neither of which this model has.
- **One pulmonary compartment**, so almost no transit delay between the
  ventricles, and at very high PVR the pulmonary artery diastolic pressure runs
  higher than it should because the compartment's time constant exceeds the
  cardiac cycle.
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

## 17. Sources

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
