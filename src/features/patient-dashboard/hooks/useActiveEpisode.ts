import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { episodesRepo, Episode } from '../../../repositories/episodesRepo';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

import logger from '@/shared/utils/logger';

export function useActiveEpisode(patientId: string): AsyncState<Episode> {
  const [state, setState] = useState<AsyncState<Episode>>({
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
        const episode = await episodesRepo.getActiveEpisodeByPatient(patientId);
        
        if (!episode) {
          // WO-FS-DATA-03: No hay episodio activo, no es un error - initial state
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (episodes)');
          }
          setState({ loading: false, data: undefined });
          return;
        }

        // Verificar que el episodio pertenece al usuario autenticado
        if (episode.ownerUid !== user.uid) {
          setState({ loading: false, error: new Error('Acceso no autorizado') });
          return;
        }

        setState({ loading: false, data: episode });
      } catch (error: any) {
        // WO-FS-DATA-03: Handle permission-denied as "no data yet" for historical queries
        const isPermissionDenied = error?.code === 'permission-denied' || 
                                   error?.message?.includes('permission-denied') ||
                                   error?.message?.includes('Missing or insufficient permissions');
        
        if (isPermissionDenied) {
          // Permission denied in empty state = no data yet, not a fatal error
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (episodes, permission-denied)');
          }
          setState({ loading: false, data: undefined });
          return;
        }
        
        console.error('Error obteniendo episodio activo:', error);
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
