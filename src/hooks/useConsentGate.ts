/**
 * Enterprise consent gate: single source of truth for workflow.
 * Use in any page that needs to gate clinical UI by patient consent.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { checkConsentViaServer } from '@/services/consentServerService';
import { resolveConsentChannel } from '@/domain/consent/resolveConsentChannel';
import { getCurrentJurisdiction } from '@/core/consent/consentJurisdiction';
import type { ConsentResolution } from '@/domain/consent/resolveConsentChannel';
import type { ConsentCheckResult } from '@/services/consentServerService';
import { consentLogger } from '@/domain/consent/consentLogger';

export type ConsentGateStatus = 'loading' | 'granted' | 'required' | 'declined' | 'error';

export interface UseConsentGateOptions {
  patientId: string | null | undefined;
  isFirstSession?: boolean;
  /** Poll interval in ms when gate is shown (0 = no polling) */
  pollIntervalMs?: number;
}

export interface UseConsentGateResult {
  status: ConsentGateStatus;
  consentResolution: ConsentResolution | null;
  workflowConsentStatus: {
    hasValidConsent: boolean;
    isDeclined?: boolean;
    status: string | null;
    consentMethod: string | null;
    declineReasons?: string[];
  } | null;
  showGate: boolean;
  showDeclined: boolean;
  handleConsentGranted: () => Promise<void>;
  refetch: () => Promise<void>;
  error: Error | null;
}

export function useConsentGate(options: UseConsentGateOptions): UseConsentGateResult {
  const { patientId, isFirstSession = true, pollIntervalMs = 5000 } = options;
  const [status, setStatus] = useState<ConsentGateStatus>('loading');
  const [workflowConsentStatus, setWorkflowConsentStatus] = useState<UseConsentGateResult['workflowConsentStatus']>(null);
  const [consentResolution, setConsentResolution] = useState<ConsentResolution | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const consentGrantedRef = useRef(false);

  const resolve = useCallback((result: ConsentCheckResult) => {
    const resolution = resolveConsentChannel({
      hasValidConsent: result.hasValidConsent,
      isDeclined: result.isDeclined,
      jurisdiction: getCurrentJurisdiction(),
      isFirstSession,
    });
    setConsentResolution(resolution);
    setWorkflowConsentStatus({
      hasValidConsent: result.hasValidConsent,
      isDeclined: result.isDeclined,
      status: result.status,
      consentMethod: result.consentMethod,
      declineReasons: result.declineReasons,
    });
    if (result.isDeclined) setStatus('declined');
    else if (result.hasValidConsent) setStatus('granted');
    else setStatus('required');
  }, [isFirstSession]);

  const fetchConsent = useCallback(async () => {
    if (!patientId) {
      setStatus('required');
      setConsentResolution(null);
      setWorkflowConsentStatus(null);
      return;
    }
    try {
      setError(null);
      const result = await checkConsentViaServer(patientId);
      resolve(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setStatus('error');
      consentLogger.error('fetch_consent_failed', { message: e.message });
    }
  }, [patientId, resolve]);

  const handleConsentGranted = useCallback(async () => {
    if (!patientId) return;
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = await checkConsentViaServer(patientId);
      if (result.hasValidConsent) {
        consentGrantedRef.current = true;
        resolve(result);
        consentLogger.info('gate_unmounted_after_verbal', {});
      }
    } catch (err) {
      consentLogger.error('consent_granted_refetch_failed', { message: err instanceof Error ? err.message : String(err) });
    }
  }, [patientId, resolve]);

  useEffect(() => {
    if (!patientId) {
      setStatus('required');
      setConsentResolution(null);
      return;
    }
    setStatus('loading');
    fetchConsent();
  }, [patientId, fetchConsent]);

  useEffect(() => {
    if (!patientId || status !== 'required' || pollIntervalMs <= 0) return;
    const t = setInterval(fetchConsent, pollIntervalMs);
    return () => clearInterval(t);
  }, [patientId, status, pollIntervalMs, fetchConsent]);

  const needsConsent = consentResolution != null && consentResolution.channel !== 'none' && consentResolution.channel !== 'blocked';
  const showGate = needsConsent && status === 'required';
  const showDeclined = status === 'declined';

  return {
    status,
    consentResolution,
    workflowConsentStatus,
    showGate,
    showDeclined,
    handleConsentGranted,
    refetch: fetchConsent,
    error,
  };
}
