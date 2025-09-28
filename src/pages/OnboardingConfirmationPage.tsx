// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

import logger from '@/shared/utils/logger';

const OnboardingConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [isResending, setIsResending] = useState(false);
  
  const email = searchParams.get('email') || 'tu correo electrónico';
  const token = searchParams.get('token');

  useEffect(() => {
    // Si hay token en la URL, es una verificación
    if (token) {
      handleEmailVerification(token);
    }
  }, [token]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/login');
    }
  }, [countdown, navigate]);

  const handleEmailVerification = async (verificationToken: string) => {
    try {
      // Aquí iría la lógica de verificación con el backend
      logger.info('Verificando email con token:', verificationToken);
      
      // Simulación de verificación exitosa
      setTimeout(() => {
        navigate('/professional-workflow', { 
          replace: true,
          state: { 
            message: '¡Email verificado exitosamente! Bienvenido a AiDuxCare.',
            type: 'success'
          }
        });
      }, 2000);
    } catch (error) {
      logger.error('Error verificando email:', error);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      // Aquí iría la lógica para reenviar el email
      logger.info('Reenviando email de verificación a:', email);
      
      // Simulación de reenvío
      setTimeout(() => {
        setIsResending(false);
        alert('Email de verificación reenviado exitosamente.');
      }, 2000);
    } catch (error) {
      logger.error('Error reenviando email:', error);
      setIsResending(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Si hay token, mostrar pantalla de verificación
  if (token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <AiDuxCareLogo className="h-12 mx-auto mb-4" />
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verificando tu cuenta
          </h1>
          
          <p className="text-gray-600 mb-6">
            Estamos verificando tu dirección de email...
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Procesando verificación...</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <AiDuxCareLogo className="h-12 mx-auto mb-4" />
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Perfil Creado Exitosamente!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu perfil profesional ha sido registrado en AiDuxCare. 
          Para completar tu registro, necesitamos verificar tu dirección de email.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            📧 Verificación por Email
          </h2>
          
          <p className="text-blue-800 mb-4">
            Hemos enviado un email de verificación a:
          </p>
          
          <div className="bg-white border border-blue-300 rounded-lg p-3 mb-4">
            <p className="text-blue-900 font-medium">{email}</p>
          </div>
          
          <p className="text-blue-700 text-sm">
            Haz clic en el enlace de verificación en tu email para activar tu cuenta 
            y acceder por primera vez a AiDuxCare.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isResending ? 'Reenviando...' : '📧 Reenviar Email de Verificación'}
          </button>
          
          <button
            onClick={handleGoToLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🔐 Ir a Iniciar Sesión
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Redirigiendo automáticamente a la página de login en {countdown} segundos...
          </p>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-900 font-medium mb-2">
            ⚠️ Importante
          </h3>
          <p className="text-yellow-800 text-sm">
            Si no recibes el email en los próximos 5 minutos, revisa tu carpeta de spam 
            o solicita un nuevo envío usando el botón de arriba.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingConfirmationPage; 