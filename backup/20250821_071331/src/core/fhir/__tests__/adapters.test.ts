import { describe, it, expect } from 'vitest';
import { 
  convertPatientToFhir, 
  convertEncounterToFhir, 
  convertObservationToFhir,
  convertClinicalAnalysisToFhir,
  type InternalPatient,
  type InternalEncounter,
  type InternalObservation
} from '../adapters/internalToFhir';
import { 
  convertFhirToPatient, 
  convertFhirToEncounter, 
  convertFhirToObservation,
  convertFhirToClinicalData,
  validateFhirResource
} from '../adapters/fhirToInternal';
import type { FhirPatient, FhirEncounter, FhirObservation } from '../types';

describe('FHIR Adapters - Internal to FHIR Conversion', () => {
  describe('convertPatientToFhir', () => {
    it('should convert internal patient to FHIR Patient', () => {
      const internalPatient: InternalPatient = {
        id: 'patient-123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+1-555-123-4567',
        email: 'john.doe@email.com',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'ST',
          zipCode: '12345',
          country: 'US'
        },
        ssn: '123-45-6789',
        isActive: true
      };

      const fhirPatient = convertPatientToFhir(internalPatient);

      expect(fhirPatient.resourceType).toBe('Patient');
      expect(fhirPatient.id).toBe('patient-123');
      expect(fhirPatient.active).toBe(true);
      expect(fhirPatient.name?.[0]?.family).toBe('Doe');
      expect(fhirPatient.name?.[0]?.given).toEqual(['John']);
      expect(fhirPatient.birthDate).toBe('1990-01-01');
      expect(fhirPatient.gender).toBe('male');
      expect(fhirPatient.telecom?.[0]?.value).toBe('+1-555-123-4567');
      expect(fhirPatient.telecom?.[1]?.value).toBe('john.doe@email.com');
      expect(fhirPatient.address?.[0]?.line).toEqual(['123 Main St']);
      expect(fhirPatient.address?.[0]?.city).toBe('Anytown');
      expect(fhirPatient.identifier?.[0]?.value).toBe('123-45-6789');
    });

    it('should include CA Core profile when specified', () => {
      const internalPatient: InternalPatient = {
        id: 'patient-123',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        isActive: true
      };

      const fhirPatient = convertPatientToFhir(internalPatient, { profile: 'ca-core' });

      expect(fhirPatient.meta?.profile).toContain('http://hl7.org/fhir/StructureDefinition/ca-core-patient');
    });

    it('should include US Core profile when specified', () => {
      const internalPatient: InternalPatient = {
        id: 'patient-123',
        firstName: 'Bob',
        lastName: 'Johnson',
        dateOfBirth: '1975-12-20',
        gender: 'male',
        isActive: true
      };

      const fhirPatient = convertPatientToFhir(internalPatient, { profile: 'us-core' });

      expect(fhirPatient.meta?.profile).toContain('http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient');
    });
  });

  describe('convertEncounterToFhir', () => {
    it('should convert internal encounter to FHIR Encounter', () => {
      const internalEncounter: InternalEncounter = {
        id: 'encounter-123',
        patientId: 'patient-123',
        startDate: '2025-01-20T09:00:00Z',
        endDate: '2025-01-20T10:00:00Z',
        type: 'ambulatory',
        status: 'finished',
        reason: 'Annual checkup',
        providerId: 'provider-456'
      };

      const fhirEncounter = convertEncounterToFhir(internalEncounter);

      expect(fhirEncounter.resourceType).toBe('Encounter');
      expect(fhirEncounter.id).toBe('encounter-123');
      expect(fhirEncounter.status).toBe('finished');
      expect(fhirEncounter.class.code).toBe('AMB');
      expect(fhirEncounter.subject?.reference).toBe('Patient/patient-123');
      expect(fhirEncounter.period?.start).toBe('2025-01-20T09:00:00Z');
      expect(fhirEncounter.period?.end).toBe('2025-01-20T10:00:00Z');
      expect(fhirEncounter.reasonCode?.[0]?.text).toBe('Annual checkup');
    });

    it('should map encounter types correctly', () => {
      const typeMappings = [
        { internal: 'ambulatory', expected: 'AMB' },
        { internal: 'emergency', expected: 'EMER' },
        { internal: 'inpatient', expected: 'IMP' },
        { internal: 'outpatient', expected: 'AMB' }
      ];

      typeMappings.forEach(({ internal, expected }) => {
        const internalEncounter: InternalEncounter = {
          id: 'test',
          patientId: 'patient-123',
          startDate: '2025-01-20T09:00:00Z',
          type: internal as any,
          status: 'finished',
          providerId: 'provider-456'
        };

        const fhirEncounter = convertEncounterToFhir(internalEncounter);
        expect(fhirEncounter.class.code).toBe(expected);
      });
    });
  });

  describe('convertObservationToFhir', () => {
    it('should convert internal observation to FHIR Observation', () => {
      const internalObservation: InternalObservation = {
        id: 'obs-123',
        patientId: 'patient-123',
        encounterId: 'encounter-123',
        type: 'vital_signs',
        code: '8867-4',
        codeSystem: 'http://loinc.org',
        displayName: 'Heart rate',
        value: 72,
        unit: 'beats/min',
        status: 'final',
        effectiveDate: '2025-01-20T09:30:00Z',
        category: 'vital-signs'
      };

      const fhirObservation = convertObservationToFhir(internalObservation);

      expect(fhirObservation.resourceType).toBe('Observation');
      expect(fhirObservation.id).toBe('obs-123');
      expect(fhirObservation.status).toBe('final');
      expect(fhirObservation.code.coding[0].code).toBe('8867-4');
      expect(fhirObservation.code.coding[0].system).toBe('http://loinc.org');
      expect(fhirObservation.code.coding[0].display).toBe('Heart rate');
      expect(fhirObservation.subject?.reference).toBe('Patient/patient-123');
      expect(fhirObservation.encounter?.reference).toBe('Encounter/encounter-123');
      expect(fhirObservation.valueQuantity?.value).toBe(72);
      expect(fhirObservation.valueQuantity?.unit).toBe('beats/min');
      expect(fhirObservation.effectiveDateTime).toBe('2025-01-20T09:30:00Z');
    });

    it('should handle text observations correctly', () => {
      const internalObservation: InternalObservation = {
        id: 'obs-text-123',
        patientId: 'patient-123',
        type: 'text',
        code: '75275-8',
        codeSystem: 'http://loinc.org',
        displayName: 'Pain assessment',
        textValue: 'Moderate pain in lower back',
        status: 'final',
        effectiveDate: '2025-01-20T09:30:00Z'
      };

      const fhirObservation = convertObservationToFhir(internalObservation);

      expect(fhirObservation.valueString).toBe('Moderate pain in lower back');
      expect(fhirObservation.valueQuantity).toBeUndefined();
    });

    it('should categorize vital signs correctly', () => {
      const internalObservation: InternalObservation = {
        id: 'vital-123',
        patientId: 'patient-123',
        type: 'vital_signs',
        code: '85354-9',
        codeSystem: 'http://loinc.org',
        displayName: 'Blood pressure',
        value: 120,
        unit: 'mmHg',
        status: 'final',
        effectiveDate: '2025-01-20T09:30:00Z',
        category: 'vital-signs'
      };

      const fhirObservation = convertObservationToFhir(internalObservation);

      expect(fhirObservation.category?.[0]?.coding[0]?.code).toBe('vital-signs');
      expect(fhirObservation.category?.[0]?.coding[0]?.system).toBe('http://terminology.hl7.org/CodeSystem/observation-category');
    });
  });

  describe('convertClinicalAnalysisToFhir', () => {
    it('should convert clinical analysis result to FHIR bundle', () => {
      const clinicalResult = {
        patient: {
          id: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          isActive: true
        },
        encounter: {
          id: 'encounter-123',
          patientId: 'patient-123',
          startDate: '2025-01-20T09:00:00Z',
          type: 'ambulatory',
          status: 'finished',
          providerId: 'provider-456'
        },
        observations: [
          {
            id: 'obs-123',
            patientId: 'patient-123',
            encounterId: 'encounter-123',
            type: 'vital_signs',
            code: '8867-4',
            codeSystem: 'http://loinc.org',
            displayName: 'Heart rate',
            value: 72,
            unit: 'beats/min',
            status: 'final',
            effectiveDate: '2025-01-20T09:30:00Z'
          }
        ]
      };

      const fhirBundle = convertClinicalAnalysisToFhir(clinicalResult);

      expect(fhirBundle.patient.resourceType).toBe('Patient');
      expect(fhirBundle.encounter.resourceType).toBe('Encounter');
      expect(fhirBundle.observations).toHaveLength(1);
      expect(fhirBundle.observations[0].resourceType).toBe('Observation');
    });
  });
});

