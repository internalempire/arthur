// A closed-loop lumped-parameter circulation. Eight compliant compartments, all
// volumes conserved, with each compartment referenced to the pressure that
// actually surrounds it:
//
//   systemic arteries  -> atmosphere
//   systemic veins     -> abdominal pressure
//   RA, RV, LA, LV     -> pleural pressure + pericardial pressure
//   PA, PV             -> pleural pressure
//
// Nothing about heart-lung interaction is added on top of this; it all falls out
// of that table. Raising intrathoracic pressure lifts right atrial pressure but
// not the systemic venous reservoir, so venous return falls. It lifts left
// ventricular cavity pressure and aortic pressure is unchanged, so the LV
// unloads. It lifts the RV and the pulmonary artery equally, so RV afterload is
// untouched — only lung volume can move that.

import { cmH2OtoMmHg, clamp } from './units.js';
import { pvrAt } from './lung.js';

// Unstressed volumes (mL) and compliances (mL/mmHg) that are not user-facing.
export const VASC = {
  vuSa: 700, cSa: 1.35,
  vuSv: 2800,
  vuPa: 90, cPa: 4.2,
  vuPv: 180, cPv: 8.5,
  rPulVen: 0.008,
};

const VALVE = { tricuspid: 0.004, pulmonic: 0.004, mitral: 0.005, aortic: 0.006 };

// Ventricular and atrial elastance descriptors.
export const CHAMBER = {
  lv: { v0s: 15, v0d: 10, edA: 0.45 },
  rv: { v0s: 10, v0d: 10, edA: 0.32, edB: 0.021 },
  ra: { v0: 8, eMin: 0.072, eMax: 0.20 },
  la: { v0: 10, eMin: 0.135, eMax: 0.30 },
};

const PERI = { v0: 430, scale: 62, k: 0.55 };
// Only the splanchnic share of the venous reservoir sits inside the abdomen;
// limb and cervical veins see atmosphere, so abdominal pressure is transmitted
// to mean systemic filling pressure at less than unity.
const ABD_VENOUS_FRACTION = 0.6;
const SEPTAL = { rvToLv: 0.085, lvToRv: 0.014, rvRef: 145, lvRef: 135, systolic: 0.042 };

export function createCirculationState(p) {
  return {
    vSa: 830,
    vSv: VASC.vuSv + p.stressedVolume,
    vRa: 55,
    vRv: 130,
    vPa: 140,
    vPv: 235,
    vLa: 72,
    vLv: 118,
    tCardiac: 0,
    // Per-beat trackers
    lvEdv: 122, lvEsv: 52, rvEdv: 132, rvEsv: 62,
    lvEsvRun: 1e9, rvEsvRun: 1e9,
    lvEsp: 100, rvEsp: 25,
    sv: 70, co: 5.2,
    beatCount: 0,
    limitTicks: 0,
    lastLoopLv: [], lastLoopRv: [], loopLv: [], loopRv: [],
  };
}

// Double-hill ventricular activation, normalised to a peak of 1.
function ventricularActivation(tn) {
  const a1 = 0.28, n1 = 1.9, a2 = 0.46, n2 = 18;
  const g1 = Math.pow(tn / a1, n1);
  const g2 = Math.pow(tn / a2, n2);
  return (g1 / (1 + g1)) * (1 / (1 + g2)) / 0.885;
}

// Atrial systole occupies the last fifth of the cardiac cycle.
function atrialActivation(tn) {
  const start = 0.80;
  if (tn < start) return 0;
  return Math.sin((Math.PI * (tn - start)) / (1 - start)) ** 2;
}

function ventricularPressure(v, act, ees, v0s, edA, edB, v0d) {
  const passive = edA * (Math.exp(edB * Math.max(0, v - v0d)) - 1);
  const active = ees * (v - v0s);
  return act * active + (1 - act) * passive;
}

function valveFlow(pUp, pDown, r) {
  const dp = pUp - pDown;
  return dp > 0 ? dp / r : 0;
}

