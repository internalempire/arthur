import { PARAMETERS } from '../model/index.js';
import { signedVolume, volumeControlReadings } from './volume-controls.js';

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
    // Pins skip the full waveform rings. Optional graph observers still see
    // the same respiratory boundaries, PV beats and averaging windows.
    for (const state of this.states) state.sim.advance(seconds, true);
  }
}

function displayValue(parameter, value) {
  if (parameter.type === 'choice') {
    return parameter.options.find(option => option.value === value)?.label ?? String(value);
  }
  return Number((value * (parameter.displayScale ?? 1)).toPrecision(6)).toString();
}

/** Compare applied settings and actual blood totals, never the pending UI dose. */
export function pinSettingChanges(reference, current, { referenceTotal, currentTotal } = {}) {
  const changes = PARAMETERS.filter(p => p.id !== 'stressedVolume' && reference[p.id] !== current[p.id]).map(p => {
    const before = displayValue(p, reference[p.id]);
    const now = displayValue(p, current[p.id]);
    const unit = p.unit ? ` ${p.unit}` : '';
    return {
      id: p.id, label: p.label, reference: before + unit, current: now + unit,
      text: `${p.label}: ${before} → ${now}${unit}`,
    };
  });
  const totalsAvailable = Number.isFinite(referenceTotal) && Number.isFinite(currentTotal);
  const difference = totalsAvailable ? currentTotal - referenceTotal : current.stressedVolume - reference.stressedVolume;
  // Ignore floating-point conservation noise, far below the displayed precision.
  if (Math.abs(difference) > 1e-6) {
    const delta = signedVolume(Number(difference.toFixed(3))) + ' mL';
    const before = totalsAvailable ? (referenceTotal / 1000).toFixed(2) : null;
    const now = totalsAvailable ? (currentTotal / 1000).toFixed(2) : null;
    changes.unshift({
      id: 'totalBloodVolume', label: 'Total blood volume', reference: totalsAvailable ? before + ' L' : '—',
      current: totalsAvailable ? `${now} L (Δ ${delta})` : `Δ ${delta}`,
      text: totalsAvailable ? `Total blood volume: ${before} → ${now} L (${delta})` : `Total blood volume change: ${delta}`,
    });
  }
  return changes;
}

// The two patient columns are also used by the optional mechanisms view.
export function pinColumnHead() {
  const italian = navigator.language.toLowerCase().startsWith('it');
  const headings = italian ? ['Parametro', 'Riferimento', 'Attuale'] : ['Setting', 'Reference', 'Current'];
  return `<thead lang="${italian ? 'it' : 'en'}"><tr>${headings.map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead>`;
}

// Preserve any state selector in the first row while updating the values below it.
export function createPinSettingsRows(body) {
  const retainedRows = body.rows.length;
  let previous;
  return changes => {
    const key = changes.map(change => change.text).join('\n');
    if (key === previous) return;
    previous = key;
    while (body.rows.length > retainedRows) body.deleteRow(-1);
    if (!changes.length) {
      const cell = body.insertRow().insertCell();
      cell.colSpan = 3;
      cell.textContent = 'Same settings and total blood volume';
      return;
    }
    for (const change of changes) {
      const row = body.insertRow();
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = change.label;
      row.appendChild(label);
      row.insertCell().textContent = change.reference;
      row.insertCell().textContent = change.current;
    }
  };
}

export function createLivePinTable(container, pins, onChange) {
  container.innerHTML = `
    <div class="pin-heading"><h2>Live comparisons</h2><span class="pin-summary"></span><button type="button" class="btn" id="show-mechanisms" aria-controls="mechanisms" aria-expanded="false">Mechanisms</button><button type="button" class="btn" id="show-distribution" aria-controls="distribution" aria-expanded="false">Blood distribution</button></div>
    <label class="pin-plot-choice"><input type="checkbox" id="show-pin-plots" aria-controls="guyton campbell pvloops pvr"> Show reference traces</label>
    <p class="pin-message"></p>
    <table class="pin-table" aria-label="Settings of each pinned state and the current patient">${pinColumnHead()}</table>
    <p class="pin-help">All states keep evolving; Pause stops them together. Different heart or breathing rates can shift their cycles. Settings and total blood volume do not describe previous manoeuvres or pressure history.</p>`;
  const table = container.querySelector('.pin-table');
  const summary = container.querySelector('.pin-summary');
  const message = container.querySelector('.pin-message');
  const rows = new Map();

  function render(sim, { historical = false, running = true, plots = false, cycleStatus = '' } = {}) {
    container.hidden = pins.states.length === 0;
    if (container.hidden) {
      for (const { group } of rows.values()) group.remove();
      rows.clear();
      return;
    }
    const params = sim.params;
    const currentTotal = volumeControlReadings(sim).total;
    summary.textContent = `${pins.states.length}/${MAX_LIVE_PINS} references · ${running ? 'Running' : 'Paused'}`;
    const selected = pins.selected;
    const toggle = container.querySelector('#show-pin-plots');
    toggle.checked = plots;
    toggle.disabled = historical;
    message.textContent = historical
      ? 'Inspecting the past: live reference values are hidden. Return to the latest instant or press Play to compare.'
      : plots ? `Solid: current patient · Dashed: State ${selected.id}. Filled point: current · Ring: reference. `
        + cycleStatus
      : `${selected ? `State ${selected.id}` : 'Reference'} is shown below the current tile values.`;
    for (const [id, { group }] of rows) {
      if (!pins.states.some(state => state.id === id)) { group.remove(); rows.delete(id); }
    }
    for (const state of pins.states) {
      let row = rows.get(state.id);
      if (!row) {
        const group = table.createTBody();
        group.dataset.pinId = state.id;
        const heading = group.insertRow();
        heading.innerHTML = '<th scope="rowgroup" colspan="3"><div class="pin-state-heading"><label class="pin-choice"><input type="radio" name="tile-reference"><span></span></label><button type="button" class="btn pin-remove">Unpin</button></div></th>';
        const choice = heading.querySelector('input');
        choice.setAttribute('aria-label', `Compare with State ${state.id}`);
        heading.querySelector('.pin-choice span').textContent = `State ${state.id}`;
        choice.addEventListener('change', () => { pins.select(state.id); onChange(); });
        const remove = heading.querySelector('.pin-remove');
        remove.setAttribute('aria-label', `Unpin State ${state.id}`);
        remove.addEventListener('click', () => {
          pins.remove(state.id);
          onChange();
          // Removing a focused row must leave a usable keyboard destination.
          const pinButton = document.getElementById('pin-state');
          (table.querySelector('input:checked')
            ?? (pinButton.disabled ? document.getElementById('playpause') : pinButton)).focus();
        });
        row = { group, choice, renderSettings: createPinSettingsRows(group) };
        rows.set(state.id, row);
      }
      row.choice.checked = pins.selectedId === state.id;
      row.group.classList.toggle('pin-selected', pins.selectedId === state.id);
      const changes = pinSettingChanges(state.sim.params, params, {
        referenceTotal: volumeControlReadings(state.sim).total, currentTotal,
      });
      row.renderSettings(changes);
    }
  }
  return { render };
}