describe('FHIR Adapters - FHIR to Internal Conversion', () => {
  describe('convertFhirToPatient', () => {
    it('should convert FHIR Patient to internal patient', () => {
      const fhirPatient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [
          {
            use: 'official',
            family: 'Doe',
            given: ['John']
          }
        ],
        gender: 'male',
        birthDate: '1990-01-01',
        telecom: [
          {
            system: 'phone',
            value: '+1-555-123-4567',
            use: 'home'
          },
          {
            system: 'email',
            value: 'john.doe@email.com',
            use: 'home'
          }
        ],
        address: [
          {
            use: 'home',
            type: 'physical',
            line: ['123 Main St'],
            city: 'Anytown',
            state: 'ST',
            postalCode: '12345',
            country: 'US'
          }
        ],
        identifier: [
          {
            system: 'http://hl7.org/fhir/sid/us-ssn',
            value: '123-45-6789'
          }
        ]
      };

      const internalPatient = convertFhirToPatient(fhirPatient);

      expect(internalPatient.id).toBe('patient-123');
      expect(internalPatient.firstName).toBe('John');
      expect(internalPatient.lastName).toBe('Doe');
      expect(internalPatient.dateOfBirth).toBe('1990-01-01');
      expect(internalPatient.gender).toBe('male');
      expect(internalPatient.phone).toBe('+1-555-123-4567');
      expect(internalPatient.email).toBe('john.doe@email.com');
      expect(internalPatient.address?.street).toBe('123 Main St');
      expect(internalPatient.address?.city).toBe('Anytown');
      expect(internalPatient.ssn).toBe('123-45-6789');
      expect(internalPatient.isActive).toBe(true);
    });
  });

  describe('convertFhirToEncounter', () => {
    it('should convert FHIR Encounter to internal encounter', () => {
      const fhirEncounter: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        period: {
          start: '2025-01-20T09:00:00Z',
          end: '2025-01-20T10:00:00Z'
        },
        reasonCode: [
          {
            text: 'Annual checkup'
          }
        ]
      };

      const internalEncounter = convertFhirToEncounter(fhirEncounter);

      expect(internalEncounter.id).toBe('encounter-123');
      expect(internalEncounter.patientId).toBe('patient-123');
      expect(internalEncounter.startDate).toBe('2025-01-20T09:00:00Z');
      expect(internalEncounter.endDate).toBe('2025-01-20T10:00:00Z');
      expect(internalEncounter.type).toBe('ambulatory');
      expect(internalEncounter.status).toBe('finished');
      expect(internalEncounter.reason).toBe('Annual checkup');
    });
  });

  describe('convertFhirToObservation', () => {
    it('should convert FHIR Observation to internal observation', () => {
      const fhirObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'obs-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        encounter: {
          reference: 'Encounter/encounter-123'
        },
        valueQuantity: {
          value: 72,
          unit: 'beats/min',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        },
        effectiveDateTime: '2025-01-20T09:30:00Z',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }
            ]
          }
        ]
      };

      const internalObservation = convertFhirToObservation(fhirObservation);

      expect(internalObservation.id).toBe('obs-123');
      expect(internalObservation.patientId).toBe('patient-123');
      expect(internalObservation.encounterId).toBe('encounter-123');
      expect(internalObservation.type).toBe('vital_signs');
      expect(internalObservation.code).toBe('8867-4');
      expect(internalObservation.codeSystem).toBe('http://loinc.org');
      expect(internalObservation.displayName).toBe('Heart rate');
      expect(internalObservation.value).toBe(72);
      expect(internalObservation.unit).toBe('beats/min');
      expect(internalObservation.status).toBe('final');
      expect(internalObservation.effectiveDate).toBe('2025-01-20T09:30:00Z');
      expect(internalObservation.category).toBe('vital-signs');
    });

    it('should handle text observations correctly', () => {
      const fhirObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'obs-text-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '75275-8',
              display: 'Pain assessment'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        valueString: 'Moderate pain in lower back',
        effectiveDateTime: '2025-01-20T09:30:00Z'
      };

      const internalObservation = convertFhirToObservation(fhirObservation);

      expect(internalObservation.textValue).toBe('Moderate pain in lower back');
      expect(internalObservation.value).toBeUndefined();
      expect(internalObservation.unit).toBeUndefined();
    });
  });

  describe('convertFhirToClinicalData', () => {
    it('should convert FHIR bundle to internal clinical data', () => {
      const fhirResources = {
        patient: {
          resourceType: 'Patient',
          id: 'patient-123',
          active: true,
          name: [
            {
              use: 'official',
              family: 'Doe',
              given: ['John']
            }
          ]
        } as FhirPatient,
        encounter: {
          resourceType: 'Encounter',
          id: 'encounter-123',
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'Ambulatory'
          },
          subject: {
            reference: 'Patient/patient-123'
          }
        } as FhirEncounter,
        observations: [
          {
            resourceType: 'Observation',
            id: 'obs-123',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8867-4',
                  display: 'Heart rate'
                }
              ]
            },
            subject: {
              reference: 'Patient/patient-123'
            },
            valueQuantity: {
              value: 72,
              unit: 'beats/min'
            }
          } as FhirObservation
        ]
      };

      const internalData = convertFhirToClinicalData(fhirResources);

      expect(internalData.patient.id).toBe('patient-123');
      expect(internalData.encounter.id).toBe('encounter-123');
      expect(internalData.observations).toHaveLength(1);
      expect(internalData.observations[0].id).toBe('obs-123');
    });
  });

  describe('validateFhirResource', () => {
    it('should validate valid FHIR resources', () => {
      const validPatient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [{
          family: 'Doe',
          given: ['John']
        }]
      };

      const result = validateFhirResource(validPatient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid resource types', () => {
      const invalidResource = {
        resourceType: 'InvalidResource',
        id: 'test-123'
      } as any;

      const result = validateFhirResource(invalidResource);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported resource type: InvalidResource');
    });

    it('should detect missing required fields', () => {
      const invalidPatient = {
        resourceType: 'Patient',
        // Missing id
      } as any;

      const result = validateFhirResource(invalidPatient);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });
  });
});

