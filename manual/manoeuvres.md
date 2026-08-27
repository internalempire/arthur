# Manoeuvres and simulation time

> Holds create model measurements at controlled points in the respiratory cycle; Pause, speed and Reset control the experiment but are not physiological interventions.

---

## End-expiratory and end-inspiratory holds

Selecting *Exp hold* arms an occlusion for the next end-expiratory point; *Insp hold* arms it for end-inspiration. Once engaged, the hold lasts 12 simulated seconds. The same button cancels a pending or active hold.

During the hold, airway flow is stopped at the selected lung volume. The model averages right atrial pressure and venous return over the final 40% of the manoeuvre and adds that pair as a square point on the [Guyton panel](panel-guyton.md). Up to eight recent points are retained.

At least two points permit a linear fit and a zero-flow intercept. That intercept is labelled extrapolated because flow is not actually reduced to zero. It can differ from the exactly known internal Pmsf because each hold can alter abdominal pressure and sample a different effective venous-return relation. See [Pmsf and occlusions](pmsf-and-occlusions.md).

### What an inspiratory hold shows during pressure support

The same inspiratory hold also makes the patient's pressure contribution visible during assisted ventilation. The sequence is easier to understand from the [waveforms](panel-waveforms.md):

1. Immediately before occlusion, Paw is the pressure supplied by the ventilator and gas may still be flowing into the lung.
2. Closing the airway makes flow zero without changing lung volume. Paw therefore becomes equal to Palv. It may initially fall because the pressure previously spent overcoming airway resistance is no longer required.
3. Inspiratory muscle activity then relaxes. Ppl becomes less negative while volume remains fixed, so Palv and Paw rise toward the passive elastic plateau.

At the bedside, the difference between this plateau and Paw immediately before occlusion is commonly called the **pressure muscle index**. The original convention is:

$$
PMI = P_{plat,\,occlusion} - P_{aw,\,pre-occlusion}
$$

A larger positive rise generally accompanies a larger patient contribution. A value near zero or below can occur when pressure support supplies most of the breath or when removal of the resistive pressure offsets the pressure revealed by muscle relaxation.

### Why PMI is smaller than the effort setting

PMI should not be expected to equal the *Inspiratory effort* slider. The slider sets the maximum pressure scale available to the model's inspiratory muscles. The pressure actually being generated at the moment of occlusion depends on where the patient is in the neural breath and how far muscle activation has risen or decayed. A flow-cycled PSV breath can therefore end before the selected maximum is reached, or while activity is already changing.

The pressure difference also contains the effect of stopping flow. Immediately before occlusion, Paw has to supply the elastic pressure of the respiratory system and the pressure lost across the airways, while the patient's muscles reduce the airway pressure required from the ventilator. During a stable hold, flow and therefore resistive pressure are zero. At an unchanged lung volume, the relationship can be summarised as:

$$
PMI \approx P_{mus,\,occlusion}
- P_{resistive,\,pre-occlusion}
- P_{mus,\,residual\ at\ plateau}
$$

This explains the common finding that PMI is lower than the selected or peak Pmus. Part of the muscle contribution is masked by the simultaneous disappearance of resistive pressure, and any activity persisting during the apparent plateau reduces the measured rise further. With high support or a large resistive component, PMI can be zero or negative even though some inspiratory activity is present.

In practical terms, compare the stable Paw during the hold with Paw immediately before occlusion, but do not compare that difference directly with the effort-slider number. The former is an occlusion-derived surrogate; the latter is the maximum setting of the model's muscle-pressure generator. Even a visible pressure rise is not a direct measurement of total work of breathing or pressure–time product.

The model does **not** calculate or display PMI as a separate index. It closes the airway, fixes volume and continues the existing muscle-activation dynamics; the pressure change emerges from those mechanisms. This matters because the result also depends on support level, the volume reached at occlusion, airway resistance, respiratory-system recoil and whether muscle activity actually settles.

The routine plateau-pressure tile is not measured from this hold. During PSV it remains unavailable because an ordinary assisted breath has no passive plateau. The hold must instead be read directly on the Paw waveform: a stable level after zero flow is the relevant observation.

