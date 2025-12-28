/**
 * Onboarding Constants - Canonical Values
 * 
 * These values are used to normalize professional data for prompt capability-aware system
 * @see WO-PROMPT-CAPABILITY-AWARE-01
 */

export const PROFESSIONAL_TITLES = [
  { value: 'physio', label: 'Physiotherapist', code: 'physio' },
  { value: 'assistant', label: 'PT Assistant', code: 'assistant' },
  { value: 'chiropractor', label: 'Chiropractor', code: 'chiropractor' },
  { value: 'rmt', label: 'Registered Massage Therapist (RMT)', code: 'rmt' },
  { value: 'other', label: 'Other', code: 'other' },
] as const;

/**
 * Official Canadian Physiotherapy Specialties (CPO-aligned)
 * Based on recognized practice areas in Canada
 * Note: Sports is a subspecialty of MSK, not a primary specialty
 */
export const PRIMARY_SPECIALTIES = [
  { value: 'msk', label: 'Musculoskeletal (MSK)', code: 'msk' },
  { value: 'neuro', label: 'Neurological', code: 'neuro' },
  { value: 'cardio', label: 'Cardiorespiratory', code: 'cardio' },
  { value: 'pelvic', label: 'Pelvic Health', code: 'pelvic' },
  { value: 'geriatrics', label: 'Geriatrics', code: 'geriatrics' },
  { value: 'paediatrics', label: 'Paediatrics', code: 'paediatrics' },
  { value: 'general', label: 'General Practice', code: 'general' },
] as const;

/**
 * MSK Skills & Continuing Education Courses (CA-aligned)
 * Common certifications and training courses for MSK physiotherapists in Canada
 * These are used to personalize treatment plans based on clinician capabilities
 */
export const MSK_SKILLS = [
  { value: 'manual-therapy', label: 'Manual Therapy', code: 'manual-therapy' },
  { value: 'dry-needling', label: 'Dry Needling / IMS', code: 'dry-needling' },
  { value: 'k-tape', label: 'Kinesiotaping', code: 'k-tape' },
  { value: 'motor-control', label: 'Motor Control Training', code: 'motor-control' },
  { value: 'mckenzie', label: 'McKenzie Method', code: 'mckenzie' },
  { value: 'acupuncture', label: 'Acupuncture', code: 'acupuncture' },
  { value: 'mulligan', label: 'Mulligan Concept', code: 'mulligan' },
  { value: 'mckenzie-md', label: 'McKenzie MDT', code: 'mckenzie-md' },
  { value: 'pilates', label: 'Clinical Pilates', code: 'pilates' },
  { value: 'yoga-therapy', label: 'Yoga Therapy', code: 'yoga-therapy' },
  { value: 'strength-conditioning', label: 'Strength & Conditioning', code: 'strength-conditioning' },
  { value: 'sports-rehab', label: 'Sports Rehabilitation', code: 'sports-rehab' },
  { value: 'concussion', label: 'Concussion Management', code: 'concussion' },
  { value: 'vestibular', label: 'Vestibular Rehabilitation', code: 'vestibular' },
  { value: 'chronic-pain', label: 'Chronic Pain Management', code: 'chronic-pain' },
] as const;

/**
 * Subspecialties (legacy - kept for backward compatibility)
 * @deprecated Use MSK_SKILLS for MSK-related skills
 */
export const SUBSPECIALTIES = [
  { value: 'sports', label: 'Sports (MSK subspecialty)', code: 'sports', parent: 'msk' },
  { value: 'manual-therapy', label: 'Manual Therapy', code: 'manual-therapy', parent: 'msk' },
  { value: 'dry-needling', label: 'Dry Needling', code: 'dry-needling', parent: 'msk' },
  { value: 'motor-control', label: 'Motor Control', code: 'motor-control', parent: 'msk' },
  { value: 'return-to-sport', label: 'Return-to-Sport', code: 'return-to-sport', parent: 'msk' },
  { value: 'chronic-pain', label: 'Chronic Pain', code: 'chronic-pain', parent: 'msk' },
] as const;

export type ProfessionalTitleCode = typeof PROFESSIONAL_TITLES[number]['code'];
export type SpecialtyCode = typeof PRIMARY_SPECIALTIES[number]['code'];

