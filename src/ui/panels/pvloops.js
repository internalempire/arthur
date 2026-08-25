import { Panel } from '../plot.js';
import { CHAMBER } from '../../model/index.js';

// Sagawa pressure–volume loops. Pressures here are transmural, which is what
// the myocardium experiences — so the loops keep their shape when intrathoracic
// pressure moves, and the change you see is a real change in loading.

const BASE_DOMAIN = Object.freeze({
  rv: Object.freeze({ vMax: 220, pMax: 60 }),
  lv: Object.freeze({ vMax: 220, pMax: 180 }),
});

const ceilTo = (value, step) => Math.ceil(value / step) * step;

/** A PV domain expands when required but cannot breathe with the live loop. */
export function stablePvLoopDomain(previous, observed, key) {
  const base = BASE_DOMAIN[key];
  const next = previous ? { ...previous } : { ...base };
  if (observed.vMax > next.vMax * 0.96) {
    next.vMax = ceilTo(Math.max(base.vMax, observed.vMax * 1.15), 20);
  }
  if (observed.pMax > next.pMax * 0.96) {
    next.pMax = ceilTo(Math.max(base.pMax, observed.pMax * 1.15), 10);
  }
  return next;
}

/**
 * Single-beat local ESPVR used by the drawing. Total end-systolic pressure can
 * include ventricular-interdependence terms that are not part of the selected
 * free-wall Ees, so the effective line is anchored to the actual end-systolic
 * point and the model's V0.
 */
export function effectiveEndSystolicRelation(esp, esv, selectedEes, v0s) {
  const denominator = esv - v0s;
  const slope = Number.isFinite(esp) && denominator > 1
    ? Math.max(0, esp) / denominator
    : selectedEes;
  return {
    slope,
    v0: v0s,
    pressureAt: (volume) => Math.max(0, slope * (volume - v0s)),
  };
}

function makeSide(canvas, cfg) {
  const panel = new Panel(canvas, { padding: [22, 14, 32, 42] });
  let viewDomain = null;

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
    const esp = cfg.key === 'lv' ? c.lvEsp : c.rvEsp; // already transmural

    let observedV = Math.max(60, edv, esv);
    let observedP = Math.max(20, Number.isFinite(esp) ? esp : 0);
    for (const arr of [prev, live]) {
      for (let i = 0; i < arr.length; i += 2) {
        observedV = Math.max(observedV, arr[i]);
        observedP = Math.max(observedP, arr[i + 1]);
      }
    }
    viewDomain = stablePvLoopDomain(viewDomain, {
      vMax: observedV,
      pMax: observedP,
    }, cfg.key);
    const { vMax, pMax } = viewDomain;
    panel.setDomain(0, vMax, 0, pMax);

    panel.grid(colors, {
      xTicks: [0, vMax / 2, vMax], xFormat: (v) => v.toFixed(0),
      yTicks: [0, pMax / 2, pMax], yFormat: (v) => v.toFixed(0),
      xLabel: 'Volume (mL)',
    });

    panel.clip();

    // Local effective ESPVR. The integrated RV pressure also contains LV/septal
    // systolic support, so the selected intrinsic Ees alone is not the total
    // chamber relation. Anchoring this line to the same beat's (ESV, Pes) keeps
    // the end-systolic point on the relation by construction.
    const espvr = effectiveEndSystolicRelation(esp, esv, ees, spec.v0s);
    const espvrEndX = Math.min(vMax, spec.v0s + pMax / Math.max(espvr.slope, 1e-6));
    const espvrEndY = espvr.pressureAt(espvrEndX);
    panel.line([spec.v0s, 0, espvrEndX, espvrEndY], {
      color: colors.ink, width: 1.4, dash: [5, 4], alpha: 0.45,
    });
    // End-diastolic pressure–volume relationship.
    const ed = [];
    for (let v = 0; v <= vMax; v += vMax / 40) {
      ed.push(v, spec.edA * (Math.exp(edB * Math.max(0, v - spec.v0d)) - 1));
    }
    panel.line(ed, { color: colors.ink, width: 1.4, dash: [5, 4], alpha: 0.45 });

    // Effective arterial elastance: end-diastolic volume to the end-systolic point.
    if (esv < edv && Number.isFinite(esp)) {
      panel.line([edv, 0, esv, Math.max(0, esp)], {
        color: colors.inkMuted, width: 1.4, dash: [2, 3], alpha: 0.9,
      });
    }

    panel.line(prev, { color: colors[cfg.color], width: 1.6, alpha: 0.3 });
    panel.line(live, { color: colors[cfg.color], width: 2.2 });
    if (Number.isFinite(esp)) {
      panel.dot(esv, Math.max(0, esp), {
        color: colors[cfg.color], r: 3.2, ring: colors.surface,
      });
    }

    panel.unclip();

    panel.label('ESPVR', espvrEndX, espvrEndY, {
      color: colors.inkMuted, align: 'right', dx: -4, dy: 10, halo: colors.surface,
    });
    if (Number.isFinite(esp) && esv < edv) {
      panel.label('Ea', (edv + esv) / 2, Math.max(0, esp) / 2, {
        color: colors.inkMuted, dx: 6, halo: colors.surface,
      });
    }

    panel.title(cfg.label, colors, `${(edv - esv).toFixed(0)} mL`);
  }

  function resetView() { viewDomain = null; }

  return { render, resetView };
}

export function createPvLoops(container) {
  container.classList.add('pv-pair');
  const sides = [
    { key: 'rv', label: 'Right ventricle', color: 'venous', eesParam: 'eesRv' },
    { key: 'lv', label: 'Left ventricle', color: 'arterial', eesParam: 'eesLv' },
  ].map((cfg) => {
    // Each canvas gets its own positioned cell to be absolute inside, so its
    // backing store can never feed back into the grid track that sizes it.
    const cell = document.createElement('div');
    cell.className = 'pv-cell';
    const canvas = document.createElement('canvas');
    cell.appendChild(canvas);
    container.appendChild(cell);
    return makeSide(canvas, cfg);
  });

  return {
    render(sim, colors) { for (const s of sides) s.render(sim, colors); },
    resetView() { for (const s of sides) s.resetView(); },
  };
}
