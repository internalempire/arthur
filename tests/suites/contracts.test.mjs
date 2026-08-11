// Cross-layer contracts: curves, snapshots, literature claims and documented scenarios.
import {
  Simulator, SCENARIOS, PARAMETERS, venousReturnCurve, venousReturnFlow,
  readFileSync, readdirSync, SNAPSHOTS, LITERATURE,
  section, check, near, settled,
} from '../support/model.mjs';

section('Public model API');
{
  const api = await import('../../src/model/index.js');
  const expected = [
    'CHAMBER', 'GROUPS', 'PARAMETERS', 'PPL_FRC', 'RESISTANCE_TO_WOOD',
    'SCENARIOS', 'SCENARIO_BY_ID', 'Simulator', 'TRACE_SECONDS',
    'cardiacFunctionCurve', 'clamp', 'cmH2OtoMmHg', 'curveIntersection',
    'lungRegions', 'lungVolumeAtPl', 'openBand', 'preloadLimbs',
    'pvrComponents', 'relaxationVolume', 'respiratorySystemCompliance',
    'stepOpenFraction', 'venousReturnCurve',
  ];
  check('exports exactly the browser-facing model contract',
    JSON.stringify(Object.keys(api).sort()) === JSON.stringify(expected.sort()),
    `expected ${expected.length} exports, found ${Object.keys(api).length}`);

  // Scan the browser entry point and every UI module. This turns the intended
  // dependency direction into an executable boundary: future panels cannot
  // silently couple themselves back to the layout of model internals.
  const collectJavaScript = (directory) => {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
      if (entry.isDirectory()) files.push(...collectJavaScript(url));
      else if (entry.name.endsWith('.js')) files.push(url);
    }
    return files;
  };
  const browserFiles = [
    new URL('../../src/main.js', import.meta.url),
    ...collectJavaScript(new URL('../../src/ui/', import.meta.url)),
  ];
  const forbidden = [];
  for (const file of browserFiles) {
    const source = readFileSync(file, 'utf8');
    for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      if (specifier.includes('/model/') && !specifier.endsWith('/model/index.js')) {
        forbidden.push(`${file.pathname.split('/').pop()}: ${specifier}`);
      }
    }
  }
  const unloadable = [];
  for (const file of browserFiles.slice(1)) {
    try {
      await import(file.href);
    } catch (error) {
      unloadable.push(`${file.pathname.split('/').pop()}: ${error.message}`);
    }
  }
  check('main and UI use the public API and every UI module resolves',
    forbidden.length === 0 && unloadable.length === 0,
    [...forbidden, ...unloadable].join(', '));
}

// ------------------------------------------------ pulmonary claim contracts --

// These are user-facing physiological semantics rather than numerical outputs.
// Keep them executable because both claims were previously documented in a way
// that overreached the model: equal VT was equated with equal PVR, and the PE
// preset looked like a specific Poiseuille-resistance mechanism rather than the
// deliberately aggregate bedside load it represents.
section('Pulmonary vascular claims exposed to the user stay qualified');
{
  const vt = PARAMETERS.find((p) => p.id === 'vt');
  const pe = SCENARIOS.find((s) => s.id === 'pulmonary-embolism');
  check('equal VT is not claimed to guarantee equal PVR',
    vt?.help.includes('same VT does not guarantee the same PVR')
      && vt.help.includes('alveolar waterfall'));
  check('pulmonary embolism is labelled as aggregate load',
    pe?.note.includes('aggregate pulmonary vascular load')
      && pe.note.includes('baroreflex senses only systemic MAP'));

  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  check('README carries the active two-limb coefficients',
    readme.includes('stretch      = exp(0.58 * strain)')
      && readme.includes('F_ALV`, `F_EXTRA` | 0.5, 0.5')
      && !readme.includes('stretch      = exp(0.515 * strain)'));
}

section('The drawn curves agree with the integrator');
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

section('The venous return curve uses the integrator\'s own collapse law');
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

section('Scenario snapshots');
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
section('Published findings, and whether the document says so honestly');
{
  const doc = readFileSync(new URL('../../docs/LITERATURE_RANGES.md', import.meta.url), 'utf8');
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
section('The README scenario table matches the model');
{
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
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
