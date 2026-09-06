// A known failing physiological criterion is NOT a passing model test.
export function evaluateAuditResults(results, expectations, { strict = false } = {}) {
  const finite = value => {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Non-finite audit measurement');
    if (value && typeof value === 'object') Object.values(value).forEach(finite);
  };
  finite(results);
  const actual = new Set();
  const evaluated = results.map(result => {
    if (!result || actual.has(result.id) || typeof result.satisfied !== 'boolean') {
      throw new Error('Malformed or duplicate audit result');
    }
    actual.add(result.id);
    const expected = expectations[result.id];
    if (!['open', 'resolved'].includes(expected)) throw new Error(`Unregistered audit: ${result.id}`);
    const status = expected === 'resolved'
      ? result.satisfied ? 'PASS' : 'REGRESSION'
      : result.satisfied ? 'UNEXPECTED_PASS' : 'KNOWN_FAILURE';
    return { ...result, expected, status };
  });
  if (Object.keys(expectations).some(id => !actual.has(id))) throw new Error('Missing audit result');
  return { results: evaluated, ok: evaluated.every(result => result.status === 'PASS'
    || (!strict && result.status === 'KNOWN_FAILURE')) };
}
