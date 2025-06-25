/**
 * BOT: ASISTENTE AIDUX - COMPACTO Y FUNCIONAL
 * Asistente inteligente especializado en fisioterapia
 * Genera planes de ejercicios y sugerencias clínicas
 */

import React, { useState, useEffect } from 'react';

interface AiDuxAssistantProps {
  isVisible?: boolean;
  currentStep?: string;
  patientData?: any;
}

const AiDuxAssistant: React.FC<AiDuxAssistantProps> = ({ 
  isVisible = true, 
  currentStep = 'inicio',
  patientData 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'exercises' | 'suggestions'>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exercisePlan, setExercisePlan] = useState<string | null>(null);

  const tips = {
    inicio: "¡Hola! Soy AiDux. Puedo ayudarte con planes de ejercicios y sugerencias clínicas.",
    recording: "MIC: Escuchando... Puedo generar ejercicios específicos para la condición del paciente.",
    analysis: "AI: Analizando información clínica para sugerencias personalizadas.",
    soap: "NOTES: ¿Necesitas un plan de ejercicios para agregar al SOAP? Puedo generarlo."
  };

  const currentTip = tips[currentStep as keyof typeof tips] || tips.inicio;

  // Generar plan de ejercicios basado en la condición del paciente
  const generateExercisePlan = async () => {
    setIsGenerating(true);
    
    // Simular generación de plan de ejercicios
    setTimeout(() => {
      const condition = patientData?.condition || 'dolor lumbar';
      let plan = '';
      
      if (condition.toLowerCase().includes('lumbar') || condition.toLowerCase().includes('espalda')) {
        plan = `PLAN DE EJERCICIOS - DOLOR LUMBAR

RUNNER: FASE INICIAL (Semana 1-2):
• Ejercicios de respiración diafragmática: 3 series de 10 respiraciones
• Inclinación pélvica en decúbito supino: 2 series de 15 repeticiones
• Rodillas al pecho alternadas: 2 series de 10 por pierna
• Estiramiento de isquiotibiales: mantener 30 segundos, 3 repeticiones

💪 FASE PROGRESIVA (Semana 3-4):
• Puente glúteo: 3 series de 12 repeticiones
• Plancha modificada: mantener 20-30 segundos, 3 series
• Estiramiento del psoas: 30 segundos por lado, 2 series
• Fortalecimiento de transverso abdominal: 3 series de 10

TARGET: RECOMENDACIONES:
• Realizar 2-3 veces por semana
• Progresar gradualmente según tolerancia
• Evitar ejercicios que aumenten el dolor
• Reevaluación en 2 semanas

WARNING: PRECAUCIONES:
• Detener si hay aumento del dolor
• Mantener respiración durante ejercicios
• Calentar antes de iniciar rutina`;
      } else {
        plan = `PLAN DE EJERCICIOS PERSONALIZADO

TARGET: EJERCICIOS RECOMENDADOS:
• Movilización articular suave: 2 series de 10 movimientos
• Fortalecimiento progresivo: 3 series de 8-12 repeticiones
• Estiramientos específicos: mantener 30 segundos
• Ejercicios funcionales: según actividades diarias

NOTES: PROGRESIÓN:
• Semana 1-2: Enfoque en movilidad y control del dolor
• Semana 3-4: Introducir fortalecimiento gradual
• Semana 5+: Ejercicios funcionales avanzados

WARNING: PRECAUCIONES:
• Respetar límites de dolor
• Progresión gradual
• Reevaluación periódica`;
      }
      
      setExercisePlan(plan);
      setIsGenerating(false);
      setCurrentView('exercises');
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías mostrar una notificación de éxito
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : 'w-80 max-h-96'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Compacto */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">BOT:</span>
              </div>
              {!isMinimized && (
                <div>
                  <div className="text-white font-medium text-sm">AiDux</div>
                  <div className="text-purple-100 text-xs">Asistente Fisio</div>
                </div>
              )}
            </div>
            
            <button 
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        {!isMinimized && (
          <div className="p-4 max-h-80 overflow-y-auto">
            
            {/* Navegación de Vistas */}
            <div className="flex space-x-1 mb-4 bg-slate-100 rounded-lg p-1">
              <button 
                onClick={() => setCurrentView('chat')}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  currentView === 'chat' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                💬 Chat
              </button>
              <button 
                onClick={() => setCurrentView('exercises')}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  currentView === 'exercises' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                RUNNER: Ejercicios
              </button>
              <button 
                onClick={() => setCurrentView('suggestions')}
                className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  currentView === 'suggestions' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                💡 Tips
              </button>
            </div>

            {/* Vista Chat */}
            {currentView === 'chat' && (
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-700">{currentTip}</p>
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={generateExercisePlan}
                    disabled={isGenerating}
                    className="w-full px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <span>RUNNER:</span>
                        <span>Generar Plan de Ejercicios</span>
                      </>
                    )}
                  </button>
                  
                  <button className="w-full px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
                    <span>NOTES:</span>
                    <span>Sugerencias SOAP</span>
                  </button>
                </div>
              </div>
            )}

            {/* Vista Ejercicios */}
            {currentView === 'exercises' && (
              <div className="space-y-3">
                {exercisePlan ? (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                        {exercisePlan}
                      </pre>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => copyToClipboard(exercisePlan)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copiar</span>
                      </button>
                      
                      <button 
                        onClick={generateExercisePlan}
                        className="flex-1 px-3 py-2 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">RUNNER:</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      No hay plan de ejercicios generado
                    </p>
                    <button 
                      onClick={generateExercisePlan}
                      className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Generar Plan
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Vista Sugerencias */}
            {currentView === 'suggestions' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">💡 Evaluación</h4>
                    <p className="text-xs text-blue-600">
                      Considera pruebas de movilidad y fuerza específicas para la condición
                    </p>
                  </div>
                  
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-emerald-700 mb-1">TARGET: Objetivos</h4>
                    <p className="text-xs text-emerald-600">
                      Establecer metas SMART: específicas, medibles y alcanzables
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-amber-700 mb-1">WARNING: Precauciones</h4>
                    <p className="text-xs text-amber-600">
                      Monitorear signos de alarma y adaptar tratamiento según respuesta
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiDuxAssistant; 