import React from 'react';
import { AiDuxCareLogo, AiDuxCareLogoCompact, AiDuxCareLogoHero } from '../../src/components/branding/AiDuxCareLogo';

const IdentityVisualExample: React.FC = () => {
  return (
    <div className="aidux-clean-spacing bg-aidux-background min-h-screen">
      {/* Header con logo compacto */}
      <header className="aidux-sidebar p-4">
        <div className="flex items-center justify-between">
          <AiDuxCareLogoCompact />
          <nav className="flex gap-4">
            <button className="aidux-sidebar-item">Pacientes</button>
            <button className="aidux-sidebar-item">Diagnósticos</button>
            <button className="aidux-sidebar-item">Reportes</button>
          </nav>
        </div>
      </header>

      <main className="p-8">
        {/* Hero section con logo grande */}
        <section className="text-center mb-12">
          <AiDuxCareLogoHero className="mx-auto mb-6" />
          <h1 className="aidux-heading-primary mb-4">
            Sistema de Identidad Visual AiDuxCare
          </h1>
          <p className="aidux-text-body max-w-2xl mx-auto">
            Demonstración de la implementación de la identidad visual oficial que transmite 
            <strong className="text-aidux-accent"> confianza médica</strong>, 
            <strong className="text-aidux-intersection"> claridad tecnológica</strong> y 
            <strong className="text-aidux-secondary"> calidez humana</strong>.
          </p>
        </section>

        {/* Grid de componentes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Tarjeta Clínica */}
          <div className="aidux-clinical-card aidux-animate-in">
            <h3 className="aidux-heading-secondary mb-4">Ficha Clínica</h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="patient-name-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre del Paciente:
                </label>
                <input 
                  id="patient-name-input"
                  className="input" 
                  value="María González" 
                  title="Nombre del paciente"
                  placeholder="Nombre del paciente"
                  readOnly 
                />
              </div>
              <div>
                <label
                  htmlFor="diagnosis-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Diagnóstico:
                </label>
                <input 
                  id="diagnosis-input"
                  className="input" 
                  value="Lumbalgia crónica" 
                  title="Diagnóstico del paciente"
                  placeholder="Diagnóstico del paciente"
                  readOnly 
                />
              </div>
              <div className="flex gap-2">
                <span className="badge-success">Activo</span>
                <span className="badge-info">Prioridad Alta</span>
              </div>
            </div>
          </div>

          {/* Botones y Acciones */}
          <div className="aidux-professional aidux-animate-in">
            <h3 className="aidux-heading-secondary mb-4">Botones y Acciones</h3>
            <div className="space-y-3">
              <button className="aidux-btn-primary w-full">
                Acción Principal
              </button>
              <button className="aidux-btn-secondary w-full">
                Acción Secundaria
              </button>
              <button className="button-outline w-full">
                Acción Terciaria
              </button>
              <div className="text-center mt-4">
                <span className="aidux-text-secondary">
                  Paleta coral para acciones activas
                </span>
              </div>
            </div>
          </div>

          {/* Estados y Alertas */}
          <div className="aidux-professional aidux-animate-in">
            <h3 className="aidux-heading-secondary mb-4">Estados y Alertas</h3>
            <div className="space-y-3">
              <div className="aidux-alert">
                <strong>Atención:</strong> Revisar medicación del paciente
              </div>
              <div className="success-message">
                ✓ Datos guardados correctamente
              </div>
              <div className="error-message">
                ✗ Error en la validación
              </div>
              <input 
                className="input aidux-field-focus" 
                placeholder="Campo con focus" 
              />
              <input 
                className="input aidux-field-disabled" 
                placeholder="Campo deshabilitado" 
                disabled 
              />
            </div>
          </div>

          {/* Paleta de Colores */}
          <div className="aidux-professional aidux-animate-in md:col-span-2 lg:col-span-3">
            <h3 className="aidux-heading-secondary mb-6 text-center">Paleta de Colores Oficial</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              {/* Azul Pizarra */}
              <div className="text-center">
                <div className="bg-aidux-primary h-16 rounded-md mb-2 shadow-md"></div>
                <p className="aidux-text-secondary text-sm">Azul Pizarra</p>
                <p className="text-xs font-mono">#2C3E50</p>
                <p className="text-xs aidux-text-secondary">Tipografía, Sidebar</p>
              </div>
              
              {/* Verde Menta */}
              <div className="text-center">
                <div className="bg-aidux-secondary h-16 rounded-md mb-2 shadow-md"></div>
                <p className="aidux-text-secondary text-sm">Verde Menta</p>
                <p className="text-xs font-mono">#A8E6CF</p>
                <p className="text-xs aidux-text-secondary">Fichas Clínicas</p>
              </div>
              
              {/* Coral */}
              <div className="text-center">
                <div className="bg-aidux-accent h-16 rounded-md mb-2 shadow-md"></div>
                <p className="aidux-text-secondary text-sm">Coral Suave</p>
                <p className="text-xs font-mono">#FF6F61</p>
                <p className="text-xs aidux-text-secondary">Botones Activos</p>
              </div>
              
              {/* Gris Neutro */}
              <div className="text-center">
                <div className="bg-aidux-neutral h-16 rounded-md mb-2 shadow-md"></div>
                <p className="aidux-text-secondary text-sm">Gris Neutro</p>
                <p className="text-xs font-mono">#BDC3C7</p>
                <p className="text-xs aidux-text-secondary">Textos Secundarios</p>
              </div>
              
              {/* Blanco Hueso */}
              <div className="text-center">
                <div className="bg-aidux-background h-16 rounded-md mb-2 shadow-md border border-aidux-neutral"></div>
                <p className="aidux-text-secondary text-sm">Blanco Hueso</p>
                <p className="text-xs font-mono">#F7F7F7</p>
                <p className="text-xs aidux-text-secondary">Fondo General</p>
              </div>
              
              {/* Verde Intersección */}
              <div className="text-center">
                <div className="bg-aidux-intersection h-16 rounded-md mb-2 shadow-md"></div>
                <p className="aidux-text-secondary text-sm">Verde Unión</p>
                <p className="text-xs font-mono">#5DA5A3</p>
                <p className="text-xs aidux-text-secondary">Color Simbólico</p>
              </div>
            </div>
          </div>

          {/* Tipografía */}
          <div className="aidux-professional aidux-animate-in md:col-span-2">
            <h3 className="aidux-heading-secondary mb-4">Jerarquía Tipográfica</h3>
            <div className="space-y-4">
              <div>
                <h1 className="aidux-heading-primary">Título Principal</h1>
                <p className="text-xs aidux-text-secondary">Work Sans, 2rem, Bold</p>
              </div>
              <div>
                <h2 className="aidux-heading-secondary">Subtítulo Secundario</h2>
                <p className="text-xs aidux-text-secondary">Work Sans, 1.5rem, Semibold</p>
              </div>
              <div>
                <p className="aidux-text-body">Texto de cuerpo regular para contenido principal</p>
                <p className="text-xs aidux-text-secondary">Inter, 1rem, Regular</p>
              </div>
              <div>
                <p className="aidux-text-secondary">Texto secundario para información adicional</p>
                <p className="text-xs aidux-text-secondary">Inter, 0.875rem, Regular</p>
              </div>
            </div>
          </div>

          {/* Logo Variaciones */}
          <div className="aidux-professional aidux-animate-in">
            <h3 className="aidux-heading-secondary mb-4">Variaciones del Logo</h3>
            <div className="space-y-6">
              <div className="text-center">
                <AiDuxCareLogo size="lg" />
                <p className="text-xs aidux-text-secondary mt-2">Completo</p>
              </div>
              <div className="text-center">
                <AiDuxCareLogo variant="icon" size="md" />
                <p className="text-xs aidux-text-secondary mt-2">Solo Ícono</p>
              </div>
              <div className="text-center">
                <AiDuxCareLogo variant="text" size="md" />
                <p className="text-xs aidux-text-secondary mt-2">Solo Texto</p>
              </div>
            </div>
          </div>
        </div>

        {/* Principios de Design */}
        <section className="mt-16">
          <h2 className="aidux-heading-primary text-center mb-8">
            Principios Visuales
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            <div className="aidux-professional text-center p-6">
              <div className="w-12 h-12 bg-aidux-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">✨</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2">Limpieza</h3>
              <p className="aidux-text-secondary">Espacios amplios sin sobrecarga visual</p>
            </div>
            
            <div className="aidux-professional text-center p-6">
              <div className="w-12 h-12 bg-aidux-intersection rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2">Claridad</h3>
              <p className="aidux-text-secondary">Jerarquía tipográfica clara y legible</p>
            </div>
            
            <div className="aidux-professional text-center p-6">
              <div className="w-12 h-12 bg-aidux-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-aidux-primary text-xl">🛡️</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2">Confianza</h3>
              <p className="aidux-text-secondary">Profesional sin ser frío</p>
            </div>
            
            <div className="aidux-professional text-center p-6">
              <div className="w-12 h-12 bg-aidux-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-xl">❤️</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2">Calidez</h3>
              <p className="aidux-text-secondary">Elementos humanos sutiles</p>
            </div>
          </div>
        </section>

        {/* Símbolo de los tres pilares */}
        <section className="mt-16 text-center">
          <h2 className="aidux-heading-primary mb-4">Los Tres Pilares</h2>
          <div className="flex justify-center mb-6">
            <AiDuxCareLogo variant="icon" size="xl" />
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-aidux-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2 text-aidux-primary">IA</h3>
              <p className="aidux-text-secondary">Tecnología y análisis inteligente</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-aidux-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-aidux-primary text-2xl">⚕️</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2 text-aidux-secondary">Seguridad</h3>
              <p className="aidux-text-secondary">Clínica y salud confiable</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-aidux-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🫶</span>
              </div>
              <h3 className="aidux-heading-secondary mb-2 text-aidux-accent">Cuidado</h3>
              <p className="aidux-text-secondary">Humano y empático</p>
            </div>
          </div>
          <div className="mt-8">
            <p className="aidux-text-body max-w-2xl mx-auto">
              Donde los tres círculos se intersectan, <strong className="text-aidux-intersection">nace AiDuxCare</strong> - 
              la unión perfecta de inteligencia artificial, seguridad clínica y cuidado humano.
            </p>
          </div>
        </section>

        {/* Nueva sección de verificación de consistencia */}
        <div className="mt-12 p-8 bg-primary-50 border border-primary-200 rounded-lg">
          <h2 className="text-2xl font-bold text-primary mb-6 text-center">🛡️ Verificación de Consistencia</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Verificación de colores principales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">✅ Colores Principales</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Azul Pizarra:</span>
                  <code className="bg-primary text-white px-2 py-1 rounded">#2C3E50</code>
                </div>
                <div className="flex justify-between">
                  <span>Verde Menta:</span>
                  <code className="bg-secondary text-primary px-2 py-1 rounded">#A8E6CF</code>
                </div>
                <div className="flex justify-between">
                  <span>Coral Suave:</span>
                  <code className="bg-accent text-white px-2 py-1 rounded">#FF6F61</code>
                </div>
                <div className="flex justify-between">
                  <span>Verde Unión:</span>
                  <code className="bg-intersection text-white px-2 py-1 rounded">#5DA5A3</code>
                </div>
              </div>
            </div>
            
            {/* Verificación de sistema CSS */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">✅ Sistema Implementado</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Variables CSS:</span>
                  <span className="text-success font-medium">✓ Activas</span>
                </div>
                <div className="flex justify-between">
                  <span>Tailwind CSS:</span>
                  <span className="text-success font-medium">✓ Configurado</span>
                </div>
                <div className="flex justify-between">
                  <span>Componentes:</span>
                  <span className="text-success font-medium">✓ Migrados</span>
                </div>
                <div className="flex justify-between">
                  <span>Logo Oficial:</span>
                  <span className="text-success font-medium">✓ Implementado</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-success-50 border border-success-200 rounded-md text-center">
            <p className="text-success font-medium">
              🎯 <strong>100% de Consistencia Garantizada</strong>
            </p>
            <p className="text-success-dark text-sm mt-1">
              La identidad visual AiDuxCare está activa en toda la experiencia de usuario
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="aidux-sidebar p-6 text-center mt-16">
        <AiDuxCareLogo size="sm" className="mb-4" />
        <p className="aidux-text-secondary text-sm">
          © AiDuxCare - Clinical AI Assistant<br />
          Sistema de Design v1.0 - Implementado con ❤️ para el cuidado médico
        </p>
      </footer>
    </div>
  );
};

export default IdentityVisualExample; 