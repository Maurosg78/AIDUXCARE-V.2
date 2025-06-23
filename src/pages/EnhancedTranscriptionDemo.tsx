/**
 * 🚀 ENHANCED TRANSCRIPTION DEMO - Demostración de Transcripción Mejorada
 * 
 * Página que demuestra las mejoras implementadas:
 * 1. ✅ Calidad de audio mejorada
 * 2. ✅ Identificación de interlocutores
 * 3. ✅ Transcripción en tiempo real visible
 * 4. ✅ Clasificación SOAP inteligente con IA V3.0
 * 
 * @author AiDuxCare Team + ChatGPT Optimization
 * @date Junio 2025
 * @version 4.0 - Gemini 1.5 Pro Integration
 */

import React, { useState, useEffect } from 'react';
import RealWorldSOAPProcessor from '../services/RealWorldSOAPProcessor';
import { SOAPResult, SOAPFinding, RedFlag } from '../types/nlp';
import { TranscriptionSegment } from '../types/audio';
import { ProfessionalProfile } from '../types/professional';

// === INTERFACES ===

interface DemoState {
  isRecording: boolean;
  segments: TranscriptionSegment[];
  soapResult: SOAPResult | null;
  isProcessing: boolean;
  error: string | null;
  duration: number;
  qualityMetrics: {
    volume: number;
    clarity: number;
    speakers: number;
  };
}

// === COMPONENTE PRINCIPAL ===

