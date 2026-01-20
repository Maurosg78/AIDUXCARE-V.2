import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { encountersRepo, Encounter } from '../../../repositories/encountersRepo';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

import logger from '@/shared/utils/logger';

/**
 * Hook to get the count of completed visits for a patient
 * Counts only encounters with status 'completed' or 'signed'
 */
export function usePatientVisitCount(patientId: string): AsyncState<number> {
  const [state, setState] = useState<AsyncState<number>>({
    loading: true
  });

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      if (!patientId) {
        setState({ loading: false, data: 0 });
        return;
      }

      try {
        // Get all completed encounters for the patient
        const encounters = await encountersRepo.getEncountersByPatient(patientId, 100); // Get up to 100 encounters
        
        // Filter only completed or signed encounters
        const completedEncounters = encounters.filter(
          enc => enc.status === 'completed' || enc.status === 'signed'
        );
        
        setState({ loading: false, data: completedEncounters.length });
      } catch (error: any) {
        // WO-FS-DATA-03: Handle permission-denied as "no data yet" for historical queries
        const isPermissionDenied = error?.code === 'permission-denied' || 
                                   error?.message?.includes('permission-denied') ||
                                   error?.message?.includes('Missing or insufficient permissions');
        
        if (isPermissionDenied) {
          // Permission denied in empty state = no data yet, return 0
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (visit count, permission-denied)');
          }
          setState({ loading: false, data: 0 });
          return;
        }
        
        // If index is building, return 0 instead of error
        if (error?.code === 'failed-precondition' && error?.message?.includes('index is currently building')) {
          console.warn('Índice de encounters en construcción, retornando 0 temporalmente');
          setState({ loading: false, data: 0 });
          return;
        }
        console.error('Error obteniendo conteo de visitas:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error desconocido') 
        });
      }
    });

    return unsubscribe;
  }, [patientId]);

  return state;
}



