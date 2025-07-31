import React, { useState, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';
// import { AudioCaptureServiceReal } from '../services/AudioCaptureServiceReal';
// import { AudioCaptureService } from '../core/audio/AudioCaptureService';
// import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

interface TranscriptionSegment {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  speaker?: 'patient' | 'therapist';
}

interface AudioQualityMetrics {
  quality: number;
  volume: number;
  clarity: number;
  backgroundNoise: number;
  duration: number;
  confidence: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
}

interface AudioCaptureSession {
  id: string;
  status: 'idle' | 'capturing' | 'completed' | 'error';
  duration: number;
  segments: TranscriptionSegment[];
  startTime: number;
  method: string;
  qualityMetrics: AudioQualityMetrics;
}

interface RealTimeAudioCaptureProps {
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  onQualityUpdate?: (metrics: AudioQualityMetrics) => void;
  onSessionComplete?: (session: AudioCaptureSession) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

const RealTimeAudioCapture: React.FC<RealTimeAudioCaptureProps> = ({
  onTranscriptionUpdate,
  onQualityUpdate,
  onSessionComplete,
  onError,
  onStatusChange,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([]);
  const [currentSession, setCurrentSession] = useState<AudioCaptureSession | null>(null);

  const handleTranscriptionUpdate = useCallback((segment: TranscriptionSegment) => {
    setTranscription(prev => [...prev, segment]);
    onTranscriptionUpdate?.(segment);
  }, [onTranscriptionUpdate]);

  const handleError = useCallback((error: Error) => {
    console.error('Error en captura de audio:', error);
    onError?.(error);
  }, [onError]);

  const handleStatusChange = useCallback((status: string) => {
    console.log('Estado de captura:', status);
    onStatusChange?.(status);
  }, [onStatusChange]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    handleStatusChange('Iniciando grabación...');
    
    // Simular inicio de grabación
    const session: AudioCaptureSession = {
      id: `session_${Date.now()}`,
      status: 'capturing',
      duration: 0,
      segments: [],
      startTime: Date.now(),
      method: 'realtime',
      qualityMetrics: {
        quality: 0.85,
        volume: 0.7,
        clarity: 0.8,
        backgroundNoise: 0.2,
        duration: 0,
        confidence: 0.9,
        sampleRate: 48000,
        bitDepth: 16,
        channels: 1
      }
    };
    
    setCurrentSession(session);
    handleStatusChange('Grabando...');
  }, [handleStatusChange]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    handleStatusChange('Deteniendo grabación...');
    
    if (currentSession) {
      const updatedSession: AudioCaptureSession = {
        ...currentSession,
        status: 'completed',
        duration: Date.now() - currentSession.startTime
      };
      
      setCurrentSession(updatedSession);
      onSessionComplete?.(updatedSession);
      handleStatusChange('Grabación completada');
    }
  }, [currentSession, onSessionComplete, handleStatusChange]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Simular actualizaciones de transcripción en tiempo real
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const mockSegment: TranscriptionSegment = {
        id: `segment_${Date.now()}`,
        text: 'Simulación de transcripción en tiempo real...',
        confidence: 0.85 + Math.random() * 0.1,
        timestamp: Date.now(),
        speaker: Math.random() > 0.5 ? 'patient' : 'therapist'
      };

      handleTranscriptionUpdate(mockSegment);
    }, 3000);

    return () => clearInterval(interval);
  }, [isRecording, handleTranscriptionUpdate]);

  return (
    <div className={`real-time-audio-capture ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-neutral/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-primary">
            🎤 Captura de Audio en Tiempo Real
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-accent animate-pulse' : 'bg-neutral'}`} />
            <span className="text-sm text-neutral-600">
              {isRecording ? 'Grabando...' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Controles de grabación */}
          <div className="flex justify-center">
            <button
              onClick={toggleRecording}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isRecording
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isRecording ? '⏹️ Detener' : '🎤 Iniciar'} Grabación
            </button>
          </div>

          {/* Información de la sesión */}
          {currentSession && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <h4 className="font-medium text-neutral-700 mb-2">Información de Sesión</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">ID:</span>
                  <span className="ml-2 font-mono text-primary">{currentSession.id}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Estado:</span>
                  <span className="ml-2 capitalize">{currentSession.status}</span>
                </div>
                <div>
                  <span className="text-neutral-600">Duración:</span>
                  <span className="ml-2">{Math.round(currentSession.duration / 1000)}s</span>
                </div>
                <div>
                  <span className="text-neutral-600">Segmentos:</span>
                  <span className="ml-2">{transcription.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Transcripción en tiempo real */}
          <div className="bg-white border border-neutral/200 rounded-lg p-4">
            <h4 className="font-medium text-neutral-700 mb-3">Transcripción en Tiempo Real</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {transcription.length === 0 ? (
                <p className="text-neutral-500 text-sm italic">
                  Inicia la grabación para ver la transcripción en tiempo real...
                </p>
              ) : (
                transcription.map((segment, index) => (
                  <div key={segment.id} className="flex items-start gap-2 p-2 bg-neutral-50 rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      segment.speaker === 'patient' ? 'bg-secondary' : 'bg-primary'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-600 capitalize">
                          {segment.speaker || 'unknown'}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {Math.round(segment.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-neutral-800">{segment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Métricas de calidad */}
          {currentSession && (
            <div className="bg-white border border-neutral/200 rounded-lg p-4">
              <h4 className="font-medium text-neutral-700 mb-3">Métricas de Calidad</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">Calidad:</span>
                  <span className="ml-2">{Math.round(currentSession.qualityMetrics.quality * 100)}%</span>
                </div>
                <div>
                  <span className="text-neutral-600">Volumen:</span>
                  <span className="ml-2">{Math.round(currentSession.qualityMetrics.volume * 100)}%</span>
                </div>
                <div>
                  <span className="text-neutral-600">Claridad:</span>
                  <span className="ml-2">{Math.round(currentSession.qualityMetrics.clarity * 100)}%</span>
                </div>
                <div>
                  <span className="text-neutral-600">Ruido de fondo:</span>
                  <span className="ml-2">{Math.round(currentSession.qualityMetrics.backgroundNoise * 100)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-800 mb-1">Información del Componente</h5>
              <p className="text-sm text-blue-700">
                Este componente simula la captura de audio en tiempo real con transcripción automática.
                Los servicios reales están temporalmente en cuarentena para optimización del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeAudioCapture; 