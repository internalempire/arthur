import assert from 'node:assert/strict';
import { section, check, defaultParams, Simulator, SCENARIOS, totalVolume } from '../support/model.mjs';
import { parsePatientState, createPatientState } from '../../src/model/patient-state.js';
import { resolveParams } from '../../src/model/position.js';
import { ARDS_REOPENABLE, normalizeRecruitmentParameters } from '../../src/model/recruitment.js';
import { lungVolumeAtPl, lungRegions, calibrateRecruitmentToInflation } from '../../src/model/lung.js';

section('Explicit opening profiles and saved prescriptions');
const old = { ...defaultParams(), ...SCENARIOS.find(x=>x.id==='ards-rv').params, riRatio: .7 };
delete old.reopenable; delete old.recruitmentProfile;
const parsed = parsePatientState({ format:'arthur-patient-state', version:1, parameters:old });
check('version 1 converts the full supine phenotype once and preserves its exact share',
  parsed.migrated && parsed.params.reopenable === ARDS_REOPENABLE && !Object.hasOwn(parsed.params,'riRatio'));
const legacyCustom={...old,position:'prone',hysteresis:'on',pOpen:18.5,pClose:4};
const convertedCustom=parsePatientState({format:'arthur-patient-state',version:1,parameters:legacyCustom});
check('a legacy custom prone prescription preserves its own pressure settings and supine potential',
 convertedCustom.params.recruitmentProfile==='custom' && convertedCustom.params.pClose===4
 && convertedCustom.params.pOpen===18.5 && convertedCustom.params.position==='prone'
 && convertedCustom.params.reopenable===calibrateRecruitmentToInflation(legacyCustom).openableFraction);
const legacyResolved = { ...old, openableDiseasedFraction:calibrateRecruitmentToInflation(old).openableFraction };
check('converted gas-volume and opening curves equal the legacy prescription',
  Array.from({length:211},(_,i)=>-25+i*.5).every(pl=>lungVolumeAtPl(legacyResolved,pl)===lungVolumeAtPl(resolveParams(parsed.params),pl)));
const custom={...parsed.params,reopenable:.314159265358,pOpen:22,pClose:7,hysteresis:'on',recruitmentProfile:'custom',position:'prone'};
const roundtrip=parsePatientState(createPatientState(custom));
check('version 2 preserves exact custom values and typed settings',JSON.stringify(roundtrip.params)===JSON.stringify(custom));
let rejected=0;
for(const candidate of [
 {format:'arthur-patient-state',version:1,parameters:{...old,riRatio:NaN}},
 createPatientState({...custom,reopenable:1.1}),
 createPatientState({...custom,pOpen:10,pClose:12}),
])try{parsePatientState(candidate);}catch{rejected++;}
check('invalid legacy ratios, fractions and closing ranges are rejected',rejected===3);
const wall=[{ccw:100},{cwLoad:15},{clung:40},{collapsed:.6},{position:'prone'}];
check('wall, tissue, extent and position never recalibrate reopenable potential',wall.every(change=>resolveParams({...custom,...change}).openableDiseasedFraction===custom.reopenable));
const zero=normalizeRecruitmentParameters({...defaultParams(),collapsed:0});
check('a newly added compromised component starts non-reopenable',zero.reopenable===0 && zero.recruitmentProfile==='closed');

section('Profile changes and complete-breath measurements');
const s=new Simulator();s.applyScenario({params:{...parsed.params,rr:10,ti:1,pmus:0}});
const gas=s.resp.lungVolume,blood=totalVolume(s.circ),original={peep:s.params.peep,vt:s.params.vt,eesRv:s.params.eesRv};
s.setParam('recruitmentProfile','memory');
check('a profile changes only its opening prescription and preserves gas and blood',
 s.params.pClose===6&&s.params.reopenable===ARDS_REOPENABLE&&s.params.hysteresis==='on'
 && Math.abs(s.resp.v+s.resp.relaxVolume-gas)<1e-12&&totalVolume(s.circ)===blood
 && Object.entries(original).every(([k,v])=>s.params[k]===v));
s.setParam('collapsed', .5);s.setParam('ccw', 100);s.setParam('pOpen', 20);
check('successive paused mechanics edits retain the same physical gas volume',
 Math.abs(s.resp.lungVolume-gas)<1e-12 && Math.abs(s.resp.v+s.resp.relaxVolume-gas)<1e-12);
check('enabling memory does not preload the whole potential compartment as open',s.resp.recruitedFraction===null);
s.advance(10,true);
const retained=s.resp.recruitedFraction;
s.setParam('reopenable',1);
check('increasing potential with memory retains actual recruitment until pressure acts',s.resp.recruitedFraction===retained);
s.setParam('reopenable',0);
check('decreasing potential clips retained recruitment to the available component',s.resp.recruitedFraction===0);
s.setParam('hysteresis','off');
check('disabling memory clears the retained diseased state',s.resp.recruitedFraction===null);
check('readout invalidation is immediate even while paused',s.metrics.closedEndExpiratoryFraction===null&&s.metrics.tidalOpenExcursion===null);
s.setParam('pOpen',5);
check('advanced edits select Custom and constrain closure to opening',s.params.recruitmentProfile==='custom'&&s.params.pClose===5);
s.setParam('recruitmentProfile','equilibrium');s.advance(20,true);
s.setParam('peep',5);s.advance(0,true);
const r=s.resp;
let active=false,lo=Infinity,hi=-Infinity,previous=lungRegions(s.effective,r.lungVolume,r.plSolved,r.openFraction).openFraction;
let cycles=0,worst=0;
const accumulate=s.accumulate.bind(s);let lastCount=r.breathCount;
s.accumulate=()=>{
 accumulate();
 if(r.breathCount!==lastCount){
  if(active){worst=Math.max(worst,Math.abs(r.lastClosedEndExpiratory-(1-previous)),Math.abs(r.lastOpenExcursion-(hi-lo)));cycles++;}
  else assert.equal(r.lastClosedEndExpiratory,null);
  active=true;lo=previous;hi=previous;lastCount=r.breathCount;
 }
 const phi=lungRegions(s.effective,r.lungVolume,r.plSolved,r.openFraction).openFraction;
 if(active){lo=Math.min(lo,phi);hi=Math.max(hi,phi);}previous=phi;
};
s.advance(20,true);s.accumulate=accumulate;
check('end-expiratory fraction and excursion belong to the same independently observed full cycle',cycles>=2&&worst<1e-12);
s.resp.hold='inspiratory';s.advance(.01,true);
check('an occlusion invalidates cycle measurements',s.metrics.closedEndExpiratoryFraction===null&&s.metrics.tidalOpenExcursion===null);
s.resp.hold=null;s.advance(20,true);
check('measurements recover after complete post-hold breaths',s.metrics.closedEndExpiratoryFraction!==null&&s.metrics.tidalOpenExcursion>0);
for(const mode of ['spont','pcv','psv']){
 s.applyScenario({params:{...custom,position:'supine',mode,pmus:mode==='pcv'?0:6,rr:12,ti:1,peep:8,pOpen:15.5,pClose:6}});
 s.advance(20,true);
 check(`${mode} provides finite, bounded cycle measurements`,Number.isFinite(s.metrics.closedEndExpiratoryFraction)&&s.metrics.closedEndExpiratoryFraction>=0&&s.metrics.closedEndExpiratoryFraction<=1&&Number.isFinite(s.metrics.tidalOpenExcursion)&&s.metrics.tidalOpenExcursion>=0);
}
