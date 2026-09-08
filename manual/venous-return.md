# Venous return

> Flow back to the heart depends on systemic filling pressure, right atrial pressure and resistance to return. The default Guyton panel compares that return relation with a continuously updated local RV-function curve. Optional Deep CO measures whole-heart output at the LV outlet; all serial mean flows agree only after the circulation settles.

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

**Caval flow can briefly reverse.** A rise in atrial pressure can send blood back towards the veins. Doppler recordings in 40 healthy adults found small backward components around atrial contraction and after the second heart sound; these were least frequent in the IVC (Maeda et al., 1991). This supports allowing reversal, but does not calibrate its volume in Arthur. Caval backflow is distinct from tricuspid regurgitation. Over a measurement window, **net venous inflow is forward volume minus backward volume, divided by elapsed time**.

### The Guyton construction

The descending relation describes return from the systemic veins. The default ascending relation estimates RV output from right atrial filling, RV mechanics and pulmonary load. Both formulas update continuously from the displayed circulation. They share right atrial pressure as the horizontal coordinate. The optional Deep CO analysis includes both ventricles and measures aortic output in separate loading simulations; it is not required to use the dynamic diagram.

![Venous return and local RV function at two levels of PEEP](figure/guyton-peep.svg)

Giving volume can move the venous-return relation by raising systemic filling pressure. Whether flow rises depends on the whole-heart response and the new loading conditions. The [RV preload-reserve coefficient](preload-reserve.md) uses the local right-sided approximation highlighted in the fast view. It does not independently test LV reserve.

Positive pressure changes both cardiac loading and systemic return. Atmospheric right atrial pressure can rise while its transmural component falls; the direction of a plotted shift must therefore be interpreted with its pressure reference. A fall in excessive filling pressure can be useful even without increased flow. A single changed operating point does not identify an entire new cardiac-function relation.

### The venous-return plateau is not a Frank–Starling phenomenon

The plateau of the venous return curve is often attributed to the heart. It is not: it is the great veins collapsing as the pressure inside them falls below the pressure outside. That mechanism has its own page — see [vascular waterfalls](vascular-waterfalls.md).

---

## In the model

The integrated circulation and the analytic curve describe the same pathway at different resolutions.

The integrator separates the systemic venous reservoir, a compliant IVC and the right atrium. The selected resistance to venous return is divided into an upstream segment and a collapsible downstream segment. This allows the IVC to store a small amount of blood and delay transmission during a breath.

The caval segment permits flow in either direction. The closing-pressure law limits forward flow from the IVC into the atrium. When right atrial pressure exceeds IVC pressure, the law uses the atrium as the source and the cava as the receiver, and counts the resulting flow as negative. The upstream reservoir-to-IVC segment is forward-only. The [waterfall page](vascular-waterfalls.md) gives the equations and the zero-flow region near pressure equality.

The analytic venous-return curve reduces the two resistances to their sum and uses the shared forward closing-pressure law. It is a forward-return approximation constructed from mean determinants. In a pulsatile circulation, applying a nonlinear law to mean pressures need not reproduce the mean of actual signed flow, even after net storage has settled. The curve therefore need not pass through the measured mean inflow marker. This distinction is particularly visible with pulmonary embolism and brief caval backflow.

The fast **Live** view uses one-heartbeat averages for both RV and venous-return determinants, preserving respiratory movement. **Mean** uses respiratory averages for both. In optional deep mode, VR mean uses the separately settled reference conditions and VR live uses instantaneous return determinants. The predicted crossing is withheld in live views because storage during a breath prevents interpreting it as instantaneous whole-circuit equilibrium.

Mean systemic filling pressure comes from the [stressed volume](stressed-volume.md) of the venous reservoir divided by its compliance, plus the [abdominal](abdominal-pressure.md) contribution where the reservoir is distended enough to have one.

### The marks on the diagram

