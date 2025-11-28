import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { emailActivationService } from '../services/emailActivationService';

import logger from '@/shared/utils/logger';

export const UnverifiedUserPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setMessage('');
    setError('');

    try {
      const result = await emailActivationService.resendEmailVerification(email);
      
      if (result.success) {
        setMessage(result.message);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al reenviar verificación');
      logger.error('Error reenviando verificación:', error);
    } finally {
      setIsResending(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            Cuenta{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              No Verificada
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed font-light">
            Tu cuenta está registrada pero necesita verificación.<br/>
            Revisa tu email o solicita un nuevo enlace de verificación.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleResendVerification}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base"
                placeholder="tu@email.com"
              />
            </div>

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">{message}</p>
                    <p className="text-xs text-green-600 mt-1">
                      En desarrollo, revisa la consola del navegador para ver el link de verificación.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isResending}
                className="w-full py-3 px-4 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Reenviando...
                  </div>
                ) : (
                  'Reenviar Email de Verificación'
                )}
              </button>


            </div>
          </form>

          <div className="text-center space-y-4 mt-6">
            <p className="text-sm text-gray-500">
              ¿Ya verificaste tu cuenta?{' '}
              <Link 
                to="/login" 
                className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
            </p>
            
            <p className="text-sm text-gray-500">
              ¿Olvidaste tu contraseña?{' '}
              <Link 
                to="/forgot-password" 
                className="font-medium text-purple-600 hover:text-purple-700 transition-colors duration-200"
              >
                Recuperar contraseña
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
