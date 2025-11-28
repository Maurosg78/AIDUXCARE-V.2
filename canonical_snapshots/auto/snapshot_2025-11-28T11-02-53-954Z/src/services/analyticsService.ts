/**
 * @fileoverview Servicio de Analytics para AiDuxCare V.2
 * @version 2.0.0
 * @author AiDuxCare Development Team
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, doc, setDoc, DocumentData } from 'firebase/firestore';

import { db } from '../lib/firebase';

import logger from '@/shared/utils/logger';

// Tipos de métricas disponibles
export type MetricType = 
  | 'usage_by_module'
  | 'suggestion_acceptance'
  | 'time_saved'
  | 'usage_frequency';

// Filtros para analytics
export interface AnalyticsFilters {
  eventName?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Evento de analytics
export interface AnalyticsEvent {
  id: string;
  eventName: string;
  eventData: Record<string, unknown>;
  userId?: string;
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  url: string;
  module?: string;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
  event?: string;
  metadata?: Record<string, unknown>;
}

// Resultado de métricas
export interface MetricResult {
  type: MetricType;
  data: Record<string, unknown>;
  total: number;
  period: string;
}

// Eventos clave del sistema para tracking
export type SystemEvent = 
  | 'transcript_started'
  | 'transcript_completed'
  | 'soap_generated'
  | 'soap_rendered'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'critical_alert_triggered'
  | 'patient_created'
  | 'appointment_scheduled'
  | 'session_started'
  | 'session_completed'
  | 'error_occurred'
  | 'feature_used';



export interface BusinessMetrics {
  event: string;
  patientData?: {
    hasInsurance: boolean;
    hasReferral: boolean;
    source: string;
    marketingChannel: string;
  };
  professionalData?: {
    specialty: string;
    experienceYears: number;
    location: string;
  };
  financialData?: {
    sessionPrice: number;
    insuranceCoverage: number;
    copayAmount: number;
  };
  timestamp: string;
}

export interface UsageAnalytics {
  totalEvents: number;
  eventsByModule: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsBySpecialty: Record<string, number>;
  averageSessionDuration: number;
  suggestionsAcceptanceRate: number;
  errorRate: number;
  timeSavedPerPatient: number;
  mostUsedFeatures: Array<{ feature: string; count: number }>;
  criticalAlertsTriggered: number;
}

export interface DashboardMetrics {
  usageByModule: Array<{ module: string; count: number; percentage: number }>;
  suggestionsMetrics: {
    accepted: number;
    rejected: number;
    acceptanceRate: number;
  };
  timeMetrics: {
    averageSessionDuration: number;
    timeSavedPerPatient: number;
    totalTimeSaved: number;
  };
  userMetrics: {
    activeUsers: number;
    newUsers: number;
    usageBySpecialty: Array<{ specialty: string; count: number }>;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    mostCommonErrors: Array<{ error: string; count: number }>;
  };
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track system events with detailed metadata
   */
  public async trackSystemEvent(
    event: SystemEvent,
    metadata: Record<string, unknown> = {},
    options: {
      userId?: string;
      patientId?: string;
      sessionId?: string;
      module: string;
      duration?: number;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        id: this.generateSessionId(),
        eventName: event,
        eventData: metadata,
        userId: options.userId,
        sessionId: options.sessionId || this.sessionId,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        module: options.module,
        duration: options.duration,
        success: options.success ?? true,
        errorMessage: options.errorMessage
      };

      await addDoc(collection(db, 'system_analytics'), {
        ...analyticsEvent,
        createdAt: serverTimestamp()
      });

      console.log('[CAOU] System event tracked:', event, {
        module: options.module,
        success: options.success,
        duration: options.duration
      });
    } catch (error) {
      console.error('❌ [CAOU] Error tracking system event:', error);
    }
  }

  /**
   * Track business metrics for investor presentations
   */
  public async trackBusinessMetrics(metrics: BusinessMetrics): Promise<void> {
    try {
      await addDoc(collection(db, 'business_metrics'), {
        ...metrics,
        createdAt: serverTimestamp()
      });

      console.log('[BUSINESS] Metrics tracked:', metrics.event);
    } catch (error) {
      console.error('❌ [BUSINESS] Error tracking metrics:', error);
    }
  }

  /**
   * Get usage analytics for dashboard
   */
  public async getUsageAnalytics(dateRange: { start: Date; end: Date }): Promise<UsageAnalytics> {
    try {
      // Validate query for PHI compliance
      const { validateAnalyticsQuery, validateAnalyticsCollection, validateKAnonymity } = await import('./analyticsValidationService');
      validateAnalyticsQuery({ dateRange }, 'system_analytics');
      validateAnalyticsCollection('system_analytics');
      
      const analyticsRef = collection(db, 'system_analytics');
      const q = query(
        analyticsRef,
        where('timestamp', '>=', dateRange.start.toISOString()),
        where('timestamp', '<=', dateRange.end.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data() as AnalyticsEvent);
      
      // Validate k-anonymity (minimum 5 events for aggregation)
      validateKAnonymity(events.length, 5);

      // Calculate metrics
      const eventsByModule: Record<string, number> = {};
      const eventsByUser: Record<string, number> = {};
      const eventsBySpecialty: Record<string, number> = {};
      let totalDuration = 0;
      let sessionsWithDuration = 0;
      let suggestionsAccepted = 0;
      let suggestionsRejected = 0;
      let totalErrors = 0;
      let criticalAlerts = 0;

      events.forEach(event => {
        // Count by module
        if (event.module) {
          eventsByModule[event.module] = (eventsByModule[event.module] || 0) + 1;
        }

        // Count by user
        if (event.userId) {
          eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
        }

        // Count by specialty (from metadata)
        const specialty = event.metadata?.specialty as string || 'unknown';
        eventsBySpecialty[specialty] = (eventsBySpecialty[specialty] || 0) + 1;

        // Calculate duration
        if (event.duration) {
          totalDuration += event.duration;
          sessionsWithDuration++;
        }

        // Count suggestions
        if (event.event === 'suggestion_accepted') suggestionsAccepted++;
        if (event.event === 'suggestion_rejected') suggestionsRejected++;

        // Count errors
        if (!event.success) totalErrors++;

        // Count critical alerts
        if (event.event === 'critical_alert_triggered') criticalAlerts++;
      });

      const totalEvents = events.length;
      const averageSessionDuration = sessionsWithDuration > 0 ? totalDuration / sessionsWithDuration : 0;
      const suggestionsAcceptanceRate = (suggestionsAccepted + suggestionsRejected) > 0 
        ? suggestionsAccepted / (suggestionsAccepted + suggestionsRejected) * 100 
        : 0;
      const errorRate = totalEvents > 0 ? (totalErrors / totalEvents) * 100 : 0;

      return {
        totalEvents,
        eventsByModule,
        eventsByUser,
        eventsBySpecialty,
        averageSessionDuration,
        suggestionsAcceptanceRate,
        errorRate,
        timeSavedPerPatient: 15, // minutos promedio ahorrados por paciente
        mostUsedFeatures: this.getMostUsedFeatures(events),
        criticalAlertsTriggered: criticalAlerts
      };
    } catch (error) {
      console.error('❌ [CAOU] Error getting usage analytics:', error);
      throw new Error('Error obteniendo analíticas de uso');
    }
  }

  /**
   * Get dashboard metrics for React components
   */
  public async getDashboardMetrics(dateRange: { start: Date; end: Date }): Promise<DashboardMetrics> {
    try {
      const usageAnalytics = await this.getUsageAnalytics(dateRange);

      // Calculate module usage percentages
      const totalEvents = usageAnalytics.totalEvents;
      const usageByModule = Object.entries(usageAnalytics.eventsByModule).map(([module, count]) => ({
        module,
        count,
        percentage: totalEvents > 0 ? (count / totalEvents) * 100 : 0
      }));

      // Calculate suggestions metrics
      const suggestionsMetrics = {
        accepted: usageAnalytics.suggestionsAcceptanceRate > 0 ? Math.round(usageAnalytics.suggestionsAcceptanceRate) : 0,
        rejected: 100 - (usageAnalytics.suggestionsAcceptanceRate > 0 ? Math.round(usageAnalytics.suggestionsAcceptanceRate) : 0),
        acceptanceRate: usageAnalytics.suggestionsAcceptanceRate
      };

      // Calculate time metrics
      const timeMetrics = {
        averageSessionDuration: Math.round(usageAnalytics.averageSessionDuration / 1000 / 60), // en minutos
        timeSavedPerPatient: usageAnalytics.timeSavedPerPatient,
        totalTimeSaved: usageAnalytics.totalEvents * usageAnalytics.timeSavedPerPatient
      };

      // Calculate user metrics
      const userMetrics = {
        activeUsers: Object.keys(usageAnalytics.eventsByUser).length,
        newUsers: 0, // TODO: Implement new user tracking
        usageBySpecialty: Object.entries(usageAnalytics.eventsBySpecialty).map(([specialty, count]) => ({
          specialty,
          count
        }))
      };

      // Calculate error metrics
      const errorMetrics = {
        totalErrors: Math.round((usageAnalytics.errorRate / 100) * totalEvents),
        errorRate: usageAnalytics.errorRate,
        mostCommonErrors: [] // TODO: Implement error categorization
      };

      return {
        usageByModule,
        suggestionsMetrics,
        timeMetrics,
        userMetrics,
        errorMetrics
      };
    } catch (error) {
      console.error('❌ [CAOU] Error getting dashboard metrics:', error);
      throw new Error('Error obteniendo métricas del dashboard');
    }
  }

  /**
   * Track time saved per patient for ROI calculations
   */
  public async trackTimeSaved(patientId: string, timeSavedMinutes: number, sessionType: string): Promise<void> {
    try {
      await addDoc(collection(db, 'time_savings'), {
        patientId,
        timeSavedMinutes,
        sessionType,
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      console.log('⏰ [CAOU] Time saved tracked:', { patientId, timeSavedMinutes, sessionType });
    } catch (error) {
      console.error('❌ [CAOU] Error tracking time saved:', error);
    }
  }

  /**
   * Track feature usage for optimization
   */
  public async trackFeatureUsage(feature: string, metadata: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.trackSystemEvent('feature_used', {
        feature,
        ...metadata
      }, {
        module: 'feature_tracking',
        success: true
      });
    } catch (error) {
      console.error('❌ [CAOU] Error tracking feature usage:', error);
    }
  }

  /**
   * Get most used features for optimization
   */
  private getMostUsedFeatures(events: AnalyticsEvent[]): Array<{ feature: string; count: number }> {
    const featureCounts: Record<string, number> = {};

    events.forEach(event => {
      if (event.event === 'feature_used' && event.metadata?.feature) {
        const feature = event.metadata.feature as string;
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      }
    });

    return Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 features
  }

  /**
   * Generate session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export analytics data for stakeholder reports
   */
  public async exportAnalyticsData(dateRange: { start: Date; end: Date }, format: 'csv' | 'json'): Promise<string> {
    try {
      const analytics = await this.getUsageAnalytics(dateRange);
      
      if (format === 'csv') {
        return this.convertToCSV(analytics);
      } else {
        return JSON.stringify(analytics, null, 2);
      }
    } catch (error) {
      console.error('❌ [CAOU] Error exporting analytics:', error);
      throw new Error('Error exportando datos de analítica');
    }
  }

  /**
   * Convert analytics data to CSV format
   */
  private convertToCSV(analytics: UsageAnalytics): string {
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Events', analytics.totalEvents.toString()],
      ['Average Session Duration (ms)', analytics.averageSessionDuration.toString()],
      ['Suggestions Acceptance Rate (%)', analytics.suggestionsAcceptanceRate.toString()],
      ['Error Rate (%)', analytics.errorRate.toString()],
      ['Time Saved Per Patient (min)', analytics.timeSavedPerPatient.toString()],
      ['Critical Alerts Triggered', analytics.criticalAlertsTriggered.toString()]
    ];

    return csvRows.map(row => row.join(',')).join('\n');
  }

  /**
   * Helper function to remove undefined values from objects (Firestore doesn't accept undefined)
   */
  private static cleanUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(this.cleanUndefined.bind(this)).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = this.cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  }

  /**
   * Registra un evento de analytics
   * @param eventName - Nombre del evento
   * @param eventData - Datos del evento
   * @param userId - ID del usuario (opcional)
   * @returns Promise<void>
   */
  static async trackEvent(
    eventName: string, 
    eventData: Record<string, unknown> = {}, 
    userId?: string
  ): Promise<void> {
    try {
      const event = {
        eventName,
        eventData,
        ...(userId && { userId }), // Solo incluir userId si está definido
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // ✅ FIX: Clean undefined values before saving to Firestore
      const cleanedEvent = this.cleanUndefined(event);

      const docRef = doc(collection(db, 'analytics_events'));
      await setDoc(docRef, cleanedEvent);

      console.log(`[ANALYTICS] Evento registrado: ${eventName}`, eventData);
    } catch (error) {
      console.error('❌ [ANALYTICS] Error registrando evento:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtiene eventos de analytics con filtros opcionales
   * @param filters - Filtros de búsqueda
   * @param pageSize - Tamaño de página (por defecto 50)
   * @returns Promise con lista de eventos
   */
  static async getEvents(
    filters: AnalyticsFilters = {}, 
    pageSize: number = 50
  ): Promise<AnalyticsEvent[]> {
    try {
      // Validate query for PHI compliance
      const { validateAnalyticsQuery, validateAnalyticsCollection } = await import('./analyticsValidationService');
      validateAnalyticsQuery(filters, 'analytics_events');
      validateAnalyticsCollection('analytics_events');
      
      const eventsRef = collection(db, 'analytics_events');
      let q = query(eventsRef, orderBy('timestamp', 'desc'), limit(pageSize));

      // Aplicar filtros si están presentes
      if (filters.eventName) {
        q = query(q, where('eventName', '==', filters.eventName));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.startDate) {
        q = query(q, where('timestamp', '>=', filters.startDate));
      }
      if (filters.endDate) {
        q = query(q, where('timestamp', '<=', filters.endDate));
      }

      const querySnapshot = await getDocs(q);
      const events: AnalyticsEvent[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        events.push({
          id: doc.id,
          eventName: data.eventName as string,
          eventData: data.eventData as Record<string, unknown>,
          userId: data.userId as string,
          timestamp: data.timestamp?.toDate() || new Date(),
          sessionId: data.sessionId as string,
          userAgent: data.userAgent as string,
          url: data.url as string,
        });
      });

      return events;
    } catch (error) {
      console.error('❌ [ANALYTICS] Error obteniendo eventos:', error);
      throw new Error('Failed to get analytics events');
    }
  }

  /**
   * Obtiene métricas agregadas
   * @param metricType - Tipo de métrica
   * @param filters - Filtros opcionales
   * @returns Promise con métricas
   */
  static async getMetrics(
    metricType: MetricType, 
    filters: AnalyticsFilters = {}
  ): Promise<MetricResult> {
    try {
      const events = await this.getEvents(filters, 1000); // Obtener más eventos para agregación
      
      switch (metricType) {
        case 'usage_by_module':
          return this.calculateUsageByModule(events);
        case 'suggestion_acceptance':
          return this.calculateSuggestionAcceptance(events);
        case 'time_saved':
          return this.calculateTimeSaved(events);
        case 'usage_frequency':
          return this.calculateUsageFrequency(events);
        default:
          throw new Error(`Tipo de métrica no soportado: ${metricType}`);
      }
    } catch (error) {
      console.error('❌ [ANALYTICS] Error calculando métricas:', error);
      throw new Error('Failed to calculate metrics');
    }
  }

  /**
   * Calcula uso por módulo
   * @param events - Lista de eventos
   * @returns Métricas de uso por módulo
   */
  private static calculateUsageByModule(events: AnalyticsEvent[]): MetricResult {
    const moduleUsage: Record<string, number> = {};
    
    events.forEach(event => {
      const module = this.extractModuleFromEvent(event);
      moduleUsage[module] = (moduleUsage[module] || 0) + 1;
    });

    return {
      type: 'usage_by_module',
      data: moduleUsage,
      total: events.length,
      period: this.getCurrentPeriod(),
    };
  }

  /**
   * Calcula tasa de aceptación de sugerencias
   * @param events - Lista de eventos
   * @returns Métricas de aceptación
   */
  private static calculateSuggestionAcceptance(events: AnalyticsEvent[]): MetricResult {
    const suggestionEvents = events.filter(e => 
      e.eventName === 'suggestion_accepted' || e.eventName === 'suggestion_rejected'
    );
    
    const accepted = suggestionEvents.filter(e => e.eventName === 'suggestion_accepted').length;
    const total = suggestionEvents.length;
    const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

    return {
      type: 'suggestion_acceptance',
      data: {
        accepted,
        rejected: total - accepted,
        total,
        acceptanceRate,
      },
      total,
      period: this.getCurrentPeriod(),
    };
  }

  /**
   * Calcula tiempo ahorrado
   * @param events - Lista de eventos
   * @returns Métricas de tiempo ahorrado
   */
  private static calculateTimeSaved(events: AnalyticsEvent[]): MetricResult {
    const timeEvents = events.filter(e => 
      e.eventName === 'consultation_started' || e.eventName === 'soap_generated'
    );
    
    // Estimación: 5 minutos por consulta ahorrados
    const estimatedTimeSaved = timeEvents.length * 5;
    
    return {
      type: 'time_saved',
      data: {
        totalMinutes: estimatedTimeSaved,
        totalHours: estimatedTimeSaved / 60,
        consultations: timeEvents.length,
        averagePerConsultation: 5,
      },
      total: timeEvents.length,
      period: this.getCurrentPeriod(),
    };
  }

  /**
   * Calcula frecuencia de uso
   * @param events - Lista de eventos
   * @returns Métricas de frecuencia
   */
  private static calculateUsageFrequency(events: AnalyticsEvent[]): MetricResult {
    const userSessions = new Set(events.map(e => e.sessionId));
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    
    return {
      type: 'usage_frequency',
      data: {
        totalSessions: userSessions.size,
        uniqueUsers: uniqueUsers.size,
        totalEvents: events.length,
        averageEventsPerSession: events.length / userSessions.size,
      },
      total: events.length,
      period: this.getCurrentPeriod(),
    };
  }

  /**
   * Extrae módulo del evento
   * @param event - Evento de analytics
   * @returns Nombre del módulo
   */
  private static extractModuleFromEvent(event: AnalyticsEvent): string {
    const moduleMap: Record<string, string> = {
      'login_success': 'Authentication',
      'patient_created': 'Patient Management',
      'consultation_started': 'Clinical Workflow',
      'soap_generated': 'Clinical Workflow',
      'suggestion_accepted': 'AI Features',
      'suggestion_rejected': 'AI Features',
    };

    return moduleMap[event.eventName] || 'Other';
  }

  /**
   * Obtiene ID de sesión
   * @returns ID de sesión
   */
  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Obtiene período actual
   * @returns Período actual
   */
  private static getCurrentPeriod(): string {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return `${startOfMonth.toISOString().split('T')[0]} - ${now.toISOString().split('T')[0]}`;
  }

  /**
   * Track value metrics for MVP - Kaizen reinvestment intelligence
   * 
   * REQUIREMENTS:
   * - PHIPA compliant (no PHI)
   * - Pseudonymized identifiers
   * - Validated before saving
   * 
   * @param metrics - Value metrics event data
   */
  static async trackValueMetrics(metrics: Omit<ValueMetricsEvent, 'timestamp'>): Promise<void> {
    try {
      // Import validators (dynamic to avoid circular deps)
      const { validateAnalyticsQuery, validateKAnonymity } = await import('./analyticsValidationService');
      const { pseudonymizeUserId } = await import('./pseudonymizationService');
      
      // Validate query doesn't contain PHI
      validateAnalyticsQuery(metrics, 'value_analytics');
      
      // Pseudonymize user ID
      const hashedUserId = await pseudonymizeUserId(metrics.hashedUserId);
      const hashedSessionId = metrics.hashedSessionId; // Already hashed or generate hash
      
      // Prepare event for Firestore
      const valueEvent = {
        hashedUserId,
        hashedSessionId,
        timestamps: {
          sessionStart: metrics.timestamps.sessionStart,
          transcriptionStart: metrics.timestamps.transcriptionStart || null,
          transcriptionEnd: metrics.timestamps.transcriptionEnd || null,
          soapGenerationStart: metrics.timestamps.soapGenerationStart || null,
          soapFinalized: metrics.timestamps.soapFinalized,
        },
        calculatedTimes: {
          totalDocumentationTime: metrics.calculatedTimes.totalDocumentationTime,
          transcriptionTime: metrics.calculatedTimes.transcriptionTime || null,
          aiGenerationTime: metrics.calculatedTimes.aiGenerationTime || null,
          manualEditingTime: metrics.calculatedTimes.manualEditingTime || null,
        },
        featuresUsed: metrics.featuresUsed,
        quality: metrics.quality,
        sessionType: metrics.sessionType,
        region: metrics.region || null,
        timestamp: serverTimestamp(),
      };
      
      // Save to Firestore
      const valueAnalyticsRef = collection(db, 'value_analytics');
      await addDoc(valueAnalyticsRef, valueEvent);
      
      console.log('[VALUE METRICS] Event tracked:', {
        hashedSessionId,
        totalTime: metrics.calculatedTimes.totalDocumentationTime,
        featuresUsed: Object.values(metrics.featuresUsed).filter(Boolean).length,
      });
    } catch (error) {
      console.error('❌ [VALUE METRICS] Error tracking value metrics:', error);
      // Don't throw - analytics should not break main flow
    }
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

/**
 * Value Metrics for MVP - Kaizen Reinvestment Intelligence
 * 
 * Tracks 3 critical metrics:
 * 1. Time-to-Value - Documentation time (primary value metric)
 * 2. Feature Adoption - Feature usage (where to reinvest development)
 * 3. Quality Signals - Output quality (if product works)
 */

export interface ValueMetricsEvent {
  // Session identifiers (pseudonymized)
  hashedUserId: string;
  hashedSessionId: string;
  
  // Time-to-Value metrics
  timestamps: {
    sessionStart: Date;
    transcriptionStart?: Date;
    transcriptionEnd?: Date;
    soapGenerationStart?: Date;
    soapFinalized: Date;
  };
  
  calculatedTimes: {
    totalDocumentationTime: number; // minutos
    transcriptionTime?: number;      // minutos
    aiGenerationTime?: number;       // minutos (transcription + SOAP)
    manualEditingTime?: number;      // minutos (entre generación y finalización)
  };
  
  // Feature Adoption metrics
  featuresUsed: {
    transcription: boolean;
    physicalTests: boolean;
    aiSuggestions: boolean;
    soapGeneration: boolean;
  };
  
  // Quality Signals
  quality: {
    soapSectionsCompleted: {
      subjective: boolean;
      objective: boolean;
      assessment: boolean;
      plan: boolean;
    };
    suggestionsOffered: number;
    suggestionsAccepted: number;
    suggestionsRejected: number;
    editsMadeToSOAP: number; // Número de cambios después de generación
  };
  
  // Metadata
  sessionType: 'initial' | 'follow-up';
  region?: string; // Provincias (sin granularidad específica)
  timestamp: Date;
}
