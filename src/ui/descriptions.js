// Text equivalents for the canvas panels.
//
// A canvas is opaque to a screen reader, and an aria-label that names the chart
// says what it is without saying what it shows. Each panel gets two things: a
// one-sentence live summary announced through `aria-describedby`, and a data
// table anyone can open — which turns out to be useful with a mouse too, when
// you want the number rather than the pixel.

import { RESISTANCE_TO_WOOD } from '../model/units.js';
import { pvrComponents, lungRegions } from '../model/lung.js';

const n = (v, d = 1) => (Number.isFinite(v) ? v.toFixed(d) : '—');

const PANELS = [
  {
    match: 'Time-aligned waveforms',
    title: 'Waveforms',
    summary: (sim) => {
      const m = sim.metrics;
      return `Airway pressure ${n(m.paw)} and pleural pressure ${n(m.ppl)} cmH₂O; `
        + `arterial ${n(m.sbp, 0)} over ${n(m.dbp, 0)}, pulmonary artery ${n(m.papSys, 0)} over ${n(m.papDia, 0)}, `
        + `central venous ${n(m.cvp)} mmHg; lung volume ${n((m.lungVolume - sim.resp.relaxVolume) * 1000, 0)} mL above resting.`;
    },
    rows: (sim) => {
      const m = sim.metrics;
      return [
        ['Airway pressure, now', `${n(m.paw)} cmH₂O`],
        ['Airway pressure, peak this breath', `${n(m.ppeak)} cmH₂O`],
        ['Pleural pressure, now', `${n(m.ppl)} cmH₂O`],
        ['Pleural pressure, swing this breath', `${n(m.pplSwing)} cmH₂O`],
        ['Arterial pressure', `${n(m.sbp, 0)}/${n(m.dbp, 0)}, mean ${n(m.map, 0)} mmHg`],
        ['Pulmonary artery', `${n(m.papSys, 0)}/${n(m.papDia, 0)}, mean ${n(m.papMean, 0)} mmHg`],
        ['Central venous pressure', `${n(m.cvp)} mmHg (transmural ${n(m.cvpTransmural)})`],
        ['Tidal volume delivered', `${n(m.vtDelivered, 0)} mL`],
        ['Minute ventilation', `${n(m.minuteVentilation)} L/min`],
      ];
    },
  },
  {
    match: 'Guyton diagram',
    title: 'Guyton diagram',
    summary: (sim) => {
      const m = sim.metrics, op = m.operatingPoint;
      return `The simulated state sits at a right atrial pressure of ${n(op.pra)} mmHg and a flow of `
        + `${n(op.flow, 2)} L/min. Mean systemic filling pressure is ${n(m.pmsf)} mmHg, so the gradient `
        + `driving venous return is ${n(m.gradientVr)} mmHg. The cardiac function curve is anchored at a `
        + `pleural pressure of ${n(op.ppl)} mmHg.`;
    },
    rows: (sim) => {
      const m = sim.metrics, op = m.operatingPoint;
      return [
        ['Right atrial pressure (cycle mean)', `${n(op.pra)} mmHg`],
        ['Venous return (cycle mean)', `${n(op.flow, 2)} L/min`],
        ['Mean systemic filling pressure', `${n(m.pmsf)} mmHg`],
        ['Gradient for venous return', `${n(m.gradientVr)} mmHg`],
        ['Systemic venous stressed volume', `${n(m.stressedVenous, 0)} mL`],
        ['Mobilised by venous tone', `${n(m.venousToneVolume, 0)} mL`],
        ['Systemic venous unstressed volume', `${n(m.unstressedVenous, 0)} mL`],
        ['Venous compliance (slope)', `${n(m.effectiveCsv, 0)} mL/mmHg`],
        ['Critical closing pressure of the great veins', `${n(m.pCrit)} mmHg`],
        ['Resistance to venous return', `${n(sim.circ.p.rvrEff, 3)} mmHg·s/mL`],
        ['Pleural pressure (curve x-intercept)', `${n(op.ppl)} mmHg`],
        ['Pericardial pressure', `${n(op.pPeri)} mmHg`],
      ];
    },
  },
  {
    match: 'Campbell diagram',
    title: 'Campbell diagram',
    summary: (sim) => {
      const m = sim.metrics, p = sim.params;
      return `At ${n((m.lungVolume - sim.resp.relaxVolume) * 1000, 0)} mL above resting volume, pleural pressure is ${n(m.ppl)} and `
        + `airway pressure ${n(m.paw)} cmH₂O. Chest wall compliance ${p.ccw} and lung compliance ${p.clung} `
        + `mL/cmH₂O give a respiratory system compliance of ${n(m.crs, 0)}.`;
    },
    rows: (sim) => {
      const m = sim.metrics, p = sim.params;
      return [
        ['Volume above resting', `${n((m.lungVolume - sim.resp.relaxVolume) * 1000, 0)} mL`],
        ['Resting volume', `${n(sim.resp.relaxVolume, 2)} L`],
        ['Pleural pressure', `${n(m.ppl)} cmH₂O`],
        ['Airway pressure', `${n(m.paw)} cmH₂O`],
        ['Alveolar pressure', `${n(m.palv)} cmH₂O`],
        ['Transpulmonary pressure', `${n(m.pl)} cmH₂O`],
        ['Chest wall compliance', `${p.ccw} mL/cmH₂O`],
        ['Lung compliance', `${p.clung} mL/cmH₂O`],
        ['Respiratory system compliance', `${n(m.crs, 0)} mL/cmH₂O`],
        ['Recruitment-to-inflation ratio', m.interpretability.ri.level === 'unavailable'
          ? 'not applicable without collapsed lung'
          : `${n(m.riRatio, 2)} over PEEP 5 to 15 cmH₂O (target ${n(m.riTarget, 2)})`],
        ['Expiratory time constant', `${n(m.expTimeConstant, 2)} s`],
        ['Plateau pressure', `${n(m.pplat)} cmH₂O`],
        ['Total PEEP', `${n(m.totalPeep)} cmH₂O (intrinsic ${n(m.autoPeep)})`],
        ['Dynamic trapped volume', `${n(m.trappedVolume, 0)} mL above static equilibrium at the same PEEP`],
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
        ['RV contractility (Ees)', `${p.eesRv} mmHg/mL`],
        ['LV end-diastolic volume', `${n(m.lvEdv, 0)} mL`],
        ['LV end-systolic volume', `${n(m.lvEsv, 0)} mL`],
        ['LV end-systolic pressure (transmural)', `${n(c.lvEsp)} mmHg`],
        ['LV contractility (Ees)', `${p.eesLv} mmHg/mL`],
        ['Stroke volume', `${n(m.sv, 0)} mL`],
        ['Ejection fraction', `${n(m.lvEf, 0)}%`],
      ];
    },
  },
  {
    match: 'Pulmonary vascular resistance against lung volume',
    title: 'Pulmonary vascular resistance',
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
        ['Zone 3 fraction', `${n(m.zone3 * 100, 0)}%`],
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
        ['Pulmonary transport pathway', `${n(m.pulmonaryTransitVolume, 0)} mL`],
        ['Mean pulmonary transport time', `${n(m.pulmonaryTransitTime, 1)} s`],
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
    toggle.textContent = `${spec.title} — values`;
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
