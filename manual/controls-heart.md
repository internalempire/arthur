# Heart controls

> Cardiac controls separate rate, contractility, diastolic stiffness and mechanical coupling, while one optional aggregate reflex provides slow compensation.

---

## Pump properties

| control | range | model meaning |
|---|---:|---|
| heart rate | 40–170/min | cycle frequency independent of intrinsic contractility |
| LV contractility ($E_{es}$) | 0.3–6.0 mmHg/mL | LV end-systolic elastance |
| RV contractility ($E_{es}$) | 0.08–1.60 mmHg/mL | RV end-systolic elastance |
| LV diastolic stiffness | 0.010–0.080 /mL | exponent of the LV end-diastolic pressure–volume relation |

Contractility changes the slope of the end-systolic relation, not arterial resistance. Diastolic stiffness changes how rapidly LV filling pressure rises with volume. Ejection fraction remains load-dependent, so it should not be used as a direct readout of the selected $E_{es}$.

The model has no force–frequency relation: changing heart rate does not automatically change contractility. Very high rate shortens filling time but does not reproduce ischaemia or rate-dependent relaxation.

## Autonomic control

| control | range | model meaning |
|---|---:|---|
| baroreflex sensitivity | 0–2 × | gain of one bounded sympathetic signal |
| baroreflex set point | 55–110 mmHg | MAP around which that signal is driven |

The signal adapts over one 15-second time constant and changes heart rate, systemic resistance, venous tone and both ventricular contractilities together. It senses systemic MAP only. Set sensitivity to zero when isolating a direct mechanical intervention; otherwise compensation can conceal it. See [baroreflex](baroreflex.md).

## Ventricular interaction

| control | range | model meaning |
|---|---:|---|
| pericardial constraint | 0–4 × | gain on pressure generated when total cardiac volume exceeds represented pericardial reserve |
| pericardial capacity | 100–600 mL | aggregate four-chamber volume accommodated before pericardial pressure rises |
| septal coupling | 0–4 × | gain on diastolic septal competition and systolic LV-to-RV assistance |

Pericardial constraint changes the gain of the shared pressure, while pericardial capacity moves the knee of its pressure–volume relation. Capacity is an internal aggregate volume, not effusion volume or an echocardiographic measurement. Reducing it represents loss of space available to the chambers without adding or removing circulating blood. Zero constraint removes the pressure route; one is the reference normal gain. Values above one are sensitivity experiments and should not be mapped directly to disease severity. See [cardiac tamponade](cardiac-tamponade.md).

## Limits

- Time-varying elastance is load-aware but does not model myocardial metabolism, calcium handling or regional wall motion.
- No coronary circulation, ischaemia, infarction, arrhythmia, conduction delay or pacing.
- No valvular stenosis or regurgitation.
- No independent RV diastolic-stiffness control and no atrial pathology.
- The pericardial controls support a directional tamponade phenotype, not a clinically calibrated effusion-volume or drainage model.
- Reflex controls are dimensionless model gains, not autonomic tests or drug doses.

## References

- Suga H, Sagawa K. Instantaneous pressure–volume relationships and their ratio in the excised, supported canine left ventricle. *Circ Res*. 1974;35:117–126. [doi:10.1161/01.RES.35.1.117](https://doi.org/10.1161/01.RES.35.1.117)
- Sunagawa K, Maughan WL, Burkhoff D, Sagawa K. Left ventricular interaction with arterial load studied in isolated canine ventricle. *Am J Physiol*. 1983;245:H773–H780.
- Dampney RAL. Central neural control of the cardiovascular system: current perspectives. *Adv Physiol Educ*. 2016;40:283–296. [doi:10.1152/advan.00027.2016](https://doi.org/10.1152/advan.00027.2016)

---

## See also

[Ventriculo-arterial coupling](ventriculo-arterial-coupling.md) · [Ventricular interdependence](ventricular-interdependence.md) · [The right ventricle](the-right-ventricle.md) · [Baroreflex](baroreflex.md) · [PV loops](panel-pv-loops.md)
