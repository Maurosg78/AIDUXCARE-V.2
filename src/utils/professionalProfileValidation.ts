/**
 * Professional Profile Validation Utilities
 * 
 * Functions to validate and check professional profile completeness
 */

import type { ProfessionalProfile } from '../context/ProfessionalProfileContext';

/**
 * Check if a professional profile is ready for use
 * 
 * A profile is considered "ready" if:
 * - It has registrationStatus === 'complete', OR
 * - It has basic professional data (specialty + professionalTitle)
 * 
 * @param profile - The professional profile to check
 * @returns true if the profile is ready, false otherwise
 */
export function isProfessionalProfileReady(
  profile: ProfessionalProfile | null | undefined
): boolean {
  if (!profile) {
    return false;
  }

  // Check if profile has registrationStatus === 'complete'
  if (profile.registrationStatus === 'complete') {
    return true;
  }

  // Check if profile has basic professional data (for legacy profiles)
  const hasSpecialty = profile.specialty && profile.specialty.trim() !== '';
  const hasProfessionalTitle = profile.professionalTitle && profile.professionalTitle.trim() !== '';

  if (hasSpecialty && hasProfessionalTitle) {
    return true;
  }

  // Profile is not ready
  return false;
}

