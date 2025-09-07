// @ts-nocheck
import type { FhirResource, FhirPatient, FhirEncounter, FhirObservation } from './index';

/**
 * FHIR Bundle resource types
 */
export type BundleType = 
  | 'document' 
  | 'message' 
  | 'transaction' 
  | 'transaction-response' 
  | 'batch' 
  | 'batch-response' 
  | 'history' 
  | 'searchset' 
  | 'collection';

/**
 * FHIR Bundle entry
 */
export interface BundleEntry {
  fullUrl?: string;
  resource: FhirResource;
  request?: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: FhirResource;
  };
  search?: {
    mode?: 'match' | 'include' | 'outcome';
    score?: number;
  };
}

/**
 * FHIR Bundle resource
 */
export interface FhirBundle extends FhirResource {
  resourceType: 'Bundle';
  type: BundleType;
  total?: number;
  link?: Array<{
    relation: string;
    url: string;
  }>;
  entry: BundleEntry[];
}

/**
 * Clinical data bundle containing Patient, Encounter, and Observations
 */
export interface ClinicalDataBundle {
  patient: FhirPatient;
  encounter: FhirEncounter;
  observations: FhirObservation[];
}

/**
 * Bundle validation result
 */
export interface BundleValidationResult {
  isValid: boolean;
  isCaCoreCompliant: boolean;
  isUsCoreCompliant: boolean;
  errors: string[];
  warnings: string[];
  resourceResults: {
    patient?: {
      isValid: boolean;
      isCaCoreCompliant: boolean;
      isUsCoreCompliant: boolean;
      errors: string[];
      warnings: string[];
    };
    encounter?: {
      isValid: boolean;
      isCaCoreCompliant: boolean;
      isUsCoreCompliant: boolean;
      errors: string[];
      warnings: string[];
    };
    observations?: Array<{
      isValid: boolean;
      isCaCoreCompliant: boolean;
      isUsCoreCompliant: boolean;
      errors: string[];
      warnings: string[];
    }>;
  };
  summary: {
    totalResources: number;
    validResources: number;
    invalidResources: number;
    caCoreCompliantResources: number;
    usCoreCompliantResources: number;
  };
}

/**
 * Bundle creation options
 */
export interface BundleOptions {
  type?: BundleType;
  includeMeta?: boolean;
  profile?: 'ca-core' | 'us-core';
  validateOnCreate?: boolean;
}

/**
 * Bundle export options
 */
export interface BundleExportOptions {
  format?: 'json' | 'xml';
  pretty?: boolean;
  includeValidation?: boolean;
  profile?: 'ca-core' | 'us-core';
}
