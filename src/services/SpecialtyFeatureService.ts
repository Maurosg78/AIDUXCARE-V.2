/**
 * MEDICAL SPECIALTY FEATURE SERVICE - CARACTERÍSTICAS POR ESPECIALIDAD
 * 
 * Sistema que despliega características específicas según la especialidad médica,
 * implementando un enfoque gradual de descubrimiento de necesidades por disciplina.
 * 
 * CEO Fisioterapeuta → Enfoque inicial en fisioterapia
 * Expansión gradual → Logopedia, Nutrición, Psicología, Masaje, Odontología, etc.
 */

export type MedicalSpecialty = 
  | 'FISIOTERAPIA' 
  | 'PSICOLOGIA' 
  | 'LOGOPEDIA'
  | 'NUTRICION' 
  | 'MASAJE_TERAPEUTICO'
  | 'ODONTOLOGIA'
  | 'MEDICINA_GENERAL'
  | 'ENFERMERIA';

export type FeatureCategory = 
  | 'ASSESSMENT_TOOLS'    // Herramientas de evaluación
  | 'SOAP_TEMPLATES'      // Plantillas SOAP especializadas
  | 'MEASUREMENT_TOOLS'   // Herramientas de medición
  | 'EXERCISE_PROTOCOLS'  // Protocolos de ejercicios
  | 'EDUCATIONAL_CONTENT' // Contenido educativo
  | 'DOCUMENTATION'       // Documentación especializada
  | 'REFERRAL_NETWORKS';  // Redes de derivación

export interface SpecialtyFeature {
  id: string;
  name: string;
  category: FeatureCategory;
  specialty: MedicalSpecialty;
  priority: 'ESSENTIAL' | 'IMPORTANT' | 'NICE_TO_HAVE';
  implementationStatus: 'ACTIVE' | 'BETA' | 'PLANNED' | 'DISCOVERY';
  description: string;
  benefits: string[];
  clinicalValue: string;
  userStory: string;
}

export interface SpecialtyProfile {
  specialty: MedicalSpecialty;
  displayName: string;
  icon: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  coreFeatures: SpecialtyFeature[];
  currentMaturity: 'NASCENT' | 'DEVELOPING' | 'MATURE';
  nextDiscoveryAreas: string[];
}

/**
 * Servicio principal para gestión de características por especialidad
 */
class SpecialtyFeatureService {
  
