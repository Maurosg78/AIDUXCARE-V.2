// @ts-nocheck
import { describe, it, expect } from 'vitest';

import type { 
  FhirResource, 
  FhirPatient, 
  FhirEncounter, 
  FhirObservation,
  VitalSignsObservation 
} from '../types';

describe('FHIR Types - Basic Structure', () => {
  describe('FhirResource', () => {
    it('should have required base properties', () => {
      const baseResource: FhirResource = {
        resourceType: 'Patient',
        id: 'test-123'
      };

      expect(baseResource.resourceType).toBe('Patient');
      expect(baseResource.id).toBe('test-123');
      expect(baseResource.meta).toBeUndefined();
    });

    it('should support optional meta property', () => {
      const resourceWithMeta: FhirResource = {
        resourceType: 'Patient',
        id: 'test-123',
        meta: {
          versionId: '1',
          lastUpdated: '2025-01-20T10:00:00Z'
        }
      };

      expect(resourceWithMeta.meta?.versionId).toBe('1');
      expect(resourceWithMeta.meta?.lastUpdated).toBe('2025-01-20T10:00:00Z');
    });
  });

  describe('FhirPatient', () => {
    it('should have correct resourceType', () => {
      const patient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-123',
        active: true
      };

      expect(patient.resourceType).toBe('Patient');
      expect(patient.active).toBe(true);
    });

    it('should support all optional patient fields', () => {
      const fullPatient: FhirPatient = {
        resourceType: 'Patient',
        id: 'patient-full',
        identifier: [
          {
            system: 'http://hl7.org/fhir/sid/us-ssn',
            value: '123-45-6789'
          }
        ],
        active: true,
        name: [
          {
            use: 'official',
            family: 'Doe',
            given: ['John']
          }
        ],
        telecom: [
          {
            system: 'phone',
            value: '+1-555-123-4567',
            use: 'home'
          }
        ],
        gender: 'male',
        birthDate: '1990-01-01',
        address: [
          {
            use: 'home',
            type: 'physical',
            text: '123 Main St, Anytown, ST 12345',
            line: ['123 Main St'],
            city: 'Anytown',
            state: 'ST',
            postalCode: '12345',
            country: 'US'
          }
        ]
      };

      expect(fullPatient.identifier).toHaveLength(1);
      expect(fullPatient.name).toHaveLength(1);
      expect(fullPatient.telecom).toHaveLength(1);
      expect(fullPatient.address).toHaveLength(1);
      expect(fullPatient.gender).toBe('male');
      expect(fullPatient.birthDate).toBe('1990-01-01');
    });
  });

  describe('FhirEncounter', () => {
    it('should have correct resourceType and required fields', () => {
      const encounter: FhirEncounter = {
        resourceType: 'Encounter',
        id: 'encounter-123',
        status: 'finished',
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'AMB',
          display: 'Ambulatory'
        }
      };

      expect(encounter.resourceType).toBe('Encounter');
      expect(encounter.status).toBe('finished');
      expect(encounter.class.code).toBe('AMB');
    });

    it('should support all encounter status values', () => {
      const validStatuses: FhirEncounter['status'][] = [
        'planned', 'arrived', 'triaged', 'in-progress',
        'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'
      ];

      validStatuses.forEach(status => {
        const encounter: FhirEncounter = {
          resourceType: 'Encounter',
          id: 'test',
          status,
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'Ambulatory'
          }
        };
        expect(encounter.status).toBe(status);
      });
    });
  });

  describe('FhirObservation', () => {
    it('should have correct resourceType and required fields', () => {
      const observation: FhirObservation = {
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
        }
      };

      expect(observation.resourceType).toBe('Observation');
      expect(observation.status).toBe('final');
      expect(observation.code.coding[0].code).toBe('8867-4');
    });

    it('should support valueQuantity for numeric observations', () => {
      const bpObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'bp-123',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel'
            }
          ]
        },
        valueQuantity: {
          value: 120,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]'
        }
      };

      expect(bpObservation.valueQuantity?.value).toBe(120);
      expect(bpObservation.valueQuantity?.unit).toBe('mmHg');
    });

    it('should support valueString for text observations', () => {
      const textObservation: FhirObservation = {
        resourceType: 'Observation',
        id: 'text-123',
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
        valueString: 'Moderate pain in lower back'
      };

      expect(textObservation.valueString).toBe('Moderate pain in lower back');
    });
  });

  describe('VitalSignsObservation', () => {
    it('should extend FhirObservation with vital signs specific fields', () => {
      const vitalSign: VitalSignsObservation = {
        resourceType: 'Observation',
        id: 'vital-123',
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
        valueQuantity: {
          value: 72,
          unit: 'beats/min',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        }
      };

      expect(vitalSign.category[0].coding[0].code).toBe('vital-signs');
      expect(vitalSign.valueQuantity?.value).toBe(72);
    });
  });
});
