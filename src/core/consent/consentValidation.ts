/**
 * Consent Validation - Centralized Language Validation
 * 
 * ✅ WO-CONSENT-VERBAL-01-LANG: Single validation point
 * 
 * No one validates language on their own.
 * The entire system depends on this.
 */

import type { ClinicalJurisdiction } from './consentJurisdiction';
import type { ConsentTextVersion } from './consentLanguagePolicy';
import { getLanguagePolicy } from './consentLanguagePolicy';
import { getConsentText } from './consentTexts';

/**
 * Check if a consent text version is allowed for a jurisdiction
 * 
 * This is the SINGLE validation point for language enforcement.
 */
export function isConsentTextAllowed(
  jurisdiction: ClinicalJurisdiction,
  textVersion: ConsentTextVersion
): boolean {
  const policy = getLanguagePolicy(jurisdiction);
  const textData = getConsentText(textVersion);
  const textLang = textData.language;
  
  return policy.allowedLanguages.includes(textLang);
}

/**
 * Validate consent record with jurisdiction enforcement
 * 
 * @param consentRecord - Consent record to validate
 * @param jurisdiction - Clinical jurisdiction
 * @returns true if consent is valid for the jurisdiction
 */
export function hasValidConsent(
  consentRecord: {
    textVersion?: string;
    status?: string;
    [key: string]: any;
  } | null | undefined,
  jurisdiction: ClinicalJurisdiction
): boolean {
  if (!consentRecord) return false;
  
  // Check if consent has required fields
  if (!consentRecord.textVersion || !consentRecord.status) {
    return false;
  }
  
  // Validate text version is allowed for jurisdiction
  if (!isConsentTextAllowed(jurisdiction, consentRecord.textVersion as ConsentTextVersion)) {
    console.warn('[ConsentValidation] Text version not allowed for jurisdiction:', {
      textVersion: consentRecord.textVersion,
      jurisdiction,
    });
    return false;
  }
  
  // Check status
  return consentRecord.status === 'active';
}
