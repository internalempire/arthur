import { Panel, niceTicks } from '../plot.js';
import { createOptInCardiacResponseJob } from '../cardiac-response-job.js';
import {
  venousReturnCurve, cardiacFunctionCurve, preloadLimbs, curveIntersection,
  createCardiacResponseWorker, cardiacResponseParameters,
} from '../../model/index.js';

const TRAIL_INTERVAL = 0.025; // s of simulated time between trail samples
const TRAIL_POINTS = 480;     // about 12 s of physiology
const DOMAIN_STEP_X = 2;
const DOMAIN_STEP_Y = 2;

const floorTo = (value, step) => Math.floor(value / step) * step;
const ceilTo = (value, step) => Math.ceil(value / step) * step;

function formatPoint({ x, y }) {
  return `${y.toFixed(2)}\u00a0L/min at ${x.toFixed(2)}\u00a0mmHg`;
}

export const DEFAULT_GUYTON_CLOCK = 'mean';

// Both fast relations share one clock. A heartbeat window suppresses cardiac
// ripple while retaining respiratory excursion; a breath window shows means.
export function fastGuytonCurves(sim, clock = DEFAULT_GUYTON_CLOCK) {
  const state = clock === 'mean'
    ? sim.metrics.respiratoryOperatingPoint : sim.metrics.operatingPoint;
  return {
    state,
    vr: venousReturnCurve(sim.params, sim.circ, state),
    cf: cardiacFunctionCurve(sim.params, sim.circ, state),
  };
}

export function measuredLVOutput(metrics) {
  const op = metrics.respiratoryOperatingPoint;
  return metrics.valid && Number.isFinite(op.pra) && Number.isFinite(op.aorticFlow)
    ? { x: op.pra, y: op.aorticFlow } : null;
}

/**
 * Keep a Guyton view fixed while one parameter state evolves. The view may
 * expand to rescue an off-scale mark, but never contracts until the caller
 * explicitly resets it after a control or scenario change.
 */
export function stableGuytonDomain(previous, required) {
  const next = previous ? { ...previous } : {
    xLo: floorTo(required.xLo, DOMAIN_STEP_X),
    xHi: ceilTo(required.xHi, DOMAIN_STEP_X),
    yLo: 0,
    yHi: ceilTo(required.yHi, DOMAIN_STEP_Y),
  };
  if (required.xLo < next.xLo) next.xLo = floorTo(required.xLo, DOMAIN_STEP_X);
  if (required.xHi > next.xHi) next.xHi = ceilTo(required.xHi, DOMAIN_STEP_X);
  if (required.yLo < next.yLo) next.yLo = floorTo(required.yLo, DOMAIN_STEP_Y);
  if (required.yHi > next.yHi) next.yHi = ceilTo(required.yHi, DOMAIN_STEP_Y);
  return next;
}

