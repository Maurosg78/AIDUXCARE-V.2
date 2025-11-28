import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { AsyncState } from './useUserProfile';
import sessionService from '@/services/sessionService';

import logger from '@/shared/utils/logger';

/**
 * Hook to check if a patient has previous session history
 * Uses SessionService.isFirstSession() - returns true if patient has history (not first session)
 * 
 * Based on DATA_FLOW.md: SessionService.getSessionsByPatient(patientId) pattern
 */
export function usePatientHistory(patientId: string | null): AsyncState<boolean> {
  const [state, setState] = useState<AsyncState<boolean>>({
    loading: true
  });

  useEffect(() => {
    if (!patientId) {
      setState({ loading: false, data: false });
      return;
    }

    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('User not authenticated') });
        return;
      }

      try {
        // Use SessionService.isFirstSession - if NOT first session, patient has history
        const isFirst = await sessionService.isFirstSession(patientId, user.uid);
        const hasHistory = !isFirst; // Invert: if NOT first, then has history
        
        setState({ loading: false, data: hasHistory });
      } catch (error) {
        logger.error('Error checking patient history:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error checking patient history'),
          data: false // Default to false on error
        });
      }
    });

    return unsubscribe;
  }, [patientId]);

  return state;
}