  /**
   * Obtiene el perfil completo de una especialidad
   */
  getSpecialtyProfile(specialty: MedicalSpecialty): SpecialtyProfile {
    const profiles: Record<MedicalSpecialty, SpecialtyProfile> = {
      
      // === FISIOTERAPIA (MADUREZ ALTA - CEO EXPERTISE) ===
      FISIOTERAPIA: {
        specialty: 'FISIOTERAPIA',
        displayName: 'Fisioterapia',
        icon: '🦴',
        colorScheme: {
          primary: '#5DA5A3',
          secondary: '#A8E6CF',
          accent: '#4A8280'
        },
        currentMaturity: 'MATURE',
        coreFeatures: this.getFisioterapiaFeatures(),
        nextDiscoveryAreas: [
          'Integración con dispositivos de medición',
          'IA para análisis biomecánico',
          'Protocolos de telerrehabilitación'
        ]
      },

      // === PSICOLOGÍA (MADUREZ MEDIA - EN DESARROLLO) ===
      PSICOLOGIA: {
        specialty: 'PSICOLOGIA',
        displayName: 'Psicología',
        icon: 'AI:',
        colorScheme: {
          primary: '#8B7ED8',
          secondary: '#C8B9E8',
          accent: '#6A5ACD'
        },
        currentMaturity: 'DEVELOPING',
        coreFeatures: this.getPsicologiaFeatures(),
        nextDiscoveryAreas: [
          'Escalas de evaluación validadas',
          'Seguimiento de estados de ánimo',
          'Protocolos de intervención en crisis'
        ]
      },

      // === LOGOPEDIA (MADUREZ BAJA - DESCUBRIMIENTO) ===
      LOGOPEDIA: {
        specialty: 'LOGOPEDIA',
        displayName: 'Logopedia',
        icon: 'SPEECH:',
        colorScheme: {
          primary: '#FF9F43',
          secondary: '#FFC048',
          accent: '#E17055'
        },
        currentMaturity: 'NASCENT',
        coreFeatures: this.getLogopediaFeatures(),
        nextDiscoveryAreas: [
          'Análisis acústico del habla',
          'Ejercicios de articulación',
          'Protocolos de disfagia',
          'Evaluación de lenguaje infantil'
        ]
      },

      // === NUTRICIÓN (MADUREZ BAJA - DESCUBRIMIENTO) ===
      NUTRICION: {
        specialty: 'NUTRICION',
        displayName: 'Nutrición',
        icon: '🍎',
        colorScheme: {
          primary: '#6C5CE7',
          secondary: '#A29BFE',
          accent: '#5F3DC4'
        },
        currentMaturity: 'NASCENT',
        coreFeatures: this.getNutricionFeatures(),
        nextDiscoveryAreas: [
          'Cálculo de macronutrientes',
          'Planes nutricionales personalizados',
          'Seguimiento de antropometría',
          'Educación nutricional'
        ]
      },

      // === MASAJE TERAPÉUTICO (MADUREZ BAJA - DESCUBRIMIENTO) ===
      MASAJE_TERAPEUTICO: {
        specialty: 'MASAJE_TERAPEUTICO',
        displayName: 'Masaje Terapéutico',
        icon: '👐',
        colorScheme: {
          primary: '#00B894',
          secondary: '#55EFC4',
          accent: '#00A085'
        },
        currentMaturity: 'NASCENT',
        coreFeatures: this.getMasajeFeatures(),
        nextDiscoveryAreas: [
          'Técnicas de masaje especializadas',
          'Evaluación de tensión muscular',
          'Protocolos de relajación',
          'Documentación de técnicas aplicadas'
        ]
      },

      // === ODONTOLOGÍA (MADUREZ BAJA - DESCUBRIMIENTO) ===
      ODONTOLOGIA: {
        specialty: 'ODONTOLOGIA',
        displayName: 'Odontología',
        icon: 'DENTAL:',
        colorScheme: {
          primary: '#0984e3',
          secondary: '#74b9ff',
          accent: '#0066CC'
        },
        currentMaturity: 'NASCENT',
        coreFeatures: this.getOdontologiaFeatures(),
        nextDiscoveryAreas: [
          'Odontogramas digitales',
          'Planes de tratamiento dental',
          'Seguimiento de higiene oral',
          'Protocolos de emergencias dentales'
        ]
      },

      // === MEDICINA GENERAL (MADUREZ MEDIA - BASE SÓLIDA) ===
      MEDICINA_GENERAL: {
        specialty: 'MEDICINA_GENERAL',
        displayName: 'Medicina General',
        icon: 'MEDICAL:',
        colorScheme: {
          primary: '#2C3E50',
          secondary: '#BDC3C7',
          accent: '#34495E'
        },
        currentMaturity: 'DEVELOPING',
        coreFeatures: this.getMedicinaGeneralFeatures(),
        nextDiscoveryAreas: [
          'Protocolos de medicina preventiva',
          'Gestión de enfermedades crónicas',
          'Integración con laboratorios',
          'Telemedicina avanzada'
        ]
      },

      // === ENFERMERÍA (MADUREZ BAJA - DESCUBRIMIENTO) ===
      ENFERMERIA: {
        specialty: 'ENFERMERIA',
        displayName: 'Enfermería',
        icon: 'NURSE:',
        colorScheme: {
          primary: '#e17055',
          secondary: '#fab1a0',
          accent: '#d63031'
        },
        currentMaturity: 'NASCENT',
        coreFeatures: this.getEnfermeriaFeatures(),
        nextDiscoveryAreas: [
          'Planes de cuidados de enfermería',
          'Escalas de valoración',
          'Administración de medicamentos',
          'Educación para la salud'
        ]
      }
    };

    return profiles[specialty];
  }

