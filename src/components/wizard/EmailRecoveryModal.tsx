/**
 * EmailRecoveryModal - Modal de opciones de recuperación
 * Se muestra cuando el email ya existe en el sistema
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState } from 'react';
import { EmailValidationResult } from '../../services/emailValidationService';

interface EmailRecoveryModalProps {
  isOpen: boolean;
  email: string;
  validationResult: EmailValidationResult;
  onClose: () => void;
  onPasswordRecovery: (email: string) => Promise<void>;
  onAccountActivation: (email: string) => Promise<void>;
  onContinueRegistration: () => void;
}

export const EmailRecoveryModal: React.FC<EmailRecoveryModalProps> = ({
  isOpen,
  email,
  validationResult,
  onClose,
  onPasswordRecovery,
  onAccountActivation,
  onContinueRegistration
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'recovery' | 'activation' | null>(null);

  if (!isOpen) return null;

  const handlePasswordRecovery = async () => {
    setIsLoading(true);
    setActionType('recovery');
    try {
      await onPasswordRecovery(email);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleAccountActivation = async () => {
    setIsLoading(true);
    setActionType('activation');
    try {
      await onAccountActivation(email);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Email ya registrado
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            El email <strong>{email}</strong> ya está registrado en nuestro sistema.
          </p>
          
          {validationResult.message && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-700">{validationResult.message}</p>
            </div>
          )}

          {validationResult.lastLogin && (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-600">
                Último acceso: {validationResult.lastLogin.toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {validationResult.canRecover && (
            <button
              onClick={handlePasswordRecovery}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && actionType === 'recovery' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando email...
                </span>
              ) : (
                'Recuperar contraseña'
              )}
            </button>
          )}

          {validationResult.canActivate && (
            <button
              onClick={handleAccountActivation}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && actionType === 'activation' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando activación...
                </span>
              ) : (
                'Activar cuenta'
              )}
            </button>
          )}

          <button
            onClick={onContinueRegistration}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Continuar con otro email
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ¿Necesitas ayuda? Contacta con nuestro soporte técnico.
          </p>
        </div>
      </div>
    </div>
  );
}; 