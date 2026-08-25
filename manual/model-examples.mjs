// Executable source of truth for numerical examples quoted in the manual.
// Documentation tables previously contained values copied from one
// model revision; they could remain plausible after the model changed. Keep the
// manoeuvre, its parameters, formatting and prose-facing label together here.
// The writer and test suite both regenerate these blocks from a fresh Simulator.

import { Simulator } from '../src/model/simulator.js';
import { defaultParams, GROUPS, PARAMETERS } from '../src/model/parameters.js';
import { SCENARIOS } from '../src/model/scenarios.js';
import {
  lungVolumeAtPl, staticEndExpiratoryVolume, relaxationVolume,
  chestWallPressure, transpulmonaryAt,
} from '../src/model/lung.js';
import { ivcDisplayWidth } from '../src/ui/panels/thorax.js';

const SETTLING_SECONDS = 45;

function settledSimulator(overrides) {
  const simulator = new Simulator();
  simulator.params = { ...defaultParams(), ...overrides };
  simulator.reset();
  simulator.advance(SETTLING_SECONDS, true);
  return simulator;
}

function settled(overrides) {
  return settledSimulator(overrides).metrics;
}

export const EFL_EXAMPLE = {
  parameters: {
    mode: 'vcv', pmus: 0, vt: 500, rr: 26, ti: 0.9,
    raw: 24, clung: 300, efl: 'on',
  },
  peepLevels: [0, 5, 6, 8, 10, 13],
};

export const STRESS_INDEX_BASE = {
  mode: 'vcv', pmus: 0, rr: 14, ti: 1.2,
};

// These cases also drive the stress-index SVG. The first comparison changes
// maximum capacity without changing tissue compliance, so upper-limb curvature
// is no longer manufactured by making a low-compliance lung artificially small.
export const STRESS_INDEX_CASES = [
  {
    id: 'normal-500',
    title: 'Normal',
    label: 'normal aerated-lung compliance 200 mL/cmH₂O, no collapse; VT 500 mL; PEEP 8',
    overrides: { clung: 200, collapsed: 0, vt: 500, peep: 8 },
  },
  {
    id: 'small-lung-900',
    title: 'Over-distension',
    label: 'maximum lung capacity 4.0 L, aerated-lung compliance 200 mL/cmH₂O, no collapse; VT 900 mL; PEEP 8',
    overrides: { lungCapacity: 4, clung: 200, collapsed: 0, vt: 900, peep: 8 },
  },
  {
    id: 'small-lung-350',
    title: 'Same lung, lower VT',
    label: 'the same 4.0 L maximum-capacity lung; VT 350 mL; PEEP 8',
    overrides: { lungCapacity: 4, clung: 200, collapsed: 0, vt: 350, peep: 8 },
  },
  {
    id: 'recruiting-low',
    title: 'Tidal recruitment',
    label: 'aerated-lung compliance 40 mL/cmH₂O, 42% collapsed, achieved R/I 0.70, transpulmonary opening midpoint 21 cmH₂O; VT 600 mL; PEEP 2',
    overrides: {
      clung: 40, collapsed: 0.42, riRatio: 0.7, pOpen: 21, hysteresis: 'off',
      vt: 600, peep: 2,
    },
  },
  {
    id: 'recruiting-high',
    title: 'The same lung, held open',
    label: 'the same recruitable lung; VT 600 mL; PEEP 14',
    overrides: {
      clung: 40, collapsed: 0.42, riRatio: 0.7, pOpen: 21, hysteresis: 'off',
      vt: 600, peep: 14,
    },
  },
];

