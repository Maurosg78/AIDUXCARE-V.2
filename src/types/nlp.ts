/**
 * 🧬 AiDuxCare - Tipos para Sistema NLP y LLM
 * Definiciones TypeScript para integración de IA Generativa
 */

// === ENTIDADES CLÍNICAS ===

export type ClinicalEntityType = 
  | 'symptom'           // Síntomas reportados por el paciente
  | 'finding'           // Hallazgos objetivos del fisioterapeuta
  | 'anatomy'           // Partes del cuerpo, músculos, articulaciones
  | 'assessment'        // Evaluaciones, tests, mediciones
  | 'treatment'         // Tratamientos aplicados
  | 'diagnosis'         // Diagnósticos mencionados
  | 'objective'         // Observaciones objetivas
  | 'plan'             // Planes de tratamiento
  | 'medication'       // Medicamentos mencionados
  | 'exercise'         // Ejercicios prescritos
  | 'contraindication' // Contraindicaciones
  | 'progress'         // Progreso del paciente
  | 'goal'             // Objetivos terapéuticos
  | 'other';           // Otras entidades no clasificadas

export interface ClinicalEntity {
  id: string;
  type: ClinicalEntityType;
  text: string;
  confidence: number;
  context?: string;     // Contexto adicional de la entidad
  position?: {          // Posición en el texto
    start: number;
    end: number;
  };
  timestamp?: number;   // Momento en la transcripción (si disponible)
}

// === NOTAS SOAP ===

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  confidence_score?: number;
  generated_at?: string;
  visit_id?: string;
  patient_id?: string;
  professional_id?: string;
  medical_terms?: MedicalTerm[];
  clinical_insights?: ClinicalInsight[];
}

export interface MedicalTerm {
  term: string;
  category: 'symptom' | 'diagnosis' | 'treatment' | 'medication' | 'anatomy' | 'procedure';
  confidence: number;
  position?: number;
  synonyms?: string[];
  icd10_code?: string;
  snomed_code?: string;
}

export interface ClinicalInsight {
  id: string;
  type: 'risk_factor' | 'contraindication' | 'recommendation' | 'warning' | 'observation';
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence_level?: 'I' | 'II' | 'III' | 'IV' | 'V';
  references?: string[];
  actionable: boolean;
}

// === TRANSCRIPCIÓN PROCESADA ===

export interface TranscriptSegment {
  speaker: 'patient' | 'therapist' | 'unknown';
  text: string;
  timestamp_start?: number;
  timestamp_end?: number;
  confidence?: number;
}

export interface ProcessedTranscript {
  full_text: string;
  segments: TranscriptSegment[];
  entities: ClinicalEntity[];
  language: string;
  processing_time_ms: number;
  word_count: number;
  confidence_average: number;
}

// === MODEL CONTEXT PROTOCOL (MCP) ===

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  medical_history?: string[];
  current_conditions?: string[];
  medications?: string[];
  allergies?: string[];
}

export interface SessionData {
  visit_id: string;
  patient_id: string;
  date: Date;
  session_type: 'initial' | 'follow_up' | 'discharge';
  duration_minutes?: number;
  therapist_id: string;
}

export interface FisiotherapyContext {
  // Identificación
  session: SessionData;
  patient_profile: PatientProfile;
  
  // Datos procesados
  processed_transcript?: ProcessedTranscript;
  generated_soap?: SOAPNotes;
  
  // Contexto histórico
  previous_sessions?: SessionSummary[];
  treatment_history?: TreatmentRecord[];
  
  // Metadatos
  context_version: string;
  created_at: Date;
  processing_flags?: ProcessingFlags;
}

export interface SessionSummary {
  visit_id: string;
  date: Date;
  key_findings: string[];
  treatments_applied: string[];
  patient_response: 'improved' | 'stable' | 'worsened' | 'unknown';
}

export interface TreatmentRecord {
  treatment_name: string;
  date_applied: Date;
  effectiveness: number; // 1-10 scale
  notes?: string;
}

export interface ProcessingFlags {
  requires_medical_review: boolean;
  contains_red_flags: boolean;
  incomplete_information: boolean;
  high_confidence: boolean;
}

// === RESPUESTAS DE LLM ===

export interface LLMResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  tokens_used?: number;
  processing_time_ms: number;
  model_used: string;
  cost_usd?: number;
}

export interface EntityExtractionResponse extends LLMResponse<ClinicalEntity[]> {
  entities_count: number;
  avg_confidence: number;
}

