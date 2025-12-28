export type WizardStep = "personal" | "professional" | "location";

export type ValidationResult = {
  isValid: boolean;   // <-- ajustado a lo que el código espera
  errors: Record<string, string>;
};

// CTO SPEC: WIZARD 1 — Identidad profesional
// IMPORTANTE: Onboarding ≠ Registro
// - Registro = Auth (createUserWithEmailAndPassword) - NO va aquí
// - Onboarding = Perfil profesional - Solo estos campos
export interface PersonalData {
  firstName: string;
  lastName: string;
  preferredName?: string; // Opcional
  email: string; // Readonly si viene de auth
  phone?: string; // Opcional
  phoneCountryCode?: string; // E.164 format
  country: string; // Required
  province: string; // Required (province/state)
  city: string; // Required
  profession: string; // Required (physiotherapist, etc.)
  licenseNumber: string; // Required
  licenseCountry: string; // Required (issuingBody)
  // NO password/confirmPassword - eso es para REGISTRO, no para ONBOARDING PROFESIONAL
}

// CTO SPEC: WIZARD 2 — Práctica clínica y estilo de trabajo
export interface ProfessionalData {
  yearsOfExperience: number; // Required
  specialty?: string; // Legacy: single specialty (for backward compatibility)
  specialties?: string[]; // Required: multiple specialties - Select from PRIMARY_SPECIALTIES (multi-select)
  specialtyOther?: string; // Optional - if specialties includes 'other'
  practiceSetting?: 'clinic' | 'hospital' | 'home-care' | 'mixed'; // Legacy: single setting (for backward compatibility)
  practiceSettings?: ('clinic' | 'hospital' | 'home-care' | 'mixed')[]; // Required: multiple settings - Multi-select (fisios pueden trabajar en múltiples lugares)
  practicePreferences: {
    noteVerbosity: 'concise' | 'standard' | 'detailed'; // Required
    tone: 'formal' | 'friendly' | 'educational'; // Required
    preferredTreatments?: string[]; // Optional - checkboxes from MSK_SKILLS (shown when MSK is selected)
    doNotSuggest?: string[]; // Optional - checkboxes from MSK_SKILLS (shown when MSK is selected)
  };
  // Legacy fields for backward compatibility (will be removed)
  experienceYears?: number; // Map to yearsOfExperience
  professionalTitle?: string; // NOT in CTO spec - remove
  university?: string; // NOT in CTO spec - remove
  licenseNumber?: string; // Already in Wizard 1 - duplicate
  workplace?: string; // NOT in CTO spec - remove
}

export interface LocationData {
  country: string;
  province: string;
  city: string;
  phipaConsent?: boolean;
  pipedaConsent?: boolean;
  // Password requerido para registro (permite login con email + password)
  password?: string; // Required for registration (createUserWithEmailAndPassword)
  confirmPassword?: string; // Required for registration
}

export const professionalTitles: string[] = [];
