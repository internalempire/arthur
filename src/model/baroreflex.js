// A first-order arterial baroreflex.
//
// Without one, every intervention in this model produces an unopposed fall in
// cardiac output, and the simulator overstates what a breath costs a patient
// who still has reflexes. Berger and colleagues measured essentially no change
// in output when PEEP was raised from 5 to 10 in euvolaemic subjects; a model
// with no compensation cannot reproduce that.
//
// This is one effector, not four separate arcs: a single sympathetic outflow
// with a time constant, driving heart rate, systemic resistance, venous tone and
// contractility together. That is a simplification — the four have different
// latencies in reality — but it is the level at which the teaching points live.

export const BARO = {
  tau: 15,          // s, effector time constant
  errorScale: 20,   // mmHg of error giving about three quarters of full response
  // Fractional change at full response.
  heartRate: 0.55,
  resistance: 0.45,
  venousTone: 0.30, // as a *fall* in venous compliance, which raises Pmsf
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
 * Advance the effector by one step and return its output, in [-0.25, 1].
 * `map` is the mean arterial pressure the reflex senses — a mean, not an
 * instantaneous value, because that is what a baroreceptor integrates.
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
  effective.csv = base.csv * (1 - BARO.venousTone * outflow);
  effective.eesLv = base.eesLv * (1 + BARO.inotropy * outflow);
  effective.eesRv = base.eesRv * (1 + BARO.inotropy * outflow);
}
