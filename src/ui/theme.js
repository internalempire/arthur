// One palette definition, consumed by both CSS (as custom properties) and the
// canvas panels (as plain hex). Hues come from a validated categorical set;
// which slot carries which signal follows clinical convention where one exists
// — arterial red, venous blue, airway orange.

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
  pleural: '#1baf7a',
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
  pleural: '#199e70',
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
  current = dark ? DARK : LIGHT;
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  for (const [k, v] of Object.entries(current)) {
    root.style.setProperty(`--${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`, v);
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
