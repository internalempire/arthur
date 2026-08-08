# The model

What the simulator computes, why it is built this way, and where it stops being
trustworthy.

Notation follows the sources: respiratory pressures in cmH₂O, vascular pressures
in mmHg, converted at 1 mmHg = 1.3595 cmH₂O in `src/model/units.js`.

---

## 1. Respiratory mechanics

The lung and chest wall are two elastic elements in series, which is exactly what
the Campbell diagram draws. With `V` the volume above the relaxation volume:

```
Palv = V / Crs − Pmus
Ppl  = Ppl(FRC) + V / Ccw − Pmus
flow = (Pao − Palv) / Raw
1/Crs = 1/Clung + 1/Ccw
```

`Ppl(FRC) = −5 cmH₂O`, so transpulmonary recoil at the relaxation volume is
+5 cmH₂O and alveolar pressure there is zero.

The consequence that matters clinically is that **pleural pressure follows the
chest wall compliance curve while airway pressure follows the respiratory system
curve**. For a given tidal volume, pleural pressure rises by `VT / Ccw` — lung
compliance does not appear. This is why:

- The same tidal volume costs the same venous return in ARDS as in a normal
  lung, but the same *PEEP* costs far less, because a stiff lung recruits less
  volume per cmH₂O of airway pressure.
- A stiff chest wall raises the haemodynamic cost of every breath.

Ventilatory modes: volume control imposes constant inspiratory flow; pressure
control and pressure support impose airway pressure; spontaneous breathing is
driven by a muscle pressure `Pmus` that can be added to any mode. Pressure
support is patient-triggered and flow-cycled at 25% of peak inspiratory flow.

Intrinsic PEEP is emergent, not configured: if expiratory time is short relative
to `Raw × Crs`, volume does not return to the relaxation volume and
end-expiratory alveolar pressure exceeds the set PEEP.

### Abdominal coupling

`Pab = Pab₀ + k·V`. Diaphragmatic descent pressurises the abdomen in proportion
to the volume moved. This one term produces both of the effects Kenny describes
in his chapter 3 — see §3.

---

## 2. The circulation

Eight compliant compartments, volume conserved, integrated with forward Euler at
dt = 0.25 ms (small relative to the shortest time constant in the system, the
valve resistances at ≈7.5 ms).

Ventricles use time-varying elastance with a double-hill activation `e(t)`:

```
P_transmural = e(t)·Ees·(V − V0s) + (1 − e(t))·A·(exp(B·(V − V0d)) − 1)
P_cavity     = P_transmural + Ppl + Ppericardial
```

Atria are the same with a smaller elastance range, activated over the last fifth
of the cardiac cycle. Valves are diodes with a small series resistance.

**The whole of heart–lung interaction is the choice of surrounding pressure per
compartment.** Nothing is added on top. See the table in the README.

### Venous return and the Starling resistor

```
Pmsf = (Vsv − Vu,sv)/Csv + 0.6·Pab·zone
Q    = (Pmsf − P_effective) / Rvr
```

`P_effective` is right atrial pressure while the vein is open, and the critical
closing pressure `Pab − 5 cmH₂O` once it collapses — Kenny's figure for the IVC
tolerating about 5 cmH₂O of transmural compression. The transition is smoothed
over ≈1 mmHg with a softplus rather than a hard `max()`, because collapse is a
flutter, not a switch, and a hard knee makes venous return completely
insensitive to intrathoracic pressure in hypovolaemia — which would remove
exactly the physiology the simulator exists to show.

### Abdominal zone conditions

Whether abdominal pressure helps or hinders depends on how full the splanchnic
bed is. This is Kenny's chapter 3 figure 3, implemented directly:

```
zone = clamp((Pmsf_elastic − 2)/8, 0, 1)
Pmsf  = Pmsf_elastic + 0.6·Pab·zone                     (zone III: helps)
Rvr   = Rvr₀·(1 + 0.5·(1 − zone)·max(0, Pab − 2)/4)     (zone I/II: hinders)
```

