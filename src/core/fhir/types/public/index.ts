// @ts-nocheck
/**
 * @fileoverview FHIR Public Types - Stable API Contract
 * @version 1.0.0
 * @author AiDuxCare Development Team
 * @compliance FHIR R4 + CA Core + US Core
 * 
 * This file contains ONLY the stable types that form part of the external API contract.
 * Internal types and implementation details are NOT exposed here.
 */

// Core FHIR Resource Types
export type {
  FhirResource,
  FhirPatient,
  FhirEncounter,
  FhirObservation
} from '../index';

// Validation Result Types
export type {
  ValidationResult,
  BundleValidationResult,
  ValidationError,
  ValidationOptions
} from '../validation';

// Bundle Types
export type {
  FhirBundle,
  BundleEntry,
  BundleType
} from '../fhirBundle';

// Constants
export { VITAL_SIGNS_CODES } from '../fhirObservation';
export { FHIR_CONSTANTS } from '../index';

// Public API Types
export interface FhirConversionOptions {
  profile: 'CA_CORE' | 'US_CORE';
  includeMeta?: boolean;
  strictValidation?: boolean;
}

export interface FhirValidationOptions {
  profile: 'CA_CORE' | 'US_CORE';
  strictMode?: boolean;
  includeWarnings?: boolean;
}

export interface FhirBundleOptions {
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  profile: 'CA_CORE' | 'US_CORE';
  includeMeta?: boolean;
}

// Public API Function Signatures
export interface FhirPublicAPI {
  // Conversion functions
  toFhir: {
    patient: (patient: unknown, options: FhirConversionOptions) => unknown;
    encounter: (encounter: unknown, options: FhirConversionOptions) => unknown;
    observation: (observation: unknown, options: FhirConversionOptions) => unknown;
  };
  
  // Conversion from FHIR
  fromFhir: {
    patient: (resource: unknown) => unknown;
    encounter: (resource: unknown) => unknown;
    observation: (resource: unknown) => unknown;
  };
  
  // Validation functions
  validate: (resource: unknown, profile: 'CA_CORE' | 'US_CORE') => ValidationResult;
  
  // Bundle operations
  makeBundle: (entries: unknown[], profile: 'CA_CORE' | 'US_CORE') => FhirBundle;
}