// Which compartment each flow drains, and which it fills, when the flow is
// positive. Two of them (systemic capillary and pulmonary venous) can reverse,
// so the source is decided by sign at the time.
const FLOW_EDGES = [
  ['av', 'vLv', 'vSa'], ['sys', 'vSa', 'vSv'], ['vr', 'vSv', 'vRa'], ['tv', 'vRa', 'vRv'],
  ['pv', 'vRv', 'vPa'], ['pul', 'vPa', 'vPv'], ['pulVen', 'vPv', 'vLa'], ['mv', 'vLa', 'vLv'],
];
const VOLUME_FLOOR = 1; // mL a compartment may never be drained below

// Collapse of the great veins is progressive rather than a hard knee: as right
// atrial pressure approaches the closing pressure the vessel flutters, so
// sensitivity to Pra fades over roughly a millimetre of mercury instead of
// vanishing at a point.
const COLLAPSE_KNEE = 1.1; // mmHg

/**
 * Venous return, in mL/s. The single definition — the integrator and the curve
 * drawn on the Guyton diagram both call this, so the plot cannot drift away
 * from the model the way it did when the curve used a hard `max()` against a
 * softplus in the integrator.
 */
export function venousReturnBackPressure(pra, pCrit) {
  return pCrit + COLLAPSE_KNEE * Math.log1p(Math.exp((pra - pCrit) / COLLAPSE_KNEE));
}

export function venousReturnFlow(pmsf, pra, pCrit, rvr) {
  return Math.max(0, (pmsf - venousReturnBackPressure(pra, pCrit)) / rvr);
}

/**
 * Scale back any flow that would drain its source compartment past the floor.
 * Mutates `q` and returns true if anything was limited — which is the signal
 * that the model has been driven outside the range where its equations mean
 * anything, and that the readouts should say so rather than report a number.
 */
function limitFlows(c, q, dt) {
  let demand = null;
  for (const [key, from, to] of FLOW_EDGES) {
    const f = q[key];
    if (f === 0) continue;
    const src = f > 0 ? from : to;
    (demand ??= {})[src] = (demand[src] ?? 0) + Math.abs(f);
  }
  if (!demand) return false;

  let scale = null;
  for (const name in demand) {
    const wanted = demand[name] * dt;
    const available = Math.max(0, c[name] - VOLUME_FLOOR);
    if (wanted > available) (scale ??= {})[name] = available / wanted;
  }
  if (!scale) return false;

  for (const [key, from, to] of FLOW_EDGES) {
    const f = q[key];
    if (f === 0) continue;
    const s = scale[f > 0 ? from : to];
    if (s !== undefined) q[key] = f * s;
  }
  return true;
}

/**
 * Advance the circulation by dt seconds.
 * `resp` supplies ppl / palv / pab in cmH2O and lungVolume in litres.
 */
