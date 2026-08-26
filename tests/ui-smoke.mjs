// Fast contracts for pull requests that change only the application shell,
// styles or UI modules. Physiological and scenario changes always run the full
// suite; this profile only catches broken module graphs, forbidden model-layer
// imports and missing DOM anchors without spending minutes settling patients.

import { readFileSync, readdirSync } from 'node:fs';

const failures = [];
const check = (name, condition, detail = '') => {
  if (condition) console.log(`pass  ${name}`);
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

function collect(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) files.push(...collect(url));
    else if (entry.name.endsWith('.js')) files.push(url);
  }
  return files;
}

const uiFiles = collect(new URL('../src/ui/', import.meta.url));
const unloadable = [];
for (const file of uiFiles) {
  try {
    await import(file.href);
  } catch (error) {
    unloadable.push(`${file.pathname.split('/').pop()}: ${error.message}`);
  }
}
check('every UI module resolves', unloadable.length === 0, unloadable.join(', '));

const browserFiles = [new URL('../src/main.js', import.meta.url), ...uiFiles];
const forbidden = [];
for (const file of browserFiles) {
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (specifier.includes('/model/') && !specifier.endsWith('/model/index.js')) {
      forbidden.push(`${file.pathname.split('/').pop()}: ${specifier}`);
    }
  }
}
check('UI imports the model only through its public boundary',
  forbidden.length === 0, forbidden.join(', '));

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles/app.css', import.meta.url), 'utf8');
const descriptions = readFileSync(new URL('../src/ui/descriptions.js', import.meta.url), 'utf8');
const anchors = [
  'scenario', 'speed', 'playpause', 'hold-exp', 'hold-insp', 'reset',
  'save-patient', 'load-patient', 'patient-state-file', 'patient-state-status', 'theme',
  'sidebar-toggle', 'scenario-note', 'controls', 'invalid-banner', 'stats',
  'waveforms', 'guyton', 'campbell', 'pvloops', 'pvr', 'thorax',
];
const missing = anchors.filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
check('the application shell retains every UI mount point',
  missing.length === 0, missing.join(', '));
