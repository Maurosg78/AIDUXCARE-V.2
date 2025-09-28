// @ts-nocheck
/**
 * FHIR Integration Module for AiDuxCare
 * 
 * This module provides lightweight FHIR R4 integration with support for:
 * - CA Core (Canada) compliance
 * - US Core (USA) compliance
 * - Patient, Encounter, and Observation resources
 * - Bidirectional data conversion (internal ↔ FHIR)
 * - Validation against regional standards
 * 
 * @module fhir
 * @version 1.1.0
 * @public-api
 */

// Import all required functions statically
import {
  convertPatientToFhir,
  convertEncounterToFhir,
  convertObservationToFhir,
  type InternalPatient,
  type InternalEncounter,
  type InternalObservation
} from './adapters/internalToFhir';
import {
  convertFhirToPatient,
  convertFhirToEncounter,
  convertFhirToObservation
} from './adapters/fhirToInternal';
import {
  validateCaCorePatient,
  validateCaCoreEncounter,
  validateCaCoreObservation
} from './validators/caCoreValidator';
import {
  validateUsCorePatient,
  validateUsCoreEncounter,
  validateUsCoreObservation
} from './validators/usCoreValidator';
import { createFhirBundle } from './utils/bundleUtils';
import type { FhirPatient, FhirEncounter, FhirObservation } from './types';

import logger from '@/shared/utils/logger';

// Export public types from the public types directory
export type * from './types/public';

// Export constants
export const FHIR_MODULE_VERSION = '1.1.0';
export const SUPPORTED_PROFILES = ['CA_CORE', 'US_CORE'] as const;
export const SUPPORTED_RESOURCES = ['Patient', 'Encounter', 'Observation'] as const;

/**
 * Main FHIR module configuration
 */
export const FHIR_CONFIG = {
  version: FHIR_MODULE_VERSION,
  supportedProfiles: SUPPORTED_PROFILES,
  supportedResources: SUPPORTED_RESOURCES,
  defaultProfile: 'US_CORE' as const,
  strictValidation: true,
  includeMeta: true
} as const;

/**
 * Public API Functions - Stable Contract
 */

/**
 * Convert internal patient data to FHIR format
 * @param patient Internal patient data
 * @param options Conversion options including profile
 * @returns FHIR Patient resource
 */
export function toFhir(patient: InternalPatient, options: { profile: 'CA_CORE' | 'US_CORE' }) {
  const profile = options.profile === 'CA_CORE' ? 'ca-core' : 'us-core';
  const fhirPatient = convertPatientToFhir(patient, { profile });
  
  // Validate automatically and fail if validation fails
  const validationResult = validate(fhirPatient, options.profile);
  if (!validationResult.isValid) {
    throw new Error(`Patient validation failed for ${options.profile}: ${validationResult.errors.join(', ')}`);
  }
  
  return fhirPatient;
}

/**
 * Convert internal encounter data to FHIR format
 * @param encounter Internal encounter data
 * @param options Conversion options including profile
 * @returns FHIR Encounter resource
 */
export function toFhirEncounter(encounter: InternalEncounter, options: { profile: 'CA_CORE' | 'US_CORE' }) {
  const profile = options.profile === 'CA_CORE' ? 'ca-core' : 'us-core';
  const fhirEncounter = convertEncounterToFhir(encounter, { profile });
  
  // Validate automatically and fail if validation fails
  const validationResult = validate(fhirEncounter, options.profile);
  if (!validationResult.isValid) {
    throw new Error(`Encounter validation failed for ${options.profile}: ${validationResult.errors.join(', ')}`);
  }
  
  return fhirEncounter;
}

/**
 * Convert internal observation data to FHIR format
 * @param observation Internal observation data
 * @param options Conversion options including profile
 * @returns FHIR Observation resource
 */
export function toFhirObservation(observation: InternalObservation, options: { profile: 'CA_CORE' | 'US_CORE' }) {
  const profile = options.profile === 'CA_CORE' ? 'ca-core' : 'us-core';
  const fhirObservation = convertObservationToFhir(observation, { profile });
  
  // Validate automatically and fail if validation fails
  const validationResult = validate(fhirObservation, options.profile);
  if (!validationResult.isValid) {
    throw new Error(`Observation validation failed for ${options.profile}: ${validationResult.errors.join(', ')}`);
  }
  
  return fhirObservation;
}

/**
 * Convert FHIR resource to internal format
 * @param resource FHIR resource
 * @returns Internal data format
 */
