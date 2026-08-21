// Fast contracts for pull requests that change only the application shell,
// styles or UI modules. Physiological and scenario changes always run the full
// suite; this profile only catches broken module graphs, forbidden model-layer
// imports and missing DOM anchors without spending minutes settling patients.

import { readFileSync, readdirSync } from 'node:fs';

const failures = [];
const check = (name, condition, detail = '') => {
  if (condition) console.log(`pass  ${name}`);
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

function collect(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) files.push(...collect(url));
    else if (entry.name.endsWith('.js')) files.push(url);
  }
  return files;
}

const uiFiles = collect(new URL('../src/ui/', import.meta.url));
const unloadable = [];
for (const file of uiFiles) {
  try {
    await import(file.href);
  } catch (error) {
    unloadable.push(`${file.pathname.split('/').pop()}: ${error.message}`);
  }
}
check('every UI module resolves', unloadable.length === 0, unloadable.join(', '));

const browserFiles = [new URL('../src/main.js', import.meta.url), ...uiFiles];
const forbidden = [];
for (const file of browserFiles) {
  const source = readFileSync(file, 'utf8');
  for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (specifier.includes('/model/') && !specifier.endsWith('/model/index.js')) {
      forbidden.push(`${file.pathname.split('/').pop()}: ${specifier}`);
    }
  }
}
check('UI imports the model only through its public boundary',
  forbidden.length === 0, forbidden.join(', '));

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const anchors = [
  'scenario', 'speed', 'playpause', 'hold-exp', 'hold-insp', 'reset', 'theme',
  'sidebar-toggle', 'scenario-note', 'controls', 'invalid-banner', 'stats',
  'waveforms', 'guyton', 'campbell', 'pvloops', 'pvr', 'thorax',
];
const missing = anchors.filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
check('the application shell retains every UI mount point',
  missing.length === 0, missing.join(', '));
check('the browser entry point remains an ES module',
  /<script\s+type=["']module["']\s+src=["']src\/main\.js["']><\/script>/.test(html));
check('the header exposes accessible repository and manual links',
  /id=["']project-repository["'][^>]+href=["']https:\/\/github\.com\/internalempire\/arthur["'][^>]+aria-label=/.test(html)
    && /id=["']project-manual["'][^>]+href=["']manual\/["'][^>]+aria-label=/.test(html));

const stats = readFileSync(new URL('../src/ui/stats.js', import.meta.url), 'utf8');
const { PARAMETERS } = await import(new URL('../src/model/index.js', import.meta.url));
const { choiceIndex, choiceValue } = await import(new URL('../src/ui/controls.js', import.meta.url));
const { ivcDisplayWidth } = await import(new URL('../src/ui/panels/thorax.js', import.meta.url));
const baroreflex = PARAMETERS.find((spec) => spec.id === 'baroreflexEnabled');
const hysteresis = PARAMETERS.find((spec) => spec.id === 'hysteresis');
check('baroreflex uses the same Off/On selector as recruitment hysteresis',
  baroreflex?.type === 'choice'
    && hysteresis?.type === 'choice'
    && baroreflex.options.map((option) => option.label).join('/') === 'Off/On'
    && choiceValue(baroreflex, choiceIndex(baroreflex, true)) === true
    && choiceValue(baroreflex, choiceIndex(baroreflex, false)) === false);
check('effective heart rate and systemic resistance remain available as tiles',
  /id: 'hr'/.test(stats) && /id: 'svr'/.test(stats));
check('a plethoric IVC remains visually responsive above the reference calibre',
  ivcDisplayWidth(180) > ivcDisplayWidth(160)
    && ivcDisplayWidth(160) > ivcDisplayWidth(150));

if (failures.length) {
  console.error(`\n${failures.length} UI smoke failure(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`\n8 UI smoke contracts passed`);