export const DOCUMENTED_EXAMPLE_TARGETS = [
  { file: 'manual/expiratory-flow-limitation.md', ids: ['efl-peep'] },
  { file: 'manual/stress-index.md', ids: ['stress-index'] },
  { file: 'manual/transmural-pressure.md', ids: ['transmural-peep'] },
  { file: 'manual/venous-return.md', ids: ['venous-return-peep'] },
  { file: 'manual/pressure-volume-curve.md', ids: ['pv-tissue', 'pv-eelv', 'lung-wall-equilibrium'] },
  { file: 'manual/pulmonary-transit.md', ids: ['pulmonary-transit'] },
  { file: 'manual/cardiac-tamponade.md', ids: ['cardiac-tamponade'] },
  { file: 'manual/inferior-vena-cava.md', ids: ['ivc-respiratory-calibre'] },
  { file: 'manual/pmsf-and-occlusions.md', ids: ['pmsf-occlusions'] },
  { file: 'manual/scenarios.md', ids: ['scenario-overrides'] },
];

const fixed = (value, digits) => value.toFixed(digits);

function eflBlock() {
  const rows = EFL_EXAMPLE.peepLevels.map((peep) => {
    const metrics = settled({ ...EFL_EXAMPLE.parameters, peep });
    return `| ${peep} | ${fixed(metrics.totalPeep, 1)} | ${Math.round(metrics.trappedVolume)} | ${fixed(metrics.endExpiratoryVolume, 2)} | ${fixed(metrics.co, 2)} |`;
  });
  return [
    '*Executable setup: passive volume control, VT 500 mL, 26/min, inspiratory time 0.9 s, airway resistance 24 cmH\u2082O\u00b7s/L, aerated-lung compliance 300 mL/cmH\u2082O, EFL on; each level is settled for 45 s.*',
    '',
    '| applied PEEP (cmH\u2082O) | total PEEP (cmH\u2082O) | dynamic trapped volume (mL) | end-expiratory volume (L) | cardiac output (L/min) |',
    '|---:|---:|---:|---:|---:|',
    ...rows,
  ].join('\n');
}

function stressRows() {
  return STRESS_INDEX_CASES.map((entry) => {
    const metrics = settled({ ...STRESS_INDEX_BASE, ...entry.overrides });
    // This is the conventional breathwise respiratory-system compliance shown
    // in the document, not the simulator's local differential-compliance metric.
    const breathwiseCrs = entry.overrides.vt / metrics.drivingPressure;
    return {
      ...entry,
      stressIndex: metrics.stressIndex,
      plateau: metrics.pplat,
      drivingPressure: metrics.drivingPressure,
      breathwiseCrs,
    };
  });
}

function stressIndexBlock(rows) {
  return [
    '*Executable setup: passive volume control, 14/min, inspiratory time 1.2 s; each case is settled for 45 s. Breathwise C<sub>rs</sub> is VT divided by driving pressure, not the model\'s local differential-compliance metric.*',
    '',
    '| lung and breath | stress index | plateau (cmH\u2082O) | driving pressure (cmH\u2082O) | breathwise C<sub>rs</sub> (mL/cmH\u2082O) |',
    '|---|---:|---:|---:|---:|',
    ...rows.map((entry) => `| ${entry.label} | ${fixed(entry.stressIndex, 2)} | ${fixed(entry.plateau, 1)} | ${fixed(entry.drivingPressure, 1)} | ${Math.round(entry.breathwiseCrs)} |`),
  ].join('\n');
}

function peepSweepRows() {
  const base = { mode: 'vcv', pmus: 0, vt: 500, rr: 14 };
  return [0, 5, 10, 15, 20].map((peep) => ({ peep, metrics: settled({ ...base, peep }) }));
}

function transmuralBlock(rows) {
  const first = rows[0].metrics;
  const last = rows.at(-1).metrics;
  const measuredChange = last.cvp - first.cvp;
  const transmuralChange = first.cvpTransmural - last.cvpTransmural;
  return [
    '*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s.*',
    '',
    '| PEEP (cmH₂O) | measured CVP (mmHg) | transmural CVP (mmHg) | cardiac output (L/min) |',
    '|---:|---:|---:|---:|',
    ...rows.map(({ peep, metrics }) => `| ${peep} | ${fixed(metrics.cvp, 1)} | ${fixed(metrics.cvpTransmural, 1)} | ${fixed(metrics.co, 2)} |`),
    '',
    `Across this sweep, measured CVP rises by ${fixed(measuredChange, 1)} mmHg while transmural CVP falls by ${fixed(transmuralChange, 1)} mmHg.`,
  ].join('\n');
}

