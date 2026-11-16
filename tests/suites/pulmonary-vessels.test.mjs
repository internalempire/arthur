// Pressure-bearing pulmonary stores: constitutive laws, physical balances and
// numerical convergence. Animal experiments support qualitative mechanisms;
// their fitted canine compliances are not independent human acceptance targets.
import {
  PULMONARY_VESSELS as K, vascularVolume, vascularPressure,
  collapsedConductance, collapsedPrimitive, meanCollapsedConductance,
  collapsiblePulmonaryFlow, pulmonaryVascularState, pulmonaryResistancePartition,
} from '../../src/model/pulmonary-vessels.js';
import { createCirculationState, stepCirculation } from '../../src/model/circulation.js';
import { mmHgToCmH2O } from '../../src/model/units.js';
import { BROWER_1985 } from '../../tools/fixtures/pulmonary-evidence.mjs';
import {
  Simulator, SCENARIOS, defaultParams, lungVolumeAtPl, openFractionAt, pvrComponents,
  section, check, near, totalVolume, COMPARTMENTS,
} from '../support/model.mjs';

section('Pulmonary vessel pressure–volume laws');
for (const [name, store] of Object.entries({ arterial: K.arterial, middle: K.middle, venous: K.venous })) {
  const { volume0: v0, compliance: compliance } = store;
  const pressures = [-40, -15, -5, -0.001, 0, 0.001, 5, 15, 40];
  const volumes = pressures.map(p => vascularVolume(p, v0, compliance));
  check(`${name}: positive volume and invertible pressure on both branches`,
    volumes.every((v, i) => v > 0 && near(vascularPressure(v, v0, compliance), pressures[i], 1e-10)));
  check(`${name}: increasing distending pressure always increases volume`,
    volumes.every((v, i) => i === 0 || v > volumes[i - 1]));
  const h = 1e-6;
  const leftSlope = (v0 - vascularVolume(-h, v0, compliance)) / h;
  const rightSlope = (vascularVolume(h, v0, compliance) - v0) / h;
  check(`${name}: volume and compliance join continuously at zero transmural pressure`,
    vascularVolume(0, v0, compliance) === v0 && vascularPressure(v0, v0, compliance) === 0
      && near(leftSlope, compliance, 1e-5) && near(rightSlope, compliance, 1e-5));
}

section('Signed collapsible pulmonary flow');
const scale = K.middle.volume0 / K.middle.compliance;
const resistance = 0.12;
const flow = (up, down, ext = 10) => collapsiblePulmonaryFlow(up, down, ext, resistance, scale);
const pressurePairs = [[20, 15], [15, 5], [7, 3], [-5, -12], [5, 5 + 1e-9]];
check('equal pressures give exactly zero flow, including complete compression',
  [-100, -5, 0, 5, 10, 20].every(p => flow(p, p) === 0));
check('exchanging ends reverses flow without changing its magnitude',
  pressurePairs.every(([a, b]) => near(flow(a, b), -flow(b, a), 1e-12)));
check('flow is dissipative and moves down the pressure gradient',
  pressurePairs.every(([a, b]) => Number.isFinite(flow(a, b)) && flow(a, b) * (a - b) > 0));
check('a common offset to luminal and external pressure leaves flow unchanged',
  pressurePairs.every(([a, b]) => [-100, 7, 100].every(offset =>
    near(flow(a, b), flow(a + offset, b + offset, 10 + offset), 1e-10))));
check('both fully open ends recover the prescribed resistance exactly',
  near(flow(20, 15), (20 - 15) / resistance, 1e-12));
check('compression reduces conductance smoothly instead of a hard flow cutoff',
  [-50, -10, -1, 0, 1].every(tm => collapsedConductance(tm, scale) > 0)
    && near(collapsedConductance(-1e-8, scale), collapsedConductance(1e-8, scale), 1e-8));
