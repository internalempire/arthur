// Pure navigation helpers for the manual viewer. Keeping hash parsing outside
// app.js makes the distinction between a page and an in-page anchor explicit
// and executable in the dependency-free test suite.

const ACRONYMS = new Map([
  ['ards', 'ARDS'], ['co', 'CO'], ['copd', 'COPD'], ['efl', 'EFL'],
  ['frc', 'FRC'], ['hpv', 'HPV'], ['ivc', 'IVC'], ['lv', 'LV'],
  ['pap', 'PAP'], ['pawp', 'PAWP'], ['peep', 'PEEP'], ['pmsf', 'Pmsf'],
  ['ppv', 'PPV'], ['pvr', 'PVR'], ['ri', 'R/I'], ['rv', 'RV'],
]);

const decode = (value) => {
  try { return decodeURIComponent(value); } catch { return value; }
};

/** Split `#/page#section` without allowing the section to become a filename. */
export function parseManualHash(hash) {
  const route = String(hash ?? '').replace(/^#\/?/, '').trim();
  const separator = route.indexOf('#');
  const rawSlug = separator < 0 ? route : route.slice(0, separator);
  const rawAnchor = separator < 0 ? '' : route.slice(separator + 1);
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
  return String(slug).split('-').map((word, index) => {
    const known = ACRONYMS.get(word.toLowerCase());
    if (known) return known;
    return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }).join(' ');
}
