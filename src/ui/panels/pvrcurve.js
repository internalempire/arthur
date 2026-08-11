import { Panel, niceTicks } from '../plot.js';
import { pvrComponents } from '../../model/lung.js';
import { RESISTANCE_TO_WOOD } from '../../model/units.js';

// Pulmonary vascular resistance against lung volume. The reference line is the
// mechanical J-curve of a fully open lung; the patient line is the equivalent
// resistance after open and derecruited vascular beds have been combined in
// parallel. They are deliberately not stacked: parallel resistances do not add.
//
// The dashed line is how much of the lung is open at each volume, on its own
// 0–100% scale. It is drawn because for this patient it is what shapes the
// curve: the left limb is mostly units being shut rather than vessels being
// squeezed, and how far it climbs as volume rises is what separates a
// recruitable lung from a consolidated one.

export function createPvrCurve(canvas) {
  const panel = new Panel(canvas, { padding: [22, 16, 34, 48] });
  let vMinSeen = Infinity, vMaxSeen = -Infinity, breathSeen = -1;

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, resp: r } = sim;

    // The excursion the current breath makes along the curve — reset on a
    // breath, not after a fixed number of frames.
    if (r.breathCount !== breathSeen) {
      breathSeen = r.breathCount;
      vMinSeen = r.lungVolume;
      vMaxSeen = r.lungVolume;
    }
    vMinSeen = Math.min(vMinSeen, r.lungVolume);
    vMaxSeen = Math.max(vMaxSeen, r.lungVolume);

    const xLo = 0.6;
    const xHi = Math.max(4.2, r.lungVolume + 0.6);
    const samples = 90;
    const reference = [], tot = [], openPct = [];
    let yHi = 0;
    for (let i = 0; i < samples; i++) {
      const v = xLo + ((xHi - xLo) * i) / (samples - 1);
      const comp = pvrComponents(p, v);
      // Supplying phi=1 isolates the fully open human reference curve at the
      // same volume without changing any of the patient's other parameters.
      const fullyOpen = pvrComponents(p, v, null, 1).total * RESISTANCE_TO_WOOD;
      const total = comp.total * RESISTANCE_TO_WOOD;
      reference.push(v, fullyOpen); tot.push(v, total);
      openPct.push(v, comp.openFraction);
      yHi = Math.max(yHi, total, fullyOpen);
    }
    const vascularFrc = pvrComponents(p, r.lungVolume).vascularFrc;
    const referenceNadir = pvrComponents(p, vascularFrc, null, 1).total * RESISTANCE_TO_WOOD;
    yHi = Math.min(yHi, referenceNadir * 7);
    panel.setDomain(xLo, xHi, 0, yHi * 1.05);

    panel.grid(colors, {
      xTicks: niceTicks(xLo, xHi, 5), xFormat: (v) => v.toFixed(1),
      yTicks: niceTicks(0, yHi, 4), yFormat: (v) => v.toFixed(1),
      xLabel: 'Lung volume (L)',
      yLabel: 'PVR (Wood units)',
    });

    panel.clip();

    // The tidal excursion along the curve.
    if (vMaxSeen > vMinSeen) {
      const a = panel.plotArea;
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = colors.ink;
      ctx.fillRect(panel.sx(vMinSeen), a.y, panel.sx(vMaxSeen) - panel.sx(vMinSeen), a.h);
      ctx.restore();
    }

    // Open fraction on its own scale: the top of the plot is a fully open lung.
    const openScaled = openPct.map((n, i) => (i % 2 ? n * yHi * 1.05 : n));
    panel.line(openScaled, { color: colors.ink, width: 1.2, alpha: 0.35, dash: [4, 4] });

    panel.line(reference, { color: colors.pleural, width: 1.6, alpha: 0.75, dash: [5, 3] });
    panel.line(tot, { color: colors.flow, width: 2.4 });

    panel.unclip();

    const at = (arr, frac) => { const i = (Math.floor(arr.length * frac) & ~1); return [arr[i], arr[i + 1]]; };
    let [lx, ly] = at(reference, 0.82);
    panel.label('Fully open reference', lx, ly,
      { color: colors.text.pleural, align: 'right', dx: -4, dy: -8, halo: colors.surface });
    [lx, ly] = at(tot, 0.45);
    panel.label('Patient total', lx, ly, { color: colors.text.flow, dx: 4, dy: 12, halo: colors.surface });

    // The label names the line; the number belongs at the patient's own volume,
    // which is the only place on this curve where it says anything about them.
    const here = pvrComponents(p, r.lungVolume);
    panel.label('Open fraction',
      openScaled[openScaled.length - 2], openScaled[openScaled.length - 1],
      { color: colors.text.muted ?? colors.text.flow, align: 'right', dx: -4, dy: -6, halo: colors.surface });

    const openHere = here.openFraction * yHi * 1.05;
    panel.dot(r.lungVolume, openHere, { color: colors.ink, r: 3, ring: colors.surface });
    panel.label(`${(here.openFraction * 100).toFixed(0)}% open`, r.lungVolume, openHere,
      { color: colors.text.muted ?? colors.text.flow, dx: 6, dy: 12, halo: colors.surface });

    panel.dot(r.lungVolume, here.total * RESISTANCE_TO_WOOD,
      { color: colors.ink, r: 4, ring: colors.surface });

    panel.title('PVR vs lung volume', colors, 'the J-curve');
  }

  return { render };
}
