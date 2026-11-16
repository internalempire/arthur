// Primary animal evidence for pulmonary bench experiments; never imported at runtime.
// Values describe the stated preparations, not human reference ranges. Printed SE,
// approximate reported changes and graph-reading error are NOT acceptance tolerances.
// Calibration data cannot also establish independent validation of fitted coefficients.
// Full texts supplied by the clinician and checked on 2026-11-15; no PDF is vendored.

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const HAKIM_1982 = freeze({
  citation: 'Hakim TS, Michel RP, Chang HK. J Appl Physiol 53:1110–1115, 1982.',
  doi: '10.1152/jappl.1982.53.5.1110',
  population: 'Adult dogs, 20–26 kg; perfused left lower lobe; blood at 37 °C.',
  protocol: {
    pages: '1110–1112 (PDF 1–3)',
    pressureUnit: 'mmHg (Torr in the paper)',
    reference: 'Atmosphere; vascular transducers referenced to the top of the lobe.',
    measurement: 'Static inflation; constant inflow; arterial/venous occlusions for 2–4 s.',
    ppi: { n: 11, preparation: 'In situ, open chest', pleuralPressure: 0,
      alveolarPressure: [0, 5, 10, 15, 20], venousPressure: 1.8, venousPressureSe: 0.2,
      flowMlMin: 558, flowSeMlMin: 31 },
    npi: { n: 7, preparation: 'Excised lobe in a box', alveolarPressure: 0,
      pleuralPressure: [0, -5, -10, -15, -20], venousPressure: 1.5, venousPressureSe: 0.4,
      additionalVenousPressures: [-5, 10], flowMlMin: 594, flowSeMlMin: 39 },
  },
  table1: {
    kind: 'printed', source: 'Table 1, p.1112 (PDF 3)', n: 6,
    conditions: { alveolarPressureMmHg: 15, venousPressureMmHg: 1.8,
      venousPressureSeMmHg: 0.1, pleuralPressureMmHg: 0 },
    pressureUnit: 'mmHg', dispersion: 'SE; none printed for the final column',
    // PaPrime is pressure at the distal end of the proximal arterial segment.
    rows: [
      { flowMlMin: 276, flowSeMlMin: 15, total: 18.8, totalSe: 0.8,
        arterial: 4.5, arterialSe: 0.8, venous: 4.6, venousSe: 0.4,
        middle: 10.1, middleSe: 0.9, paPrimeMinusAlveolar: 1.1 },
      { flowMlMin: 536, flowSeMlMin: 32, total: 24.4, totalSe: 1.1,
        arterial: 7.7, arterialSe: 1.2, venous: 7.9, venousSe: 0.6,
        middle: 9.4, middleSe: 1.1, paPrimeMinusAlveolar: 3.5 },
      { flowMlMin: 800, flowSeMlMin: 46, total: 28.7, totalSe: 1.2,
        arterial: 9.6, arterialSe: 1.2, venous: 10.8, venousSe: 0.8,
        middle: 8.8, middleSe: 0.7, paPrimeMinusAlveolar: 5.4 },
    ],
    limits: [
      'Printed segment sums are 19.2, 25.0 and 29.2, not totals 18.8, 24.4 and 28.7; preserve this source inconsistency.',
      'During a waterfall, middle pressure drop / flow is not intrinsic resistance; PaPrime minus alveolar pressure is the upstream effective drive.',
    ],
  },
  figureEstimates: {
    kind: 'graph-estimate', source: 'Figures 2 and 3, p.1112 (PDF 3)',
    method: 'Manual point-centre reading from a 1.8× PDF rendering; linear axis calibration.',
    pressureUnit: 'mmHg', readingError: 0.4,
    uncertaintyMeaning: 'Approximate reading error only; not SE, a confidence interval or validation tolerance.',
    transpulmonaryPressure: [0, 5, 10, 15, 20],
    ppi: { total: [13.15, 14.19, 16.69, 22.50, 30.40],
      arterial: [6.13, 5.89, 5.97, 6.53, 6.29],
      venous: [6.13, 6.37, 6.37, 7.90, 9.60], middle: [1.21, 2.58, 4.27, 8.55, 14.60] },
    npi: { total: [11.86, 9.35, 9.58, 12.17, 14.37],
      arterial: [4.01, 3.46, 3.38, 4.24, 4.79],
      venous: [5.65, 4.87, 4.79, 5.58, 6.20], middle: [2.59, 1.34, 1.34, 2.59, 3.53] },
  },
  intrinsicResistanceChange: {
    kind: 'printed-approximation', source: 'Discussion, p.1114 (PDF 5)',
    fullInflationIncreasePercent: [50, 60],
    definition: 'Sum of segmental resistances using the applicable alveolar/pleural downstream pressure during collapse.',
    limit: 'Not the percentage rise in whole-lung (Pa − Pv) / Q.',
  },
  qualitative: {
    kind: 'qualitative', source: 'Figures 2–5 and Discussion, pp.1112–1114 (PDF 3–5)',
    constraints: [
      'PPI predominantly increases the middle gradient; proximal arterial gradient is nearly unchanged; venous gradient rises mildly at high inflation.',
      'At Pv 1.5 mmHg, NPI gives an initial fall followed by a rise in total and individual segmental gradients.',
      'Raising Pv reduces the total/middle gradients and flattens the U; Pv −5 with Ppl 0 produces large-vein collapse.',
      'Extra-alveolar resistance can rise at high inflation: elongation can outweigh radial expansion.',
    ],
  },
  limits: [
    'The middle occlusion segment includes alveolar vessels AND small distensible extra-alveolar arteries/veins; it is not an isolated capillary measurement.',
    'PPI and NPI use different cohorts/preparations; absolute resistances are not a paired comparison.',
    'Resistance and stored volume cannot be uniquely coupled without specifying changing length/calibre; these experiments do not identify human V0 or compliance.',
  ],
});