check('the conductance primitive has the correct derivative across collapse',
  [-15, -1, 0, 1, 15].every(tm => near(
    (collapsedPrimitive(tm + 1e-5, scale) - collapsedPrimitive(tm - 1e-5, scale)) / 2e-5,
    collapsedConductance(tm, scale), 1e-5)));
check('near-equal compressed pressures retain finite positive mean conductance',
  [-50, -10, -1].every(tm => near(meanCollapsedConductance(tm, tm + 1e-9, scale),
    collapsedConductance(tm, scale), 1e-9)));
const downstream = [10, 5, 0, -5, -10, -15];
const fallingOutlet = downstream.map(p => flow(15, p));
const increments = fallingOutlet.slice(1).map((q, i) => q - fallingOutlet[i]);
check('lowering the compressed outlet increases flow progressively less',
  increments.every((dq, i) => dq > 0 && (i === 0 || dq < increments[i - 1])));
const plateau = ((15 - 10) + scale / 2) / resistance;
check('deep outlet collapse approaches the analytical finite flow plateau',
  near(flow(15, -100), plateau, 1e-8));

const params = defaultParams();
function respiratoryState(alveolarMmHg, pleuralMmHg = 0) {
  const plSolved = mmHgToCmH2O(alveolarMmHg - pleuralMmHg);
  return {
    palv: mmHgToCmH2O(alveolarMmHg), ppl: mmHgToCmH2O(pleuralMmHg), pab: 4,
    plSolved, lungVolume: lungVolumeAtPl(params, plSolved),
    openFraction: openFractionAt(params, plSolved),
  };
}
function volumeFromPressure(p, external, store) {
  return vascularVolume(p - external, store.volume0, store.compliance);
}
const pulmonaryVolume = c => c.vPa + c.vPt + c.vPv;

section('Precapillary resistance assignment');
{
  // Keep aeration and tissue strain fixed: a prescribed arterial lesion must
  // not become an artificial venous obstruction or a change in middle-bed R.
  const partition = (pvrBase, hpv, openFraction = 0.4, inflation = 1) => {
    const p = { ...params, pvrBase, hpv };
    const volume = 2.2 * openFraction * inflation;
    return pulmonaryResistancePartition(p, pvrComponents(p, volume, 5, openFraction));
  };
  const base = partition(0.07, 0);
  const raised = [0.2, 0.6].map(pvr => partition(pvr, 0));
  check('raising prescribed resistance above reference adds only precapillary arterial load',
    raised.every(r => r.arterialResistance > base.arterialResistance
      && near(r.middleResistance, base.middleResistance, 1e-12)
      && near(r.venousResistance, base.venousResistance, 1e-12)));
  const hypoxic = [1, 3].map(hpv => partition(0.07, hpv));
  check('HPV in a partly closed lung adds arterial load without venous or middle obstruction',
    hypoxic.every(r => r.arterialResistance > base.arterialResistance
      && near(r.middleResistance, base.middleResistance, 1e-12)
      && near(r.venousResistance, base.venousResistance, 1e-12)));
  const fullyOpen = partition(0.07, 0, 1), fullyOpenHpv = partition(0.07, 3, 1);
  check('HPV has no resistance effect without a closed vascular pathway',
    ['arterialResistance', 'middleResistance', 'venousResistance'].every(key =>
      near(fullyOpen[key], fullyOpenHpv[key], 1e-12)));
  const sweep = [];
  for (const pvr of [0.03, 0.07, 0.2, 0.6]) for (const hpv of [0, 1, 3])
    for (const phi of [0.05, 0.2, 0.6, 1]) for (const inflation of [0.5, 1, 2])
      sweep.push(partition(pvr, hpv, phi, inflation));
  check('all resistance segments remain finite and positive across resistance, aeration and inflation',
    sweep.every(r => ['arterialResistance', 'middleResistance', 'venousResistance']
      .every(key => Number.isFinite(r[key]) && r[key] > 0)
      && r.precapillaryResistance >= 0));
  check('segment sums preserve total geometric resistance plus the explicit venous outlet',
    sweep.every(r => near(r.arterialResistance + r.middleResistance + r.venousResistance,
      r.geometricResistance + K.venousOutletResistance, 1e-12)));
  const inflow = 70, atrialPressure = 8;
  const venousPressure = r => atrialPressure + inflow * r.venousResistance;
  check('at fixed inflow and atrial pressure an arterial lesion leaves venous pressure unchanged',
    raised.every(r => near(venousPressure(r), venousPressure(base), 1e-12)));
}

