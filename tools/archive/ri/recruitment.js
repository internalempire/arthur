// Explicit phenotype prescriptions. These select the existing opening law;
// they are teaching examples, not anatomical measurements or PEEP targets.
import { calibrateRecruitmentToInflation } from './lung.js';

export const ARDS_REOPENABLE = 0.3892077555259069;
export const RECRUITMENT_PROFILES = Object.freeze({
  closed: { reopenable: 0, hysteresis: 'off' },
  equilibrium: { reopenable: ARDS_REOPENABLE, pOpen: 15.5, pClose: 12, hysteresis: 'off' },
  memory: { reopenable: ARDS_REOPENABLE, pOpen: 15.5, pClose: 6, hysteresis: 'on' },
});

export function recruitmentProfileOf(p) {
  if (p.reopenable === 0 && p.hysteresis === 'off') return 'closed';
  for (const id of ['equilibrium', 'memory']) {
    const q = RECRUITMENT_PROFILES[id];
    if (Math.abs(p.reopenable - q.reopenable) < 1e-12 && p.pOpen === q.pOpen
      && p.hysteresis === q.hysteresis && (id !== 'memory' || p.pClose === q.pClose)) return id;
  }
  return 'custom';
}

/** One-time conversion at a prescription boundary, never during integration. */
export function normalizeRecruitmentParameters(parameters) {
  const p = { ...parameters };
  if (Object.hasOwn(p, 'riRatio')) {
    if (!Number.isFinite(p.riRatio) || p.riRatio < 0 || p.riRatio > 2) {
      throw new Error('Legacy R/I must be a finite value from 0 to 2.');
    }
    p.reopenable = calibrateRecruitmentToInflation(p).openableFraction;
    delete p.riRatio;
    p.recruitmentProfile = recruitmentProfileOf(p);
  }
  // A historical closing midpoint above opening already meant zero memory.
  // Equality preserves that effective law while enforcing an explicit range.
  p.pClose = Math.min(p.pClose, p.pOpen);
  if (p.recruitmentProfile !== 'custom'
    && p.recruitmentProfile !== recruitmentProfileOf(p)) p.recruitmentProfile = 'custom';
  return p;
}
