// Figures for the manual, drawn from the model rather than by hand.
//
// Every curve here is the same function the running simulator calls, so a
// figure cannot drift away from the behaviour it illustrates. Re-run this
// script after any change to the physiology:
//
//   node manual/figure/generate.mjs
//
// Output is plain SVG with no external references, so it embeds in markdown,
// prints, and follows the reader's colour scheme.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { defaultParams } from '../../src/model/parameters.js';
import { pvrComponents, lungVolumeAtPl, openBand, stepOpenFraction, NORMAL_FRC } from '../../src/model/lung.js';
import { RESISTANCE_TO_WOOD } from '../../src/model/units.js';
import { Simulator } from '../../src/model/simulator.js';
import { venousReturnCurve, cardiacFunctionCurve, curveIntersection } from '../../src/model/circulation.js';

const OUT = dirname(fileURLToPath(import.meta.url));

const W = 760;
const H = 430;
const PAD = { l: 66, r: 150, t: 26, b: 52 };
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

// A <style> element inside an SVG is NOT scoped to that SVG. As long as the
// figure is loaded through <img src> it is a separate document and nothing
// escapes, but the moment a page inlines the markup — which is the usual way to
// let a figure follow the site's own theme — these rules join the page's
// cascade. Class names like .title and .label would then restyle the manual.
// Every selector is therefore qualified by the root class below, and the root
// carries it. Nothing here can match outside the figure.
const ROOT = 'arthur-fig';

// The palette is expressed as custom properties so a page can override it, with
// a dark-scheme fallback for the standalone file.
const STYLE = `
  svg.${ROOT} .bg { fill: none }
  svg.${ROOT} .axis { stroke: var(--fig-axis, #9aa4b2); stroke-width: 1 }
  svg.${ROOT} .grid { stroke: var(--fig-grid, #d7dce3); stroke-width: 1; stroke-dasharray: 2 4 }
  svg.${ROOT} .tick { fill: var(--fig-muted, #6b7480); font: 11px system-ui, sans-serif }
  svg.${ROOT} .label { fill: var(--fig-text, #2b3138); font: 12px system-ui, sans-serif }
  svg.${ROOT} .title { fill: var(--fig-text, #2b3138); font: 600 13px system-ui, sans-serif }
  svg.${ROOT} .lm { stroke: var(--fig-grid, #d7dce3); stroke-width: 1 }
  svg.${ROOT} .lm-text { fill: var(--fig-muted, #6b7480); font: 600 11px system-ui, sans-serif }
  svg.${ROOT} .total { stroke: var(--fig-total, #1f6feb); stroke-width: 2.5; fill: none }
  svg.${ROOT} .alv { stroke: var(--fig-alv, #d1495b); stroke-width: 1.6; fill: none; stroke-dasharray: 6 3 }
  svg.${ROOT} .extra { stroke: var(--fig-extra, #2a9d8f); stroke-width: 1.6; fill: none; stroke-dasharray: 6 3 }
  svg.${ROOT} .nadir { stroke: var(--fig-total, #1f6feb); stroke-width: 1; stroke-dasharray: 3 3 }
  svg.${ROOT} .dot { fill: var(--fig-total, #1f6feb); stroke: none }
  @media (prefers-color-scheme: dark) {
    svg.${ROOT} .axis { stroke: #5b6472 }
    svg.${ROOT} .grid, svg.${ROOT} .lm { stroke: #363d47 }
    svg.${ROOT} .tick, svg.${ROOT} .lm-text { fill: #8b95a3 }
    svg.${ROOT} .label, svg.${ROOT} .title { fill: #d6dbe2 }
    svg.${ROOT} .total, svg.${ROOT} .nadir { stroke: #58a6ff }
    svg.${ROOT} .dot { fill: #58a6ff }
    svg.${ROOT} .alv { stroke: #f08c9a }
    svg.${ROOT} .extra { stroke: #4fd1c1 }
  }
`;

