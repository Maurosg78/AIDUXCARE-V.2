/**
 * Workflow Selector Component
 * 
 * Provides UI for workflow selection (Initial vs Follow-up) with
 * auto-detection indicators and manual override options.
 * 
 * @compliance PHIPA-aware (design goal)
 */

import React, { useState, useEffect } from 'react';
import { Info, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { detectFollowUp, explainDetectionResult, type FollowUpDetectionResult, type FollowUpDetectionInput } from '../../services/followUpDetectionService';
import { routeWorkflow, type WorkflowRoute } from '../../services/workflowRouterService';

export interface WorkflowSelectorProps {
  patientId: string;
  chiefComplaint?: string;
  consultationType?: string;
  providerNotes?: string;
  appointmentData?: {
    scheduledType?: string;
    reason?: string;
  };
  userId: string;
  onWorkflowSelected: (route: WorkflowRoute) => void;
  onManualOverride?: (type: 'initial' | 'follow-up') => void;
}

export const WorkflowSelector: React.FC<WorkflowSelectorProps> = ({
  patientId,
  chiefComplaint,
  consultationType,
  providerNotes,
  appointmentData,
  userId,
  onWorkflowSelected,
  onManualOverride,
}) => {
  const [detectionResult, setDetectionResult] = useState<FollowUpDetectionResult | null>(null);
  const [workflowRoute, setWorkflowRoute] = useState<WorkflowRoute | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [manualSelection, setManualSelection] = useState<'initial' | 'follow-up' | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Auto-detect on mount and when inputs change
  useEffect(() => {
    let isMounted = true;
    
    const performDetection = async () => {
      setIsDetecting(true);
      
      const input: FollowUpDetectionInput = {
        patientId,
        chiefComplaint,
        consultationType,
        providerNotes,
        appointmentData,
        manualOverride: manualSelection || undefined,
      };
      
      try {
        // Pass userId to detectFollowUp for audit logging
        const result = await detectFollowUp(input, userId);
        if (!isMounted) return;
        
        setDetectionResult(result);
        
        // Route workflow based on detection
        const route = await routeWorkflow(input, userId);
        if (!isMounted) return;
        
        setWorkflowRoute(route);
        onWorkflowSelected(route);
      } catch (error) {
        if (!isMounted) return;
        
        console.error('[WorkflowSelector] Detection error:', error);
        // Fallback to initial evaluation
        const fallbackRoute: WorkflowRoute = {
          type: 'initial',
          skipTabs: [],
          directToTab: 'analysis',
          analysisLevel: 'full',
          auditLog: {
            detectionResult: {
              isFollowUp: false,
              confidence: 0,
              rationale: ['Detection error - defaulting to initial'],
              recommendedWorkflow: 'initial',
            },
            routingDecision: {} as WorkflowRoute,
            timestamp: new Date(),
            userId,
            patientId,
          },
        };
        setWorkflowRoute(fallbackRoute);
        onWorkflowSelected(fallbackRoute);
      } finally {
        if (isMounted) {
          setIsDetecting(false);
        }
      }
    };
    
    performDetection();
    
    return () => {
      isMounted = false;
    };
  }, [patientId, chiefComplaint, consultationType, providerNotes, appointmentData, manualSelection, userId]);

  const handleManualOverride = (type: 'initial' | 'follow-up') => {
    setManualSelection(type);
    if (onManualOverride) {
      onManualOverride(type);
    }
  };

  const handleResetDetection = () => {
    setManualSelection(null);
  };

  if (isDetecting) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          <span className="text-sm">Detecting workflow type...</span>
        </div>
      </div>
    );
  }

  if (!detectionResult || !workflowRoute) {
    return null;
  }

  const isFollowUp = workflowRoute.type === 'follow-up';
  const isSuggested = detectionResult.recommendedWorkflow === 'suggest-follow-up';
  const explanation = explainDetectionResult(detectionResult);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 mb-4">
      {/* Workflow Type Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isFollowUp ? (
            <div className="flex items-center gap-2">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Follow-up Visit</h3>
                <p className="text-xs text-gray-600">Optimized workflow enabled</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 rounded-full p-2">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Initial Evaluation</h3>
                <p className="text-xs text-gray-600">Full analysis workflow</p>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        {detectionResult.confidence > 0 && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            detectionResult.confidence >= 80 
              ? 'bg-green-100 text-green-700'
              : detectionResult.confidence >= 60
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {detectionResult.confidence}% confidence
          </div>
        )}
      </div>

      {/* Detection Explanation */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 mb-2">{explanation}</p>
        
        {/* Suggestion Banner */}
        {isSuggested && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Follow-up Suggested</p>
                <p className="text-xs text-yellow-700 mt-1">
                  This appears to be a follow-up visit. Switch to optimized workflow for faster documentation?
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Override Controls */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600">Workflow:</span>
        <div className="flex gap-2">
          <button
            onClick={() => handleManualOverride('initial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              workflowRoute.type === 'initial'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Initial Evaluation
          </button>
          <button
            onClick={() => handleManualOverride('follow-up')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              workflowRoute.type === 'follow-up'
                ? 'bg-green-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Follow-up Visit
          </button>
        </div>
        
        {manualSelection && (
          <button
            onClick={handleResetDetection}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="w-3 h-3" />
            Reset to auto-detect
          </button>
        )}
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="mt-3 text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        {showDetails ? 'Hide' : 'Show'} detection details
      </button>

      {/* Detection Details */}
      {showDetails && detectionResult && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Detection Rationale:</p>
          <ul className="space-y-1">
            {detectionResult.rationale.map((reason, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          {detectionResult.lastVisitDate && (
            <p className="text-xs text-gray-600 mt-2">
              Last visit: {detectionResult.lastVisitDate.toLocaleDateString()} 
              {detectionResult.daysSinceLastVisit !== undefined && 
                ` (${detectionResult.daysSinceLastVisit} days ago)`
              }
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowSelector;


