import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { AsyncState } from './useUserProfile';
import sessionService from '@/services/sessionService';
import { PersistenceService } from '@/services/PersistenceService';

import logger from '@/shared/utils/logger';

/**
 * Hook to check if a patient has previous session/visit history.
 * Checks BOTH sessions collection AND notes (consultations) — patient has history if either has data.
 * Use to disable "Ongoing (first time in AiDuxCare)" when patient already has baseline/visits.
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
        const [isFirstSession, notes] = await Promise.all([
          sessionService.isFirstSession(patientId, user.uid),
          PersistenceService.getNotesByPatient(patientId),
        ]);
        const hasSessions = !isFirstSession;
        const hasNotes = notes && notes.length > 0;
        const hasHistory = hasSessions || hasNotes;

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

