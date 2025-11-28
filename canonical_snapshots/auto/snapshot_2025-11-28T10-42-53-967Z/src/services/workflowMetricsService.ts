/**
 * Workflow Metrics Service
 * 
 * Tracks performance metrics for workflow optimization:
 * - Time saved per workflow type
 * - Token usage optimization
 * - Efficiency metrics
 * - User experience metrics
 * 
 * @compliance PHIPA compliant
 * @audit ISO 27001 A.12.4.1 (Event logging)
 */

import { AnalyticsService } from './analyticsService';

// ✅ ISO 27001 AUDIT: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export interface WorkflowMetrics {
  workflowType: 'initial' | 'follow-up';
  timeToSOAP: number; // seconds
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  tokenOptimization?: {
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  };
  userClicks: number;
  tabsSkipped: number;
  timestamp: Date;
}

export interface WorkflowSessionMetrics {
  sessionId: string;
  patientId: string;
  userId: string;
  workflowType: 'initial' | 'follow-up';
  startTime: Date;
  soapGenerationTime?: Date;
  endTime?: Date;
  timeToSOAP?: number; // seconds
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  tokenOptimization?: {
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  };
  userClicks: number;
  tabsSkipped: number;
}

/**
 * Tracks workflow session start
 */
export async function trackWorkflowSessionStart(
  sessionId: string,
  patientId: string,
  userId: string,
  workflowType: 'initial' | 'follow-up',
  tabsSkipped: number = 0
): Promise<void> {
  const metrics: WorkflowSessionMetrics = {
    sessionId,
    patientId,
    userId,
    workflowType,
    startTime: new Date(),
    userClicks: 0,
    tabsSkipped,
  };

  // Store in session storage for later completion
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`workflow_metrics_${sessionId}`, JSON.stringify(metrics));
  }

  // Log to analytics
  await AnalyticsService.trackEvent('workflow_session_started', {
    sessionId,
    patientId,
    userId,
    workflowType,
    tabsSkipped,
    timestamp: metrics.startTime.toISOString(),
  });

  // Audit log
  const logger = await getAuditLogger();
  await logger.logEvent({
    type: 'workflow_session_start',
    userId,
    userRole: 'professional',
    patientId,
    metadata: {
      sessionId,
      workflowType,
      tabsSkipped,
      timestamp: metrics.startTime.toISOString(),
    },
  });
}

/**
 * Tracks SOAP generation completion
 */
export async function trackSOAPGeneration(
  sessionId: string,
  tokenUsage: {
    input: number;
    output: number;
  },
  tokenOptimization?: {
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  }
): Promise<void> {
  // Retrieve session metrics
  if (typeof window === 'undefined') return;
  
  const stored = sessionStorage.getItem(`workflow_metrics_${sessionId}`);
  if (!stored) return;

  const metrics: WorkflowSessionMetrics = JSON.parse(stored);
  metrics.soapGenerationTime = new Date();
  metrics.timeToSOAP = metrics.startTime 
    ? Math.floor((metrics.soapGenerationTime.getTime() - new Date(metrics.startTime).getTime()) / 1000)
    : undefined;
  metrics.tokenUsage = {
    input: tokenUsage.input,
    output: tokenUsage.output,
    total: tokenUsage.input + tokenUsage.output,
  };
  if (tokenOptimization) {
    metrics.tokenOptimization = tokenOptimization;
  }

  // Update storage
  sessionStorage.setItem(`workflow_metrics_${sessionId}`, JSON.stringify(metrics));

  // Log to analytics
  await AnalyticsService.trackEvent('workflow_soap_generated', {
    sessionId,
    workflowType: metrics.workflowType,
    timeToSOAP: metrics.timeToSOAP,
    tokenUsage: metrics.tokenUsage,
    tokenOptimization: metrics.tokenOptimization,
    timestamp: metrics.soapGenerationTime.toISOString(),
  });
}

