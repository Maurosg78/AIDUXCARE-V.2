import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getAuth, applyActionCode } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';

export const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // WO-AUTH-VERIFYEMAIL-ROUTE-05: Verificar si usuario ya está autenticado
  const [countdown, setCountdown] = useState(2); // Reducido a 2 segundos
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedCountdownRef = useRef(false);

  // Get email and action code from URL params
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // WO-AUTH-GATE-LOOP-06 ToDo 4: EmailVerifiedPage solo en contexto correcto
  useEffect(() => {
    // Si hay un código de acción de Firebase, verificar automáticamente
    if (mode === 'verifyEmail' && oobCode) {
      handleEmailVerification(oobCode);
    } else {
      // Si no hay token/código, NO mostrar esta página - redirigir según estado
      setIsVerifying(false);
      setVerificationError('INVALID_LINK');
      
      // Redirigir según estado del usuario
      setTimeout(() => {
        if (user) {
          // Usuario autenticado - redirigir a command-center (AuthGuard manejará routing)
          navigate('/command-center', { replace: true });
        } else {
          // Usuario no autenticado - redirigir a login
          navigate('/login', { replace: true });
        }
      }, 1000);
    }
     
  }, [mode, oobCode, user, navigate]);

  const handleEmailVerification = async (code: string) => {
    try {
      const auth = getAuth();
      await applyActionCode(auth, code);
      setIsVerifying(false);
    } catch (error: any) {
      console.error('Error verificando email:', error);
      // Firebase error codes for expired/already used links
      const errorCode = error?.code || '';
      const errorMessage = error?.message || 'Error verifying email';
      
      // Check if it's an expired or already used link
      const isExpired = errorCode.includes('expired') || errorMessage.toLowerCase().includes('expired');
      const isAlreadyUsed = errorCode.includes('invalid') || errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('used');
      
      if (isExpired || isAlreadyUsed) {
        setVerificationError('EXPIRED_OR_USED');
      } else {
        setVerificationError(errorMessage);
      }
      setIsVerifying(false);
    }
  };

  // Countdown y redirección - solo se ejecuta una vez cuando la verificación termina
  // WO-AUTH-VERIFYEMAIL-ROUTE-05: Arreglar warning de React Router (navigate durante render)
  useEffect(() => {
    // Solo iniciar countdown si ya no está verificando, no hay error, y no se ha iniciado antes
    if (!isVerifying && !verificationError && !hasStartedCountdownRef.current && !isRedirecting) {
      hasStartedCountdownRef.current = true;
      
      // Usar setTimeout para evitar navigate durante render
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsRedirecting(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // WO-AUTH-VERIFYEMAIL-ROUTE-05: Si usuario ya está autenticado, redirigir a command-center
            // Si no está autenticado, redirigir a login
            setTimeout(() => {
              if (user) {
                // WO-ONB-UNIFY-01: Usuario autenticado - AuthGuard redirigirá a /professional-onboarding si profile incomplete
                // o a /command-center si profile completo
                navigate('/command-center', { replace: true });
              } else {
                // Usuario no autenticado - redirigir a login
                navigate('/login', { 
                  replace: true,
                  state: { 
                    message: 'Email verified successfully! You can now sign in.',
                    type: 'success'
                  }
                });
              }
            }, 0);
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
  }, [isVerifying, verificationError, isRedirecting]); // Removed navigate from dependencies to avoid re-renders

  const handleGoToLogin = () => {
    setIsRedirecting(true);
    // WO-AUTH-VERIFYEMAIL-ROUTE-05: Si usuario ya está autenticado, redirigir a command-center
    if (user) {
      navigate('/command-center', { replace: true });
    } else {
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'Email verified successfully! You can now sign in.',
          type: 'success'
        }
      });
    }
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
            Verifying Email...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si hubo problema
  if (verificationError) {
    const isExpiredOrUsed = verificationError === 'EXPIRED_OR_USED' || 
                           verificationError.toLowerCase().includes('expired') || 
                           verificationError.toLowerCase().includes('already') ||
                           verificationError.toLowerCase().includes('used');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isExpiredOrUsed ? 'Verification Link Expired' : 'Verification Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpiredOrUsed 
              ? 'The verification link has expired or has already been used. Your email may already be verified. Try signing in, or request a new verification link.'
              : 'There was a problem verifying your email. Please try again.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleGoToLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Go to Login
            </button>
            {isExpiredOrUsed && (
              <p className="text-sm text-gray-500">
                If your email is already verified, you will be able to sign in normally.
              </p>
            )}
          </div>
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
          Email Verified!
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-6">
          Congratulations. Your account has been successfully verified.
        </p>

        {/* Subtitle */}
        <p className="text-gray-500 mb-8">
          You can now access your account and start using AiDuxCare.
        </p>

        {/* Action Button */}
        <button
          onClick={handleGoToLogin}
          disabled={isRedirecting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isRedirecting ? 'Redirecting...' : 'Go to Login'}
        </button>

        {/* Countdown Info */}
        {countdown > 0 && (
          <p className="text-sm text-gray-400">
            You will be redirected automatically in {countdown} second{countdown !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};
