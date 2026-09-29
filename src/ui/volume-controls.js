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
