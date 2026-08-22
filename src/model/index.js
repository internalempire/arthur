// Public browser-facing API for the physiological model.
//
// `main.js` and the UI import the model only through this module. The selective
// exports are a compatibility boundary: internal files can be split or moved
// during structural work without coupling every visualisation to that layout.
// Domain tests may still import internals when they need to verify a mechanism
// directly. This is a plain ES module; it adds no runtime dependency or build
// step.

export { Simulator, TRACE_SECONDS } from './simulator.js';
export { SCENARIOS, SCENARIO_BY_ID } from './scenarios.js';
export { PARAMETERS, GROUPS } from './parameters.js';

// Read-only analyses used to draw the model's physiological constructions.
export {
  venousReturnCurve, cardiacFunctionCurve, curveIntersection, preloadLimbs,
  CHAMBER, pericardialPressure, IVC,
} from './circulation.js';
export {
  lungVolumeAtPl, relaxationVolume, openBand, stepOpenFraction,
  recruitmentBand, stepRecruitedFraction, openFractionFromRecruitmentState,
  pvrComponents, lungRegions, chestWallPressure, chestWallComplianceAt,
  chestWallNeutralVolume, staticEndExpiratoryVolume,
} from './lung.js';
export { PPL_FRC, EXPIRATORY_FLOW_LIMIT, respiratorySystemCompliance } from './respiratory.js';

// Unit conversion and small numerical helpers shared by model-bound drawings.
export { cmH2OtoMmHg, RESISTANCE_TO_WOOD, clamp } from './units.js';
