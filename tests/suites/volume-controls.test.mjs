import { section, check, near, Simulator, defaultParams, totalVolume } from '../support/model.mjs';
import { SCENARIO_BY_ID } from '../../src/model/scenarios.js';
import { bloodVolumeControl, bloodVolumeDoseControl, applyBloodVolumeDose, volumeControlReadings, snapBloodVolumeChange } from '../../src/ui/volume-controls.js';
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
  referenceTotal: totalVolume(pin.sim.circ), currentTotal: totalVolume(sim.circ),
});
check('Pin preserves the starting reference and reports additions rather than the internal prescription',
  pin.sim.bloodVolumeReference === reference && changes.some(change => change.text === 'Total blood volume: 4.71 → 4.91 L (+200 mL)'));
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

section('Explicit blood applications and cumulative limits');
const dosing = new Simulator();
const initial = totalVolume(dosing.circ);
const initialReference = dosing.bloodVolumeReference;
check('two equal applications accumulate while preserving the patient reference',
  applyBloodVolumeDose(dosing, 250) && applyBloodVolumeDose(dosing, 250)
  && near(totalVolume(dosing.circ), initial + 500, 1e-7)
  && dosing.bloodVolumeReference === initialReference);
check('removal is an exact negative intervention', applyBloodVolumeDose(dosing, -100)
  && near(totalVolume(dosing.circ), initial + 400, 1e-7));
const limits = bloodVolumeDoseControl(dosing.params);
const unchanged = totalVolume(dosing.circ);
check('invalid or excessive doses are rejected without partial delivery',
  [0, NaN, Infinity, limits.min - 1, limits.max + 1].every(dose => !applyBloodVolumeDose(dosing, dose))
  && totalVolume(dosing.circ) === unchanged);
check('the upper cumulative endpoint is reachable, then further addition is rejected',
  applyBloodVolumeDose(dosing, limits.max) && bloodVolumeDoseControl(dosing.params).max === 0
  && !applyBloodVolumeDose(dosing, 25) && dosing.params.stressedVolume === 1800);
check('the lower endpoint remains reachable by removal and prevents excess withdrawal',
  applyBloodVolumeDose(dosing, bloodVolumeDoseControl(dosing.params).min)
  && dosing.params.stressedVolume === 200 && !applyBloodVolumeDose(dosing, -25));
check('capacity alone creates no total-blood difference in Pin',
  !pinSettingChanges(sim.params, { ...sim.params, venousCapacityReduction: 100 }, {
    referenceTotal: 5080, currentTotal: 5080 + 1e-9,
  }).some(change => change.id === 'totalBloodVolume'));
check('actual blood differences are visible even with identical parameter vectors',
  pinSettingChanges(sim.params, sim.params, { referenceTotal: 5080, currentTotal: 5330 })
    .some(change => change.text === 'Total blood volume: 5.08 → 5.33 L (+250 mL)'));


section('Explicit current venous pressure-volume components');
const stateProbe = new Simulator();
const pausedClock = stateProbe.time;
const zero = volumeControlReadings(stateProbe);
check('neutral V0 is local, and stressed plus unstressed reconstruct actual reservoir blood',
  zero.unstressed === 2750 && zero.manualTone === 0 && zero.reflexTone === 0
  && near(zero.unstressed + zero.stressed, zero.reservoir, 1e-9)
  && zero.reservoir < zero.total);
stateProbe.setParam('venousCapacityReduction', -200);
const dilated = volumeControlReadings(stateProbe);
check('negative manual tone raises V0 immediately at unchanged actual local and total blood',
  dilated.unstressed === 2950 && dilated.manualTone === -200
  && dilated.reservoir === zero.reservoir && dilated.total === zero.total
  && near(dilated.stressed, zero.stressed - 200, 1e-9));
stateProbe.setParam('csv', 80);
const stiffer = volumeControlReadings(stateProbe);
check('a paused compliance change does not reclassify blood or alter V0',
  stiffer.unstressed === dilated.unstressed && stiffer.stressed === dilated.stressed
  && stiffer.reservoir === dilated.reservoir && stiffer.total === dilated.total);
stateProbe.setParam('baroreflexEnabled', true);
stateProbe.setParam('baroreflex', 1);
stateProbe.baro.outflow = 0.5;
const reflex = volumeControlReadings(stateProbe);
check('readings combine manual and current reflex tone without relying on the stale effective cache',
  reflex.manualTone === -200 && reflex.reflexTone === 100 && reflex.unstressed === 2850
  && reflex.total === zero.total && near(reflex.stressed, zero.stressed - 100, 1e-9));
stateProbe.setParam('baroreflex', 0);
check('zero reflex sensitivity removes its displayed contribution while retaining the manual shift',
  volumeControlReadings(stateProbe).reflexTone === 0
  && volumeControlReadings(stateProbe).unstressed === 2950);
stateProbe.setParam('baroreflex', 1);
stateProbe.baro.outflow = -0.25;
check('reflex withdrawal increases V0 rather than silently clipping tone at zero',
  volumeControlReadings(stateProbe).reflexTone === -50
  && volumeControlReadings(stateProbe).unstressed === 3000);
stateProbe.setParam('baroreflexEnabled', false);
const switchedOff = volumeControlReadings(stateProbe);
check('switching the reflex off immediately removes only its contribution',
  switchedOff.reflexTone === 0 && switchedOff.manualTone === -200
  && switchedOff.unstressed === 2950);
applyBloodVolumeDose(stateProbe, 200);
const filled = volumeControlReadings(stateProbe);
check('a bolus increases actual and stressed blood equally without changing V0 or tone',
  near(filled.total - switchedOff.total, 200, 1e-7)
  && near(filled.reservoir - switchedOff.reservoir, 200, 1e-9)
  && near(filled.stressed - switchedOff.stressed, 200, 1e-9)
  && filled.unstressed === switchedOff.unstressed
  && stateProbe.time === pausedClock);