export interface SOAPGenerationResponse extends LLMResponse<SOAPNotes> {
  completeness_score: number; // 0-1, qué tan completa está la nota
  clinical_quality_score: number; // 0-1, calidad clínica estimada
}

// === CONFIGURACIÓN DE SERVICIOS ===

export interface NLPConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  enable_entity_extraction: boolean;
  enable_soap_generation: boolean;
  language: 'es' | 'en';
}

export interface OpenAIConfig extends NLPConfig {
  api_key: string;
  organization?: string;
  base_url?: string;
}

// === MÉTRICAS Y ANALYTICS ===

export interface ProcessingMetrics {
  // Timing Metrics
  entities_extraction_time_ms?: number;  // Tiempo de extracción de entidades
  entity_extraction_time_ms?: number;   // Backward compatibility
  soap_generation_time_ms: number;
  total_processing_time_ms: number;
  
  // Entity Metrics
  entities_count?: number;              // Número de entidades extraídas
  entities_extracted?: number;          // Backward compatibility
  entities_confidence_avg?: number;     // Confianza promedio de entidades
  
  // SOAP Metrics
  soap_confidence: number;
  soap_completeness?: number;           // Backward compatibility
  
  // RAG Metrics
  rag_queries_count?: number;
  rag_citations_found?: number;
  
  // System Metrics
  prompt_version?: string;              // Versión del prompt usado
  timeout_occurred?: boolean;           // Si hubo timeout
  estimated_tokens_used?: number;       // Estimación de tokens
  model_used?: string;                  // Modelo usado
  
  // Legacy/Backward compatibility
  session_id?: string;
  stt_duration_ms?: number;
  stt_confidence?: number;
  total_tokens_used?: number;
  estimated_cost_usd?: number;
  overall_confidence?: number;
  requires_review?: boolean;
}

// === ERRORES Y VALIDACIÓN ===

export type NLPErrorType = 
  | 'api_error'
  | 'parsing_error'
  | 'validation_error'
  | 'quota_exceeded'
  | 'model_unavailable'
  | 'timeout'
  | 'invalid_input';

export interface NLPError {
  type: NLPErrorType;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  recoverable: boolean;
}

// === FUNCIONES DE VALIDACIÓN ===

export function isValidClinicalEntity(entity: unknown): entity is ClinicalEntity {
  if (!entity || typeof entity !== 'object') return false;
  
  const e = entity as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.type === 'string' && 
    typeof e.text === 'string' &&
    typeof e.confidence === 'number' &&
    e.confidence >= 0 && e.confidence <= 1
  );
}

export function isValidSOAPNotes(soap: unknown): soap is SOAPNotes {
  if (!soap || typeof soap !== 'object') return false;
  
  const s = soap as Record<string, unknown>;
  return (
    typeof s.subjective === 'string' &&
    typeof s.objective === 'string' &&
    typeof s.assessment === 'string' &&
    typeof s.plan === 'string' &&
    s.generated_at instanceof Date
  );
}

export function isValidFisiotherapyContext(context: unknown): context is FisiotherapyContext {
  if (!context || typeof context !== 'object') return false;
  
  const c = context as Record<string, unknown>;
  return (
    typeof c.session === 'object' &&
    typeof c.patient_profile === 'object' &&
    typeof c.context_version === 'string' &&
    c.created_at instanceof Date
  );
}

// === CONSTANTES ===

export const CLINICAL_ENTITY_TYPES: ClinicalEntityType[] = [
  'symptom',
  'treatment', 
  'diagnosis',
  'objective',
  'plan',
  'medication',
  'exercise',
  'contraindication',
  'progress',
  'goal',
  'finding',
  'anatomy',
  'assessment',
  'other'
];

export const DEFAULT_NLP_CONFIG: NLPConfig = {
  model: 'gpt-3.5-turbo',
  max_tokens: 2000,
  temperature: 0.3,
  enable_entity_extraction: true,
  enable_soap_generation: true,
  language: 'es'
};

export const MCP_VERSION = '1.0.0';

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.6,
  LOW: 0.3
} as const;

export interface TranscriptionSegment {
  id: string;
  speaker: 'professional' | 'patient' | 'unknown';
  start_time: number;
  end_time: number;
  text: string;
  confidence: number;
  language?: string;
  medical_terms?: MedicalTerm[];
}

export interface NLPAnalysisResult {
  transcription: string;
  segments: TranscriptionSegment[];
  medical_terms: MedicalTerm[];
  clinical_insights: ClinicalInsight[];
  soap_notes: SOAPNotes;
  confidence_score: number;
  processing_time: number;
  language_detected: string;
  quality_metrics: QualityMetrics;
}

