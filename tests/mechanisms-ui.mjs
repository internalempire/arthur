import assert from 'node:assert/strict';
import { mechanismComparison, mechanismFields } from '../src/ui/mechanisms-panel.js';
import { createMechanismsDisclosure } from '../src/ui/mechanisms-disclosure.js';

export async function checkMechanismsUI(check) {
  const view = (co, valid = true) => ({ metrics: { valid, co } });
  const compare = (a, b) => mechanismComparison(mechanismFields.co, a, b);
  check('mechanism differences follow displayed precision and preserve zero',
    compare(view(4.001), view(4.004)).delta === 'Δ 0'
    && compare(view(0), view(4)).delta === 'Δ −4.00'
    && compare(view(4.12), view(4)).delta === 'Δ +0.12');
  check('invalid and missing mechanism readings are independently withheld',
    compare(view(3, false), view(4)).now.text === '—'
    && compare(view(3, false), view(4)).before.text === '4.00'
    && compare(view(3), view(NaN)).delta === 'Δ —'
    && compare(view(3), view(null)).before.text === '—');
  const rv = mechanismComparison(mechanismFields.rvco,
    { metrics: { valid: true }, circ: { svRv: 60, beatDuration: 0.8 } },
    { metrics: { valid: true }, circ: { svRv: 50, beatDuration: 1 } });
  check('RV output uses integrated forward stroke volume and measured beat duration',
    rv.now.text === '4.50' && rv.before.text === '3.00' && rv.delta === 'Δ +1.50'
    && mechanismFields.pvr.label.includes('Internal')
    && mechanismFields.lvesp.clock === 'last completed beat');

  const attrs = new Map();
  let toggle;
  const button = { addEventListener: (name, fn) => { toggle = fn; }, setAttribute: (k, v) => attrs.set(k, v) };
  const host = { hidden: true, textContent: '', replaceChildren() { this.textContent = ''; } };
  let context = { reference: { id: 1 }, historical: false };
  let loads = 0, mounts = 0, renders = 0, destroys = 0;
  let resolveLoad;
  const factory = { createMechanismsPanel: () => {
    mounts++;
    return { render() { renders++; }, destroy() { destroys++; } };
  } };
  const disclosure = createMechanismsDisclosure(button, host, () => context, () => {
    loads++; return new Promise(resolve => { resolveLoad = resolve; });
  });
  for (let i = 0; i < 100; i++) disclosure.sync(context);
  check('closed mechanisms do not load, mount or render', loads === 0 && mounts === 0 && renders === 0 && host.hidden);
  const first = toggle();
  await toggle(); // close during import
  resolveLoad(factory); await first;
  check('closing during a lazy import prevents late construction', mounts === 0 && host.hidden && attrs.get('aria-expanded') === 'false');
  await toggle(); disclosure.sync(context);
  check('opening after cancellation reuses the import and renders only when requested', loads === 1 && mounts === 1 && renders === 2);
  context = { reference: null };
  disclosure.sync(context);
  check('losing the last reference destroys the view and prevents hidden updates', destroys === 1 && host.hidden && button.disabled);
  disclosure.sync(context);
  assert.equal(renders, 2);
  context = { reference: { id: 2 }, historical: true };
  await toggle();
  check('historical inspection cannot start a live mechanisms comparison', mounts === 1);

  let fail = true;
  const retry = createMechanismsDisclosure(button, host, () => ({ reference: { id: 1 } }), () => fail
    ? Promise.reject(new Error('offline')) : Promise.resolve(factory));
  await toggle();
  check('lazy loading errors expose a retry without mounting a graph', host.textContent.includes('retry') && attrs.get('aria-expanded') === 'false');
  fail = false; await toggle(); retry.close();
  check('a failed import can be retried and the resulting view disposed', mounts === 2 && destroys === 2 && host.hidden);
}
