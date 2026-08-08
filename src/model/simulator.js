import { defaultParams } from './parameters.js';
import {
  createRespiratoryState, stepRespiratory, respiratorySystemCompliance, pvrComponents,
} from './respiratory.js';
import { createCirculationState, stepCirculation, VASC } from './circulation.js';
import { cmH2OtoMmHg, RESISTANCE_TO_DYN, RESISTANCE_TO_WOOD } from './units.js';

const DT = 0.00025; // 0.25 ms — small enough for the low valve resistances
const SAMPLE_HZ = 250;
export const TRACE_SECONDS = 12;
const TRACE_LEN = SAMPLE_HZ * TRACE_SECONDS;
const MEAN_TIME_CONSTANT = 3; // s, for the mean-pressure moving averages

class Ring {
  constructor(n) { this.buf = new Float32Array(n); this.n = n; this.i = 0; this.filled = 0; }
  push(v) { this.buf[this.i] = v; this.i = (this.i + 1) % this.n; if (this.filled < this.n) this.filled++; }
  // Oldest-to-newest into `out`; returns the count written.
  read(out) {
    const start = (this.i - this.filled + this.n) % this.n;
    for (let k = 0; k < this.filled; k++) out[k] = this.buf[(start + k) % this.n];
    return this.filled;
  }
}

const CHANNELS = ['paw', 'ppl', 'palv', 'art', 'cvp', 'pap', 'paop', 'flow', 'volume', 'co', 'insp'];

export class Simulator {
  constructor() {
    this.params = defaultParams();
    this.reset();
  }

  reset() {
    this.resp = createRespiratoryState();
    this.circ = createCirculationState(this.params);
    this.traces = {};
    this.scratch = {};
    for (const ch of CHANNELS) {
      this.traces[ch] = new Ring(TRACE_LEN);
      // One scratch buffer per channel, so a reader can hold on to the result
      // while reading another channel instead of having it overwritten.
      this.scratch[ch] = new Float32Array(TRACE_LEN);
    }
    this.time = 0;
    this.sampleAccum = 0;
    this.beatHistory = [];
    this.beatSeen = -1;
    this.sysRun = -1e9;
    this.diaRun = 1e9;
    this.papSysRun = -1e9;
    this.papDiaRun = 1e9;
    // Exponential moving averages over simulated time, so a mean pressure does
    // not depend on how the caller happens to chunk its calls to advance().
    this.ema = null;
    // Settle the model so the first frame the user sees is a steady state.
    this.advance(15, true);
  }

  /**
   * Changing stressed volume moves blood in or out of the venous reservoir —
   * a fluid bolus or a diuresis — rather than silently rescaling the model.
   */
  setParam(id, value) {
    if (id === 'stressedVolume') {
      this.circ.vSv += value - this.params.stressedVolume;
    }
    this.params[id] = value;
    if (id === 'frc') {
      // Keep end-expiratory volume physical when FRC moves.
      this.resp.v = Math.max(0, this.resp.v);
    }
  }

  /**
   * A scenario is a partial override of the defaults, so it has to be applied to
   * the defaults — not to whatever the previous scenario left behind. Otherwise
   * selecting a preset would give a different patient depending on which one you
   * looked at first.
   */
  applyScenario(scenario) {
    this.params = { ...defaultParams(), ...scenario.params };
    this.reset();
  }

  /** Advance simulated time by `seconds`, optionally without recording traces. */
  advance(seconds, silent = false) {
    const steps = Math.min(Math.round(seconds / DT), 240000);
    const sampleEvery = Math.round(1 / (SAMPLE_HZ * DT));
    for (let s = 0; s < steps; s++) {
      stepRespiratory(this.params, this.resp, DT);
      stepCirculation(this.params, this.circ, this.resp, DT);
      this.time += DT;
      this.accumulate();
      if (!silent && s % sampleEvery === 0) this.sample();
    }
    this.metrics = this.computeMetrics();
  }

  accumulate() {
    const c = this.circ;
    this.sysRun = Math.max(this.sysRun, c.p.sa);
    this.diaRun = Math.min(this.diaRun, c.p.sa);
    this.papSysRun = Math.max(this.papSysRun, c.p.pa);
    this.papDiaRun = Math.min(this.papDiaRun, c.p.pa);

    if (this.ema === null) {
      this.ema = { map: c.p.sa, cvp: c.p.ra, pap: c.p.pa, paop: c.p.la };
    } else {
      const alpha = DT / MEAN_TIME_CONSTANT;
      this.ema.map += alpha * (c.p.sa - this.ema.map);
      this.ema.cvp += alpha * (c.p.ra - this.ema.cvp);
      this.ema.pap += alpha * (c.p.pa - this.ema.pap);
      this.ema.paop += alpha * (c.p.la - this.ema.paop);
    }

    if (c.beatCount !== this.beatSeen) {
      this.beatSeen = c.beatCount;
      this.beatHistory.push({
        t: this.time,
        pp: this.sysRun - this.diaRun,
        sv: c.sv,
        sbp: this.sysRun,
        dbp: this.diaRun,
        papSys: this.papSysRun,
        papDia: this.papDiaRun,
      });
      if (this.beatHistory.length > 40) this.beatHistory.shift();
      this.sysRun = -1e9; this.diaRun = 1e9;
      this.papSysRun = -1e9; this.papDiaRun = 1e9;
    }
  }

