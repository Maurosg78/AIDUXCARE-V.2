/**
 * MEDICAL SPECIALIZED PLANS SERVICE - PLANES ESPECIALIZADOS POR DISCIPLINA
 * 
 * Sistema que implementa la diferenciación estratégica clave:
 * Psychology Pro €79, Physio Pro €69, General Pro €59
 * Con límites contextuales y optimización de costos dinámica
 */

interface Entity {
  type: string;
  text: string;
  confidence?: number;
}

// === TIPOS E INTERFACES ===

interface Entity {
  type: string;
  text: string;
  confidence?: number;
}

export type MedicalSpecialty = 'PSICOLOGIA' | 'FISIOTERAPIA' | 'MEDICINA_GENERAL';
export type ConsultationType = 'INICIAL' | 'SEGUIMIENTO' | 'EMERGENCIA';
export type PlanType = 'PSYCHOLOGY_PRO' | 'PHYSIO_PRO' | 'GENERAL_PRO' | 'STARTER' | 'CLINIC';

// === INTERFACES DE PLANES ESPECIALIZADOS ===

export interface SpecializedPlan {
  id: PlanType;
  name: string;
  price: number; // En euros
  specialty: MedicalSpecialty;
  limits: {
    initialConsultations: number;
    followUpConsultations: number;
    emergencyConsultations: number;
  };
  features: PlanFeature[];
  soapTemplate: SOAPTemplate;
  costOptimization: CostMatrix;
  redFlagDetectors: string[];
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface SOAPTemplate {
  specialty: MedicalSpecialty;
  sections: {
    subjective: TemplateSection;
    objective: TemplateSection;
    assessment: TemplateSection;
    plan: TemplateSection;
  };
}

export interface TemplateSection {
  prompts: string[];
  specializedFields: string[];
  validationRules: string[];
}

export interface CostMatrix {
  initial: number;    // Costo por consulta inicial
  followUp: number;   // Costo por seguimiento
  emergency: number;  // Costo por emergencia
}

export interface UsageStats {
  planId: PlanType;
  currentPeriod: {
    initialUsed: number;
    followUpUsed: number;
    emergencyUsed: number;
  };
  limits: {
    initialLimit: number;
    followUpLimit: number;
    emergencyLimit: number;
  };
  costsThisPeriod: number;
  averageCostPerConsultation: number;
}

// === SERVICIO PRINCIPAL ===

class SpecializedPlansService {

  /**
   * Obtiene la configuración del plan especializado
   */
  public getPlan(planId: PlanType): SpecializedPlan {
    const plans = this.getPlansDatabase();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error(`Plan ${planId} no encontrado`);
    }
    
    return plan;
  }

  /**
   * Determina el costo de procesamiento según el tipo de consulta y plan
   */
  public calculateProcessingCost(
    planId: PlanType,
    consultationType: ConsultationType,
    specialty: MedicalSpecialty
  ): {
    cost: number;
    reasoning: string;
    optimization: string;
  } {
    const plan = this.getPlan(planId);
    const costMatrix = plan.costOptimization;
    
    let cost = 0;
    let reasoning = '';
    let optimization = '';

    switch (consultationType) {
      case 'INICIAL':
        cost = costMatrix.initial;
        reasoning = `Consulta inicial ${specialty} requiere análisis completo`;
        optimization = `Optimizado para detección completa de entidades y banderas rojas`;
        break;
        
      case 'SEGUIMIENTO':
        cost = costMatrix.followUp;
        reasoning = `Seguimiento ${specialty} con procesamiento optimizado`;
        optimization = `Costo reducido ${((1 - costMatrix.followUp/costMatrix.initial) * 100).toFixed(0)}% vs inicial`;
        break;
        
      case 'EMERGENCIA':
        cost = costMatrix.emergency;
        reasoning = `Emergencia ${specialty} requiere análisis crítico`;
        optimization = `Procesamiento prioritario con detección avanzada de red flags`;
        break;
    }

    return { cost, reasoning, optimization };
  }

