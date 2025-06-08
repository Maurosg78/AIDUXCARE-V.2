/**
 * 🏠 Welcome Page - AiDuxCare V.2
 * Página de bienvenida profesional con diseño "Claridad Clínica"
 * Principios: Minimalismo Apple + Calidez jane.app + Paleta Oficial AIDUX
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #F9FAFB, #FFFFFF)' }}>
      {/* Header Profesional */}
      <header className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" 
              style={{ background: 'linear-gradient(to bottom right, #2C3E50, #5DA5A3)' }}
            >
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: '#2C3E50' }}>
                AiDuxCare
              </h1>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                EMR Inteligente + Copiloto Clínico
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/auth')}
              className="px-5 py-2 text-sm font-medium transition-colors rounded-lg"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2C3E50'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
            >
              Acceder
            </button>
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-3 text-white font-medium rounded-xl transition-all hover:transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#5DA5A3' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A8B89'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5DA5A3'}
            >
              Comenzar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Enfoque Apple */}
      <main className="relative px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge de Credibilidad */}
          <div 
            className="inline-flex items-center space-x-3 px-6 py-3 rounded-full text-sm font-medium mb-12"
            style={{ 
              backgroundColor: 'rgba(168, 230, 207, 0.15)', 
              color: '#5DA5A3',
              border: '1px solid rgba(168, 230, 207, 0.3)'
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Revolucionando la Fisioterapia con Inteligencia Artificial</span>
          </div>

          {/* Título Principal - Tipografía Apple */}
          <h1 
            className="text-6xl md:text-7xl font-light mb-8 leading-tight"
            style={{ color: '#2C3E50' }}
          >
            EMR Inteligente
            <br />
            <span 
              className="font-medium"
              style={{ 
                background: 'linear-gradient(to right, #5DA5A3, #A8E6CF)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              + Copiloto Clínico IA
            </span>
          </h1>

          {/* Propuesta de Valor Clara */}
          <p 
            className="text-xl mb-16 max-w-3xl mx-auto leading-relaxed"
            style={{ color: '#6B7280' }}
          >
            La primera plataforma que combina gestión inteligente de historiales clínicos con 
            asistencia de IA en tiempo real, diseñada específicamente para profesionales de 
            fisioterapia que buscan excelencia clínica.
          </p>

          {/* CTAs Principales */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <button
              onClick={() => navigate('/patient-data')}
              className="px-10 py-4 text-white text-lg font-semibold rounded-xl transition-all hover:transform hover:scale-105 shadow-xl"
              style={{ backgroundColor: '#5DA5A3' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4A8B89'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5DA5A3'}
            >
              Probar Demo Interactivo
            </button>
            
            <button
              onClick={() => navigate('/auth')} 
              className="px-10 py-4 text-lg font-semibold rounded-xl transition-all hover:transform hover:scale-105"
              style={{ 
                border: '2px solid #E5E7EB', 
                color: '#2C3E50',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5DA5A3';
                e.currentTarget.style.color = '#5DA5A3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#2C3E50';
              }}
            >
              Acceder al Portal Médico
            </button>
          </div>

          {/* Value Props - Minimalista */}
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center p-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-10 h-10" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#2C3E50' }}>
                Transcripción Inteligente
              </h3>
              <p style={{ color: '#6B7280' }}>
                Captura automática de sesiones con detección de highlights clínicos en tiempo real
              </p>
            </div>

            <div className="text-center p-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-10 h-10" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#2C3E50' }}>
                SOAP Automático
              </h3>
              <p style={{ color: '#6B7280' }}>
                Generación inteligente de documentación clínica siguiendo estándares profesionales
              </p>
            </div>

            <div className="text-center p-8">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-10 h-10" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#2C3E50' }}>
                Privacidad Total
              </h3>
              <p style={{ color: '#6B7280' }}>
                Almacenamiento local seguro, sin comprometer la confidencialidad del paciente
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Profesional */}
      <footer className="border-t py-12 px-6" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#5DA5A3' }}
            >
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-sm" style={{ color: '#6B7280' }}>
              © 2025 AiDuxCare. Tecnología para profesionales de la salud.
            </span>
          </div>
          
          <div className="text-sm" style={{ color: '#6B7280' }}>
            Descubre cómo transformamos tu práctica clínica
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;