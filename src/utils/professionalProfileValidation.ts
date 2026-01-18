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

/**
 * WO-13: Check if a professional profile is complete according to pilot requirements
 * 
 * Single source of truth for profile completeness in pilot mode.
 * A profile is considered "complete" if it has:
 * - firstName
 * - professionalTitle (or profession)
 * - specialty
 * - practiceCountry (or country as fallback)
 * - pilotConsent?.accepted === true
 * 
 * This criterion must be used consistently throughout the app for routing decisions.
 * 
 * @param profile - The professional profile to check
 * @returns true if the profile is complete, false otherwise
 */
export function isProfileComplete(
  profile: ProfessionalProfile | null | undefined
): boolean {
  if (!profile) {
    return false;
  }

  // Extract firstName from fullName or displayName if not directly available
  const firstName = profile.fullName?.split(' ')[0] || 
                    profile.displayName?.split(' ')[0] || 
                    '';
  
  const hasFirstName = firstName.trim() !== '';
  
  // professionalTitle can be in professionalTitle or profession field
  const hasProfessionalTitle = !!(
    (profile.professionalTitle && profile.professionalTitle.trim() !== '') ||
    (profile.profession && profile.profession.trim() !== '')
  );
  
  const hasSpecialty = !!(profile.specialty && profile.specialty.trim() !== '');
  
  // practiceCountry with fallback to country
  const practiceCountry = profile.practiceCountry || profile.country || '';
  const hasPracticeCountry = practiceCountry.trim() !== '';
  
  // pilotConsent is required and must be accepted
  const hasPilotConsent = profile.pilotConsent?.accepted === true;

  return hasFirstName && 
         hasProfessionalTitle && 
         hasSpecialty && 
         hasPracticeCountry && 
         hasPilotConsent;
}