section('Pressure-bearing pulmonary topology');
{
  const resp = respiratoryState(4);
  const c = { vPa: 180, vPt: 200, vPv: 180 };
  const before = pulmonaryVascularState(params, c, resp);
  const fuller = pulmonaryVascularState(params, { ...c, vPt: c.vPt + 1 }, resp);
  check('adding middle-store blood raises its pressure and changes both adjacent flows',
    fuller.middle > before.middle && fuller.arterialFlow < before.arterialFlow
      && fuller.middleFlow > before.middleFlow);
  const shifted = pulmonaryVascularState(params, c, respiratoryState(11, 7));
  check('common respiratory pressure shift preserves vascular flow and shifts all store pressures',
    ['pa', 'middle', 'pv'].every(key => near(shifted[key] - before[key], 7, 1e-10))
      && near(shifted.arterialFlow, before.arterialFlow, 1e-9)
      && near(shifted.middleFlow, before.middleFlow, 1e-9));
  const external = before.extraPressure;
  const open = pulmonaryVascularState(params, {
    vPa: volumeFromPressure(25, external, K.arterial),
    vPt: volumeFromPressure(20, 4, K.middle),
    vPv: volumeFromPressure(15, external, K.venous),
  }, resp);
  check('fully open series resistance recovers geometry plus the explicit venous outlet',
    near(open.effectiveResistance, open.geometricResistance + K.venousOutletResistance, 1e-12));
}

// Isolated constant-inflow preparation: downstream LA pressure and airway
// pressure prescribed independently, Ppl=0. This reproduces the TYPE of Brower
// experiment, not dog size, exact coefficients, or a clinical PPV target.
const inflow = 70; // mL/s, arbitrary nominal adult flow, not canine calibration
function equilibrium(laPressure, resp) {
  const c = { vPa: 100, vPt: 160, vPv: 115 };
  let state = pulmonaryVascularState(params, c, resp);
  const pv = laPressure + inflow * state.venousResistance;
  c.vPv = volumeFromPressure(pv, state.extraPressure, K.venous);
  let low = 1e-6, high = 2000;
  for (let i = 0; i < 100; i++) {
    c.vPt = (low + high) / 2;
    state = pulmonaryVascularState(params, c, resp);
    if (state.middleFlow < inflow) low = c.vPt; else high = c.vPt;
  }
  state = pulmonaryVascularState(params, c, resp);
  c.vPa = volumeFromPressure(state.middle + inflow * state.arterialResistance,
    state.extraPressure, K.arterial);
  return c;
}
function inflation(laPressure, dt, seconds = 20) {
  const baselineAirway = BROWER_1985.protocol.seriesA.peep[0];
  const increment = BROWER_1985.protocol.seriesA.transpulmonaryPressureIncrement;
  const lowResp = respiratoryState(baselineAirway), highResp = respiratoryState(baselineAirway + increment);
  const c = equilibrium(laPressure, lowResp);
  const baseline = pulmonaryVolume(c);
  const baselineStores = { ...c };
  const initial = pulmonaryVascularState(params, c, lowResp);
  let outflowExcess = 0, maxBalanceError = 0, minVolume = Infinity;
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    const state = pulmonaryVascularState(params, c, highResp);
    const outflow = (state.pv - laPressure) / state.venousResistance;
    c.vPa += (inflow - state.arterialFlow) * dt;
    c.vPt += (state.arterialFlow - state.middleFlow) * dt;
    c.vPv += (state.middleFlow - outflow) * dt;
    outflowExcess += (outflow - inflow) * dt;
    maxBalanceError = Math.max(maxBalanceError, Math.abs(pulmonaryVolume(c) - baseline + outflowExcess));
    minVolume = Math.min(minVolume, c.vPa, c.vPt, c.vPv);
  }
  const final = pulmonaryVascularState(params, c, highResp);
  return { c, baselineStores, initial, final, delta: pulmonaryVolume(c) - baseline,
    deltaStores: Object.fromEntries(Object.keys(c).map(key => [key, c[key] - baselineStores[key]])),
    outflowExcess, maxBalanceError, minVolume,
    outflow: (final.pv - laPressure) / final.venousResistance };
}