  /**
   * Características específicas de Fisioterapia (MADUREZ ALTA)
   */
  private getFisioterapiaFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'physio-rom-assessment',
        name: 'Evaluación de Rango de Movimiento',
        category: 'ASSESSMENT_TOOLS',
        specialty: 'FISIOTERAPIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'ACTIVE',
        description: 'Herramientas digitales para medir y documentar rangos de movimiento articular',
        benefits: [
          'Mediciones precisas y reproducibles',
          'Seguimiento objetivo de la evolución',
          'Comparación con valores normativos'
        ],
        clinicalValue: 'Fundamental para diagnóstico y seguimiento en fisioterapia',
        userStory: 'Como fisioterapeuta, necesito documentar ROM para evaluar limitaciones funcionales'
      },
      {
        id: 'physio-exercise-protocols',
        name: 'Protocolos de Ejercicio Terapéutico',
        category: 'EXERCISE_PROTOCOLS',
        specialty: 'FISIOTERAPIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'ACTIVE',
        description: 'Biblioteca de ejercicios terapéuticos con progresiones adaptables',
        benefits: [
          'Planes de ejercicio personalizados',
          'Progresión automática basada en evolución',
          'Instrucciones visuales para pacientes'
        ],
        clinicalValue: 'Core del tratamiento fisioterapéutico',
        userStory: 'Como fisioterapeuta, necesito prescribir ejercicios específicos y progresivos'
      },
      {
        id: 'physio-functional-tests',
        name: 'Pruebas Funcionales Estandarizadas',
        category: 'MEASUREMENT_TOOLS',
        specialty: 'FISIOTERAPIA',
        priority: 'IMPORTANT',
        implementationStatus: 'BETA',
        description: 'Tests funcionales validados (Berg, Tinetti, TUG, etc.)',
        benefits: [
          'Evaluación objetiva de función',
          'Predicción de riesgo de caídas',
          'Seguimiento cuantificable'
        ],
        clinicalValue: 'Esencial para evaluación geriátrica y neurológica',
        userStory: 'Como fisioterapeuta, necesito evaluar riesgo funcional objetivamente'
      }
    ];
  }

  /**
   * Características específicas de Psicología (MADUREZ MEDIA)
   */
  private getPsicologiaFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'psych-dsm5-templates',
        name: 'Plantillas DSM-5',
        category: 'SOAP_TEMPLATES',
        specialty: 'PSICOLOGIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'ACTIVE',
        description: 'Plantillas SOAP adaptadas a criterios diagnósticos DSM-5',
        benefits: [
          'Documentación estandarizada',
          'Cumplimiento con criterios diagnósticos',
          'Facilita comunicación interdisciplinaria'
        ],
        clinicalValue: 'Fundamental para documentación psicológica precisa',
        userStory: 'Como psicólogo, necesito documentar según estándares DSM-5'
      },
      {
        id: 'psych-mood-tracking',
        name: 'Seguimiento de Estado de Ánimo',
        category: 'ASSESSMENT_TOOLS',
        specialty: 'PSICOLOGIA',
        priority: 'IMPORTANT',
        implementationStatus: 'PLANNED',
        description: 'Herramientas para monitorear estados emocionales entre sesiones',
        benefits: [
          'Datos objetivos de evolución',
          'Detección temprana de recaídas',
          'Mayor engagement del paciente'
        ],
        clinicalValue: 'Crucial para trastornos del estado de ánimo',
        userStory: 'Como psicólogo, necesito monitorear el ánimo de mis pacientes'
      }
    ];
  }

  /**
   * Características específicas de Logopedia (MADUREZ BAJA - DESCUBRIMIENTO)
   */
  private getLogopediaFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'speech-audio-analysis',
        name: 'Análisis Básico del Habla',
        category: 'ASSESSMENT_TOOLS',
        specialty: 'LOGOPEDIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'DISCOVERY',
        description: 'Herramientas básicas para evaluar calidad del habla desde audio',
        benefits: [
          'Evaluación objetiva de articulación',
          'Seguimiento de progreso en terapia',
          'Documentación audiovisual'
        ],
        clinicalValue: 'Fundamental para documentar trastornos del habla',
        userStory: 'Como logopeda, necesito evaluar la calidad del habla objetivamente'
      }
    ];
  }

  /**
   * Características específicas de Nutrición (MADUREZ BAJA - DESCUBRIMIENTO)
   */
  private getNutricionFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'nutrition-basic-calc',
        name: 'Calculadora Nutricional Básica',
        category: 'MEASUREMENT_TOOLS',
        specialty: 'NUTRICION',
        priority: 'ESSENTIAL',
        implementationStatus: 'DISCOVERY',
        description: 'Herramientas básicas para cálculo de IMC y requerimientos calóricos',
        benefits: [
          'Evaluación nutricional rápida',
          'Cálculo de requerimientos personalizados',
          'Seguimiento antropométrico'
        ],
        clinicalValue: 'Base para evaluación nutricional',
        userStory: 'Como nutricionista, necesito calcular requerimientos calóricos'
      }
    ];
  }

  /**
   * Características específicas de Masaje Terapéutico (MADUREZ BAJA)
   */
  private getMasajeFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'massage-technique-log',
        name: 'Registro de Técnicas de Masaje',
        category: 'DOCUMENTATION',
        specialty: 'MASAJE_TERAPEUTICO',
        priority: 'ESSENTIAL',
        implementationStatus: 'DISCOVERY',
        description: 'Sistema para documentar técnicas aplicadas y zonas tratadas',
        benefits: [
          'Registro detallado de tratamientos',
          'Seguimiento de técnicas efectivas',
          'Documentación profesional'
        ],
        clinicalValue: 'Esencial para documentación terapéutica',
        userStory: 'Como masajista, necesito documentar las técnicas que aplico'
      }
    ];
  }

  /**
   * Características específicas de Odontología (MADUREZ BAJA)
   */
  private getOdontologiaFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'dental-basic-chart',
        name: 'Ficha Dental Básica',
        category: 'DOCUMENTATION',
        specialty: 'ODONTOLOGIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'DISCOVERY',
        description: 'Sistema básico para documentar estado dental y tratamientos',
        benefits: [
          'Registro sistemático de estado dental',
          'Planificación de tratamientos',
          'Seguimiento de evolución'
        ],
        clinicalValue: 'Fundamental para práctica odontológica',
        userStory: 'Como dentista, necesito documentar el estado dental de mis pacientes'
      }
    ];
  }

  /**
   * Características específicas de Medicina General (MADUREZ MEDIA)
   */
  private getMedicinaGeneralFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'general-vital-signs',
        name: 'Registro de Signos Vitales',
        category: 'MEASUREMENT_TOOLS',
        specialty: 'MEDICINA_GENERAL',
        priority: 'ESSENTIAL',
        implementationStatus: 'ACTIVE',
        description: 'Herramientas para registro y seguimiento de constantes vitales',
        benefits: [
          'Monitoreo sistemático de salud',
          'Detección temprana de alteraciones',
          'Seguimiento de tendencias'
        ],
        clinicalValue: 'Base de toda evaluación médica',
        userStory: 'Como médico, necesito registrar y monitorear signos vitales'
      }
    ];
  }

  /**
   * Características específicas de Enfermería (MADUREZ BAJA)
   */
  private getEnfermeriaFeatures(): SpecialtyFeature[] {
    return [
      {
        id: 'nursing-care-plans',
        name: 'Planes de Cuidados Básicos',
        category: 'DOCUMENTATION',
        specialty: 'ENFERMERIA',
        priority: 'ESSENTIAL',
        implementationStatus: 'DISCOVERY',
        description: 'Sistema para crear y seguir planes de cuidados de enfermería',
        benefits: [
          'Documentación sistematizada',
          'Continuidad de cuidados',
          'Seguimiento de objetivos'
        ],
        clinicalValue: 'Core de la práctica de enfermería',
        userStory: 'Como enfermera, necesito planificar y documentar cuidados'
      }
    ];
  }

  /**
   * Obtiene características activas para una especialidad
   */
  getActiveFeatures(specialty: MedicalSpecialty): SpecialtyFeature[] {
    const profile = this.getSpecialtyProfile(specialty);
    return profile.coreFeatures.filter(feature => 
      feature.implementationStatus === 'ACTIVE'
    );
  }

  /**
   * Obtiene características en desarrollo para una especialidad
   */
  getBetaFeatures(specialty: MedicalSpecialty): SpecialtyFeature[] {
    const profile = this.getSpecialtyProfile(specialty);
    return profile.coreFeatures.filter(feature => 
      feature.implementationStatus === 'BETA'
    );
  }

  /**
   * Obtiene áreas de descubrimiento para una especialidad
   */
  getDiscoveryAreas(specialty: MedicalSpecialty): string[] {
    const profile = this.getSpecialtyProfile(specialty);
    return profile.nextDiscoveryAreas;
  }

  /**
   * Determina si una característica está disponible
   */
  isFeatureAvailable(featureId: string, specialty: MedicalSpecialty): boolean {
    const profile = this.getSpecialtyProfile(specialty);
    const feature = profile.coreFeatures.find(f => f.id === featureId);
    return feature?.implementationStatus === 'ACTIVE' || feature?.implementationStatus === 'BETA';
  }

  /**
   * Obtiene todas las especialidades disponibles
   */
  getAllSpecialties(): MedicalSpecialty[] {
    return [
      'FISIOTERAPIA',
      'PSICOLOGIA', 
      'LOGOPEDIA',
      'NUTRICION',
      'MASAJE_TERAPEUTICO', 
      'ODONTOLOGIA',
      'MEDICINA_GENERAL',
      'ENFERMERIA'
    ];
  }
}

export const specialtyFeatureService = new SpecialtyFeatureService();