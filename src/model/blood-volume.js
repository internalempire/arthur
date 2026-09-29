import { COMPARTMENTS } from './simulator.js';
import { systemicVenousVolumeState } from './circulation.js';
import { applyBaroreflex } from './baroreflex.js';

/** Current-state observations, including edits made while time is paused. */
export function bloodVolumeReadings(sim) {
  const total = COMPARTMENTS.reduce((sum, key) => sum + sim.circ[key], 0);
  const added = sim.params.stressedVolume - (sim.bloodVolumeReference ?? sim.params.stressedVolume);
  const effective = { ...sim.params };
  const active = sim.params.baroreflexEnabled && sim.params.baroreflex > 0;
  applyBaroreflex(effective, sim.params, active ? sim.baro.outflow : 0);
  const venous = systemicVenousVolumeState(effective, sim.circ);
  const reservoir = sim.circ.vSv;
  const fraction = venous.stressedVolume / reservoir;
  return { total, initialTotal: total - added, stressed: venous.stressedVolume,
    reservoir, fraction: Number.isFinite(fraction) && reservoir > 0
      && fraction >= 0 && fraction <= 1 ? fraction : null };
}
