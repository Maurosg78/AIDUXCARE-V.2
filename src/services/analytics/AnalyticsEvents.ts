/**
 * Analytics Events Helper
 * 
 * Pre-configured event tracking functions with automatic PHI protection.
 * All events are automatically sanitized by PHIPAAnalytics before logging.
 */

import { phipaAnalytics } from './PHIPAAnalytics';

// ============================================================================
// USER LIFECYCLE EVENTS
// ============================================================================

/**
 * Track user signup (registration completed)
 */
export const trackUserSignup = async (metadata?: {
  userId?: string;
  email?: string;
  registrationType?: 'email' | 'google' | 'sso';
  hasCompletedProfile?: boolean;
}) => {
  await phipaAnalytics.trackUserEvent('user_signup', metadata);
};

/**
 * Track user login
 */
export const trackUserLogin = async (metadata?: {
  userId?: string;
  loginMethod?: 'email' | 'google' | 'sso';
  isFirstLogin?: boolean;
}) => {
  await phipaAnalytics.trackUserEvent('user_login', metadata);
};

/**
 * Track user logout
 */
export const trackUserLogout = async (metadata?: {
  userId?: string;
  sessionDuration?: number; // milliseconds
}) => {
  await phipaAnalytics.trackUserEvent('user_logout', metadata);
};

/**
 * Track user account activation
 */
export const trackUserActivated = async (metadata?: {
  userId?: string;
  activationMethod?: 'email' | 'admin' | 'auto';
  timeSinceRegistration?: number; // milliseconds
}) => {
  await phipaAnalytics.trackUserEvent('user_activated', metadata);
};

/**
 * Track user profile completion
 */
export const trackProfileCompleted = async (metadata?: {
  userId?: string;
  completionPercentage?: number;
  missingFields?: string[];
}) => {
  await phipaAnalytics.trackUserEvent('profile_completed', metadata);
};

// ============================================================================
// SESSION EVENTS
// ============================================================================

/**
 * Track session started
 */
export const trackSessionStarted = async (metadata?: {
  sessionId?: string;
  userId?: string;
  patientId?: string;
  sessionType?: 'initial' | 'followup' | 'discharge';
  location?: 'clinic' | 'telehealth' | 'home';
}) => {
  await phipaAnalytics.trackSessionEvent('session_started', metadata);
};

/**
 * Track session completed successfully
 */
export const trackSessionCompleted = async (metadata?: {
  sessionId?: string;
  userId?: string;
  patientId?: string;
  duration?: number; // milliseconds
  hasSOAP?: boolean;
  hasTreatmentPlan?: boolean;
}) => {
  await phipaAnalytics.trackSessionEvent('session_completed', metadata);
};

/**
 * Track session abandoned (user left without completing)
 */
export const trackSessionAbandoned = async (metadata?: {
  sessionId?: string;
  userId?: string;
  patientId?: string;
  abandonedAtPhase?: 'recording' | 'transcription' | 'analysis' | 'evaluation' | 'soap';
  duration?: number; // milliseconds
}) => {
  await phipaAnalytics.trackSessionEvent('session_abandoned', metadata);
};

// ============================================================================
// WORKFLOW EVENTS
// ============================================================================

/**
 * Track recording started
 */
export const trackRecordingStarted = async (metadata?: {
  sessionId?: string;
  audioSource?: 'microphone' | 'file_upload';
  expectedDuration?: number;
}) => {
  await phipaAnalytics.trackWorkflowEvent('recording_started', metadata);
};

/**
 * Track recording stopped
 */
export const trackRecordingStopped = async (metadata?: {
  sessionId?: string;
  duration?: number; // milliseconds
  audioSize?: number; // bytes
  wasSuccessful?: boolean;
}) => {
  await phipaAnalytics.trackWorkflowEvent('recording_stopped', metadata);
};

/**
 * Track transcription started
 */
export const trackTranscriptionStarted = async (metadata?: {
  sessionId?: string;
  audioDuration?: number;
  audioSize?: number;
  service?: 'whisper' | 'vertex' | 'other';
}) => {
  await phipaAnalytics.trackWorkflowEvent('transcription_started', metadata);
};

/**
 * Track transcription completed
 */
export const trackTranscriptionCompleted = async (metadata?: {
  sessionId?: string;
  duration?: number; // processing time in ms
  transcriptLength?: number; // characters
  wordCount?: number;
  cost?: number; // USD
}) => {
  await phipaAnalytics.trackWorkflowEvent('transcription_completed', metadata);
};

/**
 * Track transcription failed
 */
export const trackTranscriptionFailed = async (metadata?: {
  sessionId?: string;
  errorType?: string;
  errorMessage?: string;
  retryAttempt?: number;
}) => {
  await phipaAnalytics.trackError('transcription_failed', metadata);
};

/**
 * Track analysis requested
 */
export const trackAnalysisRequested = async (metadata?: {
  sessionId?: string;
  transcriptLength?: number;
  analysisType?: 'full' | 'partial' | 'retry';
}) => {
  await phipaAnalytics.trackWorkflowEvent('analysis_requested', metadata);
};

/**
 * Track analysis completed
 */
