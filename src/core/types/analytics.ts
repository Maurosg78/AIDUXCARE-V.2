import { SuggestionType } from './suggestions';

/**
 * Tipo para las métricas de resumen por visita
 */
export interface VisitMetricsSummary {
  generated: number;
  accepted: number;
  integrated: number;
  field_matched: number;
  warnings: number;
  estimated_time_saved_minutes: number;
}

/**
 * Tipo para las métricas acumuladas por tipo de sugerencia
 */
export interface SuggestionTypeMetrics {
  type: SuggestionType;
  generated: number;
  accepted: number;
  acceptanceRate: number;
  timeSavedMinutes: number;
}

/**
 * Tipo para las métricas longitudinales acumuladas por tipo de sugerencia a nivel de paciente
 */
export interface LongitudinalImpactByType {
  type: SuggestionType;
  totalGenerated: number;
  totalAccepted: number;
  totalTimeSavedMinutes: number;
  acceptanceRate: number;
  visitCount: number;
}

/**
 * Tipo para los eventos de métricas de uso
 */
export type MetricEventType = 
  | 'suggestions_generated'
  | 'suggestions_accepted'
  | 'suggestions_integrated'
  | 'suggestion_field_matched'
  | 'suggestion_feedback_given'
  | 'suggestion_feedback_viewed'
  | 'suggestion_search_filter_used'
  | 'suggestion_explanation_viewed'
  | 'suggestion_eval_failed'
  | 'llm_used'; 