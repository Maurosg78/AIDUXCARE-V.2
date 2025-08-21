/**
 * @fileoverview Internal to FHIR Adapter - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

import type { 
  FhirPatient, 
  FhirEncounter, 
  FhirObservation
  // VITAL_SIGNS_CODES 
} from '../types';
import type { FhirBundle } from '../types/fhirBundle';
import type { ClinicalDataBundle } from '../types/fhirBundle';
import type { 
  ClinicalAnalysisResult
  // ClinicalSymptom,
  // ClinicalSign,
  // FunctionalAssessment 
} from '../../../types/clinical-analysis';
import { createClinicalDataBundle } from '../utils/bundleUtils';
import { generateFhirReference } from '../utils/uuidUtils';

// Internal patient structure (simplified for demo)
export interface InternalPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string; // Cambiado de postalCode a zipCode para coincidir con tests
    country: string;
  };
  medicalRecordNumber?: string;
  insuranceNumber?: string;
  ssn?: string; // Agregado para coincidir con tests
  isActive?: boolean; // Agregado para coincidir con tests
}

// Internal encounter structure
export interface InternalEncounter {
  id: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  type: 'ambulatory' | 'emergency' | 'inpatient' | 'outpatient' | 'initial' | 'follow_up' | 'discharge'; // Agregados tipos esperados por tests
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'finished'; // Agregado 'finished' para tests
  reason: string;
  providerId: string;
  location?: string;
}

// Internal observation structure
export interface InternalObservation {
  id: string;
  patientId: string;
  encounterId?: string;
  type: 'vital_signs' | 'functional_assessment' | 'clinical_finding' | 'text'; // Agregado 'text' para tests
  value?: number | string | boolean;
  unit?: string;
  date: string;
  category: string;
  code?: string;
  bodySite?: string;
  // Campos adicionales para tests
  codeSystem?: string;
  displayName?: string;
  status?: string;
  effectiveDate?: string;
  textValue?: string; // Para observaciones de texto
}

/**
 * Converts internal patient data to FHIR Patient resource
 */
export function convertPatientToFhir(
  internalPatient: InternalPatient,
  options: {
    profile?: 'ca-core' | 'us-core';
    includeMeta?: boolean;
  } = {}
): FhirPatient {
  const { profile = 'us-core', includeMeta = true } = options;
  
  const fhirPatient: FhirPatient = {
    resourceType: 'Patient',
    id: internalPatient.id,
    active: true,
    name: [{
      use: 'official',
      family: internalPatient.lastName,
      given: [internalPatient.firstName]
    }],
    gender: internalPatient.gender,
    birthDate: internalPatient.dateOfBirth
  };

  // Add meta information if requested
  if (includeMeta) {
    fhirPatient.meta = {
      profile: profile === 'ca-core' 
        ? ['http://hl7.org/fhir/StructureDefinition/ca-core-patient']
        : ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'],
      lastUpdated: new Date().toISOString()
    };
  }

  // Add identifiers
  const identifiers: Array<{
    use: 'official' | 'secondary';
    system: string;
    value: string;
  }> = [];
  if (internalPatient.medicalRecordNumber) {
    identifiers.push({
      use: 'official' as const,
      system: 'http://hl7.org/fhir/sid/us-mrn',
      value: internalPatient.medicalRecordNumber
    });
  }
  if (internalPatient.insuranceNumber) {
    identifiers.push({
      use: 'secondary' as const,
      system: 'http://hl7.org/fhir/sid/us-insurance',
      value: internalPatient.insuranceNumber
    });
  }
  if (internalPatient.ssn) {
    identifiers.push({
      use: 'official' as const,
      system: 'http://hl7.org/fhir/sid/us-ssn',
      value: internalPatient.ssn
    });
  }
  if (identifiers.length > 0) {
    fhirPatient.identifier = identifiers;
  }

  // Add contact information
  if (internalPatient.email || internalPatient.phone) {
    fhirPatient.telecom = [];
    if (internalPatient.phone) {
      fhirPatient.telecom.push({
        system: 'phone',
        value: internalPatient.phone,
        use: 'home' as const
      });
    }
    if (internalPatient.email) {
      fhirPatient.telecom.push({
        system: 'email',
        value: internalPatient.email,
        use: 'home' as const
      });
    }
  }

  // Add address
  if (internalPatient.address) {
    fhirPatient.address = [{
      use: 'home' as const,
      type: 'physical' as const,
      line: [internalPatient.address.street],
      city: internalPatient.address.city,
      state: internalPatient.address.state,
      postalCode: internalPatient.address.zipCode,
      country: internalPatient.address.country
    }];
  }

  return fhirPatient;
}