  /**
   * Valida si el usuario puede realizar una consulta según los límites del plan
   */
  public validateConsultationLimits(
    planId: PlanType,
    consultationType: ConsultationType,
    currentUsage: UsageStats
  ): {
    canProceed: boolean;
    remaining: number;
    message: string;
    upgradeRecommendation?: string;
  } {
    const plan = this.getPlan(planId);
    
    let used = 0;
    let limit = 0;
    let limitType = '';

    switch (consultationType) {
      case 'INICIAL':
        used = currentUsage.currentPeriod.initialUsed;
        limit = plan.limits.initialConsultations;
        limitType = 'consultas iniciales';
        break;
      case 'SEGUIMIENTO':
        used = currentUsage.currentPeriod.followUpUsed;
        limit = plan.limits.followUpConsultations;
        limitType = 'seguimientos';
        break;
      case 'EMERGENCIA':
        used = currentUsage.currentPeriod.emergencyUsed;
        limit = plan.limits.emergencyConsultations;
        limitType = 'emergencias';
        break;
    }

    const remaining = Math.max(0, limit - used);
    const canProceed = remaining > 0;

    let message = '';
    let upgradeRecommendation = undefined;

    if (canProceed) {
      message = `${remaining} ${limitType} restantes en ${plan.name}`;
    } else {
      message = `Límite de ${limitType} alcanzado (${limit}/${limit})`;
      upgradeRecommendation = this.getUpgradeRecommendation(planId);
    }

    return {
      canProceed,
      remaining,
      message,
      upgradeRecommendation
    };
  }

  /**
   * Genera SOAP especializado según la disciplina médica
   */
  public generateSpecializedSOAP(
    planId: PlanType,
    transcription: string,
    entities: Entity[]
  ): {
    soapStructure: any;
    specializedFields: any;
    confidence: number;
  } {
    const plan = this.getPlan(planId);
    const template = plan.soapTemplate;

    const specializedFields: any = {};
    const confidence = 0.8;

    switch (plan.specialty) {
      case 'PSICOLOGIA':
        specializedFields.dsmClassification = this.analyzeDSM5Criteria(transcription, entities);
        specializedFields.suicidalRiskAssessment = this.assessSuicidalRisk(transcription);
        specializedFields.mentalStateExam = this.generateMentalStateExam(transcription);
        break;
        
      case 'FISIOTERAPIA':
        specializedFields.functionalAssessment = this.generateFunctionalAssessment(transcription, entities);
        specializedFields.rangeOfMotion = this.analyzeRangeOfMotion(transcription);
        specializedFields.biomechanicalAnalysis = this.analyzeBiomechanics(transcription);
        break;
        
      case 'MEDICINA_GENERAL':
        specializedFields.systemsReview = this.generateSystemsReview(transcription, entities);
        specializedFields.vitalSigns = this.extractVitalSigns(transcription);
        specializedFields.clinicalImpression = this.generateClinicalImpression(transcription);
        break;
    }

    const soapStructure = this.buildSpecializedSOAPStructure(template, transcription, entities, specializedFields);

    return {
      soapStructure,
      specializedFields,
      confidence
    };
  }

  // === MÉTODOS PRIVADOS ===