function jCurveFigure() {
  // The fully open normal lung: no collapsed compartment, no hypoxic tone, so
  // the figure shows the mechanical curve alone rather than a phenotype.
  const p = { ...defaultParams(), collapsed: 0, hpv: 0 };
  const rv = lungVolumeAtPl(p, 0, 1);
  const tlc = lungVolumeAtPl(p, 35, 1);

  const samples = [];
  const n = 240;
  for (let i = 0; i < n; i++) {
    const v = rv + ((tlc - rv) * i) / (n - 1);
    // phi = 1 pins the lung fully open: this is the mechanical curve, not the
    // path a derecruiting lung would actually travel.
    const c = pvrComponents(p, v, null, 1);
    samples.push({
      v,
      alv: c.alveolarPath * RESISTANCE_TO_WOOD,
      extra: c.extraAlveolarPath * RESISTANCE_TO_WOOD,
      total: c.total * RESISTANCE_TO_WOOD,
    });
  }

  const nadir = samples.reduce((a, b) => (b.total < a.total ? b : a));
  const yMax = Math.max(...samples.map((s) => s.total)) * 1.08;
  const x = (v) => PAD.l + ((v - rv) / (tlc - rv)) * plotW;
  const y = (r) => PAD.t + plotH - (r / yMax) * plotH;
  const path = (key) => samples
    .map((s, i) => `${i ? 'L' : 'M'}${x(s.v).toFixed(1)} ${y(s[key]).toFixed(1)}`)
    .join(' ');

  const yTicks = [];
  for (let r = 0.5; r < yMax; r += 0.5) {
    yTicks.push(`<line class="grid" x1="${PAD.l}" y1="${y(r).toFixed(1)}" x2="${PAD.l + plotW}" y2="${y(r).toFixed(1)}"/>`
      + `<text class="tick" x="${PAD.l - 9}" y="${(y(r) + 4).toFixed(1)}" text-anchor="end">${r.toFixed(1)}</text>`);
  }

  const marks = [['RV', rv], ['FRC', NORMAL_FRC], ['TLC', tlc]].map(([name, v]) =>
    `<line class="lm" x1="${x(v).toFixed(1)}" y1="${PAD.t}" x2="${x(v).toFixed(1)}" y2="${PAD.t + plotH}"/>`
    + `<text class="lm-text" x="${x(v).toFixed(1)}" y="${PAD.t + plotH + 18}" text-anchor="middle">${name}</text>`
    + `<text class="tick" x="${x(v).toFixed(1)}" y="${PAD.t + plotH + 33}" text-anchor="middle">${v.toFixed(1)} L</text>`);

  const key = (cls, dy, text) =>
    `<line class="${cls}" x1="${PAD.l + plotW + 16}" y1="${dy}" x2="${PAD.l + plotW + 44}" y2="${dy}"/>`
    + `<text class="label" x="${PAD.l + plotW + 50}" y="${dy + 4}">${text}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="${ROOT}" role="img"
  aria-label="Pulmonary vascular resistance against lung volume in the fully open normal lung, showing a J-shaped total with its minimum at functional residual capacity, an alveolar component rising toward total lung capacity and an extra-alveolar component rising toward residual volume.">
<style>${STYLE}</style>
<rect class="bg" width="${W}" height="${H}"/>
<text class="title" x="${PAD.l}" y="16">Resistance of the fully open lung against lung volume</text>
${yTicks.join('\n')}
${marks.join('\n')}
<line class="axis" x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${PAD.t + plotH}"/>
<line class="axis" x1="${PAD.l}" y1="${PAD.t + plotH}" x2="${PAD.l + plotW}" y2="${PAD.t + plotH}"/>
<path class="extra" d="${path('extra')}"/>
<path class="alv" d="${path('alv')}"/>
<path class="total" d="${path('total')}"/>
<line class="nadir" x1="${x(nadir.v).toFixed(1)}" y1="${y(nadir.total).toFixed(1)}" x2="${x(nadir.v).toFixed(1)}" y2="${PAD.t + plotH}"/>
<circle class="dot" cx="${x(nadir.v).toFixed(1)}" cy="${y(nadir.total).toFixed(1)}" r="3.5"/>
<text class="label" transform="translate(18 ${PAD.t + plotH / 2}) rotate(-90)" text-anchor="middle">Wood units</text>
<text class="label" x="${PAD.l + plotW / 2}" y="${H - 6}" text-anchor="middle">Lung volume (L)</text>
${key('total', PAD.t + 22, 'total')}
${key('alv', PAD.t + 44, 'alveolar')}
${key('extra', PAD.t + 66, 'extra-alveolar')}
<text class="tick" x="${PAD.l + plotW + 16}" y="${PAD.t + 96}">minimum ${nadir.total.toFixed(2)} WU</text>
<text class="tick" x="${PAD.l + plotW + 16}" y="${PAD.t + 112}">at ${nadir.v.toFixed(2)} L</text>
</svg>
`;
}

