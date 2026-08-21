# Ventriculo-arterial coupling

> Time-varying elastance describes ventricular contraction, while effective arterial elastance summarises the load for coupling analysis. Their ratio provides a useful, method-dependent framework for relating contractility, load and stroke volume.

---

## Physiology

### The ventricle as a time-varying elastance

The classical description treats the ventricle not as a pressure generator but as a chamber whose stiffness varies through the cardiac cycle. At any instant

$$
P(t) = E(t)\,\big(V(t) - V_0\big)
$$

- $P(t)$ — instantaneous ventricular pressure, mmHg
- $E(t)$ — instantaneous chamber elastance, mmHg/mL — the stiffness of the ventricle at that moment
- $V(t)$ — instantaneous ventricular volume, mL
- $V_0$ — the volume at which the chamber generates no pressure, mL

$E(t)$ rises from a low diastolic value to a maximum near end-systole. The end-systolic value, $E_{es}$, is the slope of the end-systolic pressure–volume relation and is relatively less load-dependent than ejection fraction or stroke volume, although it is not perfectly load-independent. The end-diastolic pressure–volume relation is the other boundary, curvilinear rather than straight, and its steepness represents diastolic stiffness.

Everything a pressure–volume loop shows sits between these two boundaries: filling along the diastolic relation, isovolumic contraction, ejection ending on the end-systolic relation, isovolumic relaxation.

### The load as an elastance

The arterial system can be summarised, for coupling purposes, by an **effective arterial elastance**:

$$
E_a = \frac{P_{es}}{SV}
$$

- $E_a$ — effective arterial elastance, mmHg/mL
- $P_{es}$ — end-systolic ventricular pressure, mmHg
- $SV$ — stroke volume, mL

This is not a physical stiffness of the aorta. On the pressure–volume plane it is the magnitude of the slope joining the end-systolic point to the zero-pressure point at end-diastolic volume, $(EDV,0)$. It is a lumped summary influenced by resistance, heart rate, timing and arterial compliance in the same units as $E_{es}$.

The ratio $E_{es}/E_a$ describes the match within this lumped framework. Values around 1.5–2 are often reported for the resting normal left ventricle, but the energetic optimum and clinical interpretation depend on ventricular function, loading and method. A lower ratio generally indicates that arterial load is high relative to contractility; it is not a universal treatment threshold.

This framing is what makes vasodilatation a *positive inotropic-like* intervention in a failing ventricle without touching contractility: it lowers $E_a$, which raises the ratio, which raises stroke volume.

### Why it belongs in a heart–lung model

Because ventilation can move both terms. Raised intrathoracic pressure can reduce left ventricular transmural afterload — see [transmural pressure](transmural-pressure.md) — while lung inflation can increase right ventricular load when it moves the lung onto the high-volume limb of [pulmonary vascular resistance](pulmonary-vascular-resistance.md). The net effect depends on lung volume, recruitment, filling and ventricular reserve.

---

## In the model

Both ventricles use a time-varying elastance driven by a double-hill activation waveform normalised to a peak of one. Systolic and diastolic behaviour come from separate terms:

- an end-systolic straight line with slope `eesLv` or `eesRv` and its own unstressed volume;
- an end-diastolic exponential, with the left ventricle's stiffness on the `lvStiff` control and the right ventricle's fixed.

The atria are simpler: a linear elastance swinging between a minimum and a maximum on an atrial activation waveform.

For the ventricles, the duration of activation is not kept at a fixed fraction of every beat. If $T=60/HR$ is the cardiac-cycle duration, the model first defines

$$
T_{max}=0.2+0.15T, \qquad \tau=\frac{t}{T_{max}}
$$

and then uses the standard normalised double-Hill waveform

$$
A(\tau)=1.55
\left[\frac{(\tau/0.7)^{1.9}}{1+(\tau/0.7)^{1.9}}\right]
\left[\frac{1}{1+(\tau/1.17)^{21.9}}\right].
$$

Its peak is approximately one, so the selected $E_{es}$ is the peak active elastance actually reached by the chamber. The $T_{max}$ relation also allows systole to occupy a larger fraction of a short tachycardic cycle instead of shrinking in direct proportion to the whole beat.

Valves are represented as one-way resistances. Flow is computed from the pressure difference and forced to zero when the gradient reverses, so isovolumic phases arise from the pressure relations rather than from explicit cardiac-cycle states.

The right ventricle carries two extra terms from [ventricular interdependence](ventricular-interdependence.md): a diastolic septal shift and a systolic contribution from the left ventricle.

**The model does not compute $E_a$ or the coupling ratio as an output.** They can be derived from what it reports — mean pressure and stroke volume — but they are not tiles, because an effective arterial elastance computed from a cycle mean rather than from end-systolic pressure is a different quantity wearing the same name. See [interpretability](interpretability.md).

### A directional load surrogate

A passive patient at 500 mL and PEEP 5, using mean arterial pressure divided by stroke volume as a **load surrogate**. The failing states use $E_{es}=0.55$ mmHg/mL and the vasoplegic states use a systemic resistance of 0.75 mmHg·s/mL. The result is labelled $MAP/SV$ rather than $E_a$ because effective arterial elastance is conventionally $P_{es}/SV$:

| | ejection fraction | stroke volume | MAP | $MAP/SV$ | $E_{es}/(MAP/SV)$ |
|---|---|---|---|---|---|
| normal | 56.2% | 70 mL | 102 mmHg | 1.47 | 2.05 |
| failing left ventricle | 22.4% | 37 mL | 52 | 1.41 | 0.39 |
| vasoplegia | 61.2% | 73 mL | 80 | 1.09 | 2.76 |
| both | 26.8% | 43 mL | 46 | 1.05 | 0.52 |

