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
} from '../src/model/circulation.js';
import { pvrComponents, PVR_NADIR_VOLUME } from '../src/model/respiratory.js';
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
  const trapped = settled({ raw: 24, rr: 26, ti: 0.9, clung: 240, frc: 3.0 });
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
  const noSeptum = settled({ eesRv: 0.22, pvrBase: 0.30, septal: 0 });
  check('removing septal coupling lets the left ventricle fill',
    noSeptum.metrics.lvEdv > rvFail.metrics.lvEdv,
    `${rvFail.metrics.lvEdv.toFixed(0)} -> ${noSeptum.metrics.lvEdv.toFixed(0)} mL`);
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
