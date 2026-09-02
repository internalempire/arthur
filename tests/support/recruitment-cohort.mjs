import {
  calibrateRecruitmentToInflation, lungComplianceAt,
} from '../../src/model/lung.js';

// One shared mechanical phenotype for both Cappio Borlino groups. Only the
// measured R/I changes. The selected compliance and opening midpoint are close
// to the cohort's low-PEEP lung-compliance and inspiratory-transpulmonary-
// pressure ranges; they are not fitted separately for each group.
export const RECRUITMENT_COHORT_PHENOTYPE = Object.freeze({
  collapsed: 0.30,
  clung: 55,
  lungCapacity: 6,
  ccw: 200,
  cwLoad: 0,
  pOpen: 17,
});

export const RECRUITMENT_COHORT_GROUPS = Object.freeze([
  Object.freeze({
    id: 'low',
    label: 'low recruiters',
    riRatio: 0.35,
    recruitedVolume: Object.freeze([90, 202]),
    lowPeepLungCompliance: Object.freeze([38, 85]),
    highPeepLungCompliance: Object.freeze([23, 51]),
  }),
  Object.freeze({
    id: 'high',
    label: 'high recruiters',
    riRatio: 0.72,
    recruitedVolume: Object.freeze([181, 421]),
    lowPeepLungCompliance: Object.freeze([42, 78]),
    highPeepLungCompliance: Object.freeze([30, 66]),
  }),
]);

const inside = (value, [minimum, maximum]) => value >= minimum && value <= maximum;

export function evaluateRecruitmentCohort() {
  return RECRUITMENT_COHORT_GROUPS.map((group) => {
    const parameters = { ...RECRUITMENT_COHORT_PHENOTYPE, riRatio: group.riRatio };
    const calibration = calibrateRecruitmentToInflation(parameters);
    const resolved = {
      ...parameters,
      openableDiseasedFraction: calibration.openableFraction,
    };
    const lowPeepLungCompliance = lungComplianceAt(
      resolved, calibration.assessment.lowEelv,
    );
    const highPeepLungCompliance = lungComplianceAt(
      resolved, calibration.assessment.highEelv,
    );
    const wholeLungOpenableFraction = parameters.collapsed * calibration.openableFraction;
    const pass = !calibration.limited
      && Math.abs(calibration.achieved - group.riRatio) <= 0.01
      && inside(calibration.assessment.recruitedVolume, group.recruitedVolume)
      && inside(lowPeepLungCompliance, group.lowPeepLungCompliance)
      && inside(highPeepLungCompliance, group.highPeepLungCompliance);
    return {
      ...group,
      pass,
      calibration,
      wholeLungOpenableFraction,
      lowPeepLungCompliance,
      highPeepLungCompliance,
    };
  });
}
