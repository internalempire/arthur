// Pulmonary storage/readouts, aggregate autonomic control and occlusion manoeuvres.
import {
  Simulator, defaultParams, pulmonaryTransitEstimate,
  applyBaroreflex, BARO,
  section, check, near, settled, totalVolume,
} from '../support/model.mjs';

section('Pulmonary residence estimate and pressure-bearing storage');
{
  // Central-volume identity at a declared steady forward flow. This is a
  // residence estimate, not a pressure-wave delay or a prescribed LV phase.
  const p = defaultParams();
  const c = { vPa: 100, vPt: 160, vPv: 115, svRv: 70, sv: 70, beatDuration: 0.8 };
  const snapshot = JSON.stringify(c);
  const reference = pulmonaryTransitEstimate(p, c);
  const halfFlow = pulmonaryTransitEstimate(p, { ...c, svRv: 35 });
  const doubleVolume = pulmonaryTransitEstimate(p, { ...c, vPa: 200, vPt: 320, vPv: 230 });
  check('mean residence estimate is pulmonary blood volume divided by completed-beat RV flow',
    near(reference.rvOutput, 70 / 0.8, 1e-12)
      && near(reference.circuitMeanTime, 375 / (70 / 0.8), 1e-12));
  check('halving flow or doubling blood volume doubles the residence estimate',
    near(halfFlow.circuitMeanTime, reference.circuitMeanTime * 2, 1e-12)
      && near(doubleVolume.circuitMeanTime, reference.circuitMeanTime * 2, 1e-12));
  check('residence uses the actual completed-beat duration, not a changed selected heart rate',
    near(pulmonaryTransitEstimate({ ...p, hr: 150 }, c).circuitMeanTime,
      reference.circuitMeanTime, 1e-12));
  check('calculating residence does not mutate the vascular state', JSON.stringify(c) === snapshot);
  const arrested = pulmonaryTransitEstimate(p, { ...c, svRv: 0 });
  check('near-arrest reporting floor is explicit and finite rather than a physiological finite transit',
    arrested.rvOutput === 0 && arrested.circuitMeanTime === arrested.pulmonaryBloodVolume);

  // No required two/three-beat dead time, phase of LV nadir or six-second
  // transport cap. The pressure-bearing stores determine timing; their signed
  // local flow balances are tested separately in pulmonary-vessels.test.mjs.
  const s = new Simulator();
  s.params = { ...defaultParams(), baroreflexEnabled: false, septal: 0,
    pericardium: 0, vt: 0, peep: 0, pmus: 0 };
  s.reset();
  s.advance(30, true);
  const before = { rv: s.circ.svRv, lv: s.circ.sv, blood: totalVolume(s.circ) };
  s.setParam('eesRv', 0.18);
  s.advance(30, true);
  check('sustained reduction in RV ejection reduces downstream LV delivery after redistribution',
    s.circ.svRv < before.rv && s.circ.sv < before.lv,
    `RV ${before.rv.toFixed(2)} -> ${s.circ.svRv.toFixed(2)}, LV ${before.lv.toFixed(2)} -> ${s.circ.sv.toFixed(2)} mL`);
  check('serial ventricular response conserves total circulating blood',
    near(totalVolume(s.circ), before.blood, 1e-7));
}

