/**
 * WO-METRICS-01: Workflow metrics hook
 * Fires events to metricsIngest. ActiveTimeTracker lives in ref (no re-renders).
 */

import { useRef, useEffect, useCallback } from 'react';
import { ActiveTimeTracker } from '@/services/metrics/ActiveTimeTracker';
import { track } from '@/services/metrics/metricsClient';

const IDLE_THRESHOLD_MS = 180_000;

export interface UseWorkflowMetricsParams {
  workflowSessionId: string;
  visitType: 'initial' | 'follow-up' | 'discharge';
  isActive: boolean;
  activeTab: 'analysis' | 'evaluation' | 'soap';
}

export function useWorkflowMetrics({
  workflowSessionId,
  visitType,
  isActive,
  activeTab,
}: UseWorkflowMetricsParams) {
  const trackerRef = useRef<ActiveTimeTracker | null>(null);
  const startedRef = useRef(false);
  const lastTabRef = useRef<string | null>(null);

  const getTracker = useCallback(() => {
    if (!trackerRef.current) {
      trackerRef.current = new ActiveTimeTracker();
    }
    return trackerRef.current;
  }, []);

  const recordActivity = useCallback(() => {
    if (isActive && trackerRef.current) {
      trackerRef.current.recordActivity();
    }
  }, [isActive]);

  // workflow_session_started — once per workflowSessionId per browser session
  useEffect(() => {
    if (!isActive || !workflowSessionId) return;
    const startedKey = `aidux_metrics_workflow_started_${workflowSessionId}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(startedKey)) return;
    startedRef.current = true;
    try {
      sessionStorage?.setItem(startedKey, '1');
    } catch {
      /* ignore */
    }

    const tracker = getTracker();
    tracker.start();

    track({
      eventName: 'metrics_workflow_started',
      workflowSessionId,
      visitType,
      jurisdiction: 'CA-ON',
      metrics: { schemaVersion: 1 },
    });

    tracker.startHeartbeat((activeSinceLastBeatMs) => {
      track({
        eventName: 'metrics_workflow_heartbeat',
        workflowSessionId,
        visitType,
        metrics: { activeSinceLastBeatMs, schemaVersion: 1 },
      });
    });

    return () => {
      tracker.reset();
      startedRef.current = false;
    };
  }, [isActive, workflowSessionId, visitType, getTracker]);

  // workflow_tab_viewed — only when tab actually changes
  useEffect(() => {
    if (!isActive || !workflowSessionId) return;
    if (lastTabRef.current === activeTab) return;
    lastTabRef.current = activeTab;

    track({
      eventName: 'metrics_workflow_tab_viewed',
      workflowSessionId,
      visitType,
      context: { tab: activeTab },
      metrics: { tab: activeTab, schemaVersion: 1 },
    });
  }, [isActive, workflowSessionId, visitType, activeTab]);

  const fireSoapGenerateClicked = useCallback(() => {
    if (!workflowSessionId) return;
    getTracker().recordActivity();
    track({
      eventName: 'metrics_soap_generate_clicked',
      workflowSessionId,
      visitType,
      metrics: { schemaVersion: 1 },
    });
  }, [workflowSessionId, visitType, getTracker]);

  const fireSoapGeneratedSuccess = useCallback(
    (latencyMs: number) => {
      if (!workflowSessionId) return;
      track({
        eventName: 'metrics_soap_generated_success',
        workflowSessionId,
        visitType,
        metrics: { latencyMs, schemaVersion: 1 },
      });
    },
    [workflowSessionId, visitType]
  );

  const fireWorkflowSessionCompleted = useCallback(() => {
    if (!workflowSessionId || !trackerRef.current) return;
    const tracker = trackerRef.current;
    tracker.stopHeartbeat();
    const activeMs = tracker.getActiveMs();
    const idleMs = tracker.getIdleMs();
    const totalDurationMs = tracker.getTotalDurationMs();

    track({
      eventName: 'metrics_workflow_completed',
      workflowSessionId,
      visitType,
      metrics: {
        activeMs,
        idleMs,
        totalDurationMs,
        schemaVersion: 1,
      },
    });
    tracker.reset();
  }, [workflowSessionId, visitType]);

  return {
    recordActivity,
    fireSoapGenerateClicked,
    fireSoapGeneratedSuccess,
    fireWorkflowSessionCompleted,
    getTracker,
  };
}
