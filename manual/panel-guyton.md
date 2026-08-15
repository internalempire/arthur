# The Guyton diagram

> The Guyton panel places venous return and cardiac function on the same right-atrial-pressure axis, while keeping the simulated operating point separate from the analytic crossing.

---

## Physiology

Steady flow through the circulation must satisfy both the peripheral ability to return blood and the heart's ability to eject it. A venous-return curve falls as right atrial pressure approaches mean systemic filling pressure; a cardiac-function curve rises with transmural filling and then approaches a plateau. Their intersection is the graphical steady operating point.

At sufficiently low right atrial pressure, venous return no longer rises linearly because intrathoracic veins collapse. The model draws this waterfall plateau rather than extending a straight line indefinitely.

## How to read the panel

Right atrial pressure is on the horizontal axis and flow on the vertical axis. The venous-return curve slopes downward; the cardiac-function curve slopes upward. The highlighted part of the cardiac curve marks where more filling meaningfully raises output.

The filled point labelled *simulated* is the circulation's cycle-mean right atrial pressure and flow. The hollow point is the intersection calculated from the two analytic curves. They are expected to be close but not identical because the integrated circulation is pulsatile and nonlinear.

The vertical Ppl marker shows where surrounding thoracic pressure anchors the cardiac-function relation. The faint trail is the path walked by the simulated operating point over recent breaths.

## Occlusion points

End-expiratory and end-inspiratory holds add square measured points: mean right atrial pressure and flow during the final part of each occlusion. With two or more points, a dashed regression line is drawn and its zero-flow intercept is labelled **extrapolated**. That intercept is not the model's directly known Pmsf; respiratory holds also change abdominal pressure and may sample shifted relations. See [Pmsf and occlusions](pmsf-and-occlusions.md).

## In the model

All coordinates on this panel use cycle means. The cardiac-function curve is a single-beat approximation around the current model state, while the filled operating point comes from numerical integration. The venous-return curve includes stressed volume, venous compliance, abdominal pressure, resistance to return and the caval waterfall.

## Limits

- The curves describe one aggregate systemic venous return pathway; SVC and IVC are not separated.
- Pmsf is exactly accessible as an internal model variable but not directly measurable in vivo.
- The cardiac-function curve compresses biventricular and pulmonary-transit behaviour into a local construction.
- A steep highlighted limb is an internal preload-reserve coefficient, not a validated fluid-responsiveness test.
- Occlusion points are idealised and do not include changes in vascular tone, stress relaxation or clinical measurement error.

## References

- Guyton AC, Lindsey AW, Kaufmann BN. Effect of mean circulatory filling pressure and other peripheral circulatory factors on cardiac output. *Am J Physiol*. 1955;180:463–468.
- Maas JJ, Geerts BF, van den Berg PCM, et al. Assessment of venous return curve and mean systemic filling pressure in postoperative cardiac surgery patients. *Crit Care Med*. 2009;37:912–918. [doi:10.1097/CCM.0b013e3181961481](https://doi.org/10.1097/CCM.0b013e3181961481)
- Persichini R, Silva S, Teboul JL, et al. Effects of norepinephrine on mean systemic pressure and venous return in human septic shock. *Crit Care Med*. 2012;40:3146–3153. [doi:10.1097/CCM.0b013e318260c6c3](https://doi.org/10.1097/CCM.0b013e318260c6c3)

---

## See also

[Venous return](venous-return.md) · [Vascular waterfalls](vascular-waterfalls.md) · [Preload reserve](preload-reserve.md) · [Pmsf and occlusions](pmsf-and-occlusions.md) · [Manoeuvres](manoeuvres.md)
