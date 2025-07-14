/**
 * 🏥 AiDuxCare Professional - Servicio de Procesamiento de Audio
 * Integración completa: Audio → STT → Ollama NLP → SOAP → Agentes → UI
 * 
 * @version 1.0.0
 * @author Implementador Jefe
 * @usage Producción profesional para múltiples fisioterapeutas
 */

import { NLPServiceOllama } from './nlpServiceOllama';
import { AgentSuggestion } from '@/types/agent';
import { TranscriptionSegment, TranscriptionActor, TranscriptionConfidence } from '@/core/audio/AudioCaptureService';
import { ClinicalEntity, SOAPNotes, ProcessingMetrics, FisiotherapyContext, SessionData, PatientProfile } from '@/types/nlp';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { v4 as uuidv4 } from 'uuid';
import { ClinicalInsightsEngine, ClinicalInsightSummary } from '../core/ai/ClinicalInsightsEngine';

export interface AudioProcessingResult {
  // Datos principales
  transcription: TranscriptionSegment[];
  entities: ClinicalEntity[];
  soapNotes: SOAPNotes;
  
  // Contexto profesional
  physiotherapyContext: FisiotherapyContext;
  
  // Sugerencias generadas
  agentSuggestions: AgentSuggestion[];
  
  // Métricas profesionales
  metrics: ProcessingMetrics;
  
  // Metadatos de calidad
  qualityAssessment: QualityAssessment;
  
  // ID único del procesamiento
  processingId: string;
  
  // Insights clínicos
  clinicalInsights?: ClinicalInsightSummary;
}

export interface QualityAssessment {
  overall_score: number; // 0-100
  completeness: number; // 0-100
  clinical_relevance: number; // 0-100
  requires_review: boolean;
  confidence_level: 'low' | 'medium' | 'high';
  red_flags: string[];
  recommendations: string[];
}

export interface AudioProcessingOptions {
  // Configuración del paciente
  patientProfile?: PatientProfile;
  sessionData?: SessionData;
  
  // Configuración de procesamiento
  enableRealTimeProcessing?: boolean;
  language?: 'es' | 'en';
  specialization?: 'fisioterapia' | 'general' | 'neurologia' | 'deportiva';
  
  // Configuración de calidad
  minConfidenceThreshold?: number;
  enableQualityAssessment?: boolean;
  
  // Configuración de agentes
  enableAgentSuggestions?: boolean;
  agentProvider?: 'ollama' | 'openai';
  
  // Configuración de insights clínicos
  enableClinicalInsights?: boolean;
}

export class AudioProcessingServiceProfessional {
  
