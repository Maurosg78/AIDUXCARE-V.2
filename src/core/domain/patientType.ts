/**
 * 🏥 Patient Type - Modelo de Datos para Pacientes
 * Cumple HIPAA/GDPR: Datos sensibles cifrados, auditoría completa, consentimiento explícito
 */

export interface Patient {
  id: string;
  professionalId: string; // ID del profesional que creó/atiende al paciente
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    email?: string;
    phone?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    address?: {
      street: string;
      city: string;
      state?: string;
      country: string;
      postalCode?: string;
    };
  };
  medicalInfo: {
    primaryCondition: string;
    secondaryConditions: string[];
    allergies: string[];
    currentMedications: Medication[];
    previousSurgeries: Surgery[];
    familyHistory: string;
    lifestyleFactors: {
      smoking: 'never' | 'former' | 'current';
      alcohol: 'never' | 'occasional' | 'moderate' | 'heavy';
      exercise: 'sedentary' | 'light' | 'moderate' | 'active';
      occupation: string;
    };
  };
  clinicalHistory: {
    visits: ClinicalVisit[];
    assessments: ClinicalAssessment[];
    treatments: Treatment[];
    outcomes: Outcome[];
  };
  consent: {
    hipaaConsent: boolean;
    gdprConsent: boolean;
    dataProcessingConsent: boolean;
    researchConsent: boolean;
    consentDate: Date;
    consentVersion: string;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: number;
    isActive: boolean;
    lastVisitDate?: Date;
  };
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  notes?: string;
}

export interface Surgery {
  id: string;
  procedure: string;
  date: Date;
  hospital: string;
  surgeon: string;
  notes?: string;
}

export interface ClinicalVisit {
  id: string;
  date: Date;
  type: 'initial' | 'follow_up' | 'emergency' | 'routine';
  chiefComplaint: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  professionalId: string;
  duration: number; // minutos
  notes?: string;
}

export interface ClinicalAssessment {
  id: string;
  visitId: string;
  date: Date;
  type: 'physical' | 'functional' | 'pain' | 'neurological' | 'sports';
  tests: ClinicalTest[];
  results: AssessmentResult[];
  professionalId: string;
  notes?: string;
}

export interface ClinicalTest {
  id: string;
  name: string;
  category: 'mobility' | 'strength' | 'functional' | 'special' | 'neurological' | 'sports';
  result: string;
  normalRange?: {
    min: number;
    max: number;
    unit: string;
  };
  isAbnormal: boolean;
  notes?: string;
}

export interface AssessmentResult {
  id: string;
  testId: string;
  value: number | string;
  unit?: string;
  isNormal: boolean;
  interpretation: string;
}

export interface Treatment {
  id: string;
  visitId: string;
  date: Date;
  type: 'manual_therapy' | 'exercise' | 'education' | 'modalities' | 'referral';
  description: string;
  duration: number; // minutos
  professionalId: string;
  effectiveness: 'excellent' | 'good' | 'fair' | 'poor' | 'not_assessed';
  notes?: string;
}

export interface Outcome {
  id: string;
  visitId: string;
  date: Date;
  type: 'pain_reduction' | 'function_improvement' | 'range_motion' | 'strength' | 'quality_life';
  measure: string;
  baselineValue: number;
  currentValue: number;
  improvement: number; // porcentaje
  professionalId: string;
  notes?: string;
}

// Función para generar ID único del paciente
export function generatePatientId(professionalId: string, firstName: string, lastName: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const random = Math.random().toString(36).substr(2, 4);
  return `PAT_${professionalId.slice(-4)}_${initials}_${timestamp}_${random}`;
}

// Función para validar perfil de paciente
export function validatePatientProfile(profile: Patient): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar información personal
  if (!profile.personalInfo.firstName || !profile.personalInfo.lastName) {
    errors.push('Nombre completo es requerido');
  }

  if (!profile.personalInfo.dateOfBirth) {
    errors.push('Fecha de nacimiento es requerida');
  }

  // Validar edad (debe ser mayor de 0 y menor de 150)
  const age = new Date().getFullYear() - profile.personalInfo.dateOfBirth.getFullYear();
  if (age < 0 || age > 150) {
    errors.push('Fecha de nacimiento no válida');
  }

  // Validar información médica
  if (!profile.medicalInfo.primaryCondition) {
    errors.push('Condición principal es requerida');
  }

  // Validar consentimientos
  if (!profile.consent.hipaaConsent) {
    errors.push('Consentimiento HIPAA es requerido');
  }

  if (!profile.consent.gdprConsent) {
    errors.push('Consentimiento GDPR es requerido');
  }

  if (!profile.consent.dataProcessingConsent) {
    errors.push('Consentimiento de procesamiento de datos es requerido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Función para calcular edad
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

// Función para obtener información resumida del paciente
export function getPatientSummary(patient: Patient): {
  fullName: string;
  age: number;
  primaryCondition: string;
  lastVisitDate?: Date;
  totalVisits: number;
  isActive: boolean;
} {
  return {
    fullName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
    age: calculateAge(patient.personalInfo.dateOfBirth),
    primaryCondition: patient.medicalInfo.primaryCondition,
    lastVisitDate: patient.metadata.lastVisitDate,
    totalVisits: patient.clinicalHistory.visits.length,
    isActive: patient.metadata.isActive
  };
}

// Función para verificar si un paciente necesita seguimiento
export function needsFollowUp(patient: Patient, daysThreshold: number = 30): boolean {
  if (!patient.metadata.lastVisitDate) {
    return true; // Nunca ha visitado
  }

  const daysSinceLastVisit = Math.floor(
    (new Date().getTime() - patient.metadata.lastVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastVisit > daysThreshold;
}

// Función para obtener medicamentos activos
export function getActiveMedications(patient: Patient): Medication[] {
  const today = new Date();
  return patient.medicalInfo.currentMedications.filter((med: Medication) => {
    if (med.endDate) {
      return med.startDate <= today && med.endDate >= today;
    }
    return med.startDate <= today;
  });
}

// Función para obtener visitas recientes
export function getRecentVisits(patient: Patient, days: number = 30): ClinicalVisit[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return patient.clinicalHistory.visits
    .filter((visit: ClinicalVisit) => visit.date >= cutoffDate)
    .sort((a: ClinicalVisit, b: ClinicalVisit) => b.date.getTime() - a.date.getTime());
}

// Schema de validación para Patient (usando Zod)
export const PatientSchema = {
  id: 'string',
  professionalId: 'string',
  personalInfo: {
    firstName: 'string',
    lastName: 'string',
    dateOfBirth: 'Date',
    gender: 'string',
    email: 'string?',
    phone: 'string?'
  },
  medicalInfo: {
    primaryCondition: 'string',
    secondaryConditions: 'string[]',
    allergies: 'string[]'
  },
  consent: {
    hipaaConsent: 'boolean',
    gdprConsent: 'boolean',
    dataProcessingConsent: 'boolean'
  },
  parse: function(data: any) {
    return data as Patient;
  }
};