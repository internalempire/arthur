import { Panel, niceTicks } from '../plot.js';
import {
  PPL_FRC, respiratorySystemCompliance,
  lungVolumeAtPl, relaxationVolume, openBand, stepOpenFraction,
} from '../../model/index.js';

// The Campbell diagram. Pleural pressure follows the chest wall compliance
// curve; airway pressure follows the respiratory system curve. The horizontal
// distance between the two loops at any volume is the pressure spent on the
// lung — and the pleural loop is the one the heart lives inside.

const LOOP_INTERVAL = 0.02; // s of simulated time between samples
const LOOP_POINTS = 900;    // about three breaths at a normal rate

export function createCampbell(canvas) {
  const panel = new Panel(canvas, { padding: [22, 58, 34, 48] });
  const pplLoop = [];
  const pawLoop = [];
  const palvLoop = [];
  const prev = { ppl: [], paw: [], palv: [] };
  let breathSeen = -1;
  let lastSample = -1;

  function render(sim, colors) {
    panel.resize();
    const ctx = panel.begin();
    const { params: p, resp: r } = sim;

    const vMl = r.v * 1000;
    // Sampled on simulated time, so the loop keeps its shape whatever the frame
    // rate and does not accumulate while paused.
    if (sim.time - lastSample >= LOOP_INTERVAL) {
      lastSample = sim.time;
      // One breath at a time, and only the one before it kept.
      //
      // A rolling buffer spanning several breaths draws them all on top of each
      // other, which is fine while they coincide and unreadable the moment a
      // parameter changes and they stop coinciding. Keeping the previous breath
      // and fading it shows the change instead of tangling with it.
      if (r.breathCount !== breathSeen) {
        breathSeen = r.breathCount;
        prev.ppl = pplLoop.slice(); prev.paw = pawLoop.slice(); prev.palv = palvLoop.slice();
        pplLoop.length = 0; pawLoop.length = 0; palvLoop.length = 0;
      }
      pplLoop.push(r.ppl, vMl);
      pawLoop.push(r.paw, vMl);
      palvLoop.push(r.palv, vMl);
      if (pplLoop.length > LOOP_POINTS * 2) {
        pplLoop.splice(0, 2); pawLoop.splice(0, 2); palvLoop.splice(0, 2);
      }
    }

    const vMax = Math.max(900, vMl * 1.25, p.vt * 1.6 + p.peep * respiratorySystemCompliance(p, r.lungVolume));
    let pLo = -12, pHi = 30;
    for (const [pl, pw] of [[pplLoop, pawLoop], [prev.ppl, prev.paw]]) {
      for (let i = 0; i < pl.length; i += 2) {
        pLo = Math.min(pLo, pl[i] - 2);
        pHi = Math.max(pHi, pw[i] + 2);
      }
    }
    panel.setDomain(pLo, pHi, -50, vMax);

    panel.grid(colors, {
      xTicks: niceTicks(pLo, pHi, 6), xFormat: (v) => v.toFixed(0),
      yTicks: niceTicks(0, vMax, 4), yFormat: (v) => v.toFixed(0),
      xLabel: 'Pressure (cmH₂O)',
      yLabel: 'Volume above resting (mL)',
    });
    panel.axisLine(colors, { x: 0, y: 0 });

    panel.clip();

    // The chest wall is still a straight line, because it still is one.
    const crs = respiratorySystemCompliance(p, r.lungVolume);
    const relax = (compliance, offset) => {
      const pts = [];
      for (let v = -50; v <= vMax; v += vMax / 24) pts.push(offset + v / compliance, v);
      return pts;
    };
    panel.line(relax(p.ccw, PPL_FRC), { color: colors.pleural, width: 1.5, dash: [4, 4], alpha: 0.75 });

    // The lung is not. Its relaxation line is the pressure–volume curve itself,
    // drawn by sweeping transpulmonary pressure and reading the volume off it —
    // the same function the integrator uses, so the curve on the plot and the
    // spring in the model cannot be different springs. In a recruitable lung it
    // has the lower inflection that a bedside manoeuvre draws; in a normal one it
    // is nearly straight, which is why this looked like a line for so long.
    const vRelax = relaxationVolume(p);
    // The lung's own pressure-volume relation, swept. With hysteresis on it has
    // two branches — the lung opens along one and empties along the other — and
    // the area between them is what a slow inflation to high pressure draws at
    // the bedside, lower inflection and all. Without it the two coincide and one
    // line is the whole story.
    const branches = p.hysteresis === 'on'
      ? [{ phi: 'up', dash: [2, 4] }, { phi: 'down', dash: [5, 3] }]
      : [{ phi: null, dash: [2, 4] }];
    const rsCurve = [];
    const drawn = [];
    for (const branch of branches) {
      const curve = [];
      let phi = branch.phi === 'down' ? openBand(p, 45).lo : null;
      for (let i = 0; i <= 60; i++) {
        const pl = branch.phi === 'down' ? 45 - (i * 47) / 60 : -2 + (i * 47) / 60;
        if (branch.phi) phi = stepOpenFraction(p, phi ?? openBand(p, pl).lo, pl);
        const vMlHere = (lungVolumeAtPl(p, pl, branch.phi ? phi : null) - vRelax) * 1000;
        if (vMlHere < -60 || vMlHere > vMax * 1.1) continue;
        curve.push(-pl, vMlHere); // back from the alveolus toward the pleural space
        if (branch === branches[0]) {
          rsCurve.push(pl + PPL_FRC + vMlHere / p.ccw, vMlHere);
        }
      }
      drawn.push({ curve, dash: branch.dash });
    }
    panel.line(rsCurve, { color: colors.airway, width: 1.5, dash: [4, 4], alpha: 0.75 });
    for (const d of drawn) {
      panel.line(d.curve, { color: colors.inkMuted, width: 1.5, dash: d.dash, alpha: 0.7 });
    }
    const lungCurve = drawn[0].curve;

    // The breath before this one, underneath and faded.
    panel.line(prev.ppl, { color: colors.pleural, width: 1.4, alpha: 0.22 });
    panel.line(prev.palv, { color: colors.flow, width: 1.3, alpha: 0.2 });
    panel.line(prev.paw, { color: colors.airway, width: 1.4, alpha: 0.22 });

    panel.line(pplLoop, { color: colors.pleural, width: 2 });
    // Alveolar pressure, between the other two. The airway loop is square in
    // volume control and that is arithmetic rather than a fault: expiration is
    // passive against a constant PEEP, so airway pressure does not move at all
    // while the volume falls, and the limb has to be vertical. Alveolar pressure
    // is the one that traces a loop, and the gap between the two curves is the
    // pressure spent on resistance — which is what a Campbell diagram is read
    // for.
    panel.line(palvLoop, { color: colors.flow, width: 1.8, alpha: 0.9 });
    panel.line(pawLoop, { color: colors.airway, width: 2 });

    panel.unclip();

    panel.label('Ppl', r.ppl, vMl, { color: colors.text.pleural, dx: -6, align: 'right', halo: colors.surface });
    panel.label('Paw', r.paw, vMl, { color: colors.text.airway, dx: 6, halo: colors.surface });
    if (Math.abs(r.paw - r.palv) > 0.4) {
      panel.label('Palv', r.palv, vMl, {
        color: colors.text.flow, dx: -6, align: 'right', halo: colors.surface,
      });
    }
    // The three relaxation lines converge near the top of the plot, so each
    // label is anchored at a different height on its own line.
    panel.label('Ccw', PPL_FRC + (vMax * 0.92) / p.ccw, vMax * 0.92, {
      color: colors.text.pleural, dx: -5, align: 'right', halo: colors.surface,
    });
    const labelOn = (curve, frac) => {
      const i = Math.min(curve.length - 2, Math.floor((curve.length / 2) * frac) * 2);
      return [curve[i], curve[i + 1]];
    };
    if (rsCurve.length >= 4) {
      const [lx, ly] = labelOn(rsCurve, 0.72);
      panel.label('Crs', lx, ly, { color: colors.text.airway, dx: 5, halo: colors.surface });
    }
    if (lungCurve.length >= 4) {
      const [lx, ly] = labelOn(lungCurve, 0.25);
      panel.label('Clung', lx, ly, { color: colors.inkMuted, dx: 5, halo: colors.surface });
    }

    panel.dot(r.ppl, vMl, { color: colors.text.pleural, r: 3.5, ring: colors.surface });
    panel.dot(r.paw, vMl, { color: colors.text.airway, r: 3.5, ring: colors.surface });

    panel.title('Campbell diagram', colors, 'chest wall vs respiratory system');
  }

  function clearTrail() {
    pplLoop.length = 0; pawLoop.length = 0; palvLoop.length = 0;
    prev.ppl.length = 0; prev.paw.length = 0; prev.palv.length = 0;
    breathSeen = -1; lastSample = -1;
  }

  return { render, clearTrail };
}
