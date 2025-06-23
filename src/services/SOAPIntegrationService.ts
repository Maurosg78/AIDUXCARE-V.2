import RealWorldSOAPProcessor from './RealWorldSOAPProcessor';
import { ClassifiedSegment, SOAPSection, MedicalEntity } from '../types/soap';

export interface IntegratedSOAPResult {
  segments: ClassifiedSegment[];
  fullAssessment: string;
  processingTime: number;
  confidence: number;
  metadata: {
    totalSegments: number;
    sectionsDistribution: Record<SOAPSection, number>;
    entitiesFound: number;
    speakerAccuracy: number;
  };
}

export interface AuditableSegment extends ClassifiedSegment {
  originalClassification?: SOAPSection;
  manualOverride?: boolean;
  professionalNotes?: string;
  alternativeClassifications?: Array<{
    section: SOAPSection;
    confidence: number;
    reasoning: string;
  }>;
}

export interface ProfessionalFeedback {
  segmentIndex: number;
  originalSection: SOAPSection;
  correctedSection: SOAPSection;
  reasoning: string;
  timestamp: Date;
}

/**
 * Servicio central que integra el pipeline completo de procesamiento SOAP
 * Conecta RealWorldSOAPProcessor con DynamicSOAPEditor y proporciona
 * funcionalidades de auditoría profesional
 */
export default class SOAPIntegrationService {
  private processor: RealWorldSOAPProcessor;
  private feedbackHistory: ProfessionalFeedback[] = [];

  constructor() {
    this.processor = new RealWorldSOAPProcessor();
  }

  /**
   * Procesa una transcripción completa y retorna resultado integrado
   */
  async processTranscription(
    transcription: string,
    options: {
      enableAudit?: boolean;
      specialty?: 'fisioterapia' | 'psicologia' | 'general';
      confidenceThreshold?: number;
    } = {}
  ): Promise<IntegratedSOAPResult> {
    const startTime = Date.now();
    
    try {
      // Procesar con RealWorldSOAPProcessor
      const result = await this.processor.processTranscription(transcription, {
        specialty: options.specialty || 'fisioterapia'
      });

      // Calcular métricas adicionales
      const sectionsDistribution = this.calculateSectionsDistribution(result.segments);
      const totalEntities = result.segments.reduce((acc, seg) => acc + seg.entities.length, 0);
      const averageConfidence = result.segments.reduce((acc, seg) => acc + seg.confidence, 0) / result.segments.length;

      // Generar evaluación clínica completa si no existe
      const fullAssessment = result.fullAssessment || this.generateClinicalAssessment(result.segments);

      const processingTime = Date.now() - startTime;

      return {
        segments: result.segments,
        fullAssessment,
        processingTime,
        confidence: averageConfidence,
        metadata: {
          totalSegments: result.segments.length,
          sectionsDistribution,
          entitiesFound: totalEntities,
          speakerAccuracy: result.speakerAccuracy || 0.9
        }
      };

    } catch (error) {
      console.error('Error en SOAPIntegrationService:', error);
      throw new Error(`Error procesando transcripción: ${error.message}`);
    }
  }

  /**
   * Procesa con modo auditoría para revisión profesional
   */
  async processWithAudit(
    transcription: string,
    options: {
      specialty?: 'fisioterapia' | 'psicologia' | 'general';
      confidenceThreshold?: number;
    } = {}
  ): Promise<{ result: IntegratedSOAPResult; auditableSegments: AuditableSegment[] }> {
    const result = await this.processTranscription(transcription, { 
      ...options, 
      enableAudit: true 
    });

    // Convertir segmentos a auditables con clasificaciones alternativas
    const auditableSegments: AuditableSegment[] = result.segments.map(segment => ({
      ...segment,
      originalClassification: segment.section,
      alternativeClassifications: this.generateAlternativeClassifications(segment)
    }));

    return { result, auditableSegments };
  }

  /**
   * Registra feedback del profesional para mejora continua
   */
  recordProfessionalFeedback(feedback: ProfessionalFeedback): void {
    this.feedbackHistory.push(feedback);
    
    // Aquí se podría implementar lógica para mejorar el modelo
    console.log('Feedback registrado:', feedback);
  }

