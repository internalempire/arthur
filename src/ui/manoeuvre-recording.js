// Optional observation of a single trajectory. Only completed breaths are retained.
import { COMPARTMENTS, PARAM_BY_ID } from '../model/index.js';
import { pinSettingChanges } from './live-pins.js';

const changedLung = new Set(['collapsed', 'reopenable', 'recruitmentProfile', 'hysteresis', 'pClose',
  'pOpen', 'clung', 'lungCapacity', 'ccw', 'cwLoad']);
export const HISTORY_BREATHS = 4;
const maxBreaths = 360, maxEvents = 120;

function outsideDomain({ resp: r, circ: c }) {
  return r.atCapacity || r.hitCapacity || c.limitTicks > 0 || c.cardiacPhaseInvalid
      || c.pressureDomainInvalid || c.pressureDomainRun || COMPARTMENTS.some(k => c[k] <= 1.5)
      || !(c.lvEdv > 0 && c.lvEsv >= 0 && c.lvEsv <= c.lvEdv) || !Number.isFinite(c.co + c.p.sa);
}

export function pinOutput(window) {
  if (!window || !Number.isFinite(window.from.pinML) || !Number.isFinite(window.to.pinML)
      || window.from.invalidTicks !== window.to.invalidTicks) return null;
  return (window.to.pinML - window.from.pinML) * 0.06 / (window.end - window.start);
}

export function createRecording(sim, reference = null) {
  const start = sim.time;
  const recording = { segments: [], rows: [], active: true, reason: '', version: 0, elapsed: 0 };
  let breath = null, lastCount = sim.resp.breathCount, consecutive = [];
  let segment, detach;
  // Pin and patient advance over the same interval. Request the integral at
  // each real patient boundary, even if their respiratory clocks differ.
  let pending = [], pinML = 0, invalidTicks = 0, detachPin;
  const boundary = time => {
    const mark = { time, beats: sim.circ.beatCount };
    if (detachPin) pending.push(mark);
    return mark;
  };
  function releasePin(reason) {
    if (reason) { recording.pinReason = reason; recording.version++; }
    detachPin?.();
    detachPin = null;
    pending = [];
  }
  if (reference) recording.pinId = reference.id;
  if (reference && Math.abs(reference.sim.time - start) >= sim.dt/2) {
    releasePin('The Pin clock differs from the patient clock.');
  } else if (reference) {
    detachPin = reference.sim.observeManoeuvre({
      change: () => releasePin('Pin settings changed.'), interrupt: () => releasePin('Pin observation interrupted.'),
      stop: () => releasePin('Pin was reset.'),
      sample(world) {
        const at = world.time - world.dt;
        while (pending.length && pending[0].time <= at + world.dt/2) {
          const mark = pending.shift();
          if (Math.abs(mark.time - at) >= world.dt/2) {
            releasePin('The Pin missed a patient boundary.');
            return;
          }
          Object.assign(mark, { pinML, invalidTicks });
        }
        pinML += world.circ.q.av * world.dt;
        if (outsideDomain(world) || world.hold) invalidTicks++;
      },
    });
  }
  function stop(reason = 'Stopped') {
    if (!recording.active) return;
    recording.active = false;
    recording.reason = reason;
    recording.elapsed = sim.time - start;
    recording.version++;
    detach?.();
    releasePin();
  }
  function interrupt(label) {
    if (!recording.active) return;
    if (recording.segments.length >= maxEvents) { stop('Recording limit reached'); return; }
    breath = null;
    lastCount = sim.resp.breathCount;
    consecutive = [];
    segment = { start: sim.time - start, label, peep: sim.params.peep, window: null, count: 0 };
    recording.segments.push(segment);
    recording.version++;
  }
  interrupt('Baseline');
  function change(id, before, after) {
    if (before === after) {
      breath = null; consecutive = []; segment.count = 0; segment.window = null;
      recording.version++;
      return;
    }
    const name = PARAM_BY_ID.get(id)?.label ?? id;
    if (changedLung.has(id)) { stop(name + ' changed'); return; }
    const text = pinSettingChanges({ ...sim.params, [id]: before }, sim.params)[0]?.text;
    interrupt(text ?? name);
  }
  function finish(world, endMark) {
    const r = world.resp;
    const t = world.time - world.dt - start;
    const row = { t, start: breath.start, segment: recording.segments.length - 1, valid: !breath.invalid,
      peep: segment.peep, plMin: breath.min, plMax: breath.max, open: 100 * (1 - r.lastClosedEndExpiratory),
      eelv: r.lastEndExpiratoryVolume, ppl: breath.sum / breath.seconds, litres: breath.ml / 1000,
      from: breath.mark, to: endMark, seconds: breath.seconds, co: null, plateau: world.params.pmus === 0 && ['vcv','pcv'].includes(world.params.mode)
        ? r.lastPplat : null };
    row.valid &&= Number.isFinite(r.lastClosedEndExpiratory) && Number.isFinite(row.eelv)
      && Number.isFinite(row.ppl) && Number.isFinite(row.litres) && Number.isFinite(row.plMin) && Number.isFinite(row.plMax);
    recording.rows.push(row);
    if (row.valid) {
      consecutive.push(row);
      if (consecutive.length > HISTORY_BREATHS) consecutive.shift();
    } else { consecutive = []; segment.window = null; }
    segment.count = consecutive.length;
    if (consecutive.length === HISTORY_BREATHS) {
      const seconds = consecutive.reduce((sum,b) => sum + b.seconds, 0);
      row.co = consecutive.reduce((sum,b) => sum + b.litres, 0) * 60 / seconds;
      const window = { start: consecutive[0].start, end: t, co: row.co, peep: row.peep };
      for (const k of ['plMin','plMax','open','eelv','plateau']) {
        window[k] = consecutive.every(b => Number.isFinite(b[k]))
          ? consecutive.reduce((sum,b) => sum + b[k], 0) / HISTORY_BREATHS : null;
      }
      window.ppl = consecutive.reduce((sum,b) => sum + b.seconds*b.ppl, 0) / seconds;
      window.from = consecutive[0].from;
      window.to = endMark;
      segment.window = window;
    }
    recording.version++;
    if (recording.rows.length >= maxBreaths) stop('Recording limit reached');
  }
  function sample(world) {
    const r = world.resp, c = world.circ;
    if (world.hold || r.hold || r.holdPending) return;
    if (r.breathCount !== lastCount) {
      const mark = boundary(world.time - world.dt);
      if (breath && lastCount + 1 === r.breathCount) finish(world, mark);
      if (!recording.active) return;
      lastCount = r.breathCount;
      breath = { mark, start: world.time - world.dt - start, seconds: 0, sum: 0, ml: 0,
        min: Infinity, max: -Infinity, invalid: false };
    }
    if (!breath) return;
    breath.seconds += world.dt;
    breath.sum += r.ppl * world.dt;
    breath.ml += c.q.av * world.dt;
    breath.min = Math.min(breath.min, r.pl);
    breath.max = Math.max(breath.max, r.pl);
    breath.invalid ||= outsideDomain(world);
  }
  detach = sim.observeManoeuvre({ change, interrupt, sample, stop });
  return Object.assign(recording, { stop, releasePin, getElapsed: () => recording.active ? sim.time - start : recording.elapsed });
}
