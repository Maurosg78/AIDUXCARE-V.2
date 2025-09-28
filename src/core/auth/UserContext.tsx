// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { FirestoreAuditLogger } from '../audit/FirestoreAuditLogger';

import { FirebaseAuthService, UserProfile, AuthSession } from './firebaseAuthService';

import logger from '@/shared/utils/logger';

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (requiredRoles: string | string[]) => boolean;
}

const initialUserContext: UserContextType = {
  user: null,
  isLoading: false,
  error: null,
  logout: async () => {},
  refreshProfile: async () => {},
  hasRole: () => false
};

const UserContext = createContext<UserContextType>(initialUserContext);

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const authService = new FirebaseAuthService();

  // Cargar usuario y perfil al montar
  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session: AuthSession = await authService.getCurrentSession();
      setUser(session.user);
    } catch (err) {
      setError((err as Error).message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  useEffect(() => {
    loadUser();
    // TEMPORALMENTE DESHABILITADO: Causa loop infinito
    // const unsubscribe = authService.onAuthStateChange((session) => {
    //   setUser(session.user);
    // });
    // return () => unsubscribe();
    
    // SOLUCIÓN TEMPORAL: Solo cargar usuario inicial
    logger.info('🔍 [DEBUG] UserContext: Listener de autenticación deshabilitado temporalmente');
  }, [loadUser, authService]);

  const logout = async () => {
    setIsLoading(true);
    try {
      // Registrar evento de auditoría antes del logout
      if (user) {
        await FirestoreAuditLogger.logEvent({
          type: 'logout_success',
          userId: user.id,
          userRole: user.role,
          metadata: {
            logoutMethod: 'manual',
            sessionDuration: user.lastLoginAt ? Date.now() - user.lastLoginAt.getTime() : null
          }
        });
      }
      
      await authService.signOut();
      setUser(null);
    } catch (err) {
      // Registrar evento de auditoría en caso de error
      if (user) {
        await FirestoreAuditLogger.logEvent({
          type: 'logout_failed',
          userId: user.id,
          userRole: user.role,
          metadata: {
            error: (err as Error).message,
            logoutMethod: 'manual'
          }
        });
      }
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadUser();
  };

  const hasRole = (requiredRoles: string | string[]) => {
    if (!user || !user.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    return user.role === requiredRoles;
  };

  return (
    <UserContext.Provider value={{ user, isLoading, error, logout, refreshProfile, hasRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 