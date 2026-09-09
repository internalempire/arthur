// Numerical consistency of pressure, gas volume and recruitment memory.
import { isDeepStrictEqual } from 'node:util';
import { defaultParams, section, check, near } from '../support/model.mjs';
import { resolveParams } from '../../src/model/position.js';
import { createRespiratoryState, stepRespiratory } from '../../src/model/respiratory.js';
import {
  relaxationVolume, lungVolumeAtPl, lungVolumeAtRecruitmentState,
  recruitmentBand, stepRecruitedFraction, transpulmonaryWithRecruitment,
  chestWallPressure,
} from '../../src/model/lung.js';

const severe = {
  collapsed: 0.8, clung: 20, pOpen: 20.5, pClose: 20, cwLoad: 10,
  riRatio: 1.5, hysteresis: 'on', vt: 150, ti: 0.4, rr: 20, peep: 10,
};
function parameters(overrides) {
  const p = resolveParams({ ...defaultParams(), ...overrides });
  p._relaxVolume = relaxationVolume(p);
  return p;
}

// Independent bracket-only reference, without the production inverse or hint.
function pressureReference(p, volume, previous) {
  let low = -25, high = 80;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const band = recruitmentBand(p, mid);
    const recruited = Math.min(band.hi, Math.max(band.lo, previous));
    if (lungVolumeAtRecruitmentState(p, mid, recruited) < volume) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

section('Coupled pressure and recruitment');
{
  let worstPressure = 0, worstVolume = 0;
  for (const collapsed of [0.3, 0.5, 0.8]) for (const gap of [0.5, 3, 12]) {
    const p = parameters({ ...severe, collapsed, pClose: 20.5 - gap });
    for (const share of [0, 0.25, 0.75, 1]) for (const pl of [5, 10, 15, 20, 25, 35]) {
      const previous = collapsed * p.openableDiseasedFraction * share;
      const volume = lungVolumeAtPl(p, pl);
      const expected = pressureReference(p, volume, previous);
      // Exercise warm starts and the bounded fallback independently.
      for (const hint of [pl + 3, null, 75]) {
        const solved = transpulmonaryWithRecruitment(p, volume, previous, hint);
        const recruited = stepRecruitedFraction(p, previous, solved);
        worstPressure = Math.max(worstPressure, Math.abs(solved - expected));
        worstVolume = Math.max(worstVolume,
          Math.abs(lungVolumeAtRecruitmentState(p, solved, recruited) - volume));
      }
    }
  }
  check('warm and bounded inverses agree with independent pressure solutions', worstPressure < 0.001);
  check('the accepted pressure and recruitment hold the requested gas volume', worstVolume < 1.01e-6);
}

{
  const p = parameters(severe);
  // Identical stored state that generated a two-cycle in the September audit.
  // Do not initialize each timestep from a different settled attractor.
  const volume = 0.3696238323348551, previous = 2.464060290342599e-13;
  const expected = pressureReference(p, volume, previous);
  for (const dt of [0.00025, 0.000125, 0.0000625]) {
    const r = Object.assign(createRespiratoryState(), {
      hold: 'inspiratory', phase: 'insp', v: volume - p._relaxVolume,
      recruitedFraction: previous, plSolved: -0.6328521757283143,
    });
    const pressures = [];
    let worstResidual = 0;
    for (let i = 0; i < 40; i++) {
      stepRespiratory(p, r, dt);
      pressures.push(r.pl);
      worstResidual = Math.max(worstResidual,
        Math.abs(lungVolumeAtRecruitmentState(p, r.pl, r.recruitedFraction) - volume));
    }
    check(`fixed gas volume has no pressure two-cycle at dt ${dt}`,
      Math.max(...pressures) - Math.min(...pressures) < 1e-8
        && near(r.pl, expected, 0.001) && r.flow === 0 && r.lungVolume === volume);
    check(`occluded pressure and memory satisfy the volume law at dt ${dt}`, worstResidual < 1.01e-6);
  }
}

{
  // Test the whole accepted step, including preliminary flow, end-volume solve
  // and plateau bookkeeping, during both imposed and pressure-driven flow.
  for (const mode of ['vcv', 'pcv', 'psv', 'spont']) {
    const p = parameters({ ...severe, mode, pmus: ['psv', 'spont'].includes(mode) ? 8 : 0 });
    const r = createRespiratoryState();
    let maxGasError = 0, maxVolumeError = 0, maxMemoryError = 0, maxPlateauError = 0;
    for (let i = 0; i < 15 / 0.00025; i++) {
      const previous = r.recruitedFraction, v = r.v;
      stepRespiratory(p, r, 0.00025);
      maxGasError = Math.max(maxGasError, Math.abs(r.v - v - r.flow * 0.00025));
      maxVolumeError = Math.max(maxVolumeError,
        Math.abs(lungVolumeAtRecruitmentState(p, r.pl, r.recruitedFraction) - r.lungVolume));
      if (previous !== null) maxMemoryError = Math.max(maxMemoryError,
        Math.abs(r.recruitedFraction - stepRecruitedFraction(p, previous, r.pl)));
      if (r.phase === 'insp') maxPlateauError = Math.max(maxPlateauError,
        Math.abs(r.pplatCandidate - chestWallPressure(p, r.lungVolume) - r.pl));
    }
    check(`${mode}: every accepted step conserves gas and satisfies pressure/memory`,
      maxGasError < 1e-12 && maxVolumeError < 1.01e-6 && maxMemoryError < 1e-12);
    check(`${mode}: plateau uses the accepted lung state`, maxPlateauError < 1e-10);
    if (mode === 'vcv') check('severe VCV counts the delivered tidal volume without spurious refilling',
      Math.abs(r.lastVt - 150) < 1);
  }
}

{
  const off = parameters({ ...severe, hysteresis: 'off' });
  const noGap = parameters({ ...severe, pClose: severe.pOpen });
  const a = createRespiratoryState(), b = createRespiratoryState();
  for (let i = 0; i < 15 / 0.00025; i++) {
    stepRespiratory(off, a, 0.00025);
    stepRespiratory(noGap, b, 0.00025);
  }
  check('zero gap and hysteresis off have exactly identical respiratory states', isDeepStrictEqual(a, b));
}
