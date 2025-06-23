/**
 * 🏠 WelcomePage - AiDuxCare V.2  
 * Página de bienvenida con presentación de funcionalidades
 * REFACTORIZADA: Usa hooks con cleanup automático para eliminar memory leaks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useInterval } from '@/hooks/useInterval';

// ============== INTERFACES ===============
interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  type: 'transcription' | 'analysis' | 'soap';
  features: string[];
}

// ============== COMPONENTE PRINCIPAL ===============
const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Datos del carrusel
  const carouselSlides: CarouselSlide[] = [
    {
      id: 'transcription',
      title: 'Transcripción Inteligente',
      description: 'Reconocimiento de voz especializado en terminología médica con IA avanzada',
      type: 'transcription',
      features: ['Reconocimiento en tiempo real', 'Terminología médica especializada', 'Múltiples hablantes']
    },
    {
      id: 'analysis',
      title: 'Análisis Clínico IA',
      description: 'Detección automática de patrones clínicos y alertas médicas inteligentes',
      type: 'analysis',
      features: ['Detección de patrones', 'Alertas automáticas', 'Análisis contextual']
    },
    {
      id: 'soap',
      title: 'Notas SOAP Automáticas',
      description: 'Generación automática de documentación clínica estructurada y profesional',
      type: 'soap',
      features: ['Generación automática', 'Estructura profesional', 'Revisión inteligente']
    }
  ];

  // ============== EFECTOS ===============
  
  // SEGURIDAD UAT: Logout forzado al cargar Welcome Page
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔒 Welcome Page: Forzando logout por seguridad UAT');
      logout();
    }
    setTimeout(() => setIsVisible(true), 300);
  }, [isAuthenticated, logout]);

  // REFACTORIZADO: Usar hook useInterval con cleanup automático
  useInterval(
    () => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % carouselSlides.length);
        setIsTransitioning(false);
      }, 500);
    },
    5000 // Carrusel cada 5 segundos
  );

  // ============== MANEJADORES ===============

  const handleSlideChange = (index: number) => {
    if (index !== currentSlide && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleGetStarted = () => {
    // NAVEGACIÓN UNIFICADA PARA UAT: Siempre ir a /auth
    navigate('/auth');
  };

  const handleDemoEnhanced = () => {
    // Navegar a la demostración de transcripción mejorada
    navigate('/enhanced-demo');
  };

  // ============== RENDER HELPERS ===============

  const renderMockupContent = (slideType: string) => {
    switch (slideType) {
      case 'transcription':
        return (
          <>
            {/* Conversación */}
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-[#2C3E50] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">DR</span>
                </div>
                <div className="bg-slate-100 rounded-lg rounded-tl-sm p-2 flex-1">
                  <p className="text-slate-800 text-xs">¿Cómo ha evolucionado el dolor?</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 justify-end">
                <div className="bg-gradient-to-r from-[#A8E6CF]/30 to-[#5DA5A3]/20 rounded-lg rounded-tr-sm p-2 max-w-[80%]">
                  <p className="text-slate-800 text-xs">Ha mejorado mucho, menos intenso.</p>
                </div>
                <div className="w-6 h-6 bg-gradient-to-r from-[#A8E6CF] to-[#5DA5A3] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">PC</span>
                </div>
              </div>
            </div>
            
            {/* Indicador de transcripción */}
            <div className="bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-lg p-3 border border-[#5DA5A3]/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-[#5DA5A3] rounded flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span className="text-slate-800 font-bold text-xs">Transcripción IA</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-700">Reconocimiento activo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-700">Terminología médica</span>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'analysis':
        return (
          <>
            {/* Análisis en tiempo real */}
            <div className="bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-lg p-3 border border-[#5DA5A3]/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-[#5DA5A3] rounded flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-slate-800 font-bold text-xs">Análisis IA</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-700">Evolución positiva detectada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-700">Síntomas específicos identificados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-700">Patrones clínicos reconocidos</span>
                </div>
              </div>
            </div>
            
            {/* Alertas médicas */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-slate-800 font-bold text-xs">Alertas Inteligentes</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Sin contraindicaciones detectadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span>Seguimiento recomendado en 2 semanas</span>
                </div>
              </div>
            </div>
          </>
        );
      
      case 'soap':
  return (
          <>
            {/* SOAP Preview */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-slate-800 font-bold text-xs">Nota SOAP</span>
                <div className="ml-auto bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs font-bold">✓ COMPLETA</div>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div><strong className="text-[#5DA5A3]">S:</strong> Paciente refiere mejoría significativa del dolor lumbar...</div>
                <div><strong className="text-[#5DA5A3]">O:</strong> Paciente colaborador, movilidad mejorada...</div>
                <div><strong className="text-[#5DA5A3]">A:</strong> Evolución favorable del cuadro álgico inicial...</div>
                <div><strong className="text-[#5DA5A3]">P:</strong> Continuar tratamiento actual, control en 2 semanas...</div>
              </div>
            </div>
            
            {/* Estadísticas de generación */}
            <div className="bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-lg p-3 border border-[#5DA5A3]/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-4 h-4 bg-[#5DA5A3] rounded flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-slate-800 font-bold text-xs">Generación Automática</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-slate-700">Generado en 2.3 segundos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-700">Listo para revisión</span>
                </div>
              </div>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  // ============== RENDER ===============

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 relative overflow-hidden">
      
      {/* Elementos de fondo sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#5DA5A3]/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-100/15 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Header compacto */}
      <header className="relative z-20 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AiDuxCareLogo size="sm" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900">AiDuxCare</h1>
                <p className="text-xs text-slate-600">Asistente Clínico Cognitivo con IA Especializada</p>
            </div>
          </div>
          
            <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/auth')}
                className="text-slate-600 hover:text-[#5DA5A3] font-medium text-sm transition-colors"
            >
                Iniciar Sesión
            </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sección principal con transición */}
      <main className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Contenido izquierdo */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-[#5DA5A3]/10 to-[#A8E6CF]/10 rounded-full border border-[#5DA5A3]/20">
                  <span className="text-[#5DA5A3] text-sm font-semibold">🚀 Asistente Clínico Cognitivo con IA Especializada</span>
          </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF]">Más tiempo con el paciente,</span>
                  <br />menos con el papeleo
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed">
                  La primera plataforma EMR con inteligencia artificial diseñada específicamente para profesionales de la salud. 
                  Transcripción inteligente, análisis clínico automatizado y documentación SOAP en segundos.
                </p>

                {/* LEMA OFICIAL AIDUXCARE */}
                <div className="bg-gradient-to-r from-[#5DA5A3]/5 to-[#A8E6CF]/5 rounded-lg p-4 border border-[#5DA5A3]/20">
                  <p className="text-[#5DA5A3] font-semibold text-lg italic text-center">
                    "Más tiempo con el paciente, menos con el papeleo"
                  </p>
                </div>
              </div>

              {/* Estadísticas destacadas */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5DA5A3]">95%</div>
                  <div className="text-sm text-slate-600">Precisión IA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5DA5A3]">60%</div>
                  <div className="text-sm text-slate-600">Tiempo Ahorrado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#5DA5A3]">24/7</div>
                  <div className="text-sm text-slate-600">Disponibilidad</div>
                </div>
              </div>

              {/* CTA Principal - INICIAR SESIÓN */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
                  onClick={handleGetStarted}
                  className="btn-primary px-8 py-4 text-lg font-semibold"
            >
                  Iniciar Sesión
            </button>
            
            <button
                  onClick={() => navigate('/enhanced-demo')}
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
                  🚀 Demo Transcripción Mejorada
            </button>
              </div>
            </div>

            {/* Contenido derecho - Carrusel mejorado */}
            <div className="lg:pl-8">
              <div className="relative">
                {/* Dispositivo mockup */}
                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                  {/* Header del dispositivo */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <div className="flex-1"></div>
                      <div className="text-xs text-slate-500 font-mono">aiduxcare.com</div>
              </div>
            </div>

                  {/* Contenido del carrusel */}
                  <div className="h-80 p-6 overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                      {renderMockupContent(carouselSlides[currentSlide].type)}
                    </div>
                  </div>
                </div>

                {/* Indicadores y navegación del carrusel */}
                <div className="mt-6 space-y-4">
                  {/* Información del slide actual */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {carouselSlides[currentSlide].title}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {carouselSlides[currentSlide].description}
                    </p>
                  </div>

                  {/* Indicadores de progreso */}
                  <div className="flex justify-center space-x-2">
                    {carouselSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        onClick={() => handleSlideChange(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'bg-[#5DA5A3] w-8' 
                            : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Features del slide actual */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {carouselSlides[currentSlide].features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-[#5DA5A3]/10 text-[#5DA5A3] text-xs font-medium rounded-full border border-[#5DA5A3]/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;