// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

import { auth } from '../lib/firebase';
import { useProfessionalProfile } from '../context/ProfessionalProfileContext';

import logger from '@/shared/utils/logger';

export const ResumeOnboardingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentStep } = useProfessionalProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEmailLink = async () => {
      try {
        // Verificar si es un link de sign-in con email
        if (isSignInWithEmailLink(auth, window.location.href)) {
          // Obtener email del localStorage o URL
          let email = window.localStorage.getItem('emailForSignIn');
          if (!email) {
            email = searchParams.get('email') || '';
          }

          if (!email) {
            setError('No se pudo obtener el email. Intenta nuevamente.');
            setLoading(false);
            return;
          }

          await signInWithEmailLink(auth, email, window.location.href);
          // El usuario ya está autenticado, redirigir al wizard
          const step = searchParams.get('step') || '1';
          setCurrentStep(parseInt(step));
          navigate('/wizard');
          
        } else {
          setError('Link inválido o expirado');
        }
      } catch (err) {
        logger.error('Error procesando link de re-engagement:', err);
        setError('Error al procesar el link. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    handleEmailLink();
  }, [searchParams, navigate, setCurrentStep]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Procesando link de re-engagement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-light text-gray-900 tracking-tight">
              Error en{' '}
              <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                Re-engagement
              </span>
            </h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white rounded-lg hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-200 font-medium"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};