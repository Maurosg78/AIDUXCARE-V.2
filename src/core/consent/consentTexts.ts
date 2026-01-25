/**
 * Consent Texts Registry - Versioned Legal Texts
 * 
 * ✅ WO-CONSENT-VERBAL-01-LANG: Centralized text registry
 * 
 * Legal texts are NOT hardcoded in services or modals.
 * All references use textVersion.
 */

import type { ConsentTextVersion } from './consentLanguagePolicy';

export interface ConsentText {
  language: string;
  text: string;
  version: ConsentTextVersion;
}

/**
 * Registry of all consent texts by version
 */
export const CONSENT_TEXTS: Record<ConsentTextVersion, ConsentText> = {
  'v1-en-CA': {
    language: 'en-CA',
    version: 'v1-en-CA',
    text: `We will record our physiotherapy session to automatically generate 
medical notes using artificial intelligence.
The recording is securely stored on Canadian servers.
Do you authorize this recording and processing of your data?`,
  },
  'v1-en-US': {
    language: 'en-US',
    version: 'v1-en-US',
    text: `We will record our physiotherapy session to automatically generate 
medical notes using artificial intelligence.
The recording is securely stored on secure servers.
Do you authorize this recording and processing of your data?`,
  },
} as const;

/**
 * Get consent text by version
 */
export function getConsentText(version: ConsentTextVersion): ConsentText {
  return CONSENT_TEXTS[version];
}

/**
 * Get consent text string by version
 */
export function getConsentTextString(version: ConsentTextVersion): string {
  return CONSENT_TEXTS[version].text.trim();
}
