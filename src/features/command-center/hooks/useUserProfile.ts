import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import logger from '@/shared/utils/logger';

export type AsyncState<T> = { 
  data?: T; 
  loading: boolean; 
  error?: Error 
};

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: string;
  lastLoginAt?: Date;
}

export function useUserProfile(): AsyncState<UserProfile> {
  const [state, setState] = useState<AsyncState<UserProfile>>({
    loading: true
  });

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setState({ loading: false, error: new Error('Usuario no autenticado') });
        return;
      }

      try {
        // Datos básicos de Auth
        const basicProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || undefined,
          lastLoginAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : undefined
        };

        // Intentar obtener datos adicionales de Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setState({
              loading: false,
              data: {
                ...basicProfile,
                displayName: userData.displayName || basicProfile.displayName,
                role: userData.role || undefined
              }
            });
          } else {
            // Solo datos de Auth si no hay doc en Firestore
            setState({ loading: false, data: basicProfile });
          }
        } catch (firestoreError) {
          // Si falla Firestore, usar solo datos de Auth
          console.warn('Error obteniendo datos de Firestore, usando solo Auth:', firestoreError);
          setState({ loading: false, data: basicProfile });
        }
      } catch (error) {
        setState({ 
          loading: false, 
          error: error instanceof Error ? error : new Error('Error desconocido') 
        });
      }
    });

    return unsubscribe;
  }, []);

  return state;
}
