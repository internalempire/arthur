# Venous return

> Flow back to the heart is driven by the difference between the pressure filling the venous reservoir and the pressure in the right atrium. In the model, steady flow is predicted where venous return equals the output of the RV-function curve; systemic cardiac output becomes equal to that flow only at whole-circuit steady state.

---

## Physiology

The systemic circulation holds most of its blood on the venous side, at low pressure. If the heart were stopped, pressures would equalise at a value set by the blood volume and the compliance of the vessels holding it: the **mean systemic filling pressure**, around 7–10 mmHg. That pressure is the upstream head for the return of blood to the chest.

Flow back to the right atrium is then:

$$
\dot{Q}_{vr} = \frac{P_{msf} - P_{ra}}{R_{vr}}
$$

- $\dot{Q}_{vr}$ — venous return, L/min
- $P_{msf}$ — mean systemic filling pressure, mmHg: the pressure the venous reservoir would settle at if flow stopped
- $P_{ra}$ — right atrial pressure, mmHg
- $R_{vr}$ — resistance to venous return, mmHg·min/L

Two features of this expression carry most of the clinical content.

**The driving gradient is small.** A few millimetres of mercury separate the reservoir from the right atrium. A change in right atrial pressure that would be trivial on the arterial side — 3 mmHg — is a large fraction of this gradient. Anything that raises right atrial pressure, including [pleural pressure](pleural-pressure.md) transmitted from a ventilator, therefore cuts venous return substantially.

**Raising right atrial pressure reduces flow.** This is the sense in which "the heart limits its own filling". A ventricle that fails and backs up raises the pressure it must fill against.

### The Guyton construction

Two relations run in opposite directions against the same variable. Venous return **falls** as right atrial pressure rises. The traditional cardiac-function relation **rises**, because a fuller heart can eject more. In the model this second relation is specifically calculated from the **right ventricle**: right atrial pressure determines RV filling, and RV contractility and pulmonary arterial load determine predicted RV output. The curves cross where predicted venous return equals predicted RV output.

That crossing is often labelled cardiac output in a Guyton diagram. This is valid as a steady-state shorthand: after the complete serial circulation settles, venous return, RV output and LV output must have the same mean value. It does not mean that the model's ascending curve directly calculates LV performance.

![Venous return and predicted RV output at two levels of PEEP](figure/guyton-peep.svg)

The construction earns its place because it separates two questions that a single cardiac output number confuses. In the model, the position on the **RV-function curve** asks whether more right-sided filling can raise predicted RV output: on its ascending limb, it can; on its plateau, additional filling mainly raises filling pressure. Giving volume also shifts the venous-return curve to the right by raising mean systemic filling pressure, and the new predicted steady flow is the intersection of both relations — see [preload reserve](preload-reserve.md).

This must not be confused with the **plateau of the venous return curve** at very low right atrial pressure. That plateau reflects collapse of the great veins and limits the maximum venous return; it is not the flat limb of the Frank–Starling relation.

It also shows why PEEP can cost output. Raising PEEP shifts the RV-function curve rightward, because the RV now sits inside a higher surrounding pressure and needs a higher measured atrial pressure to reach the same transmural filling. The crossing moves to a lower predicted flow at a higher right atrial pressure — exactly the pattern in [transmural pressure](transmural-pressure.md), seen graphically.

### The venous-return plateau is not a Frank–Starling phenomenon

The plateau of the venous return curve is often attributed to the heart. It is not: it is the great veins collapsing as the pressure inside them falls below the pressure outside. That mechanism has its own page — see [vascular waterfalls](vascular-waterfalls.md).

---

## In the model

Venous return has **one definition**, used by both the integrator and the drawn curve:

```
venousReturnFlow(pmsf, pra, pCrit, rvr)
```

This matters more than it sounds. When the plot computed the curve independently, the two drifted apart, and the diagram showed a construction the model was not obeying. The panel and the integrator now call the same function, so the curve cannot lie about the model.

Mean systemic filling pressure comes from the [stressed volume](stressed-volume.md) of the venous reservoir divided by its compliance, plus the [abdominal](abdominal-pressure.md) contribution where the reservoir is distended enough to have one.

### The two marks on the diagram

The panel combines a measurement from the running circulation with a theoretical steady-state construction:

- **the filled simulated point** plots right atrial pressure against IVC-to-right-atrial venous inflow. Both are averaged over the most recent heartbeat. Its flow coordinate is not RV output, LV output or cardiac output;
- **the hollow equilibrium point** is the crossing of the analytic venous-return and RV-function curves. It predicts where venous return and RV output would become equal if the current conditions were held constant long enough. It becomes a prediction of systemic cardiac output only under the additional steady-state assumption that RV and LV output have also equilibrated.

The one-heartbeat averaging window removes cardiac pulsation while deliberately preserving respiratory movement. The filled point therefore follows venous inflow through the breath; the hollow point does not claim to be a second measurement of the same instantaneous flow.

At steady state, mean venous return and cardiac output must be equal. Within a breath they may differ because the right heart can temporarily store blood:

$$
\frac{dV_{right}}{dt} = \dot{Q}_{vr} - \dot{Q}_{rv}
$$

- $V_{right}$ — blood contained in the right atrium and ventricle, mL
- $\dot{Q}_{vr}$ — venous inflow entering the right heart, mL/s
- $\dot{Q}_{rv}$ — flow ejected by the RV, mL/s

If venous inflow rises before the RV can eject it, right-heart volume increases temporarily. If inflow later falls below RV output, that stored volume is released. The pulmonary circulation adds a second store between RV output and LV inflow. The diagram shows venous inflow but does not display actual RV output as a separate point, so the distance between the filled and hollow points is not a direct measure of either store.