export function stepCirculation(p, c, resp, dt) {
  const period = 60 / p.hr;
  c.tCardiac += dt;
  if (c.tCardiac >= period) {
    c.tCardiac -= period;
    closeBeat(c);
  }
  const tn = c.tCardiac / period;
  const actV = ventricularActivation(tn);
  const actA = atrialActivation(tn);

  const ppl = cmH2OtoMmHg(resp.ppl);
  const palv = cmH2OtoMmHg(resp.palv);
  const pab = cmH2OtoMmHg(resp.pab);
  const vAboveFrc = resp.lungVolume - p.frc;

  // --- pericardium: the four chambers share one space ----------------------
  const vHeart = c.vRa + c.vRv + c.vLa + c.vLv;
  const pPeri = p.pericardium > 0 && vHeart > PERI.v0
    ? p.pericardium * PERI.k * (Math.exp((vHeart - PERI.v0) / PERI.scale) - 1)
    : 0;
  const pExtCardiac = ppl + pPeri;

  // --- chamber transmural pressures ---------------------------------------
  const septalToLv = p.septal * SEPTAL.rvToLv * Math.max(0, c.vRv - SEPTAL.rvRef);
  const septalToRv = p.septal * SEPTAL.lvToRv * Math.max(0, c.vLv - SEPTAL.lvRef);

  let pLvTm = ventricularPressure(c.vLv, actV, p.eesLv, CHAMBER.lv.v0s,
    CHAMBER.lv.edA, p.lvStiff, CHAMBER.lv.v0d) + septalToLv;
  // Systolic interdependence: a large share of RV systolic pressure is generated
  // by the contracting left ventricle through shared myofibres. This is anatomy
  // rather than septal geometry, so it is not on the septal-coupling control —
  // that control isolates the diastolic septal shift.
  const lvAssist = SEPTAL.systolic * actV * p.eesLv * Math.max(0, c.vLv - CHAMBER.lv.v0s);
  let pRvTm = ventricularPressure(c.vRv, actV, p.eesRv, CHAMBER.rv.v0s,
    CHAMBER.rv.edA, CHAMBER.rv.edB, CHAMBER.rv.v0d) + septalToRv + lvAssist;

  const eRa = CHAMBER.ra.eMin + (CHAMBER.ra.eMax - CHAMBER.ra.eMin) * actA;
  const eLa = CHAMBER.la.eMin + (CHAMBER.la.eMax - CHAMBER.la.eMin) * actA;
  const pRaTm = eRa * (c.vRa - CHAMBER.ra.v0);
  const pLaTm = eLa * (c.vLa - CHAMBER.la.v0);

  const pRa = pRaTm + pExtCardiac;
  const pRv = pRvTm + pExtCardiac;
  const pLa = pLaTm + pExtCardiac;
  const pLv = pLvTm + pExtCardiac;

  // --- vascular compartments ----------------------------------------------
  const pSa = (c.vSa - VASC.vuSa) / VASC.cSa;
  // The splanchnic reservoir is surrounded by abdominal pressure, but what that
  // pressure does depends on how full the bed is. With a distended abdominal
  // venous compartment (zone III) diaphragmatic descent squeezes blood forward
  // and raises mean systemic filling pressure. With a collapsed one (zone I/II)
  // the same pressure obliterates the capacitance vessels instead, raising the
  // resistance to venous return rather than the pressure head.
  const pmsfElastic = (c.vSv - VASC.vuSv) / p.csv;
  const abdZone = clamp((pmsfElastic - 2) / 8, 0, 1);
  const pmsf = pmsfElastic + ABD_VENOUS_FRACTION * pab * abdZone;
  const rvrEff = p.rvr * (1 + 0.5 * (1 - abdZone) * Math.max(0, pab - 2) / 4);
  const pPa = (c.vPa - VASC.vuPa) / VASC.cPa + ppl;

  // Lung inflation squeezes the pulmonary vascular bed toward the left atrium,
  // but only where the capillaries are open (zone III).
  const pPvRaw = (c.vPv - VASC.vuPv) / VASC.cPv + ppl;
  const zone3 = clamp((pPvRaw - palv) / 4, 0, 1);
  const vuPvEff = VASC.vuPv - p.piston * Math.max(0, vAboveFrc) * zone3;
  const pPv = (c.vPv - vuPvEff) / VASC.cPv + ppl;

  // --- flows ---------------------------------------------------------------
  // Venous return with a Starling resistor: once right atrial pressure falls
  // below the pressure surrounding the great veins, the vessel flutters shut and
  // flow stops rising. This is the plateau of the venous return curve. The IVC
  // tolerates roughly 5 cmH2O of transmural compression before it collapses.
  const pCrit = pab - cmH2OtoMmHg(5);
  const qVr = venousReturnFlow(pmsf, pRa, pCrit, rvrEff);
  const qSys = (pSa - pmsf) / p.svr;

  const pvr = pvrAt(p, resp.lungVolume);
  // Vascular waterfall: where alveolar pressure exceeds pulmonary venous
  // pressure, alveolar pressure — not left atrial pressure — is the downstream
  // pressure for flow.
  const qPul = Math.max(0, (pPa - Math.max(pPv, palv)) / pvr);
  const qPulVen = (pPv - pLa) / VASC.rPulVen;

  const qTv = valveFlow(pRa, pRv, VALVE.tricuspid);
  const qPv = valveFlow(pRv, pPa, VALVE.pulmonic);
  const qMv = valveFlow(pLa, pLv, VALVE.mitral);
  const qAv = valveFlow(pLv, pSa, VALVE.aortic);

  // A compartment cannot give up volume it does not have. Without this a large
  // adverse gradient across the unvalved pulmonary venous connection empties the
  // left atrium straight through zero — a randomised sweep of the control ranges
  // reached −128 mL. Scaling both ends of a flow by the same factor keeps total
  // volume conserved exactly.
  const q = { av: qAv, sys: qSys, vr: qVr, tv: qTv, pv: qPv, pul: qPul, pulVen: qPulVen, mv: qMv };
  const limited = limitFlows(c, q, dt);

  // --- integrate -----------------------------------------------------------
  c.vSa += (q.av - q.sys) * dt;
  c.vSv += (q.sys - q.vr) * dt;
  c.vRa += (q.vr - q.tv) * dt;
  c.vRv += (q.tv - q.pv) * dt;
  c.vPa += (q.pv - q.pul) * dt;
  c.vPv += (q.pul - q.pulVen) * dt;
  c.vLa += (q.pulVen - q.mv) * dt;
  c.vLv += (q.mv - q.av) * dt;

  // --- expose the instantaneous state --------------------------------------
  c.p = {
    ra: pRa, rv: pRv, la: pLa, lv: pLv, sa: pSa, pa: pPa, pv: pPv,
    pmsf, pCrit, pPeri, ppl, palv, pab, rvrEff, abdZone,
    raTm: pRaTm, rvTm: pRvTm, lvTm: pLvTm, laTm: pLaTm,
    zone3, pvr, vHeart,
  };
  c.q = { vr: q.vr, sys: q.sys, pul: q.pul, tv: q.tv, pv: q.pv, mv: q.mv, av: q.av, pulVen: q.pulVen };
  c.act = { v: actV, a: actA, tn };

  // Latch the fact that limiting happened so it survives to the next readout,
  // and decay it so the state clears once the model returns to a sane regime.
  if (limited) c.limitTicks = 4000; // about a second of simulated time at the default step
  else if (c.limitTicks > 0) c.limitTicks--;

  // End-systolic volume of the beat currently in progress. End-diastolic volume
  // is read at the beat boundary itself rather than as a maximum over the
  // window, which would otherwise pair one beat's ESV with the next beat's EDV
  // and smooth away the respiratory variation we are trying to show.
  c.lvEsvRun = Math.min(c.lvEsvRun, c.vLv);
  c.rvEsvRun = Math.min(c.rvEsvRun, c.vRv);
  // Stored transmural. Two consumers used to correct these themselves and did
  // it differently: the pressure–volume loops subtracted pleural pressure only,
  // the cardiac function curve subtracted a pleural pressure from a different
  // instant than the beat the pressure came from.
  if (q.av > 0) c.lvEspRun = pLvTm;
  if (q.pv > 0) c.rvEspRun = pRvTm;

  // Pressure-volume loop trace, subsampled.
  if (!c._loopTick) c._loopTick = 0;
  if (c._loopTick++ % 8 === 0) {
    c.loopLv.push(c.vLv, pLvTm);
    c.loopRv.push(c.vRv, pRvTm);
    if (c.loopLv.length > 1200) c.loopLv.splice(0, 400);
    if (c.loopRv.length > 1200) c.loopRv.splice(0, 400);
  }

  return c;
}