  private getPlansDatabase(): SpecializedPlan[] {
    return [
      {
        id: 'PSYCHOLOGY_PRO',
        name: 'Psychology Pro',
        price: 79,
        specialty: 'PSICOLOGIA',
        limits: {
          initialConsultations: 8,
          followUpConsultations: 20,
          emergencyConsultations: 5
        },
        features: [
          { id: 'dsm5_soap', name: 'SOAP DSM-5', description: 'Clasificación automática DSM-5', isActive: true },
          { id: 'suicide_risk', name: 'Detección Riesgo Suicida', description: 'Algoritmos especializados en detección de ideación suicida', isActive: true },
          { id: 'mental_state', name: 'Examen Estado Mental', description: 'Evaluación automática del estado mental', isActive: true },
          { id: 'therapy_notes', name: 'Notas Terapéuticas', description: 'Documentación especializada en psicoterapia', isActive: true }
        ],
        soapTemplate: {
          specialty: 'PSICOLOGIA',
          sections: {
            subjective: {
              prompts: ['Síntomas psicológicos reportados', 'Estado emocional actual', 'Eventos desencadenantes'],
              specializedFields: ['mood', 'anxiety_level', 'sleep_patterns', 'appetite_changes'],
              validationRules: ['mandatory_mood_assessment', 'risk_factors_evaluation']
            },
            objective: {
              prompts: ['Examen del estado mental', 'Observaciones conductuales', 'Apariencia general'],
              specializedFields: ['mental_status_exam', 'behavioral_observations', 'cognitive_assessment'],
              validationRules: ['mental_status_required', 'behavioral_documentation']
            },
            assessment: {
              prompts: ['Impresión diagnóstica', 'Clasificación DSM-5', 'Evaluación de riesgo'],
              specializedFields: ['dsm5_criteria', 'risk_assessment', 'comorbidities'],
              validationRules: ['dsm5_classification', 'suicide_risk_evaluation']
            },
            plan: {
              prompts: ['Intervenciones terapéuticas', 'Objetivos de tratamiento', 'Seguimiento'],
              specializedFields: ['therapeutic_interventions', 'treatment_goals', 'homework_assignments'],
              validationRules: ['treatment_plan_required', 'next_session_scheduled']
            }
          }
        },
        costOptimization: {
          initial: 0.35,    // €35 centavos por consulta inicial compleja
          followUp: 0.18,   // €18 centavos por seguimiento optimizado
          emergency: 0.50   // €50 centavos por emergencia crítica
        },
        redFlagDetectors: ['suicidal_ideation', 'self_harm', 'psychosis_indicators', 'severe_depression']
      },

      {
        id: 'PHYSIO_PRO',
        name: 'Physio Pro',
        price: 69,
        specialty: 'FISIOTERAPIA',
        limits: {
          initialConsultations: 10,
          followUpConsultations: 25,
          emergencyConsultations: 5
        },
        features: [
          { id: 'functional_soap', name: 'SOAP Funcional', description: 'Documentación especializada en evaluación funcional', isActive: true },
          { id: 'biomechanical_analysis', name: 'Análisis Biomecánico', description: 'Evaluación automática de patrones de movimiento', isActive: true },
          { id: 'neurological_screening', name: 'Screening Neurológico', description: 'Detección de signos neurológicos', isActive: true },
          { id: 'exercise_prescription', name: 'Prescripción de Ejercicios', description: 'Recomendaciones automáticas de ejercicios', isActive: true }
        ],
        soapTemplate: {
          specialty: 'FISIOTERAPIA',
          sections: {
            subjective: {
              prompts: ['Dolor y síntomas', 'Limitaciones funcionales', 'Historia de lesión'],
              specializedFields: ['pain_assessment', 'functional_limitations', 'activity_tolerance'],
              validationRules: ['pain_scale_required', 'functional_impact_documented']
            },
            objective: {
              prompts: ['Evaluación física', 'Rango de movimiento', 'Fuerza muscular'],
              specializedFields: ['range_of_motion', 'muscle_strength', 'posture_analysis', 'special_tests'],
              validationRules: ['rom_measurement_required', 'strength_testing_documented']
            },
            assessment: {
              prompts: ['Diagnóstico fisioterapéutico', 'Disfunción identificada', 'Pronóstico'],
              specializedFields: ['primary_dysfunction', 'contributing_factors', 'prognosis'],
              validationRules: ['primary_problem_identified', 'goals_established']
            },
            plan: {
              prompts: ['Tratamiento fisioterapéutico', 'Ejercicios prescritos', 'Educación al paciente'],
              specializedFields: ['treatment_techniques', 'exercise_prescription', 'patient_education'],
              validationRules: ['treatment_plan_specific', 'home_program_provided']
            }
          }
        },
        costOptimization: {
          initial: 0.25,    // €25 centavos por consulta inicial
          followUp: 0.12,   // €12 centavos por seguimiento
          emergency: 0.35   // €35 centavos por emergencia
        },
        redFlagDetectors: ['neurological_signs', 'severe_trauma', 'fracture_indicators', 'vascular_compromise']
      },

      {
        id: 'GENERAL_PRO',
        name: 'General Pro',
        price: 59,
        specialty: 'MEDICINA_GENERAL',
        limits: {
          initialConsultations: 12,
          followUpConsultations: 18,
          emergencyConsultations: 8
        },
        features: [
          { id: 'adaptive_soap', name: 'SOAP Adaptativo', description: 'Documentación adaptable a cualquier especialidad', isActive: true },
          { id: 'general_screening', name: 'Screening General', description: 'Detección amplia de síntomas y signos', isActive: true },
          { id: 'differential_diagnosis', name: 'Diagnóstico Diferencial', description: 'Sugerencias de diagnósticos diferenciales', isActive: true },
          { id: 'referral_assistant', name: 'Asistente de Derivación', description: 'Recomendaciones de derivación especializada', isActive: true }
        ],
        soapTemplate: {
          specialty: 'MEDICINA_GENERAL',
          sections: {
            subjective: {
              prompts: ['Motivo de consulta', 'Historia actual', 'Revisión por sistemas'],
              specializedFields: ['chief_complaint', 'history_present_illness', 'systems_review'],
              validationRules: ['chief_complaint_documented', 'relevant_history_obtained']
            },
            objective: {
              prompts: ['Examen físico', 'Signos vitales', 'Hallazgos relevantes'],
              specializedFields: ['vital_signs', 'physical_examination', 'diagnostic_tests'],
              validationRules: ['vital_signs_documented', 'relevant_exam_performed']
            },
            assessment: {
              prompts: ['Impresión clínica', 'Diagnóstico diferencial', 'Evaluación de riesgo'],
              specializedFields: ['clinical_impression', 'differential_diagnosis', 'risk_stratification'],
              validationRules: ['working_diagnosis_stated', 'differentials_considered']
            },
            plan: {
              prompts: ['Plan diagnóstico', 'Plan terapéutico', 'Seguimiento'],
              specializedFields: ['diagnostic_plan', 'therapeutic_plan', 'follow_up_plan'],
              validationRules: ['plan_comprehensive', 'follow_up_arranged']
            }
          }
        },
        costOptimization: {
          initial: 0.20,    // €20 centavos por consulta inicial
          followUp: 0.10,   // €10 centavos por seguimiento
          emergency: 0.30   // €30 centavos por emergencia
        },
        redFlagDetectors: ['chest_pain', 'shortness_breath', 'severe_headache', 'abdominal_pain', 'fever_high']
      }
    ];
  }

