// @ts-nocheck
import { describe, it, expect } from 'vitest';

import {
  validateCaCorePatient,
  validateCaCoreEncounter,
  validateCaCoreObservation,
  validateCaCoreBundle
} from '../validators/caCoreValidator';
import {
  validateUsCorePatient,
  validateUsCoreEncounter,
  validateUsCoreObservation,
  validateUsCoreBundle
} from '../validators/usCoreValidator';
import type { FhirPatient, FhirEncounter, FhirObservation } from '../types';

describe('CA Core Validator', () => {
  describe('validateCaCorePatient', () => {
    it('should validate a compliant CA Core Patient', () => {
      const compliantPatient: FhirPatient = {
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
        identifier: [
          {
            system: 'http://hl7.org/fhir/sid/ca-hin',
            value: 'CA123456789'
          }
        ]
      };

      const result = validateCaCorePatient(compliantPatient);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for CA Core', () => {
      const nonCompliantPatient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123'
        // Missing required fields
      };

      const result = validateCaCorePatient(nonCompliantPatient);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('name'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('gender'))).toBe(true);
    });

    it('should validate Canadian Health Information Number (HIN)', () => {
      const patientWithHIN: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [
          {
            use: 'official',
            family: 'Smith',
            given: ['Jane']
          }
        ],
        gender: 'female',
        identifier: [
          {
            system: 'http://hl7.org/fhir/sid/ca-hin',
            value: 'CA987654321'
          }
        ]
      };

      const result = validateCaCorePatient(patientWithHIN);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing address information', () => {
      const patientWithoutAddress: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [
          {
            use: 'official',
            family: 'Johnson',
            given: ['Bob']
          }
        ],
        gender: 'male'
      };

      const result = validateCaCorePatient(patientWithoutAddress);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate address country format', () => {
      const patientWithUSAddress: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [
          {
            use: 'official',
            family: 'Wilson',
            given: ['Alice']
          }
        ],
        gender: 'female',
        address: [
          {
            line: ['123 Main St'],
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5V 3A8',
            country: 'US'
          }
        ]
      };

      const result = validateCaCorePatient(patientWithUSAddress);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.some(e => e.message.includes('Canadian address format'))).toBe(true);
    });
  });

  describe('validateCaCoreEncounter', () => {
    it('should validate a compliant CA Core Encounter', () => {
      const compliantEncounter: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'Patient/patient-123',
          display: 'John Doe'
        },
        period: {
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:00:00Z'
        }
      };

      const result = validateCaCoreEncounter(compliantEncounter);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for CA Core Encounter', () => {
      const nonCompliantEncounter: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123'
        // Missing required fields
      };

      const result = validateCaCoreEncounter(nonCompliantEncounter);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('status'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('class'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('subject'))).toBe(true);
    });

    it('should validate encounter status values', () => {
      const encounterWithInvalidStatus: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'invalid-status' as any,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'Patient/patient-123'
        }
      };

      const result = validateCaCoreEncounter(encounterWithInvalidStatus);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.some(e => e.message.includes('status'))).toBe(true);
    });

    it('should validate subject reference format', () => {
      const encounterWithInvalidSubject: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'InvalidReference',
          display: 'Invalid Reference'
        }
      };

      const result = validateCaCoreEncounter(encounterWithInvalidSubject);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.some(e => e.message.includes('Patient/'))).toBe(true);
    });
  });

  describe('validateCaCoreObservation', () => {
    it('should validate a compliant CA Core Observation', () => {
      const compliantObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }
          ],
          text: 'Body height'
        },
        subject: {
          reference: 'Patient/patient-123',
          display: 'John Doe'
        },
        valueQuantity: {
          value: 175,
          unit: 'cm',
          system: 'http://unitsofmeasure.org',
          code: 'cm'
        }
      };

      const result = validateCaCoreObservation(compliantObservation);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for CA Core Observation', () => {
      const nonCompliantObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123'
        // Missing required fields
      };

      const result = validateCaCoreObservation(nonCompliantObservation);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('status'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('code'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('subject'))).toBe(true);
    });

    it('should validate observation status values', () => {
      const observationWithInvalidStatus: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123',
        status: 'invalid-status' as any,
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        }
      };

      const result = validateCaCoreObservation(observationWithInvalidStatus);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.some(e => e.message.includes('status'))).toBe(true);
    });

    it('should validate observation value structure', () => {
      const observationWithoutValue: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        }
        // Missing value
      };

      const result = validateCaCoreObservation(observationWithoutValue);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('CA_CORE');
      expect(result.errors.some(e => e.message.includes('value'))).toBe(true);
    });
  });

  describe('validateCaCoreBundle', () => {
    it('should validate a complete CA Core compliant bundle', () => {
      const bundle = {
        patient: {
          resourceType: 'Patient',
          id: 'patient-123',
          name: [
            {
              family: 'Doe',
              given: ['John']
            }
          ],
          gender: 'male'
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
            id: 'observation-123',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8302-2',
                  display: 'Body height'
                }
              ]
            },
            subject: {
              reference: 'Patient/patient-123'
            },
            valueQuantity: {
              value: 175,
              unit: 'cm'
            }
          } as FhirObservation
        ]
      };

      const result = validateCaCoreBundle(bundle);

      expect(result.overallValid).toBe(true);
      expect(result.patientValidation?.valid).toBe(true);
      expect(result.encounterValidation?.valid).toBe(true);
      expect(result.observationValidations?.[0].valid).toBe(true);
      expect(result.summary.totalResources).toBe(3);
      expect(result.summary.validResources).toBe(3);
    });
  });
});

