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
    id: 'ppv', label: 'Pulse pressure var.', unit: '%', kind: 'derived',
    get: (m) => m.ppv.toFixed(0),
    // While a challenge runs, the tile says which window is being measured; once
    // it finishes, the change is what the manoeuvre was for, so it stays there
    // in place of the stroke volume variation until it is cleared.
    sub: (m) => {
      const t = m.tidalChallenge;
      if (t.running) {
        return t.phase === 'baseline'
          ? `challenge: measuring at ${(m.vtDelivered ?? 0).toFixed(0)} mL`
          : `challenge: measuring at 8 mL/kg`;
      }
      if (t.result) {
        const d = t.result.dPpv;
        return `challenge ${d >= 0 ? '+' : ''}${d.toFixed(1)} points `
          + `(${t.result.ppvBefore.toFixed(1)} → ${t.result.ppvAfter.toFixed(1)}%)`;
      }
      if (t.stale) return `SVV ${m.svv.toFixed(0)}% · challenge no longer applies`;
      return `SVV ${m.svv.toFixed(0)}%`;
    },
    quality: (m) => m.interpretability.ppv,
    // Only a claim about preload when the index is actually applicable.
    status: (m) => (m.interpretability.ppv.level === 'ok' && m.ppv >= 13
      ? ['serious', 'suggests preload dependence'] : null),
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
    sub: (m) => `mean ${m.papMean.toFixed(0)} · wedge ${m.paop.toFixed(0)}`,
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
    sub: (m) => `intrinsic ${m.autoPeep.toFixed(1)}`,
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
    id: 'wedge', label: 'Wedge', unit: 'mmHg', kind: 'derived',
    get: (m) => m.paop.toFixed(1),
    sub: (m) => `zone 3 fraction ${(m.zone3 * 100).toFixed(0)}%`,
    quality: (m) => m.interpretability.wedge,
  },
  {
    id: 'ef', label: 'LV ejection fraction', unit: '%', kind: 'measured',
    get: (m) => m.lvEf.toFixed(0),
    sub: (m) => `SV ${m.sv.toFixed(0)} mL`,
    status: (m) => (m.lvEf < 35 ? ['warning', 'reduced'] : null),
  },
];

export function createStats(container, { banner } = {}) {
  const nodes = TILES.map((tile) => {
    const el = document.createElement('div');
    el.className = 'tile';
    el.innerHTML = `
      <div class="tile-label"></div>
      <div class="tile-value"><span class="tile-number"></span><span class="tile-unit"></span></div>
      <div class="tile-sub"></div>
      <div class="tile-flag"></div>
      <div class="tile-quality"></div>`;
    el.querySelector('.tile-label').textContent = tile.label;
    el.querySelector('.tile-unit').textContent = tile.unit;
    el.dataset.kind = tile.kind;
    el.title = KIND_LABEL[tile.kind];
    container.appendChild(el);
    return {
      tile,
      el,
      number: el.querySelector('.tile-number'),
      sub: el.querySelector('.tile-sub'),
      flag: el.querySelector('.tile-flag'),
      quality: el.querySelector('.tile-quality'),
    };
  });

  function render(metrics) {
    if (banner) {
      banner.textContent = metrics.valid ? ''
        : `These readouts are suspended: ${metrics.invalidReasons.join('; ')}. `
          + 'The model has been driven outside the range where its equations describe anything.';
      banner.hidden = metrics.valid;
    }

    for (const n of nodes) {
      const q = n.tile.quality?.(metrics) ?? { level: 'ok', reasons: [] };
      const suppress = !metrics.valid || q.level === 'unavailable';

      n.number.textContent = suppress ? '—' : n.tile.get(metrics);
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
  }

  return { render };
}
