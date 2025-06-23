/**
 * 🧠 SOAP CLASSIFIER V2.0 - SISTEMA DE ASISTENCIA CLÍNICA HOSPITALARIO
 * 
 * Clasificador inteligente frase-por-frase usando Gemini 1.5 Pro
 * Incluye modo auditoría, sistema de fallback y evaluación automática
 * 
 * @author AiDuxCare Team
 * @date Junio 2025
 * @version 2.0
 */

import ENV_CONFIG from '@/config/env';

// === INTERFACES PRINCIPALES ===

export interface ClassifiedSegment {
  id: string;
  original_text: string;
  soap_section: 'S' | 'O' | 'A' | 'P';
  confidence: number;
  speaker: 'PATIENT' | 'THERAPIST';
  timestamp: number;
  entities: MedicalEntity[];
  reasoning: string;
  audit_metadata: AuditMetadata;
}

export interface AuditMetadata {
  classification_method: 'GEMINI' | 'HEURISTIC' | 'MANUAL_OVERRIDE';
  alternative_classifications: AlternativeClassification[];
  professional_feedback?: ProfessionalFeedback;
  requires_review: boolean;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AlternativeClassification {
  section: 'S' | 'O' | 'A' | 'P';
  confidence: number;
  reasoning: string;
}

export interface MedicalEntity {
  text: string;
  type: string;
  confidence: number;
  start: number;
  end: number;
}

export interface SOAPStructure {
  S: string;
  O: string;
  A: string;
  P: string;
}

export interface AdvancedSOAPResult {
  classifiedSegments: ClassifiedSegment[];
  soapSummary: SOAPStructure;
  qualityMetrics: QualityMetrics;
  finalSOAP: SOAPStructure;
  processingTime: number;
  fallbackUsed: boolean;
  auditRequired: boolean;
}

export interface QualityMetrics {
  total_segments_classified: number;
  confidence_average: number;
  entities_utilized: number;
  classification_completeness: number;
  high_confidence_percentage: number;
  requires_professional_review: boolean;
}

export interface ProfessionalFeedback {
  segment_id: string;
  original_classification: 'S' | 'O' | 'A' | 'P';
  corrected_classification: 'S' | 'O' | 'A' | 'P';
  feedback_text: string;
  timestamp: string;
  professional_id: string;
}

export interface AuditAction {
  type: 'RECLASSIFY' | 'APPROVE' | 'REPORT_ERROR';
  segment_id: string;
  original_section: 'S' | 'O' | 'A' | 'P';
  new_section?: 'S' | 'O' | 'A' | 'P';
  reasoning: string;
  timestamp: string;
  professional_id: string;
}

// === CONFIGURACIÓN GEMINI 1.5 PRO ===

class GeminiClassificationService {
  private vertexAI: any = null;
  private model: any = null;
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelName: string;

  constructor() {
    this.projectId = ENV_CONFIG.ai.google.projectId;
    this.location = ENV_CONFIG.ai.google.location;
    this.modelName = 'gemini-1.5-pro';
  }

  /**
   * Inicializar cliente Vertex AI para Gemini 1.5 Pro
   */
  private async initializeClient() {
    if (!this.vertexAI) {
      try {
        // Importar dinámicamente Google Cloud Vertex AI
        const { VertexAI } = await import('@google-cloud/vertexai');
        
        if (ENV_CONFIG.ai.google.credentials) {
          const credentials = JSON.parse(ENV_CONFIG.ai.google.credentials);
          this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location,
            auth: { credentials }
          });
        } else {
          this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location
          });
        }

