/**
 * Consent gate criterion: under 18 years old.
 * Independent from requiresRepresentativeConsent(), which models jurisdiction-specific rules.
 */
export function isMinorForConsentGate(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false;

  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  const age =
    today.getFullYear() -
    birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);

  return age < 18;
}