export interface QualityMetrics {
  audio_quality: 'excellent' | 'good' | 'fair' | 'poor';
  transcription_accuracy: number;
  medical_term_coverage: number;
  soap_completeness: number;
  clinical_relevance: number;
}

export interface EntityExtraction {
  entities: MedicalEntity[];
  relationships: EntityRelationship[];
  confidence: number;
}

export interface MedicalEntity {
  id: string;
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
  normalized_form?: string;
  ontology_id?: string;
}

export interface EntityRelationship {
  source_entity: string;
  target_entity: string;
  relationship_type: string;
  confidence: number;
}

export interface ClinicalContext {
  specialty: string;
  patient_demographics?: {
    age?: number;
    gender?: string;
    conditions?: string[];
  };
  session_type: 'initial_evaluation' | 'follow_up' | 'treatment' | 'discharge';
  previous_notes?: SOAPNotes[];
  treatment_goals?: string[];
}

export interface NLPProcessingOptions {
  language: 'es' | 'en' | 'auto';
  medical_specialty?: string;
  include_entity_extraction: boolean;
  include_clinical_insights: boolean;
  soap_format: 'standard' | 'detailed' | 'brief';
  confidence_threshold: number;
  context?: ClinicalContext;
}

/**
 * Utilidades para trabajar con tipos NLP
 */
export class NLPUtils {
  /**
   * Validar completitud de notas SOAP
   */
  static validateSOAPCompleteness(soap: SOAPNotes): {
    isComplete: boolean;
    missingFields: string[];
    completenessScore: number;
  } {
    const requiredFields = ['subjective', 'objective', 'assessment', 'plan'];
    const missingFields = requiredFields.filter(field => 
      !soap[field as keyof SOAPNotes] || 
      (soap[field as keyof SOAPNotes] as string).trim().length === 0
    );

    const completenessScore = (requiredFields.length - missingFields.length) / requiredFields.length;

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completenessScore
    };
  }

  /**
   * Calcular puntuación de confianza promedio
   */
  static calculateAverageConfidence(terms: MedicalTerm[]): number {
    if (terms.length === 0) return 0;
    const sum = terms.reduce((acc, term) => acc + term.confidence, 0);
    return sum / terms.length;
  }

  /**
   * Filtrar términos médicos por confianza
   */
  static filterTermsByConfidence(
    terms: MedicalTerm[], 
    threshold: number = 0.7
  ): MedicalTerm[] {
    return terms.filter(term => term.confidence >= threshold);
  }

  /**
   * Agrupar términos por categoría
   */
  static groupTermsByCategory(terms: MedicalTerm[]): Record<string, MedicalTerm[]> {
    return terms.reduce((groups, term) => {
      const category = term.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(term);
      return groups;
    }, {} as Record<string, MedicalTerm[]>);
  }

  /**
   * Extraer insights críticos
   */
  static getCriticalInsights(insights: ClinicalInsight[]): ClinicalInsight[] {
    return insights.filter(insight => 
      insight.severity === 'critical' || insight.severity === 'high'
    );
  }

  /**
   * Formatear duración de segmento
   */
  static formatSegmentDuration(segment: TranscriptionSegment): string {
    const duration = segment.end_time - segment.start_time;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Generar resumen de análisis
   */
  static generateAnalysisSummary(result: NLPAnalysisResult): {
    totalTerms: number;
    highConfidenceTerms: number;
    criticalInsights: number;
    soapCompleteness: number;
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const totalTerms = result.medical_terms.length;
    const highConfidenceTerms = this.filterTermsByConfidence(result.medical_terms, 0.8).length;
    const criticalInsights = this.getCriticalInsights(result.clinical_insights).length;
    const soapValidation = this.validateSOAPCompleteness(result.soap_notes);

    // Calcular calidad general
    const qualityScore = (
      result.confidence_score * 0.3 +
      soapValidation.completenessScore * 0.3 +
      result.quality_metrics.clinical_relevance * 0.4
    );

    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (qualityScore >= 0.9) overallQuality = 'excellent';
    else if (qualityScore >= 0.7) overallQuality = 'good';
    else if (qualityScore >= 0.5) overallQuality = 'fair';
    else overallQuality = 'poor';

    return {
      totalTerms,
      highConfidenceTerms,
      criticalInsights,
      soapCompleteness: soapValidation.completenessScore,
      overallQuality
    };
  }
} 