The faint inflow path uses one-heartbeat mean RAP and net IVC-to-right-atrial inflow. The dark mean venous-inflow marker uses a complete respiratory cycle in both Live and Mean. The hollow predicted-equilibrium point is the crossing of the two analytic curves, displayed only in Mean. Optional Deep CO adds a red mean LV-output marker and replaces the ascending relation with a separately settled whole-heart response. See [the Guyton panel](panel-guyton.md) for its loading protocol and calculation status.

The respiratory markers remove much of the within-breath variation but a beat or a breath need not return every compartment to exactly the same volume when the cardiac and respiratory clocks are not commensurate. The optional deep response uses complete minute windows and explicitly checks flow agreement and storage. During an intervention, differences between venous inflow and aortic output can be caused by redistribution.

At steady state, mean venous return and cardiac output must be equal. Within a breath they may differ because the right heart can temporarily store blood:

$$
\frac{dV_{right}}{dt} = \dot{Q}_{vr} - \dot{Q}_{rv}
$$

- $V_{right}$ — blood contained in the right atrium and ventricle, mL
- $\dot{Q}_{vr}$ — venous inflow entering the right heart, mL/s
- $\dot{Q}_{rv}$ — flow ejected by the RV, mL/s

If venous inflow rises before the RV can eject it, right-heart volume increases temporarily. If inflow later falls below RV output, that stored volume is released. The pulmonary circulation adds a second store between RV output and LV inflow. The respiratory trail shows the combined dynamic consequence but cannot identify how much blood sits in each store.

This distinction is especially important in pulmonary embolism. A spontaneous inspiration can increase venous return immediately, while a pressure-loaded RV and the pulmonary circulation transmit a smaller or delayed change to LV output. A broad trail can therefore be physiologically coherent even when the two respiratory-mean points agree.

### What the model shows

A passive patient at 500 mL, 14 breaths per minute:

<!-- BEGIN GENERATED: venous-return-peep -->
*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s. Right atrial pressure is averaged over the most recent complete respiratory cycle, as in the filled simulated-mean point on the Guyton panel.*

| PEEP (cmH₂O) | P<sub>msf</sub> (mmHg) | mean P<sub>ra</sub> (mmHg) | cardiac output (L/min) |
|---:|---:|---:|---:|
| 0 | 7.2 | -0.5 | 5.56 |
| 5 | 8.6 | 1.2 | 5.55 |
| 10 | 9.7 | 2.8 | 5.30 |
| 15 | 10.8 | 4.4 | 4.89 |
| 20 | 11.9 | 6.0 | 4.60 |
<!-- END GENERATED: venous-return-peep -->

Mean systemic filling pressure *rises* with PEEP — the abdominal contribution and the compression of the reservoir see to that — and output falls anyway, because right atrial pressure rises faster than the head does. The gradient is what matters, not either end of it.

---

## Why this and not something else

The model integrates a closed loop and derives a separate Guyton analysis from its equations. Two curves and their intersection alone cannot show breath-by-breath storage. The trail retains one-heartbeat means and the measured mean markers use respiratory means. The fast relations share the selected heartbeat (Live) or respiratory (Mean) clock; optional deep relations use separately settled minute windows.

The default RV curve is a local analytic relation anchored to RV volumes on the selected heartbeat (Live) or respiratory (Mean) clock. Optional Deep CO measures a whole-heart response in disposable loading experiments conditioned on a settled reference. The normalized inflow waveform and systemic source-pressure/respiratory trajectories are shared across the copies; cardiac and pulmonary dynamics remain active. Agreement at the unperturbed reference is an internal consistency check. The [panel page](panel-guyton.md) describes rejected ranges, numerical checks and the fixed-autonomic-drive boundary.

Venous return uses a soft collapse law rather than a hard `max()`, for reasons given under [vascular waterfalls](vascular-waterfalls.md).

The resistance to venous return is a single control. One systemic reservoir keeps volume conservation explicit and the diagram legible. Separate regional beds with different compliances, emptying times and fluid-distribution kinetics are outside this representation.

---

## Limits

### Of the construction