export const ROOS_1961 = freeze({
  citation: 'Roos A, Thomas LJ Jr, Nagel EL, Prommas DC. J Appl Physiol 16:77–84, 1961.',
  doi: '10.1152/jappl.1961.16.1.77',
  population: 'Ten dogs, 42–63 lb; open chest; left lung perfused with autologous blood; 372 pressure–flow curves.',
  protocol: {
    pages: '77–82 (PDF 1–6)', pressureUnit: 'cmH2O',
    reference: 'Atmosphere; vascular reservoir heights relative to the left auricle.',
    method: 'Arterial reservoir pressure falls during 30–60 s runs; left atrial, airway and external pressures held constant.',
    VMeaning: 'V is initial left atrial pressure, not volume.', initialLeftAtrialPressureRange: [4.6, 9.0],
    negativeInflation: 'Raise Pa, Pla and Palv equally with Ppl at atmosphere; equivalent to lowering Ppl while the other three pressures remain fixed.',
  },
  inflationResistance: {
    kind: 'printed-approximation', source: 'Text and Figure 7, p.81 (PDF 5)', n: 9,
    conditions: { pressureUnit: 'cmH2O', alveolarPressureFrom: 7, alveolarPressureTo: 23,
      pleuralPressure: 0, arterialMinusLeftAtrialPressure: 15 },
    definition: 'Apparent resistance = (Pa − Pla) / flow.',
    rows: [
      { leftAtrialPressureRelativeToV: -6, approximateResistanceIncreasePercent: 1000 },
      { leftAtrialPressureRelativeToV: 12, approximateResistanceIncreasePercent: 100 },
    ],
    limit: 'Approximate group summaries, not paired raw values or human targets. Visually verified 1000%; OCR can incorrectly read 2000%.',
  },
  qualitative: {
    kind: 'qualitative', source: 'Figures 4–9 and Discussion, pp.79–83 (PDF 3–7)',
    constraints: [
      'At fixed Pla/Palv/Ppl, raising Pa increases flow nonlinearly and reduces apparent resistance.',
      'At fixed Pa, raising Pla can initially leave flow unchanged and subsequently reduce it while apparent resistance still falls.',
      'Raising Pa and Pla together at fixed gradient increases flow, with progressive approach to a distension limit.',
      'PPI above Palv 7 cmH2O consistently raises resistance, more strongly at low vascular pressures.',
      'NPI at fixed atmospheric vascular pressures produces a modest resistance fall followed by a rise; the reported minimum lies near Ppl −10 to −17 cmH2O.',
    ],
  },
  limits: [
    'Table 1 on p.83 synthesizes assumed closed-chest pressures with experimental curves; it is not a direct recording of cyclic cardiac/respiratory behaviour.',
    'No segmental volume/compliance identification or direct PPV validation; pressure references must match before comparison.',
  ],
});

