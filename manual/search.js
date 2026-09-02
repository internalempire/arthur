// Pure full-text search helpers shared by the browser and Node smoke tests.

export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function excerptFor(page, tokens, length = 180) {
  const body = String(page.body ?? '').trim();
  if (!body) return page.blurb;
  const normalized = normalizeSearch(body);
  const at = Math.max(0, ...tokens.map((token) => normalized.indexOf(token)));
  // Normalisation preserves ordinary character positions closely enough for a
  // navigation excerpt. Clamp around the match rather than pretending this is
  // a byte-accurate source location.
  const start = Math.max(0, at - Math.floor(length / 3));
  const raw = body.slice(start, start + length).trim();
  return `${start > 0 ? '…' : ''}${raw}${start + length < body.length ? '…' : ''}`;
}

export function searchPages(pages, query, limit = 12) {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];

  return pages.map((page, order) => {
    const title = normalizeSearch(page.title);
    const blurb = normalizeSearch(page.blurb);
    const body = normalizeSearch(page.body);
    const all = `${title} ${blurb} ${body}`;
    if (!tokens.every((token) => all.includes(token))) return null;
    const score = tokens.reduce((total, token) => total
      + (title.includes(token) ? 8 : 0)
      + (blurb.includes(token) ? 3 : 0)
      + (body.includes(token) ? 1 : 0), 0);
    return { ...page, score, order, excerpt: excerptFor(page, tokens) };
  }).filter(Boolean)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit);
}