export function createGuyton(canvas, { onViewChange = () => {} } = {}) {
  const panel = new Panel(canvas, { padding: [14, 16, 34, 46] });
  const trail = []; // operating point over the last few seconds
  const trailTimes = [];
  let lastSample = -1;
  let viewDomain = null;
  let curveClock = DEFAULT_GUYTON_CLOCK;
  let deepClock = 'mean';
  const responseJob = createOptInCardiacResponseJob(createCardiacResponseWorker, onViewChange);
  const section = canvas.closest('.panel-guyton');
  const responseStatus = section.querySelector('.guyton-response-status');
  const progress = responseStatus.querySelector('progress');
  const message = responseStatus.querySelector('span');
  const responseToggle = section.querySelector('.guyton-response-toggle');
  const clocks = section.querySelector('.guyton-clocks');
  const clockButtons = clocks.querySelectorAll('[data-clock]');
  const inspect = section.querySelector('.guyton-inspect');
  const inflowLabel = section.querySelector('.guyton-inflow');
  const crossingLabel = section.querySelector('.guyton-crossing');
  let hovering = false;
  let inspecting = false;
  let controlKey = '';

  function resetInspection() {
    inspecting = false;
    inspect.setAttribute('aria-pressed', 'false');
  }

  responseToggle.addEventListener('click', () => {
    responseJob.setEnabled(!responseJob.isEnabled());
    deepClock = 'mean';
    resetInspection();
    viewDomain = null;
    onViewChange();
  });
  for (const button of clockButtons) {
    button.addEventListener('click', () => {
      const chosen = button.dataset.clock;
      const deep = responseJob.isEnabled();
      if (chosen === (deep ? deepClock : curveClock)) return;
      if (deep) deepClock = chosen;
      else curveClock = chosen;
      resetInspection();
      viewDomain = null;
      onViewChange();
    });
  }
  inspect.addEventListener('click', () => {
    inspecting = !inspecting;
    inspect.setAttribute('aria-pressed', String(inspecting));
    onViewChange();
  });
  canvas.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    onViewChange();
  });
  canvas.addEventListener('pointerleave', () => {
    hovering = false;
    onViewChange();
  });

  function syncControls(deep, clock) {
    const key = (deep ? 'deep-' : 'fast-') + clock;
    if (key === controlKey) return;
    controlKey = key;
    responseToggle.textContent = deep ? 'Exit Deep CO' : 'Deep CO';
    responseToggle.setAttribute('aria-pressed', String(deep));
    responseToggle.title = deep ? 'Return to the local RV and venous-return curves'
      : 'Run the optional whole-heart loading experiment';
    clocks.setAttribute('aria-label', deep ? 'Venous-return reference' : 'Curve averaging window');
    for (const button of clockButtons) {
      const mean = button.dataset.clock === 'mean';
      button.textContent = (deep ? 'VR ' : '') + (mean ? 'Mean' : 'Live');
      button.setAttribute('aria-pressed', String(button.dataset.clock === clock));
      button.title = deep
        ? (mean ? 'Settled reference for venous return' : 'Current instantaneous venous-return conditions')
        : (mean ? 'Average conditions over a breath' : 'Follow breathing, averaged over one heartbeat');
    }
    inspect.hidden = deep || clock !== 'live';
    canvas.title = inspect.hidden ? '' : 'Hover to inspect the crossing, or select Inspect crossing';
  }

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, circ: c, metrics: m } = sim;

    const op = m.respiratoryOperatingPoint;
    const beat = m.operatingPoint;
    if (responseJob.isEnabled()) {
      responseJob.request(JSON.stringify(p), cardiacResponseParameters(p, sim.effective ?? p));
      if (!responseJob.isEnabled()) viewDomain = null;
    }
    const deep = responseJob.isEnabled();
    const activeClock = deep ? deepClock : curveClock;
    syncControls(deep, activeClock);
    const job = responseJob.getState();
    responseStatus.hidden = !deep;
    if (message.textContent !== job.message) message.textContent = job.message;
    progress.hidden = job.status !== 'running';
    if (job.total > 0) { progress.max = job.total; progress.value = job.completed; }
    else if (progress.hasAttribute('value')) progress.removeAttribute('value');
    responseStatus.dataset.status = job.status;
    const response = deep && job.result?.valid ? job.result : null;
    // In deep mode the two steady curves share a settled reference and fixed
    // autonomic drive. Measured markers can diverge during redistribution.
    const reference = response?.reference;
    const vrMean = reference ? { ...reference, pra: reference.ra } : op;
    const fast = deep ? null : fastGuytonCurves(sim, curveClock);
    const vr = deep ? venousReturnCurve(p, c, deepClock === 'mean' ? vrMean : null) : fast.vr;
    const cf = fast?.cf;
    const segments = deep ? response?.segments ?? [] : [cf.points];
    const cfPoints = cf?.points ?? segments.flat();

    const live = !deep && curveClock === 'live';
    const inflow = fast?.state ?? op;
    const simulated = { x: inflow.pra, y: inflow.flow };
    const cardiacOutput = deep ? measuredLVOutput(m) : null;
    const showCrossing = deep ? deepClock === 'mean' && !!reference : !live || hovering || inspecting;
    let crossing = null;
    if (showCrossing) {
      for (const points of segments) {
        crossing = curveIntersection(vr.points, points);
        if (crossing) break;
      }
    }
    const inflowText = (live ? 'Inflow · last heartbeat' : 'Inflow · breath mean')
      + ' ' + formatPoint(simulated);
    if (inflowLabel.textContent !== inflowText) inflowLabel.textContent = inflowText;
    crossingLabel.parentElement.hidden = !showCrossing;
    if (showCrossing) {
      const name = deep ? 'Reference crossing' : live ? 'Crossing in this phase' : 'Mean curve crossing';
      const text = name + (crossing ? ' ' + formatPoint(crossing) : ' · no crossing in range');
      if (crossingLabel.textContent !== text) crossingLabel.textContent = text;
    }
    const measured = sim.measuredPoints;

    // Sampled on simulated time so the trail covers a fixed span of physiology
    // regardless of frame rate, and stops growing when the model is paused.
    if (sim.time - lastSample >= TRAIL_INTERVAL) {
      lastSample = sim.time;
      trail.push(beat.pra, beat.flow);
      trailTimes.push(sim.time);
      while (trailTimes.length > TRAIL_POINTS || trailTimes[0] < sim.time - TRAIL_POINTS * TRAIL_INTERVAL) {
        trail.splice(0, 2);
        trailTimes.shift();
      }
    }

    // Paused inspection can revisit an earlier sample of this same patient.
    let trailCount = trail.length;
    while (trailCount && trailTimes[trailCount / 2 - 1] > sim.time) trailCount -= 2;

    let pointXLo = Math.min(simulated.x, crossing?.x ?? simulated.x, op.ppl);
    let pointXHi = Math.max(simulated.x, crossing?.x ?? simulated.x, op.ppl);
    let pointYLo = simulated.y;
    let pointYHi = Math.max(simulated.y, crossing?.y ?? simulated.y);
    pointYHi = Math.max(pointYHi, cardiacOutput?.y ?? 0);
    for (let i = 0; deep && i < cfPoints.length; i += 2) {
      pointXLo = Math.min(pointXLo, cfPoints[i]);
      pointXHi = Math.max(pointXHi, cfPoints[i]);
      pointYHi = Math.max(pointYHi, cfPoints[i + 1]);
    }
    for (let i = 0; i < trailCount; i += 2) {
      pointXLo = Math.min(pointXLo, trail[i]);
      pointXHi = Math.max(pointXHi, trail[i]);
      pointYHi = Math.max(pointYHi, trail[i + 1]);
      pointYLo = Math.min(pointYLo, trail[i + 1]);
    }
    for (const mark of measured) {
      pointXLo = Math.min(pointXLo, mark.pra);
      pointXHi = Math.max(pointXHi, mark.pra);
      pointYHi = Math.max(pointYHi, mark.flow);
      pointYLo = Math.min(pointYLo, mark.flow);
    }

    // Headroom is computed from the current state, then frozen. Respiratory
    // movement can therefore be read against stationary axes. A later extreme
    // may expand the domain, but ordinary oscillation can never shrink it.
    viewDomain = stableGuytonDomain(viewDomain, {
      xLo: Math.min(-6, (cf?.xIntercept ?? vr.pCrit) - 3, vr.pCrit - 3, pointXLo - 2),
      xHi: Math.max(vr.pmsf + 2, simulated.x + 6, pointXHi + 2, 14),
      yLo: Math.min(0, pointYLo * 1.1),
      yHi: Math.max(9, (vr.points[1] ?? 8) * 1.05, simulated.y * 1.6, pointYHi * 1.2),
    });
    const { xLo, xHi, yLo, yHi } = viewDomain;
    panel.setDomain(xLo, xHi, yLo, yHi);

    panel.grid(colors, {
      xTicks: niceTicks(xLo, xHi, 6), xFormat: (v) => v.toFixed(0),
      yTicks: niceTicks(yLo, yHi, 4), yFormat: (v) => v.toFixed(0),
      xLabel: 'Right atrial pressure (mmHg vs atmosphere)',
      yLabel: 'Flow (L/min)',
    });
    panel.axisLine(colors, { y: 0 });

    panel.clip();

    // Pleural pressure follows the selected curve clock. It is a pressure
    // reference, not the curve intercept, which also reflects chamber loading.
    const pplMmHg = deep
      ? (deepClock === 'mean' ? (reference?.ppl ?? op.ppl) : c.p.ppl)
      : fast.state.ppl;
    ctx.save();
    ctx.strokeStyle = colors.inkMuted;
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panel.sx(pplMmHg), panel.sy(0));
    ctx.lineTo(panel.sx(pplMmHg), panel.sy(yHi));
    ctx.stroke();
    ctx.restore();

    // The loop measured venous inflow walks over a breath. This remains tied to
    // the integrated circulation: moving it to the predicted crossing would
    // replace real storage and phase lag with a sequence of constructions.
    panel.line(trail, { count: trailCount, color: colors.ink, width: 1.4, alpha: 0.3 });
    if (trailCount && sim.time > trailTimes[trailCount / 2 - 1]) {
      panel.line([trail[trailCount - 2], trail[trailCount - 1], beat.pra, beat.flow],
        { color: colors.ink, width: 1.4, alpha: 0.3 });
    }

    panel.line(vr.points, { color: colors.venous, width: 2 });
    for (const points of segments) panel.line(points, { color: colors.arterial, width: 2 });

    if (!deep) {
      const limbs = preloadLimbs(p, c, fast.state);
      if (limbs.steep.length >= 4) {
        panel.line(limbs.steep, { color: colors.arterial, width: 5, alpha: 0.28 });
      }
    }

    panel.unclip();

    // Direct labels rather than a legend box.
    const vrLabelIdx = Math.floor(vr.points.length * 0.18) & ~1;
    panel.label('Venous return', vr.points[vrLabelIdx], vr.points[vrLabelIdx + 1], {
      color: colors.text.venous, dx: 6, dy: -10, halo: colors.surface,
    });
    if (cfPoints.length) {
      let cfLabelIdx = deep ? cfPoints.length - 2 : Math.floor(cfPoints.length * 0.82) & ~1;
      while (!deep && cfLabelIdx > 0
        && (cfPoints[cfLabelIdx] > xHi - 1 || cfPoints[cfLabelIdx + 1] > yHi * 0.85)) cfLabelIdx -= 2;
      panel.label(deep ? 'Cardiac output (LV)' : 'RV function', cfPoints[cfLabelIdx], cfPoints[cfLabelIdx + 1], {
        color: colors.text.arterial, dx: -6, dy: -10, align: 'right', halo: colors.surface,
      });
    }
    if (trailCount >= 12) {
      // Put the label at the right-most part of the measured path, away from
      // most of the loop and without implying that the trail belongs to either
      // analytic curve.
      let trailLabelIdx = 0;
      for (let i = 2; i < trailCount; i += 2) {
        if (trail[i] > trail[trailLabelIdx]) trailLabelIdx = i;
      }
      panel.label('inflow path', trail[trailLabelIdx], trail[trailLabelIdx + 1], {
        color: colors.inkMuted, dx: -7, dy: -18, align: 'right', halo: colors.surface,
      });
    }

    panel.label(`Pmsf ${vr.pmsf.toFixed(1)}`, vr.pmsf, 0, {
      color: colors.text.venous, dx: -4, dy: -8, align: 'right', halo: colors.surface,
    });
    panel.label('Ppl', pplMmHg, yHi, {
      color: colors.inkMuted, dx: -4, dy: 10, align: 'right', halo: colors.surface,
    });
    // Points measured during occlusion, and the line through them. This is how
    // a venous return curve can be estimated at the bedside, but its zero-flow
    // intercept is extrapolated rather than directly measured. Each hold raises
    // abdominal pressure and shifts the relation it is sampling; the label must
    // therefore not present that intercept as the model's actual Pmsf.
    if (measured.length >= 2) {
      const n = measured.length;
      const sx = measured.reduce((a, m) => a + m.pra, 0);
      const sy = measured.reduce((a, m) => a + m.flow, 0);
      const sxx = measured.reduce((a, m) => a + m.pra * m.pra, 0);
      const sxy = measured.reduce((a, m) => a + m.pra * m.flow, 0);
      const denom = n * sxx - sx * sx;
      if (Math.abs(denom) > 1e-9) {
        const slope = (n * sxy - sx * sy) / denom;
        const intercept = (sy - slope * sx) / n;
        if (slope < 0) {
          const xEnd = -intercept / slope;
          panel.clip();
          panel.line([xLo, slope * xLo + intercept, xEnd, 0], {
            color: colors.inkSecondary, width: 1.6, dash: [6, 4], alpha: 0.9,
          });
          panel.unclip();
          panel.label(`intercept ${xEnd.toFixed(1)} extrapolated`, Math.min(xEnd, xHi), 0, {
            color: colors.inkSecondary, dx: -4, dy: -22, align: 'right', halo: colors.surface,
          });
        }
      }
    }
    for (const m of measured) {
      ctx.save();
      ctx.translate(panel.sx(m.pra), panel.sy(m.flow));
      ctx.strokeStyle = colors.inkSecondary;
      ctx.fillStyle = colors.surface;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-3.5, -3.5, 7, 7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    panel.dot(simulated.x, simulated.y, { color: colors.ink, r: 4, ring: colors.surface });
    if (cardiacOutput) {
      panel.dot(cardiacOutput.x, cardiacOutput.y, { color: colors.arterial, r: 2.6 });
      panel.label('mean LV output', cardiacOutput.x, cardiacOutput.y, {
        color: colors.text.arterial, dx: 9, dy: -9, halo: colors.surface,
      });
    }
    // Four diagonal tips leave the measured disc visible even at the exact crossing.
    if (crossing) {
      ctx.save();
      ctx.translate(panel.sx(crossing.x), panel.sy(crossing.y));
      ctx.beginPath();
      for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
        ctx.moveTo(dx * 4, dy * 4);
        ctx.lineTo(dx * 8, dy * 8);
      }
      ctx.strokeStyle = colors.surface;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  function clearTrail() {
    trail.length = 0;
    trailTimes.length = 0;
    resetInspection();
    lastSample = -1;
    viewDomain = null;
    responseJob.reset();
    deepClock = 'mean';
  }

  return { render, clearTrail, exitDeep: () => responseJob.setEnabled(false), curveClock: () => curveClock,
    responseMode: () => responseJob.isEnabled() ? 'deep' : 'fast' };
}