function venousReturnBlock(rows) {
  return [
    '*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s. The displayed right atrial pressure is averaged over one cardiac cycle, as in the moving Guyton point; this suppresses cardiac pulsation but preserves respiratory movement.*',
    '',
    '| PEEP (cmH₂O) | P<sub>msf</sub> (mmHg) | mean P<sub>ra</sub> (mmHg) | cardiac output (L/min) |',
    '|---:|---:|---:|---:|',
    ...rows.map(({ peep, metrics }) => `| ${peep} | ${fixed(metrics.pmsf, 1)} | ${fixed(metrics.operatingPoint.pra, 1)} | ${fixed(metrics.co, 2)} |`),
  ].join('\n');
}

function pvTissueBlock() {
  const cases = [
    { clung: 200, lungCapacity: 6 },
    { clung: 100, lungCapacity: 6 },
    { clung: 45, lungCapacity: 6 },
    { clung: 100, lungCapacity: 4 },
    { clung: 100, lungCapacity: 8 },
  ];
  const rows = cases.map(({ clung, lungCapacity }) => {
    const parameters = { ...defaultParams(), clung, lungCapacity, collapsed: 0 };
    return {
      clung,
      lungCapacity,
      atFive: lungVolumeAtPl(parameters, 5, 1),
      atThirtyFive: lungVolumeAtPl(parameters, 35, 1),
      atHighPressure: lungVolumeAtPl(parameters, 400, 1),
    };
  });
  return [
    '*Direct evaluation of the fully open tissue relation (`collapsed = 0`, open fraction fixed to 1).*',
    '',
    '| aerated-lung compliance (mL/cmH₂O) | maximum capacity (L) | volume at P<sub>l</sub> 5 (L) | volume at P<sub>l</sub> 35 (L) | asymptotic volume (L) |',
    '|---:|---:|---:|---:|---:|',
    ...rows.map((row) => `| ${row.clung} | ${fixed(row.lungCapacity, 1)} | ${fixed(row.atFive, 2)} | ${fixed(row.atThirtyFive, 2)} | ${fixed(row.atHighPressure, 2)} |`),
  ].join('\n');
}

function pvEelvBlock() {
  const cases = [
    ['normal', {}],
    ['30% collapsed', { collapsed: 0.3 }],
    ['50% collapsed', { collapsed: 0.5 }],
    ['emphysematous, aerated-lung compliance 400 mL/cmH₂O', { clung: 400, collapsed: 0 }],
    ['smaller 4.0 L maximum-capacity lung', { lungCapacity: 4, collapsed: 0 }],
  ];
  return [
    '*Static respiratory-system equilibrium at applied PEEP 5 cmH₂O, with recruitment hysteresis off.*',
    '',
    '| phenotype | end-expiratory volume (L) |',
    '|---|---:|',
    ...cases.map(([label, overrides]) => {
      const parameters = { ...defaultParams(), ...overrides, hysteresis: 'off' };
      return `| ${label} | ${fixed(staticEndExpiratoryVolume(parameters, 5), 2)} |`;
    }),
  ].join('\n');
}

function lungWallEquilibriumBlock() {
  const cases = [
    ['normal reference', {}],
    ['collapsed, stiff and non-recruitable lung', {
      collapsed: 0.42, clung: 40, riRatio: 0, pOpen: 21,
    }],
    ['lost lung recoil', { clung: 300 }],
    ['normal lung with a 6 cmH₂O external wall load', { cwLoad: 6 }],
  ];
  return [
    '*Direct static solution at zero applied airway pressure. The passive volume is where lung and chest-wall recoil are equal and opposite.*',
    '',
    '| phenotype | passive volume (L) | chest-wall recoil P<sub>cw</sub> (cmH₂O) | transpulmonary recoil P<sub>l</sub> (cmH₂O) |',
    '|---|---:|---:|---:|',
    ...cases.map(([label, overrides]) => {
      const parameters = { ...defaultParams(), ...overrides, hysteresis: 'off' };
      const volume = relaxationVolume(parameters);
      return `| ${label} | ${fixed(volume, 2)} | ${fixed(chestWallPressure(parameters, volume), 1)} | ${fixed(transpulmonaryAt(parameters, volume), 1)} |`;
    }),
  ].join('\n');
}