export function fromFhir(resource: FhirPatient | FhirEncounter | FhirObservation) {
  if (resource && typeof resource === 'object' && 'resourceType' in resource) {
    switch (resource.resourceType) {
      case 'Patient':
        return convertFhirToPatient(resource as FhirPatient);
      case 'Encounter':
        return convertFhirToEncounter(resource as FhirEncounter);
      case 'Observation':
        return convertFhirToObservation(resource as FhirObservation);
      default:
        throw new Error(`Unsupported resource type: ${resource.resourceType}`);
    }
  }
  
  throw new Error('Invalid FHIR resource');
}

/**
 * Validate FHIR resource against specified profile
 * @param resource FHIR resource to validate
 * @param profile Profile to validate against
 * @returns Validation result
 */
export function validate(resource: FhirPatient | FhirEncounter | FhirObservation, profile: 'CA_CORE' | 'US_CORE') {
  if (!resource || typeof resource !== 'object' || !('resourceType' in resource)) {
    return {
      isValid: false,
      errors: ['Invalid resource format'],
      warnings: [],
      compliance: { caCore: false, usCore: false },
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    const resourceType = (resource as Record<string, unknown>).resourceType as string;
    
    if (profile === 'CA_CORE') {
      if (resourceType === 'Patient') {
        const result = validateCaCorePatient(resource as FhirPatient);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: result.valid, usCore: false },
          timestamp: new Date().toISOString()
        };
      } else if (resourceType === 'Encounter') {
        const result = validateCaCoreEncounter(resource as FhirEncounter);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: result.valid, usCore: false },
          timestamp: new Date().toISOString()
        };
      } else if (resourceType === 'Observation') {
        const result = validateCaCoreObservation(resource as FhirObservation);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: result.valid, usCore: false },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          isValid: false,
          errors: [`Unsupported resource type for CA Core: ${resourceType}`],
          warnings: [],
          compliance: { caCore: false, usCore: false },
          timestamp: new Date().toISOString()
        };
      }
    } else if (profile === 'US_CORE') {
      if (resourceType === 'Patient') {
        const result = validateUsCorePatient(resource as FhirPatient);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: false, usCore: result.valid },
          timestamp: new Date().toISOString()
        };
      } else if (resourceType === 'Encounter') {
        const result = validateUsCoreEncounter(resource as FhirEncounter);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: false, usCore: result.valid },
          timestamp: new Date().toISOString()
        };
      } else if (resourceType === 'Observation') {
        const result = validateUsCoreObservation(resource as FhirObservation);
        return {
          isValid: result.valid,
          errors: result.errors.map(e => e.message),
          warnings: [],
          compliance: { caCore: false, usCore: result.valid },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          isValid: false,
          errors: [`Unsupported resource type for US Core: ${resourceType}`],
          warnings: [],
          compliance: { caCore: false, usCore: false },
          timestamp: new Date().toISOString()
        };
      }
    }
    
    throw new Error(`Unsupported profile: ${profile}`);
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      compliance: { caCore: false, usCore: false },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Create FHIR bundle with specified entries and profile
 * @param entries Array of FHIR resources
 * @param profile Profile to use for bundle
 * @returns FHIR Bundle resource
 */
export function makeBundle(entries: (FhirPatient | FhirEncounter | FhirObservation)[], profile: 'CA_CORE' | 'US_CORE') {
  // Validate all entries before creating bundle
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const validationResult = validate(entry, profile);
    if (!validationResult.isValid) {
      throw new Error(`Bundle entry ${i} validation failed for ${profile}: ${validationResult.errors.join(', ')}`);
    }
  }
  
  const profileLower = profile === 'CA_CORE' ? 'ca-core' : 'us-core';
  return createFhirBundle(entries, {
    type: 'document',
    profile: profileLower,
    includeMeta: true
  });
}

/**
 * Check if the FHIR module is properly configured
 * @returns true if the module is ready for use
 */
export function isFhirModuleReady(): boolean {
  try {
    // Basic validation that core components are available
    const testPatient: FhirPatient = {
      resourceType: 'Patient',
      id: 'test'
    };
    
    // Test basic validation
    const result = validate(testPatient, 'US_CORE');
    
    return result.isValid;
  } catch (error) {
    console.warn('FHIR module validation failed:', error);
    return false;
  }
}

/**
 * Get module information and status
 * @returns object with module details and health status
 */
export function getFhirModuleInfo() {
  return {
    version: FHIR_MODULE_VERSION,
    status: isFhirModuleReady() ? 'ready' : 'error',
    supportedProfiles: SUPPORTED_PROFILES,
    supportedResources: SUPPORTED_RESOURCES,
    config: FHIR_CONFIG,
    timestamp: new Date().toISOString()
  };
}