import assert from 'node:assert/strict';
import {writeFileSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {Simulator} from '../../src/model/simulator.js';
import {defaultParams} from '../../src/model/parameters.js';
import {resolveParams} from '../../src/model/position.js';
import {SCENARIO_BY_ID} from '../../src/model/scenarios.js';
import {createCirculationState,stepCirculation,VASC} from '../../src/model/circulation.js';
import {stepRespiratory} from '../../src/model/respiratory.js';

const preset=SCENARIO_BY_ID.get('lv-failure').params;
const volumes=['vSa','vSv','vIVC','vRa','vRv','vPa','vPt','vPv','vLa','vLv'];
const total=c=>volumes.reduce((s,k)=>s+c[k],0);

// Open, single-beat LV test bench. All non-LV volumes are clamped to their
// initial values every step. No mitral filling, septal or pericardial coupling.
// This reuses the production pressure/valve integrator, not a second LV formula.
function bench({edv=180,aorta=80,external=0,ees=.6,dt=.00025}) {
  const p=resolveParams({...defaultParams(),...preset,eesLv:ees,septal:0,pericardium:0});
  const c=createCirculationState(p);
  Object.assign(c,{vLv:edv,vLa:10,vSa:VASC.vuSa+aorta*VASC.cSa});
  const fixed=structuredClone(c);
  const resp={ppl:external*1.3595,palv:0,pab:0,lungVolume:2.2,relaxVolume:2.2,plSolved:5,openFraction:1};
  let av=0,mv=0,dias=0,invalid=false;
  for(let i=0;i<Math.floor((60/p.hr)/dt);i++) {
    for(const k of volumes) if(k!=='vLv') c[k]=fixed[k];
    c.pulmonaryTransit=null;
    stepCirculation(p,c,resp,dt);
    av+=c.q.av*dt; mv+=c.q.mv*dt;
    if(c.act.v<.001) dias+=c.q.av*dt;
    invalid ||= c.pressureDomainRun || c.pressureDomainInvalid || c.limitTicks>0;
  }
  assert.ok(Math.abs(edv-c.vLv-av+mv)<1e-8);
  assert.ok(mv<1e-9 && dias<1e-9 && !invalid,'valid isolated ejection');
  return {edv,aorta,external,ees,dt,sv:av,esv:c.vLv,ef:100*av/edv,mitralVolume:mv,diastolicVolume:dias};
}

// Closed circulation: settle 135 s including reset, sample two 60-s windows (95 beats and 18 breaths each).
// Direct time integrals; beat endpoints averaged only at completed beats.
function sample(s,seconds=60,respOffset=0) {
  const c=s.circ,p=s.effective,dt=s.dt;
  assert.equal(p.baroreflexEnabled,false);
  const sum={av:0,pv:0,vr:0,sys:0,mv:0,sa:0,la:0,laTm:0,ra:0,raTm:0,ppl:0,pPeri:0,pvr:0,pa:0,pmsf:0};
  let overlap=0,dias=0,rvOverlap=0,rvDias=0,beats=0,edv=0,esv=0,esp=0,rvEdv=0,invalid=false;
  const startTotal=total(c),startLv=c.vLv;
  for(let i=0;i<Math.round(seconds/dt);i++) {
    const prev=c.beatCount;
    stepRespiratory(p,s.resp,dt);
    const resp=respOffset?{...s.resp,ppl:s.resp.ppl+respOffset}:s.resp;
    stepCirculation(p,c,resp,dt);
    for(const k of ['av','pv','vr','sys','mv']) sum[k]+=c.q[k]*dt;
    for(const k of ['sa','la','laTm','ra','raTm','ppl','pPeri','pvr','pa','pmsf']) sum[k]+=c.p[k]*dt;
    if(c.q.mv>1e-6 && c.q.av>1e-6) overlap+=c.q.av*dt;
    if(c.q.tv>1e-6 && c.q.pv>1e-6) rvOverlap+=c.q.pv*dt;
    if(c.act.v<.001) {dias+=c.q.av*dt;rvDias+=c.q.pv*dt;}
    invalid ||= c.pressureDomainInvalid || c.cardiacPhaseInvalid || c.limitTicks>0;
    if(c.beatCount!==prev){beats++;edv+=c.lvEdv;esv+=c.lvEsv;esp+=c.lvEsp;rvEdv+=c.rvEdv;}
  }
  const balanceError=c.vLv-startLv-sum.mv+sum.av;
  assert.ok(Math.abs(total(c)-startTotal)<1e-6 && Math.abs(balanceError)<1e-6);
  return {co:sum.av/seconds*.06,rvCo:sum.pv/seconds*.06,venousReturn:sum.vr/seconds*.06,systemicFlow:sum.sys/seconds*.06,
    ...Object.fromEntries(Object.entries(sum).filter(([k])=>!['av','pv','vr','sys','mv'].includes(k)).map(([k,v])=>[k,v/seconds])),
    edv:edv/beats,esv:esv/beats,esp:esp/beats,ef:100*(edv-esv)/edv,rvEdv:rvEdv/beats,
    overlap,dias,rvOverlap,rvDias,invalid,beats,balanceError};
}
function closed(changes,peep,dt=.00025) {
  const s=new Simulator({dt});s.applyScenario({params:{...preset,...changes,peep}});
  s.advance(60,true);s.advance(60,true);
  const first=sample(s),second=sample(s);
  return {changes,peep,dt,first,second};
}


// Research probes, not a new preset or a release acceptance target. The
// pressure-only counterfactual deliberately decouples thoracic pressure from
// respiratory mechanics; it cannot be selected as a clinical ventilator setting.
const root=new URL('../../',import.meta.url);
const repo=fileURLToPath(root);
const sourceHash=createHash('sha256').update(readFileSync(new URL('../../src/model/circulation.js',import.meta.url))).digest('hex');
const report={
  commit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),
  node:process.version,
  circulationSha256:sourceHash,
  scriptSha256:createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  protocol:{settlementSeconds:135,windowSeconds:60,windows:2,reflex:false,
    pressureUnit:'mmHg except pressureOnly.offsetCmH2O and PEEP (cmH2O)',
    volumeUnit:'mL',flowUnit:'L/min',pvrUnit:'mmHg.s/mL',
    endpointMeans:'unweighted completed beats',pressureMeans:'time integrals',
    isolated:'one beat; fixed EDV at start and fixed aortic pressure; zero mitral filling; pericardium and septum disabled; external pressure in mmHg',
    transient:'identical settled PEEP-zero states; one remains at zero and one steps to 10; paired 5-s integrals are NOT steady CO estimates',
    scope:'research only; no production equations or preset changed'},
  bench:[],closed:[],pressureOnly:[],transient:[]
};
for(const dt of [.00025,.000125])for(const ees of [.6,2.2])for(const edv of [160,180])for(const aorta of [70,80])for(const external of [0,5])report.bench.push(bench({edv,aorta,external,ees,dt}));
const phenotypes=[{},{svr:1.8},{stressedVolume:1300},{svr:1.8,stressedVolume:1300},
  {eesRv:1.6},{pericardium:0},{septal:0},{lvStiff:.020},{lvStiff:.015},
  {lvStiff:.020,eesLv:.4},{lvStiff:.015,eesLv:.4},{csv:60},{csv:30}];
