import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * AuthActionPage
 * 
 * Handles Firebase action codes (email verification, password reset, etc.)
 * This page is used as the landing page for Firebase action links.
 */
const AuthActionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');
  const apiKey = searchParams.get('apiKey');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setErrorMessage('Invalid action link. Missing required parameters.');
      return;
    }

    setActionMode(mode);
    handleActionCode(mode, oobCode);
  }, [mode, oobCode]);

  const handleActionCode = async (actionMode: string, code: string) => {
    try {
      const auth = getAuth();

      switch (actionMode) {
        case 'verifyEmail':
          await applyActionCode(auth, code);
          setStatus('success');
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
                type: 'success'
              }
            });
          }, 2000);
          break;

        case 'resetPassword':
          // Verify the code is valid (this doesn't reset the password yet)
          await verifyPasswordResetCode(auth, code);
          setStatus('success');
          // Redirect to reset complete page with the code
          navigate(`/reset-complete?oobCode=${code}&mode=resetPassword`, {
            replace: true
          });
          break;

        case 'recoverEmail':
          // Handle email recovery
          await applyActionCode(auth, code);
          setStatus('success');
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Email recuperado exitosamente.',
                type: 'success'
              }
            });
          }, 2000);
          break;

        default:
          setStatus('error');
          setErrorMessage(`Unsupported action mode: ${actionMode}`);
      }
    } catch (error: any) {
      console.error('Error processing action code:', error);
      const errorCode = error?.code || '';
      const errorMsg = error?.message || 'Error al procesar la acción';

      // Check for common Firebase errors
      if (errorCode.includes('expired') || errorMsg.toLowerCase().includes('expired')) {
        setErrorMessage('EXPIRED');
      } else if (errorCode.includes('invalid') || errorMsg.toLowerCase().includes('invalid')) {
        setErrorMessage('INVALID');
      } else {
        setErrorMessage(errorMsg);
      }
      setStatus('error');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Procesando...
          </h1>
          <p className="text-gray-600">
            Por favor espera mientras procesamos tu solicitud.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    const isExpired = errorMessage === 'EXPIRED';
    const isInvalid = errorMessage === 'INVALID';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isExpired ? 'Enlace expirado' : isInvalid ? 'Enlace inválido' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpired
              ? 'El enlace ha expirado. Por favor, solicita un nuevo enlace.'
              : isInvalid
              ? 'El enlace no es válido o ya fue utilizado. Por favor, solicita un nuevo enlace.'
              : errorMessage || 'Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.'}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  // Success state (usually redirects quickly, but show a message just in case)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ¡Acción completada!
        </h1>
        <p className="text-gray-600 mb-6">
          {actionMode === 'verifyEmail'
            ? 'Tu email ha sido verificado exitosamente.'
            : actionMode === 'resetPassword'
            ? 'Redirigiendo a la página de restablecimiento de contraseña...'
            : 'Tu solicitud ha sido procesada exitosamente.'}
        </p>
        <p className="text-sm text-gray-400">
          Redirigiendo...
        </p>
      </div>
    </div>
  );
};

export default AuthActionPage;