section('Inflation at constant pulmonary inflow');
const lowFilling = inflation(0, 0.001);
const highFilling = inflation(20, 0.001);
check('both initial conditions actually satisfy the prescribed steady inflow',
  [lowFilling, highFilling].every(x => near(x.initial.arterialFlow, inflow, 1e-9)
    && near(x.initial.middleFlow, inflow, 1e-9)));
check('inflation at low filling retains blood and integrated outflow falls below inflow',
  lowFilling.delta > 0 && lowFilling.outflowExcess < 0,
  `stored ${lowFilling.delta.toFixed(3)} mL; outflow excess ${lowFilling.outflowExcess.toFixed(3)} mL`);
check('inflation at high filling expels blood and integrated outflow exceeds inflow',
  highFilling.delta < 0 && highFilling.outflowExcess > 0,
  `stored ${highFilling.delta.toFixed(3)} mL; outflow excess ${highFilling.outflowExcess.toFixed(3)} mL`);
check('both inflation responses obey the integrated storage balance at every step',
  [lowFilling, highFilling].every(x => x.maxBalanceError < 1e-7 && x.minVolume > 0));
check('outflow returns to constant inflow after redistribution in both conditions',
  [lowFilling, highFilling].every(x => near(x.outflow, inflow, 1e-5)
    && near(x.final.arterialFlow, inflow, 1e-5) && near(x.final.middleFlow, inflow, 1e-5)));

section('Location and continuity of inflation-driven storage');
{
  // Brower's constant-inflow construction distinguishes extra-alveolar filling
  // from middle-bed emptying. These checks preserve that explanation without
  // matching fitted canine regression coefficients or a clinical volume target.
  const low = lowFilling.deltaStores, high = highFilling.deltaStores;
  const lowExtra = low.vPa + low.vPv;
  check('at low filling extra-alveolar storage dominates with only a small middle change',
    low.vPa > 0 && low.vPv > 0 && Math.abs(low.vPt) < 0.1 * lowExtra,
    `arterial ${low.vPa.toFixed(3)}, middle ${low.vPt.toFixed(3)}, venous ${low.vPv.toFixed(3)} mL`);
  // The coarse 10% comparison above labels this declared model example's
  // mechanism; it is not a measured human/canine acceptance band.
  check('at high filling middle-bed emptying outweighs extra-alveolar filling',
    high.vPa > 0 && high.vPv > 0 && high.vPt < 0
      && -high.vPt > high.vPa + high.vPv,
    `arterial ${high.vPa.toFixed(3)}, middle ${high.vPt.toFixed(3)}, venous ${high.vPv.toFixed(3)} mL`);
  const intermediate = [0, 5, 10, 15, 20].map(pla => inflation(pla, 0.001));
  check('increasing downstream filling smoothly shifts net retention toward expulsion',
    intermediate.every((x, i) => Number.isFinite(x.delta)
      && (i === 0 || x.delta <= intermediate[i - 1].delta + 1e-7)));
  const around = [7 - 1e-4, 7, 7 + 1e-4].map(pla => inflation(pla, 0.001));
  check('small downstream-pressure perturbations do not switch between discontinuous storage rules',
    ['vPa', 'vPt', 'vPv'].every(key =>
      Math.abs(around[2].deltaStores[key] - around[0].deltaStores[key]) < 0.01));
}

