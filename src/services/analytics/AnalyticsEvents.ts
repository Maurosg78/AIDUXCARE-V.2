/**
 * AnalyticsEvents - Convenience functions for tracking analytics events
 * 
 * These functions wrap PHIPAAnalytics and provide easy-to-use event tracking
 * with automatic PHI stripping and compliance.
 */

import { phipaAnalytics } from './PHIPAAnalytics';

/**
 * Session Events
 */
export const trackSessionStarted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackSessionEvent('session_started', metadata);
};

export const trackSessionCompleted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackSessionEvent('session_completed', metadata);
};

/**
 * Auth Events
 */
export const trackUserLogin = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackAuthEvent('user_login', metadata);
};

export const trackUserLogout = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackAuthEvent('user_logout', metadata);
};

export const trackUserSignup = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackAuthEvent('user_signup', metadata);
};

/**
 * Recording Events
 */
export const trackRecordingStarted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('recording_started', metadata);
};

export const trackRecordingStopped = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('recording_stopped', metadata);
};

/**
 * Transcription Events
 */
export const trackTranscriptionStarted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('transcription_started', metadata);
};

export const trackTranscriptionCompleted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('transcription_completed', metadata);
};

export const trackTranscriptionFailed = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackError('transcription_failed', metadata);
};

/**
 * Analysis Events
 */
export const trackAnalysisRequested = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('analysis_requested', metadata);
};

export const trackAnalysisCompleted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('analysis_completed', metadata);
};

export const trackAnalysisFailed = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackError('analysis_failed', metadata);
};

/**
 * Evaluation Events
 */
export const trackEvaluationPhaseEntered = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('evaluation_phase_entered', metadata);
};

export const trackEvaluationTestSelected = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('evaluation_test_selected', metadata);
};

export const trackEvaluationTestCompleted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('evaluation_test_completed', metadata);
};

/**
 * SOAP Events
 */
export const trackSOAPGenerationStarted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('soap_generation_started', metadata);
};

export const trackSOAPGenerationCompleted = (metadata?: Record<string, any>) => {
  return phipaAnalytics.trackWorkflowEvent('soap_generation_completed', metadata);
};

/**
 * Error Tracking
 */
export const trackError = (error: string, metadata?: Record<string, any>) => {
  return phipaAnalytics.trackError(error, metadata);
};
