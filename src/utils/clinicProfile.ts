import type { ProfessionalProfile } from "@/context/ProfessionalProfileContext";

/** WO-PILOT-FIX-01: Map profession to display title (e.g. Physiotherapist → PT.) */
export const PROFESSION_TO_TITLE: Record<string, string> = {
  Physiotherapist: 'PT.',
  'Physical Therapist': 'PT.',
  Chiropractor: 'Dr.',
  'Occupational Therapist': 'OT.',
  'Speech Therapist': 'SLP.',
  'Registered Nurse': 'RN',
  'Nurse Practitioner': 'NP',
  Other: '',
};

/** WO-PILOT-FIX-01: Get display title from profession. */
export function professionToDisplayTitle(profile?: ProfessionalProfile | null): string {
  const profession = profile?.profession?.trim() || profile?.professionalTitle?.trim();
  if (!profession) return '';
  return PROFESSION_TO_TITLE[profession] ?? '';
}

/**
 * Returns the clinic name configured for the professional profile.
 * Falls back to workplace name or default AiduxCare Clinic.
 */
export const deriveClinicName = (profile?: ProfessionalProfile | null): string => {
  const clinicName = profile?.clinic?.name?.trim();
  const workplaceName = profile?.workplace?.trim();

  if (clinicName) return clinicName;
  if (workplaceName) return workplaceName;

  return "AiduxCare Clinic";
};

/**
 * Returns the display name for the physiotherapist based on the profile or auth user.
 * IMPORTANT: Never returns a fake person name (pilot-safe).
 */
export const deriveClinicianDisplayName = (
  profile?: ProfessionalProfile | null,
  user?: { displayName?: string | null; email?: string | null }
): string => {
  const title = professionToDisplayTitle(profile);
  const salutation = profile?.preferredSalutation?.trim();
  const lastNamePreferred = profile?.lastNamePreferred?.trim();
  if (salutation && lastNamePreferred) {
    const name = `${salutation} ${lastNamePreferred}`.trim();
    return title ? `${title} ${name}` : name;
  }

  const fullName = profile?.fullName?.trim();
  if (fullName) return title ? `${title} ${fullName}` : fullName;

  const displayName = profile?.displayName?.trim();
  if (displayName) return title ? `${title} ${displayName}` : displayName;

  const userDisplayName = user?.displayName?.trim();
  if (userDisplayName) return title ? `${title} ${userDisplayName}` : userDisplayName;

  const profileEmail = profile?.email?.trim();
  if (profileEmail && profileEmail.includes("@")) {
    const name = profileEmail.split("@")[0] || "Your physiotherapist";
    return title ? `${title} ${name}` : name;
  }

  const userEmail = user?.email?.trim();
  if (userEmail && userEmail.includes("@")) {
    const name = userEmail.split("@")[0] || "Your physiotherapist";
    return title ? `${title} ${name}` : name;
  }

  return "Your physiotherapist";
};
