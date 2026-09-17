// Prevent archived research from silently becoming a runtime/build dependency.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { section, check, defaultParams, Simulator } from '../support/model.mjs';
import { parsePatientState, createPatientState } from '../../src/model/patient-state.js';
import * as lung from '../../src/model/lung.js';
const root = new URL('../../', import.meta.url);
const archive = new URL('tools/archive/ri/', root);
function modules(dir) {
  return readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const url = new URL(e.name + (e.isDirectory()?'/':''),dir);
    return e.isDirectory() ? modules(url) : /\.m?js$/.test(e.name) ? [url] : [];
  });
}
section('Retired R/I boundary');
const crossings=[];
for(const file of ['src/','tests/','tools/','manual/'].flatMap(d=>modules(new URL(d,root)))) {
  const source=readFileSync(file,'utf8');
  for(const [,specifier] of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)) {
    if(!specifier.startsWith('.')) continue;
    const target=new URL(specifier,file);
    if(file.href.startsWith(archive.href)!==target.href.startsWith(archive.href)) crossings.push(file.pathname+' → '+specifier);
  }
}
check('no imports cross the isolated archive boundary in either direction',crossings.length===0,crossings.join('\n'));
check('the active lung exports no R/I evaluator, calibration or protocol',
  !['calibrateRecruitmentToInflation','recruitmentToInflation','RI_LOW_PEEP','RI_HIGH_PEEP'].some(k=>k in lung));
const saved=createPatientState(defaultParams());
assert.throws(()=>parsePatientState({...saved,version:1}),/separate conversion/);
assert.throws(()=>parsePatientState({...saved,parameters:{...saved.parameters,riRatio:.7}}),/R\/I/);
check('old-format and disguised R/I prescriptions cannot be silently loaded',true);
const sim=new Simulator();
assert.throws(()=>sim.setParam('riRatio',.7),/explicit/);
sim.params = {...defaultParams(),riRatio:.7};
assert.throws(()=>sim.reset(),/R\/I/);
check('R/I cannot be supplied as a live prescription or control',true);
const registry=JSON.parse(readFileSync(new URL('tests/audit-expectations.json',root)));
check('the retired R/I finding is absent from active audit acceptance',!Object.hasOwn(registry,'ri-protocol'));
