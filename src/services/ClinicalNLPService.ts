/**
 * AI: CLINICAL NLP SERVICE
 * Servicio para análisis de entidades clínicas usando Google Cloud Healthcare NLP
 * Conecta el frontend con el backend de análisis de texto médico
 */

// === TIPOS Y INTERFACES ===
export interface ClinicalEntity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  startOffset: number;
  endOffset: number;
  metadata?: EntityMetadata;
}

export interface EntityMetadata {
  vocabularyCode?: string;
  preferredTerm?: string;
  description?: string;
}

export type EntityType = 
  | 'SYMPTOM'           // Síntomas (dolor de cabeza, fiebre)
  | 'MEDICATION'        // Medicamentos (paracetamol, ibuprofeno)
  | 'ANATOMY'           // Anatomía (corazón, pulmón, brazo)
  | 'CONDITION'         // Condiciones (diabetes, hipertensión)
  | 'PROCEDURE'         // Procedimientos (cirugía, biopsia)
  | 'TEST'              // Exámenes (radiografía, análisis de sangre)
  | 'DOSAGE'            // Dosificaciones (500mg, dos veces al día)
  | 'TEMPORAL'          // Referencias temporales (ayer, hace una semana)
  | 'SEVERITY'          // Severidad (leve, severo, agudo)
  | 'OTHER';            // Otros términos médicos

export interface AnalysisRequest {
  text: string;
  sessionId: string;
  patientId: string;
  language?: 'es' | 'en';
  options?: {
    includeConfidenceThreshold?: number;
    enableMedicationExtraction?: boolean;
    enableSymptomExtraction?: boolean;
    enableAnatomyExtraction?: boolean;
  };
}

export interface AnalysisResponse {
  success: boolean;
  sessionId: string;
  entities: ClinicalEntity[];
  processingTime: number;
  charactersProcessed: number;
  costEstimate: number;
  error?: string;
}

export interface UsageStats {
  totalCalls: number;
  totalCharactersProcessed: number;
  totalCostEstimate: number;
  averageCharactersPerCall: number;
  timeframe: string;
  periodStart: string;
  periodEnd: string;
}

// === CONFIGURACIÓN ===
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://us-central1-aiduxcare-mvp-prod.cloudfunctions.net/createPatient/api'
  : 'http://localhost:5001/aiduxcare-mvp-prod/us-central1/createPatient/api';

// === SERVICIO PRINCIPAL ===
export class ClinicalNLPService {
  
  /**
   * Analizar entidades clínicas en un texto
   */
  static async analyzeText(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      console.log('AI: Iniciando análisis de entidades clínicas...');
      console.log(`STATS: Texto: ${request.text.length} caracteres`);
      console.log(`🆔 Sesión: ${request.sessionId}`);
      
      const response = await fetch(`${API_BASE_URL}/clinical-nlp/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResponse = await response.json();
      
      console.log('SUCCESS: Análisis completado:', {
        entitiesFound: result.entities.length,
        processingTime: result.processingTime,
        costEstimate: result.costEstimate
      });

      return result;
      
    } catch (error) {
      console.error('ERROR: Error en análisis de entidades:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis previo por sessionId
   */
  static async getAnalysis(sessionId: string): Promise<AnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinical-nlp/analysis/${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('ERROR: Error al obtener análisis:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de uso y costos
   */
  static async getUsageStats(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<UsageStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/clinical-nlp/usage-stats?timeframe=${timeframe}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.stats;
      
    } catch (error) {
      console.error('ERROR: Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Mapear entidades a colores para resaltado visual
   */
  static getEntityColor(entityType: EntityType): string {
    const colorMap: Record<EntityType, string> = {
      'SYMPTOM': '#ef4444',      // Rojo - Síntomas
      'MEDICATION': '#3b82f6',   // Azul - Medicamentos
      'ANATOMY': '#10b981',      // Verde - Anatomía
      'CONDITION': '#f59e0b',    // Amarillo - Condiciones
      'PROCEDURE': '#8b5cf6',    // Púrpura - Procedimientos
      'TEST': '#06b6d4',         // Cian - Exámenes
      'DOSAGE': '#ec4899',       // Rosa - Dosificaciones
      'TEMPORAL': '#6b7280',     // Gris - Temporal
      'SEVERITY': '#dc2626',     // Rojo oscuro - Severidad
      'OTHER': '#9ca3af'         // Gris claro - Otros
    };

    return colorMap[entityType] || colorMap['OTHER'];
  }

  /**
   * Obtener descripción legible del tipo de entidad
   */
  static getEntityTypeDescription(entityType: EntityType): string {
    const descriptions: Record<EntityType, string> = {
      'SYMPTOM': 'Síntoma',
      'MEDICATION': 'Medicamento',
      'ANATOMY': 'Anatomía',
      'CONDITION': 'Condición Médica',
      'PROCEDURE': 'Procedimiento',
      'TEST': 'Examen/Prueba',
      'DOSAGE': 'Dosificación',
      'TEMPORAL': 'Referencia Temporal',
      'SEVERITY': 'Severidad',
      'OTHER': 'Término Médico'
    };

    return descriptions[entityType] || 'Término Médico';
  }

  /**
   * Aplicar highlighting a un texto basado en entidades encontradas
   */
  static highlightEntities(text: string, entities: ClinicalEntity[]): string {
    // Ordenar entidades por posición de inicio (descendente para procesar de atrás hacia adelante)
    const sortedEntities = [...entities].sort((a, b) => b.startOffset - a.startOffset);

    let highlightedText = text;

    // Aplicar highlights de atrás hacia adelante para no afectar las posiciones
    sortedEntities.forEach(entity => {
      const color = this.getEntityColor(entity.type);
      const title = `${this.getEntityTypeDescription(entity.type)} (${Math.round(entity.confidence * 100)}% confianza)`;
      
      const before = highlightedText.slice(0, entity.startOffset);
      const entityText = highlightedText.slice(entity.startOffset, entity.endOffset);
      const after = highlightedText.slice(entity.endOffset);

      const highlightedEntity = `<span class="clinical-entity" style="background-color: ${color}20; border-left: 3px solid ${color}; padding: 1px 4px; border-radius: 3px; font-weight: 500;" title="${title}" data-entity-type="${entity.type}">${entityText}</span>`;

      highlightedText = before + highlightedEntity + after;
    });

    return highlightedText;
  }

  /**
   * Agrupar entidades por tipo para análisis
   */
  static groupEntitiesByType(entities: ClinicalEntity[]): Record<EntityType, ClinicalEntity[]> {
    return entities.reduce((groups, entity) => {
      if (!groups[entity.type]) {
        groups[entity.type] = [];
      }
      groups[entity.type].push(entity);
      return groups;
    }, {} as Record<EntityType, ClinicalEntity[]>);
  }

  /**
   * Calcular métricas de confianza
   */
  static calculateConfidenceMetrics(entities: ClinicalEntity[]) {
    if (entities.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        highConfidence: 0, // > 80%
        mediumConfidence: 0, // 60-80%
        lowConfidence: 0  // < 60%
      };
    }

    const confidences = entities.map(e => e.confidence);
    const average = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const min = Math.min(...confidences);
    const max = Math.max(...confidences);

    const highConfidence = entities.filter(e => e.confidence > 0.8).length;
    const mediumConfidence = entities.filter(e => e.confidence >= 0.6 && e.confidence <= 0.8).length;
    const lowConfidence = entities.filter(e => e.confidence < 0.6).length;

    return {
      average,
      min,
      max,
      highConfidence,
      mediumConfidence,
      lowConfidence
    };
  }
} 