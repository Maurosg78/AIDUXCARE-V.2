/**
 * useVerbalConsent Hook
 * 
 * React hook for managing verbal consent verification and obtaining
 * ISO 27001 Compliant - All operations are logged
 */

import { useState, useEffect, useCallback } from 'react';
import VerbalConsentService, { ConsentVerificationResult } from '../services/verbalConsentService';

export interface UseVerbalConsentResult {
  hasConsent: boolean;
  isLoading: boolean;
  status: ConsentVerificationResult | null;
  error: string | null;
  refresh: () => Promise<void>;
  checkConsent: () => Promise<boolean>;
}

export function useVerbalConsent(
  patientId: string | null | undefined,
  physiotherapistId?: string
): UseVerbalConsentResult {
  const [hasConsent, setHasConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ConsentVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkConsent = useCallback(async (): Promise<boolean> => {
    if (!patientId) {
      setHasConsent(false);
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await VerbalConsentService.verifyConsent(patientId, physiotherapistId);
      setStatus(result);
      const consentValid = result.hasConsent && result.status === 'active';
      setHasConsent(consentValid);
      return consentValid;
    } catch (err) {
      console.error('[useVerbalConsent] Error checking consent:', err);
      setError(err instanceof Error ? err.message : 'Error verificando consentimiento');
      setHasConsent(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [patientId, physiotherapistId]);

  const refresh = useCallback(async () => {
    await checkConsent();
  }, [checkConsent]);

  useEffect(() => {
    checkConsent();
  }, [checkConsent]);

  return {
    hasConsent,
    isLoading,
    status,
    error,
    refresh,
    checkConsent,
  };
}

export default useVerbalConsent;

