import { TRACE_SECONDS } from '../model/index.js';

/**
 * Copy the presentation-facing model state without copying the simulator's
 * integrator, trace rings or methods. The result is deliberately immutable in
 * practice: panels may read it exactly as they read the live simulator, while
 * scrubbing can never write an old state back into the physiology.
 */
export function presentationSnapshot(sim) {
  return {
    time: sim.time,
    params: structuredClone(sim.params),
    effective: structuredClone(sim.effective),
    resp: structuredClone(sim.resp),
    circ: structuredClone(sim.circ),
    metrics: structuredClone(sim.metrics),
    measuredPoints: structuredClone(sim.measuredPoints),
    presentationOnly: true,
  };
}

/**
 * A low-frequency companion to the 250 Hz waveform rings.
 *
 * The waveforms remain the high-resolution time source. These snapshots retain
 * the heavier state needed to place the corresponding point on every diagram
 * and update all numerical readouts when the user pauses and inspects a time.
 */
export class PresentationHistory {
  constructor({ duration = TRACE_SECONDS, sampleInterval = 0.05 } = {}) {
    this.duration = duration;
    this.sampleInterval = sampleInterval;
    this.snapshots = [];
  }

  capture(sim, { force = false } = {}) {
    const latest = this.snapshots.at(-1);
    if (!force && latest && sim.time - latest.time < this.sampleInterval) return latest;

    const snapshot = presentationSnapshot(sim);
    if (latest && Math.abs(latest.time - snapshot.time) < 1e-9) {
      this.snapshots[this.snapshots.length - 1] = snapshot;
    } else {
      this.snapshots.push(snapshot);
    }

    const cutoff = snapshot.time - this.duration;
    const first = this.snapshots.findIndex((item) => item.time >= cutoff);
    if (first > 0) this.snapshots.splice(0, first);
    return snapshot;
  }

  clear() { this.snapshots.length = 0; }

  get size() { return this.snapshots.length; }
  get oldest() { return this.snapshots[0] ?? null; }
  get newest() { return this.snapshots.at(-1) ?? null; }

  atFraction(fraction) {
    if (!this.snapshots.length) return null;
    const f = Math.min(1, Math.max(0, Number(fraction) || 0));
    const target = this.oldest.time + (this.newest.time - this.oldest.time) * f;
    let best = this.oldest;
    let distance = Math.abs(best.time - target);
    for (let i = 1; i < this.snapshots.length; i++) {
      const candidate = this.snapshots[i];
      const nextDistance = Math.abs(candidate.time - target);
      if (nextDistance > distance) break;
      best = candidate;
      distance = nextDistance;
    }
    return best;
  }

  fractionOf(snapshot) {
    if (!snapshot || !this.oldest || !this.newest) return 1;
    const span = this.newest.time - this.oldest.time;
    return span > 0 ? Math.min(1, Math.max(0, (snapshot.time - this.oldest.time) / span)) : 1;
  }
}
