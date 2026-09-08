# Why the PVR nadir is at FRC

> The minimum of the fully open pulmonary resistance curve is placed near resting lung volume by construction. It is a teaching assumption, not a measurement of the human PVR nadir or a prediction of optimal PEEP.

---

## Physiology

The [J-curve](pulmonary-vascular-resistance.md) expresses opposing mechanical effects of lung inflation. Reduced radial traction narrows extra-alveolar vessels at low volume, while inflation stretches and compresses alveolar vessels. Their combined resistance has a minimum, called the nadir.

Clinical teaching diagrams commonly place that minimum near functional residual capacity (FRC). Isolated-animal measurements can place it nearer half maximal lung volume. Preparation, vascular pressure references and inflation manoeuvre matter; an animal volume ratio is not a measured human target.

## In the model

The minimum belongs to the **fully open reference pathway**. Its horizontal coordinate is strain: volume per open unit relative to the volume that aerated tissue holds at resting recoil. For the default lung, zero strain corresponds to 2.25 L, close to the nominal whole-lung FRC of 2.2 L. The reference follows the selected aerated-tissue compliance and maximum capacity; it is not fixed to a healthy absolute volume for every lung.

The extra-alveolar decay coefficient is derived so that the opposing slopes cancel at zero strain:

$$
K = \frac{f_a k}{f_e(1-c)} = 0.829
$$

- $K$ — dimensionless decay coefficient of the extra-alveolar limb
- $f_a = 0.5$ — fraction of reference resistance assigned to the alveolar limb
- $f_e = 0.5$ — fraction assigned to the extra-alveolar limb
- $k = 0.58$ — dimensionless growth coefficient of the alveolar limb
- $c = 0.30$ — dimensionless floor fraction of the extra-alveolar limb

The additional low-volume traction term has zero value and zero slope at zero strain. It steepens the low-volume limb without shifting the minimum. These are didactic shape coefficients; the algebra sets the minimum instead of estimating it from a patient's response.

The patient's total resistance also includes open and closed pathways in parallel, with hypoxic vasoconstriction confined to the closed pathway. The separate alveolar waterfall affects the pressure available to drive flow. The minimum of the fully open reference curve therefore does not specify the response of the entire circulation to PEEP.

## Why this construction

The evidence serves different purposes. Human in-vivo PEEP measurements constrain the approximate scale and recruitability-dependent response of a calibration phenotype. Clinical teaching geometry supplies a minimum near FRC. Isolated-animal preparations support volume dependence and opposing mechanical effects, with their experimental conditions kept explicit. These roles are not interchangeable.

## Limits

- The model cannot determine where the human nadir truly lies: its position is assumed before the simulation starts.
- The position applies to the fully open mechanical curve. It does not identify the PEEP with lowest total RV load or highest cardiac output.
- Vascular pressures oppose or support flow through their gradients, but pressure-induced widening and recruitment of vessels do not modify the resistance coefficient.
- Calibration of an internal pressure–flow response is not independent catheter validation. Derived PVR inherits the [wedge surrogate's](pulmonary-artery-wedge-pressure.md) interpretability limits.

## Validation

The `pvr-human-frc-nadir` and `pvr-human-j-direction` rows check the constructed minimum and the opposing limbs. They test implementation of a teaching assumption, not its independent truth in an individual patient. See [pulmonary vascular resistance](pulmonary-vascular-resistance.md#validation) for the separate cohort-range constraints.

## References

- Cecconi M, Collino F, Pinsky MR. Heart–lung interactions in ARDS. *Intensive Care Med* 2026. [doi:10.1007/s00134-026-08583-3](https://doi.org/10.1007/s00134-026-08583-3) — clinical teaching geometry.
- Thomas LJ, Griffo ZJ, Roos A. Effect of negative pressure inflation of the lung on pulmonary vascular resistance. *J Appl Physiol* 1961;16:451–6. [doi:10.1152/jappl.1961.16.3.451](https://doi.org/10.1152/jappl.1961.16.3.451) — excised dog lungs during negative-pressure inflation with vascular pressures held constant.
- Cappio Borlino S, et al. The effect of PEEP on pulmonary vascular resistance depends on lung recruitability in patients with ARDS. *Am J Respir Crit Care Med* 2024;210:900–907. [doi:10.1164/rccm.202402-0383OC](https://doi.org/10.1164/rccm.202402-0383OC) — human PEEP comparison used for phenotype calibration, subject to the model's downstream-pressure limitations.

## See also

[Pulmonary vascular resistance](pulmonary-vascular-resistance.md) · [Why the mechanical PVR curve uses volume](pvr-volume-vs-pressure.md) · [The two-population lung](two-population-lung.md) · [Recruitment and R/I](recruitment-and-ri.md)
