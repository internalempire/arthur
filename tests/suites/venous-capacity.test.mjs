import {
  section, check, near, defaultParams, applyBaroreflex, systemicVenousVolumeState,
  Simulator, COMPARTMENTS, totalVolume,
} from '../support/model.mjs';
import { VASC, createCirculationState } from '../../src/model/circulation.js';
import { createPatientState, parsePatientState } from '../../src/model/patient-state.js';
import { cardiacResponseParameters } from '../../src/model/cardiac-response-client.js';
import { LivePins, pinSettingChanges } from '../../src/ui/live-pins.js';

section('Independent venous capacity');
const base = defaultParams();
const reservoir = { vSv: VASC.vuSv + base.stressedVolume };
for (const shift of [-200, 0, 200]) {
  const params = { ...base, venousCapacityReduction: shift };
  const state = systemicVenousVolumeState(params, reservoir);
  check(`${shift} mL manual shift changes partition without changing initial blood`,
    state.unstressedVolume === VASC.vuSv - shift
      && state.stressedVolume === base.stressedVolume + shift
      && state.elasticPressure === (base.stressedVolume + shift) / base.csv
      && totalVolume(createCirculationState(params)) === totalVolume(createCirculationState(base)));
  for (const outflow of [-0.25, 0, 1]) {
    const effective = { ...params };
    applyBaroreflex(effective, params, outflow);
    check(`${shift} mL manual shift adds once to reflex ${outflow} and preserves compliance`,
      effective.venousToneVolume === shift + 200 * outflow
        && effective.venousReflexVolume === 200 * outflow && effective.csv === base.csv);
  }
  const saved = createPatientState(params);
  check(`${shift} mL survives patient-file round trip`,
    parsePatientState(JSON.parse(JSON.stringify(saved))).params.venousCapacityReduction === shift);
  check(`${shift} mL survives Deep CO snapshot without effective parameters`,
    cardiacResponseParameters(params).venousToneVolume === shift);
  check(`${shift} mL respects an explicitly frozen zero total in Deep CO`,
    cardiacResponseParameters(params, { ...params, venousToneVolume: 0 }).venousToneVolume === 0);
}
check('Deep CO applies a paused manual change while preserving sampled reflex drive',
  cardiacResponseParameters({ ...base, venousCapacityReduction: 200 },
    { ...base, venousToneVolume: 70 }).venousToneVolume === 270);
check('Deep CO does not double count a paused manual change without a sampled total',
  cardiacResponseParameters({ ...base, venousCapacityReduction: -200 }, base).venousToneVolume === -200);
const oldFile = createPatientState(base);
delete oldFile.parameters.venousCapacityReduction;
check('an earlier version-2 patient has neutral capacity',
  parsePatientState(oldFile).params.venousCapacityReduction === 0);
for (const value of [-201, 201, NaN]) {
  let rejected = false;
  try { parsePatientState(createPatientState({ ...base, venousCapacityReduction: value })); }
  catch { rejected = true; }
  check(`patient file rejects invalid capacity ${value}`, rejected);
}

// Compare full trajectories, not just the formula: shifting V0 by -delta and
// adding delta to Vsv must be pressure/flow-equivalent while blood totals differ.
// Neither case should gain a spurious advantage in this aggregate linear model.
const initial = new Simulator();
for (const delta of [-200, 200]) {
  const capacity = initial.fork(), fluid = initial.fork();
  const blood = totalVolume(initial.circ);
  capacity.setParam('venousCapacityReduction', delta);
  fluid.setParam('stressedVolume', base.stressedVolume + delta);
  check(`${delta} mL: capacity conserves blood immediately, fluid changes it one-for-one`,
    totalVolume(capacity.circ) === blood && near(totalVolume(fluid.circ), blood + delta, 1e-9));
  let equivalent = true, conserved = true, valid = true;
  for (let second = 0; second < 20; second++) {
    // Removing the intervention does not instantly undo prior redistribution;
    // it restores V0 and lets both circulations return dynamically.
    if (second === 10) {
      capacity.setParam('venousCapacityReduction', 0);
      fluid.setParam('stressedVolume', base.stressedVolume);
    }
    capacity.advance(1, true); fluid.advance(1, true);
    const offset = second < 10 ? delta : 0;
    equivalent &&= COMPARTMENTS.every(key => near(fluid.circ[key] - capacity.circ[key], key === 'vSv' ? offset : 0, 1e-7))
      && Object.keys(capacity.circ.q).every(key => near(capacity.circ.q[key], fluid.circ.q[key], 1e-7));
    conserved &&= near(totalVolume(capacity.circ), blood, 1e-7)
      && near(totalVolume(fluid.circ), blood + offset, 1e-7);
    valid &&= capacity.metrics.valid && fluid.metrics.valid;
  }
  check(`${delta} mL: full flows and central volumes match before and after removal`, equivalent);
  check(`${delta} mL: both interventions conserve their respective blood totals throughout`, conserved);
  check(`${delta} mL: trajectories remain in the model domain`, valid);
}
const legacy = initial.fork(), neutral = initial.fork();
delete legacy.params.venousCapacityReduction;
legacy.advance(1, true); neutral.advance(1, true);
check('neutral control reproduces the legacy trajectory exactly',
  COMPARTMENTS.every(key => legacy.circ[key] === neutral.circ[key]));

const pins = new LivePins();
const reference = pins.add(initial);
initial.setParam('venousCapacityReduction', 200);
initial.setParam('baroreflexEnabled', true);
initial.advance(2, true); pins.advance(2);
check('manual shift coexists with live reflex without changing the pinned prescription',
  initial.metrics.venousToneVolume === 200 + initial.effective.venousReflexVolume
    && initial.metrics.venousCapacityReduction === 200
    && reference.sim.params.venousCapacityReduction === 0
    && reference.sim.metrics.venousToneVolume === 0);
check('pin differences identify capacity independently of volume',
  pinSettingChanges(reference.sim.params, initial.params).some(change =>
    change.id === 'venousCapacityReduction' && change.text.endsWith('0 → 200 mL'))
    && !pinSettingChanges(reference.sim.params, initial.params).some(change => change.id === 'stressedVolume'));
initial.setParam('baroreflexEnabled', false);
initial.advance(0.1, true);
check('switching the reflex off removes only its contribution',
  initial.metrics.venousToneVolume === 200 && initial.metrics.venousReflexVolume === 0);
