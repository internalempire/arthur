// Presets. Each one is a partial override of the defaults plus the question it
// is meant to make answerable — the note is the reason the preset exists.

export const SCENARIOS = [
  {
    id: 'healthy-spont',
    name: 'Healthy, breathing spontaneously',
    note: 'Watch central venous pressure fall during inspiration while venous inflow rises modestly. The measured pressure drops, but transmural pressure — the pressure that distends the atrium — rises. Post-inspiratory muscle activity then brakes early expiration rather than disappearing at the neural switch.',
    // A physiological resting effort gives a roughly 420 mL spontaneous tidal
    // volume. Moderate filling and low-normal RV elastance place the resting
    // circulation beyond the model's steep preload limb while retaining normal
    // output, RV ejection fraction and systemic/pulmonary pressures.
    params: {
      mode: 'spont', pmus: 6, peep: 0, rr: 14,
      stressedVolume: 850, svr: 0.9, eesRv: 0.35,
    },
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
    note: 'Raise PEEP and follow two things at once: the model RV-function curve sliding right on the Guyton diagram, and the operating point climbing the J-curve. Mean systemic filling pressure rises too — the abdomen defends the gradient.',
    params: { mode: 'vcv', pmus: 0, vt: 450, peep: 14, rr: 14 },
  },
  {
    id: 'septic-responder',
    name: 'Septic shock, fluid responsive',
    note: 'Low stressed volume, vasodilated, and compensating hard — the aggregate baroreflex raises the rate from its selected 105 to about 122 and holds mean pressure near 82, which is the trap. The pressure looks survivable while the operating point remains on the steep part of the model RV-function curve and fluid still raises output. Increase stressed volume and watch that reserve fall as output climbs. Then turn the baroreflex off and see the same circulation without compensation.',
    params: {
      mode: 'vcv', pmus: 0, vt: 560, peep: 8, rr: 18, ccw: 150,
      stressedVolume: 330, svr: 0.85, hr: 105, baroreflexEnabled: true,
    },
  },
  {
    id: 'swing-limited-reserve',
    name: 'Large pleural swings, limited preload reserve',
    // Spontaneous effort makes PPV uninterpretable, so this preset teaches from
    // the Guyton operating point instead. Keeping that distinction in the
    // scenario itself prevents a hidden waveform number from becoming a
    // surrogate fluid-responsiveness test.
    note: 'The same patient after resuscitation, now making vigorous efforts against a relatively stiff chest wall. Pleural pressure swings by about 20 cmH₂O, but the operating point has limited local preload reserve: pressure swing and fluid responsiveness are not the same quantity. PPV is deliberately unavailable because the patient is breathing spontaneously; inspect the Guyton construction instead.',
    params: {
      mode: 'spont', pmus: 30, peep: 6, rr: 24, ccw: 150,
      // The respiratory-mean Guyton construction requires slightly fuller
      // systemic veins than the former phase-selected beat calculation to sit
      // beyond the steep limb. A lower resting rate keeps output and pressure
      // in a compensated teaching range rather than creating a hyperdynamic
      // artefact from that extra filling.
      stressedVolume: 1200, svr: 0.75, hr: 70,
    },
  },
  {
    id: 'ards-rv',
    name: 'ARDS with right ventricular failure',
    note: 'A collapsed, stiff lung and a failing right ventricle, with a high-recruiter R/I phenotype. The RV dilates, the septum bows left and the left ventricle cannot fill. Try adding volume, then taking PEEP away, then turning the patient prone. Then set R/I to zero — the same amount of collapsed lung, now consolidated rather than reopenable — and run the PEEP titration again. It goes the other way, and nothing else about the patient has changed.',
    params: {
      mode: 'vcv', pmus: 0, vt: 350, peep: 12, rr: 24,
      collapsed: 0.42, clung: 40, eesRv: 0.28, pvrBase: 0.17, hpv: 1.6,
      // With an independent chest wall this lung begins at a higher
      // transpulmonary pressure than the former fixed-reference construction.
      // The opening distribution is therefore centred slightly higher so the
      // selected bedside R/I remains attainable without inventing recruitable
      // lung beyond the collapsed compartment.
      riRatio: 0.7, pOpen: 21,
    },
  },
  {
    id: 'pulmonary-embolism',
    name: 'Acute pulmonary embolism',
    note: 'Normal lungs, high aggregate pulmonary vascular load — the mirror image of the ARDS case. The raised PVR coefficient represents the effective bedside load without separating clot obstruction, critical closing pressure, calibre or viscosity. Central venous pressure is high while the wedge is low, the right ventricle is twice the size of the left, and the septum is holding the left ventricle shut. The selected tachycardia, systemic resistance and filling describe an already compensated phenotype: the model baroreflex senses only systemic MAP, not PVR or mPAP directly. Switch to volume control, then raise PEEP, and watch what intubating this patient costs.',
    params: {
      mode: 'spont', pmus: 6, peep: 0, rr: 24,
      pvrBase: 0.44, eesRv: 0.32, stressedVolume: 1050, svr: 1.25, hr: 118,
    },
  },
  {
    id: 'cardiac-tamponade',
    name: 'Cardiac tamponade',
    note: 'A pressurised pericardial space makes all four chambers compete for a nearly fixed total volume, limiting the lower-pressure right heart most. Increase pericardial capacity to simulate decompression: pericardial pressure and CVP fall while ventricular filling, output and arterial pressure recover. Capacity is a model surrogate for available space, not a measured effusion volume. The respiratory arterial variation is directional; the preset is not a calibrated pulsus-paradoxus test.',
    params: {
      mode: 'spont', pmus: 10, peep: 0, rr: 20,
      pericardium: 4, pericardialCapacity: 100,
      stressedVolume: 1050, hr: 105,
    },
  },
  {
    id: 'lv-failure',
    name: 'Cardiogenic pulmonary oedema',
    note: 'Severe, afterload-sensitive left ventricular failure with high filling pressure. Set PEEP to zero, let the model settle, then return it to 10: pleural pressure rises, the transmural pressure the LV must eject against falls, end-systolic volume falls more than end-diastolic volume, and cardiac output rises. This deliberately afterload-dominant phenotype demonstrates a possible response to positive pressure, not a universal response in cardiogenic pulmonary oedema.',
    params: {
      mode: 'vcv', pmus: 0, vt: 450, peep: 10, rr: 18,
      eesLv: 0.6, lvStiff: 0.040, stressedVolume: 1050, svr: 1.25, hr: 95,
      // A stiff thoracic envelope transmits enough airway pressure to make LV
      // afterload relief exceed the simultaneous loss of venous return. This is
      // part of the selected teaching phenotype, not a property of pulmonary
      // oedema in every patient, and the scenario note says so explicitly.
      ccw: 75,
    },
  },
  {
    id: 'obesity',
    name: 'Stiff chest wall',
    note: 'Obesity or a tense abdomen combines two different lesions: the thoracic envelope is less compliant, and its relaxed pressure–volume curve is shifted by an external load. The first makes the pleural-pressure swing larger for the same tidal volume; the second raises the pressure around the heart even before the breath. Their haemodynamic effects emerge together here, but the two controls remain separate.',
    params: {
      mode: 'vcv', pmus: 0, vt: 500, peep: 8, rr: 16,
      ccw: 75, cwLoad: 6, pab0: 12,
    },
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
    note: 'Raised abdominal pressure does opposing things: it mobilises venous blood and raises mean systemic filling pressure, but also raises the pressure at which the vena cava closes and loads the relaxed chest wall through the diaphragm. Which effect dominates depends on filling. The pressure transmitted to the thorax is a selected aggregate load, not a fixed anatomical fraction of abdominal pressure.',
    params: {
      mode: 'vcv', pmus: 0, vt: 450, peep: 8, rr: 16,
      pab0: 22, abdCoupling: 6, cwLoad: 6,
    },
  },
];

export const SCENARIO_BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));