A full abdomen squeezed by the diaphragm pushes blood forward and raises the
pressure head. An empty one is obliterated instead, and the same pressure raises
resistance. This is why PEEP costs a hypovolaemic patient much more than a
hypervolaemic one, and why fluid loading changes the *shape* of the response to
PEEP rather than just its size.

### Ventricular interdependence

Two mechanisms, separately controllable:

- **Pericardium.** One exponential pressure–volume relation applied to the sum of
  all four chamber volumes, added to every chamber's surrounding pressure.
  Interdependence emerges rather than being asserted. Set the control to zero to
  abolish it.
- **Septum.** A direct term added to left ventricular diastolic pressure
  proportional to right ventricular volume above a threshold, and a much smaller
  reverse term.

Systolic interdependence — the left ventricle generating a large share of right
ventricular systolic pressure through shared myofibres — is always on and is
**not** on the septal control, because it is anatomy rather than septal geometry.
Putting it on the same slider made "turn off septal coupling" weaken the right
ventricle, which is the opposite of the demonstration the control exists for.

### Pulmonary circulation

PVR is the sum of two exponential terms in lung volume:

```
R_alveolar      = 0.6·PVR₀·exp( 1.6·x)
R_extraalveolar = 0.4·PVR₀·exp(−2.4·x)·(1 + hpv·1.4·max(0, −x))
x = (V_lung − 2.2 L) / 2.2 L
```

Their sum is J-shaped with its nadir at x = 0. **The reference volume is a normal
FRC (2.2 L), not the patient's own relaxation volume.** A collapsed ARDS lung
therefore sits on the left limb, where recruitment lowers PVR — without this,
taking PEEP away could only ever lower PVR, and the clinical point of the
J-curve would be lost.

Pulmonary flow uses a vascular waterfall: where alveolar pressure exceeds
pulmonary venous pressure the downstream pressure for flow is alveolar pressure,
not left atrial pressure (Permutt). West zone 1 stops flow entirely.

Lung inflation also reduces pulmonary venous unstressed volume in proportion to
the zone III fraction — the "piston" that discharges blood toward the left
atrium during inspiration and is the main source of left ventricular stroke
volume variation during positive-pressure ventilation.

---

## 3. Derived curves

The Guyton diagram is not drawn from a lookup table. Both curves are computed
from the same constants the integrator uses:

- **Venous return** is the equation above, swept over right atrial pressure.
- **Cardiac function** converts each candidate filling pressure to a transmural
  pressure, inverts the right ventricular EDPVR to an end-diastolic volume, and
  applies the single-beat elastance relation with the arterial elastance the
  right ventricle currently faces.

Because both come from the live state, their intersection tracks the operating
point the simulation actually reaches. The x-intercept of the cardiac function
curve sits at pleural pressure, so a breath visibly slides the curve along the
axis.

Everything on this plot is averaged over exactly one cardiac cycle. The Guyton
diagram is a steady-state construction — its axes are mean pressure and mean
flow — and right atrial pressure swings around 3 mmHg every beat through its a,
c and v waves, roughly a third of the width of the plot. A boxcar one cardiac
cycle long nulls that ripple exactly while passing the respiratory cycle
essentially untouched, which is the motion the diagram exists to show.

**The marker is drawn at the crossing of the two curves, and the integrated
model sits within a few percent of it rather than exactly on it.** Two reasons,
both worth knowing:

- Venous return is a nonlinear function of right atrial pressure near the
  collapse knee, and the mean of a nonlinear function is not that function of
  the mean. Far from the knee — the ARDS and intra-abdominal hypertension
  presets — the model's cycle-mean flow sits on the venous return curve to
  within 0.01 L/min. Close to it, at a normal right atrial pressure, they differ
  by about 0.5 L/min.
- The cardiac function curve is a single-beat elastance approximation, not
  something the integrator computes.

Measured across the presets, the marker's height runs 0% to 7% above the
integrated cardiac output, and +14% in the septic shock preset — the one case
that combines a low right atrial pressure near the knee with a high heart rate.
Read the marker as the graphical analysis's answer and the cardiac output tile
as the model's; where they disagree, the tile is the one that came from
conservation of volume.

