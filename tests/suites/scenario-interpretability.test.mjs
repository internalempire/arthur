// Scenario-level validation asks a different question from snapshots: does the
// intervention named in the preset note actually demonstrate its clinical
// lesson, using a readout that remains interpretable in that patient?
//
// A failed mechanism is deliberately documented as "needs correction" rather
// than hidden behind a passing tolerance. The final block enforces both
// directions, so correcting the model also forces the audit to be updated.

import {
  Simulator, SCENARIOS, defaultParams, readFileSync,
  section, check, settled,
} from '../support/model.mjs';

const byId = new Map(SCENARIOS.map((scenario) => [scenario.id, scenario]));

function scenarioSimulator(id, overrides = {}, seconds = 20) {
  const scenario = byId.get(id);
  return settled({ ...scenario.params, ...overrides }, seconds);
}

function scenarioMetrics(id, overrides = {}, seconds = 20) {
  return scenarioSimulator(id, overrides, seconds).metrics;
}

// The tile intentionally reports the last completed beat so respiratory
// variation remains visible. A scenario intervention instead needs a mean over
// several breaths, otherwise its result depends on the instant at which the
// comparison is sampled.
function recentLvBeatMeans(simulator, seconds = 10) {
  const beats = simulator.beatHistory.filter((beat) => beat.t > simulator.time - seconds);
  const mean = (key) => beats.reduce((total, beat) => total + beat[key], 0) / beats.length;
  return {
    output: (mean('sv') * simulator.metrics.effectiveHr) / 1000,
    edv: mean('lvEdv'),
    esv: mean('lvEsv'),
    esp: mean('lvEsp'),
  };
}

// Mean the continuously sampled waveform separately during inflation and
// expiration. Fast settling intentionally does not fill traces; a final normal
// 12-second run provides several complete breaths without affecting the state
// comparison used elsewhere in the suite.
function phaseMeans(id) {
  const simulator = new Simulator();
  simulator.params = { ...defaultParams(), ...byId.get(id).params };
  simulator.reset();
  simulator.advance(12, false);
  const cvp = simulator.trace('cvp');
  const flow = simulator.trace('co');
  const inflation = simulator.trace('insp');
  const sums = { cvpIn: 0, cvpOut: 0, flowIn: 0, flowOut: 0, nIn: 0, nOut: 0 };
  for (let i = 0; i < cvp.n; i++) {
    if (inflation.data[i] > 0.5) {
      sums.cvpIn += cvp.data[i];
      sums.flowIn += flow.data[i];
      sums.nIn++;
    } else {
      sums.cvpOut += cvp.data[i];
      sums.flowOut += flow.data[i];
      sums.nOut++;
    }
  }
  return {
    cvpIn: sums.cvpIn / sums.nIn,
    cvpOut: sums.cvpOut / sums.nOut,
    flowIn: sums.flowIn / sums.nIn,
    flowOut: sums.flowOut / sums.nOut,
  };
}

const demonstrates = {};

section('Scenario catalogue decisions');
check('weaning remains retired rather than represented by an unvalidated preset',
  !byId.has('weaning'));

section('Scenario teaching mechanisms');

{
  const phase = phaseMeans('healthy-spont');
  const metrics = scenarioMetrics('healthy-spont');
  demonstrates['healthy-spont'] = phase.cvpIn < phase.cvpOut - 1
    && phase.flowIn > phase.flowOut + 0.3
    && metrics.cvpTransmural > metrics.cvp
    && metrics.interpretability.ppv.level === 'unavailable';
  check('healthy spontaneous breathing separates measured pressure from filling',
    demonstrates['healthy-spont'],
    `CVP ${phase.cvpOut.toFixed(1)} → ${phase.cvpIn.toFixed(1)}, `
      + `flow ${phase.flowOut.toFixed(1)} → ${phase.flowIn.toFixed(1)} L/min`);
}

{
  const phase = phaseMeans('healthy-vcv');
  demonstrates['healthy-vcv'] = phase.cvpIn > phase.cvpOut + 0.3
    && phase.flowIn < phase.flowOut - 0.05;
  check('passive inflation reverses the immediate CVP and flow directions',
    demonstrates['healthy-vcv'],
    `CVP ${phase.cvpOut.toFixed(1)} → ${phase.cvpIn.toFixed(1)}, `
      + `flow ${phase.flowOut.toFixed(1)} → ${phase.flowIn.toFixed(1)} L/min`);
}

