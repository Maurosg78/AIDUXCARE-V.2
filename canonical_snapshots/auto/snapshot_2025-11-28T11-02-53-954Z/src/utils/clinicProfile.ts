import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

/**
 * Returns the clinic name configured for the professional profile.
 * Falls back to workplace name or default AiduxCare Clinic.
 */
export const deriveClinicName = (profile?: ProfessionalProfile | null): string => {
  const clinicName = profile?.clinic?.name?.trim();
  const workplaceName = profile?.workplace?.trim();

  if (clinicName) {
    return clinicName;
  }

  if (workplaceName) {
    return workplaceName;
  }

  return 'AiduxCare Clinic';
};

/**
 * Returns the display name for the physiotherapist based on the profile or auth user.
 */
export const deriveClinicianDisplayName = (
  profile?: ProfessionalProfile | null,
  user?: { displayName?: string | null; email?: string | null }
): string => {
  if (profile?.preferredSalutation && profile?.lastNamePreferred) {
    return `${profile.preferredSalutation} ${profile.lastNamePreferred}`.trim();
  }

  if (profile?.fullName?.trim()) {
    return profile.fullName.trim();
  }

  if (profile?.displayName?.trim()) {
    return profile.displayName.trim();
  }

  if (user?.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (profile?.email) {
    return profile.email.split('@')[0] || 'Dr. Smith';
  }

  if (user?.email) {
    return user.email.split('@')[0] || 'Dr. Smith';
  }

  return 'Dr. Smith';
};