The normal row yields 2.05 for this surrogate ratio. It must not be interpreted as a validated normal coupling measurement: replacing end-systolic pressure with MAP changes the quantity, and the model does not reproduce the measurement assumptions used to estimate clinical $E_a$.

The interesting row is the last. Adding vasoplegia to a failing ventricle *raises* stroke volume from 37 to 43 mL while mean pressure falls from 52 to 46 mmHg. Contractility is unchanged; the model ventricle ejects against a lower load, and the $E_{es}/(MAP/SV)$ surrogate rises from 0.39 to 0.52.

---

## Why this and not something else

**Time-varying elastance rather than a Starling curve.** A model that maps filling pressure to stroke volume directly is far simpler and is enough for a Guyton diagram. It cannot produce a pressure–volume loop, cannot separate contractility from load, cannot show isovolumic phases, and cannot show afterload sensitivity — which is most of what a heart–lung simulator has to demonstrate. The [PV loop panel](panel-pv-loops.md) exists because of this choice.

**Resistive valves rather than cardiac-cycle state switches.** The one-way condition avoids explicit event-driven valve states and produces the intended loop phases. Flow is continuous at zero gradient, but its derivative has a corner there; the formulation reduces state-machine complexity rather than removing every derivative discontinuity.

**Not publishing a coupling ratio.** It would be easy to divide two numbers and print $E_{es}/E_a$ as a tile. It is not printed because a defensible computation needs end-systolic pressure and because the ratio's clinical meaning is anchored in measurements — pressure–volume catheterisation or single-beat estimation — whose assumptions the model does not reproduce. The table above demonstrates afterload sensitivity with an explicitly named surrogate; it does not validate ventriculo-arterial coupling numerically.

---

## Limits

### Of the construction

- **No wave transmission.** The arterial system is a resistance and a compliance. There is no characteristic impedance, no pulse wave velocity, no reflected wave, and therefore no augmentation index and no distinction between central and peripheral pressure.
- **$E_{es}$ is a straight line** with a fixed unstressed volume. Real end-systolic relations are mildly curvilinear and their intercept moves.
- **No length-dependent activation beyond the elastance formulation**, no force–frequency relationship, and no contractile reserve: heart rate and contractility are independent controls.
- **No coronary circulation**, so no ischaemia, no supply–demand relationship, and no myocardial energetics. Pressure–volume area cannot be interpreted as oxygen consumption here.
- The atria contract but do not have their own pathology; there is no atrial fibrillation and no loss of atrial kick as a switchable state.
- Valves do not regurgitate, stenose or prolapse.

### Of clinical application

- The normal reference now produces an ejection fraction in the expected resting range because the activation waveform reaches the selected elastance. Individual values remain properties of the model's elastances and loading; they are not calibrated against echocardiographic measurement and should not be compared directly with a patient's number.
- The ratios in the table use $MAP/SV$, not effective arterial elastance. They show a direction — vasodilatation raising stroke volume in a failing ventricle — and must not be quoted as coupling measurements.
- Nothing here supports a decision about inotropes versus vasodilators in a particular patient. The model has no myocardial oxygen balance, which is the constraint that decision usually turns on.

---

## References

- Suga H, Sagawa K. [Instantaneous pressure–volume relationships and their ratio in the excised, supported canine left ventricle](https://doi.org/10.1161/01.res.35.1.117). *Circ Res* 1974;35:117–26.
- Stergiopulos N, Meister JJ, Westerhof N. [Determinants of stroke volume and systolic and diastolic aortic pressure](https://doi.org/10.1152/ajpheart.1996.270.6.H2050). *Am J Physiol* 1996;270:H2050–9.
- Senzaki H, Chen CH, Kass DA. [Single-beat estimation of end-systolic pressure–volume relation in humans](https://doi.org/10.1161/01.CIR.94.10.2497). *Circulation* 1996;94:2497–2506.
- Sunagawa K, Maughan WL, Burkhoff D, Sagawa K. Left ventricular interaction with arterial load studied in isolated canine ventricle. *Am J Physiol* 1983;245:H773–80. [doi:10.1152/ajpheart.1983.245.5.H773](https://doi.org/10.1152/ajpheart.1983.245.5.H773)
- Burkhoff D, Sagawa K. Ventricular efficiency predicted by an analytical model. *Am J Physiol* 1986;250:R1021–7. [doi:10.1152/ajpregu.1986.250.6.R1021](https://doi.org/10.1152/ajpregu.1986.250.6.R1021)
- Guarracino F, Baldassarri R, Pinsky MR. Ventriculo-arterial decoupling in acutely altered hemodynamic states. *Crit Care* 2013;17:213. [doi:10.1186/cc12522](https://doi.org/10.1186/cc12522)
- Chantler PD, Lakatta EG, Najjar SS. Arterial–ventricular coupling: mechanistic insights into cardiovascular performance at rest and during exercise. *J Appl Physiol* 2008;105:1342–51. [doi:10.1152/japplphysiol.90600.2008](https://doi.org/10.1152/japplphysiol.90600.2008)

---

## See also

[Ventricular interdependence](ventricular-interdependence.md) · [The right ventricle](the-right-ventricle.md) · [Transmural pressure](transmural-pressure.md) · [The PV loop panel](panel-pv-loops.md) · [Interpretability](interpretability.md) · [Controls: heart](controls-heart.md) · [Cardiogenic pulmonary oedema](scenarios.md#cardiogenic-pulmonary-oedema)
