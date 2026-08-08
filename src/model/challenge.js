// The tidal volume challenge.
//
// Pulse pressure variation needs a breath big enough to load and unload the
// heart, and protective ventilation does not provide one. Below 8 mL/kg the
// index loses its discrimination, so the model withholds it — which is correct,
// and unhelpful, because the patients being ventilated protectively are exactly
// the ones whose filling is in question.
//
// Myatra et al. (Crit Care Med 2017;45:415–21) turned that limitation into a
// manoeuvre: raise the tidal volume to 8 mL/kg for one minute, read the *change*
// in variation, and put the ventilator back. A rise of more than 3.5 percentage
// points identifies a preload-dependent patient. The reasoning is that the
// change in variation reports the slope of the Starling curve the ventricle is
// working on, and a slope is still readable from a small perturbation even when
// the absolute value is not.
//
// So the quantity to read is the delta, not the value after. A patient whose
// variation goes 6% → 9% is telling you something a patient whose variation goes
// 6% → 7% is not, and neither number on its own crosses the usual threshold.

import { REFERENCE_WEIGHT_KG } from './parameters.js';

export const TIDAL_CHALLENGE = {
  targetMlPerKg: 8,
  // The trial holds the higher volume for one minute. Thirty seconds is enough
  // here because the model has no lung units that take longer than a breath to
  // fill, and the reading is averaged over the settled part of the window.
  seconds: 30,
  // Percentage points of pulse pressure variation. Absolute change, not relative.
  threshold: 3.5,
  // Only the last part of each window is measured, so the first breaths after a
  // change in tidal volume do not count.
  settleFraction: 0.6,
};

export function targetTidalVolume() {
  return TIDAL_CHALLENGE.targetMlPerKg * REFERENCE_WEIGHT_KG;
}

/**
 * Why this patient cannot be challenged. Empty means they can.
 *
 * These are conditions on the manoeuvre, not on the reading: a spontaneously
 * breathing patient does not have a tidal volume the ventilator can raise, and
 * a patient already at 8 mL/kg has nothing to raise it from.
 */
export function challengeBlockers(p) {
  const reasons = [];
  if (p.mode !== 'vcv') reasons.push('needs volume control — the manoeuvre is a change in set tidal volume');
  if (p.pmus > 0) reasons.push('needs a passive patient');
  if (p.vt >= targetTidalVolume() - 5) {
    reasons.push(`already at ${(p.vt / REFERENCE_WEIGHT_KG).toFixed(1)} mL/kg, so there is nothing to raise`);
  }
  return reasons;
}

/**
 * The manoeuvre runs in two windows of equal length: the patient's own tidal
 * volume, then 8 mL/kg.
 *
 * Both are measured the same way, and that matters more than it looks.
 * Variation is computed over the beats in one respiratory cycle, so it moves
 * breath to breath. Taking the baseline as a single instant and the result as an
 * average over twelve seconds compares a noisy number with a smooth one, and the
 * difference between them then contains that noise. Reading both as averages
 * over the settled part of their own window removes it.
 */
export function createTidalChallenge(p) {
  return {
    phase: 'baseline',
    baselineVt: p.vt,
    targetVt: targetTidalVolume(),
    seconds: TIDAL_CHALLENGE.seconds,
    elapsed: 0,
    ppvSum: 0,
    svvSum: 0,
    n: 0,
    before: null,
  };
}

/** The tidal volume the ventilator should deliver while a challenge is running. */
export function challengeTidalVolume(challenge, fallback) {
  return challenge && challenge.phase === 'raised' ? challenge.targetVt : fallback;
}

function windowMean(challenge, ppv, svv) {
  return {
    ppv: challenge.n ? challenge.ppvSum / challenge.n : ppv,
    svv: challenge.n ? challenge.svvSum / challenge.n : svv,
  };
}

/**
 * Advance the manoeuvre one step. Returns the finished result, or null while it
 * is still running.
 */
export function stepTidalChallenge(challenge, ppv, svv, dt) {
  challenge.elapsed += dt;
  if (challenge.elapsed > challenge.seconds * TIDAL_CHALLENGE.settleFraction) {
    challenge.ppvSum += ppv;
    challenge.svvSum += svv;
    challenge.n++;
  }
  if (challenge.elapsed < challenge.seconds) return null;

  if (challenge.phase === 'baseline') {
    challenge.before = windowMean(challenge, ppv, svv);
    challenge.phase = 'raised';
    challenge.elapsed = 0;
    challenge.ppvSum = 0;
    challenge.svvSum = 0;
    challenge.n = 0;
    return null;
  }

  const after = windowMean(challenge, ppv, svv);
  const before = challenge.before;
  const dPpv = after.ppv - before.ppv;
  return {
    baselineVt: challenge.baselineVt,
    targetVt: challenge.targetVt,
    ppvBefore: before.ppv,
    ppvAfter: after.ppv,
    svvBefore: before.svv,
    svvAfter: after.svv,
    dPpv,
    dSvv: after.svv - before.svv,
    // Deliberately not a verdict. See the note below: this model's change in
    // variation orders patients correctly but does not span the published
    // threshold, so returning "preload dependent: no" for every patient in the
    // range would be a false negative dressed as a result.
    threshold: TIDAL_CHALLENGE.threshold,
    verdict: dPpv > TIDAL_CHALLENGE.threshold ? 'dependent' : 'withheld',
    withheldReason: dPpv > TIDAL_CHALLENGE.threshold ? null
      : 'this model\'s change in variation is compressed — see the note in challenge.js',
  };
}

// ---------------------------------------------------------------------------
// What this manoeuvre reproduces, and where it is marginal.
//
// The ordering is right. Across stressed volumes from 300 to 1100 mL at 6 mL/kg
// the change in variation falls monotonically, 3.4 → 0.1 percentage points, in
// the same order as those patients' actual response to a 500 mL bolus (+40% down
// to +3% of cardiac output).
//
// The threshold is reached, but only in a patient who looks like the ones the
// trial studied. In the septic fluid-responsive preset — tachycardic and
// vasodilated, as those patients were — the change is 4.5 points and the
// manoeuvre calls preload dependence correctly. In a patient who is merely dry
// at a resting heart rate it sits at 3.4 to 3.6, straddling the line. Heart rate
// is most of that difference: at 130 the same manoeuvre gives 5.2. Some of that
// is real, since a faster rate samples the respiratory cycle more finely, and
// some is that this model's variation is close to proportional to tidal volume,
// so the delta leans on the baseline more than it should.
//
// The threshold is left at the published value. A model that cannot fall short
// of a number cannot be shown to be wrong about it.
