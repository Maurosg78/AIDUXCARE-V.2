/**
 * Consent Language Policy - Centralized Language Enforcement
 * 
 * ✅ WO-CONSENT-VERBAL-01-LANG: Multi-jurisdiction language policy
 */

import type { ClinicalJurisdiction } from './consentJurisdiction';

export type ConsentTextVersion = 'v1-en-CA' | 'v1-en-US';

export interface LanguagePolicy {
  allowedLanguages: readonly string[];
  strict: boolean; // If true, blocks non-allowed languages
}

/**
 * Language policy by jurisdiction
 * 
 * - CA-ON: Strict en-CA only
 * - ES/CL: Allow English (en-CA, en-US) for pilot
 */
export const CONSENT_LANGUAGE_POLICY: Record<ClinicalJurisdiction, LanguagePolicy> = {
  'CA-ON': {
    allowedLanguages: ['en-CA'],
    strict: true,
  },
  'ES': {
    allowedLanguages: ['en-CA', 'en-US'],
    strict: false,
  },
  'CL': {
    allowedLanguages: ['en-CA', 'en-US'],
    strict: false,
  },
} as const;

/**
 * Get language policy for a jurisdiction
 */
export function getLanguagePolicy(jurisdiction: ClinicalJurisdiction): LanguagePolicy {
  return CONSENT_LANGUAGE_POLICY[jurisdiction];
}