function closeBeat(c) {
  // Sampled at end-diastole, before this step's pressures are recomputed. The
  // clinically meaningful septal shift is a diastolic finding — taking the
  // instantaneous difference instead would just track the cardiac cycle, since
  // left ventricular pressure dominates through the whole of systole.
  if (c.p) c.septalShift = c.p.rvTm - c.p.lvTm;

  // Volume at this instant is end-diastolic: the beat that just finished began
  // from `edvPending` and reached `lvEsvRun`.
  if (c.edvPending !== undefined) {
    c.lvEdv = c.edvPending; c.lvEsv = c.lvEsvRun;
    c.rvEdv = c.rvEdvPending; c.rvEsv = c.rvEsvRun;
    c.sv = Math.max(0, c.lvEdv - c.lvEsv);
    c.svRv = Math.max(0, c.rvEdv - c.rvEsv);
  }
  c.edvPending = c.vLv;
  c.rvEdvPending = c.vRv;
  c.lvEsp = c.lvEspRun ?? c.lvEsp;
  c.rvEsp = c.rvEspRun ?? c.rvEsp;
  c.lvEsvRun = 1e9; c.rvEsvRun = 1e9;
  c.beatCount++;
  c.lastLoopLv = c.loopLv; c.loopLv = [];
  c.lastLoopRv = c.loopRv; c.loopRv = [];
}

// ---------------------------------------------------------------------------
// Curves derived from the live parameters, for the Guyton diagram. These are
// computed from the same constants the integrator uses, so the intersection of
// the two curves lands on the operating point the simulation actually reaches.
// ---------------------------------------------------------------------------

