import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { emailActivationService } from '../services/emailActivationService';

import logger from '@/shared/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireEmailVerification = true 
}) => {
  const { user, loading } = useAuth();
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const location = useLocation();

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
        } catch (error) {
          logger.error('Error checking email verification:', error);
          setEmailVerified(false);
        } finally {
          setCheckingEmail(false);
        }
      } else if (!requireEmailVerification) {
        setEmailVerified(true);
      }
    };

    checkEmailVerification();
  }, [user, requireEmailVerification, emailVerified]);

  if (loading || checkingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Verificando autenticación...</p>
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
