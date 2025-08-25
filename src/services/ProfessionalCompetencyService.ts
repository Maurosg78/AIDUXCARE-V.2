import logger from '@/shared/utils/logger';
export interface ProfessionalCompetency {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'advanced' | 'invasive' | 'specialized';
  nationalLevel: {
    isAuthorized: boolean;
    baseLegal: string;
    requirements?: string[];
  };
  regionalLevel: {
    [region: string]: {
      isAuthorized: boolean;
      baseLegal: string;
      requirements?: string[];
      additionalCertifications?: string[];
      registrationRequired?: boolean;
      notes?: string;
    };
  };
  riskLevel: 'low' | 'medium' | 'high';
  requiresCertification: boolean;
  certificationHours?: number;
  publicSectorRestrictions?: string[];
}

export interface CompetencyValidation {
  isAuthorized: boolean;
  requirements: string[];
  warnings: string[];
  recommendations: string[];
  baseLegal: string;
  regionalSpecifics?: {
    region: string;
    additionalRequirements: string[];
    notes: string;
  };
}

export interface SilentCompetencyCheck {
  isSafe: boolean;
  shouldWarn: boolean;
  warningMessage?: string;
  recommendation?: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

class ProfessionalCompetencyService {
  private readonly competencies: ProfessionalCompetency[] = [
    // COMPETENCIAS BÁSICAS
    {
      id: 'basic-assessment',
      name: 'Valoración y Diagnóstico Fisioterapéutico',
      description: 'Valoración del estado funcional del paciente y emisión de diagnóstico fisioterapéutico',
      category: 'basic',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, LOPS (Ley 44/2003)',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'low',
      requiresCertification: false
    },
    {
      id: 'basic-therapeutic-exercise',
      name: 'Ejercicio Terapéutico',
      description: 'Aplicación de ejercicios terapéuticos para rehabilitación y prevención',
      category: 'basic',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, ESCO (europa.eu)',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'low',
      requiresCertification: false
    },
    {
      id: 'basic-manual-therapy',
      name: 'Terapia Manual',
      description: 'Técnicas manuales incluyendo masajes, movilizaciones y manipulaciones',
      category: 'basic',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, Sentencia Tribunal Supremo',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'low',
      requiresCertification: false
    },
    {
      id: 'basic-electrotherapy',
      name: 'Electroterapia',
      description: 'Aplicación de corrientes eléctricas con fines terapéuticos',
      category: 'basic',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, ESCO (europa.eu)',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'low',
      requiresCertification: false
    },

    // COMPETENCIAS AVANZADAS
    {
      id: 'advanced-osteopathy',
      name: 'Osteopatía',
      description: 'Técnicas osteopáticas para el tratamiento de disfunciones somáticas',
      category: 'advanced',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Sentencia Tribunal Supremo, Real Decreto 1001/2002',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'medium',
      requiresCertification: false
    },
    {
      id: 'advanced-chiropractic',
      name: 'Quiropraxia',
      description: 'Técnicas quiroprácticas para el tratamiento de disfunciones vertebrales',
      category: 'advanced',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Sentencia Tribunal Supremo, Real Decreto 1001/2002',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'medium',
      requiresCertification: false
    },
    {
      id: 'advanced-ultrasound',
      name: 'Ecografía Musculoesquelética',
      description: 'Uso de ecografía para valoración y guía de intervenciones',
      category: 'advanced',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Resolución 01/2023 CGCFE',
        requirements: ['Título oficial de Fisioterapeuta', 'Formación específica en ecografía']
      },
      regionalLevel: {},
      riskLevel: 'medium',
      requiresCertification: true,
      certificationHours: 40
    },

