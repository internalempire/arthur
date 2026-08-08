// Executable form of docs/LITERATURE_RANGES.md.
//
// Each entry is a published finding reduced to a manoeuvre the model can
// perform and a predicate on the result. The document records whether the model
// currently agrees; `tests/run.mjs` runs these and asserts the document is
// telling the truth in both directions.

import { Simulator } from '../src/model/simulator.js';
import { defaultParams } from '../src/model/parameters.js';
import { pvrComponents, PVR_NADIR_VOLUME } from '../src/model/respiratory.js';
import { venousReturnFlow } from '../src/model/circulation.js';

function settle(overrides, seconds = 30) {
  const s = new Simulator();
  s.params = { ...defaultParams(), ...overrides };
  s.reset();
  s.advance(seconds, true);
  return s.metrics;
}

const change = (before, after) => (after / before - 1) * 100;

// A lung that is mostly collapsed recruits when PEEP is applied; one already at
// a near-normal resting volume mostly distends.
const ARDS = { clung: 34, vt: 350, rr: 24, eesRv: 0.28, pvrBase: 0.17, hpv: 1.6 };

export const LITERATURE = {
  'peep-euvolaemia': () => {
    const a = settle({ peep: 5, vt: 420 });
    const b = settle({ peep: 10, vt: 420 });
    const dCo = change(a.co, b.co);
    const dPmsf = b.pmsf - a.pmsf;
    return {
      pass: dCo > -10 && dPmsf >= 1 && dPmsf <= 3,
      detail: `ΔCO ${dCo.toFixed(1)}% (want better than −10), ΔPmsf ${dPmsf.toFixed(2)} mmHg (want 1..3)`,
    };
  },

  'peep-volume-status': () => {
    const euLow = settle({ peep: 5 });
    const euHigh = settle({ peep: 15 });
    const hypoLow = settle({ peep: 5, stressedVolume: 350 });
    const hypoHigh = settle({ peep: 15, stressedVolume: 350 });
    const eu = change(euLow.co, euHigh.co);
    const hypo = change(hypoLow.co, hypoHigh.co);
    return {
      pass: hypo < eu * 1.5,
      detail: `euvolaemic ${eu.toFixed(1)}%, hypovolaemic ${hypo.toFixed(1)}% (want at least 1.5× the cost)`,
    };
  },

  'pvr-recruitability-low': () => {
    const a = settle({ ...ARDS, frc: 2.10, peep: 4 });
    const b = settle({ ...ARDS, frc: 2.10, peep: 14 });
    const d = change(a.pvrCoefficientWood, b.pvrCoefficientWood);
    return { pass: d > 0, detail: `ΔPVR ${d.toFixed(0)}% (want a rise)` };
  },

  'pvr-recruitability-high': () => {
    const a = settle({ ...ARDS, frc: 1.35, peep: 4 });
    const b = settle({ ...ARDS, frc: 1.35, peep: 14 });
    const d = change(a.pvrCoefficientWood, b.pvrCoefficientWood);
    return { pass: Math.abs(d) <= 10, detail: `ΔPVR ${d.toFixed(0)}% (want within ±10%)` };
  },

  'transmission-chest-wall': () => {
    const compliant = settle({ ccw: 250, clung: 200, peep: 12 });
    const stiff = settle({ ccw: 70, clung: 200, peep: 12 });
    return {
      pass: stiff.ppl > compliant.ppl,
      detail: `Ppl ${compliant.ppl.toFixed(1)} compliant vs ${stiff.ppl.toFixed(1)} stiff cmH₂O`,
    };
  },

  'transmission-lung': () => {
    const compliant = settle({ ccw: 200, clung: 200, peep: 12 });
    const stiff = settle({ ccw: 200, clung: 30, peep: 12 });
    return {
      pass: stiff.ppl < compliant.ppl,
      detail: `Ppl ${compliant.ppl.toFixed(1)} compliant lung vs ${stiff.ppl.toFixed(1)} stiff cmH₂O`,
    };
  },

  'pvr-j-shape': () => {
    const p = defaultParams();
    const at = (v) => pvrComponents(p, v).total;
    const nadir = at(PVR_NADIR_VOLUME);
    const low = at(1.2) / nadir;
    const high = at(3.8) / nadir;
    return {
      pass: low >= 1.5 && high >= 1.5,
      detail: `${low.toFixed(2)}× nadir at 1.2 L, ${high.toFixed(2)}× at 3.8 L (want ≥1.5 both)`,
    };
  },

  'ppv-responder': () => {
    const m = settle({ stressedVolume: 330, vt: 560, ccw: 150, svr: 0.85, hr: 105 });
    return {
      pass: m.ppv >= 13 && m.interpretability.ppv.level === 'ok',
      detail: `PPV ${m.ppv.toFixed(0)}%, interpretability ${m.interpretability.ppv.level}`,
    };
  },

  'ppv-suspended-spontaneous': () => {
    const m = settle({ stressedVolume: 330, ccw: 150, svr: 0.85, hr: 105, mode: 'spont', pmus: 8 });
    return {
      pass: m.interpretability.ppv.level === 'unavailable',
      detail: `interpretability ${m.interpretability.ppv.level}`,
    };
  },

  'ph-classification': () => {
    const post = settle({ eesLv: 1.2, lvStiff: 0.034, stressedVolume: 1050, svr: 1.25, hr: 95, peep: 10 });
    const pre = settle({ ...ARDS, frc: 1.35, peep: 12, pvrBase: 0.44, eesRv: 0.32 });
    return {
      pass: post.phClass === 'post-capillary' && pre.phClass === 'pre-capillary',
      detail: `failing LV → ${post.phClass} (wedge ${post.paop.toFixed(0)}), high resistance → ${pre.phClass} (wedge ${pre.paop.toFixed(0)})`,
    };
  },

  'venous-return-plateau': () => {
    // Drive right atrial pressure well below the pressure surrounding the great
    // veins and check that flow stops responding to it.
    const s = new Simulator();
    s.params = { ...defaultParams() };
    s.reset();
    s.advance(30, true);
    const { pmsf, pCrit } = s.metrics.operatingPoint;
    const rvr = s.circ.p.rvrEff;
    const deep = venousReturnFlow(pmsf, pCrit - 6, pCrit, rvr);
    const deeper = venousReturnFlow(pmsf, pCrit - 12, pCrit, rvr);
    const onSlope = venousReturnFlow(pmsf, pCrit + 3, pCrit, rvr);
    return {
      pass: Math.abs(deeper - deep) / deep < 0.02 && onSlope < deep * 0.95,
      detail: `flow ${deep.toFixed(1)} then ${deeper.toFixed(1)} mL/s six mmHg lower `
        + `(plateau), ${onSlope.toFixed(1)} above the closing pressure`,
    };
  },
};
