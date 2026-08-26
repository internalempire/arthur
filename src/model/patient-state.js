import { PARAMETERS, PARAM_BY_ID, defaultParams } from './parameters.js';

// A patient-state file is deliberately a parameter prescription, not a memory
// dump of the integrator. Replaying pressures, chamber volumes or respiratory
// phase would preserve a transient numerical accident rather than recreate the
// same physiological experiment from a settled starting point.
export const PATIENT_STATE_FORMAT = 'arthur-patient-state';
export const PATIENT_STATE_VERSION = 1;

const isRecord = (value) => value !== null
  && typeof value === 'object'
  && !Array.isArray(value);

function validParameterValue(spec, value) {
  if (spec.type === 'choice') {
    return spec.options.some((option) => Object.is(option.value, value));
  }
  if (spec.type === 'checkbox') return typeof value === 'boolean';
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= spec.min
    && value <= spec.max;
}

/** Return only the settings that distinguish this patient from the defaults. */
export function patientParameterOverrides(params) {
  const defaults = defaultParams();
  const overrides = {};
  for (const spec of PARAMETERS) {
    if (!Object.is(params[spec.id], defaults[spec.id])) {
      overrides[spec.id] = params[spec.id];
    }
  }
  return overrides;
}

/** Build the portable, versioned JSON representation used by Save patient. */
export function createPatientState(params, savedAt = new Date().toISOString()) {
  const parameters = {};
  for (const spec of PARAMETERS) parameters[spec.id] = params[spec.id];
  return {
    format: PATIENT_STATE_FORMAT,
    version: PATIENT_STATE_VERSION,
    savedAt,
    // Store the complete vector so a later change in application defaults
    // cannot silently change an old debugging case. `modified` is descriptive
    // metadata for people reading the file; loading trusts the validated vector.
    parameters,
    modified: Object.keys(patientParameterOverrides(params)),
  };
}

/**
 * Validate an imported state before it is allowed to change the simulator.
 * Unknown settings are reported and ignored so an older file remains usable
 * after a parameter is retired. Known but invalid values fail loudly: silently
 * clipping one would make a debugging case look reproduced when it is not.
 */
export function parsePatientState(candidate) {
  if (!isRecord(candidate)) throw new Error('The file does not contain a patient state.');
  if (candidate.format !== PATIENT_STATE_FORMAT) {
    throw new Error('This is not an arthur patient-state file.');
  }
  if (candidate.version !== PATIENT_STATE_VERSION) {
    throw new Error(`Patient-state version ${candidate.version ?? 'missing'} is not supported.`);
  }
  if (!isRecord(candidate.parameters)) {
    throw new Error('The patient-state file has no valid parameter set.');
  }

  const parameterValues = {};
  const ignored = [];
  for (const [id, value] of Object.entries(candidate.parameters)) {
    const spec = PARAM_BY_ID.get(id);
    if (!spec) {
      ignored.push(id);
      continue;
    }
    if (!validParameterValue(spec, value)) {
      throw new Error(`The saved value for “${spec.label}” is outside the available control range.`);
    }
    parameterValues[id] = value;
  }

  const params = { ...defaultParams(), ...parameterValues };

  return {
    params,
    overrides: patientParameterOverrides(params),
    ignored,
  };
}
