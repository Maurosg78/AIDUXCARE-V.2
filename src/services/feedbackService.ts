import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import logger from '@/shared/utils/logger';

/**
 * Feedback Service
 * 
 * Captures user feedback during beta testing period.
 * Critical for 1-month physiotherapist testing program.
 */

export type FeedbackType = 'bug' | 'suggestion' | 'question' | 'other';
export type FeedbackSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Enriched context automatically captured for feedback
 */
export interface EnrichedContext {
  // Workflow context
  workflowStep?: 'analysis' | 'evaluation' | 'soap';
  workflowState?: {
    hasTranscript?: boolean;
    transcriptLength?: number;
    hasAnalysis?: boolean;
    testsCompleted?: number;
    soapGenerated?: boolean;
    soapFinalized?: boolean;
  };
  
  // Patient context
  patientType?: 'new_evaluation' | 'existing_followup';
  visitNumber?: number;
  sessionType?: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate';
  
  // User context
  isPilotUser?: boolean;
  userExperienceLevel?: 'new' | 'experienced';
  
  // Performance context
  pageLoadTime?: number;
  lastAction?: string;
  timeOnPage?: number;
}

export interface UserFeedback {
  type: FeedbackType;
  severity: FeedbackSeverity;
  description: string;
  userId?: string;
  sessionId?: string;
  url: string;
  userAgent: string;
  timestamp: Date;
  context?: {
    currentPage?: string;
    workflowStep?: string;
    errorMessage?: string;
    stackTrace?: string;
  };
  
  // 🔴 NUEVO: Contexto enriquecido automático
  enrichedContext?: EnrichedContext;
  
  // 🔴 NUEVO: Auto-categorización
  autoTags?: string[];
  calculatedPriority?: number; // 1-10
}

export class FeedbackService {
  private static readonly COLLECTION_NAME = 'user_feedback';

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
   * 🔴 NUEVO: Captura automática de contexto enriquecido
   */
  static getEnrichedContext(): EnrichedContext {
    try {
      const workflowState = this.getWorkflowState();
      const patientContext = this.getPatientContext();
      const userContext = this.getUserContext();
      const performanceContext = this.getPerformanceContext();
      
      return {
        // Workflow context
        workflowStep: this.detectWorkflowStep(),
        workflowState: {
          hasTranscript: !!workflowState?.transcript,
          transcriptLength: workflowState?.transcript ? workflowState.transcript.split(/\s+/).length : 0,
          hasAnalysis: !!workflowState?.niagaraResults,
          testsCompleted: workflowState?.evaluationTests?.length || 0,
          soapGenerated: !!workflowState?.localSoapNote,
          soapFinalized: workflowState?.soapStatus === 'finalized',
        },
        
        // Patient context
        patientType: patientContext?.patientType,
        visitNumber: patientContext?.visitNumber,
        sessionType: patientContext?.sessionType,
        
        // User context
        isPilotUser: userContext?.isPilotUser || false,
        userExperienceLevel: this.calculateExperienceLevel(userContext?.sessionsCompleted),
        
        // Performance context
        pageLoadTime: performanceContext?.pageLoadTime,
        lastAction: sessionStorage.getItem('lastAction') || undefined,
        timeOnPage: performanceContext?.timeOnPage,
      };
    } catch (error) {
      console.warn('[FEEDBACK] Error capturing enriched context:', error);
      return {}; // Return empty object if capture fails
    }
  }

