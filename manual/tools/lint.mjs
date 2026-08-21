// Health check for the manual.
//
//   node manual/tools/lint.mjs
//
// Two of these checks exist because of defects that shipped. A display-math
// block whose delimiters shared a line with the formula was swallowed by a
// renderer and ate the paragraph after it; hard-wrapped prose kept the author's
// line endings instead of reflowing. Both files were internally consistent, so
// counting delimiters proved nothing. Every page is therefore rendered through
// the same module the browser uses, and the two conventions are enforced as
// rules rather than trusted.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { render } from '../render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const planned = new Set(manifest.sections.flatMap((s) => s.pages.map(([slug]) => slug)));

const errors = [];
const warnings = [];
const err = (file, line, msg) => errors.push(`${file}${line ? ':' + line : ''} — ${msg}`);
const warn = (file, line, msg) => warnings.push(`${file}${line ? ':' + line : ''} — ${msg}`);

const structural = (l) =>
  l.trim() === '' || /^\s*\|/.test(l) || /^#{1,6}\s/.test(l)
  || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l) || /^\s*[-*+]\s/.test(l)
  || /^\s*\d+\.\s/.test(l) || /^>/.test(l) || /^\s{4,}\S/.test(l)
  || /^!\[/.test(l) || /^\s*<!--/.test(l);

const files = readdirSync(ROOT).filter((f) => f.endsWith('.md')).sort();

for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const src = readFileSync(join(ROOT, file), 'utf8');
  const lines = src.split('\n');

  // --- does it render, and does the maths survive? ---
  const { html, errors: mathErrors } = render(src);
  for (const e of mathErrors) err(file, null, `${e.kind} failed to render: ${e.detail}`);

  // Code spans and blocks may legitimately contain a dollar sign — a page that
  // documents the delimiters has to be able to name them.
  const text = html.replace(/<code[\s\S]*?<\/code>/g, ' ').replace(/<[^>]*>/g, ' ');
  if (text.includes('$')) err(file, null, 'a "$" survives into the rendered text — a math delimiter did not close');

  // --- conventions ---
  let inMath = false;
  let inFence = false;
  lines.forEach((l, i) => {
    const n = i + 1;
    if (/^```/.test(l)) inFence = !inFence;
    if (inFence) return;

    // Same exemption for the source scan: `$$x$$` inside backticks is prose
    // about the syntax, not an instance of it.
    const bare = l.replace(/`[^`]*`/g, '');
    const dd = (bare.match(/\$\$/g) || []).length;
    if (dd && !/^\$\$\s*$/.test(l)) {
      err(file, n, 'display-math delimiters must sit alone on their own line; renderers disagree about any other form');
    }
    if (/^\$\$\s*$/.test(l)) { inMath = !inMath; return; }
    if (inMath) return;

    if (!structural(l) && !structural(lines[i + 1] ?? '')) {
      warn(file, n, 'paragraph is hard-wrapped; one line per paragraph so it reflows');
    }
  });
  if (inMath) err(file, null, 'a display-math block is never closed');

  // --- links ---
  for (const m of src.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^https?:|^#|^mailto:/.test(href)) continue;
    if (href.startsWith('../')) {
      if (!existsSync(resolve(ROOT, href))) err(file, null, `link leaves the manual and the target is missing: ${href}`);
    } else if (/^[^#]+\.md(?:#.*)?$/.test(href)) {
      // Valid if the page is planned (a dangling link is a marker) or if the
      // file exists — which covers the machinery pages, deliberately absent
      // from the manifest because they are not part of the reading order.
      const target = href.split('#')[0].replace(/\.md$/, '');
      if (!planned.has(target) && !existsSync(join(ROOT, `${target}.md`))) {
        err(file, null, `link to "${target}", which is neither a written page nor in the manifest`);
      }
    } else if (!existsSync(join(ROOT, href.split('#')[0]))) {
      err(file, null, `missing asset: ${href}`);
    }
  }

  // --- wiki health ---
  if (!file.startsWith('_') && !planned.has(slug)) {
    warn(file, null, 'page exists but is not in the manifest, so nothing links to it');
  }
}

// Pages everything points at but nobody has written are expected, not errors.
const missing = [...planned].filter((s) => !files.includes(`${s}.md`));

const list = (title, xs) => { if (xs.length) console.log(`\n${title}\n` + xs.map((x) => '  ' + x).join('\n')); };
list('ERRORS', errors);
list('WARNINGS', warnings);
console.log(`\n${files.length} file(s) checked · ${planned.size - missing.length}/${planned.size} pages written`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