/**
 * Venous return as a function of right atrial pressure, in L/min.
 * `mean` carries the cycle-averaged state, so the curve is not redrawn several
 * times a second by the cardiac ripple riding on these pressures.
 */
export function venousReturnCurve(p, c, mean, nPoints = 90, pmsfOverride = null) {
  const pmsf = pmsfOverride ?? mean?.pmsf ?? c.p.pmsf;
  const pCrit = mean?.pCrit ?? c.p.pCrit; // follows lung volume, so it moves with the breath
  const pts = [];
  const lo = Math.min(pCrit - 6, -6);
  for (let i = 0; i < nPoints; i++) {
    const pra = lo + ((pmsf + 3 - lo) * i) / (nPoints - 1);
    const q = venousReturnFlow(pmsf, pra, pCrit, c.p.rvrEff);
    pts.push(pra, (q * 60) / 1000);
  }
  return { points: pts, pmsf, pCrit };
}

/**
 * Right ventricular function as a function of right atrial pressure, in L/min.
 * Filling pressure is converted to transmural pressure, inverted through the RV
 * EDPVR to an end-diastolic volume, then run through the single-beat
 * elastance relation with the arterial elastance the RV currently faces.
 */
/** Linear interpolation into a flat [x0,y0,x1,y1,…] curve. */
export function valueAt(pts, x) {
  for (let i = 2; i < pts.length; i += 2) {
    const a = pts[i - 2], b = pts[i];
    if ((a <= x && x <= b) || (b <= x && x <= a)) {
      const t = (x - a) / ((b - a) || 1);
      return pts[i - 1] + t * (pts[i + 1] - pts[i - 1]);
    }
  }
  return NaN;
}

/**
 * Where the two curves cross — which is what the operating point of a Guyton
 * diagram *is*.
 *
 * Lives here rather than in the panel because the bolus prediction below is a
 * construction on the same two curves, and a prediction drawn with one
 * implementation and tested with another is not tested.
 */
export function curveIntersection(vr, cf) {
  const f = (x) => valueAt(vr, x) - valueAt(cf, x);
  let lo = Math.max(vr[0], cf[0]);
  let hi = Math.min(vr[vr.length - 2], cf[cf.length - 2]);
  if (!(f(lo) > 0) || !(f(hi) < 0)) return null; // no crossing in view
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  const x = (lo + hi) / 2;
  return { x, y: valueAt(vr, x) };
}

export function cardiacFunctionCurve(p, c, mean, nPoints = 90) {
  // Both terms are cycle-averaged. Sliding this curve along the pressure axis
  // with each breath is the phenomenon the diagram exists to show, and averaging
  // over one cardiac cycle leaves the respiratory swing intact while removing
  // the beat-to-beat ripple that would otherwise jitter the intercept.
  const pExt = (mean?.ppl ?? c.p.ppl) + (mean?.pPeri ?? c.p.pPeri);
  const svRv = Math.max(4, c.svRv ?? c.sv);
  const ea = Math.max(0.02, c.rvEsp / svRv); // both transmural, same beat
  const { edA, edB, v0d, v0s } = { ...CHAMBER.rv, v0s: CHAMBER.rv.v0s };
  const pts = [];
  for (let i = 0; i < nPoints; i++) {
    const pra = pExt - 4 + (i * 22) / (nPoints - 1);
    const ptm = pra - pExt;
    // Invert the exponential EDPVR.
    const edv = ptm <= 0 ? v0d : v0d + Math.log(ptm / edA + 1) / edB;
    const sv = Math.max(0, (p.eesRv * (edv - v0s)) / (p.eesRv + ea));
    pts.push(pra, (sv * p.hr) / 1000);
  }
  return { points: pts, xIntercept: pExt };
}

/**
 * How much cardiac output the operating point gains per mmHg of filling
 * pressure — the slope of the Guyton construction rather than of either curve
 * alone.
 *
 * This is what "on the steep part of the Starling curve" means once it is stated
 * precisely. Adding volume translates the venous return curve to the right and
 * leaves cardiac function where it is, so the question is how far the
 * intersection climbs when it does. On the steep limb it climbs; on the plateau
 * it slides sideways along a flat cardiac function curve and the output barely
 * moves. Both curves matter: a stiff venous system moves the intersection
 * further for the same volume, and a flat cardiac function curve stops it
 * counting for anything.
 *
 * Deliberately expressed per mmHg of mean systemic filling pressure rather than
 * per millilitre of fluid. Converting to millilitres needs an assumption about
 * how much of a bolus stays in the capacitance vessels, which is exactly the
 * assumption a bedside fluid challenge is testing, so building it into the
 * prediction would beg the question.
 */
