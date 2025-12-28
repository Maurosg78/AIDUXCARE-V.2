import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * AuthOnlyGuard - Solo requiere autenticación, NO requiere perfil completo
 * 
 * WO-AUTH-GATE-LOOP-06: Para rutas como /professional-onboarding que necesitan
 * usuario autenticado pero NO deben redirigir si el perfil está incompleto.
 */
interface AuthOnlyGuardProps {
  children: React.ReactNode;
}

export const AuthOnlyGuard: React.FC<AuthOnlyGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Usuario autenticado - permitir acceso (sin verificar perfil)
  return <>{children}</>;
};

