/**
 * 🏥 AIDUXCARE - PÁGINA DE BIENVENIDA OFICIAL
 * Diseño optimizado para conversión en 6 segundos
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 overflow-hidden">
      {/* Elementos decorativos sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#5DA5A3]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#FF6F61]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Header minimalista */}
      <header className="relative z-10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <AiDuxCareLogo size="sm" />
            <button
              onClick={handleGetStarted}
              className="btn-primary px-4 py-2 text-sm"
            >
              Comenzar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Optimizado para pantalla completa */}
      <main className="relative z-10 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(100vh-200px)]">
            
            {/* Mensaje principal - Directo y poderoso */}
            <div className={`space-y-6 lg:space-y-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              
              {/* Badge de valor */}
              <div className="inline-flex items-center px-3 py-1.5 bg-[#5DA5A3]/20 text-[#2C3E50] rounded-full text-sm font-semibold">
                <span className="w-2 h-2 bg-[#5DA5A3] rounded-full mr-2 animate-pulse"></span>
                IA Médica Conversacional
              </div>
              
              {/* Mensaje principal - MUY DIRECTO */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#2C3E50] leading-tight">
                  Más paciente,
                  <br />
                  <span className="bg-gradient-to-r from-[#5DA5A3] to-[#A8E6CF] bg-clip-text text-transparent">
                    menos papeleo
                  </span>
                </h1>
                
                <p className="text-lg lg:text-xl text-[#2C3E50]/80 max-w-lg leading-relaxed">
                  Habla naturalmente con tu paciente. 
                  <span className="font-semibold text-[#5DA5A3]"> Nosotros documentamos todo</span> y 
                  generamos las notas SOAP automáticamente.
                </p>
              </div>

              {/* Beneficios clave - 3 puntos rápidos */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#5DA5A3] rounded-full"></div>
                  <span className="text-[#2C3E50] font-medium">Transcripción en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#A8E6CF] rounded-full"></div>
                  <span className="text-[#2C3E50] font-medium">Notas SOAP automáticas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[#FF6F61] rounded-full"></div>
                  <span className="text-[#2C3E50] font-medium">100% enfoque en el paciente</span>
                </div>
              </div>

              {/* CTA principal - MUY VISIBLE */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleGetStarted}
                  className="btn-primary text-lg px-8 py-3 group shadow-2xl hover:shadow-[#5DA5A3]/25"
                >
                  <span>Probar Gratis</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Indicadores de confianza */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm text-[#2C3E50]/60 pt-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#5DA5A3]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Sin instalación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#A8E6CF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>100% Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#FF6F61]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>Prueba 30 días</span>
                </div>
              </div>
            </div>

            {/* Mockup optimizado para pantalla */}
            <div className={`relative ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{animationDelay: '0.2s'}}>
              <div className="relative max-w-sm lg:max-w-md xl:max-w-lg mx-auto">
                
                {/* Dispositivo principal */}
                <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden border border-[#BDC3C7]/20">
                  
                  {/* Header del dispositivo */}
                  <div className="bg-gradient-to-r from-[#5DA5A3] to-[#4A8280] p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 lg:w-4 lg:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-white font-semibold text-sm lg:text-base">Sesión Activa</div>
                          <div className="text-white/80 text-xs lg:text-sm">María González</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#FF6F61] rounded-full animate-pulse"></div>
                        <span className="text-white text-xs lg:text-sm font-medium">REC</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido - Conversación en vivo */}
                  <div className="p-4 lg:p-6 space-y-3 lg:space-y-4 bg-gradient-to-b from-white to-[#F7F7F7] min-h-[250px] lg:min-h-[300px]">
                    
                    {/* Mensaje del fisioterapeuta */}
                    <div className="flex items-start space-x-2 lg:space-x-3">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-[#2C3E50] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">FT</span>
                      </div>
                      <div className="bg-[#2C3E50]/10 rounded-xl lg:rounded-2xl rounded-tl-sm p-2.5 lg:p-3 max-w-[80%]">
                        <p className="text-[#2C3E50] text-xs lg:text-sm">¿Cómo se siente el dolor lumbar hoy, María?</p>
                      </div>
                    </div>
                    
                    {/* Mensaje del paciente */}
                    <div className="flex items-start space-x-2 lg:space-x-3 justify-end">
                      <div className="bg-[#A8E6CF]/30 rounded-xl lg:rounded-2xl rounded-tr-sm p-2.5 lg:p-3 max-w-[80%]">
                        <p className="text-[#2C3E50] text-xs lg:text-sm">Mucho mejor, diría que un 3 de 10. Los ejercicios están funcionando muy bien.</p>
                      </div>
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-[#A8E6CF] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#2C3E50] text-xs font-bold">MG</span>
                      </div>
                    </div>
                    
                    {/* Indicador de transcripción */}
                    <div className="flex items-center justify-center space-x-2 py-1.5 lg:py-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-[#5DA5A3] rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-[#5DA5A3] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-[#5DA5A3] text-xs font-medium">Transcribiendo...</span>
                    </div>
                    
                    {/* Panel SOAP generándose */}
                    <div className="bg-[#5DA5A3]/10 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-[#5DA5A3]/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-3 h-3 lg:w-4 lg:h-4 text-[#5DA5A3]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[#2C3E50] font-semibold text-xs lg:text-sm">Generando SOAP...</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#2C3E50]/70">• Dolor evaluado: 3/10 (↓ mejoría significativa)</div>
                        <div className="text-xs text-[#2C3E50]/70">• Adherencia al tratamiento: Excelente</div>
                        <div className="text-xs text-[#2C3E50]/70">• Plan: Continuar ejercicios actuales</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Elementos flotantes de valor */}
                <div className="absolute -top-3 -right-3 lg:-top-4 lg:-right-4 bg-[#FF6F61] text-white px-2.5 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-bold shadow-lg">
                  ¡Automático!
                </div>
                <div className="absolute -bottom-3 -left-3 lg:-bottom-4 lg:-left-4 bg-[#5DA5A3] text-white px-2.5 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-bold shadow-lg">
                  Sin escribir
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer minimalista */}
      <footer className="relative z-10 pb-6 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#2C3E50]/60 text-sm">
            Únete a más de <span className="font-semibold text-[#5DA5A3]">500+ fisioterapeutas</span> que ya transformaron su práctica
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;