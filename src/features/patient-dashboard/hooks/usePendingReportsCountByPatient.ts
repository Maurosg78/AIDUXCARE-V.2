// @ts-nocheck
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';

import { AsyncState } from '../../command-center/hooks/useUserProfile';

import logger from '@/shared/utils/logger';

export function usePendingReportsCountByPatient(patientId: string): AsyncState<number> {
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
        // Query para notas pendientes del paciente específico
        const reportsRef = collection(db, 'reports');
        const pendingReportsQuery = query(
          reportsRef,
          where('patientId', '==', patientId),
          where('authorUid', '==', user.uid),
          where('status', 'in', ['draft', 'returned'])
        );

        // Intentar usar getCountFromServer para mejor rendimiento
        try {
          const snapshot = await getCountFromServer(pendingReportsQuery);
          setState({ loading: false, data: snapshot.data().count });
        } catch (countError) {
          // Fallback: si getCountFromServer no está disponible, usar getDocs
          console.warn('getCountFromServer no disponible, usando getDocs:', countError);
          
          const docsSnapshot = await getDocs(pendingReportsQuery);
          setState({ loading: false, data: docsSnapshot.size });
        }
      } catch (error) {
        console.error('Error contando notas pendientes del paciente:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error contando notas') 
        });
      }
    });

    return unsubscribe;
  }, [patientId]);

  return state;
}