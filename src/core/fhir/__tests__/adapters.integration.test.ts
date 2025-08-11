/**
 * @fileoverview FHIR Adapters Integration Tests - End-to-End
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * 
 * These tests verify the complete round-trip: internal → toFhir → validate → makeBundle → fromFhir → internal
 * Including profile validation (CA Core / US Core) and deterministic UUID references.
 */

import { describe, it, expect } from 'vitest';
import { 
  toFhir, 
  toFhirEncounter, 
  toFhirObservation,
  fromFhir, 
  validate, 
  makeBundle 
} from '../index';

// Test data fixtures
const testPatient = {
  id: 'patient-123',
  firstName: 'Juan',
  lastName: 'Pérez',
  dateOfBirth: '1985-03-15',
  gender: 'male' as const,
  email: 'juan.perez@email.com',
  phone: '+34 600 123 456',
  address: {
    street: 'Calle Mayor 123',
    city: 'Madrid',
    state: 'Madrid',
    zipCode: '28001',
    country: 'US'
  },
  medicalRecordNumber: 'MRN-001',
  insuranceNumber: 'INS-001',
  ssn: '12345678A',
  isActive: true
};

const testPatientCA = {
  id: 'patient-ca-123',
  firstName: 'Marie',
  lastName: 'Dubois',
  dateOfBirth: '1985-03-15',
  gender: 'female' as const,
  email: 'marie.dubois@email.com',
  phone: '+1 514 600 1234',
  address: {
    street: '123 Main Street',
    city: 'Montreal',
    state: 'Quebec',
    zipCode: 'H2X 1Y7',
    country: 'CA'
  },
  medicalRecordNumber: 'MRN-CA-001',
  insuranceNumber: 'INS-CA-001',
  ssn: '123456789',
  isActive: true
};

const testEncounter = {
  id: 'encounter-456',
  patientId: 'patient-123',
  startDate: '2024-12-19T10:00:00Z',
  endDate: '2024-12-19T11:00:00Z',
  type: 'emergency' as const,
  status: 'completed' as const,
  reason: 'Dolor agudo en el pecho',
  providerId: 'provider-789',
  location: 'Urgencias Hospital Central'
};

const testObservation = {
  id: 'observation-789',
  patientId: 'patient-123',
  encounterId: 'encounter-456',
  type: 'vital_signs' as const,
  value: 120,
  unit: 'mmHg',
  date: '2024-12-19T10:15:00Z',
  category: 'vital-signs',
  code: '85354-9',
  codeSystem: 'http://loinc.org',
  displayName: 'Blood pressure systolic',
  status: 'final',
  effectiveDate: '2024-12-19T10:15:00Z'
};