// --- Guyton construction -----------------------------------------------------

function settled(overrides, seconds = 40) {
  const sim = new Simulator();
  sim.params = { ...defaultParams(), ...overrides };
  sim.reset();
  sim.advance(seconds, true);
  return sim;
}

function guytonFigure() {
  // Two states differing only in applied PEEP. Both curves come from the same
  // functions the running app plots, so the figure cannot disagree with it.
  const states = [
    { label: 'PEEP 5', peep: 5, cls: 'total' },
    { label: 'PEEP 15', peep: 15, cls: 'alv' },
  ].map((s) => {
    const sim = settled({ mode: 'vcv', pmus: 0, vt: 500, rr: 14, peep: s.peep });
    // The curves must be evaluated on the same clock as the point they cross:
    // `operatingPoint` is the cycle-mean state the app itself plots against.
    const mean = sim.metrics.operatingPoint;
    const vr = venousReturnCurve(sim.params, sim.circ, mean).points;
    const cf = cardiacFunctionCurve(sim.params, sim.circ, mean).points;
    return { ...s, vr, cf, cross: curveIntersection(vr, cf) };
  });

  const pairs = (a) => { const o = []; for (let i = 0; i < a.length; i += 2) o.push([a[i], a[i + 1]]); return o; };
  const all = states.flatMap((s) => [...pairs(s.vr), ...pairs(s.cf)]);
  const xLo = Math.min(...all.map((q) => q[0]));
  const xHi = Math.max(...all.map((q) => q[0]));
  const yHi = Math.max(...all.map((q) => q[1])) * 1.1;

  const x = (v) => PAD.l + ((v - xLo) / (xHi - xLo)) * plotW;
  const y = (v) => PAD.t + plotH - (v / yHi) * plotH;
  const path = (flat) => pairs(flat).map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(1)} ${y(Math.max(0, b)).toFixed(1)}`).join(' ');

  const ticks = [];
  for (let q = 1; q < yHi; q += 1) {
    ticks.push(`<line class="grid" x1="${PAD.l}" y1="${y(q).toFixed(1)}" x2="${PAD.l + plotW}" y2="${y(q).toFixed(1)}"/>`
      + `<text class="tick" x="${PAD.l - 9}" y="${(y(q) + 4).toFixed(1)}" text-anchor="end">${q}</text>`);
  }
  for (let v = Math.ceil(xLo); v <= xHi; v += 2) {
    ticks.push(`<text class="tick" x="${x(v).toFixed(1)}" y="${PAD.t + plotH + 18}" text-anchor="middle">${v}</text>`);
  }

  const curves = states.map((s) => `<path class="${s.cls}" d="${path(s.vr)}"/>`
    + `<path class="${s.cls}" style="stroke-dasharray:5 3;stroke-width:1.6" d="${path(s.cf)}"/>`
    + (s.cross ? `<circle class="dot" style="fill:var(--fig-${s.cls === 'total' ? 'total' : 'alv'})" cx="${x(s.cross.x).toFixed(1)}" cy="${y(s.cross.y).toFixed(1)}" r="4"/>` : '')).join('\n');

  const key = states.map((s, i) => {
    const dy = PAD.t + 22 + i * 40;
    return `<line class="${s.cls}" x1="${PAD.l + plotW + 16}" y1="${dy}" x2="${PAD.l + plotW + 44}" y2="${dy}"/>`
      + `<text class="label" x="${PAD.l + plotW + 50}" y="${dy + 4}">${esc(s.label)}</text>`
      + (s.cross ? `<text class="tick" x="${PAD.l + plotW + 16}" y="${dy + 20}">${s.cross.y.toFixed(2)} L/min at ${s.cross.x.toFixed(1)} mmHg</text>` : '');
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="${ROOT}" role="img"
  aria-label="Guyton construction at two levels of PEEP. Each level shows a venous return curve falling with right atrial pressure and a cardiac function curve rising with it. Raising PEEP shifts both curves rightward and the operating point to a lower cardiac output at a higher right atrial pressure.">
<style>${STYLE}</style>
<rect class="bg" width="${W}" height="${H}"/>
<text class="title" x="${PAD.l}" y="16">Venous return and cardiac function, at two levels of PEEP</text>
${ticks.join('\n')}
<line class="axis" x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${PAD.t + plotH}"/>
<line class="axis" x1="${PAD.l}" y1="${PAD.t + plotH}" x2="${PAD.l + plotW}" y2="${PAD.t + plotH}"/>
${curves}
<text class="label" transform="translate(18 ${PAD.t + plotH / 2}) rotate(-90)" text-anchor="middle">Flow (L/min)</text>
<text class="label" x="${PAD.l + plotW / 2}" y="${H - 6}" text-anchor="middle">Right atrial pressure (mmHg)</text>
${key}
<text class="tick" x="${PAD.l + plotW + 16}" y="${PAD.t + 112}">solid: venous return</text>
<text class="tick" x="${PAD.l + plotW + 16}" y="${PAD.t + 128}">dashed: cardiac function</text>
</svg>
`;
}


