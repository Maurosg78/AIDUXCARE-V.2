import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { auth } from '../lib/firebase';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const email = searchParams.get('email') || '';

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('No hay usuario autenticado');
        return;
      }

      const result = await firebaseAuthService.sendEmailVerification(currentUser);
      
      if (result.success) {
        setMessage('Email de verificación reenviado. Revisa tu bandeja de entrada.');
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error reenviando verificación:', err);
      setError('Error al reenviar el email de verificación');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            Verifica tu{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              Email
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed font-light">
            Hemos enviado un enlace de verificación a:
          </p>
          <p className="text-gray-900 font-medium">{email}</p>
        </div>

        {/* Mensajes */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-light">
            • Revisa tu bandeja de entrada y carpeta de spam<br/>
            • Haz clic en el enlace de verificación<br/>
            • Una vez verificado, podrás acceder a tu cuenta
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600'
            }`}
          >
            {loading ? 'Enviando...' : 'Reenviar Verificación'}
          </button>

          <button
            onClick={handleBackToLogin}
            className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};
