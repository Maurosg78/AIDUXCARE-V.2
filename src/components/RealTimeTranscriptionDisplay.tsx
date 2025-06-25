/**
 * NOTES REAL TIME TRANSCRIPTION DISPLAY - Componente de Transcripción en Tiempo Real
 * 
 * Características principales:
 * 1. SUCCESS: Transcripción visible en tiempo real
 * 2. SUCCESS: Identificación visual de interlocutores (PACIENTE/TERAPEUTA)
 * 3. SUCCESS: Métricas de calidad de audio
 * 4. SUCCESS: Recomendaciones de mejora
 * 5. SUCCESS: Preparado para integración SOAP
 * 
 * @author AiDuxCare Team
 * @date Junio 2025
 * @version 2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  EnhancedAudioCaptureService, 
  RealTimeTranscriptionSegment, 
  SpeakerProfile, 
  AudioQualityMetrics,
  CaptureStatus,
  EnhancedAudioConfig
} from '../services/EnhancedAudioCaptureService';
import { SOAPClassifierV2Service } from '../services/SOAPClassifierV2Service';

// === INTERFACES ===

interface RealTimeTranscriptionDisplayProps {
  onTranscriptionComplete?: (segments: RealTimeTranscriptionSegment[]) => void;
  onSOAPGenerated?: (soapData: any) => void;
  enableSOAPClassification?: boolean;
  config?: Partial<EnhancedAudioConfig>;
  className?: string;
}

interface TranscriptionState {
  segments: RealTimeTranscriptionSegment[];
  speakers: SpeakerProfile[];
  qualityMetrics: AudioQualityMetrics;
  status: CaptureStatus;
  isRecording: boolean;
  error: string | null;
  sessionDuration: number;
}

// === COMPONENTE PRINCIPAL ===

export const RealTimeTranscriptionDisplay: React.FC<RealTimeTranscriptionDisplayProps> = ({
  onTranscriptionComplete,
  onSOAPGenerated,
  enableSOAPClassification = true,
  config = {},
  className = ''
}) => {
  
  // Estados
  const [state, setState] = useState<TranscriptionState>({
    segments: [],
    speakers: [],
    qualityMetrics: {
      averageVolume: 0,
      backgroundNoise: 0,
      clarity: 0,
      speakerSeparation: 0,
      overallScore: 0,
      recommendations: []
    },
    status: 'idle',
    isRecording: false,
    error: null,
    sessionDuration: 0
  });

  // Referencias
  const audioServiceRef = useRef<EnhancedAudioCaptureService | null>(null);
  const soapServiceRef = useRef<SOAPClassifierV2Service | null>(null);
  const transcriptionContainerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(0);

  // === EFECTOS ===

  useEffect(() => {
    initializeServices();
    return () => {
      cleanup();
    };
  }, []);

  // Auto-scroll al final de la transcripción
  useEffect(() => {
    if (transcriptionContainerRef.current) {
      transcriptionContainerRef.current.scrollTop = transcriptionContainerRef.current.scrollHeight;
    }
  }, [state.segments]);

  // === INICIALIZACIÓN ===

  const initializeServices = async () => {
    try {
      // Inicializar servicio de audio mejorado
      audioServiceRef.current = new EnhancedAudioCaptureService(
        {
          language: 'es',
          enableSpeakerDiarization: true,
          enableRealTimeDisplay: true,
          audioQuality: 'professional',
          medicalContext: true,
          enableSmartPunctuation: true,
          ...config
        },
        {
          onRealTimeSegment: handleRealTimeSegment,
          onSpeakerDetected: handleSpeakerDetected,
          onQualityUpdate: handleQualityUpdate,
          onError: handleError,
          onStatusChange: handleStatusChange
        }
      );

      // Inicializar servicio SOAP si está habilitado
      if (enableSOAPClassification) {
        soapServiceRef.current = new SOAPClassifierV2Service();
      }

    } catch (error) {
      handleError(`Error inicializando servicios: ${error}`);
    }
  };

  // === HANDLERS ===

  const handleRealTimeSegment = (segment: RealTimeTranscriptionSegment) => {
    setState(prev => ({
      ...prev,
      segments: [...prev.segments, segment]
    }));

    // Procesar con SOAP si está habilitado y el segmento es final
    if (enableSOAPClassification && segment.isFinal && soapServiceRef.current) {
      processSegmentWithSOAP(segment);
    }
  };

  const handleSpeakerDetected = (speaker: SpeakerProfile) => {
    setState(prev => ({
      ...prev,
      speakers: [...prev.speakers.filter(s => s.id !== speaker.id), speaker]
    }));
  };

  const handleQualityUpdate = (metrics: AudioQualityMetrics) => {
    setState(prev => ({
      ...prev,
      qualityMetrics: metrics
    }));
  };

  const handleError = (error: string) => {
    setState(prev => ({
      ...prev,
      error,
      status: 'error'
    }));
  };

  const handleStatusChange = (status: CaptureStatus) => {
    setState(prev => ({
      ...prev,
      status,
      isRecording: status === 'recording'
    }));

    if (status === 'recording') {
      startDurationTimer();
    } else if (status === 'completed' || status === 'error') {
      stopDurationTimer();
    }
  };

  // === FUNCIONES AUXILIARES ===

  const processSegmentWithSOAP = async (segment: RealTimeTranscriptionSegment) => {
    if (!soapServiceRef.current) return;

    try {
      // Preparar datos para clasificación SOAP
      const soapInput = {
        transcription: segment.text,
        speaker: segment.speaker.role,
        confidence: segment.confidence,
        timestamp: segment.timestamp,
        medical_entities: [], // Se extraerán en el servicio
        context: 'real_time_segment'
      };

      // Clasificar con SOAP (versión simplificada para tiempo real)
      const soapResult = await soapServiceRef.current.classifySegmentRealTime(soapInput);
      
      if (soapResult && onSOAPGenerated) {
        onSOAPGenerated(soapResult);
      }

    } catch (error) {
      console.error('Error procesando segmento con SOAP:', error);
    }
  };

  const startDurationTimer = () => {
    sessionStartRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        sessionDuration: Date.now() - sessionStartRef.current
      }));
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const cleanup = () => {
    if (audioServiceRef.current) {
      audioServiceRef.current.stopCapture();
    }
    stopDurationTimer();
  };

  // === ACCIONES ===

  const startRecording = async () => {
    if (!audioServiceRef.current) return;

    try {
      setState(prev => ({ ...prev, error: null }));
      await audioServiceRef.current.startEnhancedCapture();
    } catch (error) {
      handleError(`Error iniciando grabación: ${error}`);
    }
  };

  const stopRecording = async () => {
    if (!audioServiceRef.current) return;

    try {
      const finalSegments = await audioServiceRef.current.stopCapture();
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(finalSegments);
      }

      setState(prev => ({
        ...prev,
        status: 'completed'
      }));

    } catch (error) {
      handleError(`Error deteniendo grabación: ${error}`);
    }
  };

  const clearTranscription = () => {
    setState(prev => ({
      ...prev,
      segments: [],
      speakers: [],
      sessionDuration: 0,
      error: null
    }));
  };

  // === FUNCIONES DE RENDERIZADO ===

  const renderSpeakerIcon = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return 'USER:';
      case 'THERAPIST':
        return 'DOCTOR:';
      default:
        return '❓';
    }
  };

  const getSpeakerColor = (role: string) => {
    switch (role) {
      case 'PATIENT':
        return 'text-blue-600 bg-blue-50';
      case 'THERAPIST':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // === RENDER ===

  return (
    <div className={`real-time-transcription-display ${className}`}>
      {/* HEADER CON CONTROLES */}
      <div className="transcription-header bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-800">
              NOTES Transcripción en Tiempo Real
            </h3>
            
            {/* Indicador de estado */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              state.status === 'recording' ? 'bg-red-100 text-red-800' :
              state.status === 'completed' ? 'bg-green-100 text-green-800' :
              state.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {state.status === 'recording' && 'RED: Grabando'}
              {state.status === 'completed' && 'SUCCESS: Completado'}
              {state.status === 'error' && 'ERROR: Error'}
              {state.status === 'idle' && '⏸️ Listo'}
              {state.status === 'initializing' && 'RELOAD: Iniciando...'}
            </div>

            {/* Duración */}
            {state.sessionDuration > 0 && (
              <div className="text-sm text-gray-600">
                TIME: {formatDuration(state.sessionDuration)}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {!state.isRecording ? (
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={state.status === 'initializing'}
              >
                MIC: Iniciar Grabación
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                STOP: Detener
              </button>
            )}

            <button
              onClick={clearTranscription}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              disabled={state.isRecording}
            >
              TRASH: Limpiar
            </button>
          </div>
        </div>

        {/* Error */}
        {state.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 text-sm">
              ERROR: {state.error}
            </div>
          </div>
        )}
      </div>

      {/* MÉTRICAS DE CALIDAD */}
      <div className="quality-metrics bg-gray-50 p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div className="text-center">
            <div className="text-sm text-gray-600">Volumen</div>
            <div className={`text-lg font-semibold ${getQualityColor(state.qualityMetrics.averageVolume)}`}>
              {Math.round(state.qualityMetrics.averageVolume * 100)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Claridad</div>
            <div className={`text-lg font-semibold ${getQualityColor(state.qualityMetrics.clarity)}`}>
              {Math.round(state.qualityMetrics.clarity * 100)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Interlocutores</div>
            <div className="text-lg font-semibold text-blue-600">
              {state.speakers.length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Calidad General</div>
            <div className={`text-lg font-semibold ${getQualityColor(state.qualityMetrics.overallScore)}`}>
              {Math.round(state.qualityMetrics.overallScore * 100)}%
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        {state.qualityMetrics.recommendations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.qualityMetrics.recommendations.map((rec, index) => (
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

      {/* TRANSCRIPCIÓN EN TIEMPO REAL */}
      <div 
        ref={transcriptionContainerRef}
        className="transcription-content flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: '400px' }}
      >
        {state.segments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {state.status === 'idle' && (
              <>
                <div className="text-4xl mb-2">MIC:</div>
                <div>Haz clic en "Iniciar Grabación" para comenzar</div>
              </>
            )}
            {state.status === 'recording' && (
              <>
                <div className="text-4xl mb-2">👂</div>
                <div>Escuchando... Comienza a hablar</div>
              </>
            )}
          </div>
        ) : (
          state.segments.map((segment, index) => (
            <div
              key={segment.id}
              className={`transcription-segment flex items-start space-x-3 p-3 rounded-lg ${
                segment.isFinal ? 'bg-white border border-gray-200' : 'bg-gray-50'
              } ${segment.isInterim ? 'opacity-70' : ''}`}
            >
              {/* Avatar del hablante */}
              <div className={`speaker-avatar w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                getSpeakerColor(segment.speaker.role)
              }`}>
                {renderSpeakerIcon(segment.speaker.role)}
              </div>

              {/* Contenido */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-medium ${
                    segment.speaker.role === 'PATIENT' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    {segment.speaker.role === 'PATIENT' ? 'Paciente' : 'Terapeuta'}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                  
                  {/* Indicador de confianza */}
                  <div className={`text-xs px-2 py-1 rounded ${
                    segment.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                    segment.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(segment.confidence * 100)}%
                  </div>

                  {/* Indicador de estado */}
                  {segment.isInterim && (
                    <span className="text-xs text-gray-400">
                      ⏳ Procesando...
                    </span>
                  )}
                </div>

                <div className="text-gray-800">
                  {segment.text}
                </div>

                {/* Métricas adicionales */}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>SOUND: {Math.round(segment.audioLevel * 100)}%</span>
                  <span>⚡ {segment.processingTime}ms</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RESUMEN DE ESTADÍSTICAS */}
      {state.segments.length > 0 && (
        <div className="transcription-footer bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              STATS: {state.segments.filter(s => s.isFinal).length} segmentos finales
            </div>
            <div>
              👥 {state.speakers.length} interlocutores detectados
            </div>
            <div>
              NOTES {state.segments.reduce((total, s) => total + s.text.split(' ').length, 0)} palabras
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeTranscriptionDisplay;