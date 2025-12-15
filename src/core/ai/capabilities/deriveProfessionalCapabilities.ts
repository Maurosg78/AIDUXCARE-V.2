/**
 * Professional Capability Contract
 * ================================
 * 
 * Derives professional capabilities from canonical onboarding profile.
 * Pure function (no side-effects) used to adjust prompt language and prioritization.
 * 
 * @see WO-PROMPT-CAPABILITY-AWARE-01
 */

import type { ProfessionalProfile } from '@/context/ProfessionalProfileContext';

export type SeniorityLevel = 'junior' | 'mid' | 'senior';
export type DomainFocus = 'msk' | 'neuro' | 'cardio' | 'general';
export type PracticeContext = 'clinic' | 'hospital' | 'unknown';
export type LanguageTone = 'guiding' | 'neutral' | 'terse';

export interface ProfessionalCapabilities {
  seniority: SeniorityLevel;
  domainFocus: DomainFocus;
  practiceContext: PracticeContext;
  languageTone: LanguageTone;
}

/**
 * Derives professional capabilities from canonical profile.
 * 
 * Rules:
 * - Seniority: <3 years = junior, 3-7 = mid, ≥8 = senior
 * - Domain: inferred from specialty (case-insensitive matching)
 * - Practice: inferred from workplace/clinic name
 * - Language: junior=guiding, mid=neutral, senior=terse
 * 
 * @param profile - Professional profile from Firestore (canonical source)
 * @returns Derived capabilities
 */
export function deriveProfessionalCapabilities(
  profile?: ProfessionalProfile | null
): ProfessionalCapabilities {
  // Default values (when profile is missing/incomplete)
  if (!profile) {
    return {
      seniority: 'mid',
      domainFocus: 'general',
      practiceContext: 'unknown',
      languageTone: 'neutral',
    };
  }

  // Derive seniority from experienceYears
  let seniority: SeniorityLevel = 'mid';
  const experienceYears = typeof profile.experienceYears === 'string'
    ? parseInt(profile.experienceYears, 10)
    : (profile.experienceYears ?? 0);
  
  if (!Number.isFinite(experienceYears) || experienceYears < 3) {
    seniority = 'junior';
  } else if (experienceYears >= 8) {
    seniority = 'senior';
  }

  // Derive domain focus from specialty (case-insensitive)
  let domainFocus: DomainFocus = 'general';
  const specialty = (profile.specialty || '').toLowerCase();
  
  if (specialty.includes('neuro')) {
    domainFocus = 'neuro';
  } else if (specialty.includes('cardio') || specialty.includes('cardiopulm') || specialty.includes('pulm')) {
    domainFocus = 'cardio';
  } else if (specialty.includes('msk') || specialty.includes('musculoskeletal') || specialty.includes('ortho')) {
    domainFocus = 'msk';
  }

  // Derive practice context from workplace/clinic
  let practiceContext: PracticeContext = 'unknown';
  const workplace = (profile.workplace || profile.clinic?.name || '').toLowerCase();
  
  if (workplace.includes('hospital') || workplace.includes('clinic')) {
    practiceContext = workplace.includes('hospital') ? 'hospital' : 'clinic';
  }

  // Derive language tone from seniority
  const languageTone: LanguageTone = 
    seniority === 'junior' ? 'guiding' :
    seniority === 'senior' ? 'terse' :
    'neutral';

  return {
    seniority,
    domainFocus,
    practiceContext,
    languageTone,
  };
}