/**
 * Tracks user click/interaction
 */
export function trackUserClick(sessionId: string): void {
  if (typeof window === 'undefined') return;
  
  const stored = sessionStorage.getItem(`workflow_metrics_${sessionId}`);
  if (!stored) return;

  const metrics: WorkflowSessionMetrics = JSON.parse(stored);
  metrics.userClicks += 1;
  sessionStorage.setItem(`workflow_metrics_${sessionId}`, JSON.stringify(metrics));
}

/**
 * Completes workflow session tracking
 */
export async function trackWorkflowSessionEnd(
  sessionId: string,
  userId: string,
  patientId: string
): Promise<WorkflowSessionMetrics | null> {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(`workflow_metrics_${sessionId}`);
  if (!stored) return null;

  const metrics: WorkflowSessionMetrics = JSON.parse(stored);
  metrics.endTime = new Date();

  // Calculate efficiency metrics
  const finalMetrics: WorkflowMetrics = {
    workflowType: metrics.workflowType,
    timeToSOAP: metrics.timeToSOAP || 0,
    tokenUsage: metrics.tokenUsage || { input: 0, output: 0, total: 0 },
    tokenOptimization: metrics.tokenOptimization,
    userClicks: metrics.userClicks,
    tabsSkipped: metrics.tabsSkipped,
    timestamp: metrics.endTime,
  };

  // Log to analytics
  await AnalyticsService.trackEvent('workflow_session_completed', {
    sessionId,
    patientId,
    userId,
    workflowType: metrics.workflowType,
    timeToSOAP: finalMetrics.timeToSOAP,
    tokenUsage: finalMetrics.tokenUsage,
    tokenOptimization: finalMetrics.tokenOptimization,
    userClicks: finalMetrics.userClicks,
    tabsSkipped: finalMetrics.tabsSkipped,
    timestamp: metrics.endTime.toISOString(),
  });

  // Audit log
  const logger = await getAuditLogger();
  await logger.logEvent({
    type: 'workflow_session_end',
    userId,
    userRole: 'professional',
    patientId,
    metadata: {
      sessionId,
      workflowType: metrics.workflowType,
      timeToSOAP: finalMetrics.timeToSOAP,
      tokenUsage: finalMetrics.tokenUsage,
      tokenOptimization: finalMetrics.tokenOptimization,
      userClicks: finalMetrics.userClicks,
      tabsSkipped: finalMetrics.tabsSkipped,
      timestamp: metrics.endTime.toISOString(),
    },
  });

  // Clean up session storage
  sessionStorage.removeItem(`workflow_metrics_${sessionId}`);

  return metrics;
}

/**
 * Gets workflow efficiency summary
 */
export function getWorkflowEfficiencySummary(metrics: WorkflowMetrics): {
  timeSaved: number; // seconds vs baseline
  tokenReduction: number; // percent
  clickReduction: number; // percent
  efficiencyGain: string; // human-readable summary
} {
  // Baseline metrics (from initial evaluation workflow)
  const baselineTimeToSOAP = 600; // 10 minutes
  const baselineClicks = 15;
  
  const timeSaved = metrics.workflowType === 'follow-up' 
    ? Math.max(0, baselineTimeToSOAP - metrics.timeToSOAP)
    : 0;
  
  const tokenReduction = metrics.tokenOptimization?.reductionPercent || 0;
  
  const clickReduction = metrics.workflowType === 'follow-up'
    ? Math.round(((baselineClicks - metrics.userClicks) / baselineClicks) * 100)
    : 0;

  const efficiencyGain = metrics.workflowType === 'follow-up'
    ? `Follow-up workflow: ${Math.floor(timeSaved / 60)}min saved, ${tokenReduction}% token reduction, ${clickReduction}% fewer clicks`
    : 'Initial evaluation workflow: Full analysis';

  return {
    timeSaved,
    tokenReduction,
    clickReduction,
    efficiencyGain,
  };
}


