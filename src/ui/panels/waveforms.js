import { Panel, niceTicks } from '../plot.js';
import { tilePrimaryValue } from '../stats.js';
import { TRACE_SECONDS } from '../../model/index.js';

// Three time-aligned strips. Respiratory and haemodynamic pressures are kept on
// separate strips rather than sharing one plot with two y-axes: cmH2O and mmHg
// are different scales, and a dual axis would invite reading one against the
// other. Each strip also owns a fixed readout rail. Beat- and breath-level
// quantities remain summaries, while the two pressures explicitly requested as
// live states (Ppl and PL) use the current model sample at the rail's slower,
// readable update cadence.

const WINDOW_SECONDS = TRACE_SECONDS;
// How long the data must sit comfortably inside the current range before it is
// allowed to shrink, in seconds of simulated time.
const SHRINK_DELAY = 4;

const STRIPS = [
  {
    id: 'resp',
    label: 'Respiratory pressures',
    unit: 'cmH₂O',
    height: 1.0,
    series: [
      {
        channel: 'paw', color: 'airway', label: 'Paw · Pplat',
        summary: (m) => tilePrimaryValue('pplat', m),
      },
      {
        channel: 'ppl', color: 'pleural', label: 'Ppl',
        summary: (m) => (m.valid
          ? `${tilePrimaryValue('ppl', m)} (Δ ${m.pplSwing.toFixed(1)})`
          : '—'),
      },
      {
        channel: 'pl', color: 'transpulmonary', label: 'P', subscript: 'L',
        ariaLabel: 'Transpulmonary pressure',
        paintOrder: 0,
        summary: (m) => tilePrimaryValue('pl', m),
      },
    ],
  },
  {
    id: 'hemo',
    label: 'Vascular pressures',
    unit: 'mmHg',
    height: 1.35,
    series: [
      {
        channel: 'art', color: 'arterial', label: 'Arterial',
        summary: (m) => tilePrimaryValue('map', m),
      },
      {
        channel: 'pap', color: 'pulmonary', label: 'PAP',
        summary: (m) => tilePrimaryValue('pap', m),
      },
      {
        channel: 'cvp', color: 'venous', label: 'CVP',
        summary: (m) => tilePrimaryValue('cvp', m),
      },
    ],
  },
  {
    id: 'vol',
    label: 'Lung volume above FRC',
    unit: 'mL',
    height: 0.75,
    axis: true,
    series: [
      {
        channel: 'volume', color: 'volume', label: 'Volume · VT',
        // There is no separate VT tile. The delivered breath-level value is
        // the stable summary already exposed in the waveform data disclosure.
        summary: (m) => (m.valid ? m.vtDelivered.toFixed(0) : '—'),
      },
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
    readoutList.setAttribute('aria-label', `${spec.label}: displayed values in ${spec.unit}`);
    const readouts = new Map();
    for (const series of spec.series) {
      const row = document.createElement('div');
      row.className = 'waveform-readout';

      const label = document.createElement('dt');
      label.className = 'waveform-readout-label';
      label.append(series.label);
      if (series.subscript) {
        const subscript = document.createElement('sub');
        subscript.textContent = series.subscript;
        label.appendChild(subscript);
      }
      if (series.ariaLabel) label.setAttribute('aria-label', series.ariaLabel);

      const value = document.createElement('dd');
      const output = document.createElement('output');
      output.className = 'waveform-readout-value';
      output.setAttribute('aria-label', `${series.ariaLabel ?? series.label}, displayed value in ${spec.unit}`);
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
        buffers.push({ ...s, data, n });
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
      // The rail keeps the clinically useful Paw, Ppl, PL reading order. Paint
      // PL first instead, so its purple stroke stays underneath Paw and Ppl
      // wherever the pressure curves meet or overlap.
      const paintBuffers = [...buffers]
        .sort((a, b) => (a.paintOrder ?? 1) - (b.paintOrder ?? 1));
      for (const b of paintBuffers) {
        panel.series(b.data, b.n, 0, WINDOW_SECONDS, { color: colors[b.color], width: 1.8 });
      }
      panel.unclip();

      panel.title(spec.label, colors, spec.unit);
    }
  }

  /**
   * Update beside the numerical tiles, not beside every animation frame. The
   * current Ppl and PL values therefore remain readable while retaining the
   * same content and cadence as their tiles; beat- and breath-level summaries
   * keep their existing measurement windows.
   */
  function renderReadouts(metrics, colors) {
    for (const strip of strips) {
      for (const series of strip.spec.series) {
        const readout = strip.readouts.get(series.channel);
        readout.row.style.setProperty('--trace-color', colors.text[series.color]);
        readout.output.textContent = series.summary(metrics);
      }
    }
  }

  return { render, renderReadouts };
}
