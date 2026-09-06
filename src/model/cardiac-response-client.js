export function createCardiacResponseWorker() {
  return new Worker(new URL('./cardiac-response.worker.js', import.meta.url), { type: 'module' });
}
// Keep the raw posture prescription; only autonomic effectors are frozen.
export function cardiacResponseParameters(params, effective = params) {
  const snapshot = { ...params, baroreflexEnabled: false };
  for (const key of ['hr', 'svr', 'eesLv', 'eesRv']) snapshot[key] = effective[key] ?? params[key];
  snapshot.venousToneVolume = effective.venousToneVolume ?? 0;
  return snapshot;
}
