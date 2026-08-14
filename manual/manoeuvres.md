# Manoeuvres and simulation time

> Holds create model measurements at controlled points in the respiratory cycle; Pause, speed and Reset control the experiment but are not physiological interventions.

---

## End-expiratory and end-inspiratory holds

Selecting *Exp hold* arms an occlusion for the next end-expiratory point; *Insp hold* arms it for end-inspiration. Once engaged, the hold lasts 12 simulated seconds. The same button cancels a pending or active hold.

During the hold, airway flow is stopped at the selected lung volume. The model averages right atrial pressure and venous return over the final 40% of the manoeuvre and adds that pair as a square point on the [Guyton panel](panel-guyton.md). Up to eight recent points are retained.

At least two points permit a linear fit and a zero-flow intercept. That intercept is labelled extrapolated because flow is not actually reduced to zero. It can differ from the exactly known internal Pmsf because each hold can alter abdominal pressure and sample a different effective venous-return relation. See [Pmsf and occlusions](pmsf-and-occlusions.md).

These are venous-return sampling manoeuvres. The routine plateau-pressure tile is not measured from the inspiratory hold; it remains the model's calculated elastic plateau.

## Play, Pause and speed

Pause freezes numerical integration and the drawings. It does not close the airway or represent an apnoeic patient. A pending hold cannot finish while simulated time is paused, so its button remains active and can be cancelled.

Speed changes how many simulated seconds are advanced per wall-clock second. It does not change heart rate, respiratory rate, the integration step or physiological time constants. Running faster is useful for settling a new state; return to normal speed when judging visual timing.

## Reset

Reset clears hold measurements, cancels an active manoeuvre, restores model state and settles the circulation. If a named scenario is selected, its parameters are reapplied. Reset does not preserve the custom state or the previous Guyton trail.

## A reproducible occlusion sequence

1. Select a passive ventilatory mode and allow the circulation to settle.
2. Perform an expiratory hold and wait for it to finish.
3. Change PEEP or perform an inspiratory hold to obtain a second pressure–flow point.
4. Inspect the measured points and extrapolated line, but compare its intercept with the internal Pmsf tile rather than assuming equivalence.
5. Reset before testing a different phenotype.

## Limits

- Holds are long, ideal, leak-free occlusions with no spontaneous effort, reflex resetting or vascular stress relaxation beyond mechanisms already present.
- Only one hold can be active or pending.
- A regression through few idealised points does not reproduce the uncertainty of bedside inspiratory-hold methods.
- Changing PEEP between points changes more than right atrial pressure: abdominal transmission and pulmonary vascular load can also change.
- Reset includes a 15-second silent settlement and is not an instantaneous return of a real patient to baseline.

## References

- Maas JJ, Geerts BF, van den Berg PCM, et al. Assessment of venous return curve and mean systemic filling pressure in postoperative cardiac surgery patients. *Crit Care Med*. 2009;37:912–918. [doi:10.1097/CCM.0b013e3181961481](https://doi.org/10.1097/CCM.0b013e3181961481)
- Persichini R, Silva S, Teboul JL, et al. Effects of norepinephrine on mean systemic pressure and venous return in human septic shock. *Crit Care Med*. 2012;40:3146–3153. [doi:10.1097/CCM.0b013e318260c6c3](https://doi.org/10.1097/CCM.0b013e318260c6c3)

---

## See also

[Pmsf and occlusions](pmsf-and-occlusions.md) · [Guyton panel](panel-guyton.md) · [Venous return](venous-return.md) · [Quick start](quick-start.md) · [Validation](validation.md)