{
  const low = scenarioMetrics('peep-escalation', { peep: 5 });
  const high = scenarioMetrics('peep-escalation', { peep: 14 });
  demonstrates['peep-escalation'] = high.cvp > low.cvp + 1.5
    && high.pmsf > low.pmsf + 1
    && high.gradientVr < low.gradientVr
    && high.co < low.co;
  check('PEEP raises both upstream pressures but narrows effective venous return',
    demonstrates['peep-escalation'],
    `CVP ${low.cvp.toFixed(1)} → ${high.cvp.toFixed(1)}, `
      + `Pmsf ${low.pmsf.toFixed(1)} → ${high.pmsf.toFixed(1)}, `
      + `CO ${low.co.toFixed(2)} → ${high.co.toFixed(2)}`);
}

{
  const baseline = scenarioMetrics('septic-responder');
  const fluid = scenarioMetrics('septic-responder', { stressedVolume: 830 });
  const noReflex = scenarioMetrics('septic-responder', { baroreflex: 0 });
  demonstrates['septic-responder'] = fluid.co > baseline.co * 1.2
    && noReflex.map < baseline.map - 10
    && noReflex.co < baseline.co;
  check('septic preset separates stressed-volume response from compensation',
    demonstrates['septic-responder'],
    `fluid CO ${baseline.co.toFixed(2)} → ${fluid.co.toFixed(2)}, `
      + `reflex-off MAP ${baseline.map.toFixed(0)} → ${noReflex.map.toFixed(0)}`);
}

{
  const metrics = scenarioMetrics('swing-limited-reserve');
  // A spontaneous patient cannot validate a PPV claim. The independent
  // teaching contrast is therefore large transmitted pressure versus the
  // local slope of the settled Guyton operating point, which remains defined
  // without passive ventilation or a regular arterial waveform.
  demonstrates['swing-limited-reserve'] = metrics.pplSwing > 15
    && !metrics.preload.steep
    && metrics.preload.relative < 0.10
    && metrics.interpretability.ppv.level === 'unavailable';
  check('large pleural swings remain distinct from preload reserve',
    demonstrates['swing-limited-reserve'],
    `${metrics.pplSwing.toFixed(1)} cmH2O swing, `
      + `${(metrics.preload.relative * 100).toFixed(1)}%/mmHg reserve, `
      + `PPV ${metrics.interpretability.ppv.level}`);
}

{
  const baseline = scenarioMetrics('ards-rv');
  const recruiter = scenarioMetrics('ards-rv', { peep: 20 });
  const nonRecruiter = scenarioMetrics('ards-rv', { peep: 20, riRatio: 0 });
  demonstrates['ards-rv'] = baseline.papMean > 20
    && baseline.pvrDerivedWood > 4
    && baseline.rvLvRatio > 1.5
    && recruiter.openFraction > nonRecruiter.openFraction + 0.1
    && recruiter.pvrDerivedWood < nonRecruiter.pvrDerivedWood
    && recruiter.co > nonRecruiter.co;
  check('ARDS preset couples RV failure to a recruitability-dependent PEEP response',
    demonstrates['ards-rv'],
    `PVR at PEEP 20: R/I on ${recruiter.pvrDerivedWood.toFixed(1)}, `
      + `off ${nonRecruiter.pvrDerivedWood.toFixed(1)} WU`);
}

{
  const baseline = scenarioMetrics('pulmonary-embolism');
  const passiveZero = scenarioMetrics('pulmonary-embolism', {
    mode: 'vcv', pmus: 0, vt: 450, peep: 0,
  });
  const passivePeep = scenarioMetrics('pulmonary-embolism', {
    mode: 'vcv', pmus: 0, vt: 450, peep: 10,
  });
  demonstrates['pulmonary-embolism'] = baseline.papMean > 30
    && baseline.paop < 10
    && baseline.pvrDerivedWood > 6
    && baseline.rvLvRatio > 1.8
    && passivePeep.co < passiveZero.co
    && passivePeep.rvLvRatio > passiveZero.rvLvRatio;
  check('embolism preset produces a pre-capillary RV-load phenotype vulnerable to PEEP',
    demonstrates['pulmonary-embolism'],
    `mPAP ${baseline.papMean.toFixed(0)}, wedge ${baseline.paop.toFixed(0)}, `
      + `PVR ${baseline.pvrDerivedWood.toFixed(1)} WU`);
}

