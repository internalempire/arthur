# The model at a glance

> arthur is an interactive teaching model of heart–lung interaction: it links respiratory pressure, lung volume, venous return, pulmonary vascular load and biventricular function in one closed circulation.

---

## What the model is for

The model is designed to answer mechanistic questions: why can positive-pressure ventilation reduce right ventricular filling, why can the same breath raise right ventricular afterload, why does the left-sided response arrive later, and why does the answer change with recruitment, lung volume, filling and ventricular reserve?

It is not a patient-specific digital twin, a ventilator, a monitor or a treatment calculator. Its strongest use is to change one input at a time, follow the causal chain across several panels, and ask whether the response is physiologically coherent.

If this is your first visit, start with the [ten-minute guided exploration](quick-start.md). The [conventions](conventions.md) explain what the badges and numerical categories mean, and the [glossary](glossary.md) collects terms, symbols and units.

## Everything on the application screen

### Patient and time controls

The scenario selector loads a teaching phenotype. The current presets and the question each is meant to expose are collected on [Clinical scenarios](scenarios.md). Selecting a preset replaces the current parameters; changing any control afterwards makes the state *Custom*.

Play/Pause stops or resumes simulated time. The speed selector changes how quickly simulated time passes, not any physiological parameter. Reset returns the current preset to its initial state and clears measured occlusion points. End-expiratory and end-inspiratory holds are explained under [Manoeuvres](manoeuvres.md).

### The five control groups

| group | what it changes | detailed page |
|---|---|---|
| ventilation | mode, rate, tidal volume or inspiratory pressure, PEEP, inspiratory time and effort | [Ventilation controls](controls-ventilation.md) |
| respiratory mechanics | lung and chest-wall mechanics, collapse, recruitment, hysteresis, flow limitation and abdominal coupling | [Mechanics controls](controls-mechanics.md) |
| volume and vascular tone | stressed volume, venous compliance, resistance to venous return and systemic vascular resistance | [Volume controls](controls-volume.md) |
| cardiac function | rate, biventricular contractility, LV diastolic stiffness, baroreflex and ventricular interaction | [Heart controls](controls-heart.md) |
| pulmonary circulation | open-lung vascular resistance, hypoxic vasoconstriction and pulmonary capacitance coupling | [Pulmonary controls](controls-pulmonary.md) |

Controls are generated from the model's parameter registry. A grey control is not applicable in the current state—for example, tidal volume in pressure control, closing pressure while recruitment hysteresis is off, or baroreflex sensitivity while the reflex is disabled. The baroreflex is <!-- CONSISTENCY: baroreflex-default -->off<!-- /CONSISTENCY --> by default so the first view exposes uncompensated mechanical interaction; enabling it adds the model's aggregate pressure defence.

Manual search covers the full text of every written page, not only its title and summary. Results include a nearby excerpt so a body-text match can be judged before opening the page.

### Numerical readouts

The tiles combine direct model measurements, derived physiological indices and internal coefficients. These are not interchangeable categories. A quality message may mark an index for caution or withhold it when its assumptions are absent. [Numerical tiles](numeric-tiles.md) follows every readout from state through calculation to interpretation; [Interpretability](interpretability.md) explains the badge rules, and [pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md) provides the detailed example of why a familiar bedside name can require qualification.

### The six visual panels

| panel | the question it helps answer | detailed page |
|---|---|---|
| anatomical thorax | what is moving, what surrounds each chamber, and which pressures are being transmitted? | [Thorax](panel-thorax.md) |
| waveforms | what happened first within the breath or cardiac cycle? | [Waveforms](panel-waveforms.md) |
| ventricular pressure–volume loops | did filling, contractility or afterload change the beat? | [PV loops](panel-pv-loops.md) |
| Campbell diagram | how do pleural pressure, passive recoil and inspiratory muscle pressure relate to lung volume? | [Campbell diagram](panel-campbell.md) |
| Guyton diagram | where do venous return and predicted RV output meet, and is there preload reserve? | [Guyton diagram](panel-guyton.md) |
| PVR against lung volume | how do alveolar and extra-alveolar vessels create the J-shaped pulmonary vascular load? | [PVR curve](panel-pvr-curve.md) |

