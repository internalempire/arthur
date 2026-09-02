/** Convert authored Markdown into compact, readable text for browser search. */
export function searchableText(source) {
  return String(source ?? '')
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/^```[^]*?^```/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\|?\s*:?-{3,}:?[^\n]*$/gm, ' ')
    .replace(/[|*_`$>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchIndex(documents) {
  return {
    version: 1,
    pages: Object.fromEntries([...documents.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, source]) => [slug, searchableText(source)])),
  };
}
