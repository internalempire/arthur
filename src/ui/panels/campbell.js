import { Panel, niceTicks } from '../plot.js';
import {
  lungVolumeAtPl, relaxationVolume, recruitmentBand, stepRecruitedFraction,
  openFractionFromRecruitmentState, chestWallPressure,
} from '../../model/index.js';

// Classical Campbell construction. Pressure is pleural pressure throughout:
// the relaxed chest wall is Pcw(V), the lung recoil curve is plotted as -PL(V),
// and the live breath is the Ppl-volume loop. Paw and Palv belong to different
// pressure constructions and remain available in the waveform panel.

const LOOP_INTERVAL = 0.02; // simulated seconds between samples
const LOOP_POINTS = 900;    // roughly three normal breaths
const PL_MIN = -5;
const PL_MAX = 45;
const ZOOM_LEVELS = Object.freeze([1, 1.5, 2, 3]);

const roundDown = (value, step) => Math.floor(value / step) * step;
const roundUp = (value, step) => Math.ceil(value / step) * step;

/** Keep a two-axis zoom inside the complete static Campbell construction. */
export function campbellZoomDomain(full, focus, factor = 1) {
  const zoom = Math.max(1, Number(factor) || 1);
  if (zoom === 1) return { ...full };

  const xSpan = (full.xMax - full.xMin) / zoom;
  const ySpan = (full.yMax - full.yMin) / zoom;
  const focusX = Number.isFinite(focus?.x) ? focus.x : (full.xMin + full.xMax) / 2;
  const focusY = Number.isFinite(focus?.y) ? focus.y : (full.yMin + full.yMax) / 2;
  const xMin = Math.min(full.xMax - xSpan, Math.max(full.xMin, focusX - xSpan / 2));
  const yMin = Math.min(full.yMax - ySpan, Math.max(full.yMin, focusY - ySpan / 2));
  return { xMin, xMax: xMin + xSpan, yMin, yMax: yMin + ySpan };
}

/**
 * Build the static reference curves from the same constitutive relations used
 * by the integrator. The returned domain spans the patient's physical volume
 * range rather than following the current breath, so the panel cannot rescale
 * from frame to frame.
 */
export function classicalCampbellCurves(p, steps = 80) {
  const vRelax = relaxationVolume(p);
  const branches = p.hysteresis === 'on'
    ? [{ direction: 'up', dash: [2, 4] }, { direction: 'down', dash: [6, 3] }]
    : [{ direction: null, dash: [5, 4] }];

  const lungCurves = branches.map((branch) => {
    const points = [];
    let recruited = branch.direction === 'down' ? recruitmentBand(p, PL_MAX).lo : null;
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const pl = branch.direction === 'down'
        ? PL_MAX - fraction * (PL_MAX - PL_MIN)
        : PL_MIN + fraction * (PL_MAX - PL_MIN);
      if (branch.direction) {
        recruited = stepRecruitedFraction(
          p, recruited ?? recruitmentBand(p, pl).lo, pl,
        );
      }
      const openFraction = branch.direction
        ? openFractionFromRecruitmentState(p, pl, recruited)
        : null;
      points.push(-pl, lungVolumeAtPl(p, pl, openFraction));
    }
    return { points, dash: branch.dash };
  });

  const lungVolumes = lungCurves.flatMap(({ points }) => points.filter((_, i) => i % 2));
  const highestLungVolume = Math.max(vRelax, ...lungVolumes);
  const yMax = Math.max(
    1,
    roundUp(Math.max(vRelax + 0.8, highestLungVolume * 1.04), 0.5),
  );
  const chestWall = [];
  for (let i = 0; i <= steps; i++) {
    const volume = 0.02 + (i / steps) * (yMax - 0.02);
    chestWall.push(chestWallPressure(p, volume), volume);
  }

  const pressures = [
    ...chestWall.filter((_, i) => i % 2 === 0),
    ...lungCurves.flatMap(({ points }) => points.filter((_, i) => i % 2 === 0)),
  ];
  const xMin = roundDown(Math.min(...pressures, Math.min(...pressures) - p.pmus) - 2, 5);
  const xMax = roundUp(Math.max(...pressures) + 2, 5);

  return {
    chestWall,
    lungCurves,
    vRelax,
    relaxPressure: chestWallPressure(p, vRelax),
    domain: { xMin, xMax, yMin: 0, yMax },
  };
}

