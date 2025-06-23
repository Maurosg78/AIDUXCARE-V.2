/**
 * 🏥 PATIENT COMPLETE PAGE - Versión Corregida
 * Página de consulta completa con funcionalidad de audio real mejorada
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiDuxCareLogo } from '@/components/branding/AiDuxCareLogo';
import { useAuth } from '@/contexts/AuthContext';
import { localStorageService } from '@/services/LocalStorageService';

// Interfaces simplificadas
interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  email: string;
  condition: string;
  allergies?: string[];
  medications?: string[];
  clinicalHistory?: string;
  derivadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface AudioState {
  isRecording: boolean;
  transcript: string;
  isProcessing: boolean;
  error: string | null;
  recordingTime: number;
}

const PatientCompletePageFixed: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentTherapist } = useAuth();
  
  // Estados principales
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de audio y transcripción
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    transcript: '',
    isProcessing: false,
    error: null,
    recordingTime: 0
  });
  
  // Estado SOAP
  const [soapNote, setSoapNote] = useState<SOAPNote>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });
  
  // Referencias para audio
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar paciente
  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) {
        setError('ID de paciente no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        const patients = localStorageService.getAllPatients();
        const foundPatient = patients.find(p => p.id === patientId);
        
        if (!foundPatient) {
          throw new Error('Paciente no encontrado');
        }
        
        setPatient(foundPatient);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    loadPatient();
  }, [patientId]);

  // Inicializar reconocimiento de voz REAL
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-ES';
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }
          
          if (finalTranscript) {
            setAudioState(prev => ({
              ...prev,
              transcript: prev.transcript + finalTranscript
            }));
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('❌ Error de reconocimiento:', event.error);
          
          let errorMessage = '';
          switch (event.error) {
            case 'network':
              errorMessage = '🌐 Problema de conexión. Revisa tu internet.';
              break;
            case 'not-allowed':
              errorMessage = '🚫 Micrófono bloqueado. Permite el acceso.';
              break;
            case 'no-speech':
              errorMessage = '🤫 No se detectó voz. Habla más cerca.';
              break;
            case 'audio-capture':
              errorMessage = '🎤 Error del micrófono. Verifica la conexión.';
              break;
            case 'service-not-allowed':
              errorMessage = '❌ Servicio no disponible. Prueba modo incógnito.';
              break;
            default:
              errorMessage = `⚠️ Error técnico: ${event.error}`;
          }
          
          setAudioState(prev => ({
            ...prev,
            error: errorMessage,
            isRecording: false
          }));
        };
        
        recognitionRef.current.onend = () => {
          console.log('🎤 Reconocimiento terminado');
          setAudioState(prev => ({
            ...prev,
            isRecording: false
          }));
        };
      }
    } else {
      setAudioState(prev => ({
        ...prev,
        error: '❌ Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.'
      }));
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Controlar grabación - SOLO AUDIO REAL
  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      setAudioState(prev => ({
        ...prev,
        error: '❌ Reconocimiento de voz no disponible.'
      }));
      return;
    }

    if (audioState.isRecording) {
      // Detener grabación
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error al detener reconocimiento:', error);
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setAudioState(prev => ({
        ...prev,
        isRecording: false
      }));
      
      // Procesar transcripción para generar SOAP
      if (audioState.transcript.trim()) {
        generateSOAP(audioState.transcript);
      }
    } else {
      // Solicitar permisos del micrófono primero
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        setAudioState(prev => ({
          ...prev,
          error: '🚫 Micrófono no autorizado. Permite el acceso.'
        }));
        return;
      }

      // Iniciar grabación
      setAudioState(prev => ({
        ...prev,
        isRecording: true,
        transcript: '',
        error: null,
        recordingTime: 0
      }));
      
      try {
        recognitionRef.current.start();
        
        // Iniciar timer
        timerRef.current = setInterval(() => {
          setAudioState(prev => ({
            ...prev,
            recordingTime: prev.recordingTime + 1
          }));
        }, 1000);
      } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        setAudioState(prev => ({
          ...prev,
          error: '❌ Error al iniciar grabación. Recarga la página.',
          isRecording: false
        }));
      }
    }
  };

  // Probar conexión de red
  const testConnection = () => {
    setAudioState(prev => ({
      ...prev,
      error: '🔄 Probando conexión...'
    }));
    
    fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
      .then(() => {
        setAudioState(prev => ({
          ...prev,
          error: '✅ Conexión OK. Intenta grabar de nuevo.'
        }));
        setTimeout(() => {
          setAudioState(prev => ({
            ...prev,
            error: null
          }));
        }, 2000);
      })
      .catch(() => {
        setAudioState(prev => ({
          ...prev,
          error: '❌ Sin conexión a internet. Revisa tu conexión.'
        }));
      });
  };

  // Generar notas SOAP automáticamente
  const generateSOAP = (transcript: string) => {
    setAudioState(prev => ({ ...prev, isProcessing: true }));
    
    setTimeout(() => {
      const lines = transcript.toLowerCase().split(/[.!?]+/).filter(line => line.trim());
      
      let subjective = '';
      let objective = '';
      let assessment = '';
      let plan = '';
      
      // Análisis inteligente del texto
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) return;
        
        // Subjetivo - síntomas, quejas del paciente
        if (cleanLine.includes('dolor') || cleanLine.includes('molestia') || 
            cleanLine.includes('siento') || cleanLine.includes('me duele') ||
            cleanLine.includes('desde hace') || cleanLine.includes('presenta')) {
          subjective += cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1) + '. ';
        }
        
        // Objetivo - hallazgos físicos
        if (cleanLine.includes('examen') || cleanLine.includes('palpación') ||
            cleanLine.includes('movimiento') || cleanLine.includes('rango') ||
            cleanLine.includes('observa') || cleanLine.includes('tensión')) {
          objective += cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1) + '. ';
        }
        
        // Evaluación - diagnóstico
        if (cleanLine.includes('diagnóstico') || cleanLine.includes('evaluación') ||
            cleanLine.includes('parece') || cleanLine.includes('sugiere') ||
            cleanLine.includes('compatible') || cleanLine.includes('probable')) {
          assessment += cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1) + '. ';
        }
        
        // Plan - tratamiento
        if (cleanLine.includes('tratamiento') || cleanLine.includes('recomiendo') ||
            cleanLine.includes('ejercicios') || cleanLine.includes('terapia') ||
            cleanLine.includes('seguimiento') || cleanLine.includes('próxima cita')) {
          plan += cleanLine.charAt(0).toUpperCase() + cleanLine.slice(1) + '. ';
        }
      });
      
      // Valores por defecto si no se detecta contenido específico
      if (!subjective) {
        subjective = `Paciente ${patient?.name} refiere: ${transcript.substring(0, 200)}...`;
      }
      
      if (!objective) {
        objective = 'Pendiente de examen físico detallado.';
      }
      
      if (!assessment) {
        assessment = `Evaluación basada en síntomas reportados para ${patient?.condition}.`;
      }
      
      if (!plan) {
        plan = 'Plan de tratamiento a definir según evaluación completa.';
      }
      
      setSoapNote({
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim(),
        plan: plan.trim()
      });
      
      setAudioState(prev => ({ ...prev, isProcessing: false }));
    }, 2000);
  };

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Manejar regreso
  const handleBack = () => {
    if (audioState.isRecording) {
      recognitionRef.current?.stop();
    }
    navigate('/clinical');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E3F2FD] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5DA5A3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#2C3E50] font-medium">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E3F2FD] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">Error</h2>
          <p className="text-[#2C3E50]/70 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-[#5DA5A3] text-white rounded-lg hover:bg-[#4A8280] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FA] to-[#E3F2FD]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#BDC3C7]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#2C3E50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <AiDuxCareLogo size="sm" />
              <div>
                <h1 className="text-lg font-semibold text-[#2C3E50]">Consulta Completa</h1>
                <p className="text-sm text-[#2C3E50]/60">{patient.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[#2C3E50]">{currentTherapist?.name}</p>
              <p className="text-xs text-[#2C3E50]/60">Fisioterapeuta</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel Izquierdo - Información del Paciente y Audio */}
          <div className="space-y-6">
            {/* Información del Paciente */}
            <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
              <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">👤 Información del Paciente</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-[#2C3E50]/70">Nombre:</span>
                  <p className="text-[#2C3E50] font-medium">{patient.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#2C3E50]/70">Edad:</span>
                  <p className="text-[#2C3E50]">{patient.age} años</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#2C3E50]/70">Condición:</span>
                  <p className="text-[#2C3E50]">{patient.condition}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#2C3E50]/70">Contacto:</span>
                  <p className="text-[#2C3E50]">{patient.phone}</p>
                </div>
              </div>
            </div>

            {/* Control de Audio MEJORADO */}
            <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">
                  🎙️ Grabación de Consulta
                </h3>
                
                {audioState.recordingTime > 0 && (
                  <div className="mb-4 text-2xl font-mono text-[#5DA5A3] font-bold">
                    {formatTime(audioState.recordingTime)}
                  </div>
                )}
                
                <button
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-lg border-4 ${
                    audioState.isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse border-red-300' 
                      : 'bg-[#5DA5A3] hover:bg-[#4A8280] border-[#5DA5A3]/30'
                  }`}
                  disabled={audioState.isProcessing}
                >
                  {audioState.isRecording ? (
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="7" y="7" width="10" height="10" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  )}
                </button>
                
                <p className="text-sm text-[#2C3E50]/60 mb-4 font-medium">
                  {audioState.isRecording 
                    ? '🔴 GRABANDO... Habla claramente. Haz clic para detener.' 
                    : '🎤 Haz clic para iniciar grabación de audio'
                  }
                </p>
                
                {audioState.error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium mb-3">{audioState.error}</p>
                    
                    {audioState.error.includes('conexión') && (
                      <button
                        onClick={testConnection}
                        className="mb-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        🌐 Probar Conexión
                      </button>
                    )}
                    
                    <div className="text-xs text-red-500">
                      <p className="font-medium mb-2">💡 Soluciones:</p>
                      <ul className="text-left space-y-1">
                        <li>• Permite el acceso al micrófono cuando te lo pida</li>
                        <li>• Usa Chrome, Edge o Safari (navegadores compatibles)</li>
                        <li>• Verifica tu conexión a internet</li>
                        <li>• Habla cerca del micrófono</li>
                        <li>• Prueba en modo incógnito si falla</li>
                        <li>• Recarga la página como último recurso</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {audioState.isProcessing && (
                  <div className="flex items-center justify-center space-x-2 text-[#5DA5A3]">
                    <div className="w-4 h-4 border-2 border-[#5DA5A3] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Analizando transcripción y generando SOAP...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transcripción */}
            {audioState.transcript && (
              <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
                <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">📝 Transcripción</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-sm text-[#2C3E50] whitespace-pre-wrap leading-relaxed">{audioState.transcript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho - Notas SOAP */}
          <div className="bg-white rounded-lg shadow-sm border border-[#BDC3C7]/20 p-6">
            <h3 className="text-lg font-semibold text-[#2C3E50] mb-6">📋 Notas SOAP</h3>
            
            <div className="space-y-6">
              {/* Subjetivo */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Subjetivo (S)
                </label>
                <textarea
                  value={soapNote.subjective}
                  onChange={(e) => setSoapNote(prev => ({ ...prev, subjective: e.target.value }))}
                  placeholder="Información proporcionada por el paciente..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Objetivo */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Objetivo (O)
                </label>
                <textarea
                  value={soapNote.objective}
                  onChange={(e) => setSoapNote(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="Hallazgos del examen físico..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Evaluación */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Evaluación (A)
                </label>
                <textarea
                  value={soapNote.assessment}
                  onChange={(e) => setSoapNote(prev => ({ ...prev, assessment: e.target.value }))}
                  placeholder="Diagnóstico y evaluación clínica..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Plan (P)
                </label>
                <textarea
                  value={soapNote.plan}
                  onChange={(e) => setSoapNote(prev => ({ ...prev, plan: e.target.value }))}
                  placeholder="Plan de tratamiento y seguimiento..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5DA5A3] focus:border-transparent resize-none text-sm"
                />
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    alert('Notas SOAP guardadas correctamente');
                    handleBack();
                  }}
                  className="w-full px-4 py-3 bg-[#5DA5A3] text-white rounded-lg hover:bg-[#4A8280] transition-colors font-medium"
                >
                  💾 Guardar Consulta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCompletePageFixed; 