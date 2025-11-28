import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, sendEmailVerification } from 'firebase/auth';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [verificationSent, setVerificationSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const auth = getAuth();
  
  const email = searchParams.get('email');

  useEffect(() => {
    if (email && auth.currentUser) {
      // Si el usuario está autenticado, enviar verificación automáticamente
      sendVerificationEmail();
    }
  }, [email, auth.currentUser]);

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationSent(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipVerification = () => {
    // Para desarrollo, permitir saltar verificación
    navigate('/command-center');
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600">Email no especificado</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verificar Email</h1>
        
        {verificationSent ? (
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Email de verificación enviado
            </h2>
            <p className="text-gray-600 mb-4">
              Hemos enviado un email de verificación a <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Por favor, revise su bandeja de entrada y haga clic en el enlace de verificación.
            </p>
            <button
              onClick={() => navigate('/command-center')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Continuar al Command Centre
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Necesitamos verificar su email <strong>{email}</strong> para continuar.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <button
              onClick={sendVerificationEmail}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              {loading ? 'Enviando...' : 'Enviar Email de Verificación'}
            </button>
            
            {/* Botón para desarrollo - saltar verificación */}
            <button
              onClick={handleSkipVerification}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              🧪 Saltar Verificación (Solo Desarrollo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
