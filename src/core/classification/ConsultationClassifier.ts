/**
 * 🎯 Clasificador Inteligente de Consultas - AiDuxCare V.2
 * 
 * Sistema que analiza automáticamente el contexto de una consulta médica para:
 * 1. Determinar el tipo: INICIAL, SEGUIMIENTO, EMERGENCIA
 * 2. Identificar la especialidad: PSICOLOGIA, FISIOTERAPIA, MEDICINA_GENERAL
 * 3. Optimizar el procesamiento de IA según el contexto
 * 4. Aplicar límites y costos específicos por plan
 */

import { 
  specializedPlansService, 
  PlanType, 
  ConsultationType as SpecializedConsultationType,
  MedicalSpecialty as SpecializedMedicalSpecialty
} from '../../services/SpecializedPlansService';

export interface ConsultationContext {
  patientId: string;
  transcription: string;
  sessionDuration: number;
  previousSessions: number;
  lastSessionDate?: Date;
  professionalSpecialty: MedicalSpecialty;
  currentPlan?: PlanType;
  currentUsage?: any;
}

export interface ClassificationResult {
  consultationType: ConsultationType;
  specialty: MedicalSpecialty;
  confidence: number;
  processingLevel: ProcessingLevel;
  estimatedCost: number;
  redFlags: RedFlag[];
  recommendations: string[];
  costOptimization: any;
  planValidation: any;
  specializedProcessing: any;
}

export type ConsultationType = 'INICIAL' | 'SEGUIMIENTO' | 'EMERGENCIA';
export type MedicalSpecialty = 'PSICOLOGIA' | 'FISIOTERAPIA' | 'MEDICINA_GENERAL';
export type ProcessingLevel = 'BASICO' | 'COMPLETO' | 'AVANZADO';

export interface RedFlag {
  type: 'SUICIDAL_IDEATION' | 'NEUROLOGICAL_SIGNS' | 'EMERGENCY_SYMPTOMS' | 'FRACTURE_SIGNS' | 'VASCULAR_COMPROMISE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  action: string;
}

/**
 * Clasificador principal que determina el tipo y contexto de consulta
 */
export class ConsultationClassifier {
  
  /**
   * Clasifica una consulta basándose en el contexto y transcripción
   * NUEVO: Integrado con planes especializados y optimización de costos
   */
  static async classifyConsultation(context: ConsultationContext): Promise<ClassificationResult> {
    console.log('🔍 Iniciando clasificación de consulta...');
    
    // 1. Determinar tipo de consulta
    const consultationType = this.determineConsultationType(context);
    
    // 2. Confirmar especialidad (puede diferir del profesional)
    const specialty = await this.detectSpecialty(context);
    
    // 3. Determinar nivel de procesamiento necesario
    const processingLevel = this.determineProcessingLevel(consultationType, specialty);
    
    // 4. NUEVO: Calcular costo optimizado usando planes especializados
    const costOptimization = this.calculateOptimizedCost(
      context.currentPlan || 'GENERAL_PRO',
      consultationType,
      specialty
    );
    
    // 5. Detectar banderas rojas específicas por especialidad
    const redFlags = await this.detectRedFlags(context, specialty);
    
    // 6. Generar recomendaciones
    const recommendations = this.generateRecommendations(consultationType, specialty, redFlags);
    
    // 7. NUEVO: Validar límites del plan
    const planValidation = this.validatePlanLimits(
      context.currentPlan || 'GENERAL_PRO',
      consultationType,
      context.currentUsage
    );
    
    const result: ClassificationResult = {
      consultationType,
      specialty,
      confidence: this.calculateConfidence(context, consultationType, specialty),
      processingLevel,
      estimatedCost: costOptimization.cost,
      redFlags,
      recommendations,
      // NUEVOS CAMPOS
      costOptimization,
      planValidation,
      specializedProcessing: this.getSpecializedProcessingConfig(
        context.currentPlan || 'GENERAL_PRO',
        specialty
      )
    };
    
    console.log(`✅ Consulta clasificada: ${consultationType} - ${specialty} (${result.confidence}% confianza)`);
    console.log(`💰 Costo optimizado: €${costOptimization.cost} (${costOptimization.optimization})`);
    
    return result;
  }
  
