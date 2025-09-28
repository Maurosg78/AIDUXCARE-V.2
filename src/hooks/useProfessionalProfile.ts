// @ts-nocheck
/**
 * useProfessionalProfile - Hook para leer perfil profesional desde Firestore
 * Proporciona acceso global al perfil del usuario autenticado
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';
import { ProfessionalProfile } from '../context/ProfessionalProfileContext';

import logger from '@/shared/utils/logger';

export interface ProfessionalProfileState {
  profile: ProfessionalProfile | null;
  loading: boolean;
  error: string | null;
}

export const useProfessionalProfile = () => {
  const [state, setState] = useState<ProfessionalProfileState>({
    profile: null,
    loading: true,
    error: null
  });

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Escuchar cambios en autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (!user) {
        setState({
          profile: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Cargar perfil cuando el usuario cambie
  useEffect(() => {
    if (!currentUser) {
      setState({
        profile: null,
        loading: false,
        error: null
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Suscribirse a cambios en el documento del usuario
    const userDoc = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userDoc,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const profile: ProfessionalProfile = {
            uid: userData.uid,
            displayName: userData.displayName || '',
            professionalTitle: userData.professionalTitle || '',
            email: userData.email || '',
            country: userData.country || '',
            province: userData.province || '',
            city: userData.city || '',
            phone: userData.phone || '',
            licenseNumber: userData.licenseNumber || '',
            specialty: userData.specialty || '',
            university: userData.university || '',
            experienceYears: userData.experienceYears || '',
            workplace: userData.workplace || '',
            consentGranted: userData.consentGranted || false,
            createdAt: userData.createdAt,
            // updatedAt no pertenece al perfil visual
            registrationStatus: userData.registrationStatus || 'incomplete'
          };

          setState({
            profile,
            loading: false,
            error: null
          });
        } else {
          setState({
            profile: null,
            loading: false,
            error: 'Perfil no encontrado'
          });
        }
      },
      (error) => {
        console.error('Error loading professional profile:', error);
        setState({
          profile: null,
          loading: false,
          error: 'Error al cargar el perfil'
        });
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Función para refrescar el perfil manualmente
  const refreshProfile = useCallback(async () => {
    if (!currentUser) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const userDoc = doc(db, 'users', currentUser.uid);
      const docSnapshot = await getDoc(userDoc);

      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const profile: ProfessionalProfile = {
          uid: userData.uid,
          displayName: userData.displayName || '',
          professionalTitle: userData.professionalTitle || '',
          email: userData.email || '',
          country: userData.country || '',
          province: userData.province || '',
          city: userData.city || '',
          phone: userData.phone || '',
          licenseNumber: userData.licenseNumber || '',
          specialty: userData.specialty || '',
          university: userData.university || '',
          experienceYears: userData.experienceYears || '',
          workplace: userData.workplace || '',
          consentGranted: userData.consentGranted || false,
          createdAt: userData.createdAt,
          // updatedAt no pertenece al perfil visual
          registrationStatus: userData.registrationStatus || 'incomplete'
        };

        setState({
          profile,
          loading: false,
          error: null
        });
      } else {
        setState({
          profile: null,
          loading: false,
          error: 'Perfil no encontrado'
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setState({
        profile: null,
        loading: false,
        error: 'Error al refrescar el perfil'
      });
    }
  }, [currentUser]);

  return {
    ...state,
    currentUser,
    refreshProfile,
    isAuthenticated: !!currentUser
  };
};