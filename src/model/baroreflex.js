// A first-order arterial baroreflex.
//
// Without one, every intervention in this model produces an unopposed fall in
// cardiac output, and the simulator overstates what a breath costs a patient
// who still has reflexes. The gains below are a didactic aggregate calibration;
// they are not fitted to Berger et al.'s PEEP experiment, which used
// anaesthetised pigs, did not block reflexes and cannot identify a human
// baroreflex gain from its composite steady-state response.
//
// This is one effector, not four separate arcs: a single sympathetic outflow
// with a time constant, driving heart rate, systemic resistance, venous tone and
// contractility together. That is a simplification — the four have different
// latencies in reality — but it is the level at which the teaching points live.

export const BARO = {
  tau: 15,          // s, effector time constant
  errorScale: 20,   // mmHg of error giving about three quarters of full response
  // Effector change at full response. Venous recruitment is a volume because
  // sympathetic venoconstriction shifts the zero-pressure volume; it does not
  // have to change the compliance slope or add blood to the circulation.
  heartRate: 0.55,
  resistance: 0.45,
  venousRecruitment: 200, // mL moved from unstressed to stressed volume
  inotropy: 0.30,
  // Resting sympathetic tone is low, so there is far more room to increase
  // outflow than to withdraw it. Without this asymmetry a patient sitting a few
  // mmHg above the set point gets an implausibly large bradycardia.
  withdrawalFraction: 0.25,
};

export function createBaroreflexState() {
  return { outflow: 0 };
}

/**
 * Advance the effector by one step and return its output. At gain 1 its target
 * lies in [-0.25, 1]; the user-facing gain can scale that range. `map` is the
 * mean arterial pressure the reflex senses — a mean, not an instantaneous
 * value, because that is what a baroreceptor integrates.
 */
export function stepBaroreflex(p, state, map, dt) {
  const gain = p.baroreflex ?? 0;
  if (gain <= 0) { state.outflow = 0; return 0; }

  const error = p.baroSetPoint - map;
  const raw = Math.tanh(error / BARO.errorScale);
  const target = gain * (raw >= 0 ? raw : raw * BARO.withdrawalFraction);

  state.outflow += (target - state.outflow) * (dt / BARO.tau);
  return state.outflow;
}

/**
 * Apply the reflex output to the parameters the integrator reads. Mutates the
 * object in place: this runs every step, and allocating a fresh parameter set
 * four thousand times a second would be the most expensive thing in the model.
 */
export function applyBaroreflex(effective, base, outflow) {
  effective.hr = base.hr * (1 + BARO.heartRate * outflow);
  effective.svr = base.svr * (1 + BARO.resistance * outflow);
  // Positive outflow reduces the systemic venous unstressed volume. Negative
  // outflow returns some volume to it. Total blood volume and the user-selected
  // venous compliance remain unchanged in both directions.
  effective.csv = base.csv;
  effective.venousToneVolume = BARO.venousRecruitment * outflow;
  effective.eesLv = base.eesLv * (1 + BARO.inotropy * outflow);
  effective.eesRv = base.eesRv * (1 + BARO.inotropy * outflow);
}
