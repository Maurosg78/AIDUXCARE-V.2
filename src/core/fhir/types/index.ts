// @ts-nocheck
/**
 * @fileoverview FHIR Types Index - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

// Export all FHIR types
export type {
  FhirResource,
  FhirPatient,
  PatientValidationResult,
  PatientMapping
} from './fhirPatient';

export type {
  FhirEncounter,
  EncounterValidationResult,
  EncounterMapping
} from './fhirEncounter';

export type {
  FhirObservation,
  VitalSignsObservation,
  ObservationValidationResult,
  ObservationMapping
} from './fhirObservation';

// Export constants
export { VITAL_SIGNS_CODES } from './fhirObservation';

// Common FHIR constants
export const FHIR_CONSTANTS = {
  VERSION: 'R4',
  PROFILES: {
    CA_CORE: 'http://hl7.org/fhir/StructureDefinition/ca-core-patient',
    US_CORE: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'
  },
  SYSTEMS: {
    LOINC: 'http://loinc.org',
    SNOMED: 'http://snomed.info/sct',
    ICD10: 'http://hl7.org/fhir/sid/icd-10',
    ICD11: 'http://hl7.org/fhir/sid/icd-11'
  }
} as const;
