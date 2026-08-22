// One palette definition, consumed by both CSS (as custom properties) and the
// canvas panels (as plain hex). Hues come from a validated categorical set;
// which slot carries which signal follows clinical convention where one exists
// — arterial red, venous blue, airway orange.

// A colour that reads well as a 2 px stroke is often too light as 10 px text.
// These are the same hues moved toward the surface's opposite until each clears
// the WCAG AA body-text ratio of 4.5:1 against the panel it is drawn on, and are
// used for every label, annotation and status word. Computed, not chosen.
const LIGHT_TEXT = {
  arterial: '#cf4242', venous: '#2974d0', pulmonary: '#008300', airway: '#be542a',
  alveolar: '#006f9e', pleural: '#15855d', transpulmonary: '#4a3aa7',
  volume: '#9c6a00', flow: '#4a3aa7',
  good: '#0a870a', warning: '#986d0f', serious: '#ac6042', critical: '#d03b3b',
};

const DARK_TEXT = {
  arterial: '#e66767', venous: '#3987e5', pulmonary: '#269626', airway: '#d95b28',
  alveolar: '#2ca6d6', pleural: '#199e70', transpulmonary: '#9085e9',
  volume: '#c98500', flow: '#9085e9',
  good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d75858',
};

const LIGHT = {
  surface: '#fcfcfb',
  page: '#f9f9f7',
  raised: '#ffffff',
  ink: '#0b0b0b',
  inkSecondary: '#52514e',
  inkMuted: '#898781',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  border: 'rgba(11,11,11,0.10)',
  wash: 'rgba(11,11,11,0.04)',

  arterial: '#e34948',
  venous: '#2a78d6',
  pulmonary: '#008300',
  airway: '#eb6834',
  alveolar: '#0075a5',
  pleural: '#1baf7a',
  transpulmonary: '#4a3aa7',
  volume: '#eda100',
  flow: '#4a3aa7',

  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

const DARK = {
  surface: '#1a1a19',
  page: '#0d0d0d',
  raised: '#232322',
  ink: '#ffffff',
  inkSecondary: '#c3c2b7',
  inkMuted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  border: 'rgba(255,255,255,0.10)',
  wash: 'rgba(255,255,255,0.05)',

  arterial: '#e66767',
  venous: '#3987e5',
  pulmonary: '#008300',
  airway: '#d95926',
  alveolar: '#2ca6d6',
  pleural: '#199e70',
  transpulmonary: '#9085e9',
  volume: '#c98500',
  flow: '#9085e9',

  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

let mode = 'auto';
let current = LIGHT;

const listeners = new Set();

function resolve() {
  const dark = mode === 'dark'
    || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  current = { ...(dark ? DARK : LIGHT), text: dark ? DARK_TEXT : LIGHT_TEXT };
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  for (const [k, v] of Object.entries(current)) {
    if (typeof v !== 'string') continue;
    root.style.setProperty(`--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, v);
  }
  for (const [k, v] of Object.entries(current.text)) {
    root.style.setProperty(`--text-${k}`, v);
  }
  for (const fn of listeners) fn(current);
}

export const theme = {
  get colors() { return current; },
  get mode() { return mode; },
  set(next) { mode = next; resolve(); },
  cycle() {
    mode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    resolve();
    return mode;
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  init() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode === 'auto') resolve();
    });
    resolve();
  },
};
