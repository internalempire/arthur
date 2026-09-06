import { Panel, niceTicks } from '../plot.js';
import { createCardiacResponseJob } from '../cardiac-response-job.js';
import {
  venousReturnCurve, curveIntersection, createCardiacResponseWorker, cardiacResponseParameters,
} from '../../model/index.js';

// The Guyton diagram. Both curves share right atrial pressure as their abscissa,
// so their intersection is the predicted steady operating point. A
// separate trail retains the within-breath venous-inflow path; this prevents an
// IVC storage transient from being compared as if it were a steady crossing.

const TRAIL_INTERVAL = 0.025; // s of simulated time between trail samples
const TRAIL_POINTS = 480;     // about 12 s of physiology
const DOMAIN_STEP_X = 2;
const DOMAIN_STEP_Y = 2;

const floorTo = (value, step) => Math.floor(value / step) * step;
const ceilTo = (value, step) => Math.ceil(value / step) * step;

/**
 * Keep a Guyton view fixed while one parameter state evolves. The view may
 * expand to rescue an off-scale mark, but never contracts until the caller
 * explicitly resets it after a control or scenario change.
 */
export function stableGuytonDomain(previous, required) {
  const next = previous ? { ...previous } : {
    xLo: floorTo(required.xLo, DOMAIN_STEP_X),
    xHi: ceilTo(required.xHi, DOMAIN_STEP_X),
    yHi: ceilTo(required.yHi, DOMAIN_STEP_Y),
  };
  if (required.xLo < next.xLo) next.xLo = floorTo(required.xLo, DOMAIN_STEP_X);
  if (required.xHi > next.xHi) next.xHi = ceilTo(required.xHi, DOMAIN_STEP_X);
  if (required.yHi > next.yHi) next.yHi = ceilTo(required.yHi, DOMAIN_STEP_Y);
  return next;
}

