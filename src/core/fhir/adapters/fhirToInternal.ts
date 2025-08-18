/**
 * @fileoverview FHIR to Internal Adapter - Lightweight Implementation
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 */

import type { 
  FhirPatient, 
  FhirEncounter, 
  FhirObservation 
} from '../types';
import type { 
  InternalPatient,
  InternalEncounter,
  InternalObservation 
} from './internalToFhir';

/**
 * Converts FHIR Patient resource to internal patient data
 */
export function convertFhirToPatient(
  fhirPatient: FhirPatient
): InternalPatient {
  const internalPatient: InternalPatient = {
    id: fhirPatient.id,
    firstName: '',
    lastName: '',
    dateOfBirth: fhirPatient.birthDate || '',
    gender: fhirPatient.gender || 'unknown'
  };

  // Extract name information
  if (fhirPatient.name && fhirPatient.name.length > 0) {
    const officialName = fhirPatient.name.find(n => n.use === 'official') || fhirPatient.name[0];
    if (officialName) {
      internalPatient.firstName = officialName.given?.[0] || '';
      internalPatient.lastName = officialName.family || '';
    }
  }

  // Extract contact information
  if (fhirPatient.telecom) {
    const email = fhirPatient.telecom.find(t => t.system === 'email');
    const phone = fhirPatient.telecom.find(t => t.system === 'phone');
    
    if (email) {
      internalPatient.email = email.value;
    }
    if (phone) {
      internalPatient.phone = phone.value;
    }
  }

  // Extract address information
  if (fhirPatient.address && fhirPatient.address.length > 0) {
    const homeAddress = fhirPatient.address.find(a => a.use === 'home') || fhirPatient.address[0];
    if (homeAddress) {
      internalPatient.address = {
        street: homeAddress.line?.[0] || '',
        city: homeAddress.city || '',
        state: homeAddress.state || '',
        postalCode: homeAddress.postalCode || '',
        country: homeAddress.country || ''
      };
    }
  }

  // Extract active status
  if (fhirPatient.active !== undefined) {
    internalPatient.isActive = fhirPatient.active;
  }

  // Extract identifiers
  if (fhirPatient.identifier) {
    const mrn = fhirPatient.identifier.find(i => i.use === 'official');
    const insurance = fhirPatient.identifier.find(i => i.use === 'secondary');
    const ssn = fhirPatient.identifier.find(i => i.system?.includes('us-ssn'));
    
    if (mrn) {
      internalPatient.medicalRecordNumber = mrn.value;
    }
    if (insurance) {
      internalPatient.insuranceNumber = insurance.value;
    }
    if (ssn) {
      internalPatient.ssn = ssn.value;
    }
  }

  return internalPatient;
}

/**
 * FHIR to Internal Encounter type mapping table
 * Maps FHIR v3-ActCode values to internal encounter types
 */
const FHIR_TO_INTERNAL_ENCOUNTER_MAP: Record<string, InternalEncounter['type']> = {
  'EMER': 'emergency',
  'IMP': 'inpatient',
  'OUT': 'outpatient', // Keep for backward compatibility, but AMB maps to both
  'AMB': 'ambulatory',
  'VR': 'ambulatory', // Virtual maps to ambulatory for internal representation
  'HH': 'ambulatory', // Home health maps to ambulatory for internal representation
  'FU': 'follow_up',
  'DIS': 'discharge'
};

/**
 * Converts FHIR Encounter resource to internal encounter data
 */
