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
import { pvrAt } from './respiratory.js';

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
  // Collapse is progressive rather than a hard knee: as right atrial pressure
  // approaches the closing pressure the vessel flutters, so sensitivity to Pra
  // fades over roughly a millimetre of mercury instead of vanishing at a point.
  const knee = 1.1;
  const pEffDown = pCrit + knee * Math.log1p(Math.exp((pRa - pCrit) / knee));
  const qVr = Math.max(0, (pmsf - pEffDown) / rvrEff);
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

  // --- integrate -----------------------------------------------------------
  c.vSa += (qAv - qSys) * dt;
  c.vSv += (qSys - qVr) * dt;
  c.vRa += (qVr - qTv) * dt;
  c.vRv += (qTv - qPv) * dt;
  c.vPa += (qPv - qPul) * dt;
  c.vPv += (qPul - qPulVen) * dt;
  c.vLa += (qPulVen - qMv) * dt;
  c.vLv += (qMv - qAv) * dt;

  // --- expose the instantaneous state --------------------------------------
  c.p = {
    ra: pRa, rv: pRv, la: pLa, lv: pLv, sa: pSa, pa: pPa, pv: pPv,
    pmsf, pCrit, pPeri, ppl, palv, pab, rvrEff, abdZone,
    raTm: pRaTm, rvTm: pRvTm, lvTm: pLvTm, laTm: pLaTm,
    zone3, pvr, vHeart,
  };
  c.q = { vr: qVr, sys: qSys, pul: qPul, tv: qTv, pv: qPv, mv: qMv, av: qAv };
  c.act = { v: actV, a: actA, tn };

  // End-systolic volume of the beat currently in progress. End-diastolic volume
  // is read at the beat boundary itself rather than as a maximum over the
  // window, which would otherwise pair one beat's ESV with the next beat's EDV
  // and smooth away the respiratory variation we are trying to show.
  c.lvEsvRun = Math.min(c.lvEsvRun, c.vLv);
  c.rvEsvRun = Math.min(c.rvEsvRun, c.vRv);
  if (qAv > 0) c.lvEspRun = pLv;
  if (qPv > 0) c.rvEspRun = pRv;

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
export function venousReturnCurve(p, c, mean, nPoints = 90) {
  const pmsf = mean?.pmsf ?? c.p.pmsf;
  const pCrit = mean?.pCrit ?? c.p.pCrit; // follows lung volume, so it moves with the breath
  const pts = [];
  const lo = Math.min(pCrit - 6, -6);
  for (let i = 0; i < nPoints; i++) {
    const pra = lo + ((pmsf + 3 - lo) * i) / (nPoints - 1);
    const q = Math.max(0, (pmsf - Math.max(pra, pCrit)) / c.p.rvrEff);
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
export function cardiacFunctionCurve(p, c, mean, nPoints = 90) {
  // Both terms are cycle-averaged. Sliding this curve along the pressure axis
  // with each breath is the phenomenon the diagram exists to show, and averaging
  // over one cardiac cycle leaves the respiratory swing intact while removing
  // the beat-to-beat ripple that would otherwise jitter the intercept.
  const pExt = (mean?.ppl ?? c.p.ppl) + (mean?.pPeri ?? c.p.pPeri);
  const svRv = Math.max(4, c.svRv ?? c.sv);
  const ea = Math.max(0.02, (c.rvEsp - c.p.ppl) / svRv);
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
