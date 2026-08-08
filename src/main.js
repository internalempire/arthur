import { Simulator } from './model/simulator.js';
import { SCENARIOS, SCENARIO_BY_ID } from './model/scenarios.js';
import { theme } from './ui/theme.js';
import { createControls } from './ui/controls.js';
import { createStats } from './ui/stats.js';
import { createWaveforms } from './ui/panels/waveforms.js';
import { createGuyton } from './ui/panels/guyton.js';
import { createCampbell } from './ui/panels/campbell.js';
import { createPvLoops } from './ui/panels/pvloops.js';
import { createPvrCurve } from './ui/panels/pvrcurve.js';
import { createThorax } from './ui/panels/thorax.js';
import { createDescriptions } from './ui/descriptions.js';

theme.init();

const sim = new Simulator();

const el = (id) => document.getElementById(id);

const waveforms = createWaveforms(el('waveforms'));
const guyton = createGuyton(el('guyton'));
const campbell = createCampbell(el('campbell'));
const pvLoops = createPvLoops(el('pvloops'));
const pvrCurve = createPvrCurve(el('pvr'));
const thorax = createThorax(el('thorax'));
const stats = createStats(el('stats'), { banner: el('invalid-banner') });
const descriptions = createDescriptions();
const controls = createControls(el('controls'), sim, (id) => {
  if (id === 'mode') controls.sync();
  clearTrails();
  markCustom();
  dirty = true;
});

// ---------------------------------------------------------------- scenarios
const scenarioSelect = el('scenario');
const scenarioNote = el('scenario-note');
{
  const custom = document.createElement('option');
  custom.value = '';
  custom.textContent = 'Custom';
  scenarioSelect.appendChild(custom);
  for (const s of SCENARIOS) {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.name;
    scenarioSelect.appendChild(o);
  }
}

function applyScenario(id) {
  const scenario = SCENARIO_BY_ID.get(id);
  if (!scenario) { scenarioNote.textContent = ''; return; }
  sim.applyScenario(scenario);
  sim.advance(20, true);
  controls.sync();
  clearTrails();
  dirty = true;
  scenarioNote.textContent = scenario.note;
}

scenarioSelect.addEventListener('change', () => applyScenario(scenarioSelect.value));

// Touching any control means the state is no longer the preset, so say so
// rather than leaving a scenario name attached to a patient it no longer
// describes.
function markCustom() {
  if (!scenarioSelect.value) return;
  scenarioSelect.value = '';
  scenarioNote.textContent = '';
}

function clearTrails() {
  guyton.clearTrail();
  campbell.clearTrail();
}

// ------------------------------------------------------------------ transport
let running = true;
let speed = 1;
let lastFrame = performance.now();

const playPause = el('playpause');
playPause.addEventListener('click', () => {
  running = !running;
  playPause.textContent = running ? 'Pause' : 'Play';
  playPause.classList.toggle('btn-primary', running);
  lastFrame = performance.now();
});

el('speed').addEventListener('change', (e) => { speed = parseFloat(e.target.value); });

// Occlusion manoeuvres. Each contributes a measured point to the Guyton
// diagram; several at different airway pressures draw a venous return curve the
// way it is done at the bedside.
for (const [id, kind] of [['hold-exp', 'expiratory'], ['hold-insp', 'inspiratory']]) {
  el(id).addEventListener('click', (e) => {
    const started = sim.startHold(kind, 12);
    if (started) {
      e.currentTarget.classList.add('btn-busy');
      setTimeout(() => e.currentTarget.classList.remove('btn-busy'), 1200);
    }
    dirty = true;
  });
}

el('reset').addEventListener('click', () => {
  const current = scenarioSelect.value;
  sim.clearMeasuredPoints();
  sim.reset();
  if (current) applyScenario(current); else controls.sync();
  clearTrails();
});

el('theme').addEventListener('click', (e) => {
  const mode = theme.cycle();
  e.currentTarget.title = `Colour theme: ${mode}`;
});

const sidebarToggle = el('sidebar-toggle');
sidebarToggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('sidebar-open');
  sidebarToggle.setAttribute('aria-expanded', String(open));
});

// Space toggles the transport only when nothing interactive has focus. A native
// control must keep its own keyboard behaviour: with the old check, pressing
// space on Reset or the theme button toggled Play/Pause instead of activating
// the focused control.
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t instanceof Element && t.closest('button, input, select, textarea, a[href], [tabindex], summary, details')) return;
  e.preventDefault();
  playPause.click();
});

// ----------------------------------------------------------------- main loop
let statsClock = 0;

function draw() {
  const colors = theme.colors;
  waveforms.render(sim, colors);
  guyton.render(sim, colors);
  campbell.render(sim, colors);
  pvLoops.render(sim, colors);
  pvrCurve.render(sim, colors);
  thorax.render(sim, colors);
  stats.render(sim.metrics);
  descriptions.render(sim);
  dirty = false;
}

// Anything that changes what should be on screen without the model advancing.
let dirty = true;
export function invalidate() { dirty = true; }
theme.onChange(() => { dirty = true; });
new ResizeObserver(() => { dirty = true; }).observe(document.body);

function frame(now) {
  const dtWall = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;

  if (running) {
    sim.advance(dtWall * speed);
    dirty = true;
  }

  // Paused and unchanged: nothing to redraw. The canvases hold their last
  // frame, so this is free rather than blank.
  if (dirty) {
    const colors = theme.colors;
    waveforms.render(sim, colors);
    guyton.render(sim, colors);
    campbell.render(sim, colors);
    pvLoops.render(sim, colors);
    pvrCurve.render(sim, colors);
    thorax.render(sim, colors);

    statsClock += dtWall;
    if (statsClock > 0.12 || !running) {
      stats.render(sim.metrics);
      descriptions.render(sim);
      statsClock = 0;
    }
    if (!running) dirty = false;
  }

  requestAnimationFrame(frame);
}

// A backgrounded tab stops firing animation frames; without this the first
// frame after returning would be timed from whenever the tab was hidden.
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); });

// Handle for scripting the simulator from the console or an embedding page.
window.heartLung = {
  sim,
  draw,
  /** Advance the model by `seconds` of simulated time and repaint. */
  step(seconds = 1) { sim.advance(seconds); draw(); return sim.metrics; },
};

scenarioSelect.value = 'healthy-vcv';
applyScenario('healthy-vcv');
requestAnimationFrame(frame);
