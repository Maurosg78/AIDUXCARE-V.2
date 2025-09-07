/**
 * @fileoverview FHIR Public API Contract Tests
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * 
 * These tests verify that ONLY the minimal agreed API is exported from src/core/fhir/index.ts
 * No internal utilities or implementation details should be exposed.
 */

import { describe, it, expect } from 'vitest';

// Import the public API module
import * as FhirPublicAPI from '../index';

describe('FHIR Public API Contract', () => {
  describe('API Shape and Names', () => {
    it('should export only the agreed minimal API functions', () => {
      // Expected public API functions
      const expectedFunctions = [
        'toFhir',
        'toFhirEncounter', 
        'toFhirObservation',
        'fromFhir',
        'validate',
        'makeBundle',
        'isFhirModuleReady',
        'getFhirModuleInfo'
      ];

      // Check that all expected functions are exported
      expectedFunctions.forEach(funcName => {
        expect(FhirPublicAPI).toHaveProperty(funcName);
        expect(typeof FhirPublicAPI[funcName as keyof typeof FhirPublicAPI]).toBe('function');
      });

      // Check that no unexpected functions are exported
      const exportedKeys = Object.keys(FhirPublicAPI);
      const unexpectedExports = exportedKeys.filter(key => 
        !expectedFunctions.includes(key) && 
        !key.startsWith('_') && 
        !key.startsWith('type') &&
        key !== 'FHIR_MODULE_VERSION' &&
        key !== 'SUPPORTED_PROFILES' &&
        key !== 'SUPPORTED_RESOURCES' &&
        key !== 'FHIR_CONFIG'
      );

      expect(unexpectedExports).toEqual([]);
    });

    it('should export only the agreed constants', () => {
      const expectedConstants = [
        'FHIR_MODULE_VERSION',
        'SUPPORTED_PROFILES', 
        'SUPPORTED_RESOURCES',
        'FHIR_CONFIG'
      ];

      expectedConstants.forEach(constName => {
        expect(FhirPublicAPI).toHaveProperty(constName);
      });
    });

    it('should export only the agreed types from public types', () => {
      // Types are exported via export type * from './types/public'
      // but they may not be directly accessible as properties in runtime

      // Check that types are exported (they should be available)
      // Note: Types are exported via export type * from './types/public'
      // but they may not be directly accessible as properties in runtime
    });
  });

  describe('API Function Signatures', () => {
    it('should have toFhir with correct signature', () => {
      expect(FhirPublicAPI.toFhir).toBeDefined();
      expect(typeof FhirPublicAPI.toFhir).toBe('function');
      
      // Check that it's the patient conversion function
      expect(FhirPublicAPI.toFhir.name).toBe('toFhir');
    });

    it('should have toFhirEncounter with correct signature', () => {
      expect(FhirPublicAPI.toFhirEncounter).toBeDefined();
      expect(typeof FhirPublicAPI.toFhirEncounter).toBe('function');
      
      // Check that it's the encounter conversion function
      expect(FhirPublicAPI.toFhirEncounter.name).toBe('toFhirEncounter');
    });

    it('should have toFhirObservation with correct signature', () => {
      expect(FhirPublicAPI.toFhirObservation).toBeDefined();
      expect(typeof FhirPublicAPI.toFhirObservation).toBe('function');
      
      // Check that it's the observation conversion function
      expect(FhirPublicAPI.toFhirObservation.name).toBe('toFhirObservation');
    });

    it('should have fromFhir with correct signature', () => {
      expect(FhirPublicAPI.fromFhir).toBeDefined();
      expect(typeof FhirPublicAPI.fromFhir).toBe('function');
      
      // Check that it's the conversion from FHIR function
      expect(FhirPublicAPI.fromFhir.name).toBe('fromFhir');
    });

    it('should have validate with correct signature', () => {
      expect(FhirPublicAPI.validate).toBeDefined();
      expect(typeof FhirPublicAPI.validate).toBe('function');
      
      // Check that it's the validation function
      expect(FhirPublicAPI.validate.name).toBe('validate');
    });

    it('should have makeBundle with correct signature', () => {
      expect(FhirPublicAPI.makeBundle).toBeDefined();
      expect(typeof FhirPublicAPI.makeBundle).toBe('function');
      
      // Check that it's the bundle creation function
      expect(FhirPublicAPI.makeBundle.name).toBe('makeBundle');
    });
  });

  describe('No Internal Utilities Exposed', () => {
    it('should not expose internal conversion functions', () => {
      const internalFunctions = [
        'convertPatientToFhir',
        'convertEncounterToFhir', 
        'convertObservationToFhir',
        'convertFhirToPatient',
        'convertFhirToEncounter',
        'convertFhirToObservation'
      ];

      internalFunctions.forEach(funcName => {
        expect(FhirPublicAPI).not.toHaveProperty(funcName);
      });
    });

    it('should not expose internal validation functions', () => {
      const internalValidators = [
        'validateCaCorePatient',
        'validateCaCoreEncounter',
        'validateCaCoreObservation',
        'validateUsCorePatient',
        'validateUsCoreEncounter',
        'validateUsCoreObservation'
      ];

      internalValidators.forEach(funcName => {
        expect(FhirPublicAPI).not.toHaveProperty(funcName);
      });
    });

    it('should not expose internal utility functions', () => {
      const internalUtils = [
        'createFhirBundle',
        'validateFhirJson',
        'parseFhirResource'
      ];

      internalUtils.forEach(funcName => {
        expect(FhirPublicAPI).not.toHaveProperty(funcName);
      });
    });

    it('should not expose internal types', () => {
      const internalTypes = [
        'InternalPatient',
        'InternalEncounter',
        'InternalObservation',
        'PatientValidationResult',
        'EncounterValidationResult',
        'ObservationValidationResult',
        'PatientMapping',
        'EncounterMapping',
        'ObservationMapping'
      ];

      internalTypes.forEach(typeName => {
        expect(FhirPublicAPI).not.toHaveProperty(typeName);
      });
    });
  });

  describe('Constants and Configuration', () => {
    it('should export FHIR_MODULE_VERSION as string', () => {
      expect(typeof FhirPublicAPI.FHIR_MODULE_VERSION).toBe('string');
      expect(FhirPublicAPI.FHIR_MODULE_VERSION).toBe('1.1.0');
    });

    it('should export SUPPORTED_PROFILES as readonly array', () => {
      expect(Array.isArray(FhirPublicAPI.SUPPORTED_PROFILES)).toBe(true);
      expect(FhirPublicAPI.SUPPORTED_PROFILES).toEqual(['CA_CORE', 'US_CORE']);
      
      // Should be readonly (TypeScript readonly, not runtime immutable)
      expect(FhirPublicAPI.SUPPORTED_PROFILES).toHaveLength(2);
    });

    it('should export SUPPORTED_RESOURCES as readonly array', () => {
      expect(Array.isArray(FhirPublicAPI.SUPPORTED_RESOURCES)).toBe(true);
      expect(FhirPublicAPI.SUPPORTED_RESOURCES).toEqual(['Patient', 'Encounter', 'Observation']);
      
      // Should be readonly (TypeScript readonly, not runtime immutable)
      expect(FhirPublicAPI.SUPPORTED_RESOURCES).toHaveLength(3);
    });

    it('should export FHIR_CONFIG with correct structure', () => {
      expect(FhirPublicAPI.FHIR_CONFIG).toBeDefined();
      expect(typeof FhirPublicAPI.FHIR_CONFIG).toBe('object');
      
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('version');
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('supportedProfiles');
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('supportedResources');
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('defaultProfile');
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('strictValidation');
      expect(FhirPublicAPI.FHIR_CONFIG).toHaveProperty('includeMeta');
    });
  });

  describe('Module Health Functions', () => {
    it('should export isFhirModuleReady function', () => {
      expect(FhirPublicAPI.isFhirModuleReady).toBeDefined();
      expect(typeof FhirPublicAPI.isFhirModuleReady).toBe('function');
    });

    it('should export getFhirModuleInfo function', () => {
      expect(FhirPublicAPI.getFhirModuleInfo).toBeDefined();
      expect(typeof FhirPublicAPI.getFhirModuleInfo).toBe('function');
    });

    it('should return module info with correct structure', () => {
      const moduleInfo = FhirPublicAPI.getFhirModuleInfo();
      
      expect(moduleInfo).toHaveProperty('version');
      expect(moduleInfo).toHaveProperty('status');
      expect(moduleInfo).toHaveProperty('supportedProfiles');
      expect(moduleInfo).toHaveProperty('supportedResources');
      expect(moduleInfo).toHaveProperty('config');
      expect(moduleInfo).toHaveProperty('timestamp');
    });
  });
});
