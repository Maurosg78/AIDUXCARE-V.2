// @ts-nocheck
import type { 
  FhirBundle, 
  BundleEntry, 
  // BundleType, 
  ClinicalDataBundle,
  BundleOptions,
  BundleExportOptions
} from '../types/fhirBundle';
import type { FhirPatient, FhirEncounter, FhirObservation } from '../types';
import type { BundleValidationResult, ValidationOptions } from '../types/validation';

/**
 * Creates a FHIR Bundle from individual resources
 */
export function createFhirBundle(
  resources: Array<FhirPatient | FhirEncounter | FhirObservation>,
  options: BundleOptions = {}
): FhirBundle {
  const {
    type = 'collection',
    profile = 'ca-core',
    includeMeta = true
  } = options;

  const entries: BundleEntry[] = resources.map((resource) => ({
    fullUrl: `urn:uuid:${resource.id}`,
    resource,
    search: {
      mode: 'match',
      score: 1.0
    }
  }));

  const bundle: FhirBundle = {
    resourceType: 'Bundle',
    id: `bundle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    total: entries.length,
    entry: entries
  };

  if (includeMeta) {
    bundle.meta = {
      profile: [
        profile === 'ca-core' 
          ? 'http://hl7.org/fhir/StructureDefinition/ca-core-bundle'
          : 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-bundle',
        profile // Include the short profile name as well
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  return bundle;
}

/**
 * Creates a clinical data bundle with Patient, Encounter, and Observations
 */
export function createClinicalDataBundle(
  clinicalData: ClinicalDataBundle,
  options: BundleOptions = {}
): FhirBundle {
  const resources = [
    clinicalData.patient,
    clinicalData.encounter,
    ...clinicalData.observations
  ];

  return createFhirBundle(resources, {
    ...options,
    type: 'document'
  });
}

/**
 * Extracts resources from a FHIR Bundle
 */
export function extractBundleResources(bundle: FhirBundle): {
  patients: FhirPatient[];
  encounters: FhirEncounter[];
  observations: FhirObservation[];
  other: Array<FhirPatient | FhirEncounter | FhirObservation>;
} {
  const patients: FhirPatient[] = [];
  const encounters: FhirEncounter[] = [];
  const observations: FhirObservation[] = [];
  const other: Array<FhirPatient | FhirEncounter | FhirObservation> = [];

  bundle.entry.forEach((entry) => {
    const resource = entry.resource;
    
    switch (resource.resourceType) {
      case 'Patient':
        patients.push(resource as FhirPatient);
        break;
      case 'Encounter':
        encounters.push(resource as FhirEncounter);
        break;
      case 'Observation':
        observations.push(resource as FhirObservation);
        break;
      default:
        other.push(resource as FhirPatient | FhirEncounter | FhirObservation);
    }
  });

  return { patients, encounters, observations, other };
}

/**
 * Validates a FHIR Bundle structure and content
 */
export function validateFhirBundle(
  bundle: FhirBundle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: ValidationOptions = {}
): BundleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic bundle structure validation
  if (!bundle.resourceType || bundle.resourceType !== 'Bundle') {
    errors.push('Invalid resourceType: must be "Bundle"');
  }
  
  if (!bundle.type) {
    errors.push('Bundle type is required');
  }
  
  if (!bundle.entry || !Array.isArray(bundle.entry)) {
    errors.push('Bundle must contain entries array');
  }
  
  // const { profile, strictMode, includeWarnings, validateReferences } = options;

  // Validate each entry
  const resourceResults: BundleValidationResult['resourceResults'] = {};
  let totalResources = 0;
  // let validResources = 0;

  if (bundle.entry) {
    bundle.entry.forEach((entry, index) => {
      if (!entry.resource) {
        errors.push(`Entry ${index}: missing resource`);
        return;
      }

      const resourceType = entry.resource.resourceType;
      if (!resourceType) {
        errors.push(`Entry ${index}: resource missing resourceType`);
        return;
      }

      // Count resources by type
      if (!resourceResults[resourceType]) {
        resourceResults[resourceType] = { count: 0, valid: 0, errors: [] };
      }
      resourceResults[resourceType].count++;
      totalResources++;

      // Basic resource validation
      if (entry.resource.id) {
        resourceResults[resourceType].valid++;
        // validResources++;
      } else {
        resourceResults[resourceType].errors.push('Missing resource ID');
        errors.push(`Entry ${index}: ${resourceType} missing ID`); // Change warning to error
      }
    });
  }

  // Profile compliance check
  const profileCompliance = {
    caCore: { compliant: true, issues: [] },
    usCore: { compliant: true, issues: [] }
  };

  if (bundle.meta?.profile) {
    const profiles = Array.isArray(bundle.meta.profile) 
      ? bundle.meta.profile 
      : [bundle.meta.profile];
    
    if (!profiles.some(p => p.includes('ca-core'))) {
      profileCompliance.caCore.compliant = false;
      profileCompliance.caCore.issues.push('Missing CA Core profile');
    }
    
    if (!profiles.some(p => p.includes('us-core'))) {
      profileCompliance.usCore.compliant = false;
      profileCompliance.usCore.issues.push('Missing US Core profile');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    compliance: {
      caCore: profileCompliance.caCore.compliant,
      usCore: profileCompliance.usCore.compliant
    },
    timestamp: new Date().toISOString(),
    resourceCount: totalResources,
    resourceResults,
    profileCompliance
  };
}

/**
 * Converts a FHIR Bundle to a clinical data structure
 */
export function bundleToClinicalData(
  bundle: FhirBundle
): ClinicalDataBundle | null {
  const { patients, encounters, observations } = extractBundleResources(bundle);
  
  if (patients.length === 0 || encounters.length === 0) {
    return null;
  }

  return {
    patient: patients[0], // Assume first patient is primary
    encounter: encounters[0], // Assume first encounter is primary
    observations
  };
}

/**
 * Exports a FHIR Bundle with specific options
 */
export function exportFhirBundle(
  bundle: FhirBundle,
  options: BundleExportOptions = {}
): string {
  const {
    prettyPrint = true,
    includeNulls = false,
    profile = 'ca-core'
    // options
  } = options;

  // Add profile if not present
  if (!bundle.meta?.profile) {
    bundle.meta = {
      ...bundle.meta,
      profile: [
        profile === 'ca-core' 
          ? 'http://hl7.org/fhir/StructureDefinition/ca-core-bundle'
          : 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-bundle'
      ]
    };
  }

  // Filter out null values if requested
  const exportData = includeNulls ? bundle : removeNullValues(bundle);
  // const validResources = exportData;

  return prettyPrint 
    ? JSON.stringify(exportData, null, 2)
    : JSON.stringify(exportData);
}

/**
 * Removes null values from an object recursively
 */
function removeNullValues(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeNullValues(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }
  
  return obj;
}
