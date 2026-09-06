import { section, check, settled, SCENARIOS } from '../support/model.mjs';
import { stepCirculation, ventricularActivation, pulmonaryTransitEstimate } from '../../src/model/circulation.js';
import { stepRespiratory } from '../../src/model/respiratory.js';

section('Independent cardiac flow, phase and time-base contracts');
for (const scenario of SCENARIOS) {
  const s = settled(scenario.params, 45);
  let badPhase = false, badDomain = false;
  for (let i = 0; i < 100; i++) {
    s.advance(0.1, true);
    badPhase ||= s.circ.cardiacPhaseInvalid;
    badDomain ||= s.circ.pressureDomainInvalid;
  }
  check(`${scenario.id}: filling/ejection phases remain admissible`, !badPhase);
  check(`${scenario.id}: passive pressure remains below the systolic envelope`, !badDomain);
}

{
  const s = settled({ mode: 'spont', pmus: 0 });
  const c = s.circ, p = s.effective, dt = s.dt;
  let started = false, volume = 0, rvVolume = 0, elapsed = 0, beats = 0;
  let error = 0, rvError = 0, outputError = 0, clockError = 0;
  for (let i = 0; i < 3 / dt; i++) {
    if (i === Math.round(0.3 / dt)) p.hr = 150;
    if (i === Math.round(1.2 / dt)) p.hr = 55;
    const previous = c.beatCount;
    stepRespiratory(p, s.resp, dt); stepCirculation(p, c, s.resp, dt);
    if (c.beatCount !== previous) {
      if (started) {
        error = Math.max(error, Math.abs(c.sv - volume));
        rvError = Math.max(rvError, Math.abs(c.svRv - rvVolume));
        outputError = Math.max(outputError, Math.abs(s.computeMetrics().co - volume / elapsed * 0.06));
        clockError = Math.max(clockError, Math.abs(c.beatDuration - elapsed));
        beats++;
      }
      started = true; volume = 0; rvVolume = 0; elapsed = 0;
    }
    if (started) { volume += c.q.av * dt; rvVolume += c.q.pv * dt; elapsed += dt; }
  }
  check('both stroke volumes equal independently integrated valve flow after HR changes',
    beats >= 2 && error < 1e-8 && rvError < 1e-8);
  check('output uses the elapsed duration of the measured beat after HR changes', outputError < 1e-8 && clockError < 1e-10);
  check('pulmonary transit uses measured RV beat duration',
    Math.abs(pulmonaryTransitEstimate(p, c).rvOutput - c.svRv / c.beatDuration) < 1e-10);
}

for (const hr of [45, 75, 140, 170, 190, 212]) {
  const period = 60 / hr;
  check(`HR ${hr}: atrial contraction starts after ventricular relaxation`,
    ventricularActivation(period * 0.8, period) === 0
    && ventricularActivation(period, period) === 0
    && ventricularActivation(0, period) === 0);
}

{
  const s = settled({ eesLv: 0.3, lvStiff: 0.08 }, 30);
  check('incompatible stiffness and contractility cannot produce an interpretable result',
    !s.metrics.valid && s.metrics.invalidReasons.some(r => r.includes('systolic pressure envelope')));
  const extreme = settled({ ...SCENARIOS.find(s => s.id === 'lv-failure').params, lvStiff: 0.04, peep: 0 }, 60);
  check('an atrial-throughflow state is exposed instead of valve-gated away',
    extreme.circ.cardiacPhaseInvalid && !extreme.metrics.valid);
}
