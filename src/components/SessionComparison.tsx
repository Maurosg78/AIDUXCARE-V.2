/**
 * Session Comparison Component
 * 
 * React component that displays comparison between current and previous patient sessions.
 * Shows metrics, deltas, progress indicators, and regression alerts.
 * 
 * Sprint 1 - Day 2: UI Component
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SessionComparisonService } from '../services/sessionComparisonService';
import type { ComparisonDisplayData, SessionComparison, Session } from '../services/sessionComparisonService';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import sessionService from '../services/sessionService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface SessionComparisonProps {
  patientId: string;
  currentSessionId?: string;
  currentSession?: Session | null; // Optional: current session data
  isLoading?: boolean;
  onComparisonLoad?: (comparison: SessionComparison) => void;
  className?: string;
}

interface SessionComparisonState {
  comparison: ComparisonDisplayData | null;
  isLoading: boolean;
  error: string | null;
  isFirstSession: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SessionComparison: React.FC<SessionComparisonProps> = ({
  patientId,
  currentSessionId,
  currentSession: propCurrentSession,
  isLoading: externalLoading = false,
  onComparisonLoad,
  className = '',
}) => {
  const [state, setState] = useState<SessionComparisonState>({
    comparison: null,
    isLoading: true,
    error: null,
    isFirstSession: false,
  });

  const service = new SessionComparisonService();

  // Fetch comparison data
  const fetchComparison = useCallback(async () => {
    if (!patientId) {
      setState({
        comparison: null,
        isLoading: false,
        error: 'Patient ID is required',
        isFirstSession: false,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get previous session
      const previousSession = await service.getPreviousSession(
        patientId,
        currentSessionId || '',
        undefined // userId - will be filtered by patientId only
      );

      if (!previousSession) {
        // First session - no comparison available
        const firstSessionData = service.formatComparisonForUI(null, true);
        setState({
          comparison: firstSessionData,
          isLoading: false,
          error: null,
          isFirstSession: true,
        });
        return;
      }

      // Get current session
      let currentSession: Session | null = null;

      if (propCurrentSession) {
        // Use provided current session
        currentSession = propCurrentSession;
      } else if (currentSessionId) {
        // Try to fetch current session from sessionService
        // Note: sessionService doesn't have getSessionById, so we'll need to handle this
        // For now, we'll use a workaround or wait for Day 3 integration
        // In Day 3, currentSession will be passed as prop from ProfessionalWorkflowPage
        setState({
          comparison: null,
          isLoading: false,
          error: 'Current session data required. Please provide currentSession prop or wait for Day 3 integration.',
          isFirstSession: false,
        });
        return;
      } else {
        setState({
          comparison: null,
          isLoading: false,
          error: 'Current session ID or session data is required for comparison.',
          isFirstSession: false,
        });
        return;
      }

      // Compare sessions
      const comparison = service.compareSessions(previousSession, currentSession);
      const uiData = service.formatComparisonForUI(comparison, false);

      // Call callback if provided
      if (onComparisonLoad) {
        onComparisonLoad(comparison);
      }

      setState({
        comparison: uiData,
        isLoading: false,
        error: null,
        isFirstSession: false,
      });

    } catch (error) {
      console.error('[SessionComparison] Error fetching comparison:', error);
      setState({
        comparison: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load session comparison',
        isFirstSession: false,
      });
    }
  }, [patientId, currentSessionId, service]);

  // Load comparison on mount and when dependencies change
  useEffect(() => {
    if (!externalLoading) {
      fetchComparison();
    }
  }, [fetchComparison, externalLoading]);

  // Loading state
  if (externalLoading || state.isLoading) {
    return (
      <div className={`session-comparison ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LoadingSpinner size="md" text="Loading session comparison..." />
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={`session-comparison ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ErrorMessage 
            message={state.error}
            onRetry={fetchComparison}
          />
        </div>
      </div>
    );
  }

  // First session state
  if (state.isFirstSession || (state.comparison && state.comparison.isFirstSession)) {
    return (
      <div className={`session-comparison ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">First Session</h3>
            <p className="text-sm text-gray-600">
              No comparison available. This is the patient's first session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No comparison data
  if (!state.comparison) {
    return (
      <div className={`session-comparison ${className}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">No comparison data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Render comparison with visual metrics
  const comparison = state.comparison;
  
  return (
    <div className={`session-comparison ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Session Comparison</h3>
          {comparison.daysBetween !== null && (
            <span className="text-sm text-gray-500">
              {comparison.daysBetween} day{comparison.daysBetween !== 1 ? 's' : ''} between sessions
            </span>
          )}
        </div>

        {/* Session Dates */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Previous Session</p>
            <p className="text-sm font-medium text-gray-900">
              {comparison.previousSessionDate || 'N/A'}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Current Session</p>
            <p className="text-sm font-medium text-gray-900">
              {comparison.currentSessionDate}
            </p>
          </div>
        </div>

        {/* Pain Level Comparison */}
        {comparison.metrics.painLevel.previous !== null && comparison.metrics.painLevel.current !== null && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Pain Level</h4>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {comparison.metrics.painLevel.previous}
                </p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
              <div className="text-center">
                {comparison.metrics.painLevel.trend === 'improved' && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl text-green-600">↓</span>
                    <span className="text-xs text-green-600 font-medium">Improved</span>
                  </div>
                )}
                {comparison.metrics.painLevel.trend === 'worsened' && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl text-red-600">↑</span>
                    <span className="text-xs text-red-600 font-medium">Worsened</span>
                  </div>
                )}
                {comparison.metrics.painLevel.trend === 'stable' && (
                  <div className="flex flex-col items-center">
                    <span className="text-2xl text-gray-400">→</span>
                    <span className="text-xs text-gray-500 font-medium">Stable</span>
                  </div>
                )}
                {comparison.metrics.painLevel.delta !== null && (
                  <span className="text-xs text-gray-500 mt-1">
                    {comparison.metrics.painLevel.delta > 0 ? '+' : ''}
                    {comparison.metrics.painLevel.delta.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {comparison.metrics.painLevel.current}
                </p>
                <p className="text-xs text-gray-500">/10</p>
              </div>
            </div>
          </div>
        )}

        {/* Range of Motion Comparison */}
        {comparison.metrics.rangeOfMotion.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Range of Motion</h4>
            <div className="space-y-3">
              {comparison.metrics.rangeOfMotion.map((rom, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 capitalize">
                    {rom.region}
                  </div>
                  <div className="text-center">
                    {rom.trend === 'improved' && (
                      <span className="text-lg text-green-600">↑</span>
                    )}
                    {rom.trend === 'worsened' && (
                      <span className="text-lg text-red-600">↓</span>
                    )}
                    {rom.trend === 'stable' && (
                      <span className="text-lg text-gray-400">→</span>
                    )}
                    {rom.delta !== null && (
                      <span className="text-xs text-gray-500 ml-2">
                        {rom.delta > 0 ? '+' : ''}{rom.delta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-700">
                      {rom.previous !== null ? `${rom.previous}%` : 'N/A'} → {rom.current !== null ? `${rom.current}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Functional Tests Comparison */}
        {comparison.metrics.functionalTests.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Functional Tests</h4>
            <div className="space-y-2">
              {comparison.metrics.functionalTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{test.testName}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.previous === 'normal' || test.previous === 'negative' 
                        ? 'bg-green-100 text-green-700' 
                        : test.previous === 'positive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {test.previous || 'N/A'}
                    </span>
                    {test.changed && (
                      <span className="text-xs text-blue-600">→</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      test.current === 'normal' || test.current === 'negative' 
                        ? 'bg-green-100 text-green-700' 
                        : test.current === 'positive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {test.current || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overall Progress Summary */}
        <div className={`p-4 rounded-lg mb-4 ${
          comparison.overallProgress === 'improved' 
            ? 'bg-green-50 border border-green-200' 
            : comparison.overallProgress === 'regressed'
            ? 'bg-red-50 border border-red-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Overall Progress</h4>
              <p className={`text-sm font-medium ${
                comparison.overallProgress === 'improved' 
                  ? 'text-green-700' 
                  : comparison.overallProgress === 'regressed'
                  ? 'text-red-700'
                  : 'text-gray-700'
              }`}>
                {comparison.overallProgress === 'improved' && '✅ Improved'}
                {comparison.overallProgress === 'regressed' && '⚠️ Regressed'}
                {comparison.overallProgress === 'stable' && '→ Stable'}
                {comparison.overallProgress === 'no_data' && 'No Data'}
              </p>
            </div>
            {comparison.overallProgress === 'improved' && (
              <span className="text-2xl text-green-600">↑</span>
            )}
            {comparison.overallProgress === 'regressed' && (
              <span className="text-2xl text-red-600">↓</span>
            )}
            {comparison.overallProgress === 'stable' && (
              <span className="text-2xl text-gray-400">→</span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">{comparison.summary}</p>
        </div>

        {/* Regression Alerts */}
        {comparison.alerts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              Regression Alerts ({comparison.alerts.length})
            </h4>
            <div className="space-y-2">
              {comparison.alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'severe' 
                      ? 'bg-red-50 border-red-300' 
                      : alert.severity === 'moderate'
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-yellow-50 border-yellow-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {alert.metric}
                      </p>
                      <p className="text-xs text-gray-700">{alert.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ml-2 ${
                      alert.severity === 'severe' 
                        ? 'bg-red-200 text-red-800' 
                        : alert.severity === 'moderate'
                        ? 'bg-orange-200 text-orange-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionComparison;

