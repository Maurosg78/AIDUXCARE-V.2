// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

import { useAuth } from './AuthContext';

import logger from '@/shared/utils/logger';

export interface ProfessionalProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  role?: 'physio' | 'admin' | 'assistant';
  specialty?: string;
  professionalTitle?: string;
  university?: string;
  licenseNumber?: string;
  workplace?: string;
  experienceYears?: string;
  clinic?: { 
    name?: string; 
    city?: string; 
    country?: string 
  };
  timezone?: string;
  languages?: string[];
  phone?: string;
  country?: string;
  province?: string;
  city?: string;
  consentGranted?: boolean;
  preferredSalutation?: string; // p.ej. "FT."
  lastNamePreferred?: string;   // p.ej. "Sobarzo"
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastSeenAt?: Timestamp;
  preferences?: { 
    theme: 'inside' | 'outside'; 
    density: 'comfortable' | 'compact' 
  };
  registrationStatus?: 'incomplete' | 'complete';
}

interface ProfessionalProfileContextType {
  profile?: ProfessionalProfile;
  loading: boolean;
  error?: Error;
  updateProfile: (updates: Partial<ProfessionalProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateWizardData: (field: keyof ProfessionalProfile, value: unknown) => Promise<void>;
  setCurrentStep: (step: number) => void;
}

const ProfessionalProfileContext = createContext<ProfessionalProfileContextType | undefined>(undefined);

export const useProfessionalProfile = () => {
  const context = useContext(ProfessionalProfileContext);
  if (context === undefined) {
    throw new Error('useProfessionalProfile must be used within a ProfessionalProfileProvider');
  }
  return context;
};

interface ProfessionalProfileProviderProps {
  children: React.ReactNode;
}

export const ProfessionalProfileProvider: React.FC<ProfessionalProfileProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const [/* currentStep */, setCurrentStepState] = useState<number>(0);
  const db = getFirestore();

  // Función para obtener zona horaria por defecto
  const getDefaultTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  // Función para crear perfil inicial
  const createInitialProfile = async (uid: string, email: string): Promise<ProfessionalProfile> => {
    const initialProfile: ProfessionalProfile = {
      uid,
      email,
      displayName: user?.displayName || undefined,
      role: 'physio',
      timezone: getDefaultTimezone(),
      languages: ['es'],
      preferredSalutation: 'FT.',
      lastNamePreferred: user?.displayName?.split(' ').slice(-1)[0] ?? undefined,
      createdAt: serverTimestamp() as Timestamp,
      lastLoginAt: serverTimestamp() as Timestamp,
      lastSeenAt: serverTimestamp() as Timestamp,
      preferences: {
        theme: 'inside',
        density: 'comfortable'
      }
    };

    await setDoc(doc(db, 'users', uid), initialProfile);
    return initialProfile;
  };

  // Función para cargar perfil desde Firestore
  const loadProfile = async (uid: string): Promise<void> => {
    try {
      setLoading(true);
      setError(undefined);

      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as ProfessionalProfile;
        setProfile(userData);
        
        // Actualizar lastLoginAt
        await updateDoc(doc(db, 'users', uid), {
          lastLoginAt: serverTimestamp()
        });
      } else {
        // Crear perfil inicial
        const initialProfile = await createInitialProfile(uid, user?.email || '');
        setProfile(initialProfile);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido al cargar perfil');
      setError(error);
      logger.error('Error cargando perfil profesional:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (updates: Partial<ProfessionalProfile>): Promise<void> => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        lastSeenAt: serverTimestamp()
      });

      // Actualizar estado local
      setProfile(prev => prev ? { ...prev, ...updates } : undefined);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al actualizar perfil');
      setError(error);
      throw error;
    }
  };

  // Soporte para wizard (compatibilidad con componentes existentes)
  const updateWizardData = async (field: keyof ProfessionalProfile, value: unknown): Promise<void> => {
    await updateProfile({ [field]: value } as Partial<ProfessionalProfile>);
  };

  const setCurrentStep = (step: number): void => {
    setCurrentStepState(step);
  };

  // Función para refrescar perfil
  const refreshProfile = async (): Promise<void> => {
    if (user?.uid) {
      await loadProfile(user.uid);
    }
  };

  // Función para heartbeat (actualizar lastSeenAt)
  const updateHeartbeat = async (): Promise<void> => {
    if (!user?.uid || !profile) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        lastSeenAt: serverTimestamp()
      });
    } catch (err) {
      logger.warn('Error en heartbeat:', err);
    }
  };

  // Efecto para cargar perfil cuando cambia el usuario
  useEffect(() => {
    if (user?.uid) {
      loadProfile(user.uid);
    } else {
      setProfile(undefined);
      setLoading(false);
      setError(undefined);
    }
  }, [user?.uid]);

  // Efecto para heartbeat cada 60 segundos
  useEffect(() => {
    if (profile) {
      heartbeatRef.current = setInterval(updateHeartbeat, 60000); // 60 segundos
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [profile]);

  const value: ProfessionalProfileContextType = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    updateWizardData,
    setCurrentStep
  };

  return (
    <ProfessionalProfileContext.Provider value={value}>
      {authLoading ? <>{children}</> : children}
    </ProfessionalProfileContext.Provider>
  );
};