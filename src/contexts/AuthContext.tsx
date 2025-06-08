/**
 * 🔐 Authentication Context - AiDuxCare V.2
 * Context global para gestión de autenticación
 * Integrado con LocalAuthService
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TherapistLocalData } from '@/types/session';
import { localAuthService, AuthenticationResult, RegisterData } from '@/services/LocalAuthService';

interface AuthContextType {
  // Estado de autenticación
  isAuthenticated: boolean;
  currentTherapist: TherapistLocalData | null;
  isLoading: boolean;

  // Acciones de autenticación
  login: (therapistName: string) => Promise<AuthenticationResult>;
  register: (registerData: RegisterData) => Promise<AuthenticationResult>;
  switchTherapist: (therapistName: string) => Promise<AuthenticationResult>;
  logout: () => void;

  // Gestión de terapeutas
  getAllTherapists: () => string[];
  deleteTherapist: (therapistName: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentTherapist, setCurrentTherapist] = useState<TherapistLocalData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ========= INICIALIZACIÓN =========

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Verificar si hay una sesión activa
      const authenticated = localAuthService.isAuthenticated();
      const therapist = localAuthService.getCurrentTherapist();

      setIsAuthenticated(authenticated);
      setCurrentTherapist(therapist);

      console.log('🔐 Auth inicializada:', { authenticated, therapist: therapist?.name });
    } catch (error) {
      console.error('❌ Error al inicializar autenticación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ========= ACCIONES DE AUTENTICACIÓN =========

  const login = async (therapistName: string): Promise<AuthenticationResult> => {
    try {
      setIsLoading(true);
      const result = await localAuthService.authenticate(therapistName);

      if (result.success && result.therapist) {
        setIsAuthenticated(true);
        setCurrentTherapist(result.therapist);
        console.log('✅ Login exitoso:', result.therapist.name);
      } else {
        console.error('❌ Login fallido:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error en login:', error);
      return {
        success: false,
        error: 'Error interno de autenticación'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (registerData: RegisterData): Promise<AuthenticationResult> => {
    try {
      setIsLoading(true);
      const result = await localAuthService.register(registerData);

      if (result.success && result.therapist) {
        setIsAuthenticated(true);
        setCurrentTherapist(result.therapist);
        console.log('✅ Registro exitoso:', result.therapist.name);
      } else {
        console.error('❌ Registro fallido:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return {
        success: false,
        error: 'Error interno en el registro'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const switchTherapist = async (therapistName: string): Promise<AuthenticationResult> => {
    try {
      setIsLoading(true);
      const result = await localAuthService.switchTherapist(therapistName);

      if (result.success && result.therapist) {
        setIsAuthenticated(true);
        setCurrentTherapist(result.therapist);
        console.log('✅ Cambio de terapeuta exitoso:', result.therapist.name);
      } else {
        console.error('❌ Cambio de terapeuta fallido:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error al cambiar terapeuta:', error);
      return {
        success: false,
        error: 'Error interno al cambiar terapeuta'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      localAuthService.logout();
      setIsAuthenticated(false);
      setCurrentTherapist(null);
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error en logout:', error);
    }
  };

  // ========= GESTIÓN DE TERAPEUTAS =========

  const getAllTherapists = (): string[] => {
    try {
      return localAuthService.getAllTherapists();
    } catch (error) {
      console.error('❌ Error al obtener terapeutas:', error);
      return [];
    }
  };

  const deleteTherapist = async (therapistName: string): Promise<boolean> => {
    try {
      const result = await localAuthService.deleteTherapist(therapistName);
      
      // Si eliminamos el terapeuta actual, hacer logout
      if (result && currentTherapist?.name === therapistName) {
        logout();
      }

      return result;
    } catch (error) {
      console.error('❌ Error al eliminar terapeuta:', error);
      return false;
    }
  };

  // ========= VALOR DEL CONTEXTO =========

  const contextValue: AuthContextType = {
    // Estado
    isAuthenticated,
    currentTherapist,
    isLoading,

    // Acciones
    login,
    register,
    switchTherapist,
    logout,

    // Gestión
    getAllTherapists,
    deleteTherapist
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ========= HOOK PERSONALIZADO =========

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 