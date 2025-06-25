/**
 * 🏥 SimpleConsultationPage - AiDuxCare V.2  
 * Página de consulta simplificada con transcripción y análisis IA
 * REFACTORIZADA: Usa servicios centralizados para eliminar memory leaks
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import AiDuxVirtualAssistant from '@/components/chat/AiDuxVirtualAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { localStorageService } from '@/services/LocalStorageService';
import { GuideQuestionsService } from '@/core/consultation/GuideQuestions';
import TranscriptionService from '@/services/core/TranscriptionService';
// ============== INTERFACES ===============
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

interface GuideQuestion {
  id: string;
  question: string;
  rationale?: string;
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
  guideQuestions: GuideQuestion[];
  showGuideQuestions: boolean;
  questionResponses: Record<string, string>;
  recordingTime: number;
}

// ============== COMPONENTE PRINCIPAL ===============
const SimpleConsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
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
    showGuideQuestions: true,
    questionResponses: {},
    recordingTime: 0
  });

  // Servicio de transcripción centralizado
  const [transcriptionService] = useState(() => TranscriptionService.getInstance());

  // ============== EFECTOS ===============
  
  // Cargar datos del paciente y configurar servicio
  useEffect(() => {
    try {
      console.log('🏥 SimpleConsultationPage: Iniciando carga de paciente', { patientId });
      
      if (!patientId) {
        console.warn('WARNING: No se proporcionó patientId, navegando a /clinical');
        navigate('/clinical');
        return;
      }

      const patients = localStorageService.getAllPatients();
      console.log('STATS: Pacientes encontrados:', patients.length);
      
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        console.error('ERROR: Paciente no encontrado:', patientId);
        alert('Paciente no encontrado');
        navigate('/clinical');
        return;
      }

      console.log('SUCCESS: Paciente cargado:', patient.name);

      // Obtener preguntas guía basadas en la condición
      try {
        const questionSet = GuideQuestionsService.getQuestionsForCondition(patient.condition);
        const guideQuestions = questionSet ? questionSet.initialQuestions : [];
        console.log('📝 Preguntas guía cargadas:', guideQuestions.length);

        setState(prev => ({ 
          ...prev, 
          patient,
          guideQuestions,
          showGuideQuestions: guideQuestions.length > 0
        }));
      } catch (error) {
        console.error('ERROR: Error cargando preguntas guía:', error);
        // Continuar sin preguntas guía
        setState(prev => ({ 
          ...prev, 
          patient,
          guideQuestions: [],
          showGuideQuestions: false
        }));
      }

      // Configurar servicio de transcripción con manejo de errores
      try {
        transcriptionService.configure({
          language: 'es',
          simulationMode: true,
          enableSpeakerDetection: true
        });

        // Configurar callbacks del servicio
        transcriptionService.setCallbacks({
          onStateChange: (transcriptionState) => {
            setState(prev => ({
              ...prev,
              isRecording: transcriptionState.isRecording,
              transcription: transcriptionState.currentText,
              recordingTime: transcriptionState.recordingTime
            }));
          },
          onSegmentComplete: (segment) => {
            console.log('AUDIO: Nuevo segmento transcrito:', segment.content);
          },
          onError: (error) => {
            console.error('ERROR: Error en transcripción:', error);
            // No mostrar alert que puede causar problemas
            console.warn('Transcripción con errores, continuando...');
          }
        });
        
        console.log('AUDIO: Servicio de transcripción configurado correctamente');
      } catch (error) {
        console.error('ERROR: Error configurando transcripción:', error);
        // Continuar sin transcripción
      }

    } catch (error) {
      console.error('ERROR: Error crítico en SimpleConsultationPage useEffect:', error);
      // En caso de error crítico, navegar de vuelta
      navigate('/clinical');
    }

    // Cleanup al desmontar
    return () => {
      try {
        transcriptionService.cleanup();
      } catch (error) {
        console.error('ERROR: Error en cleanup:', error);
      }
    };
  }, [patientId, navigate, transcriptionService]);

  // ============== MANEJADORES ===============

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

  // REFACTORIZADO: Usar servicio centralizado
  const handleStartRecording = async () => {
    try {
      await transcriptionService.startRecording();
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      alert('Error al iniciar la grabación');
    }
  };

  // REFACTORIZADO: Usar servicio centralizado
  const handleStopRecording = async () => {
    try {
      const segments = await transcriptionService.stopRecording();
      console.log('TARGET: Transcripción completada:', segments.length, 'segmentos');
    } catch (error) {
      console.error('Error deteniendo grabación:', error);
      alert('Error al detener la grabación');
    }
  };

  const handleGenerateSOAP = async () => {
    if (!state.transcription.trim()) {
      alert('No hay transcripción disponible para generar la nota SOAP');
      return;
    }

    setState(prev => ({ ...prev, isGeneratingSOAP: true }));

    // Simulación mejorada de generación SOAP
    await new Promise(resolve => setTimeout(resolve, 2000));

    const soapNote = {
      subjective: "Paciente refiere dolor lumbar que ha mejorado significativamente desde la última sesión. Dolor actual 3/10, previamente era 7/10. Puede realizar actividades diarias sin limitación importante.",
      objective: "Paciente colaborador, movilidad aumentada. No presenta signos de alarma neurológica. Adherence al tratamiento domiciliario buena. Examen físico sin hallazgos relevantes.",
      assessment: "Evolución favorable del cuadro álgico lumbar. Respuesta positiva al tratamiento instaurado. Sin complicaciones asociadas.",
      plan: "Continuar con tratamiento actual. Ejercicios domiciliarios según protocolo. Control en 2 semanas. Derivar a especialista si empeoramiento."
    };

    setState(prev => ({
      ...prev,
      soapNote,
      isGeneratingSOAP: false
    }));
  };

  const handleSaveConsultation = () => {
    // En producción, aquí se guardaría en la base de datos
    alert('Consulta guardada exitosamente');
    navigate('/clinical');
  };

  const handleBackToPatients = () => {
    // Limpiar servicio antes de navegar
    transcriptionService.cleanup();
    navigate('/clinical');
  };

  // Formatear tiempo de grabación
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============== RENDER ===============

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
                <>
                  {state.isRecording && (
                    <div className="flex items-center space-x-2 text-red-500">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">{formatTime(state.recordingTime)}</span>
                    </div>
                  )}
                  <button
                    onClick={handleSaveConsultation}
                    className="btn-primary px-4 py-2 text-sm"
                    disabled={!state.soapNote.subjective}
                  >
                    Guardar Consulta
                  </button>
                </>
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
            {/* Panel de Transcripción */}
            <div className="space-y-6">
              {/* Controles de Grabación */}
              <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#2C3E50]">Transcripción en Tiempo Real</h3>
                  <div className="flex items-center space-x-2">
                    {!state.isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        AUDIO: Iniciar Grabación
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        STOP: Detener Grabación
                      </button>
                    )}
                  </div>
                </div>

                {/* Área de Transcripción */}
                <div className="bg-[#F8F9FA] border border-[#BDC3C7]/20 rounded-lg p-4 min-h-[200px]">
                  {state.transcription ? (
                    <p className="text-[#2C3E50] leading-relaxed">{state.transcription}</p>
                  ) : (
                    <p className="text-[#2C3E50]/50 italic">
                      {state.isRecording 
                        ? "Escuchando... La transcripción aparecerá aquí en tiempo real"
                        : "Presiona 'Iniciar Grabación' para comenzar la transcripción"
                      }
                    </p>
                  )}
                </div>

                {/* Botón Generar SOAP */}
                {state.transcription && (
                  <div className="mt-4">
                    <button
                      onClick={handleGenerateSOAP}
                      disabled={state.isGeneratingSOAP}
                      className="btn-primary px-4 py-2 text-sm w-full"
                    >
                      {state.isGeneratingSOAP ? 'Generando SOAP...' : '📝 Generar Nota SOAP'}
                    </button>
                  </div>
                )}
              </div>

              {/* Preguntas Guía */}
              {state.guideQuestions.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#2C3E50]">Preguntas Guía</h3>
                    <button
                      onClick={toggleGuideQuestions}
                      className="text-[#5DA5A3] hover:text-[#4A8B89] transition-colors"
                    >
                      {state.showGuideQuestions ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {state.showGuideQuestions && currentQuestion && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#2C3E50]/60">
                          Pregunta {state.currentQuestionIndex + 1} de {state.guideQuestions.length}
                        </span>
                        <div className="w-32 bg-[#F1F2F6] rounded-full h-2">
                          <div 
                            className="bg-[#5DA5A3] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-[#5DA5A3]/10 border border-[#5DA5A3]/20 rounded-lg p-4">
                        <p className="text-[#2C3E50] font-medium">{currentQuestion.question}</p>
                        {currentQuestion.rationale && (
                          <p className="text-[#2C3E50]/60 text-sm mt-2">{currentQuestion.rationale}</p>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <button
                          onClick={handlePrevQuestion}
                          disabled={state.currentQuestionIndex === 0}
                          className="text-[#5DA5A3] hover:text-[#4A8B89] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Anterior
                        </button>
                        <button
                          onClick={handleNextQuestion}
                          disabled={state.currentQuestionIndex === state.guideQuestions.length - 1}
                          className="text-[#5DA5A3] hover:text-[#4A8B89] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Siguiente →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel de Nota SOAP */}
            <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">Nota SOAP</h3>
              
              {state.isGeneratingSOAP ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-[#2C3E50]">Generando nota SOAP con IA...</span>
                </div>
              ) : state.soapNote.subjective ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#2C3E50] mb-2">Subjetivo (S)</h4>
                    <p className="text-[#2C3E50]/80 bg-[#F8F9FA] p-3 rounded border">{state.soapNote.subjective}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2C3E50] mb-2">Objetivo (O)</h4>
                    <p className="text-[#2C3E50]/80 bg-[#F8F9FA] p-3 rounded border">{state.soapNote.objective}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2C3E50] mb-2">Evaluación (A)</h4>
                    <p className="text-[#2C3E50]/80 bg-[#F8F9FA] p-3 rounded border">{state.soapNote.assessment}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#2C3E50] mb-2">Plan (P)</h4>
                    <p className="text-[#2C3E50]/80 bg-[#F8F9FA] p-3 rounded border">{state.soapNote.plan}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#5DA5A3]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#5DA5A3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#2C3E50]/60">
                    La nota SOAP se generará automáticamente cuando haya transcripción disponible
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Asistente Virtual */}
      <AiDuxVirtualAssistant />
    </div>
  );
};

export default SimpleConsultationPage; 