function pulmonaryTransitBlock() {
  const common = {
    baroreflex: 0, mode: 'vcv', pmus: 0, vt: 450, peep: 5,
    rr: 18, ti: 1, hr: 75,
  };
  const cases = [
    ['reference circulation', common],
    ['pulmonary embolism', {
      ...common, pvrBase: 0.44, eesRv: 0.32, stressedVolume: 1050, svr: 1.25,
    }],
    ['congested low-output LV failure', {
      ...common, eesLv: 0.8, lvStiff: 0.04, stressedVolume: 950, svr: 1.25,
    }],
  ];
  return [
    '*Executable setup: passive volume control, HR 75/min, RR 18/min, VT 450 mL, inspiratory time 1.0 s and PEEP 5 cmH₂O; baroreflex disabled; each phenotype is settled for 45 s.*',
    '',
    '| phenotype | pulmonary blood volume (mL) | estimated PA-to-LA transit (s) | staged buffer (s) |',
    '|---|---:|---:|---:|',
    ...cases.map(([label, parameters]) => {
      const metrics = settled(parameters);
      return `| ${label} | ${Math.round(metrics.pulmonaryBloodVolume)} | ${fixed(metrics.pulmonaryTransitTime, 1)} | ${fixed(metrics.pulmonaryTransportTime, 1)} |`;
    }),
  ].join('\n');
}

export const OCCLUSION_EXAMPLE = Object.freeze({
  tidalVolumes: [300, 500, 700, 900],
  holdSeconds: 10,
  settlingBeforeProtocol: 20,
  settlingBetweenHolds: 10,
  advanceAfterHold: 16,
});

export function runOcclusionExample() {
  const simulator = new Simulator();
  simulator.advance(OCCLUSION_EXAMPLE.settlingBeforeProtocol, true);
  for (const tidalVolume of OCCLUSION_EXAMPLE.tidalVolumes) {
    simulator.setParam('vt', tidalVolume);
    simulator.advance(OCCLUSION_EXAMPLE.settlingBetweenHolds, true);
    simulator.startHold('inspiratory', OCCLUSION_EXAMPLE.holdSeconds);
    simulator.advance(OCCLUSION_EXAMPLE.advanceAfterHold, true);
  }

  const points = simulator.measuredPoints;
  const n = points.length;
  const sx = points.reduce((sum, point) => sum + point.pra, 0);
  const sy = points.reduce((sum, point) => sum + point.flow, 0);
  const sxx = points.reduce((sum, point) => sum + point.pra ** 2, 0);
  const sxy = points.reduce((sum, point) => sum + point.pra * point.flow, 0);
  const denominator = n * sxx - sx ** 2;
  const slope = (n * sxy - sx * sy) / denominator;
  const flowIntercept = (sy - slope * sx) / n;
  return {
    simulator,
    points,
    slope,
    pressureIntercept: -flowIntercept / slope,
    internalPmsf: simulator.metrics.pmsf,
  };
}

function pmsfOcclusionBlock() {
  const result = runOcclusionExample();
  return [
    `*Executable setup: inspiratory holds lasting ${OCCLUSION_EXAMPLE.holdSeconds} s follow delivered tidal volumes of ${OCCLUSION_EXAMPLE.tidalVolumes.join(', ')} mL. Only the final 40% of each hold is averaged.*`,
    '',
    '| delivered VT (mL) | hold airway pressure (cmH₂O) | mean right atrial pressure (mmHg) | venous return (L/min) |',
    '|---:|---:|---:|---:|',
    ...result.points.map((point, index) => `| ${OCCLUSION_EXAMPLE.tidalVolumes[index]} | ${fixed(point.airwayPressure, 2)} | ${fixed(point.pra, 2)} | ${fixed(point.flow, 2)} |`),
    '',
    `The fitted pressure–flow line has a slope of ${fixed(result.slope, 2)} L/min/mmHg and reaches zero flow at ${fixed(result.pressureIntercept, 1)} mmHg. The model's internal Pmsf after the protocol is ${fixed(result.internalPmsf, 1)} mmHg.`,
  ].join('\n');
}

