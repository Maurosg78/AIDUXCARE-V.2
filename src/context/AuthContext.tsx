import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  AuthError
} from 'firebase/auth';

import { auth } from '../lib/firebase';

import { trackUserLogin, trackUserLogout, trackUserSignup } from "@/services/analytics/AnalyticsEvents";
import logger from '@/shared/utils/logger';
import { firebaseAuthService } from '@/services/firebaseAuthService';
import { safeLogger } from '@/utils/safeLogger';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  specialty: string;
  university: string;
  licenseNumber: string;
  experienceYears: string;
  workplace?: string;
}

export interface AuthContextType {
  /** Usuario actual autenticado */
  user: User | null;
  /** true si hay usuario autenticado */
  isAuthenticated: boolean;
  /** Indica si está cargando el estado de autenticación */
  loading: boolean;
  /** Indica si hay un error de autenticación */
  error: string | null;
  /** Método para iniciar sesión */
  login: (email: string, password: string) => Promise<void>;
  /** Método para cerrar sesión */
  logout: () => Promise<void>;
  /** Método para registrar usuario */
  register: (data: RegisterData) => Promise<void>;
  /** Método para recuperar contraseña */
  recoverPassword: (email: string) => Promise<void>;
  /** Método para limpiar errores */
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);

      const loginSuccess = Boolean(userCredential.user);
      safeLogger.authEvent('login', loginSuccess);

      // Track login
      await trackUserLogin({
        userId: userCredential.user.uid,
        loginMethod: "email",
      });

      // Track login
      await trackUserLogin({
        userId: userCredential.user.uid,
        loginMethod: "email",
      });

      // Track login
      await trackUserLogin({
        userId: userCredential.user.uid,
        loginMethod: "email",
      });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      const loginErrorCode = authError.code ?? 'unknown';
      const loginHasMessage = Boolean(authError.message);
      safeLogger.errorOccurred('AuthLogin', loginErrorCode, loginHasMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await signOut(auth);
      setUser(null);

      safeLogger.authEvent('logout', true);

      // Track logout
      await trackUserLogout({
        userId: user?.uid,
      });

      // Track logout
      await trackUserLogout({
        userId: user?.uid,
      });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      const logoutErrorCode = authError.code ?? 'unknown';
      const logoutHasMessage = Boolean(authError.message);
      safeLogger.errorOccurred('AuthLogout', logoutErrorCode, logoutHasMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      setUser(userCredential.user);

      const registerSuccess = Boolean(userCredential.user);
      safeLogger.authEvent('register', registerSuccess);

      // Track signup
      await trackUserSignup({
        userId: userCredential.user.uid,
        registrationType: "email",
      });
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      const registerErrorCode = authError.code ?? 'unknown';
      const registerHasMessage = Boolean(authError.message);
      safeLogger.errorOccurred('AuthRegister', registerErrorCode, registerHasMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebaseAuthService.sendPasswordResetEmail(email);
      const passwordResetSuccess = Boolean(result.success);
      safeLogger.authEvent('password_reset_requested', passwordResetSuccess);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      const passwordResetErrorCode = authError.code ?? 'unknown';
      const passwordResetHasMessage = Boolean(authError.message);
      safeLogger.errorOccurred('AuthPasswordReset', passwordResetErrorCode, passwordResetHasMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  useEffect(() => {
    // Hardening: skip if auth not ready (test-safe). Avoid _delegate check — Firebase modular SDK may not expose it.
    if (!auth || typeof auth !== 'object') {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          safeLogger.authEvent('auth_state_authenticated', true);
        } else {
          safeLogger.authEvent('auth_state_authenticated', false);
        }
      },
      async (error) => {
        // Handler robusto para errores de refresh token (403/securetoken)
        const authStateError = error as { code?: string; message?: string };
        const authStateErrorCode = authStateError.code ?? 'unknown';
        const authStateHasMessage = Boolean(authStateError.message);
        safeLogger.errorOccurred('AuthStateChange', authStateErrorCode, authStateHasMessage);

        const authError = error as { code?: string; message?: string };
        if (authError.code === 'auth/network-request-failed' ||
          authError.code === 'auth/too-many-requests' ||
          authError.message?.includes('403') ||
          authError.message?.includes('securetoken')) {

          safeLogger.authEvent('refresh_token_cleanup', true);
          try {
            await signOut(auth);
            setUser(null);
          } catch (signOutError) {
            const signOutErrorCode = (signOutError as { code?: string })?.code ?? 'unknown';
            const signOutHasMessage = Boolean((signOutError as { message?: string })?.message);
            safeLogger.errorOccurred('AuthStateCleanup', signOutErrorCode, signOutHasMessage);
          }
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
    register,
    recoverPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};

/**
 * Convierte códigos de error de Firebase a mensajes legibles en español
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/user-not-found': 'No existe una cuenta con este email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/invalid-email': 'Email inválido',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/email-already-in-use': 'Ya existe una cuenta con este email',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
    'auth/operation-not-allowed': 'Esta operación no está permitida',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    'auth/user-token-expired': 'Sesión expirada. Inicia sesión nuevamente',
    'auth/requires-recent-login': 'Se requiere autenticación reciente para esta operación',
  };

  return errorMessages[errorCode] || 'Error de autenticación desconocido';
};