// --- a small line-chart helper, shared by the figures below -----------------

const CLASSES = ['total', 'alv', 'extra'];

// SVG is XML: a literal < or & in a label breaks the document. Labels are
// authored as prose ("SI < 1"), so they are escaped here rather than at every
// call site.
const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

function chart({ title, xLabel, yLabel, series, xTick, yTick, notes = [], padRight = PAD.r, dashed = [] }) {
  const plotW = W - PAD.l - padRight;
  const all = series.flatMap((s) => s.points);
  const xLo = Math.min(...all.map((q) => q[0]));
  const xHi = Math.max(...all.map((q) => q[0]));
  const yLo = Math.min(0, ...all.map((q) => q[1]));
  const yHi = Math.max(...all.map((q) => q[1])) * 1.08;

  const x = (v) => PAD.l + ((v - xLo) / (xHi - xLo)) * plotW;
  const y = (v) => PAD.t + plotH - ((v - yLo) / (yHi - yLo)) * plotH;
  const path = (pts) => pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(1)} ${y(b).toFixed(1)}`).join(' ');

  const grid = [];
  for (let v = Math.ceil(yLo / yTick) * yTick; v < yHi; v += yTick) {
    grid.push(`<line class="grid" x1="${PAD.l}" y1="${y(v).toFixed(1)}" x2="${PAD.l + plotW}" y2="${y(v).toFixed(1)}"/>`
      + `<text class="tick" x="${PAD.l - 9}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${Number(v.toFixed(2))}</text>`);
  }
  for (let v = Math.ceil(xLo / xTick) * xTick; v <= xHi; v += xTick) {
    grid.push(`<text class="tick" x="${x(v).toFixed(1)}" y="${PAD.t + plotH + 18}" text-anchor="middle">${Number(v.toFixed(2))}</text>`);
  }

  const curves = series.map((s, i) => {
    const style = dashed.includes(i) ? 'stroke-dasharray:5 4' : 'stroke-dasharray:none';
    return `<path class="${s.cls ?? CLASSES[i % 3]}" style="${style}" d="${path(s.points)}"/>`;
  }).join('\n');
  const key = series.map((s, i) => {
    const dy = PAD.t + 22 + i * 22;
    const style = dashed.includes(i) ? 'stroke-dasharray:5 4' : 'stroke-dasharray:none';
    return `<line class="${s.cls ?? CLASSES[i % 3]}" style="${style}" x1="${PAD.l + plotW + 16}" y1="${dy}" x2="${PAD.l + plotW + 44}" y2="${dy}"/>`
      + `<text class="label" x="${PAD.l + plotW + 50}" y="${dy + 4}">${esc(s.label)}</text>`;
  }).join('\n');
  const note = notes.map((t, i) => `<text class="tick" x="${PAD.l + plotW + 16}" y="${PAD.t + 40 + series.length * 22 + i * 16}">${esc(t)}</text>`).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="${ROOT}" role="img" aria-label="${esc(title)}">
