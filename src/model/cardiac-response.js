// An inverse whole-heart cardiac-function experiment. A controlled source
// supplies RA inflow; the pressure required to pass that flow through the RV,
// lungs and LV is measured. Systemic return is opened only in these disposable
// copies. Neither the patient state nor its pressure/valve equations is edited.
import { Simulator } from './simulator.js';
import { stepCirculation } from './circulation.js';
import { stepRespiratory } from './respiratory.js';

const SCALES = [0.2, 0.4, 0.6, 0.8, 1, 1.1, 1.2, 1.4];
const CENTRAL = ['vRa', 'vRv', 'vPa', 'vPt', 'vPv', 'vLa', 'vLv'];
const centralVolume = c => CENTRAL.reduce((sum, key) => sum + c[key], 0);

function accumulator(c) {
  return { initial: centralVolume(c), av: 0, pv: 0, input: 0, ra: 0, la: 0,
    pmsf: 0, pCrit: 0, rvrEff: 0, ppl: 0, pPeri: 0, invalid: false };
}

function observe(sum, c, input, dt) {
  sum.av += c.q.av * dt;
  sum.pv += c.q.pv * dt;
  sum.input += input * dt;
  for (const key of ['ra', 'la', 'pmsf', 'pCrit', 'rvrEff', 'ppl', 'pPeri']) {
    sum[key] += c.p[key] * dt;
  }
  sum.invalid ||= c.cardiacPhaseInvalid || c.pressureDomainInvalid || c.limitTicks > 0;
}

function finish(sum, c, seconds) {
  const result = {
    co: sum.av / seconds * 0.06,
    rvOutput: sum.pv / seconds * 0.06,
    inflow: sum.input / seconds * 0.06,
    storageChange: centralVolume(c) - sum.initial,
    balanceError: centralVolume(c) - sum.initial - sum.input + sum.av,
    invalid: sum.invalid,
  };
  for (const key of ['ra', 'la', 'pmsf', 'pCrit', 'rvrEff', 'ppl', 'pPeri']) {
    result[key] = sum[key] / seconds;
  }
  return result;
}

/**
 * Run off the UI thread. The reference circulation supplies the SAME respiratory
 * trajectory, normalized inflow waveform and systemic downstream-pressure
 * trajectory to all copies. Arterial compliance/resistance, both ventricles,
 * atria, pulmonary storage/transit, valves, pericardium and septum stay active.
 * Thus changing LV contractility can change required RAP through the lungs/RV.
 *
 * This is a local loading experiment conditioned on a settled reference, not
 * an independently calibrated prediction of a new patient's equilibrium.
 * Each point must settle and remain in the model domain. No missing tail is
 * extrapolated into a physiological plateau.
 */
