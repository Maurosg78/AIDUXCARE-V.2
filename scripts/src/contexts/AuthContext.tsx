import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Therapist } from '../types/therapist';
import { getAllTherapists } from '../services/TherapistService';

interface AuthContextType {
  therapists: Therapist[];
  loading: boolean;
  error: string | null;
  refreshTherapists: () => Promise<void>;
  login: (therapist: Therapist) => Promise<void>;
  register: (data: { name: string; specialization: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  fetcher?: typeof getAllTherapists;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  fetcher = getAllTherapists 
}) => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTherapists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetcher();
      setTherapists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los terapeutas');
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  const login = useCallback(async (therapist: Therapist) => {
    try {
      // Aquí iría la lógica de login
      console.log('Login exitoso para:', therapist.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el login');
    }
  }, []);

  const register = useCallback(async (data: { name: string; specialization: string }) => {
    try {
      // Aquí iría la lógica de registro
      console.log('Registro exitoso para:', data.name);
      await refreshTherapists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el registro');
    }
  }, [refreshTherapists]);

  useEffect(() => {
    refreshTherapists();
  }, [refreshTherapists]);

  return (
    <AuthContext.Provider value={{ therapists, loading, error, refreshTherapists, login, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 