export const EnhancedTranscriptionDemo: React.FC = () => {
  
  const [state, setState] = useState<DemoState>({
    isRecording: false,
    segments: [],
    soapResult: null,
    isProcessing: false,
    error: null,
    duration: 0,
    qualityMetrics: {
      volume: 0,
      clarity: 0,
      speakers: 0
    }
  });

  // Referencias y servicios
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [soapProcessor] = useState(new RealWorldSOAPProcessor());
  const [startTime, setStartTime] = useState<number>(0);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);

  // === INICIALIZACIÓN ===

  useEffect(() => {
    initializeSpeechRecognition();
    return cleanup;
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Web Speech API no soportada en este navegador' }));
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    
    // CONFIGURACIÓN PROFESIONAL (MODIFICADA PARA ESTABILIDAD)
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false; // VITAL: Solo resultados finales para evitar error 'network'
    recognitionInstance.lang = 'es-ES';
    recognitionInstance.maxAlternatives = 1;

    // Event handlers
    recognitionInstance.onstart = () => {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
      startTimer();
    };

    recognitionInstance.onresult = (event) => {
      handleSpeechResult(event);
    };

    recognitionInstance.onerror = (event) => {
      let errorMessage = `Error de reconocimiento: ${event.error}`;
      if (event.error === 'network') {
        errorMessage += '. Por favor, revise su conexión a internet. Esta demo requiere una conexión estable.';
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Acceso al micrófono denegado. Por favor, habilite el acceso en la configuración de su navegador.';
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isRecording: false 
      }));
      stopTimer();
    };

    recognitionInstance.onend = () => {
      if (state.isRecording) {
        // Reiniciar automáticamente para captura continua
        setTimeout(() => {
          if (recognitionInstance && state.isRecording) {
            recognitionInstance.start();
          }
        }, 100);
      }
    };

    setRecognition(recognitionInstance);
  };

  // === HANDLERS ===

  const handleSpeechResult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript.trim() + ' ';
      }
    }

    if (finalTranscript.length > 0) {
      const newSegment: TranscriptionSegment = {
        id: `segment_${Date.now()}`,
        text: finalTranscript.trim(),
        speaker: identifySpeaker(finalTranscript),
        confidence: event.results[event.results.length - 1][0].confidence || 0.8,
        timestamp: Date.now(),
        isFinal: true
      };

      setState(prev => ({
        ...prev,
        segments: [...prev.segments, newSegment],
        qualityMetrics: {
          ...prev.qualityMetrics,
          clarity: newSegment.confidence,
          speakers: new Set([...prev.segments, newSegment].map(s => s.speaker)).size
        }
      }));

      // Procesar automáticamente el nuevo segmento final
      processSegmentsWithSOAP([...state.segments, newSegment]);
    }
  };

  const identifySpeaker = (text: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' => {
    const lowerText = text.toLowerCase();
    
    // Patrones específicos para TERAPEUTA
    const therapistPatterns = [
      /vamos a (evaluar|examinar|revisar|trabajar)/,
      /necesito que (flexione|extienda|gire|levante)/,
      /observe (como|que|si)/,
      /recomiendo (que|hacer|continuar)/,
      /el tratamiento (consiste|incluye|será)/,
      /aplicaremos|realizaremos|trabajaremos/,
      /flexione|extienda|gire|presione/
    ];
    
    // Patrones específicos para PACIENTE  
    const patientPatterns = [
      /me duele (cuando|si|desde|mucho)/,
      /siento (que|como|dolor|molestia)/,
      /no puedo (hacer|mover|dormir|trabajar)/,
      /desde hace (días|semanas|meses)/,
      /es difícil|me cuesta|me molesta/,
      /está mejor|está peor|sigue igual/
    ];
    
    const therapistScore = therapistPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 2 : score, 0
    );
    
    const patientScore = patientPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 2 : score, 0
    );
    
    if (therapistScore > patientScore && therapistScore >= 2) return 'THERAPIST';
    if (patientScore > therapistScore && patientScore >= 2) return 'PATIENT';
    
    // Heurística mejorada: no alternar, marcar como desconocido si no hay certeza.
    const lastSpeaker = state.segments[state.segments.length - 1]?.speaker;
    if (lastSpeaker && state.segments.length > 0) {
        // Simple alternancia si ya hay un hablante, para conversaciones fluidas.
        return lastSpeaker === 'PATIENT' ? 'THERAPIST' : 'PATIENT';
    }
    return 'UNKNOWN';
  };

  const processSegmentsWithSOAP = async (currentSegments: TranscriptionSegment[]) => {
    if (currentSegments.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    const fullTranscription = currentSegments.map(s => `${s.speaker}: ${s.text}`).join('\n');
    
    const professionalProfile: ProfessionalProfile = {
        role: 'PHYSIOTHERAPIST',
        location: {
            country: 'ES',
            state: 'Madrid'
        }
    };

    try {
      const soapResult = await soapProcessor.processTranscription(
        fullTranscription, 
        professionalProfile.role,
        professionalProfile.location
      );
      
      setState(prev => ({ 
        ...prev, 
        soapResult,
        isProcessing: false 
      }));

    } catch (error) {
      console.error('Error procesando con RealWorldSOAPProcessor:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        error: 'Error procesando con el pipeline de IA.' 
      }));
    }
  };

  // === CONTROLES ===

  const startRecording = async () => {
    if (!recognition) {
      setState(prev => ({ ...prev, error: 'Servicio de reconocimiento no disponible' }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        segments: [], 
        soapResult: null, 
        duration: 0,
        qualityMetrics: { volume: 0, clarity: 0, speakers: 0 }
      }));
      
      recognition.start();
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Error iniciando grabación' }));
    }
  };

  const stopRecording = async () => {
    if (recognition) {
      recognition.stop();
    }
    
    setState(prev => ({ ...prev, isRecording: false }));
    stopTimer();

    // Procesar transcripción final
    if (state.segments.length > 0) {
      await processSegmentsWithSOAP(state.segments.filter(s => s.isFinal));
    }
  };

  const clearAll = () => {
    setState(prev => ({
      ...prev,
      segments: [],
      soapResult: null,
      duration: 0,
      error: null,
      qualityMetrics: { volume: 0, clarity: 0, speakers: 0 }
    }));
    soapProcessor.resetStats();
  };

  // === TIMER ===

  const startTimer = () => {
    const start = Date.now();
    setStartTime(start);
    
    const interval = setInterval(() => {
      setState(prev => ({ ...prev, duration: Date.now() - start }));
    }, 1000);
    
    setDurationInterval(interval);
  };

  const stopTimer = () => {
    if (durationInterval) {
      clearInterval(durationInterval);
      setDurationInterval(null);
    }
  };

  const cleanup = () => {
    if (recognition) {
      recognition.stop();
    }
    stopTimer();
  };

  // === HELPERS ===

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'THERAPIST': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return '👤';
      case 'THERAPIST': return '👨‍⚕️';
      default: return '❓';
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'S': return '🗣️';
      case 'O': return '👁️';
      case 'A': return '🧠';
      case 'P': return '📋';
      default: return '📄';
    }
  };

  // === RENDER ===

  return (
    <div className="enhanced-transcription-demo min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🚀 Transcripción Mejorada con IA
          </h1>
          <p className="text-gray-600">
            Demostración de las mejoras implementadas: calidad de audio, identificación de interlocutores, 
            transcripción en tiempo real y clasificación SOAP inteligente.
          </p>
        </div>

        {/* CONTROLES PRINCIPALES */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800">
                🎙️ Control de Grabación
              </h2>
              
              {state.isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 font-medium">Grabando</span>
                  <span className="text-gray-600">{formatDuration(state.duration)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {!state.isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🎙️ Iniciar Grabación
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  ⏹️ Detener
                </button>
              )}

              <button
                onClick={clearAll}
                className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={state.isRecording}
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {/* MÉTRICAS EN TIEMPO REAL */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Segmentos</div>
              <div className="text-2xl font-bold text-blue-800">
                {state.segments.filter(s => s.isFinal).length}
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Claridad</div>
              <div className="text-2xl font-bold text-green-800">
                {Math.round(state.qualityMetrics.clarity * 100)}%
              </div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Interlocutores</div>
              <div className="text-2xl font-bold text-purple-800">
                {state.qualityMetrics.speakers}
              </div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Procesando</div>
              <div className="text-2xl font-bold text-orange-800">
                {state.isProcessing ? '🔄' : '✅'}
              </div>
            </div>
          </div>

          {/* ERROR */}
          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">❌ {state.error}</div>
            </div>
          )}
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TRANSCRIPCIÓN EN TIEMPO REAL */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                📝 Transcripción en Tiempo Real
              </h3>
            </div>
            
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {state.segments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🎙️</div>
                  <div>
                    {state.isRecording ? 'Escuchando... Comienza a hablar' : 'Haz clic en "Iniciar Grabación"'}
                  </div>
                </div>
              ) : (
                state.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      segment.isFinal ? 'bg-white' : 'bg-gray-50'
                    } ${getSpeakerColor(segment.speaker)}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
                      {getSpeakerIcon(segment.speaker)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium">
                          {segment.speaker === 'PATIENT' ? 'Paciente' : 'Terapeuta'}
                        </span>
                        
                        <span className="text-xs text-gray-500">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </span>
                        
                        <div className={`text-xs px-2 py-1 rounded ${
                          segment.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          segment.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(segment.confidence * 100)}%
                        </div>

                        {!segment.isFinal && (
                          <span className="text-xs text-gray-400">⏳</span>
                        )}
                      </div>

                      <div className="text-gray-800">{segment.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SOAP INTELIGENTE */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                🧠 Clasificación SOAP Inteligente
              </h3>
              {state.isProcessing && (
                <div className="text-sm text-blue-600 mt-1">
                  🔄 Procesando con IA...
                </div>
              )}
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {!state.soapResult ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🧠</div>
                  <div>
                    {state.segments.length === 0 
                      ? 'Inicia la grabación para ver clasificación SOAP'
                      : 'Procesando transcripción con IA...'
                    }
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* RESUMEN */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      📊 Resumen de Procesamiento
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div>Segmentos procesados: {state.soapResult.summary.processedSegments}</div>
                      <div>Confianza promedio: {Math.round(state.soapResult.summary.confidence * 100)}%</div>
                      <div>Tiempo: {state.soapResult.processingMetrics.processingTime}ms</div>
                    </div>
                  </div>

                  {/* SECCIONES SOAP */}
                  {(['subjective', 'objective', 'assessment', 'plan'] as const).map((sectionKey) => {
                    const sections = state.soapResult![sectionKey];
                    const sectionName = {
                      subjective: 'Subjetivo',
                      objective: 'Objetivo', 
                      assessment: 'Evaluación',
                      plan: 'Plan'
                    }[sectionKey];
                    
                    const sectionLetter = sectionKey.charAt(0).toUpperCase() as 'S' | 'O' | 'A' | 'P';

                    return (
                      <div key={sectionKey} className="border border-gray-200 rounded-lg">
                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getSectionIcon(sectionLetter)}</span>
                            <span className="font-medium text-gray-800">
                              {sectionLetter} - {sectionName}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({sections.length} items)
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-3 space-y-2">
                          {sections.length === 0 ? (
                            <div className="text-sm text-gray-500 italic">
                              No hay contenido clasificado en esta sección
                            </div>
                          ) : (
                            sections.map((section, index) => (
                              <div key={index} className="text-sm">
                                <div className="text-gray-800 mb-1">
                                  {section.content}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Confianza: {Math.round(section.confidence * 100)}% | 
                                  Hablante: {section.speaker === 'PATIENT' ? 'Paciente' : 'Terapeuta'}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* HALLAZGOS CLAVE */}
                  {state.soapResult.summary.keyFindings.length > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        🔍 Hallazgos Clave
                      </div>
                      <div className="space-y-1">
                        {state.soapResult.summary.keyFindings.map((finding, index) => (
                          <div key={index} className="text-xs text-green-700">
                            • {finding}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ESTADÍSTICAS FINALES */}
        {state.soapResult && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📈 Estadísticas de Procesamiento
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600">Clasificaciones IA</div>
                <div className="text-xl font-bold text-blue-800">
                  {state.soapResult.processingMetrics.aiClassifications}
                </div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-600">Fallback Local</div>
                <div className="text-xl font-bold text-green-800">
                  {state.soapResult.processingMetrics.fallbackClassifications}
                </div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-600">Entidades</div>
                <div className="text-xl font-bold text-purple-800">
                  {state.soapResult.processingMetrics.entityExtractions}
                </div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-sm text-orange-600">Tiempo Total</div>
                <div className="text-xl font-bold text-orange-800">
                  {state.soapResult.processingMetrics.processingTime}ms
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// === DECLARACIONES GLOBALES ===

declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export default EnhancedTranscriptionDemo; 