<style>${STYLE}</style>
<rect class="bg" width="${W}" height="${H}"/>
<text class="title" x="${PAD.l}" y="16">${esc(title)}</text>
${grid.join('\n')}
<line class="axis" x1="${PAD.l}" y1="${PAD.t}" x2="${PAD.l}" y2="${PAD.t + plotH}"/>
<line class="axis" x1="${PAD.l}" y1="${y(Math.max(yLo, 0)).toFixed(1)}" x2="${PAD.l + plotW}" y2="${y(Math.max(yLo, 0)).toFixed(1)}"/>
${curves}
<text class="label" transform="translate(18 ${PAD.t + plotH / 2}) rotate(-90)" text-anchor="middle">${esc(yLabel)}</text>
<text class="label" x="${PAD.l + plotW / 2}" y="${H - 6}" text-anchor="middle">${esc(xLabel)}</text>
${key}
${note}
</svg>
`;
}

// --- the lung pressure-volume curve ----------------------------------------

function pvCurveFigure() {
  const lungs = [
    { label: 'normal, 200 mL/cmH\u2082O', clung: 200 },
    { label: 'moderate, 100', clung: 100 },
    { label: 'ARDS, 45', clung: 45 },
  ];
  const series = lungs.map(({ label, clung }) => {
    const p = { ...defaultParams(), clung, collapsed: 0 };
    const points = [];
    for (let pl = -5; pl <= 40; pl += 0.5) points.push([pl, lungVolumeAtPl(p, pl, 1)]);
    return { label, points };
  });
  return chart({
    title: 'Lung volume against transpulmonary pressure, fully open tissue',
    xLabel: 'Transpulmonary pressure (cmH\u2082O)',
    yLabel: 'Lung volume (L)',
    series, xTick: 5, yTick: 1,
    notes: ['capacity follows compliance:', 'a stiff lung is a small lung'],
  });
}

// --- the stress index, in the form a ventilator draws it --------------------

// One full respiratory cycle of airway pressure, starting at the onset of
// inspiration.
function fullCycle(sim, step = 0.01) {
  for (let i = 0; i < 20000 && sim.resp.phase !== 'exp'; i++) sim.advance(step, true);
  for (let i = 0; i < 20000 && sim.resp.phase !== 'insp'; i++) sim.advance(step, true);
  const points = [];
  let inspEnd = 0;
  let seenExp = false;
  for (let k = 0; k < 2000; k++) {
    points.push([k * step, sim.resp.paw]);
    sim.advance(step, true);
    if (!seenExp && sim.resp.phase === 'exp') { seenExp = true; inspEnd = points.length; }
    if (seenExp && sim.resp.phase === 'insp') break;
  }
  return { points, inspEnd };
}

const SI_CASES = [
  { title: 'Normal', o: { clung: 200, vt: 500, peep: 8 } },
  { title: 'Over-distension', o: { clung: 30, vt: 700, peep: 8 } },
  { title: 'Tidal recruitment', o: { clung: 60, vt: 600, collapsed: 0.4, riRatio: 0.7, pOpen: 16, peep: 6 } },
];

// Three panels side by side, each scaled to its own breath. That scaling is the
// point: on a shared absolute axis the distending breath rises 63 cmH2O and the
// recruiting one 10, so the smaller curvature disappears however real it is.
function stressIndexFigure() {
  const H2 = 300;
  const gap = 34;
  const padL = 44, padR = 16, padT = 46, padB = 54;
  const panelW = (W - padL - padR - gap * 2) / 3;
  const plotH2 = H2 - padT - padB;

  const panels = SI_CASES.map(({ title, o }) => {
    const sim = settled({ mode: 'vcv', pmus: 0, rr: 14, ti: 1.2, ...o }, 45);
    const { points, inspEnd } = fullCycle(sim);
    return { title, points, inspEnd, si: sim.metrics.stressIndex };
  });

  const body = panels.map((panel, i) => {
    const x0 = padL + i * (panelW + gap);
    const ts = panel.points.map((q) => q[0]);
    const ps = panel.points.map((q) => q[1]);
    const tHi = Math.max(...ts);
    const pLo = Math.min(...ps), pHi = Math.max(...ps);
    const x = (t) => x0 + (t / tHi) * panelW;
    const y = (q) => padT + plotH2 - ((q - pLo) / (pHi - pLo || 1)) * plotH2;
    const draw = (pts) => pts.map(([t, q], k) => `${k ? 'L' : 'M'}${x(t).toFixed(1)} ${y(q).toFixed(1)}`).join(' ');

    // The segment the index is read from: the constant-flow ramp, after the
    // resistive onset step has been excluded.
    const from = Math.floor(panel.inspEnd * 0.1);
    const ramp = panel.points.slice(from, panel.inspEnd);

    return `<g>