The model's 12-second hold is deliberately longer than the 2–3-second respiratory manoeuvre commonly used clinically because the same control also lets the circulation settle for the Guyton measurement. The airway-pressure transition occurs in the early part; only the final 40% is used for the haemodynamic average.

## Play, Pause and speed

Pause freezes numerical integration and the drawings. It does not close the airway or represent an apnoeic patient. A pending hold cannot finish while simulated time is paused, so its button remains active and can be cancelled.

Speed changes how many simulated seconds are advanced per wall-clock second. It does not change heart rate, respiratory rate, the integration step or physiological time constants. Running faster is useful for settling a new state; return to normal speed when judging visual timing.

## Reset

Reset clears hold measurements, cancels an active manoeuvre, restores model state and settles the circulation. If a named scenario is selected, its parameters are reapplied. Reset does not preserve the custom state or the previous Guyton trail.

## A reproducible occlusion sequence

1. Select a passive ventilatory mode and allow the circulation to settle. To inspect assisted muscle relaxation instead, select PSV with non-zero inspiratory effort.
2. Perform an expiratory hold and wait for it to finish.
3. Change PEEP or perform an inspiratory hold to obtain a second pressure–flow point.
4. Inspect the measured points and extrapolated line, but compare its intercept with the internal Pmsf tile rather than assuming equivalence.
5. Reset before testing a different phenotype.

## Limits

- Holds are long, ideal and leak-free. During PSV, inspiratory activity follows the model's regular neural timing and relaxation; agitation, repeated efforts during occlusion and irregular respiratory drive are not represented.
- A visible rise is not automatically a valid plateau. Clinical interpretation requires zero flow and a sufficiently long, flat pressure segment; high or persistent muscle activity can make an assisted plateau unreadable.
- Only one hold can be active or pending.
- A regression through few idealised points does not reproduce the uncertainty of bedside inspiratory-hold methods.
- Changing PEEP between points changes more than right atrial pressure: abdominal transmission and pulmonary vascular load can also change.
- Reset includes a 15-second silent settlement and is not an instantaneous return of a real patient to baseline.

## References

- Maas JJ, Geerts BF, van den Berg PCM, et al. Assessment of venous return curve and mean systemic filling pressure in postoperative cardiac surgery patients. *Crit Care Med*. 2009;37:912–918. [doi:10.1097/CCM.0b013e3181961481](https://doi.org/10.1097/CCM.0b013e3181961481)
- Persichini R, Silva S, Teboul JL, et al. Effects of norepinephrine on mean systemic pressure and venous return in human septic shock. *Crit Care Med*. 2012;40:3146–3153. [doi:10.1097/CCM.0b013e318260c6c3](https://doi.org/10.1097/CCM.0b013e318260c6c3)
- Foti G, Cereda M, Banfi G, Pelosi P, Fumagalli R, Pesenti A. End-inspiratory airway occlusion: a method to assess the pressure developed by inspiratory muscles in patients with acute lung injury undergoing pressure support. *Am J Respir Crit Care Med*. 1997;156:1210–1216. [doi:10.1164/ajrccm.156.4.96-02031](https://doi.org/10.1164/ajrccm.156.4.96-02031)
- Bianchi I, Grassi A, Pham T, et al. Reliability of plateau pressure during patient-triggered assisted ventilation: analysis of a multicentre database. *J Crit Care*. 2022;68:96–103. [doi:10.1016/j.jcrc.2021.12.002](https://doi.org/10.1016/j.jcrc.2021.12.002)
- Gao R, Zhou J-X, Yang Y-L, et al. Use of pressure muscle index to predict the contribution of patient's inspiratory effort during pressure support ventilation: a prospective physiological study. *Front Med*. 2024;11:1390878. [doi:10.3389/fmed.2024.1390878](https://doi.org/10.3389/fmed.2024.1390878)

---

## See also

[Pmsf and occlusions](pmsf-and-occlusions.md) · [Guyton panel](panel-guyton.md) · [Venous return](venous-return.md) · [Quick start](quick-start.md) · [Validation](validation.md)
