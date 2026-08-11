import { Panel, niceTicks } from '../plot.js';
import { lungVolumeAtPl, pvrComponents, RESISTANCE_TO_WOOD } from '../../model/index.js';

// The classical two-limb construction of pulmonary vascular resistance.
//
// Alveolar vessels are compressed as lung volume rises; extra-alveolar vessels
// are pulled open by radial traction. These resistances are in series within an
// open vascular path, so their sum is the mechanical J-curve. Derecruitment and
// HPV still affect the patient's actual point, but are not drawn as another
// curve: mixing that separate mechanism into this construction obscured the two
// opposing limbs the panel exists to teach.

const TLC_REFERENCE_PRESSURE = 35; // cmH2O: the fully open lung's model TLC anchor

export function createPvrCurve(canvas) {
  const panel = new Panel(canvas, { padding: [22, 16, 50, 48] });
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

    // The endpoints are the model's fully open low-volume and TLC anchors for
    // this lung. Unlike the previous 4.2 L crop, this always includes the whole
    // right limb. `vascularFrc` is where the two slopes cancel and the total
    // curve reaches its minimum.
    const landmarks = {
      rv: lungVolumeAtPl(p, 0, 1),
      frc: pvrComponents(p, r.lungVolume).vascularFrc,
      tlc: lungVolumeAtPl(p, TLC_REFERENCE_PRESSURE, 1),
    };
    const xLo = landmarks.rv;
    const xHi = landmarks.tlc;
    const samples = 120;
    const alveolar = [], extraAlveolar = [], total = [];
    let yHi = 0;
    for (let i = 0; i < samples; i++) {
      const v = xLo + ((xHi - xLo) * i) / (samples - 1);
      // Holding phi at one isolates the mechanical vascular construction. The
      // two named components add in series and their sum is exactly openPath.
      const comp = pvrComponents(p, v, null, 1);
      const a = comp.alveolarPath * RESISTANCE_TO_WOOD;
      const e = comp.extraAlveolarPath * RESISTANCE_TO_WOOD;
      const j = comp.openPath * RESISTANCE_TO_WOOD;
      alveolar.push(v, a);
      extraAlveolar.push(v, e);
      total.push(v, j);
      yHi = Math.max(yHi, a, e, j);
    }

    const patient = pvrComponents(p, r.lungVolume, r.plSolved, r.openFraction);
    const patientPvr = patient.total * RESISTANCE_TO_WOOD;
    const patientVisible = r.lungVolume >= xLo && r.lungVolume <= xHi;
    if (patientVisible) yHi = Math.max(yHi, patientPvr);
    panel.setDomain(xLo, xHi, 0, yHi * 1.05);

    panel.grid(colors, {
      // Named volume landmarks carry the teaching message more directly than
      // an undifferentiated row of litre ticks. Their values are printed below.
      xTicks: Object.values(landmarks), xFormat: () => '',
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

    panel.line(extraAlveolar, { color: colors.pleural, width: 1.7, alpha: 0.85 });
    panel.line(alveolar, { color: colors.airway, width: 1.7, alpha: 0.85, dash: [3, 3] });
    panel.line(total, { color: colors.flow, width: 2.6 });

    panel.unclip();

    const at = (arr, frac) => { const i = (Math.floor(arr.length * frac) & ~1); return [arr[i], arr[i + 1]]; };
    let [lx, ly] = at(extraAlveolar, 0.18);
    panel.label('Extra-alveolar vessels', lx, ly,
      { color: colors.text.pleural, dx: 5, dy: -10, halo: colors.surface });
    [lx, ly] = at(alveolar, 0.84);
    panel.label('Alveolar vessels', lx, ly,
      { color: colors.text.airway, align: 'right', dx: -5, dy: 11, halo: colors.surface });
    [lx, ly] = at(total, 0.34);
    panel.label('Total PVR', lx, ly,
      { color: colors.text.flow, dx: 5, dy: -12, halo: colors.surface });

    // One point keeps the plot connected to the live simulation without turning
    // derecruitment and HPV into a competing curve. When it sits above the
    // mechanical sum, that gap is the contribution of the patient's closed bed.
    if (patientVisible) {
      panel.dot(r.lungVolume, patientPvr, { color: colors.ink, r: 4, ring: colors.surface });
      panel.label('Patient', r.lungVolume, patientPvr,
        { color: colors.inkSecondary, dx: 6, dy: 11, halo: colors.surface });
    }

    // RV, FRC and TLC are visual landmarks rather than extra data series. Each
    // is paired with its litre value so changes in lung mechanics remain visible.
    const a = panel.plotArea;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const [name, volume] of Object.entries(landmarks)) {
      ctx.font = '600 10px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillStyle = name === 'frc' ? colors.inkSecondary : colors.inkMuted;
      ctx.fillText(name.toUpperCase(), panel.sx(volume), a.y + a.h + 5);
      ctx.font = '9px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(volume.toFixed(1), panel.sx(volume), a.y + a.h + 17);
    }
    ctx.restore();

    panel.title('PVR vs lung volume', colors, 'alveolar + extra-alveolar vessels');
  }

  return { render };
}