export function convertFhirToEncounter(
  fhirEncounter: FhirEncounter
): InternalEncounter {
  // Map FHIR status to internal status
  const statusMap: Record<FhirEncounter['status'], InternalEncounter['status']> = {
    'planned': 'scheduled',
    'arrived': 'scheduled',
    'triaged': 'scheduled',
    'in-progress': 'in_progress',
    'onleave': 'in_progress',
    'finished': 'finished',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'entered-in-error': 'cancelled',
    'unknown': 'scheduled'
  };

  const internalEncounter: InternalEncounter = {
    id: fhirEncounter.id,
    patientId: '',
    startDate: '',
    type: 'initial',
    status: statusMap[fhirEncounter.status],
    reason: '',
    providerId: ''
  };

  // Extract patient reference
  if (fhirEncounter.subject) {
    const patientRef = fhirEncounter.subject.reference;
    if (patientRef.startsWith('Patient/')) {
      internalEncounter.patientId = patientRef.substring(8);
    }
  }

  // Extract period information
  if (fhirEncounter.period) {
    internalEncounter.startDate = fhirEncounter.period.start || '';
    internalEncounter.endDate = fhirEncounter.period.end;
  }

  // Extract encounter type from type array first, then fall back to class.code
  if (fhirEncounter.type && fhirEncounter.type.length > 0) {
    const encounterType = fhirEncounter.type[0];
    if (encounterType.coding && encounterType.coding.length > 0) {
      const coding = encounterType.coding[0];
      internalEncounter.type = FHIR_TO_INTERNAL_ENCOUNTER_MAP[coding.code] || 'initial';
    }
    internalEncounter.reason = encounterType.text || '';
  } else if (fhirEncounter.class && fhirEncounter.class.code) {
    // Fall back to class.code if type is not available
    internalEncounter.type = FHIR_TO_INTERNAL_ENCOUNTER_MAP[fhirEncounter.class.code] || 'initial';
  }

  // Extract reason from reasonCode if available
  if (fhirEncounter.reasonCode && fhirEncounter.reasonCode.length > 0) {
    const reason = fhirEncounter.reasonCode[0];
    if (reason.text && !internalEncounter.reason) {
      internalEncounter.reason = reason.text;
    }
  }

  // Extract provider from participants if available
  if (fhirEncounter.participant && fhirEncounter.participant.length > 0) {
    const provider = fhirEncounter.participant.find(p => 
      p.type && p.type.some(t => 
        t.coding && t.coding.some(c => c.code === 'ATND')
      )
    );
    if (provider && provider.individual) {
      const providerRef = provider.individual.reference;
      if (providerRef.startsWith('Practitioner/')) {
        internalEncounter.providerId = providerRef.replace('Practitioner/', '');
      }
    }
  }

  return internalEncounter;
}

/**
 * Converts FHIR Observation resource to internal observation data
 */
