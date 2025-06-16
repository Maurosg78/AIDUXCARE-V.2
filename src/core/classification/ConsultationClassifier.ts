/**
 * 🎯 Clasificador Inteligente de Consultas - AiDuxCare V.2
 * 
 * Sistema que analiza automáticamente el contexto de una consulta médica para:
 * 1. Determinar el tipo: INICIAL, SEGUIMIENTO, EMERGENCIA
 * 2. Identificar la especialidad: PSICOLOGIA, FISIOTERAPIA, MEDICINA_GENERAL
 * 3. Optimizar el procesamiento de IA según el contexto
 * 4. Aplicar límites y costos específicos por plan
 */

export interface ConsultationContext {
  patientId: string;
  transcription: string;
  sessionDuration: number;
  previousSessions: number;
  lastSessionDate?: Date;
  professionalSpecialty: MedicalSpecialty;
}

export interface ClassificationResult {
  consultationType: ConsultationType;
  specialty: MedicalSpecialty;
  confidence: number;
  processingLevel: ProcessingLevel;
  estimatedCost: number;
  redFlags: RedFlag[];
  recommendations: string[];
}

export type ConsultationType = 'INICIAL' | 'SEGUIMIENTO' | 'EMERGENCIA';
export type MedicalSpecialty = 'PSICOLOGIA' | 'FISIOTERAPIA' | 'MEDICINA_GENERAL';
export type ProcessingLevel = 'BASICO' | 'COMPLETO' | 'AVANZADO';

export interface RedFlag {
  type: 'SUICIDAL_IDEATION' | 'NEUROLOGICAL_SIGNS' | 'EMERGENCY_SYMPTOMS';
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
   */
  static async classifyConsultation(context: ConsultationContext): Promise<ClassificationResult> {
    console.log('🔍 Iniciando clasificación de consulta...');
    
    // 1. Determinar tipo de consulta
    const consultationType = this.determineConsultationType(context);
    
    // 2. Confirmar especialidad (puede diferir del profesional)
    const specialty = await this.detectSpecialty(context);
    
    // 3. Determinar nivel de procesamiento necesario
    const processingLevel = this.determineProcessingLevel(consultationType, specialty);
    
    // 4. Calcular costo estimado
    const estimatedCost = this.calculateEstimatedCost(consultationType, specialty, processingLevel);
    
    // 5. Detectar banderas rojas específicas por especialidad
    const redFlags = await this.detectRedFlags(context, specialty);
    
    // 6. Generar recomendaciones
    const recommendations = this.generateRecommendations(consultationType, specialty, redFlags);
    
    const result: ClassificationResult = {
      consultationType,
      specialty,
      confidence: this.calculateConfidence(context, consultationType, specialty),
      processingLevel,
      estimatedCost,
      redFlags,
      recommendations
    };
    
    console.log(`✅ Consulta clasificada: ${consultationType} - ${specialty} (${result.confidence}% confianza)`);
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
   */
  private static async detectSpecialty(context: ConsultationContext): Promise<MedicalSpecialty> {
    const transcription = context.transcription.toLowerCase();
    
    // Palabras clave por especialidad
    const psychologyKeywords = [
      'ansiedad', 'depresión', 'estrés', 'trauma', 'terapia psicológica',
      'emocional', 'mental', 'psicológico', 'autoestima', 'relaciones',
      'duelo', 'fobia', 'pánico', 'obsesivo', 'compulsivo'
    ];
    
    const physiotherapyKeywords = [
      'dolor', 'movilidad', 'ejercicio', 'rehabilitación', 'fisioterapia',
      'músculo', 'articulación', 'lesión', 'contractura', 'espalda',
      'rodilla', 'hombro', 'cuello', 'lumbar', 'cervical'
    ];
    
    // Contar coincidencias
    const psychologyScore = psychologyKeywords.filter(keyword => 
      transcription.includes(keyword)
    ).length;
    
    const physiotherapyScore = physiotherapyKeywords.filter(keyword => 
      transcription.includes(keyword)
    ).length;
    
    // Determinar especialidad predominante
    if (psychologyScore > physiotherapyScore && psychologyScore > 0) {
      return 'PSICOLOGIA';
    } else if (physiotherapyScore > 0) {
      return 'FISIOTERAPIA';
    }
    
    // Fallback a la especialidad del profesional
    return context.professionalSpecialty;
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
      // Detección de signos neurológicos
      const neurologicalKeywords = [
        'entumecimiento', 'hormigueo', 'pérdida de fuerza',
        'no siento', 'paralizado', 'convulsión'
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
}
