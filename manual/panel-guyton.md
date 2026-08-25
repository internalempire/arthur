# The Guyton diagram

> The Guyton panel places a measured respiratory path over a steady-state construction. The path shows what venous inflow does during breathing; the two central points compare mean venous inflow over a complete breath with the equilibrium predicted by the curves.

---

## Physiology

Steady flow through the circulation must satisfy two conditions at the same time: blood must be able to return from the systemic veins, and the heart must be able to eject it. The venous-return curve falls as right atrial pressure approaches mean systemic filling pressure. The cardiac-function curve rises as right-sided filling increases and then approaches a plateau. Their intersection is the predicted steady operating point.

In classical diagrams the ascending relation is often called the **cardiac-function** or **cardiac-output** curve. The model labels it **RV function** because its horizontal input is right atrial pressure and its calculation concerns the right ventricle. It estimates how RV output changes with filling, contractility and the pulmonary arterial load currently facing the RV. It is not an independently calculated LV-function curve.

At very low right atrial pressure, venous return no longer rises linearly because the great intrathoracic veins begin to collapse. The model therefore draws a vascular-waterfall plateau rather than extending the descending curve indefinitely.

## How to read the panel

Right atrial pressure is on the horizontal axis and flow is on the vertical axis. The venous-return curve slopes downward; the RV-function curve slopes upward. The highlighted part of the RV curve identifies the region where additional filling is predicted to raise RV output meaningfully.

The axes remain fixed while one set of controls is running, so respiratory movement is movement of the curves and points rather than movement of the graph paper. The panel starts with headroom around the current state and expands only if a curve marker or measured occlusion point would otherwise leave the visible range. Selecting another scenario or changing a control starts a new fitted view.

The panel shows three related but different things:

- **inflow path**, the faint trail, is built from consecutive one-heartbeat means of right atrial pressure and IVC-to-right-atrial venous inflow. Averaging over one heartbeat removes the atrial pressure waves but deliberately preserves movement through the breath;
- **mean venous inflow**, the filled point, uses the same two variables averaged over the most recent complete respiratory cycle. It is measured from the integrated circulation. Its flow coordinate is not RV output, LV output or cardiac output;
- **predicted equilibrium**, the hollow point, is where the respiratory-mean venous-return and local RV-function curves cross. At that point, predicted venous return equals predicted RV output.

These labels name the quantities rather than the way they were calculated. The filled and hollow points are therefore not two methods for measuring cardiac output: one is measured venous inflow, while the other is a predicted steady-flow crossing.

The vertical Ppl marker is the respiratory-mean pleural pressure and provides an external-pressure reference. It is not the exact horizontal intercept of the locally anchored RV curve, because the relation also preserves the pressure difference between mean right atrial pressure and RV end-diastolic filling.

In a settled periodic state, every cardiovascular compartment returns to the same volume at the end of each complete respiratory cycle. Mean venous return, mean RV output and mean LV output must therefore be equal over that interval. The filled and hollow points should consequently lie close together in a healthy passive simulation. Their agreement is assessed over a **whole breath**, not at the end of each heartbeat.

This distinction matters because the cardiac and respiratory clocks are not normally synchronized. One heartbeat may occur mainly during inspiration and the next mainly during expiration. Ending a heartbeat does not empty the IVC, right heart and pulmonary vascular bed back to their previous volumes.

## Why the respiratory trail does not collapse to one point

Within a breath, the right heart can temporarily store blood:

$$
\frac{dV_{right}}{dt} = \dot{Q}_{vr} - \dot{Q}_{rv}
$$

- $V_{right}$ — blood contained in the right atrium and ventricle, mL
- $\dot{Q}_{vr}$ — venous inflow entering the right heart, mL/s
- $\dot{Q}_{rv}$ — flow ejected by the RV into the pulmonary circulation, mL/s

When venous inflow exceeds RV output, right-heart volume rises temporarily. When RV output later exceeds inflow, the stored blood is released. The compliant IVC provides an additional short buffer upstream, and the pulmonary circulation provides another store between RV output and LV filling.

The faint trail is therefore expected to remain visible even when the two respiratory-mean points overlap. It is the dynamic heart–lung interaction, not a failure of convergence. It remains attached to measured venous inflow: drawing a trail from successive predicted crossings would hide the temporary storage and phase lag that the trail is intended to show.

### Spontaneous breathing and high RV afterload

During spontaneous inspiration, falling pleural pressure can lower right atrial pressure and accelerate venous return before the RV can pass that extra inflow through the lungs. The trail may therefore widen substantially.

