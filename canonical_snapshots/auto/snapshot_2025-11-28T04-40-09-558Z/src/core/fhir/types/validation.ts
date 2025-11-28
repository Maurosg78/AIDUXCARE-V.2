// @ts-nocheck
// import type { FhirResource } from './fhirPatient';

/**
 * Base validation result interface for all FHIR resources
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: {
    caCore: boolean;
    usCore: boolean;
  };
  timestamp: string;
}

/**
 * Bundle validation result for multiple FHIR resources
 */
export interface BundleValidationResult extends ValidationResult {
  resourceCount: number;
  resourceResults: {
    [resourceType: string]: {
      count: number;
      valid: number;
      errors: string[];
    };
  };
  profileCompliance: {
    caCore: {
      compliant: boolean;
      issues: string[];
    };
    usCore: {
      compliant: boolean;
      issues: string[];
    };
  };
}

/**
 * Validation error types for better error categorization
 */
export type ValidationErrorType = 
  | 'missing_required_field'
  | 'invalid_field_value'
  | 'unsupported_profile'
  | 'invalid_reference'
  | 'missing_identifier'
  | 'invalid_code_system'
  | 'profile_violation'
  | 'structural_error';

/**
 * Detailed validation error with context
 */
export interface ValidationError {
  type: ValidationErrorType;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestion?: string;
  resourceId?: string;
  resourceType?: string;
}

/**
 * Enhanced validation result with detailed errors
 */
export interface DetailedValidationResult extends ValidationResult {
  detailedErrors: ValidationError[];
  fieldValidation: {
    [fieldPath: string]: {
      valid: boolean;
      errors: ValidationError[];
    };
  };
}

/**
 * Profile-specific validation options
 */
export interface ValidationOptions {
  profile?: 'ca-core' | 'us-core' | 'both';
  strictMode?: boolean;
  includeWarnings?: boolean;
  validateReferences?: boolean;
  customRules?: Array<{
    field: string;
    rule: (value: unknown) => boolean;
    message: string;
  }>;
}

/**
 * Validation context for better error reporting
 */
export interface ValidationContext {
  source: 'import' | 'export' | 'api' | 'manual';
  timestamp: string;
  userId?: string;
  sessionId?: string;
  operation: 'validate' | 'convert' | 'bundle';
  options: ValidationOptions;
}
