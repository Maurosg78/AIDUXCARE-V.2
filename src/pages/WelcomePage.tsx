/**
 * 🏠 Welcome Page - AiDuxCare V.2
 * Página de bienvenida profesional con diseño "Claridad Clínica"
 * Principios: Minimalismo Apple + Calidez jane.app
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Profesional */}
      <header className="relative px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #2C3E50, #5DA5A3)' }}>
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-blue-slate">AiDuxCare</h1>
              <p className="text-sm text-gray-500">EMR + IA Clínica</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-gray-600 hover:text-blue-slate transition-colors"
            >
              Acceder
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-2 bg-intersection-green text-white rounded-lg hover:bg-opacity-90 transition-all hover:transform hover:scale-105"
            >
              Comenzar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Enfoque Apple */}
      <main className="relative px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge de Credibilidad */}
          <div className="inline-flex items-center space-x-2 bg-mint-green bg-opacity-20 text-intersection-green px-4 py-2 rounded-full text-sm font-medium mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Revolucionando la Fisioterapia con IA</span>
          </div>

          {/* Título Principal - Tipografía Apple */}
          <h1 className="text-5xl md:text-6xl font-light text-blue-slate mb-6 leading-tight">
            EMR Inteligente
            <br />
            <span className="bg-gradient-to-r from-intersection-green to-mint-green bg-clip-text text-transparent font-medium">
              + Copiloto Clínico IA
            </span>
          </h1>

          {/* Propuesta de Valor Clara */}
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            La primera plataforma que combina gestión inteligente de historiales clínicos con 
            asistencia de IA en tiempo real, diseñada específicamente para profesionales de 
            fisioterapia que buscan excelencia clínica.
          </p>

          {/* CTAs Principales */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 bg-intersection-green text-white text-lg font-medium rounded-xl hover:bg-opacity-90 transition-all hover:transform hover:scale-105 shadow-lg"
            >
              🎯 Probar Demo Interactivo
            </button>
            
            <button
              onClick={() => navigate('/auth')} 
              className="px-8 py-4 border-2 border-gray-200 text-blue-slate text-lg font-medium rounded-xl hover:border-intersection-green hover:text-intersection-green transition-all"
            >
              📋 Acceder al Portal Médico
            </button>
          </div>

          {/* Value Props - Minimalista */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-mint-green bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-intersection-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-slate mb-2">Transcripción Inteligente</h3>
              <p className="text-gray-600">Captura automática de sesiones con detección de highlights clínicos en tiempo real</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-mint-green bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-intersection-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-slate mb-2">SOAP Automático</h3>
              <p className="text-gray-600">Generación inteligente de documentación clínica siguiendo estándares profesionales</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-mint-green bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-intersection-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-blue-slate mb-2">Privacidad Total</h3>
              <p className="text-gray-600">Almacenamiento local seguro, sin comprometer la confidencialidad del paciente</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Profesional */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-intersection-green flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm text-gray-500">© 2025 AiDuxCare. Tecnología para profesionales.</span>
          </div>
          
          <div className="text-sm text-gray-500">
            Descubre cómo transformamos tu práctica clínica
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;