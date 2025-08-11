/**
 * useAnalytics - Hook para tracking automático de eventos del sistema
 * Integrado con el Centro de Análisis Operativo y de Uso (CAOU)
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { useCallback } from 'react';
import { analyticsService, type SystemEvent } from '../services/analyticsService';
import { useAuth } from './useAuth';

export interface TrackingOptions {
  userId?: string;
  patientId?: string;
  sessionId?: string;
  module: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  /**
   * Track system events automatically
   */
  const trackEvent = useCallback((
    event: SystemEvent,
    options: TrackingOptions = { module: 'unknown' }
  ) => {
    const trackingData = {
      ...options,
      userId: options.userId || (user as { uid?: string })?.uid,
      metadata: {
        ...options.metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: options.sessionId || `session_${Date.now()}`,
        ...options.metadata
      }
    };

    analyticsService.trackSystemEvent(event, trackingData.metadata, {
      userId: trackingData.userId,
      patientId: trackingData.patientId,
      sessionId: trackingData.sessionId,
      module: trackingData.module,
      duration: trackingData.duration,
      success: trackingData.success,
      errorMessage: trackingData.errorMessage
    });
  }, [user]);

  /**
   * Track feature usage for optimization
   */
  const trackFeatureUsage = useCallback((
    feature: string,
    metadata: Record<string, unknown> = {}
  ) => {
    trackEvent('feature_used', {
      module: 'feature_tracking',
      metadata: {
        feature,
        ...metadata
      }
    });
  }, [trackEvent]);

  /**
   * Track time saved for ROI calculations
   */
  const trackTimeSaved = useCallback((
    patientId: string,
    timeSavedMinutes: number,
    sessionType: string
  ) => {
    analyticsService.trackTimeSaved(patientId, timeSavedMinutes, sessionType);
  }, []);

  /**
   * Track transcription events
   */
  const trackTranscription = useCallback((
    action: 'started' | 'completed' | 'error',
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'started' ? 'transcript_started' : 
                              action === 'completed' ? 'transcript_completed' : 'error_occurred';

    trackEvent(event, {
      module: 'transcription',
      success: action !== 'error',
      errorMessage: action === 'error' ? metadata.errorMessage as string : undefined,
      metadata
    });
  }, [trackEvent]);

  /**
   * Track SOAP generation events
   */
  const trackSOAPGeneration = useCallback((
    action: 'generated' | 'rendered' | 'error',
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'generated' ? 'soap_generated' : 
                              action === 'rendered' ? 'soap_rendered' : 'error_occurred';

    trackEvent(event, {
      module: 'soap_generation',
      success: action !== 'error',
      errorMessage: action === 'error' ? metadata.errorMessage as string : undefined,
      metadata
    });
  }, [trackEvent]);

  /**
   * Track suggestion events
   */
  const trackSuggestion = useCallback((
    action: 'accepted' | 'rejected',
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'accepted' ? 'suggestion_accepted' : 'suggestion_rejected';

    trackEvent(event, {
      module: 'suggestions',
      success: true,
      metadata: {
        suggestionType: metadata.suggestionType as string || 'unknown',
        suggestionContent: metadata.suggestionContent as string || '',
        ...metadata
      }
    });
  }, [trackEvent]);

  /**
   * Track critical alerts
   */
  const trackCriticalAlert = useCallback((
    alertType: string,
    metadata: Record<string, unknown> = {}
  ) => {
    trackEvent('critical_alert_triggered', {
      module: 'alerts',
      success: true,
      metadata: {
        alertType,
        severity: metadata.severity as string || 'high',
        ...metadata
      }
    });
  }, [trackEvent]);

  /**
   * Track session events
   */
  const trackSession = useCallback((
    action: 'started' | 'completed' | 'error',
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'started' ? 'session_started' : 
                              action === 'completed' ? 'session_completed' : 'error_occurred';

    trackEvent(event, {
      module: 'session',
      success: action !== 'error',
      errorMessage: action === 'error' ? metadata.errorMessage as string : undefined,
      metadata
    });
  }, [trackEvent]);

  /**
   * Track patient events
   */
  const trackPatientEvent = useCallback((
    action: 'created' | 'updated' | 'error',
    patientId: string,
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'created' ? 'patient_created' : 
                              action === 'updated' ? 'feature_used' : 'error_occurred';

    trackEvent(event, {
      module: 'patient_management',
      patientId,
      success: action !== 'error',
      errorMessage: action === 'error' ? metadata.errorMessage as string : undefined,
      metadata
    });
  }, [trackEvent]);

  /**
   * Track appointment events
   */
  const trackAppointmentEvent = useCallback((
    action: 'scheduled' | 'completed' | 'cancelled' | 'error',
    metadata: Record<string, unknown> = {}
  ) => {
    const event: SystemEvent = action === 'scheduled' ? 'appointment_scheduled' : 
                              action === 'completed' ? 'session_completed' : 'error_occurred';

    trackEvent(event, {
      module: 'appointment_management',
      success: action !== 'error',
      errorMessage: action === 'error' ? metadata.errorMessage as string : undefined,
      metadata
    });
  }, [trackEvent]);

  /**
   * Track business metrics for investor presentations
   */
  const trackBusinessMetrics = useCallback((
    event: string,
    data: Record<string, unknown> = {}
  ) => {
    analyticsService.trackBusinessMetrics({
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }, []);

  return {
    trackEvent,
    trackFeatureUsage,
    trackTimeSaved,
    trackTranscription,
    trackSOAPGeneration,
    trackSuggestion,
    trackCriticalAlert,
    trackSession,
    trackPatientEvent,
    trackAppointmentEvent,
    trackBusinessMetrics
  };
};
