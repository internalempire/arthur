# The Guyton diagram

> The Guyton panel combines a theoretical steady-state construction with the circulation that is actually being simulated. The two points answer different questions and should not be read as duplicate measurements of cardiac output.

---

## Physiology

Steady flow through the circulation must satisfy both the peripheral ability to return blood and the heart's ability to eject it. A venous-return curve falls as right atrial pressure approaches mean systemic filling pressure; a cardiac-function curve rises with transmural filling and then approaches a plateau. Their intersection is the graphical steady operating point.

In the classical Guyton construction, the ascending relation is often called the **cardiac-function** or **cardiac-output** curve. The model implements it more specifically as an **RV-function curve** because its horizontal input is right atrial pressure. It predicts how much the RV could eject from its filling, contractility and current pulmonary arterial load. It is not an independently calculated LV-function curve.

At sufficiently low right atrial pressure, venous return no longer rises linearly because intrathoracic veins collapse. The model draws this waterfall plateau rather than extending a straight line indefinitely.

## How to read the panel

Right atrial pressure is on the horizontal axis and flow on the vertical axis. The venous-return curve slopes downward; the model RV-function curve slopes upward. The highlighted part of the RV curve marks where more filling meaningfully raises predicted RV output.

The graph superimposes two different layers:

- **the filled simulated point** is a measurement from the running model. Its horizontal coordinate is right atrial pressure averaged over the most recent heartbeat. Its vertical coordinate is venous inflow from the inferior vena cava into the right atrium, averaged over the same heartbeat. It is **not** RV output, LV output or cardiac output;
- **the hollow analytic point** is the crossing predicted by the venous-return and RV-function curves under the current conditions. More precisely, it is where predicted venous return equals predicted RV output. Only after the whole serial circulation has reached steady state can that common flow also be called LV output or systemic cardiac output.

Using one cardiac cycle suppresses the rapid cardiac pulsation without averaging away the respiratory change. The filled point can therefore move around the graph during a breath. The faint trail shows that recent venous-inflow path over approximately 12 seconds; it is not a cardiac-output loop.

At sustained steady state, venous return, RV output and LV output have the same mean value. They need not be equal at every moment within a breath. The right heart can temporarily store blood:

$$
\frac{dV_{right}}{dt} = \dot{Q}_{vr} - \dot{Q}_{rv}
$$

- $V_{right}$ — blood contained in the right atrium and ventricle, mL
- $\dot{Q}_{vr}$ — venous inflow entering the right heart, mL/s
- $\dot{Q}_{rv}$ — flow ejected by the RV into the pulmonary circulation, mL/s

When inflow exceeds RV output, the right heart fills; when RV output exceeds inflow, it empties blood stored earlier in the breath. The pulmonary circulation can likewise store blood when RV output and LV inflow differ. The panel plots only the first inflow in this serial pathway and does not separately plot actual RV output, so the vertical distance between the two displayed points must not be used as a direct measure of blood storage.

The vertical Ppl marker shows where surrounding thoracic pressure helps anchor the RV-function relation.

### Why the points can separate in pulmonary embolism

During spontaneous inspiration, falling pleural pressure can lower right atrial pressure and transiently accelerate venous return. In pulmonary embolism, the pressure-loaded RV cannot necessarily pass that extra inflow into the pulmonary circulation within the same heartbeat. The filled point can therefore travel through a broad respiratory path while actual RV and LV output vary less.

A persistent separation from the hollow point has a second meaning: the analytic RV-function curve is only a local, single-beat approximation. It is most reliable near ordinary loading conditions and less faithful when the RV is markedly dilated or faces high afterload. The distance between the points is therefore partly a visible consequence of non-steady flow and partly a limit of the analytic construction. It is not, by itself, a physiological measurement or a severity index.

## Occlusion points

End-expiratory and end-inspiratory holds add square measured points: mean right atrial pressure and flow during the final part of each occlusion. With two or more points, a dashed regression line is drawn and its zero-flow intercept is labelled **extrapolated**. That intercept is not the model's directly known Pmsf; respiratory holds also change abdominal pressure and may sample shifted relations. See [Pmsf and occlusions](pmsf-and-occlusions.md).

## In the model

The filled point uses numerical integration and a rolling window of one cardiac cycle for both coordinates. The analytic venous-return curve includes stressed volume, venous compliance, abdominal pressure, resistance to return and the caval waterfall.

For each right atrial pressure on the ascending curve, the model:

1. subtracts pleural and pericardial pressure to obtain RV transmural filling pressure;
2. uses the RV diastolic pressure–volume relation to estimate RV end-diastolic volume;
3. combines RV contractility with the effective pulmonary arterial load measured from the current beat to estimate RV stroke volume;
4. multiplies that stroke volume by heart rate to obtain predicted RV output.

Thus the curve ordinate is:

$$
\dot{Q}_{rv,predicted} = SV_{rv,predicted} \times HR
$$

- $\dot{Q}_{rv,predicted}$ — output predicted for the RV at that filling pressure, L/min
- $SV_{rv,predicted}$ — predicted RV stroke volume, L/beat
- $HR$ — effective heart rate, beats/min

The function name in the code remains `cardiacFunctionCurve`, reflecting conventional Guyton terminology, but the calculation is right-ventricular.

## Limits

- The curves describe one aggregate systemic venous return pathway; SVC and IVC are not separated.
- Pmsf is exactly accessible as an internal model variable but not directly measurable in vivo.
- The RV-function curve does not independently calculate LV filling or LV output. Calling its ordinate systemic cardiac output is justified only at the predicted steady-state intersection.
- The curve holds the current external pressures and effective pulmonary arterial load while sweeping right atrial pressure. It therefore compresses ventricular interaction, pulmonary transit and volume history into a local approximation, and can materially underestimate simulated forward flow in severe RV pressure loading.
- The simulated point reports IVC-to-right-atrial inflow, not SVC flow or cardiac output.
- Point separation cannot be assigned entirely to physiology: part may come from the analytic approximation itself.
- A steep highlighted limb is an internal preload-reserve coefficient, not a validated fluid-responsiveness test.
- Occlusion points are idealised and do not include changes in vascular tone, stress relaxation or clinical measurement error.

## References

- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol*. 1955;180:463–468. [doi:10.1152/ajplegacy.1955.180.3.463](https://doi.org/10.1152/ajplegacy.1955.180.3.463)
- Maas JJ, Geerts BF, van den Berg PCM, et al. Assessment of venous return curve and mean systemic filling pressure in postoperative cardiac surgery patients. *Crit Care Med*. 2009;37:912–918. [doi:10.1097/CCM.0b013e3181961481](https://doi.org/10.1097/CCM.0b013e3181961481)
- Persichini R, Silva S, Teboul JL, et al. Effects of norepinephrine on mean systemic pressure and venous return in human septic shock. *Crit Care Med*. 2012;40:3146–3153. [doi:10.1097/CCM.0b013e318260c6c3](https://doi.org/10.1097/CCM.0b013e318260c6c3)

---

## See also

[Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Preload reserve](preload-reserve.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [Manoeuvres](manoeuvres.md)
