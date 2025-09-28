// @ts-nocheck
export const AnalyticsEvents = {
  // Eventos de sugerencias
  SUGGESTION_INTEGRATED: 'suggestions_integrated',
  SUGGESTION_REJECTED: 'suggestions_rejected',
  SUGGESTION_ERROR: 'suggestion_integration_error',
  SUGGESTION_FEEDBACK: 'suggestion_feedback_viewed'
} as const;

export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]; 