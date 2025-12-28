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
  // WO-AUTH-GUARD-ONB-DATA-01: Data use consent for personalization and prompting
  // WO-PERS-ONB-PROMPT-01: PHIPA and PIPEDA consent required for Canadian compliance
  dataUseConsent?: {
    personalizationFromClinicianInputs: boolean;   // default true (required to personalize)
    personalizationFromPatientData: boolean;       // default false (optional)
    useDeidentifiedDataForProductImprovement: boolean; // default false (optional)
    allowAssistantMemoryAcrossSessions: boolean;    // default true (optional but recommended)
    phipaConsent: boolean;                          // Required: PHIPA consent (default false, must be explicitly granted)
    pipedaConsent: boolean;                         // Required: PIPEDA consent (default false, must be explicitly granted)
  };
}

interface ProfessionalProfileContextType {
  profile?: ProfessionalProfile;
  loading: boolean;
  error?: Error;
  // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04: Exponer tipo de error para distinguir red/blocked vs otros
  errorType?: 'network' | 'blocked' | 'permission' | 'other';
  updateProfile: (updates: Partial<ProfessionalProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateWizardData: (field: keyof ProfessionalProfile, value: unknown) => Promise<void>;
  setCurrentStep: (step: number) => void;
  // WO-AUTH-GUARD-ONB-DATA-01: Exponer error y retry para soft-fail
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
  
  // Lazy initialization de Firestore - solo se obtiene cuando se necesita
  // Esto evita inicializar Firestore si el usuario no está autenticado
  const getDb = () => {
    // Memoizar la instancia de Firestore
    if (!getDb._db) {
      getDb._db = sharedDb;
    }
    return getDb._db;
  };
  getDb._db = null as ReturnType<typeof getFirestore> | null;

  // Función para obtener zona horaria por defecto
  const getDefaultTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  /**
   * Helper function to remove undefined values from objects (Firestore doesn't accept undefined)
   */
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

  // Función para crear perfil inicial
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

    // ✅ FIX: Clean undefined values before saving to Firestore
    const cleanedProfile = cleanUndefined(initialProfile);
    await setDoc(doc(db, 'users', uid), cleanedProfile);
    return initialProfile;
  };

  /**
   * WO-AUTH-EMAIL-VERIFY-REGSTATUS-04: Detectar si un error es de red/blocked/permission
   * Retorna true si es un error que NO debe crear perfil mínimo
   */
  const isNetworkOrBlockedError = (error: any): boolean => {
    const errorCode = error?.code || '';
    const errorMessage = (error?.message || '').toLowerCase();
    
    // Errores de red
    const isNetworkError = errorMessage.includes('network') ||
                          errorMessage.includes('failed to fetch') ||
                          errorMessage.includes('offline') ||
                          errorMessage.includes('connection') ||
                          errorCode === 'unavailable' ||
                          errorCode === 'deadline-exceeded' ||
                          errorCode === 'cancelled';
    
    // Errores de bloqueo (adblock, etc.)
    const isBlockedError = errorMessage.includes('blocked') ||
                          errorMessage.includes('err_blocked_by_client') ||
                          errorCode === 'permission-denied' ||
                          errorCode === 'unauthenticated';
    
    // Errores de permisos (pero NO "not found")
    const isPermissionError = errorCode === 'permission-denied' &&
                             !errorMessage.includes('not found') &&
                             !errorMessage.includes('does not exist');
    
    return isNetworkError || isBlockedError || isPermissionError;
  };

