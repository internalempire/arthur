// Test suite. No dependencies, no framework:
//
//   node tests/run.mjs
//
// It checks the things a physiological model can actually be held to — volume
// conservation, compartment positivity, convergence under time-step refinement,
// the direction of well-established relationships, and agreement between the
// integrator and the curves drawn from it — plus deterministic snapshots so
// that a change in behaviour has to be acknowledged rather than discovered.

import { Simulator, DEFAULT_DT } from '../src/model/simulator.js';
import { SCENARIOS } from '../src/model/scenarios.js';
import { PARAMETERS, defaultParams } from '../src/model/parameters.js';
import {
  venousReturnCurve, cardiacFunctionCurve, venousReturnFlow,
  preloadSensitivity, preloadLimbs, curveIntersection, PRELOAD_STEEP,
} from '../src/model/circulation.js';
import {
  pvrComponents, lungRegions, transpulmonaryAt, relaxationVolume, openFractionAt,
  lungVolumeAtPl, lungComplianceAt, openBand, stepOpenFraction, PVR_NADIR_VOLUME,
} from '../src/model/lung.js';
import { readFileSync } from 'node:fs';
import { SNAPSHOTS } from './snapshots.js';
import { LITERATURE } from './literature.mjs';

// ---------------------------------------------------------------- harness ---

let passed = 0;
const failures = [];
let group = '';

const describe = (name) => { group = name; console.log(`\n${name}`); };

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  pass  ${name}`);
  } else {
    failures.push(`${group} / ${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const near = (a, b, tol) => Math.abs(a - b) <= tol;

function settled(overrides = {}, seconds = 30, opts = {}) {
  const s = new Simulator(opts);
  s.params = { ...defaultParams(), ...overrides };
  s.reset();
  s.advance(seconds, true);
  return s;
}

const COMPARTMENTS = ['vSa', 'vSv', 'vRa', 'vRv', 'vPa', 'vPv', 'vLa', 'vLv'];
const totalVolume = (c) => COMPARTMENTS.reduce((t, k) => t + c[k], 0);

// ------------------------------------------------------- volume conservation -

describe('Volume conservation');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  const before = totalVolume(s.circ);
  s.advance(40, true);
  const after = totalVolume(s.circ);
  check(sc.id, near(before, after, 0.01), `${before.toFixed(4)} -> ${after.toFixed(4)} mL`);
}

// ------------------------------------------------------------- positivity ----

describe('Compartment positivity across the scenarios');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  s.advance(40, true);
  const min = Math.min(...COMPARTMENTS.map((k) => s.circ[k]));
  check(sc.id, min > 0, `smallest compartment ${min.toFixed(2)} mL`);
}

// A deterministic sweep of the whole control space. The generator is a fixed
// linear congruential sequence, so a failure here is reproducible.
describe('Compartment positivity across a control-space sweep');
{
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let worstVolume = Infinity;
  let nonFinite = 0;
  let efOutOfRange = 0;
  let flagged = 0;
  const trials = 250;

  for (let i = 0; i < trials; i++) {
    const p = defaultParams();
    for (const spec of PARAMETERS) {
      p[spec.id] = spec.type === 'choice'
        ? spec.options[Math.floor(rnd() * spec.options.length)].value
        : spec.min + rnd() * (spec.max - spec.min);
    }
    const s = new Simulator();
    s.params = p;
    s.reset();
    s.advance(20, true);
    worstVolume = Math.min(worstVolume, Math.min(...COMPARTMENTS.map((k) => s.circ[k])));
    const m = s.metrics;
    for (const [, v] of Object.entries(m)) {
      if (typeof v === 'number' && !Number.isFinite(v)) nonFinite++;
    }
    if (!(m.lvEf >= 0 && m.lvEf <= 100)) efOutOfRange++;
    if (!m.valid) flagged++;
  }
  check(`${trials} configurations keep every compartment positive`, worstVolume > 0,
    `smallest volume ${worstVolume.toFixed(2)} mL`);
  check('no non-finite metric anywhere in the sweep', nonFinite === 0, `${nonFinite} found`);
  check('ejection fraction always within 0–100%', efOutOfRange === 0, `${efOutOfRange} outside`);
  check('states outside the model\'s range report themselves', flagged > 0,
    `${flagged} of ${trials} self-reported as not interpretable`);
}

// ------------------------------------------------------------- convergence ---

describe('Convergence under time-step refinement');
{
  // Measured on continuous quantities. Cardiac output is deliberately not used:
  // it is latched at a beat boundary, so which sample lands on the boundary
  // shifts with the step, and that is a sampling artefact rather than a
  // convergence failure.
  const runs = [0.0005, DEFAULT_DT, 0.000125].map((dt) => settled({}, 25, { dt }));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  check('mean arterial pressure converges',
    rel(runs[0].metrics.map, runs[2].metrics.map) < 0.005,
    `${runs.map((r) => r.metrics.map.toFixed(3)).join(' -> ')} mmHg`);
  check('mean venous return converges',
    rel(runs[0].ema.flow, runs[2].ema.flow) < 0.01,
    `${runs.map((r) => r.ema.flow.toFixed(3)).join(' -> ')} L/min`);
  check('volume is conserved at every step size',
    runs.every((r) => near(totalVolume(r.circ), 5080, 0.01)),
    runs.map((r) => totalVolume(r.circ).toFixed(3)).join(' / '));
}

// -------------------------------------------------------------- determinism --

describe('Determinism');
{
  const a = settled({ peep: 9, hr: 88 }, 20);
  const b = settled({ peep: 9, hr: 88 }, 20);
  check('identical parameters give identical results',
    a.metrics.co === b.metrics.co && a.metrics.map === b.metrics.map,
    `${a.metrics.co} vs ${b.metrics.co}`);
}

// -------------------------------------------------- physiological relations --

