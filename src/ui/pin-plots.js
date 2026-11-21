import { Panel, niceTicks } from './plot.js';
import { PinCycles } from './pin-cycles.js';
import { fastGuytonCurves } from './panels/guyton.js';
import { openLungResistanceCurve } from './panels/pvrcurve.js';
import { chestWallPressure, curveIntersection } from '../model/index.js';

const dash = [7, 4];
const value = (x, digits = 2) => Number.isFinite(x) ? x.toFixed(digits) : '—';
const tickLabel = x => String(Number(x.toPrecision(5)));
const plotSpecs = {
  guyton: ['Guyton · breath mean', 'Right atrial pressure (mmHg vs atmosphere)', 'Flow (L/min)', 2, 2],
  campbell: ['Campbell · complete breath', 'Pleural pressure (cmH₂O)', 'Lung volume (L)', 2, 0.25],
  rv: ['Right ventricle', 'Volume (mL)', 'Transmural P (mmHg)', 20, 10],
  lv: ['Left ventricle', 'Volume (mL)', 'Transmural P (mmHg)', 20, 20],
  pvr: ['Pulmonary vessels · open-lung reference', 'Lung volume (L)', 'Reference resistance (WU)', 0.5, 0.5],
};

function bounds(lines) {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const points of lines) {
    for (let i = 0; i < points.length; i += 2) {
      xmin = Math.min(xmin, points[i]); xmax = Math.max(xmax, points[i]);
      ymin = Math.min(ymin, points[i + 1]); ymax = Math.max(ymax, points[i + 1]);
    }
  }
  return { xmin, xmax, ymin, ymax };
}

function createPlot(layer, key) {
  const [title, xLabel, yLabel, xStep, yStep] = plotSpecs[key];
  const box = document.createElement('div');
  box.className = 'pin-plot';
  box.dataset.plot = key;
  box.innerHTML = '<h3></h3><div class="pin-plot-paper"><canvas aria-hidden="true"></canvas></div><p></p>';
  box.firstElementChild.textContent = title;
  layer.append(box);
  const label = box.querySelector('p');
  const panel = new Panel(box.querySelector('canvas'), { padding: [8, 14, 32, 42] });
  let domain = null;
  let comparedA, comparedB, coincide = false;
  return {
    panel,
    coincide(a, b) {
      if (a !== comparedA || b !== comparedB) {
        comparedA = a; comparedB = b;
        coincide = a.length > 0 && a.length === b.length && a.every((v, i) => v === b[i]);
      }
      return coincide;
    },
    caption(text) { if (label.textContent !== text) label.textContent = text; },
    frame(lines, colors) {
      panel.resize();
      panel.begin();
      if (!lines.some(line => line.length)) return;
      const { xmin, xmax, ymin, ymax } = bounds(lines);
      // Expand only when another world needs space. A new pin must not cause
      // apparent movement just because a smaller domain would also fit it.
      const next = [
        Math.floor(xmin / xStep) * xStep, Math.ceil(xmax / xStep) * xStep,
        Math.floor(ymin / yStep) * yStep, Math.ceil(ymax / yStep) * yStep,
      ];
      if (next[0] === next[1]) next[1] += xStep;
      if (next[2] === next[3]) next[3] += yStep;
      domain = domain ? [Math.min(next[0], domain[0]), Math.max(next[1], domain[1]),
        Math.min(next[2], domain[2]), Math.max(next[3], domain[3])] : next;
      panel.setDomain(...domain);
      panel.grid(colors, { xTicks: niceTicks(domain[0], domain[1], panel.w < 220 ? 3 : 5),
        yTicks: niceTicks(domain[2], domain[3], 4), xFormat: tickLabel, yFormat: tickLabel, xLabel, yLabel });
    },
    reset() { domain = null; },
  };
}

function twinLines(panel, a, b, color, pinColor) {
  panel.line(a, { color, width: 2.8 });
  panel.line(b, { color: pinColor, width: 1.9, dash });
}

