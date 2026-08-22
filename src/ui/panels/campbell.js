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

const roundDown = (value, step) => Math.floor(value / step) * step;
const roundUp = (value, step) => Math.ceil(value / step) * step;

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

export function createCampbell(canvas) {
  const panel = new Panel(canvas, { padding: [22, 50, 40, 58] });
  const pplLoop = [];
  const previousLoop = [];
  let breathSeen = -1;
  let lastSample = -1;

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
    const { xMin, xMax, yMin, yMax } = reference.domain;
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
        color: colors.inkMuted, width: 1.7, dash: branch.dash, alpha: 0.82,
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

    const wallLabel = closestPoint(reference.chestWall, yMax * 0.75);
    const lungLabel = closestPoint(reference.lungCurves[0].points, yMax * 0.72);
    panel.label('relaxed chest wall', wallLabel[0], wallLabel[1], {
      color: colors.text.pleural, dx: -5, align: 'right', halo: colors.surface,
    });
    panel.label('−P_L · lung recoil', lungLabel[0], lungLabel[1], {
      color: colors.inkMuted, dx: -5, align: 'right', halo: colors.surface,
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
  }

  return { render, clearTrail };
}
