import { Panel, niceTicks } from '../plot.js';
import { tilePrimaryValue } from '../stats.js';
import { TRACE_SECONDS, TRACE_SAMPLE_HZ } from '../../model/index.js';

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

/** First trace sample allowed to influence a newly fitted parameter state. */
export function waveformScaleStart(sampleCount, secondsSinceChange) {
  const samplesInState = Math.max(1, Math.min(
    sampleCount,
    Math.ceil(Math.max(0, secondsSinceChange) * TRACE_SAMPLE_HZ),
  ));
  return Math.max(0, sampleCount - samplesInState);
}

/** Map a pointer coordinate onto the common twelve-second plotting window. */
export function timelineFractionAt(clientX, rectLeft, plotLeft, plotWidth) {
  if (!(plotWidth > 0)) return 1;
  return Math.min(1, Math.max(0, (clientX - rectLeft - plotLeft) / plotWidth));
}

/**
 * Paw is always a live pressure. Pplat is a breath-level passive-mechanics
 * estimate and may accompany it, but must never replace or suppress it.
 */
export function airwayReadout(metrics) {
  const paw = tilePrimaryValue('paw', metrics);
  if (paw === '—') return paw;
  return metrics.interpretability?.plateau?.level === 'ok'
    ? `${paw} (Pplat ${metrics.pplat.toFixed(1)})`
    : paw;
}

const STRIPS = [
  {
    id: 'resp',
    label: 'Airway, alveolar & pleural pressure',
    unit: 'cmH₂O',
    height: 1.1,
    series: [
      {
        channel: 'paw', color: 'airway', label: 'Paw',
        ariaLabel: 'Airway pressure',
        summary: airwayReadout,
      },
      {
        channel: 'palv', color: 'alveolar', label: 'P', subscript: 'alv',
        ariaLabel: 'Alveolar pressure',
        summary: (m) => tilePrimaryValue('palv', m),
      },
      {
        channel: 'ppl', color: 'pleural', label: 'Ppl',
        summary: (m) => (m.valid
          ? `${tilePrimaryValue('ppl', m)} (Δ ${m.pplSwing.toFixed(1)})`
          : '—'),
      },
    ],
  },
  {
    id: 'transpulmonary',
    label: 'Transpulmonary pressure',
    unit: 'cmH₂O',
    height: 0.65,
    series: [
      {
        channel: 'pl', color: 'transpulmonary', label: 'P', subscript: 'L',
        ariaLabel: 'Transpulmonary pressure',
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

export function createWaveforms(container, { onSeek } = {}) {
  container.classList.add('waveform-stack');
  const timeline = document.createElement('div');
  timeline.className = 'waveform-timeline';
  const timelineLabel = document.createElement('label');
  timelineLabel.htmlFor = 'waveform-time-cursor';
  timelineLabel.textContent = 'Time cursor';
  const timelineInput = document.createElement('input');
  timelineInput.id = 'waveform-time-cursor';
  timelineInput.className = 'waveform-time-cursor';
  timelineInput.type = 'range';
  timelineInput.min = '0';
  timelineInput.max = '1000';
  timelineInput.step = '1';
  timelineInput.value = '1000';
  timelineInput.disabled = true;
  const timelineStatus = document.createElement('output');
  timelineStatus.className = 'waveform-time-status';
  timelineStatus.htmlFor = timelineInput.id;
  timelineStatus.textContent = 'Pause to inspect';
  timeline.append(timelineLabel, timelineInput, timelineStatus);
  container.appendChild(timeline);

  let timelinePaused = false;
  let timelineFraction = null;

  const seek = (fraction) => {
    if (!timelinePaused || timelineInput.disabled) return;
    const next = Math.min(1, Math.max(0, fraction));
    timelineInput.value = String(Math.round(next * 1000));
    onSeek?.(next);
  };
  timelineInput.addEventListener('input', () => seek(Number(timelineInput.value) / 1000));

  // History may span more than one parameter state. Its scale must not: after
  // a control changes, old extremes remain useful context but must not compress
  // the physiology generated by the new settings.
  let viewEpoch = 0;
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
    const strip = {
      spec,
      plot,
      canvas,
      readouts,
      panel: new Panel(canvas, { padding: [16, 14, spec.axis ? 22 : 6, 46] }),
      domain: null,     // the y range currently displayed
      insideSince: -1,  // when the data last started fitting comfortably inside it
    };
    let dragging = false;
    const seekFromPointer = (event) => {
      if (!timelinePaused || timelineInput.disabled) return;
      const rect = plot.getBoundingClientRect();
      const area = strip.panel.plotArea;
      seek(timelineFractionAt(event.clientX, rect.left, area.x, area.w));
    };
    plot.addEventListener('pointerdown', (event) => {
      if (!timelinePaused || timelineInput.disabled) return;
      dragging = true;
      plot.setPointerCapture?.(event.pointerId);
      seekFromPointer(event);
    });
    plot.addEventListener('pointermove', (event) => { if (dragging) seekFromPointer(event); });
    plot.addEventListener('pointerup', (event) => {
      dragging = false;
      plot.releasePointerCapture?.(event.pointerId);
    });
    plot.addEventListener('pointercancel', () => { dragging = false; });
    return strip;
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
        // The complete buffer is still drawn, so the intervention remains
        // visible. Only samples produced since the latest parameter change set
        // the new vertical domain.
        const from = waveformScaleStart(n, sim.time - viewEpoch);
        for (let i = from; i < n; i++) {
          if (data[i] < lo) lo = data[i];
          if (data[i] > hi) hi = data[i];
        }
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

      // One cursor crosses every strip, making the respiratory and vascular
      // values interrogable on the same clock. It is presentation state only:
      // moving it never rewinds or perturbs the simulator.
      if (timelineFraction !== null) {
        const x = panel.plotArea.x + timelineFraction * panel.plotArea.w;
        ctx.save();
        ctx.strokeStyle = colors.ink;
        ctx.globalAlpha = 0.72;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, panel.plotArea.y);
        ctx.lineTo(x, panel.plotArea.y + panel.plotArea.h);
        ctx.stroke();
        ctx.restore();
      }

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

  /** Start a new visual state without deleting the preceding waveform history. */
  function resetView(sim) {
    viewEpoch = sim.time;
    for (const strip of strips) {
      strip.domain = null;
      strip.insideSince = sim.time;
    }
  }

  /** Synchronise the native slider and the cursor painted over every strip. */
  function setTimeline({ paused, available, fraction = 1, secondsAgo = 0 }) {
    timelinePaused = paused;
    timelineInput.disabled = !paused || !available;
    timelineFraction = paused && available ? Math.min(1, Math.max(0, fraction)) : null;
    timelineInput.value = String(Math.round((timelineFraction ?? 1) * 1000));
    timeline.classList.toggle('is-active', paused && available);
    if (!paused) timelineStatus.textContent = 'Pause to inspect';
    else if (!available) timelineStatus.textContent = 'Waiting for history';
    else timelineStatus.textContent = secondsAgo < 0.08 ? 'Now' : `−${secondsAgo.toFixed(1)} s`;
    const text = timelineStatus.textContent;
    timelineInput.setAttribute('aria-valuetext', text);
  }

  return { render, renderReadouts, resetView, setTimeline };
}
