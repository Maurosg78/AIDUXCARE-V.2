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
    let cancelled = false;
    setState({ loading: true });

    const resolveEncounter = async (errorLabel: string) => {
      try {
        const encounter = await encountersRepo.getLastEncounterByPatient(patientId);
        if (cancelled) return;

        if (!encounter) {
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (encounters)');
          }
          setState({ loading: false, data: undefined });
          return;
        }

        setState({ loading: false, data: encounter });
      } catch (error: any) {
        if (cancelled) return;
        const isPermissionDenied = error?.code === 'permission-denied' ||
                                   error?.message?.includes('permission-denied') ||
                                   error?.message?.includes('Missing or insufficient permissions');

        if (isPermissionDenied) {
          if (import.meta.env.DEV) {
            console.info('[FS] No historical data found — initial state (encounters, permission-denied)');
          }
          setState({ loading: false, data: undefined });
          return;
        }

        console.error(`Error obteniendo último encuentro (${errorLabel}):`, error);
        setState({
          loading: false,
          error: error instanceof Error ? error : new Error('Error desconocido'),
        });
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      setState({ loading: true });
      await resolveEncounter('auth');
    });

    /** WO-P0-LAST-ENCOUNTER: Refetch when tab regains focus (SPA may show stale lastEncounter after finalize elsewhere). */
    const onVisibility = () => {
      if (document.visibilityState !== 'visible' || !auth.currentUser) return;
      void resolveEncounter('visibility');
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [patientId]);

  return state;
}