This distinction is especially important in pulmonary embolism. A spontaneous inspiration can increase venous return immediately, while a pressure-loaded RV and the pulmonary circulation transmit a much smaller or delayed change to LV output. A broad filled-point path can therefore be physiologically coherent. A persistent mean separation can also expose the limits of the simplified analytic cardiac curve under severe RV pressure loading; it must not automatically be interpreted as physiology.

### What the model shows

A passive patient at 500 mL, 14 breaths per minute:

<!-- BEGIN GENERATED: venous-return-peep -->
*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s. The displayed right atrial pressure is averaged over one cardiac cycle, as in the moving Guyton point; this suppresses cardiac pulsation but preserves respiratory movement.*

| PEEP (cmH₂O) | P<sub>msf</sub> (mmHg) | mean P<sub>ra</sub> (mmHg) | cardiac output (L/min) |
|---:|---:|---:|---:|
| 0 | 7.5 | -0.9 | 5.45 |
| 5 | 9.0 | 0.7 | 5.36 |
| 10 | 10.2 | 2.2 | 4.99 |
| 15 | 11.3 | 3.8 | 4.61 |
| 20 | 12.4 | 5.4 | 4.32 |
<!-- END GENERATED: venous-return-peep -->

Mean systemic filling pressure *rises* with PEEP — the abdominal contribution and the compression of the reservoir see to that — and output falls anyway, because right atrial pressure rises faster than the head does. The gradient is what matters, not either end of it.

---

## Why this and not something else

The model integrates a closed loop and *derives* the Guyton diagram from it, rather than using the diagram as the model. A pure Guyton model — two curves and their intersection — is a useful teaching device but cannot show breath-by-breath behaviour or temporary blood storage. Here, separating the measured point from the calculated crossing makes both the dynamic physiology and the approximation visible. A small separation may reflect a circulation in motion; a large or persistent separation may also reveal that the local analytic RV curve is inadequate for the current state.

Venous return uses a soft collapse law rather than a hard `max()`, for reasons given under [vascular waterfalls](vascular-waterfalls.md).

The resistance to venous return is a single control. Splitting it into the several parallel beds that a real circulation drains through — with their own compliances and time constants — would be more faithful and would make the reservoir's response to a fluid bolus time-dependent. It was not done: one reservoir keeps volume conservation checkable and keeps the diagram legible, which is what the construction is for.

---

## Limits

### Of the construction

- **One venous reservoir.** No splanchnic, cutaneous or muscular capacitance beds, and therefore no redistribution between fast and slow compartments. A fluid bolus arrives instantaneously in one place.
- **No stress relaxation, no transcapillary escape, no distribution kinetics.** Volume added stays where it is put.
- **The resistance to venous return is a constant** apart from the abdominal term. It does not vary with flow, tone or vessel calibre.
- **The Guyton diagram is a steady-state construction** applied to a non-steady state. Respiratory variation and temporary blood storage can separate the filled point from the crossing.
- **The analytic curve represents the RV, not an independent biventricular or LV function curve.** It does not reproduce every consequence of RV dilation, ventricular interdependence, pulmonary transit, LV limitation or volume history. In severe RV pressure loading, including pulmonary embolism, a persistent gap may be a construction error as well as a dynamic physiological signal.
- **The filled point is venous inflow, not cardiac output.** Its height must not be read as simultaneous RV or LV forward flow.
- Mean systemic filling pressure here is computed from the model's own state. It is an internal quantity, not the thing an occlusion manoeuvre measures — see [Pmsf and occlusions](pmsf-and-occlusions.md).

### Of clinical application

- **No number on this diagram is a target.** The construction shows the shape of a patient's reserve, not a value to resuscitate towards.
- The model's mean systemic filling pressure is exact and always available. At the bedside it is not measurable without a manoeuvre whose own assumptions are questionable, and the model deliberately shows how far that manoeuvre's estimate can sit from the truth.
- Preload responsiveness in this model is a movement along its own curves in response to its own stressed-volume control. That is not the same as a patient's response to 500 mL of crystalloid, which redistributes.

---

## References

- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol* 1955;180:463–8. [doi:10.1152/ajplegacy.1955.180.3.463](https://doi.org/10.1152/ajplegacy.1955.180.3.463)
- Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various right atrial pressures and the normal venous return curve. *Am J Physiol* 1957;189:609–15. [doi:10.1152/ajplegacy.1957.189.3.609](https://doi.org/10.1152/ajplegacy.1957.189.3.609)
- Magder S. Volume and its relationship to cardiac output and venous return. *Crit Care* 2016;20:271. [doi:10.1186/s13054-016-1438-7](https://doi.org/10.1186/s13054-016-1438-7)
- Berger D, Moller PW, Weber A, et al. Effect of PEEP, blood volume, and inspiratory hold maneuvers on venous return. *Am J Physiol Heart Circ Physiol* 2016;311:H794–H806. [doi:10.1152/ajpheart.00931.2015](https://doi.org/10.1152/ajpheart.00931.2015)
- Henderson WR, Griesdale DEG, Walley KR, Sheel AW. Clinical review: Guyton — the role of mean circulatory filling pressure and right atrial pressure in controlling cardiac output. *Crit Care* 2010;14:243. [doi:10.1186/cc9247](https://doi.org/10.1186/cc9247)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Venous tone](venous-tone.md) · [Abdominal pressure](abdominal-pressure.md) · [Inferior vena cava](inferior-vena-cava.md) · [Preload reserve](preload-reserve.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [The Guyton panel](panel-guyton.md)
