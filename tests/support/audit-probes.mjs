import assert from 'node:assert/strict';
import { Simulator } from '../../src/model/simulator.js';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';
import { defaultParams } from '../../src/model/parameters.js';
import { resolveParams } from '../../src/model/position.js';
import { stepRespiratory } from '../../src/model/respiratory.js';
import { stepCirculation, ventricularActivation } from '../../src/model/circulation.js';

export function settle(params, dt = 0.00025) {
  const s = new Simulator({ dt });
  s.applyScenario({ params });
  s.advance(60, true); s.advance(60, true);
  return s;
}

// Integrate actual limited flows independently of the reported SV and CO.
// Only fixed-parameter, reflex-off experiments use this direct stepping path.
export function observeCardiac(s, seconds = 60) {
  assert.equal(s.effective.baroreflexEnabled, false);
  const c = s.circ, p = s.effective, dt = s.dt;
  let av = 0, mv = 0, pv = 0, tv = 0, sys = 0, reported = 0, overlap = 0;
  let diastolicAv = 0, overlapTime = 0;
  let overlapSample = null, maxPaired = 0;
  const initialLv = c.vLv, initialRv = c.vRv;
  let reportedCo = s.computeMetrics().co;
  const n = Math.round(seconds / dt), duration = n * dt;
  for (let i = 0; i < n; i++) {
    const previousBeat = c.beatCount;
    stepRespiratory(p, s.resp, dt); stepCirculation(p, c, s.resp, dt);
    av += c.q.av * dt; mv += c.q.mv * dt;
    pv += c.q.pv * dt; tv += c.q.tv * dt; sys += c.q.sys * dt;
    if (c.beatCount !== previousBeat) reportedCo = s.computeMetrics().co;
    reported += reportedCo * dt;
    if (c.act.v < 0.001) diastolicAv += c.q.av * dt;
    if (c.q.mv > 1e-6 && c.q.av > 1e-6) {
      overlap += c.q.av * dt; overlapTime += dt;
      const paired = Math.min(c.q.mv, c.q.av);
      if (paired > maxPaired) {
        maxPaired = paired;
        overlapSample = { la: c.p.la, lv: c.p.lv, aorta: c.p.sa, activation: c.act.v, phase: c.act.tn };
      }
    }
  }
  // Conservation is never waived by an expected-failure entry.
  assert.ok(Math.abs(c.vLv - initialLv - (mv - av)) < 1e-6, 'LV flow-volume balance');
  assert.ok(Math.abs(c.vRv - initialRv - (tv - pv)) < 1e-6, 'RV flow-volume balance');
  return { aorticOutput: av / duration * 0.06, systemicOutput: sys / duration * 0.06,
    reportedOutput: reported / duration, overlapFraction: overlap / Math.max(av, 1e-9),
    diastolicFraction: diastolicAv / Math.max(av, 1e-9), overlapTimeFraction: overlapTime / duration,
    overlapSample };
}

export function cardiacAudit() {
  const rows = [];
  for (const dt of [0.00025, 0.000125]) for (const peep of [0, 10]) {
    const sim = settle({ ...SCENARIO_BY_ID.get('lv-failure').params, peep }, dt);
    rows.push({ dt, peep, ...observeCardiac(sim), valid: sim.computeMetrics().valid });
  }
  const converged = [0, 10].every(peep => {
    const pair = rows.filter(row => row.peep === peep);
    return Math.abs(pair[0].aorticOutput - pair[1].aorticOutput)
      / Math.max(pair[1].aorticOutput, 0.1) < 0.005;
  });
  const outputOK = converged && rows.every(r => r.valid && Math.abs(r.reportedOutput - r.aorticOutput)
    / Math.max(r.aorticOutput, 0.1) < 0.005
    && Math.abs(r.systemicOutput - r.aorticOutput) / Math.max(r.aorticOutput, 0.1) < 0.005);
  const overlapOK = rows.every(r => r.valid && r.overlapFraction < 0.0001 && r.diastolicFraction < 0.0001);
  return [
    { id: 'cardiac-output', satisfied: outputOK, measurements: rows },
    { id: 'diastolic-throughflow', satisfied: overlapOK, measurements: rows },
  ];
}