function cardiacTamponadeBlock() {
  const scenario = SCENARIOS.find(({ id }) => id === 'cardiac-tamponade');
  const states = [
    ['constrained preset', scenario.params.pericardialCapacity],
    ['capacity restored', 430],
  ].map(([label, pericardialCapacity]) => ({
    label,
    capacity: pericardialCapacity,
    metrics: settled({ ...scenario.params, pericardialCapacity }),
  }));
  return [
    '*Executable setup: spontaneous breathing, inspiratory effort 10 cmH₂O, 20 breaths/min, selected heart rate 105/min, stressed volume 1,050 mL and pericardial gain 4×; each state is settled for 45 s. The second row changes pericardial capacity only.*',
    '',
    '| state | capacity (mL) | P<sub>peri</sub> (mmHg) | CVP (mmHg) | RV end-diastolic pressure (mmHg) | PA diastolic (mmHg) | wedge surrogate (mmHg) |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...states.map(({ label, capacity, metrics }) => `| ${label} | ${capacity} | ${fixed(metrics.pPeri, 1)} | ${fixed(metrics.cvp, 1)} | ${fixed(metrics.rvEdp, 1)} | ${fixed(metrics.papDia, 1)} | ${fixed(metrics.paop, 1)} |`),
    '',
    '| state | RV EDV (mL) | LV EDV (mL) | cardiac output (L/min) | MAP (mmHg) |',
    '|---|---:|---:|---:|---:|',
    ...states.map(({ label, metrics }) => `| ${label} | ${Math.round(metrics.rvEdv)} | ${Math.round(metrics.lvEdv)} | ${fixed(metrics.co, 2)} | ${fixed(metrics.map, 1)} |`),
  ].join('\n');
}

function ivcRespiratoryProfile(overrides) {
  const simulator = settledSimulator(overrides);
  const bins = Array.from({ length: 60 }, () => ({ volume: 0, n: 0 }));
  const period = 60 / simulator.params.rr;

  // Phase-bin many ordinary breaths so cardiac pulsation does not masquerade
  // as respiratory calibre change. This is the same spontaneous effort selected
  // by each preset, not a deep-inspiration or sniff manoeuvre.
  for (let i = 0; i < 3000; i++) {
    simulator.advance(0.01, true);
    const phase = (simulator.resp.tCycle % period) / period;
    const bin = bins[Math.min(bins.length - 1, Math.floor(phase * bins.length))];
    bin.volume += simulator.circ.vIVC;
    bin.n++;
  }

  const volumes = bins.filter(({ n }) => n > 0).map(({ volume, n }) => volume / n);
  const minimum = Math.min(...volumes);
  const maximum = Math.max(...volumes);
  const mean = volumes.reduce((sum, value) => sum + value, 0) / volumes.length;
  const minimumWidth = ivcDisplayWidth(minimum);
  const maximumWidth = ivcDisplayWidth(maximum);
  return {
    mean,
    volumeSwing: ((maximum - minimum) / mean) * 100,
    displayedCalibreChange: ((maximumWidth - minimumWidth) / maximumWidth) * 100,
  };
}