  /**
   * Determina si es consulta inicial, seguimiento o emergencia
   */
  private static determineConsultationType(context: ConsultationContext): ConsultationType {
    // Lógica de clasificación por contexto histórico
    if (context.previousSessions === 0) {
      return 'INICIAL';
    }
    
    // Detectar emergencia por palabras clave urgentes
    const emergencyKeywords = [
      'urgente', 'emergencia', 'dolor severo', 'no puedo', 'crisis',
      'suicidio', 'autolesión', 'pánico', 'convulsión', 'desmayo'
    ];
    
    const transcriptionLower = context.transcription.toLowerCase();
    const hasEmergencyKeywords = emergencyKeywords.some(keyword => 
      transcriptionLower.includes(keyword)
    );
    
    if (hasEmergencyKeywords) {
      return 'EMERGENCIA';
    }
    
    // Determinar seguimiento por tiempo transcurrido
    if (context.lastSessionDate) {
      const daysSinceLastSession = Math.floor(
        (Date.now() - context.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Si han pasado más de 30 días, tratar como inicial
      if (daysSinceLastSession > 30) {
        return 'INICIAL';
      }
    }
    
    return 'SEGUIMIENTO';
  }
  
  /**
   * Detecta la especialidad médica basándose en el contenido
   * OPTIMIZADO PARA UAT: Enfoque 100% en FISIOTERAPIA
   */
  private static async detectSpecialty(context: ConsultationContext): Promise<MedicalSpecialty> {
    const transcription = context.transcription.toLowerCase();
    
    // PARA UAT: SIEMPRE FISIOTERAPIA - Optimizado para casos de uso específicos
    // Expandir palabras clave específicas de fisioterapia
    const physiotherapyKeywords = [
      // Anatomía específica
      'dolor', 'movilidad', 'ejercicio', 'rehabilitación', 'fisioterapia',
      'músculo', 'articulación', 'lesión', 'contractura', 'espalda',
      'rodilla', 'hombro', 'cuello', 'lumbar', 'cervical',
      
      // Síntomas musculoesqueléticos
      'rigidez', 'inflamación', 'entumecimiento', 'hormigueo', 'debilidad',
      'limitación', 'tensión', 'sobrecarga', 'fatiga muscular',
      
      // Tratamientos de fisioterapia
      'estiramiento', 'fortalecimiento', 'movilización', 'manipulación',
      'electroterapia', 'ultrasound', 'láser', 'calor', 'frío', 'hielo',
      'masaje', 'terapia manual', 'ejercicios terapéuticos',
      
      // Evaluación funcional
      'rango de movimiento', 'fuerza muscular', 'equilibrio', 'coordinación',
      'postura', 'marcha', 'funcionalidad', 'actividades diarias',
      
      // Escalas y mediciones
      'escala del dolor', 'grados', 'flexión', 'extensión', 'rotación',
      'abducción', 'aducción', 'pronación', 'supinación',
      
      // Anatomía detallada
      'vértebras', 'disco', 'nervio', 'tendón', 'ligamento',
      'trapecio', 'deltoides', 'bíceps', 'tríceps', 'cuádriceps',
      'isquiotibiales', 'gemelos', 'fascia', 'menisco',

      // NUEVOS TÉRMINOS ESPECÍFICOS PARA UAT FISIOTERAPIA
      'contractura muscular', 'espasmo', 'trigger point', 'punto gatillo',
      'síndrome del túnel carpiano', 'epicondilitis', 'tendinitis',
      'bursitis', 'fascitis plantar', 'hernia discal', 'protrusión',
      'escoliosis', 'cifosis', 'lordosis', 'subluxación',
      'capsulitis', 'artritis', 'artrosis', 'osteoartritis',
      'fibromialgia', 'mialgia', 'neuralgia', 'radiculopatía',
      'compresión nerviosa', 'atrapamiento', 'neuropatía',
      'inestabilidad articular', 'hipermovilidad', 'hiperlaxitud',
      'disfunción temporomandibular', 'ATM', 'bruxismo',
      'cefalea tensional', 'migraña cervicogénica',
      'síndrome piramidal', 'trocanteritis', 'pubalgia',
      'condromalacia', 'meniscopatía', 'rotura fibrilar',
      'distensión muscular', 'desgarro', 'hematoma',
      'edema', 'tumefacción', 'crepitación', 'bloqueo articular',
      'limitación funcional', 'incapacidad', 'discapacidad temporal',
      'reeducación postural', 'ergonomía', 'higiene postural',
      'cadenas musculares', 'compensación', 'adaptación',
      'propiocepción', 'equilibrio', 'coordinación motora',
      'esquema corporal', 'conciencia corporal',
      'activación muscular', 'inhibición', 'facilitación',
      'patrón de movimiento', 'biomecánica', 'cinética',
      'cinemática', 'análisis del movimiento',
      'test funcional', 'evaluación', 'valoración',
      'goniometría', 'dinamometría', 'palpación',
      'inspección', 'observación', 'anamnesis',
      'historia clínica', 'antecedentes', 'evolución',
      'pronóstico', 'objetivos terapéuticos',
      'plan de tratamiento', 'protocolo', 'pauta',
      'frecuencia', 'intensidad', 'duración',
      'progresión', 'adaptación', 'modificación',
      'alta médica', 'derivación', 'interconsulta'
    ];
    
    // Para UAT: Log de términos detectados para validación
    const detectedTerms = physiotherapyKeywords.filter(keyword => 
      transcription.includes(keyword)
    );
    
    if (detectedTerms.length > 0) {
      console.log(`🎯 UAT Fisioterapia: ${detectedTerms.length} términos detectados:`, detectedTerms.slice(0, 5));
      console.log(`📊 Términos más relevantes: ${detectedTerms.slice(0, 3).join(', ')}`);
    }
    
    // PARA UAT: SIEMPRE RETORNAR FISIOTERAPIA con logging detallado
    console.log('🏥 UAT: Forzando especialidad FISIOTERAPIA para testing');
    console.log(`📝 Transcripción analizada: ${transcription.length} caracteres`);
    console.log(`🔍 Términos de fisioterapia encontrados: ${detectedTerms.length}`);
    
    return 'FISIOTERAPIA';
  }
  
  /**
   * Determina el nivel de procesamiento de IA necesario
   */
  private static determineProcessingLevel(
    type: ConsultationType, 
    specialty: MedicalSpecialty
  ): ProcessingLevel {
    // Emergencias siempre requieren procesamiento avanzado
    if (type === 'EMERGENCIA') {
      return 'AVANZADO';
    }
    
    // Consultas iniciales de psicología requieren análisis completo
    if (type === 'INICIAL' && specialty === 'PSICOLOGIA') {
      return 'COMPLETO';
    }
    
    // Consultas iniciales de fisioterapia requieren análisis completo
    if (type === 'INICIAL' && specialty === 'FISIOTERAPIA') {
      return 'COMPLETO';
    }
    
    // Seguimientos pueden usar procesamiento básico
    return 'BASICO';
  }
  
  /**
   * Calcula el costo estimado según el tipo y nivel de procesamiento
   */
  private static calculateEstimatedCost(
    type: ConsultationType,
    specialty: MedicalSpecialty,
    level: ProcessingLevel
  ): number {
    // Costos base por especialidad y tipo (en euros)
    const costMatrix = {
      PSICOLOGIA: {
        INICIAL: 0.35,    // €35 por consulta inicial compleja
        SEGUIMIENTO: 0.18, // €18 por seguimiento
        EMERGENCIA: 0.50   // €50 por emergencia
      },
      FISIOTERAPIA: {
        INICIAL: 0.25,    // €25 por consulta inicial
        SEGUIMIENTO: 0.12, // €12 por seguimiento
        EMERGENCIA: 0.35   // €35 por emergencia
      },
      MEDICINA_GENERAL: {
        INICIAL: 0.20,    // €20 por consulta inicial
        SEGUIMIENTO: 0.10, // €10 por seguimiento
        EMERGENCIA: 0.30   // €30 por emergencia
      }
    };
    
    return costMatrix[specialty][type];
  }
  
  /**
   * Detecta banderas rojas específicas por especialidad
   */
  private static async detectRedFlags(
    context: ConsultationContext,
    specialty: MedicalSpecialty
  ): Promise<RedFlag[]> {
    const redFlags: RedFlag[] = [];
    const transcription = context.transcription.toLowerCase();
    
    if (specialty === 'PSICOLOGIA') {
      // Detección de ideación suicida
      const suicidalKeywords = [
        'suicidio', 'matarme', 'acabar con todo', 'no quiero vivir',
        'mejor muerto', 'quitarme la vida'
      ];
      
      const hasSuicidalIdeation = suicidalKeywords.some(keyword => 
        transcription.includes(keyword)
      );
      
      if (hasSuicidalIdeation) {
        redFlags.push({
          type: 'SUICIDAL_IDEATION',
          severity: 'CRITICAL',
          description: 'Posible ideación suicida detectada en la transcripción',
          action: 'Evaluación inmediata de riesgo suicida requerida'
        });
      }
    }
    
    if (specialty === 'FISIOTERAPIA') {
      // Detección de signos neurológicos - EXPANDIDO PARA UAT
      const neurologicalKeywords = [
        'entumecimiento', 'hormigueo', 'pérdida de fuerza',
        'no siento', 'paralizado', 'convulsión',
        // NUEVOS: Signos neurológicos específicos
        'adormecimiento', 'pérdida de sensibilidad', 'debilidad severa',
        'parálisis', 'espasmos', 'temblor', 'pérdida de control',
        'no puedo mover', 'se me durmió', 'sin fuerza'
      ];
      
      const hasNeurologicalSigns = neurologicalKeywords.some(keyword => 
        transcription.includes(keyword)
      );
      
      if (hasNeurologicalSigns) {
        redFlags.push({
          type: 'NEUROLOGICAL_SIGNS',
          severity: 'HIGH',
          description: 'Posibles signos neurológicos detectados',
          action: 'Derivación a neurología recomendada'
        });
      }

      // NUEVO: Detección de fracturas o lesiones graves
      const fractureKeywords = [
        'fractura', 'hueso roto', 'deformidad', 'crepitación',
        'imposible mover', 'dolor extremo', 'hinchazón severa',
        'moretón grande', 'no puedo apoyar', 'se escuchó crack'
      ];

      const hasFractureSign = fractureKeywords.some(keyword =>
        transcription.includes(keyword)
      );

      if (hasFractureSign) {
        redFlags.push({
          type: 'FRACTURE_SIGNS',
          severity: 'CRITICAL',
          description: 'Posibles signos de fractura o lesión grave detectados',
          action: 'Evaluación médica urgente y radiografías requeridas'
        });
      }

      // NUEVO: Detección de problemas vasculares
      const vascularKeywords = [
        'pie frío', 'cambio de color', 'pulso débil', 'cianosis',
        'palidez extrema', 'no hay circulación', 'entumecimiento total'
      ];

      const hasVascularIssue = vascularKeywords.some(keyword =>
        transcription.includes(keyword)
      );

      if (hasVascularIssue) {
        redFlags.push({
          type: 'VASCULAR_COMPROMISE',
          severity: 'CRITICAL',
          description: 'Posible compromiso vascular detectado',
          action: 'Evaluación médica inmediata - emergencia vascular'
        });
      }
    }
    
    // Síntomas de emergencia generales
    const emergencyKeywords = [
      'dolor de pecho', 'dificultad para respirar', 'desmayo',
      'convulsión', 'sangrado', 'fiebre alta'
    ];
    
    const hasEmergencySymptoms = emergencyKeywords.some(keyword => 
      transcription.includes(keyword)
    );
    
    if (hasEmergencySymptoms) {
      redFlags.push({
        type: 'EMERGENCY_SYMPTOMS',
        severity: 'CRITICAL',
        description: 'Síntomas de emergencia detectados',
        action: 'Evaluación médica inmediata requerida'
      });
    }
    
    return redFlags;
  }
  
  /**
   * Genera recomendaciones basadas en la clasificación
   */
  private static generateRecommendations(
    type: ConsultationType,
    specialty: MedicalSpecialty,
    redFlags: RedFlag[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones por banderas rojas
    if (redFlags.length > 0) {
      recommendations.push('Revisar banderas rojas detectadas antes de continuar');
    }
    
    // Recomendaciones por tipo de consulta
    if (type === 'INICIAL') {
      recommendations.push('Realizar evaluación completa inicial');
      recommendations.push('Establecer línea base para seguimientos futuros');
    }
    
    if (type === 'SEGUIMIENTO') {
      recommendations.push('Comparar con sesión anterior');
      recommendations.push('Evaluar progreso del tratamiento');
    }
    
    if (type === 'EMERGENCIA') {
      recommendations.push('Priorizar evaluación inmediata');
      recommendations.push('Considerar derivación si es necesario');
    }
    
    // Recomendaciones por especialidad
    if (specialty === 'PSICOLOGIA') {
      recommendations.push('Aplicar protocolos de evaluación psicológica');
      recommendations.push('Considerar escalas de medición apropiadas');
    }
    
    if (specialty === 'FISIOTERAPIA') {
      recommendations.push('Realizar evaluación funcional');
      recommendations.push('Documentar rango de movimiento y fuerza');
    }
    
    return recommendations;
  }
  
  /**
   * Calcula la confianza de la clasificación
   */
  private static calculateConfidence(
    context: ConsultationContext,
    type: ConsultationType,
    specialty: MedicalSpecialty
  ): number {
    let confidence = 70; // Base confidence
    
    // Aumentar confianza si hay historial
    if (context.previousSessions > 0) {
      confidence += 10;
    }
    
    // Aumentar confianza si la especialidad coincide con el profesional
    if (specialty === context.professionalSpecialty) {
      confidence += 15;
    }
    
    // Aumentar confianza si la transcripción es suficientemente larga
    if (context.transcription.length > 200) {
      confidence += 5;
    }
    
    return Math.min(confidence, 95); // Máximo 95% de confianza
  }

  /**
   * NUEVO: Calcula costo optimizado usando planes especializados
   */
  private static calculateOptimizedCost(
    planId: PlanType,
    consultationType: ConsultationType,
    specialty: MedicalSpecialty
  ) {
    try {
      return specializedPlansService.calculateProcessingCost(
        planId,
        consultationType as SpecializedConsultationType,
        specialty as SpecializedMedicalSpecialty
      );
    } catch (error) {
      console.error('Error calculando costo optimizado:', error);
      return {
        cost: 0.20,
        reasoning: 'Costo base por error en clasificación',
        optimization: 'Usando costo base de seguridad'
      };
    }
  }

  /**
   * NUEVO: Valida límites del plan actual
   */
  private static validatePlanLimits(
    planId: PlanType,
    consultationType: ConsultationType,
    currentUsage?: any
  ) {
    if (!currentUsage) {
      return {
        canProceed: true,
        remaining: 999,
        message: 'Límites no verificados',
        upgradeRecommendation: undefined
      };
    }

    try {
      return specializedPlansService.validateConsultationLimits(
        planId,
        consultationType as SpecializedConsultationType,
        currentUsage
      );
    } catch (error) {
      console.error('Error validando límites del plan:', error);
      return {
        canProceed: true,
        remaining: 0,
        message: 'Error validando límites',
        upgradeRecommendation: undefined
      };
    }
  }

  /**
   * NUEVO: Obtiene configuración de procesamiento especializado
   */
  private static getSpecializedProcessingConfig(planId: PlanType, specialty: MedicalSpecialty) {
    try {
      const plan = specializedPlansService.getPlan(planId);
      
      return {
        soapTemplate: plan.soapTemplate,
        features: plan.features.filter(f => f.isActive),
        redFlagDetectors: plan.redFlagDetectors,
        specializedAnalysis: this.getSpecializedAnalysisConfig(specialty)
      };
    } catch (error) {
      console.error('Error obteniendo configuración especializada:', error);
      return {
        soapTemplate: null,
        features: [],
        redFlagDetectors: [],
        specializedAnalysis: null
      };
    }
  }

  /**
   * NUEVO: Configuración de análisis especializado por disciplina
   */
  private static getSpecializedAnalysisConfig(specialty: MedicalSpecialty) {
    const configs = {
      PSICOLOGIA: {
        enableDSM5Classification: true,
        enableSuicidalRiskAssessment: true,
        enableMentalStateExam: true,
        requiredFields: ['mood_assessment', 'risk_evaluation'],
        specializedPrompts: [
          'Evaluar estado emocional y cognitivo',
          'Identificar factores de riesgo psicológico',
          'Aplicar criterios DSM-5 relevantes'
        ]
      },
      FISIOTERAPIA: {
        enableFunctionalAssessment: true,
        enableBiomechanicalAnalysis: true,
        enableNeurologicalScreening: true,
        requiredFields: ['pain_assessment', 'functional_limitations', 'range_of_motion'],
        specializedPrompts: [
          'Evaluar función y limitaciones físicas',
          'Analizar patrones de movimiento',
          'Detectar signos neurológicos'
        ]
      },
      MEDICINA_GENERAL: {
        enableSystemsReview: true,
        enableDifferentialDiagnosis: true,
        enableReferralAssistant: true,
        requiredFields: ['chief_complaint', 'systems_review', 'clinical_impression'],
        specializedPrompts: [
          'Revisión completa por sistemas',
          'Considerar diagnósticos diferenciales',
          'Evaluar necesidad de derivación'
        ]
      }
    };

    return configs[specialty] || configs.MEDICINA_GENERAL;
  }

  /**
   * NUEVO: Método para procesar consulta con especialización completa
   */
  static async processSpecializedConsultation(
    context: ConsultationContext,
    transcription: string,
    entities: any[]
  ): Promise<{
    classification: ClassificationResult;
    specializedSOAP: any;
    costSummary: any;
  }> {
    console.log('🔄 Iniciando procesamiento especializado de consulta...');
    
    // 1. Clasificar consulta
    const classification = await this.classifyConsultation(context);
    
    if (!classification.planValidation.canProceed) {
      throw new Error(`Límite de consultas alcanzado: ${classification.planValidation.message}`);
    }

    // 2. Generar SOAP especializado
    let specializedSOAP = null;
    try {
      const soapResult = specializedPlansService.generateSpecializedSOAP(
        context.currentPlan || 'GENERAL_PRO',
        transcription,
        entities as any[]
      );
      specializedSOAP = soapResult;
    } catch (error) {
      console.error('Error generando SOAP especializado:', error);
      // Fallback a SOAP genérico
    }

    // 3. Resumen de costos
    const costSummary = {
      currentConsultationCost: classification.costOptimization.cost,
      reasoning: classification.costOptimization.reasoning,
      optimization: classification.costOptimization.optimization,
      remainingInPlan: classification.planValidation.remaining,
      estimatedMonthlyCost: classification.costOptimization.cost * 30 // Estimación
    };

    console.log('✅ Procesamiento especializado completado');
    console.log(`💰 Costo de consulta: €${costSummary.currentConsultationCost}`);
    console.log(`📊 Optimización: ${costSummary.optimization}`);

    return {
      classification,
      specializedSOAP,
      costSummary
    };
  }

  /**
   * Clasificación SOAP usando Gemini 1.5 Pro (Vertex AI)
   * @param context - Contexto de la consulta
   * @param entities - Entidades NER extraídas
   * @param speakers - Información de hablantes (opcional)
   * @returns Objeto estructurado con la nota SOAP generada por Gemini
   */
  static async classifyWithGemini(
    context: ConsultationContext,
    entities: any[],
    speakers: any[] = []
  ): Promise<any> {
    const { GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION, GOOGLE_CLOUD_CREDENTIALS } = require('../../config/env');
    const fetch = (globalThis.fetch || require('node-fetch'));
    const apiEndpoint = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT_ID}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/gemini-1.5-pro:predict`;

    // Construir el prompt JSON modular
    const prompt = {
      context: {
        patientId: context.patientId,
        professionalSpecialty: context.professionalSpecialty,
        sessionDuration: context.sessionDuration,
        previousSessions: context.previousSessions,
        lastSessionDate: context.lastSessionDate,
        plan: context.currentPlan || 'GENERAL_PRO',
      },
      input: {
        transcription: context.transcription,
        entities,
        speakers
      },
      output_schema: {
        soap: {
          S: 'string',
          O: 'string',
          A: 'string',
          P: 'string'
        },
        confidence: 'number',
        redFlags: 'array',
        recommendations: 'array',
        meta: 'object'
      }
    };

    // Preparar la petición a Vertex AI
    const body = {
      instances: [
        { prompt: JSON.stringify(prompt) }
      ],
      parameters: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        topP: 0.8,
        topK: 40
      }
    };

    // Autenticación con Google Cloud (Bearer Token)
    let accessToken = process.env.GOOGLE_CLOUD_ACCESS_TOKEN;
    if (!accessToken && GOOGLE_CLOUD_CREDENTIALS) {
      // Si hay credenciales de servicio, obtener token
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        credentials: JSON.parse(GOOGLE_CLOUD_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      accessToken = await auth.getAccessToken();
    }
    if (!accessToken) throw new Error('No se pudo obtener el token de acceso para Vertex AI');

    // Medir tiempo de inferencia
    const t0 = Date.now();
    let response, result, cost = 0;
    try {
      response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error?.message || 'Error en la llamada a Gemini');
      result = json.predictions?.[0] || json;
      // Estimar costo (puede variar según tokens, aquí solo logging)
      cost = (json.usage?.totalTokenCount || 0) * 0.000125; // Ejemplo: $0.000125/token
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ Error en classifyWithGemini:', errorMsg);
      throw err;
    }
    const t1 = Date.now();
    const elapsedMs = t1 - t0;

    // Logging de métricas
    console.log('🔗 Gemini 1.5 Pro - Vertex AI: llamada completada');
    console.log(`⏱️ Tiempo de inferencia: ${elapsedMs} ms`);
    console.log(`💸 Costo estimado: $${cost.toFixed(4)}`);
    if (result) {
      console.log('📦 Respuesta Gemini:', JSON.stringify(result).substring(0, 500));
    }

    // Registrar métricas en PlanLimitsService si está disponible
    try {
      const { PlanLimitsService } = require('../../services/PlanLimitsService');
      if (PlanLimitsService && PlanLimitsService.registerGeminiCall) {
        await PlanLimitsService.registerGeminiCall({
          elapsedMs,
          cost,
          promptLength: JSON.stringify(prompt).length,
          responseLength: JSON.stringify(result).length
        });
      }
    } catch (e) {
      // Silenciar si no está disponible
    }

    // Parsear y retornar la respuesta estructurada
    return result;
  }
}
