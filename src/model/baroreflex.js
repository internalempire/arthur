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
// In particular, this slow aggregate state must not be read as the latency of
// the human beat-to-beat cardiac baroreflex.

export const BARO = {
  tau: 15,          // s, effector time constant
  errorScale: 20,   // mmHg of error giving about three quarters of full response
  // Effector change at full response. Venous recruitment is a volume because
  // sympathetic venoconstriction shifts the zero-pressure volume; it does not
  // have to change the compliance slope or add blood to the circulation.
  // An additive reserve avoids counting an already elevated selected heart
  // rate twice. A proportional effector made the same reflex output far more
  // tachycardic at a baseline of 170/min than at 75/min, reaching >350/min when
  // combined with the formerly unbounded high-gain control.
  // 42/min preserves the former full-response increment at the 75/min
  // reference state (75 * 0.55 = 41.25) without scaling it up again when the
  // selected phenotype is already tachycardic. It is an internal continuity
  // calibration, not a claimed universal human chronotropic reserve.
  heartRateReserve: 42, // /min added at full positive response
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
 * Advance the effector by one step and return its output. The user-facing
 * sensitivity acts inside the saturating pressure-error curve, so every
 * positive setting retains the same bounded effector range [-0.25, 1]. A
 * sensitivity above one reaches full response at a smaller pressure error; it
 * cannot invent a response larger than "full". `map` is the model's low-pass
 * mean-pressure teaching signal. Real arterial baroreceptors sense pulsatile
 * arterial-wall stretch; that afferent encoding is outside this model.
 */
export function stepBaroreflex(p, state, map, dt) {
  const sensitivity = p.baroreflex ?? 0;
  // Activation and gain are deliberately separate. The checkbox lets a learner
  // compare the same selected patient with and without compensation; switching
  // it off must erase residual outflow rather than let the 15 s state decay.
  if (!p.baroreflexEnabled || sensitivity <= 0) { state.outflow = 0; return 0; }

  const error = p.baroSetPoint - map;
  const raw = Math.tanh(sensitivity * error / BARO.errorScale);
  const target = raw >= 0 ? raw : raw * BARO.withdrawalFraction;

  state.outflow += (target - state.outflow) * (dt / BARO.tau);
  return state.outflow;
}

/**
 * Apply the reflex output to the parameters the integrator reads. Mutates the
 * object in place: this runs every step, and allocating a fresh parameter set
 * four thousand times a second would be the most expensive thing in the model.
 */
export function applyBaroreflex(effective, base, outflow) {
  effective.hr = base.hr + BARO.heartRateReserve * outflow;
  effective.svr = base.svr * (1 + BARO.resistance * outflow);
  // Positive outflow reduces the systemic venous unstressed volume. Negative
  // outflow returns some volume to it. Total blood volume and the user-selected
  // venous compliance remain unchanged in both directions.
  effective.csv = base.csv;
  effective.venousToneVolume = BARO.venousRecruitment * outflow;
  effective.eesLv = base.eesLv * (1 + BARO.inotropy * outflow);
  effective.eesRv = base.eesRv * (1 + BARO.inotropy * outflow);
}
