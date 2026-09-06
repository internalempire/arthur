// Reproducible whole-heart response report. Run with an output JSON path.
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cardiacResponseCurve } from '../../src/model/cardiac-response.js';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';

const output = process.argv[2];
if (!output) throw new Error('Usage: node tools/experiments/guyton-response.mjs output.json');
const healthy = SCENARIO_BY_ID.get('healthy-vcv').params;
const results = {};
for (const [name, params, options] of [
  ['reference', healthy, { scales: [0.4, 0.6, 1] }],
  ['weakerLVWithSameBoundaries', healthy, { scales: [0.4, 0.6], heartOverrides: { eesLv: 0.6 } }],
  ['lvFailure', SCENARIO_BY_ID.get('lv-failure').params, {}],
]) {
  results[name] = cardiacResponseCurve(params, options);
  console.log(`${name}: ${results[name].samples.filter(s => s.valid).length}/${results[name].samples.length} valid points`);
}
const hash = file => createHash('sha256').update(readFileSync(new URL(file, import.meta.url))).digest('hex');
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  node: process.version,
  hashes: Object.fromEntries(['../../src/model/cardiac-response.js', '../../src/model/circulation.js',
    '../../src/model/simulator.js'].map(file => [file, hash(file)])),
  method: 'Controlled RA inflow; atmospheric RAP and integrated aortic output; fixed reference boundaries',
  results,
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
