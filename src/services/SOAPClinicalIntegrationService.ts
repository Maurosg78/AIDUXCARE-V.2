/**
 * MEDICAL SOAP CLINICAL INTEGRATION SERVICE
 * 
 * Servicio que integra RealWorldSOAPProcessor con ClinicalAssistantService
 * para crear el pipeline completo: Audio → Transcripción → SOAP → Filtros de Indicaciones
 * 
 * Este servicio es el punto central de integración que permite:
 * 1. Procesar transcripciones con RealWorldSOAPProcessor
 * 2. Extraer entidades clínicas para análisis
 * 3. Aplicar filtros de indicaciones médicas según rol profesional
 * 4. Generar advertencias y guías de tratamiento contextuales
 * 
 * OPTIMIZACIONES TAREA 1.2:
 * - Validación robusta de datos de entrada
 * - Manejo mejorado de errores con fallback
 * - Métricas de rendimiento detalladas
 * - Cache de entidades para optimización
 * - Logging estructurado para auditoría
 */

import RealWorldSOAPProcessor, { ProcessingResult, RealWorldSOAPSegment } from './RealWorldSOAPProcessor';
import { ClinicalAssistantService, Patient, ProfessionalContext, MedicalIndication, IndicationWarning, TreatmentGuideline, ClinicalEntity } from './ClinicalAssistantService';

export interface IntegratedProcessingResult {
  // Resultados del procesamiento SOAP
  soapResult: ProcessingResult;
  
  // Entidades clínicas extraídas para análisis
  clinicalEntities: ClinicalEntity[];
  
  // Indicaciones médicas filtradas según rol
  medicalIndications: {
    relevantIndications: MedicalIndication[];
    warnings: IndicationWarning[];
    treatmentGuidelines: TreatmentGuideline[];
  };
  
  // Métricas de integración
  integrationMetrics: {
    totalProcessingTimeMs: number;
    soapProcessingTimeMs: number;
    clinicalAnalysisTimeMs: number;
    entityExtractionCount: number;
    warningCount: number;
    guidelineCount: number;
    cacheHitRate?: number;
    errorCount: number;
  };
  
  // Información del paciente y contexto profesional
  patient: Patient;
  professionalContext: ProfessionalContext;
  
  // Estado de procesamiento
  processingStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';
  errors: Array<{ step: string; error: string; timestamp: number }>;
}

export interface IntegrationOptions {
  // Opciones para RealWorldSOAPProcessor
  soapOptions?: {
    specialty?: 'fisioterapia' | 'psicologia' | 'general';
    confidenceThreshold?: number;
    enableAdvancedNER?: boolean;
    generateAssessment?: boolean;
  };
  
  // Opciones para ClinicalAssistantService
  clinicalOptions?: {
    enableRedFlagDetection?: boolean;
    enableExamTemplates?: boolean;
    enableTreatmentGuidelines?: boolean;
  };
  
  // Opciones de integración
  enableDetailedLogging?: boolean;
  enablePerformanceMetrics?: boolean;
  enableEntityCache?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

// Cache para entidades clínicas (optimización Tarea 1.2)
interface EntityCache {
  [key: string]: {
    entities: ClinicalEntity[];
    timestamp: number;
    ttl: number;
  };
}

/**
 * Servicio de Integración SOAP-Clínica Optimizado
 */
export default class SOAPClinicalIntegrationService {
  private soapProcessor: RealWorldSOAPProcessor;
  private clinicalAssistant: ClinicalAssistantService;
  private options: Required<IntegrationOptions>;
  private processingLog: Array<{ step: string; timestamp: number; details: any }> = [];
  private entityCache: EntityCache = {};
  private errorCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(options: IntegrationOptions = {}) {
    this.options = {
      soapOptions: {
        specialty: options.soapOptions?.specialty || 'fisioterapia',
        confidenceThreshold: options.soapOptions?.confidenceThreshold || 0.7,
        enableAdvancedNER: options.soapOptions?.enableAdvancedNER ?? true,
        generateAssessment: options.soapOptions?.generateAssessment ?? true
      },
      clinicalOptions: {
        enableRedFlagDetection: options.clinicalOptions?.enableRedFlagDetection ?? true,
        enableExamTemplates: options.clinicalOptions?.enableExamTemplates ?? true,
        enableTreatmentGuidelines: options.clinicalOptions?.enableTreatmentGuidelines ?? true
      },
      enableDetailedLogging: options.enableDetailedLogging ?? true,
      enablePerformanceMetrics: options.enablePerformanceMetrics ?? true,
      enableEntityCache: options.enableEntityCache ?? true,
      maxRetries: options.maxRetries || 3,
      timeoutMs: options.timeoutMs || 30000
    };

    this.soapProcessor = new RealWorldSOAPProcessor(this.options.soapOptions);
    this.clinicalAssistant = new ClinicalAssistantService();
  }

