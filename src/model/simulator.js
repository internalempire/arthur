import { defaultParams } from './parameters.js';
import { resolveParams } from './position.js';
import {
  createRespiratoryState, stepRespiratory, respiratorySystemCompliance, pvrComponents,
} from './respiratory.js';
import {
  createCirculationState, stepCirculation, VASC, venousReturnBackPressure,
} from './circulation.js';
import { cmH2OtoMmHg, RESISTANCE_TO_DYN, RESISTANCE_TO_WOOD } from './units.js';

export const DEFAULT_DT = 0.00025; // 0.25 ms — small enough for the low valve resistances
const SAMPLE_HZ = 250;
export const TRACE_SECONDS = 12;
const TRACE_LEN = SAMPLE_HZ * TRACE_SECONDS;
const MEAN_TIME_CONSTANT = 3; // s, for the mean-pressure moving averages
const COMPARTMENTS = ['vSa', 'vSv', 'vRa', 'vRv', 'vPa', 'vPv', 'vLa', 'vLv'];
// The compartment volumes, compliances and resistances are calibrated for an
// adult of about this weight. It is stated because the validity condition for
// pulse pressure variation is expressed per kilogram.
const REFERENCE_WEIGHT_KG = 70;

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

// The Guyton diagram is a steady-state analysis: its axes are mean pressure and
// mean flow. Cardiac pulsatility does not belong on it — right atrial pressure
// swings several mmHg every beat through its a, c and v waves, which is a third
// of the width of the plot — but the respiratory excursion is the whole point
// and must survive. A boxcar exactly one cardiac cycle long is the right filter:
// it nulls the cardiac fundamental completely while passing the much slower
// respiratory cycle almost untouched.
const CYCLE_HZ = 250;
const CYCLE_SECONDS = 2; // enough for a full cycle down to 30 beats/min

class CycleRing {
  constructor() {
    this.buf = new Float32Array(CYCLE_HZ * CYCLE_SECONDS);
    this.i = 0;
    this.filled = 0;
  }

  push(v) {
    this.buf[this.i] = v;
    this.i = (this.i + 1) % this.buf.length;
    if (this.filled < this.buf.length) this.filled++;
  }

  /** Mean of the most recent `samples` values. */
  mean(samples) {
    const n = Math.min(samples, this.filled);
    if (n < 1) return 0;
    let sum = 0;
    for (let k = 1; k <= n; k++) sum += this.buf[(this.i - k + this.buf.length) % this.buf.length];
    return sum / n;
  }
}

export class Simulator {
  /** `dt` is exposed so the convergence test can halve it. */
  constructor({ dt = DEFAULT_DT } = {}) {
    this.dt = dt;
    this.params = defaultParams();
    this.reset();
  }