describe('FHIR Adapters - Round-trip Tests', () => {
  it('should convert Patient internal → FHIR → internal without data loss', () => {
    const originalPatient: InternalPatient = {
      id: 'patient-123',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phone: '+1-555-123-4567',
      email: 'john.doe@email.com',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'ST',
        zipCode: '12345',
        country: 'US'
      },
      ssn: '123-45-6789',
      isActive: true
    };

    const fhirPatient = convertPatientToFhir(originalPatient);
    const roundTripPatient = convertFhirToPatient(fhirPatient);

    expect(roundTripPatient.id).toBe(originalPatient.id);
    expect(roundTripPatient.firstName).toBe(originalPatient.firstName);
    expect(roundTripPatient.lastName).toBe(originalPatient.lastName);
    expect(roundTripPatient.dateOfBirth).toBe(originalPatient.dateOfBirth);
    expect(roundTripPatient.gender).toBe(originalPatient.gender);
    expect(roundTripPatient.phone).toBe(originalPatient.phone);
    expect(roundTripPatient.email).toBe(originalPatient.email);
    expect(roundTripPatient.address?.street).toBe(originalPatient.address?.street);
    expect(roundTripPatient.address?.city).toBe(originalPatient.address?.city);
    expect(roundTripPatient.ssn).toBe(originalPatient.ssn);
    expect(roundTripPatient.isActive).toBe(originalPatient.isActive);
  });

  it('should convert Encounter internal → FHIR → internal without data loss', () => {
    const originalEncounter: InternalEncounter = {
      id: 'encounter-123',
      patientId: 'patient-123',
      startDate: '2025-01-20T09:00:00Z',
      endDate: '2025-01-20T10:00:00Z',
      type: 'ambulatory',
      status: 'finished',
      reason: 'Annual checkup',
      providerId: 'provider-456'
    };

    const fhirEncounter = convertEncounterToFhir(originalEncounter);
    const roundTripEncounter = convertFhirToEncounter(fhirEncounter);

    expect(roundTripEncounter.id).toBe(originalEncounter.id);
    expect(roundTripEncounter.patientId).toBe(originalEncounter.patientId);
    expect(roundTripEncounter.startDate).toBe(originalEncounter.startDate);
    expect(roundTripEncounter.endDate).toBe(originalEncounter.endDate);
    expect(roundTripEncounter.type).toBe(originalEncounter.type);
    expect(roundTripEncounter.status).toBe(originalEncounter.status);
    expect(roundTripEncounter.reason).toBe(originalEncounter.reason);
    expect(roundTripEncounter.providerId).toBe(originalEncounter.providerId);
  });

  it('should convert Observation internal → FHIR → internal without data loss', () => {
    const originalObservation: InternalObservation = {
      id: 'obs-123',
      patientId: 'patient-123',
      encounterId: 'encounter-123',
      type: 'vital_signs',
      code: '8867-4',
      codeSystem: 'http://loinc.org',
      displayName: 'Heart rate',
      value: 72,
      unit: 'beats/min',
      status: 'final',
      effectiveDate: '2025-01-20T09:30:00Z',
      category: 'vital-signs'
    };

    const fhirObservation = convertObservationToFhir(originalObservation);
    const roundTripObservation = convertFhirToObservation(fhirObservation);

    expect(roundTripObservation.id).toBe(originalObservation.id);
    expect(roundTripObservation.patientId).toBe(originalObservation.patientId);
    expect(roundTripObservation.encounterId).toBe(originalObservation.encounterId);
    expect(roundTripObservation.type).toBe(originalObservation.type);
    expect(roundTripObservation.code).toBe(originalObservation.code);
    expect(roundTripObservation.codeSystem).toBe(originalObservation.codeSystem);
    expect(roundTripObservation.displayName).toBe(originalObservation.displayName);
    expect(roundTripObservation.value).toBe(originalObservation.value);
    expect(roundTripObservation.unit).toBe(originalObservation.unit);
    expect(roundTripObservation.status).toBe(originalObservation.status);
    expect(roundTripObservation.effectiveDate).toBe(originalObservation.effectiveDate);
    expect(roundTripObservation.category).toBe(originalObservation.category);
  });
});