## The physiological map

A breath begins with the [equation of motion](equation-of-motion.md), which determines airway, alveolar and [pleural pressure](pleural-pressure.md). Those pressures change [transmural pressure](transmural-pressure.md), [venous return](venous-return.md), lung recruitment and the pulmonary vascular bed. Lung inflation also displaces pulmonary blood toward the left atrium, while [pulmonary transit](pulmonary-transit.md) delays the effect of changing right ventricular output.

The two ventricles share a septum and a constrained space, described under [ventricular interdependence](ventricular-interdependence.md). [Cardiac tamponade](cardiac-tamponade.md) shows what happens when the available pericardial space becomes the dominant limit to filling. Ventricular output also depends on filling, contractility and arterial load; [ventriculo-arterial coupling](ventriculo-arterial-coupling.md) provides the conceptual framework. [The four effects of a breath](the-four-effects-of-a-breath.md) puts these pathways in temporal order.

Respiratory pathology is represented selectively. A [two-population lung](two-population-lung.md) separates already aerated from recruitable units. [R/I](recruitment-and-ri.md) sets how much of the latter can be gained over a standard PEEP step; [hysteresis](hysteresis.md) gives recruited diseased units memory; [expiratory flow limitation](expiratory-flow-limitation.md) creates dynamic trapping without turning the simulator into a regional COPD model.

## How to use it responsibly

Use comparisons, directions and timing before absolute values. Let a changed state settle for several breaths. Read pressure relative to its surrounding pressure. Distinguish the pulmonary resistance coefficient from catheter-derived PVR. Treat coloured thresholds as teaching annotations, not treatment triggers.

The [validation page](validation.md) explains what the executable tests constrain. [Global limits](global-limits.md) lists physiology the model does not contain. Those two pages are part of the model, not legal small print: a result is only useful inside their boundary.

## How the project was built

The physiological model, application code, tests, interface and manual were generated by LLMs under human-in-the-loop direction and revision. GPT-5.6-Sol with the high reasoning setting was the principal model used for model construction and manual writing; other LLMs cross-reviewed internal consistency, physiological claims against the available literature and agreement between code and documentation. Human review set the teaching goals, supplied and selected literature, challenged outputs, tested behaviour and approved substantive changes.

This provenance does not make the result independently validated. The development process and its limits are described under [model architecture](model-architecture.md#development-provenance) and [validation](validation.md#development-review-and-validation). Scientific inputs are cited on their relevant concept pages and collected in the [bibliography](bibliography.md).

## Why a linked manual

The manual follows the persistent-wiki approach described in [Karpathy's LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): physiological explanations, implementation choices, reversals and limitations are kept as interconnected Markdown pages rather than rediscovered from chat history. The source pages remain readable without the web viewer, and Git records how each claim changes.

## Limits

This overview deliberately compresses every topic. It cannot qualify an individual result and should not be used instead of the concept pages linked above.

## References

- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol*. 1955;180:463–468. [doi:10.1152/ajplegacy.1955.180.3.463](https://doi.org/10.1152/ajplegacy.1955.180.3.463)
- Pinsky MR. Heart lung interactions during mechanical ventilation. *Curr Opin Crit Care*. 2012;18:256–260. [doi:10.1097/MCC.0b013e3283532b73](https://doi.org/10.1097/MCC.0b013e3283532b73)
- Magder S. Heart–lung interaction in spontaneous breathing subjects: the basics. *Ann Transl Med*. 2018;6:348. [doi:10.21037/atm.2018.06.19](https://doi.org/10.21037/atm.2018.06.19)

---

## See also

[Quick start](quick-start.md) · [Conventions](conventions.md) · [Glossary](glossary.md) · [Clinical scenarios](scenarios.md) · [Validation](validation.md) · [Global limits](global-limits.md)
