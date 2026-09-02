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
import {
  evaluateRecruitmentCohort, RECRUITMENT_COHORT_PHENOTYPE,
} from '../tests/support/recruitment-cohort.mjs';

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

export const HYSTERESIS_EXAMPLE = Object.freeze({
  parameters: Object.freeze({
    mode: 'vcv', pmus: 0, vt: 250, rr: 20,
    clung: 45, collapsed: 0.45, riRatio: 0.6,
    hysteresis: 'on', pOpen: 25, pClose: 6,
  }),
  baselinePeep: 10,
  manoeuvrePeep: 35,
  rungs: Object.freeze([6, 8, 10, 12, 14, 18, 22, 26, 30, 34]),
});

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
    label: 'aerated-lung compliance 40 mL/cmH₂O, 42% collapsed, achieved R/I 0.70, transpulmonary opening midpoint 17.6 cmH₂O; VT 600 mL; PEEP 2',
    overrides: {
      clung: 40, collapsed: 0.42, riRatio: 0.7, pOpen: 17.6, hysteresis: 'off',
      vt: 600, peep: 2,
    },
  },
  {
    id: 'recruiting-high',
    title: 'The same lung, held open',
    label: 'the same recruitable lung; VT 600 mL; PEEP 14',
    overrides: {
      clung: 40, collapsed: 0.42, riRatio: 0.7, pOpen: 17.6, hysteresis: 'off',
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
  { file: 'manual/pulmonary-artery-wedge-pressure.md', ids: ['wedge-peep-examples'] },
  { file: 'manual/scenarios.md', ids: ['swing-scenario', 'ards-scenario', 'scenario-overrides'] },
  { file: 'manual/baroreflex.md', ids: ['baroreflex-septic'] },
  { file: 'manual/recruitment-and-ri.md', ids: ['ri-cohort-mapping'] },
  { file: 'manual/hysteresis.md', ids: ['hysteresis-example'] },
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
    '*Executable setup: passive volume control, VT 500 mL, 14/min; each PEEP level is settled for 45 s. Right atrial pressure is averaged over the most recent complete respiratory cycle, as in the filled simulated-mean point on the Guyton panel.*',
    '',
    '| PEEP (cmH₂O) | P<sub>msf</sub> (mmHg) | mean P<sub>ra</sub> (mmHg) | cardiac output (L/min) |',
    '|---:|---:|---:|---:|',
    ...rows.map(({ peep, metrics }) => `| ${peep} | ${fixed(metrics.pmsf, 1)} | ${fixed(metrics.respiratoryOperatingPoint.pra, 1)} | ${fixed(metrics.co, 2)} |`),
  ].join('\n');
}

function wedgeExampleState(overrides, peep) {
  const simulator = settledSimulator({ ...overrides, peep });
  return {
    metrics: simulator.metrics,
    meanPpl: simulator.ema.ppl,
    laVolume: simulator.circ.vLa,
  };
}

function wedgeExampleDetails(title, setup, overrides, peepLevels, conclusion) {
  const states = peepLevels.map((peep) => ({
    peep,
    ...wedgeExampleState(overrides, peep),
  }));
  return [
    '<details>',
    `<summary>${title}</summary>`,
    '',
    `*${setup} Each PEEP level is settled independently for ${SETTLING_SECONDS} s.*`,
    '',
    '| PEEP (cmH₂O) | wedge surrogate (mmHg) | mean Ppl (mmHg) | mean Pperi (mmHg) | LA transmural (mmHg) | LA volume (mL) | LVEDV (mL) | CO (L/min) | zone 3 index |',
    '|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...states.map(({ peep, metrics, meanPpl, laVolume }) => `| ${peep} | ${fixed(metrics.paop, 1)} | ${fixed(meanPpl, 1)} | ${fixed(metrics.pPeri, 1)} | ${fixed(metrics.laTransmural, 1)} | ${Math.round(laVolume)} | ${Math.round(metrics.lvEdv)} | ${fixed(metrics.co, 2)} | ${Math.round(metrics.zone3 * 100)}% |`),
    '',
    conclusion(states),
    '',
    '</details>',
  ].join('\n');
}