function closestPoint(points, targetVolume) {
  let best = [points[0], points[1]];
  let distance = Math.abs(points[1] - targetVolume);
  for (let i = 2; i < points.length; i += 2) {
    const candidate = Math.abs(points[i + 1] - targetVolume);
    if (candidate < distance) {
      best = [points[i], points[i + 1]];
      distance = candidate;
    }
  }
  return best;
}

export function createCampbell(canvas, { onViewChange } = {}) {
  const panel = new Panel(canvas, { padding: [22, 50, 40, 58] });
  const pplLoop = [];
  const previousLoop = [];
  let breathSeen = -1;
  let lastSample = -1;
  let zoomIndex = 0;
  let zoomFocus = null;

  // Match the PVR chart's native, keyboard-operable controls. Campbell zooms
  // both axes because its clinical purpose is to inspect the live breath
  // against two pressure-volume relations, not to preserve one fixed axis.
  const zoomControls = document.createElement('div');
  zoomControls.className = 'pvr-zoom campbell-zoom';
  zoomControls.setAttribute('role', 'group');
  zoomControls.setAttribute('aria-label', 'Zoom for Campbell diagram');

  const zoomOut = document.createElement('button');
  zoomOut.type = 'button';
  zoomOut.textContent = '\u2212';
  zoomOut.setAttribute('aria-label', 'Zoom out on Campbell diagram');
  zoomOut.title = 'Zoom out';

  const zoomReset = document.createElement('button');
  zoomReset.type = 'button';
  zoomReset.className = 'pvr-zoom-reset';
  zoomReset.setAttribute('aria-label', 'Reset Campbell diagram to the full range');
  zoomReset.title = 'Fit the full Campbell construction';

  const zoomIn = document.createElement('button');
  zoomIn.type = 'button';
  zoomIn.textContent = '+';
  zoomIn.setAttribute('aria-label', 'Zoom in around the current point on Campbell diagram');
  zoomIn.title = 'Zoom in around the current point';

  zoomControls.append(zoomOut, zoomReset, zoomIn);
  canvas.insertAdjacentElement('afterend', zoomControls);

  function syncZoomControls() {
    const factor = ZOOM_LEVELS[zoomIndex];
    zoomOut.disabled = zoomIndex === 0;
    zoomIn.disabled = zoomIndex === ZOOM_LEVELS.length - 1;
    zoomReset.disabled = zoomIndex === 0;
    zoomReset.textContent = zoomIndex === 0 ? 'Fit' : `${Math.round(factor * 100)}%`;
    zoomReset.setAttribute('aria-label', zoomIndex === 0
      ? 'Campbell diagram already fitted to the full range'
      : `Reset Campbell diagram from ${Math.round(factor * 100)} percent zoom to the full range`);
  }

  function setZoomIndex(next) {
    const clamped = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, next));
    if (clamped === zoomIndex) return;
    zoomIndex = clamped;
    if (zoomIndex === 0) zoomFocus = null;
    syncZoomControls();
    onViewChange?.();
  }

  zoomOut.addEventListener('click', () => setZoomIndex(zoomIndex - 1));
  zoomIn.addEventListener('click', () => setZoomIndex(zoomIndex + 1));
  zoomReset.addEventListener('click', () => setZoomIndex(0));
  syncZoomControls();

  function render(sim, colors) {
    panel.resize();
    panel.begin();
    const { params: p, resp: r } = sim;

    // Sample simulated time rather than display frames. This keeps the loop
    // independent of animation speed and prevents accumulation while paused.
    if (sim.time - lastSample >= LOOP_INTERVAL) {
      lastSample = sim.time;
      if (r.breathCount !== breathSeen) {
        breathSeen = r.breathCount;
        previousLoop.length = 0;
        previousLoop.push(...pplLoop);
        pplLoop.length = 0;
      }
      pplLoop.push(r.ppl, r.lungVolume);
      if (pplLoop.length > LOOP_POINTS * 2) pplLoop.splice(0, 2);
    }

    const reference = classicalCampbellCurves(p);
    if (zoomIndex > 0 && zoomFocus === null) {
      // Freeze the centre until settings change or the user returns to Fit.
      // This prevents the axes from following every point of the live breath.
      zoomFocus = { x: r.ppl, y: r.lungVolume };
    }
    const view = campbellZoomDomain(reference.domain, zoomFocus, ZOOM_LEVELS[zoomIndex]);
    const { xMin, xMax, yMin, yMax } = view;
    panel.setDomain(xMin, xMax, yMin, yMax);
    panel.grid(colors, {
      xTicks: niceTicks(xMin, xMax, 6), xFormat: (v) => v.toFixed(0),
      yTicks: niceTicks(yMin, yMax, 5), yFormat: (v) => v.toFixed(1),
      xLabel: 'Pleural pressure, Ppl (cmH₂O)',
      yLabel: 'Absolute lung volume (L)',
    });
    panel.axisLine(colors, { x: 0 });

    panel.clip();
    panel.line([xMin, reference.vRelax, xMax, reference.vRelax], {
      color: colors.inkMuted, width: 1, dash: [3, 5], alpha: 0.45,
    });
    panel.line(reference.chestWall, {
      color: colors.pleural, width: 1.8, dash: [2, 4], alpha: 0.85,
    });
    for (const branch of reference.lungCurves) {
      panel.line(branch.points, {
        color: colors.transpulmonary, width: 1.9, dash: branch.dash, alpha: 0.9,
      });
    }

    // Only the Ppl-volume trajectory is a Campbell loop. The previous breath is
    // retained faintly so a parameter change remains visible without tangling
    // several old breaths over the current one.
    panel.line(previousLoop, { color: colors.pleural, width: 1.5, alpha: 0.22 });
    panel.line(pplLoop, { color: colors.pleural, width: 2.4 });

    const relaxedPpl = chestWallPressure(p, r.lungVolume);
    const musclePressure = relaxedPpl - r.ppl;
    if (musclePressure > 0.25) {
      panel.line([r.ppl, r.lungVolume, relaxedPpl, r.lungVolume], {
        color: colors.airway, width: 1.6, dash: [4, 3], alpha: 0.9,
      });
    }
    panel.unclip();

    const labelVolume = yMin + (yMax - yMin) * 0.8;
    const wallLabel = closestPoint(reference.chestWall, labelVolume);
    const lungLabel = closestPoint(reference.lungCurves[0].points, labelVolume);
    panel.subscriptLabel('C', 'cw', wallLabel[0], wallLabel[1], {
      color: colors.text.pleural, dx: -5, align: 'right', halo: colors.surface,
    });
    panel.subscriptLabel('C', 'L', lungLabel[0], lungLabel[1], {
      color: colors.text.transpulmonary, dx: -5, align: 'right', halo: colors.surface,
    });
    const relaxationLabel = p.peep === 0 && sim.metrics.autoPeep < 0.2 ? 'FRC = Vrel' : 'Vrel';
    panel.label(relaxationLabel, xMin, reference.vRelax, {
      color: colors.inkMuted, dx: 5, dy: -5, halo: colors.surface,
    });
    if (musclePressure > 0.25) {
      panel.label(`Pmus ${musclePressure.toFixed(1)}`, (r.ppl + relaxedPpl) / 2, r.lungVolume, {
        color: colors.text.airway, dy: -7, align: 'center', halo: colors.surface,
      });
    }
    panel.label('Ppl', r.ppl, r.lungVolume, {
      color: colors.text.pleural, dx: -6, align: 'right', halo: colors.surface,
    });

    panel.dot(reference.relaxPressure, reference.vRelax, {
      color: colors.inkMuted, r: 3, ring: colors.surface,
    });
    panel.dot(r.ppl, r.lungVolume, {
      color: colors.text.pleural, r: 3.8, ring: colors.surface,
    });
    panel.title('Campbell diagram', colors, 'Ppl vs lung volume');
  }

  function clearTrail() {
    pplLoop.length = 0;
    previousLoop.length = 0;
    breathSeen = -1;
    lastSample = -1;
    zoomFocus = null;
  }

  return { render, clearTrail };
}
