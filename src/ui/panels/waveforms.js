import { Panel, niceTicks } from '../plot.js';
import { TRACE_SECONDS } from '../../model/index.js';

// Three time-aligned strips. Respiratory and haemodynamic pressures are kept on
// separate strips rather than sharing one plot with two y-axes: cmH2O and mmHg
// are different scales, and a dual axis would invite reading one against the
// other. Each strip also owns a fixed readout rail: the waveform shows change
// through time while the rail exposes the instantaneous value without making
// the user chase a moving label.

const WINDOW_SECONDS = TRACE_SECONDS;
// How long the data must sit comfortably inside the current range before it is
// allowed to shrink, in seconds of simulated time.
const SHRINK_DELAY = 4;

const STRIPS = [
  {
    id: 'resp',
    label: 'Airway & pleural pressure',
    unit: 'cmH₂O',
    height: 1.0,
    series: [
      { channel: 'paw', color: 'airway', label: 'Paw', digits: 1 },
      { channel: 'ppl', color: 'pleural', label: 'Ppl', digits: 1 },
    ],
  },
  {
    id: 'hemo',
    label: 'Vascular pressures',
    unit: 'mmHg',
    height: 1.35,
    series: [
      { channel: 'art', color: 'arterial', label: 'Arterial', digits: 1 },
      { channel: 'pap', color: 'pulmonary', label: 'PA', digits: 1 },
      { channel: 'cvp', color: 'venous', label: 'CVP', digits: 1 },
    ],
  },
  {
    id: 'vol',
    label: 'Lung volume above FRC',
    unit: 'mL',
    height: 0.75,
    axis: true,
    series: [
      { channel: 'volume', color: 'volume', label: 'Volume', digits: 0 },
    ],
  },
];

