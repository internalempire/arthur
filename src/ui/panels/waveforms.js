import { Panel, niceTicks } from '../plot.js';
import { TRACE_SECONDS } from '../../model/simulator.js';

// Three time-aligned strips. Respiratory and haemodynamic pressures are kept on
// separate strips rather than sharing one plot with two y-axes: cmH2O and mmHg
// are different scales, and a dual axis would invite reading one against the
// other.

const WINDOW_SECONDS = TRACE_SECONDS;

const STRIPS = [
  {
    id: 'resp',
    label: 'Airway & pleural pressure',
    unit: 'cmH₂O',
    height: 1.0,
    series: [
      { channel: 'paw', color: 'airway', label: 'Paw' },
      { channel: 'ppl', color: 'pleural', label: 'Ppl' },
    ],
  },
  {
    id: 'hemo',
    label: 'Vascular pressures',
    unit: 'mmHg',
    height: 1.35,
    series: [
      { channel: 'art', color: 'arterial', label: 'Arterial' },
      { channel: 'pap', color: 'pulmonary', label: 'PA' },
      { channel: 'cvp', color: 'venous', label: 'CVP' },
    ],
  },
  {
    id: 'vol',
    label: 'Lung volume above FRC',
    unit: 'mL',
    height: 0.75,
    axis: true,
    series: [
      { channel: 'volume', color: 'volume', label: 'Volume' },
    ],
  },
];

export function createWaveforms(container) {
  container.classList.add('waveform-stack');
  const strips = STRIPS.map((spec) => {
    const wrap = document.createElement('div');
    wrap.className = 'strip';
    wrap.style.flexGrow = String(spec.height);
    const canvas = document.createElement('canvas');
    wrap.appendChild(canvas);
    container.appendChild(wrap);
    return { spec, canvas, panel: new Panel(canvas, { padding: [16, 62, spec.axis ? 22 : 6, 46] }) };
  });

  function render(sim, colors) {
    // Inspiratory phase shading is shared by every strip.
    const insp = sim.trace('insp');
    const inspData = insp.data;
    const inspN = insp.n;

    for (const { spec, panel } of strips) {
      panel.resize();
      const ctx = panel.begin();

      // Establish the y domain from the data actually on screen.
      let lo = Infinity, hi = -Infinity;
      const buffers = [];
      for (const s of spec.series) {
        const { data, n } = sim.trace(s.channel);
        buffers.push({ ...s, data, n });
        for (let i = 0; i < n; i++) { if (data[i] < lo) lo = data[i]; if (data[i] > hi) hi = data[i]; }
      }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      const pad = Math.max((hi - lo) * 0.12, 1);
      panel.setDomain(0, WINDOW_SECONDS, lo - pad, hi + pad);

      const ticks = niceTicks(lo - pad, hi + pad, 3);
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

      // Direct labels at the right edge — identity never rests on hue alone.
      for (const b of buffers) {
        if (b.n === 0) continue;
        const v = b.data[b.n - 1];
        panel.label(b.label, WINDOW_SECONDS, v, {
          color: colors[b.color], dx: 8, halo: colors.surface,
        });
      }

      panel.title(spec.label, colors, spec.unit);
    }
  }

  return { render };
}
