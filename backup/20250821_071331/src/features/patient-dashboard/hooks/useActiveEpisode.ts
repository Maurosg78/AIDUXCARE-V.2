import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { episodesRepo, Episode } from '../../../repositories/episodesRepo';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

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
          // No hay episodio activo, no es un error
          setState({ loading: false, data: undefined });
          return;
        }

        // Verificar que el episodio pertenece al usuario autenticado
        if (episode.ownerUid !== user.uid) {
          setState({ loading: false, error: new Error('Acceso no autorizado') });
          return;
        }

        setState({ loading: false, data: episode });
      } catch (error) {
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
