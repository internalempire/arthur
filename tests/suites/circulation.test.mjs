// Guyton preload reserve, cyclic RV afterload and waveform variation mechanisms.
import {
  venousReturnCurve, cardiacFunctionCurve,
  preloadSensitivity, preloadLimbs, curveIntersection, PRELOAD_STEEP,
  pericardialPressure, ventricularActivation,
  defaultParams, section, check, settled,
} from '../support/model.mjs';

section('Ventricular activation');
{
  const peakFor = (hr) => {
    const period = 60 / hr;
    let peak = 0;
    let peakTime = 0;
    for (let i = 0; i <= 4000; i++) {
      const time = (period * i) / 4000;
      const activation = ventricularActivation(time, period);
      if (activation > peak) { peak = activation; peakTime = time; }
    }
    return { peak, peakTime, period };
  };

  const slow = peakFor(45);
  const reference = peakFor(75);
  const fast = peakFor(140);
  check('the selected end-systolic elastance is actually reached',
    [slow, reference, fast].every(({ peak }) => Math.abs(peak - 1) < 0.01),
    `peaks ${slow.peak.toFixed(3)}, ${reference.peak.toFixed(3)}, ${fast.peak.toFixed(3)}`);
  check('systolic duration does not remain a fixed fraction of the cardiac cycle',
    fast.peakTime / fast.period > reference.peakTime / reference.period
      && reference.peakTime / reference.period > slow.peakTime / slow.period,
    `peak phases ${(100 * slow.peakTime / slow.period).toFixed(0)}%, `
      + `${(100 * reference.peakTime / reference.period).toFixed(0)}%, `
      + `${(100 * fast.peakTime / fast.period).toFixed(0)}%`);
}

section('Shared pericardial constraint');
{
  const normal = defaultParams();
  const tight = { ...normal, pericardialCapacity: 220 };
  check('pressure is absent below the selected capacity',
    pericardialPressure(normal, normal.pericardialCapacity) === 0);
  check('loss of available space moves the same pressure-volume curve leftward',
    pericardialPressure(tight, 360) > pericardialPressure(normal, 360) + 1);
  const first = pericardialPressure(tight, 280);
  const second = pericardialPressure(tight, 340);
  check('pressure rises nonlinearly once aggregate chamber volume exceeds capacity',
    first > 0 && second > first * 2,
    `${first.toFixed(2)} then ${second.toFixed(2)} mmHg`);
  check('the gain can abolish the pericardial route without changing capacity',
    pericardialPressure({ ...tight, pericardium: 0 }, 500) === 0);
}

section('Guyton respiratory equilibrium');
{
  const s = settled({ mode: 'vcv', pmus: 0, vt: 450, peep: 5, rr: 14 }, 45);
  const beatPra = [];
  const respiratoryPra = [];
  const period = 60 / s.params.rr;
  for (let elapsed = 0; elapsed < period; elapsed += 0.05) {
    s.advance(0.05, true);
    beatPra.push(s.metrics.operatingPoint.pra);
    respiratoryPra.push(s.metrics.respiratoryOperatingPoint.pra);
  }

  const op = s.metrics.respiratoryOperatingPoint;
  const vr = venousReturnCurve(s.params, s.circ, op);
  const cf = cardiacFunctionCurve(s.params, s.circ, op);
  const analytic = curveIntersection(vr.points, cf.points);
  const span = (xs) => Math.max(...xs) - Math.min(...xs);

  check('the one-heartbeat point retains the passive respiratory excursion',
    span(beatPra) > 0.5, `${span(beatPra).toFixed(2)} mmHg`);
  check('the one-breath point removes respiratory phase from the equilibrium comparison',
    span(respiratoryPra) < 0.08, `${span(respiratoryPra).toFixed(3)} mmHg`);
  check('the local RV curve is anchored to respiratory-mean chamber mechanics',
    cf.anchored === true);
  check('a settled healthy passive circulation converges on the analytic crossing',
    analytic
      && Math.abs(op.pra - analytic.x) < 0.15
      && Math.abs(op.flow - analytic.y) < 0.12,
    analytic
      ? `pressure gap ${Math.abs(op.pra - analytic.x).toFixed(3)} mmHg, `
        + `flow gap ${Math.abs(op.flow - analytic.y).toFixed(3)} L/min`
      : 'no curve crossing');
}

