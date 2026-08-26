// Cross-layer contracts: curves, snapshots, literature claims and documented scenarios.
import {
  Simulator, SCENARIOS, PARAMETERS, venousReturnCurve, venousReturnFlow,
  readFileSync, readdirSync, SNAPSHOTS, LITERATURE,
  section, check, near, settled,
} from '../support/model.mjs';
import { pvrZoomDomain } from '../../src/ui/panels/pvrcurve.js';
import { fallbackTitle, manualHash, parseManualHash } from '../../manual/navigation.mjs';
import { endExpiratoryPressurePresentation } from '../../src/ui/stats.js';

section('Manual navigation and clinical titles');
{
  const route = parseManualHash('#/pulmonary-vascular-resistance#what-the-model-shows');
  check('an in-page anchor is not treated as part of the Markdown filename',
    route.slug === 'pulmonary-vascular-resistance' && route.anchor === 'what-the-model-shows');
  check('manual hashes preserve both page and in-page destination',
    manualHash(route.slug, route.anchor) === '#/pulmonary-vascular-resistance#what-the-model-shows');
  check('fallback titles preserve familiar clinical notation',
    fallbackTitle('pvr-nadir-at-frc') === 'PVR nadir at FRC'
      && fallbackTitle('recruitment-and-ri') === 'Recruitment and R/I');

  const status = JSON.parse(readFileSync(new URL('../../manual/status.json', import.meta.url), 'utf8'));
  check('the sidebar title source is generated from authored page headings',
    status.titles['pvr-nadir-at-frc'] === 'Why the PVR nadir is at FRC'
      && status.titles['pmsf-and-occlusions'] === 'Pmsf and occlusions');
}