  reset() {
    this.resp = createRespiratoryState();
    this.effective = resolveParams(this.params);
    this.circ = createCirculationState(this.effective);
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
    // Cycle-averaged quantities for the Guyton diagram.
    this.cycle = {
      ra: new CycleRing(), flow: new CycleRing(), pmsf: new CycleRing(),
      peri: new CycleRing(), ppl: new CycleRing(), pCrit: new CycleRing(),
    };
    this.cycleTick = 0;
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
    const dt = this.dt;
    const steps = Math.min(Math.round(seconds / dt), 240000 * (DEFAULT_DT / dt));
    const sampleEvery = Math.max(1, Math.round(1 / (SAMPLE_HZ * dt)));
    // Body position modifies chest wall compliance, abdominal pressure and
    // resting lung volume. Resolved once here — the parameters cannot change
    // mid-advance — so every consumer sees one consistent set.
    this.effective = resolveParams(this.params);
    for (let s = 0; s < steps; s++) {
      stepRespiratory(this.effective, this.resp, dt);
      stepCirculation(this.effective, this.circ, this.resp, dt);
      this.time += dt;
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
      this.ema = { map: c.p.sa, cvp: c.p.ra, pap: c.p.pa, paop: c.p.la,
        ppl: c.p.ppl, peri: c.p.pPeri, pmsf: c.p.pmsf, pCrit: c.p.pCrit, flow: (c.q.vr * 60) / 1000 };
    } else {
      const alpha = this.dt / MEAN_TIME_CONSTANT;
      this.ema.map += alpha * (c.p.sa - this.ema.map);
      this.ema.cvp += alpha * (c.p.ra - this.ema.cvp);
      this.ema.pap += alpha * (c.p.pa - this.ema.pap);
      this.ema.paop += alpha * (c.p.la - this.ema.paop);
      this.ema.ppl += alpha * (c.p.ppl - this.ema.ppl);
      this.ema.peri += alpha * (c.p.pPeri - this.ema.peri);
      this.ema.pmsf += alpha * (c.p.pmsf - this.ema.pmsf);
      this.ema.pCrit += alpha * (c.p.pCrit - this.ema.pCrit);
      this.ema.flow += alpha * ((c.q.vr * 60) / 1000 - this.ema.flow);
    }

    if (this.cycleTick++ % Math.max(1, Math.round(1 / (CYCLE_HZ * this.dt))) === 0) {
      this.cycle.ra.push(c.p.ra);
      this.cycle.flow.push((c.q.vr * 60) / 1000);
      this.cycle.pmsf.push(c.p.pmsf);
      this.cycle.peri.push(c.p.pPeri);
      this.cycle.ppl.push(c.p.ppl);
      this.cycle.pCrit.push(c.p.pCrit);
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
    const p = this.effective ?? this.params, c = this.circ, r = this.resp;
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
    const ema = this.ema ?? {
      map: c.p.sa, cvp: c.p.ra, pap: c.p.pa, paop: c.p.la,
      ppl: c.p.ppl, peri: c.p.pPeri, pmsf: c.p.pmsf, pCrit: c.p.pCrit, flow: 0,
    };
    const { map, cvp, pap: papMean, paop } = ema;

    const co = (c.sv * p.hr) / 1000;
    const crs = respiratorySystemCompliance(p);
    const pvrComp = pvrComponents(p, r.lungVolume);

    // Whether each derived index can be read as the clinical quantity it shares
    // a name with. A dynamic index outside its validity conditions is not a
    // borderline result — it is not a result. See `interpretability` below.

    // Whether the numbers below mean anything at all. A model driven past the
    // range where its equations hold should say so rather than keep reporting
    // values in clinical units.
    const lvEf = c.lvEdv > 0 ? (100 * c.sv) / c.lvEdv : 0;
    const reasons = [];
    if (c.limitTicks > 0) reasons.push('a compartment was being drained faster than it could supply');
    const emptied = COMPARTMENTS.filter((k) => c[k] <= 1.5);
    if (emptied.length) reasons.push(`${emptied.join(', ')} at the volume floor`);
    if (!(lvEf >= 0 && lvEf <= 100)) reasons.push('ejection fraction outside 0–100%');
    if (!Number.isFinite(co) || !Number.isFinite(map)) reasons.push('non-finite result');

    // One cardiac cycle's worth of samples: the cardiac ripple averages out, the
    // respiratory swing survives.
    const window = Math.round((60 / p.hr) * CYCLE_HZ);
    const operatingPoint = {
      pra: this.cycle.ra.mean(window),
      flow: this.cycle.flow.mean(window),
      pmsf: this.cycle.pmsf.mean(window),
      pPeri: this.cycle.peri.mean(window),
      // The curves have to be evaluated on the same clock as the point. Left
      // instantaneous, they lead it by half a cardiac cycle, and the marker
      // drifts off them during the fast part of a breath.
      ppl: this.cycle.ppl.mean(window),
      pCrit: this.cycle.pCrit.mean(window),
    };

    const spontaneousEffort = p.mode === 'spont' || p.pmus > 0.5;
    const beatsPerBreath = p.hr / p.rr;

    // Conditions under which the dynamic indices stop meaning what their names
    // say. Levels: 'ok', 'caution', 'unavailable'.
    const ppvReasons = [];
    if (spontaneousEffort) ppvReasons.push('spontaneous effort — the index assumes a passive patient');
    if (r.lastVt < 8 * REFERENCE_WEIGHT_KG) ppvReasons.push(`tidal volume below 8 mL/kg (${REFERENCE_WEIGHT_KG} kg assumed)`);
    if (beatsPerBreath < 3.6) ppvReasons.push('fewer than 3.6 beats per breath');
    if (c.lvEdv > 0 && c.rvEdv / c.lvEdv > 1.2) ppvReasons.push('right ventricular dilatation — variation may reflect afterload, not preload');
    if (p.pab0 > 12) ppvReasons.push('raised intra-abdominal pressure');
    const ppvLevel = spontaneousEffort ? 'unavailable' : ppvReasons.length ? 'caution' : 'ok';

    const plateauLevel = spontaneousEffort ? 'unavailable' : 'ok';
    const wedgeLevel = c.p.zone3 >= 0.95 ? 'ok' : 'caution';
    const pvrDerivedLevel = co > 0.05 ? 'ok' : 'unavailable';

    // ESC/ERS 2022: pulmonary hypertension is mPAP above 20 mmHg; the
    // pre-capillary component additionally requires PVR above 2 Wood units with
    // a wedge of 15 mmHg or less.
    const pvrDerived = co > 0.05 ? (papMean - paop) / co : null;
    const phPresent = papMean > 20;
    const phClass = !phPresent ? null
      : (paop > 15 ? (pvrDerived !== null && pvrDerived > 2 ? 'combined' : 'post-capillary')
        : (pvrDerived !== null && pvrDerived > 2 ? 'pre-capillary' : 'unclassified'));

    const interpretability = {
      ppv: { level: ppvLevel, reasons: ppvReasons },
      plateau: { level: plateauLevel, reasons: plateauLevel === 'unavailable' ? ['no passive plateau during spontaneous effort'] : [] },
      wedge: {
        level: wedgeLevel,
        reasons: wedgeLevel === 'ok' ? []
          : ['left atrial pressure is only a wedge surrogate under West zone 3 conditions'],
      },
      pvrDerived: { level: pvrDerivedLevel, reasons: pvrDerivedLevel === 'ok' ? [] : ['no forward flow to divide by'] },
    };

    return {
      spontaneousEffort, beatsPerBreath, interpretability, phPresent, phClass,
      co, sv: c.sv, hr: p.hr,
      map, sbp: last.sbp ?? c.p.sa, dbp: last.dbp ?? c.p.sa,
      cvp, cvpTransmural: cvp - ema.ppl - ema.peri,
      papSys: last.papSys ?? c.p.pa, papDia: last.papDia ?? c.p.pa, papMean, paop,
      ppv, svv,
      valid: reasons.length === 0,
      invalidReasons: reasons,
      lvEdv: c.lvEdv, lvEsv: c.lvEsv, lvEf,
      rvEdv: c.rvEdv, rvEsv: c.rvEsv,
      rvLvRatio: c.lvEdv > 0 ? c.rvEdv / c.lvEdv : 1,
      pmsf: ema.pmsf, pCrit: ema.pCrit, pPeri: ema.peri, operatingPoint,
      // Same collapse law as the integrator, same averaging window as its terms.
      gradientVr: ema.pmsf - venousReturnBackPressure(cvp, ema.pCrit),
      ppl: r.ppl, palv: r.palv, paw: r.paw, pl: r.pl,
      lungVolume: r.lungVolume, pab: r.pab,
      pplat: r.lastPplat, ppeak: r.lastPpeak, autoPeep: r.lastAutoPeep,
      totalPeep: p.peep + r.lastAutoPeep,
      drivingPressure: r.lastPplat - (p.peep + r.lastAutoPeep),
      pplSwing: r.lastPplSwing,
      vtDelivered: r.lastVt,
      crs, expTimeConstant: (crs / 1000) * p.raw,
      pvr: c.p.pvr,
      // The J-curve coefficient the model integrates with. Not the same number a
      // clinician derives from a catheter, because the model also carries an
      // alveolar waterfall and zone conditions that the catheter formula folds
      // into its single resistance. Both are reported, separately named.
      pvrCoefficientWood: c.p.pvr * RESISTANCE_TO_WOOD,
      // null rather than NaN: at arrest there is no derivable resistance, and a
      // readout should say so instead of propagating a number that is not one.
      pvrDerivedWood: pvrDerived,
      pvrWood: c.p.pvr * RESISTANCE_TO_WOOD,
      pvrDyn: c.p.pvr * RESISTANCE_TO_DYN,
      svrDyn: p.svr * RESISTANCE_TO_DYN,
      pvrAlveolar: pvrComp.alveolar, pvrExtra: pvrComp.extraAlveolar,
      zone3: c.p.zone3,
      minuteVentilation: (r.lastVt * p.rr) / 1000,
      bloodVolume: COMPARTMENTS.reduce((t, k) => t + c[k], 0),
      minCompartment: Math.min(...COMPARTMENTS.map((k) => c[k])),
      stressedVenous: c.vSv - VASC.vuSv,
    };
  }
}
