import { Panel, niceTicks } from '../plot.js';
import { venousReturnCurve, cardiacFunctionCurve } from '../../model/circulation.js';
import { cmH2OtoMmHg } from '../../model/units.js';

// The Guyton diagram. Both curves share right atrial pressure as their abscissa,
// so their intersection is the operating point. Intrathoracic pressure slides
// the cardiac function curve along that axis while leaving the venous return
// curve where it is — which is the entire mechanism by which a breath changes
// cardiac output.

/** Linear interpolation into a flat [x0,y0,x1,y1,…] curve. */
function valueAt(pts, x) {
  for (let i = 2; i < pts.length; i += 2) {
    const a = pts[i - 2], b = pts[i];
    if ((a <= x && x <= b) || (b <= x && x <= a)) {
      const t = (x - a) / ((b - a) || 1);
      return pts[i - 1] + t * (pts[i + 1] - pts[i - 1]);
    }
  }
  return NaN;
}

/**
 * Where the two curves cross — which is what the operating point of a Guyton
 * diagram *is*, and so where the marker has to sit.
 *
 * The alternative, plotting the model's own cycle-mean pressure and flow, leaves
 * the marker visibly off the curves. That gap is not a coding error: venous
 * return is a nonlinear function of right atrial pressure near the collapse
 * knee, and the mean of a nonlinear function is not that function of the mean.
 * Far from the knee the two agree to within 0.01 L/min; near it they differ by
 * about half a litre. The crossing is the honest thing to draw, and
 * docs/PHYSIOLOGY.md records how far the integrated model sits from it.
 */
function intersection(vr, cf) {
  const f = (x) => valueAt(vr, x) - valueAt(cf, x);
  let lo = Math.max(vr[0], cf[0]);
  let hi = Math.min(vr[vr.length - 2], cf[cf.length - 2]);
  if (!(f(lo) > 0) || !(f(hi) < 0)) return null; // no crossing in view
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  const x = (lo + hi) / 2;
  return { x, y: valueAt(vr, x) };
}

export function createGuyton(canvas) {
  const panel = new Panel(canvas, { padding: [22, 16, 34, 46] });
  const trail = []; // operating point over the last few seconds

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
    const point = intersection(vr.points, cf.points) ?? { x: op.pra, y: op.flow };

    trail.push(point.x, point.y);
    if (trail.length > 1400) trail.splice(0, 300);

    const xLo = Math.min(-6, cf.xIntercept - 3, vr.pCrit - 3);
    const xHi = Math.max(vr.pmsf + 2, point.x + 6, 14);
    const yHi = Math.max(9, (vr.points[1] ?? 8) * 1.05, point.y * 1.6);
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

    panel.unclip();

    // Direct labels rather than a legend box.
    const vrLabelIdx = Math.floor(vr.points.length * 0.18) & ~1;
    panel.label('Venous return', vr.points[vrLabelIdx], vr.points[vrLabelIdx + 1], {
      color: colors.venous, dx: 6, dy: -10, halo: colors.surface,
    });
    const cfLabelIdx = Math.floor(cf.points.length * 0.82) & ~1;
    panel.label('Cardiac function', cf.points[cfLabelIdx], cf.points[cfLabelIdx + 1], {
      color: colors.arterial, dx: -6, dy: -10, align: 'right', halo: colors.surface,
    });

    panel.label(`Pmsf ${vr.pmsf.toFixed(1)}`, vr.pmsf, 0, {
      color: colors.venous, dx: -4, dy: -8, align: 'right', halo: colors.surface,
    });
    panel.label('Ppl', pplMmHg, yHi, {
      color: colors.inkMuted, dx: 4, dy: 12, halo: colors.surface,
    });

    // The operating point itself: where the two curves cross.
    panel.dot(point.x, point.y, { color: colors.ink, r: 4, ring: colors.surface });

    panel.title('Guyton diagram', colors, 'where venous return meets cardiac function');
  }

  function clearTrail() { trail.length = 0; }

  return { render, clearTrail };
}