/**
 * Encounter type mapping table for internal to FHIR conversion
 * Maps internal encounter types to FHIR v3-ActCode values
 */
const ENCOUNTER_CLASS_MAP: Record<string, { system: string; code: string; display: string }> = {
  emergency: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'EMER',
    display: 'Emergency'
  },
  inpatient: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'IMP',
    display: 'Inpatient'
  },
  outpatient: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'Ambulatory'
  },
  ambulatory: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'Ambulatory'
  },
  virtual: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'VR',
    display: 'Virtual'
  },
  home: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'HH',
    display: 'Home Health'
  },
  initial: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
    display: 'Ambulatory'
  },
  follow_up: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'FU',
    display: 'Follow-up'
  },
  discharge: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'DIS',
    display: 'Discharge'
  }
};

/**
 * Converts internal encounter data to FHIR Encounter resource
 */
export function convertEncounterToFhir(
  internalEncounter: InternalEncounter,
  options: {
    profile?: 'ca-core' | 'us-core';
    includeMeta?: boolean;
  } = {}
): FhirEncounter {
  const { profile = 'us-core', includeMeta = true } = options;
  
  // Map internal status to FHIR status
  const statusMap: Record<string, FhirEncounter['status']> = {
    'scheduled': 'planned',
    'in_progress': 'in-progress',
    'completed': 'finished',
    'finished': 'finished',
    'cancelled': 'cancelled'
  };

  const fhirEncounter: FhirEncounter = {
    resourceType: 'Encounter',
    id: internalEncounter.id,
    status: statusMap[internalEncounter.status] || 'unknown',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB', // Default value, will be overridden if type is specified
      display: 'ambulatory'
    },
    subject: {
      reference: generateFhirReference('Patient', internalEncounter.patientId),
      display: `Patient ${internalEncounter.patientId}`
    },
    period: {
      start: internalEncounter.startDate,
      end: internalEncounter.endDate
    }
  };

  // Add meta information if requested
  if (includeMeta) {
    fhirEncounter.meta = {
      profile: profile === 'ca-core' 
        ? ['http://hl7.org/fhir/StructureDefinition/ca-core-encounter']
        : ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter'],
      lastUpdated: new Date().toISOString()
    };
  }

  // Add encounter type and update class.code accordingly
  if (internalEncounter.type) {
    const mappedType = ENCOUNTER_CLASS_MAP[internalEncounter.type];
    if (mappedType) {
      // Update class.code to match the mapped type
      fhirEncounter.class.code = mappedType.code;
      fhirEncounter.class.display = mappedType.display;
      
      // Also add to type array for additional context
      fhirEncounter.type = [{
        coding: [mappedType],
        text: internalEncounter.reason
      }];
    } else {
      // Invalid encounter type - this should cause validation to fail
      throw new Error(`Invalid encounter type: ${internalEncounter.type}. Supported types: ${Object.keys(ENCOUNTER_CLASS_MAP).join(', ')}`);
    }
  }

  // Add reason
  if (internalEncounter.reason) {
    fhirEncounter.reasonCode = [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: 'unknown',
        display: internalEncounter.reason
      }],
      text: internalEncounter.reason
    }];
  }

  // Add provider as participant
  if (internalEncounter.providerId) {
    fhirEncounter.participant = [{
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'ATND',
          display: 'attender'
        }]
      }],
      individual: {
        reference: generateFhirReference('Practitioner', internalEncounter.providerId),
        display: `Provider ${internalEncounter.providerId}`
      }
    }];
  }

  return fhirEncounter;
}

/**
 * Converts internal observation data to FHIR Observation resource
 */