describe('Physiological relations');
{
  const peep0 = settled({ peep: 0 });
  const peep16 = settled({ peep: 16 });
  check('PEEP raises central venous pressure',
    peep16.metrics.cvp > peep0.metrics.cvp,
    `${peep0.metrics.cvp.toFixed(1)} -> ${peep16.metrics.cvp.toFixed(1)} mmHg`);
  check('PEEP lowers cardiac output',
    peep16.metrics.co < peep0.metrics.co,
    `${peep0.metrics.co.toFixed(2)} -> ${peep16.metrics.co.toFixed(2)} L/min`);
  check('PEEP raises mean systemic filling pressure',
    peep16.metrics.pmsf > peep0.metrics.pmsf,
    `${peep0.metrics.pmsf.toFixed(1)} -> ${peep16.metrics.pmsf.toFixed(1)} mmHg`);

  const passive = settled({ mode: 'vcv', pmus: 0, peep: 0 });
  const spont = settled({ mode: 'spont', pmus: 8, peep: 0 });
  check('spontaneous breathing lowers measured central venous pressure',
    spont.metrics.cvp < passive.metrics.cvp,
    `${passive.metrics.cvp.toFixed(1)} -> ${spont.metrics.cvp.toFixed(1)} mmHg`);
  check('spontaneous breathing raises cardiac output',
    spont.metrics.co > passive.metrics.co,
    `${passive.metrics.co.toFixed(2)} -> ${spont.metrics.co.toFixed(2)} L/min`);
  check('transmural filling pressure exceeds the measured one when breathing in',
    spont.metrics.cvpTransmural > spont.metrics.cvp,
    `${spont.metrics.cvp.toFixed(1)} vs ${spont.metrics.cvpTransmural.toFixed(1)} mmHg`);

  const dry = settled({ stressedVolume: 330, vt: 560, ccw: 150, svr: 0.85, hr: 105 });
  const wet = settled({ stressedVolume: 830, vt: 560, ccw: 150, svr: 0.85, hr: 105 });
  check('hypovolaemia raises pulse pressure variation',
    dry.metrics.ppv > wet.metrics.ppv + 5,
    `${dry.metrics.ppv.toFixed(0)}% vs ${wet.metrics.ppv.toFixed(0)}%`);
  check('a fluid bolus raises cardiac output more when the patient is dry',
    wet.metrics.co - dry.metrics.co > 1.0,
    `${dry.metrics.co.toFixed(2)} -> ${wet.metrics.co.toFixed(2)} L/min`);

  const roomy = settled({ raw: 5, rr: 12, ti: 1.2 });
  const trapped = settled({ raw: 24, rr: 26, ti: 0.9, clung: 300 });
  check('a short expiratory time generates intrinsic PEEP',
    trapped.metrics.autoPeep > 2 && roomy.metrics.autoPeep < 0.5,
    `${roomy.metrics.autoPeep.toFixed(2)} vs ${trapped.metrics.autoPeep.toFixed(2)} cmH2O`);

  const softChest = settled({ ccw: 250, vt: 500 });
  const stiffChest = settled({ ccw: 70, vt: 500 });
  check('a stiff chest wall raises the pleural swing for the same tidal volume',
    stiffChest.metrics.pplSwing > softChest.metrics.pplSwing * 2,
    `${softChest.metrics.pplSwing.toFixed(1)} vs ${stiffChest.metrics.pplSwing.toFixed(1)} cmH2O`);

  const rvFail = settled({ eesRv: 0.22, pvrBase: 0.30 });
  check('right ventricular failure dilates the RV relative to the LV',
    rvFail.metrics.rvLvRatio > 1.4,
    `RV:LV ${rvFail.metrics.rvLvRatio.toFixed(2)}`);

  // Isolating one mechanism means holding the compensation still. With the
  // reflex running, it partly makes up for what the septum costs, and the
  // remaining difference is smaller than the respiratory swing.
  const septum = settled({ eesRv: 0.22, pvrBase: 0.30, baroreflex: 0 }, 45);
  const noSeptum = settled({ eesRv: 0.22, pvrBase: 0.30, baroreflex: 0, septal: 0 }, 45);
  check('removing septal coupling lets the left ventricle fill',
    noSeptum.metrics.lvEdv > septum.metrics.lvEdv,
    `${septum.metrics.lvEdv.toFixed(1)} -> ${noSeptum.metrics.lvEdv.toFixed(1)} mL`);
}

describe('Baroreflex');
{
  // The septic preset's settings, because pulse pressure variation needs an
  // adequate tidal volume and a chest wall that transmits it before it means
  // anything — which is what the interpretability rules already say.
  const septic = { stressedVolume: 330, svr: 0.85, vt: 560, ccw: 150, hr: 105, peep: 8, rr: 18 };
  const off = settled({ ...septic, baroreflex: 0 }, 45);
  const on = settled({ ...septic, baroreflex: 1 }, 45);
  check('the reflex defends arterial pressure', on.metrics.map > off.metrics.map + 8,
    `${off.metrics.map.toFixed(0)} -> ${on.metrics.map.toFixed(0)} mmHg`);
  check('it does so by raising heart rate', on.metrics.effectiveHr > off.metrics.effectiveHr + 5,
    `${off.metrics.effectiveHr.toFixed(0)} -> ${on.metrics.effectiveHr.toFixed(0)} /min`);
  check('and by raising systemic resistance', on.metrics.effectiveSvr > off.metrics.effectiveSvr,
    `${off.metrics.effectiveSvr.toFixed(2)} -> ${on.metrics.effectiveSvr.toFixed(2)} mmHg·s/mL`);
  check('a defended pressure does not hide preload dependence',
    on.metrics.ppv > 12 && off.metrics.ppv > 12,
    `PPV ${off.metrics.ppv.toFixed(0)}% off, ${on.metrics.ppv.toFixed(0)}% on`);

  // Above the set point the reflex withdraws, but only weakly.
  const high = settled({ svr: 1.6, baroreflex: 1 }, 45);
  check('above the set point the reflex withdraws rather than reversing',
    high.metrics.baroOutflow < 0 && high.metrics.baroOutflow > -0.3,
    `outflow ${high.metrics.baroOutflow.toFixed(3)} at MAP ${high.metrics.map.toFixed(0)}`);

  check('zero gain restores the uncompensated model',
    settled({ baroreflex: 0 }, 45).metrics.baroOutflow === 0);

  // The loop must not oscillate.
  const s = new Simulator();
  s.params = { ...defaultParams(), stressedVolume: 260, svr: 0.5, baroreflex: 2 };
  s.reset();
  s.advance(40, true);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 40; i++) { s.advance(1, true); lo = Math.min(lo, s.metrics.co); hi = Math.max(hi, s.metrics.co); }
  check('a high gain against a low pressure does not oscillate', hi - lo < 1.0 && Number.isFinite(s.metrics.co),
    `cardiac output swings ${(hi - lo).toFixed(2)} L/min over 40 s`);
}

describe('Occlusion manoeuvres');
{
  const s = new Simulator();
  s.advance(25, true);
  const restingFlow = s.ema.flow;

  check('a hold cannot be armed twice', s.startHold('inspiratory', 8) && !s.startHold('expiratory', 8));
  s.advance(20, true);
  check('the hold releases and leaves one measured point', s.measuredPoints.length === 1,
    `${s.measuredPoints.length} points`);

  const held = s.measuredPoints[0];
  check('an inspiratory hold raises right atrial pressure above resting',
    held.pra > s.metrics.operatingPoint.pra - 0.5,
    `held ${held.pra.toFixed(2)} mmHg`);
  check('an inspiratory hold lowers flow below resting',
    held.flow < restingFlow,
    `${restingFlow.toFixed(2)} -> ${held.flow.toFixed(2)} L/min`);

  // Airway flow really is zero throughout, and the airway reads alveolar
  // pressure, which is the whole point of an occlusion.
  const u = new Simulator();
  u.advance(20, true);
  u.startHold('inspiratory', 8);
  let maxFlow = 0;
  let airwayMatchesAlveolar = true;
  for (let i = 0; i < 400; i++) {
    u.advance(0.02, true);
    if (u.resp.hold) {
      maxFlow = Math.max(maxFlow, Math.abs(u.resp.flow));
      if (Math.abs(u.resp.paw - u.resp.palv) > 1e-9) airwayMatchesAlveolar = false;
    }
  }
  check('no gas moves during a hold', maxFlow === 0, `peak |flow| ${maxFlow}`);
  check('the airway reads alveolar pressure during a hold', airwayMatchesAlveolar);

  // Several holds at rising airway pressures must trace a falling line.
  const t = new Simulator();
  t.advance(20, true);
  for (const vt of [300, 500, 700, 900]) {
    t.setParam('vt', vt);
    t.advance(10, true);
    t.startHold('inspiratory', 10);
    t.advance(16, true);
  }
  const pts = t.measuredPoints;
  check('four holds give four points', pts.length === 4, `${pts.length}`);
  const rising = pts.every((p, i) => i === 0 || p.pra > pts[i - 1].pra);
  const falling = pts.every((p, i) => i === 0 || p.flow < pts[i - 1].flow);
  check('rising airway pressure gives rising Pra and falling flow', rising && falling,
    pts.map((p) => `${p.pra.toFixed(1)}/${p.flow.toFixed(2)}`).join('  '));
}

