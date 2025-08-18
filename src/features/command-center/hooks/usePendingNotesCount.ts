import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { AsyncState } from './useUserProfile';

export function usePendingNotesCount(uid?: string): AsyncState<number> {
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
        // Query para notas pendientes del autor
        const reportsRef = collection(db, 'reports');
        const pendingNotesQuery = query(
          reportsRef,
          where('authorUid', '==', uid || user.uid),
          where('status', 'in', ['draft', 'returned'])
        );

        // Intentar usar getCountFromServer para mejor rendimiento
        try {
          const snapshot = await getCountFromServer(pendingNotesQuery);
          setState({ loading: false, data: snapshot.data().count });
        } catch (countError) {
          // Fallback: si getCountFromServer no está disponible, usar getDocs
          console.warn('getCountFromServer no disponible, usando getDocs:', countError);
          
          const docsSnapshot = await getDocs(pendingNotesQuery);
          setState({ loading: false, data: docsSnapshot.size });
        }
      } catch (error) {
        console.error('Error contando notas pendientes:', error);
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error contando notas') 
        });
      }
    });

    return unsubscribe;
  }, [uid]);

  return state;
}