function renderGuyton(plot, worlds, name, colors) {
  // The plotted mean smooths over a heartbeat and then a respiratory period.
  // Immediately after a change its input still includes the preceding state.
  const curves = worlds.map(w => w.metrics.valid && !w.hold &&
    w.time - w.lastBreathResetTime >= 60 / w.effective.hr + 60 / w.effective.rr
    ? fastGuytonCurves(w, 'mean') : null);
  const lines = curves.filter(Boolean).flatMap(c => [c.vr.points, c.cf.points]);
  plot.frame(lines, colors);
  const { panel } = plot;
  const crosses = curves.map(c => c && curveIntersection(c.vr.points, c.cf.points));
  for (const [key, color] of [['vr', colors.venous], ['cf', colors.arterial]]) {
    twinLines(panel, curves[0]?.[key].points ?? [], curves[1]?.[key].points ?? [], color, color);
  }
  for (const i of [1, 0]) {
    const point = crosses[i];
    if (!point) continue;
    const {x, y} = point, ctx = panel.ctx;
    const px = panel.sx(x), py = panel.sy(y), size = i ? 6 : 3.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px-size, py-size); ctx.lineTo(px+size, py+size);
    ctx.moveTo(px-size, py+size); ctx.lineTo(px+size, py-size);
    ctx.strokeStyle = i ? colors.text.volume : colors.ink;
    ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const nearRight = px > panel.w - 74;
    panel.label(i ? name : 'Current', x, y, { color: colors.inkSecondary, halo: colors.surface,
      dx: nearRight ? -6 : 6, align: nearRight ? 'right' : 'left', dy: i ? -11 : 12 });
  }
  const missing = crosses.map((p, i) => {
    if (p) return '';
    const reason = !worlds[i].metrics.valid ? 'outside model range'
      : curves[i] ? 'no crossing in range' : 'waiting for a fresh mean';
    return (i ? name : 'Current') + ': '+reason+'. ';
  }).join('');
  plot.caption('Venous return (blue) · RV function (red) · × estimated crossing. '+missing+
    'Net caval inflow: Current '+value(curves[0]?.state.flow)+' · '+name+' '+value(curves[1]?.state.flow)+' L/min.');
}

function endMarkers(panel, coords, colors) {
  // The outer ring remains visible when the two points coincide.
  if (coords[1]) panel.dot(...coords[1], { color: colors.surface, ring: colors.text.volume, r: 4.7 });
  if (coords[0]) panel.dot(...coords[0], { color: colors.ink, r: 3 });
}

function renderCampbell(plot, worlds, records, name, colors) {
  const lines = records.map(c => c?.breath ?? []);
  const {panel} = plot;
  const walls = [];
  // Show the relaxed pressure at the same absolute volumes as the two breaths.
  const { ymin, ymax } = bounds(lines);
  if (Number.isFinite(ymin)) {
    for (const w of worlds) {
      const wall = [];
      for (let i = 0; i <= 36; i++) {
        const v = ymin + (ymax - ymin) * i / 36;
        wall.push(chestWallPressure(w.effective, v), v);
      }
      walls.push(wall);
    }
  }
  plot.frame([...lines, ...walls], colors);
  if (walls.length) {
    panel.line(walls[0], {color: colors.inkMuted, width: 1.2, dash: [2, 3]});
    if (walls[1].some((v,i) => v !== walls[0][i])) {
      panel.line(walls[1], {color: colors.text.volume, width: 1, dash: [2, 3]});
    }
  }
  twinLines(panel, ...lines, colors.pleural, colors.text.volume);
  endMarkers(panel, records.map(c => c && [c.pressure, c.volume]), colors);
  plot.caption((plot.coincide(...lines) ? 'Breaths coincide. ' : '')+
    'Dotted: relaxed chest wall. End-expiratory volume: Current '+value(records[0]?.volume)+
    ' · '+name+' '+value(records[1]?.volume)+' L.');
}

function renderVentricle(plot, key, records, name, colors) {
  const lines = records.map(c => c?.[key] ?? []);
  plot.frame(lines, colors);
  twinLines(plot.panel, ...lines, key === 'rv' ? colors.venous : colors.arterial, colors.text.volume);
  const widths = lines.map(line => {
    if (!line.length) return null;
    const v = bounds([line]);
    return v.xmax - v.xmin;
  });
  plot.caption('Last beat before inspiration. Loop width: Current '+value(widths[0], 0)+' · '+name+' '+value(widths[1], 0)+' mL.');
}

function renderResistance(plot, curves, records, name, colors) {
  const same = curves[0] === curves[1];
  const points = records.map(c => c && [c.volume, c.resistance]);
  plot.frame([...curves, ...points.filter(Boolean)], colors);
  twinLines(plot.panel, curves[0], same ? [] : curves[1], colors.flow, colors.text.volume);
  endMarkers(plot.panel, points, colors);
  plot.caption((same ? 'Shared open-lung curve. ' : '')+'End-expiratory reference: Current '+value(records[0]?.resistance)+
    ' · '+name+' '+value(records[1]?.resistance)+' WU.');
}

