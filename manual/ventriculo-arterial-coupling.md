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

Reducing arterial load can let a failing ventricle eject more without increasing intrinsic contractility. A higher coupling ratio is a description of that altered pressure–volume relation, not a separate cause of higher output; the response still depends on preload and the arterial pressure that results.

### Why it belongs in a heart–lung model

Because ventilation can move both terms. Raised intrathoracic pressure can reduce left ventricular transmural afterload — see [transmural pressure](transmural-pressure.md) — while lung inflation can increase right ventricular load when it moves the lung onto the high-volume limb of [pulmonary vascular resistance](pulmonary-vascular-resistance.md). The net effect depends on lung volume, recruitment, filling and ventricular reserve.

---

## In the model

Both ventricles use a time-varying elastance driven by an activation waveform with an approximately unit peak. Systolic and diastolic behaviour come from separate terms:

- an end-systolic straight line with slope `eesLv` or `eesRv` and its own unstressed volume;
- an end-diastolic exponential, with the left ventricle's stiffness on the `lvStiff` control and the right ventricle's fixed.

The atria are simpler: a linear elastance swinging between a minimum and a maximum on an atrial activation waveform.

<details>
<summary>Mathematical details: contraction timing and the valid pressure domain</summary>

For the ventricles, the duration of activation is not kept at a fixed fraction of every beat. If $T=60/HR$ is the cardiac-cycle duration, the model first defines

$$
T_{max}=\min(0.2+0.15T,\,0.5T), \qquad \tau=\frac{t}{T_{max}}
$$

and uses the normalised double-Hill core

$$
A(\tau)=1.55
\left[\frac{(\tau/0.7)^{1.9}}{1+(\tau/0.7)^{1.9}}\right]
\left[\frac{1}{1+(\tau/1.17)^{21.9}}\right].
$$

Its peak is approximately one. A smooth cubic taper acts between 70% and 80% of the cycle, and activation is zero from 80% through the beat boundary. Atrial contraction occupies the final fifth. The cap and taper are explicit didactic timing boundaries: they preserve relaxation and a continuous cycle at high rates, but do not represent pathological incomplete relaxation or a calibrated force–frequency response.

The intrinsic ventricular pressure is the passive exponential plus activation times the non-negative difference between the systolic envelope and that passive pressure. Thus activation cannot lower pressure at fixed volume. If the passive relation exceeds the selected systolic envelope, the numerical continuation remains bounded below by passive pressure and the result is flagged outside the model domain. No clinical inference is attached to that continuation.

Valves are represented as one-way resistances driven by their pressure gradients. Isovolumic phases arise from those relations. There is no forced mutual exclusion of the inflow and outflow valves. A completed beat with more than 0.01% of forward volume (and at least 0.001 mL) occurring during paired-valve throughflow or ventricular activation below 0.001 is outside the intended phase domain. The check applies to both ventricles and suspends clinical readouts.

</details>

The right ventricle carries two extra terms from [ventricular interdependence](ventricular-interdependence.md): a diastolic septal shift and a systolic contribution from the left ventricle. Consequently, the selected intrinsic RV elastance is not always the slope from the fixed zero-pressure volume to the total end-systolic RV pressure. The PV-loop panel draws a local effective line through the actual end-systolic point and explains the distinction; the control itself still represents the intrinsic ventricular term.

**There is no numerical $E_a$ or coupling-ratio tile.** The PV panel does draw an $E_a$ line through the completed beat's end-diastolic zero-pressure point and transmural end-ejection point; this is a graphical single-beat summary. Mean arterial pressure and stroke volume alone do not provide conventional effective arterial elastance. It requires an explicitly defined end-systolic pressure, pressure reference and matched stroke volume. A ratio formed from a cycle mean answers a different question. See [interpretability](interpretability.md).

### Explore unloading without equating it with stronger contraction

