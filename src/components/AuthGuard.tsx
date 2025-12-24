import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

import { useAuth } from '../hooks/useAuth';
import { emailActivationService } from '../services/emailActivationService';
import { db } from '../lib/firebase';

import logger from '@/shared/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

type ErrorType = 'adblock' | 'permission' | 'network' | 'unknown' | null;

interface RecoverableError {
  type: ErrorType;
  message: string;
  retryable: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireEmailVerification = true 
}) => {
  const { user, loading } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<RecoverableError | null>(null);
  const retryCountRef = useRef(0);
  const isRetryingRef = useRef(false);
  const location = useLocation();

  // Detectar tipo de error
  const detectErrorType = useCallback((err: unknown): ErrorType => {
    if (!err) return 'unknown';
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCode = (err as any)?.code || '';
    
    // Adblock detection
    if (
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('blocked by client') ||
      errorCode === 'ERR_BLOCKED_BY_CLIENT'
    ) {
      return 'adblock';
    }
    
    // Permission denied
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('Permission denied') ||
      errorCode === 'permission-denied' ||
      errorCode === 7 // Firestore permission denied
    ) {
      return 'permission';
    }
    
    // Network/offline
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('offline') ||
      errorMessage.includes('Failed to fetch') ||
      errorCode === 'unavailable' ||
      !navigator.onLine
    ) {
      return 'network';
    }
    
    return 'unknown';
  }, []);

  // Cargar perfil con manejo de errores recuperables
  const loadProfile = useCallback(async (uid: string): Promise<void> => {
    if (isRetryingRef.current || profileLoading) return;
    
    setProfileLoading(true);
    setError(null);
    
    try {
      const userDoc = doc(db, 'users', uid);
      const docSnapshot = await getDoc(userDoc);
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        // Verificar que los campos requeridos existen
        if (userData.practicePreferences || userData.dataUseConsent || userData.registrationStatus) {
          setError(null);
          retryCountRef.current = 0;
        }
      }
    } catch (err) {
      const errorType = detectErrorType(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      logger.error('Error loading profile:', { error: errorMessage, type: errorType });
      
      setError({
        type: errorType,
        message: errorMessage.split('\n')[0], // Solo primera línea
        retryable: errorType !== 'permission' || retryCountRef.current < 3
      });
      
      // No hacer signOut, solo mostrar error recuperable
    } finally {
      setProfileLoading(false);
      isRetryingRef.current = false;
    }
  }, [detectErrorType, profileLoading]);

  // Función de retry con debounce
  const handleRetry = useCallback(async () => {
    if (isRetryingRef.current || profileLoading || !user?.uid) return;
    
    if (retryCountRef.current >= 3) {
      setError(prev => prev ? { ...prev, retryable: false } : null);
      return;
    }
    
    isRetryingRef.current = true;
    retryCountRef.current += 1;
    
    await loadProfile(user.uid);
  }, [user?.uid, profileLoading, loadProfile]);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (user && requireEmailVerification && emailVerified === null) {
        setCheckingEmail(true);
        try {
          if (!user.email) {
            setEmailVerified(false);
            return;
          }
          const professional = await emailActivationService.getProfessional(user.email);
          setEmailVerified(professional?.emailVerified || false);
        } catch (err) {
          const errorType = detectErrorType(err);
          const errorMessage = err instanceof Error ? err.message : String(err);
          
          logger.error('Error checking email verification:', { 
            error: errorMessage.split('\n')[0], 
            type: errorType 
          });
          
          // Soft-fail: no hacer signOut, solo marcar como no verificado
          setEmailVerified(false);
        } finally {
          setCheckingEmail(false);
        }
      } else if (!requireEmailVerification) {
        setEmailVerified(true);
      }
    };

    checkEmailVerification();
    
    // Cargar perfil cuando el usuario esté disponible
    if (user?.uid && !profileLoading) {
      loadProfile(user.uid);
    }
  }, [user, requireEmailVerification, emailVerified, detectErrorType, loadProfile, profileLoading]);

  if (loading || checkingEmail || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Pantalla de error recuperable
  if (error && error.retryable) {
    const getErrorMessage = () => {
      switch (error.type) {
        case 'adblock':
          return 'Parece que tienes un bloqueador de anuncios activo que está interfiriendo. Por favor, desactívalo para esta página y vuelve a intentar.';
        case 'permission':
          return 'No tienes permisos para acceder a estos datos. Por favor, contacta al administrador.';
        case 'network':
          return 'Problema de conexión. Verifica tu conexión a internet e intenta nuevamente.';
        default:
          return 'Ocurrió un error al cargar tu perfil. Por favor, intenta nuevamente.';
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800">Error al cargar perfil</h2>
          <p className="text-gray-600">{getErrorMessage()}</p>
          {error.message && (
            <p className="text-sm text-gray-500 font-mono bg-gray-100 p-2 rounded">
              {error.message}
            </p>
          )}
          <button
            onClick={handleRetry}
            disabled={isRetryingRef.current || profileLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRetryingRef.current || profileLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Reintentando...
              </>
            ) : (
              'Reintentar'
            )}
          </button>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere verificación de email y no está verificado
  if (requireEmailVerification && emailVerified === false && user.email) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  // Usuario autenticado y verificado (si es requerido)
  return <>{children}</>;
};
