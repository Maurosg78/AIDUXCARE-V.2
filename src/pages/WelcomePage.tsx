/**
 * HOME: WelcomePage - AiDuxCare V.2  
 * Página de bienvenida rediseñada con sistema de diseño moderno
 * 
 * PRINCIPIOS DE DISEÑO:
 * - Confianza silenciosa (menos es más)
 * - Elegancia y calidez humana
 * - Tecnología de punta con mejores prácticas
 * - Inspirado en Apple y clínicas premium
 * 
 * TECNOLOGÍA:
 * - CSS Custom Properties (Design Tokens)
 * - Animaciones suaves y profesionales
 * - Responsive design mobile-first
 * - Accesibilidad WCAG 2.1 AA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fdfc 0%, #ffffff 100%)' }}>
      {/* HERO SECTION */}
      <section style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <AiDuxCareLogo size="xl" />
        </div>
        
        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
          fontWeight: '700', 
          color: '#1a365d', 
          marginBottom: '24px',
          lineHeight: '1.2'
        }}>
          Más tiempo con el paciente, menos con el papeleo
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#4a5568', 
          marginBottom: '40px', 
          maxWidth: '600px', 
          margin: '0 auto 40px'
        }}>
          Tecnología de IA clínica que transforma consultas habladas en documentación médica estructurada
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/authentication')}
            style={{
              background: 'linear-gradient(135deg, #5DA5A3 0%, #4a9b99 100%)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(93, 165, 163, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(93, 165, 163, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(93, 165, 163, 0.3)';
            }}
          >
            Comenzar ahora
          </button>
          
          <button 
            onClick={() => navigate('/demo')}
            style={{
              background: 'transparent',
              color: '#5DA5A3',
              border: '2px solid #5DA5A3',
              padding: '14px 30px',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#5DA5A3';
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#5DA5A3';
            }}
          >
            Ver demostración
          </button>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section style={{ padding: '80px 20px', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1a365d', 
            marginBottom: '60px'
          }}>
            Cómo transformamos tu práctica clínica
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '40px', 
            marginBottom: '60px'
          }}>
            <div style={{ 
              padding: '40px 30px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #f8fdfc 0%, #ffffff 100%)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #5DA5A3 0%, #4a9b99 100%)',
                borderRadius: '20px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                🩺
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '16px' }}>
                Atención humana sin interrupciones
              </h3>
              <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                Mantén el contacto visual y la conexión con tus pacientes mientras 
                nuestra IA captura y organiza toda la información clínica relevante.
              </p>
            </div>

            <div style={{ 
              padding: '40px 30px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #f8fdfc 0%, #ffffff 100%)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #5DA5A3 0%, #4a9b99 100%)',
                borderRadius: '20px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                FORM
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '16px' }}>
                Documentación automática y precisa
              </h3>
              <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                Convierte conversaciones naturales en notas SOAP estructuradas, 
                diagnósticos y planes de tratamiento, listos para tu revisión.
              </p>
            </div>

            <div style={{ 
              padding: '40px 30px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #f8fdfc 0%, #ffffff 100%)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'linear-gradient(135deg, #5DA5A3 0%, #4a9b99 100%)',
                borderRadius: '20px',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}>
                💻
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '16px' }}>
                Tecnología que se adapta a ti
              </h3>
              <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                Compatible con tu flujo de trabajo actual, segura y diseñada 
                específicamente para el entorno clínico profesional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #f8fdfc 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1a365d', 
            marginBottom: '60px'
          }}>
            Beneficios para tu práctica
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: '800', 
                color: '#5DA5A3', 
                marginBottom: '16px'
              }}>
                70%
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '12px' }}>
                Reducción en tiempo de documentación
              </h3>
              <p style={{ color: '#4a5568' }}>
                Menos tiempo escribiendo, más tiempo con pacientes
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: '800', 
                color: '#5DA5A3', 
                marginBottom: '16px'
              }}>
                95%
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '12px' }}>
                Precisión en captura de datos
              </h3>
              <p style={{ color: '#4a5568' }}>
                Información clínica completa y estructurada
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: '800', 
                color: '#5DA5A3', 
                marginBottom: '16px'
              }}>
                100%
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '12px' }}>
                Cumplimiento normativo
              </h3>
              <p style={{ color: '#4a5568' }}>
                Estándares médicos y regulatorios garantizados
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '4rem', 
                fontWeight: '800', 
                color: '#5DA5A3', 
                marginBottom: '16px'
              }}>
                ∞
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a365d', marginBottom: '12px' }}>
                Mejor experiencia del paciente
              </h3>
              <p style={{ color: '#4a5568' }}>
                Consultas más fluidas y personalizadas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ padding: '80px 20px', backgroundColor: '#1a365d', color: 'white', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '20px' }}>
            ¿Listo para transformar tu práctica?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '40px', opacity: '0.9' }}>
            Únete a los profesionales que ya están dedicando más tiempo a sus pacientes
          </p>
          <button 
            onClick={() => navigate('/authentication')}
            style={{
              background: 'linear-gradient(135deg, #5DA5A3 0%, #4a9b99 100%)',
              color: 'white',
              border: 'none',
              padding: '18px 40px',
              borderRadius: '12px',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(93, 165, 163, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(93, 165, 163, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(93, 165, 163, 0.4)';
            }}
          >
            Comenzar ahora
          </button>
        </div>
      </section>
    </div>
  );
};

export default WelcomePage;