Select **LV failure**, allow it to settle and create a Pin. Reduce **Systemic vascular resistance** while leaving LV contractility unchanged. Compare stroke volume and output with MAP and the PV loop: easier ejection can increase stroke volume even while arterial pressure falls. The final response also includes changed filling and, if enabled, autonomic compensation.

Then return to the same starting phenotype and change PEEP alone. This changes filling and pulmonary loading as well as the pressure around the LV. The generated [wedge examples](pulmonary-artery-wedge-pressure.md#worked-examples) show why a lower transmural ejection-pressure burden need not increase output. The useful question is which change offsets which, not whether an afterload surrogate crossed a numerical target.

If calculating a ratio outside the application, $MAP/SV$ is only a named pressure-to-volume surrogate. It is not $E_a=P_{es}/SV$: a cycle mean and end-systolic pressure are different measurements, and a pressure from one clock should not be paired casually with a stroke volume from another.

---

## Why this and not something else

**Time-varying elastance rather than a Starling curve.** A model that maps filling pressure to stroke volume directly is far simpler and is enough for a Guyton diagram. It cannot produce a pressure–volume loop, cannot separate contractility from load, cannot show isovolumic phases, and cannot show afterload sensitivity — which is most of what a heart–lung simulator has to demonstrate. The [PV loop panel](panel-pv-loops.md) exists because of this choice.

**Resistive valves rather than cardiac-cycle state switches.** The one-way condition avoids explicit event-driven valve states and produces the intended loop phases. Flow is continuous at zero gradient, but its derivative has a corner there; the formulation reduces state-machine complexity rather than removing every derivative discontinuity.

**Not publishing a coupling ratio.** The plotted $E_a$ line has a model end-ejection pressure available, but that does not validate a clinical ratio. Its pressure reference, the effective line through a single beat and the selected intrinsic contractility are distinct constructions. Clinical pressure–volume catheterisation and single-beat estimation have measurement assumptions that Arthur does not reproduce. The proposed comparison demonstrates load sensitivity without presenting a numerically validated coupling ratio.

---

## Limits

### Of the construction

- **No wave transmission.** The arterial system is a resistance and a compliance. There is no characteristic impedance, no pulse wave velocity, no reflected wave, and therefore no augmentation index and no distinction between central and peripheral pressure.
- **$E_{es}$ is a straight line** with a fixed unstressed volume. Real end-systolic relations are mildly curvilinear and their intercept moves.
- **No length-dependent activation beyond the elastance formulation** and no intrinsic force–frequency or metabolic contractile-reserve law. Heart rate and contractility are independently selected; the aggregate baroreflex can change both together through its prescribed gains.
- **No coronary circulation**, so no ischaemia, no supply–demand relationship, and no myocardial energetics. Pressure–volume area cannot be interpreted as oxygen consumption here.
- The atria contract but do not have their own pathology; there is no atrial fibrillation and no loss of atrial kick as a switchable state.
- Valves do not regurgitate, stenose or prolapse.

### Of clinical application

- The normal reference produces an ejection fraction in the expected resting range because the activation waveform reaches the selected elastance. Individual values remain properties of the model's elastances and loading; they are not calibrated against echocardiographic measurement and should not be compared directly with a patient's number.
- A ratio using $MAP/SV$ must not be quoted as an effective arterial elastance or compared with a clinical coupling threshold.
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
- Damiano RJ Jr, La Follette P Jr, Cox JL, Lowe JE, Santamore WP. Significant left ventricular contribution to right ventricular systolic function. *Am J Physiol*. 1991;261:H1514–H1524. [doi:10.1152/ajpheart.1991.261.5.H1514](https://doi.org/10.1152/ajpheart.1991.261.5.H1514)

---

## See also

[Ventricular interdependence](ventricular-interdependence.md) · [The right ventricle](the-right-ventricle.md) · [Transmural pressure](transmural-pressure.md) · [The PV loop panel](panel-pv-loops.md) · [Interpretability](interpretability.md) · [Controls: heart](controls-heart.md) · [LV failure](scenarios.md#lv-failure)