export function pressureDomainAudit() {
  const s = settle({ eesLv: 0.3, lvStiff: 0.08, mode: 'spont', pmus: 0, peep: 0 });
  const period = 60 / s.effective.hr;
  let peakTime = 0;
  for (let i = 0; i < 1000; i++) if (ventricularActivation(i / 1000 * period, period)
    > ventricularActivation(peakTime, period)) peakTime = i / 1000 * period;
  const pressures = [0, peakTime].map(time => {
    const c = structuredClone(s.circ);
    c.vLv = 80; c.tCardiac = time - s.dt;
    stepCirculation(s.effective, c, s.resp, s.dt);
    return { activation: c.act.v, pressure: c.p.lvTm };
  });
  return { id: 'ventricular-pressure-domain', satisfied: pressures[1].pressure >= pressures[0].pressure,
    measurements: pressures };
}

export function activationAudit() {
  const rows = [45, 75, 140, 170, 190, 212].map(hr => {
    const period = 60 / hr;
    return { hr, jump: Math.abs(ventricularActivation(period, period) - ventricularActivation(0, period)) };
  });
  return { id: 'activation-continuity', satisfied: rows.every(r => r.jump < 0.001), measurements: rows };
}

export function respiratoryAudit() {
  const ards = SCENARIO_BY_ID.get('ards-rv').params;
  const rows = [5, 15].map(peep => {
    const s = settle({ ...ards, rr: 10, ti: 1, peep });
    return { peep, eelv: s.metrics.endExpiratoryVolume, compliance: s.metrics.crsMeasured,
      ratio: s.metrics.riRatio };
  });
  const finiteRI = (rows[1].eelv - rows[0].eelv) * 1000 / (rows[0].compliance * 10) - 1;
  const hysteresis = [0.00025, 0.000125, 0.0000625].map(dt => {
    const s = new Simulator({ dt });
    s.applyScenario({ params: { collapsed: 0.8, clung: 20, pOpen: 20.5, pClose: 20,
      cwLoad: 10, riRatio: 1.5, hysteresis: 'on', vt: 150, ti: 0.4, rr: 20, peep: 10 } });
    s.advance(15, true);
    const result = { dt, vt: s.resp.lastVt, plateau: s.metrics.pplat };
    s.resp.hold = 'inspiratory';
    const pressures = [];
    for (let i = 0; i < 6; i++) { s.advance(dt, true); pressures.push(s.resp.pl); }
    return { ...result, occlusionSwing: Math.max(...pressures) - Math.min(...pressures) };
  });
  const wall = [10, 8, 12].map(cwLoad => {
    const p = resolveParams({ ...defaultParams(), ...ards, cwLoad });
    return { cwLoad, openable: p.openableDiseasedFraction };
  });
  return [
    { id: 'ri-protocol', satisfied: Math.abs(rows[0].ratio - Math.max(0, finiteRI)) < 0.05,
      measurements: { rows, finiteRI } },
    { id: 'hysteresis-convergence', satisfied: hysteresis.every(r => Math.abs(r.vt - 150) < 1
      && r.occlusionSwing < 0.01), measurements: hysteresis },
    { id: 'patient-wall-intervention', satisfied: wall.every(r => Math.abs(r.openable - wall[0].openable) < 1e-8),
      measurements: wall },
  ];
}

export function venousAudit() {
  const s = settle({ mode: 'spont', pmus: 0, pab0: 0, abdCoupling: 0 });
  s.circ.vRa = 200; s.circ.vIVC = 100; s.circ.tCardiac = 0.5;
  stepCirculation(s.effective, s.circ, s.resp, s.dt);
  const m = { ra: s.circ.p.ra, ivc: s.circ.p.pIvcAtm, closing: s.circ.p.pCrit, flow: s.circ.q.vr };
  assert.ok(m.ra > m.ivc && m.ivc > m.closing, 'Open caval reverse-gradient fixture');
  return { id: 'venous-reversal', satisfied: m.flow < 0, measurements: m };
}