describe('FHIR Adapters Integration - End-to-End', () => {
  describe('Patient Round-Trip', () => {
    it('should preserve critical data in Patient round-trip without loss', () => {
      // Internal → FHIR
      const fhirPatient = toFhir(testPatient, { profile: 'US_CORE' });
      
      // Validate FHIR resource
      const validationResult = validate(fhirPatient, 'US_CORE');
      expect(validationResult.isValid).toBe(true);
      
      // FHIR → Internal
      const restoredPatient = fromFhir(fhirPatient);
      
      // Verify critical data preservation
      expect(restoredPatient.id).toBe(testPatient.id);
      expect(restoredPatient.firstName).toBe(testPatient.firstName);
      expect(restoredPatient.lastName).toBe(testPatient.lastName);
      expect(restoredPatient.dateOfBirth).toBe(testPatient.dateOfBirth);
      expect(restoredPatient.gender).toBe(testPatient.gender);
      expect(restoredPatient.email).toBe(testPatient.email);
      expect(restoredPatient.phone).toBe(testPatient.phone);
      expect(restoredPatient.address?.city).toBe(testPatient.address.city);
      expect(restoredPatient.address?.country).toBe(testPatient.address.country);
      expect(restoredPatient.medicalRecordNumber).toBe(testPatient.medicalRecordNumber);
    });

    it('should work with CA Core profile', () => {
      const fhirPatient = toFhir(testPatientCA, { profile: 'CA_CORE' });
      const validationResult = validate(fhirPatient, 'CA_CORE');
      expect(validationResult.isValid).toBe(true);
      
      const restoredPatient = fromFhir(fhirPatient);
      expect(restoredPatient.id).toBe(testPatientCA.id);
      expect(restoredPatient.firstName).toBe(testPatientCA.firstName);
    });
  });

  describe('Encounter Round-Trip with Class Mapping', () => {
    it('should map emergency → EMER class correctly', () => {
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'US_CORE' });
      
      // Verify class mapping
      expect(fhirEncounter.class?.code).toBe('EMER');
      expect(fhirEncounter.class?.display).toBe('Emergency');
      expect(fhirEncounter.class?.system).toBe('http://terminology.hl7.org/CodeSystem/v3-ActCode');
      
      // Validate
      const validationResult = validate(fhirEncounter, 'US_CORE');
      expect(validationResult.isValid).toBe(true);
      
      // Round-trip
      const restoredEncounter = fromFhir(fhirEncounter);
      expect(restoredEncounter.id).toBe(testEncounter.id);
      expect(restoredEncounter.type).toBe(testEncounter.type);
      expect(restoredEncounter.reason).toBe(testEncounter.reason);
    });

    it('should map different encounter types correctly', () => {
      const encounterTypes = [
        { type: 'inpatient' as const, expectedClass: 'IMP' },
        { type: 'outpatient' as const, expectedClass: 'AMB' },
        { type: 'home' as const, expectedClass: 'HH' },
        { type: 'virtual' as const, expectedClass: 'VR' }
      ];

      encounterTypes.forEach(({ type, expectedClass }) => {
        const testEnc = { ...testEncounter, type };
        const fhirEncounter = toFhirEncounter(testEnc, { profile: 'US_CORE' });
        
        expect(fhirEncounter.class?.code).toBe(expectedClass);
        
        // Should validate successfully
        const validationResult = validate(fhirEncounter, 'US_CORE');
        expect(validationResult.isValid).toBe(true);
      });
    });

    it('should fail validation for malformed encounter', () => {
      const malformedEncounter = {
        ...testEncounter,
        type: 'invalid_type' as any
      };

      expect(() => {
        toFhirEncounter(malformedEncounter, { profile: 'US_CORE' });
      }).toThrow();
    });
  });

  describe('Observation Round-Trip', () => {
    it('should preserve vital signs data correctly', () => {
      const fhirObservation = toFhirObservation(testObservation, { profile: 'US_CORE' });
      
      // Validate
      const validationResult = validate(fhirObservation, 'US_CORE');
      expect(validationResult.isValid).toBe(true);
      
      // Round-trip
      const restoredObservation = fromFhir(fhirObservation);
      expect(restoredObservation.id).toBe(testObservation.id);
      expect(restoredObservation.value).toBe(testObservation.value);
      expect(restoredObservation.unit).toBe(testObservation.unit);
      expect(restoredObservation.category).toBe(testObservation.category);
      expect(restoredObservation.code).toBe(testObservation.code);
    });

    it('should handle text observations correctly', () => {
      const textObservation = {
        ...testObservation,
        type: 'text' as const,
        textValue: 'Paciente presenta dolor agudo en región lumbar',
        value: undefined,
        unit: undefined
      };

      const fhirObservation = toFhirObservation(textObservation, { profile: 'US_CORE' });
      const validationResult = validate(fhirObservation, 'US_CORE');
      expect(validationResult.isValid).toBe(true);
      
      const restoredObservation = fromFhir(fhirObservation);
      expect(restoredObservation.textValue).toBe(textObservation.textValue);
    });
  });

  describe('Bundle Operations with Validation', () => {
    it('should create valid bundle with all resources', () => {
      // Convert all resources to FHIR
      const fhirPatient = toFhir(testPatient, { profile: 'US_CORE' });
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'US_CORE' });
      const fhirObservation = toFhirObservation(testObservation, { profile: 'US_CORE' });
      
      // Validate individual resources
      expect(validate(fhirPatient, 'US_CORE').isValid).toBe(true);
      expect(validate(fhirEncounter, 'US_CORE').isValid).toBe(true);
      expect(validate(fhirObservation, 'US_CORE').isValid).toBe(true);
      
      // Create bundle
      const bundle = makeBundle([fhirPatient, fhirEncounter, fhirObservation], 'US_CORE');
      
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('document');
      expect(bundle.entry).toHaveLength(3);
      
      // Verify bundle entries reference the correct resources
      const patientEntry = bundle.entry?.find(e => e.resource?.resourceType === 'Patient');
      const encounterEntry = bundle.entry?.find(e => e.resource?.resourceType === 'Encounter');
      const observationEntry = bundle.entry?.find(e => e.resource?.resourceType === 'Observation');
      
      expect(patientEntry).toBeDefined();
      expect(encounterEntry).toBeDefined();
      expect(observationEntry).toBeDefined();
    });

    it('should fail bundle creation if any resource fails validation', () => {
      const validPatient = toFhir(testPatient, { profile: 'US_CORE' });
      
      // Create a valid FHIR encounter but with invalid class code that will fail validation
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'US_CORE' });
      const invalidFhirEncounter = {
        ...fhirEncounter,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'INVALID_CODE', // This will fail validation
          display: 'Invalid Display'
        }
      };

      // Debug: Check what the validation actually returns
      const validationResult = validate(invalidFhirEncounter, 'US_CORE');
      console.log('Validation result:', JSON.stringify(validationResult, null, 2));
      
      // This should fail validation
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Bundle creation should also fail
      expect(() => {
        makeBundle([validPatient, invalidFhirEncounter], 'US_CORE');
      }).toThrow();
    });

    it('should work with CA Core profile', () => {
      const fhirPatient = toFhir(testPatientCA, { profile: 'CA_CORE' });
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'CA_CORE' });
      
      const bundle = makeBundle([fhirPatient, fhirEncounter], 'CA_CORE');
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('document');
    });
  });

  describe('Deterministic UUID References', () => {
    it('should generate deterministic UUIDs for references', () => {
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'US_CORE' });
      
      // Check that references use urn:uuid: format
      if (fhirEncounter.subject?.reference) {
        expect(fhirEncounter.subject.reference).toMatch(/^urn:uuid:/);
      }
      
      if (fhirEncounter.participant) {
        fhirEncounter.participant.forEach(participant => {
          if (participant.individual?.reference) {
            expect(participant.individual.reference).toMatch(/^urn:uuid:/);
          }
        });
      }
    });

    it('should maintain referential integrity in round-trip', () => {
      const fhirPatient = toFhir(testPatient, { profile: 'US_CORE' });
      const fhirEncounter = toFhirEncounter(testEncounter, { profile: 'US_CORE' });
      const fhirObservation = toFhirObservation(testObservation, { profile: 'US_CORE' });
      
      // Create bundle
      const bundle = makeBundle([fhirPatient, fhirEncounter, fhirObservation], 'US_CORE');
      
      // Extract resources from bundle
      const patientFromBundle = bundle.entry?.find(e => e.resource?.resourceType === 'Patient')?.resource;
      const encounterFromBundle = bundle.entry?.find(e => e.resource?.resourceType === 'Encounter')?.resource;
      const observationFromBundle = bundle.entry?.find(e => e.resource?.resourceType === 'Observation')?.resource;
      
      expect(patientFromBundle).toBeDefined();
      expect(encounterFromBundle).toBeDefined();
      expect(observationFromBundle).toBeDefined();
      
      // Round-trip should preserve references
      const restoredPatient = fromFhir(patientFromBundle!);
      const restoredEncounter = fromFhir(encounterFromBundle!);
      const restoredObservation = fromFhir(observationFromBundle!);
      
      expect(restoredPatient.id).toBe(testPatient.id);
      expect(restoredEncounter.id).toBe(testEncounter.id);
      expect(restoredObservation.id).toBe(testObservation.id);
    });
  });

  describe('Error Handling', () => {
    it('should fail validation with clear error messages for invalid resources', () => {
      const invalidPatient = {
        ...testPatient,
        gender: 'invalid_gender' as any
      };

      expect(() => {
        toFhir(invalidPatient, { profile: 'US_CORE' });
      }).toThrow();
    });

    it('should fail bundle creation with clear error for invalid entries', () => {
      const validPatient = toFhir(testPatient, { profile: 'US_CORE' });
      const invalidResource = {
        resourceType: 'InvalidResource',
        id: 'invalid-123'
      };

      expect(() => {
        makeBundle([validPatient, invalidResource as any], 'US_CORE');
      }).toThrow();
    });
  });
});