  /**
   * Procesa el pipeline completo: Transcripción → SOAP → Análisis Clínico → Filtros
   * OPTIMIZADO: Incluye validación, cache y manejo robusto de errores
   */
  async processCompletePipeline(
    rawTranscription: string,
    patient: Patient,
    professionalContext: ProfessionalContext,
    medicalIndications: MedicalIndication[] = []
  ): Promise<IntegratedProcessingResult> {
    const startTime = Date.now();
    this.processingLog = [];
    const errors: Array<{ step: string; error: string; timestamp: number }> = [];

    try {
      // VALIDACIÓN DE ENTRADA (Nueva optimización)
      this.validateInput(rawTranscription, patient, professionalContext);

      this.log('PIPELINE_START', {
        transcriptionLength: rawTranscription.length,
        patientId: patient.id,
        professionalRole: professionalContext.role,
        indicationCount: medicalIndications.length,
        cacheEnabled: this.options.enableEntityCache
      });

      // PASO 1: Procesamiento SOAP con retry
      const soapResult = await this.processSOAPWithRetry(rawTranscription, errors);
      const soapProcessingTime = Date.now() - startTime;

      // PASO 2: Extracción de entidades clínicas con cache
      const clinicalEntities = await this.extractClinicalEntitiesWithCache(soapResult.segments);
      const clinicalProcessingTime = Date.now() - startTime - soapProcessingTime;

      // PASO 3: Filtrado de indicaciones médicas
      const filteredIndications = await this.filterIndicationsWithFallback(
        medicalIndications, 
        patient, 
        professionalContext, 
        errors
      );
      const filterProcessingTime = Date.now() - startTime - soapProcessingTime - clinicalProcessingTime;

      // PASO 4: Cálculo de métricas de integración optimizadas
      const totalProcessingTime = Date.now() - startTime;
      const cacheHitRate = this.calculateCacheHitRate();
      
      const integrationMetrics = {
        totalProcessingTimeMs: totalProcessingTime,
        soapProcessingTimeMs: soapProcessingTime,
        clinicalAnalysisTimeMs: clinicalProcessingTime,
        entityExtractionCount: clinicalEntities.length,
        warningCount: filteredIndications.warnings.length,
        guidelineCount: filteredIndications.treatmentGuidelines.length,
        cacheHitRate,
        errorCount: errors.length
      };

      this.log('PIPELINE_COMPLETE', {
        totalTime: totalProcessingTime,
        metrics: integrationMetrics,
        status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
      });

      return {
        soapResult,
        clinicalEntities,
        medicalIndications: filteredIndications,
        integrationMetrics,
        patient,
        professionalContext,
        processingStatus: errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
        errors
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log('PIPELINE_ERROR', { error: errorMsg, stack: error instanceof Error ? error.stack : '' });
      this.errorCount++;
      
      return {
        soapResult: { 
          segments: [], 
          fullAssessment: '', 
          speakerAccuracy: 0, 
          processingMetrics: {
            totalSegments: 0,
            soapDistribution: { S: 0, O: 0, A: 0, P: 0 },
            entityCount: 0,
            averageConfidence: 0,
            processingTimeMs: 0
          }
        },
        clinicalEntities: [],
        medicalIndications: { relevantIndications: [], warnings: [], treatmentGuidelines: [] },
        integrationMetrics: {
          totalProcessingTimeMs: Date.now() - startTime,
          soapProcessingTimeMs: 0,
          clinicalAnalysisTimeMs: 0,
          entityExtractionCount: 0,
          warningCount: 0,
          guidelineCount: 0,
          cacheHitRate: 0,
          errorCount: this.errorCount
        },
        patient,
        professionalContext,
        processingStatus: 'FAILED',
        errors: [{ step: 'PIPELINE', error: errorMsg, timestamp: Date.now() }]
      };
    }
  }

  /**
   * VALIDACIÓN ROBUSTA DE ENTRADA (Nueva optimización)
   */
  private validateInput(
    transcription: string, 
    patient: Patient, 
    professionalContext: ProfessionalContext
  ): void {
    const errors: string[] = [];

    if (!transcription || transcription.trim().length < 10) {
      errors.push('Transcripción debe tener al menos 10 caracteres');
    }

    if (!patient || !patient.id) {
      errors.push('Paciente debe tener un ID válido');
    }

    if (!professionalContext || !professionalContext.role) {
      errors.push('Contexto profesional debe incluir un rol válido');
    }

    if (errors.length > 0) {
      throw new Error(`Validación fallida: ${errors.join(', ')}`);
    }
  }

  /**
   * PROCESAMIENTO SOAP CON RETRY (Nueva optimización)
   */
  private async processSOAPWithRetry(
    transcription: string, 
    errors: Array<{ step: string; error: string; timestamp: number }>
  ): Promise<ProcessingResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this.soapProcessor.processTranscription(transcription, this.options.soapOptions),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.options.timeoutMs)
          )
        ]);

        this.log('SOAP_PROCESSING_SUCCESS', { attempt, segmentCount: result.segments.length });
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.log('SOAP_PROCESSING_RETRY', { attempt, error: lastError.message });
        
        if (attempt === this.options.maxRetries) {
          errors.push({ 
            step: 'SOAP_PROCESSING', 
            error: lastError.message, 
            timestamp: Date.now() 
          });
          throw lastError;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw lastError || new Error('Procesamiento SOAP falló después de todos los intentos');
  }

  /**
   * EXTRACCIÓN DE ENTIDADES CON CACHE (Nueva optimización)
   */
  private async extractClinicalEntitiesWithCache(segments: RealWorldSOAPSegment[]): Promise<ClinicalEntity[]> {
    if (!this.options.enableEntityCache) {
      return this.extractClinicalEntities(segments);
    }

    // Generar clave de cache basada en contenido de segmentos
    const cacheKey = this.generateCacheKey(segments);
    
    // Verificar cache
    if (this.entityCache[cacheKey] && 
        Date.now() - this.entityCache[cacheKey].timestamp < this.entityCache[cacheKey].ttl) {
      this.cacheHits++;
      this.log('ENTITY_CACHE_HIT', { cacheKey: cacheKey.substring(0, 20) });
      return this.entityCache[cacheKey].entities;
    }

    // Cache miss - extraer entidades
    this.cacheMisses++;
    const entities = this.extractClinicalEntities(segments);
    
    // Guardar en cache
    this.entityCache[cacheKey] = {
      entities,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutos
    };

    this.log('ENTITY_CACHE_MISS', { 
      cacheKey: cacheKey.substring(0, 20), 
      entityCount: entities.length 
    });

    return entities;
  }

  /**
   * FILTRADO DE INDICACIONES CON FALLBACK (Nueva optimización)
   */
  private async filterIndicationsWithFallback(
    medicalIndications: MedicalIndication[],
    patient: Patient,
    professionalContext: ProfessionalContext,
    errors: Array<{ step: string; error: string; timestamp: number }>
  ): Promise<{ relevantIndications: MedicalIndication[]; warnings: IndicationWarning[]; treatmentGuidelines: TreatmentGuideline[] }> {
    try {
      return this.clinicalAssistant.filterMedicalIndications(
        medicalIndications,
        patient,
        professionalContext
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ 
        step: 'INDICATION_FILTERING', 
        error: errorMsg, 
        timestamp: Date.now() 
      });
      
      // Fallback: retornar estructura vacía
      this.log('INDICATION_FILTERING_FALLBACK', { error: errorMsg });
      return {
        relevantIndications: [],
        warnings: [],
        treatmentGuidelines: []
      };
    }
  }

  /**
   * GENERAR CLAVE DE CACHE (Nueva optimización)
   */
  private generateCacheKey(segments: RealWorldSOAPSegment[]): string {
    const content = segments.map(s => s.text).join('|');
    return btoa(content).substring(0, 50); // Base64 truncado
  }

  /**
   * CALCULAR TASA DE CACHE HIT (Nueva optimización)
   */
  private calculateCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? this.cacheHits / total : 0;
  }

  /**
   * LIMPIAR CACHE EXPIRADO (Nueva optimización)
   */
  public clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.entityCache).forEach(key => {
      if (now - this.entityCache[key].timestamp > this.entityCache[key].ttl) {
        delete this.entityCache[key];
      }
    });
    this.log('CACHE_CLEANUP', { 
      remainingEntries: Object.keys(this.entityCache).length 
    });
  }

  /**
   * OBTENER ESTADÍSTICAS DE CACHE (Nueva optimización)
   */
  public getCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.calculateCacheHitRate(),
      size: Object.keys(this.entityCache).length
    };
  }

  /**
   * Extrae entidades clínicas de los segmentos SOAP procesados
   */
  private extractClinicalEntities(segments: RealWorldSOAPSegment[]): ClinicalEntity[] {
    const entities: ClinicalEntity[] = [];
    let entityId = 1;

    segments.forEach((segment, segmentIndex) => {
      // Extraer entidades de cada categoría del segmento
      Object.entries(segment.entities).forEach(([category, terms]) => {
        terms.forEach(term => {
          // Calcular confianza basada en la confianza del segmento y la categoría
          let confidence = segment.confidence;
          
          // Ajustar confianza según la categoría de entidad
          switch (category) {
            case 'anatomy':
            case 'symptom':
              confidence *= 0.9; // Alta confianza para anatomía y síntomas
              break;
            case 'diagnosis':
            case 'treatment':
              confidence *= 0.85; // Buena confianza para diagnósticos y tratamientos
              break;
            case 'procedure':
            case 'test':
              confidence *= 0.8; // Confianza moderada para procedimientos
              break;
            default:
              confidence *= 0.75; // Confianza base para otras categorías
          }

          entities.push({
            id: `entity-${entityId++}`,
            text: term,
            type: category,
            confidence: Math.min(confidence, 1.0) // Asegurar que no exceda 1.0
          });
        });
      });
    });

    // Eliminar duplicados y ordenar por confianza
    const uniqueEntities = this.removeDuplicateEntities(entities);
    
    this.log('CLINICAL_ENTITIES_PROCESSED', {
      originalCount: entities.length,
      uniqueCount: uniqueEntities.length,
      categories: [...new Set(uniqueEntities.map(e => e.type))]
    });

    return uniqueEntities;
  }

  /**
   * Elimina entidades duplicadas y mantiene las de mayor confianza
   */
  private removeDuplicateEntities(entities: ClinicalEntity[]): ClinicalEntity[] {
    const entityMap = new Map<string, ClinicalEntity>();

    entities.forEach(entity => {
      const key = `${entity.text.toLowerCase()}-${entity.type}`;
      
      if (!entityMap.has(key) || entityMap.get(key)!.confidence < entity.confidence) {
        entityMap.set(key, entity);
      }
    });

    return Array.from(entityMap.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Obtiene un resumen ejecutivo del procesamiento
   */
  getProcessingSummary(result: IntegratedProcessingResult): {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    const { soapResult, medicalIndications, integrationMetrics } = result;
    
    // Análisis de riesgo basado en advertencias
    const criticalWarnings = medicalIndications.warnings.filter(w => w.severity === 'CRITICAL');
    const highWarnings = medicalIndications.warnings.filter(w => w.severity === 'HIGH');
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalWarnings.length > 0) riskLevel = 'CRITICAL';
    else if (highWarnings.length > 2) riskLevel = 'HIGH';
    else if (highWarnings.length > 0 || medicalIndications.warnings.length > 3) riskLevel = 'MEDIUM';

    // Generar resumen
    const summary = `Procesamiento completado en ${integrationMetrics.totalProcessingTimeMs}ms. 
    Se procesaron ${soapResult.segments.length} segmentos con ${integrationMetrics.entityExtractionCount} entidades clínicas. 
    Se identificaron ${medicalIndications.warnings.length} advertencias y ${medicalIndications.treatmentGuidelines.length} guías de tratamiento.`;

    // Hallazgos clave
    const keyFindings = [
      `Precisión de identificación de hablantes: ${(soapResult.speakerAccuracy * 100).toFixed(1)}%`,
      `Entidades clínicas extraídas: ${integrationMetrics.entityExtractionCount}`,
      `Indicaciones médicas relevantes: ${medicalIndications.relevantIndications.length}`,
      `Advertencias generadas: ${medicalIndications.warnings.length}`,
      `Guías de tratamiento sugeridas: ${medicalIndications.treatmentGuidelines.length}`
    ];

    // Recomendaciones
    const recommendations = [];
    
    if (criticalWarnings.length > 0) {
      recommendations.push('WARNING: REVISAR ADVERTENCIAS CRÍTICAS: Se detectaron problemas que requieren atención inmediata');
    }
    
    if (medicalIndications.treatmentGuidelines.length > 0) {
      recommendations.push('📚 CONSULTAR GUÍAS: Se sugieren protocolos de tratamiento basados en evidencia');
    }
    
    if (soapResult.speakerAccuracy < 0.8) {
      recommendations.push('TARGET: VERIFICAR IDENTIFICACIÓN: La precisión de identificación de hablantes es baja');
    }

    return {
      summary,
      keyFindings,
      recommendations,
      riskLevel
    };
  }

  /**
   * Logging interno del servicio
   */
  private log(step: string, details: any): void {
    if (this.options.enableDetailedLogging) {
      this.processingLog.push({
        step,
        timestamp: Date.now(),
        details
      });
    }
  }

  /**
   * Obtiene el log de procesamiento
   */
  getProcessingLog(): typeof this.processingLog {
    return [...this.processingLog];
  }

  /**
   * Limpia el log de procesamiento
   */
  clearLog(): void {
    this.processingLog = [];
  }
}

// === INSTANCIA SINGLETON ===
export const soapClinicalIntegrationService = new SOAPClinicalIntegrationService(); 