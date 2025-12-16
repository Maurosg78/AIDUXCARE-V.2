import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getCountFromServer, Timestamp, getDocs } from 'firebase/firestore';

import { AsyncState } from './useUserProfile';

import logger from '@/shared/utils/logger';

export function useTodayAppointmentsCount(uid?: string): AsyncState<number> {
  const [state, setState] = useState<AsyncState<number>>({
    loading: true
  });

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      try {
        // Calcular rangos de fecha para "hoy" en zona horaria local
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        // Convertir a Timestamps de Firestore
        const startTimestamp = Timestamp.fromDate(startOfToday);
        const endTimestamp = Timestamp.fromDate(startOfTomorrow);

        // Query para citas de hoy del fisioterapeuta
        const appointmentsRef = collection(db, 'appointments');
        const todayAppointmentsQuery = query(
          appointmentsRef,
          where('clinicianUid', '==', uid || user.uid),
          where('date', '>=', startTimestamp),
          where('date', '<', endTimestamp),
          where('status', 'in', ['scheduled', 'confirmed', 'in_progress'])
        );

        // Intentar usar getCountFromServer para mejor rendimiento
        try {
          const snapshot = await getCountFromServer(todayAppointmentsQuery);
          setState({ loading: false, data: snapshot.data().count });
        } catch (countError: unknown) {
          // Handler robusto para errores de índice compuesto
          const error = countError as { code?: string; message?: string };
          if (error?.code === 'failed-precondition' || 
              error?.message?.includes('requires an index')) {
            
            console.warn('Falta índice compuesto appointments(clinicianUid,status,date) - deployar firestore.indexes.json');
            setState({ 
              loading: false, 
              error: new Error('Índice de base de datos no disponible') 
            });
            return;
          }
          
          // Fallback: si getCountFromServer no está disponible, usar getDocs
          console.warn('getCountFromServer no disponible, usando getDocs:', countError);
          
          const docsSnapshot = await getDocs(todayAppointmentsQuery);
          setState({ loading: false, data: docsSnapshot.size });
        }
      } catch (error) {
        console.error('Error contando citas de hoy:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error contando citas') 
        });
      }
    });

    return unsubscribe;
  }, [uid]);

  return state;
}
