# Heart–Lung Interaction

A real-time, web-based simulator of mechanical heart–lung interaction. Change a
ventilator setting or a circulatory parameter and watch the consequences appear
simultaneously on the Guyton diagram, the Campbell diagram, both ventricular
pressure–volume loops, the pulmonary vascular J-curve, and a live monitor.

Built from Jon-Emile Kenny's *An Approach to Mechanical Heart-Lung Interaction*
(1st ed., 2020), Mahmood & Pinsky (*Ann Transl Med* 2018;6:349) and Yuriditsky,
Mireles-Cabodevila & Alviar (*ATS Scholar* 2025;6:94–108).

**For teaching only.** This is a deliberate simplification of human physiology.
It must not be used to guide the care of a patient.

## Running it

No build step and no dependencies. Serve the directory over HTTP — ES modules
will not load from `file://`:

```bash
python3 -m http.server 8422
```

Then open <http://localhost:8422>. Any static server works.

While editing, note that browsers cache ES modules aggressively and a plain
reload can leave you looking at the previous version of a module. Hard-reload,
or serve with `Cache-Control: no-store`.

## What makes it a model rather than an animation

Nothing in the display is scripted. The circulation is a closed loop of eight
compliant compartments with conserved volume, integrated at 0.25 ms, and each
compartment is referenced to the pressure that actually surrounds it:

| Compartment | Surrounding pressure |
|---|---|
| Systemic arteries | atmosphere |
| Systemic veins (splanchnic reservoir) | abdominal pressure |
| RA, RV, LA, LV | pleural + pericardial pressure |
| Pulmonary arteries and veins | pleural pressure |

Every classical teaching point follows from that table alone:

- **Raising intrathoracic pressure reduces venous return.** It lifts right atrial
  pressure but not the systemic venous reservoir, so the gradient falls.
- **Raising intrathoracic pressure unloads the left ventricle.** Cavity pressure
  rises while aortic pressure does not, so ejection begins sooner.
- **Intrathoracic pressure does not change right ventricular afterload.** The RV
  and the pulmonary artery are lifted equally. Only lung volume moves PVR.
- **Central venous pressure falls during spontaneous inspiration while filling
  rises.** The measured pressure follows pleural pressure down; the transmural
  pressure goes up.

Beyond that the model carries a Starling resistor on the vena cava, a vascular
waterfall in the pulmonary circulation, a pericardium shared by all four
chambers, direct septal coupling, and the abdominal zone conditions that decide
whether diaphragmatic descent helps or hinders venous return.

The physiology, its equations and its limits are documented in
[docs/PHYSIOLOGY.md](docs/PHYSIOLOGY.md).

## Layout

```
index.html
styles/app.css
src/
  main.js               transport, scenario wiring, animation loop
  model/
    units.js            cmH2O / mmHg conversion — the only place it happens
    parameters.js       every user-facing knob; the control panel builds itself from this
    scenarios.js        presets, each with the question it is meant to answer
    respiratory.js      equation of motion, Campbell mechanics, the PVR J-curve
    circulation.js      the closed loop, ventricular elastance, derived Guyton curves
    simulator.js        integration, trace ring buffers, derived measurements
  ui/
    theme.js            one palette, consumed by both CSS and canvas
    plot.js             cartesian canvas primitives
    controls.js         parameter panel
    stats.js            monitor readouts
    panels/             the six visualisations
```

## Scripting it

The page exposes a handle for driving the model from the console or an embedding
page:

```js
heartLung.sim.setParam('peep', 15);
heartLung.step(20);        // advance 20 s of model time and repaint
heartLung.sim.metrics;     // every derived measurement
```

The model runs roughly 150× faster than real time, so a titration can be swept
in a loop without waiting for it.

## Accessibility and colour

The categorical palette was validated for colour-vision deficiency, and no
series is identified by hue alone — every trace and curve carries a direct
label, and every status readout carries a word as well as a colour. Light and
dark themes are separately specified rather than inverted; the theme button
cycles auto → light → dark.
