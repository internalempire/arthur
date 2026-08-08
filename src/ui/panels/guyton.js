import { Panel, niceTicks } from '../plot.js';
import {
  venousReturnCurve, cardiacFunctionCurve, curveIntersection, preloadLimbs,
} from '../../model/circulation.js';
import { cmH2OtoMmHg } from '../../model/units.js';

// The Guyton diagram. Both curves share right atrial pressure as their abscissa,
// so their intersection is the operating point. Intrathoracic pressure slides
// the cardiac function curve along that axis while leaving the venous return
// curve where it is — which is the entire mechanism by which a breath changes
// cardiac output.

const TRAIL_INTERVAL = 0.025; // s of simulated time between trail samples
const TRAIL_POINTS = 480;     // about 12 s of physiology

export function createGuyton(canvas) {
  const panel = new Panel(canvas, { padding: [22, 16, 34, 46] });
  const trail = []; // operating point over the last few seconds
  let lastSample = -1;

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, circ: c, metrics: m } = sim;

    // Everything on this plot is a cycle mean. Plotting the instantaneous right
    // atrial pressure against a beat-averaged output — which is what this used
    // to do — pairs two quantities measured over different windows, and sends
    // the marker skidding back and forth across a third of the axis at heart
    // rate while its height barely moves. The operating point of a Guyton
    // diagram is a mean pressure against a mean flow.
    const op = m.operatingPoint;
    const vr = venousReturnCurve(p, c, op);
    const cf = cardiacFunctionCurve(p, c, op);

    // Two different things, drawn as two different marks.
    //
    // `simulated` is where the integrated model actually is: the cycle-mean
    // right atrial pressure against the cycle-mean venous return. `equilibrium`
    // is where the graphical analysis says it should be — the crossing of the
    // two curves. They are close but not identical, because the cardiac
    // function curve is a single-beat approximation and because averaging a
    // nonlinear venous return relation over a cycle is not the same as
    // evaluating it at the mean pressure. Showing only the crossing, as this
    // panel used to, presents a derived equilibrium as if it were the patient.
    const simulated = { x: op.pra, y: op.flow };
    const equilibrium = curveIntersection(vr.points, cf.points);

    // Sampled on simulated time so the trail covers a fixed span of physiology
    // regardless of frame rate, and stops growing when the model is paused.
    if (sim.time - lastSample >= TRAIL_INTERVAL) {
      lastSample = sim.time;
      trail.push(simulated.x, simulated.y);
      if (trail.length > TRAIL_POINTS * 2) trail.splice(0, 2);
    }

    const xLo = Math.min(-6, cf.xIntercept - 3, vr.pCrit - 3);
    const xHi = Math.max(vr.pmsf + 2, simulated.x + 6, 14);
    const yHi = Math.max(9, (vr.points[1] ?? 8) * 1.05, simulated.y * 1.6);
    panel.setDomain(xLo, xHi, 0, yHi);

    panel.grid(colors, {
      xTicks: niceTicks(xLo, xHi, 6), xFormat: (v) => v.toFixed(0),
      yTicks: niceTicks(0, yHi, 4), yFormat: (v) => v.toFixed(0),
      xLabel: 'Right atrial pressure (mmHg)',
      yLabel: 'Flow (L/min)',
    });
    panel.axisLine(colors, { y: 0 });

    panel.clip();

    // Pleural pressure marker: where the cardiac function curve is anchored.
    const pplMmHg = cmH2OtoMmHg(sim.resp.ppl);
    ctx.save();
    ctx.strokeStyle = colors.inkMuted;
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panel.sx(pplMmHg), panel.sy(0));
    ctx.lineTo(panel.sx(pplMmHg), panel.sy(yHi));
    ctx.stroke();
    ctx.restore();

    // The loop the operating point walks over a breath.
    panel.line(trail, { color: colors.ink, width: 1.4, alpha: 0.3 });

    panel.line(vr.points, { color: colors.venous, width: 2 });
    panel.line(cf.points, { color: colors.arterial, width: 2 });

    // The stretch of the cardiac function curve where filling would actually buy
    // output, drawn over it. Which side of that the marker sits on is the whole
    // question, and this makes it a place on the picture rather than a claim.
    const limbs = preloadLimbs(p, c, op);
    if (limbs.steep.length >= 4) {
      panel.line(limbs.steep, { color: colors.arterial, width: 5, alpha: 0.28 });
    }

    panel.unclip();

    // Direct labels rather than a legend box.
    const vrLabelIdx = Math.floor(vr.points.length * 0.18) & ~1;
    panel.label('Venous return', vr.points[vrLabelIdx], vr.points[vrLabelIdx + 1], {
      color: colors.text.venous, dx: 6, dy: -10, halo: colors.surface,
    });
    const cfLabelIdx = Math.floor(cf.points.length * 0.82) & ~1;
    panel.label('Cardiac function', cf.points[cfLabelIdx], cf.points[cfLabelIdx + 1], {
      color: colors.text.arterial, dx: -6, dy: -10, align: 'right', halo: colors.surface,
    });

    panel.label(`Pmsf ${vr.pmsf.toFixed(1)}`, vr.pmsf, 0, {
      color: colors.text.venous, dx: -4, dy: -8, align: 'right', halo: colors.surface,
    });
    panel.label('Ppl', pplMmHg, yHi, {
      color: colors.inkMuted, dx: 4, dy: 12, halo: colors.surface,
    });
    // Placed at the middle of the band rather than its foot, which sits on the
    // axis next to the Pmsf label.
    if (limbs.steep.length >= 6) {
      const mid = (Math.floor(limbs.steep.length / 4) * 2);
      panel.label('filling helps here', limbs.steep[mid], limbs.steep[mid + 1], {
        color: colors.text.arterial, align: 'right', dx: -8, dy: 4, halo: colors.surface,
      });
    }

    // Points measured by occlusion, and the line through them. This is how a
    // venous return curve is built at the bedside — and the line will not lie on
    // the analytic curve, because each hold raises abdominal pressure and so
    // shifts the very curve it is sampling. That gap is the lesson, not a fault.
    const measured = sim.measuredPoints;
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
          panel.label(`Pmsf ${xEnd.toFixed(1)} measured`, Math.min(xEnd, xHi), 0, {
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

    // The analytic equilibrium: hollow, because it is a construction.
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
    // The simulated state: filled, because it is what the model is doing.
    panel.dot(simulated.x, simulated.y, { color: colors.ink, r: 4, ring: colors.surface });

    panel.label('simulated', simulated.x, simulated.y, {
      color: colors.ink, dx: 9, dy: 9, halo: colors.surface,
    });
    if (equilibrium && Math.abs(equilibrium.y - simulated.y) > yHi * 0.03) {
      panel.label('analytic', equilibrium.x, equilibrium.y, {
        color: colors.inkMuted, dx: 9, dy: -9, halo: colors.surface,
      });
    }

    panel.title('Guyton diagram', colors, 'where venous return meets cardiac function');
  }

  function clearTrail() { trail.length = 0; lastSample = -1; }

  return { render, clearTrail };
}
