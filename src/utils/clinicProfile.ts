import type { ProfessionalProfile } from "@/context/ProfessionalProfileContext";

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
  const salutation = profile?.preferredSalutation?.trim();
  const lastNamePreferred = profile?.lastNamePreferred?.trim();
  if (salutation && lastNamePreferred) return `${salutation} ${lastNamePreferred}`.trim();

  const fullName = profile?.fullName?.trim();
  if (fullName) return fullName;

  const displayName = profile?.displayName?.trim();
  if (displayName) return displayName;

  const userDisplayName = user?.displayName?.trim();
  if (userDisplayName) return userDisplayName;

  const profileEmail = profile?.email?.trim();
  if (profileEmail && profileEmail.includes("@")) return profileEmail.split("@")[0] || "Your physiotherapist";

  const userEmail = user?.email?.trim();
  if (userEmail && userEmail.includes("@")) return userEmail.split("@")[0] || "Your physiotherapist";

  return "Your physiotherapist";
};
