// Live readouts.
//
// Two things are kept apart here, because conflating them is how a simulator
// teaches the wrong lesson:
//
//   kind        what the number *is* — a measurement the model makes, an index
//               derived from it, or an internal coefficient of the model
//   quality     whether it can be read as the clinical quantity it shares a
//               name with, given the current conditions
//
// A value whose quality is `unavailable` is not shown at all. Printing a number
// next to the words "not interpretable" still invites reading it.
//
// Tiles are user-customisable: they can be reordered by drag-and-drop, hidden
// individually via a close button, and added back from a picker. The set of
// visible tiles and their order are persisted to localStorage so they survive
// reloads. Paw (airway pressure) is shown by default.

const KIND_LABEL = {
  measured: 'model measurement',
  derived: 'derived index',
  coefficient: 'internal model coefficient',
};

const TILES = [
  {
    id: 'co', label: 'Cardiac output', unit: 'L/min', kind: 'measured',
    get: (m) => m.co.toFixed(2),
    status: (m) => (m.co < 3.2 ? ['critical', 'low output'] : m.co < 4.0 ? ['warning', 'borderline'] : null),
  },
  {
    id: 'map', label: 'Arterial pressure', unit: 'mmHg', kind: 'measured',
    get: (m) => `${m.sbp.toFixed(0)}/${m.dbp.toFixed(0)}`,
    sub: (m) => `mean ${m.map.toFixed(0)}`,
    status: (m) => (m.map < 60 ? ['critical', 'hypotensive'] : m.map < 68 ? ['warning', 'low'] : null),
  },
  {
    id: 'cvp', label: 'CVP', unit: 'mmHg', kind: 'measured',
    get: (m) => m.cvp.toFixed(1),
    sub: (m) => `transmural ${m.cvpTransmural.toFixed(1)}`,
  },
  {
    id: 'paw', label: 'Airway pressure', unit: 'cmH₂O', kind: 'measured',
    get: (m) => m.paw.toFixed(1),
    sub: (m) => `peak ${m.ppeak.toFixed(1)}`,
  },
  {
    id: 'ppv', label: 'Pulse pressure var.', unit: '%', kind: 'derived',
    get: (m) => m.ppv.toFixed(0),
    sub: (m) => `SVV ${m.svv.toFixed(0)}%`,
    quality: (m) => m.interpretability.ppv,
    // Intentionally no diagnostic colour threshold: the model demonstrates how
    // ventilation changes PPV, but is not calibrated to turn it into a fluid-
    // responsiveness decision. See docs/MODEL_DECISIONS.md.
  },
  {
    id: 'preload', label: 'Preload reserve', unit: '%/mmHg', kind: 'coefficient',
    get: (m) => (m.preload ? (m.preload.relative * 100).toFixed(1) : '—'),
    sub: (m) => (m.preload
      ? `${m.preload.steep ? 'steep limb' : 'plateau'} · ${(m.preload.slope).toFixed(2)} L/min per mmHg`
      : 'no crossing'),
    quality: (m) => m.interpretability.preload,
    // Unlike variation, this survives spontaneous breathing and a small tidal
    // volume, because it is read off the curves rather than off the waveform.
    status: (m) => (m.preload && m.preload.steep
      ? ['serious', 'filling would raise output'] : null),
  },
  {
    id: 'pap', label: 'Pulmonary artery', unit: 'mmHg', kind: 'measured',
    get: (m) => `${m.papSys.toFixed(0)}/${m.papDia.toFixed(0)}`,
    sub: (m) => `mean ${m.papMean.toFixed(0)} · wedge surrogate ${m.paop.toFixed(0)}`,
    // ESC/ERS 2022: mPAP above 20 mmHg, classified by wedge and PVR.
    status: (m) => (m.phPresent
      ? [m.phClass === 'unclassified' ? 'warning' : 'serious', `pulmonary hypertension, ${m.phClass}`]
      : null),
  },
  {
    id: 'pvrDerived', label: 'PVR, derived', unit: 'Wood units', kind: 'derived',
    get: (m) => (m.pvrDerivedWood === null ? '—' : m.pvrDerivedWood.toFixed(2)),
    sub: () => '(mPAP − wedge) / CO',
    quality: (m) => m.interpretability.pvrDerived,
    status: (m) => (m.pvrDerivedWood !== null && m.pvrDerivedWood > 2
      ? ['warning', 'above the 2 WU threshold'] : null),
  },
  {
    id: 'pvrCoeff', label: 'Pulmonary resistance coefficient', unit: 'Wood units', kind: 'coefficient',
    get: (m) => m.pvrCoefficientWood.toFixed(2),
    sub: (m) => `${m.pvrDyn.toFixed(0)} dyn·s·cm⁻⁵ · from the J-curve`,
  },
  {
    id: 'rvlv', label: 'RV : LV end-diastolic volume', unit: 'model ratio', kind: 'coefficient',
    get: (m) => m.rvLvRatio.toFixed(2),
    sub: (m) => `RV ${m.rvEdv.toFixed(0)} · LV ${m.lvEdv.toFixed(0)} mL`,
    // A volume ratio in a lumped model, not the mid-cavity diameter ratio an
    // echocardiographer measures, so it is described rather than diagnosed.
    status: (m) => (m.rvLvRatio > 1.4 ? ['critical', 'RV much larger than LV']
      : m.rvLvRatio > 1.1 ? ['warning', 'RV larger than LV'] : null),
  },
  {
    id: 'crs', label: 'Respiratory system compliance', unit: 'mL/cmH₂O', kind: 'derived',
    get: (m) => (m.crsMeasured === null ? '—' : m.crsMeasured.toFixed(0)),
    // The number a ventilator prints tracks how much lung is being ventilated,
    // not how stiff the tissue is. Showing the open fraction beside it is the
    // whole point of separating the two.
    sub: (m) => `${(m.openFraction * 100).toFixed(0)}% of the lung open`
      + (m.hysteresis ? ` · ${m.hysteresis.band} · pressure alone would give ${m.hysteresis.equilibrium}`
        : ` · resting volume ${m.relaxVolume.toFixed(2)} L`),
  },
  {
    id: 'ri', label: 'Recruitment-to-inflation', unit: 'R/I', kind: 'derived',
    get: (m) => Number(m.riRatio).toFixed(2),
    sub: (m) => `PEEP 5→15 · target ${Number(m.riTarget).toFixed(2)}`
      + (m.riRecruitedVolume === null ? '' : ` · recruited ${Math.max(0, m.riRecruitedVolume).toFixed(0)} mL`),
    quality: (m) => m.interpretability.ri,
    // No diagnostic colour threshold: 0.5 split the original cohort at its
    // median. It is useful for phenotype comparison, not a validated command
    // to raise PEEP in an individual patient.
  },
  {
    id: 'stressIndex', label: 'Stress index', unit: '', kind: 'derived',
    get: (m) => (m.stressIndex === null ? '—' : m.stressIndex.toFixed(2)),
    sub: (m) => (m.stressIndex === null ? 'constant flow, passive patient'
      : m.stressIndex > 1.05 ? 'airway pressure curling upward — running out of room'
        : m.stressIndex < 0.95 ? 'curling downward — units still opening during the breath'
          : 'straight — neither opening nor overdistending'),
    quality: (m) => m.interpretability.stressIndex,
    status: (m) => (m.stressIndex === null ? null
      : m.stressIndex > 1.1 ? ['serious', 'tidal overdistension']
        : m.stressIndex < 0.9 ? ['warning', 'tidal recruitment — PEEP may be too low'] : null),
  },
  {
    id: 'pplat', label: 'Plateau pressure', unit: 'cmH₂O', kind: 'measured',
    get: (m) => m.pplat.toFixed(1),
    sub: (m) => `driving ${m.drivingPressure.toFixed(1)}`,
    quality: (m) => m.interpretability.plateau,
    status: (m) => (m.interpretability.plateau.level === 'ok' && m.drivingPressure > 15
      ? ['warning', 'high driving pressure'] : null),
  },
  {
    id: 'peep', label: 'Total PEEP', unit: 'cmH₂O', kind: 'measured',
    get: (m) => m.totalPeep.toFixed(1),
    sub: (m) => `intrinsic ${m.autoPeep.toFixed(1)} · dynamically trapped ${m.trappedVolume.toFixed(0)} mL`
      + (m.expiratoryFlowLimited ? ' · EFL active' : ''),
    status: (m) => (m.autoPeep > 1.5 ? ['warning', 'gas trapping'] : null),
  },
  {
    id: 'ppl', label: 'Pleural swing', unit: 'cmH₂O', kind: 'measured',
    get: (m) => m.pplSwing.toFixed(1),
    sub: (m) => `now ${m.ppl.toFixed(1)}`,
  },
  {
    id: 'pmsf', label: 'Mean systemic filling', unit: 'mmHg', kind: 'derived',
    get: (m) => m.pmsf.toFixed(1),
    sub: (m) => `gradient ${m.gradientVr.toFixed(1)}`,
  },
  {
    id: 'wedge', label: 'Wedge surrogate', unit: 'mmHg', kind: 'derived',
    get: (m) => m.paop.toFixed(1),
    // This is a normalised pressure-margin heuristic, not the anatomical share
    // of a regional lung in zone 3. Calling it a fraction overclaimed what a
    // one-compartment pulmonary bed can know.
    sub: (m) => `zone 3 index ${(m.zone3 * 100).toFixed(0)}%`,
    quality: (m) => m.interpretability.wedge,
  },
  {
    id: 'ef', label: 'LV ejection fraction', unit: '%', kind: 'measured',
    get: (m) => m.lvEf.toFixed(0),
    sub: (m) => `SV ${m.sv.toFixed(0)} mL`,
    status: (m) => (m.lvEf < 35 ? ['warning', 'reduced'] : null),
  },
];