check('the browser entry point remains an ES module',
  /<script\s+type=["']module["']\s+src=["']src\/main\.js["']><\/script>/.test(html));
check('the header exposes accessible repository and manual links',
  /id=["']project-repository["'][^>]+href=["']https:\/\/github\.com\/internalempire\/arthur["'][^>]+aria-label=/.test(html)
    && /id=["']project-manual["'][^>]+href=["']manual\/["'][^>]+aria-label=/.test(html));
check('numerical tiles retain one thin solid outline across kinds and quality states',
  /\.tile\s*\{[^}]*border:\s*1px solid var\(--border\)/s.test(css)
    && !/\.tile\[data-kind=[^\]]+\][^\n{]*\{[^}]*border-left/s.test(css)
    && !/\.tile\[data-quality=[^\]]+\][^\n{]*\{[^}]*border-style/s.test(css));
check('chart data disclosures use a compact help glyph with an explicit name',
  /toggle\.textContent\s*=\s*'\?'/.test(descriptions)
    && /values and description/.test(descriptions)
    && /\.panel-data > summary\s*\{[^}]*border-radius:\s*50%/s.test(css));
check('waveform values expose pressure-support trigger and early-cycling timing',
  descriptions.includes('Pressure-support trigger delay')
    && descriptions.includes('Pressure-support cycling')
    && descriptions.includes('early cycling'));

const stats = readFileSync(new URL('../src/ui/stats.js', import.meta.url), 'utf8');
const { tilePrimaryValue } = await import(new URL('../src/ui/stats.js', import.meta.url));
const {
  PARAMETERS, PATIENT_STATE_FORMAT, PATIENT_STATE_VERSION,
  createPatientState, parsePatientState,
} = await import(new URL('../src/model/index.js', import.meta.url));
const { choiceIndex, choiceValue } = await import(new URL('../src/ui/controls.js', import.meta.url));
const {
  airwayReadout, waveformScaleStart,
} = await import(new URL('../src/ui/panels/waveforms.js', import.meta.url));
const {
  CAMPBELL_DEFAULT_ZOOM, classicalCampbellCurves, campbellZoomDomain,
} = await import(new URL('../src/ui/panels/campbell.js', import.meta.url));
const { stableGuytonDomain } = await import(new URL('../src/ui/panels/guyton.js', import.meta.url));
const {
  stablePvLoopDomain, effectiveEndSystolicRelation,
} = await import(new URL('../src/ui/panels/pvloops.js', import.meta.url));
const { ivcDisplayWidth } = await import(new URL('../src/ui/panels/thorax.js', import.meta.url));
const baroreflex = PARAMETERS.find((spec) => spec.id === 'baroreflexEnabled');
const hysteresis = PARAMETERS.find((spec) => spec.id === 'hysteresis');
check('baroreflex uses the same Off/On selector as recruitment hysteresis',
  baroreflex?.type === 'choice'
    && hysteresis?.type === 'choice'
    && baroreflex.options.map((option) => option.label).join('/') === 'Off/On'
    && choiceValue(baroreflex, choiceIndex(baroreflex, true)) === true
    && choiceValue(baroreflex, choiceIndex(baroreflex, false)) === false);
check('effective heart rate and systemic resistance remain available as tiles',
  /id: 'hr'/.test(stats) && /id: 'svr'/.test(stats));
const pressureMetrics = {
  valid: true, ppl: -5.2, pplSwing: 7.8, pl: 6.1, palv: 0.9,
};
check('respiratory-pressure tiles expose instantaneous Ppl, Palv and PL',
  tilePrimaryValue('ppl', pressureMetrics) === '-5.2'
    && tilePrimaryValue('palv', pressureMetrics) === '0.9'
    && tilePrimaryValue('pl', pressureMetrics) === '6.1');
const passiveAirway = {
  valid: true, paw: 8.4, pplat: 14.2,
  interpretability: { plateau: { level: 'ok' } },
};
const assistedAirway = {
  ...passiveAirway,
  interpretability: { plateau: { level: 'unavailable' } },
};
check('the waveform rail keeps Paw live when plateau is unavailable',
  airwayReadout(passiveAirway) === '8.4 (Pplat 14.2)'
    && airwayReadout(assistedAirway) === '8.4');
const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const waveformSource = readFileSync(new URL('../src/ui/panels/waveforms.js', import.meta.url), 'utf8');
check('waveform scales start a new visual state after every parameter change',
  mainSource.includes('waveforms.resetView(sim)')
    && waveformSource.includes('sim.time - viewEpoch')
    && waveformScaleStart(3000, 0.2) === 2950
    && waveformScaleStart(3000, 20) === 0);
const psvSettings = Object.fromEntries(PARAMETERS.map((spec) => [spec.id, spec.default]));
Object.assign(psvSettings, { mode: 'psv', pinsp: 14, pmus: 6, peep: 0 });
const campbell = classicalCampbellCurves(psvSettings);
const wallStart = campbell.chestWall.slice(0, 2);
const wallEnd = campbell.chestWall.slice(-2);
const lungStart = campbell.lungCurves[0].points.slice(0, 2);
const lungEnd = campbell.lungCurves[0].points.slice(-2);
check('the classical Campbell curves have their physiological orientation',
  wallEnd[0] > wallStart[0] && wallEnd[1] > wallStart[1]
    && lungEnd[0] < lungStart[0] && lungEnd[1] > lungStart[1]);
check('the Campbell domain shows absolute volume and the full passive construction',
  campbell.domain.yMin === 0
    && campbell.domain.yMax >= psvSettings.lungCapacity * 0.9
    && campbell.domain.xMin <= -40
    && campbell.vRelax > 0);
const zoomedCampbell = campbellZoomDomain(
  campbell.domain, { x: -5, y: campbell.vRelax }, 3,
);
check('Campbell zoom keeps a stable operating-point view inside the full domain',
  zoomedCampbell.xMin >= campbell.domain.xMin
    && zoomedCampbell.xMax <= campbell.domain.xMax
    && zoomedCampbell.yMin >= campbell.domain.yMin
    && zoomedCampbell.yMax <= campbell.domain.yMax
    && zoomedCampbell.xMax - zoomedCampbell.xMin
      < campbell.domain.xMax - campbell.domain.xMin);
check('Campbell opens at the magnification that exposes the tidal loop',
  CAMPBELL_DEFAULT_ZOOM === 3);
check('a plethoric IVC remains visually responsive above the reference calibre',
  ivcDisplayWidth(180) > ivcDisplayWidth(160)
    && ivcDisplayWidth(160) > ivcDisplayWidth(150));

const guytonDomain = stableGuytonDomain(null, { xLo: -7.1, xHi: 14.2, yHi: 9.1 });
const unchangedGuyton = stableGuytonDomain(guytonDomain, { xLo: -6, xHi: 13, yHi: 8 });
const expandedGuyton = stableGuytonDomain(guytonDomain, { xLo: -10.1, xHi: 18.1, yHi: 12.1 });
check('Guyton axes remain fixed inside one state and expand only for off-scale data',
  JSON.stringify(unchangedGuyton) === JSON.stringify(guytonDomain)
    && expandedGuyton.xLo < guytonDomain.xLo
    && expandedGuyton.xHi > guytonDomain.xHi
    && expandedGuyton.yHi > guytonDomain.yHi);
const guytonSource = readFileSync(new URL('../src/ui/panels/guyton.js', import.meta.url), 'utf8');
check('the Guyton preload limb is shown without the removed explanatory slogan',
  !guytonSource.includes('filling helps here'));

const rvDomain = stablePvLoopDomain(null, { vMax: 150, pMax: 45 }, 'rv');
const unchangedRv = stablePvLoopDomain(rvDomain, { vMax: 190, pMax: 50 }, 'rv');
const expandedRv = stablePvLoopDomain(rvDomain, { vMax: 240, pMax: 90 }, 'rv');
check('PV-loop axes retain ventricle-specific headroom without following every beat',
  JSON.stringify(unchangedRv) === JSON.stringify(rvDomain)
    && expandedRv.vMax > rvDomain.vMax
    && expandedRv.pMax > rvDomain.pMax);

const localEspvr = effectiveEndSystolicRelation(32, 90, 0.35, 10);
check('the local ESPVR passes through the displayed end-systolic point',
  Math.abs(localEspvr.pressureAt(90) - 32) < 1e-12);

const pvSource = readFileSync(new URL('../src/ui/panels/pvloops.js', import.meta.url), 'utf8');
check('Ea joins end-diastolic volume at zero pressure to the end-systolic point',
  pvSource.includes('panel.line([edv, 0, esv, Math.max(0, esp)]')
    && pvSource.includes('Number.isFinite(esp)'));
check('both cardiac PV-loop axes and passive relations are named without a lone point marker',
  pvSource.includes("yLabel: 'Pressure (mmHg)'")
    && pvSource.includes("xLabel: 'Volume (mL)'")
    && pvSource.includes("panel.label('ESPVR'")
    && pvSource.includes("panel.label('EDPVR'")
    && !pvSource.includes('panel.dot('));

const defaultPatient = Object.fromEntries(PARAMETERS.map((spec) => [spec.id, spec.default]));
const customPatient = { ...defaultPatient, mode: 'pcv', peep: 12, clung: 85 };
const savedPatient = createPatientState(customPatient, '2026-08-26T12:00:00.000Z');
check('a patient-state file stores the complete vector and identifies modified settings',
  savedPatient.format === PATIENT_STATE_FORMAT
    && savedPatient.version === PATIENT_STATE_VERSION
    && Object.keys(savedPatient.parameters).length === PARAMETERS.length
    && savedPatient.modified.join(',') === 'mode,peep,clung');

const loadedPatient = parsePatientState(JSON.parse(JSON.stringify(savedPatient)));
check('a patient-state JSON round trip reproduces typed parameters',
  loadedPatient.params.mode === 'pcv'
    && loadedPatient.params.peep === 12
    && loadedPatient.params.clung === 85
    && loadedPatient.overrides.mode === 'pcv'
    && loadedPatient.ignored.length === 0);

const olderPatient = JSON.parse(JSON.stringify(savedPatient));
olderPatient.parameters.retiredSetting = 1;
const compatiblePatient = parsePatientState(olderPatient);
check('retired patient settings are reported and ignored without losing known values',
  compatiblePatient.ignored.join(',') === 'retiredSetting'
    && compatiblePatient.params.peep === 12);

let invalidPatientRejected = false;
try {
  parsePatientState({ ...savedPatient, parameters: { ...savedPatient.parameters, peep: 99 } });
} catch (error) {
  invalidPatientRejected = /PEEP/.test(error.message);
}
check('an out-of-range patient setting is rejected rather than clipped', invalidPatientRejected);

if (failures.length) {
  console.error(`\n${failures.length} UI smoke failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`\n27 UI smoke contracts passed`);
