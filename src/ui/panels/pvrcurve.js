import { Panel, niceTicks } from '../plot.js';
import { pvrComponents, PVR_NADIR_VOLUME } from '../../model/respiratory.js';
import { RESISTANCE_TO_WOOD } from '../../model/units.js';

// Pulmonary vascular resistance against lung volume. Intra-alveolar vessels are
// compressed by inflation; extra-alveolar vessels are tethered open by it. Their
// sum is J-shaped, so both atelectasis and overdistension load the right
// ventricle, and the best place to be is neither.

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
    const alv = [], ext = [], tot = [];
    let yHi = 0;
    for (let i = 0; i < samples; i++) {
      const v = xLo + ((xHi - xLo) * i) / (samples - 1);
      const comp = pvrComponents(p, v);
      const a = comp.alveolar * RESISTANCE_TO_WOOD;
      const e = comp.extraAlveolar * RESISTANCE_TO_WOOD;
      alv.push(v, a); ext.push(v, e); tot.push(v, a + e);
      yHi = Math.max(yHi, a + e);
    }
    yHi = Math.min(yHi, pvrComponents(p, PVR_NADIR_VOLUME).total * RESISTANCE_TO_WOOD * 7);
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

    panel.line(alv, { color: colors.airway, width: 1.6, alpha: 0.85 });
    panel.line(ext, { color: colors.pleural, width: 1.6, alpha: 0.85 });
    panel.line(tot, { color: colors.flow, width: 2.4 });

    panel.unclip();

    const at = (arr, frac) => { const i = (Math.floor(arr.length * frac) & ~1); return [arr[i], arr[i + 1]]; };
    let [lx, ly] = at(alv, 0.86);
    panel.label('Intra-alveolar', lx, ly, { color: colors.text.airway, align: 'right', dx: -4, dy: -8, halo: colors.surface });
    [lx, ly] = at(ext, 0.1);
    panel.label('Extra-alveolar', lx, ly, { color: colors.text.pleural, dx: 6, dy: -8, halo: colors.surface });
    [lx, ly] = at(tot, 0.45);
    panel.label('Total', lx, ly, { color: colors.text.flow, dx: 4, dy: 12, halo: colors.surface });

    const cur = pvrComponents(p, r.lungVolume).total * RESISTANCE_TO_WOOD;
    panel.dot(r.lungVolume, cur, { color: colors.ink, r: 4, ring: colors.surface });

    panel.title('PVR vs lung volume', colors, 'the J-curve');
  }

  return { render };
}