    // COMPETENCIAS INVASIVAS
    {
      id: 'invasive-dry-needling',
      name: 'Punción Seca',
      description: 'Técnica invasiva para el tratamiento del síndrome de dolor miofascial',
      category: 'invasive',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Resolución 05/2011 CGCFE',
        requirements: ['Título oficial de Fisioterapeuta', 'Formación especializada de posgrado']
      },
      regionalLevel: {
        'Cataluña': {
          isAuthorized: true,
          baseLegal: 'Resolución 007/2009 Col·legi de Fisioterapeutes de Catalunya',
          requirements: ['Título oficial de Fisioterapeuta', 'Mínimo 36 horas prácticas'],
          additionalCertifications: ['Registro de Punción Seca obligatorio'],
          registrationRequired: true,
          notes: 'Requisito específico de Cataluña: registro obligatorio con 36h prácticas'
        },
        'Cantabria': {
          isAuthorized: true,
          baseLegal: 'Resolución 05/2011 CGCFE',
          requirements: ['Título oficial de Fisioterapeuta', 'Formación acreditada'],
          additionalCertifications: ['Cursos del ICPFC recomendados'],
          notes: 'Comisión de Fisioterapia Invasiva activa'
        }
      },
      riskLevel: 'high',
      requiresCertification: true,
      certificationHours: 75
    },
    {
      id: 'invasive-ventilation',
      name: 'Ventilación Mecánica',
      description: 'Manejo de ventilación mecánica invasiva y no invasiva',
      category: 'invasive',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Resolución 01/2022 CGCFE',
        requirements: ['Título oficial de Fisioterapeuta', 'Formación específica en ventilación mecánica']
      },
      regionalLevel: {},
      riskLevel: 'high',
      requiresCertification: true,
      certificationHours: 60
    },

    // COMPETENCIAS ESPECIALIZADAS
    {
      id: 'specialized-sports-physio',
      name: 'Fisioterapia Deportiva',
      description: 'Especialización en fisioterapia aplicada al deporte',
      category: 'specialized',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, Marco de Competencias',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {
        'La Rioja': {
          isAuthorized: true,
          baseLegal: 'Normativa regional La Rioja',
          requirements: ['Título oficial de Fisioterapeuta'],
          notes: 'Incluye técnicas invasivas (punción seca, EPI)'
        }
      },
      riskLevel: 'medium',
      requiresCertification: false
    },
    {
      id: 'specialized-pediatric-physio',
      name: 'Fisioterapia Pediátrica',
      description: 'Especialización en fisioterapia aplicada a la población pediátrica',
      category: 'specialized',
      nationalLevel: {
        isAuthorized: true,
        baseLegal: 'Real Decreto 1001/2002, Marco de Competencias',
        requirements: ['Título oficial de Fisioterapeuta']
      },
      regionalLevel: {},
      riskLevel: 'medium',
      requiresCertification: false
    }
  ];

  /**
   * Verificación silenciosa para salvaguardar la práctica profesional
   * Solo activa advertencias cuando es necesario
   */
  silentCompetencyCheck(
    competencyId: string,
    region: string,
    userCertifications: string[],
    isPublicSector: boolean = false
  ): SilentCompetencyCheck {
    const competency = this.competencies.find(c => c.id === competencyId);
    
    if (!competency) {
      return {
        isSafe: false,
        shouldWarn: true,
        warningMessage: 'Competencia no reconocida en el sistema',
        recommendation: 'Contactar con soporte técnico',
        riskLevel: 'high'
      };
    }

    const regionalInfo = competency.regionalLevel[region];
    const isAuthorized = competency.nationalLevel.isAuthorized && 
      (!regionalInfo || regionalInfo.isAuthorized);

    // Si está autorizado y no requiere certificación, es seguro
    if (isAuthorized && !competency.requiresCertification) {
      return {
        isSafe: true,
        shouldWarn: false,
        riskLevel: 'none'
      };
    }

    // Si requiere certificación, verificar si la tiene
    if (competency.requiresCertification) {
      const hasCertification = userCertifications.some(cert => 
        cert.toLowerCase().includes(competency.name.toLowerCase()) ||
        cert.toLowerCase().includes(competencyId)
      );

      if (!hasCertification) {
        return {
          isSafe: false,
          shouldWarn: true,
          warningMessage: `Certificación requerida para ${competency.name}`,
          recommendation: `Obtener formación especializada (${competency.certificationHours}h recomendadas)`,
          riskLevel: competency.riskLevel
        };
      }
    }

    // Verificar requisitos regionales específicos
    if (regionalInfo) {
      if (regionalInfo.registrationRequired) {
        return {
          isSafe: false,
          shouldWarn: true,
          warningMessage: `Requisito específico de ${region}: registro obligatorio`,
          recommendation: `Contactar con el colegio profesional de ${region}`,
          riskLevel: 'high'
        };
      }
    }

    // Verificar restricciones del sector público
    if (isPublicSector && competency.publicSectorRestrictions) {
      return {
        isSafe: false,
        shouldWarn: true,
        warningMessage: 'Restricciones específicas en sector público',
        recommendation: 'Verificar cartera de servicios de la institución',
        riskLevel: 'medium'
      };
    }

    // Si pasa todas las verificaciones, es seguro
    return {
      isSafe: true,
      shouldWarn: false,
      riskLevel: 'none'
    };
  }

  /**
   * Validación completa (solo para uso interno/administrativo)
   */
  validateCompetency(
    competencyId: string,
    region: string,
    userCertifications: string[],
    isPublicSector: boolean = false
  ): CompetencyValidation {
    const competency = this.competencies.find(c => c.id === competencyId);
    
    if (!competency) {
      return {
        isAuthorized: false,
        requirements: [],
        warnings: ['Competencia no encontrada en el sistema'],
        recommendations: ['Contactar con soporte técnico'],
        baseLegal: 'No aplicable'
      };
    }

    const regionalInfo = competency.regionalLevel[region];
    const isAuthorized = competency.nationalLevel.isAuthorized && 
      (!regionalInfo || regionalInfo.isAuthorized);

    const requirements: string[] = [...competency.nationalLevel.requirements || []];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Verificar requisitos regionales específicos
    if (regionalInfo) {
      if (regionalInfo.requirements) {
        requirements.push(...regionalInfo.requirements);
      }
      
      if (regionalInfo.registrationRequired) {
        requirements.push(`Registro obligatorio en ${region}`);
        warnings.push(`⚠️ Requisito específico de ${region}: registro obligatorio`);
      }
    }

    // Verificar certificaciones requeridas
    if (competency.requiresCertification) {
      const hasCertification = userCertifications.some(cert => 
        cert.toLowerCase().includes(competency.name.toLowerCase()) ||
        cert.toLowerCase().includes(competencyId)
      );

      if (!hasCertification) {
        warnings.push(`⚠️ Certificación requerida: ${competency.name}`);
        recommendations.push(`Obtener formación especializada (${competency.certificationHours}h recomendadas)`);
      }
    }

    // Verificar restricciones del sector público
    if (isPublicSector && competency.publicSectorRestrictions) {
      warnings.push(`⚠️ Restricciones específicas en sector público`);
      recommendations.push('Verificar cartera de servicios de la institución');
    }

    // Generar recomendaciones adicionales
    if (competency.riskLevel === 'high') {
      recommendations.push('Mantener documentación detallada del consentimiento informado');
      recommendations.push('Verificar cobertura del seguro de responsabilidad civil');
    }

    return {
      isAuthorized,
      requirements,
      warnings,
      recommendations,
      baseLegal: competency.nationalLevel.baseLegal,
      regionalSpecifics: regionalInfo ? {
        region,
        additionalRequirements: regionalInfo.additionalCertifications || [],
        notes: regionalInfo.notes || ''
      } : undefined
    };
  }

  /**
   * Obtiene todas las competencias disponibles para una región
   */
  getAvailableCompetencies(region: string): ProfessionalCompetency[] {
    return this.competencies.filter(competency => {
      const validation = this.validateCompetency(competency.id, region, []);
      return validation.isAuthorized;
    });
  }

  /**
   * Obtiene competencias por categoría
   */
  getCompetenciesByCategory(category: string): ProfessionalCompetency[] {
    return this.competencies.filter(c => c.category === category);
  }

  /**
   * Genera checklist de seguridad legal para una región (solo uso interno)
   */
  generateLegalChecklist(region: string): {
    title: string;
    items: Array<{
      id: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      category: string;
    }>;
  } {
    const checklist = {
      title: `Checklist de Seguridad Legal - ${region}`,
      items: [
        {
          id: 'title-verification',
          description: 'Verificar que el título de Fisioterapeuta esté homologado y en vigor',
          priority: 'critical' as const,
          category: 'Requisitos Básicos'
        },
        {
          id: 'college-registration',
          description: 'Confirmar colegiación obligatoria en el colegio profesional de la región',
          priority: 'critical' as const,
          category: 'Requisitos Básicos'
        },
        {
          id: 'insurance-coverage',
          description: 'Verificar cobertura del seguro de responsabilidad civil profesional',
          priority: 'high' as const,
          category: 'Protección Legal'
        },
        {
          id: 'informed-consent',
          description: 'Documentar consentimiento informado para todas las intervenciones',
          priority: 'high' as const,
          category: 'Protección Legal'
        },
        {
          id: 'continuous-education',
          description: 'Mantener formación continuada actualizada según LOPS',
          priority: 'medium' as const,
          category: 'Desarrollo Profesional'
        }
      ]
    };

    // Agregar items específicos de la región
    if (region === 'Cataluña') {
      checklist.items.push({
        id: 'dry-needling-registry',
        description: 'Registro obligatorio de Punción Seca en Col·legi de Fisioterapeutes de Catalunya',
        priority: 'critical' as const,
        category: 'Requisitos Específicos Regionales'
      });
    }

    if (region === 'Cantabria') {
      checklist.items.push({
        id: 'invasive-techniques-commission',
        description: 'Consultar Comisión de Fisioterapia Invasiva del ICPFC',
        priority: 'high' as const,
        category: 'Requisitos Específicos Regionales'
      });
    }

    return checklist;
  }

  /**
   * Simula la validación silenciosa (para desarrollo)
   */
  async simulateSilentCheck(
    competencyId: string,
    region: string,
    userCertifications: string[]
  ): Promise<SilentCompetencyCheck> {
    console.log('🔍 SIMULANDO VERIFICACIÓN SILENCIOSA:');
    console.log('🔍 Competencia:', competencyId);
    console.log('🔍 Región:', region);
    console.log('🔍 Certificaciones:', userCertifications);
    
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return this.silentCompetencyCheck(competencyId, region, userCertifications);
  }
}

export const professionalCompetencyService = new ProfessionalCompetencyService(); 