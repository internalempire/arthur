import { section, check, settled, SCENARIOS, COMPARTMENTS, totalVolume } from '../support/model.mjs';
import { cavalFlow, venousReturnFlow, stepCirculation } from '../../src/model/circulation.js';
import { stepRespiratory } from '../../src/model/respiratory.js';

section('Signed caval flow and conservation');

const pressures = [-10, -3, 0, 3, 10, 25];
let rest = true, direction = true, symmetric = true, forward = true, reference = true;
for (const closing of [-4, 0, 8]) for (const a of pressures) {
  rest &&= cavalFlow(a, a, closing, 0.06) === 0;
  for (const b of pressures) {
    const q = cavalFlow(a, b, closing, 0.06);
    direction &&= Number.isFinite(q) && q * (a - b) >= 0;
    symmetric &&= q === -cavalFlow(b, a, closing, 0.06);
    if (a >= b) forward &&= q === venousReturnFlow(a, b, closing, 0.06);
    reference &&= Math.abs(q - cavalFlow(a + 15, b + 15, closing + 15, 0.06)) < 1e-10;
  }
}
check('equal pressures give no flow above, at and below closing pressure', rest);
check('flow follows the pressure gradient in either direction', direction);
check('swapping the two ends reverses flow without changing its magnitude', symmetric);
check('the existing forward branch is preserved exactly', forward);
check('a common shift of all pressure references leaves flow unchanged', reference);
check('lowering pressure far below closure approaches a forward-flow plateau',
  Math.abs(cavalFlow(10, -20, 0, 0.06) - cavalFlow(10, -30, 0, 0.06)) < 1e-5);
check('the conservative law retains its documented near-equilibrium zero-flow region',
  cavalFlow(0.1, 0, 0, 0.06) === 0 && cavalFlow(0, 0.1, 0, 0.06) === 0);

const fixture = settled({ mode: 'spont', pmus: 0, pab0: 0, abdCoupling: 0 });
for (const limited of [false, true]) {
  const c = structuredClone(fixture.circ), p = { ...fixture.effective };
  c.vRa = 200; c.vIVC = 100; c.tCardiac = 0.5;
  // Stress the donor limiter at the ordinary timestep, without large-step
  // errors in the pulmonary transport stages. This is not a clinical setting.
  if (limited) p.rvr = 1e-8;
  const before = structuredClone(c), dt = fixture.dt;
  stepCirculation(p, c, fixture.resp, dt);
  const upstreamVolume = c.q.sys * dt - (c.vSv - before.vSv);
  check(`${limited ? 'limited' : 'ordinary'} reverse gradient transfers blood from RA to IVC`,
    c.p.ra > c.p.pIvcAtm && c.p.pIvcAtm > c.p.pCrit && c.q.vr < 0
    && c.vRa < before.vRa && c.vIVC > before.vIVC);
  check(`${limited ? 'limited' : 'ordinary'} backflow preserves both local balances and total volume`,
    Math.abs(c.vRa - before.vRa - (c.q.vr - c.q.tv) * dt) < 1e-9
    && Math.abs(c.vIVC - before.vIVC - upstreamVolume + c.q.vr * dt) < 1e-9
    && Math.abs(totalVolume(c) - totalVolume(before)) < 1e-8
    && COMPARTMENTS.every(key => Number.isFinite(c[key]) && c[key] >= 1 - 1e-9));
  if (limited) check('reverse-flow limiter uses the atrium as donor and exposes its intervention',
    c.limitTicks > 0 && Math.abs(c.vRa - 1) < 1e-8);
}

{
  const s = settled(SCENARIOS.find(scenario => scenario.id === 'pulmonary-embolism').params, 45);
  const initial = structuredClone(s.circ);
  let forwardVolume = 0, backwardVolume = 0, netVolume = 0, tricuspidVolume = 0;
  for (let i = 0; i < Math.round(10 / s.dt); i++) {
    stepRespiratory(s.effective, s.resp, s.dt);
    stepCirculation(s.effective, s.circ, s.resp, s.dt);
    const q = s.circ.q;
    forwardVolume += Math.max(0, q.vr) * s.dt;
    backwardVolume += Math.max(0, -q.vr) * s.dt;
    netVolume += q.vr * s.dt; tricuspidVolume += q.tv * s.dt;
  }
  check('a pressure-loaded RV preset has brief backflow with positive net venous return',
    backwardVolume > 0 && netVolume > 0 && Math.abs(netVolume - forwardVolume + backwardVolume) < 1e-7);
  check('preset net flow accounts for atrial storage without losing circulating blood',
    Math.abs(s.circ.vRa - initial.vRa - netVolume + tricuspidVolume) < 1e-7
    && Math.abs(totalVolume(s.circ) - totalVolume(initial)) < 1e-7
    && s.circ.limitTicks === 0);
}
