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
  subjective: string;   // S: Lo que reporta el paciente
  objective: string;    // O: Observaciones objetivas del fisioterapeuta
  assessment: string;   // A: Análisis/evaluación profesional
  plan: string;         // P: Plan de tratamiento
  generated_at: Date;
  confidence_score?: number;
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