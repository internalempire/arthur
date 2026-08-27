// Text equivalents for the canvas panels.
//
// A canvas is opaque to a screen reader, and an aria-label that names the chart
// says what it is without saying what it shows. Each panel gets two things: a
// one-sentence live summary announced through `aria-describedby`, and a data
// table anyone can open — which turns out to be useful with a mouse too, when
// you want the number rather than the pixel.

import {
  RESISTANCE_TO_WOOD, pvrComponents, lungRegions, chestWallPressure,
} from '../model/index.js';
import { endExpiratoryPressurePresentation } from './stats.js';

const n = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

const PANELS = [
  {
    match: 'Time-aligned waveforms',
    title: 'Waveforms',
    summary: (sim) => {
      const m = sim.metrics;
      const psvTiming = m.pressureSupportTiming?.cycleStatus === 'early'
        ? ' Pressure support cycled before neural inspiration ended.'
        : '';
      return `Airway pressure ${n(m.paw)}, alveolar pressure ${n(m.palv)}, pleural pressure ${n(m.ppl)} and transpulmonary pressure ${n(m.pl)} cmH₂O; `
        + `arterial ${n(m.sbp, 0)} over ${n(m.dbp, 0)}, pulmonary artery ${n(m.papSys, 0)} over ${n(m.papDia, 0)}, `
        + `central venous ${n(m.cvp)} mmHg; lung volume ${n((m.lungVolume - sim.resp.relaxVolume) * 1000, 0)} mL above resting.${psvTiming}`;
    },
    rows: (sim) => {
      const m = sim.metrics;
      const rows = [
        ['Airway pressure, now', `${n(m.paw)} cmH₂O`],
        ['Airway pressure, peak this breath', `${n(m.ppeak)} cmH₂O`],
        ['Alveolar pressure, now', `${n(m.palv)} cmH₂O (Paw − Palv ${n(m.paw - m.palv)})`],
        ['Pleural pressure, now', `${n(m.ppl)} cmH₂O`],
        ['Pleural pressure, swing this breath', `${n(m.pplSwing)} cmH₂O`],
        ['Transpulmonary pressure, now', `${n(m.pl)} cmH₂O (Palv ${n(m.palv)} − Ppl ${n(m.ppl)})`],
        ['Arterial pressure', `${n(m.sbp, 0)}/${n(m.dbp, 0)}, mean ${n(m.map, 0)} mmHg`],
        ['Pulmonary artery', `${n(m.papSys, 0)}/${n(m.papDia, 0)}, mean ${n(m.papMean, 0)} mmHg`],
        ['Central venous pressure', `${n(m.cvp)} mmHg (transmural ${n(m.cvpTransmural)})`],
        ['Tidal volume delivered', `${n(m.vtDelivered, 0)} mL`],
        ['Minute ventilation', `${n(m.minuteVentilation)} L/min`],
      ];
      if (m.pressureSupportTiming) {
        const timing = m.pressureSupportTiming;
        const cycle = timing.cycleStatus === 'early'
          ? `early cycling — support ended at ${n(timing.cycleTime, 2)} s while inspiratory drive persisted`
          : timing.cycleStatus === 'not-early'
            ? 'no early cycling detected on the latest completed breath'
            : 'waiting for a completed pressure-support breath';
        rows.splice(6, 0,
          ['Pressure-support trigger delay', timing.triggerDelay === null
            ? 'no effective trigger yet'
            : `${n(timing.triggerDelay, 2)} s from the start of neural inspiration`],
          ['Pressure-support cycling', cycle]);
      }
      return rows;
    },
  },
  {
    match: 'Guyton diagram',
    title: 'Guyton diagram',
    summary: (sim) => {
      const m = sim.metrics, op = m.respiratoryOperatingPoint;
      return `Over the most recent breath, mean venous inflow is ${n(op.flow, 2)} L/min at a mean right atrial pressure of ${n(op.pra)} mmHg. `
        + `Mean systemic filling pressure is ${n(op.pmsf)} mmHg, so the gradient `
        + `driving venous return on the same respiratory clock is ${n(m.respiratoryGradientVr)} mmHg. `
        + `The faint trail retains the one-heartbeat means that move through the breath.`;
    },
    rows: (sim) => {
      const m = sim.metrics, op = m.respiratoryOperatingPoint, beat = m.operatingPoint;
      return [
        ['Right atrial pressure (respiratory mean)', `${n(op.pra)} mmHg`],
        ['Venous inflow (respiratory mean)', `${n(op.flow, 2)} L/min`],
        ['Right atrial pressure (latest heartbeat)', `${n(beat.pra)} mmHg`],
        ['Venous inflow (latest heartbeat)', `${n(beat.flow, 2)} L/min`],
        ['Mean systemic filling pressure (respiratory mean)', `${n(op.pmsf)} mmHg`],
        ['Mean systemic filling pressure (now)', `${n(sim.circ.p.pmsf)} mmHg`],
        ['Gradient for venous return', `${n(m.respiratoryGradientVr)} mmHg`],
        ['Systemic venous stressed volume', `${n(m.stressedVenous, 0)} mL`],
        ['Mobilised by venous tone', `${n(m.venousToneVolume, 0)} mL`],
        ['Systemic venous unstressed volume', `${n(m.unstressedVenous, 0)} mL`],
        ['Venous compliance (slope)', `${n(m.effectiveCsv, 0)} mL/mmHg`],
        ['Critical closing pressure (respiratory mean)', `${n(op.pCrit)} mmHg`],
        ['Critical closing pressure (now)', `${n(sim.circ.p.pCrit)} mmHg`],
        ['Resistance to venous return (respiratory mean)', `${n(op.rvrEff, 3)} mmHg·s/mL`],
        ['Resistance to venous return (now)', `${n(sim.circ.p.rvrEff, 3)} mmHg·s/mL`],
        ['Pleural pressure (respiratory mean)', `${n(op.ppl)} mmHg`],
        ['Pericardial pressure', `${n(op.pPeri)} mmHg`],
      ];
    },
  },
  {
    match: 'Campbell diagram',
    title: 'Campbell diagram',
    summary: (sim) => {
      const m = sim.metrics, p = sim.params;
      const relaxedPpl = chestWallPressure(p, m.lungVolume);
      const musclePressure = Math.max(0, relaxedPpl - m.ppl);
      return `The classical Campbell construction places pleural pressure against absolute lung volume. `
        + `At ${n(m.lungVolume, 2)} L, pleural pressure is ${n(m.ppl)} cmH₂O; the relaxed chest wall would be at `
        + `${n(relaxedPpl)} cmH₂O. Their horizontal separation represents ${n(musclePressure)} cmH₂O of inspiratory muscle pressure.`;
    },
    rows: (sim) => {
      const m = sim.metrics, p = sim.params;
      const relaxedPpl = chestWallPressure(p, m.lungVolume);
      const musclePressure = Math.max(0, relaxedPpl - m.ppl);
      const endExpiratory = endExpiratoryPressurePresentation(m);
      return [
        ['Absolute lung volume', `${n(m.lungVolume, 2)} L`],
        ['Relaxation volume (Vrel)', `${n(sim.resp.relaxVolume, 2)} L`],
        ['Pleural pressure', `${n(m.ppl)} cmH₂O`],
        ['Relaxed chest-wall pressure at this volume', `${n(relaxedPpl)} cmH₂O`],
        ['Inspiratory muscle pressure', `${n(musclePressure)} cmH₂O`],
        ['Transpulmonary pressure', `${n(m.pl)} cmH₂O`],
        ['Chest wall compliance near the reference volume', `${p.ccw} mL/cmH₂O`],
        ['Chest wall load', `${n(p.cwLoad)} cmH₂O`],
        ['Aerated-lung compliance setting', `${p.clung} mL/cmH₂O`],
        ['Maximum lung capacity', `${n(p.lungCapacity, 1)} L`],
        ['Live respiratory-system compliance (not a Campbell curve)', `${n(m.crs, 0)} mL/cmH₂O`],
        ['Recruitment-to-inflation ratio', m.interpretability.ri.level === 'unavailable'
          ? 'not applicable without collapsed lung'
          : `${n(m.riRatio, 2)} over PEEP 5 to 15 cmH₂O (target ${n(m.riTarget, 2)})`],
        ['Expiratory time constant', `${n(m.expTimeConstant, 2)} s`],
        ['Plateau pressure', `${n(m.pplat)} cmH₂O`],
        [endExpiratory.label, `${n(m.totalPeep)} cmH₂O; ${endExpiratory.detail}`],
        ['Expiratory flow limitation', m.expiratoryFlowLimited ? 'active during the last expiration' : 'not active'],
      ];
    },
  },
  {
    match: 'Ventricular pressure-volume loops',
    title: 'Pressure–volume loops',
    summary: (sim) => {
      const m = sim.metrics;
      return `Right ventricle ${n(m.rvEdv, 0)} to ${n(m.rvEsv, 0)} mL; left ventricle ${n(m.lvEdv, 0)} to `
        + `${n(m.lvEsv, 0)} mL, a stroke volume of ${n(m.sv, 0)} mL and an ejection fraction of ${n(m.lvEf, 0)}%.`;
    },
    rows: (sim) => {
      const m = sim.metrics, c = sim.circ, p = sim.params;
      return [
        ['RV end-diastolic volume', `${n(m.rvEdv, 0)} mL`],
        ['RV end-systolic volume', `${n(m.rvEsv, 0)} mL`],
        ['RV end-systolic pressure (transmural)', `${n(c.rvEsp)} mmHg`],
        ['Selected intrinsic RV Ees', `${p.eesRv} mmHg/mL`],
        ['LV end-diastolic volume', `${n(m.lvEdv, 0)} mL`],
        ['LV end-systolic volume', `${n(m.lvEsv, 0)} mL`],
        ['LV end-systolic pressure (transmural)', `${n(c.lvEsp)} mmHg`],
        ['Selected intrinsic LV Ees', `${p.eesLv} mmHg/mL`],
        ['Stroke volume', `${n(m.sv, 0)} mL`],
        ['Ejection fraction', `${n(m.lvEf, 0)}%`],
      ];
    },
  },
  {
    match: 'Pulmonary vascular resistance against lung volume',
    title: 'Pulmonary vascular resistance',
    // The PVR panel also carries zoom controls in its header. The full title is
    // already the region label, so the compact disclosure name avoids covering
    // the chart title at the normal two-column panel width.
    disclosureTitle: 'PVR',
    summary: (sim) => {
      const m = sim.metrics;
      const comp = pvrComponents(sim.params, m.lungVolume);
      const side = m.lungVolume < comp.vascularFrc ? 'below' : 'above';
      return `Lung volume ${n(m.lungVolume, 2)} L, ${side} this patient's ${n(comp.vascularFrc, 2)} L `
        + `resting volume if fully open. `
        + `${n(m.openFraction * 100, 0)}% of the lung is open, so each open unit is holding `
        + `${m.lungStrain >= 0 ? `${n(m.lungStrain * 100, 0)}% more` : `${n(-m.lungStrain * 100, 0)}% less`} `
        + `than it would at rest. The model's `
        + `resistance coefficient is ${n(m.pvrCoefficientWood, 2)} Wood units; the value derived from mean `
        + `pulmonary artery pressure, wedge and cardiac output is `
        + `${m.pvrDerivedWood === null ? 'not derivable at this flow' : `${n(m.pvrDerivedWood, 2)} Wood units`}.`;
    },
    rows: (sim) => {
      const m = sim.metrics;
      const comp = pvrComponents(sim.params, m.lungVolume);
      return [
        ['Lung volume', `${n(m.lungVolume, 2)} L`],
        ['Fully open vascular FRC', `${n(comp.vascularFrc, 2)} L`],
        ['Open fraction', `${n(m.openFraction * 100, 0)}%`],
        ['Strain per open unit', `${n(m.lungStrain * 100, 0)}%`],
        ['Reopened by pressure', `${n(m.recruitedFraction * 100, 0)}% of the lung`],
        ['R/I reference manoeuvre', m.interpretability.ri.level === 'unavailable'
          ? 'not applicable without collapsed lung'
          : `${n(m.riRatio, 2)}; ${n(Math.max(0, m.riRecruitedVolume), 0)} mL recruited`],
        ['Open-unit vascular bed', `${n(comp.openBed * RESISTANCE_TO_WOOD, 2)} Wood units`],
        // A logistic opening curve never reaches exactly 100%, so an otherwise
        // normal lung can retain a mathematically tiny closed branch with a
        // several-thousand-WU equivalent resistance. Suppress that numerical
        // artefact when less than 0.5% of the lung belongs to the branch.
        ['Derecruited-unit vascular bed', comp.closedFraction >= 0.005 && Number.isFinite(comp.closedBed)
          ? `${n(comp.closedBed * RESISTANCE_TO_WOOD, 2)} Wood units`
          : 'not present'],
        ['Flow through open units', `${n(comp.openFlowShare * 100, 0)}% of pulmonary flow`],
        ['Model resistance coefficient', `${n(m.pvrCoefficientWood, 2)} Wood units`],
        ['Derived (mPAP − wedge) / CO', m.pvrDerivedWood === null ? 'not derivable' : `${n(m.pvrDerivedWood, 2)} Wood units`],
        ['Zone 3 index', `${n(m.zone3 * 100, 0)}%`],
      ];
    },
  },
  {
    match: 'Thoracic schematic',
    title: 'Thoracic schematic',
    summary: (sim) => {
      const m = sim.metrics;
      const bow = sim.circ.septalShift ?? 0;
      const towards = bow > 0 ? 'towards the left ventricle' : 'towards the right ventricle';
      return `Pleural pressure ${n(m.ppl)}, alveolar ${n(m.palv)}, abdominal ${n(m.pab)} cmH₂O. `
        + `The right ventricle is ${n(m.rvEdv, 0)} mL against the left ventricle's ${n(m.lvEdv, 0)} mL, `
        + `a ratio of ${n(m.rvLvRatio, 2)}, and the septum bows ${towards}.`;
    },
    rows: (sim) => {
      const m = sim.metrics;
      return [
        ['Pleural pressure', `${n(m.ppl)} cmH₂O`],
        ['Alveolar pressure', `${n(m.palv)} cmH₂O`],
        ['Abdominal pressure', `${n(m.pab)} cmH₂O`],
        ['Central venous pressure', `${n(m.cvp)} mmHg`],
        ['Transmural central venous pressure', `${n(m.cvpTransmural)} mmHg`],
        ['Pulmonary vascular blood volume', `${n(m.pulmonaryBloodVolume, 0)} mL`],
        ['Estimated PA-to-LA mean transit', `${n(m.pulmonaryTransitTime, 1)} s`],
        ['Explicit staged buffer time', `${n(m.pulmonaryTransportTime, 1)} s`],
        ['Staged pathway volume', `${n(m.pulmonaryTransitVolume, 0)} mL`],
        ['Flow leaving transport pathway', `${n(m.pulmonaryTransitFlow, 2)} L/min`],
        ['RV : LV end-diastolic volume', `${n(m.rvLvRatio, 2)}`],
        ['Septal transmural pressure (end-diastolic)', `${n(sim.circ.septalShift ?? 0)} mmHg`],
        ['Pericardial pressure', `${n(m.pPeri)} mmHg`],
      ];
    },
  },
];