section('Preload reserve on the Guyton construction');
{
  const vcv = { mode: 'vcv', pmus: 0, vt: 450, peep: 5, rr: 14 };
  const at = (over) => {
    const s = settled({ ...vcv, ...over }, 45);
    return { sim: s, r: preloadSensitivity(s.params, s.circ, s.metrics.respiratoryOperatingPoint) };
  };

  const dry = at({ stressedVolume: 300 });
  const wet = at({ stressedVolume: 1800 });
  check('a dry patient sits on the steep limb', dry.r.steep,
    `${(dry.r.relative * 100).toFixed(1)}%/mmHg`);
  check('a full one sits on the plateau', !wet.r.steep,
    `${(wet.r.relative * 100).toFixed(1)}%/mmHg`);
  check('and the reserve falls monotonically with filling',
    (() => {
      const xs = [300, 500, 700, 900, 1100, 1400, 1800].map((v) => at({ stressedVolume: v }).r.relative);
      return xs.every((v, i) => i === 0 || v < xs[i - 1]);
    })());

  // The claim that justifies the threshold: it agrees with what the model
  // actually does when the volume is added, across the whole control space and
  // not only along the one axis it was read off.
  {
    let seed = 987;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let agree = 0, total = 0;
    for (let i = 0; i < 60; i++) {
      const o = {
        stressedVolume: 250 + rnd() * 1300, svr: 0.4 + rnd() * 1.8, hr: 55 + rnd() * 90,
        eesRv: 0.15 + rnd() * 0.8, csv: 50 + rnd() * 120, peep: rnd() * 16,
        rvr: 0.03 + rnd() * 0.12, pab0: rnd() * 18,
      };
      const here = at(o);
      if (!here.r || !Number.isFinite(here.r.relative)) continue;
      const after = settled({ ...vcv, ...o, stressedVolume: Math.min(1800, o.stressedVolume + 500) }, 45);
      const gain = after.metrics.co / here.sim.metrics.co - 1;
      total++;
      if ((here.r.relative >= PRELOAD_STEEP) === (gain >= 0.15)) agree++;
    }
    // Once pulmonary transit volume redistributes with flow, a 500 mL step is
    // no longer only a translation of the systemic venous-return curve: some
    // blood also changes the pulmonary vascular reservoir. The local slope
    // remains a useful directional classifier, not an exact bolus predictor;
    // require broad concordance without promoting its didactic 8%/mmHg split
    // into a diagnostic cutoff.
    check('the threshold broadly agrees with the model\'s own response to 500 mL',
      total > 50 && agree / total >= 0.80,
      `${agree} of ${total} configurations (${((100 * agree) / total).toFixed(0)}%)`);
  }

  // The drawn split and the reported number are the same construction, so the
  // marker has to fall on the side the tile claims it does.
  {
    const agrees = (which) => {
      const s = which.sim;
      const op = s.metrics.respiratoryOperatingPoint;
      const { steep, plateau } = preloadLimbs(s.params, s.circ, op);
      const here = curveIntersection(
        venousReturnCurve(s.params, s.circ, op).points,
        cardiacFunctionCurve(s.params, s.circ, op).points);
      const within = (pts) => {
        for (let i = 2; i < pts.length; i += 2) {
          if (pts[i - 2] - 0.2 <= here.x && here.x <= pts[i] + 0.2) return true;
        }
        return false;
      };
      return which.r.steep ? within(steep) : within(plateau) || !within(steep);
    };
    check('the drawn steep limb agrees with the reported reserve, dry', agrees(dry));
    check('and agrees with it when full', agrees(wet));
    check('both limbs together are non-empty',
      (() => { const l = preloadLimbs(dry.sim.params, dry.sim.circ, dry.sim.metrics.respiratoryOperatingPoint);
        return l.steep.length + l.plateau.length >= 40; })());
  }

  // It is available exactly where the dynamic indices are not, which is the
  // reason for having it.
  const spont = settled({ mode: 'spont', pmus: 10, peep: 0, stressedVolume: 320 }, 45);
  check('the reserve survives spontaneous breathing, where variation is withheld',
    spont.metrics.interpretability.preload.level === 'ok'
      && spont.metrics.interpretability.ppv.level === 'unavailable',
    `reserve ${(spont.metrics.preload.relative * 100).toFixed(1)}%/mmHg`);
  const smallVt = settled({ ...vcv, vt: 350, stressedVolume: 320 }, 45);
  check('and a tidal volume too small to read variation from',
    smallVt.metrics.interpretability.preload.level === 'ok'
      && smallVt.metrics.interpretability.ppv.reasons.length > 0);
}