export function createGuyton(canvas, { onViewChange = () => {} } = {}) {
  const panel = new Panel(canvas, { padding: [22, 16, 34, 46] });
  const trail = []; // operating point over the last few seconds
  let lastSample = -1;
  let viewDomain = null;
  let curveClock = 'mean';
  const responseJob = createCardiacResponseJob(createCardiacResponseWorker, onViewChange);
  const responseStatus = document.createElement('div');
  responseStatus.className = 'guyton-response-status';
  responseStatus.setAttribute('role', 'status');
  responseStatus.setAttribute('aria-live', 'polite');
  canvas.insertAdjacentElement('afterend', responseStatus);
  const recalculate = document.createElement('button');
  recalculate.type = 'button';
  recalculate.className = 'guyton-recalculate';
  recalculate.textContent = 'Recalculate CO';
  recalculate.title = 'Recalculate the whole-heart response at the current cardiac and vascular settings';
  recalculate.addEventListener('click', () => { responseJob.reset(); onViewChange(); });
  canvas.insertAdjacentElement('afterend', recalculate);

  // The equilibrium view uses all three settled reference determinants; the
  // diagnostic live view reads all three at the current instant.
  const clockToggle = document.createElement('button');
  clockToggle.type = 'button';
  clockToggle.className = 'guyton-clock-toggle';
  const syncClockToggle = () => {
    const live = curveClock === 'instant';
    clockToggle.textContent = live ? 'VR live' : 'VR mean';
    clockToggle.setAttribute('aria-pressed', String(live));
    clockToggle.setAttribute('aria-label', live
      ? 'Use settled reference determinants for the venous-return curve'
      : 'Use instantaneous determinants for the venous-return curve');
    clockToggle.title = live
      ? 'Venous return: instantaneous determinants. Click for the settled reference.'
      : 'Venous return: settled reference determinants paired with the cardiac response; respiratory means while calculating. Click for live values.';
  };
  syncClockToggle();
  clockToggle.addEventListener('click', () => {
    curveClock = curveClock === 'mean' ? 'instant' : 'mean';
    viewDomain = null;
    syncClockToggle();
    onViewChange();
  });
  canvas.insertAdjacentElement('afterend', clockToggle);

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, circ: c, metrics: m } = sim;

    // Live markers use a respiratory-cycle mean. The cardiac response and its
    // companion return curve use separately settled minute windows. The separate
    // one-heartbeat mean remains below as the dynamic respiratory trail.
    const op = m.respiratoryOperatingPoint;
    const beat = m.operatingPoint;
    responseJob.request(JSON.stringify(p), cardiacResponseParameters(p, sim.effective ?? p));
    const job = responseJob.getState();
    responseStatus.textContent = job.message;
    responseStatus.dataset.status = job.status;
    const response = job.result?.valid ? job.result : null;
    // The two steady curves use the SAME settled reference and fixed autonomic
    // drive. Live markers retain their own respiratory clock and can diverge
    // during redistribution. Recalculate refreshes a compensated reference.
    const reference = response?.reference;
    const vrMean = reference ? { ...reference, pra: reference.ra } : op;
    const vr = venousReturnCurve(p, c, curveClock === 'mean' ? vrMean : null);
    const segments = response?.segments ?? [];
    const cfPoints = segments.flat();

    // Two different quantities, drawn as two different marks. Their labels name
    // the physiology rather than the calculation method: otherwise "simulated"
    // and "analytic" can be mistaken for two estimates of the same output.
    //
    // `simulated` is the respiratory mean measured from the integrated model.
    // `equilibrium` is the crossing of the reference return relation and measured
    // whole-heart response. The trail is intentionally
    // different: it preserves the within-breath storage and phase lag that the
    // mean points remove.
    const simulated = { x: op.pra, y: op.flow };
    const cardiacOutput = { x: op.pra, y: op.aorticFlow };
    // A live venous-return curve intentionally has no equilibrium marker: the
    // steady response and instantaneous return curve would mix clocks again.
    const equilibrium = curveClock === 'mean'
      ? segments.map(points => curveIntersection(vr.points, points)).find(Boolean) ?? null
      : null;
    const measured = sim.measuredPoints;

    // Sampled on simulated time so the trail covers a fixed span of physiology
    // regardless of frame rate, and stops growing when the model is paused.
    if (sim.time - lastSample >= TRAIL_INTERVAL) {
      lastSample = sim.time;
      trail.push(beat.pra, beat.flow);
      if (trail.length > TRAIL_POINTS * 2) trail.splice(0, 2);
    }

    let pointXLo = Math.min(simulated.x, equilibrium?.x ?? simulated.x, op.ppl);
    let pointXHi = Math.max(simulated.x, equilibrium?.x ?? simulated.x, op.ppl);
    let pointYHi = Math.max(simulated.y, equilibrium?.y ?? simulated.y);
    pointYHi = Math.max(pointYHi, cardiacOutput.y);
    for (let i = 0; i < cfPoints.length; i += 2) {
      pointXLo = Math.min(pointXLo, cfPoints[i]);
      pointXHi = Math.max(pointXHi, cfPoints[i]);
      pointYHi = Math.max(pointYHi, cfPoints[i + 1]);
    }
    for (let i = 0; i < trail.length; i += 2) {
      pointXLo = Math.min(pointXLo, trail[i]);
      pointXHi = Math.max(pointXHi, trail[i]);
      pointYHi = Math.max(pointYHi, trail[i + 1]);
    }
    for (const mark of measured) {
      pointXLo = Math.min(pointXLo, mark.pra);
      pointXHi = Math.max(pointXHi, mark.pra);
      pointYHi = Math.max(pointYHi, mark.flow);
    }

    // Headroom is computed from the current state, then frozen. Respiratory
    // movement can therefore be read against stationary axes. A later extreme
    // may expand the domain, but ordinary oscillation can never shrink it.
    viewDomain = stableGuytonDomain(viewDomain, {
      xLo: Math.min(-6, vr.pCrit - 3, pointXLo - 2),
      xHi: Math.max(vr.pmsf + 2, simulated.x + 6, pointXHi + 2, 14),
      yHi: Math.max(9, (vr.points[1] ?? 8) * 1.05, simulated.y * 1.6, pointYHi * 1.2),
    });
    const { xLo, xHi, yHi } = viewDomain;
    panel.setDomain(xLo, xHi, 0, yHi);

    panel.grid(colors, {
      xTicks: niceTicks(xLo, xHi, 6), xFormat: (v) => v.toFixed(0),
      yTicks: niceTicks(0, yHi, 4), yFormat: (v) => v.toFixed(0),
      xLabel: 'Right atrial pressure (mmHg)',
      yLabel: 'Flow (L/min)',
    });
    panel.axisLine(colors, { y: 0 });

    panel.clip();

    // Respiratory-mean pleural pressure remains a useful external-pressure
    // reference. It is not labelled as the curve intercept: the response also
    // contains atrial, ventricular and pulmonary loading effects.
    const pplMmHg = curveClock === 'mean' ? (reference?.ppl ?? op.ppl) : c.p.ppl;
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
    panel.line(trail, { color: colors.ink, width: 1.4, alpha: 0.3 });

    panel.line(vr.points, { color: colors.venous, width: 2 });
    for (const points of segments) panel.line(points, { color: colors.arterial, width: 2 });

    panel.unclip();

    // Direct labels rather than a legend box.
    const vrLabelIdx = Math.floor(vr.points.length * 0.18) & ~1;
    panel.label('Venous return', vr.points[vrLabelIdx], vr.points[vrLabelIdx + 1], {
      color: colors.text.venous, dx: 6, dy: -10, halo: colors.surface,
    });
    if (cfPoints.length) {
      const cfLabelIdx = cfPoints.length - 2;
      panel.label('Cardiac output (LV)', cfPoints[cfLabelIdx], cfPoints[cfLabelIdx + 1], {
        color: colors.text.arterial, dx: -6, dy: -10, align: 'right', halo: colors.surface,
      });
    }
    if (trail.length >= 12) {
      // Put the label at the right-most part of the measured path, away from
      // most of the loop and without implying that the trail belongs to either
      // analytic curve.
      let trailLabelIdx = 0;
      for (let i = 2; i < trail.length; i += 2) {
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
      color: colors.inkMuted, dx: 4, dy: 12, halo: colors.surface,
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

    // The predicted equilibrium: hollow, because it is a construction.
    if (equilibrium) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(panel.sx(equilibrium.x), panel.sy(equilibrium.y), 5, 0, Math.PI * 2);
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
      ctx.restore();
    }
    // Mean venous inflow: filled, because it is measured from the integrated
    // circulation. When the two agree, the smaller filled disc leaves the
    // hollow predicted-equilibrium ring visible around it.
    panel.dot(simulated.x, simulated.y, { color: colors.ink, r: 4, ring: colors.surface });
    panel.dot(cardiacOutput.x, cardiacOutput.y, { color: colors.arterial, r: 3, ring: colors.surface });
    panel.label('mean LV output', cardiacOutput.x, cardiacOutput.y, {
      color: colors.text.arterial, dx: 9, dy: -9, halo: colors.surface,
    });

    panel.label('mean venous inflow', simulated.x, simulated.y, {
      color: colors.ink,
      dx: -9,
      dy: 9,
      align: 'right',
      halo: colors.surface,
    });
    if (equilibrium
      && (Math.abs(equilibrium.x - simulated.x) > (xHi - xLo) * 0.03
        || Math.abs(equilibrium.y - simulated.y) > yHi * 0.03)) {
      panel.label('predicted equilibrium', equilibrium.x, equilibrium.y, {
        color: colors.inkMuted, dx: 9, dy: -9, halo: colors.surface,
      });
    }

    panel.title('Guyton diagram', colors, curveClock === 'mean'
      ? 'whole-heart response measured at the LV outlet'
      : 'live venous-return determinants — diagnostic view');
  }

  function clearTrail() {
    trail.length = 0;
    lastSample = -1;
    viewDomain = null;
    responseJob.reset();
  }

  return { render, clearTrail, curveClock: () => curveClock };
}
