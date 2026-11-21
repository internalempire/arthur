import { pvrComponents, pulmonaryResistancePartition, RESISTANCE_TO_WOOD } from '../model/index.js';

// Both cycle boundaries are detected by the integrator, independently of frame rate,
// playback speed and the other patient's cardiac or respiratory rate.
export class PinCycles {
  constructor() { this.reset(); }
  reset() {
    this.complete = null;
    this.breath = null;
    this.firstBeat = null;
  }
  sample(sim) {
    if (!this.breath || sim.time < this.nextSample) return;
    this.nextSample = sim.time + this.interval - 1e-8;
    this.valid &&= sim.validObservation();
    // An assisted breath can wait indefinitely for its next trigger.
    if (this.breath.length >= 2048) {
      this.breath = this.breath.filter((_, index) => index % 4 < 2);
      this.interval *= 2;
    }
    this.breath.push(sim.resp.ppl, sim.resp.lungVolume);
  }
  boundary(sim, uninterrupted) {
    const r = sim.resp, c = sim.circ;
    if (!uninterrupted) { this.reset(); return; }
    const volume = r.lastEndExpiratoryVolume;
    const pressure = r.endExpiratoryPpl;
    if (this.breath && this.valid && sim.validObservation() && Number.isFinite(volume + pressure)
        && Number.isFinite(r.lastClosedEndExpiratory)) {
      this.breath.push(pressure, volume);
      const geometry = pvrComponents(sim.effective, volume, r.endExpiratoryPl, 1 - r.lastClosedEndExpiratory);
      const resistance = pulmonaryResistancePartition(sim.effective, geometry).geometricResistance * RESISTANCE_TO_WOOD;
      // A beat spanning a change of settings must not enter the comparison.
      const wholeBeat = c.beatCount >= this.firstBeat + 2;
      this.complete = { breath: this.breath, volume, pressure, resistance, endTime: sim.time,
        rv: wholeBeat ? c.lastLoopRv : [], lv: wholeBeat ? c.lastLoopLv : [] };
    } else {
      this.complete = null;
    }
    this.firstBeat ??= c.beatCount;
    this.breath = [pressure, volume];
    this.valid = true;
    this.interval = 0.02;
    this.nextSample = sim.time;
  }
}