- **One venous reservoir.** No splanchnic, cutaneous or muscular capacitance beds, and therefore no redistribution between fast and slow compartments. A fluid bolus arrives instantaneously in one place.
- **No stress relaxation, no transcapillary escape, no distribution kinetics.** Volume added stays where it is put.
- **The resistance to venous return is constant in a normally filled circulation.** An additional abdominal contribution is confined to the upstream segment when both the systemic reservoir and IVC are poorly distended. It does not otherwise vary with flow, tone or vessel calibre.
- **The Guyton curves are local approximations placed under a dynamic trail.** Live uses heartbeat determinants and Mean uses respiratory determinants. The measured respiratory-mean inflow and the Mean-only predicted crossing have different definitions and need not coincide.
- **The ascending analytic curve represents a local RV relation, not an independent biventricular or LV function curve.** Its RV-volume anchor follows the selected clock and does not reproduce a new closed-loop beat at every pressure on the curve.
- **Caval reversal is an aggregate pressure-driven flow.** Vessel-wall dynamics and a separate superior caval route are absent. The zero-flow region is a mathematical limitation, not a measured physiological threshold.
- **The filled point is venous inflow, not cardiac output.** Its height must not be read as simultaneous RV or LV forward flow.
- Mean systemic filling pressure here is computed from the model's own state. It is an internal quantity, not the thing an occlusion manoeuvre measures — see [Pmsf and occlusions](pmsf-and-occlusions.md).

### Of clinical application

- **No number on this diagram is a target.** The construction shows the shape of a patient's reserve, not a value to resuscitate towards.
- The model's mean systemic filling pressure is exact and always available. At the bedside it is not measurable without a manoeuvre whose own assumptions are questionable, and the model deliberately shows how far that manoeuvre's estimate can sit from the truth.
- Preload responsiveness in this model is a movement along its own curves in response to its own stressed-volume control. That is not the same as a patient's response to 500 mL of crystalloid, which redistributes.

---

## References

- Maeda T, Matsuzaki M, Shiomi K, et al. Characteristics of blood flow velocity patterns of central systemic veins in healthy adults assessed by Doppler echocardiography. *Jpn Circ J*. 1991;55:535–542. [doi:10.1253/jcj.55.535](https://doi.org/10.1253/jcj.55.535)
- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol* 1955;180:463–8. [doi:10.1152/ajplegacy.1955.180.3.463](https://doi.org/10.1152/ajplegacy.1955.180.3.463)
- Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various right atrial pressures and the normal venous return curve. *Am J Physiol* 1957;189:609–15. [doi:10.1152/ajplegacy.1957.189.3.609](https://doi.org/10.1152/ajplegacy.1957.189.3.609)
- Magder S. Volume and its relationship to cardiac output and venous return. *Crit Care* 2016;20:271. [doi:10.1186/s13054-016-1438-7](https://doi.org/10.1186/s13054-016-1438-7)
- Berger D, Moller PW, Weber A, et al. Effect of PEEP, blood volume, and inspiratory hold maneuvers on venous return. *Am J Physiol Heart Circ Physiol* 2016;311:H794–H806. [doi:10.1152/ajpheart.00931.2015](https://doi.org/10.1152/ajpheart.00931.2015)
- Henderson WR, Griesdale DEG, Walley KR, Sheel AW. Clinical review: Guyton — the role of mean circulatory filling pressure and right atrial pressure in controlling cardiac output. *Crit Care* 2010;14:243. [doi:10.1186/cc9247](https://doi.org/10.1186/cc9247)
- Magder S. Heart–lung interaction in spontaneous breathing subjects: the basics. *Ann Transl Med*. 2018;6:348. [doi:10.21037/atm.2018.06.19](https://doi.org/10.21037/atm.2018.06.19)

---

## See also

[Transmural pressure](transmural-pressure.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Stressed volume](stressed-volume.md) · [Venous tone](venous-tone.md) · [Abdominal pressure](abdominal-pressure.md) · [Inferior vena cava](inferior-vena-cava.md) · [Preload reserve](preload-reserve.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [The Guyton panel](panel-guyton.md)
