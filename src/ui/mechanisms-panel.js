import { pinSettingChanges } from './live-pins.js';

const instant = 'instantaneous';
const mean = '3 s exponential mean';
const beat = 'last completed beat';
const metric = (key, label, unit, clock, digits = 1, scale = 1) => ({
  label, unit, clock, digits, read: view => view.metrics[key] == null ? null : view.metrics[key] * scale,
});
const f = {
  ppl: metric('ppl', 'Pleural pressure', 'cmH₂O vs atmosphere', instant),
  pl: metric('pl', 'Transpulmonary pressure', 'cmH₂O', instant),
  palv: metric('palv', 'Alveolar pressure', 'cmH₂O vs atmosphere', instant),
  lung: metric('lungVolume', 'Lung gas volume', 'L', instant, 2),
  open: metric('openFraction', 'Open lung fraction', '%', instant, 1, 100),
  gradient: metric('gradientVr', 'Forward venous driving gradient', 'mmHg', 'from 3 s mean pressures'),
  pmsf: metric('pmsf', 'Systemic filling pressure', 'mmHg vs atmosphere', mean),
  cvp: metric('cvp', 'Right atrial cavity pressure', 'mmHg vs atmosphere', mean),
  crit: metric('pCrit', 'Caval critical pressure', 'mmHg vs atmosphere', mean),
  ratm: metric('cvpTransmural', 'Right atrial transmural pressure', 'mmHg', mean),
  rv: metric('rvEdv', 'RV end-diastolic volume', 'mL', beat, 0),
  pvr: metric('pvrCoefficientWood', 'Internal PVR coefficient', 'WU', instant, 2),
  pap: metric('papMean', 'Pulmonary arterial pressure', 'mmHg vs atmosphere', mean),
  reservoir: metric('pulmonaryBloodVolume', 'Pulmonary blood volume', 'mL', instant, 0),
  transit: metric('pulmonaryTransportTime', 'Transport-buffer mean time', 's', instant, 2),
  lv: metric('lvEdv', 'LV end-diastolic volume', 'mL', beat, 0),
  latm: metric('laTransmural', 'Left atrial transmural pressure', 'mmHg', mean),
  map: metric('map', 'Systemic arterial pressure', 'mmHg vs atmosphere', mean),
  svr: metric('svrDyn', 'Internal systemic resistance', 'dyn·s·cm⁻⁵', instant, 0),
  peri: metric('pPeri', 'Additional pericardial pressure', 'mmHg', mean),
  co: metric('co', 'Forward aortic output', 'L/min', beat, 2),
  hr: metric('hr', 'Effective heart rate', '/min', instant, 0),
  sv: metric('sv', 'Forward LV stroke volume', 'mL', beat, 1),
  rvco: { label: 'Forward RV output', unit: 'L/min', clock: beat, digits: 2,
    read: view => Number.isFinite(view.circ?.svRv) && view.circ?.beatDuration > 0
      ? view.circ.svRv / view.circ.beatDuration * 0.06 : null },
  lvesp: { label: 'LV end-ejection transmural pressure', unit: 'mmHg', clock: beat, digits: 1,
    read: view => view.circ?.lvEsp },
};

