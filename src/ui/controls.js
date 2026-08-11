import { PARAMETERS, GROUPS } from '../model/index.js';

export function createControls(container, sim, onChange) {
  const rows = new Map();

  for (const group of GROUPS) {
    const section = document.createElement('section');
    section.className = 'ctrl-group';
    const h = document.createElement('h3');
    h.textContent = group.label;
    section.appendChild(h);

    for (const spec of PARAMETERS.filter((s) => s.group === group.id)) {
      section.appendChild(buildRow(spec));
    }
    container.appendChild(section);
  }

  function buildRow(spec) {
    const row = document.createElement('div');
    row.className = 'ctrl';

    const head = document.createElement('div');
    head.className = 'ctrl-head';

    const label = document.createElement('label');
    label.textContent = spec.label;
    label.htmlFor = `ctrl-${spec.id}`;
    head.appendChild(label);

    const value = document.createElement('output');
    value.className = 'ctrl-value';
    head.appendChild(value);

    if (spec.help) {
      const info = document.createElement('button');
      info.type = 'button';
      info.className = 'ctrl-info';
      info.setAttribute('aria-label', `About ${spec.label}`);
      info.setAttribute('aria-expanded', 'false');
      info.textContent = 'i';
      info.addEventListener('click', () => {
        const open = row.classList.toggle('open');
        info.setAttribute('aria-expanded', String(open));
      });
      head.appendChild(info);
    }
    row.appendChild(head);

    let input;
    if (spec.type === 'choice') {
      input = document.createElement('select');
      for (const opt of spec.options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        input.appendChild(o);
      }
    } else {
      input = document.createElement('input');
      input.type = 'range';
      input.min = spec.min;
      input.max = spec.max;
      input.step = spec.step;
    }
    input.id = `ctrl-${spec.id}`;
    input.className = 'ctrl-input';
    input.addEventListener('input', () => {
      const v = spec.type === 'choice' ? input.value : parseFloat(input.value);
      sim.setParam(spec.id, v);
      paint(spec, input, value);
      // One control can decide whether another applies at all, so relevance is
      // recomputed on every change rather than only when a scenario is loaded.
      // Without this, turning hysteresis on left its closing pressure greyed out
      // and unusable until the next reset.
      refreshRelevance();
      onChange?.(spec.id, v);
    });
    row.appendChild(input);

    if (spec.help) {
      const help = document.createElement('p');
      help.className = 'ctrl-help';
      help.textContent = spec.help;
      row.appendChild(help);
    }

    rows.set(spec.id, { spec, row, input, value });
    return row;
  }

  function paint(spec, input, value) {
    const v = sim.params[spec.id];
    if (spec.type === 'choice') {
      value.textContent = spec.options.find((o) => o.value === v)?.label ?? v;
    } else {
      const decimals = spec.step < 0.01 ? 3 : spec.step < 1 ? 2 : 0;
      value.textContent = `${Number(v).toFixed(decimals)}${spec.unit ? ' ' + spec.unit : ''}`;
    }
  }

  /**
   * Grey out the controls that would do nothing.
   *
   * A control can be irrelevant because of the ventilatory mode, or because
   * another switch has turned it off — closing pressure with hysteresis off is
   * the second kind: the slider would move and nothing would happen.
   *
   * Kept apart from `sync` because this runs on every change, and `sync` writes
   * values back into the inputs, which is the wrong thing to do to a control
   * somebody is in the middle of dragging.
   */
  function refreshRelevance() {
    const mode = sim.params.mode;
    for (const { spec, row, input } of rows.values()) {
      const relevant = (!spec.appliesTo || spec.appliesTo.includes(mode))
        && (!spec.requires || sim.params[spec.requires.id] === spec.requires.value);
      row.classList.toggle('inactive', !relevant);
      input.disabled = !relevant;
    }
  }

  /** Reflect the simulator's parameters back into the inputs. */
  function sync() {
    for (const { spec, input, value } of rows.values()) {
      input.value = sim.params[spec.id];
      paint(spec, input, value);
    }
    refreshRelevance();
  }

  sync();
  return { sync };
}