for(const changes of phenotypes)for(const peep of [0,5,10]){
  report.closed.push(closed(changes,peep));
  console.error('completed',JSON.stringify(changes),'PEEP',peep);
}
for(const peep of [0,5,10])report.closed.push(closed({},peep,.000125));
for(const offset of [0,5,10]) {
  const s=new Simulator();s.applyScenario({params:{...preset,peep:0}});
  sample(s,120,offset);
  report.pressureOnly.push({offsetCmH2O:offset,first:sample(s,60,offset),second:sample(s,60,offset)});
}
for(const dt of [.00025,.000125]) {
  const sims=[0,10].map(peep=>{
    const s=new Simulator({dt});s.applyScenario({params:{...preset,peep:0}});
    s.advance(60,true);s.advance(60,true);s.setParam('peep',peep);
    s.effective=resolveParams(s.params);
    s.effective._relaxVolume=s.resp.relaxVolume;
    assert.equal(s.effective.peep,peep);
    return s;
  });
  for(let t=0;t<120;t+=5)report.transient.push({dt,start:t,end:t+5,control:sample(sims[0],5),peep10:sample(sims[1],5)});
}
// Numerical quality checks deliberately do not require a positive PEEP response.
for(const r of [...report.closed,...report.pressureOnly])for(const w of [r.first,r.second]){
  for(const value of Object.values(w))if(typeof value==='number')assert.ok(Number.isFinite(value));
  assert.ok(!w.invalid && w.overlap===0 && w.dias===0 && w.rvOverlap===0 && w.rvDias===0);
  assert.ok(Math.abs(w.co-w.systemicFlow)/Math.max(.1,w.co)<.005);
  assert.ok(Math.abs(r.first.co-r.second.co)/Math.max(.1,r.second.co)<.005);
}
let maxRefinement=0;
for(const peep of [0,5,10]){
  const pair=report.closed.filter(r=>Object.keys(r.changes).length===0 && r.peep===peep);
  const error=Math.abs(pair[0].second.co-pair[1].second.co)/pair[1].second.co;
  maxRefinement=Math.max(maxRefinement,error);assert.ok(error<.005);
}
let maxBenchRefinement=0;
for(const r of report.bench.filter(r=>r.dt===.00025)){
  const finer=report.bench.find(f=>f.dt===.000125 && f.ees===r.ees && f.edv===r.edv && f.aorta===r.aorta && f.external===r.external);
  const error=Math.abs(r.sv-finer.sv)/Math.max(.1,finer.sv);
  maxBenchRefinement=Math.max(maxBenchRefinement,error);assert.ok(error<.005);
}
for(const r of report.transient){
  for(const w of [r.control,r.peep10]){
    assert.ok(!w.invalid && w.overlap===0 && w.dias===0 && w.rvOverlap===0 && w.rvDias===0);
    for(const value of Object.values(w))if(typeof value==='number')assert.ok(Number.isFinite(value));
  }
}
report.quality={maxRefinement,maxBenchRefinement,checks:'finite data, conserved volume, absent LV/RV throughflow, matched steady flows/windows, base and bench step refinement'};
const output=process.argv[2];
if(!output)throw new Error('Usage: node tools/experiments/lv-afterload.mjs /path/to/report.json');
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('Saved',output);
