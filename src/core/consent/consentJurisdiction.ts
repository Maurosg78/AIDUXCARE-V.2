/** Clinical jurisdiction identifier (e.g. CA-ON for PHIPA). */
export type ClinicalJurisdiction = string;

/**
 * Jurisdiction for consent (e.g. CA-ON for PHIPA). Used by consent flow and domain.
 */
export function getCurrentJurisdiction(): string {
  return 'CA-ON';
}