// Edges explain relationships, never isolated contributions or a predicted sign.
const nodes = [
  { id: 'pleural', title: 'Pressure around the heart', fields: [f.ppl, f.peri],
    text: 'Pleural pressure influences venous entry and the pressure the heart must develop relative to its surroundings. Additional pericardial pressure and ventricular interaction also influence filling. The two displayed pressures have different averaging windows.', links: ['venous', 'ejection'], page: 'transmural-pressure' },
  { id: 'lung', title: 'Lung inflation & opening', fields: [f.lung, f.open, f.pl, f.palv],
    text: 'Current gas volume, opening and alveolar pressure influence the pulmonary vessels together. An increase in lung volume does not by itself establish recruitment or predict the direction of the resistance change.', links: ['pulmonary'], page: 'panel-pvr-curve' },
  { id: 'arterial', title: 'Systemic arterial load', fields: [f.map, f.svr],
    text: 'Arterial pressure, resistance and arterial storage contribute to LV ejection conditions. MAP is referenced to atmosphere; it is not the transmural pressure the LV develops. Flow also changes arterial pressure, closing the loop.', links: ['ejection'], page: 'ventriculo-arterial-coupling' },
  { id: 'venous', title: 'Driving venous return', fields: [f.gradient, f.pmsf, f.cvp, f.crit],
    text: 'This forward-flow gradient subtracts effective downstream pressure from mean systemic filling pressure. Downstream pressure follows a smooth transition between right atrial pressure and caval critical pressure; all determinants use three-second means. Caval collapse, resistance and possible backflow also determine net inflow: this gradient alone is not a flow measurement.', links: ['rvfill'], page: 'venous-return' },
  { id: 'pulmonary', title: 'Pulmonary vascular load', fields: [f.pvr, f.pap, f.palv],
    text: 'This is the internal resistance coefficient used by the equations, not catheter-derived PVR. Pulmonary pressure, vascular storage and the alveolar flow-limiting pressure also contribute to RV load; the coefficient alone does not describe the whole afterload.', links: ['rvout'], page: 'pulmonary-vascular-resistance' },
  { id: 'ejection', title: 'LV ejection conditions', fields: [f.lvesp, f.map, f.ppl, f.peri],
    text: 'Transmural LV pressure subtracts pleural and additional pericardial pressure from cavity pressure. The displayed end-ejection value is a measured outcome of loading and contraction, not an independent afterload control. A lower value does not by itself prove improved ejection; compare filling, stroke volume and output.', links: ['output'], page: 'ventriculo-arterial-coupling' },
  { id: 'rvfill', title: 'Right ventricular filling', fields: [f.rv, f.ratm],
    text: 'End-diastolic volume describes the filled chamber. Atrial transmural pressure describes distending pressure, with a different averaging window. Contractility, diastolic stiffness and ventricular interaction also influence the subsequent ejection.', links: ['rvout'], page: 'ventricular-interdependence' },
  { id: 'rvout', title: 'Right ventricular ejection', fields: [f.rvco],
    text: 'Forward pulmonary-valve volume divided by the duration of the last completed beat. It reflects filling, contraction and pulmonary loading together. RV and LV outputs may differ during a transient as blood redistributes.', links: ['reservoir'], page: 'pulmonary-transit' },
  { id: 'reservoir', title: 'Pulmonary blood storage', fields: [f.reservoir, f.transit],
    text: 'Blood stored in pulmonary arteries, transport buffer and veins separates right-sided ejection from left-sided delivery. The buffer mean time is an internal transport timescale, not a fixed delay or an independently measured clinical transit time.', links: ['lvfill'], page: 'pulmonary-transit' },
  { id: 'lvfill', title: 'Left ventricular filling', fields: [f.lv, f.latm],
    text: 'Pulmonary delivery and atrial, ventricular and pericardial mechanics determine left-sided filling. A change here may offset an apparently favourable change in ejection conditions.', links: ['output'], page: 'ventricular-interdependence' },
  { id: 'output', title: 'Combined result · systemic output', fields: [f.co, f.sv, f.hr],
    text: 'This is the combined result in the closed circulation. Contractility, heart rate, vascular tone and any enabled reflex remain part of it. Differences between two evolving states do not isolate how much each changed control contributed. These selected links are a teaching map, not a complete diagram of every feedback.', links: ['arterial'], page: 'numeric-tiles' },
];

/** Compare only available numbers, rounded to the precision actually shown. */
export function mechanismReading(field, view) {
  if (view?.metrics?.valid !== true) return { value: null, text: '—', reason: view?.metrics?.invalidReasons?.join('; ') || 'Model state unavailable or invalid' };
  const value = field.read(view);
  if (!Number.isFinite(value)) return { value: null, text: '—', reason: 'Measurement unavailable' };
  const rounded = Number(value.toFixed(field.digits));
  return { value: rounded, text: rounded.toFixed(field.digits), reason: '' };
}
export function mechanismComparison(field, current, reference) {
  const now = mechanismReading(field, current);
  const before = mechanismReading(field, reference);
  const difference = now.value == null || before.value == null ? null
    : Number((now.value - before.value).toFixed(field.digits));
  const delta = difference == null ? 'Δ —' : difference === 0 ? 'Δ 0' : `Δ ${difference > 0 ? '+' : '−'}${Math.abs(difference).toFixed(field.digits)}`;
  return { now, before, delta };
}
export const mechanismFields = f;

