// Regenerate or verify numerical Markdown blocks against the current model.
//
//   node manual/tools/examples.mjs --write
//   node manual/tools/examples.mjs --check

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  DOCUMENTED_EXAMPLE_TARGETS, renderDocumentedExampleBlocks,
} from '../model-examples.mjs';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] ?? '--check';

if (!['--check', '--write'].includes(mode)) {
  console.error('usage: node manual/tools/examples.mjs [--check|--write]');
  process.exit(2);
}

const marker = (side, id) => `<!-- ${side} GENERATED: ${id} -->`;
const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function replaceGeneratedBlock(source, id, body) {
  const begin = marker('BEGIN', id);
  const end = marker('END', id);
  const pattern = new RegExp(`${escaped(begin)}\\n[\\s\\S]*?\\n${escaped(end)}`, 'g');
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`${id}: expected one generated region, found ${matches.length}`);
  }
  return source.replace(pattern, `${begin}\n${body}\n${end}`);
}

const blocks = renderDocumentedExampleBlocks();
const stale = [];
let checked = 0;

for (const target of DOCUMENTED_EXAMPLE_TARGETS) {
  const path = join(PROJECT_ROOT, target.file);
  const source = readFileSync(path, 'utf8');
  let expected = source;
  try {
    for (const id of target.ids) {
      const body = blocks.get(id);
      if (!body) throw new Error(`${id}: no renderer exists`);
      expected = replaceGeneratedBlock(expected, id, body);
      checked++;
    }
  } catch (error) {
    console.error(`${target.file} — ${error.message}`);
    process.exit(1);
  }

  if (expected === source) continue;
  if (mode === '--write') writeFileSync(path, expected);
  else stale.push(target.file);
}

if (mode === '--write') {
  console.log(`${checked} generated documentation block(s) updated`);
} else if (stale.length) {
  console.error(`generated documentation is stale: ${stale.join(', ')}`);
  console.error('run: npm run manual:examples');
  process.exit(1);
} else {
  console.log(`${checked} generated documentation block(s) agree with the current model`);
}
