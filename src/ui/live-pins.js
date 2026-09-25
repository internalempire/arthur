import { PARAMETERS } from '../model/index.js';

export const MAX_LIVE_PINS = 4;

/** References are independent simulations, including ones not selected for display. */
export class LivePins {
  constructor() { this.clear(); }
  get selected() { return this.states.find(state => state.id === this.selectedId) ?? null; }
  add(sim) {
    if (this.states.length >= MAX_LIVE_PINS) return null;
    const state = { id: this.nextId++, sim: sim.fork() };
    this.states.push(state);
    this.selectedId = state.id;
    return state;
  }
  select(id) {
    if (this.states.some(state => state.id === id)) this.selectedId = id;
  }
  remove(id) {
    this.states = this.states.filter(state => state.id !== id);
    if (this.selectedId === id) this.selectedId = this.states.at(-1)?.id ?? null;
  }
  clear() { this.states = []; this.selectedId = null; this.nextId = 1; }
  advance(seconds) {
    // Reference traces are not drawn. Silent advancement still updates every
    // physiological state, beat history and averaging window used by the tiles.
    for (const state of this.states) state.sim.advance(seconds, true);
  }
}

function displayValue(parameter, value) {
  if (parameter.type === 'choice') {
    return parameter.options.find(option => option.value === value)?.label ?? String(value);
  }
  return Number((value * (parameter.displayScale ?? 1)).toPrecision(6)).toString();
}

/** Differences always read from the row's fixed prescription toward the current one. */
export function pinSettingChanges(reference, current) {
  return PARAMETERS.filter(p => reference[p.id] !== current[p.id]).map(p => ({
    id: p.id,
    text: `${p.label}: ${displayValue(p, reference[p.id])} → ${displayValue(p, current[p.id])}${p.unit ? ` ${p.unit}` : ''}`,
  }));
}

export function createLivePinTable(container, pins, onChange) {
  container.innerHTML = `
    <div class="pin-heading"><h2>Live comparisons</h2><span class="pin-summary"></span></div>
    <p class="pin-message"></p>
    <table class="pin-table">
      <thead><tr><th scope="col">Tile reference</th><th scope="col">Settings: reference → current</th><th scope="col"><span class="visually-hidden">Remove reference</span></th></tr></thead>
      <tbody></tbody>
    </table>
    <p class="pin-help">All states keep evolving; Pause stops them together. Different heart or breathing rates can shift their cycles. Settings alone do not describe previous manoeuvres or pressure history.</p>`;
  const body = container.querySelector('tbody');
  const summary = container.querySelector('.pin-summary');
  const message = container.querySelector('.pin-message');
  const rows = new Map();

  function render(params, { historical = false, running = true } = {}) {
    container.hidden = pins.states.length === 0;
    summary.textContent = `${pins.states.length}/${MAX_LIVE_PINS} references · ${running ? 'Running' : 'Paused'}`;
    const selected = pins.selected;
    message.textContent = historical
      ? 'Inspecting the past: live reference values are hidden. Return to the latest instant or press Play to compare.'
      : `${selected ? `State ${selected.id}` : 'Reference'} is shown below the current tile values.`;
    for (const [id, row] of rows) {
      if (!pins.states.some(state => state.id === id)) { row.remove(); rows.delete(id); }
    }
    for (const state of pins.states) {
      let row = rows.get(state.id);
      if (!row) {
        row = document.createElement('tr');
        row.dataset.pinId = state.id;
        row.innerHTML = '<th scope="row"><label class="pin-choice"><input type="radio" name="tile-reference"><span></span></label></th><td class="pin-changes"></td><td><button type="button" class="btn pin-remove">Unpin</button></td>';
        row.querySelector('input').setAttribute('aria-label', `Compare with State ${state.id}`);
        row.querySelector('.pin-choice span').textContent = `State ${state.id}`;
        row.querySelector('input').addEventListener('change', () => { pins.select(state.id); onChange(); });
        const remove = row.querySelector('.pin-remove');
        remove.setAttribute('aria-label', `Unpin State ${state.id}`);
        remove.addEventListener('click', () => {
          pins.remove(state.id);
          onChange();
          // Removing a focused row must leave a usable keyboard destination.
          const pinButton = document.getElementById('pin-state');
          (body.querySelector('input:checked')
            ?? (pinButton.disabled ? document.getElementById('playpause') : pinButton)).focus();
        });
        body.appendChild(row);
        rows.set(state.id, row);
      }
      row.querySelector('input').checked = pins.selectedId === state.id;
      row.classList.toggle('pin-selected', pins.selectedId === state.id);
      const changes = pinSettingChanges(state.sim.params, params);
      const cell = row.querySelector('.pin-changes');
      const text = changes.map(change => change.text).join('\n') || 'Same control settings';
      if (cell.textContent !== text) cell.textContent = text;
    }
  }
  return { render };
}
