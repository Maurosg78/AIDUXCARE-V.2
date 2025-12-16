/**
 * 🏥 Professional Type - Modelo de Datos para Profesionales Médicos
 * Cumple HIPAA/GDPR: Datos sensibles cifrados, auditoría completa, consentimiento explícito
 */

export interface ProfessionalSpecialization {
  id: string;
  name: string;
  category: 'PHYSIOTHERAPY' | 'MEDICINE' | 'PSYCHOLOGY' | 'NURSING' | 'OTHER';
  description: string;
  clinicalTests: ClinicalTest[];
  certifications: string[];
  evidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  complianceRequirements: string[];
}

// Especializaciones técnicas específicas
export interface TechnicalSpecialization {
  id: string;
  name: string;
  category: 'TECHNIQUE' | 'MODALITY' | 'ASSESSMENT' | 'TREATMENT';
  description: string;
  certificationRequired: boolean;
  evidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  clinicalApplications: string[];
  contraindications: string[];
  isActive: boolean;
}

// Certificaciones técnicas del profesional
export interface TechnicalCertification {
  id: string;
  techniqueId: string;
  techniqueName: string;
  certificationDate: Date;
  certifyingBody: string;
  certificationNumber?: string;
  expiryDate?: Date;
  isActive: boolean;
  evidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CustomSpecialization {
  id: string;
  name: string;
  category: 'PHYSIOTHERAPY' | 'MEDICINE' | 'PSYCHOLOGY' | 'NURSING' | 'OTHER';
  description: string;
  isCustom: true;
  clinicalTests: ClinicalTest[];
  certifications: string[];
  evidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  complianceRequirements: string[];
  createdBy: string;
  createdAt: Date;
}

export interface ClinicalTest {
  id: string;
  name: string;
  category: 'MOBILITY' | 'STRENGTH' | 'FUNCTIONAL' | 'SPECIAL' | 'NEUROLOGICAL' | 'SPORTS';
  description: string;
  evidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  contraindications: string[];
  normalValues?: {
    min?: number;
    max?: number;
    unit?: string;
  };
  instructions: string;
  isDefault: boolean;
}

export interface ProfessionalProfile {
  id: string;
  userId: string; // Referencia a Firebase Auth
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    licenseNumber: string;
    licenseExpiry: Date;
    country: string;
    state?: string;
    city: string;
  };
  professionalInfo: {
    // Información de colegiado/identificación oficial
    officialCredentials: {
      colegiateNumber?: string; // Número de colegiado
      professionalId?: string; // ID profesional estatal
      registrationAuthority: string; // Autoridad que emite la licencia
      registrationDate: Date;
      registrationExpiry?: Date;
      isVerified: boolean;
    };
    // Especialización principal (puede ser predefinida o personalizada)
    specialization: ProfessionalSpecialization | CustomSpecialization;
    subSpecializations: (ProfessionalSpecialization | CustomSpecialization)[];
    yearsOfExperience: number;
    practiceType: 'CLINIC' | 'HOSPITAL' | 'PRIVATE' | 'RESEARCH' | 'TEACHING';
    certifications: Certification[];
    languages: string[];
    // Información adicional para perfilamiento
    areasOfInterest: string[];
    patientPopulation: 'general' | 'pediatric' | 'geriatric' | 'sports' | 'neurological' | 'mixed';
    practiceSettings: string[];
              continuingEducation: {
            lastUpdate: Date;
            hoursCompleted: number;
            areas: string[];
          };
          // Especializaciones técnicas certificadas
          technicalCertifications: TechnicalCertification[];
          // Firma profesional oficial
          professionalSignature: {
            title: string; // Ej: "Fisioterapeuta Especialista en Terapia Manual"
            displayName: string; // Nombre para mostrar en documentos
            specialization: string; // Especialización principal para firma
            isVerified: boolean;
          };
  };
  clinicalPreferences: {
    preferredTests: ClinicalTest[];
    customTests: ClinicalTest[];
    assessmentStyle: 'COMPREHENSIVE' | 'FOCUSED' | 'QUICK';
    documentationStyle: 'DETAILED' | 'CONCISE' | 'STRUCTURED';
    aiAssistanceLevel: 'MINIMAL' | 'MODERATE' | 'EXTENSIVE';
  };
  compliance: {
    hipaaConsent: boolean;
    gdprConsent: boolean;
    dataProcessingConsent: boolean;
    auditTrailEnabled: boolean;
    mfaEnabled: boolean;
    lastComplianceReview: Date;
  };
  systemAccess: {
    role: 'OWNER' | 'ADMIN' | 'PHYSICIAN' | 'ASSISTANT';
    permissions: string[];
    lastLoginAt?: Date;
    sessionTimeout: number; // minutos
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    version: number;
    isActive: boolean;
  };
}

