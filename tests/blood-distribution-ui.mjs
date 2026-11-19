import { Simulator } from '../src/model/index.js';
import { observeDistribution } from '../src/ui/blood-distribution.js';

export function checkBloodDistribution(check) {
  // Artificial volumes distinguish all ten compartments, including the IVC
  // and the alveolar-exposed middle store. Each complete breath has two samples.
  let observer;
  const world = {resp: {breathCount: 3}, circ: {
    vSv: 1, vIVC: 2, vRa: 4, vRv: 8, vPa: 16, vPt: 32, vPv: 64, vLa: 128, vLv: 256, vSa: 512,
  }, observeBloodVolumes(o) { observer = o; return () => { observer = null; }; }};
  const watch = observeDistribution(world);
  const sample = n => { world.resp.breathCount = n; observer.sample(world); };
  sample(3); sample(4);
  check('distribution waits through a partial breath', watch.mean === null);
  world.circ.vSv += 100;
  sample(4); sample(5);
  check('distribution assigns every store once and averages samples from the completed breath',
    String(watch.mean) === '53,12,112,384,512');
  world.resp.holdPending = 'inspiratory';
  sample(5);
  check('pending occlusion discards the regional observation', watch.mean === null);
  watch.detach();

  const sim = new Simulator();
  const baseline = sim.fork();
  const live = observeDistribution(sim);
  sim.advance(12,true); baseline.advance(12,true);
  check('sampling leaves the model trajectory identical and its means sum to total blood',
    JSON.stringify(sim.circ) === JSON.stringify(baseline.circ) &&
    Math.abs(live.mean.reduce((a,b)=>a+b,0)-sim.metrics.bloodVolume)<1e-6);
  const pin = sim.fork();
  const saved = live.mean;
  pin.setParam('peep', 10); pin.advance(10,true);
  check('forks do not inherit a displayed state observer', live.mean === saved);
  sim.setParam('stressedVolume',sim.params.stressedVolume+100);
  check('applied volume immediately invalidates complete-breath means while paused', live.mean === null);
  live.detach();
  sim.advance(12,true);
  check('closing stops collection', live.mean === null);
}