{
  const lowPeep = scenarioSimulator('lv-failure', { peep: 0 }, 45);
  const highPeep = scenarioSimulator('lv-failure', { peep: 10 }, 45);
  const low = recentLvBeatMeans(lowPeep);
  const high = recentLvBeatMeans(highPeep);
  const edvLoss = low.edv - high.edv;
  const esvLoss = low.esv - high.esv;
  demonstrates['lv-failure'] = highPeep.metrics.paop > 30
    && high.output > low.output * 1.05
    && high.esp < low.esp - 2
    && esvLoss > edvLoss + 0.5;
  check('LV-failure preset converts transmural afterload relief into higher output',
    demonstrates['lv-failure'],
    `mean CO ${low.output.toFixed(2)} → ${high.output.toFixed(2)} L/min, `
      + `LV ESPtm ${low.esp.toFixed(1)} → ${high.esp.toFixed(1)} mmHg`);
}

{
  const stiff = scenarioMetrics('obesity');
  const reference = scenarioMetrics('obesity', { ccw: 200, pab0: 5 });
  demonstrates.obesity = stiff.pplSwing > reference.pplSwing * 2
    && stiff.cvp > reference.cvp
    && stiff.co < reference.co
    && stiff.interpretability.ppv.level !== 'ok';
  check('stiff-wall preset demonstrates pressure transmission with PPV qualified',
    demonstrates.obesity,
    `pleural swing ${reference.pplSwing.toFixed(1)} → ${stiff.pplSwing.toFixed(1)} cmH2O`);
}

{
  const fast = scenarioMetrics('copd');
  const slow = scenarioMetrics('copd', { rr: 12 });
  const zero = scenarioMetrics('copd', { peep: 0 });
  const below = scenarioMetrics('copd', { peep: 5 });
  const above = scenarioMetrics('copd', { peep: 13 });
  demonstrates.copd = fast.autoPeep > slow.autoPeep + 3
    && fast.trappedVolume > slow.trappedVolume + 400
    && slow.co > fast.co
    // A low external PEEP substitutes almost one-for-one below the choke. The
    // comparison is directional rather than an exact identity: the two settled
    // breaths can differ by a few tenths of cmH2O while EELV remains within
    // 50 mL. Both conditions prevent a broad tolerance from hiding inflation.
    && Math.abs(below.totalPeep - zero.totalPeep) < 0.5
    && Math.abs(below.endExpiratoryVolume - zero.endExpiratoryVolume) < 0.05
    && above.totalPeep > below.totalPeep + 3
    && above.co < below.co;
  check('COPD preset generates rate-dependent trapping and a PEEP waterfall',
    demonstrates.copd,
    `auto-PEEP RR 12 → 26: ${slow.autoPeep.toFixed(1)} → ${fast.autoPeep.toFixed(1)} cmH2O`);
}

{
  const highPressure = scenarioMetrics('iah');
  const normalPressure = scenarioMetrics('iah', { pab0: 5 });
  const underfilled = scenarioMetrics('iah', { stressedVolume: 450 });
  const filled = scenarioMetrics('iah', { stressedVolume: 950 });
  demonstrates.iah = highPressure.pmsf > normalPressure.pmsf + 5
    && highPressure.gradientVr < normalPressure.gradientVr
    && highPressure.co < normalPressure.co
    && filled.co > underfilled.co + 1;
  check('abdominal-pressure preset contains both upstream mobilisation and collapse cost',
    demonstrates.iah,
    `Pmsf ${normalPressure.pmsf.toFixed(1)} → ${highPressure.pmsf.toFixed(1)}, `
      + `CO ${normalPressure.co.toFixed(2)} → ${highPressure.co.toFixed(2)}`);
}

section('Scenario audit document stays aligned with executable findings');
{
  const document = readFileSync(
    new URL('../../docs/SCENARIO_VALIDATION.md', import.meta.url), 'utf8',
  );
  const rows = [...document.matchAll(
    /^\| `([\w-]+)` \| (supported|qualified|needs correction) \|/gm,
  )].map(([, id, status]) => ({ id, status }));
  check('the summary contains every shipped scenario exactly once',
    rows.length === SCENARIOS.length
      && new Set(rows.map(({ id }) => id)).size === SCENARIOS.length
      && SCENARIOS.every(({ id }) => rows.some((row) => row.id === id)),
    `${rows.length} rows for ${SCENARIOS.length} scenarios`);

  for (const { id, status } of rows) {
    const observed = demonstrates[id];
    const documentedAsBroken = status === 'needs correction';
    check(`${id} — documented as "${status}"`,
      typeof observed === 'boolean' && documentedAsBroken === !observed,
      observed
        ? 'the mechanism now demonstrates its lesson; update a stale failure status'
        : 'the mechanism does not demonstrate its stated lesson; mark it needs correction');
  }
}
