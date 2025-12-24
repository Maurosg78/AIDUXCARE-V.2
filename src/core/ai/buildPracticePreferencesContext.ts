/**
 * buildPracticePreferencesContext - Helper puro para construir contexto de preferencias
 * Respeta consentimiento del usuario y es env-free (testeable sin Firebase)
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

export interface PracticePreferences {
  preferredTreatments?: string[];
  preferredAssessmentTools?: string[];
  clinicalApproach?: string;
  documentationStyle?: string;
  [key: string]: unknown;
}

export interface DataUseConsent {
  personalizationFromClinicianInputs: boolean;
  personalizationFromPatientData: boolean;
  grantedAt?: Date | string;
  version?: string;
}

export interface UserProfileData {
  practicePreferences?: PracticePreferences;
  dataUseConsent?: DataUseConsent;
  registrationStatus?: 'incomplete' | 'complete';
  [key: string]: unknown;
}

/**
 * Construye el contexto de preferencias de práctica respetando consentimiento
 * Función pura - no depende de Firebase ni side effects
 */
export function buildPracticePreferencesContext(
  userProfile: UserProfileData | null | undefined
): {
  clinicianPreferencesContext: string;
  patientContextNote: string;
} {
  if (!userProfile) {
    return {
      clinicianPreferencesContext: '',
      patientContextNote: 'Using current session data only (no historical data available).'
    };
  }

  const consent = userProfile.dataUseConsent;
  const preferences = userProfile.practicePreferences;

  // Construir contexto de preferencias del clínico (solo si consentido)
  let clinicianPreferencesContext = '';
  if (
    consent?.personalizationFromClinicianInputs === true &&
    preferences
  ) {
    const parts: string[] = [];
    
    if (preferences.preferredTreatments && preferences.preferredTreatments.length > 0) {
      parts.push(`Preferred treatments: ${preferences.preferredTreatments.join(', ')}`);
    }
    
    if (preferences.preferredAssessmentTools && preferences.preferredAssessmentTools.length > 0) {
      parts.push(`Preferred assessment tools: ${preferences.preferredAssessmentTools.join(', ')}`);
    }
    
    if (preferences.clinicalApproach) {
      parts.push(`Clinical approach: ${preferences.clinicalApproach}`);
    }
    
    if (preferences.documentationStyle) {
      parts.push(`Documentation style: ${preferences.documentationStyle}`);
    }

    if (parts.length > 0) {
      clinicianPreferencesContext = `[Clinician Practice Preferences]\n${parts.join('\n')}\n\nWhen proposing plans, prioritize the clinician's preferred treatments unless contraindicated.\n`;
    }
  }

  // Construir nota de contexto del paciente
  let patientContextNote = '';
  if (consent?.personalizationFromPatientData === true) {
    patientContextNote = 'Using available patient history and episode data for context.';
  } else {
    patientContextNote = 'Using current session data only (patient data personalization not consented).';
  }

  return {
    clinicianPreferencesContext,
    patientContextNote
  };
}

/**
 * Valida que el perfil viene de users/{uid} y no de otra fuente
 * Helper para asegurar single source of truth
 */
export function validateProfileSource(
  profile: UserProfileData | null | undefined,
  expectedUid?: string
): boolean {
  if (!profile) return false;
  
  // Si tenemos UID esperado, validar que coincida
  if (expectedUid && (profile as any).uid !== expectedUid) {
    return false;
  }
  
  // Verificar que tiene los campos esperados de users/{uid}
  const hasRequiredFields = 
    profile.practicePreferences !== undefined ||
    profile.dataUseConsent !== undefined ||
    profile.registrationStatus !== undefined;
  
  return hasRequiredFields;
}

