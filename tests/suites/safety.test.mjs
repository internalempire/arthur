// Numerical safety, conservation, convergence and deterministic control-space coverage.
import {
  Simulator, DEFAULT_DT, SCENARIOS, PARAMETERS, defaultParams,
  systemicVenousVolumeState,
  applyBaroreflex, BARO,
  section, check, near, settled, COMPARTMENTS, totalVolume,
} from '../support/model.mjs';

section('Volume conservation');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  const before = totalVolume(s.circ);
  s.advance(40, true);
  const after = totalVolume(s.circ);
  check(sc.id, near(before, after, 0.01), `${before.toFixed(4)} -> ${after.toFixed(4)} mL`);
}

// -------------------------------- stressed and unstressed venous volume ----

section('Stressed volume, venous tone and compliance');
{
  const base = defaultParams();
  // The splanchnic reservoir alone now carries 2750 mL of unstressed volume;
  // the remaining 50 mL was reallocated to the newly separate IVC conduit.
  // Total systemic venous unstressed volume (vSv + vIVC) is unchanged at 2800.
  const reservoir = { vSv: 3450 };
  const resting = systemicVenousVolumeState(base, reservoir);
  check('baseline partition uses the fixed systemic venous zero-pressure volume',
    resting.unstressedVolume === 2750 && resting.stressedVolume === 700
      && near(resting.elasticPressure, 7, 1e-12));

  const effective = { ...base };
  applyBaroreflex(effective, base, 0.5);
  const constricted = systemicVenousVolumeState(effective, reservoir);
  check('venous tone mobilises volume from unstressed to stressed',
    constricted.toneVolume === BARO.venousRecruitment * 0.5
      && constricted.unstressedVolume === 2650 && constricted.stressedVolume === 800);
  check('venous tone preserves reservoir volume and compliance',
    reservoir.vSv === 3450 && effective.csv === base.csv);

  const stiffer = systemicVenousVolumeState({ ...base, csv: 50 }, reservoir);
  check('changing compliance changes pressure, not the volume partition',
    stiffer.stressedVolume === resting.stressedVolume
      && stiffer.unstressedVolume === resting.unstressedVolume
      && near(stiffer.elasticPressure, 2 * resting.elasticPressure, 1e-12));

  const s = new Simulator();
  s.params = { ...defaultParams(), baroreflex: 0 };
  s.reset();
  const bloodBefore = totalVolume(s.circ);
  const venousBefore = s.circ.vSv;
  const csvBefore = s.params.csv;
  s.setParam('stressedVolume', s.params.stressedVolume + 500);
  check('the stressed-volume control adds the same amount of actual blood',
    near(totalVolume(s.circ) - bloodBefore, 500, 1e-9)
      && near(s.circ.vSv - venousBefore, 500, 1e-9));
  check('adding fluid does not change venous compliance', s.params.csv === csvBefore);
}

// ------------------------------------------------------------- positivity ----

section('Compartment positivity across the scenarios');
for (const sc of SCENARIOS) {
  const s = new Simulator();
  s.applyScenario(sc);
  s.advance(40, true);
  // `vPt` is the conserved aggregate; its eight internal stage volumes must be
  // positive as well, or the aggregate could hide a numerically invalid path.
  const min = Math.min(...COMPARTMENTS.map((k) => s.circ[k]),
    ...s.circ.pulmonaryTransit.volume);
  check(sc.id, min > 0, `smallest compartment ${min.toFixed(2)} mL`);
}

// A deterministic sweep of the whole control space. The generator is a fixed
// linear congruential sequence, so a failure here is reproducible.
section('Compartment positivity across a control-space sweep');
{
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  let worstVolume = Infinity;
  let nonFinite = 0;
  let efOutOfRange = 0;
  let flagged = 0;
  const trials = 250;

  for (let i = 0; i < trials; i++) {
    const p = defaultParams();
    for (const spec of PARAMETERS) {
      p[spec.id] = spec.type === 'choice'
        ? spec.options[Math.floor(rnd() * spec.options.length)].value
        : spec.type === 'checkbox'
          ? rnd() >= 0.5
          : spec.min + rnd() * (spec.max - spec.min);
    }
    const s = new Simulator();
    s.params = p;
    s.reset();
    s.advance(20, true);
    worstVolume = Math.min(worstVolume,
      ...COMPARTMENTS.map((k) => s.circ[k]), ...s.circ.pulmonaryTransit.volume);
    const m = s.metrics;
    for (const [, v] of Object.entries(m)) {
      if (typeof v === 'number' && !Number.isFinite(v)) nonFinite++;
    }
    if (!(m.lvEf >= 0 && m.lvEf <= 100)) efOutOfRange++;
    if (!m.valid) flagged++;
  }
  check(`${trials} configurations keep every compartment positive`, worstVolume > 0,
    `smallest volume ${worstVolume.toFixed(2)} mL`);
  check('no non-finite metric anywhere in the sweep', nonFinite === 0, `${nonFinite} found`);
  check('ejection fraction always within 0–100%', efOutOfRange === 0, `${efOutOfRange} outside`);
  check('states outside the model\'s range report themselves', flagged > 0,
    `${flagged} of ${trials} self-reported as not interpretable`);
}

// ------------------------------------------------------------- convergence ---

section('Convergence under time-step refinement');
{
  // Measured on continuous quantities. Cardiac output is deliberately not used:
  // it is latched at a beat boundary, so which sample lands on the boundary
  // shifts with the step, and that is a sampling artefact rather than a
  // convergence failure.
  const runs = [0.0005, DEFAULT_DT, 0.000125].map((dt) => settled({}, 25, { dt }));
  const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
  check('mean arterial pressure converges',
    rel(runs[0].metrics.map, runs[2].metrics.map) < 0.005,
    `${runs.map((r) => r.metrics.map.toFixed(3)).join(' -> ')} mmHg`);
  check('mean venous return converges',
    rel(runs[0].ema.flow, runs[2].ema.flow) < 0.01,
    `${runs.map((r) => r.ema.flow.toFixed(3)).join(' -> ')} L/min`);
  check('volume is conserved at every step size',
    runs.every((r) => near(totalVolume(r.circ), 5080, 0.01)),
    runs.map((r) => totalVolume(r.circ).toFixed(3)).join(' / '));
}

// -------------------------------------------------------------- determinism --

section('Determinism');
{
  const a = settled({ peep: 9, hr: 88 }, 20);
  const b = settled({ peep: 9, hr: 88 }, 20);
  check('identical parameters give identical results',
    a.metrics.co === b.metrics.co && a.metrics.map === b.metrics.map,
    `${a.metrics.co} vs ${b.metrics.co}`);
}

// -------------------------------------------------- physiological relations --
