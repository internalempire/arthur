// Executable form of docs/LITERATURE_RANGES.md.
//
// Each entry is a published finding reduced to a manoeuvre the model can
// perform and a predicate on the result. The document records whether the model
// currently agrees; `tests/run.mjs` runs these and asserts the document is
// telling the truth in both directions.

import { Simulator } from '../src/model/simulator.js';
import { defaultParams, REFERENCE_WEIGHT_KG } from '../src/model/parameters.js';
import { pvrComponents, NORMAL_FRC } from '../src/model/lung.js';
import { systemicVenousVolumeState, venousReturnFlow } from '../src/model/circulation.js';
import { applyBaroreflex } from '../src/model/baroreflex.js';

function settle(overrides, seconds = 30) {
  const s = new Simulator();
  s.params = { ...defaultParams(), ...overrides };
  s.reset();
  s.advance(seconds, true);
  return s.metrics;
}

const change = (before, after) => (after / before - 1) * 100;

// The two phenotypes are the *same collapsed lung*. They differ in measured R/I,
// which the model translates into how much of that compartment can reopen.
// Holding collapse and tissue compliance equal is the point: it makes the
// comparison about recruitment relative to inflation rather than lung size.
// This is a calibration phenotype for the Cappio Borlino cohort, not the app's
// deliberately severe ARDS-with-RV-failure preset. The study did not enrol a
// uniform failing-RV population, so importing that preset's EesRV and very high
// baseline resistance would make the model validate its own extreme scenario
// rather than the measured human values. A PVR0 of 0.09 gives the whole-lung
// catheter-derived values inside all four reported IQRs.
const HUMAN_ARDS = {
  clung: 40, vt: 350, rr: 24, pvrBase: 0.09, hpv: 1.6,
  collapsed: 0.42, pOpen: 18,
};

