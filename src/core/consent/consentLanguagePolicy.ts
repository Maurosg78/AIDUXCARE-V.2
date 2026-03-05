/**
 * Consent text version / language policy. Used by VerbalConsentModal.
 */
export type ConsentTextVersion = string;

export interface LanguagePolicy {
  allowedLanguages: string[];
}

/**
 * Get language policy for a jurisdiction (e.g. which consent languages are allowed).
 */
export function getLanguagePolicy(_jurisdiction: string): LanguagePolicy {
  return { allowedLanguages: ['en', 'fr'] };
}
