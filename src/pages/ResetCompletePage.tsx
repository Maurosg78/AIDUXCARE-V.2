// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';

export const ResetCompletePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Apple-style */}
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            Contraseña{' '}
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent font-medium">
              Actualizada
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed font-light">
            Tu contraseña ha sido cambiada exitosamente.<br/>
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <div className="space-y-6">
            {/* Mensaje de éxito */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Contraseña actualizada correctamente
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Tu cuenta está segura y lista para usar.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de acción principal */}
            <div>
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Volver al Login
              </Link>
            </div>

            {/* Información adicional */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                ¿Necesitas ayuda?{' '}
                <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500">
                  Contacta soporte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};