export const PRELOAD_STEEP = 0.10; // fraction of output per mmHg, see the note below

export function preloadSensitivity(p, c, mean, delta = 0.5) {
  const base = mean?.pmsf ?? c.p.pmsf;
  const cf = cardiacFunctionCurve(p, c, mean).points;
  const at = (pmsf) => curveIntersection(venousReturnCurve(p, c, mean, 90, pmsf).points, cf);
  const lo = at(base - delta);
  const hi = at(base + delta);
  if (!lo || !hi) return null;

  const slope = (hi.y - lo.y) / (2 * delta); // L/min per mmHg
  const here = at(base);
  // As a fraction of current output, so it can be read as "this much more
  // output per mmHg of filling" without carrying the patient's size with it.
  const relative = here && here.y > 0.1 ? slope / here.y : 0;
  return {
    slope,
    relative,
    co: here ? here.y : NaN,
    pmsf: base,
    steep: relative >= PRELOAD_STEEP,
  };
}

/**
 * The cardiac function curve split into the part where filling buys output and
 * the part where it does not.
 *
 * Every intersection lies on the cardiac function curve by construction, so
 * sweeping filling pressure traces a segment of that curve rather than a new
 * one — drawing it as a separate line, as a first version of this did, adds
 * nothing but ink. What is worth drawing is which portion of it is steep, so
 * that "on the steep part of the Starling curve" is a place on the picture
 * instead of a claim in a tile.
 *
 * Sensitivity is evaluated along the sweep by finite differences, so it carries
 * both curves the way `preloadSensitivity` does: a flat cardiac function curve
 * and a stiff venous system give different answers at the same point.
 */
export function preloadLimbs(p, c, mean, span = 14, nPoints = 48) {
  const base = mean?.pmsf ?? c.p.pmsf;
  const cf = cardiacFunctionCurve(p, c, mean).points;
  const swept = [];
  for (let i = 0; i < nPoints; i++) {
    const pmsf = Math.max(0.5, base - span * 0.45 + (span * i) / (nPoints - 1));
    const x = curveIntersection(venousReturnCurve(p, c, mean, 60, pmsf).points, cf);
    if (x) swept.push({ pmsf, x: x.x, y: x.y });
  }
  if (swept.length < 3) return { steep: [], plateau: [] };

  const steep = [], plateau = [];
  for (let i = 0; i < swept.length; i++) {
    const a = swept[Math.max(0, i - 1)];
    const b = swept[Math.min(swept.length - 1, i + 1)];
    const d = b.pmsf - a.pmsf;
    const rel = d > 0 && swept[i].y > 0.1 ? (b.y - a.y) / d / swept[i].y : 0;
    (rel >= PRELOAD_STEEP ? steep : plateau).push(swept[i].x, swept[i].y);
  }
  return { steep, plateau };
}

// A note on the threshold above.
//
// It is calibrated against this model, not taken from a paper, and that is worth
// stating plainly. The clinical convention is that a patient is fluid responsive
// if 500 mL raises cardiac output by 15%, so the sensitivity that corresponds to
// that was measured rather than assumed: across 69 randomised configurations
// varying stressed volume, systemic resistance, heart rate, right ventricular
// contractility, venous compliance, PEEP, resistance to venous return and
// abdominal pressure, a threshold of 0.10 classifies 90% of them the same way
// the model's own response to 500 mL does.
//
// The cases it gets wrong are the interesting ones and they fall into two
// groups. A patient can have a steep local slope and still gain little, because
// 500 mL walks them past the knee and the gain saturates — the slope is a
// derivative and the bolus is not infinitesimal. And a patient with a small
// venous compliance gains more than their slope suggests, because the same
// bolus buys them more filling pressure. That second one is precisely the
// assumption left out of `preloadSensitivity` on purpose: how much pressure a
// given volume buys is what a fluid challenge is for.
