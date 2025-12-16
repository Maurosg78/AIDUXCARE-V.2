import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  AuthError 
} from 'firebase/auth';

import { auth } from '../lib/firebase';

import logger from '@/shared/utils/logger';

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
      
      logger.info('Login exitoso:', userCredential.user.email);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      logger.error('Error en login:', authError);
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
      
      logger.info('Logout exitoso');
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      logger.error('Error en logout:', authError);
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
      
      logger.info('Registro exitoso:', userCredential.user.email);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      logger.error('Error en registro:', authError);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      
      logger.info('Email de recuperación enviado a:', email);
    } catch (error) {
      const authError = error as AuthError;
      const errorMessage = getAuthErrorMessage(authError.code);
      setError(errorMessage);
      logger.error('Error en recuperación de contraseña:', authError);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
        
        if (currentUser) {
          logger.info('Usuario autenticado:', currentUser.email);
        } else {
          logger.info('Usuario no autenticado');
        }
      },
      async (error) => {
        // Handler robusto para errores de refresh token (403/securetoken)
        logger.warn('Auth state change error:', error);
        
        const authError = error as { code?: string; message?: string };
        if (authError.code === 'auth/network-request-failed' || 
            authError.code === 'auth/too-many-requests' ||
            authError.message?.includes('403') ||
            authError.message?.includes('securetoken')) {
          
          console.info('Detectado error de refresh token, limpiando estado...');
          try {
            await signOut(auth);
            setUser(null);
          } catch (signOutError) {
            logger.warn('Error al limpiar estado:', signOutError);
          }
        }
        
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
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