  sample() {
    const c = this.circ, r = this.resp;
    this.traces.paw.push(r.paw);
    this.traces.ppl.push(r.ppl);
    this.traces.palv.push(r.palv);
    this.traces.art.push(c.p.sa);
    this.traces.cvp.push(c.p.ra);
    this.traces.pap.push(c.p.pa);
    this.traces.paop.push(c.p.la);
    this.traces.flow.push(r.flow * 60); // L/min
    this.traces.volume.push((r.v * 1000)); // mL above FRC
    this.traces.co.push((c.q.av * 60) / 1000);
    this.traces.insp.push(r.flow > 0.002 ? 1 : 0);
  }

  trace(channel) {
    const buf = this.scratch[channel];
    const n = this.traces[channel].read(buf);
    return { data: buf, n };
  }

  computeMetrics() {
    const p = this.params, c = this.circ, r = this.resp;
    const hist = this.beatHistory;
    const period = 60 / p.rr;
    const recent = hist.filter((b) => b.t > this.time - period * 1.05);
    const pool = recent.length >= 2 ? recent : hist.slice(-4);

    let ppv = 0, svv = 0;
    if (pool.length >= 2) {
      const pps = pool.map((b) => b.pp);
      const svs = pool.map((b) => b.sv);
      const ppMax = Math.max(...pps), ppMin = Math.min(...pps);
      const svMax = Math.max(...svs), svMin = Math.min(...svs);
      ppv = ppMax + ppMin > 0 ? (200 * (ppMax - ppMin)) / (ppMax + ppMin) : 0;
      svv = svMax + svMin > 0 ? (200 * (svMax - svMin)) / (svMax + svMin) : 0;
    }

    const last = hist[hist.length - 1] ?? {};
    const { map, cvp, pap: papMean, paop } = this.ema ?? {
      map: c.p.sa, cvp: c.p.ra, pap: c.p.pa, paop: c.p.la,
    };

    const co = (c.sv * p.hr) / 1000;
    const crs = respiratorySystemCompliance(p);
    const pvrComp = pvrComponents(p, r.lungVolume);

    return {
      co, sv: c.sv, hr: p.hr,
      map, sbp: last.sbp ?? c.p.sa, dbp: last.dbp ?? c.p.sa,
      cvp, cvpTransmural: cvp - cmH2OtoMmHg(r.ppl) - c.p.pPeri,
      papSys: last.papSys ?? c.p.pa, papDia: last.papDia ?? c.p.pa, papMean, paop,
      ppv, svv,
      lvEdv: c.lvEdv, lvEsv: c.lvEsv, lvEf: c.lvEdv > 0 ? (100 * c.sv) / c.lvEdv : 0,
      rvEdv: c.rvEdv, rvEsv: c.rvEsv,
      rvLvRatio: c.lvEdv > 0 ? c.rvEdv / c.lvEdv : 1,
      pmsf: c.p.pmsf, pCrit: c.p.pCrit, pPeri: c.p.pPeri,
      gradientVr: c.p.pmsf - Math.max(c.p.ra, c.p.pCrit),
      ppl: r.ppl, palv: r.palv, paw: r.paw, pl: r.pl,
      lungVolume: r.lungVolume, pab: r.pab,
      pplat: r.lastPplat, ppeak: r.lastPpeak, autoPeep: r.lastAutoPeep,
      totalPeep: p.peep + r.lastAutoPeep,
      drivingPressure: r.lastPplat - (p.peep + r.lastAutoPeep),
      pplSwing: r.lastPplSwing,
      vtDelivered: r.lastVt,
      crs, expTimeConstant: (crs / 1000) * p.raw,
      pvr: c.p.pvr, pvrWood: c.p.pvr * RESISTANCE_TO_WOOD,
      pvrDyn: c.p.pvr * RESISTANCE_TO_DYN,
      svrDyn: p.svr * RESISTANCE_TO_DYN,
      pvrAlveolar: pvrComp.alveolar, pvrExtra: pvrComp.extraAlveolar,
      zone3: c.p.zone3,
      minuteVentilation: (r.lastVt * p.rr) / 1000,
      bloodVolume: c.vSa + c.vSv + c.vRa + c.vRv + c.vPa + c.vPv + c.vLa + c.vLv,
      stressedVenous: c.vSv - VASC.vuSv,
    };
  }
}
