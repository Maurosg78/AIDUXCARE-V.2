// @ts-nocheck
import { describe, it, expect } from 'vitest';

import {
  createFhirBundle,
  createClinicalDataBundle,
  extractBundleResources,
  validateFhirBundle,
  bundleToClinicalData,
  exportFhirBundle
} from '../utils/bundleUtils';
import {
  validateFhirJson,
  parseFhirResource,
  validateFhirProfile,
  createValidationError,
  formatValidationErrors,
  isFhirJson,
  getFhirResourceType
} from '../utils/jsonUtils';
import type { FhirPatient, FhirEncounter, FhirObservation } from '../types';

describe('FHIR Bundle Utils', () => {
  const mockPatient: FhirPatient = {
    resourceType: 'Patient',
    id: 'patient-123',
    identifier: [{ system: 'http://example.com/patients', value: '123' }],
    name: [{ use: 'official', text: 'John Doe' }],
    active: true
  };

  const mockEncounter: FhirEncounter = {
    resourceType: 'Encounter',
    id: 'encounter-456',
    status: 'finished',
    class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
    subject: { reference: 'Patient/patient-123' }
  };

  const mockObservation: FhirObservation = {
    resourceType: 'Observation',
    id: 'observation-789',
    status: 'final',
    code: { system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
    subject: { reference: 'Patient/patient-123' },
    valueQuantity: { value: 72, unit: 'beats/min', system: 'http://unitsofmeasure.org', code: '/min' }
  };

  describe('createFhirBundle', () => {
    it('should create a basic FHIR bundle', () => {
      const bundle = createFhirBundle([mockPatient, mockEncounter, mockObservation]);
      
      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');
      expect(bundle.entry).toHaveLength(3);
      expect(bundle.total).toBe(3);
    });

    it('should create bundle with custom options', () => {
      const bundle = createFhirBundle([mockPatient], {
        type: 'document',
        profile: 'us-core',
        includeMeta: true
      });
      
      expect(bundle.type).toBe('document');
      expect(bundle.meta?.profile).toContain('us-core');
    });

    it('should generate unique bundle IDs', () => {
      const bundle1 = createFhirBundle([mockPatient]);
      const bundle2 = createFhirBundle([mockPatient]);
      
      expect(bundle1.id).not.toBe(bundle2.id);
    });
  });

  describe('createClinicalDataBundle', () => {
    it('should create clinical data bundle', () => {
      const clinicalData = {
        patient: mockPatient,
        encounter: mockEncounter,
        observations: [mockObservation]
      };
      
      const bundle = createClinicalDataBundle(clinicalData);
      
      expect(bundle.type).toBe('document');
      expect(bundle.entry).toHaveLength(3);
    });
  });

  describe('extractBundleResources', () => {
    it('should extract resources by type', () => {
      const bundle = createFhirBundle([mockPatient, mockEncounter, mockObservation]);
      const extracted = extractBundleResources(bundle);
      
      expect(extracted.patients).toHaveLength(1);
      expect(extracted.encounters).toHaveLength(1);
      expect(extracted.observations).toHaveLength(1);
      expect(extracted.other).toHaveLength(0);
    });
  });

  describe('validateFhirBundle', () => {
    it('should validate valid bundle', () => {
      const bundle = createFhirBundle([mockPatient, mockEncounter]);
      const result = validateFhirBundle(bundle);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid bundle structure', () => {
      const invalidBundle = {
        resourceType: 'Bundle',
        id: 'invalid-bundle'
        // Missing required fields
      };
      
      const result = validateFhirBundle(invalidBundle as unknown as FhirBundle);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bundle type is required');
    });

    it('should validate bundle entries', () => {
      const bundleWithInvalidEntry = {
        resourceType: 'Bundle',
        id: 'test-bundle',
        type: 'collection',
        entry: [
          { resource: mockPatient },
          { resource: { ...mockEncounter, id: undefined } } // Missing ID
        ]
      };
      
      const result = validateFhirBundle(bundleWithInvalidEntry as unknown as FhirBundle);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Entry 1: Encounter missing ID');
    });
  });

  describe('bundleToClinicalData', () => {
    it('should convert valid bundle to clinical data', () => {
      const bundle = createClinicalDataBundle({
        patient: mockPatient,
        encounter: mockEncounter,
        observations: [mockObservation]
      });
      
      const clinicalData = bundleToClinicalData(bundle);
      
      expect(clinicalData).not.toBeNull();
      expect(clinicalData?.patient.id).toBe('patient-123');
      expect(clinicalData?.encounter.id).toBe('encounter-456');
      expect(clinicalData?.observations).toHaveLength(1);
    });

    it('should return null for incomplete bundle', () => {
      const incompleteBundle = createFhirBundle([mockPatient]); // Missing encounter
      const clinicalData = bundleToClinicalData(incompleteBundle);
      
      expect(clinicalData).toBeNull();
    });
  });

  describe('exportFhirBundle', () => {
    it('should export bundle as JSON string', () => {
      const bundle = createFhirBundle([mockPatient]);
      const exported = exportFhirBundle(bundle, { prettyPrint: false });
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('"resourceType":"Bundle"');
    });

    it('should respect export options', () => {
      const bundle = createFhirBundle([mockPatient]);
      const exported = exportFhirBundle(bundle, { prettyPrint: false });
      
      expect(exported).not.toContain('\n');
    });
  });
});

describe('FHIR JSON Utils', () => {
  const validPatientJson = JSON.stringify({
    resourceType: 'Patient',
    id: 'patient-123',
    name: [{ text: 'John Doe' }]
  });

  const invalidJson = '{ invalid json }';
  const wrongTypeJson = JSON.stringify({
    resourceType: 'Encounter',
    id: 'encounter-123'
  });

  describe('validateFhirJson', () => {
    it('should validate valid FHIR JSON', () => {
      const result = validateFhirJson(validPatientJson);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.parsedData).toBeDefined();
    });

    it('should detect invalid JSON syntax', () => {
      const result = validateFhirJson(invalidJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid JSON syntax');
    });

    it('should validate expected resource type', () => {
      const result = validateFhirJson(validPatientJson, 'Patient');
      
      expect(result.isValid).toBe(true);
    });

    it('should detect resource type mismatch', () => {
      const result = validateFhirJson(wrongTypeJson, 'Patient');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Expected resourceType 'Patient', got 'Encounter'");
    });

    it('should validate required fields', () => {
      const incompleteJson = JSON.stringify({
        resourceType: 'Patient'
        // Missing id
      });
      
      const result = validateFhirJson(incompleteJson);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });
  });

  describe('parseFhirResource', () => {
    it('should parse valid Patient resource', () => {
      const result = parseFhirResource(validPatientJson, 'Patient');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.resource.resourceType).toBe('Patient');
        expect(result.resource.id).toBe('patient-123');
      }
    });

    it('should handle parsing errors', () => {
      const result = parseFhirResource(invalidJson, 'Patient');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid JSON syntax');
    });

    it('should handle type mismatch', () => {
      const result = parseFhirResource(wrongTypeJson, 'Patient');
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Type mismatch: expected Patient, got Encounter');
    });
  });

  describe('validateFhirProfile', () => {
    it('should validate CA Core profile', () => {
      const result = validateFhirProfile(validPatientJson, 'ca-core');
      
      expect(result.compliance.caCore).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should validate US Core profile', () => {
      const result = validateFhirProfile(validPatientJson, 'us-core');
      
      expect(result.compliance.usCore).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle invalid JSON in profile validation', () => {
      const result = validateFhirProfile(invalidJson, 'ca-core');
      
      expect(result.isValid).toBe(false);
      expect(result.compliance.caCore).toBe(false);
      expect(result.compliance.usCore).toBe(false);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with all fields', () => {
      const error = createValidationError(
        'missing_required_field',
        'name',
        'Name is required',
        'error',
        'Add at least one name',
        'patient-123',
        'Patient'
      );
      
      expect(error.type).toBe('missing_required_field');
      expect(error.field).toBe('name');
      expect(error.message).toBe('Name is required');
      expect(error.severity).toBe('error');
      expect(error.suggestion).toBe('Add at least one name');
      expect(error.resourceId).toBe('patient-123');
      expect(error.resourceType).toBe('Patient');
    });
  });

  describe('formatValidationErrors', () => {
    it('should format single error', () => {
      const errors = [
        createValidationError('missing_required_field', 'name', 'Name is required')
      ];
      
      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toContain('[ERROR] name: Name is required');
    });

    it('should format multiple errors', () => {
      const errors = [
        createValidationError('missing_required_field', 'name', 'Name is required'),
        createValidationError('missing_required_field', 'id', 'ID is required')
      ];
      
      const formatted = formatValidationErrors(errors);
      
      expect(formatted).toContain('name: Name is required');
      expect(formatted).toContain('id: ID is required');
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      
      expect(formatted).toBe('No validation errors found.');
    });
  });

  describe('isFhirJson', () => {
    it('should return true for valid FHIR JSON', () => {
      expect(isFhirJson(validPatientJson)).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isFhirJson(invalidJson)).toBe(false);
    });

    it('should return false for non-FHIR JSON', () => {
      const nonFhirJson = JSON.stringify({ name: 'John', age: 30 });
      expect(isFhirJson(nonFhirJson)).toBe(false);
    });
  });

  describe('getFhirResourceType', () => {
    it('should extract resource type from valid JSON', () => {
      const resourceType = getFhirResourceType(validPatientJson);
      
      expect(resourceType).toBe('Patient');
    });

    it('should return null for invalid JSON', () => {
      const resourceType = getFhirResourceType(invalidJson);
      
      expect(resourceType).toBeNull();
    });

    it('should handle JSON without resourceType', () => {
      const noResourceTypeJson = JSON.stringify({ id: '123', name: 'John' });
      const resourceType = getFhirResourceType(noResourceTypeJson);
      
      expect(resourceType).toBeNull();
    });
  });
});