export function createDescriptions() {
  const bound = [];

  for (const spec of PANELS) {
    const section = document.querySelector(`[aria-label="${spec.match}"]`);
    if (!section) continue;

    const id = `desc-${spec.match.replace(/\W+/g, '-').toLowerCase()}`;
    const summary = document.createElement('p');
    summary.id = id;
    summary.className = 'panel-summary';
    section.setAttribute('aria-describedby', id);

    const details = document.createElement('details');
    details.className = 'panel-data';
    const toggle = document.createElement('summary');
    const disclosureName = spec.disclosureTitle ?? spec.title;
    // The former full-width "... values" label competed with canvas titles.
    // A compact help glyph keeps the same native details disclosure and an
    // explicit accessible name without consuming the chart header.
    toggle.textContent = '?';
    const syncToggleLabel = () => {
      const action = details.open ? 'Hide' : 'Show';
      const label = `${action} ${disclosureName} values and description`;
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
    };
    details.addEventListener('toggle', syncToggleLabel);
    syncToggleLabel();
    const table = document.createElement('table');
    details.append(toggle, summary, table);
    section.appendChild(details);

    bound.push({ spec, summary, table, details });
  }

  function render(sim) {
    for (const b of bound) {
      b.summary.textContent = b.spec.summary(sim);
      // The table is only rebuilt while it is open — it is a few hundred DOM
      // writes and nobody is reading it when it is closed.
      if (!b.details.open) continue;
      const rows = b.spec.rows(sim);
      if (b.table.rows.length !== rows.length) {
        b.table.textContent = '';
        for (const [k] of rows) {
          const tr = b.table.insertRow();
          tr.insertCell().textContent = k;
          tr.insertCell();
        }
      }
      rows.forEach(([, v], i) => { b.table.rows[i].cells[1].textContent = v; });
    }
  }

  return { render };
}