describe('US Core Validator', () => {
  describe('validateUsCorePatient', () => {
    it('should validate a compliant US Core Patient', () => {
      const compliantPatient: FhirPatient = {
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
        identifier: [
          {
            system: 'http://hl7.org/fhir/sid/us-ssn',
            value: '123-45-6789'
          }
        ]
      };

      const result = validateUsCorePatient(compliantPatient);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields for US Core', () => {
      const nonCompliantPatient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123'
        // Missing required fields
      };

      const result = validateUsCorePatient(nonCompliantPatient);

      expect(result.valid).toBe(false);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('name'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('gender'))).toBe(true);
    });

    it('should validate US address format', () => {
      const patientWithUSAddress: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true,
        name: [
          {
            use: 'official',
            family: 'Smith',
            given: ['Jane']
          }
        ],
        gender: 'female',
        address: [
          {
            line: ['123 Main St'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US'
          }
        ]
      };

      const result = validateUsCorePatient(patientWithUSAddress);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUsCoreEncounter', () => {
    it('should validate a compliant US Core Encounter', () => {
      const compliantEncounter: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        },
        subject: {
          reference: 'Patient/patient-123',
          display: 'John Doe'
        }
      };

      const result = validateUsCoreEncounter(compliantEncounter);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUsCoreObservation', () => {
    it('should validate a compliant US Core Observation', () => {
      const compliantObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123',
          display: 'John Doe'
        },
        valueQuantity: {
          value: 175,
          unit: 'cm',
          system: 'http://unitsofmeasure.org',
          code: 'cm'
        }
      };

      const result = validateUsCoreObservation(compliantObservation);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate vital signs observations with LOINC coding', () => {
      const vitalSignsObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'observation-123',
        status: 'final',
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
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }
          ]
        },
        subject: {
          reference: 'Patient/patient-123'
        },
        valueQuantity: {
          value: 175,
          unit: 'cm'
        }
      };

      const result = validateUsCoreObservation(vitalSignsObservation);

      expect(result.valid).toBe(true);
      expect(result.profile).toBe('US_CORE');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUsCoreBundle', () => {
    it('should validate a complete US Core compliant bundle', () => {
      const bundle = {
        patient: {
          resourceType: 'Patient',
          id: 'patient-123',
          name: [
            {
              family: 'Doe',
              given: ['John']
            }
          ],
          gender: 'male'
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
            id: 'observation-123',
            status: 'final',
            code: {
              coding: [
                {
                  system: 'http://loinc.org',
                  code: '8302-2',
                  display: 'Body height'
                }
              ]
            },
            subject: {
              reference: 'Patient/patient-123'
            },
            valueQuantity: {
              value: 175,
              unit: 'cm'
            }
          } as FhirObservation
        ]
      };

      const result = validateUsCoreBundle(bundle);

      expect(result.overallValid).toBe(true);
      expect(result.patientValidation?.valid).toBe(true);
      expect(result.encounterValidation?.valid).toBe(true);
      expect(result.observationValidations?.[0].valid).toBe(true);
      expect(result.summary.totalResources).toBe(3);
      expect(result.summary.validResources).toBe(3);
    });
  });
});