<line class="axis" x1="${x0}" y1="${padT}" x2="${x0}" y2="${padT + plotH2}"/>
<line class="axis" x1="${x0}" y1="${padT + plotH2}" x2="${x0 + panelW}" y2="${padT + plotH2}"/>
<path class="trace" d="${draw(panel.points)}"/>
<path class="ramp" d="${draw(ramp)}"/>
<text class="panel-title" x="${x0 + panelW / 2}" y="${padT - 22}" text-anchor="middle">${esc(panel.title)}</text>
<text class="tick" x="${x0 + panelW / 2}" y="${padT + plotH2 + 20}" text-anchor="middle">Stress index = ${panel.si.toFixed(2)}</text>
</g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H2}" class="${ROOT}" role="img"
  aria-label="Three airway pressure waveforms from volume-controlled breaths. A normal lung gives a straight inspiratory ramp and a stress index near one; over-distension bows the ramp upward and gives an index above one; tidal recruitment bows it downward and gives an index below one.">
<style>${STYLE}
  svg.${ROOT} .trace { stroke: var(--fig-axis, #9aa4b2); stroke-width: 1.8; fill: none }
  svg.${ROOT} .ramp { stroke: var(--fig-alv, #d1495b); stroke-width: 3; fill: none }
  svg.${ROOT} .panel-title { fill: var(--fig-text, #2b3138); font: 600 13px system-ui, sans-serif }
  @media (prefers-color-scheme: dark) {
    svg.${ROOT} .trace { stroke: #8b95a3 }
    svg.${ROOT} .ramp { stroke: #f08c9a }
    svg.${ROOT} .panel-title { fill: #d6dbe2 }
  }
</style>
<rect class="bg" width="${W}" height="${H2}"/>
<text class="title" x="${padL}" y="18">Airway pressure through one volume-controlled breath</text>
<text class="tick" x="${padL}" y="34">each panel scaled to its own breath; the segment the index is fitted to is highlighted</text>
${body}
<text class="label" transform="translate(16 ${padT + plotH2 / 2}) rotate(-90)" text-anchor="middle">Pressure</text>
<text class="label" x="${W / 2}" y="${H2 - 8}" text-anchor="middle">Time</text>
</svg>
`;
}

// --- recruitment hysteresis -------------------------------------------------

// One preparation, one continuous state: PEEP is walked up and then back down
// on the same simulator, and each rung is plotted against the end-expiratory
// transpulmonary pressure it actually reached. Plotting against applied PEEP
// would compare the limbs at different distending pressures, and `pClose` is
// defined as a transpulmonary pressure, not as a PEEP.
function hysteresisFigure() {
  const base = {
    ...defaultParams(),
    mode: 'vcv', pmus: 0, vt: 250, rr: 20,
    clung: 45, collapsed: 0.45, riRatio: 0.6,
    hysteresis: 'on', pOpen: 22, pClose: 6,
  };
  const rungs = [6, 8, 10, 12, 14, 18, 22, 26, 30, 34];

  const sim = settled({ ...base, peep: rungs[0] }, 45);
  const inflating = [], deflating = [];
  for (const peep of rungs) {
    sim.setParam('peep', peep);
    sim.advance(30, true);
    inflating.push([sim.resp.plSolved, sim.metrics.openFraction * 100]);
  }
  for (const peep of [...rungs].reverse()) {
    sim.setParam('peep', peep);
    sim.advance(30, true);
    deflating.push([sim.resp.plSolved, sim.metrics.openFraction * 100]);
  }

  return chart({
    title: 'The same lung walked up and then down, opening at 22 and closing at 6 cmH\u2082O',
    xLabel: 'End-expiratory transpulmonary pressure (cmH\u2082O)',
    yLabel: 'Lung open (%)',
    series: [
      { label: 'incremental', points: inflating },
      { label: 'decremental', points: deflating },
    ],
    xTick: 5, yTick: 5, padRight: 200,
    notes: [
      'the limbs separate because the',
      'lung is held above its closing',
      'pressure on the way down',
    ],
  });
}

const figures = {
  'pvr-j-curve.svg': jCurveFigure(),
  'guyton-peep.svg': guytonFigure(),
  'pv-curve.svg': pvCurveFigure(),
  'stress-index.svg': stressIndexFigure(),
  'hysteresis.svg': hysteresisFigure(),
};
for (const [name, svg] of Object.entries(figures)) {
  writeFileSync(join(OUT, name), svg);
  console.log('wrote manual/figure/' + name);
}