section('Baroreflex');
{
  // Use the septic preset's underfilled, vasodilated phenotype. The invariant
  // below is mechanistic preload reserve, not a PPV cutoff.
  const septic = { stressedVolume: 330, svr: 0.85, vt: 560, ccw: 150, hr: 105, peep: 8, rr: 18 };
  const off = settled({ ...septic, baroreflexEnabled: false, baroreflex: 1 }, 45);
  const on = settled({ ...septic, baroreflexEnabled: true, baroreflex: 1 }, 45);
  check('the reflex defends arterial pressure', on.metrics.map > off.metrics.map + 8,
    `${off.metrics.map.toFixed(0)} -> ${on.metrics.map.toFixed(0)} mmHg`);
  check('it does so by raising heart rate', on.metrics.effectiveHr > off.metrics.effectiveHr + 5,
    `${off.metrics.effectiveHr.toFixed(0)} -> ${on.metrics.effectiveHr.toFixed(0)} /min`);
  check('and by raising systemic resistance', on.metrics.effectiveSvr > off.metrics.effectiveSvr,
    `${off.metrics.effectiveSvr.toFixed(2)} -> ${on.metrics.effectiveSvr.toFixed(2)} mmHg·s/mL`);
  // Phase 1 retired PPV as a diagnostic test. The invariant here is the
  // mechanism the baroreflex can hide from arterial pressure: the patient
  // remains on the steep part of the cardiac-function curve with the reflex on.
  check('a defended pressure does not hide preload dependence',
    on.metrics.preload.steep && off.metrics.preload.steep,
    `preload reserve ${(off.metrics.preload.relative * 100).toFixed(1)}%/mmHg off, `
    + `${(on.metrics.preload.relative * 100).toFixed(1)}%/mmHg on`);

  // Above the set point the reflex withdraws, but only weakly.
  const high = settled({ svr: 1.6, baroreflexEnabled: true, baroreflex: 1 }, 45);
  check('above the set point the reflex withdraws rather than reversing',
    high.metrics.baroOutflow < 0 && high.metrics.baroOutflow > -0.3,
    `outflow ${high.metrics.baroOutflow.toFixed(3)} at MAP ${high.metrics.map.toFixed(0)}`);

  check('the aggregate reflex is disabled by default',
    defaultParams().baroreflexEnabled === false && settled({}, 45).metrics.baroOutflow === 0);
  check('the off switch overrides a retained non-zero sensitivity',
    settled({ ...septic, baroreflexEnabled: false, baroreflex: 2 }, 45).metrics.baroOutflow === 0);
  check('zero sensitivity also restores the uncompensated model when enabled',
    settled({ ...septic, baroreflexEnabled: true, baroreflex: 0 }, 45).metrics.baroOutflow === 0);

  // Sensitivity changes where the aggregate reflex saturates, not the size of
  // a biologically undefined super-response. This guardrail matters because a
  // high selected baseline HR already represents part of the patient's
  // phenotype and must not be multiplied by the compensation a second time.
  const extreme = settled({
    stressedVolume: 200, svr: 0.25, hr: 170, baroreflexEnabled: true,
    baroreflex: 2, baroSetPoint: 110,
  }, 60);
  check('high sensitivity cannot exceed full sympathetic outflow',
    extreme.metrics.baroOutflow <= 1 && extreme.effective.venousToneVolume <= BARO.venousRecruitment,
    `outflow ${extreme.metrics.baroOutflow.toFixed(3)}, venous recruitment ${extreme.effective.venousToneVolume.toFixed(0)} mL`);
  check('an already high baseline rate is not multiplied into an extreme tachycardia',
    extreme.metrics.effectiveHr <= 170 + BARO.heartRateReserve,
    `effective HR ${extreme.metrics.effectiveHr.toFixed(0)} /min`);

  const lowBase = { hr: 75, svr: 1.05, csv: 120, eesLv: 3, eesRv: 0.58 };
  const highBase = { ...lowBase, hr: 105 };
  const lowEffective = {}, highEffective = {};
  applyBaroreflex(lowEffective, lowBase, 0.5);
  applyBaroreflex(highEffective, highBase, 0.5);
  check('chronotropic reserve is additive rather than proportional to baseline rate',
    near(lowEffective.hr - lowBase.hr, highEffective.hr - highBase.hr, 1e-12));

  // The loop must not oscillate.
  const s = new Simulator();
  s.params = {
    ...defaultParams(), stressedVolume: 260, svr: 0.5,
    baroreflexEnabled: true, baroreflex: 2,
  };
  s.reset();
  s.advance(40, true);
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 40; i++) { s.advance(1, true); lo = Math.min(lo, s.metrics.co); hi = Math.max(hi, s.metrics.co); }
  check('a high sensitivity against a low pressure does not oscillate', hi - lo < 1.0 && Number.isFinite(s.metrics.co),
    `cardiac output swings ${(hi - lo).toFixed(2)} L/min over 40 s`);
}

