// @ts-nocheck
/**
 * WelcomePage - Página principal institucional de AiDuxCare
 * Diseño limpio y profesional con identidad corporativa
 * 
 * @version 2.0.0
 * @author AiDuxCare Development Team
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import aiduxcareLogo from '../assets/logo/aiduxcare-logo.svg';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <img
            src={aiduxcareLogo}
            alt="AiDuxCare Logo"
            className="mx-auto h-24 w-auto mb-8"
          />
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-4">
            Bienvenido a{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-medium">
              AiDuxCare
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema de documentación clínica inteligente para profesionales de la salud
          </p>
        </div>

        {/* Características principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentación Inteligente</h3>
            <p className="text-gray-600">Asistencia por IA para crear historiales clínicos precisos y completos</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguridad Garantizada</h3>
            <p className="text-gray-600">Cumplimiento de estándares de privacidad y protección de datos médicos</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eficiencia Máxima</h3>
            <p className="text-gray-600">Reducción del tiempo administrativo para enfocarte en tus pacientes</p>
          </div>
        </div>

        {/* Botón de acción */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="w-full max-w-md bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Iniciar Sesión
          </button>
        </div>

        {/* Información adicional */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            ¿Necesitas ayuda? Contacta a nuestro equipo de soporte
          </p>
        </div>
      </div>
    </div>
  );
}; 