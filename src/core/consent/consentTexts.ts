/**
 * Consent Texts Registry - Versioned Legal Texts
 *
 * ✅ WO-CONSENT-VERBAL-01-LANG: Centralized text registry
 *
 * Legal texts are NOT hardcoded in services or modals.
 * All references use textVersion.
 *
 * v2-en-CA: CPO TRUST + IPC Ontario (Jan 28, 2026) compliant.
 * Covers: what AI scribe does, third-party processing, Canadian storage,
 * physiotherapist review, voluntary participation without care impact.
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
    text: `We will record our physiotherapy session to automatically generate medical notes using artificial intelligence. The recording is securely stored on nadian servers. Do you authorize this recording and processing of your data?`,
  },
  'v1-en-US': {
    language: 'en-US',
    version: 'v1-en-US',
    text: `We will record our physiotherapy session to automatically generate medical notes using artificial intelligence. The recording is securely stored on secure servers. Do you authorize this recording and processing of your data?`,
  },
  'v2-en-CA': {
    language: 'en-CA',
    version: 'v2-en-CA',
    text: `I use an AI tool to help me take notes during our session so I can focus on you instead of typing.

The session audio is processed by a secure third-party AI service and stored on Canadian servers. I always review and approve all notes before they become part of your record.

Your participation is completely voluntary. You can say no or change your mind at any time — this will not affect the quality of care you receive.

Do you consent to this?`,
  },
};

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