describe('The two-compartment lung');
{
  const p = defaultParams();
  check('a normal lung at its resting volume is fully open and unstrained',
    lungRegions(p, 2.2).openFraction > 0.97 && Math.abs(lungRegions(p, 2.2).strain) < 0.03,
    `open ${lungRegions(p, 2.2).openFraction.toFixed(3)}, strain ${lungRegions(p, 2.2).strain.toFixed(3)}`);

  // The arithmetic of the baby lung. The claim is about the strain a tidal
  // volume *adds*, not the level it reaches: the two lungs start from different
  // resting strains, because stiff tissue holds less gas at the same pressure,
  // and comparing the levels measures that instead.
  const ards = { ...p, collapsed: 0.42, clung: 40, recruitable: 0 };
  const gained = (q) => {
    const rest = relaxationVolume(q);
    return lungRegions(q, rest + 0.4).strain - lungRegions(q, rest).strain;
  };
  check('the same tidal volume adds more strain to a collapsed lung',
    gained(ards) > gained(p) * 1.5,
    `${gained(p).toFixed(3)} whole vs ${gained(ards).toFixed(3)} collapsed, `
    + `on ${openFractionAt(p, 5).toFixed(2)} vs ${openFractionAt(ards, 5).toFixed(2)} of the lung`);
  // Close to the reciprocal of the open fraction, not equal to it: the open
  // fraction itself moves a little over those 400 mL, so the ratio is an average
  // over the interval rather than the value at its start.
  check('and the ratio tracks the reciprocal of the open fraction',
    near(gained(ards) / gained(p), openFractionAt(p, 5) / openFractionAt(ards, 5), 0.15),
    `${(gained(ards) / gained(p)).toFixed(2)} against `
    + `${(openFractionAt(p, 5) / openFractionAt(ards, 5)).toFixed(2)} at the resting point`);

  // The mechanism the single-compartment model could not express.
  const closed = lungRegions({ ...ards, recruitable: 0 }, 1.8);
  const opens = lungRegions({ ...ards, recruitable: 0.8, pOpen: 12 }, 1.8);
  check('recruitment lowers strain per unit at an unchanged lung volume',
    opens.openFraction > closed.openFraction && opens.strain < closed.strain,
    `open ${closed.openFraction.toFixed(2)} -> ${opens.openFraction.toFixed(2)}, `
    + `strain ${closed.strain.toFixed(2)} -> ${opens.strain.toFixed(2)}`);

  check('recruitability does nothing to a lung that is not collapsed',
    lungRegions({ ...p, recruitable: 0 }, 2.2).openFraction
      === lungRegions({ ...p, recruitable: 1 }, 2.2).openFraction);

  // Transpulmonary pressure has to be the same number the mechanics produce,
  // otherwise the curve is drawn from one model and the patient lives in another.
  {
    const s = settled({ peep: 12, clung: 120 }, 20);
    const drawn = transpulmonaryAt(s.params, s.resp.lungVolume);
    check('the drawn transpulmonary pressure matches the integrator',
      near(drawn, s.resp.pl, 0.01), `${s.resp.pl.toFixed(3)} vs ${drawn.toFixed(3)} cmH₂O`);
  }

  // A reading of resistance is a reading at a phase of the breath, because it
  // follows lung volume. In a patient with a large tidal excursion that is worth
  // a third of the value, and quoting a sample as if it were the patient's
  // number is a mistake this pins down.
  {
    const s = settled({ ...SCENARIOS.find((x) => x.id === 'copd').params }, 45);
    let lo = Infinity, hi = -Infinity, sum = 0, n = 0;
    for (let i = 0; i < (60 / s.params.rr) / 0.01; i++) {
      s.advance(0.01, true);
      const v = s.metrics.pvrCoefficientWood;
      lo = Math.min(lo, v); hi = Math.max(hi, v); sum += v; n++;
    }
    // The mean moved when the tissue gained a ceiling — a hyperinflated lung is
    // further up a curve that now bends — but the point of this check is the
    // *swing*, which is what makes a single reading a reading at a phase.
    check('resistance swings within a breath when the tidal excursion is large',
      hi - lo > 0.8 && near(sum / n, 2.97, 0.3),
      `mean ${(sum / n).toFixed(2)}, range ${lo.toFixed(2)}–${hi.toFixed(2)} Wood units`);
  }

  // Hyperinflation must cost something, and it must not need to be asked for.
  // A lung that has lost its elastic recoil rests high by itself, which is the
  // reason resting volume stopped being a parameter.
  const emphysema = { ...p, clung: 300 };
  check('a lung with lost recoil rests hyperinflated without being told to',
    relaxationVolume(emphysema) > 2.6,
    `${relaxationVolume(emphysema).toFixed(2)} L against ${relaxationVolume(p).toFixed(2)} normal`);
  check('and it therefore sits on the right limb of the curve',
    pvrComponents(emphysema, relaxationVolume(emphysema)).total
      > pvrComponents(p, relaxationVolume(p)).total * 1.2,
    `${(pvrComponents(emphysema, relaxationVolume(emphysema)).total
        / pvrComponents(p, relaxationVolume(p)).total).toFixed(2)}× the normal nadir`);

  // The claim the ARDS preset is built around, and the one that has drifted out
  // of the documentation twice. Asserted by direction rather than by value so it
  // survives retuning but still catches a sign flip.
  {
    const preset = SCENARIOS.find((x) => x.id === 'ards-rv').params;
    const at = (peep, over) => settled({ ...preset, peep, ...over }, 45).metrics;

    // Measured from PEEP 4 rather than 0, because below that even a consolidated
    // lung is reopening its *normal* units — those close at very low volume and
    // need almost no pressure back. That gives it a shallow optimum of its own
    // around PEEP 8, which is real and worth not asserting away.
    const consLow = at(4, { recruitable: 0 }), consHigh = at(20, { recruitable: 0 });
    const recrLow = at(4, {}), recrHigh = at(20, {});
    check('PEEP lowers resistance in the recruitable ARDS lung',
      recrHigh.pvrCoefficientWood < recrLow.pvrCoefficientWood,
      `${recrLow.pvrCoefficientWood.toFixed(1)} -> ${recrHigh.pvrCoefficientWood.toFixed(1)} Wood units`);
    check('and raises it in the same lung consolidated',
      consHigh.pvrCoefficientWood > consLow.pvrCoefficientWood,
      `${consLow.pvrCoefficientWood.toFixed(1)} -> ${consHigh.pvrCoefficientWood.toFixed(1)} Wood units`);
    check('so PEEP costs the consolidated lung more output',
      consLow.co - consHigh.co > recrLow.co - recrHigh.co,
      `${(recrLow.co - recrHigh.co).toFixed(2)} vs ${(consLow.co - consHigh.co).toFixed(2)} L/min lost`);

    // Even with nothing recruitable there is a best PEEP, and it is not zero.
    const sweep = [0, 4, 8, 12, 16, 20].map((peep) => at(peep, { recruitable: 0 }).pvrCoefficientWood);
    const best = sweep.indexOf(Math.min(...sweep));
    check('a consolidated lung still has a resistance optimum, and it is not at zero PEEP',
      best > 0 && best < sweep.length - 1,
      sweep.map((v, i) => `${[0, 4, 8, 12, 16, 20][i]}:${v.toFixed(2)}`).join('  '));
  }

  check('open fraction is bounded and monotone in volume',
    (() => {
      let prev = -1;
      for (let v = 0.8; v <= 4.4; v += 0.05) {
        const f = lungRegions(ards, v).openFraction;
        if (!(f >= 0.05 && f <= 1) || f < prev - 1e-9) return false;
        prev = f;
      }
      return true;
    })());
}

