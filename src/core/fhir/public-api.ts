export * from './adapters';
export * from './validators';

export const SUPPORTED_RESOURCES = ['Patient', 'Encounter', 'Observation'] as const;

export const FHIR_CONFIG = {
  version: '4.0.1',
  defaultProfile: 'US_CORE',
  supportedProfiles: ['US_CORE', 'CA_CORE'],
  supportedResources: SUPPORTED_RESOURCES,
  profiles: ['US_CORE', 'CA_CORE']
};

export function isFhirModuleReady(): boolean {
  return true;
}

export function getFhirModuleInfo() {
  return {
    name: 'fhir-adapter',
    version: FHIR_CONFIG.version,
    profiles: FHIR_CONFIG.supportedProfiles,
    supportedResources: FHIR_CONFIG.supportedResources
  };
}

export function getModuleInfo() {
  return getFhirModuleInfo();
}

const FhirPublicAPI = {
  FHIR_CONFIG,
  SUPPORTED_RESOURCES,
  isFhirModuleReady,
  getFhirModuleInfo,
  getModuleInfo
};

export default FhirPublicAPI;
