# Ventilation controls

> Ventilation controls determine who generates the breath, its timing and its airway boundary condition; their cardiovascular effect emerges through pleural pressure, lung volume and pulmonary vascular load.

---

## Controls

| control | range | model meaning |
|---|---:|---|
| ventilatory mode | spontaneous, volume control, pressure control, pressure support | selects the pressure or flow generator |
| respiratory rate | 6–40/min | sets total respiratory cycle time |
| tidal volume | 150–900 mL | delivered VT in volume control only |
| inspiratory pressure | 4–40 cmH₂O above PEEP | airway pressure target in pressure control and pressure support |
| PEEP | 0–24 cmH₂O | external end-expiratory airway pressure |
| inspiratory time | 0.4–2.5 s | duration of inspiration and, with rate, available expiratory time |
| inspiratory effort | 0–30 cmH₂O | scale of the patient's peak inspiratory muscle pressure |

### Ventilatory mode

In spontaneous mode, inspiratory muscle pressure lowers pleural and alveolar pressure and draws flow inward. In volume control, the ventilator delivers constant inspiratory flow sufficient to reach the selected VT over the selected inspiratory time. Pressure control holds the selected pressure above PEEP during inspiration. Pressure support combines positive airway pressure with patient effort.

Changing from any scenario to volume control or pressure control sets inspiratory effort to zero. The transition therefore starts with a genuinely passive patient rather than carrying hidden muscle pressure across from spontaneous breathing. This is only the initial condition: the effort slider remains available and can be raised afterwards to explore a controlled breath with superimposed patient activity. Pressure support does not clear effort because patient activity is part of that mode's represented mechanism.

The sign of pleural-pressure change is central, but it is not fixed by the mode label alone. In assisted breathing, respiratory effort, chest-wall mechanics and applied pressure combine; inspect the waveform rather than assuming transmission.

### Rate and inspiratory time

Together they determine expiratory time. Shortening expiration in a high-resistance or flow-limited lung prevents complete emptying, raises end-expiratory volume and generates intrinsic PEEP. Rate also changes how many cardiac beats occur within one breath, affecting the interpretability of dynamic indices.

### VT or inspiratory pressure

Only the active mode control is enabled. Equal VT does not imply equal strain, pleural-pressure swing or RV afterload because aerated-lung size, compliance, recruitment and absolute lung volume can differ. Equal inspiratory pressure does not imply equal VT for the same reasons.

### PEEP

PEEP raises mean airway pressure and usually end-expiratory lung volume. Its haemodynamic effect is the sum of pressure transmission, altered venous return, movement along the PVR curve, recruitment or distension, and LV transmural afterload relief. There is no single PEEP–output relation across model states.

### Inspiratory effort

The slider sets the pressure scale of one aggregate inspiratory-muscle activation. Neural drive rises smoothly during the selected neural inspiratory time. Effective pressure follows it rapidly and then decays into early expiration instead of being switched off instantaneously. This residual **post-inspiratory activity** slows early lung emptying and lets the expiratory limb of the [Campbell diagram](panel-campbell.md) remain separated from the relaxed chest-wall curve.

The decay time is derived from the available expiratory time, so rate and inspiratory time change its absolute duration. There is no additional braking control: the residual pressure, its effect on alveolar pressure and the resulting expiratory flow all emerge from the same respiratory equation of motion.

Non-zero effort during positive-pressure ventilation makes PPV unavailable because the passive controlled-breath assumptions are absent. Pressure support can cycle before muscle activation has disappeared, so the model can show a simplified post-inspiratory load; it does not reproduce the full range of trigger and cycling asynchronies or calculate clinical work of breathing.

## Why these controls

The set exposes the minimum respiratory inputs needed to distinguish negative- from positive-pressure breathing, volume from pressure targeting and adequate from incomplete expiration. More detailed ventilator controls would shift attention toward device engineering rather than heart–lung interaction.

## Limits

- No flow waveform selection, rise time, trigger sensitivity, cycling criterion, pause time, pressure ramp or patient–ventilator dyssynchrony.
- Volume control uses constant flow throughout inspiration and has no inspiratory pause.
- Pressure support is a simplified pressure boundary combined with flow cycling and effort, not a complete trigger/cycle algorithm.
- Post-inspiratory activity is one aggregate, regular decay. It is not diaphragm electrical activity, a patient-specific neural controller or active abdominal expiration.
- No gas exchange, oxygen concentration, dead space, respiratory drive controller or sedation.
- Control ranges are model operating ranges, not recommended ventilator settings.

## References

- Pinsky MR. Cardiovascular issues in respiratory care. *Chest*. 2005;128:592S–597S. [doi:10.1378/chest.128.5_suppl_2.592S](https://doi.org/10.1378/chest.128.5_suppl_2.592S)
- Tobin MJ. *Principles and Practice of Mechanical Ventilation*. 3rd ed. McGraw-Hill; 2013.
- Marini JJ, Gattinoni L. Management of COVID-19 respiratory distress. *JAMA*. 2020;323:2329–2330. [doi:10.1001/jama.2020.6825](https://doi.org/10.1001/jama.2020.6825)
- Shee CD, Ploy-Song-Sang Y, Milic-Emili J. Decay of inspiratory muscle pressure during expiration in conscious humans. *J Appl Physiol*. 1985;58:1859–1865. [doi:10.1152/jappl.1985.58.6.1859](https://doi.org/10.1152/jappl.1985.58.6.1859)
- Coiffard B, Dianti J, Telias I, et al. Dyssynchronous diaphragm contractions impair diaphragm function in mechanically ventilated patients. *Crit Care*. 2024;28:107. [doi:10.1186/s13054-024-04894-3](https://doi.org/10.1186/s13054-024-04894-3)

---

## See also

[Equation of motion](equation-of-motion.md) · [Pleural pressure](pleural-pressure.md) · [Expiratory flow limitation](expiratory-flow-limitation.md) · [Pulse pressure variation](pulse-pressure-variation.md) · [Waveforms](panel-waveforms.md)
