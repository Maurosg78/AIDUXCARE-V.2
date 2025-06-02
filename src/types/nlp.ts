/**
 * 🧬 AiDuxCare - Tipos para Sistema NLP y LLM
 * Definiciones TypeScript para integración de IA Generativa
 */

// === ENTIDADES CLÍNICAS ===

export type ClinicalEntityType = 
  | 'symptom'           // Síntomas reportados por el paciente
  | 'treatment'         // Tratamientos aplicados
  | 'diagnosis'         // Diagnósticos mencionados
  | 'objective'         // Observaciones objetivas
  | 'plan'             // Planes de tratamiento
  | 'medication'       // Medicamentos mencionados
  | 'exercise'         // Ejercicios prescritos
  | 'contraindication' // Contraindicaciones
  | 'progress'         // Progreso del paciente
  | 'goal';            // Objetivos terapéuticos

export interface ClinicalEntity {
  type: ClinicalEntityType;
  text: string;
  confidence: number;
  context?: string;     // Contexto adicional de la entidad
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
  session_id: string;
  total_processing_time_ms: number;
  
  // STT Metrics
  stt_duration_ms: number;
  stt_confidence: number;
  
  // NLP Metrics
  entity_extraction_time_ms: number;
  entities_extracted: number;
  
  // SOAP Generation Metrics
  soap_generation_time_ms: number;
  soap_completeness: number;
  
  // Costs
  total_tokens_used: number;
  estimated_cost_usd: number;
  
  // Quality
  overall_confidence: number;
  requires_review: boolean;
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

// === UTILIDADES DE VALIDACIÓN ===

export function isValidClinicalEntity(entity: unknown): entity is ClinicalEntity {
  return (
    typeof entity === 'object' &&
    entity !== null &&
    'type' in entity &&
    'text' in entity &&
    'confidence' in entity &&
    typeof (entity as any).type === 'string' &&
    typeof (entity as any).text === 'string' &&
    typeof (entity as any).confidence === 'number' &&
    (entity as any).confidence >= 0 && (entity as any).confidence <= 1
  );
}

export function isValidSOAPNotes(soap: unknown): soap is SOAPNotes {
  return (
    typeof soap === 'object' &&
    soap !== null &&
    'subjective' in soap &&
    'objective' in soap &&
    'assessment' in soap &&
    'plan' in soap &&
    typeof (soap as any).subjective === 'string' &&
    typeof (soap as any).objective === 'string' &&
    typeof (soap as any).assessment === 'string' &&
    typeof (soap as any).plan === 'string'
  );
}

export function isValidFisiotherapyContext(context: unknown): context is FisiotherapyContext {
  return (
    typeof context === 'object' &&
    context !== null &&
    'session' in context &&
    'patient_profile' in context &&
    'context_version' in context &&
    typeof (context as any).context_version === 'string'
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
  'goal'
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