import React, { useState, useEffect, useRef } from 'react';

// === INTERFACES BÁSICAS ===

interface RealTimeSegment {
  id: string;
  text: string;
  speaker: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  confidence: number;
  timestamp: number;
  isInterim: boolean;
  isFinal: boolean;
}

interface QualityMetrics {
  averageVolume: number;
  clarity: number;
  overallScore: number;
  recommendations: string[];
}

interface TranscriptionDisplayProps {
  onTranscriptionComplete?: (segments: RealTimeSegment[]) => void;
  className?: string;
}

// === COMPONENTE PRINCIPAL ===

export const RealTimeTranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({
  onTranscriptionComplete,
  className = ''
}) => {
  
  const [segments, setSegments] = useState<RealTimeSegment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [quality, setQuality] = useState<QualityMetrics>({
    averageVolume: 0,
    clarity: 0,
    overallScore: 0,
    recommendations: []
  });
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // === INICIALIZACIÓN ===

  useEffect(() => {
    initializeSpeechRecognition();
    return cleanup;
  }, []);

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Web Speech API no soportada en este navegador');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;

    // CONFIGURACIÓN MEJORADA
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 3;

    // Event handlers
    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
      startTimer();
    };

    recognition.onresult = (event) => {
      handleSpeechResult(event);
    };

    recognition.onerror = (event) => {
      setError(`Error de reconocimiento: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // Reiniciar automáticamente
        setTimeout(() => {
          if (recognitionRef.current && isRecording) {
            recognitionRef.current.start();
          }
        }, 100);
      }
    };
  };

  // === HANDLERS ===

  const handleSpeechResult = (event: SpeechRecognitionEvent) => {
    const newSegments: RealTimeSegment[] = [];
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence || 0.8;
      
      const segment: RealTimeSegment = {
        id: `segment_${Date.now()}_${i}`,
        text: transcript,
        speaker: identifySpeaker(transcript),
        confidence,
        timestamp: Date.now(),
        isInterim: !result.isFinal,
        isFinal: result.isFinal
      };

      newSegments.push(segment);
    }

    setSegments(prev => [...prev, ...newSegments]);
    updateQualityMetrics();
  };

  const identifySpeaker = (text: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' => {
    const lowerText = text.toLowerCase();
    
    // Patrones para TERAPEUTA
    const therapistPatterns = [
      /vamos a (evaluar|examinar|revisar)/,
      /necesito que (flexione|extienda|gire)/,
      /recomiendo (que|hacer|continuar)/,
      /el tratamiento (consiste|incluye)/,
      /aplicaremos|realizaremos/
    ];
    
    // Patrones para PACIENTE
    const patientPatterns = [
      /me duele (cuando|si|desde)/,
      /siento (que|como|dolor)/,
      /no puedo (hacer|mover|dormir)/,
      /desde hace (días|semanas)/,
      /me cuesta|me molesta/
    ];
    
    const therapistScore = therapistPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 1 : score, 0
    );
    
    const patientScore = patientPatterns.reduce((score, pattern) => 
      pattern.test(lowerText) ? score + 1 : score, 0
    );
    
    if (therapistScore > patientScore) return 'THERAPIST';
    if (patientScore > therapistScore) return 'PATIENT';
    
    // Alternar por defecto
    const lastSpeaker = segments[segments.length - 1]?.speaker;
    return lastSpeaker === 'PATIENT' ? 'THERAPIST' : 'PATIENT';
  };

  const updateQualityMetrics = () => {
    const recentSegments = segments.slice(-5);
    const avgConfidence = recentSegments.reduce((sum, s) => sum + s.confidence, 0) / recentSegments.length || 0;
    
    const recommendations: string[] = [];
    if (avgConfidence < 0.6) recommendations.push('📢 Habla más claro');
    if (segments.length > 10 && new Set(segments.slice(-10).map(s => s.speaker)).size < 2) {
      recommendations.push('👥 Asegúrate de que ambos hablen');
    }

    setQuality({
      averageVolume: Math.random() * 0.8 + 0.2, // Simulado
      clarity: avgConfidence,
      overallScore: avgConfidence * 0.8,
      recommendations
    });
  };

  // === CONTROLES ===

  const startRecording = async () => {
    if (!recognitionRef.current) {
      setError('Servicio de reconocimiento no disponible');
      return;
    }

    try {
      setSegments([]);
      setDuration(0);
      recognitionRef.current.start();
    } catch (error) {
      setError('Error iniciando grabación');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
    
    if (onTranscriptionComplete) {
      onTranscriptionComplete(segments.filter(s => s.isFinal));
    }
  };

  const clearTranscription = () => {
    setSegments([]);
    setDuration(0);
    setError(null);
  };

  // === TIMER ===

  const startTimer = () => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setDuration(Date.now() - startTimeRef.current);
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
      case 'PATIENT': return 'text-blue-600 bg-blue-50';
      case 'THERAPIST': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSpeakerIcon = (speaker: string) => {
    switch (speaker) {
      case 'PATIENT': return '👤';
      case 'THERAPIST': return '👨‍⚕️';
      default: return '❓';
    }
  };

  // === RENDER ===

  return (
    <div className={`enhanced-transcription-display bg-white rounded-lg shadow-lg ${className}`}>
      {/* HEADER */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-800">
              📝 Transcripción Mejorada
            </h3>
            
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 font-medium">Grabando</span>
                <span className="text-sm text-gray-600">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🎙️ Iniciar
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ⏹️ Detener
              </button>
            )}

            <button
              onClick={clearTranscription}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              disabled={isRecording}
            >
              🗑️
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">❌ {error}</div>
          </div>
        )}
      </div>

      {/* MÉTRICAS */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Claridad</div>
            <div className="text-lg font-semibold text-green-600">
              {Math.round(quality.clarity * 100)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Segmentos</div>
            <div className="text-lg font-semibold text-blue-600">
              {segments.filter(s => s.isFinal).length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Calidad</div>
            <div className="text-lg font-semibold text-purple-600">
              {Math.round(quality.overallScore * 100)}%
            </div>
          </div>
        </div>

        {quality.recommendations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quality.recommendations.map((rec, index) => (
              <div
                key={index}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
              >
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRANSCRIPCIÓN */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {segments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🎙️</div>
            <div>
              {isRecording ? 'Escuchando... Comienza a hablar' : 'Haz clic en "Iniciar" para comenzar'}
            </div>
          </div>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`flex items-start space-x-3 p-3 rounded-lg ${
                segment.isFinal ? 'bg-white border border-gray-200' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                getSpeakerColor(segment.speaker)
              }`}>
                {getSpeakerIcon(segment.speaker)}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${
                    segment.speaker === 'PATIENT' ? 'text-blue-600' : 'text-green-600'
                  }`}>
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

                  {segment.isInterim && (
                    <span className="text-xs text-gray-400">⏳</span>
                  )}
                </div>

                <div className="text-gray-800">{segment.text}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FOOTER */}
      {segments.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>📊 {segments.filter(s => s.isFinal).length} segmentos finales</div>
            <div>📝 {segments.reduce((total, s) => total + s.text.split(' ').length, 0)} palabras</div>
          </div>
        </div>
      )}
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

export default RealTimeTranscriptionDisplay; 