In pulmonary embolism or severe RV pressure loading, the RV and pulmonary circulation can delay transmission even more. The trail can be broad while the respiratory-mean points remain close. The width or shape of that trail is not a validated severity index and must not be interpreted as the amount of blood stored in a particular compartment.

## How the local RV-function curve is constructed

The RV curve is a local analytic description of the integrated ventricle, not a second independent cardiac model.

The model first averages right atrial pressure, RV end-diastolic volume, RV end-systolic volume, heart rate and RV contractility over one respiratory cycle. The measured RV volumes identify where the running ventricle actually sits on its filling and ejection relations. This is important because mean right atrial pressure is not identical to RV end-diastolic transmural pressure: atrial contraction, the tricuspid pressure gradient and the pressure surrounding the heart lie between the two.

Stroke volume is:

$$
SV_{rv} = EDV_{rv} - ESV_{rv}
$$

The curve uses a volume-consistent estimate of effective arterial elastance:

$$
E_a = \frac{E_{es}(ESV_{rv}-V_0)}{SV_{rv}}
$$

- $E_a$ — effective RV arterial load used by the local curve, mmHg/mL
- $E_{es}$ — selected RV end-systolic elastance, mmHg/mL
- $V_0$ — zero-pressure volume of the RV end-systolic relation, mL

The calculation then asks how RV end-diastolic volume and stroke volume would change if right atrial pressure moved away from that measured operating state while contractility and effective arterial load remained fixed. Predicted RV output is:

$$
\dot{Q}_{rv,predicted} = SV_{rv,predicted} \times HR
$$

Anchoring the curve to the respiratory-mean chamber volumes avoids pairing mean right atrial pressure with the end-systolic pressure of one arbitrarily phased heartbeat. It does not make the curve an external validation of the model: the curve is deliberately a local summary of the model’s own current RV mechanics.

The function name in the code remains `cardiacFunctionCurve`, reflecting conventional Guyton terminology, but the calculation is right-ventricular.

## Occlusion points

End-expiratory and end-inspiratory holds add square measured points: mean right atrial pressure and venous inflow during the final part of each occlusion. With two or more points, a dashed regression line is drawn and its zero-flow intercept is labelled **extrapolated**. That intercept is not the model’s directly known Pmsf; respiratory holds also change abdominal pressure and may sample shifted relations. See [Pmsf and occlusions](pmsf-and-occlusions.md).

## Limits

- The venous-return curve represents one aggregate systemic pathway; SVC and IVC return are not modelled separately.
- The filled point reports IVC-to-right-atrial inflow, not SVC flow or cardiac output.
- Averaging over one breath assumes a settled, approximately periodic state. Immediately after changing a control, the filled and hollow points may separate while blood volumes redistribute.
- The local RV curve is anchored to simulated RV volumes. Agreement between the two points is therefore an internal consistency check, not independent physiological validation.
- The curve holds contractility and effective pulmonary arterial load fixed while right atrial pressure is swept. It does not reproduce a new closed-loop beat at every point.
- Pmsf is exactly accessible as an internal model variable but is not directly measurable in vivo.
- The highlighted steep limb is an internal preload-reserve coefficient, not a validated fluid-responsiveness test.
- Occlusion points are idealised and do not include changes in vascular tone, stress relaxation or clinical measurement error.

## References

- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol*. 1955;180:463–468. [doi:10.1152/ajplegacy.1955.180.3.463](https://doi.org/10.1152/ajplegacy.1955.180.3.463)
- Guyton AC, Lindsey AW, Abernathy B, Richardson T. Venous return at various right atrial pressures and the normal venous return curve. *Am J Physiol*. 1957;189:609–615. [doi:10.1152/ajplegacy.1957.189.3.609](https://doi.org/10.1152/ajplegacy.1957.189.3.609)
- Henderson WR, Griesdale DEG, Walley KR, Sheel AW. Clinical review: Guyton — the role of mean circulatory filling pressure and right atrial pressure in controlling cardiac output. *Crit Care*. 2010;14:243. [doi:10.1186/cc9247](https://doi.org/10.1186/cc9247)
- Magder S. Bench-to-bedside review: an approach to hemodynamic monitoring—Guyton at the bedside. *Crit Care*. 2012;16:236. [doi:10.1186/cc11395](https://doi.org/10.1186/cc11395)

---

## See also

[Venous return](venous-return.md) · [Inferior vena cava](inferior-vena-cava.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Preload reserve](preload-reserve.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [Manoeuvres](manoeuvres.md)
