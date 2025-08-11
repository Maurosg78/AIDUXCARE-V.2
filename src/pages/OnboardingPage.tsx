/**
 * 🚀 Onboarding Page - AiDuxCare V.2
 * Página de onboarding simplificado para Fase 1 MVP
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { legalConsentService } from '../services/legalConsentService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState({
    name: '',
    specialty: '',
    experience: '',
    useCase: ''
  });
  const [legalConsent, setLegalConsent] = useState({
    termsAccepted: false,
    privacyAccepted: false,
    medicalDisclaimerAccepted: false,
    consentTimestamp: null as Date | null
  });

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Bienvenido a AiDuxCare',
      description: 'Tu asistente IA para documentación clínica',
      icon: '🏥',
      completed: false
    },
    {
      id: 'profile',
      title: 'Tu Perfil Profesional',
      description: 'Configura tu especialidad y experiencia',
      icon: '👨‍⚕️',
      completed: false
    },
    {
      id: 'features',
      title: 'Funcionalidades Principales',
      description: 'Conoce las herramientas disponibles',
      icon: '🛠️',
      completed: false
    },
    {
      id: 'legal',
      title: 'Términos y Condiciones',
      description: 'Cláusula legal de uso de AiDuxCare',
      icon: '⚖️',
      completed: false
    },
    {
      id: 'demo',
      title: 'Demo Rápida',
      description: 'Prueba el sistema con un caso real',
      icon: '🎬',
      completed: false
    },
    {
      id: 'ready',
      title: '¡Listo para Empezar!',
      description: 'Comienza a usar AiDuxCare',
      icon: '✅',
      completed: false
    }
  ]);

  const handleNext = async () => {
    // Validar consentimiento legal en el paso 3
    if (currentStep === 3) {
      if (!legalConsent.termsAccepted || !legalConsent.privacyAccepted || !legalConsent.medicalDisclaimerAccepted) {
        alert('Debe aceptar todos los términos y condiciones para continuar.');
        return;
      }

      try {
        // Guardar consentimiento usando el servicio
        await legalConsentService.saveConsent({
          ...legalConsent,
          consentTimestamp: new Date(),
          userId: userProfile.name || 'anonymous',
          version: '1.0.0'
        });

        // Registrar timestamp del consentimiento
        setLegalConsent(prev => ({
          ...prev,
          consentTimestamp: new Date()
        }));

        console.log('✅ Consentimiento legal registrado exitosamente');
      } catch (error) {
        console.error('❌ Error al registrar consentimiento:', error);
        alert('Error al registrar el consentimiento. Por favor, intente nuevamente.');
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSteps((prev: OnboardingStep[]) => 
        prev.map((step: OnboardingStep, index: number) => 
          index === currentStep ? { ...step, completed: true } : step
        )
      );
    } else {
      navigate('/');
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🏥</div>
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido a AiDuxCare V.2</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tu asistente de IA especializado en documentación clínica. 
              Reduce el tiempo de documentación en un 70% mientras mantienes la precisión médica.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🎤</div>
                <h3 className="font-semibold text-blue-900">Transcripción Automática</h3>
                <p className="text-sm text-blue-700">Audio a texto en tiempo real</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-green-900">SOAP Automático</h3>
                <p className="text-sm text-green-700">Generación estructurada de notas</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold text-purple-900">Sugerencias IA</h3>
                <p className="text-sm text-purple-700">Recomendaciones clínicas inteligentes</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Tu Perfil Profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  id="name"
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dr. Juan Pérez"
                />
              </div>
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad
                </label>
                <select
                  id="specialty"
                  value={userProfile.specialty}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona tu especialidad</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="medicina-familiar">Medicina Familiar</option>
                  <option value="traumatologia">Traumatología</option>
                  <option value="rehabilitacion">Rehabilitación</option>
                  <option value="medicina-interna">Medicina Interna</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                  Años de Experiencia
                </label>
                <select
                  id="experience"
                  value={userProfile.experience}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, experience: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona tu experiencia</option>
                  <option value="0-2">0-2 años</option>
                  <option value="3-5">3-5 años</option>
                  <option value="6-10">6-10 años</option>
                  <option value="10+">Más de 10 años</option>
                </select>
              </div>
              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-2">
                  Caso de Uso Principal
                </label>
                <select
                  id="useCase"
                  value={userProfile.useCase}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, useCase: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona tu caso de uso</option>
                  <option value="consultas-rutina">Consultas de rutina</option>
                  <option value="evaluaciones-iniciales">Evaluaciones iniciales</option>
                  <option value="seguimientos">Seguimientos</option>
                  <option value="urgencias">Urgencias</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Funcionalidades Principales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🎤</span>
                  <h3 className="text-lg font-semibold">Grabación de Audio</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Graba consultas en tiempo real con calidad profesional (48kHz)
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Transcripción automática</li>
                  <li>• Identificación de hablantes</li>
                  <li>• Análisis de calidad de audio</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-lg font-semibold">Generación SOAP</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Estructura automática de notas clínicas SOAP
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Subjetivo automático</li>
                  <li>• Objetivo estructurado</li>
                  <li>• Assessment inteligente</li>
                  <li>• Plan personalizado</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-lg font-semibold">Sugerencias IA</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Recomendaciones clínicas basadas en evidencia
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Diagnósticos diferenciales</li>
                  <li>• Alertas de contraindicaciones</li>
                  <li>• Protocolos de tratamiento</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">📊</span>
                  <h3 className="text-lg font-semibold">Métricas y Analytics</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Seguimiento de productividad y calidad
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Tiempo de documentación</li>
                  <li>• Precisión de transcripción</li>
                  <li>• Uso de sugerencias</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Términos y Condiciones de Uso</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center">
              Por favor, lea atentamente los términos y condiciones de uso de AiDuxCare.
              Al continuar con el proceso de onboarding, usted acepta estar sujeto a estos términos.
            </p>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-4xl mx-auto">
              <div className="space-y-6">
                {/* Sección 1: Propósito y Alcance */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Propósito y Alcance</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    AiDuxCare es un asistente de Inteligencia Artificial diseñado para profesionales de la salud 
                    que desean optimizar su documentación clínica. El sistema está diseñado para:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Transcribir automáticamente consultas médicas</li>
                    <li>• Generar notas clínicas estructuradas (SOAP)</li>
                    <li>• Proporcionar sugerencias clínicas basadas en evidencia</li>
                    <li>• Mejorar la eficiencia en la documentación médica</li>
                  </ul>
                </div>

                {/* Sección 2: Responsabilidad Clínica */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Responsabilidad Clínica</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ IMPORTANTE:</p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• AiDuxCare es un asistente de IA y NO reemplaza el juicio clínico profesional</li>
                      <li>• El profesional de la salud mantiene la responsabilidad total sobre las decisiones clínicas</li>
                      <li>• Todas las sugerencias deben ser revisadas y validadas por el profesional</li>
                      <li>• El sistema no garantiza la precisión absoluta de las transcripciones o sugerencias</li>
                    </ul>
                  </div>
                </div>

                {/* Sección 3: Privacidad y Seguridad */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Privacidad y Seguridad de Datos</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    AiDuxCare está comprometido con la protección de datos médicos sensibles:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Cumplimiento con estándares HIPAA y GDPR</li>
                    <li>• Cifrado end-to-end de todos los datos clínicos</li>
                    <li>• Procesamiento local de audio cuando sea posible</li>
                    <li>• No almacenamiento de datos sensibles en servidores externos</li>
                    <li>• Auditoría completa de acceso a datos</li>
                  </ul>
                </div>

                {/* Sección 4: Uso Aceptable */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Uso Aceptable</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    El usuario se compromete a:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Utilizar el sistema únicamente para propósitos médicos legítimos</li>
                    <li>• Mantener la confidencialidad de las credenciales de acceso</li>
                    <li>• No compartir la cuenta con terceros</li>
                    <li>• Reportar inmediatamente cualquier uso no autorizado</li>
                    <li>• Cumplir con las regulaciones médicas locales aplicables</li>
                  </ul>
                </div>

                {/* Sección 5: Limitaciones */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Limitaciones del Servicio</h3>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• El sistema requiere conexión a internet para algunas funcionalidades</li>
                    <li>• La calidad de transcripción depende de la calidad del audio</li>
                    <li>• No se garantiza disponibilidad 100% del servicio</li>
                    <li>• El sistema puede no reconocer términos médicos muy especializados</li>
                  </ul>
                </div>

                {/* Sección 6: Terminación */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Terminación del Servicio</h3>
                  <p className="text-sm text-gray-700">
                    AiDuxCare se reserva el derecho de suspender o terminar el acceso al servicio en caso de:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Violación de estos términos y condiciones</li>
                    <li>• Uso fraudulento o malicioso del sistema</li>
                    <li>• Incumplimiento de regulaciones médicas</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md">
                <p className="text-sm text-blue-800 text-center mb-4">
                  Al hacer clic en &quot;Siguiente&quot;, usted confirma que ha leído, 
                  entendido y acepta estos términos y condiciones.
                </p>
                
                {/* Checkboxes de Consentimiento Legal */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      id="terms-accepted"
                      type="checkbox"
                      checked={legalConsent.termsAccepted}
                      onChange={(e) => setLegalConsent(prev => ({
                        ...prev,
                        termsAccepted: e.target.checked
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="terms-accepted" className="text-sm text-blue-800">
                      <strong>Acepto los Términos y Condiciones de Uso</strong><br/>
                      <span className="text-xs text-blue-600">
                        He leído y comprendo las condiciones de uso de AiDuxCare
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="privacy-accepted"
                      type="checkbox"
                      checked={legalConsent.privacyAccepted}
                      onChange={(e) => setLegalConsent(prev => ({
                        ...prev,
                        privacyAccepted: e.target.checked
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="privacy-accepted" className="text-sm text-blue-800">
                      <strong>Acepto la Política de Privacidad</strong><br/>
                      <span className="text-xs text-blue-600">
                        Autorizo el procesamiento de datos según la política de privacidad
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      id="medical-disclaimer-accepted"
                      type="checkbox"
                      checked={legalConsent.medicalDisclaimerAccepted}
                      onChange={(e) => setLegalConsent(prev => ({
                        ...prev,
                        medicalDisclaimerAccepted: e.target.checked
                      }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="medical-disclaimer-accepted" className="text-sm text-blue-800">
                      <strong>Acepto el Disclaimer Médico</strong><br/>
                      <span className="text-xs text-blue-600">
                        Entiendo que AiDuxCare es un asistente y no reemplaza mi juicio clínico
                      </span>
                    </label>
                  </div>
                </div>

                {legalConsent.consentTimestamp && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs text-green-700 text-center">
                      Consentimiento registrado: {legalConsent.consentTimestamp.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Demo Rápida</h2>
            <p className="text-center text-gray-600">
              Prueba el sistema con un caso clínico simulado
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Caso: Lumbalgia Crónica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Paciente:</h4>
                  <p className="text-sm text-blue-700">
                    María González, 45 años<br/>
                    Dolor lumbar crónico L4-L5<br/>
                    Cirugía previa (2023)
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Objetivo:</h4>
                  <p className="text-sm text-blue-700">
                    Evaluar progreso post-tratamiento<br/>
                    Ajustar plan de ejercicios<br/>
                    Documentar evolución
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                to="/professional-workflow"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎬 Ver Demo Completa
              </Link>
              <Link
                to="/audio-processing"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                🎤 Probar Audio
              </Link>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">¡Listo para Empezar!</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Has completado la configuración inicial. Ya puedes comenzar a usar AiDuxCare 
              para mejorar tu productividad clínica.
            </p>
            
            <div className="bg-green-50 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="font-semibold text-green-900 mb-2">Próximos Pasos:</h3>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>• Explora el workflow profesional</li>
                <li>• Prueba la grabación de audio</li>
                <li>• Revisa las sugerencias IA</li>
                <li>• Configura tus preferencias</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🏠 Ir al Dashboard
              </Link>
              <Link
                to="/professional-workflow"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                🏥 Comenzar Consulta
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep + 1} de {steps.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Saltar
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className="hidden md:block text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStep === steps.length - 1 ? 'Comenzar' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  );
};