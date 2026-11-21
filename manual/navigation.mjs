// Pure navigation helpers for the manual viewer. Keeping hash parsing outside
// app.js makes the distinction between a page and an in-page anchor explicit
// and executable in the dependency-free test suite.

const ACRONYMS = new Map([
  ['ards', 'ARDS'], ['co', 'CO'], ['copd', 'COPD'], ['efl', 'EFL'],
  ['frc', 'FRC'], ['hpv', 'HPV'], ['ivc', 'IVC'], ['lv', 'LV'],
  ['pap', 'PAP'], ['pawp', 'PAWP'], ['peep', 'PEEP'], ['pmsf', 'Pmsf'],
  ['ppv', 'PPV'], ['pvr', 'PVR'], ['rv', 'RV'],
]);

const decode = (value) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

/** Split `#/page#section` without allowing the section to become a filename. */
export function parseManualHash(hash) {
  // An externally shared link can arrive as #%2Fpage%23section.
  // Split at the first separator, then decode the page and section separately.
  const route = String(hash ?? '').replace(/^#(?:\/|%2f)?/i, '').trim();
  const separator = /#|%23/.exec(route);
  const rawSlug = separator ? route.slice(0, separator.index) : route;
  const rawAnchor = separator ? route.slice(separator.index + separator[0].length) : '';
  return {
    slug: decode(rawSlug).trim() || 'home',
    anchor: decode(rawAnchor).trim(),
  };
}

export function manualHash(slug, anchor = '') {
  return `#/${encodeURIComponent(slug)}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
}

/** Used only when a written page title is unavailable (for example offline). */
export function fallbackTitle(slug) {
  if (slug === 'recruitment-and-ri') return 'Lung opening profiles';
  return String(slug).split('-').map((word, index) => {
    const known = ACRONYMS.get(word.toLowerCase());
    if (known) return known;
    return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }).join(' ');
}