---

## 4. Calibration

Baseline (70 kg adult, passive volume control, VT 450 mL, PEEP 5, RR 14):

| | Model | Expected |
|---|---|---|
| Cardiac output | 5.0 L/min | 4.5–6.0 |
| Arterial pressure | 120/82, mean 96 | — |
| CVP | 1.5 mmHg | 0–6 |
| Pulmonary artery | 22/12, mean 17 | 15–25 / 8–15 |
| Wedge | 10 mmHg | 6–12 |
| Mean systemic filling pressure | 9 mmHg | 8–12 |
| PVR | 1.3 Wood units | 0.3–2.0 |
| LV ejection fraction | 49% | 55–70 (see limitations) |
| Plateau pressure | 9.5 cmH₂O | — |

Behaviour was checked against the sources rather than only against resting
numbers. The following all reproduce:

- PEEP 0 → 20: cardiac output 5.2 → 3.7 L/min, CVP 0.5 → 4.5, Pmsf 7.6 → 12.5.
  The gradient for venous return is partly defended by the abdomen, as Fessler
  and van den Berg describe.
- Spontaneous inspiration lowers CVP below zero while cardiac output rises.
- Hypovolaemia: pulse pressure variation 15%, and a 500 mL bolus raises cardiac
  output by 78%. At euvolaemia the same bolus gains 20% and variation is 3%.
- ARDS with right ventricular failure: RV:LV end-diastolic ratio 1.9, PVR 4.1
  Wood units, and a PEEP titration with a genuine optimum — cardiac output peaks
  at PEEP 3–5 and falls on both sides.
- COPD with a short expiratory time: 5.8 cmH₂O of intrinsic PEEP appears with no
  change in the set PEEP.
- Intra-abdominal hypertension raises Pmsf to 19 mmHg while *lowering* cardiac
  output, because the closing pressure of the vena cava rises with it.

---

## 5. Limitations

Stated plainly, because a simulator that hides these teaches the wrong lesson.

- **No autonomic control.** No baroreflex, no chemoreflex. Heart rate, vascular
  tone and contractility only change when you change them. Real patients defend
  their blood pressure; this one does not, so falls in cardiac output are larger
  and more sustained than you would see at the bedside.
- **No gas exchange.** There is no oxygen, CO₂, pH or shunt. Hypoxic pulmonary
  vasoconstriction is a coefficient on derecruited lung, not a consequence of an
  alveolar oxygen tension.
- **Pulse pressure variation is underdamped in the false-positive direction.**
  The model reproduces the *true* positive well — high variation in the fluid
  responder, low in the non-responder. It does **not** reproduce the classic
  false positives. A well-filled patient making 20 cmH₂O pleural swings still
  shows about 4% variation, because the preload pathway is the only route to
  variation here and that ventricle is on the flat part of its Starling curve.
  Real false positives come largely from irregular, variable-depth efforts and
  from arrhythmia, neither of which this model has: effort is a perfectly
  reproducible half-sine and the rhythm is metronomic.
- **Ejection fraction runs low** (≈50% at baseline). Ejection ends when cavity
  pressure falls below aortic pressure, and with a double-hill activation that
  happens a little early. Stroke volume, cardiac output and the loop shape are
  right; the ratio is pessimistic by roughly 5–10 points.
- **Two pulmonary compartments give almost no transit delay.** In a real chest
  the fall in right ventricular output reaches the left ventricle two or three
  beats later, which separates the Δup and Δdown components of pulse pressure
  variation. Here they largely overlap and partly cancel.
- **The pulmonary circulation is lumped.** One PVR and one zone-III fraction for
  the whole lung. Regional heterogeneity — the thing that actually makes ARDS
  ARDS — is absent.
- **Forward Euler.** Stable at the shipped time step and parameter ranges, but
  extreme combinations at the ends of several sliders at once can be pushed into
  oscillation. Reset restores a settled state.
- **No valvular disease, no arrhythmia, no bronchospasm heterogeneity, no
  recruitment hysteresis.**

## Sources

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
