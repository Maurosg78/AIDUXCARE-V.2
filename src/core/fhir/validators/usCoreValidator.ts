/**
 * @fileoverview US Core Validator - Lightweight Implementation
 * @version 2.0.0
 * @author AiDuxCare Development Team
 * @compliance US Core Implementation Guide
 */

import type { 
  FhirPatient, 
  FhirEncounter, 
  FhirObservation
} from '../types';

// US Core specific validation rules
const US_CORE_RULES = {
  PATIENT: {
    REQUIRED_FIELDS: ['name', 'gender'],
    REQUIRED_IDENTIFIERS: ['ssn'],
    SUPPORTED_GENDERS: ['male', 'female', 'other', 'unknown'],
    SUPPORTED_ADDRESS_COUNTRIES: ['US', 'USA', 'United States']
  },
  ENCOUNTER: {
    REQUIRED_FIELDS: ['status', 'class', 'subject'],
    REQUIRED_STATUS: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown']
  },
  OBSERVATION: {
    REQUIRED_FIELDS: ['status', 'code', 'subject'],
    REQUIRED_STATUS: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
    VITAL_SIGNS_CATEGORY: 'vital-signs'
  }
} as const;

// Validation result types according to contract
export type PatientValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; code: string; message: string }>;
  profile: 'CA_CORE' | 'US_CORE';
};

export type EncounterValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; code: string; message: string }>;
  profile: 'CA_CORE' | 'US_CORE';
};

export type ObservationValidationResult = {
  valid: boolean;
  errors: Array<{ path: string; code: string; message: string }>;
  profile: 'CA_CORE' | 'US_CORE';
};

/**
 * Validates FHIR Patient resource against US Core requirements
 */
