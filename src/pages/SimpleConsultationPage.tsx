/**
 * 🏥 SIMPLE CONSULTATION PAGE - Consulta Clínica Práctica
 * 
 * Página de consulta simplificada para MVP:
 * - Información básica del paciente
 * - Transcripción en tiempo real
 * - Generación de notas SOAP
 * - Navegación fluida
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '../components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';
import { localStorageService } from '@/services/LocalStorageService';
import AiDuxVirtualAssistant from '../components/chat/AiDuxVirtualAssistant';
import { GuideQuestionsService } from '../core/consultation/GuideQuestions';

interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  createdAt: string;
  updatedAt: string;
}

interface ConsultationState {
  patient: Patient | null;
  isRecording: boolean;
  transcription: string;
  soapNote: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  isGeneratingSOAP: boolean;
  consultationStarted: boolean;
  currentQuestionIndex: number;
  guideQuestions: any[];
  showGuideQuestions: boolean;
  questionResponses: Record<string, string>;
  transcriptionInterval: NodeJS.Timeout | null;
}

const SimpleConsultationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentTherapist } = useAuth();

  const [state, setState] = useState<ConsultationState>({
    patient: null,
    isRecording: false,
    transcription: '',
    soapNote: {
      subjective: '',
      objective: '',
      assessment: '',
      plan: ''
    },
    isGeneratingSOAP: false,
    consultationStarted: false,
    currentQuestionIndex: 0,
    guideQuestions: [],
    showGuideQuestions: false,
    questionResponses: {},
    transcriptionInterval: null
  });

  // Cargar datos del paciente y preguntas guía
  useEffect(() => {
    if (!patientId) {
      navigate('/clinical');
      return;
    }

    const patients = localStorageService.getAllPatients();
    const patient = patients.find(p => p.id === patientId);

    if (!patient) {
      alert('Paciente no encontrado');
      navigate('/clinical');
      return;
    }

    // Obtener preguntas guía basadas en la condición
    const questionSet = GuideQuestionsService.getQuestionsForCondition(patient.condition);
    const guideQuestions = questionSet ? questionSet.initialQuestions : [];

    setState(prev => ({ 
      ...prev, 
      patient,
      guideQuestions,
      showGuideQuestions: guideQuestions.length > 0
    }));
  }, [patientId, navigate]);

  // Limpiar intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (state.transcriptionInterval) {
        clearInterval(state.transcriptionInterval);
      }
    };
  }, [state.transcriptionInterval]);

  const handleStartConsultation = () => {
    setState(prev => ({ ...prev, consultationStarted: true }));
  };

  const handleNextQuestion = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, prev.guideQuestions.length - 1)
    }));
  };

  const handlePrevQuestion = () => {
    setState(prev => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0)
    }));
  };

  const handleQuestionResponse = (questionId: string, response: string) => {
    setState(prev => ({
      ...prev,
      questionResponses: {
        ...prev.questionResponses,
        [questionId]: response
      }
    }));
  };

  const toggleGuideQuestions = () => {
    setState(prev => ({ ...prev, showGuideQuestions: !prev.showGuideQuestions }));
  };

  const handleStartRecording = () => {
    // Limpiar intervalo anterior si existe
    if (state.transcriptionInterval) {
      clearInterval(state.transcriptionInterval);
    }

    setState(prev => ({ ...prev, isRecording: true, transcription: '' }));
    
    // Simulación de transcripción (en producción sería Web Speech API o Google Cloud)
    const sampleTexts = [
      "Paciente refiere dolor lumbar que ha mejorado significativamente desde la última sesión.",
      "Movilidad aumentada, puede realizar actividades diarias sin limitación importante.",
      "Dolor actual 3/10, previamente era 7/10.",
      "No presenta signos de alarma neurológica.",
      "Adherencia al tratamiento domiciliario buena."
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < sampleTexts.length) {
        setState(prev => ({
          ...prev,
          transcription: prev.transcription + (prev.transcription ? ' ' : '') + sampleTexts[currentIndex]
        }));
        currentIndex++;
      } else {
        clearInterval(interval);
        setState(prev => ({ ...prev, transcriptionInterval: null }));
      }
    }, 3000);

    setState(prev => ({ ...prev, transcriptionInterval: interval }));
  };

  const handleStopRecording = () => {
    // Limpiar intervalo de transcripción
    if (state.transcriptionInterval) {
      clearInterval(state.transcriptionInterval);
    }
    
    setState(prev => ({ 
      ...prev, 
      isRecording: false,
      transcriptionInterval: null
    }));
  };

  const handleGenerateSOAP = async () => {
    if (!state.transcription.trim()) {
      alert('No hay transcripción disponible para generar la nota SOAP');
      return;
    }

    setState(prev => ({ ...prev, isGeneratingSOAP: true }));

    // Simulación de generación SOAP (en producción sería IA real)
    setTimeout(() => {
      const soapNote = {
        subjective: "Paciente refiere dolor lumbar que ha mejorado significativamente desde la última sesión. Dolor actual 3/10, previamente era 7/10. Puede realizar actividades diarias sin limitación importante.",
        objective: "Paciente colaborador, movilidad aumentada. No presenta signos de alarma neurológica. Adherencia al tratamiento domiciliario buena. Examen físico sin hallazgos relevantes.",
        assessment: "Evolución favorable del cuadro álgico lumbar. Respuesta positiva al tratamiento instaurado. Sin complicaciones asociadas.",
        plan: "Continuar con tratamiento actual. Ejercicios domiciliarios según protocolo. Control en 2 semanas. Derivar a especialista si empeoramiento."
      };

      setState(prev => ({
        ...prev,
        soapNote,
        isGeneratingSOAP: false
      }));
    }, 2000);
  };

  const handleSaveConsultation = () => {
    // En producción, aquí se guardaría en la base de datos
    alert('Consulta guardada exitosamente');
    navigate('/clinical');
  };

  const handleBackToPatients = () => {
    navigate('/clinical');
  };

  const currentQuestion = state.guideQuestions[state.currentQuestionIndex];
  const progress = state.guideQuestions.length > 0 
    ? Math.round(((state.currentQuestionIndex + 1) / state.guideQuestions.length) * 100)
    : 0;

  if (!state.patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-[#2C3E50]">Cargando paciente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#A8E6CF]/10">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-[#BDC3C7]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToPatients}
                className="text-[#2C3E50] hover:text-[#5DA5A3] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-xl font-bold text-[#2C3E50]">Consulta - {state.patient.name}</h1>
                <p className="text-[#2C3E50]/60 text-sm">{currentTherapist?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {state.consultationStarted && (
                <button
                  onClick={handleSaveConsultation}
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={!state.soapNote.subjective}
                >
                  Guardar Consulta
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del Paciente */}
        <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">Información del Paciente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2C3E50]/70 mb-1">Nombre</label>
              <p className="text-[#2C3E50] font-medium">{state.patient.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C3E50]/70 mb-1">Edad</label>
              <p className="text-[#2C3E50]">{state.patient.age} años</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C3E50]/70 mb-1">Teléfono</label>
              <p className="text-[#2C3E50]">{state.patient.phone}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-[#2C3E50]/70 mb-1">Motivo de Consulta</label>
              <p className="text-[#2C3E50]">{state.patient.condition}</p>
            </div>
          </div>
        </div>

        {!state.consultationStarted ? (
          /* Pantalla de Inicio de Consulta */
          <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-8 text-center">
            <div className="w-16 h-16 bg-[#5DA5A3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[#2C3E50] mb-2">¿Listo para comenzar la consulta?</h3>
            <p className="text-[#2C3E50]/60 mb-6">
              La IA estará lista para transcribir y analizar la conversación en tiempo real
            </p>
            
            {state.guideQuestions.length > 0 && (
              <div className="mt-6 p-4 bg-[#5DA5A3]/10 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <svg className="w-5 h-5 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-[#5DA5A3] font-medium">Preguntas Guía Disponibles</span>
                </div>
                <p className="text-sm text-[#2C3E50]/70">
                  Tengo {state.guideQuestions.length} preguntas específicas para "{state.patient?.condition}" que optimizarán la consulta
                </p>
              </div>
            )}
            
            <button
              onClick={handleStartConsultation}
              className="btn-primary px-8 py-3 text-lg"
            >
              Iniciar Consulta
            </button>
          </div>
        ) : (
          /* Pantalla de Consulta Activa */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Transcripción con Preguntas Guía */}
            <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
              {/* Preguntas Guía */}
              {state.guideQuestions.length > 0 && state.showGuideQuestions && (
                <div className="bg-[#5DA5A3]/10 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-[#2C3E50]">Pregunta Guía {state.currentQuestionIndex + 1}/{state.guideQuestions.length}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#5DA5A3] h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#2C3E50]/60">{progress}%</span>
                    </div>
                  </div>
                  
                  {currentQuestion && (
                    <div>
                      <p className="text-[#2C3E50] font-medium mb-3">{currentQuestion.question}</p>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handlePrevQuestion}
                          disabled={state.currentQuestionIndex === 0}
                          className="px-3 py-1 text-sm bg-white border border-[#BDC3C7]/30 rounded hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                          ← Anterior
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          disabled={state.currentQuestionIndex === state.guideQuestions.length - 1}
                          className="px-3 py-1 text-sm bg-white border border-[#BDC3C7]/30 rounded hover:bg-[#F7F7F7] disabled:opacity-50"
                        >
                          Siguiente →
                        </button>
                        <button
                          onClick={toggleGuideQuestions}
                          className="px-3 py-1 text-sm text-[#5DA5A3] hover:text-[#4A8280] transition-colors"
                        >
                          Ocultar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle de Preguntas Guía */}
              {state.guideQuestions.length > 0 && !state.showGuideQuestions && (
                <button
                  onClick={toggleGuideQuestions}
                  className="w-full p-3 bg-[#5DA5A3]/10 border border-[#5DA5A3]/20 rounded-lg text-[#5DA5A3] hover:bg-[#5DA5A3]/20 transition-colors mb-4"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Mostrar Preguntas Guía ({state.guideQuestions.length})</span>
                  </div>
                </button>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#2C3E50]">Transcripción en Tiempo Real</h3>
                <div className="flex items-center space-x-2">
                  {state.isRecording && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-600 font-medium">Grabando</span>
                    </div>
                  )}
                  {!state.isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Iniciar Grabación
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      Detener
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-[#F7F7F7] rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {state.transcription ? (
                  <p className="text-[#2C3E50] leading-relaxed">{state.transcription}</p>
                ) : (
                  <p className="text-[#2C3E50]/40 italic">
                    {state.isRecording ? 'Escuchando...' : 'Presiona "Iniciar Grabación" para comenzar la transcripción'}
                  </p>
                )}
              </div>
              
              {state.transcription && (
                <div className="mt-4">
                  <button
                    onClick={handleGenerateSOAP}
                    disabled={state.isGeneratingSOAP}
                    className="btn-primary w-full py-3"
                  >
                    {state.isGeneratingSOAP ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generando Nota SOAP...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generar Nota SOAP
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Panel de Nota SOAP */}
            <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">Nota SOAP</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                    <span className="text-[#5DA5A3] font-bold">S</span>ubjetivo
                  </label>
                  <textarea
                    value={state.soapNote.subjective}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      soapNote: { ...prev.soapNote, subjective: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                    rows={3}
                    placeholder="Información subjetiva del paciente..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                    <span className="text-[#5DA5A3] font-bold">O</span>bjetivo
                  </label>
                  <textarea
                    value={state.soapNote.objective}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      soapNote: { ...prev.soapNote, objective: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                    rows={3}
                    placeholder="Observaciones objetivas..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                    <span className="text-[#5DA5A3] font-bold">A</span>ssessment
                  </label>
                  <textarea
                    value={state.soapNote.assessment}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      soapNote: { ...prev.soapNote, assessment: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                    rows={3}
                    placeholder="Evaluación y diagnóstico..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                    <span className="text-[#5DA5A3] font-bold">P</span>lan
                  </label>
                  <textarea
                    value={state.soapNote.plan}
                    onChange={(e) => setState(prev => ({
                      ...prev,
                      soapNote: { ...prev.soapNote, plan: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-[#BDC3C7]/30 rounded-md focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent"
                    rows={3}
                    placeholder="Plan de tratamiento..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asistente Virtual Flotante */}
      <AiDuxVirtualAssistant />
    </div>
  );
};

export default SimpleConsultationPage; 