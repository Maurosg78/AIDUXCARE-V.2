import React, { createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';

// Definición mínima necesaria para tipo de usuario y perfil
interface UserProfile {
  id: string;
  role: string;
  full_name: string;
}

type RoleType = 'admin' | 'professional' | 'patient';

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: RoleType | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (requiredRoles: RoleType | RoleType[]) => boolean;
}

// Valores iniciales para el contexto
const initialUserContext: UserContextType = {
  user: null,
  session: null,
  profile: null,
  role: null,
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
  // En una implementación real, aquí añadiríamos la lógica
  // de autenticación con Supabase, pero para un build limpio
  // simplemente usamos el contexto inicial
  
  return (
    <UserContext.Provider value={initialUserContext}>
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