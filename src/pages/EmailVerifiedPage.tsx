// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

export const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get email from URL params if available
  const email = searchParams.get('email') || 'usuario';

  useEffect(() => {
    // Start countdown to redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          navigate('/login', { 
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

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    setIsRedirecting(true);
    navigate('/login', { 
      state: { 
        message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
        type: 'success'
      }
    });
  };

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
          Felicitaciones, <span className="font-semibold text-blue-600">{email}</span>. 
          Tu cuenta ha sido verificada exitosamente.
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
        <p className="text-sm text-gray-400">
          Serás redirigido automáticamente en {countdown} segundos
        </p>
      </div>
    </div>
  );
};