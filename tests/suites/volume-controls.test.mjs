import { section, check, near, Simulator, defaultParams, totalVolume } from '../support/model.mjs';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';
import { bloodVolumeControl, volumeControlReadings, snapBloodVolumeChange } from '../../src/ui/volume-controls.js';
import { createPatientState, parsePatientState } from '../../src/model/patient-state.js';
import { LivePins, pinSettingChanges } from '../../src/ui/live-pins.js';

section('Blood intervention presentation and persistent zero');
const sim = new Simulator();
sim.applyScenario(SCENARIO_BY_ID.get('septic-responder'));
const start = totalVolume(sim.circ), reference = sim.bloodVolumeReference;
check('a preset with a non-default starting volume displays zero without changing blood',
  reference === 330 && bloodVolumeControl(sim.params, reference).value === 0
    && near(start, 4710, 1e-7));
const control = bloodVolumeControl(sim.params, reference);
check('zero and original endpoints are reachable even when the starting volume is off the 25 mL grid',
  snapBloodVolumeChange(0, control) === 0 && control.min === -130 && control.max === 1470
    && snapBloodVolumeChange(-130, control) === -130 && snapBloodVolumeChange(1470, control) === 1470
    && snapBloodVolumeChange(200, control) === 200);
const pins = new LivePins(), pin = pins.add(sim);
sim.setParam('stressedVolume', reference + 200);
const immediate = volumeControlReadings(sim);
check('adding blood while paused immediately updates the true total and keeps the initial reference',
  near(immediate.total - start, 200, 1e-7) && near(immediate.initialTotal, start, 1e-7)
    && sim.bloodVolumeReference === reference);
check('the stressed percentage uses the current systemic venous reservoir, not the whole circulation',
  immediate.fraction === immediate.stressed / sim.circ.vSv && immediate.reservoir < immediate.total);
const beforeCapacity = volumeControlReadings(sim);
sim.setParam('venousCapacityReduction', 200);
const afterCapacity = volumeControlReadings(sim);
check('capacity changes the displayed partition while paused without changing total blood',
  afterCapacity.total === beforeCapacity.total && near(afterCapacity.stressed - beforeCapacity.stressed, 200, 1e-9));
const saved = createPatientState(sim.params, '2026-09-29', sim.bloodVolumeReference);
const loaded = parsePatientState(JSON.parse(JSON.stringify(saved)));
const restored = new Simulator();restored.applyPatientParameters(loaded.params, loaded.bloodVolumeReference);
check('saving and loading retain both the physical prescription and the +200 mL intervention',
  bloodVolumeControl(restored.params, restored.bloodVolumeReference).value === 200
    && near(totalVolume(restored.circ), start + 200, 1e-7));
restored.reset();
check('Reset retains the zero reference of a custom patient', restored.bloodVolumeReference === reference
  && bloodVolumeControl(restored.params, restored.bloodVolumeReference).value === 200);
const changes = pinSettingChanges(pin.sim.params, sim.params, {
  referenceBloodVolume: pin.sim.bloodVolumeReference, currentBloodVolume: sim.bloodVolumeReference,
});
check('Pin preserves the starting reference and reports additions rather than the internal prescription',
  pin.sim.bloodVolumeReference === reference && changes.some(change => change.text === 'Blood added/removed: 0 → +200 mL'));
const legacy = { ...saved };delete legacy.bloodVolumeReference;
const old = parsePatientState(legacy);
check('older version-2 files start at zero without losing their prescribed blood',
  old.params.stressedVolume === reference + 200 && old.bloodVolumeReference === reference + 200);
for (const value of [null, '330', -1, 1801, NaN]) {
  let rejected = false;try { parsePatientState({ ...saved, bloodVolumeReference: value }); } catch { rejected = true; }
  check(`invalid volume reference ${value} is rejected`, rejected);
}
sim.advance(2, true);pins.advance(2);
check('the current total stays conserved while redistribution changes the stressed share',
  near(volumeControlReadings(sim).total, afterCapacity.total, 1e-7)
    && volumeControlReadings(sim).fraction !== afterCapacity.fraction
    && near(totalVolume(pin.sim.circ), start, 1e-7));
const outOfDomain = sim.fork();outOfDomain.circ.vSv = 10;
check('an impossible stressed fraction is unavailable rather than clipped to a plausible percentage',
  volumeControlReadings(outOfDomain).fraction === null);
sim.applyScenario(SCENARIO_BY_ID.get('healthy-vcv'));
check('a newly selected scenario establishes its own zero', sim.bloodVolumeReference === defaultParams().stressedVolume
  && bloodVolumeControl(sim.params, sim.bloodVolumeReference).value === 0);
