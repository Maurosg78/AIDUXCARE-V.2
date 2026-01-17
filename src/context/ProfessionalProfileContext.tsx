import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

import { useAuth } from './AuthContext';

import logger from '@/shared/utils/logger';
import { db as sharedDb } from "@/lib/firebase";

export interface ProfessionalProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  role?: 'physio' | 'admin' | 'assistant';
  specialty?: string;
  professionalTitle?: string;

  // ✅ compat fields referenced in logs/guard
  profession?: string;
  practiceCountry?: string;
  pilotConsent?: { accepted?: boolean };

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
  practicePreferences?: {
    noteVerbosity: 'concise' | 'standard' | 'detailed';
    tone: 'formal' | 'friendly' | 'educational';
    preferredTreatments: string[];
    doNotSuggest: string[];
  };
  dataUseConsent?: {
    personalizationFromClinicianInputs: boolean;
    personalizationFromPatientData: boolean;
    useDeidentifiedDataForProductImprovement: boolean;
    allowAssistantMemoryAcrossSessions: boolean;
    phipaConsent: boolean;
    pipedaConsent: boolean;
  };
}

interface ProfessionalProfileContextType {
  profile?: ProfessionalProfile;
  loading: boolean;
  error?: Error;
  errorType?: 'network' | 'blocked' | 'permission' | 'other';
  updateProfile: (updates: Partial<ProfessionalProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateWizardData: (field: keyof ProfessionalProfile, value: unknown) => Promise<void>;
  setCurrentStep: (step: number) => void;
  retryProfileLoad: () => Promise<void>;
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
  const [errorType, setErrorType] = useState<'network' | 'blocked' | 'permission' | 'other' | undefined>(undefined);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const [/* currentStep */, setCurrentStepState] = useState<number>(0);

  // Lazy Firestore instance
  const getDb = () => {
    if (!(getDb as any)._db) {
      (getDb as any)._db = sharedDb;
    }
    return (getDb as any)._db as typeof sharedDb;
  };
  (getDb as any)._db = null as any;

  const getDefaultTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const createInitialProfile = async (uid: string, email: string): Promise<ProfessionalProfile> => {
    const db = getDb();
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

    const cleanedProfile = cleanUndefined(initialProfile);
    await setDoc(doc(db, 'users', uid), cleanedProfile);
    return initialProfile;
  };

  const isNetworkOrBlockedError = (err: any): boolean => {
    const errorCode = err?.code || '';
    const errorMessage = (err?.message || '').toLowerCase();

    const isNetworkError =
      errorMessage.includes('network') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('connection') ||
      errorCode === 'unavailable' ||
      errorCode === 'deadline-exceeded' ||
      errorCode === 'cancelled';

    const isBlockedError =
      errorMessage.includes('blocked') ||
      errorMessage.includes('err_blocked_by_client');

    const isPermissionError =
      errorCode === 'permission-denied' ||
      errorCode === 'unauthenticated' ||
      errorMessage.includes('missing or insufficient permissions');

    return isNetworkError || isBlockedError || isPermissionError;
  };

  const getDocWithRetry = async (db: ReturnType<typeof getDb>, uid: string, retries = 3): Promise<ReturnType<typeof getDoc>> => {
    const delays = [150, 500, 1200];

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc;
      } catch (err: any) {
        const retryable = isNetworkOrBlockedError(err);
        if (!retryable) throw err;
        if (attempt === retries - 1) {
          logger.warn(`[PROFILE] getDoc failed after ${retries} retries`, { uid, error: err });
          throw err;
        }
        const delay = delays[attempt] || 150;
        logger.info(`[PROFILE] Retry ${attempt + 1}/${retries} after ${delay}ms`, { uid });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('getDocWithRetry: Unexpected end of retry loop');
  };

  const loadProfile = async (uid: string): Promise<void> => {
    try {
      setLoading(true);
      setError(undefined);
      setErrorType(undefined);

      const db = getDb();
      const userDoc = await getDocWithRetry(db, uid);

      if (userDoc.exists()) {
        const userData = userDoc.data() as ProfessionalProfile;

        // WO-21: Log detallado para diagnosticar problemas post-verificación de email
        const firstName = userData.fullName?.split(' ')[0] || userData.displayName?.split(' ')[0] || '';
        const hasFirstName = firstName.trim() !== '';
        const hasProfessionalTitle = !!((userData.professionalTitle && userData.professionalTitle.trim() !== '') || (userData.profession && userData.profession.trim() !== ''));
        const hasSpecialty = !!(userData.specialty && userData.specialty.trim() !== '');
        const practiceCountry = (userData.practiceCountry || userData.country || '').trim();
        const hasPracticeCountry = practiceCountry !== '';
        const hasPilotConsent = (userData as any)?.pilotConsent?.accepted === true;

        const missingFields = {
          firstName: !hasFirstName,
          professionalTitle: !hasProfessionalTitle,
          specialty: !hasSpecialty,
          practiceCountry: !hasPracticeCountry,
          pilotConsent: !hasPilotConsent
        };

        const missingFieldsList = Object.entries(missingFields)
          .filter(([_, missing]) => missing)
          .map(([field]) => field);

        const missingFieldsStr = missingFieldsList.length > 0 ? missingFieldsList.join(', ') : 'NONE';
        if (missingFieldsList.length > 0) {
          console.warn('[PROFILE] ⚠️ Profile loaded but MISSING fields:', missingFieldsStr, {
            hasFirstName,
            hasProfessionalTitle,
            hasSpecialty,
            hasPracticeCountry,
            hasPilotConsent,
            practiceCountry: practiceCountry || 'EMPTY',
            country: userData.country || 'EMPTY',
            pilotConsent: (userData as any).pilotConsent || 'MISSING'
          });
        }

        logger.info('[PROFILE] Profile loaded from Firestore', {
          uid,
          email: userData.email,
          registrationStatus: userData.registrationStatus,
          hasFirstName,
          firstName,
          hasProfessionalTitle,
          professionalTitle: userData.professionalTitle,
          profession: userData.profession,
          hasSpecialty,
          specialty: userData.specialty,
          hasPracticeCountry,
          practiceCountry,
          country: userData.country,
          hasPilotConsent,
          pilotConsentRaw: (userData as any).pilotConsent,
          pilotConsentAccepted: (userData as any).pilotConsent?.accepted,
          missingFields,
          MISSING_FIELDS: missingFieldsStr
        });

        if (!userData.registrationStatus) {
          logger.info("[PROFILE] Missing registrationStatus, setting to 'incomplete'", { uid });
          await updateDoc(doc(db, 'users', uid), { registrationStatus: 'incomplete' });
          userData.registrationStatus = 'incomplete';
        }

        setProfile(userData);

        const now = Date.now();
        const lastLogin = userData.lastLoginAt?.toMillis?.() || 0;
        const fiveMinutesAgo = now - (5 * 60 * 1000);

        if (!userData.lastLoginAt || lastLogin < fiveMinutesAgo) {
          await updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() });
        }
      } else {
        logger.info("[PROFILE] Document does not exist (confirmed 'not found'), creating minimal profile", { uid });

        const minimalProfile: Partial<ProfessionalProfile> = {
          uid,
          email: user?.email || '',
          createdAt: serverTimestamp() as Timestamp,
        };

        const cleanedProfile = cleanUndefined(minimalProfile);

        await setDoc(doc(db, 'users', uid), cleanedProfile, { merge: true });

        const createdDoc = await getDoc(doc(db, 'users', uid));
        if (createdDoc.exists()) {
          const createdData = createdDoc.data() as ProfessionalProfile;
          if (!createdData.registrationStatus) {
            await updateDoc(doc(db, 'users', uid), { registrationStatus: 'incomplete' });
            createdData.registrationStatus = 'incomplete';
          }
          setProfile(createdData);
        } else {
          setProfile({ ...minimalProfile, registrationStatus: 'incomplete' } as ProfessionalProfile);
        }
      }
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error('Error desconocido al cargar perfil');
      const errorCode = err?.code || '';
      const errorMessage = (err?.message || '').toLowerCase();

      const isPermissionDenied =
        errorCode === 'permission-denied' ||
        errorMessage.includes('permission-denied') ||
        errorMessage.includes('missing or insufficient permissions');

      if (isNetworkOrBlockedError(err) || isPermissionDenied) {
        let classifiedType: 'network' | 'blocked' | 'permission' | 'other' = 'other';
        if (isPermissionDenied) classifiedType = 'permission';
        else if (errorMessage.includes('blocked') || errorMessage.includes('err_blocked_by_client')) classifiedType = 'blocked';
        else if (errorMessage.includes('network') || errorMessage.includes('failed to fetch') || errorMessage.includes('offline')) classifiedType = 'network';

        logger.error('[PROFILE] Network/blocked/permission error loading profile - NOT creating minimal profile', {
          uid,
          error: e.message,
          code: errorCode,
          type: classifiedType
        });

        setError(e);
        setErrorType(classifiedType);
      } else {
        logger.error('Error cargando perfil profesional:', e);
        setError(e);
        setErrorType('other');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<ProfessionalProfile>): Promise<void> => {
    if (!user?.uid) return;

    try {
      const db = getDb();
      const userRef = doc(db, 'users', user.uid);

      const cleanedUpdates = cleanUndefined({
        ...updates,
        lastSeenAt: serverTimestamp()
      });

      await updateDoc(userRef, cleanedUpdates);
      setProfile(prev => (prev ? { ...prev, ...updates } : undefined));
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Error al actualizar perfil');
      setError(e);
      throw e;
    }
  };

  const updateWizardData = async (field: keyof ProfessionalProfile, value: unknown): Promise<void> => {
    await updateProfile({ [field]: value } as Partial<ProfessionalProfile>);
  };

  const setCurrentStep = (step: number): void => {
    setCurrentStepState(step);
  };

  const refreshProfile = async (): Promise<void> => {
    if (user?.uid) {
      await loadProfile(user.uid);
    }
  };

  const retryProfileLoad = async (): Promise<void> => {
    if (user?.uid) {
      setError(undefined);
      setErrorType(undefined);
      await loadProfile(user.uid);
    }
  };

  const updateHeartbeat = async (): Promise<void> => {
    if (!user?.uid || !profile) return;

    try {
      const db = getDb();
      await updateDoc(doc(db, 'users', user.uid), { lastSeenAt: serverTimestamp() });
    } catch (err) {
      logger.warn('Error en heartbeat:', err);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.uid) {
      loadProfile(user.uid);
    } else if (!authLoading && !user) {
      setProfile(undefined);
      setLoading(false);
      setError(undefined);
      setErrorType(undefined);
    }
  }, [user?.uid, authLoading]);

  useEffect(() => {
    if (profile) {
      heartbeatRef.current = setInterval(updateHeartbeat, 60000);
    }
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [profile]);

  const value: ProfessionalProfileContextType = {
    profile,
    loading,
    error,
    errorType,
    updateProfile,
    refreshProfile,
    updateWizardData,
    setCurrentStep,
    retryProfileLoad
  };

  return (
    <ProfessionalProfileContext.Provider value={value}>
      {authLoading ? <>{children}</> : children}
    </ProfessionalProfileContext.Provider>
  );
};
  