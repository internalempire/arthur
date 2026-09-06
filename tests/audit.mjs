import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { evaluateAuditResults } from './support/audit-status.mjs';
import { cardiacAudit, pressureDomainAudit, activationAudit, respiratoryAudit, venousAudit } from './support/audit-probes.mjs';
const expectations = JSON.parse(readFileSync(new URL('./audit-expectations.json', import.meta.url), 'utf8'));
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => arg !== '--strict')) throw new Error('Supported option: --strict');
const results = [];
for (const probe of [cardiacAudit, pressureDomainAudit, activationAudit, respiratoryAudit, venousAudit]) {
  results.push(...[probe()].flat());
}
const evaluated = evaluateAuditResults(results, expectations, { strict: args.has('--strict') });
for (const result of evaluated.results) console.log(`${result.status} ${result.id}: ${JSON.stringify(result.measurements)}`);
let commit = 'unavailable';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
const report = { commit, node: process.version, ...evaluated };
if (process.env.ARTHUR_AUDIT_REPORT) writeFileSync(process.env.ARTHUR_AUDIT_REPORT, JSON.stringify(report, null, 2) + '\n');
const known = evaluated.results.filter(r => r.status === 'KNOWN_FAILURE').length;
console.log(`${known} known unresolved criteria; these are not passing physiological checks.`);
if (!evaluated.ok) process.exitCode = 1;
