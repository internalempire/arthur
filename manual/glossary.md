# Glossary

> Terms, symbols and units used across the application and manual.

---

## A–C

**Aerated-lung compliance (`clung`).** Local pressure–volume slope assigned to aerated tissue while it remains away from its upper-volume limit. It is independent of maximum capacity and is not the same as live respiratory-system compliance. See [the pressure–volume curve](pressure-volume-curve.md).

**Afterload.** The load opposing ventricular ejection. It is not represented by one pressure alone. For the LV, surrounding pleural pressure changes transmural ejection load; for the RV, pulmonary vascular resistance, critical closing behaviour and pulsatile load all matter, although the model represents only part of them. See [transmural pressure](transmural-pressure.md) and [the right ventricle](the-right-ventricle.md).

**Alveolar pressure ($P_{alv}$).** Pressure inside the model's single alveolar compartment, in cmH₂O. During flow it differs from airway-opening pressure by the pressure gradient across airway resistance. At zero flow the two equilibrate unless a flow-limiting boundary condition remains active. See [the waveform panel](panel-waveforms.md).

**Auto-PEEP / intrinsic PEEP.** Positive alveolar pressure remaining at end-expiration because expiration did not reach the resting equilibrium. See [expiratory flow limitation](expiratory-flow-limitation.md).

**Capacitance.** The capacity of a vascular compartment to contain volume at a given pressure. The model keeps capacity shifts caused by [venous tone](venous-tone.md) separate from compliance.

**Cardiac output (CO).** Forward systemic arterial flow averaged over time, reported in L/min.

**Central venous pressure (CVP).** Right atrial pressure referenced to atmosphere. The model also reports transmural CVP, which subtracts surrounding pleural pressure.

**Chest-wall compliance (`ccw`).** Local slope of the independent relaxed chest-wall pressure–volume curve near the normal reference volume. It controls pressure change per volume change and is separate from chest-wall load.

**Chest-wall load (`cwLoad`).** Pressure offset applied to the whole relaxed chest-wall curve. A positive load can represent aggregate mass or diaphragmatic loading; it changes resting pressure without being defined as stiffness. See [pleural pressure](pleural-pressure.md).

**Compliance.** Change in volume divided by change in pressure. Lung and chest-wall compliance are reported in mL/cmH₂O; vascular compliance in mL/mmHg. Compliance is the reciprocal of elastance only for a locally linear relation.

## D–H

**Driving pressure.** Plateau pressure minus total PEEP. In the model plateau is calculated rather than obtained from an end-inspiratory zero-flow pause.

**Effective arterial elastance ($E_a$).** A lumped ventricular load commonly estimated as end-systolic pressure divided by stroke volume, in mmHg/mL. The model draws an $E_a$ surrogate on PV loops but does not publish a coupling ratio. See [ventriculo-arterial coupling](ventriculo-arterial-coupling.md).

**End-systolic elastance ($E_{es}$).** Slope of the end-systolic pressure–volume relation, in mmHg/mL; used as the contractility control for each ventricle.

**Expiratory flow limitation (EFL).** A condition in which more expiratory driving pressure no longer increases flow because a collapsible airway has reached a choke point.

**Functional residual capacity (FRC).** The resting lung volume at zero respiratory-system recoil. In the model it is calculated from lung and chest-wall mechanics rather than entered directly.

**Hypoxic pulmonary vasoconstriction (HPV).** Local pulmonary arterial constriction in response to alveolar hypoxia. The model uses a simplified control attached to derecruited lung and does not simulate oxygen tension. See [hypoxic vasoconstriction](hypoxic-vasoconstriction.md).

## I–P

**Inferior vena cava (IVC).** [Inferior vena cava](inferior-vena-cava.md). The compliant conduit between the splanchnic reservoir and the right atrium. The model represents it as a separate compartment whose own blood volume drives its displayed diameter, so it stays full in tamponade and collapses during strong inspiratory draw.

**Maximum lung capacity (`lungCapacity`).** Asymptotic volume ceiling of a completely open lung, entered directly in litres. Collapse determines what fraction is currently accessible. It is not an anthropometric predicted TLC. See [the pressure–volume curve](pressure-volume-curve.md).

**Mean pulmonary artery pressure (mPAP).** Time-averaged pulmonary arterial pressure, in mmHg.

**Mean systemic filling pressure (Pmsf).** The equilibrated systemic vascular pressure that would exist at zero flow, used as the upstream pressure in the Guyton construction. See [venous return](venous-return.md).

**Open fraction.** Fraction of the represented lung currently aerated. It is an internal state, not a bedside measurement.

**PEEP.** Positive end-expiratory pressure set at the airway opening, in cmH₂O. Total PEEP is external plus intrinsic PEEP.