export const trackAnalysisCompleted = async (metadata?: {
  sessionId?: string;
  duration?: number; // processing time in ms
  testsIdentified?: number;
  modalitiesIdentified?: number;
  cost?: number; // USD
}) => {
  await phipaAnalytics.trackWorkflowEvent('analysis_completed', metadata);
};

/**
 * Track analysis failed
 */
export const trackAnalysisFailed = async (metadata?: {
  sessionId?: string;
  errorType?: string;
  errorMessage?: string;
  retryAttempt?: number;
}) => {
  await phipaAnalytics.trackError('analysis_failed', metadata);
};

// ============================================================================
// EVALUATION EVENTS
// ============================================================================

/**
 * Track user entering evaluation phase
 */
export const trackEvaluationPhaseEntered = async (metadata?: {
  sessionId?: string;
  availableTests?: number;
  preSelectedTests?: number;
}) => {
  await phipaAnalytics.trackWorkflowEvent('evaluation_phase_entered', metadata);
};

/**
 * Track evaluation test selected
 */
export const trackEvaluationTestSelected = async (metadata?: {
  sessionId?: string;
  testName?: string;
  testCategory?: string;
  wasAIRecommended?: boolean;
}) => {
  await phipaAnalytics.trackWorkflowEvent('evaluation_test_selected', metadata);
};

/**
 * Track evaluation test completed
 */
export const trackEvaluationTestCompleted = async (metadata?: {
  sessionId?: string;
  testName?: string;
  duration?: number; // time spent on test in ms
  hasFindings?: boolean;
}) => {
  await phipaAnalytics.trackWorkflowEvent('evaluation_test_completed', metadata);
};

/**
 * Track evaluation sidebar used
 */
export const trackEvaluationSidebarUsed = async (metadata?: {
  sessionId?: string;
  action?: 'opened' | 'closed' | 'test_added' | 'test_removed';
  testsCount?: number;
}) => {
  await phipaAnalytics.trackFeatureUsage('evaluation_sidebar_used', metadata);
};

// ============================================================================
// SOAP EVENTS
// ============================================================================

/**
 * Track SOAP generation started
 */
export const trackSOAPGenerationStarted = async (metadata?: {
  sessionId?: string;
  hasEvaluationData?: boolean;
  testsCount?: number;
}) => {
  await phipaAnalytics.trackWorkflowEvent('soap_generation_started', metadata);
};

/**
 * Track SOAP generation completed
 */
export const trackSOAPGenerationCompleted = async (metadata?: {
  sessionId?: string;
  duration?: number; // generation time in ms
  soapLength?: number; // characters
  sectionsGenerated?: string[]; // ['subjective', 'objective', 'assessment', 'plan']
  cost?: number; // USD
}) => {
  await phipaAnalytics.trackWorkflowEvent('soap_generation_completed', metadata);
};

/**
 * Track SOAP edited by user
 */
export const trackSOAPEdited = async (metadata?: {
  sessionId?: string;
  section?: 'subjective' | 'objective' | 'assessment' | 'plan';
  changeLength?: number; // characters changed
}) => {
  await phipaAnalytics.trackWorkflowEvent('soap_edited', metadata);
};

/**
 * Track SOAP exported
 */
export const trackSOAPExported = async (metadata?: {
  sessionId?: string;
  exportFormat?: 'pdf' | 'docx' | 'text' | 'jane' | 'noterro';
  includeSignature?: boolean;
}) => {
  await phipaAnalytics.trackWorkflowEvent('soap_exported', metadata);
};

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Track performance metric
 */
export const trackPerformance = async (metric: string, metadata?: {
  duration?: number;
  memoryUsage?: number;
  apiLatency?: number;
  errorRate?: number;
}) => {
  await phipaAnalytics.trackPerformance(metric, metadata);
};

// ============================================================================
// COST TRACKING
// ============================================================================

/**
 * Track cost for a service
 */
export const trackCost = async (service: string, metadata?: {
  sessionId?: string;
  amount?: number; // USD
  currency?: string;
  provider?: string;
  tokensUsed?: number;
}) => {
  await phipaAnalytics.trackCost(service, metadata);
};

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track generic error
 */
export const trackError = async (error: string, metadata?: {
  errorType?: string;
  errorMessage?: string;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
}) => {
  await phipaAnalytics.trackError(error, metadata);
};

// Export all as default object for convenience
export const AnalyticsEvents = {
  // User
  trackUserSignup,
  trackUserLogin,
  trackUserLogout,
  trackUserActivated,
  trackProfileCompleted,
  
  // Session
  trackSessionStarted,
  trackSessionCompleted,
  trackSessionAbandoned,
  
  // Recording
  trackRecordingStarted,
  trackRecordingStopped,
  
  // Transcription
  trackTranscriptionStarted,
  trackTranscriptionCompleted,
  trackTranscriptionFailed,
  
  // Analysis
  trackAnalysisRequested,
  trackAnalysisCompleted,
  trackAnalysisFailed,
  
  // Evaluation
  trackEvaluationPhaseEntered,
  trackEvaluationTestSelected,
  trackEvaluationTestCompleted,
  trackEvaluationSidebarUsed,
  
  // SOAP
  trackSOAPGenerationStarted,
  trackSOAPGenerationCompleted,
  trackSOAPEdited,
  trackSOAPExported,
  
  // Performance & Cost
  trackPerformance,
  trackCost,
  trackError,
};
