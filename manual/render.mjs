// The manual's markdown renderer, shared by the browser and the linter.
//
// It exists as its own module for one reason: a formatting defect that only
// appears when markdown is actually rendered cannot be caught by a checker that
// reads the source. The linter imports this exact function, so what it verifies
// is what a reader sees.
//
// Math is tokenised before markdown parses the text. Running KaTeX over
// already-parsed HTML lets marked mangle the LaTeX first: underscores in
// `R_{\text{total}}` pair up into <em>, and backslashes are consumed as escapes.

import { Marked } from './vendor/marked.esm.js';
import katex from './vendor/katex/katex.mjs';

const escapeHtml = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

/**
 * @param {string} md
 * @returns {{ html: string, errors: {kind: string, detail: string}[] }}
 */
export function render(md) {
  const errors = [];

  const tex = (text, displayMode) => {
    try {
      return katex.renderToString(text, { displayMode, throwOnError: true, strict: false });
    } catch (err) {
      errors.push({ kind: displayMode ? 'display math' : 'inline math', detail: `${err.message} — in: ${text.slice(0, 80)}` });
      return `<code class="tex-error">${escapeHtml(text)}</code>`;
    }
  };

  const math = {
    extensions: [
      {
        name: 'blockMath',
        level: 'block',
        start: (src) => src.indexOf('$$'),
        tokenizer(src) {
          // Both the fenced form the manual requires and a single-line
          // $$...$$ are accepted, so a page still renders while the linter
          // asks for the fenced one.
          const m = /^\$\$([\s\S]+?)\$\$(?:\n+|$)/.exec(src);
          if (m) return { type: 'blockMath', raw: m[0], text: m[1].trim() };
        },
        renderer: (t) => tex(t.text, true),
      },
      {
        name: 'inlineMath',
        level: 'inline',
        start: (src) => src.indexOf('$'),
        tokenizer(src) {
          const m = /^\$(?!\$)((?:\\.|[^\\$\n])+?)\$(?!\$)/.exec(src);
          if (m) return { type: 'inlineMath', raw: m[0], text: m[1] };
        },
        renderer: (t) => tex(t.text, false),
      },
    ],
  };

  // `breaks` stays false: a hard-wrapped paragraph must reflow rather than keep
  // the author's line endings.
  const marked = new Marked({ gfm: true, breaks: false }).use(math);
  return { html: marked.parse(md), errors };
}
