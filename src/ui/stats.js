// Live readouts. Where a value carries a warning it also carries a word, so the
// meaning never rests on colour alone.

const TILES = [
  {
    id: 'co', label: 'Cardiac output', unit: 'L/min',
    get: (m) => m.co.toFixed(2),
    status: (m) => (m.co < 3.2 ? ['critical', 'low output'] : m.co < 4.0 ? ['warning', 'borderline'] : null),
  },
  {
    id: 'map', label: 'Arterial pressure', unit: 'mmHg',
    get: (m) => `${m.sbp.toFixed(0)}/${m.dbp.toFixed(0)}`,
    sub: (m) => `mean ${m.map.toFixed(0)}`,
    status: (m) => (m.map < 60 ? ['critical', 'hypotensive'] : m.map < 68 ? ['warning', 'low'] : null),
  },
  {
    id: 'cvp', label: 'CVP', unit: 'mmHg',
    get: (m) => m.cvp.toFixed(1),
    sub: (m) => `transmural ${m.cvpTransmural.toFixed(1)}`,
  },
  {
    id: 'ppv', label: 'Pulse pressure var.', unit: '%',
    get: (m) => m.ppv.toFixed(0),
    sub: (m) => `SVV ${m.svv.toFixed(0)}%`,
    status: (m) => (m.ppv >= 13 ? ['serious', 'preload dependent'] : null),
  },
  {
    id: 'pap', label: 'Pulmonary artery', unit: 'mmHg',
    get: (m) => `${m.papSys.toFixed(0)}/${m.papDia.toFixed(0)}`,
    sub: (m) => `mean ${m.papMean.toFixed(0)} · wedge ${m.paop.toFixed(0)}`,
    status: (m) => (m.papMean > 25 ? ['warning', 'pulmonary hypertension'] : null),
  },
  {
    id: 'pvr', label: 'PVR', unit: 'Wood units',
    get: (m) => m.pvrWood.toFixed(2),
    sub: (m) => `${m.pvrDyn.toFixed(0)} dyn·s·cm⁻⁵`,
    status: (m) => (m.pvrWood > 3 ? ['warning', 'RV afterload high'] : null),
  },
  {
    id: 'rvlv', label: 'RV : LV volume', unit: 'ratio',
    get: (m) => m.rvLvRatio.toFixed(2),
    sub: (m) => `RV ${m.rvEdv.toFixed(0)} · LV ${m.lvEdv.toFixed(0)} mL`,
    status: (m) => (m.rvLvRatio > 1.4 ? ['critical', 'septal shift'] : m.rvLvRatio > 1.1 ? ['warning', 'RV dilated'] : null),
  },
  {
    id: 'pplat', label: 'Plateau pressure', unit: 'cmH₂O',
    get: (m) => m.pplat.toFixed(1),
    sub: (m) => `driving ${m.drivingPressure.toFixed(1)}`,
    status: (m) => (m.drivingPressure > 15 ? ['warning', 'high driving pressure'] : null),
  },
  {
    id: 'peep', label: 'Total PEEP', unit: 'cmH₂O',
    get: (m) => m.totalPeep.toFixed(1),
    sub: (m) => `intrinsic ${m.autoPeep.toFixed(1)}`,
    status: (m) => (m.autoPeep > 1.5 ? ['warning', 'gas trapping'] : null),
  },
  {
    id: 'ppl', label: 'Pleural swing', unit: 'cmH₂O',
    get: (m) => m.pplSwing.toFixed(1),
    sub: (m) => `now ${m.ppl.toFixed(1)}`,
  },
  {
    id: 'pmsf', label: 'Mean systemic filling', unit: 'mmHg',
    get: (m) => m.pmsf.toFixed(1),
    sub: (m) => `gradient ${m.gradientVr.toFixed(1)}`,
  },
  {
    id: 'ef', label: 'LV ejection fraction', unit: '%',
    get: (m) => m.lvEf.toFixed(0),
    sub: (m) => `SV ${m.sv.toFixed(0)} mL`,
    status: (m) => (m.lvEf < 35 ? ['warning', 'reduced'] : null),
  },
];

export function createStats(container) {
  const nodes = TILES.map((tile) => {
    const el = document.createElement('div');
    el.className = 'tile';
    el.innerHTML = `
      <div class="tile-label"></div>
      <div class="tile-value"><span class="tile-number"></span><span class="tile-unit"></span></div>
      <div class="tile-sub"></div>
      <div class="tile-flag"></div>`;
    el.querySelector('.tile-label').textContent = tile.label;
    el.querySelector('.tile-unit').textContent = tile.unit;
    container.appendChild(el);
    return {
      tile,
      el,
      number: el.querySelector('.tile-number'),
      sub: el.querySelector('.tile-sub'),
      flag: el.querySelector('.tile-flag'),
    };
  });

  function render(metrics) {
    for (const n of nodes) {
      n.number.textContent = n.tile.get(metrics);
      n.sub.textContent = n.tile.sub ? n.tile.sub(metrics) : '';
      const status = n.tile.status?.(metrics);
      n.el.dataset.status = status ? status[0] : '';
      n.flag.textContent = status ? status[1] : '';
    }
  }

  return { render };
}