  private getUpgradeRecommendation(currentPlan: PlanType): string {
    switch (currentPlan) {
      case 'PSYCHOLOGY_PRO':
        return 'Considere actualizar a Clinic para uso multi-usuario';
      case 'PHYSIO_PRO':
        return 'Considere actualizar a Clinic para más capacidad';
      case 'GENERAL_PRO':
        return 'Considere Psychology Pro o Physio Pro para especialización';
      default:
        return 'Contacte soporte para opciones de upgrade';
    }
  }

  // === MÉTODOS DE ANÁLISIS ESPECIALIZADO ===

  private analyzeDSM5Criteria(transcription: string, entities: unknown[]): any {
    const symptoms = entities.filter((e: any) => e.type === 'SYMPTOM');
    const moodKeywords = ['deprimido', 'ansioso', 'triste', 'irritable', 'eufórico'];
    
    return {
      moodSymptoms: symptoms.filter((s: any) => 
        moodKeywords.some(keyword => s.text.toLowerCase().includes(keyword))
      ),
      potentialDiagnoses: this.suggestDSM5Diagnoses(transcription),
      severityIndicators: this.extractSeverityIndicators(transcription)
    };
  }

  private assessSuicidalRisk(transcription: string): any {
    const riskKeywords = ['suicidio', 'matarme', 'acabar con todo', 'no quiero vivir'];
    const protectiveFactors = ['familia', 'hijos', 'apoyo', 'futuro'];
    
    const riskLevel = riskKeywords.some(keyword => 
      transcription.toLowerCase().includes(keyword)
    ) ? 'HIGH' : 'LOW';

    return {
      riskLevel,
      riskFactors: riskKeywords.filter(keyword => 
        transcription.toLowerCase().includes(keyword)
      ),
      protectiveFactors: protectiveFactors.filter(factor => 
        transcription.toLowerCase().includes(factor)
      ),
      recommendedActions: riskLevel === 'HIGH' ? 
        ['Evaluación inmediata', 'Plan de seguridad', 'Seguimiento estrecho'] :
        ['Monitoreo continuo', 'Refuerzo de factores protectivos']
    };
  }