section('Public model API');
{
  const api = await import('../../src/model/index.js');
  // The recruitment-state helpers are intentionally public: the Campbell panel
  // must draw the same already-aerated/recruitable separation as the integrator
  // without bypassing this model boundary and importing lung.js directly.
  const expected = [
    'CHAMBER', 'EXPIRATORY_FLOW_LIMIT', 'GROUPS', 'IVC', 'PARAMETERS', 'PPL_FRC', 'PRESSURE_SUPPORT',
    'RESISTANCE_TO_WOOD',
    'SCENARIOS', 'SCENARIO_BY_ID', 'Simulator', 'TRACE_SAMPLE_HZ', 'TRACE_SECONDS',
    'cardiacFunctionCurve', 'clamp', 'cmH2OtoMmHg', 'curveIntersection',
    'chestWallComplianceAt', 'chestWallNeutralVolume', 'chestWallPressure',
    'lungRegions', 'lungVolumeAtPl', 'openBand', 'openFractionFromRecruitmentState',
    'pericardialPressure', 'preloadLimbs', 'pvrComponents', 'recruitmentBand', 'relaxationVolume',
    'staticEndExpiratoryVolume',
    'respiratorySystemCompliance', 'stepOpenFraction', 'stepRecruitedFraction',
    'venousReturnCurve',
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

section('End-expiratory pressure is named by mechanism');
{
  const healthy = SCENARIOS.find(({ id }) => id === 'healthy-spont');
  const copd = SCENARIOS.find(({ id }) => id === 'copd');
  const active = endExpiratoryPressurePresentation(settled(healthy.params, 45).metrics);
  const passive = endExpiratoryPressurePresentation(settled(copd.params, 45).metrics);

  check('a healthy active breath is not labelled intrinsic PEEP or trapped gas',
    active.label === 'End-expiratory alveolar pressure'
      && /EELV .* above passive equilibrium/.test(active.detail)
      && !/intrinsic|trapp/i.test(`${active.label} ${active.detail}`),
    `${active.label}: ${active.detail}`);
  check('passive obstructive emptying retains the conventional labels',
    passive.label === 'Total PEEP'
      && /intrinsic/.test(passive.detail)
      && /dynamically trapped/.test(passive.detail),
    `${passive.label}: ${passive.detail}`);
}

section('PVR chart vertical zoom');
{
  const fitted = pvrZoomDomain(2.4, 1.2, 1);
  const centred = pvrZoomDomain(2.4, 1.2, 2);
  const clampedLow = pvrZoomDomain(2.4, 0.1, 3);
  const clampedHigh = pvrZoomDomain(2.4, 2.3, 3);
  check('fit preserves the complete resistance range', fitted.yLo === 0 && fitted.yHi === 2.4);
  check('zoom narrows and centres the vertical range',
    near(centred.yLo, 0.6, 1e-9) && near(centred.yHi, 1.8, 1e-9));
  check('zoom focus is clamped at both full-range boundaries',
    clampedLow.yLo === 0 && near(clampedHigh.yHi, 2.4, 1e-9));
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
  const pvrManual = readFileSync(new URL('../../manual/pulmonary-vascular-resistance.md', import.meta.url), 'utf8');
  check('README delegates PVR equations and limits to the manual',
    readme.includes('[Pulmonary vascular resistance](manual/pulmonary-vascular-resistance.md)')
      && readme.includes('[Global limits](manual/global-limits.md)')
      && !readme.includes('stretch      = exp('));
  check('the inflation-deflation comparison uses literal clinical language',
    pvrManual.includes('inflation and deflation points fall approximately on the same curve')
      && !pvrManual.includes('approach one relation'));

  const zoneThree = settled({ mode: 'vcv', pmus: 0, peep: 0 }).metrics;
  const waterfall = settled({ mode: 'vcv', pmus: 0, peep: 10 }).metrics;
  check('derived PVR is unqualified only with a defensible wedge surrogate',
    zoneThree.interpretability.wedge.level === 'ok'
      && zoneThree.interpretability.pvrDerived.level === 'ok');
  check('derived PVR inherits wedge uncertainty outside zone 3',
    waterfall.interpretability.wedge.level === 'caution'
      && waterfall.interpretability.pvrDerived.level === 'caution'
      && waterfall.interpretability.pvrDerived.reasons[0].includes('wedge surrogate'));
}

section('PPV remains descriptive rather than a filling-state verdict');
{
  const stats = readFileSync(new URL('../../src/ui/stats.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../../manual/pulse-pressure-variation.md', import.meta.url), 'utf8');
  const figures = readFileSync(new URL('../../manual/figure/generate.mjs', import.meta.url), 'utf8');
  check('the numerical tile disclaims a filling-state interpretation',
    stats.includes('descriptive only · not a filling-state verdict'));
  check('the manual exposes both non-monotonic filling extremes',
    page.includes('severe underfilling')
      && page.includes('quantitative limitation of the model')
      && page.includes('neither a low nor a high model PPV identifies filling state'));
  check('the filling comparison is generated from the model rather than drawn by hand',
    page.includes('figure/ppv-filling.svg')
      && figures.includes("'ppv-filling.svg': ppvFillingFigure()"));
}

section('Tamponade IVC remains plethoric without being drawn as immobile');
{
  const ivcPage = readFileSync(new URL('../../manual/inferior-vena-cava.md', import.meta.url), 'utf8');
  const thoraxPage = readFileSync(new URL('../../manual/panel-thorax.md', import.meta.url), 'utf8');
  const validation = readFileSync(new URL('../../docs/SCENARIO_VALIDATION.md', import.meta.url), 'utf8');
  check('the manual describes blunted rather than universally absent excursion',
    ivcPage.includes('does not require the diameter to be completely motionless')
      && ivcPage.includes('small respiratory excursion')
      && !ivcPage.includes('dilated and fixed')
      && !thoraxPage.includes('dilated and fixed'));
  check('the IVC comparison is generated from the current model',
    ivcPage.includes('BEGIN GENERATED: ivc-respiratory-calibre')
      && ivcPage.includes('END GENERATED: ivc-respiratory-calibre'));
  check('scenario validation distinguishes the schematic from ultrasound',
    validation.includes('directional volume-based schematic')
      && validation.includes('non-zero displayed respiratory excursion'));
}

section('The drawn curves agree with the integrator');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  s.advance(30, true);
  const op = s.metrics.respiratoryOperatingPoint;
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
  // Averaging a nonlinear collapse law over a breath is not exactly the same as
  // evaluating it at mean pressure. Keep a tight absolute tolerance at ordinary
  // flow, but allow about 12% during very vigorous spontaneous effort.
  const tolerance = Math.max(0.45, Math.abs(op.flow) * 0.12);
  check(`${sc.id}: simulated state lies on the venous return curve`,
    Number.isFinite(drawn) && Math.abs(drawn - op.flow) < tolerance,
    `drawn ${drawn.toFixed(3)} vs simulated ${op.flow.toFixed(3)} L/min`);
}

section('The venous return curve uses the integrator\'s own collapse law');
{
  const s = settled({});
  const op = s.metrics.respiratoryOperatingPoint;
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

// The README is the project's concise landing page, while the manual owns the
// detailed physiology and executable numerical examples. Keep the overview
// complete without making it a second, independently drifting manual.
section('The README remains a complete project overview');
{
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
  const missingScenarios = SCENARIOS
    .filter(({ name }) => readme.split(`| ${name} |`).length !== 2)
    .map(({ name }) => name);
  check('README names every active scenario exactly once', missingScenarios.length === 0,
    missingScenarios.join(', '));

  const manualEntryPoints = [
    'manual/home.md', 'manual/quick-start.md', 'manual/scenarios.md',
    'manual/validation.md', 'manual/global-limits.md', 'manual/model-architecture.md',
  ];
  const missingEntryPoints = manualEntryPoints.filter((page) => !readme.includes(`(${page})`));
  check('README routes deeper topics to the manual', missingEntryPoints.length === 0,
    missingEntryPoints.join(', '));

  check('README does not duplicate equations or numerical scenario snapshots',
    !readme.includes('### What each one settles at')
      && !readme.includes('## 12. Fixed constants')
      && !readme.includes('BEGIN GENERATED: readme-stress-index')
      && !readme.includes('stretch      = exp('));
}

section('The Guyton points remain explicitly distinguished');
{
  const panel = readFileSync(new URL('../../manual/panel-guyton.md', import.meta.url), 'utf8');
  const venousReturn = readFileSync(new URL('../../manual/venous-return.md', import.meta.url), 'utf8');
  const preloadReserve = readFileSync(new URL('../../manual/preload-reserve.md', import.meta.url), 'utf8');
  const examples = readFileSync(new URL('../../manual/model-examples.mjs', import.meta.url), 'utf8');
  const guytonUi = readFileSync(new URL('../../src/ui/panels/guyton.js', import.meta.url), 'utf8');

  check('the filled respiratory mean is identified as venous inflow rather than cardiac output',
    panel.includes('venous inflow from the inferior vena cava into the right atrium')
      || (panel.includes('IVC-to-right-atrial venous inflow')
        && panel.includes('not RV output, LV output or cardiac output')));
  check('the canvas labels the two central marks by quantity rather than calculation method',
    guytonUi.includes("panel.label('mean venous inflow'")
      && guytonUi.includes("panel.label('predicted equilibrium'")
      && !guytonUi.includes("panel.label('simulated mean'")
      && !guytonUi.includes("panel.label('analytic'"));
  check('the dynamic trail identifies the measured respiratory inflow path',
    guytonUi.includes("panel.label('inflow path'")
      && panel.includes('drawing a trail from successive predicted crossings would hide'));
  check('the panel separates one-heartbeat dynamics from one-breath equilibrium',
    panel.includes('one-heartbeat means')
      && panel.includes('most recent complete respiratory cycle')
      && panel.includes('whole breath')
      && guytonUi.includes('const pplMmHg = op.ppl'));
  check('temporary right-heart storage is explained',
    venousReturn.includes('dV_{right}')
      && venousReturn.includes('temporarily store blood'));
  check('high RV afterload is documented as a dynamic trail rather than failed convergence',
    panel.includes('pulmonary embolism or severe RV pressure loading')
      && panel.includes('trail can be broad while the respiratory-mean points remain close'));
  check('the ascending curve is explicitly RV rather than LV function',
    panel.includes('labels it **RV function**')
      && panel.includes('It is not an independently calculated LV-function curve')
      && guytonUi.includes("panel.label('RV function'"));
  check('preload reserve does not claim to test LV reserve independently',
    preloadReserve.includes('does not independently test LV reserve')
      && preloadReserve.includes('LV filling reserve and LV systolic limitation are not independently tested'));
  check('generated examples do not call a cardiac-cycle mean a respiratory-cycle mean',
    !examples.includes('respiratory-cycle mean used by the Guyton construction'));
}
