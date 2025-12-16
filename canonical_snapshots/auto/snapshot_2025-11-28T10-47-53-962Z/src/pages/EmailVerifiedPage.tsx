import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getAuth, applyActionCode } from 'firebase/auth';

export const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(2); // Reducido a 2 segundos
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedCountdownRef = useRef(false);

  // Get email and action code from URL params
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    // Si hay un código de acción de Firebase, verificar automáticamente
    if (mode === 'verifyEmail' && oobCode) {
      handleEmailVerification(oobCode);
    } else {
      // Si no hay código, asumir que ya está verificado y redirigir
      setIsVerifying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, oobCode]);

  const handleEmailVerification = async (code: string) => {
    try {
      const auth = getAuth();
      await applyActionCode(auth, code);
      setIsVerifying(false);
    } catch (error: any) {
      console.error('Error verificando email:', error);
      setVerificationError(error.message || 'Error al verificar el email');
      setIsVerifying(false);
    }
  };

  // Countdown y redirección - solo se ejecuta una vez cuando la verificación termina
  useEffect(() => {
    // Limpiar timer anterior si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Solo iniciar countdown si ya no está verificando, no hay error, y no se ha iniciado antes
    if (!isVerifying && !verificationError && !hasStartedCountdownRef.current && !isRedirecting) {
      hasStartedCountdownRef.current = true;
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsRedirecting(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            navigate('/', { 
              replace: true,
              state: { 
                message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
                type: 'success'
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVerifying, verificationError, navigate, isRedirecting]);

  const handleGoToLogin = () => {
    setIsRedirecting(true);
    navigate('/', { 
      replace: true,
      state: { 
        message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
        type: 'success'
      }
    });
  };

  // Mostrar estado de carga mientras se verifica
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verificando email...
          </h1>
          <p className="text-gray-600">
            Por favor espera mientras verificamos tu email.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si hubo problema
  if (verificationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verificación completada
          </h1>
          <p className="text-gray-600 mb-6">
            {verificationError.includes('already') || verificationError.includes('expired') 
              ? 'Tu email ya está verificado o el enlace ha expirado. Puedes iniciar sesión normalmente.'
              : 'Tu email ha sido verificado. Ya puedes iniciar sesión.'}
          </p>
          <button
            onClick={handleGoToLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Email Verificado!
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-6">
          Felicitaciones. Tu cuenta ha sido verificada exitosamente.
        </p>

        {/* Subtitle */}
        <p className="text-gray-500 mb-8">
          Ya puedes acceder a tu cuenta y comenzar a usar AiDuxCare.
        </p>

        {/* Action Button */}
        <button
          onClick={handleGoToLogin}
          disabled={isRedirecting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isRedirecting ? 'Redirigiendo...' : 'Ir al Login'}
        </button>

        {/* Countdown Info */}
        {countdown > 0 && (
          <p className="text-sm text-gray-400">
            Serás redirigido automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};
