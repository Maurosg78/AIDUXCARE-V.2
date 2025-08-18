// import type { /* FhirResource, */ FhirPatient, FhirEncounter, FhirObservation } from '../types';
import type { ValidationResult, ValidationError, ValidationErrorType } from '../types/validation';

/**
 * Validates FHIR JSON structure and basic syntax
 */
export function validateFhirJson(
  jsonString: string,
  expectedResourceType?: 'Patient' | 'Encounter' | 'Observation' | 'Bundle'
): { isValid: boolean; errors: string[]; parsedData?: unknown } {
  const errors: string[] = [];
  
  // Basic JSON syntax validation
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    errors.push('Invalid JSON syntax');
    return { isValid: false, errors };
  }
  
  // Basic FHIR resource validation
  if (!parsedData || typeof parsedData !== 'object') {
    errors.push('Parsed data must be an object');
    return { isValid: false, errors };
  }
  
  if (!parsedData.resourceType) {
    errors.push('Missing required field: resourceType');
    return { isValid: false, errors };
  }
  
  if (typeof parsedData.resourceType !== 'string') {
    errors.push('resourceType must be a string');
    return { isValid: false, errors };
  }
  
  // Check if resourceType matches expected type
  if (expectedResourceType && parsedData.resourceType !== expectedResourceType) {
    errors.push(`Expected resourceType '${expectedResourceType}', got '${parsedData.resourceType}'`);
  }
  
  // Validate resourceType is a known FHIR resource
  const validResourceTypes = ['Patient', 'Encounter', 'Observation', 'Bundle', 'Organization', 'Practitioner'];
  if (!validResourceTypes.includes(parsedData.resourceType)) {
    errors.push(`Unknown resourceType: '${parsedData.resourceType}'`);
  }
  
  // Basic ID validation
  if (!parsedData.id) {
    errors.push('Missing required field: id');
  } else if (typeof parsedData.id !== 'string') {
    errors.push('id must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    parsedData: errors.length === 0 ? parsedData : undefined
  };
}

/**
 * Parses FHIR JSON and returns typed resource
 */
export function parseFhirResource<T extends FhirResource>(
  jsonString: string,
  resourceType: T['resourceType']
): { success: true; resource: T } | { success: false; errors: string[] } {
  const validation = validateFhirJson(jsonString);
  
  if (!validation.isValid) {
    return { success: false, errors: validation.errors };
  }
  
  const parsedData = validation.parsedData!;
  
  // Type guard validation
  if (parsedData.resourceType !== resourceType) {
    return { 
      success: false, 
      errors: [`Type mismatch: expected ${resourceType}, got ${parsedData.resourceType}`] 
    };
  }
  
  return { success: true, resource: parsedData as T };
}

/**
 * Validates FHIR JSON against specific profile requirements
 */
export function validateFhirProfile(
  jsonString: string,
  profile: 'ca-core' | 'us-core'
): ValidationResult {
  const validation = validateFhirJson(jsonString);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors,
      warnings: [],
      compliance: { caCore: false, usCore: false },
      timestamp: new Date().toISOString()
    };
  }
  
  const parsedData = validation.parsedData!;
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Profile-specific validation
  if (profile === 'ca-core') {
    const caCoreValidation = validateCaCoreProfile(parsedData);
    errors.push(...caCoreValidation.errors);
    warnings.push(...caCoreValidation.warnings);
  } else if (profile === 'us-core') {
    const usCoreValidation = validateUsCoreProfile(parsedData);
    errors.push(...usCoreValidation.errors);
    warnings.push(...usCoreValidation.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    compliance: {
      caCore: profile === 'ca-core' && errors.length === 0,
      usCore: profile === 'us-core' && errors.length === 0
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates resource against CA Core profile requirements
 */
function validateCaCoreProfile(resource: unknown): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // CA Core specific validation rules
  if (resource.resourceType === 'Patient') {
    if (!resource.identifier || resource.identifier.length === 0) {
      errors.push('CA Core Patient: At least one identifier is required');
    }
    
    if (!resource.name || resource.name.length === 0) {
      errors.push('CA Core Patient: At least one name is required');
    }
  }
  
  if (resource.resourceType === 'Encounter') {
    if (!resource.status) {
      errors.push('CA Core Encounter: Status is required');
    }
    
    if (!resource.class) {
      errors.push('CA Core Encounter: Class is required');
    }
  }
  
  if (resource.resourceType === 'Observation') {
    if (!resource.status) {
      errors.push('CA Core Observation: Status is required');
    }
    
    if (!resource.code) {
      errors.push('CA Core Observation: Code is required');
    }
  }
  
  return { errors, warnings };
}

/**
 * Validates resource against US Core profile requirements
 */
function validateUsCoreProfile(resource: unknown): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // US Core specific validation rules
  if (resource.resourceType === 'Patient') {
    if (!resource.birthDate) {
      errors.push('US Core Patient: Birth date is required');
    }
    
    if (!resource.identifier || resource.identifier.length === 0) {
      errors.push('US Core Patient: At least one identifier is required');
    }
  }
  
  if (resource.resourceType === 'Encounter') {
    if (!resource.status) {
      errors.push('US Core Encounter: Status is required');
    }
    
    if (!resource.subject) {
      errors.push('US Core Encounter: Subject reference is required');
    }
  }
  
  if (resource.resourceType === 'Observation') {
    if (!resource.status) {
      errors.push('US Core Observation: Status is required');
    }
    
    if (!resource.code) {
      errors.push('US Core Observation: Code is required');
    }
    
    if (!resource.subject) {
      errors.push('US Core Observation: Subject reference is required');
    }
  }
  
  return { errors, warnings };
}

/**
 * Creates a detailed validation error
 */
export function createValidationError(
  type: ValidationErrorType,
  field: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
  suggestion?: string,
  resourceId?: string,
  resourceType?: string
): ValidationError {
  return {
    type,
    field,
    message,
    severity,
    suggestion,
    resourceId,
    resourceType
  };
}

/**
 * Formats validation errors for human-readable output
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) {
    return 'No validation errors found.';
  }
  
  return errors.map(error => {
    let formatted = `[${error.severity.toUpperCase()}] ${error.field}: ${error.message}`;
    
    if (error.suggestion) {
      formatted += `\n  Suggestion: ${error.suggestion}`;
    }
    
    if (error.resourceId) {
      formatted += `\n  Resource ID: ${error.resourceId}`;
    }
    
    return formatted;
  }).join('\n\n');
}

/**
 * Checks if a JSON string contains valid FHIR data
 */
export function isFhirJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    if (!parsed.resourceType || typeof parsed.resourceType !== 'string') {
      return false;
    }
    if (!parsed.id || typeof parsed.id !== 'string') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts resource type from FHIR JSON string without full parsing
 */
export function getFhirResourceType(jsonString: string): string | null {
  try {
    // Quick regex to extract resourceType without full JSON parsing
    const match = jsonString.match(/"resourceType"\s*:\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
