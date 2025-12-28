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

export const PRIMARY_SPECIALTIES = [
  { value: 'msk', label: 'Musculoskeletal (MSK)', code: 'msk' },
  { value: 'neuro', label: 'Neurological', code: 'neuro' },
  { value: 'cardio', label: 'Cardiorespiratory', code: 'cardio' },
  { value: 'pelvic', label: 'Pelvic Health', code: 'pelvic' },
  { value: 'sports', label: 'Sports', code: 'sports' },
  { value: 'geriatrics', label: 'Geriatrics', code: 'geriatrics' },
  { value: 'paediatrics', label: 'Paediatrics', code: 'paediatrics' },
  { value: 'general', label: 'General Practice', code: 'general' },
] as const;

export type ProfessionalTitleCode = typeof PROFESSIONAL_TITLES[number]['code'];
export type SpecialtyCode = typeof PRIMARY_SPECIALTIES[number]['code'];