  /**
   * WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 2: Retry con backoff para errores de red
   * Backoff: 150ms, 500ms, 1200ms
   */
  const getDocWithRetry = async (db: ReturnType<typeof getDb>, uid: string, retries = 3): Promise<ReturnType<typeof getDoc>> => {
    const delays = [150, 500, 1200]; // ms
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        return userDoc;
      } catch (err: any) {
        const isRetryableError = isNetworkOrBlockedError(err);
        
        // Si NO es un error retryable, lanzar inmediatamente
        if (!isRetryableError) {
          throw err;
        }
        
        // Si es el último intento, lanzar el error
        if (attempt === retries - 1) {
          logger.warn(`[PROFILE] getDoc failed after ${retries} retries`, { uid, error: err });
          throw err;
        }
        
        // Esperar antes del siguiente intento
        const delay = delays[attempt] || 150;
        logger.info(`[PROFILE] Retry ${attempt + 1}/${retries} after ${delay}ms`, { uid });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Esto no debería ejecutarse, pero TypeScript lo requiere
    throw new Error('getDocWithRetry: Unexpected end of retry loop');
  };

  // Función para cargar perfil desde Firestore
  const loadProfile = async (uid: string): Promise<void> => {
    try {
      setLoading(true);
      setError(undefined);
      setErrorType(undefined);
      const db = getDb();

      // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 2: Usar retry para errores de red
      const userDoc = await getDocWithRetry(db, uid);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as ProfessionalProfile;
        
        // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04 ToDo 1: NO sobrescribir registrationStatus si ya es 'complete'
        // Solo agregar registrationStatus si NO existe (nunca degradar de 'complete' a 'incomplete')
        if (!userData.registrationStatus) {
          logger.info("[PROFILE] Missing registrationStatus, setting to 'incomplete'", { uid });
          await updateDoc(doc(db, 'users', uid), {
            registrationStatus: 'incomplete'
          });
          userData.registrationStatus = 'incomplete';
        }
        
        setProfile(userData);
        
        // WO-AUTH-VERIFYEMAIL-ROUTE-05: Actualizar lastLoginAt solo si no se ha actualizado recientemente
        // (evitar actualizaciones constantes que causan re-renders)
        // Solo actualizar si lastLoginAt no existe o es muy antiguo (> 5 minutos)
        const now = Date.now();
        const lastLogin = userData.lastLoginAt?.toMillis?.() || 0;
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        if (!userData.lastLoginAt || lastLogin < fiveMinutesAgo) {
          await updateDoc(doc(db, 'users', uid), {
            lastLoginAt: serverTimestamp()
          });
        }
      } else {
        // WO-AUTH-ONB-FLOW-FIX-04 C: Solo crear perfil mínimo si getDoc retorna "not found" (sin error)
        // Confirmación: getDoc.exists() === false y NO hubo error de lectura
        logger.info("[PROFILE] Document does not exist (confirmed 'not found'), creating minimal profile", { uid });
        const minimalProfile: Partial<ProfessionalProfile> = {
          uid,
          email: user?.email || '',
          createdAt: serverTimestamp() as Timestamp,
        };
        
        // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04: NO establecer registrationStatus aquí
        // Solo se establecerá si realmente no existe (merge: true lo preserva si ya existe)
        // Clean undefined values before saving
        const cleanedProfile = cleanUndefined(minimalProfile);
        
        // WO-AUTH-EMAIL-VERIFY-REGSTATUS-04: Usar merge: true para NO sobrescribir registrationStatus si ya existe
        await setDoc(doc(db, 'users', uid), cleanedProfile, { merge: true });
        
        // Leer el doc después de crearlo para obtener el registrationStatus real (si existía)
        const createdDoc = await getDoc(doc(db, 'users', uid));
        if (createdDoc.exists()) {
          const createdData = createdDoc.data() as ProfessionalProfile;
          // Si no tiene registrationStatus después del merge, establecerlo a 'incomplete'
          if (!createdData.registrationStatus) {
            await updateDoc(doc(db, 'users', uid), {
              registrationStatus: 'incomplete'
            });
            createdData.registrationStatus = 'incomplete';
          }
          setProfile(createdData);
        } else {
          // Fallback: si por alguna razón no se puede leer, usar el perfil mínimo
          setProfile({
            ...minimalProfile,
            registrationStatus: 'incomplete'
          } as ProfessionalProfile);
        }
      }
    } catch (err) {
      // WO-AUTH-ONB-FLOW-FIX-04 C: Si es error de permissions/red/blocked, NO crear perfil mínimo
      const error = err instanceof Error ? err : new Error('Error desconocido al cargar perfil');
      const errorCode = (err as any)?.code || '';
      const errorMessage = (err as any)?.message?.toLowerCase() || '';
      
      // WO-AUTH-ONB-FLOW-FIX-04 C: Detectar específicamente permission-denied
      const isPermissionDenied = errorCode === 'permission-denied' || 
                                 errorMessage.includes('permission-denied') ||
                                 errorMessage.includes('missing or insufficient permissions');
      
      if (isNetworkOrBlockedError(err) || isPermissionDenied) {
        // Error de red/blocked/permission - NO crear perfil mínimo, solo marcar error
        // WO-AUTH-ONB-FLOW-FIX-04 C: Si reglas impiden leer, no se crea nada
        
        // Clasificar tipo de error
        let classifiedType: 'network' | 'blocked' | 'permission' | 'other' = 'other';
        if (isPermissionDenied) {
          classifiedType = 'permission';
        } else if (errorMessage.includes('blocked') || errorMessage.includes('err_blocked_by_client')) {
          classifiedType = 'blocked';
        } else if (errorMessage.includes('network') || errorMessage.includes('failed to fetch') || errorMessage.includes('offline')) {
          classifiedType = 'network';
        }
        
        logger.error('[PROFILE] Network/blocked/permission error loading profile - NOT creating minimal profile', { 
          uid, 
          error: error.message,
          code: errorCode,
          type: classifiedType
        });
        setError(error);
        setErrorType(classifiedType);
        // NO establecer profile = undefined aquí, mantener el último estado conocido si existe
        // Esto evita que AuthGuard redirija incorrectamente
        // WO-AUTH-ONB-FLOW-FIX-04 C: NO escribir nada a Firestore si hay error de permissions
      } else {
        // Otro tipo de error - también NO crear perfil mínimo
        logger.error('Error cargando perfil profesional:', error);
        setError(error);
        setErrorType('other');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (updates: Partial<ProfessionalProfile>): Promise<void> => {
    if (!user?.uid) return;

    try {
      const db = getDb();
      const userRef = doc(db, 'users', user.uid);
      
      // ✅ FIX: Clean undefined values before saving to Firestore
      const cleanedUpdates = cleanUndefined({
        ...updates,
        lastSeenAt: serverTimestamp()
      });
      
      await updateDoc(userRef, cleanedUpdates);

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

  // WO-AUTH-GUARD-ONB-DATA-01: Retry function para soft-fail
  const retryProfileLoad = async (): Promise<void> => {
    if (user?.uid) {
      setError(undefined);
      setErrorType(undefined);
      await loadProfile(user.uid);
    }
  };

  // Función para heartbeat (actualizar lastSeenAt)
  const updateHeartbeat = async (): Promise<void> => {
    if (!user?.uid || !profile) return;

    try {
      const db = getDb();
      await updateDoc(doc(db, 'users', user.uid), {
        lastSeenAt: serverTimestamp()
      });
    } catch (err) {
      logger.warn('Error en heartbeat:', err);
    }
  };

  // Efecto para cargar perfil cuando cambia el usuario
  // Solo carga el perfil si el usuario está autenticado y Auth ya terminó de cargar
  useEffect(() => {
    if (!authLoading && user?.uid) {
      loadProfile(user.uid);
    } else if (!authLoading && !user) {
      // Usuario no autenticado - limpiar estado sin cargar Firestore
      setProfile(undefined);
      setLoading(false);
      setError(undefined);
      setErrorType(undefined);
    }
  }, [user?.uid, authLoading]);

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