export function convertObservationToFhir(
  internalObservation: InternalObservation,
  options: {
    profile?: 'ca-core' | 'us-core';
    includeMeta?: boolean;
  } = {}
): FhirObservation {
  const { profile = 'us-core', includeMeta = true } = options;
  
  const fhirObservation: FhirObservation = {
    resourceType: 'Observation',
    id: internalObservation.id,
    status: (internalObservation.status as 'final' | 'amended' | 'corrected' | 'registered' | 'preliminary') || 'final',
    code: {
      coding: [{
        system: internalObservation.codeSystem || (internalObservation.code ? 'http://loinc.org' : 'http://snomed.info/sct'),
        code: internalObservation.code || 'unknown',
        display: internalObservation.displayName || internalObservation.category
      }],
      text: internalObservation.displayName || internalObservation.category
    },
    subject: {
      reference: generateFhirReference('Patient', internalObservation.patientId),
      display: `Patient ${internalObservation.patientId}`
    },
    effectiveDateTime: internalObservation.effectiveDate || internalObservation.date,
    issued: new Date().toISOString()
  };

  // Add meta information if requested
  if (includeMeta) {
    fhirObservation.meta = {
      profile: profile === 'ca-core' 
        ? ['http://hl7.org/fhir/StructureDefinition/ca-core-observation']
        : ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation'],
      lastUpdated: new Date().toISOString()
    };
  }

  // Add encounter reference if available
  if (internalObservation.encounterId) {
    fhirObservation.encounter = {
      reference: generateFhirReference('Encounter', internalObservation.encounterId),
      display: `Encounter ${internalObservation.encounterId}`
    };
  }

  // Add category based on observation type
  if (internalObservation.type === 'vital_signs') {
    fhirObservation.category = [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'vital-signs',
        display: 'Vital Signs'
      }],
      text: 'Vital Signs'
    }];
  }

  // Add value based on type
  if (internalObservation.type === 'text' && internalObservation.textValue) {
    fhirObservation.valueString = internalObservation.textValue;
  } else if (typeof internalObservation.value === 'number') {
    fhirObservation.valueQuantity = {
      value: internalObservation.value,
      unit: internalObservation.unit || 'unknown',
      system: 'http://unitsofmeasure.org',
      code: internalObservation.unit || 'unknown'
    };
  } else if (typeof internalObservation.value === 'string') {
    fhirObservation.valueString = internalObservation.value;
  } else if (typeof internalObservation.value === 'boolean') {
    fhirObservation.valueBoolean = internalObservation.value;
  }

  // Add body site if available
  if (internalObservation.bodySite) {
    fhirObservation.bodySite = {
      coding: [{
        system: 'http://snomed.info/sct',
        code: 'unknown',
        display: internalObservation.bodySite
      }],
      text: internalObservation.bodySite
    };
  }

  return fhirObservation;
}

/**
 * Converts clinical analysis result to a FHIR Bundle
 */
export function convertClinicalAnalysisToFhir(
  clinicalResult: ClinicalAnalysisResult | {
    patient: InternalPatient;
    encounter: InternalEncounter;
    observations: InternalObservation[];
  }
): FhirBundle & ClinicalDataBundle {
  let patient: FhirPatient;
  let encounter: FhirEncounter;
  let observations: FhirObservation[] = [];

  // Check if we have the new format (patient, encounter, observations directly)
  if ('patient' in clinicalResult && 'encounter' in clinicalResult && 'observations' in clinicalResult) {
    // New format: direct patient, encounter, observations
    patient = convertPatientToFhir(clinicalResult.patient);
    encounter = convertEncounterToFhir(clinicalResult.encounter);
    observations = clinicalResult.observations.map(obs => convertObservationToFhir(obs));
  } else {
    // Original format: ClinicalAnalysisResult
    // This would need the actual internal patient data
    // For now, we'll create a mock conversion
    const mockPatient: InternalPatient = {
      id: clinicalResult.patientId,
      firstName: 'Unknown',
      lastName: 'Patient',
      dateOfBirth: new Date().toISOString().split('T')[0],
      gender: 'unknown'
    };

    const mockEncounter: InternalEncounter = {
      id: clinicalResult.sessionId,
      patientId: clinicalResult.patientId,
      startDate: clinicalResult.analysisDate?.toISOString() || new Date().toISOString(),
      type: 'initial',
      status: 'completed',
      reason: 'Clinical assessment',
      providerId: 'unknown'
    };

    patient = convertPatientToFhir(mockPatient);
    encounter = convertEncounterToFhir(mockEncounter);
    
    // Convert symptoms and signs to observations
    clinicalResult.symptoms?.forEach((symptom, index) => {
      const observation: InternalObservation = {
        id: `symptom-${index}`,
        patientId: clinicalResult.patientId,
        type: 'clinical_finding',
        value: symptom.description,
        date: clinicalResult.analysisDate?.toISOString() || new Date().toISOString(),
        category: 'Symptom',
        code: symptom.name
      };
      observations.push(convertObservationToFhir(observation));
    });

    clinicalResult.signs?.forEach((sign, index) => {
      const observation: InternalObservation = {
        id: `sign-${index}`,
        patientId: clinicalResult.patientId,
        type: 'clinical_finding',
        value: sign.description,
        date: clinicalResult.analysisDate?.toISOString() || new Date().toISOString(),
        category: 'Clinical Sign',
        code: sign.name
      };
      observations.push(convertObservationToFhir(observation));
    });
  }

  // Create the FHIR Bundle
  const bundle = createClinicalDataBundle({
    patient,
    encounter,
    observations
  }, {
    type: 'collection',
    profile: 'ca-core',
    includeMeta: true
  });

  // Return both the bundle and direct access to resources
  return {
    ...bundle,
    patient,
    encounter,
    observations
  };
}
