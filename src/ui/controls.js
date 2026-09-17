import { PARAMETERS, GROUPS } from '../model/index.js';

/** Return the typed value represented by a choice element's option index. */
export function choiceValue(spec, selectedIndex) {
  return spec.options[Number(selectedIndex)]?.value;
}

/** Find the option index without coercing booleans or numbers into strings. */
export function choiceIndex(spec, value) {
  return spec.options.findIndex((option) => Object.is(option.value, value));
}

/** A scenario override is a difference from the model's neutral parameter set. */
export function parameterDiffersFromReference(current, reference, id) {
  return !Object.is(current[id], reference[id]);
}

export function createControls(container, sim, onChange) {
  const rows = new Map();
  let profileSummary = null;
  const reference = Object.fromEntries(PARAMETERS.map((spec) => [spec.id, spec.default]));
  const changeSummary = document.createElement('p');
  changeSummary.className = 'control-change-summary';
  changeSummary.setAttribute('aria-live', 'polite');
  container.appendChild(changeSummary);

  for (const group of GROUPS) {
    const section = document.createElement('section');
    section.className = 'ctrl-group';
    const h = document.createElement('h3');
    h.textContent = group.label;
    section.appendChild(h);

    let advanced = null;
    for (const spec of PARAMETERS.filter((s) => s.group === group.id)) {
      if (spec.advanced === 'recruitment') {
        if (!advanced) {
          advanced = document.createElement('details');
          advanced.className = 'recruitment-advanced';
          const summary = document.createElement('summary');
          summary.textContent = 'Advanced opening settings';
          advanced.appendChild(summary);
        }
        advanced.appendChild(buildRow(spec));
      } else {
        section.appendChild(buildRow(spec));
        if (spec.id === 'recruitmentProfile') {
          profileSummary = document.createElement('p');
          profileSummary.className = 'opening-profile-summary';
          profileSummary.setAttribute('aria-live', 'polite');
          section.appendChild(profileSummary);
        }
      }
    }
    if (advanced) section.appendChild(advanced);
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
      for (const [index, opt] of spec.options.entries()) {
        const o = document.createElement('option');
        // DOM option values are strings. Store the index so choices can safely
        // carry typed values such as the boolean used by the baroreflex switch.
        o.value = String(index);
        o.textContent = opt.label;
        input.appendChild(o);
      }
    } else if (spec.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      row.classList.add('ctrl-checkbox');
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
      const v = spec.type === 'choice' ? choiceValue(spec, input.value)
        : spec.type === 'checkbox' ? input.checked
          : parseFloat(input.value);
      sim.setParam(spec.id, v);
      sync();
      // One control can decide whether another applies at all, so relevance is
      // recomputed on every change rather than only when a scenario is loaded.
      // Without this, turning hysteresis on left its closing pressure greyed out
      // and unusable until the next reset.
      refreshRelevance();
      refreshModified();
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
      value.textContent = spec.options.find((option) => Object.is(option.value, v))?.label ?? v;
    } else if (spec.type === 'checkbox') {
      value.textContent = v ? 'On' : 'Off';
    } else {
      const decimals = spec.step < 0.01 ? 3 : spec.step < 1 ? 2 : 0;
      const shown = Number(v) * (spec.displayScale ?? 1);
      value.textContent = `${shown.toFixed(spec.displayScale ? 1 : decimals)}${spec.unit ? ' ' + spec.unit : ''}`;
    }
  }

  /**
   * Grey out the controls that would do nothing.
   *
   * A control can be irrelevant because of the ventilatory mode, or because
   * another switch has turned it off — closing pressure with hysteresis off is
   * the second kind: the slider would move and nothing would happen.
   *
   * Profiles and constrained midpoints can update several controls together;
   * synchronization keeps their displayed values and applicability consistent.
   */
  function refreshRelevance() {
    const mode = sim.params.mode;
    for (const { spec, row, input } of rows.values()) {
      if (spec.id === 'pClose') input.max = String(sim.params.pOpen);
      const relevant = (!spec.appliesTo || spec.appliesTo.includes(mode))
        && (!spec.requires || sim.params[spec.requires.id] === spec.requires.value)
        && (!(spec.advanced === 'recruitment' && spec.id !== 'reopenable')
          || (sim.params.collapsed > 0 && sim.params.reopenable > 0));
      row.classList.toggle('inactive', !relevant);
      input.disabled = !relevant;
    }
  }

  /**
   * Highlight inputs that define the current phenotype. This is a map of
   * departures from the neutral reference, not a judgement that a value is
   * clinically abnormal.
   */
  function refreshModified() {
    let count = 0;
    for (const { spec, row } of rows.values()) {
      const modified = parameterDiffersFromReference(sim.params, reference, spec.id);
      row.classList.toggle('modified', modified);
      row.dataset.modified = String(modified);
      if (modified) count++;
    }
    changeSummary.hidden = count === 0;
    changeSummary.textContent = count === 0
      ? ''
      : `${count} setting${count === 1 ? '' : 's'} differ from the reference`;
  }

  /** Reflect the simulator's parameters back into the inputs. */
  function sync() {
    for (const { spec, input, value } of rows.values()) {
      if (spec.type === 'checkbox') input.checked = Boolean(sim.params[spec.id]);
      else if (spec.type === 'choice') input.value = String(choiceIndex(spec, sim.params[spec.id]));
      else input.value = sim.params[spec.id];
      paint(spec, input, value);
    }
    refreshRelevance();
    refreshModified();
    const p = sim.params;
    if (profileSummary) profileSummary.textContent = p.collapsed === 0
      ? 'No compromised component. The selected profile will apply if one is added.'
      : p.reopenable === 0 ? 'The compromised component cannot reopen; the aerated tissue still distends.'
        : `${(p.reopenable * 100).toFixed(1)}% of the compromised component can reopen `
          + `(${(p.collapsed * p.reopenable * 100).toFixed(1)}% of the whole lung). `
          + `Opening midpoint ${p.pOpen} cmH₂O transpulmonary; `
          + (p.hysteresis === 'on' && p.pClose < p.pOpen
            ? `closing midpoint ${p.pClose} cmH₂O.` : 'opening and closing share the same range.');
  }

  sync();
  return { sync };
}
