import { PARAMETERS } from '../model/index.js';
export { bloodVolumeReadings as volumeControlReadings } from '../model/index.js';
const volumeSpec = PARAMETERS.find(p => p.id === 'stressedVolume');

export const signedVolume = value => `${value > 0 ? '+' : ''}${Number(value.toFixed(6))}`;

/** Translate the existing prescription, without changing its physiological range. */
export function bloodVolumeControl(params, reference = params.stressedVolume) {
  const spec = volumeSpec;
  return { value: params.stressedVolume - reference, min: spec.min - reference,
    max: spec.max - reference, reference };
}

/** Keep zero and exact endpoints reachable for arbitrary imported starting volumes. */
export function snapBloodVolumeChange(value, control) {
  if (value <= control.min) return control.min;
  if (value >= control.max) return control.max;
  const step = volumeSpec.step;
  return Math.max(control.min, Math.min(control.max, Math.round(value / step) * step));
}

/** A prepared dose is separate from the cumulative, already applied prescription. */
export function bloodVolumeDoseControl(params) {
  return bloodVolumeControl(params, params.stressedVolume);
}

/** Apply exactly the requested dose, or reject it; never silently deliver less. */
export function applyBloodVolumeDose(sim, dose) {
  const { min, max } = bloodVolumeDoseControl(sim.params);
  if (!Number.isFinite(dose) || dose === 0 || dose < min || dose > max) return false;
  sim.setParam('stressedVolume', sim.params.stressedVolume + dose);
  return true;
}