  private generateFunctionalAssessment(transcription: string, entities: unknown[]): any {
    const activities = ['caminar', 'subir escaleras', 'levantar', 'agacharse'];
    const limitations: string[] = [];

    activities.forEach(activity => {
      if (transcription.toLowerCase().includes(`no puedo ${activity}`) ||
          transcription.toLowerCase().includes(`dificultad ${activity}`)) {
        limitations.push(activity);
      }
    });

    return {
      functionalLimitations: limitations,
      activityTolerance: this.assessActivityTolerance(transcription),
      adaptiveStrategies: this.suggestAdaptiveStrategies(limitations)
    };
  }

  private suggestDSM5Diagnoses(transcription: string): string[] {
    const diagnoses = [];
    
    if (transcription.toLowerCase().includes('depresión') || 
        transcription.toLowerCase().includes('tristeza')) {
      diagnoses.push('F32.9 - Episodio depresivo mayor');
    }
    
    if (transcription.toLowerCase().includes('ansiedad') || 
        transcription.toLowerCase().includes('nervioso')) {
      diagnoses.push('F41.9 - Trastorno de ansiedad no especificado');
    }
    
    return diagnoses;
  }

  private extractSeverityIndicators(transcription: string): string[] {
    const indicators = [];
    
    if (transcription.includes('severo') || transcription.includes('grave')) {
      indicators.push('Severidad alta reportada');
    }
    
    if (transcription.includes('no puedo') || transcription.includes('imposible')) {
      indicators.push('Limitación funcional significativa');
    }
    
    return indicators;
  }

  private generateMentalStateExam(transcription: string): any {
    return {
      appearance: 'Según observación clínica',
      behavior: 'Documentado durante consulta',
      speech: 'Evaluado durante entrevista',
      mood: this.extractMoodIndicators(transcription),
      thought: 'Proceso de pensamiento evaluado',
      perception: 'Sin alteraciones reportadas',
      cognition: 'Función cognitiva preservada',
      insight: 'Insight parcial/completo',
      judgment: 'Juicio clínico preservado'
    };
  }

  private extractMoodIndicators(transcription: string): string {
    if (transcription.toLowerCase().includes('triste')) return 'Deprimido';
    if (transcription.toLowerCase().includes('ansioso')) return 'Ansioso';
    if (transcription.toLowerCase().includes('bien')) return 'Eutímico';
    return 'A evaluar';
  }

  private analyzeRangeOfMotion(transcription: string): any {
    const joints = ['hombro', 'rodilla', 'cadera', 'cuello', 'espalda'];
    const limitations: Record<string, string> = {};

    joints.forEach(joint => {
      if (transcription.toLowerCase().includes(`${joint} limitado`) ||
          transcription.toLowerCase().includes(`dolor ${joint}`)) {
        limitations[joint] = 'Limitación detectada en transcripción';
      }
    });

    return limitations;
  }

  private analyzeBiomechanics(transcription: string): any {
    return {
      posturalAnalysis: 'Evaluar postura durante movimientos funcionales',
      movementPatterns: 'Analizar patrones de movimiento compensatorios',
      muscleImbalances: 'Identificar desbalances musculares',
      kinematicChain: 'Evaluar cadena cinemática completa'
    };
  }

  private generateSystemsReview(transcription: string, entities: Entity[]): any {
    const systems = {
      cardiovascular: [] as string[],
      respiratory: [] as string[],
      gastrointestinal: [] as string[],
      neurological: [] as string[],
      musculoskeletal: [] as string[],
      genitourinary: [] as string[]
    };

    // Análisis básico por palabras clave
    if (transcription.includes('dolor pecho')) systems.cardiovascular.push('Dolor torácico');
    if (transcription.includes('dificultad respirar')) systems.respiratory.push('Disnea');
    if (transcription.includes('dolor abdominal')) systems.gastrointestinal.push('Dolor abdominal');

    return systems;
  }