export function validateUsCorePatient(
  patient: FhirPatient
): PatientValidationResult {
  const errors: Array<{ path: string; code: string; message: string }> = [];

  // Check resource type
  if (patient.resourceType !== 'Patient') {
    errors.push({
      path: 'resourceType',
      code: 'INVALID_RESOURCE_TYPE',
      message: 'Resource must be of type Patient'
    });
  }

  // Check required fields
  if (!patient.name || patient.name.length === 0) {
    errors.push({
      path: 'name',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires at least one name'
    });
  } else {
    // Validate name structure
    patient.name.forEach((name, index) => {
      if (!name.family && !name.given) {
        errors.push({
          path: `name[${index}]`,
          code: 'INVALID_NAME_STRUCTURE',
          message: 'Name must have either family or given name'
        });
      }
    });
  }

  if (!patient.gender) {
    errors.push({
      path: 'gender',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires gender field'
    });
  } else if (!US_CORE_RULES.PATIENT.SUPPORTED_GENDERS.includes(patient.gender)) {
    errors.push({
      path: 'gender',
      code: 'INVALID_GENDER_VALUE',
      message: `US Core supports only: ${US_CORE_RULES.PATIENT.SUPPORTED_GENDERS.join(', ')}`
    });
  }

  // Check identifiers
  if (patient.identifier && patient.identifier.length > 0) {
    patient.identifier.forEach((id, index) => {
      if (!id.system || !id.value) {
        errors.push({
          path: `identifier[${index}]`,
          code: 'INVALID_IDENTIFIER',
          message: 'Identifier must have system and value'
        });
      }
    });
  }

  // Check address country
  if (patient.address && patient.address.length > 0) {
    patient.address.forEach((addr, index) => {
      if (addr.country && !US_CORE_RULES.PATIENT.SUPPORTED_ADDRESS_COUNTRIES.includes(addr.country)) {
        errors.push({
          path: `address[${index}].country`,
          code: 'INVALID_ADDRESS_COUNTRY',
          message: 'US Core recommends US address format (US, USA, or United States)'
        });
      }
    });
  }

  // Check telecom structure
  if (patient.telecom) {
    patient.telecom.forEach((contact, index) => {
      if (!contact.system || !contact.value) {
        errors.push({
          path: `telecom[${index}]`,
          code: 'INVALID_TELECOM',
          message: 'Telecom must have system and value'
        });
      }
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    profile: 'US_CORE'
  };
}

/**
 * Validates FHIR Encounter resource against US Core requirements
 */
export function validateUsCoreEncounter(
  encounter: FhirEncounter
): EncounterValidationResult {
  const errors: Array<{ path: string; code: string; message: string }> = [];

  // Check resource type
  if (encounter.resourceType !== 'Encounter') {
    errors.push({
      path: 'resourceType',
      code: 'INVALID_RESOURCE_TYPE',
      message: 'Resource must be of type Encounter'
    });
  }

  // Check required fields
  if (!encounter.status) {
    errors.push({
      path: 'status',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires status field'
    });
  } else if (!US_CORE_RULES.ENCOUNTER.REQUIRED_STATUS.includes(encounter.status)) {
    errors.push({
      path: 'status',
      code: 'INVALID_STATUS_VALUE',
      message: `US Core supports only: ${US_CORE_RULES.ENCOUNTER.REQUIRED_STATUS.join(', ')}`
    });
  }

  if (!encounter.class) {
    errors.push({
      path: 'class',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires class field'
    });
  } else if (!encounter.class.code) {
    errors.push({
      path: 'class.code',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires class.code field'
    });
  } else if (!['EMER', 'IMP', 'AMB', 'VR', 'HH'].includes(encounter.class.code)) {
    errors.push({
      path: 'class.code',
      code: 'INVALID_ENCOUNTER_CLASS',
      message: 'US Core supports only encounter classes: EMER, IMP, AMB, VR, HH'
    });
  }

  if (!encounter.subject) {
    errors.push({
      path: 'subject',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires subject field'
    });
  } else if (!encounter.subject.reference.startsWith('Patient/') && !encounter.subject.reference.startsWith('urn:uuid:')) {
    errors.push({
      path: 'subject.reference',
      code: 'INVALID_SUBJECT_REFERENCE',
      message: 'Subject reference must be in format Patient/{id} or urn:uuid:'
    });
  }

  // Check period
  if (encounter.period && !encounter.period.start) {
    errors.push({
      path: 'period.start',
      code: 'MISSING_PERIOD_START',
      message: 'Period must have start date if provided'
    });
  }

  // Validate participant structure if present
  if (encounter.participant) {
    encounter.participant.forEach((participant, index) => {
      if (participant.individual && !participant.individual.reference.startsWith('Practitioner/') && !participant.individual.reference.startsWith('urn:uuid:')) {
        errors.push({
          path: `participant[${index}].individual.reference`,
          code: 'INVALID_PARTICIPANT_REFERENCE',
          message: 'Participant individual reference should be in format Practitioner/{id} or urn:uuid:'
        });
      }
    });
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    profile: 'US_CORE'
  };
}

/**
 * Validates FHIR Observation resource against US Core requirements
 */
export function validateUsCoreObservation(
  observation: FhirObservation
): ObservationValidationResult {
  const errors: Array<{ path: string; code: string; message: string }> = [];

  // Check resource type
  if (observation.resourceType !== 'Observation') {
    errors.push({
      path: 'resourceType',
      code: 'INVALID_RESOURCE_TYPE',
      message: 'Resource must be of type Observation'
    });
  }

  // Check required fields
  if (!observation.status) {
    errors.push({
      path: 'status',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires status field'
    });
  } else if (!US_CORE_RULES.OBSERVATION.REQUIRED_STATUS.includes(observation.status)) {
    errors.push({
      path: 'status',
      code: 'INVALID_STATUS_VALUE',
      message: `US Core supports only: ${US_CORE_RULES.OBSERVATION.REQUIRED_STATUS.join(', ')}`
    });
  }

  if (!observation.code) {
    errors.push({
      path: 'code',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires code field'
    });
  }

  if (!observation.subject) {
    errors.push({
      path: 'subject',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'US Core requires subject field'
    });
  } else if (!observation.subject.reference.startsWith('Patient/') && !observation.subject.reference.startsWith('urn:uuid:')) {
    errors.push({
      path: 'subject.reference',
      code: 'INVALID_SUBJECT_REFERENCE',
      message: 'Subject reference must be in format Patient/{id} or urn:uuid:'
    });
  }

  // Validate value structure
  const hasValue = observation.valueQuantity || observation.valueString !== undefined || 
                   observation.valueBoolean !== undefined || observation.valueInteger !== undefined ||
                   observation.valueCodeableConcept || observation.valueRange;
  
  if (!hasValue) {
    errors.push({
      path: 'value',
      code: 'MISSING_VALUE',
      message: 'US Core requires including a value for the observation'
    });
  }

  // Validate code structure
  if (observation.code && (!observation.code.coding || observation.code.coding.length === 0)) {
    errors.push({
      path: 'code.coding',
      code: 'MISSING_CODING',
      message: 'US Core requires including coding in code field'
    });
  }

  // Check if it's a vital signs observation
  if (observation.category && observation.category.length > 0) {
    const isVitalSigns = observation.category.some(cat => 
      cat.coding && cat.coding.some(coding => 
        coding.code === US_CORE_RULES.OBSERVATION.VITAL_SIGNS_CATEGORY
      )
    );
    
    if (isVitalSigns && (!observation.code.coding || observation.code.coding.length === 0)) {
      errors.push({
        path: 'code.coding',
        code: 'MISSING_LOINC_CODING',
        message: 'US Core requires LOINC coding for vital signs observations'
      });
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    profile: 'US_CORE'
  };
}

/**
 * Validates a bundle of FHIR resources against US Core requirements
 */
export function validateUsCoreBundle(
  resources: {
    patient?: FhirPatient;
    encounter?: FhirEncounter;
    observations?: FhirObservation[];
  }
): {
  overallValid: boolean;
  patientValidation?: PatientValidationResult;
  encounterValidation?: EncounterValidationResult;
  observationValidations?: ObservationValidationResult[];
  summary: {
    totalResources: number;
    validResources: number;
    errors: Array<{ path: string; code: string; message: string }>;
  };
} {
  const allErrors: Array<{ path: string; code: string; message: string }> = [];
  let totalResources = 0;
  let validResources = 0;

  // Validate patient
  let patientValidation: PatientValidationResult | undefined;
  if (resources.patient) {
    totalResources++;
    patientValidation = validateUsCorePatient(resources.patient);
    if (patientValidation.valid) validResources++;
    allErrors.push(...patientValidation.errors);
  }

  // Validate encounter
  let encounterValidation: EncounterValidationResult | undefined;
  if (resources.encounter) {
    totalResources++;
    encounterValidation = validateUsCoreEncounter(resources.encounter);
    if (encounterValidation.valid) validResources++;
    allErrors.push(...encounterValidation.errors);
  }

  // Validate observations
  let observationValidations: ObservationValidationResult[] | undefined;
  if (resources.observations && resources.observations.length > 0) {
    observationValidations = resources.observations.map(obs => {
      totalResources++;
      const validation = validateUsCoreObservation(obs);
      if (validation.valid) validResources++;
      allErrors.push(...validation.errors);
      return validation;
    });
  }

  const overallValid = allErrors.length === 0;

  return {
    overallValid,
    patientValidation,
    encounterValidation,
    observationValidations,
    summary: {
      totalResources,
      validResources,
      errors: allErrors
    }
  };
}
