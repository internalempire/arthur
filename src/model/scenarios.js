// Presets. Each one is a partial override of the defaults plus the question it
// is meant to make answerable — the note is the reason the preset exists.

export const SCENARIOS = [
  {
    id: 'healthy-spont',
    name: 'Healthy, breathing spontaneously',
    note: 'Watch the central venous pressure fall during inspiration while cardiac output rises. The measured pressure drops; the transmural pressure — the one the atrium feels — goes up.',
    params: { mode: 'spont', pmus: 8, peep: 0, rr: 14 },
  },
  {
    id: 'healthy-vcv',
    name: 'Healthy, passive volume control',
    note: 'The same lungs, the opposite pressure sign. Right atrial pressure now rises with each breath and cardiac output falls, because pleural pressure lifts the heart but not the venous reservoir.',
    params: { mode: 'vcv', pmus: 0, vt: 450, peep: 5, rr: 14 },
  },
  {
    id: 'peep-escalation',
    name: 'PEEP escalation',
    note: 'Raise PEEP and follow two things at once: the cardiac function curve sliding right on the Guyton diagram, and the operating point climbing the J-curve. Mean systemic filling pressure rises too — the abdomen defends the gradient.',
    params: { mode: 'vcv', pmus: 0, vt: 450, peep: 14, rr: 14 },
  },
  {
    id: 'septic-responder',
    name: 'Septic shock, fluid responsive',
    note: 'Low stressed volume, vasodilated, and compensating hard — the aggregate baroreflex raises the rate from its selected 105 to about 122 and holds mean pressure near 82, which is the trap. The pressure looks survivable while the operating point remains on the steep part of the cardiac-function curve and fluid still raises output. Increase stressed volume and watch that reserve fall as output climbs. Then set baroreflex sensitivity to zero and see the same circulation without compensation.',
    params: {
      mode: 'vcv', pmus: 0, vt: 560, peep: 8, rr: 18, ccw: 150,
      stressedVolume: 330, svr: 0.85, hr: 105,
    },
  },
  {
    id: 'swing-no-variation',
    name: 'Big pleural swings, no variation',
    note: 'The same patient after resuscitation, now making vigorous efforts against a stiff chest wall. Pleural pressure swings by more than 20 cmH₂O and pulse pressure variation still sits near 4%: a swing in pleural pressure is necessary for variation, but it is the flat part of the Starling curve that decides whether any of it reaches the stroke volume.',
    params: {
      mode: 'spont', pmus: 22, peep: 6, rr: 24, ccw: 100,
      stressedVolume: 950, svr: 0.75, hr: 100,
    },
  },
  {
    id: 'ards-rv',
    name: 'ARDS with right ventricular failure',
    note: 'A collapsed, stiff lung and a failing right ventricle, with a high-recruiter R/I phenotype. The RV dilates, the septum bows left and the left ventricle cannot fill. Try adding volume, then taking PEEP away, then turning the patient prone. Then set R/I to zero — the same amount of collapsed lung, now consolidated rather than reopenable — and run the PEEP titration again. It goes the other way, and nothing else about the patient has changed.',
    params: {
      mode: 'vcv', pmus: 0, vt: 350, peep: 12, rr: 24,
      collapsed: 0.42, clung: 40, eesRv: 0.28, pvrBase: 0.17, hpv: 1.6,
      riRatio: 0.7, pOpen: 18,
    },
  },
  {
    id: 'pulmonary-embolism',
    name: 'Acute pulmonary embolism',
    note: 'Normal lungs, obstructed circulation — the mirror image of the ARDS case. Central venous pressure is high while the wedge is low, the right ventricle is twice the size of the left, and the septum is holding the left ventricle shut. Nothing here is wrong with the lung, so it is compliant and every cmH₂O of airway pressure reaches the pleural space. Switch to volume control, then raise PEEP, and watch what intubating this patient costs.',
    params: {
      mode: 'spont', pmus: 6, peep: 0, rr: 24,
      pvrBase: 0.44, eesRv: 0.32, stressedVolume: 1050, svr: 1.25, hr: 118,
    },
  },
  {
    id: 'lv-failure',
    name: 'Cardiogenic pulmonary oedema',
    note: 'A dilated, hypervolaemic left ventricle. Positive pressure now helps: it lowers left ventricular transmural pressure and unloads ejection. Compare how much cardiac output this heart loses to PEEP against how much a normal heart loses.',
    params: {
      mode: 'vcv', pmus: 0, vt: 450, peep: 10, rr: 18,
      eesLv: 1.2, lvStiff: 0.034, stressedVolume: 1050, svr: 1.25, hr: 95,
    },
  },
  {
    id: 'weaning',
    name: 'Weaning the failing left ventricle',
    note: 'The same failing ventricle, now breathing on its own. Negative pleural pressure raises left ventricular afterload and venous return at the same time — the physiology behind weaning-induced pulmonary oedema.',
    params: {
      mode: 'spont', pmus: 10, peep: 0, rr: 26,
      eesLv: 1.2, lvStiff: 0.034, stressedVolume: 1050, svr: 1.25, hr: 110,
    },
  },
  {
    id: 'obesity',
    name: 'Stiff chest wall',
    note: 'Obesity or a tense abdomen. A larger share of every breath goes into pleural pressure, so the haemodynamic cost of the same tidal volume goes up — and so does pulse pressure variation, whether or not the patient is dry.',
    params: { mode: 'vcv', pmus: 0, vt: 500, peep: 8, rr: 16, ccw: 75, pab0: 12 },
  },
  {
    id: 'copd',
    name: 'COPD with dynamic hyperinflation',
    note: 'Lost recoil raises the resting volume; high resistance, expiratory flow limitation and too little expiratory time trap additional gas above it. The resulting intrinsic PEEP raises measured CVP while cardiac output falls. Slow the rate or shorten inspiration to let the lung empty, then raise external PEEP: below the expiratory choke it adds little, but above it becomes true back-pressure and costs output.',
    params: {
      mode: 'vcv', pmus: 0, vt: 500, peep: 5, rr: 26, ti: 0.9,
      raw: 24, clung: 300, efl: 'on',
    },
  },
  {
    id: 'iah',
    name: 'Intra-abdominal hypertension',
    note: 'Raised abdominal pressure does two opposite things: it raises mean systemic filling pressure, and it raises the pressure at which the vena cava closes. Which one wins depends on how full the patient is.',
    params: { mode: 'vcv', pmus: 0, vt: 450, peep: 8, rr: 16, pab0: 22, abdCoupling: 6 },
  },
];

export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
