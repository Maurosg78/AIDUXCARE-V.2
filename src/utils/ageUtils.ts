/**
 * Consent gate criterion: under 18 years old.
 * Unknown age is never treated as adult for legal consent gating.
 */
export type AgeGateResult = 'adult' | 'minor' | 'unknown';

export type ConsentAgeValidationResult =
  | 'valid'
  | 'minor_requires_representative'
  | 'age_unknown_dob_required'
  | 'age_unknown_confirmation_required';

export const MINOR_GATE_CUTOFF_DATE = '2026-06-08T00:00:00.000Z';

export function getAgeGateStatus(
  dateOfBirth: string | null | undefined,
  birthDate: string | null | undefined
): AgeGateResult {
  const dobSource = dateOfBirth ?? birthDate;
  if (!dobSource) return 'unknown';

  const birth = new Date(dobSource);
  if (Number.isNaN(birth.getTime())) return 'unknown';

  const ageInMs = Date.now() - birth.getTime();
  const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);

  if (ageInYears < 18) return 'minor';
  return 'adult';
}

export function isMinorForConsentGate(
  dateOfBirth: string | null | undefined,
  birthDate?: string | null | undefined
): boolean {
  const status = getAgeGateStatus(dateOfBirth, birthDate);
  return status === 'minor';
}

export function isAgeUnknown(
  dateOfBirth: string | null | undefined,
  birthDate?: string | null | undefined
): boolean {
  return getAgeGateStatus(dateOfBirth, birthDate) === 'unknown';
}

export function validateConsentForAgeGate(
  dateOfBirth: string | null | undefined,
  birthDate: string | null | undefined,
  patientResponse: string | null | undefined,
  isLegacyPaperConsent = false
): ConsentAgeValidationResult {
  if (isLegacyPaperConsent) return 'valid';

  const ageStatus = getAgeGateStatus(dateOfBirth, birthDate);
  if (ageStatus === 'unknown') return 'age_unknown_dob_required';

  const hasRepresentativeConsent = patientResponse === 'authorized_by_representative';
  if (ageStatus === 'minor' && !hasRepresentativeConsent) {
    return 'minor_requires_representative';
  }

  return 'valid';
}

export function validateConsentForAgeGateWithLegacyPolicy(
  dateOfBirth: string | null | undefined,
  birthDate: string | null | undefined,
  patientResponse: string | null | undefined,
  patientCreatedAt: string | Date | null | undefined,
  adultConfirmedByClinicianAt: string | null | undefined,
  isLegacyPaperConsent = false
): ConsentAgeValidationResult {
  if (isLegacyPaperConsent) return 'valid';

  const ageStatus = getAgeGateStatus(dateOfBirth, birthDate);
  if (ageStatus !== 'unknown') {
    return validateConsentForAgeGate(dateOfBirth, birthDate, patientResponse, false);
  }

  const createdAtDate = parseDateLike(patientCreatedAt);
  const cutoffDate = new Date(MINOR_GATE_CUTOFF_DATE);
  const isExistingPatient = createdAtDate !== null && createdAtDate < cutoffDate;

  if (isExistingPatient) {
    if (adultConfirmedByClinicianAt) return 'valid';
    return 'age_unknown_confirmation_required';
  }

  return 'age_unknown_dob_required';
}

function parseDateLike(value: string | Date | null | undefined): Date | null {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}
