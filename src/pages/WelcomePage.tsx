/**
 * 🏠 Welcome Page - AiDuxCare V.2
 * Página de bienvenida profesional con diseño "Claridad Clínica"
 * Construida con Sistema de Diseño Sistemático
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heading, Subheading, BodyText, HighlightText } from '../shared/components/UI/Typography';
import { Icon } from '../shared/components/UI/Icon';

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
              <Heading level="h3" className="mb-1">AiDuxCare</Heading>
              <BodyText className="!text-base">EMR Inteligente + Copiloto Clínico IA</BodyText>
            </div>
          </div>
          
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-3 text-base font-medium transition-all rounded-xl text-aidux-secondary hover:text-aidux-dark hover:bg-aidux-success/10"
            >
              Acceder
            </button>
            <button 
              onClick={() => navigate('/patient-data')}
              className="px-8 py-4 bg-aidux-primary text-white font-semibold rounded-2xl transition-all shadow-lg hover:bg-aidux-primary/90 hover:-translate-y-1 hover:shadow-xl"
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
          <div className="inline-flex items-center space-x-4 px-8 py-4 rounded-full mb-16 bg-aidux-success/12 border border-aidux-success/25">
            <Icon name="success" size="md" color="primary" />
            <HighlightText>Revolucionando la Fisioterapia con Inteligencia Artificial</HighlightText>
          </div>

          {/* Título Principal - Comunicación de Valor Dual */}
          <Heading level="h1" className="mb-6">EMR Inteligente</Heading>
          
          <Heading 
            level="h1" 
            className="mb-10 bg-gradient-to-r from-aidux-primary to-aidux-success bg-clip-text text-transparent"
          >
            + Copiloto Clínico IA
          </Heading>

          {/* Propuesta de Valor Profesional */}
          <BodyText className="mb-16 max-w-3xl mx-auto !text-xl">
            La primera plataforma que une gestión inteligente de historiales médicos con 
            asistencia de inteligencia artificial en tiempo real. Diseñada exclusivamente 
            para profesionales de fisioterapia que buscan excelencia clínica.
          </BodyText>

          {/* CTAs Principales Profesionales */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-24">
            <button
              onClick={() => navigate('/patient-data')}
              className="px-12 py-5 bg-aidux-primary text-white text-xl font-semibold rounded-2xl transition-all shadow-xl hover:bg-aidux-primary/90 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl"
            >
              Probar Demo Interactivo
            </button>
            
            <button
              onClick={() => navigate('/auth')} 
              className="px-12 py-5 text-xl font-semibold rounded-2xl transition-all border-2 border-gray-200 text-aidux-dark bg-white hover:border-aidux-primary hover:text-aidux-primary hover:-translate-y-1 hover:shadow-lg"
            >
              Portal Profesional
            </button>
          </div>

          {/* Value Props Profesionales - Grid Elegante */}
          <div className="grid md:grid-cols-3 gap-16 max-w-7xl mx-auto">
            {/* Transcripción Inteligente */}
            <div className="text-center p-10 rounded-3xl transition-all bg-white/60 hover:bg-white/90 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-aidux-success/15">
                <Icon name="ai" size="xl" color="primary" />
              </div>
              <Heading level="h4" className="mb-4">Transcripción Inteligente</Heading>
              <BodyText>
                Captura automática de sesiones clínicas con detección de highlights en tiempo real
              </BodyText>
            </div>

            {/* SOAP Automático */}
            <div className="text-center p-10 rounded-3xl transition-all bg-white/60 hover:bg-white/90 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-aidux-success/15">
                <Icon name="medical-record" size="xl" color="primary" />
              </div>
              <Heading level="h4" className="mb-4">SOAP Automático</Heading>
              <BodyText>
                Generación inteligente de documentación clínica siguiendo estándares profesionales
              </BodyText>
            </div>

            {/* Privacidad Total */}
            <div className="text-center p-10 rounded-3xl transition-all bg-white/60 hover:bg-white/90 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-aidux-success/15">
                <Icon name="success" size="xl" color="primary" />
              </div>
              <Heading level="h4" className="mb-4">Privacidad Total</Heading>
              <BodyText>
                Almacenamiento local seguro sin comprometer la confidencialidad del paciente
              </BodyText>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Profesional Elegante */}
      <footer className="border-t border-gray-200 py-16 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-aidux-primary">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <BodyText>
              © 2025 AiDuxCare. Tecnología médica para profesionales de la salud.
            </BodyText>
          </div>
          
          <BodyText className="font-medium">
            Descubre cómo transformamos tu práctica clínica
          </BodyText>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;