section('Occlusion manoeuvres');
{
  const s = new Simulator();
  s.advance(25, true);
  const restingFlow = s.ema.flow;

  check('a hold cannot be armed twice', s.startHold('inspiratory', 8) && !s.startHold('expiratory', 8));
  s.advance(20, true);
  check('the hold releases and leaves one measured point', s.measuredPoints.length === 1,
    `${s.measuredPoints.length} points`);

  const held = s.measuredPoints[0];
  check('an inspiratory hold raises right atrial pressure above resting',
    held.pra > s.metrics.operatingPoint.pra - 0.5,
    `held ${held.pra.toFixed(2)} mmHg`);
  check('an inspiratory hold lowers flow below resting',
    held.flow < restingFlow,
    `${restingFlow.toFixed(2)} -> ${held.flow.toFixed(2)} L/min`);

  // Airway flow really is zero throughout, and the airway reads alveolar
  // pressure, which is the whole point of an occlusion.
  const u = new Simulator();
  u.advance(20, true);
  u.startHold('inspiratory', 8);
  let maxFlow = 0;
  let airwayMatchesAlveolar = true;
  for (let i = 0; i < 400; i++) {
    u.advance(0.02, true);
    if (u.resp.hold) {
      maxFlow = Math.max(maxFlow, Math.abs(u.resp.flow));
      if (Math.abs(u.resp.paw - u.resp.palv) > 1e-9) airwayMatchesAlveolar = false;
    }
  }
  check('no gas moves during a hold', maxFlow === 0, `peak |flow| ${maxFlow}`);
  check('the airway reads alveolar pressure during a hold', airwayMatchesAlveolar);

  // In assisted ventilation the end-inspiratory occlusion is also a respiratory
  // mechanics experiment. Closing the airway removes flow while preserving the
  // end-inspiratory volume; the subsequent rise toward passive recoil must come
  // from muscle relaxation, not from a separately scripted PMI calculation.
  const assistedOcclusion = (effort) => {
    const a = new Simulator({ dt: 0.001 });
    a.params = {
      ...defaultParams(), mode: 'psv', rr: 14, pinsp: 14, peep: 5,
      ti: 1.2, pmus: effort, clung: 85, raw: 5,
    };
    a.reset();
    a.advance(30, true);
    a.startHold('inspiratory', 5);

    let startPaw = null;
    let immediatePaw = null;
    let heldVolume = null;
    let plateauPaw = null;
    let plateauPmus = null;
    let maxVolumeChange = 0;
    let maxHeldFlow = 0;
    for (let i = 0; i < 10000; i++) {
      a.advance(0.005, true);
      if (!a.resp.hold) continue;
      if (startPaw === null) {
        startPaw = a.resp.holdStartPaw;
        immediatePaw = a.resp.paw;
        heldVolume = a.resp.v;
      }
      maxVolumeChange = Math.max(maxVolumeChange, Math.abs(a.resp.v - heldVolume));
      maxHeldFlow = Math.max(maxHeldFlow, Math.abs(a.resp.flow));
      if (a.resp.holdElapsed >= 4) {
        plateauPaw = a.resp.paw;
        plateauPmus = a.resp.pmus;
        break;
      }
    }
    return {
      startPaw, immediatePaw, plateauPaw, plateauPmus,
      rise: plateauPaw - startPaw, maxVolumeChange, maxHeldFlow,
    };
  };

  const moderateEffort = assistedOcclusion(6);
  const strongEffort = assistedOcclusion(10);
  check('an assisted inspiratory hold closes before expiratory volume loss',
    strongEffort.maxHeldFlow === 0 && strongEffort.maxVolumeChange < 1e-12,
    `flow ${strongEffort.maxHeldFlow}, volume drift ${strongEffort.maxVolumeChange}`);
  check('occlusion removes the resistive pressure before muscle relaxation raises Paw',
    strongEffort.immediatePaw < strongEffort.startPaw
      && strongEffort.plateauPaw > strongEffort.startPaw + 4
      && strongEffort.plateauPmus < 0.2,
    `${strongEffort.immediatePaw.toFixed(2)} -> ${strongEffort.plateauPaw.toFixed(2)} cmH2O, `
      + `Pmus ${strongEffort.plateauPmus.toFixed(2)} cmH2O`);
  check('greater inspiratory effort produces a larger occlusion pressure rise',
    strongEffort.rise > moderateEffort.rise + 2,
    `${moderateEffort.rise.toFixed(2)} -> ${strongEffort.rise.toFixed(2)} cmH2O`);

  // Several holds at rising airway pressures must trace a falling line.
  const t = new Simulator();
  t.advance(20, true);
  for (const vt of [300, 500, 700, 900]) {
    t.setParam('vt', vt);
    t.advance(10, true);
    t.startHold('inspiratory', 10);
    t.advance(16, true);
  }
  const pts = t.measuredPoints;
  check('four holds give four points', pts.length === 4, `${pts.length}`);
  const rising = pts.every((p, i) => i === 0 || p.pra > pts[i - 1].pra);
  const falling = pts.every((p, i) => i === 0 || p.flow < pts[i - 1].flow);
  check('rising airway pressure gives rising Pra and falling flow', rising && falling,
    pts.map((p) => `${p.pra.toFixed(1)}/${p.flow.toFixed(2)}`).join('  '));
}
