/**
 * 🏠 Página de Bienvenida - AiDuxCare V.2
 * Landing page que comunica el valor dual: EMR Inteligente + Copiloto Clínico IA
 * Implementación del wireframe: Hero + Valor Dual + Métricas + CTA Final
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Metric {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface Feature {
  title: string;
  description: string;
  icon: string;
  benefits: string[];
}

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isStartingDemo, setIsStartingDemo] = useState(false);

  // Métricas de impacto
  const metrics: Metric[] = [
    {
      value: "+15%",
      label: "Precisión Diagnóstica",
      description: "Mejora en la precisión diagnóstica con sugerencias basadas en evidencia",
      icon: "🎯"
    },
    {
      value: "-75%",
      label: "Tiempo de Documentación",
      description: "Reducción en tiempo dedicado a documentación manual",
      icon: "⏱️"
    },
    {
      value: "+40%",
      label: "Satisfacción Pacientes",
      description: "Aumento en la satisfacción del paciente por mayor atención personalizada",
      icon: "😊"
    },
    {
      value: "92%",
      label: "Adherencia Tratamientos",
      description: "Mejora en la adherencia a tratamientos recomendados",
      icon: "📋"
    }
  ];

  // Características del EMR vs Copiloto
  const emrFeatures: Feature = {
    title: "EMR Inteligente",
    description: "Sistema de gestión clínica que automatiza la documentación y organiza la información del paciente",
    icon: "📋",
    benefits: [
      "Transcripción automática de sesiones clínicas",
      "Generación de notas SOAP estructuradas",
      "Historial clínico centralizado y accesible",
      "Integración con protocolos clínicos estándar",
      "Exportación a formatos PDF y sistemas externos"
    ]
  };

  const copilotFeatures: Feature = {
    title: "Copiloto Clínico IA",
    description: "Asistente inteligente que proporciona sugerencias basadas en evidencia durante la sesión",
    icon: "🤖",
    benefits: [
      "Sugerencias de tratamiento en tiempo real",
      "Detección automática de contraindicaciones",
      "Referencias bibliográficas actualizadas",
      "Alertas de seguridad del paciente",
      "Análisis predictivo de respuesta al tratamiento"
    ]
  };

  const handleStartDemo = useCallback(async () => {
    setIsStartingDemo(true);
    
    // Simular preparación del demo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navegar a la nueva página completa del paciente
    navigate('/patient-data');
  }, [navigate]);

  const handleAccessPortal = useCallback(() => {
    // Navegar a la página de datos del paciente (nuevo flujo)
    navigate('/patient-data');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AiDuxCare</h1>
                <p className="text-xs text-gray-500">EMR + IA Clínica</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <button 
                onClick={handleAccessPortal}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Portal Médico
              </button>
              <button 
                onClick={handleStartDemo}
                disabled={isStartingDemo}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-75"
              >
                {isStartingDemo ? 'Preparando...' : 'Demo Interactivo'}
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-full mb-8">
              <span className="text-sm font-medium text-blue-700">🚀 Revolucionando la Fisioterapia con IA</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EMR Inteligente
              </span>
              <br />
              <span className="text-gray-900">+</span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Copiloto Clínico IA
              </span>
            </h1>

            {/* Descripción */}
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              La primera plataforma que combina gestión inteligente de historiales clínicos 
              con asistencia de IA en tiempo real, diseñada específicamente para profesionales 
              de fisioterapia que buscan excelencia clínica.
            </p>

            {/* CTAs Principales */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={handleStartDemo}
                disabled={isStartingDemo}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isStartingDemo ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Preparando Demo...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="mr-2">▶️</span>
                    Probar Demo Interactivo
                  </div>
                )}
              </button>
              
              <button
                onClick={handleAccessPortal}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-center">
                  <span className="mr-2">🏥</span>
                  Acceder al Portal Médico
                </div>
              </button>
            </div>

            {/* Indicador de Scroll */}
            <div className="flex flex-col items-center text-gray-400">
              <p className="text-sm mb-2">Descubre cómo transformamos tu práctica clínica</p>
              <div className="animate-bounce">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Valor Dual */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Título de Sección */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dos Potentes Herramientas en Una Sola Plataforma
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AiDuxCare integra lo mejor de ambos mundos: la eficiencia de un EMR automatizado 
              y la inteligencia de un asistente clínico experto.
            </p>
          </div>

          {/* Comparación EMR vs Copiloto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            
            {/* EMR Inteligente */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-3xl">{emrFeatures.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{emrFeatures.title}</h3>
                  <p className="text-gray-600">Gestión automatizada</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {emrFeatures.description}
              </p>
              
              <div className="space-y-3">
                {emrFeatures.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Copiloto Clínico IA */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-3xl">{copilotFeatures.icon}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{copilotFeatures.title}</h3>
                  <p className="text-gray-600">Asistencia inteligente</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {copilotFeatures.description}
              </p>
              
              <div className="space-y-3">
                {copilotFeatures.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Integración Visual */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Mejor Juntos</h3>
            <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
              La verdadera innovación está en la integración: mientras el EMR gestiona tu información, 
              el Copiloto IA te asiste en tiempo real para tomar las mejores decisiones clínicas.
            </p>
            <div className="flex items-center justify-center space-x-4 text-2xl">
              <span>📋</span>
              <span className="text-blue-200">+</span>
              <span>🤖</span>
              <span className="text-blue-200">=</span>
              <span>⚡</span>
            </div>
          </div>
        </div>
      </section>

      {/* Métricas de Impacto */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Título de Sección */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Resultados Medibles en Tu Práctica Clínica
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Datos reales de profesionales que ya han transformado su práctica con AiDuxCare
            </p>
          </div>

          {/* Grid de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-4xl mb-4">{metric.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">{metric.label}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{metric.description}</p>
              </div>
            ))}
          </div>

          {/* Credibilidad */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Datos basados en 6 meses de uso por parte de 150+ profesionales de fisioterapia
            </p>
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <div className="flex items-center">
                <span className="mr-2">📊</span>
                <span className="text-sm">Estudios longitudinales</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">🔍</span>
                <span className="text-sm">Validación externa</span>
              </div>
              <div className="flex items-center">
                <span className="mr-2">📈</span>
                <span className="text-sm">Mejora continua</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final Prominente */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para Transformar Tu Práctica Clínica?
          </h2>
          
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Únete a los profesionales que ya están revolucionando la fisioterapia con IA. 
            Experimenta el futuro de la atención clínica hoy mismo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartDemo}
              disabled={isStartingDemo}
              className="w-full sm:w-auto px-8 py-4 bg-white text-purple-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isStartingDemo ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
                  Iniciando Demo...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">🚀</span>
                  Comenzar Demo Gratis
                </div>
              )}
            </button>
            
            <button
              onClick={handleAccessPortal}
              className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white hover:text-purple-600 transition-all"
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">👨‍⚕️</span>
                Acceso Profesional
              </div>
            </button>
          </div>

          <div className="mt-8 text-blue-100 text-sm">
            <p>✓ Demo completamente funcional • ✓ Sin registros previos • ✓ Datos de ejemplo incluidos</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Información Corporativa */}
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold text-white">AiDuxCare</span>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Revolucionando la fisioterapia con la primera plataforma que combina 
                EMR inteligente y asistencia clínica de IA en tiempo real.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 AiDuxCare. Diseñado para profesionales de fisioterapia.
              </p>
            </div>

            {/* Enlaces Rápidos */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Acceso Rápido</h3>
              <div className="space-y-2">
                <button 
                  onClick={handleStartDemo}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Demo Interactivo
                </button>
                <button 
                  onClick={handleAccessPortal}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Portal Médico
                </button>
                <button 
                  onClick={() => navigate('/mvp-core')}
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Flujo MVP Core
                </button>
              </div>
            </div>

            {/* Información Técnica */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Tecnología</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div>🔒 Datos seguros y cifrados</div>
                <div>📱 Accesible desde cualquier dispositivo</div>
                <div>🌐 Integración con sistemas existentes</div>
                <div>🤖 IA basada en evidencia científica</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;