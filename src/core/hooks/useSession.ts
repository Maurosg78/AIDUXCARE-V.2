import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import supabase from '../auth/supabaseClient';
import { UserProfile, userDataSourceSupabase } from '../services/userDataSourceSupabase';

interface UseSessionResult {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook personalizado para manejar la sesión de usuario y su perfil
 * - Mantiene la sesión actualizada
 * - Carga el perfil del usuario con su rol
 * - Proporciona funcionalidades para refrescar los datos
 */
export const useSession = (): UseSessionResult => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carga el perfil del usuario
  const loadUserProfile = async (userId: string) => {
    try {
      const userProfile = await userDataSourceSupabase.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      const err = error as Error;
      setError(err.message);
    }
  };

  // Refresca manualmente el perfil del usuario
  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    
    try {
      const userProfile = await userDataSourceSupabase.getUserProfile(session.user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      const err = error as Error;
      setError(err.message);
    }
  };

  useEffect(() => {
    // Obtener la sesión actual al montar el componente
    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(data.session);
        
        // Si hay sesión, cargar el perfil
        if (data.session?.user) {
          await loadUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        const err = error as Error;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Configurar listeners para cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setLoading(true);
        
        // Evento "SIGNED_IN" o "TOKEN_REFRESHED" - cargar el perfil
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
          await loadUserProfile(newSession.user.id);
        }
        
        // Evento "SIGNED_OUT" - limpiar el perfil
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      // Limpiar el listener
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    profile,
    loading,
    error,
    refreshProfile
  };
}; 