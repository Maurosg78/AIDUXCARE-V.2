import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { encountersRepo, Encounter } from '../../../repositories/encountersRepo';
import { AsyncState } from '../../command-center/hooks/useUserProfile';

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
          // No hay encuentros previos, no es un error
          setState({ loading: false, data: undefined });
          return;
        }

        setState({ loading: false, data: encounter });
      } catch (error) {
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
