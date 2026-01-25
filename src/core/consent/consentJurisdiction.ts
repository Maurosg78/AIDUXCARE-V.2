/**
 * Clinical Jurisdiction - Single Source of Truth
 * 
 * The system does not decide by user country, it decides by active clinical jurisdiction.
 * 
 * ✅ WO-CONSENT-VERBAL-01-LANG: Multi-jurisdiction support
 */

export type ClinicalJurisdiction = 'CA-ON' | 'ES' | 'CL';

/**
 * Current clinical jurisdiction
 * 
 * This should come from:
 * - Environment config
 * - Tenant configuration
 * - Explicit variable (NOT IP, NOT locale)
 * 
 * Default: CA-ON (Canada Ontario)
 */
export const CURRENT_JURISDICTION: ClinicalJurisdiction = 
  (import.meta.env.VITE_CLINICAL_JURISDICTION as ClinicalJurisdiction) || 'CA-ON';

/**
 * Get current jurisdiction
 */
export function getCurrentJurisdiction(): ClinicalJurisdiction {
  return CURRENT_JURISDICTION;
}
