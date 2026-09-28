export function createCardiacResponseWorker() {
  return new Worker(new URL('./cardiac-response.worker.js', import.meta.url), { type: 'module' });
}
// Keep the raw posture prescription; only autonomic effectors are frozen.
export function cardiacResponseParameters(params, effective = params) {
  const snapshot = { ...params, baroreflexEnabled: false };
  for (const key of ['hr', 'svr', 'eesLv', 'eesRv']) snapshot[key] = effective[key] ?? params[key];
  // A paused control change has not yet reached the integrator. Preserve the
  // sampled reflex contribution, but use the currently selected manual shift.
  const selectedManual = params.venousCapacityReduction ?? 0;
  const sampledManual = effective.venousCapacityReduction ?? selectedManual;
  snapshot.venousToneVolume = (effective.venousToneVolume ?? sampledManual)
    + (selectedManual - sampledManual);
  return snapshot;
}
