/**
 * Treatment Modalities Categorization
 * 
 * WO-003: Categorize physical treatment modalities correctly as in-clinic vs home-based.
 * Physical modalities (ultrasound, TENS, laser, shockwave) require clinic equipment
 * and cannot be performed at home by patients.
 * 
 * @compliance PHIPA compliant, ISO 27001 auditable
 */

/**
 * Physical modalities that require in-clinic equipment
 * Patients cannot perform these at home
 */
export const CLINIC_MODALITIES = [
  // Electrical modalities
  'ultrasound',
  'therapeutic_ultrasound',
  'us',
  'us therapy',
  'tens',
  'transcutaneous_electrical_nerve_stimulation',
  'ems',
  'electrical_muscle_stimulation',
  'interferential_current',
  'ifc',
  'electrotherapy',
  'electrical_stimulation',
  
  // Light/Energy modalities
  'laser',
  'laser_therapy',
  'cold_laser',
  'lllt',
  'low_level_laser_therapy',
  'infrared',
  'infrared_light',
  'ir_light',
  'ir_therapy',
  
  // Mechanical modalities
  'shockwave',
  'shockwave_therapy',
  'extracorporeal_shockwave',
  'eswt',
  'tecar',
  'tecar_therapy',
  'diathermy',
  
  // Manual techniques (clinic-only)
  'dry_needling',
  'cupping',
  'cupping_therapy',
  'acupuncture',
  'manual_therapy',
  'mobilization',
  'manipulation',
  'soft_tissue',
  
  // Thermal modalities (clinic-only)
  'hot_pack',
  'moist_heat',
  'cryotherapy',
  'ice_pack',
  
  // WO-MODALITY-CLINIC-001: additional electrotherapy terms
  'nmes',
  'photobiomodulation',
  'mcconnell',
  'transcutaneous',
  
  // Other clinic-only
  'traction',
  'mechanical_traction',
  'taping',
  'kinesio_taping',
  'kinesiotaping',
  'gait_training',
  'supervised',
];

/**
 * Exercises that patients can perform at home
 */
export const HOME_EXERCISES = [
  'stretching',
  'stretch',
  'stretches',
  'strengthening',
  'strength',
  'range_of_motion',
  'rom',
  'rom_exercises',
  'balance',
  'balance_training',
  'proprioception',
  'proprioceptive',
  'cardiovascular',
  'cardio',
  'walking',
  'cycling',
  'swimming',
  'postural',
  'postural_exercises',
  'core_strengthening',
  'core',
  'functional_training',
  'functional_exercises',
  'home_exercise',
  'home_exercises',
  'exercise_program',
  'therapeutic_exercise',
];

/**
 * Determine if a treatment modality is clinic-only or home-based
 * 
 * @param modalityName - Name of the treatment modality or exercise
 * @returns 'clinic' if requires clinic equipment, 'home' if can be done at home, 'unknown' if unclear
 */
export const categorizeTreatmentModality = (
  modalityName: string
): 'clinic' | 'home' | 'unknown' => {
  if (!modalityName || typeof modalityName !== 'string') {
    return 'unknown';
  }
  
  const normalized = modalityName.toLowerCase().trim();
  
  // Check clinic modalities first (more specific)
  if (CLINIC_MODALITIES.some(mod => normalized.includes(mod))) {
    return 'clinic';
  }
  
  // Check home exercises
  if (HOME_EXERCISES.some(ex => normalized.includes(ex))) {
    return 'home';
  }
  
  // Unknown - default to clinic for safety (better to overestimate clinic time)
  // This ensures modalities that require equipment are not missed
  return 'unknown';
};

/**
 * Filter out clinic modalities from a list of exercises/treatments
 * Used to ensure clinic-only modalities don't end up in home exercises
 * 
 * @param items - Array of treatment/exercise names
 * @returns Filtered array with only home exercises
 */
export const filterHomeExercises = (items: string[]): string[] => {
  return items.filter(item => {
    const category = categorizeTreatmentModality(item);
    return category === 'home';
  });
};

/**
 * Filter to get only clinic modalities from a list
 * 
 * @param items - Array of treatment/exercise names
 * @returns Filtered array with only clinic modalities
 */
export const filterClinicModalities = (items: string[]): string[] => {
  return items.filter(item => {
    const category = categorizeTreatmentModality(item);
    return category === 'clinic' || category === 'unknown';
  });
};

export default {
  CLINIC_MODALITIES,
  HOME_EXERCISES,
  categorizeTreatmentModality,
  filterHomeExercises,
  filterClinicModalities,
};