export interface Certification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId: string;
  verificationUrl?: string;
}

// Especializaciones completas de Fisioterapia
export const PHYSIOTHERAPY_SPECIALIZATIONS: ProfessionalSpecialization[] = [
  {
    id: 'sports_trauma',
    name: 'Traumatología Deportiva',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en lesiones deportivas y rehabilitación atlética',
    clinicalTests: [
      {
        id: 'sport_rom_shoulder',
        name: 'Rango de Movimiento Hombro Deportivo',
        category: 'MOBILITY',
        description: 'Evaluación específica para deportistas con énfasis en movimientos deportivos',
        evidenceLevel: 'HIGH',
        contraindications: ['Fractura reciente', 'Inestabilidad severa'],
        normalValues: { min: 0, max: 180, unit: 'grados' },
        instructions: 'Evaluar en posiciones específicas del deporte',
        isDefault: true
      },
      {
        id: 'sport_strength_test',
        name: 'Test de Fuerza Deportiva',
        category: 'STRENGTH',
        description: 'Evaluación de fuerza específica para deportes',
        evidenceLevel: 'HIGH',
        contraindications: ['Lesión aguda', 'Dolor severo'],
        instructions: 'Realizar con equipamiento deportivo específico',
        isDefault: true
      },
      {
        id: 'sport_functional_test',
        name: 'Test Funcional Deportivo',
        category: 'FUNCTIONAL',
        description: 'Evaluación de funcionalidad específica del deporte',
        evidenceLevel: 'MEDIUM',
        contraindications: ['Inestabilidad', 'Dolor agudo'],
        instructions: 'Simular movimientos específicos del deporte',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Medicina Deportiva', 'Especialización en Traumatología Deportiva'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Sports Medicine Standards']
  },
  {
    id: 'neuro_rehab',
    name: 'Neuro Rehabilitación',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en rehabilitación neurológica',
    clinicalTests: [
      {
        id: 'neuro_rom_assessment',
        name: 'Evaluación ROM Neurológica',
        category: 'NEUROLOGICAL',
        description: 'Evaluación de rango de movimiento en pacientes neurológicos',
        evidenceLevel: 'HIGH',
        contraindications: ['Espasticidad severa', 'Contracturas'],
        instructions: 'Evaluar con técnicas específicas neurológicas',
        isDefault: true
      },
      {
        id: 'balance_test',
        name: 'Test de Equilibrio',
        category: 'FUNCTIONAL',
        description: 'Evaluación de equilibrio y coordinación',
        evidenceLevel: 'HIGH',
        contraindications: ['Inestabilidad severa', 'Riesgo de caída'],
        instructions: 'Realizar en ambiente seguro con supervisión',
        isDefault: true
      },
      {
        id: 'gait_analysis',
        name: 'Análisis de Marcha',
        category: 'FUNCTIONAL',
        description: 'Evaluación de la marcha en pacientes neurológicos',
        evidenceLevel: 'HIGH',
        contraindications: ['Incapacidad para caminar', 'Riesgo de caída'],
        instructions: 'Evaluar en pasillo seguro con equipamiento',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Neuro Rehabilitación', 'Especialización en Neurología'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Neurological Standards']
  },
  {
    id: 'cardiorespiratory',
    name: 'Fisioterapia Cardiorrespiratoria',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en rehabilitación cardíaca y respiratoria',
    clinicalTests: [
      {
        id: 'respiratory_assessment',
        name: 'Evaluación Respiratoria',
        category: 'FUNCTIONAL',
        description: 'Evaluación de función respiratoria y capacidad pulmonar',
        evidenceLevel: 'HIGH',
        contraindications: ['Dolor torácico agudo', 'Disnea severa'],
        instructions: 'Evaluar en posición sentada con monitorización',
        isDefault: true
      },
      {
        id: 'exercise_tolerance',
        name: 'Test de Tolerancia al Ejercicio',
        category: 'FUNCTIONAL',
        description: 'Evaluación de capacidad funcional cardíaca',
        evidenceLevel: 'HIGH',
        contraindications: ['Angina inestable', 'Arritmia severa'],
        instructions: 'Realizar con monitorización cardíaca',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Fisioterapia Cardiorrespiratoria'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Cardiac Standards']
  },
  {
    id: 'pediatric',
    name: 'Fisioterapia Pediátrica',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en rehabilitación infantil y desarrollo motor',
    clinicalTests: [
      {
        id: 'developmental_assessment',
        name: 'Evaluación del Desarrollo Motor',
        category: 'FUNCTIONAL',
        description: 'Evaluación de hitos del desarrollo motor',
        evidenceLevel: 'HIGH',
        contraindications: ['Fiebre', 'Malestar general'],
        instructions: 'Evaluar en ambiente lúdico y seguro',
        isDefault: true
      },
      {
        id: 'pediatric_rom',
        name: 'Rango de Movimiento Pediátrico',
        category: 'MOBILITY',
        description: 'Evaluación de movilidad en población pediátrica',
        evidenceLevel: 'MEDIUM',
        contraindications: ['Dolor agudo', 'Trauma reciente'],
        instructions: 'Realizar con técnicas específicas pediátricas',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Fisioterapia Pediátrica'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Pediatric Standards']
  },
  {
    id: 'geriatric',
    name: 'Fisioterapia Geriátrica',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en rehabilitación del adulto mayor',
    clinicalTests: [
      {
        id: 'balance_geriatric',
        name: 'Evaluación de Equilibrio Geriátrico',
        category: 'FUNCTIONAL',
        description: 'Evaluación de equilibrio y riesgo de caídas',
        evidenceLevel: 'HIGH',
        contraindications: ['Inestabilidad severa', 'Riesgo de caída'],
        instructions: 'Realizar con supervisión y medidas de seguridad',
        isDefault: true
      },
      {
        id: 'functional_mobility',
        name: 'Movilidad Funcional',
        category: 'FUNCTIONAL',
        description: 'Evaluación de movilidad en actividades diarias',
        evidenceLevel: 'HIGH',
        contraindications: ['Limitación severa', 'Dolor incapacitante'],
        instructions: 'Evaluar en contexto real de actividades',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Fisioterapia Geriátrica'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Geriatric Standards']
  },
  {
    id: 'orthopedic',
    name: 'Fisioterapia Ortopédica',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en lesiones musculoesqueléticas',
    clinicalTests: [
      {
        id: 'orthopedic_assessment',
        name: 'Evaluación Ortopédica',
        category: 'MOBILITY',
        description: 'Evaluación completa musculoesquelética',
        evidenceLevel: 'HIGH',
        contraindications: ['Fractura aguda', 'Inestabilidad'],
        instructions: 'Evaluar de forma sistemática y progresiva',
        isDefault: true
      },
      {
        id: 'manual_therapy_assessment',
        name: 'Evaluación para Terapia Manual',
        category: 'MOBILITY',
        description: 'Evaluación específica para técnicas manuales',
        evidenceLevel: 'HIGH',
        contraindications: ['Contraindicaciones absolutas'],
        instructions: 'Evaluar antes de aplicar técnicas manuales',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Fisioterapia Ortopédica'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Orthopedic Standards']
  },
  {
    id: 'women_health',
    name: 'Fisioterapia de la Mujer',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en salud pélvica y obstetricia',
    clinicalTests: [
      {
        id: 'pelvic_assessment',
        name: 'Evaluación Pélvica',
        category: 'FUNCTIONAL',
        description: 'Evaluación de función pélvica',
        evidenceLevel: 'HIGH',
        contraindications: ['Infección activa', 'Dolor agudo'],
        instructions: 'Evaluar con técnicas específicas y consentimiento',
        isDefault: true
      },
      {
        id: 'postpartum_assessment',
        name: 'Evaluación Postparto',
        category: 'FUNCTIONAL',
        description: 'Evaluación de recuperación postparto',
        evidenceLevel: 'MEDIUM',
        contraindications: ['Complicaciones postparto'],
        instructions: 'Evaluar con técnicas específicas postparto',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Fisioterapia de la Mujer'],
    evidenceLevel: 'MEDIUM',
    complianceRequirements: ['HIPAA', 'GDPR', 'Women Health Standards']
  },
  {
    id: 'manual_therapy',
    name: 'Terapia Manual',
    category: 'PHYSIOTHERAPY',
    description: 'Especialización en técnicas manuales avanzadas',
    clinicalTests: [
      {
        id: 'manual_assessment',
        name: 'Evaluación Manual',
        category: 'MOBILITY',
        description: 'Evaluación específica para terapia manual',
        evidenceLevel: 'HIGH',
        contraindications: ['Contraindicaciones absolutas'],
        instructions: 'Evaluar antes de aplicar técnicas manuales',
        isDefault: true
      },
      {
        id: 'joint_mobility',
        name: 'Movilidad Articular',
        category: 'MOBILITY',
        description: 'Evaluación de movilidad articular específica',
        evidenceLevel: 'HIGH',
        contraindications: ['Inestabilidad', 'Dolor agudo'],
        instructions: 'Evaluar con técnicas específicas manuales',
        isDefault: true
      }
    ],
    certifications: ['Certificación en Terapia Manual'],
    evidenceLevel: 'HIGH',
    complianceRequirements: ['HIPAA', 'GDPR', 'Manual Therapy Standards']
  },
  {
    id: 'general_physio',
    name: 'Fisioterapia General',
    category: 'PHYSIOTHERAPY',
    description: 'Fisioterapia general para población general',
    clinicalTests: [
      {
        id: 'basic_rom',
        name: 'Rango de Movimiento Básico',
        category: 'MOBILITY',
        description: 'Evaluación básica de movilidad articular',
        evidenceLevel: 'HIGH',
        contraindications: ['Dolor agudo', 'Fractura'],
        instructions: 'Evaluar de forma gentil y progresiva',
        isDefault: true
      },
      {
        id: 'manual_muscle_test',
        name: 'Test Muscular Manual',
        category: 'STRENGTH',
        description: 'Evaluación manual de fuerza muscular',
        evidenceLevel: 'HIGH',
        contraindications: ['Dolor severo', 'Lesión aguda'],
        instructions: 'Realizar con resistencia manual apropiada',
        isDefault: true
      },
      {
        id: 'functional_assessment',
        name: 'Evaluación Funcional',
        category: 'FUNCTIONAL',
        description: 'Evaluación de actividades de la vida diaria',
        evidenceLevel: 'MEDIUM',
        contraindications: ['Limitación severa', 'Dolor incapacitante'],
        instructions: 'Evaluar actividades relevantes al paciente',
        isDefault: true
      }
    ],
    certifications: ['Licencia en Fisioterapia', 'Certificación Básica'],
    evidenceLevel: 'MEDIUM',
    complianceRequirements: ['HIPAA', 'GDPR']
  }
];

// Mantener compatibilidad con el nombre anterior
export const SPECIALIZATIONS = PHYSIOTHERAPY_SPECIALIZATIONS;

// Especializaciones técnicas específicas
export const TECHNICAL_SPECIALIZATIONS: TechnicalSpecialization[] = [
  {
    id: 'k_tape',
    name: 'Kinesiotape (K-Tape)',
    category: 'TECHNIQUE',
    description: 'Técnica de vendaje neuromuscular para facilitación muscular y control del dolor',
    certificationRequired: true,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Dolor muscular', 'Edema', 'Facilitación muscular', 'Estabilización articular'],
    contraindications: ['Alergia al material', 'Heridas abiertas', 'Infección activa'],
    isActive: true
  },
  {
    id: 'dry_needling',
    name: 'Dry Needling',
    category: 'TECHNIQUE',
    description: 'Técnica de punción seca para puntos gatillo musculares',
    certificationRequired: true,
    evidenceLevel: 'HIGH',
    clinicalApplications: ['Puntos gatillo', 'Dolor miofascial', 'Disfunción muscular'],
    contraindications: ['Trastornos de coagulación', 'Infección local', 'Embarazo'],
    isActive: true
  },
  {
    id: 'manual_therapy',
    name: 'Terapia Manual',
    category: 'TECHNIQUE',
    description: 'Técnicas manuales para movilización articular y tejidos blandos',
    certificationRequired: true,
    evidenceLevel: 'HIGH',
    clinicalApplications: ['Disfunción articular', 'Dolor musculoesquelético', 'Restricción de movimiento'],
    contraindications: ['Fractura', 'Inestabilidad articular', 'Proceso inflamatorio agudo'],
    isActive: true
  },
  {
    id: 'epi',
    name: 'EPI (Electrólisis Percutánea Intratisular)',
    category: 'TECHNIQUE',
    description: 'Técnica invasiva para tratamiento de tendinopatías',
    certificationRequired: true,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Tendinopatías', 'Lesiones tendinosas crónicas', 'Dolor tendinoso'],
    contraindications: ['Infección activa', 'Trastornos de coagulación', 'Marcapasos'],
    isActive: true
  },
  {
    id: 'ultrasound',
    name: 'Ecografía Musculoesquelética',
    category: 'ASSESSMENT',
    description: 'Evaluación ecográfica para diagnóstico y guía de tratamiento',
    certificationRequired: true,
    evidenceLevel: 'HIGH',
    clinicalApplications: ['Diagnóstico lesiones', 'Guía de inyecciones', 'Evaluación tejidos'],
    contraindications: ['Heridas abiertas', 'Infección local'],
    isActive: true
  },
  {
    id: 'motor_control',
    name: 'Control Motor',
    category: 'TREATMENT',
    description: 'Evaluación y tratamiento del control neuromuscular',
    certificationRequired: false,
    evidenceLevel: 'HIGH',
    clinicalApplications: ['Disfunción neuromuscular', 'Inestabilidad', 'Reeducación motora'],
    contraindications: ['Dolor agudo severo', 'Inestabilidad severa'],
    isActive: true
  },
  {
    id: 'mckenzie',
    name: 'Método McKenzie',
    category: 'TREATMENT',
    description: 'Sistema de evaluación y tratamiento mecánico del dolor',
    certificationRequired: true,
    evidenceLevel: 'HIGH',
    clinicalApplications: ['Dolor lumbar', 'Dolor cervical', 'Dolor radicular'],
    contraindications: ['Red flags', 'Dolor no mecánico'],
    isActive: true
  },
  {
    id: 'mulligan',
    name: 'Concepto Mulligan',
    category: 'TECHNIQUE',
    description: 'Técnicas de movilización con movimiento (MWM)',
    certificationRequired: true,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Dolor articular', 'Restricción de movimiento', 'Disfunción articular'],
    contraindications: ['Fractura', 'Inestabilidad', 'Dolor agudo'],
    isActive: true
  },
  {
    id: 'pilates',
    name: 'Pilates Terapéutico',
    category: 'TREATMENT',
    description: 'Sistema de ejercicios para control motor y estabilización',
    certificationRequired: true,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Estabilización lumbar', 'Control motor', 'Rehabilitación'],
    contraindications: ['Dolor agudo', 'Inestabilidad severa'],
    isActive: true
  },
  {
    id: 'acupuncture',
    name: 'Acupuntura',
    category: 'TECHNIQUE',
    description: 'Técnica de inserción de agujas para control del dolor',
    certificationRequired: true,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Control del dolor', 'Relajación muscular', 'Bienestar general'],
    contraindications: ['Trastornos de coagulación', 'Embarazo', 'Infección local'],
    isActive: true
  },
  {
    id: 'cupping',
    name: 'Ventosas (Cupping)',
    category: 'TECHNIQUE',
    description: 'Técnica de succión para movilización de tejidos',
    certificationRequired: false,
    evidenceLevel: 'LOW',
    clinicalApplications: ['Movilización de tejidos', 'Relajación muscular', 'Drenaje'],
    contraindications: ['Piel lesionada', 'Trastornos de coagulación'],
    isActive: true
  },
  {
    id: 'taping',
    name: 'Vendaje Funcional',
    category: 'TECHNIQUE',
    description: 'Técnicas de vendaje para estabilización y facilitación',
    certificationRequired: false,
    evidenceLevel: 'MEDIUM',
    clinicalApplications: ['Estabilización articular', 'Facilitación muscular', 'Protección'],
    contraindications: ['Alergia al material', 'Heridas abiertas'],
    isActive: true
  }
];

// Función para obtener especialización por ID
export function getSpecializationById(id: string): ProfessionalSpecialization | undefined {
  return SPECIALIZATIONS.find(spec => spec.id === id);
}

// Función para obtener tests por especialización
export function getTestsBySpecialization(specializationId: string): ClinicalTest[] {
  const specialization = getSpecializationById(specializationId);
  return specialization?.clinicalTests || [];
}

// Función para validar perfil profesional
export function validateProfessionalProfile(profile: ProfessionalProfile): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar información personal
  if (!profile.personalInfo.firstName || !profile.personalInfo.lastName) {
    errors.push('Nombre completo es requerido');
  }

  if (!profile.personalInfo.licenseNumber) {
    errors.push('Número de licencia es requerido');
  }

  if (profile.personalInfo.licenseExpiry < new Date()) {
    errors.push('Licencia ha expirado');
  }

  // Validar especialización
  if (!profile.professionalInfo.specialization) {
    errors.push('Especialización principal es requerida');
  }

  // Validar compliance
  if (!profile.compliance.hipaaConsent) {
    errors.push('Consentimiento HIPAA es requerido');
  }

  if (!profile.compliance.gdprConsent) {
    errors.push('Consentimiento GDPR es requerido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 