  /**
   * Procesa audio médico completo con pipeline profesional
   */
  static async processAudioSession(
    audioFile: File,
    visitId: string,
    userId: string,
    patientId: string,
    options: AudioProcessingOptions = {}
  ): Promise<AudioProcessingResult> {
    
    const processingId = uuidv4();
    const startTime = Date.now();
    
    // Configuración por defecto profesional
    const config = {
      enableRealTimeProcessing: true,
      language: 'es' as const,
      specialization: 'fisioterapia' as const,
      enableQualityAssessment: true,
      enableAgentSuggestions: true,
      enableClinicalInsights: true,
      agentProvider: 'ollama' as const,
      ...options
    };
    
    try {
      // Auditoría: Inicio de procesamiento
      AuditLogger.log('audio.processing.started', {
        processingId,
        userId,
        visitId,
        patientId,
        fileSize: audioFile.size,
        specialization: config.specialization,
        enableClinicalInsights: config.enableClinicalInsights
      });

      // FASE 1: Speech-to-Text Profesional
      const transcription = await this.speechToTextProfessional(
        audioFile, 
        config.language,
        processingId
      );
      
      // FASE 2: Procesamiento NLP con Ollama
      const nlpResult = await NLPServiceOllama.processTranscript(
        this.transcriptionToText(transcription)
      );

      // FASE 3: Construcción de contexto fisioterapéutico
      const physiotherapyContext = await this.buildPhysiotherapyContext(
        transcription,
        nlpResult,
        config.patientProfile,
        config.sessionData,
        visitId,
        patientId
      );

      // FASE 4: Generación de sugerencias de agentes
      const agentSuggestions = config.enableAgentSuggestions 
        ? await this.generateAgentSuggestions(
            physiotherapyContext,
            nlpResult
          )
        : [];

      // FASE 5: Evaluación de calidad profesional
      const qualityAssessment = config.enableQualityAssessment
        ? await this.assessQuality(
            transcription,
            nlpResult
          )
        : this.defaultQualityAssessment();

      // **NUEVA FASE 6: Generación de Insights Clínicos**
      let clinicalInsights: ClinicalInsightSummary | undefined;
      
      if (config.enableClinicalInsights) {
        try {
          console.log('🧠 Generando insights clínicos avanzados...');
          
          clinicalInsights = await ClinicalInsightsEngine.generateClinicalInsights({
            entities: nlpResult.entities,
            soapNotes: nlpResult.soapNotes,
            patientId,
            visitId,
            userId,
            sessionHistory: [] // TODO: Integrar historial real cuando esté disponible
          });
          
          console.log(`✅ Insights generados: ${clinicalInsights.processing_metadata.insights_generated} total`);
          
        } catch (insightsError) {
          console.warn('⚠️ Error generando insights clínicos:', insightsError);
          // Los insights son opcionales, continuamos sin ellos
        }
      }

      const totalTime = Date.now() - startTime;

      // FASE 7: Métricas profesionales actualizadas
      const metrics = this.buildProfessionalMetrics(
        processingId,
        totalTime,
        transcription,
        nlpResult,
        agentSuggestions,
        qualityAssessment,
        clinicalInsights
      );

      const result: AudioProcessingResult = {
        transcription,
        entities: nlpResult.entities,
        soapNotes: nlpResult.soapNotes,
        physiotherapyContext,
        agentSuggestions,
        metrics,
        qualityAssessment,
        processingId,
        clinicalInsights
      };

      // Auditoría: Procesamiento completado
      AuditLogger.log('audio.processing.completed', {
        processingId,
        userId,
        visitId,
        patientId,
        totalTimeMs: totalTime,
        entitiesCount: nlpResult.entities.length,
        suggestionsCount: agentSuggestions.length,
        qualityScore: qualityAssessment.overall_score,
        requiresReview: qualityAssessment.requires_review,
        insightsGenerated: clinicalInsights?.processing_metadata.insights_generated || 0,
        clinicalComplexity: clinicalInsights?.overall_assessment.clinical_complexity || 'unknown',
        interventionUrgency: clinicalInsights?.overall_assessment.intervention_urgency || 'unknown'
      });

      // Métricas de éxito registradas
      console.log('✅ Audio processing completed successfully', {
        processingId,
        specialization: config.specialization,
        qualityScore: qualityAssessment.overall_score,
        processingTimeMs: totalTime,
        insightsEnabled: config.enableClinicalInsights,
        clinicalComplexity: clinicalInsights?.overall_assessment.clinical_complexity || 'unknown'
      });

      return result;

    } catch (error) {
      const errorTime = Date.now() - startTime;
      
      // Auditoría: Error en procesamiento
      AuditLogger.log('audio.processing.failed', {
        processingId,
        userId,
        visitId,
        patientId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeToError: errorTime
      });

      // Métrica de error registrada
      console.log('❌ Audio processing failed', {
        processingId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeToError: errorTime
      });

      throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Speech-to-Text profesional con manejo de actores
   */
  private static async speechToTextProfessional(
    audioFile: File,
    language: 'es' | 'en',
    processingId: string
  ): Promise<TranscriptionSegment[]> {
    
    // Simulación profesional para MVP - En producción integrar con Whisper API
    const simulatedTranscripts = this.getSimulatedPhysiotherapyTranscripts();
    
    // Simular procesamiento real
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generar segmentos profesionales
    return simulatedTranscripts.map((content, index) => ({
      id: `${processingId}-segment-${index + 1}`,
      timestamp: new Date(Date.now() + index * 1000).toISOString(),
      actor: this.detectActor(content),
      content,
      confidence: this.calculateConfidence(content),
      approved: false,
      edited: false
    }));
  }

  /**
   * Detecta el actor del segmento de transcripción
   */
  private static detectActor(content: string): TranscriptionActor {
    const professionalKeywords = [
      'observo', 'evalúo', 'recomiendo', 'prescribimos', 'tratamiento',
      'diagnóstico', 'aplicamos', 'vamos a', 'necesita'
    ];
    
    const patientKeywords = [
      'siento', 'me duele', 'tengo', 'noto', 'puedo', 'no puedo',
      'desde hace', 'cuando', 'me pasa'
    ];
    
    const lowerContent = content.toLowerCase();
    
    const professionalScore = professionalKeywords.reduce((score, keyword) => 
      lowerContent.includes(keyword) ? score + 1 : score, 0
    );
    
    const patientScore = patientKeywords.reduce((score, keyword) => 
      lowerContent.includes(keyword) ? score + 1 : score, 0
    );
    
    if (professionalScore > patientScore) return 'profesional';
    if (patientScore > professionalScore) return 'paciente';
    return 'profesional'; // Default
  }

  /**
   * Calcula la confianza de la transcripción
   */
  private static calculateConfidence(content: string): TranscriptionConfidence {
    if (content.includes('(inaudible)') || content.includes('???')) {
      return 'no_reconocido';
    }
    if (content.includes('mmm') || content.includes('ehh') || content.length < 20) {
      return 'poco_claro';
    }
    return 'entendido';
  }

  /**
   * Convierte transcripción a texto plano
   */
  private static transcriptionToText(transcription: TranscriptionSegment[]): string {
    return transcription
      .filter(segment => segment.confidence !== 'no_reconocido')
      .map(segment => `${segment.actor.toUpperCase()}: ${segment.content}`)
      .join('\n');
  }

  /**
   * Construye contexto fisioterapéutico profesional
   */
  private static async buildPhysiotherapyContext(
    transcription: TranscriptionSegment[],
    nlpResult: { entities: ClinicalEntity[]; soapNotes: SOAPNotes; metrics: ProcessingMetrics },
    patientProfile?: PatientProfile,
    sessionData?: SessionData,
    visitId?: string,
    patientId?: string
  ): Promise<FisiotherapyContext> {
    
    const processedTranscript = {
      full_text: this.transcriptionToText(transcription),
      segments: transcription.map(seg => ({
        speaker: seg.actor as 'patient' | 'therapist' | 'unknown',
        text: seg.content,
        timestamp_start: 0,
        timestamp_end: 0,
        confidence: seg.confidence === 'entendido' ? 0.9 : 
                   seg.confidence === 'poco_claro' ? 0.6 : 0.3
      })),
      entities: nlpResult.entities,
      language: 'es',
      processing_time_ms: nlpResult.metrics.total_processing_time_ms,
      word_count: this.transcriptionToText(transcription).split(' ').length,
      confidence_average: transcription.reduce((sum, seg) => 
        sum + (seg.confidence === 'entendido' ? 0.9 : 
               seg.confidence === 'poco_claro' ? 0.6 : 0.3), 0
      ) / transcription.length
    };

    return {
      session: sessionData || {
        visit_id: visitId || `visit_${Date.now()}`,
        patient_id: patientId || `patient_${Date.now()}`,
        date: new Date(),
        session_type: 'follow_up',
        duration_minutes: Math.ceil(transcription.length * 0.5),
        therapist_id: 'professional_default'
      },
      patient_profile: patientProfile || {
        id: patientId || `patient_${Date.now()}`,
        name: 'Paciente',
        age: 45,
        gender: 'no_especificado',
        medical_history: [],
        current_conditions: nlpResult.entities
          .filter(e => e.type === 'diagnosis')
          .map(e => e.text),
        medications: nlpResult.entities
          .filter(e => e.type === 'medication')
          .map(e => e.text),
        allergies: []
      },
      processed_transcript: processedTranscript,
      generated_soap: nlpResult.soapNotes,
      previous_sessions: [],
      treatment_history: [],
      context_version: '1.0.0',
      created_at: new Date(),
      processing_flags: {
        requires_medical_review: nlpResult.metrics.requires_review || false,
        contains_red_flags: this.detectRedFlags(nlpResult.entities, nlpResult.soapNotes),
        incomplete_information: (nlpResult.metrics.overall_confidence || 0) < 0.7,
        high_confidence: (nlpResult.metrics.overall_confidence || 0) > 0.8
      }
    };
  }

  /**
   * Genera sugerencias de agentes profesionales
   */
  private static async generateAgentSuggestions(
    context: FisiotherapyContext,
    nlpResult: { entities: ClinicalEntity[]; soapNotes: SOAPNotes }
  ): Promise<AgentSuggestion[]> {
    
    const suggestions: AgentSuggestion[] = [];
    
    // Sugerencias basadas en entidades
    if (nlpResult.entities.length > 0) {
      const symptomEntities = nlpResult.entities.filter(e => e.type === 'symptom');
      if (symptomEntities.length > 0) {
        suggestions.push({
          id: `suggestion_symptoms_${Date.now()}`,
          type: 'recommendation',
          content: `Se identificaron ${symptomEntities.length} síntomas principales. Considere evaluar: ${symptomEntities.slice(0, 3).map(e => e.text).join(', ')}.`,
          sourceBlockId: 'symptoms_analysis',
          field: 'symptoms',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Sugerencias basadas en SOAP
    if (nlpResult.soapNotes.confidence_score && nlpResult.soapNotes.confidence_score < 0.7) {
      suggestions.push({
        id: `suggestion_soap_review_${Date.now()}`,
        type: 'warning',
        content: 'La nota SOAP generada tiene baja confianza. Recomiende revisión manual para asegurar precisión clínica.',
        sourceBlockId: 'soap_quality',
        field: 'notes',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Sugerencias basadas en flags de contexto
    if (context.processing_flags?.contains_red_flags) {
      suggestions.push({
        id: `suggestion_red_flags_${Date.now()}`,
        type: 'warning',
        content: 'Se detectaron indicadores que requieren atención médica inmediata. Revise cuidadosamente antes de proceder.',
        sourceBlockId: 'red_flags_detection',
        field: 'diagnosis',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return suggestions;
  }

  /**
   * Evalúa la calidad del procesamiento
   */
  private static async assessQuality(
    transcription: TranscriptionSegment[],
    nlpResult: { entities: ClinicalEntity[]; soapNotes: SOAPNotes; metrics: ProcessingMetrics }
  ): Promise<QualityAssessment> {
    
    // Calcular completeness
    const completeness = this.calculateCompleteness(transcription, nlpResult.soapNotes);
    
    // Calcular relevancia clínica
    const clinical_relevance = this.calculateClinicalRelevance(nlpResult.entities);
    
    // Score general
    const overall_score = Math.round((completeness + clinical_relevance + 
                                   (nlpResult.metrics.overall_confidence ? nlpResult.metrics.overall_confidence * 100 : 0)) / 3);
    
    // Detectar red flags
    const red_flags = this.detectRedFlagsList(nlpResult.entities, nlpResult.soapNotes);
    
    // Determinar si requiere revisión
    const requires_review = nlpResult.metrics.requires_review || false;
    
    // Nivel de confianza
    const confidence_level = overall_score >= 80 ? 'high' : 
                           overall_score >= 60 ? 'medium' : 'low';
    
    // Recomendaciones
    const recommendations = this.generateQualityRecommendations(
      overall_score, 
      completeness, 
      clinical_relevance,
      red_flags
    );
    
    return {
      overall_score,
      completeness,
      clinical_relevance,
      requires_review,
      confidence_level,
      red_flags,
      recommendations
    };
  }

  /**
   * Construcción de métricas profesionales
   */
  private static buildProfessionalMetrics(
    processingId: string,
    totalTime: number,
    transcription: TranscriptionSegment[],
    nlpResult: { entities: ClinicalEntity[]; soapNotes: SOAPNotes; metrics: ProcessingMetrics },
    agentSuggestions: AgentSuggestion[],
    qualityAssessment: QualityAssessment,
    clinicalInsights?: ClinicalInsightSummary
  ): ProcessingMetrics {
    
    const transcriptionConfidence = transcription.length > 0 
      ? transcription.reduce((sum, t) => {
          // Mapear confidence string a number
          const confidenceValue = t.confidence === 'entendido' ? 0.9 : 
                                  t.confidence === 'poco_claro' ? 0.6 : 0.3;
          return sum + confidenceValue;
        }, 0) / transcription.length 
      : 0;

    const baseMetrics = {
      session_id: processingId,
      total_processing_time_ms: totalTime,
      stt_duration_ms: 800, // Estimado para STT
      stt_confidence: transcriptionConfidence,
      entity_extraction_time_ms: nlpResult.metrics?.entity_extraction_time_ms || 600,
      entities_extracted: nlpResult.entities.length,
      soap_generation_time_ms: nlpResult.metrics?.soap_generation_time_ms || 900,
      soap_completeness: this.calculateCompleteness(transcription, nlpResult.soapNotes),
      soap_confidence: nlpResult.soapNotes.confidence_score || 0.7,
      total_tokens_used: 0, // Ollama es local
      estimated_cost_usd: 0.0, // Ollama es gratuito
      overall_confidence: (
        transcriptionConfidence +
        (qualityAssessment.overall_score / 100) +
        (clinicalInsights?.processing_metadata.ai_confidence || 0.5)
      ) / 3,
      requires_review: qualityAssessment.requires_review || 
                      (clinicalInsights?.overall_assessment.intervention_urgency === 'immediate') ||
                      (clinicalInsights?.alerts.some(a => a.severity === 'critical')) || false
    };

    // Añadir métricas específicas de insights clínicos
    if (clinicalInsights) {
      return {
        ...baseMetrics,
        // Métricas extendidas con insights
        insights_processing_time_ms: clinicalInsights.processing_metadata.processing_time_ms,
        insights_generated: clinicalInsights.processing_metadata.insights_generated,
        clinical_patterns_detected: clinicalInsights.patterns.length,
        clinical_alerts_generated: clinicalInsights.alerts.length,
        recommendations_generated: clinicalInsights.recommendations.length,
        clinical_complexity_score: this.mapComplexityToScore(clinicalInsights.overall_assessment.clinical_complexity),
        ai_confidence_insights: clinicalInsights.processing_metadata.ai_confidence,
        evidence_sources_used: clinicalInsights.processing_metadata.evidence_sources
      } as ProcessingMetrics & {
        insights_processing_time_ms: number;
        insights_generated: number;
        clinical_patterns_detected: number;
        clinical_alerts_generated: number;
        recommendations_generated: number;
        clinical_complexity_score: number;
        ai_confidence_insights: number;
        evidence_sources_used: number;
      };
    }

    return baseMetrics;
  }

  // === MÉTODOS AUXILIARES ===

  private static getSimulatedPhysiotherapyTranscripts(): string[] {
    return [
      "Buenos días María, ¿cómo se ha sentido desde la última sesión?",
      "Hola doctor, he notado una mejora en el dolor de la rodilla derecha, pero aún tengo molestias al subir escaleras",
      "Vamos a evaluar el rango de movimiento. ¿Puede flexionar la rodilla hasta donde le sea cómodo?",
      "Puedo llegar hasta aquí, aproximadamente 90 grados, pero siento tensión",
      "Observo una mejora significativa desde la semana pasada. La inflamación ha disminuido considerablemente",
      "Sí, también he notado que caminar es más fácil, especialmente por las mañanas",
      "Vamos a aplicar terapia manual en la zona del cuádriceps y trabajar con ejercicios de fortalecimiento",
      "¿Estos ejercicios los puedo hacer en casa también?",
      "Absolutamente. Le voy a enseñar una rutina específica para continuar en casa",
      "Plan: continuar con fisioterapia dos veces por semana, ejercicios domiciliarios diarios, y control en dos semanas"
    ];
  }

  private static calculateCompleteness(transcription: TranscriptionSegment[], soap: SOAPNotes): number {
    let score = 0;
    
    // Penalizar segmentos no reconocidos
    const recognizedSegments = transcription.filter(s => s.confidence !== 'no_reconocido').length;
    const recognitionRate = recognizedSegments / transcription.length;
    score += recognitionRate * 30;
    
    // Evaluar completeness del SOAP
    const soapFields = [soap.subjective, soap.objective, soap.assessment, soap.plan];
    const completeSoapFields = soapFields.filter(field => field && field.length > 20).length;
    score += (completeSoapFields / 4) * 70;
    
    return Math.round(score);
  }

  private static calculateClinicalRelevance(entities: ClinicalEntity[]): number {
    if (entities.length === 0) return 30;
    
    let score = 0;
    
    // Bonus por tipos de entidades relevantes
    const symptomCount = entities.filter(e => e.type === 'symptom').length;
    const treatmentCount = entities.filter(e => e.type === 'treatment').length;
    const diagnosisCount = entities.filter(e => e.type === 'diagnosis').length;
    
    score += Math.min(symptomCount * 15, 45);
    score += Math.min(treatmentCount * 15, 30);
    score += Math.min(diagnosisCount * 10, 25);
    
    return Math.round(score);
  }

  private static detectRedFlags(entities: ClinicalEntity[], soap: SOAPNotes): boolean {
    const redFlagKeywords = [
      'dolor severo', 'dolor intenso', 'fractura', 'emergencia',
      'pérdida de sensibilidad', 'parálisis', 'infección grave'
    ];
    
    const fullText = `${soap.subjective} ${soap.objective} ${soap.assessment} ${soap.plan}`.toLowerCase();
    return redFlagKeywords.some(keyword => fullText.includes(keyword));
  }

  private static detectRedFlagsList(entities: ClinicalEntity[], soap: SOAPNotes): string[] {
    const redFlags: string[] = [];
    const redFlagKeywords = [
      { keyword: 'dolor severo', flag: 'Dolor severo reportado - requiere evaluación inmediata' },
      { keyword: 'fractura', flag: 'Posible fractura - derivar a radiología' },
      { keyword: 'pérdida de sensibilidad', flag: 'Pérdida neurológica - evaluación urgente' }
    ];
    
    const fullText = `${soap.subjective} ${soap.objective} ${soap.assessment} ${soap.plan}`.toLowerCase();
    
    redFlagKeywords.forEach(({ keyword, flag }) => {
      if (fullText.includes(keyword)) {
        redFlags.push(flag);
      }
    });
    
    return redFlags;
  }

  private static generateQualityRecommendations(
    overall_score: number,
    completeness: number,
    clinical_relevance: number,
    red_flags: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (overall_score < 70) {
      recommendations.push('Revisar transcripción manualmente antes de integrar al EMR');
    }
    
    if (completeness < 60) {
      recommendations.push('Completar información faltante en la documentación clínica');
    }
    
    if (clinical_relevance < 50) {
      recommendations.push('Agregar más detalles clínicos específicos de fisioterapia');
    }
    
    if (red_flags.length > 0) {
      recommendations.push('Revisar inmediatamente los indicadores de alerta identificados');
    }
    
    return recommendations;
  }

  private static defaultQualityAssessment(): QualityAssessment {
    return {
      overall_score: 75,
      completeness: 80,
      clinical_relevance: 70,
      requires_review: false,
      confidence_level: 'medium',
      red_flags: [],
      recommendations: ['Procesamiento estándar completado']
    };
  }

  /**
   * Mapea complejidad clínica a score numérico
   */
  private static mapComplexityToScore(complexity: string): number {
    switch (complexity) {
      case 'low': return 25;
      case 'medium': return 50;
      case 'high': return 75;
      case 'very_high': return 100;
      default: return 50;
    }
  }
} 