const TILE_BY_ID = new Map(TILES.map((tile) => [tile.id, tile]));

// Default visible tiles — paw is included from the start.
const DEFAULT_VISIBLE = TILES.map((t) => t.id);

const STORAGE_KEY = 'arthur.tileLayout';

function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch { /* ignore */ }
  return [...DEFAULT_VISIBLE];
}

function saveLayout(visibleIds) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleIds));
  } catch { /* ignore */ }
}

/**
 * Return the primary string exactly as the corresponding numerical tile shows
 * it, including suppression when the model or the measurement is not valid.
 * Other UI surfaces use this instead of independently reformatting a clinical
 * summary and silently drifting away from the tile.
 */
export function tilePrimaryValue(id, metrics) {
  const tile = TILE_BY_ID.get(id);
  if (!tile || !metrics.valid) return '—';
  const quality = tile.quality?.(metrics) ?? { level: 'ok' };
  return quality.level === 'unavailable' ? '—' : tile.get(metrics);
}

export function createStats(container, { banner } = {}) {
  let visibleIds = loadLayout();
  const nodeMap = new Map(); // id → { tile, el, number, sub, flag, quality }
  // Start with null metrics — the first render() call from the main loop will
  // populate the values. Calling renderTile with an empty object crashes the
  // tile getters (m.co.toFixed → undefined.toFixed).
  let currentMetrics = null;

  // --- Build a single tile element -------------------------------------------
  function buildTile(tile) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.tileId = tile.id;
    el.draggable = true;
    el.innerHTML = `
      <button class="tile-remove" type="button" aria-label="Hide ${tile.label}" title="Hide">×</button>
      <div class="tile-label"></div>
      <div class="tile-value"><span class="tile-number"></span><span class="tile-unit"></span></div>
      <div class="tile-sub"></div>
      <div class="tile-flag"></div>
      <div class="tile-quality"></div>`;
    el.querySelector('.tile-label').textContent = tile.label;
    el.querySelector('.tile-unit').textContent = tile.unit;
    el.dataset.kind = tile.kind;
    el.title = KIND_LABEL[tile.kind];

    el.querySelector('.tile-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      hideTile(tile.id);
    });

    // --- drag-and-drop --------------------------------------------------------
    el.addEventListener('dragstart', () => {
      el.classList.add('tile-dragging');
      // On some browsers we need a minimal transfer to allow the drop.
      e => e.dataTransfer?.setData('text/plain', tile.id);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('tile-dragging');
      container.querySelectorAll('.tile-drop-before').forEach(n => n.classList.remove('tile-drop-before'));
      container.querySelectorAll('.tile-drop-after').forEach(n => n.classList.remove('tile-drop-after'));
    });
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      el.classList.add('tile-drop-target');
    });
    el.addEventListener('dragleave', () => {
      el.classList.remove('tile-drop-target');
    });
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('tile-drop-target');
      const draggedId = el.previousElementSibling?.classList.contains('tile-dragging')
        ? null : null; // not used; we use event delegation below
      // We track the dragged id on the container.
      const draggedTileId = container._draggedTileId;
      if (!draggedTileId || draggedTileId === tile.id) return;
      reorderTile(draggedTileId, tile.id);
    });

    return {
      tile,
      el,
      number: el.querySelector('.tile-number'),
      sub: el.querySelector('.tile-sub'),
      flag: el.querySelector('.tile-flag'),
      quality: el.querySelector('.tile-quality'),
    };
  }

  // We use container-level drag tracking because dragstart fires on the
  // source element and drop on the target.
  container.addEventListener('dragstart', (e) => {
    const tileEl = e.target.closest('.tile');
    if (!tileEl) return;
    container._draggedTileId = tileEl.dataset.tileId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tileEl.dataset.tileId);
  });

  // --- Render a single tile's values ------------------------------------------
  function renderTile(n, metrics) {
    if (!metrics) return; // not yet available — tiles show placeholders
    const q = n.tile.quality?.(metrics) ?? { level: 'ok', reasons: [] };
    const suppress = !metrics.valid || q.level === 'unavailable';

    n.number.textContent = suppress ? '—' : tilePrimaryValue(n.tile.id, metrics);
    n.sub.textContent = suppress ? '' : (n.tile.sub ? n.tile.sub(metrics) : '');

    const status = suppress ? null : n.tile.status?.(metrics);
    n.el.dataset.status = status ? status[0] : '';
    n.flag.textContent = status ? status[1] : '';

    n.el.dataset.quality = metrics.valid ? q.level : 'unavailable';
    n.quality.textContent = q.level === 'ok' ? ''
      : q.level === 'unavailable' ? `not interpretable — ${q.reasons[0] ?? ''}`
        : `interpret with caution — ${q.reasons[0] ?? ''}`;
    if (q.reasons.length > 1) n.quality.title = q.reasons.join('; ');
  }

  // --- Rebuild the DOM from the current visibleIds ---------------------------
  function rebuild() {
    // Remove all tile elements and the add button; re-create everything.
    container.innerHTML = '';
    nodeMap.clear();

    for (const id of visibleIds) {
      const tile = TILE_BY_ID.get(id);
      if (!tile) continue;
      const n = buildTile(tile);
      nodeMap.set(id, n);
      container.appendChild(n.el);
      if (currentMetrics) renderTile(n, currentMetrics);
    }

    // Add the "+" button at the end.
    addAddButton();
  }

  // --- The "+" button and picker ----------------------------------------------
  function addAddButton() {
    const addBtn = document.createElement('div');
    addBtn.className = 'tile tile-add';
    addBtn.innerHTML = `<button type="button" class="tile-add-btn" aria-label="Add a readout" title="Add a readout">+</button>`;

    addBtn.querySelector('.tile-add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePicker(addBtn);
    });

    container.appendChild(addBtn);
  }

  function togglePicker(parentEl) {
    // Close any existing picker.
    const existing = document.querySelector('.tile-picker');
    if (existing) { existing.remove(); return; }

    const hidden = TILES.filter(t => !visibleIds.includes(t.id));
    if (hidden.length === 0) {
      // Nothing to add — all tiles visible. Show a brief message.
      const picker = document.createElement('div');
      picker.className = 'tile-picker';
      picker.textContent = 'All readouts are already shown.';
      document.body.appendChild(picker);
      positionPicker(picker, parentEl);
      setTimeout(() => picker.remove(), 2000);
      return;
    }

    const picker = document.createElement('div');
    picker.className = 'tile-picker';
    picker.innerHTML = '<div class="tile-picker-title">Add a readout</div>';

    for (const tile of hidden) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'tile-picker-item';
      item.innerHTML = `<span class="tile-picker-label">${tile.label}</span><span class="tile-picker-kind">${KIND_LABEL[tile.kind]}</span>`;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        addTile(tile.id);
        picker.remove();
      });
      picker.appendChild(item);
    }

    // Close picker on outside click.
    setTimeout(() => {
      function onAway(e) {
        if (!picker.contains(e.target) && !parentEl.contains(e.target)) {
          picker.remove();
          document.removeEventListener('click', onAway, true);
        }
      }
      document.addEventListener('click', onAway, true);
    }, 0);

    // Append to <body> so it escapes any stacking context created by the
    // tile grid or panel containers. A fixed z-index keeps it above everything.
    document.body.appendChild(picker);
    positionPicker(picker, parentEl);
  }

  /** Position the picker just below the + button, clipped to the viewport. */
  function positionPicker(picker, anchor) {
    const r = anchor.getBoundingClientRect();
    const pw = picker.offsetWidth || 220;
    let left = r.right - pw;
    if (left < 8) left = 8;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - 8 - pw;
    picker.style.position = 'fixed';
    picker.style.top = (r.bottom + 6) + 'px';
    picker.style.left = left + 'px';
  }

  // --- Tile visibility operations --------------------------------------------
  function hideTile(id) {
    if (visibleIds.length <= 1) return; // keep at least one visible
    visibleIds = visibleIds.filter(v => v !== id);
    saveLayout(visibleIds);
    rebuild();
  }

  function addTile(id) {
    if (visibleIds.includes(id)) return;
    visibleIds.push(id);
    saveLayout(visibleIds);
    rebuild();
  }

  function reorderTile(draggedId, targetId) {
    if (draggedId === targetId) return;
    const fromIdx = visibleIds.indexOf(draggedId);
    if (fromIdx < 0) return;
    visibleIds.splice(fromIdx, 1);
    const toIdx = visibleIds.indexOf(targetId);
    // Insert before the target so the dragged tile takes its position.
    visibleIds.splice(toIdx, 0, draggedId);
    saveLayout(visibleIds);
    rebuild();
  }

  // --- Public render ---------------------------------------------------------
  function render(metrics) {
    currentMetrics = metrics;
    if (banner) {
      banner.textContent = metrics.valid ? ''
        : `These readouts are suspended: ${metrics.invalidReasons.join('; ')}. `
          + 'The model has been driven outside the range where its equations describe anything.';
      banner.hidden = metrics.valid;
    }

    for (const n of nodeMap.values()) {
      renderTile(n, metrics);
    }
  }

  rebuild();

  return { render };
}