export function cardiacResponseCurve(params, {
  dt = 0.00025,
  scales = SCALES,
  onProgress = () => {},
  // Test/research comparison: reuse the same boundary experiment while changing
  // only heart parameters in the copies. The application leaves this empty.
  heartOverrides = {},
} = {}) {
  const reference = new Simulator({ dt });
  // Freeze autonomic drive at the supplied effective parameters. A filling
  // experiment must not silently change contractility/rate through feedback.
  reference.applyScenario({ params: { ...params, baroreflexEnabled: false } });
  const p = { ...reference.effective, venousToneVolume: params.venousToneVolume ?? 0 };
  reference.effective = p;
  // The ordinary integrator resets venous tone when the reflex is disabled.
  // Here all frozen effectors, including venous recruitment, must persist.
  for (let i = 0; i < Math.round(120 / dt); i++) {
    stepRespiratory(p, reference.resp, dt);
    stepCirculation(p, reference.circ, reference.resp, dt);
    reference.time += dt;
    reference.accumulate();
  }
  if (!reference.computeMetrics().valid) {
    return { valid: false, samples: [], segments: [], reason: 'invalid reference circulation', dt };
  }
  const heartParams = { ...p, ...heartOverrides };
  const copies = scales.map(scale => ({
    scale, circ: structuredClone(reference.circ), previous: null,
    result: null, rejected: false, sum: null,
  }));
  const windowSeconds = 60;
  const steps = Math.round(windowSeconds / dt);
  let referenceResult;

  // First minute adapts to imposed filling. Later paired minute windows test
  // settlement; the final two minutes are only needed for slower redistribution.
  for (let window = 0; window < 5; window++) {
    const refSum = accumulator(reference.circ);
    for (const copy of copies) copy.sum = accumulator(copy.circ);
    for (let i = 0; i < steps; i++) {
      const vSv = reference.circ.vSv;
      const vIVC = reference.circ.vIVC;
      stepRespiratory(p, reference.resp, dt);
      stepCirculation(p, reference.circ, reference.resp, dt);
      observe(refSum, reference.circ, reference.circ.q.vr, dt);
      for (const copy of copies) {
        if (copy.rejected || copy.result) continue;
        const c = copy.circ;
        // Fixed source-side states preserve the reference systemic downstream
        // pressure and isolate the cardiac relation from the return relation.
        c.vSv = vSv;
        c.vIVC = vIVC;
        stepCirculation(heartParams, c, reference.resp, dt);
        const input = copy.scale * reference.circ.q.vr;
        c.vRa += (input - c.q.vr) * dt;
        if (!Number.isFinite(centralVolume(c)) || !Number.isFinite(c.p.ra)) {
          copy.rejected = true;
          copy.reason = 'non-finite response';
          continue;
        }
        observe(copy.sum, c, input, dt);
      }
    }
    referenceResult = finish(refSum, reference.circ, windowSeconds);
    for (const copy of copies) {
      if (copy.rejected || copy.result) continue;
      const current = finish(copy.sum, copy.circ, windowSeconds);
      const finite = Object.values(current).every(value => typeof value !== 'number' || Number.isFinite(value));
      if (!finite || Math.abs(current.balanceError) > 1e-5) {
        copy.rejected = true;
        copy.reason = 'flow-volume balance unavailable';
      } else if (window >= 2 && current.invalid) {
        copy.rejected = true;
        copy.reason = 'outside cardiac phase/pressure domain';
      } else if (window >= 2 && copy.previous) {
        const denominator = Math.max(current.inflow, 0.1);
        const mismatch = Math.max(Math.abs(current.co - current.inflow),
          Math.abs(current.rvOutput - current.inflow)) / denominator;
        const drift = Math.abs(current.co - copy.previous.co) / denominator;
        const pressureDrift = Math.abs(current.ra - copy.previous.ra);
        if (!current.invalid && !copy.previous.invalid && mismatch < 0.005 && drift < 0.005
          && pressureDrift < 0.05 + 0.005 * Math.abs(current.ra)) {
          copy.result = { ...current, mismatch, drift, pressureDrift, seconds: (window + 1) * windowSeconds };
        }
      }
      copy.previous = current;
    }
    onProgress({ completed: copies.filter(c => c.result || c.rejected).length, total: copies.length });
    if (window >= 2 && copies.every(c => c.result || c.rejected)) break;
  }

  const samples = copies.map(copy => ({
    scale: copy.scale,
    ...(copy.result ?? copy.previous ?? {}),
    valid: Boolean(copy.result),
    reason: copy.result ? null : copy.reason ?? 'not settled within five minutes',
  }));
  // Split at every unavailable point or non-increasing pressure; do not bridge
  // a forbidden interval or treat a folded relation as a single-valued curve.
  const segments = [];
  let segment = [];
  for (const sample of samples) {
    if (!sample.valid || (segment.length && sample.ra <= segment[segment.length - 2])) {
      if (segment.length >= 4) segments.push(segment);
      segment = [];
      if (!sample.valid) continue;
    }
    segment.push(sample.ra, sample.co);
  }
  if (segment.length >= 4) segments.push(segment);
  return {
    samples, segments, reference: referenceResult, dt,
    valid: segments.length > 0 && !referenceResult.invalid,
    referenceConditioned: true,
    pressureReference: 'atmospheric right atrial pressure',
    flowMeasurement: 'integrated aortic flow',
    conditions: Object.fromEntries(['hr', 'svr', 'eesLv', 'eesRv', 'venousToneVolume', 'ccw', 'pab0']
      .map(key => [key, p[key]])),
  };
}