        this.model = this.vertexAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: 0.1, // Muy determinista para clasificación médica
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        });

      } catch (error) {
        throw new Error(`Error inicializando Gemini 1.5 Pro: ${error}`);
      }
    }
  }

  /**
   * PROMPT MODULAR JSON para Gemini 1.5 Pro
   */
  private buildModularPrompt(
    specialty: string,
    data: {
      transcription: string;
      clinical_entities: MedicalEntity[];
      speaker_segments: any[];
    }
  ): string {
    const specialtyPrompts = {
      FISIOTERAPIA: {
        context: "Especialista en fisioterapia y rehabilitación",
        soap_guidelines: {
          S: "Síntomas reportados por paciente: dolor, limitaciones funcionales, molestias",
          O: "Examen físico: palpación, ROM, fuerza muscular, postura, pruebas específicas",
          A: "Evaluación: diagnóstico fisioterapéutico, impresión clínica",
          P: "Plan: ejercicios, técnicas manuales, recomendaciones, próxima sesión"
        },
        entities_focus: ["dolor", "movilidad", "fuerza", "postura", "ROM", "contractura"]
      },
      PSICOLOGIA: {
        context: "Especialista en psicología clínica",
        soap_guidelines: {
          S: "Estado emocional reportado, síntomas psicológicos, historia personal",
          O: "Observación clínica: comportamiento, estado mental, apariencia",
          A: "Evaluación psicológica: diagnóstico DSM-5, impresión clínica",
          P: "Plan terapéutico: intervenciones, técnicas, seguimiento"
        },
        entities_focus: ["ansiedad", "depresión", "estado de ánimo", "comportamiento"]
      },
      MEDICINA_GENERAL: {
        context: "Médico general",
        soap_guidelines: {
          S: "Síntomas reportados, historia clínica, molestias actuales",
          O: "Examen físico: signos vitales, exploración, pruebas",
          A: "Diagnóstico médico, impresión clínica, diagnóstico diferencial",
          P: "Tratamiento: medicamentos, indicaciones, seguimiento"
        },
        entities_focus: ["síntomas", "signos vitales", "medicamentos", "diagnóstico"]
      }
    };

    const currentSpecialty = specialtyPrompts[specialty] || specialtyPrompts.MEDICINA_GENERAL;

    return JSON.stringify({
      task: "medical_soap_classification",
      model_version: "gemini-1.5-pro",
      specialty: specialty,
      context: currentSpecialty.context,
      
      instructions: {
        primary_task: "Clasificar cada frase de la transcripción médica en las secciones SOAP correspondientes",
        output_format: "JSON estructurado con clasificación frase-por-frase",
        confidence_requirement: "Incluir nivel de confianza (0-1) para cada clasificación",
        reasoning_requirement: "Explicar brevemente el razonamiento para cada clasificación",
        alternative_suggestions: "Proporcionar clasificaciones alternativas cuando la confianza sea < 0.8"
      },
      
      soap_guidelines: currentSpecialty.soap_guidelines,
      
      input_data: {
        transcription: data.transcription,
        clinical_entities: data.clinical_entities,
        speaker_segments: data.speaker_segments
      },
      
      output_schema: {
        classified_segments: [
          {
            id: "string",
            original_text: "string",
            soap_section: "S|O|A|P",
            confidence: "number (0-1)",
            speaker: "PATIENT|THERAPIST",
            reasoning: "string",
            entities: ["array of relevant entities"],
            alternative_classifications: [
              {
                section: "S|O|A|P",
                confidence: "number",
                reasoning: "string"
              }
            ]
          }
        ],
        soap_summary: {
          S: "string - consolidated subjective content",
          O: "string - consolidated objective content", 
          A: "string - consolidated assessment content",
          P: "string - consolidated plan content"
        },
        quality_metrics: {
          total_segments_classified: "number",
          confidence_average: "number",
          entities_utilized: "number",
          classification_completeness: "number (0-1)"
        }
      },
      
      quality_requirements: {
        minimum_confidence: 0.6,
        require_reasoning: true,
        flag_low_confidence: true,
        suggest_alternatives: true
      }
    }, null, 2);
  }

  /**
   * Llamar a Gemini 1.5 Pro con reintentos
   */
  private async callGeminiWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
    await this.initializeClient();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const request = {
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 4000,
            responseMimeType: 'application/json'
          }
        };

        const response = await this.model.generateContent(request);
        
        if (!response.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Respuesta vacía de Gemini 1.5 Pro');
        }

        return response.response.candidates[0].content.parts[0].text;

      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Gemini falló después de ${maxRetries} intentos: ${error}`);
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Error inesperado en reintentos de Gemini');
  }

  /**
   * Parsear y validar respuesta de Gemini
   */
  private parseGeminiResponse(response: string): any {
    try {
      const parsed = JSON.parse(response);
      
      // Validaciones básicas
      if (!parsed.classified_segments || !Array.isArray(parsed.classified_segments)) {
        throw new Error('Formato de respuesta inválido: classified_segments requerido');
      }

      if (!parsed.soap_summary || typeof parsed.soap_summary !== 'object') {
        throw new Error('Formato de respuesta inválido: soap_summary requerido');
      }

      // Validar cada segmento
      parsed.classified_segments.forEach((segment: any, index: number) => {
        if (!segment.soap_section || !['S', 'O', 'A', 'P'].includes(segment.soap_section)) {
          throw new Error(`Segmento ${index}: soap_section inválido`);
        }
        
        if (typeof segment.confidence !== 'number' || segment.confidence < 0 || segment.confidence > 1) {
          throw new Error(`Segmento ${index}: confidence debe ser número entre 0 y 1`);
        }
      });

      return parsed;

    } catch (error) {
      throw new Error(`Error parseando respuesta Gemini: ${error}`);
    }
  }

  /**
   * Procesar clasificación completa con Gemini 1.5 Pro
   */
  async classifyWithGemini(
    transcription: string,
    clinicalEntities: MedicalEntity[],
    speakerSegments: any[],
    specialty: string = 'MEDICINA_GENERAL'
  ): Promise<any> {
    
    const prompt = this.buildModularPrompt(specialty, {
      transcription,
      clinical_entities: clinicalEntities,
      speaker_segments: speakerSegments
    });

    const response = await this.callGeminiWithRetry(prompt);
    return this.parseGeminiResponse(response);
  }
}

// === SERVICIO PRINCIPAL SOAP CLASSIFIER V2.0 ===

export class SOAPClassifierV2Service {
  private geminiService: GeminiClassificationService;
  private fallbackEnabled: boolean = true;

  constructor() {
    this.geminiService = new GeminiClassificationService();
  }

  /**
   * MÉTODO PRINCIPAL: Procesar transcripción a SOAP avanzado
   */
  async processToAdvancedSOAP(
    transcription: string,
    clinicalEntities: MedicalEntity[],
    speakerSegments: any[],
    specialty: string = 'MEDICINA_GENERAL',
    sessionId: string
  ): Promise<AdvancedSOAPResult> {
    
    const startTime = Date.now();
    let fallbackUsed = false;
    let classifiedResult: any;

    try {
      // 1. Guardar transcripción cruda para compliance
      await this.saveRawTranscription(sessionId, transcription, speakerSegments);

      // 2. Intentar clasificación con Gemini 1.5 Pro
      try {
        classifiedResult = await this.geminiService.classifyWithGemini(
          transcription,
          clinicalEntities,
          speakerSegments,
          specialty
        );
        
        // Validar calidad mínima
        if (classifiedResult.quality_metrics.confidence_average < 0.5) {
          throw new Error('Calidad de clasificación Gemini por debajo del umbral');
        }

      } catch (geminiError) {
        if (this.fallbackEnabled) {
          fallbackUsed = true;
          classifiedResult = await this.fallbackToHeuristics(
            transcription,
            clinicalEntities,
            specialty
          );
        } else {
          throw geminiError;
        }
      }

      // 3. Enriquecer con metadatos de auditoría
      const enrichedSegments = this.enrichWithAuditMetadata(
        classifiedResult.classified_segments,
        fallbackUsed
      );

      // 4. Construir SOAP final
      const finalSOAP = this.buildFinalSOAPFromSegments(enrichedSegments);

      // 5. Calcular métricas de calidad
      const qualityMetrics = this.calculateQualityMetrics(enrichedSegments);

      const result: AdvancedSOAPResult = {
        classifiedSegments: enrichedSegments,
        soapSummary: classifiedResult.soap_summary,
        qualityMetrics,
        finalSOAP,
        processingTime: Date.now() - startTime,
        fallbackUsed,
        auditRequired: qualityMetrics.requires_professional_review
      };

      // 6. Guardar resultado para evaluación
      await this.saveClassificationResult(sessionId, result);

      return result;

    } catch (error) {
      throw new Error(`Error en procesamiento SOAP V2.0: ${error}`);
    }
  }

  /**
   * SISTEMA DE FALLBACK ROBUSTO a heurísticas
   * Múltiples niveles de fallback para disponibilidad 99.9%
   */
  private async fallbackToHeuristics(
    transcription: string,
    clinicalEntities: MedicalEntity[],
    specialty: string
  ): Promise<any> {
    
    console.log('🔄 Ejecutando sistema de fallback robusto...');
    
    try {
      // Nivel 1: Fallback heurístico avanzado
      const heuristicResult = await this.generateAdvancedHeuristicClassification(
        transcription, 
        clinicalEntities,
        specialty
      );
      
      // Nivel 2: Si falla, usar clasificación básica
      if (!heuristicResult || heuristicResult.classifiedSegments.length === 0) {
        console.log('⚠️ Fallback nivel 1 falló, usando nivel 2...');
        return await this.generateBasicHeuristicClassification(transcription, specialty);
      }
      
      // Nivel 3: Validación de calidad mínima
      const qualityCheck = this.validateFallbackQuality(heuristicResult);
      if (!qualityCheck.isValid) {
        console.log('⚠️ Calidad insuficiente, usando clasificación de emergencia...');
        return await this.generateEmergencyClassification(transcription);
      }
      
      console.log('✅ Fallback exitoso con calidad:', qualityCheck.score);
      return heuristicResult;
      
    } catch (error) {
      console.error('❌ Error en fallback, usando clasificación de emergencia:', error);
      return await this.generateEmergencyClassification(transcription);
    }
  }

  /**
   * Nivel 1: Clasificación heurística avanzada
   */
  private async generateAdvancedHeuristicClassification(
    transcription: string,
    clinicalEntities: MedicalEntity[],
    specialty: string
  ): Promise<any> {
    
    const segments = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const classifiedSegments = segments.map((segment, index) => {
      const classification = this.classifyWithHeuristics(segment, specialty);
      const confidence = this.calculateHeuristicConfidence(segment, clinicalEntities, specialty);
      
      return {
        id: `heuristic-adv-${index}`,
        original_text: segment.trim(),
        soap_section: classification,
        confidence: confidence,
        speaker: this.detectSpeaker(segment),
        reasoning: `Clasificación heurística avanzada para ${specialty}`,
        entities: clinicalEntities.filter(e => segment.includes(e.text)),
        alternative_classifications: this.generateAlternativeClassifications(segment, specialty),
        audit_metadata: {
          classification_method: 'HEURISTIC_ADVANCED',
          alternative_classifications: [],
          requires_review: confidence < 0.7,
          confidence_level: confidence > 0.8 ? 'HIGH' : confidence > 0.6 ? 'MEDIUM' : 'LOW'
        }
      };
    });

    return {
      classifiedSegments: classifiedSegments,
      soapSummary: this.buildSOAPSummaryFromSegments(classifiedSegments),
      qualityMetrics: {
        total_segments_classified: classifiedSegments.length,
        confidence_average: classifiedSegments.reduce((sum, s) => sum + s.confidence, 0) / classifiedSegments.length,
        entities_utilized: clinicalEntities.length,
        classification_completeness: 0.85,
        high_confidence_percentage: classifiedSegments.filter(s => s.confidence > 0.8).length / classifiedSegments.length * 100,
        requires_professional_review: classifiedSegments.some(s => s.confidence < 0.7)
      },
      processingTime: Date.now() - Date.now(),
      fallbackUsed: true,
      auditRequired: classifiedSegments.some(s => s.confidence < 0.7)
    };
  }

  /**
   * Nivel 2: Clasificación heurística básica
   */
  private async generateBasicHeuristicClassification(
    transcription: string,
    specialty: string
  ): Promise<any> {
    
    const segments = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const classifiedSegments = segments.map((segment, index) => ({
      id: `heuristic-basic-${index}`,
      original_text: segment.trim(),
      soap_section: this.classifyWithHeuristics(segment, specialty),
      confidence: 0.6, // Confianza media para heurísticas básicas
      speaker: this.detectSpeaker(segment),
      reasoning: 'Clasificación heurística básica de respaldo',
      entities: [],
      alternative_classifications: [],
      audit_metadata: {
        classification_method: 'HEURISTIC_BASIC',
        alternative_classifications: [],
        requires_review: true,
        confidence_level: 'MEDIUM'
      }
    }));

    return {
      classifiedSegments: classifiedSegments,
      soapSummary: this.buildSOAPSummaryFromSegments(classifiedSegments),
      qualityMetrics: {
        total_segments_classified: classifiedSegments.length,
        confidence_average: 0.6,
        entities_utilized: 0,
        classification_completeness: 0.7,
        high_confidence_percentage: 0,
        requires_professional_review: true
      },
      processingTime: Date.now() - Date.now(),
      fallbackUsed: true,
      auditRequired: true
    };
  }

  /**
   * Nivel 3: Clasificación de emergencia
   */
  private async generateEmergencyClassification(transcription: string): Promise<any> {
    
    const segments = transcription.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const classifiedSegments = segments.map((segment, index) => ({
      id: `emergency-${index}`,
      original_text: segment.trim(),
      soap_section: 'S' as const, // Por defecto Subjetivo
      confidence: 0.3, // Confianza muy baja
      speaker: 'PATIENT' as const,
      reasoning: 'Clasificación de emergencia - requiere revisión profesional',
      entities: [],
      alternative_classifications: [],
      audit_metadata: {
        classification_method: 'EMERGENCY',
        alternative_classifications: [],
        requires_review: true,
        confidence_level: 'LOW'
      }
    }));

    return {
      classifiedSegments: classifiedSegments,
      soapSummary: {
        S: transcription,
        O: '',
        A: '',
        P: ''
      },
      qualityMetrics: {
        total_segments_classified: classifiedSegments.length,
        confidence_average: 0.3,
        entities_utilized: 0,
        classification_completeness: 0.25,
        high_confidence_percentage: 0,
        requires_professional_review: true
      },
      processingTime: Date.now() - Date.now(),
      fallbackUsed: true,
      auditRequired: true
    };
  }

  /**
   * Validación de calidad del fallback
   */
  private validateFallbackQuality(result: any): { isValid: boolean; score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Verificar que hay segmentos clasificados
    if (!result.classifiedSegments || result.classifiedSegments.length === 0) {
      issues.push('No hay segmentos clasificados');
      score -= 50;
    }

    // Verificar confianza promedio
    if (result.qualityMetrics.confidence_average < 0.5) {
      issues.push('Confianza promedio muy baja');
      score -= 30;
    }

    // Verificar completitud
    if (result.qualityMetrics.classification_completeness < 0.5) {
      issues.push('Completitud de clasificación insuficiente');
      score -= 20;
    }

    return {
      isValid: score >= 50,
      score: Math.max(0, score),
      issues
    };
  }

  /**
   * Cálculo de confianza heurística
   */
  private calculateHeuristicConfidence(
    segment: string,
    clinicalEntities: MedicalEntity[],
    specialty: string
  ): number {
    let confidence = 0.5; // Base

    // Bonus por entidades médicas
    const matchingEntities = clinicalEntities.filter(e => segment.includes(e.text));
    confidence += Math.min(0.3, matchingEntities.length * 0.1);

    // Bonus por palabras clave específicas de la especialidad
    const specialtyKeywords = this.getSpecialtyKeywords(specialty);
    const keywordMatches = specialtyKeywords.filter(keyword => 
      segment.toLowerCase().includes(keyword.toLowerCase())
    );
    confidence += Math.min(0.2, keywordMatches.length * 0.05);

    // Penalización por segmentos muy cortos
    if (segment.length < 10) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Palabras clave por especialidad
   */
  private getSpecialtyKeywords(specialty: string): string[] {
    const keywords = {
      FISIOTERAPIA: ['dolor', 'movimiento', 'ejercicio', 'terapia', 'rehabilitación', 'ROM', 'fuerza', 'postura'],
      PSICOLOGIA: ['ansiedad', 'depresión', 'estado de ánimo', 'comportamiento', 'pensamiento', 'emoción'],
      MEDICINA_GENERAL: ['síntoma', 'medicamento', 'diagnóstico', 'tratamiento', 'examen', 'signo vital']
    };

    return keywords[specialty] || keywords.MEDICINA_GENERAL;
  }

  /**
   * Generación de clasificaciones alternativas
   */
  private generateAlternativeClassifications(segment: string, specialty: string): AlternativeClassification[] {
    const alternatives: AlternativeClassification[] = [];
    const currentClassification = this.classifyWithHeuristics(segment, specialty);

    // Generar alternativas basadas en contenido
    const sections: ('S' | 'O' | 'A' | 'P')[] = ['S', 'O', 'A', 'P'];
    
    sections.forEach(section => {
      if (section !== currentClassification) {
        const confidence = this.calculateAlternativeConfidence(segment, section, specialty);
        if (confidence > 0.3) {
          alternatives.push({
            section,
            confidence,
            reasoning: `Clasificación alternativa basada en contenido`
          });
        }
      }
    });

    return alternatives.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Cálculo de confianza para clasificaciones alternativas
   */
  private calculateAlternativeConfidence(
    segment: string,
    section: 'S' | 'O' | 'A' | 'P',
    specialty: string
  ): number {
    let confidence = 0.2; // Base baja para alternativas

    const sectionKeywords = {
      S: ['siento', 'tengo', 'me duele', 'molestia', 'síntoma'],
      O: ['observo', 'examino', 'prueba', 'test', 'resultado'],
      A: ['diagnóstico', 'evaluación', 'impresión', 'conclusión'],
      P: ['tratamiento', 'plan', 'ejercicio', 'medicamento', 'seguimiento']
    };

    const keywords = sectionKeywords[section];
    const matches = keywords.filter(keyword => 
      segment.toLowerCase().includes(keyword.toLowerCase())
    );

    confidence += matches.length * 0.1;
    return Math.min(0.8, confidence);
  }

  /**
   * Clasificación heurística básica
   */
  private classifyWithHeuristics(segment: string, specialty: string): 'S' | 'O' | 'A' | 'P' {
    const lower = segment.toLowerCase();
    
    // Patrones básicos por especialidad
    if (specialty === 'FISIOTERAPIA') {
      if (/me duele|siento|no puedo|molesta/.test(lower)) return 'S';
      if (/palpar|examinar|evaluar|medir|rom/.test(lower)) return 'O';
      if (/diagnóstico|impresión|evaluación/.test(lower)) return 'A';
      if (/ejercicios|tratamiento|recomiendo|próxima/.test(lower)) return 'P';
    }
    
    // Fallback genérico
    if (/síntoma|dolor|siente|reporta/.test(lower)) return 'S';
    if (/examinar|observar|medir|palpar/.test(lower)) return 'O';
    if (/diagnóstico|evaluación|impresión/.test(lower)) return 'A';
    if (/tratamiento|plan|recomiendo/.test(lower)) return 'P';
    
    return 'S'; // Default
  }

  /**
   * Detectar hablante básico
   */
  private detectSpeaker(segment: string): 'PATIENT' | 'THERAPIST' {
    const lower = segment.toLowerCase();
    if (/me duele|siento|tengo|no puedo/.test(lower)) return 'PATIENT';
    if (/vamos a|recomiendo|evaluar|examinar/.test(lower)) return 'THERAPIST';
    return 'PATIENT'; // Default
  }

  /**
   * Enriquecer segmentos con metadatos de auditoría
   */
  private enrichWithAuditMetadata(
    segments: any[],
    fallbackUsed: boolean
  ): ClassifiedSegment[] {
    return segments.map(segment => ({
      ...segment,
      audit_metadata: {
        classification_method: fallbackUsed ? 'HEURISTIC' : 'GEMINI',
        alternative_classifications: segment.alternative_classifications || [],
        requires_review: segment.confidence < 0.8,
        confidence_level: segment.confidence > 0.8 ? 'HIGH' : 
                         segment.confidence > 0.6 ? 'MEDIUM' : 'LOW'
      }
    }));
  }

  /**
   * Construir SOAP final desde segmentos clasificados
   */
  private buildFinalSOAPFromSegments(segments: ClassifiedSegment[]): SOAPStructure {
    const soapSections = { S: [], O: [], A: [], P: [] };
    
    segments.forEach(segment => {
      soapSections[segment.soap_section].push(segment.original_text);
    });

    return {
      S: soapSections.S.join('. '),
      O: soapSections.O.join('. '),
      A: soapSections.A.join('. '),
      P: soapSections.P.join('. ')
    };
  }

  /**
   * Construir resumen SOAP desde segmentos (para heurísticas)
   */
  private buildSOAPSummaryFromSegments(segments: any[]): SOAPStructure {
    return this.buildFinalSOAPFromSegments(segments);
  }

  /**
   * Calcular métricas de calidad
   */
  private calculateQualityMetrics(segments: ClassifiedSegment[]): QualityMetrics {
    const totalSegments = segments.length;
    const confidenceSum = segments.reduce((sum, s) => sum + s.confidence, 0);
    const highConfidenceCount = segments.filter(s => s.confidence > 0.8).length;
    const entitiesCount = segments.reduce((sum, s) => sum + s.entities.length, 0);

    return {
      total_segments_classified: totalSegments,
      confidence_average: confidenceSum / totalSegments,
      entities_utilized: entitiesCount,
      classification_completeness: totalSegments > 0 ? 1.0 : 0.0,
      high_confidence_percentage: (highConfidenceCount / totalSegments) * 100,
      requires_professional_review: (highConfidenceCount / totalSegments) < 0.7
    };
  }

  /**
   * Guardar transcripción cruda para compliance
   */
  private async saveRawTranscription(
    sessionId: string,
    transcription: string,
    speakerSegments: any[]
  ): Promise<void> {
    try {
      // Simulación - en producción usaríamos Firestore
      const rawData = {
        session_id: sessionId,
        transcription,
        speaker_segments: speakerSegments,
        timestamp: new Date().toISOString(),
        compliance_status: 'SAVED'
      };
      
      localStorage.setItem(`raw_transcription_${sessionId}`, JSON.stringify(rawData));
      
    } catch (error) {
      throw new Error(`CRITICAL: No se pudo guardar transcripción para compliance: ${error}`);
    }
  }

  /**
   * Guardar resultado de clasificación
   */
  private async saveClassificationResult(
    sessionId: string,
    result: AdvancedSOAPResult
  ): Promise<void> {
    try {
      const resultData = {
        session_id: sessionId,
        result,
        timestamp: new Date().toISOString(),
        version: '2.0'
      };
      
      localStorage.setItem(`classification_result_${sessionId}`, JSON.stringify(resultData));
      
    } catch (error) {
      // No crítico, pero registrar error
      console.warn('No se pudo guardar resultado de clasificación:', error);
    }
  }

  /**
   * Validar configuración del servicio
   */
  validateConfiguration(): { isValid: boolean; missingConfig: string[] } {
    const missing = [];
    
    if (!ENV_CONFIG.ai.google.projectId) missing.push('GOOGLE_CLOUD_PROJECT_ID');
    if (!ENV_CONFIG.ai.google.location) missing.push('GOOGLE_CLOUD_LOCATION');
    if (!ENV_CONFIG.ai.google.credentials) missing.push('GOOGLE_CLOUD_CREDENTIALS');

    return {
      isValid: missing.length === 0,
      missingConfig: missing
    };
  }
}

// === SERVICIO DE AUDITORÍA Y EVALUACIÓN ===

export class SOAPEvaluationService {
  
  /**
   * Evaluar precisión cuando el profesional guarda la versión final
   */
  async evaluateSOAPAccuracy(
    sessionId: string,
    originalAISuggestion: AdvancedSOAPResult,
    finalProfessionalVersion: SOAPStructure,
    auditActions: AuditAction[]
  ): Promise<any> {
    
    const accuracyMetrics = this.calculateAccuracyMetrics(
      originalAISuggestion.classifiedSegments,
      auditActions
    );
    
    const timeMetrics = this.calculateTimeMetrics(auditActions);
    const errorPatterns = this.analyzeErrorPatterns(auditActions);
    
    const evaluation = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      accuracy_metrics: accuracyMetrics,
      time_metrics: timeMetrics,
      error_patterns: errorPatterns,
      overall_quality_score: this.calculateOverallQuality(accuracyMetrics, timeMetrics)
    };
    
    await this.saveEvaluation(evaluation);
    return evaluation;
  }

  /**
   * Calcular métricas de precisión
   */
  private calculateAccuracyMetrics(
    originalSegments: ClassifiedSegment[],
    auditActions: AuditAction[]
  ): any {
    const totalSegments = originalSegments.length;
    const reclassifiedSegments = auditActions.filter(a => a.type === 'RECLASSIFY').length;
    const approvedSegments = auditActions.filter(a => a.type === 'APPROVE').length;
    const errorReports = auditActions.filter(a => a.type === 'REPORT_ERROR').length;

    return {
      total_segments: totalSegments,
      correctly_classified: approvedSegments,
      reclassified: reclassifiedSegments,
      error_reports: errorReports,
      accuracy_percentage: ((totalSegments - reclassifiedSegments) / totalSegments) * 100,
      precision_score: (approvedSegments / totalSegments) * 100
    };
  }

  /**
   * Calcular métricas de tiempo
   */
  private calculateTimeMetrics(auditActions: AuditAction[]): any {
    if (auditActions.length === 0) return { total_time: 0, average_time_per_action: 0 };

    const timestamps = auditActions.map(a => new Date(a.timestamp).getTime());
    const totalTime = Math.max(...timestamps) - Math.min(...timestamps);

    return {
      total_time: totalTime,
      average_time_per_action: totalTime / auditActions.length,
      total_actions: auditActions.length
    };
  }

  /**
   * Analizar patrones de error
   */
  private analyzeErrorPatterns(auditActions: AuditAction[]): any {
    const reclassifications = auditActions.filter(a => a.type === 'RECLASSIFY');
    const patterns = {};

    reclassifications.forEach(action => {
      const pattern = `${action.original_section}_to_${action.new_section}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    return {
      most_common_errors: Object.entries(patterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
      total_error_types: Object.keys(patterns).length
    };
  }

  /**
   * Calcular puntuación de calidad general
   */
  private calculateOverallQuality(accuracyMetrics: any, timeMetrics: any): number {
    const accuracyWeight = 0.7;
    const efficiencyWeight = 0.3;
    
    const accuracyScore = accuracyMetrics.accuracy_percentage / 100;
    const efficiencyScore = Math.max(0, 1 - (timeMetrics.average_time_per_action / 10000)); // Normalizar tiempo
    
    return (accuracyScore * accuracyWeight) + (efficiencyScore * efficiencyWeight);
  }

  /**
   * Guardar evaluación
   */
  private async saveEvaluation(evaluation: any): Promise<void> {
    try {
      localStorage.setItem(`evaluation_${evaluation.session_id}`, JSON.stringify(evaluation));
    } catch (error) {
      console.warn('No se pudo guardar evaluación:', error);
    }
  }
}

// === EXPORTAR SERVICIO PRINCIPAL ===
export default SOAPClassifierV2Service;