const OPEN = /<!--\s*CONSISTENCY:\s*([a-z0-9-]+)\s*-->/g;
const CLOSE = /<!--\s*\/CONSISTENCY\s*-->/g;
const CLAIM = /<!--\s*CONSISTENCY:\s*([a-z0-9-]+)\s*-->([^]*?)<!--\s*\/CONSISTENCY\s*-->/g;

const normalizeValue = (value) => String(value)
  .replace(/<[^>]+>/g, '')
  .replace(/[\s*_`]+/g, ' ')
  .trim()
  .toLowerCase();

/**
 * Check marked, user-visible facts repeated across manual pages.
 *
 * The text between paired comments is the text readers see. Reusing an id says
 * those spans must agree; selected ids can additionally be anchored to model
 * constants by `expected`. Unmarked prose remains outside semantic linting.
 */
export function consistencyErrors(documents, expected = {}) {
  const errors = [];
  const claims = new Map();

  for (const [file, source] of documents) {
    const opens = [...source.matchAll(OPEN)];
    const closes = [...source.matchAll(CLOSE)];
    const matches = [...source.matchAll(CLAIM)];
    if (opens.length !== closes.length || matches.length !== opens.length) {
      errors.push(`${file} — malformed or nested CONSISTENCY marker`);
      continue;
    }
    for (const match of matches) {
      const [, id, visible] = match;
      const value = normalizeValue(visible);
      if (!value) {
        errors.push(`${file} — CONSISTENCY:${id} has no visible value`);
        continue;
      }
      if (!claims.has(id)) claims.set(id, []);
      claims.get(id).push({ file, value });
    }
  }

  for (const [id, entries] of claims) {
    const files = new Set(entries.map(({ file }) => file));
    if (files.size < 2) {
      errors.push(`CONSISTENCY:${id} appears in only one manual page`);
      continue;
    }
    const values = new Map();
    for (const entry of entries) {
      if (!values.has(entry.value)) values.set(entry.value, []);
      values.get(entry.value).push(entry.file);
    }
    if (values.size > 1) {
      errors.push(`CONSISTENCY:${id} disagrees: ${[...values]
        .map(([value, valueFiles]) => `"${value}" in ${[...new Set(valueFiles)].join(', ')}`)
        .join('; ')}`);
    }
    if (Object.hasOwn(expected, id)) {
      const wanted = normalizeValue(expected[id]);
      for (const [value, valueFiles] of values) {
        if (value !== wanted) {
          errors.push(`CONSISTENCY:${id} is "${value}" in ${[...new Set(valueFiles)].join(', ')}, `
            + `but the model source says "${wanted}"`);
        }
      }
    }
  }

  for (const id of Object.keys(expected)) {
    if (!claims.has(id)) errors.push(`CONSISTENCY:${id} has a model anchor but no manual spans`);
  }
  return errors;
}
