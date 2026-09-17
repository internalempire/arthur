// Explicit, offline recovery only. All model imports resolve inside this archive.
import { readFileSync, writeFileSync } from 'node:fs';
import { parsePatientState, createPatientState } from './patient-state.js';
const [input, output, ...extra] = process.argv.slice(2);
if (!input || !output || extra.length) throw new Error('Usage: node tools/archive/ri/convert-patient.mjs input-v1.json output-v2.json');
const candidate = JSON.parse(readFileSync(input, 'utf8'));
if (candidate.version !== 1) throw new Error('This recovery tool accepts version-1 patient files only.');
const result = parsePatientState(candidate);
const saved = createPatientState(result.params, candidate.savedAt ?? new Date().toISOString());
// Never overwrite either the original or an existing destination.
writeFileSync(output, JSON.stringify(saved, null, 2) + '\n', { flag: 'wx' });
if (result.ignored.length) console.warn(`Ignored unknown settings: ${result.ignored.join(', ')}`);
console.log(`Converted to version 2: ${output}`);