export const LITERATURE = {
  'peep-euvolaemic-pig': () => {
    // Berger et al. studied nine anaesthetised pigs at 7.7 mL/kg, not a human
    // euvolaemic cohort. The model manoeuvre uses the equivalent tidal volume
    // at its 70 kg reference weight. The bands are deliberately wider than the
    // reported paired means: they are an order-of-magnitude experimental anchor,
    // not confidence intervals or a human treatment target.
    const studyEquivalentVt = Math.round(7.7 * REFERENCE_WEIGHT_KG);
    const a = settle({ peep: 5, vt: studyEquivalentVt });
    const b = settle({ peep: 10, vt: studyEquivalentVt });
    const dCo = change(a.co, b.co);
    const dPmsf = b.pmsf - a.pmsf;
    return {
      pass: dCo >= -15 && dCo <= 5 && dPmsf >= 0.5 && dPmsf <= 1.8,
      detail: `ΔCO ${dCo.toFixed(1)}% (pig mean −6.9%; allow −15..+5), `
        + `ΔPmsf ${dPmsf.toFixed(2)} mmHg (pig mean +1.1; allow 0.5..1.8)`,
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
      // Fougères et al. measured a 13±9% fall in cardiac index with higher PEEP
      // and a 14±10% restoration with passive leg raising at high PEEP. They did
      // not report the former model target of a 1.5× hypovolaemic/euvolaemic
      // ratio. Preserve only the supported direction: less central filling
      // makes the haemodynamic cost of PEEP greater.
      pass: hypo < eu,
      detail: `euvolaemic ${eu.toFixed(1)}%, hypovolaemic ${hypo.toFixed(1)}% (want a greater cost when underfilled)`,
    };
  },

  // These are human in-vivo constraints. The PEEP levels and all four absolute
  // ranges are the trial's: low 4 [2–5] to high 14 [12–15] cmH2O; PVR values are
  // converted from dyn·s·cm⁻⁵ to Wood units by dividing by 80. The response band
  // remains deliberately broader than a ratio of cohort medians, which is not
  // the median within-patient response.
  'pvr-recruitability-low': () => {
    const a = settle({ ...HUMAN_ARDS, riRatio: 0.05, peep: 4 }, 45);
    const b = settle({ ...HUMAN_ARDS, riRatio: 0.05, peep: 14 }, 45);
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
    const a = settle({ ...HUMAN_ARDS, riRatio: 0.5, peep: 4 }, 45);
    const b = settle({ ...HUMAN_ARDS, riRatio: 0.5, peep: 14 }, 45);
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
  // satisfied by picking one. Across the R/I control, increasing recruitment
  // relative to inflation must progressively attenuate the PEEP-related rise.
  // The human study does not require a sign change: the high-recruiter cohort
  // median still rose by 5%.
  'pvr-recruitability-dissociation': () => {
    const at = (riRatio) => {
      const a = settle({ ...HUMAN_ARDS, riRatio, peep: 4 }, 45);
      const b = settle({ ...HUMAN_ARDS, riRatio, peep: 14 }, 45);
      return change(a.pvrDerivedWood, b.pvrDerivedWood);
    };
    const steps = [0, 0.2, 0.4, 0.6, 0.8].map(at);
    const monotone = steps.every((d, i) => i === 0 || d < steps[i - 1]);
    return {
      pass: monotone && steps[0] - steps[steps.length - 1] >= 15,
      detail: `ΔPVR ${steps.map((d) => d.toFixed(0) + '%').join(' → ')} across R/I 0 → 0.8`,
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

  'venous-tone-volume-shift': () => {
    // Isolate the venous effector from the simultaneous chronotropic,
    // inotropic and arterial-resistance effects of the aggregate baroreflex.
    const base = defaultParams();
    const effective = { ...base };
    const reservoir = { vSv: 3500 };
    const before = systemicVenousVolumeState(base, reservoir);
    applyBaroreflex(effective, base, 0.5);
    const after = systemicVenousVolumeState(effective, reservoir);
    return {
      pass: reservoir.vSv === 3500 && effective.csv === base.csv
        && after.unstressedVolume < before.unstressedVolume
        && after.stressedVolume > before.stressedVolume
        && after.elasticPressure > before.elasticPressure,
      detail: `at fixed 3500 mL and compliance ${base.csv}, unstressed ${before.unstressedVolume.toFixed(0)}`
        + ` → ${after.unstressedVolume.toFixed(0)} mL, stressed ${before.stressedVolume.toFixed(0)}`
        + ` → ${after.stressedVolume.toFixed(0)} mL, pressure ${before.elasticPressure.toFixed(1)}`
        + ` → ${after.elasticPressure.toFixed(1)} mmHg`,
    };
  },

  'pulmonary-transit-beats': () => {
    const s = new Simulator();
    s.params = {
      ...defaultParams(), baroreflex: 0, septal: 0, pericardium: 0, piston: 0,
      vt: 0, peep: 0, pmus: 0, eesRv: 0.58,
    };
    s.reset();
    s.advance(30, true);
    const baseline = { rv: s.circ.svRv, lv: s.circ.sv };
    s.setParam('eesRv', 0.18);
    let seen = s.circ.beatCount;
    const beats = [];
    for (let i = 0; i < 500 && beats.length < 4; i++) {
      s.advance(0.01, true);
      if (s.circ.beatCount !== seen) {
        seen = s.circ.beatCount;
        beats.push({ rv: s.circ.svRv, lv: s.circ.sv });
      }
    }
    return {
      pass: beats.length === 4 && beats[0].rv < baseline.rv - 10
        && Math.abs(beats[0].lv - baseline.lv) < baseline.lv * 0.01
        && baseline.lv - beats[1].lv < baseline.lv * 0.02
        // This is a timing constraint. The small amplitude floor only keeps
        // numerical noise from being mislabeled as a delayed LV response.
        && baseline.lv - beats[3].lv > baseline.lv * 0.015,
      detail: `after RV ${baseline.rv.toFixed(1)} → ${beats[0]?.rv.toFixed(1)} mL, `
        + `LV beats ${beats.map((b) => b.lv.toFixed(1)).join(' → ')} mL`,
    };
  },
};
