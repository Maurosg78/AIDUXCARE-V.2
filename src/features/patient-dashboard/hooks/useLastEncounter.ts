import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { encountersRepo, Encounter } from '../../../repositories/encountersRepo';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

import logger from '@/shared/utils/logger';

export function useLastEncounter(patientId: string): AsyncState<Encounter> {
  const [state, setState] = useState<AsyncState<Encounter>>({
    loading: true
  });

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      try {
        const encounter = await encountersRepo.getLastEncounterByPatient(patientId);
        
        if (!encounter) {
          // WO-FS-DATA-03: No hay encuentros previos, no es un error - initial state
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (encounters)');
          }
          setState({ loading: false, data: undefined });
          return;
        }

        setState({ loading: false, data: encounter });
      } catch (error: any) {
        // WO-FS-DATA-03: Handle permission-denied as "no data yet" for historical queries
        const isPermissionDenied = error?.code === 'permission-denied' || 
                                   error?.message?.includes('permission-denied') ||
                                   error?.message?.includes('Missing or insufficient permissions');
        
        if (isPermissionDenied) {
          // Permission denied in empty state = no data yet, not a fatal error
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (encounters, permission-denied)');
          }
          setState({ loading: false, data: undefined });
          return;
        }
        
        console.error('Error obteniendo último encuentro:', error);
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