export function createWaveforms(container) {
  container.classList.add('waveform-stack');
  const strips = STRIPS.map((spec) => {
    const wrap = document.createElement('div');
    wrap.className = 'strip';
    wrap.style.flexGrow = String(spec.height);

    const plot = document.createElement('div');
    plot.className = 'waveform-plot';
    const canvas = document.createElement('canvas');
    plot.appendChild(canvas);

    const readoutList = document.createElement('dl');
    readoutList.className = 'waveform-readouts';
    readoutList.setAttribute('aria-label', `${spec.label}: current values in ${spec.unit}`);
    const readouts = new Map();
    for (const series of spec.series) {
      const row = document.createElement('div');
      row.className = 'waveform-readout';

      const label = document.createElement('dt');
      label.className = 'waveform-readout-label';
      label.textContent = series.label;

      const value = document.createElement('dd');
      const output = document.createElement('output');
      output.className = 'waveform-readout-value';
      output.setAttribute('aria-label', `${series.label}, current value in ${spec.unit}`);
      output.textContent = '—';
      value.appendChild(output);

      row.append(label, value);
      readoutList.appendChild(row);
      readouts.set(series.channel, { row, output });
    }

    wrap.append(plot, readoutList);
    container.appendChild(wrap);
    return {
      spec,
      canvas,
      readouts,
      panel: new Panel(canvas, { padding: [16, 14, spec.axis ? 22 : 6, 46] }),
      domain: null,     // the y range currently displayed
      insideSince: -1,  // when the data last started fitting comfortably inside it
    };
  });

  function formatValue(value, digits) {
    if (!Number.isFinite(value)) return '—';
    const zeroThreshold = 0.5 * 10 ** -digits;
    return (Math.abs(value) < zeroThreshold ? 0 : value).toFixed(digits);
  }

  /**
   * Rounds a range outwards to a readable step, so the axis labels do not churn
   * through arbitrary values as the scale changes.
   */
  function roundOut(lo, hi) {
    const span = Math.max(hi - lo, 1e-6);
    const mag = Math.pow(10, Math.floor(Math.log10(span / 3)));
    const step = (span / 3 / mag < 1.5 ? 1 : span / 3 / mag < 3.5 ? 2 : 5) * mag;
    return { lo: Math.floor(lo / step) * step, hi: Math.ceil(hi / step) * step };
  }

  function render(sim, colors) {
    // Inspiratory phase shading is shared by every strip.
    const insp = sim.trace('insp');
    const inspData = insp.data;
    const inspN = insp.n;

    for (const strip of strips) {
      const { spec, panel } = strip;
      panel.resize();
      const ctx = panel.begin();

      let lo = Infinity, hi = -Infinity;
      const buffers = [];
      for (const s of spec.series) {
        const { data, n } = sim.trace(s.channel);
        buffers.push({ ...s, data, n, readout: strip.readouts.get(s.channel) });
        for (let i = 0; i < n; i++) { if (data[i] < lo) lo = data[i]; if (data[i] > hi) hi = data[i]; }
      }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const pad = Math.max((hi - lo) * 0.12, 1);
      const wanted = roundOut(lo - pad, hi + pad);

      // Scaling with hysteresis. Rescaling on every frame makes two traces
      // impossible to compare by eye — the amplitude on screen keeps changing
      // while the physiology does not. So the range grows the moment data would
      // be clipped, but only shrinks once the data has sat comfortably inside it
      // for a few seconds of simulated time.
      let d = strip.domain;
      if (!d) {
        d = strip.domain = wanted;
        strip.insideSince = sim.time;
      } else if (lo - pad < d.lo || hi + pad > d.hi) {
        d = strip.domain = { lo: Math.min(d.lo, wanted.lo), hi: Math.max(d.hi, wanted.hi) };
        strip.insideSince = sim.time;
      } else {
        const span = d.hi - d.lo;
        const comfortable = (lo - pad) > d.lo + span * 0.18 && (hi + pad) < d.hi - span * 0.18;
        if (!comfortable) strip.insideSince = sim.time;
        else if (sim.time - strip.insideSince > SHRINK_DELAY) {
          d = strip.domain = wanted;
          strip.insideSince = sim.time;
        }
      }
      panel.setDomain(0, WINDOW_SECONDS, d.lo, d.hi);

      const ticks = niceTicks(d.lo, d.hi, 3);
      panel.grid(colors, {
        yTicks: ticks,
        yFormat: (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(Math.abs(v) < 10 ? 1 : 0)),
        xTicks: spec.axis ? [0, 3, 6, 9, 12] : [],
        xFormat: spec.axis ? (v) => `${v - WINDOW_SECONDS}s` : null,
      });

      // Inspiration bands
      const a = panel.plotArea;
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = colors.ink;
      let runStart = -1;
      for (let i = 0; i < inspN; i++) {
        const on = inspData[i] > 0.5;
        if (on && runStart < 0) runStart = i;
        if ((!on || i === inspN - 1) && runStart >= 0) {
          const x0 = a.x + (runStart / (inspN - 1)) * a.w;
          const x1 = a.x + (i / (inspN - 1)) * a.w;
          ctx.fillRect(x0, a.y, Math.max(1, x1 - x0), a.h);
          runStart = -1;
        }
      }
      ctx.restore();

      if (lo < 0 && hi > 0) panel.axisLine(colors, { y: 0 });

      panel.clip();
      for (const b of buffers) {
        panel.series(b.data, b.n, 0, WINDOW_SECONDS, { color: colors[b.color], width: 1.8 });
      }
      panel.unclip();

      // Keep the values in a stable rail rather than attaching longer labels to
      // moving endpoints. The coloured marker plus text means identity never
      // rests on hue alone, while tabular numerals prevent horizontal jitter.
      for (const b of buffers) {
        b.readout.row.style.setProperty('--trace-color', colors.text[b.color]);
        const value = b.n === 0 ? NaN : b.data[b.n - 1];
        b.readout.output.textContent = formatValue(value, b.digits);
      }

      panel.title(spec.label, colors, spec.unit);
    }
  }

  return { render };
}
