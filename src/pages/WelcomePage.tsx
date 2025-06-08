/**
 * 🏠 Welcome Page - AiDuxCare V.2
 * Página de bienvenida profesional con diseño "Claridad Clínica"
 * Principios: Minimalismo Apple + Calidez jane.app + Valor Dual Claro
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #F9FAFB, #FFFFFF)' }}>
      {/* Header Profesional Minimalista */}
      <header className="relative px-8 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" 
              style={{ background: 'linear-gradient(135deg, #2C3E50, #5DA5A3)' }}
            >
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-tight" style={{ color: '#2C3E50' }}>
                AiDuxCare
              </h1>
              <p className="text-base tracking-wide" style={{ color: '#6B7280' }}>
                EMR Inteligente + Copiloto Clínico IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-3 text-base font-medium transition-all rounded-xl"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#2C3E50';
                e.currentTarget.style.backgroundColor = 'rgba(168, 230, 207, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6B7280';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Acceder
            </button>
            <button 
              onClick={() => navigate('/patient-data')}
              className="px-8 py-4 text-white font-semibold rounded-2xl transition-all shadow-lg"
              style={{ backgroundColor: '#5DA5A3' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4A8B89';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5DA5A3';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
            >
              Comenzar Demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Enfoque Apple Premium */}
      <main className="relative px-8 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge de Credibilidad Profesional */}
          <div 
            className="inline-flex items-center space-x-4 px-8 py-4 rounded-full text-base font-medium mb-16"
            style={{ 
              backgroundColor: 'rgba(168, 230, 207, 0.12)', 
              color: '#5DA5A3',
              border: '1px solid rgba(168, 230, 207, 0.25)'
            }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Revolucionando la Fisioterapia con Inteligencia Artificial</span>
          </div>

          {/* Título Principal - Comunicación de Valor Dual */}
          <h1 
            className="text-7xl md:text-8xl font-thin mb-6 leading-none tracking-tight"
            style={{ color: '#2C3E50' }}
          >
            EMR Inteligente
          </h1>
          
          <h2 
            className="text-6xl md:text-7xl font-medium mb-12 leading-none"
            style={{ 
              background: 'linear-gradient(135deg, #5DA5A3, #A8E6CF)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            + Copiloto Clínico IA
          </h2>

          {/* Propuesta de Valor Profesional */}
          <p 
            className="text-2xl mb-20 max-w-4xl mx-auto leading-relaxed font-light"
            style={{ color: '#6B7280' }}
          >
            La primera plataforma que une gestión inteligente de historiales médicos con 
            asistencia de inteligencia artificial en tiempo real. Diseñada exclusivamente 
            para profesionales de fisioterapia que buscan excelencia clínica.
          </p>

          {/* CTAs Principales Profesionales */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-24">
            <button
              onClick={() => navigate('/patient-data')}
              className="px-12 py-5 text-white text-xl font-semibold rounded-2xl transition-all shadow-xl"
              style={{ backgroundColor: '#5DA5A3' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4A8B89';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#5DA5A3';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
            >
              Probar Demo Interactivo
            </button>
            
            <button
              onClick={() => navigate('/auth')} 
              className="px-12 py-5 text-xl font-semibold rounded-2xl transition-all"
              style={{ 
                border: '2px solid #E5E7EB', 
                color: '#2C3E50',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5DA5A3';
                e.currentTarget.style.color = '#5DA5A3';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.color = '#2C3E50';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Portal Profesional
            </button>
          </div>

          {/* Value Props Profesionales - Grid Elegante */}
          <div className="grid md:grid-cols-3 gap-16 max-w-7xl mx-auto">
            <div className="text-center p-10 rounded-3xl transition-all" 
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-12 h-12" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
                Transcripción Inteligente
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: '#6B7280' }}>
                Captura automática de sesiones clínicas con detección de highlights en tiempo real
              </p>
            </div>

            <div className="text-center p-10 rounded-3xl transition-all" 
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-12 h-12" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
                SOAP Automático
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: '#6B7280' }}>
                Generación inteligente de documentación clínica siguiendo estándares profesionales
              </p>
            </div>

            <div className="text-center p-10 rounded-3xl transition-all" 
                 style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                   e.currentTarget.style.transform = 'translateY(-8px)';
                   e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = 'none';
                 }}>
              <div 
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8"
                style={{ backgroundColor: 'rgba(168, 230, 207, 0.15)' }}
              >
                <svg className="w-12 h-12" style={{ color: '#5DA5A3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#2C3E50' }}>
                Privacidad Total
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: '#6B7280' }}>
                Almacenamiento local seguro sin comprometer la confidencialidad del paciente
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Profesional Elegante */}
      <footer className="border-t py-16 px-8" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#5DA5A3' }}
            >
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-base" style={{ color: '#6B7280' }}>
              © 2025 AiDuxCare. Tecnología médica para profesionales de la salud.
            </span>
          </div>
          
          <div className="text-base font-medium" style={{ color: '#6B7280' }}>
            Descubre cómo transformamos tu práctica clínica
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;