function wedgePeepExamplesBlock() {
  const passive = { mode: 'vcv', pmus: 0, vt: 450, rr: 14 };
  const lvFailure = SCENARIOS.find(({ id }) => id === 'lv-failure');
  if (!lvFailure) throw new Error('wedge examples: LV failure scenario is missing');

  return [
    wedgeExampleDetails(
      'Example 1 — normal passive circulation: the wedge rises while filling falls',
      'Passive volume control, VT 450 mL and 14/min.',
      passive,
      [0, 15],
      ([zero, high]) => `The wedge surrogate rises by ${fixed(high.metrics.paop - zero.metrics.paop, 1)} mmHg, but LA transmural pressure falls by ${fixed(zero.metrics.laTransmural - high.metrics.laTransmural, 1)} mmHg and LVEDV falls by ${Math.round(zero.metrics.lvEdv - high.metrics.lvEdv)} mL. The higher atmospheric pressure therefore reflects external pressure transmission, not greater left-heart filling. At PEEP 15 the zone 3 index also removes an unqualified catheter-like interpretation.`,
    ),
    '',
    wedgeExampleDetails(
      'Example 2 — stiff chest wall: stronger pressure transmission and preload loss',
      'The same passive breath with chest-wall compliance reduced to 75 mL/cmH₂O.',
      { ...passive, ccw: 75 },
      [0, 15],
      ([zero, high]) => `The stiffer thoracic envelope transmits a larger pressure rise around the heart. LA transmural pressure falls by ${fixed(zero.metrics.laTransmural - high.metrics.laTransmural, 1)} mmHg, LVEDV by ${Math.round(zero.metrics.lvEdv - high.metrics.lvEdv)} mL and output by ${fixed(zero.metrics.co - high.metrics.co, 2)} L/min despite the higher wedge surrogate.`,
    ),
    '',
    wedgeExampleDetails(
      'Example 3 — LV failure: PEEP can lower congestion and raise output',
      'The LV-failure preset, compared at PEEP 0 and 10 cmH₂O.',
      lvFailure.params,
      [0, 10],
      ([zero, high]) => `Here the wedge surrogate falls by ${fixed(zero.metrics.paop - high.metrics.paop, 1)} mmHg while output rises by ${fixed(high.metrics.co - zero.metrics.co, 2)} L/min. This is not recruitment of preload: it is the preset's intended afterload-dominant response, in which higher pleural pressure reduces the transmural load faced by the failing LV.`,
    ),
    '',
    wedgeExampleDetails(
      'Example 4 — severe underfilling: the number remains visible after its catheter meaning weakens',
      'The normal passive setup with stressed volume reduced to 300 mL.',
      { ...passive, stressedVolume: 300 },
      [0, 15],
      ([zero, high]) => `The wedge surrogate rises by ${fixed(high.metrics.paop - zero.metrics.paop, 1)} mmHg while LA transmural pressure, LVEDV and output all fall. The zone 3 index is already ${Math.round(zero.metrics.zone3 * 100)}% at zero PEEP and falls further with PEEP, so both wedge and derived PVR must be read with caution throughout this comparison.`,
    ),
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

function swingScenarioBlock() {
  const scenario = SCENARIOS.find(({ id }) => id === 'swing-limited-reserve');
  if (!scenario) throw new Error('swing example: scenario is missing');
  const metrics = settled(scenario.params);
  return [
    '*Executable preset output after 45 s of settling.*',
    '',
    '| inspiratory effort (cmH₂O) | delivered VT (mL) | minute ventilation (L/min) | pleural swing (cmH₂O) | preload reserve (% output/mmHg) |',
    '|---:|---:|---:|---:|---:|',
    `| ${fixed(scenario.params.pmus, 0)} | ${Math.round(metrics.vtDelivered)} | ${fixed(metrics.minuteVentilation, 1)} | ${fixed(metrics.pplSwing, 1)} | ${fixed(metrics.preload.relative * 100, 1)} |`,
  ].join('\n');
}

function ardsScenarioState(overrides) {
  const scenario = SCENARIOS.find(({ id }) => id === 'ards-rv');
  if (!scenario) throw new Error('ARDS example: scenario is missing');
  const simulator = settledSimulator({ ...scenario.params, ...overrides });
  const metrics = simulator.metrics;
  const endExpiratoryPpl = chestWallPressure(
    simulator.params, metrics.endExpiratoryVolume,
  );
  return {
    metrics,
    endExpiratoryPpl,
    endExpiratoryPl: metrics.totalPeep - endExpiratoryPpl,
  };
}

function ardsScenarioBlock() {
  const states = [
    ['recruitable baseline', { peep: 12 }],
    ['recruitable, high PEEP', { peep: 20 }],
    ['non-recruitable, high PEEP', { peep: 20, riRatio: 0 }],
  ].map(([label, overrides]) => ({ label, ...ardsScenarioState(overrides) }));
  return [
    '*Executable preset outputs after 45 s of settling. End-expiratory Ppl is read from the selected chest-wall relation at measured EELV; PL is total PEEP minus that pressure.*',
    '',
    '| state | EELV (L) | end-expiratory Ppl / PL (cmH₂O) | plateau (cmH₂O) | achieved R/I | open lung | derived PVR (WU) | RV/LV | CO (L/min) |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...states.map(({ label, metrics, endExpiratoryPpl, endExpiratoryPl }) => `| ${label} | ${fixed(metrics.endExpiratoryVolume, 2)} | ${fixed(endExpiratoryPpl, 1)} / ${fixed(endExpiratoryPl, 1)} | ${fixed(metrics.pplat, 1)} | ${fixed(metrics.riRatio, 2)} | ${Math.round(metrics.openFraction * 100)}% | ${fixed(metrics.pvrDerivedWood, 1)} | ${fixed(metrics.rvLvRatio, 2)} | ${fixed(metrics.co, 2)} |`),
  ].join('\n');
}

function baroreflexSepticBlock() {
  const scenario = SCENARIOS.find(({ id }) => id === 'septic-responder');
  if (!scenario) throw new Error('baroreflex example: septic scenario is missing');
  const states = [
    ['off', false],
    ['on', true],
  ].map(([label, baroreflexEnabled]) => ({
    label,
    metrics: settled({ ...scenario.params, baroreflexEnabled }),
  }));
  return [
    '*Executable septic-preset output after 45 s of settling; the two rows change the baroreflex switch only.*',
    '',
    '| aggregate baroreflex | cardiac output (L/min) | MAP (mmHg) | effective heart rate (/min) | effective SVR (mmHg·s/mL) |',
    '|---|---:|---:|---:|---:|',
    ...states.map(({ label, metrics }) => `| ${label} | ${fixed(metrics.co, 2)} | ${fixed(metrics.map, 1)} | ${fixed(metrics.effectiveHr, 0)} | ${fixed(metrics.effectiveSvr, 2)} |`),
  ].join('\n');
}

function recruitmentCohortBlock() {
  const groups = evaluateRecruitmentCohort();
  const phenotype = RECRUITMENT_COHORT_PHENOTYPE;
  return [
    `*Executable shared phenotype: collapsed compartment ${Math.round(phenotype.collapsed * 100)}%, aerated-lung compliance ${phenotype.clung} mL/cmH\u2082O, maximum capacity ${fixed(phenotype.lungCapacity, 1)} L, chest-wall compliance ${phenotype.ccw} mL/cmH\u2082O, no external wall load and diseased opening midpoint ${phenotype.pOpen} cmH\u2082O. Only the cohort median R/I changes between rows.*`,
    '',
    '| cohort group | requested / achieved R/I | latent openable share of diseased compartment | latent openable share of whole lung | recruited volume, model / observed IQR (mL) | low-PEEP C<sub>L</sub>, model / observed IQR | high-PEEP C<sub>L</sub>, model / observed IQR |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...groups.map((group) => `| ${group.label} | ${fixed(group.riRatio, 2)} / ${fixed(group.calibration.achieved, 2)} | ${Math.round(group.calibration.openableFraction * 100)}% | ${Math.round(group.wholeLungOpenableFraction * 100)}% | ${Math.round(group.calibration.assessment.recruitedVolume)} / ${group.recruitedVolume[0]}\u2013${group.recruitedVolume[1]} | ${Math.round(group.lowPeepLungCompliance)} / ${group.lowPeepLungCompliance[0]}\u2013${group.lowPeepLungCompliance[1]} | ${Math.round(group.highPeepLungCompliance)} / ${group.highPeepLungCompliance[0]}\u2013${group.highPeepLungCompliance[1]} |`),
  ].join('\n');
}

export function runHysteresisExample() {
  const config = HYSTERESIS_EXAMPLE;
  const manoeuvre = (tidalVolume) => {
    const simulator = settledSimulator({
      ...config.parameters, vt: tidalVolume, peep: config.baselinePeep,
    });
    const before = {
      open: simulator.metrics.openFraction,
      pvr: simulator.metrics.pvrCoefficientWood,
    };
    simulator.setParam('peep', config.manoeuvrePeep);
    simulator.advance(30, true);
    simulator.setParam('peep', config.baselinePeep);
    simulator.advance(45, true);
    return {
      before,
      after: {
        open: simulator.metrics.openFraction,
        pvr: simulator.metrics.pvrCoefficientWood,
      },
    };
  };

  const simulator = settledSimulator({
    ...config.parameters, peep: config.rungs[0],
  });
  const incremental = new Map();
  const decremental = new Map();
  for (const peep of config.rungs) {
    simulator.setParam('peep', peep);
    simulator.advance(30, true);
    incremental.set(peep, {
      pl: simulator.resp.plSolved,
      open: simulator.metrics.openFraction,
    });
  }
  for (const peep of [...config.rungs].reverse()) {
    simulator.setParam('peep', peep);
    simulator.advance(30, true);
    decremental.set(peep, {
      pl: simulator.resp.plSolved,
      open: simulator.metrics.openFraction,
    });
  }
  return { held: manoeuvre(250), largerBreath: manoeuvre(400), incremental, decremental };
}

function hysteresisExampleBlock() {
  const result = runHysteresisExample();
  const rows = [6, 8, 10, 14, 22];
  const gain = (result.held.after.open - result.held.before.open) * 100;
  const largerGain = (result.largerBreath.after.open - result.largerBreath.before.open) * 100;
  return [
    `*Executable setup: volume control, VT 250 mL, 20/min, aerated-lung compliance 45 mL/cmH₂O, 45% collapsed, achieved R/I 0.60, opening midpoint ${HYSTERESIS_EXAMPLE.parameters.pOpen} cmH₂O and closing midpoint ${HYSTERESIS_EXAMPLE.parameters.pClose} cmH₂O. After settling at PEEP ${HYSTERESIS_EXAMPLE.baselinePeep}, PEEP is raised to ${HYSTERESIS_EXAMPLE.manoeuvrePeep} for 30 s and returned to ${HYSTERESIS_EXAMPLE.baselinePeep}.*`,
    '',
    '| | before | after |',
    '|---|---:|---:|',
    `| lung open | ${fixed(result.held.before.open * 100, 1)}% | **${fixed(result.held.after.open * 100, 1)}%** |`,
    `| pulmonary resistance coefficient | ${fixed(result.held.before.pvr, 2)} WU | ${fixed(result.held.after.pvr, 2)} WU |`,
    '',
    `At the same final PEEP, ${fixed(gain, 1)} percentage points more lung remain open. Within the model, the larger aerated fraction also lowers the pulmonary resistance coefficient.`,
    '',
    '![Open fraction during an incremental and decremental PEEP sequence](figure/hysteresis.svg)',
    '',
    '| PEEP | incremental: P<sub>l</sub> / open | decremental: P<sub>l</sub> / open |',
    '|---|---:|---:|',
    ...rows.map((peep) => {
      const up = result.incremental.get(peep);
      const down = result.decremental.get(peep);
      return `| ${peep} cmH₂O | ${fixed(up.pl, 1)} / ${fixed(up.open * 100, 1)}% | ${fixed(down.pl, 1)} / **${fixed(down.open * 100, 1)}%** |`;
    }),
    '',
    `Increasing tidal volume from 250 to 400 mL leaves a ${fixed(largerGain, 1)}-point gain after the manoeuvre because the preceding breaths had already recruited more of the available compartment. This is a model illustration, not a recommendation to use a larger tidal volume.`,
  ].join('\n');
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
    ['wedge-peep-examples', wedgePeepExamplesBlock()],
    ['cardiac-tamponade', cardiacTamponadeBlock()],
    ['ivc-respiratory-calibre', ivcRespiratoryBlock()],
    ['swing-scenario', swingScenarioBlock()],
    ['ards-scenario', ardsScenarioBlock()],
    ['baroreflex-septic', baroreflexSepticBlock()],
    ['ri-cohort-mapping', recruitmentCohortBlock()],
    ['hysteresis-example', hysteresisExampleBlock()],
    ['scenario-overrides', scenarioOverridesBlock()],
  ]);
}
