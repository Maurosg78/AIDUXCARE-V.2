/**
 * 🏠 Home Page - AiDuxCare V.2
 * EMR con asistente IA - Paleta médica suave (como audio page)
 */

import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header Suave */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Marca Suave */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-700 tracking-tight">
                  AiDuxCare
                </div>
                <div className="text-xs text-gray-500 font-medium tracking-wider -mt-1">Asistente Clínico Inteligente</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link 
                to="/professional-workflow"
                className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
              >
                Portal Médico
              </Link>
              <Link 
                to="/audio-processing"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md"
              >
                Demo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Suave */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Efectos de fondo sutiles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Content Suave */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-teal-50 text-teal-700 mb-8 border border-teal-100">
                🩺 EMR con Inteligencia Artificial Médica
              </div>
              
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-8">
                <span className="text-slate-800">
                  Asistente IA
                </span>
                <br />
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  para Profesionales
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl">
                Mejoramos la <span className="text-teal-600 font-semibold">precisión diagnóstica</span> y reducimos 
                <span className="text-cyan-600 font-semibold"> puntos ciegos clínicos</span>. 
                El profesional de salud <span className="text-slate-700 font-semibold">siempre diagnostica y decide</span>. 
                Nosotros <span className="text-teal-600 font-semibold">cooperamos y ponemos las cartas sobre la mesa</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-12">
                <Link 
                  to="/professional-workflow"
                  className="group bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>Acceso al Sistema</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                    </svg>
                  </span>
                </Link>
                <Link 
                  to="/audio-processing"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-10 py-4 rounded-xl font-semibold text-lg border border-gray-200 hover:border-gray-300 transition-all"
                >
                  Ver IA en Acción
                </Link>
              </div>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
                <div className="flex items-center space-x-2 text-teal-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Asistencia IA Médica</span>
                </div>
                <div className="flex items-center space-x-2 text-cyan-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Documentación Automática</span>
                </div>
                <div className="flex items-center space-x-2 text-orange-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>HIPAA Compliant</span>
                </div>
              </div>
            </div>

            {/* Interface Demo Suave */}
            <div className="relative">
              <div className="relative">
                {/* Container principal suave */}
                <div className="bg-white rounded-3xl p-8 lg:p-12 border border-gray-200 shadow-xl">
                  {/* Mockup Interface */}
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Header Interface suave */}
                    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-xs font-medium text-gray-500">AiDuxCare v2.1</div>
                    </div>
                    
                    {/* Contenido Interface */}
                    <div className="p-6 space-y-4">
                      {/* IA Processing */}
                      <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
                        <div className="text-xs text-teal-700 font-medium mb-2 flex items-center">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 animate-pulse"></div>
                          IA ANALIZANDO CONSULTA
                        </div>
                        <div className="text-sm text-gray-600">&ldquo;Paciente varón, 45 años, dolor torácico súbito, disnea, antecedente HTA...&rdquo;</div>
                      </div>
                      
                      {/* IA Suggestions */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-xs text-gray-600 font-medium mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                          </svg>
                          SUGERENCIAS IA
                        </div>
                        <div className="text-sm text-gray-600">💡 Considerar: SCA - Solicitar ECG urgente</div>
                        <div className="text-sm text-gray-600">📋 SOAP pre-completado para revisión</div>
                        <div className="text-sm text-gray-600">⚠️ Alertas: Protocolo dolor torácico</div>
                      </div>
                      
                      {/* Progress bars suaves */}
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full w-full"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-gray-400 rounded-full w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Elementos flotantes suaves */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                
                <div className="absolute -bottom-4 -left-4 w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section Limpia */}
      <section className="py-20 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Impacto en la Práctica Médica
            </h2>
            <p className="text-gray-600">Métricas reales de asistencia clínica</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-teal-600 mb-2 group-hover:scale-110 transition-transform">
                +15%
              </div>
              <div className="text-gray-600">Precisión Diagnóstica</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-cyan-600 mb-2 group-hover:scale-110 transition-transform">
                -75%
              </div>
              <div className="text-gray-600">Tiempo Documentación</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-gray-600 mb-2 group-hover:scale-110 transition-transform">
                -60%
              </div>
              <div className="text-gray-600">Puntos Ciegos Clínicos</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl lg:text-5xl font-black text-orange-600 mb-2 group-hover:scale-110 transition-transform">
                24/7
              </div>
              <div className="text-gray-600">Asistencia Disponible</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Limpia */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
              Cómo Asistimos a los Profesionales
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              <span className="text-teal-600 font-semibold">Procesamos lenguaje natural médico</span>, 
              <span className="text-cyan-600 font-semibold"> identificamos patrones clínicos</span> y 
              <span className="text-orange-600 font-semibold"> sugerimos consideraciones diagnósticas</span>. 
              El profesional siempre tiene la decisión final.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-teal-300 transition-all hover:transform hover:-translate-y-2 shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Procesamiento de Voz Natural</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                IA que comprende jerga médica, acentos regionales y terminología específica. 
                Transcripción médica con <span className="text-teal-600 font-semibold">99.2% de precisión</span> en español e inglés.
              </p>
              <div className="flex items-center text-teal-600 font-medium">
                <span>Procesamiento en tiempo real</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-cyan-300 transition-all hover:transform hover:-translate-y-2 shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Asistente de Inferencia Clínica</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Algoritmos entrenados con millones de casos clínicos. Sugerencias diagnósticas, 
                alertas de medicamentos y protocolos automáticos <span className="text-cyan-600 font-semibold">en tiempo real</span>.
              </p>
              <div className="flex items-center text-cyan-600 font-medium">
                <span>Sugerencias inteligentes</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-3xl p-8 border border-gray-200 hover:border-orange-300 transition-all hover:transform hover:-translate-y-2 shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Infraestructura Médica Segura</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Arquitectura distribuida con encriptación de grado militar. Cumplimiento HIPAA 
                nativo, auditorías automáticas y <span className="text-orange-600 font-semibold">respaldo en tiempo real</span>.
              </p>
              <div className="flex items-center text-orange-600 font-medium">
                <span>Seguridad enterprise</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Suave */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Mejora tu Práctica Médica con IA
          </h2>
          <p className="text-xl text-teal-100 mb-10 leading-relaxed">
            Únete a profesionales de la salud que ya utilizan AiDuxCare para 
            <span className="text-white font-semibold"> mejorar la precisión diagnóstica</span> y 
            <span className="text-white font-semibold"> reducir tiempo de documentación</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/professional-workflow"
              className="bg-white text-teal-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Comenzar Ahora
            </Link>
            <Link 
              to="/audio-processing"
              className="bg-teal-700 text-white px-10 py-4 rounded-xl font-semibold text-lg border border-teal-500 hover:bg-teal-800 transition-all"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold">AiDuxCare</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                EMR con asistente de inteligencia artificial para profesionales de la salud. 
                Mejoramos la precisión diagnóstica y reducimos puntos ciegos clínicos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/professional-workflow" className="hover:text-white transition-colors">Portal Médico</Link></li>
                <li><Link to="/audio-processing" className="hover:text-white transition-colors">Demo IA</Link></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Documentación</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">API</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">Acerca de</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Privacidad</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Términos</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contacto</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AiDuxCare. Todos los derechos reservados. HIPAA Compliant.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 