import { Panel, niceTicks } from '../plot.js';
import { venousReturnCurve, cardiacFunctionCurve } from '../../model/circulation.js';
import { cmH2OtoMmHg } from '../../model/units.js';

// The Guyton diagram. Both curves share right atrial pressure as their abscissa,
// so their intersection is the operating point. Intrathoracic pressure slides
// the cardiac function curve along that axis while leaving the venous return
// curve where it is — which is the entire mechanism by which a breath changes
// cardiac output.

export function createGuyton(canvas) {
  const panel = new Panel(canvas, { padding: [22, 16, 34, 46] });
  const trail = []; // operating point over the last few seconds

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, circ: c, metrics: m } = sim;

    const vr = venousReturnCurve(p, c);
    const cf = cardiacFunctionCurve(p, c);

    trail.push(c.p.ra, (c.q.vr * 60) / 1000);
    if (trail.length > 900) trail.splice(0, 200);

    const xLo = Math.min(-6, cf.xIntercept - 3, vr.pCrit - 3);
    const xHi = Math.max(vr.pmsf + 2, c.p.ra + 6, 14);
    const yHi = Math.max(9, (vr.points[1] ?? 8) * 1.05, m.co * 1.6);
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

    // Operating-point trail over the respiratory cycle.
    panel.line(trail, { color: colors.ink, width: 1, alpha: 0.22 });

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

    // The operating point itself.
    panel.dot(c.p.ra, m.co, { color: colors.ink, r: 4, ring: colors.surface });

    panel.title('Guyton diagram', colors, 'where venous return meets cardiac function');
  }

  function clearTrail() { trail.length = 0; }

  return { render, clearTrail };
}