section('Cyclic right ventricular afterload');
{
  // The stiffer the lung, the more airway pressure swings the pulmonary vessels
  // within a breath. The model retains this mechanism and exposes its magnitude,
  // but does not turn it into a PPV diagnostic cutoff: the former cutoff was
  // calibrated against a retired fluid-response regression.
  const at = (clung) => settled({ mode: 'vcv', pmus: 0, vt: 560, clung,
    peep: 7, rr: 15, ti: 1.2, stressedVolume: 450 }, 45).metrics;
  const soft = at(200), stiff = at(30);

  // The model does not represent all ARDS determinants of RV afterload, so this
  // is intentionally directional. A multi-fold threshold promoted this lumped
  // J-curve into a quantitative ARDS claim it cannot support.
  check('a stiff lung swings right ventricular afterload within the breath',
    stiff.pvrSwing > soft.pvrSwing * 1.05,
    `${(soft.pvrSwing * 100).toFixed(0)}% at a compliance of 200 vs `
    + `${(stiff.pvrSwing * 100).toFixed(0)}% at 30`);
  check('and the pleural swing is identical in both, so this is not venous return',
    Math.abs(at(200).pplSwing - at(30).pplSwing) < 0.05,
    `${soft.pplSwing.toFixed(2)} vs ${stiff.pplSwing.toFixed(2)} cmH₂O`);
  check('right ventricular dilatation alone would miss that mechanism',
    stiff.rvLvRatio < 1.2, `RV:LV ${stiff.rvLvRatio.toFixed(2)}`);
}

section('Variation is non-monotone across the filling range');
{
  // Averaged over a minute: variation is computed from the beats in one
  // respiratory cycle, so at four or five beats per breath a single reading
  // moves by more than a point depending on which beats land where.
  const meanPpv = (over, seconds = 60) => {
    const s = settled({ mode: 'vcv', pmus: 0, vt: 560, peep: 5, rr: 14, ...over }, 45);
    let sum = 0, n = 0;
    for (let i = 0; i < seconds / 0.05; i++) { s.advance(0.05, true); sum += s.variation().ppv; n++; }
    return sum / n;
  };

  const dry = meanPpv({ stressedVolume: 300 });
  const intermediate = meanPpv({ stressedVolume: 700 });
  const drySim = settled({ mode: 'vcv', pmus: 0, vt: 560, peep: 5, rr: 14, stressedVolume: 300 }, 45);
  check('severe underfilling can show low PPV despite marked preload reserve',
    dry < intermediate - 1 && drySim.metrics.preload.steep,
    `${dry.toFixed(1)}% PPV with ${(drySim.metrics.preload.relative * 100).toFixed(1)}%/mmHg reserve`);

  const trough = meanPpv({ stressedVolume: 900 });
  const filled = meanPpv({ stressedVolume: 1400 });
  check('variation rises again once the patient is full',
    filled > trough + 0.5, `${trough.toFixed(1)}% at 900 mL vs ${filled.toFixed(1)}% at 1400 mL`);

  // And it is the lung doing it, not the pericardium or the septum.
  const noPiston = meanPpv({ stressedVolume: 1400, piston: 0 });
  check('and it is the lung squeezing blood forward that does it',
    noPiston < filled - 1.5, `${filled.toFixed(1)}% falls to ${noPiston.toFixed(1)}% with the piston off`);
  check('the pericardium is not responsible',
    Math.abs(meanPpv({ stressedVolume: 1400, pericardium: 0 }) - filled) < 0.6);

  // The payoff of having both: the reserve reads the curve rather than the
  // waveform, so it is not fooled by the mechanism that produces this variation.
  {
    const filledSim = settled({ mode: 'vcv', pmus: 0, vt: 560, peep: 5, rr: 14, stressedVolume: 1400 }, 45);
    check('the preload reserve is not fooled by the lung-driven variation',
      !filledSim.metrics.preload.steep,
      `variation ${filledSim.metrics.ppv.toFixed(1)}% but reserve `
      + `${(filledSim.metrics.preload.relative * 100).toFixed(1)}%/mmHg`);
  }

  // The mechanism needs open capillaries, which is why it only shows up here.
  check('it appears only where zone III is everywhere',
    settled({ mode: 'vcv', pmus: 0, vt: 560, peep: 5, rr: 14, stressedVolume: 1400 }, 45).metrics.zone3 > 0.9
      && settled({ mode: 'vcv', pmus: 0, vt: 560, peep: 5, rr: 14, stressedVolume: 500 }, 45).metrics.zone3 < 0.3);
}
