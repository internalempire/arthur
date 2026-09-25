import assert from 'node:assert/strict';
import { Simulator, SCENARIOS, section, check } from '../support/model.mjs';
import { LivePins, MAX_LIVE_PINS, pinSettingChanges } from '../../src/ui/live-pins.js';
import { pinnedTilePresentation } from '../../src/ui/stats.js';

section('Live references preserve and independently continue the full physiology');
for (const scenarioId of ['healthy-spont', 'ards-rv', 'copd']) {
  const sim = new Simulator();
  sim.applyScenario(SCENARIOS.find(s => s.id === scenarioId));
  sim.setParam('hysteresis', 'on');
  sim.setParam('baroreflex', 1);
  sim.advance(2.317);
  sim.startHold('inspiratory', 1.5);
  const fork = sim.fork();
  assert.deepEqual(fork, sim);
  // Uneven calls cross beats, respiratory transitions, hold engagement and release.
  // Silent references must produce precisely the same tile state as the drawn world.
  for (const dt of [0.017, 0.031, 0.4, 2, 3, 0.25]) {
    sim.advance(dt);
    fork.advance(dt, true);
    for (const key of ['params', 'effective', 'resp', 'circ', 'baro', 'metrics', 'cycle', 'beatHistory', 'hold']) {
      assert.deepEqual(fork[key], sim[key], `${scenarioId}: continuation of ${key}`);
    }
    assert.equal(fork.time, sim.time);
  }
  const frozenParent = structuredClone(sim);
  fork.setParam('peep', 15);
  fork.setParam('stressedVolume', fork.params.stressedVolume + 200);
  fork.advance(1);
  fork.clearMeasuredPoints();
  assert.deepEqual(structuredClone(sim), frozenParent, 'child mutation must not reach parent');
  assert.notEqual(fork.cycle.ra.buf.buffer, sim.cycle.ra.buf.buffer);
  assert.notEqual(fork.traces.paw.buf.buffer, sim.traces.paw.buf.buffer);
  const frozenChild = structuredClone(fork);
  sim.setParam('position', 'prone');
  sim.advance(0.5);
  assert.deepEqual(structuredClone(fork), frozenChild, 'parent mutation must not reach child');
  check(`${scenarioId}: exact continuation, holds, reflex, averages and independent buffers`, true);
}

section('Multiple references, selection and removal');
{
  const sim = new Simulator();
  const pins = new LivePins();
  const first = pins.add(sim);
  sim.setParam('peep', 10);
  const second = pins.add(sim);
  assert.notEqual(first.sim.params.peep, second.sim.params.peep);
  pins.select(first.id);
  const times = pins.states.map(state => state.sim.time);
  pins.advance(0.5);
  pins.states.forEach((state, i) => assert.ok(state.sim.time > times[i]));
  assert.equal(pins.selected, first);
  pins.remove(second.id);
  assert.equal(pins.selected, first);
  while (pins.states.length < MAX_LIVE_PINS) pins.add(sim);
  assert.equal(pins.add(sim), null);
  const removed = pins.selected;
  const removedTime = removed.sim.time;
  pins.remove(removed.id);
  assert.ok(pins.selected && pins.selected !== removed);
  pins.advance(0.1);
  assert.equal(removed.sim.time, removedTime);
  assert.equal(pins.add(sim).id, removed.id + 1);
  pins.clear();
  assert.equal(pins.selected, null);
  assert.equal(pins.states.length, 0);
  check('all references advance; selection does not replace the patient; cap/removal/clear are enforced', true);

  const params = sim.params;
  const changes = pinSettingChanges(params, { ...params, peep: 15, position: 'prone', collapsed: 0.4 });
  assert.deepEqual(changes.map(c => c.id), ['peep', 'position', 'collapsed']);
  assert.equal(changes[0].text, 'PEEP: 10 → 15 cmH₂O');
  assert.equal(changes[1].text, 'Body position: Supine → Prone');
  assert.equal(changes[2].text, 'Compromised lung: 0 → 40 %');
  assert.deepEqual(pinSettingChanges(params, params), []);
  check('table differences have an explicit direction, clinical labels and displayed units', true);

  const valid = { ...sim.metrics, valid: true };
  const invalid = { ...valid, valid: false, invalidReasons: ['reference outside model domain'] };
  assert.ok(pinnedTilePresentation('co', invalid, 'State 2').compact.includes('—'));
  assert.ok(pinnedTilePresentation('co', invalid, 'State 2').accessible.includes('reference outside model domain'));
  assert.ok(!pinnedTilePresentation('co', valid, 'State 1').compact.includes('unavailable'));
  check('reference validity is independent of the current patient validity', true);
}
