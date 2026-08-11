// Dependency-free test entry point:
//
//   node tests/run.mjs
//
// Suites are imported in a stable order so the report remains easy to scan.
// The shared support module contains a deliberately tiny reporting harness; no
// test framework is installed and none of this code enters the browser app.

import { finish } from './support/model.mjs';

const SUITES = [
  './suites/safety.test.mjs',
  './suites/core-physiology.test.mjs',
  './suites/regulation-and-transit.test.mjs',
  './suites/circulation.test.mjs',
  './suites/lung-mechanics.test.mjs',
  './suites/recruitment.test.mjs',
  './suites/contracts.test.mjs',
];

for (const suite of SUITES) await import(suite);

finish();