function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

export function createMechanismsPanel(host) {
  host.innerHTML = `
    <header><h2>Heart–lung mechanisms</h2><p class="mechanism-context"></p></header>
    <p>Settings below read reference → current. The map shows their <strong>combined result</strong>; arrows show physiological links, not the contribution of each intervention. Dashed links concern surrounding pressure and LV ejection.</p>
    <ul class="mechanism-settings" aria-label="Changed control settings"></ul>
    <p class="mechanism-timing">Large value: current patient · below: selected reference · Δ: current − reference. Each number keeps its labelled measurement window. Cycles can drift out of phase; pinning does not establish equilibrium.</p>
    <p class="mechanism-history" hidden>Inspecting the past: live comparisons are hidden. Return to the latest instant or press Play.</p>
    <div class="mechanism-live">
      <div class="mechanism-map"><svg class="mechanism-edges" aria-hidden="true"></svg></div>
      <section class="mechanism-detail" aria-label="Selected mechanism explanation"><h3></h3><p class="mechanism-explanation"></p><dl></dl><p class="mechanism-links"></p><a target="_blank" rel="noopener">Read in the manual ↗</a></section>
      <p class="mechanism-timing">The selected pathways do not exhaust the model. Changes in contractility, heart rate, systemic tone, pericardial constraint or reflex activity remain included in the measured result. Same settings can retain different pressure histories or manoeuvres.</p>
    </div>`;
  const map = host.querySelector('.mechanism-map');
  const svg = host.querySelector('svg');
  const detail = host.querySelector('.mechanism-detail');
  const cards = new Map();
  let selected = 'output';
  let context = null;
  let settingsKey = '';
  let detailRows = [];
  let suspended = false;
  let destroyed = false;
  for (const node of nodes) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mechanism-node';
    card.dataset.mechanism = node.id;
    card.innerHTML = '<span class="mechanism-title"></span><span class="mechanism-signal"></span><span class="mechanism-value"></span><span class="mechanism-unit"></span><span class="mechanism-reference"></span><span class="mechanism-delta"></span><span class="mechanism-clock"></span>';
    card.querySelector('.mechanism-title').textContent = node.title;
    card.querySelector('.mechanism-signal').textContent = node.fields[0].label;
    card.querySelector('.mechanism-unit').textContent = node.fields[0].unit;
    card.querySelector('.mechanism-clock').textContent = node.fields[0].clock;
    card.setAttribute('aria-controls', 'mechanism-selected-detail');
    card.addEventListener('click', () => { selected = node.id; selectDetail(); if (context) updateReadings(); });
    map.appendChild(card);
    cards.set(node.id, {
      card, value: card.querySelector('.mechanism-value'), ref: card.querySelector('.mechanism-reference'), delta: card.querySelector('.mechanism-delta'),
    });
  }
  detail.id = 'mechanism-selected-detail';
  function selectDetail() {
    const node = nodes.find(n => n.id === selected);
    for (const [id, { card }] of cards) card.setAttribute('aria-pressed', String(id === selected));
    detail.querySelector('h3').textContent = node.title;
    detail.querySelector('.mechanism-explanation').textContent = node.text;
    detail.querySelector('.mechanism-links').textContent = `Linked to: ${node.links.map(id => nodes.find(n => n.id === id).title).join('; ')}.`;
    detail.querySelector('a').href = `manual/#/${node.page}`;
    const dl = detail.querySelector('dl');
    dl.replaceChildren();
    detailRows = node.fields.map(field => {
      const dt = document.createElement('dt');
      dt.textContent = `${field.label} (${field.unit}; ${field.clock})`;
      const dd = document.createElement('dd');
      dl.append(dt, dd);
      return { field, dd };
    });
  }
  function updateReadings() {
    if (!context || suspended) return;
    const reference = context.reference;
    for (const node of nodes) {
      const reading = mechanismComparison(node.fields[0], context.current, reference.sim);
      const ui = cards.get(node.id);
      setText(ui.value, reading.now.text);
      setText(ui.ref, `State ${reference.id}: ${reading.before.text}`);
      setText(ui.delta, reading.delta);
      const reason = [reading.now.reason && `Current: ${reading.now.reason}`, reading.before.reason && `State ${reference.id}: ${reading.before.reason}`].filter(Boolean).join('; ');
      ui.card.title = reason || node.fields[0].label;
    }
    for (const { field, dd } of detailRows) {
      const reading = mechanismComparison(field, context.current, reference.sim);
      setText(dd, `${reading.now.text} · State ${reference.id}: ${reading.before.text} · ${reading.delta}`);
    }
  }
  // Only structural size changes redraw edges. Numerical updates never read layout.
  const edgePairs = [['pleural', 'ejection'], ['ejection', 'output'], ['pleural', 'venous'], ['lung', 'pulmonary'], ['arterial', 'ejection'], ['venous', 'rvfill'], ['pulmonary', 'rvout'], ['rvfill', 'rvout'], ['rvout', 'reservoir'], ['reservoir', 'lvfill'], ['lvfill', 'output']];
  function drawEdges() {
    if (destroyed || suspended) return;
    svg.replaceChildren();
    if (map.clientWidth < 640) return; // Mobile cards retain named links in the explanation.
    const bounds = map.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = '<marker id="mechanism-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker>';
    svg.appendChild(defs);
    for (const [from, to] of edgePairs) {
      const a = cards.get(from).card.getBoundingClientRect();
      const b = cards.get(to).card.getBoundingClientRect();
      const side = Math.abs(a.top - b.top) < 2;
      const rising = b.top < a.top;
      const x1 = (side ? a.right : (a.left + a.right) / 2) - bounds.left;
      const y1 = (side ? (a.top + a.bottom) / 2 : rising ? a.top : a.bottom) - bounds.top;
      const x2 = (side ? b.left : (b.left + b.right) / 2) - bounds.left;
      const y2 = (side ? (b.top + b.bottom) / 2 : rising ? b.bottom : b.top) - bounds.top;
      const path = document.createElementNS(ns, 'path');
      const bypass = from === 'ejection';
      path.setAttribute('d', bypass
        ? `M${a.right - bounds.left},${(a.top + a.bottom) / 2 - bounds.top} H${bounds.width - 4} V${(b.top + b.bottom) / 2 - bounds.top} H${b.right - bounds.left}`
        : side ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} V${(y1 + y2) / 2} H${x2} V${y2}`);
      path.setAttribute('marker-end', 'url(#mechanism-arrow)');
      if ((to === 'ejection' && from === 'pleural') || bypass) path.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(path);
    }
  }
  const observer = new ResizeObserver(drawEdges);
  observer.observe(map);
  selectDetail();
  function render(next) {
    context = next;
    suspended = next.historical;
    host.querySelector('.mechanism-history').hidden = !suspended;
    host.querySelector('.mechanism-live').hidden = suspended;
    host.querySelector('.mechanism-settings').hidden = suspended;
    setText(host.querySelector('.mechanism-context'), `Current patient vs State ${next.reference.id} · ${next.running ? 'Running' : 'Paused'}`);
    if (suspended) return;
    const changes = pinSettingChanges(next.reference.sim.params, next.current.params, {
      referenceBloodVolume: next.reference.sim.bloodVolumeReference, currentBloodVolume: next.current.bloodVolumeReference,
    });
    const key = JSON.stringify(changes);
    if (key !== settingsKey) {
      settingsKey = key;
      const list = host.querySelector('.mechanism-settings');
      list.replaceChildren();
      for (const text of changes.length ? changes.map(change => change.text) : ['Same control settings; previous histories may differ.']) {
        const item = document.createElement('li'); item.textContent = text; list.appendChild(item);
      }
    }
    updateReadings();
  }
  return { render, destroy() { destroyed = true; observer.disconnect(); context = null; host.replaceChildren(); } };
}