export const PETAK_2009 = freeze({
  citation: 'Peták F et al. J Appl Physiol 106:935–942, 2009.',
  doi: '10.1152/japplphysiol.00831.2007',
  population: 'Eight isolated lungs from male Sprague–Dawley rats, 397–487 g; diluted autologous blood, haematocrit approximately 25%.',
  protocol: {
    pages: '936–937 (PDF 2–3)',
    reference: 'Pa/Pla held relative to atmosphere; reservoirs outside the box; transducers zeroed at the lung hilum.',
    initialArterialPressureMmHg: 15, initialLeftAtrialPressureMmHg: 5,
    transpulmonaryPressureCmH2O: [2.5, 22], inflationDeflationDurationSeconds: 160,
    durationNote: 'Methods specify 160 s; the abstract describes the manoeuvre approximately as 2 min.',
    ppi: 'Ppl atmospheric, airway pressure increased.',
    npi: 'Trachea open to atmosphere, box pressure decreased.',
    flow: 'Allowed to vary; pressure-controlled perfusion, not constant inflow.',
    resistanceDefinition: '(Pa − Pla) / pulmonary flow',
    samplingHz: 50, resistanceMovingAverageSamples: 100,
    nominalCapillaryPressureMmHg: 10,
    capillaryPressureMethod: 'Estimated as Pla + 0.44 × (Pa − Pla), not directly measured; nominal endpoints give 9.4 rather than exactly 10 mmHg.',
  },
  resistanceChange: {
    kind: 'printed', source: 'Abstract, p.935 (PDF 1)', unit: '% change', dispersion: 'SE',
    ppi: { mean: 15, se: 1 }, npi: { mean: -3, se: 0.3 },
    definition: 'Maximum within-mode change in apparent pulmonary vascular resistance during the slow manoeuvre.',
  },
  qualitative: {
    kind: 'qualitative', source: 'Figures 3–5, pp.939–940 (PDF 5–6)',
    constraints: [
      'Similar respiratory mechanics at matched Ptp coexist with different PPI/NPI vascular responses.',
      'PPI resistance is greater during deflation at equal Ptp; this hysteresis is not apparent when expressed against lung volume.',
      'In five additional lungs, raising nominal estimated Pc from 10 to 15 mmHg reduces PPI resistance hysteresis.',
    ],
  },
  limits: [
    'Slow isolated-rat manoeuvres do not identify tidal human effects, segmental resistance, V0 or compliance.',
    'The additional five-lung experiment is a separate cohort with different absolute resistance; do not pool its baseline with the main experiment.',
    'Flow persists near the highest inflation despite nominal Palv approaching/exceeding initial Pa; a uniform hard closure of the entire bed is not established by these measurements.',
    'Authors caution against direct in-vivo extrapolation because vascular pressures are held fixed relative to atmosphere.',
  ],
});

export const BROWER_1985 = freeze({
  citation: 'Brower R et al. J Appl Physiol 58:954–963, 1985.',
  doi: '10.1152/jappl.1985.58.3.954',
  population: 'Eight dogs, 18–21 kg; open chest; isolated pulmonary perfusion at constant inflow.',
  protocol: {
    pages: '954–956 (PDF 1–3)', pressureUnit: 'mmHg',
    reference: 'Atmosphere; vascular measurements referenced to the lung hilum; open-chest pleural pressure atmospheric.',
    independentInputs: 'Left atrial pressure and airway pressure set independently; fixed pump inflow.',
    flowSetting: 'Initially adjust inflow for Ppa 10–12 mmHg with Pla below 4 mmHg; retain that inflow during manoeuvres.',
    seriesA: { n: 4, leftAtrialPressures: [0, 4, 8, 12, 16],
      peep: [4, 8, 12, 16], transpulmonaryPressureIncrement: 10 },
    seriesB: { n: 4, leftAtrialPressures: [4, 8, 12],
      peep: [4, 8, 12], transpulmonaryPressureIncrements: [8, 12, 16] },
    bloodVolumeChange: 'Integrate the transient imbalance between constant inflow and measured pulmonary venous outflow, from steady expiration to steady inspiration.',
    zoneCharacteristic: {
      symbol: 'ZC', definition: 'Steady ΔPpa / ΔPla at fixed inflow and Palv.',
      leftAtrialPerturbations: [-5, 5],
      withinPhase: 'Average the ratios from raising and lowering Pla by 5 mmHg.',
      acrossPhases: 'ZCbar = (ZCexpiration + ZCinspiration) / 2.',
      limit: 'Functional conductance-weighted estimate, not a directly imaged anatomical fraction or an instantaneous venous–alveolar pressure clamp.',
    },
  },
  table5: {
    kind: 'printed-regression', source: 'Table 5, p.958 (PDF 5); equation 3, p.957 (PDF 4)',
    n: 8, unit: 'mL/mmHg', dispersion: 'Mean coefficient ± SE across eight experiments',
    b1: { mean: -4.60, se: 0.70 }, b2: { mean: 1.00, se: 0.21 },
    regression: 'ΔLBV = b1 × ΔPtp × ZCbar + b2 × ΔPtp',
    sign: 'Positive ΔLBV means blood retained in the lung; negative means expelled.',
    interpretation: {
      source: 'Appendix C, equation 41, p.962 (PDF 9)',
      b1: '−(Calveolar + CarterialExtraAlveolar)',
      b2: 'CarterialExtraAlveolar + k × (CarterialExtraAlveolar + CvenousExtraAlveolar)',
      k: 'Dimensionless interdependence coefficient relating external extra-alveolar pressure to Ptp.',
    },
    limits: [
      'Identifies combinations of compliances and interdependence, not each coefficient separately.',
      'Fitting these coefficients uses calibration evidence; reproducing the same coefficients is not independent validation.',
      'The regression describes completed inflation changes with measured phase-averaged ZC, not an instantaneous capacity or pressure law.',
      'Absolute canine mL/mmHg coefficients and SE must not become human compliance targets or acceptance bands.',
    ],
  },
});

export const PULMONARY_EVIDENCE = freeze({
  hakim1982: HAKIM_1982,
  roos1961: ROOS_1961,
  petak2009: PETAK_2009,
  brower1985: BROWER_1985,
});
