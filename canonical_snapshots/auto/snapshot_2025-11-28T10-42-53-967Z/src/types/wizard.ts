export type WizardStep = "personal" | "professional" | "location";

export type ValidationResult = {
  isValid: boolean;   // <-- ajustado a lo que el código espera
  errors: Record<string, string>;
};

export interface PersonalData {
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  birthDate?: string;
  gender?: string;
  password?: string;
  confirmPassword?: string;
}

export interface ProfessionalData {
  professionalTitle: string;
  specialty: string;
  specialtyOther?: string;
  university?: string;
  licenseNumber: string;
  workplace?: string;
  experienceYears: number;
}

export interface LocationData {
  country: string;
  province: string;
  city: string;
  phipaConsent?: boolean;
  pipedaConsent?: boolean;
}

export const professionalTitles: string[] = [];