  /**
   * Reclasifica un segmento manualmente
   */
  reclassifySegment(
    segments: AuditableSegment[],
    segmentIndex: number,
    newSection: SOAPSection,
    professionalNotes?: string
  ): AuditableSegment[] {
    const updatedSegments = [...segments];
    const segment = updatedSegments[segmentIndex];
    
    if (segment) {
      // Registrar feedback
      this.recordProfessionalFeedback({
        segmentIndex,
        originalSection: segment.section,
        correctedSection: newSection,
        reasoning: professionalNotes || 'Reclasificación manual',
        timestamp: new Date()
      });

      // Actualizar segmento
      updatedSegments[segmentIndex] = {
        ...segment,
        section: newSection,
        manualOverride: true,
        professionalNotes,
        confidence: 1.0 // Máxima confianza en decisión profesional
      };
    }

    return updatedSegments;
  }

  /**
   * Genera evaluación clínica desde segmentos S y O
   */
  private generateClinicalAssessment(segments: ClassifiedSegment[]): string {
    const subjectiveSegments = segments.filter(s => s.section === 'S');
    const objectiveSegments = segments.filter(s => s.section === 'O');
    const assessmentSegments = segments.filter(s => s.section === 'A');

    // Si ya hay Assessment, usarlo
    if (assessmentSegments.length > 0) {
      return assessmentSegments.map(s => s.text).join(' ');
    }

    // Generar Assessment automático basado en S y O
    const symptoms = subjectiveSegments.map(s => s.text).join(' ');
    const findings = objectiveSegments.map(s => s.text).join(' ');

    if (symptoms.includes('dolor') && findings.includes('rigidez')) {
      return 'Cuadro compatible con disfunción musculoesquelética con limitación funcional y dolor asociado. Requiere evaluación y tratamiento conservador.';
    }

    return 'Evaluación clínica pendiente de completar con base en hallazgos subjetivos y objetivos documentados.';
  }

  /**
   * Calcula distribución de secciones SOAP
   */
  private calculateSectionsDistribution(segments: ClassifiedSegment[]): Record<SOAPSection, number> {
    return segments.reduce((acc, segment) => {
      acc[segment.section] = (acc[segment.section] || 0) + 1;
      return acc;
    }, {} as Record<SOAPSection, number>);
  }

  /**
   * Genera clasificaciones alternativas para auditoría
   */
  private generateAlternativeClassifications(segment: ClassifiedSegment): Array<{
    section: SOAPSection;
    confidence: number;
    reasoning: string;
  }> {
    const alternatives: Array<{ section: SOAPSection; confidence: number; reasoning: string }> = [];
    
    // Lógica simple para generar alternativas
    if (segment.section === 'S' && segment.text.includes('observo')) {
      alternatives.push({
        section: 'O',
        confidence: 0.7,
        reasoning: 'Podría ser observación objetiva del terapeuta'
      });
    }
    
    if (segment.section === 'O' && segment.text.includes('siento')) {
      alternatives.push({
        section: 'S',
        confidence: 0.6,
        reasoning: 'Contiene expresión subjetiva del paciente'
      });
    }

    return alternatives;
  }

  /**
   * Obtiene estadísticas de feedback para mejora continua
   */
  getFeedbackStats(): {
    totalCorrections: number;
    mostCorrectedSections: Record<SOAPSection, number>;
    averageAccuracy: number;
  } {
    const totalCorrections = this.feedbackHistory.length;
    const mostCorrectedSections = this.feedbackHistory.reduce((acc, feedback) => {
      acc[feedback.originalSection] = (acc[feedback.originalSection] || 0) + 1;
      return acc;
    }, {} as Record<SOAPSection, number>);

    // Calcular precisión aproximada (simplificado)
    const accuracy = totalCorrections > 0 ? 
      Math.max(0.7, 1 - (totalCorrections / 100)) : 0.95;

    return {
      totalCorrections,
      mostCorrectedSections,
      averageAccuracy: accuracy
    };
  }
}