**Pleural pressure ($P_{pl}$).** Pressure surrounding intrathoracic structures, in cmH₂O. The model uses one global value. See [pleural pressure](pleural-pressure.md).

**Plateau pressure.** Airway pressure intended to represent the zero-flow end-inspiratory elastic load. The model computes it; it does not perform a true inspiratory pause for the routine tile.

**Preload reserve.** Local change in the analytic Guyton intersection when mean systemic filling pressure rises. The ascending relation predicts RV output rather than independently testing LV reserve. It is an internal coefficient, not a validated bedside index.

**Pulmonary vascular resistance (PVR).** Clinically, $(mPAP-PAWP)/CO$, reported in Wood units. The model separately reports this derived aggregate and the coefficient used in its pulmonary flow law. See [pulmonary vascular resistance](pulmonary-vascular-resistance.md).

## R–Z

**Recruitment-to-inflation ratio (R/I).** Compliance of recruited volume divided by respiratory-system compliance at low PEEP for a specified PEEP step. It compares recruitment with inflation of already open lung. See [recruitment and R/I](recruitment-and-ri.md).

**Resistance to venous return.** The denominator relating the pressure available for venous return to flow, in mmHg·s/mL. In the model it is split between the splanchnic reservoir and the [inferior vena cava](inferior-vena-cava.md) conduit (33% upstream, 67% downstream), with the downstream segment carrying the caval waterfall.

**Stress index.** Exponent describing curvature of airway pressure during constant-flow inflation. Values below, near or above one suggest continuing recruitment, near-linear mechanics or increasing elastance respectively, under its measurement assumptions.

**Stressed volume.** Vascular volume above zero-pressure capacity that generates elastic recoil. See [stressed volume](stressed-volume.md).

**Stroke volume (SV).** Forward volume ejected by a ventricle in one beat, in mL.

**Systemic vascular resistance (SVR).** Aggregate systemic outflow resistance, in mmHg·s/mL in the control and converted internally where necessary.

**Transmural pressure.** Pressure inside a structure minus pressure surrounding it. See [transmural pressure](transmural-pressure.md).

**Transpulmonary pressure ($P_L$).** Alveolar pressure minus pleural pressure, in cmH₂O. It is the pressure across the lung; the model reports one global instantaneous value. See [pleural pressure](pleural-pressure.md).

**Unstressed volume.** Vascular volume that fills the vascular space without generating appreciable elastic recoil.

**Vascular waterfall.** Flow limitation in which downstream pressure ceases to control flow once it falls below a critical closing pressure. See [vascular waterfalls](vascular-waterfalls.md).

**Venous piston.** Didactic shorthand for lung inflation displacing blood from pulmonary capacitance toward the left atrium.

**Wedge / PAWP.** [Pulmonary artery wedge pressure](pulmonary-artery-wedge-pressure.md). Clinically it is the distal pressure measured after occluding a pulmonary arterial branch. The model instead uses smoothed atmospheric left atrial pressure as a surrogate and qualifies it with a zone 3 pressure-margin index.

**West zones.** Relations among alveolar, pulmonary arterial and pulmonary venous pressure that alter pulmonary vascular flow. The model represents zone-2 waterfall behaviour and a zone-3 pressure-margin index in aggregate.

## Units and conversions

| unit | meaning |
|---|---|
| cmH₂O | respiratory pressure |
| mmHg | vascular or chamber pressure |
| mL, L | volume |
| L/min | cardiac output |
| Wood unit | mmHg/(L/min) |
| dyn·s·cm⁻⁵ | conventional cgs resistance; 1 Wood unit = 80 dyn·s·cm⁻⁵ |

## Limits

These definitions describe how terms are used in this manual. Clinical measurement protocols and disease definitions require the linked concept pages and their references; the glossary is not a substitute for them.

## References

- West JB, Luks AM. *West's Respiratory Physiology: The Essentials*. 11th ed. Wolters Kluwer; 2021.
- Magder S. Bench-to-bedside review: an approach to hemodynamic monitoring—Guyton at the bedside. *Crit Care*. 2012;16:236. [doi:10.1186/cc11395](https://doi.org/10.1186/cc11395)
- Humbert M, Kovacs G, Hoeper MM, et al. 2022 ESC/ERS Guidelines for pulmonary hypertension. *Eur Heart J*. 2022;43:3618–3731. [doi:10.1093/eurheartj/ehac237](https://doi.org/10.1093/eurheartj/ehac237)

---

## See also

[Conventions](conventions.md) · [Interpretability](interpretability.md) · [Numerical tiles](numeric-tiles.md) · [Bibliography](bibliography.md)
