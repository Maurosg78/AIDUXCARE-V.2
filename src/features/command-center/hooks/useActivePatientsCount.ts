import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';

import { AsyncState } from './useUserProfile';

import logger from '@/shared/utils/logger';

export function useActivePatientsCount(): AsyncState<number> {
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
        // Query para pacientes activos del usuario autenticado
        const patientsRef = collection(db, 'patients');
        const activePatientsQuery = query(
          patientsRef,
          where('ownerUid', '==', user.uid),
          where('status', '==', 'active')
        );

        // Intentar usar getCountFromServer para mejor rendimiento
        try {
          const snapshot = await getCountFromServer(activePatientsQuery);
          setState({ loading: false, data: snapshot.data().count });
        } catch (countError) {
          // Fallback: si getCountFromServer no está disponible, usar getDocs
          console.warn('getCountFromServer no disponible, usando getDocs:', countError);
          
          // Para MVP: solo verificar si hay documentos (limit 1)
          // En producción se implementaría conteo completo
          const docsSnapshot = await getDocs(activePatientsQuery);
          setState({ loading: false, data: docsSnapshot.size });
        }
      } catch (error) {
        console.error('Error contando pacientes activos:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error contando pacientes') 
        });
      }
    });

    return unsubscribe;
  }, []);

  return state;
}
