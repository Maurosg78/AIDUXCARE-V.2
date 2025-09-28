// @ts-nocheck
/**
 * AccountActivationPage - Página de activación de cuenta
 * Procesa el token de activación enviado por email
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { emailActivationService, type ActivationResult, type ProfessionalRegistration } from '../services/emailActivationService';

import logger from '@/shared/utils/logger';

export const AccountActivationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activationStatus, setActivationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [professionalData, setProfessionalData] = useState<ProfessionalRegistration | null>(null);

  useEffect(() => {
    const activateAccount = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setActivationStatus('error');
        setMessage('Token de activación no encontrado. Verifica el enlace del email.');
        return;
      }

      try {
        const result: ActivationResult = await emailActivationService.activateAccount(token);
        
        if (result.success) {
          setActivationStatus('success');
          setMessage(result.message);
          
          // Obtener datos del profesional para mostrar
          if (result.professionalId) {
            const professional = await emailActivationService.getProfessional(result.professionalId);
            if (professional) {
              setProfessionalData(professional);
            }
          }
        } else {
          setActivationStatus('error');
          setMessage(result.message);
        }
      } catch (error) {
        logger.error('Error en activación:', error);
        setActivationStatus('error');
        setMessage('Error interno del sistema. Contacta soporte técnico.');
      }
    };

    activateAccount();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    navigate('/professional-workflow');
  };

  const renderContent = () => {
    switch (activationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Activando tu cuenta...
            </h2>
            <p className="text-gray-600">
              Procesando tu solicitud de activación
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Cuenta Activada Exitosamente!
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            {professionalData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Bienvenido, {professionalData.displayName}
                </h3>
                <div className="text-blue-800 text-sm space-y-1">
                  <p><strong>Especialidad:</strong> {professionalData.specialty}</p>
                  <p><strong>País:</strong> {professionalData.country}</p>
                  <p><strong>Email:</strong> {professionalData.email}</p>
                  <p><strong>Fecha de activación:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGoToDashboard}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ir al Dashboard
              </button>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Ir al Login
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error en la Activación
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                ¿Qué puedes hacer?
              </h3>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>• Verificar que el enlace del email esté completo</li>
                <li>• Intentar hacer clic en el enlace nuevamente</li>
                <li>• Contactar soporte si el problema persiste</li>
                <li>• Solicitar un nuevo email de activación</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ir al Login
              </button>
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">
            Activación de{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              Cuenta
            </span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed font-light">
            Procesando tu solicitud de activación
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          {renderContent()}
        </div>
      </div>

      <div className="text-center space-y-4 mt-6">
        <p className="text-sm text-gray-500">
          © 2025 AiDuxCare. Todos los derechos reservados.
        </p>
        <p className="text-xs text-gray-400">
          Sistema de activación seguro
        </p>
      </div>
    </div>
  );
}; 