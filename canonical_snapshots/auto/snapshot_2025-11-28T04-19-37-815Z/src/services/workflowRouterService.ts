/**
 * Workflow Router Service
 * 
 * Routes workflow based on follow-up detection, providing optimized paths
 * for follow-up visits vs initial evaluations.
 * 
 * @compliance PHIPA compliant (no data handling changes)
 * @audit ISO 27001 A.8.2.3 (Handling of assets)
 */

import { detectFollowUp, type FollowUpDetectionResult, type FollowUpDetectionInput } from './followUpDetectionService';

// ✅ ISO 27001 AUDIT: Lazy import to prevent build issues
let FirestoreAuditLogger: typeof import('../core/audit/FirestoreAuditLogger').FirestoreAuditLogger | null = null;

const getAuditLogger = async () => {
  if (!FirestoreAuditLogger) {
    const module = await import('../core/audit/FirestoreAuditLogger');
    FirestoreAuditLogger = module.FirestoreAuditLogger;
  }
  return FirestoreAuditLogger;
};

export type WorkflowType = 'initial' | 'follow-up' | 'manual-override';

export interface WorkflowRoute {
  type: WorkflowType;
  skipTabs: string[]; // Tabs to skip for this workflow
  directToTab: string; // Tab to navigate to directly
  analysisLevel: 'full' | 'optimized';
  auditLog: WorkflowDecisionLog;
}

export interface WorkflowDecisionLog {
  detectionResult: FollowUpDetectionResult;
  routingDecision: WorkflowRoute;
  timestamp: Date;
  userId?: string;
  patientId: string;
}

/**
 * Determines workflow route based on detection result
 * 
 * @param detectionResult Follow-up detection result
 * @param userId User ID (for audit)
 * @param patientId Patient ID
 * @returns Workflow route configuration
 */
export function determineWorkflowRoute(
  detectionResult: FollowUpDetectionResult,
  userId: string,
  patientId: string
): WorkflowRoute {
  const workflowType: WorkflowType = detectionResult.isFollowUp 
    ? 'follow-up' 
    : detectionResult.manualOverride 
      ? 'manual-override'
      : 'initial';
  
  // Follow-up workflow: Skip analysis tab, go directly to SOAP
  if (workflowType === 'follow-up') {
    return {
      type: 'follow-up',
      skipTabs: ['analysis'], // Skip comprehensive analysis for follow-ups
      directToTab: 'soap', // Go directly to SOAP generation
      analysisLevel: 'optimized', // Use optimized templates
      auditLog: {
        detectionResult,
        routingDecision: {} as WorkflowRoute, // Will be filled below
        timestamp: new Date(),
        userId,
        patientId,
      },
    };
  }
  
  // Initial evaluation: Full workflow
  return {
    type: 'initial',
    skipTabs: [], // Don't skip any tabs
    directToTab: 'analysis', // Start with analysis
    analysisLevel: 'full', // Use full analysis
    auditLog: {
      detectionResult,
      routingDecision: {} as WorkflowRoute, // Will be filled below
      timestamp: new Date(),
      userId,
      patientId,
    },
  };
}

/**
 * Routes workflow for a patient session
 * 
 * @param input Detection input parameters
 * @param userId User ID
 * @returns Workflow route configuration
 */
export async function routeWorkflow(
  input: FollowUpDetectionInput,
  userId: string
): Promise<WorkflowRoute> {
  // Detect follow-up
  const detectionResult = await detectFollowUp(input);
  
  // Determine route
  const route = determineWorkflowRoute(detectionResult, userId, input.patientId);
  
  // Complete audit log
  route.auditLog.routingDecision = route;
  
  // Log routing decision
  const logger = await getAuditLogger();
  await logger.logEvent({
    type: 'workflow_routing',
    userId,
    userRole: 'professional',
    patientId: input.patientId,
    metadata: {
      workflowType: route.type,
      detectionConfidence: detectionResult.confidence,
      skipTabs: route.skipTabs,
      directToTab: route.directToTab,
      analysisLevel: route.analysisLevel,
      timestamp: new Date().toISOString(),
    },
  });
  
  return route;
}

/**
 * Checks if a tab should be skipped for current workflow
 * 
 * @param route Workflow route
 * @param tabName Tab name to check
 * @returns true if tab should be skipped
 */
export function shouldSkipTab(route: WorkflowRoute, tabName: string): boolean {
  return route.skipTabs.includes(tabName);
}

/**
 * Gets the initial tab for workflow
 * 
 * @param route Workflow route
 * @returns Initial tab name
 */
export function getInitialTab(route: WorkflowRoute): string {
  return route.directToTab;
}

