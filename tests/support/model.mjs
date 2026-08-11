// Shared test vocabulary and model imports.
//
// The application remains dependency-free vanilla JavaScript. This deliberately
// small harness keeps the physiological setup helpers identical across domain
// suites without introducing a test framework or application dependency.

import { readFileSync } from 'node:fs';
import { Simulator, DEFAULT_DT } from '../../src/model/simulator.js';
import { SCENARIOS } from '../../src/model/scenarios.js';
import { PARAMETERS, defaultParams } from '../../src/model/parameters.js';
import {
  venousReturnCurve, cardiacFunctionCurve, venousReturnFlow,
  preloadSensitivity, preloadLimbs, curveIntersection, PRELOAD_STEEP,
  systemicVenousVolumeState, PULMONARY_TRANSIT,
} from '../../src/model/circulation.js';
import { applyBaroreflex, BARO } from '../../src/model/baroreflex.js';
import {
  pvrComponents, lungRegions, transpulmonaryAt, relaxationVolume, openFractionAt,
  lungVolumeAtPl, lungComplianceAt, openBand, stepOpenFraction,
  staticEndExpiratoryVolume, calibrateRecruitmentToInflation,
  recruitmentToInflation,
} from '../../src/model/lung.js';
import { SNAPSHOTS } from '../snapshots.js';
import { LITERATURE } from '../literature.mjs';

export {
  Simulator, DEFAULT_DT, SCENARIOS, PARAMETERS, defaultParams,
  venousReturnCurve, cardiacFunctionCurve, venousReturnFlow,
  preloadSensitivity, preloadLimbs, curveIntersection, PRELOAD_STEEP,
  systemicVenousVolumeState, PULMONARY_TRANSIT,
  applyBaroreflex, BARO,
  pvrComponents, lungRegions, transpulmonaryAt, relaxationVolume, openFractionAt,
  lungVolumeAtPl, lungComplianceAt, openBand, stepOpenFraction,
  staticEndExpiratoryVolume, calibrateRecruitmentToInflation,
  recruitmentToInflation, readFileSync, SNAPSHOTS, LITERATURE,
};

let currentSection = '';
let passed = 0;
const failures = [];

/** Prefix every assertion with its physiological domain inside the test report. */
export function section(name) {
  currentSection = name;
  console.log(`\n${name}`);
}

/** Record one independently named physiological or numerical assertion. */
export function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  pass  ${name}`);
    return;
  }
  failures.push(`${currentSection} / ${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  // A domain suite can also be run directly while debugging; it must still
  // return a failing process even when the aggregate runner never calls finish.
  process.exitCode = 1;
}

/** Print one final summary and fail the process after every suite has run. */
export function finish() {
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (!failures.length) return;
  console.log('\nFailures:');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
}

export const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;

export function settled(overrides = {}, seconds = 30, opts = {}) {
  const simulator = new Simulator(opts);
  simulator.params = { ...defaultParams(), ...overrides };
  simulator.reset();
  simulator.advance(seconds, true);
  return simulator;
}

export const COMPARTMENTS = [
  'vSa', 'vSv', 'vRa', 'vRv', 'vPa', 'vPt', 'vPv', 'vLa', 'vLv',
];

export const totalVolume = (circulation) =>
  COMPARTMENTS.reduce((total, key) => total + circulation[key], 0);
