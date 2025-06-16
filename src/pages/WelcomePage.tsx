/**
 * 🏥 AIDUXCARE - PÁGINA DE BIENVENIDA COMPACTA
 * El primer AI-EMR diseñado para fortalecer a nuestro personal de salud
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const carouselSlides = [
    {
      title: "Transcripción Inteligente",
      description: "IA médica que comprende terminología clínica especializada",
      mockup: "transcription",
      highlight: "99.2% Precisión"
    },
    {
      title: "Análisis en Tiempo Real",
      description: "Detección automática de patrones y alertas médicas",
      mockup: "analysis",
      highlight: "Análisis Instantáneo"
    },
    {
      title: "Documentación SOAP",
      description: "Notas estructuradas generadas automáticamente",
      mockup: "soap",
      highlight: "Escritura Mínima"
    }
  ];

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 300);
    
    // Carrusel automático cada 5 segundos (más tiempo para leer)
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => (prev + 1) % carouselSlides.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
    if (isAuthenticated) {
      navigate('/clinical');
    } else {
      navigate('/auth');
    }
  };

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
              <AiDuxCareLogo size="md" variant="icon" />
              <div>
                <div className="text-xl font-bold text-slate-800">AiDuxCare</div>
                <div className="text-xs text-slate-500 font-medium">AI-EMR Platform</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/50">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700">Sistema Activo</span>
              </div>
              
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Acceder al Sistema
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Compacto - Todo visible en una pantalla */}
      <main className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Contenido Principal Compacto */}
            <div className={`space-y-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Badge principal */}
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#5DA5A3]/15 to-[#A8E6CF]/15 rounded-full border border-[#5DA5A3]/30">
                <div className="w-2 h-2 bg-[#5DA5A3] rounded-full animate-pulse mr-3"></div>
                <span className="text-sm font-bold text-[#2C3E50]">EL PRIMER AI-EMR PARA PERSONAL DE SALUD</span>
              </div>
              
              {/* Título principal más compacto */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-tight">
                  Más tiempo para los pacientes,
                  <span className="block bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] bg-clip-text text-transparent">
                    menos para el papeleo
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-slate-600 leading-relaxed font-medium max-w-xl">
                  El primer AI-EMR diseñado para <strong className="text-[#5DA5A3]">fortalecer a nuestro personal de salud</strong>. 
                  Transforma cada consulta en documentación clínica perfecta mediante inteligencia artificial especializada.
                </p>
              </div>

              {/* Características clave en línea */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 bg-white/70 px-4 py-2 rounded-lg border border-slate-200/50 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-slate-700">99.2% Precisión</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/70 px-4 py-2 rounded-lg border border-slate-200/50 shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-slate-700">Escritura Mínima</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/70 px-4 py-2 rounded-lg border border-slate-200/50 shadow-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-slate-700">60min Ahorro</span>
                </div>
              </div>

              {/* CTA compacto */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleGetStarted}
                  className="group bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white px-8 py-3 rounded-xl font-bold text-lg shadow-xl hover:shadow-[#5DA5A3]/30 hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center justify-center">
                    Comenzar Gratis
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>

              {/* Métricas de confianza compactas */}
              <div className="flex items-center space-x-8 pt-4 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3] text-lg">500+</span>
                  <span>Profesionales</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3] text-lg">24/7</span>
                  <span>Soporte</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3] text-lg">2min</span>
                  <span>Setup</span>
                </div>
              </div>
            </div>

            {/* Carrusel Explicativo Mejorado */}
            <div className={`relative ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.3s'}}>
              <div className="relative max-w-md mx-auto">
                
                {/* Dispositivo principal con carrusel */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50 transform hover:scale-105 transition-transform duration-500">
                  
                  {/* Header del sistema con título dinámico */}
                  <div className="bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{carouselSlides[currentSlide].title}</div>
                          <div className="text-white/90 text-xs">{carouselSlides[currentSlide].description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/20 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-bold">ACTIVO</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido dinámico del carrusel con transiciones horizontales suaves */}
                  <div className="bg-gradient-to-b from-white to-slate-50 h-80 relative overflow-hidden">
                    <div 
                      className={`absolute inset-0 p-4 space-y-4 transition-all duration-700 ease-in-out ${
                        isTransitioning 
                          ? 'opacity-0 transform translate-x-8' 
                          : 'opacity-1 transform translate-x-0'
                      }`}
                    >
                      {renderMockupContent(carouselSlides[currentSlide].mockup)}
                    </div>
                  </div>
                </div>
                
                {/* Elementos flotantes dinámicos */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FF6F61] to-[#E55A50] text-white px-3 py-1.5 rounded-lg font-bold shadow-lg text-sm transition-all duration-500">
                  {carouselSlides[currentSlide].highlight}
                </div>
                <div className="absolute -bottom-3 -left-3 bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white px-3 py-1.5 rounded-lg font-bold shadow-lg text-sm">
                  IA Médica
                </div>
                
                {/* Indicadores del carrusel mejorados */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {carouselSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleSlideChange(index)}
                      className={`h-2 rounded-full transition-all duration-500 hover:bg-[#4A8280] ${
                        index === currentSlide ? 'bg-[#5DA5A3] w-8' : 'bg-slate-300 w-2'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sección de beneficios compacta */}
      <section className="relative z-10 py-12 bg-gradient-to-r from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
              Diseñado para profesionales médicos exigentes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cada funcionalidad pensada para la realidad de la consulta médica
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Transcripción IA</h3>
              <p className="text-slate-600 text-sm">Comprende terminología médica especializada</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#A8E6CF] to-[#5DA5A3] rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">SOAP Automático</h3>
              <p className="text-slate-600 text-sm">Notas estructuradas en tiempo real</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-[#FF6F61] to-[#E55A50] rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ahorro Real</h3>
              <p className="text-slate-600 text-sm">60 minutos diarios para tus pacientes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer con CTA Potente */}
      <footer className="relative z-10 py-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          {/* CTA Principal del Footer */}
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
              ¿Listo para transformar tu práctica médica?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Únete a más de <strong className="text-white">500 profesionales</strong> que ya dedican más tiempo a sus pacientes y menos al papeleo
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] text-white px-10 py-4 rounded-2xl font-black text-xl shadow-2xl hover:shadow-[#5DA5A3]/30 hover:scale-105 transition-all duration-300"
              >
                <span className="flex items-center justify-center">
                  Comenzar Gratis Ahora
                  <svg className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              
              <div className="text-slate-400 text-sm">
                <div className="flex items-center space-x-4">
                  <span>✓ Sin tarjeta de crédito</span>
                  <span>✓ Setup en 2 minutos</span>
                  <span>✓ Soporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Información de la empresa */}
          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <AiDuxCareLogo size="sm" variant="icon" />
                <div className="text-2xl font-bold text-white">AiDuxCare</div>
              </div>
              <p className="text-slate-400 text-lg">
                <strong className="text-white">"Más tiempo para los pacientes, menos para el papeleo"</strong>
              </p>
              <p className="text-slate-500 text-sm">
                El primer AI-EMR diseñado para fortalecer a nuestro personal de salud
              </p>
              
              {/* Estadísticas finales */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-400 pt-4">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3]">500+</span>
                  <span>Profesionales activos</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3]">99.2%</span>
                  <span>Precisión clínica</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#5DA5A3]">60min</span>
                  <span>Ahorro diario promedio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;