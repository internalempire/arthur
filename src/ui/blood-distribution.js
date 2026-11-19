import { bloodVolumeReadings } from '../model/index.js';

// One equally spaced sample on the existing circulation observation clock (250 Hz).
// Only the displayed patient and selected live Pin have observers.
const groups = [
  ['Systemic veins & vena cava', ['vSv', 'vIVC']],
  ['Right heart', ['vRa', 'vRv']],
  ['Pulmonary vessels', ['vPa', 'vPt', 'vPv']],
  ['Left heart', ['vLa', 'vLv']],
  ['Systemic arteries', ['vSa']],
];

export function observeDistribution(sim) {
  let lastBreath, collecting, count, mean;
  const sums = new Float64Array(groups.length);
  function reset(breath) {
    lastBreath = breath;
    collecting = false;
    count = 0;
    mean = null;
    sums.fill(0);
  }
  reset(sim.resp.breathCount);
  const detach = sim.observeBloodVolumes({ reset, sample(world) {
    const breath = world.resp.breathCount;
    if (world.hold || world.resp.hold || world.resp.holdPending) {
      if (collecting || mean || breath !== lastBreath) reset(breath);
      return;
    }
    if (breath !== lastBreath) {
      mean = collecting && count && breath === lastBreath + 1
        ? Array.from(sums, sum => sum / count) : null;
      lastBreath = breath;
      collecting = true;
      count = 0;
      sums.fill(0);
    }
    if (collecting) {
      for (let i = 0; i < groups.length; i++) {
        for (const key of groups[i][1]) sums[i] += world.circ[key];
      }
      count++;
    }
  } });
  return { sim, get mean() { return mean; }, get collecting() { return collecting; }, detach };
}

const ml = n => Math.round(n).toLocaleString('en-US');
function signed(n) {
  const value = Math.round(Math.abs(n));
  return (value ? n < 0 ? '−' : '+' : '') + ml(value);
}

function scaleLimit(deltas) {
  const max = Math.max(25, ...deltas.map(Math.abs));
  const decade = 10 ** Math.floor(Math.log10(max));
  return [1, 2.5, 5, 10].find(n => n * decade >= max) * decade;
}

export function createDistributionPanel(host) {
  host.innerHTML = `
    <h2>Where does the blood go?</h2>
    <p class="dist-status"></p>
    <div class="dist-body">
      <div class="dist-total"><div>Total circulating blood <strong></strong><small></small></div>
        <div>Difference from Pin <strong></strong></div></div>
      <div class="dist-wait" hidden><progress max="2" value="0" aria-label="States with a completed breath"></progress>
        <span class="dist-stage" role="status"></span></div>
      <p class="dist-clock"></p>
      <div class="dist-chart">
        <div class="dist-axis"><span>← Less blood</span><span>More blood →</span></div>
        <ul>${groups.map(([name]) => `<li><div class="dist-label"><b>${name}</b><span></span><small></small></div>
          <div class="dist-track" aria-hidden="true"><i></i></div></li>`).join('')}</ul>
        <div class="dist-axis"><span></span><span>0</span><span></span></div>
        <p class="dist-sum"></p>
      </div>
      <a href="manual/#/controls-volume" target="_blank" rel="noopener">Guide to blood volume and venous tone</a>
    </div>`;
  const find = selector => host.querySelector(selector);
  const status = find('.dist-status'), body = find('.dist-body'), chart = find('.dist-chart');
  const totals = host.querySelectorAll('.dist-total strong'), referenceTotal = find('.dist-total small');
  const wait = find('.dist-wait'), progress = find('progress'), stage = find('.dist-stage');
  const clock = find('.dist-clock'), sumLine = find('.dist-sum');
  const scale = host.querySelectorAll('.dist-axis:last-of-type span');
  const rows = Array.from(host.querySelectorAll('li'), row => ({
    text: row.querySelector('span'), ref: row.querySelector('small'), bar: row.querySelector('i'),
  }));
  let current, pinned, lastCurrent, lastPinned;
  function destroy() {
    current?.detach(); pinned?.detach();
    current = pinned = lastCurrent = lastPinned = null;
  }
  function render({ current: sim, reference, historical, running }) {
    if (historical) {
      destroy();
      body.hidden = true;
      status.textContent = 'Inspecting waveform history. Return to the latest instant to compare blood volumes.';
      return;
    }
    body.hidden = false;
    if (current?.sim !== sim) { current?.detach(); current = observeDistribution(sim); }
    if (pinned?.sim !== reference.sim) { pinned?.detach(); pinned = observeDistribution(reference.sim); }
    const id = `State ${reference.id}`;
    status.textContent = `Current patient compared with ${id} · ${running ? 'Running' : 'Paused'}`;
    const a = bloodVolumeReadings(sim).total;
    const b = bloodVolumeReadings(reference.sim).total;
    const validCurrent = sim.metrics.valid && Number.isFinite(a);
    const validPin = reference.sim.metrics.valid && Number.isFinite(b);
    totals[0].textContent = validCurrent ? (a/1000).toFixed(3) + ' L' : '—';
    referenceTotal.textContent = id + ' · ' + (validPin ? (b/1000).toFixed(3) + ' L' : '—');
    totals[1].textContent = validCurrent && validPin ? signed(a-b) + ' mL' : '—';
    const c = current.mean, p = pinned.mean;
    chart.hidden = !(validCurrent && validPin && c?.every(Number.isFinite) && p?.every(Number.isFinite));
    const waiting = chart.hidden && validCurrent && validPin;
    wait.hidden = !waiting;
    if (waiting) {
      const phase = (observation, state) => observation.mean ? 'ready' : state.hold ? 'occlusion'
        : observation.collecting ? 'collecting breath' : 'waiting for inspiration';
      const complete = Number(Boolean(c)) + Number(Boolean(p));
      progress.value = complete;
      const message = `Current: ${phase(current,sim)} · ${id}: ${phase(pinned,reference.sim)} · ${complete}/2 ready`;
      if (stage.textContent !== message) stage.textContent = message;
      wait.classList.toggle('working', running && !sim.hold && !reference.sim.hold);
    }
    if (chart.hidden) {
      lastCurrent = lastPinned = null;
      clock.textContent = !validCurrent || !validPin ? 'Regional comparison unavailable for an invalid state.'
        : 'Waiting for a full uninterrupted breath in each state.' + (running ? '' : ' Press Play to collect it.');
      return;
    }
    clock.textContent = 'Regional volumes are means over each state’s last complete breath. A breath may end partway through a heartbeat. Δ = current − Pin.';
    if (lastCurrent === c && lastPinned === p) return;
    lastCurrent = c; lastPinned = p;
    const deltas = c.map((v,i) => v - p[i]);
    const limit = scaleLimit(deltas);
    scale[0].textContent = '−' + ml(limit) + ' mL'; scale[2].textContent = '+' + ml(limit) + ' mL';
    rows.forEach((row,i) => {
      row.text.textContent = ml(c[i]) + ' mL  ·  Δ ' + signed(deltas[i]) + ' mL';
      row.ref.textContent = id + ' · ' + ml(p[i]) + ' mL';
      const fraction = 50 * deltas[i] / limit;
      row.bar.style.left = (50 + Math.min(0,fraction)) + '%';
      row.bar.style.width = Math.abs(fraction) + '%';
    });
    sumLine.textContent = 'Net change across all five regions: ' + signed(deltas.reduce((x,y)=>x+y,0)) + ' mL';
  }
  return { render, destroy };
}
