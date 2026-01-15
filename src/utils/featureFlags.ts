/**
 * Feature Flags by Practice Country
 * 
 * WO-12: Country-based feature gating for pilot
 * 
 * Rules:
 * - CA: Full features (SMS, compliance, AI suggestions)
 * - US/ES/CL: Core workflow only (no SMS, no compliance modules, no AI suggestions)
 */

export type PracticeCountry = 'CA' | 'US' | 'ES' | 'CL';

export interface FeatureFlags {
  smsConsentEnabled: boolean;
  complianceModulesEnabled: boolean;
  aiClinicalSuggestionsEnabled: boolean;
  analyticsEnabled: boolean;
  clinicalWorkflowEnabled: boolean;
  soapGenerationEnabled: boolean;
}

/**
 * Get feature flags based on practice country
 * 
 * @param practiceCountry - Country code from onboarding (CA, US, ES, CL)
 * @returns Feature flags configuration
 */
export function getFeatureFlags(practiceCountry: string | null | undefined): FeatureFlags {
  // Default to most restrictive if country not provided
  const country = (practiceCountry || '').toUpperCase() as PracticeCountry;
  
  // Canada: Full features
  if (country === 'CA') {
    return {
      smsConsentEnabled: true,
      complianceModulesEnabled: true,
      aiClinicalSuggestionsEnabled: true,
      analyticsEnabled: true,
      clinicalWorkflowEnabled: true,
      soapGenerationEnabled: true,
    };
  }
  
  // US, ES, CL: Core features only
  if (['US', 'ES', 'CL'].includes(country)) {
    return {
      smsConsentEnabled: false,
      complianceModulesEnabled: false,
      aiClinicalSuggestionsEnabled: false,
      analyticsEnabled: true,
      clinicalWorkflowEnabled: true,
      soapGenerationEnabled: true,
    };
  }
  
  // Unknown country: Default to restrictive
  return {
    smsConsentEnabled: false,
    complianceModulesEnabled: false,
    aiClinicalSuggestionsEnabled: false,
    analyticsEnabled: true,
    clinicalWorkflowEnabled: true,
    soapGenerationEnabled: true,
  };
}