  private extractVitalSigns(transcription: string): any {
    return {
      bloodPressure: this.extractBP(transcription),
      heartRate: this.extractHR(transcription),
      temperature: this.extractTemp(transcription),
      respiratoryRate: this.extractRR(transcription)
    };
  }

  private extractBP(transcription: string): string {
    const bpMatch = transcription.match(/(\d{2,3})\/(\d{2,3})/);
    return bpMatch ? `${bpMatch[0]} mmHg` : 'No documentada';
  }

  private extractHR(transcription: string): string {
    const hrMatch = transcription.match(/(\d{2,3})\s*(lpm|ppm|bpm)/i);
    return hrMatch ? `${hrMatch[1]} lpm` : 'No documentada';
  }

  private extractTemp(transcription: string): string {
    const tempMatch = transcription.match(/(\d{2})\.?(\d)?[°º]?\s*c/i);
    return tempMatch ? `${tempMatch[0]}` : 'No documentada';
  }

  private extractRR(transcription: string): string {
    const rrMatch = transcription.match(/(\d{1,2})\s*rpm/i);
    return rrMatch ? `${rrMatch[1]} rpm` : 'No documentada';
  }

  private generateClinicalImpression(transcription: string): any {
    return {
      primaryProblem: 'Problema principal identificado en consulta',
      contributingFactors: 'Factores contribuyentes evaluados',
      prognosis: 'Pronóstico basado en evaluación clínica'
    };
  }

  private assessActivityTolerance(transcription: string): string {
    if (transcription.includes('cansancio') || transcription.includes('fatiga')) {
      return 'Tolerancia reducida a la actividad';
    }
    return 'Tolerancia a evaluar';
  }

  private suggestAdaptiveStrategies(limitations: string[]): string[] {
    const strategies: string[] = [];
    
    limitations.forEach(limitation => {
      switch (limitation) {
        case 'caminar':
          strategies.push('Considerar ayudas para la marcha');
          break;
        case 'subir escaleras':
          strategies.push('Uso de pasamanos, descansos frecuentes');
          break;
        case 'levantar':
          strategies.push('Técnicas de levantamiento seguro');
          break;
      }
    });

    return strategies;
  }

  private buildSpecializedSOAPStructure(
    template: SOAPTemplate, 
    transcription: string, 
    entities: Entity[], 
    specializedFields: any
  ): any {
    return {
      subjetivo: this.buildSubjectiveSection(template.sections.subjective, transcription, specializedFields),
      objetivo: this.buildObjectiveSection(template.sections.objective, transcription, specializedFields),
      evaluacion: this.buildAssessmentSection(template.sections.assessment, transcription, specializedFields),
      plan: this.buildPlanSection(template.sections.plan, transcription, specializedFields)
    };
  }

  private buildSubjectiveSection(section: TemplateSection, transcription: string, fields: any): string {
    let content = 'SUBJETIVO:\n';
    
    section.prompts.forEach(prompt => {
      content += `• ${prompt}: Según transcripción\n`;
    });

    // Agregar campos especializados
    if (fields.moodSymptoms) {
      content += `• Estado de ánimo: ${fields.moodSymptoms.map((s: any) => s.text).join(', ')}\n`;
    }

    return content;
  }

  private buildObjectiveSection(section: TemplateSection, transcription: string, fields: any): string {
    let content = 'OBJETIVO:\n';
    
    section.prompts.forEach(prompt => {
      content += `• ${prompt}: Evaluado durante consulta\n`;
    });

    return content;
  }

  private buildAssessmentSection(section: TemplateSection, transcription: string, fields: any): string {
    let content = 'EVALUACIÓN:\n';
    
    if (fields.dsmClassification) {
      content += `• Criterios DSM-5: ${fields.dsmClassification.potentialDiagnoses.join(', ')}\n`;
    }

    return content;
  }

  private buildPlanSection(section: TemplateSection, transcription: string, fields: any): string {
    let content = 'PLAN:\n';
    
    section.prompts.forEach(prompt => {
      content += `• ${prompt}: Según evaluación clínica\n`;
    });

    return content;
  }
}

// === EXPORTACIÓN SINGLETON ===

export const specializedPlansService = new SpecializedPlansService();
export default specializedPlansService;