  /**
   * 🔴 NUEVO: Detectar workflow step actual
   */
  private static detectWorkflowStep(): 'analysis' | 'evaluation' | 'soap' | undefined {
    try {
      const url = window.location.href;
      const hash = window.location.hash;
      
      if (url.includes('/workflow')) {
        if (hash.includes('analysis') || hash.includes('#analysis')) return 'analysis';
        if (hash.includes('evaluation') || hash.includes('#evaluation')) return 'evaluation'; 
        if (hash.includes('soap') || hash.includes('#soap')) return 'soap';
      }
      
      // Detectar por elementos DOM visibles
      const activeTab = document.querySelector('[data-tab].active')?.getAttribute('data-tab');
      if (activeTab === 'analysis') return 'analysis';
      if (activeTab === 'evaluation') return 'evaluation';
      if (activeTab === 'soap') return 'soap';
      
      // Detectar por URL path
      if (url.includes('/workflow')) {
        // Intentar obtener activeTab desde localStorage (workflow state)
        try {
          const patientId = this.getCurrentPatientId();
          if (patientId) {
            const workflowState = this.getWorkflowState();
            if (workflowState?.activeTab && ['analysis', 'evaluation', 'soap'].includes(workflowState.activeTab)) {
              return workflowState.activeTab as 'analysis' | 'evaluation' | 'soap';
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      return undefined;
    } catch (error) {
      console.warn('[FEEDBACK] Error detecting workflow step:', error);
      return undefined;
    }
  }

  /**
   * 🔴 NUEVO: Obtener estado del workflow desde localStorage
   */
  private static getWorkflowState() {
    try {
      const patientId = this.getCurrentPatientId();
      if (!patientId) return {};
      
      const workflowData = localStorage.getItem(`aidux_${patientId}`);
      if (!workflowData) return {};
      
      const parsed = JSON.parse(workflowData);
      return {
        transcript: parsed.transcript || null,
        niagaraResults: parsed.niagaraResults || null,
        evaluationTests: parsed.evaluationTests || [],
        localSoapNote: parsed.localSoapNote || null,
        soapStatus: parsed.soapStatus || null,
        activeTab: parsed.activeTab || null,
      };
    } catch (error) {
      console.warn('[FEEDBACK] Error getting workflow state:', error);
      return {};
    }
  }

  /**
   * 🔴 NUEVO: Obtener ID del paciente actual
   */
  private static getCurrentPatientId(): string | null {
    try {
      // Intentar desde URL
      const urlMatch = window.location.pathname.match(/\/workflow\/([^/]+)\//);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
      
      // Intentar desde sessionStorage
      const sessionPatientId = sessionStorage.getItem('currentPatientId');
      if (sessionPatientId) return sessionPatientId;
      
      // Intentar desde localStorage (último paciente usado)
      const keys = Object.keys(localStorage);
      const workflowKey = keys.find(key => key.startsWith('aidux_') && key !== 'aidux_workflow_');
      if (workflowKey) {
        return workflowKey.replace('aidux_', '');
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🔴 NUEVO: Obtener contexto del paciente
   */
  private static getPatientContext() {
    try {
      const patientId = this.getCurrentPatientId();
      if (!patientId) return {};
      
      const workflowData = localStorage.getItem(`aidux_${patientId}`);
      if (!workflowData) return {};
      
      const parsed = JSON.parse(workflowData);
      return {
        patientType: sessionStorage.getItem('currentPatientType') || parsed.patientType || undefined,
        visitNumber: parseInt(sessionStorage.getItem('currentVisitNumber') || parsed.visitNumber || '1'),
        sessionType: sessionStorage.getItem('currentSessionType') || parsed.visitType || undefined,
      };
    } catch (error) {
      console.warn('[FEEDBACK] Error getting patient context:', error);
      return {};
    }
  }

  /**
   * 🔴 NUEVO: Obtener contexto del usuario
   */
  private static getUserContext() {
    try {
      // Intentar desde localStorage (auth state)
      const authData = localStorage.getItem('firebase:authUser');
      if (authData) {
        const parsed = JSON.parse(authData);
        return {
          isPilotUser: parsed.isPilotUser || false,
          sessionsCompleted: parseInt(localStorage.getItem('user_sessions_completed') || '0'),
        };
      }
      
      // Intentar desde sessionStorage
      const userData = sessionStorage.getItem('currentUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        return {
          isPilotUser: parsed.isPilotUser || false,
          sessionsCompleted: parsed.sessionsCompleted || 0,
        };
      }
      
      return {};
    } catch (error) {
      console.warn('[FEEDBACK] Error getting user context:', error);
      return {};
    }
  }

  /**
   * 🔴 NUEVO: Obtener contexto de performance
   */
  private static getPerformanceContext() {
    try {
      const pageStartTime = parseInt(sessionStorage.getItem('pageStartTime') || '0');
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      
      return {
        pageLoadTime: navigation?.loadEventEnd ? navigation.loadEventEnd - navigation.loadEventStart : undefined,
        timeOnPage: pageStartTime ? Date.now() - pageStartTime : undefined,
      };
    } catch (error) {
      console.warn('[FEEDBACK] Error getting performance context:', error);
      return {};
    }
  }

  /**
   * 🔴 NUEVO: Calcular nivel de experiencia
   */
  private static calculateExperienceLevel(sessionsCompleted: number = 0): 'new' | 'experienced' {
    return sessionsCompleted >= 5 ? 'experienced' : 'new';
  }

  /**
   * 🔴 NUEVO: Notificar al equipo sobre feedback crítico
   */
  private static async notifyTeamCritical(feedback: UserFeedback): Promise<void> {
    try {
      // Log detallado para monitoreo
      logger.error('[FEEDBACK] CRITICAL FEEDBACK RECEIVED', {
        type: feedback.type,
        severity: feedback.severity,
        priority: feedback.calculatedPriority,
        workflowStep: feedback.enrichedContext?.workflowStep,
        autoTags: feedback.autoTags,
        url: feedback.url,
        userId: feedback.userId,
      });

      // TODO: Implementar notificación por email/Slack cuando esté disponible
      // Por ahora, solo logging detallado
      console.group('🚨 CRITICAL FEEDBACK ALERT');
      console.log('Type:', feedback.type);
      console.log('Severity:', feedback.severity);
      console.log('Priority:', feedback.calculatedPriority);
      console.log('Workflow Step:', feedback.enrichedContext?.workflowStep);
      console.log('Auto Tags:', feedback.autoTags);
      console.log('Description:', feedback.description);
      console.log('URL:', feedback.url);
      console.log('Enriched Context:', feedback.enrichedContext);
      console.groupEnd();
    } catch (error) {
      console.warn('[FEEDBACK] Error notifying team about critical feedback:', error);
      // No throw - notification failure shouldn't block feedback submission
    }
  }

  /**
   * 🔴 NUEVO: Auto-tags basados en contexto
   */
  static calculateAutoTags(feedback: UserFeedback): string[] {
    const tags: string[] = [];
    
    // Workflow blocking
    if (feedback.severity === 'critical' && feedback.enrichedContext?.workflowStep) {
      tags.push('workflow-blocking');
    }
    
    // UI confusion
    if (feedback.type === 'question' || feedback.type === 'suggestion') {
      tags.push('ui-confusion');
    }
    
    // Performance issues
    if (feedback.enrichedContext?.pageLoadTime && feedback.enrichedContext.pageLoadTime > 3000) {
      tags.push('performance');
    }
    
    // First-time user issues
    if (feedback.enrichedContext?.userExperienceLevel === 'new') {
      tags.push('onboarding');
    }
    
    // SOAP generation issues
    if (feedback.enrichedContext?.workflowStep === 'soap' && feedback.type === 'bug') {
      tags.push('soap-generation');
    }
    
    // Analysis step issues
    if (feedback.enrichedContext?.workflowStep === 'analysis') {
      tags.push('analysis-step');
    }
    
    // Evaluation step issues  
    if (feedback.enrichedContext?.workflowStep === 'evaluation') {
      tags.push('evaluation-step');
    }
    
    // Pilot user feedback
    if (feedback.enrichedContext?.isPilotUser) {
      tags.push('pilot-user');
    }
    
    // New patient workflow
    if (feedback.enrichedContext?.patientType === 'new_evaluation') {
      tags.push('new-patient');
    }
    
    // Existing patient workflow
    if (feedback.enrichedContext?.patientType === 'existing_followup') {
      tags.push('existing-patient');
    }
    
    return tags;
  }

  /**
   * 🔴 NUEVO: Cálculo de prioridad automática
   */
  static calculatePriority(feedback: UserFeedback): number {
    let priority = 0;
    
    // Severity base (40% del peso)
    const severityWeight = {
      'critical': 10,
      'high': 7,
      'medium': 4,
      'low': 1
    };
    priority += severityWeight[feedback.severity] * 0.4;
    
    // Type multiplier (20% del peso)
    const typeMultiplier = {
      'bug': 1.0,        // Bugs son más urgentes
      'suggestion': 0.7, // Sugerencias menos urgentes
      'question': 0.5,   // Preguntas menos urgentes
      'other': 0.6
    };
    priority += (severityWeight[feedback.severity] * typeMultiplier[feedback.type]) * 0.2;
    
    // Workflow blocking (30% del peso)
    if (feedback.enrichedContext?.workflowStep && feedback.severity === 'critical') {
      priority += 10 * 0.3; // Máximo si bloquea workflow
    } else if (feedback.enrichedContext?.workflowStep) {
      priority += 5 * 0.3; // Medio si afecta workflow
    }
    
    // User experience level (10% del peso)
    if (feedback.enrichedContext?.userExperienceLevel === 'new') {
      priority += 3 * 0.1; // Priorizar problemas de onboarding
    }
    
    return Math.min(Math.round(priority * 10) / 10, 10); // Cap at 10, round to 1 decimal
  }

  /**
   * Submit user feedback to Firestore
   * 🔴 MODIFICADO: Ahora incluye contexto enriquecido, auto-tags y prioridad
   */
  static async submitFeedback(feedback: Omit<UserFeedback, 'timestamp' | 'enrichedContext' | 'autoTags' | 'calculatedPriority'>): Promise<void> {
    try {
      // Capturar contexto enriquecido automáticamente
      const enrichedContext = this.getEnrichedContext();
      
      // Crear feedback completo
      const completeFeedback: Omit<UserFeedback, 'timestamp'> & { timestamp: any } = {
        ...feedback,
        timestamp: serverTimestamp(),
        enrichedContext,
        autoTags: [],
        calculatedPriority: 0
      };
      
      // Calcular auto-tags y prioridad
      completeFeedback.autoTags = this.calculateAutoTags(completeFeedback as UserFeedback);
      completeFeedback.calculatedPriority = this.calculatePriority(completeFeedback as UserFeedback);
      
      // ✅ FIX: Clean undefined values before saving to Firestore
      const cleanedFeedbackData = this.cleanUndefined(completeFeedback);

      await addDoc(collection(db, this.COLLECTION_NAME), cleanedFeedbackData);

      logger.info('[FEEDBACK] Feedback submitted with enriched context:', {
        type: feedback.type,
        severity: feedback.severity,
        url: feedback.url,
        workflowStep: enrichedContext.workflowStep,
        autoTags: completeFeedback.autoTags,
        calculatedPriority: completeFeedback.calculatedPriority,
      });

      // If critical severity, log to console for immediate attention
      if (feedback.severity === 'critical') {
        console.error('🚨 [CRITICAL FEEDBACK]', {
          ...feedback,
          enrichedContext,
          autoTags: completeFeedback.autoTags,
          calculatedPriority: completeFeedback.calculatedPriority,
        });
        // Notify team for critical feedback
        await this.notifyTeamCritical(completeFeedback as UserFeedback);
      }
    } catch (error) {
      logger.error('[FEEDBACK] Error submitting feedback:', error);
      console.error('❌ [FEEDBACK] Failed to submit feedback:', error);
      throw error;
    }
  }

  /**
   * Auto-capture context for feedback (URL, user agent, current page state)
   */
  static getAutoContext(): Pick<UserFeedback, 'url' | 'userAgent' | 'context'> {
    return {
      url: window.location.href,
      userAgent: navigator.userAgent,
      context: {
        currentPage: window.location.pathname,
        errorMessage: window.lastError?.message,
        stackTrace: window.lastError?.stack,
      },
    };
  }

  /**
   * Capture error context automatically
   */
  static async submitErrorFeedback(
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await this.submitFeedback({
        type: 'bug',
        severity: 'critical',
        description: `Error: ${error.message}\n\nStack: ${error.stack || 'N/A'}`,
        ...this.getAutoContext(),
        context: {
          ...this.getAutoContext().context,
          errorMessage: error.message,
          stackTrace: error.stack,
          ...context,
        },
      });
    } catch (err) {
      console.error('❌ [FEEDBACK] Failed to submit error feedback:', err);
    }
  }
}

// Global error tracking helper
declare global {
  interface Window {
    lastError?: Error;
  }
}

// Capture unhandled errors globally
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    window.lastError = new Error(event.message);
    window.lastError.stack = event.error?.stack;
  });

  window.addEventListener('unhandledrejection', (event) => {
    window.lastError = new Error(event.reason?.message || 'Unhandled promise rejection');
  });
}