/** UI-only histories and canvases exist only after the user asks for the plots. */
export function createPinPlots(current, pins) {
  const observers = new Map(), layers = [], plots = {};
  let hiddenCycles = new WeakMap();
  const resistanceCache = new Map();
  let enabled = false;

  function mount() {
    for (const [selector, keys] of [['guyton', ['guyton']], ['campbell', ['campbell']], ['pv', ['rv','lv']], ['pvr', ['pvr']]]) {
      const section = document.querySelector('.panel-'+selector);
      const layer = document.createElement('div');
      layer.className = 'pin-plot-layer';
      layer.id = 'pin-overlay-'+selector;
      layer.hidden = true;
      section.append(layer);
      for (const key of keys) plots[key] = createPlot(layer, key);
      layers.push({ section, layer, describedBy: section.getAttribute('aria-describedby') });
    }
  }

  function display(show) {
    for (const {section, layer, describedBy} of layers) {
      if (layer.hidden === !show) continue;
      layer.hidden = !show;
      section.classList.toggle('show-pin-plot', show);
      section.setAttribute('aria-describedby', show ? layer.id : describedBy);
    }
  }

  function sync(newFork = null) {
    if (!pins.selected) {
      enabled = false;
      hiddenCycles = new WeakMap();
    }
    const worlds = enabled ? [current, ...pins.states.map(s => s.sim)] : [];
    for (const [sim, entry] of observers) {
      if (worlds.includes(sim)) continue;
      entry.stop(); observers.delete(sim);
      if (!enabled && pins.selected) {
        hiddenCycles.set(sim, { cycles: entry.cycles, time: sim.time, resp: sim.resp,
          settings: JSON.stringify(sim.params), resetTime: sim.lastBreathResetTime, hold: sim.hold });
      }
    }
    for (const sim of worlds) {
      if (observers.has(sim)) continue;
      const prior = hiddenCycles.get(sim);
      // Hiding and showing a trace while paused is purely visual. If time or
      // the prescription changed during the gap, collect a fresh whole cycle.
      const resume = prior && prior.time === sim.time && prior.resp === sim.resp &&
        prior.resetTime === sim.lastBreathResetTime && prior.hold === sim.hold &&
        prior.settings === JSON.stringify(sim.params);
      const cycles = resume ? prior.cycles : new PinCycles();
      hiddenCycles.delete(sim);
      if (sim === newFork && observers.has(current)) {
        // The fork inherits the exact same past. Each world will append to
        // its own in-progress breath from this instant onward.
        Object.assign(cycles, structuredClone(observers.get(current).cycles));
      }
      observers.set(sim, { cycles, stop: sim.observePlotCycles(cycles) });
    }
    if (!enabled) display(false);
  }

  function openCurve(sim) {
    const p = sim.params;
    // At open fraction one only these settings enter the geometric curve.
    const key = [p.clung, p.lungCapacity, p.pvrBase].join('/');
    if (!resistanceCache.has(key)) {
      if (resistanceCache.size >= 12) resistanceCache.clear();
      resistanceCache.set(key, openLungResistanceCurve(p).total);
    }
    return resistanceCache.get(key);
  }

  return {
    get enabled() { return enabled; },
    setEnabled(on) {
      enabled = on && !!pins.selected;
      if (enabled && !layers.length) mount();
      for (const plot of Object.values(plots)) plot.reset();
      sync();
    },
    sync,
    render(colors, historical) {
      if (!enabled) return false;
      const show = !!pins.selected && !historical;
      display(show);
      if (!show) return false;
      const worlds = [current, pins.selected.sim];
      const name = 'State '+pins.selected.id;
      const records = worlds.map(sim => sim.metrics.valid ? observers.get(sim)?.cycles.complete : null);
      renderGuyton(plots.guyton, worlds, name, colors);
      renderCampbell(plots.campbell, worlds, records, name, colors);
      for (const key of ['rv', 'lv']) renderVentricle(plots[key], key, records, name, colors);
      renderResistance(plots.pvr, worlds.map(openCurve), records, name, colors);
      return true;
    },
    cycleStatus(running) {
      if (!enabled || !pins.selected) return '';
      const worlds = [current, pins.selected.sim];
      if (worlds.some(w => !w.metrics.valid)) return 'Cycle readings are unavailable for a state outside the model range.';
      const cycles = worlds.map(w => observers.get(w)?.cycles.complete);
      if (cycles.some(c => !c)) return running ? 'Waiting for a complete, uninterrupted breath…'
        : 'Press Play to collect a complete breath for the cycle plots.';
      return 'Last complete breath ended '+value(current.time - cycles[0].endTime, 1)+' s ago (current), '+
        value(pins.selected.sim.time - cycles[1].endTime, 1)+' s ago (State '+pins.selected.id+').';
    },
  };
}