section('Pulmonary numerical convergence and closed-loop conservation');
{
  const resp = respiratoryState(4);
  const a = createCirculationState(params), b = structuredClone(a);
  a.svRv = 70; b.svRv = 35;
  a.beatDuration = b.beatDuration = 0.8;
  stepCirculation(params, a, resp, 0.00025);
  stepCirculation(params, b, resp, 0.00025);
  check('changing the reported last-beat residence estimate cannot drive the ODE',
    near(b.p.pulmonaryTransitTime, 2 * a.p.pulmonaryTransitTime, 1e-12)
      && COMPARTMENTS.every(key => a[key] === b[key])
      && Object.keys(a.q).every(key => a.q[key] === b.q[key]));
}
for (const laPressure of [0, 20]) {
  // Compare a transient, not the common eventual equilibrium. First-order
  // integration should converge under halving dt; absolute clinical amplitudes
  // and a preferred PPV are deliberately absent from this numerical criterion.
  const results = [0.002, 0.001, 0.0005, 0.00025].map(dt => inflation(laPressure, dt, 0.5));
  const reference = results.at(-1).c;
  const error = x => Math.hypot(...['vPa', 'vPt', 'vPv'].map(key => x.c[key] - reference[key]));
  const errors = results.slice(0, -1).map(error);
  check(`transient at LA ${laPressure} mmHg converges with each time-step halving`,
    errors[0] > errors[1] && errors[1] > errors[2] && errors[2] < errors[0] / 3,
    `volume norm errors ${errors.map(e => e.toExponential(3)).join(', ')} mL`);
}
{
  const resp = respiratoryState(4);
  const c = createCirculationState(params);
  const blood = totalVolume(c), dt = 0.00025;
  let maxError = 0, maxLocalError = 0, valid = true;
  for (let i = 0; i < 4 / dt; i++) {
    const before = pulmonaryVolume(c), middleBefore = c.vPt;
    stepCirculation(params, c, resp, dt);
    maxError = Math.max(maxError, Math.abs(totalVolume(c) - blood));
    maxLocalError = Math.max(maxLocalError,
      Math.abs(pulmonaryVolume(c) - before - (c.q.pv - c.q.pulVen) * dt),
      Math.abs(c.vPt - middleBefore - (c.q.pul - c.q.pulTransit) * dt));
    valid &&= COMPARTMENTS.every(key => c[key] > 0 && Number.isFinite(c[key]))
      && Number.isFinite(c.p.cap);
  }
  check('the complete circuit conserves blood with a pressurised middle store',
    valid && maxError < 1e-7, `maximum whole-circuit drift ${maxError} mL`);
  check('whole pulmonary and middle-store increments equal their actual signed flow balances',
    maxLocalError < 1e-10, `maximum local balance error ${maxLocalError} mL`);
}

{
  const resp = respiratoryState(4);
  const runs = [0.001, 0.0005, 0.00025, 0.000125].map(dt => {
    const c = createCirculationState(params);
    for (let i = 0; i < Math.round(4 / dt); i++) stepCirculation(params, c, resp, dt);
    return c;
  });
  const reference = runs.at(-1);
  const errors = runs.slice(0, -1).map(c => Math.hypot(
    ...['vPa', 'vPt', 'vPv'].map(key => c[key] - reference[key])));
  check('pressure-bearing pulmonary volumes converge within the pulsatile closed circuit',
    errors[0] > errors[1] && errors[1] > errors[2] && errors[2] < errors[0] / 3,
    `volume norm errors ${errors.map(e => e.toExponential(3)).join(', ')} mL`);
}