export function convertFhirToObservation(
  fhirObservation: FhirObservation
): InternalObservation {
  const internalObservation: InternalObservation = {
    id: fhirObservation.id,
    patientId: '',
    type: 'clinical_finding',
    value: undefined,
    date: '',
    category: ''
  };

  // Extract patient reference
  if (fhirObservation.subject) {
    const patientRef = fhirObservation.subject.reference;
    if (patientRef.startsWith('Patient/')) {
      internalObservation.patientId = patientRef.substring(8);
    }
  }

  // Extract encounter reference
  if (fhirObservation.encounter) {
    const encounterRef = fhirObservation.encounter.reference;
    if (encounterRef.startsWith('Encounter/')) {
      internalObservation.encounterId = encounterRef.substring(10);
    } else {
      internalObservation.encounterId = encounterRef;
    }
  }

  // Extract effective date
  if (fhirObservation.effectiveDateTime) {
    internalObservation.date = fhirObservation.effectiveDateTime;
    internalObservation.effectiveDate = fhirObservation.effectiveDateTime;
  } else if (fhirObservation.effectivePeriod?.start) {
    internalObservation.date = fhirObservation.effectivePeriod.start;
    internalObservation.effectiveDate = fhirObservation.effectivePeriod.start;
  } else if (fhirObservation.effectiveInstant) {
    internalObservation.date = fhirObservation.effectiveInstant;
    internalObservation.effectiveDate = fhirObservation.effectiveInstant;
  }

  // Extract status
  if (fhirObservation.status) {
    internalObservation.status = fhirObservation.status;
  }

  // Extract category and code
  if (fhirObservation.category && fhirObservation.category.length > 0) {
    const category = fhirObservation.category[0];
    if (category.coding && category.coding.length > 0) {
      const coding = category.coding[0];
      if (coding.code === 'vital-signs') {
        internalObservation.type = 'vital_signs';
        internalObservation.category = 'vital-signs';
      } else if (coding.code === 'survey') {
        internalObservation.type = 'functional_assessment';
        internalObservation.category = 'survey';
      } else {
        internalObservation.category = category.text || coding.code || '';
      }
    } else {
      internalObservation.category = category.text || '';
    }
  }

  // Extract observation code
  if (fhirObservation.code) {
    if (fhirObservation.code.coding && fhirObservation.code.coding.length > 0) {
      const coding = fhirObservation.code.coding[0];
      internalObservation.code = coding.code;
      internalObservation.codeSystem = coding.system;
      internalObservation.displayName = coding.display;
      if (!internalObservation.category) {
        internalObservation.category = coding.display || '';
      }
    }
    if (!internalObservation.category && fhirObservation.code.text) {
      internalObservation.category = fhirObservation.code.text;
    }
  }

  // Extract value
  if (fhirObservation.valueQuantity) {
    internalObservation.value = fhirObservation.valueQuantity.value || 0;
    internalObservation.unit = fhirObservation.valueQuantity.unit;
  } else if (fhirObservation.valueString) {
    // For text observations, don't set value, only textValue
    internalObservation.textValue = fhirObservation.valueString;
  } else if (fhirObservation.valueBoolean !== undefined) {
    internalObservation.value = fhirObservation.valueBoolean;
  } else if (fhirObservation.valueInteger !== undefined) {
    internalObservation.value = fhirObservation.valueInteger;
  } else if (fhirObservation.valueCodeableConcept) {
    const concept = fhirObservation.valueCodeableConcept;
    if (concept.coding && concept.coding.length > 0) {
      internalObservation.value = concept.coding[0].display || concept.coding[0].code;
    } else if (concept.text) {
      internalObservation.value = concept.text;
    }
  }

  // Extract body site
  if (fhirObservation.bodySite) {
    if (fhirObservation.bodySite.coding && fhirObservation.bodySite.coding.length > 0) {
      internalObservation.bodySite = fhirObservation.bodySite.coding[0].display || 
                                    fhirObservation.bodySite.coding[0].code;
    } else if (fhirObservation.bodySite.text) {
      internalObservation.bodySite = fhirObservation.bodySite.text;
    }
  }

  return internalObservation;
}

/**
 * Converts multiple FHIR resources to internal clinical data
 */
export function convertFhirToClinicalData(
  fhirResources: {
    patient: FhirPatient;
    encounter: FhirEncounter;
    observations: FhirObservation[];
  }
): {
  patient: InternalPatient;
  encounter: InternalEncounter;
  observations: InternalObservation[];
} {
  return {
    patient: convertFhirToPatient(fhirResources.patient),
    encounter: convertFhirToEncounter(fhirResources.encounter),
    observations: fhirResources.observations.map(convertFhirToObservation)
  };
}

/**
 * Validates FHIR resource structure before conversion
 */
export function validateFhirResource(
  resource: FhirPatient | FhirEncounter | FhirObservation
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!resource.resourceType) {
    errors.push('Missing required field: resourceType');
  }
  if (!resource.id) {
    errors.push('Missing required field: id');
  }

  // Resource-specific validation
  switch (resource.resourceType) {
    case 'Patient': {
      const patient = resource as FhirPatient;
      if (!patient.name || patient.name.length === 0) {
        errors.push('Patient must have at least one name');
      }
      break;
    }
    
    case 'Encounter': {
      const encounter = resource as FhirEncounter;
      if (!encounter.status) {
        errors.push('Encounter must have status');
      }
      if (!encounter.subject) {
        errors.push('Encounter must have subject');
      }
      break;
    }
    
    case 'Observation': {
      const observation = resource as FhirObservation;
      if (!observation.status) {
        errors.push('Observation must have status');
      }
      if (!observation.code) {
        errors.push('Observation must have code');
      }
      if (!observation.subject) {
        errors.push('Observation must have subject');
      }
      break;
    }
    
    default:
      errors.push(`Unsupported resource type: ${resource.resourceType}`);
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