function ivcRespiratoryBlock() {
  const healthy = SCENARIOS.find(({ id }) => id === 'healthy-spont');
  const tamponade = SCENARIOS.find(({ id }) => id === 'cardiac-tamponade');
  const states = [
    ['healthy spontaneous preset', healthy.params],
    ['cardiac-tamponade preset', tamponade.params],
    ['same tamponade state, capacity restored', {
      ...tamponade.params, pericardialCapacity: 430,
    }],
  ].map(([label, parameters]) => ({
    label,
    profile: ivcRespiratoryProfile(parameters),
  }));

  return [
    '*Executable setup: each preset is settled for 45 s, then IVC volume is averaged by respiratory phase over 30 s. These are ordinary model breaths, not a deep-inspiration or sniff test.*',
    '',
    '| state | mean IVC volume (mL) | respiratory volume swing (% of mean) | change in displayed calibre (%) |',
    '|---|---:|---:|---:|',
    ...states.map(({ label, profile }) => `| ${label} | ${Math.round(profile.mean)} | ${fixed(profile.volumeSwing, 1)} | ${fixed(profile.displayedCalibreChange, 1)} |`),
  ].join('\n');
}

function scenarioValue(spec, value) {
  if (spec.type === 'choice') {
    return spec.options.find((option) => option.value === value)?.label ?? String(value);
  }
  if (spec.type === 'checkbox') return value ? 'On' : 'Off';
  if (spec.unit === 'fraction') return `${Math.round(value * 100)}%`;

  const stepText = String(spec.step ?? 1);
  const decimals = stepText.includes('.') ? stepText.split('.')[1].length : 0;
  const formatted = typeof value === 'number' ? value.toFixed(decimals) : String(value);
  return spec.unit ? `${formatted} ${spec.unit}` : formatted;
}

function scenarioOverridesBlock() {
  const reference = defaultParams();
  const groupNames = new Map(GROUPS.map(({ id, label }) => [id, label]));
  const known = new Set(PARAMETERS.map(({ id }) => id));

  const sections = SCENARIOS.flatMap((scenario) => {
    const unknown = Object.keys(scenario.params).filter((id) => !known.has(id));
    if (unknown.length) throw new Error(`${scenario.id}: undocumented parameters ${unknown.join(', ')}`);

    const changed = PARAMETERS.filter((spec) => Object.hasOwn(scenario.params, spec.id)
      && !Object.is(scenario.params[spec.id], reference[spec.id]));
    const heading = `#### ${scenario.name}`;
    if (!changed.length) {
      return [heading, '', '*No control differs from the model reference. This preset names the default passive volume-control state.*', ''];
    }

    return [
      heading,
      '',
      '| domain | control | model reference | preset value |',
      '|---|---|---:|---:|',
      ...changed.map((spec) => `| ${groupNames.get(spec.group)} | ${spec.label} | ${scenarioValue(spec, reference[spec.id])} | ${scenarioValue(spec, scenario.params[spec.id])} |`),
      '',
    ];
  });

  return [
    '*Generated directly from `defaultParams()` and `SCENARIOS`. The reference is the model\'s passive volume-control default, not the healthy spontaneous preset shown when the application opens.*',
    '',
    'Only values that actually differ from the reference are listed. A preset may repeat an unchanged value in the source code to make its intended ventilation explicit; such repetitions are omitted here because they do not alter the simulated patient.',
    '',
    ...sections,
  ].join('\n').trimEnd();
}

export function renderDocumentedExampleBlocks() {
  const rows = stressRows();
  const peepRows = peepSweepRows();
  return new Map([
    ['efl-peep', eflBlock()],
    ['stress-index', stressIndexBlock(rows)],
    ['transmural-peep', transmuralBlock(peepRows)],
    ['venous-return-peep', venousReturnBlock(peepRows)],
    ['pv-tissue', pvTissueBlock()],
    ['pv-eelv', pvEelvBlock()],
    ['lung-wall-equilibrium', lungWallEquilibriumBlock()],
    ['pulmonary-transit', pulmonaryTransitBlock()],
    ['pmsf-occlusions', pmsfOcclusionBlock()],
    ['cardiac-tamponade', cardiacTamponadeBlock()],
    ['ivc-respiratory-calibre', ivcRespiratoryBlock()],
    ['scenario-overrides', scenarioOverridesBlock()],
  ]);
}