// Observe every write of the existing limiter latch, including consecutive
// activations. A transparent accessor preserves the original state semantics;
// polling only once per breath could miss a limiter event and later recovery.
function limiterObserver(c) {
  let ticks = c.limitTicks, activations = 0;
  Object.defineProperty(c, 'limitTicks', {
    configurable: true, enumerable: true,
    get() { return ticks; },
    set(value) { if (value === 4000) activations++; ticks = value; },
  });
  return () => ({ activations, ticks });
}

section('Near-empty pulmonary artery stress');
{
  // Pathological initial state, deliberately outside a settled clinical
  // phenotype. Move PA blood to the systemic reservoir rather than deleting it.
  // Frozen Palv 24 cmH2O and Ppl 0 isolate the circulatory solver under high
  // external pulmonary pressure; this is not a ventilated-patient prediction.
  const p = { ...params, stressedVolume: 200, baroreflexEnabled: false, peep: 24 };
  const resp = { ppl: 0, palv: 24, pab: 4, plSolved: 24,
    lungVolume: lungVolumeAtPl(p, 24), openFraction: openFractionAt(p, 24) };
  for (const initialPa of [1, 1.5, 2]) {
    const runs = [0.00025, 0.000125].map(dt => {
      const c = createCirculationState(p);
      c.vSv += c.vPa - initialPa; c.vPa = initialPa;
      const blood = totalVolume(c), count = limiterObserver(c);
      let maxDrift = 0, finite = true, minimum = initialPa, unflagged = false;
      let lastSecondActivations = 0;
      for (let i = 0; i < Math.round(4 / dt); i++) {
        const previous = count().activations;
        stepCirculation(p, c, resp, dt);
        const current = count();
        if (i >= Math.round(3 / dt)) lastSecondActivations += current.activations - previous;
        if (current.activations > previous && c.limitTicks <= 0) unflagged = true;
        maxDrift = Math.max(maxDrift, Math.abs(totalVolume(c) - blood));
        minimum = Math.min(minimum, ...COMPARTMENTS.map(key => c[key]));
        finite &&= COMPARTMENTS.every(key => Number.isFinite(c[key]))
          && Object.values(c.p).filter(value => typeof value === 'number').every(Number.isFinite)
          && Object.values(c.q).every(Number.isFinite);
      }
      return { c, maxDrift, finite, minimum, unflagged, lastSecondActivations };
    });
    check(`PA ${initialPa} mL recovers with finite, conservative, bounded volumes at both time steps`,
      runs.every(r => r.finite && r.minimum >= 1 - 1e-9 && r.maxDrift < 1e-7
        && !r.unflagged && r.lastSecondActivations === 0 && r.c.limitTicks === 0));
    // Numerical tolerance relative to represented volume, not a target clinical
    // pressure, flow or PPV. The initial decompression transient is not fitted.
    check(`PA ${initialPa} mL recovery agrees after halving the integration step`,
      ['vPa', 'vPt', 'vPv'].every(key =>
        Math.abs(runs[0].c[key] - runs[1].c[key]) / runs[1].c[key] < 0.001));
  }
}

section('Shipped presets do not rely on flow limiting');
{
  const simulator = new Simulator();
  for (const scenario of SCENARIOS) {
    simulator.applyScenario(scenario); // standard built-in 15 s initialization
    const initialTicks = simulator.circ.limitTicks;
    const blood = totalVolume(simulator.circ);
    const count = limiterObserver(simulator.circ);
    simulator.advance(15, true);
    check(`${scenario.id}: no limiter activation during 15 s after initialization`,
      initialTicks === 0 && count().activations === 0 && count().ticks === 0
        && near(totalVolume(simulator.circ), blood, 1e-7),
      `${count().activations} activations; initial/final latch ${initialTicks}/${count().ticks}`);
  }
}