describe('Preload reserve on the Guyton construction');
{
  const vcv = { mode: 'vcv', pmus: 0, vt: 450, peep: 5, rr: 14 };
  const at = (over) => {
    const s = settled({ ...vcv, ...over }, 45);
    return { sim: s, r: preloadSensitivity(s.params, s.circ, s.metrics.operatingPoint) };
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
    check('the threshold agrees with the model\'s own response to 500 mL',
      total > 50 && agree / total > 0.85,
      `${agree} of ${total} configurations (${((100 * agree) / total).toFixed(0)}%)`);
  }

  // The drawn split and the reported number are the same construction, so the
  // marker has to fall on the side the tile claims it does.
  {
    const agrees = (which) => {
      const s = which.sim;
      const op = s.metrics.operatingPoint;
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
      (() => { const l = preloadLimbs(dry.sim.params, dry.sim.circ, dry.sim.metrics.operatingPoint);
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

describe('Variation at the filled end of the range');
{
  // Averaged over a minute: variation is computed from the beats in one
  // respiratory cycle, so at four or five beats per breath a single reading
  // moves by more than a point depending on which beats land where.
  const meanPpv = (over, seconds = 60) => {
    const s = settled({ mode: 'vcv', pmus: 0, vt: 420, peep: 8, rr: 18, ccw: 150, ...over }, 45);
    let sum = 0, n = 0;
    for (let i = 0; i < seconds / 0.05; i++) { s.advance(0.05, true); sum += s.variation().ppv; n++; }
    return sum / n;
  };

  const trough = meanPpv({ stressedVolume: 900 });
  const filled = meanPpv({ stressedVolume: 1400 });
  check('variation rises again once the patient is full',
    filled > trough + 1, `${trough.toFixed(1)}% at 900 mL vs ${filled.toFixed(1)}% at 1400 mL`);

  // And it is the lung doing it, not the pericardium or the septum.
  const noPiston = meanPpv({ stressedVolume: 1400, piston: 0 });
  check('and it is the lung squeezing blood forward that does it',
    noPiston < filled - 1.5, `${filled.toFixed(1)}% falls to ${noPiston.toFixed(1)}% with the piston off`);
  check('the pericardium is not responsible',
    Math.abs(meanPpv({ stressedVolume: 1400, pericardium: 0 }) - filled) < 0.6);

  // The payoff of having both: the reserve reads the curve rather than the
  // waveform, so it is not fooled by the mechanism that produces this variation.
  {
    const filledSim = settled({ mode: 'vcv', pmus: 0, vt: 420, peep: 8, rr: 18, ccw: 150, stressedVolume: 1400 }, 45);
    check('the preload reserve is not fooled by the lung-driven variation',
      !filledSim.metrics.preload.steep,
      `variation ${filledSim.metrics.ppv.toFixed(1)}% but reserve `
      + `${(filledSim.metrics.preload.relative * 100).toFixed(1)}%/mmHg`);
  }

  // The mechanism needs open capillaries, which is why it only shows up here.
  check('it appears only where zone III is everywhere',
    settled({ mode: 'vcv', pmus: 0, vt: 420, peep: 8, rr: 18, ccw: 150, stressedVolume: 1400 }, 45).metrics.zone3 > 0.9
      && settled({ mode: 'vcv', pmus: 0, vt: 420, peep: 8, rr: 18, ccw: 150, stressedVolume: 500 }, 45).metrics.zone3 < 0.3);
}

describe('The tidal volume challenge');
{
  const protective = { mode: 'vcv', pmus: 0, vt: 420, peep: 8, rr: 18, ccw: 150 };
  const challenge = (over) => {
    const s = settled({ ...protective, ...over }, 45);
    const blockers = s.startTidalChallenge();
    if (blockers.length) return { blockers };
    s.advance(63, true);
    return { result: s.challengeResult, sim: s };
  };

  const dry = challenge({ stressedVolume: 300 });
  const wet = challenge({ stressedVolume: 1100 });
  check('the manoeuvre completes and reports both windows',
    dry.result && dry.result.ppvBefore > 0 && dry.result.ppvAfter > 0,
    `${dry.result?.ppvBefore.toFixed(1)}% -> ${dry.result?.ppvAfter.toFixed(1)}%`);
  check('raising the tidal volume raises variation',
    dry.result.ppvAfter > dry.result.ppvBefore,
    `${dry.result.ppvBefore.toFixed(1)} -> ${dry.result.ppvAfter.toFixed(1)}%`);
  check('and it raises it more in the preload-dependent patient',
    dry.result.dPpv > wet.result.dPpv + 1,
    `ΔPPV ${dry.result.dPpv.toFixed(1)} dry vs ${wet.result.dPpv.toFixed(1)} wet`);

  // The manoeuvre must put the ventilator back.
  check('the tidal volume is restored afterwards',
    Math.abs(dry.sim.effective.vt - 420) < 1e-9,
    `${dry.sim.effective.vt.toFixed(0)} mL`);
  check('and the slider was never touched', dry.sim.params.vt === 420);

  // Conditions on the manoeuvre, not on the reading.
  check('a spontaneously breathing patient cannot be challenged',
    settled({ mode: 'spont', pmus: 8 }, 20).startTidalChallenge().length > 0);
  check('nor can one already at 8 mL/kg',
    settled({ ...protective, vt: 560 }, 20).startTidalChallenge().length > 0);
  check('a passive patient in volume control can',
    settled(protective, 20).startTidalChallenge().length === 0);

  // The verdict is withheld rather than reported false — the model's delta does
  // not span the published threshold, and saying "not dependent" for a patient
  // who gains 40% from a bolus would be a false negative dressed as a result.
  // The manoeuvre exists to answer the tidal volume objection, so once it has,
  // the objection should stop being raised alongside the answer. A few breaths
  // first: the latched tidal volume is still the raised one until the patient
  // has taken a breath at the restored setting, and until then the caution
  // correctly does not fire at all.
  dry.sim.advance(12, true);
  const reasons = dry.sim.metrics.interpretability.ppv.reasons.join(' | ');
  check('a completed challenge supersedes the tidal volume caution',
    reasons.includes('the challenge answered it'), reasons || '(none)');

  // And stops applying if the ventilator has been changed since.
  dry.sim.params.vt = 500;
  dry.sim.advance(5, true);
  check('and stops applying if the ventilator has been changed since',
    dry.sim.metrics.tidalChallenge.result === null && dry.sim.metrics.tidalChallenge.stale,
    dry.sim.metrics.interpretability.ppv.reasons.join(' | '));

  // The dry patient now clears the published threshold, which he did not before
  // the lung was given a ceiling — a bigger breath costs more pressure in a
  // stiffening lung, so it swings the pleural space harder. The rule being
  // checked is the one that matters: below the threshold the manoeuvre withholds
  // a verdict rather than returning a negative one.
  check('a preload-dependent patient now clears the published threshold',
    dry.result.verdict === 'dependent',
    `ΔPPV ${dry.result.dPpv.toFixed(1)} against a threshold of ${dry.result.threshold}`);
  check('and a filled one has its verdict withheld rather than called negative',
    wet.result.verdict === 'withheld' && wet.result.withheldReason !== null,
    `ΔPPV ${wet.result.dPpv.toFixed(1)}`);
}

describe('Recruitment changes the mechanics');
{
  const p = defaultParams();
  const recruitable = { ...p, collapsed: 0.42, clung: 40, recruitable: 0.7, pOpen: 18 };
  const consolidated = { ...recruitable, recruitable: 0 };

  // The pressure–volume curve has to be a curve, and the signature is a slope
  // that *recovers*: stiffest where the baby lung is being stretched alone, less
  // stiff once pressure has opened more of it.
  //
  // Both ends are inside the clinical range on purpose. Below a transpulmonary
  // pressure of about 6 every lung in this model is still reopening its normal
  // units, so a window that reaches down there measures that transition instead
  // of the one being asked about.
  const slopeAt = (q, pl) => (lungVolumeAtPl(q, pl + 2) - lungVolumeAtPl(q, pl - 2)) / 4;
  const curvature = (q) => slopeAt(q, 22) / slopeAt(q, 8);
  // This used to assert that a normal lung is nearly straight, which it was only
  // because the tissue had no ceiling. It stiffens as it fills now, so what
  // separates the phenotypes is the *direction*: a normal lung only ever gets
  // stiffer, a recruitable one gets softer first.
  check('a normal lung only ever gets stiffer as it fills',
    curvature(p) < 1,
    `slope ${(slopeAt(p, 8) * 1000).toFixed(0)} -> ${(slopeAt(p, 22) * 1000).toFixed(0)} mL/cmH₂O`);
  // The gain is smaller than it was, because the tissue ceiling now works against
  // the recruitment: opening units adds compliance while stretching them removes
  // it. What survives is the sign, and the sign is what tells the phenotypes
  // apart.
  check('a recruitable lung gets less stiff as pressure opens it',
    curvature(recruitable) > 1.05,
    `slope ${(slopeAt(recruitable, 8) * 1000).toFixed(0)} -> ${(slopeAt(recruitable, 22) * 1000).toFixed(0)} mL/cmH₂O`);
  check('a consolidated one only gets stiffer',
    curvature(consolidated) < 1,
    `slope ${(slopeAt(consolidated, 8) * 1000).toFixed(0)} -> ${(slopeAt(consolidated, 22) * 1000).toFixed(0)} mL/cmH₂O`);

  // The two headline consequences the linear version could not produce.
  const restLow = relaxationVolume(recruitable);
  check('pressure raises the resting volume of a recruitable lung',
    lungVolumeAtPl(recruitable, 20) - lungVolumeAtPl(recruitable, 20 - 1e-9) >= 0
      && lungVolumeAtPl(recruitable, 18) / lungVolumeAtPl(consolidated, 18) > 1.15,
    `at Pl 18: ${lungVolumeAtPl(consolidated, 18).toFixed(2)} consolidated vs `
    + `${lungVolumeAtPl(recruitable, 18).toFixed(2)} recruitable L`);

  const cLow = lungComplianceAt(recruitable, lungVolumeAtPl(recruitable, 8));
  const cHigh = lungComplianceAt(recruitable, lungVolumeAtPl(recruitable, 18));
  const kLow = lungComplianceAt(consolidated, lungVolumeAtPl(consolidated, 8));
  const kHigh = lungComplianceAt(consolidated, lungVolumeAtPl(consolidated, 18));
  // The consolidated lung used to be flat here. It falls now, because the tissue
  // has a ceiling and pressure alone walks it up its own curve. What separates
  // the two is still the sign: opening units buys compliance, and nothing else
  // in this model does.
  check('pressure raises the recruitable lung\'s compliance and lowers the consolidated one\'s',
    cHigh > cLow * 1.15 && kHigh < kLow,
    `recruitable ${cLow.toFixed(0)} -> ${cHigh.toFixed(0)}, `
    + `consolidated ${kLow.toFixed(0)} -> ${kHigh.toFixed(0)} mL/cmH₂O`);

  // Measured compliance is the open fraction times the tissue value times how far
  // up its own curve the tissue has been pushed. The first factor is the baby
  // lung as something a ventilator prints; the second is why two lungs with the
  // same amount open still read differently.
  {
    const at = (pl) => {
      const v = lungVolumeAtPl(consolidated, pl);
      return {
        measured: lungComplianceAt(consolidated, v),
        open: openFractionAt(consolidated, transpulmonaryAt(consolidated, v)),
      };
    };
    // Only where nothing is still opening. Lower down, units reopening add volume
    // of their own and measured compliance *exceeds* the open fraction times the
    // tissue value — 26 against 23 at a transpulmonary pressure of 6 — which is
    // the same recruitment the phenotype checks above are about.
    const low = at(6), high = at(24);
    check('above the opening range, compliance is the open fraction times the tissue value or less',
      high.measured < consolidated.clung * high.open,
      `${high.measured.toFixed(0)} against ${(consolidated.clung * high.open).toFixed(0)} at Pl 24`);
    check('and below it, units still opening push it the other way',
      low.measured > consolidated.clung * low.open,
      `${low.measured.toFixed(0)} against ${(consolidated.clung * low.open).toFixed(0)} at Pl 6`);
  }

  // Resting volume is an outcome now, so the whole model has to agree on it.
  {
    const s = settled({ collapsed: 0.42, clung: 40, recruitable: 0.7, pOpen: 18, peep: 0, mode: 'vcv', vt: 300 }, 40);
    check('the integrator settles at the resting volume the curve predicts',
      near(s.resp.relaxVolume, relaxationVolume(s.params), 1e-9),
      `${s.resp.relaxVolume.toFixed(4)} vs ${relaxationVolume(s.params).toFixed(4)} L`);
  }

  // PEEP now buys a recruitable patient volume that a consolidated one does not
  // get, which is the bedside version of all of the above.
  const eelv = (over) => {
    const sim = settled({ mode: 'vcv', pmus: 0, vt: 350, rr: 20, collapsed: 0.42, clung: 40, ...over }, 45);
    let lo = Infinity;
    for (let i = 0; i < (60 / sim.params.rr) / 0.01; i++) { sim.advance(0.01, true); lo = Math.min(lo, sim.resp.lungVolume); }
    return lo;
  };
  const rGain = eelv({ recruitable: 0.7, pOpen: 18, peep: 16 }) - eelv({ recruitable: 0.7, pOpen: 18, peep: 4 });
  const cGain = eelv({ recruitable: 0, peep: 16 }) - eelv({ recruitable: 0, peep: 4 });
  check('PEEP 4 to 16 gains a recruitable lung more volume than a consolidated one',
    rGain > cGain * 1.25,
    `${(rGain * 1000).toFixed(0)} mL vs ${(cGain * 1000).toFixed(0)} mL`);
}

describe('Recruitment hysteresis');
{
  // A small tidal volume on purpose. With a large one the breaths themselves
  // reach the top of the hysteresis band within a few cycles — tidal recruitment
  // doing the manoeuvre's job — and there is nothing left for a manoeuvre to
  // add. That is a real finding rather than an inconvenience, and it has its own
  // check below.
  const ARDS = {
    ...SCENARIOS.find((x) => x.id === 'ards-rv').params,
    hysteresis: 'on', pOpen: 22, recruitable: 0.7, vt: 250,
  };
  // Settle, then a recruitment manoeuvre, then back to where it started.
  const manoeuvre = (over) => {
    const s = settled({ ...ARDS, ...over }, 45);
    const before = { open: s.metrics.openFraction, pvr: s.metrics.pvrCoefficientWood,
      rvlv: s.metrics.rvLvRatio, pl: s.resp.pl };
    const peep = s.params.peep;
    s.setParam('peep', 35);
    s.advance(30, true);
    s.setParam('peep', peep);
    s.advance(45, true);
    return { before, after: { open: s.metrics.openFraction, pvr: s.metrics.pvrCoefficientWood,
      rvlv: s.metrics.rvLvRatio }, sim: s };
  };

  check('off, the flag changes nothing at all',
    settled({ ...ARDS, hysteresis: 'off', peep: 10 }, 45).metrics.openFraction
      === settled({ ...ARDS, hysteresis: 'off', peep: 10, pClose: 3 }, 45).metrics.openFraction);

  // The point of the whole thing: a manoeuvre that leaves something behind.
  const held = manoeuvre({ pClose: 6, peep: 10 });
  check('a recruitment manoeuvre leaves the lung more open than it found it',
    held.after.open > held.before.open + 0.02,
    `${(held.before.open * 100).toFixed(1)}% -> ${(held.after.open * 100).toFixed(1)}% at the same PEEP`);
  check('and the right ventricle feels it',
    held.after.pvr < held.before.pvr * 0.95 && held.after.rvlv < held.before.rvlv,
    `PVR ${held.before.pvr.toFixed(2)} -> ${held.after.pvr.toFixed(2)} Wood units, `
    + `RV:LV ${held.before.rvlv.toFixed(2)} -> ${held.after.rvlv.toFixed(2)}`);

  // And the condition under which it does not, which is the clinical point.
  const lost = manoeuvre({ pClose: 14, peep: 10 });
  check('a manoeuvre buys nothing if the PEEP after it is below the closing pressure',
    Math.abs(lost.after.open - lost.before.open) < 0.005,
    `end-expiratory transpulmonary pressure ${lost.before.pl.toFixed(1)} against a closing pressure of 14; `
    + `${(lost.before.open * 100).toFixed(1)}% -> ${(lost.after.open * 100).toFixed(1)}%`);

  // Incremental and decremental limbs are the same lung at the same pressures.
  {
    const up = settled({ ...ARDS, pClose: 6, peep: 4 }, 40);
    const down = settled({ ...ARDS, pClose: 6, peep: 4 }, 20);
    down.setParam('peep', 35); down.advance(30, true);
    // The decremental limb has to be walked *down*, which is the whole point of
    // it. Stepping both series upward compares one limb with itself.
    const rungs = [8, 12, 16];
    const upAt = new Map(), downAt = new Map();
    for (const peep of rungs) {
      up.setParam('peep', peep); up.advance(35, true);
      upAt.set(peep, [up.metrics.openFraction, up.metrics.pvrCoefficientWood]);
    }
    for (const peep of [...rungs].reverse()) {
      down.setParam('peep', peep); down.advance(35, true);
      downAt.set(peep, [down.metrics.openFraction, down.metrics.pvrCoefficientWood]);
    }
    const limbs = rungs.map((peep) => [peep, upAt.get(peep)[0], downAt.get(peep)[0],
      upAt.get(peep)[1], downAt.get(peep)[1]]);
    check('the decremental limb sits above the incremental one at every PEEP',
      limbs.every(([, u, d]) => d > u + 0.01),
      limbs.map(([peep, u, d]) => `${peep}: ${(u * 100).toFixed(1)} vs ${(d * 100).toFixed(1)}%`).join('  '));
    check('and its resistance is lower there',
      limbs.every(([, , , ru, rd]) => rd < ru),
      limbs.map(([peep, , , ru, rd]) => `${peep}: ${ru.toFixed(2)} vs ${rd.toFixed(2)}`).join('  '));
  }

  // The state has to stay inside the band it is defined by, always.
  {
    const s = settled({ ...ARDS, pClose: 6, peep: 8 }, 30);
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      s.advance(0.05, true);
      const { lo, hi } = openBand(s.params, s.resp.plSolved);
      worst = Math.max(worst, lo - s.resp.openFraction, s.resp.openFraction - hi);
    }
    check('the open fraction never leaves its band', worst < 1e-9, `worst excursion ${worst.toExponential(1)}`);
  }

  // Found while the tidal volume above was being chosen, and worth keeping: a
  // big enough breath recruits by itself, and then a manoeuvre adds nothing.
  {
    const big = manoeuvre({ pClose: 6, peep: 10, vt: 350 });
    check('a large enough tidal volume leaves a manoeuvre nothing to add',
      Math.abs(big.after.open - big.before.open) < 0.005
        && big.before.open > held.before.open,
      `at 350 mL the lung already sits at ${(big.before.open * 100).toFixed(1)}%, `
      + `against ${(held.before.open * 100).toFixed(1)}% at 250`);
  }

  // Setting the two pressures equal is the same as turning the flag off.
  check('no gap is the same as no hysteresis',
    near(settled({ ...ARDS, pClose: 22, peep: 10 }, 45).metrics.openFraction,
      settled({ ...ARDS, hysteresis: 'off', peep: 10 }, 45).metrics.openFraction, 0.005));
}

describe('The stress index');
{
  const vcv = { mode: 'vcv', pmus: 0, rr: 12, ti: 1.5 };
  const si = (o) => settled({ ...vcv, ...o }, 45).metrics.stressIndex;

  // The curve has to bend, and the direction has to depend on why.
  check('a normal lung at a protective tidal volume reads about 1',
    near(si({ vt: 450, peep: 5 }), 1, 0.08), `${si({ vt: 450, peep: 5 }).toFixed(2)}`);
  check('and rises with tidal volume, because the tissue runs out of room',
    si({ vt: 1400, peep: 10 }) > si({ vt: 450, peep: 10 }) + 0.03,
    `${si({ vt: 450, peep: 10 }).toFixed(2)} at 450 mL -> ${si({ vt: 1400, peep: 10 }).toFixed(2)} at 1400`);
  check('a stiff collapsed lung at a large tidal volume shows overdistension',
    si({ clung: 45, collapsed: 0.4, vt: 900, peep: 20 }) > 1.1,
    `${si({ clung: 45, collapsed: 0.4, vt: 900, peep: 20 }).toFixed(2)}`);

  // The other direction, and the pair that makes it a teaching point: the same
  // lung reads below 1 when PEEP is too low to hold it open and above 1 once it
  // is not.
  const openable = { clung: 45, collapsed: 0.45, recruitable: 0.8, pOpen: 16, vt: 600 };
  check('too little PEEP shows tidal recruitment instead',
    si({ ...openable, peep: 2 }) < 0.95, `${si({ ...openable, peep: 2 }).toFixed(2)} at PEEP 2`);
  check('and enough of it turns the same lung the other way',
    si({ ...openable, peep: 14 }) > si({ ...openable, peep: 2 }) + 0.1,
    `${si({ ...openable, peep: 2 }).toFixed(2)} -> ${si({ ...openable, peep: 14 }).toFixed(2)}`);

  // It reads the shape of a constant-flow inflation, so without one it is not a
  // reading at all.
  const spont = settled({ mode: 'spont', pmus: 10, peep: 4 }, 40);
  check('withheld when the patient is breathing',
    spont.metrics.stressIndex === null
      && spont.metrics.interpretability.stressIndex.level === 'unavailable',
    spont.metrics.interpretability.stressIndex.reasons.join(' | '));
  check('and withheld in pressure control, where flow is not constant',
    settled({ mode: 'pcv', pmus: 0, pinsp: 16, peep: 6 }, 40).metrics.stressIndex === null);

  // The curve the index reads is pinned by two textbook volumes, and those are
  // the claims worth asserting rather than the constants that satisfy them.
  const p = defaultParams();
  check('a normal lung rests at 2.2 L',
    near(relaxationVolume(p), 2.2, 1e-6), `${relaxationVolume(p).toFixed(6)} L`);
  check('and reaches total lung capacity at 35 cmH₂O',
    near(lungVolumeAtPl(p, 35), 6.0, 1e-3), `${lungVolumeAtPl(p, 35).toFixed(4)} L`);
  check('compliance falls as it fills, rather than staying constant for ever',
    lungComplianceAt(p, lungVolumeAtPl(p, 40)) < lungComplianceAt(p, lungVolumeAtPl(p, 5)) * 0.6,
    `${lungComplianceAt(p, lungVolumeAtPl(p, 5)).toFixed(0)} at rest -> `
    + `${lungComplianceAt(p, lungVolumeAtPl(p, 40)).toFixed(0)} mL/cmH₂O near capacity`);
}

describe('Body position');
{
  const ARDS = { collapsed: 0.42, clung: 40, vt: 350, rr: 24, eesRv: 0.28, pvrBase: 0.17, hpv: 1.6, peep: 12, recruitable: 0.55 };
  const ardsSupine = settled(ARDS);
  const ardsProne = settled({ ...ARDS, position: 'prone' });
  check('proning a recruitable lung opens some of it',
    ardsProne.metrics.openFraction > ardsSupine.metrics.openFraction + 0.02,
    `open ${ardsSupine.metrics.openFraction.toFixed(2)} -> ${ardsProne.metrics.openFraction.toFixed(2)}`);
  // This used to assert the opposite. Recruitment changed nothing mechanical
  // then, so proning could open units without the lung holding more gas — which
  // was the model's largest remaining inconsistency rather than a finding.
  check('and the units it opens now hold gas, so resting volume rises',
    ardsProne.resp.relaxVolume > ardsSupine.resp.relaxVolume,
    `${ardsSupine.resp.relaxVolume.toFixed(3)} -> ${ardsProne.resp.relaxVolume.toFixed(3)} L at rest`);
  check('proning a recruitable lung lowers pulmonary vascular resistance',
    ardsProne.metrics.pvrCoefficientWood < ardsSupine.metrics.pvrCoefficientWood * 0.95,
    `${ardsSupine.metrics.pvrCoefficientWood.toFixed(2)} -> ${ardsProne.metrics.pvrCoefficientWood.toFixed(2)} Wood units`);
  check('proning a recruitable lung unloads the right ventricle',
    ardsProne.metrics.rvLvRatio < ardsSupine.metrics.rvLvRatio,
    `RV:LV ${ardsSupine.metrics.rvLvRatio.toFixed(2)} -> ${ardsProne.metrics.rvLvRatio.toFixed(2)}`);

  const normalSupine = settled({});
  const normalProne = settled({ position: 'prone' });
  check('proning a normal lung recruits nothing, because there is nothing shut',
    Math.abs(normalProne.metrics.openFraction - normalSupine.metrics.openFraction) < 0.01,
    `open ${normalSupine.metrics.openFraction.toFixed(3)} -> ${normalProne.metrics.openFraction.toFixed(3)}`);

  const consolidated = settled({ ...ARDS, recruitable: 0 });
  const consolidatedProne = settled({ ...ARDS, recruitable: 0, position: 'prone' });
  check('and proning a consolidated lung recruits nothing either — it is shut, not closed',
    Math.abs(consolidatedProne.metrics.openFraction - consolidated.metrics.openFraction) < 0.01,
    `open ${consolidated.metrics.openFraction.toFixed(3)} -> ${consolidatedProne.metrics.openFraction.toFixed(3)}`);
  check('proning stiffens the chest wall, so pleural pressure rises',
    normalProne.metrics.ppl > normalSupine.metrics.ppl && ardsProne.metrics.ppl > ardsSupine.metrics.ppl,
    `normal ${normalSupine.metrics.ppl.toFixed(1)} -> ${normalProne.metrics.ppl.toFixed(1)} cmH2O`);
  check('proning raises mean systemic filling pressure',
    normalProne.metrics.pmsf > normalSupine.metrics.pmsf,
    `${normalSupine.metrics.pmsf.toFixed(1)} -> ${normalProne.metrics.pmsf.toFixed(1)} mmHg`);
}

describe('The pulmonary vascular curve is J-shaped, not monotonic');
{
  const p = defaultParams();
  const at = (v) => pvrComponents(p, v).total;
  const nadir = at(PVR_NADIR_VOLUME);
  check('resistance rises below the nadir', at(1.2) > nadir * 1.2,
    `${at(1.2).toFixed(4)} vs ${nadir.toFixed(4)}`);
  check('resistance rises above the nadir', at(3.8) > nadir * 1.2,
    `${at(3.8).toFixed(4)} vs ${nadir.toFixed(4)}`);
  // Scan for the true minimum rather than assuming it.
  let best = { v: 0, r: Infinity };
  for (let v = 0.8; v <= 4.2; v += 0.01) { const r = at(v); if (r < best.r) best = { v, r }; }
  check('the minimum sits at a normal functional residual capacity',
    near(best.v, PVR_NADIR_VOLUME, 0.15), `minimum at ${best.v.toFixed(2)} L`);
}

// -------------------------------------------- integrator / drawing agreement -

describe('The drawn curves agree with the integrator');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  s.advance(30, true);
  const op = s.metrics.operatingPoint;
  const curve = venousReturnCurve(s.params, s.circ, op);
  // Read the curve at the simulated pressure and compare with the simulated flow.
  let drawn = NaN;
  const pts = curve.points;
  for (let i = 2; i < pts.length; i += 2) {
    const a = pts[i - 2], b = pts[i];
    if ((a <= op.pra && op.pra <= b) || (b <= op.pra && op.pra <= a)) {
      const t = (op.pra - a) / ((b - a) || 1);
      drawn = pts[i - 1] + t * (pts[i + 1] - pts[i - 1]);
      break;
    }
  }
  check(`${sc.id}: simulated state lies on the venous return curve`,
    Number.isFinite(drawn) && Math.abs(drawn - op.flow) < 0.45,
    `drawn ${drawn.toFixed(3)} vs simulated ${op.flow.toFixed(3)} L/min`);
}

describe('The venous return curve uses the integrator\'s own collapse law');
{
  const s = settled({});
  const op = s.metrics.operatingPoint;
  const direct = (venousReturnFlow(op.pmsf, op.pra, op.pCrit, s.circ.p.rvrEff) * 60) / 1000;
  const curve = venousReturnCurve(s.params, s.circ, op);
  let drawn = NaN;
  const pts = curve.points;
  for (let i = 2; i < pts.length; i += 2) {
    const a = pts[i - 2], b = pts[i];
    if ((a <= op.pra && op.pra <= b) || (b <= op.pra && op.pra <= a)) {
      const t = (op.pra - a) / ((b - a) || 1);
      drawn = pts[i - 1] + t * (pts[i + 1] - pts[i - 1]);
      break;
    }
  }
  check('curve and equation give the same flow', near(direct, drawn, 0.02),
    `${direct.toFixed(4)} vs ${drawn.toFixed(4)} L/min`);
}

// ---------------------------------------------------------------- snapshots --

describe('Scenario snapshots');
for (const sc of SCENARIOS) {
  const expected = SNAPSHOTS[sc.id];
  if (!expected) { check(sc.id, false, 'no snapshot recorded'); continue; }
  const s = new Simulator();
  s.applyScenario(sc);
  s.advance(30, true);
  const m = s.metrics;
  const got = { co: m.co, map: m.map, cvp: m.cvp, papMean: m.papMean, paop: m.paop, pvr: m.pvrCoefficientWood };
  const drift = Object.entries(expected)
    .filter(([k, v]) => Math.abs(got[k] - v) > Math.max(0.05, Math.abs(v) * 0.02))
    .map(([k, v]) => `${k} ${v} -> ${got[k].toFixed(2)}`);
  check(sc.id, drift.length === 0, drift.join(', '));
}

// ---------------------------------------------------------------- literature --

// docs/LITERATURE_RANGES.md records, per published finding, whether the model
// currently agrees. Both directions are enforced: a row that claims agreement
// and stops agreeing fails, and so does a row that claims it does not agree and
// then starts. The second half is what keeps the document from going stale.
describe('Published findings, and whether the document says so honestly');
{
  const doc = readFileSync(new URL('../docs/LITERATURE_RANGES.md', import.meta.url), 'utf8');
  const rows = [...doc.matchAll(/^\| `([\w-]+)` \| .+? \| (agrees|not yet) \|/gm)]
    .map(([, id, status]) => ({ id, status }));

  check('every row in the document has a check', rows.length === Object.keys(LITERATURE).length,
    `${rows.length} rows, ${Object.keys(LITERATURE).length} checks`);

  for (const { id, status } of rows) {
    const fn = LITERATURE[id];
    if (!fn) { check(id, false, 'no check implemented'); continue; }
    const { pass, detail } = fn();
    const documented = status === 'agrees';
    check(`${id} — documented as "${status}"`, pass === documented,
      pass ? `the model now agrees; mark the row "agrees" — ${detail}`
        : `the model does not agree — ${detail}`);
  }
}

// ------------------------------------------------------- documentation drift --

// The README quotes what each scenario settles at. Rather than generate that
// table and lose the prose around it, check it: a number in the documentation
// that the model no longer produces is a defect, and this is how it gets found.
describe('The README scenario table matches the model');
{
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  const section = readme.split('### What each one settles at')[1] ?? '';
  const rows = [...section.matchAll(/^\| ([^|]+?) \| ([\d.]+) \| (−?\d+) \| (−?[\d.]+) \|/gm)];
  check('the table was found and parsed', rows.length === SCENARIOS.length,
    `${rows.length} rows for ${SCENARIOS.length} scenarios`);

  for (const row of rows) {
    const [, name, co, map, cvp] = row;
    const sc = SCENARIOS.find((x) => x.name === name.trim());
    if (!sc) { check(`${name.trim()} is a real scenario`, false); continue; }
    const s = new Simulator();
    s.applyScenario(sc);
    s.advance(30, true);
    const m = s.metrics;
    const documented = { co: Number(co), map: Number(map), cvp: Number(cvp.replace('−', '-')) };
    const drift = [];
    if (!near(m.co, documented.co, 0.06)) drift.push(`CO ${documented.co} vs ${m.co.toFixed(2)}`);
    if (!near(m.map, documented.map, 1.5)) drift.push(`MAP ${documented.map} vs ${m.map.toFixed(0)}`);
    if (!near(m.cvp, documented.cvp, 0.3)) drift.push(`CVP ${documented.cvp} vs ${m.cvp.toFixed(1)}`);
    check(sc.name, drift.length === 0, drift.join(', '));
  }
}

// ------------------------------------------------------------------ summary --

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
