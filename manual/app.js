// arthur manual — a single-page viewer over plain markdown files.
//
// There is no page-per-file HTML and no build step for content: the router
// fetches `<slug>.md` and renders it. Adding a page means writing one markdown
// file and adding one line to manifest.json.
//
// Markdown rendering lives in render.mjs, shared with the linter so that what
// is verified offline is exactly what a reader sees.

import { render } from './render.mjs';

const $ = (sel) => document.querySelector(sel);

const slugify = (s) => s.toLowerCase().trim()
  .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

let manifest = { sections: [] };
let flat = [];          // reading order, for prev/next
let exists = null;      // Set of slugs with a file, or null if unknown

async function boot() {
  manifest = await (await fetch('manifest.json')).json();
  flat = manifest.sections.flatMap((s) => s.pages.map(([slug, blurb]) => ({ slug, blurb, section: s.label })));
  try {
    const r = await fetch('status.json');
    if (r.ok) exists = new Set((await r.json()).written);
  } catch { /* unknown is fine; every link stays live */ }

  buildSidebar();
  wireChrome();
  window.addEventListener('hashchange', route);
  route();
}

function buildSidebar() {
  const nav = $('#sidebar');
  nav.innerHTML = manifest.sections.map((s) => `
    <h2>${s.label}</h2>
    <ul>${s.pages.map(([slug, blurb]) => {
      const todo = exists && !exists.has(slug) ? ' todo' : '';
      const title = slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
      return `<li><a class="link${todo}" href="#/${slug}" data-slug="${slug}" title="${blurb}">${title}</a></li>`;
    }).join('')}</ul>`).join('');
}

function currentSlug() {
  const h = location.hash.replace(/^#\/?/, '').trim();
  return h || 'home';
}

async function route() {
  const slug = currentSlug();
  const page = $('#page');

  document.querySelectorAll('#sidebar a').forEach((a) => {
    a.classList.toggle('active', a.dataset.slug === slug);
  });

  page.innerHTML = '<p class="loading">Loading…</p>';
  let md;
  try {
    const res = await fetch(`${slug}.md`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    md = await res.text();
  } catch {
    const entry = flat.find((p) => p.slug === slug);
    page.innerHTML = entry
      ? `<h1>${entry.slug.replace(/-/g, ' ')}</h1>
         <p class="missing">This page is planned but not written yet.</p>
         <blockquote>${entry.blurb}</blockquote>
         <p class="missing">It belongs to <strong>${entry.section}</strong>. A link
         pointing here is a marker of work to do, not a broken link.</p>`
      : `<h1>Not found</h1><p class="missing">No page called <code>${slug}</code>.</p>`;
    finish(slug);
    return;
  }

  const { html, errors } = render(md);
  page.innerHTML = html;
  if (errors.length) console.warn(`${slug}.md:`, errors);
  decorate(page);
  finish(slug);
}

// Post-processing that is easier on the DOM than in a renderer override.
function decorate(root) {
  const seen = new Set();
  root.querySelectorAll('h2, h3').forEach((h) => {
    let id = slugify(h.textContent);
    while (seen.has(id)) id += '-x';
    seen.add(id);
    h.id = id;
  });

  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (/^https?:/i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else if (href.endsWith('.md') && !href.startsWith('../')) {
      // A sibling page becomes a route; anything reaching outside the manual
      // (the repository's own docs) stays an ordinary link to the real file.
      a.setAttribute('href', `#/${href.replace(/\.md$/, '')}`);
    }
  });

  // Tables scroll inside their own box so the page never scrolls sideways.
  root.querySelectorAll('table').forEach((t) => {
    const box = document.createElement('div');
    box.className = 'table-scroll';
    t.replaceWith(box);
    box.appendChild(t);
  });
}

function finish(slug) {
  buildToc();
  buildSeq(slug);
  document.body.classList.remove('nav-open');
  $('#menu').setAttribute('aria-expanded', 'false');
  document.title = `${(document.querySelector('#page h1')?.textContent || slug)} — arthur`;
  const target = location.hash.split('#')[2];
  if (target) document.getElementById(target)?.scrollIntoView();
  else window.scrollTo(0, 0);
}

let spy = null;

function buildToc() {
  const toc = $('#toc');
  const heads = [...document.querySelectorAll('#page h2, #page h3')];
  if (spy) { spy.disconnect(); spy = null; }
  if (heads.length < 2) { toc.innerHTML = ''; return; }

  toc.innerHTML = `<strong>On this page</strong><ul>${heads.map((h) =>
    `<li><a class="${h.tagName.toLowerCase()}" href="#/${currentSlug()}#${h.id}">${h.textContent}</a></li>`
  ).join('')}</ul>`;

  const links = new Map([...toc.querySelectorAll('a')].map((a) => [a.getAttribute('href').split('#').pop(), a]));
  spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      toc.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
      links.get(e.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-15% 0px -75% 0px' });
  heads.forEach((h) => spy.observe(h));
}

function buildSeq(slug) {
  const i = flat.findIndex((p) => p.slug === slug);
  const set = (el, entry, label) => {
    if (!entry) { el.removeAttribute('href'); el.innerHTML = ''; return; }
    el.href = `#/${entry.slug}`;
    el.innerHTML = `<small>${label}</small>${entry.slug.replace(/-/g, ' ')}`;
  };
  set($('#prev'), i > 0 ? flat[i - 1] : null, 'Previous');
  set($('#next'), i >= 0 && i < flat.length - 1 ? flat[i + 1] : null, 'Next');
}

function wireChrome() {
  const root = document.documentElement;
  const saved = localStorage.getItem('arthur-theme');
  if (saved) root.dataset.theme = saved;
  $('#theme').addEventListener('click', () => {
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const now = root.dataset.theme || (dark ? 'dark' : 'light');
    const next = now === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('arthur-theme', next);
  });

  $('#menu').addEventListener('click', (e) => {
    const open = document.body.classList.toggle('nav-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  const q = $('#q');
  const results = $('#results');
  const close = () => { results.hidden = true; q.setAttribute('aria-expanded', 'false'); };

  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    if (!term) return close();
    const hits = flat.filter((p) =>
      p.slug.replace(/-/g, ' ').includes(term) || p.blurb.toLowerCase().includes(term)
    ).slice(0, 12);
    results.innerHTML = hits.length
      ? hits.map((p) => `<li role="option"><a href="#/${p.slug}">${p.slug.replace(/-/g, ' ')}<small>${p.blurb}</small></a></li>`).join('')
      : '<li class="empty">Nothing matches.</li>';
    results.hidden = false;
    q.setAttribute('aria-expanded', 'true');
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { q.value = ''; close(); q.blur(); }
    if (e.key === 'Enter') results.querySelector('a')?.click();
  });
  results.addEventListener('click', () => { q.value = ''; close(); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
  });
}

boot();
