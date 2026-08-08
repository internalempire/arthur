import { Panel } from '../plot.js';
import { CHAMBER } from '../../model/circulation.js';

// Sagawa pressure–volume loops. Pressures here are transmural, which is what
// the myocardium experiences — so the loops keep their shape when intrathoracic
// pressure moves, and the change you see is a real change in loading.

function makeSide(canvas, cfg) {
  const panel = new Panel(canvas, { padding: [22, 14, 32, 42] });

  function render(sim, colors) {
    panel.resize();
    panel.begin();
    const { params: p, circ: c } = sim;
    const spec = CHAMBER[cfg.key];
    const ees = p[cfg.eesParam];
    const edB = cfg.key === 'lv' ? p.lvStiff : spec.edB;

    const live = cfg.key === 'lv' ? c.loopLv : c.loopRv;
    const prev = cfg.key === 'lv' ? c.lastLoopLv : c.lastLoopRv;
    const edv = cfg.key === 'lv' ? c.lvEdv : c.rvEdv;
    const esv = cfg.key === 'lv' ? c.lvEsv : c.rvEsv;
    const esp = cfg.key === 'lv' ? c.lvEsp - c.p.ppl : c.rvEsp - c.p.ppl;

    let vMax = 60, pMax = 20;
    for (const arr of [prev, live]) {
      for (let i = 0; i < arr.length; i += 2) {
        vMax = Math.max(vMax, arr[i]);
        pMax = Math.max(pMax, arr[i + 1]);
      }
    }
    vMax = Math.ceil((vMax * 1.12) / 20) * 20;
    pMax = Math.ceil((pMax * 1.15) / 10) * 10;
    panel.setDomain(0, vMax, 0, pMax);

    panel.grid(colors, {
      xTicks: [0, vMax / 2, vMax], xFormat: (v) => v.toFixed(0),
      yTicks: [0, pMax / 2, pMax], yFormat: (v) => v.toFixed(0),
      xLabel: 'Volume (mL)',
    });

    panel.clip();

    // End-systolic pressure–volume relationship: the contractility line.
    panel.line([spec.v0s, 0, vMax, ees * (vMax - spec.v0s)], {
      color: colors.ink, width: 1.4, dash: [5, 4], alpha: 0.45,
    });
    // End-diastolic pressure–volume relationship.
    const ed = [];
    for (let v = 0; v <= vMax; v += vMax / 40) {
      ed.push(v, spec.edA * (Math.exp(edB * Math.max(0, v - spec.v0d)) - 1));
    }
    panel.line(ed, { color: colors.ink, width: 1.4, dash: [5, 4], alpha: 0.45 });

    // Effective arterial elastance: end-diastolic volume to the end-systolic point.
    if (esv < edv) {
      panel.line([edv, 0, esv, Math.max(0, esp)], {
        color: colors.inkMuted, width: 1.4, dash: [2, 3], alpha: 0.9,
      });
    }

    panel.line(prev, { color: colors[cfg.color], width: 1.6, alpha: 0.3 });
    panel.line(live, { color: colors[cfg.color], width: 2.2 });

    panel.unclip();

    panel.label('ESPVR', vMax, ees * (vMax - spec.v0s), {
      color: colors.inkMuted, align: 'right', dx: -4, dy: 10, halo: colors.surface,
    });
    panel.label('Ea', (edv + esv) / 2, Math.max(0, esp) / 2, {
      color: colors.inkMuted, dx: 6, halo: colors.surface,
    });

    panel.title(cfg.label, colors, `${(edv - esv).toFixed(0)} mL`);
  }

  return { render };
}

export function createPvLoops(container) {
  container.classList.add('pv-pair');
  const sides = [
    { key: 'rv', label: 'Right ventricle', color: 'venous', eesParam: 'eesRv' },
    { key: 'lv', label: 'Left ventricle', color: 'arterial', eesParam: 'eesLv' },
  ].map((cfg) => {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    return makeSide(canvas, cfg);
  });

  return {
    render(sim, colors) { for (const s of sides) s.render(sim, colors); },
  };
}
