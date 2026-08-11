// Executable form of docs/LITERATURE_RANGES.md.
//
// Each entry is a published finding reduced to a manoeuvre the model can
// perform and a predicate on the result. The document records whether the model
// currently agrees; `tests/run.mjs` runs these and asserts the document is
// telling the truth in both directions.

import { Simulator } from '../src/model/simulator.js';
import { defaultParams } from '../src/model/parameters.js';
import { pvrComponents, NORMAL_FRC } from '../src/model/lung.js';
import { venousReturnFlow } from '../src/model/circulation.js';

function settle(overrides, seconds = 30) {
  const s = new Simulator();
  s.params = { ...defaultParams(), ...overrides };
  s.reset();
  s.advance(seconds, true);
  return s.metrics;
}

const change = (before, after) => (after / before - 1) * 100;

// The two phenotypes are the *same collapsed lung*. They differ only in how much
// of the collapse can be reopened — which is what recruitability means, and what
// the model could not express until the lung was split into two populations of
// units. Holding the resting volume equal is the point: it is what makes the
// comparison about recruitability rather than about size.
// This is a calibration phenotype for the Cappio Borlino cohort, not the app's
// deliberately severe ARDS-with-RV-failure preset. The study did not enrol a
// uniform failing-RV population, so importing that preset's EesRV and very high
// baseline resistance would make the model validate its own extreme scenario
// rather than the measured human values. A PVR0 of 0.09 gives the whole-lung
// catheter-derived values inside all four reported IQRs.
const HUMAN_ARDS = { clung: 40, vt: 350, rr: 24, pvrBase: 0.09, hpv: 1.6, collapsed: 0.42 };

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

  // These are human in-vivo constraints. The PEEP levels and all four absolute
  // ranges are the trial's: low 4 [2–5] to high 14 [12–15] cmH2O; PVR values are
  // converted from dyn·s·cm⁻⁵ to Wood units by dividing by 80. The response band
  // remains deliberately broader than a ratio of cohort medians, which is not
  // the median within-patient response.
  'pvr-recruitability-low': () => {
    const a = settle({ ...HUMAN_ARDS, recruitable: 0.05, peep: 4 }, 45);
    const b = settle({ ...HUMAN_ARDS, recruitable: 0.05, peep: 14 }, 45);
    const d = change(a.pvrDerivedWood, b.pvrDerivedWood);
    const absolute = a.pvrDerivedWood >= 1.50 && a.pvrDerivedWood <= 3.71
      && b.pvrDerivedWood >= 2.08 && b.pvrDerivedWood <= 4.75;
    return {
      pass: absolute && d >= 20 && d <= 80,
      detail: `${a.pvrDerivedWood.toFixed(2)} → ${b.pvrDerivedWood.toFixed(2)} WU, Δ ${d.toFixed(0)}% `
        + `(want 1.50–3.71 → 2.08–4.75 WU and +20% to +80%; medians +52%)`,
    };
  },

  'pvr-recruitability-high': () => {
    const a = settle({ ...HUMAN_ARDS, recruitable: 0.55, peep: 4 }, 45);
    const b = settle({ ...HUMAN_ARDS, recruitable: 0.55, peep: 14 }, 45);
    const d = change(a.pvrDerivedWood, b.pvrDerivedWood);
    const absolute = a.pvrDerivedWood >= 2.31 && a.pvrDerivedWood <= 3.61
      && b.pvrDerivedWood >= 2.10 && b.pvrDerivedWood <= 3.75;
    return {
      pass: absolute && d >= -10 && d <= 20,
      detail: `${a.pvrDerivedWood.toFixed(2)} → ${b.pvrDerivedWood.toFixed(2)} WU, Δ ${d.toFixed(0)}% `
        + `(want 2.31–3.61 → 2.10–3.75 WU and −10% to +20%; medians +5%)`,
    };
  },

  // The row above needs a phenotype chosen for it, so on its own it could be
  // satisfied by picking one. Across the whole model control, increasing
  // recruitability must progressively attenuate the PEEP-related rise. The old
  // test additionally required a sign change, which the human study neither
  // measured nor implies: the high-recruiter cohort median was still +5%.
  'pvr-recruitability-dissociation': () => {
    const at = (recruitable) => {
      const a = settle({ ...HUMAN_ARDS, recruitable, peep: 4 }, 45);
      const b = settle({ ...HUMAN_ARDS, recruitable, peep: 14 }, 45);
      return change(a.pvrDerivedWood, b.pvrDerivedWood);
    };
    const steps = [0, 0.25, 0.5, 0.75, 1].map(at);
    const monotone = steps.every((d, i) => i === 0 || d < steps[i - 1]);
    return {
      pass: monotone && steps[0] - steps[steps.length - 1] >= 15,
      detail: `ΔPVR ${steps.map((d) => d.toFixed(0) + '%').join(' → ')} across recruitability 0 → 1`,
    };
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

  // Human clinical reviews place the J-curve minimum near FRC. The old test put
  // it at 45–60% of a fixed 6 L TLC because that was measured in excised dog
  // lungs. Here the target is the adult human operating point, while Thomas and
  // Hakim remain qualitative support for the two mechanical limbs.
  'pvr-human-frc-nadir': () => {
    const p = { ...defaultParams(), hpv: 0 };
    let best = { v: 0, r: Infinity };
    for (let v = 0.8; v <= 4.5; v += 0.01) {
      const r = pvrComponents(p, v, null, 1).total;
      if (r < best.r) best = { v, r };
    }
    return {
      pass: Math.abs(best.v - NORMAL_FRC) <= 0.15,
      detail: `fully open nadir at ${best.v.toFixed(2)} L (want within 0.15 L of human FRC ${NORMAL_FRC.toFixed(2)} L)`,
    };
  },

  'pvr-human-j-direction': () => {
    const p = { ...defaultParams(), hpv: 0 };
    const at = (v) => pvrComponents(p, v, null, 1).total;
    const low = at(1.2), frc = at(NORMAL_FRC), high = at(4.5);
    return {
      pass: low > frc && high > frc,
      detail: `${(low / frc).toFixed(2)}× at 1.2 L and ${(high / frc).toFixed(2)}× at 4.5 L versus FRC (want both > 1)`,
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
    const pre = settle({ ...HUMAN_ARDS, peep: 12, pvrBase: 0.44, eesRv: 0.32 });
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
