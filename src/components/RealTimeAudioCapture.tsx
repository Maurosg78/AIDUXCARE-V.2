import React, { useState, useEffect, useRef } from 'react';

import { AudioCaptureServiceReal, CaptureSession, CaptureStatus } from '../services/AudioCaptureServiceReal';
import { TranscriptionSegment } from '../core/audio/AudioCaptureService';
import { WebSpeechSTTService } from '../services/WebSpeechSTTService';

interface RealTimeAudioCaptureProps {
  onCaptureComplete?: (segments: TranscriptionSegment[]) => void;
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  language?: 'es' | 'en';
  className?: string;
}

interface SessionStats {
  segmentsCount: number;
  duration: number;
  wordsTranscribed: number;
  averageConfidence: number;
  cost: number;
}

const RealTimeAudioCapture: React.FC<RealTimeAudioCaptureProps> = ({
  onCaptureComplete,
  onTranscriptionUpdate,
  language = 'es',
  className = ''
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>('idle');
  const [, setCurrentSession] = useState<CaptureSession | null>(null);
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const audioCaptureRef = useRef<AudioCaptureServiceReal | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicializar servicio de captura
  useEffect(() => {
    audioCaptureRef.current = new AudioCaptureServiceReal({
      language,
      onTranscriptionUpdate: (segment) => {
        setTranscriptionSegments(prev => {
          const existingIndex = prev.findIndex(s => s.id === segment.id);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = segment;
            return updated;
          }
          return [...prev, segment];
        });
        onTranscriptionUpdate?.(segment);
      },
      onError: (error) => {
        setErrorMessage(error);
        setCaptureStatus('error');
      },
      onStatusChange: (status) => {
        setCaptureStatus(status);
      }
    });

    // Verificar soporte del navegador
    setIsSupported(audioCaptureRef.current.isSupported());

    return () => {
      // Cleanup al desmontar
      if (audioCaptureRef.current) {
        audioCaptureRef.current.cleanup();
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [language, onTranscriptionUpdate]);

  // Actualizar estadísticas en tiempo real
  useEffect(() => {
    if (captureStatus === 'recording' && audioCaptureRef.current) {
      statsIntervalRef.current = setInterval(() => {
        const stats = audioCaptureRef.current?.getSessionStats();
        if (stats) {
          setSessionStats(stats);
        }
      }, 1000);
    } else if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [captureStatus]);

  const handleStartCapture = async () => {
    if (!audioCaptureRef.current) return;

    try {
      setErrorMessage('');
      setTranscriptionSegments([]);
      setSessionStats(null);
      
      const session = await audioCaptureRef.current.startCapture();
      setCurrentSession(session);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      setErrorMessage(errorMsg);
      setCaptureStatus('error');
    }
  };

  const handleStopCapture = async () => {
    if (!audioCaptureRef.current) return;

    try {
      const finalSegments = await audioCaptureRef.current.stopCapture();
      setCurrentSession(prev => prev ? { ...prev, status: 'idle' } : null);
      onCaptureComplete?.(finalSegments);
      
      // Mantener estadísticas finales
      const finalStats = audioCaptureRef.current.getSessionStats();
      if (finalStats) {
        setSessionStats(finalStats);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error deteniendo captura';
      setErrorMessage(errorMsg);
    }
  };

  const getStatusIcon = () => {
    switch (captureStatus) {
      case 'idle':
        return '⏸️';
      case 'requesting_permission':
        return '🔄';
      case 'recording':
        return '🔴';
      case 'stopping':
        return '⏹️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (captureStatus) {
      case 'idle':
        return 'text-gray-600';
      case 'requesting_permission':
        return 'text-blue-600';
      case 'recording':
        return 'text-red-600';
      case 'stopping':
        return 'text-orange-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActorBadgeColor = (actor: string) => {
    switch (actor) {
      case 'profesional':
        return 'bg-blue-100 text-blue-800';
      case 'paciente':
        return 'bg-green-100 text-green-800';
      case 'acompañante':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'entendido':
        return 'text-green-600';
      case 'poco_claro':
        return 'text-yellow-600';
      case 'no_reconocido':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isSupported) {
    const compatibility = WebSpeechSTTService.getBrowserCompatibility();
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-lg font-semibold text-yellow-800">
            Navegador No Compatible
          </h3>
        </div>
        
        <div className="space-y-3 text-sm text-yellow-700">
          <p>
            <strong>Tu navegador:</strong> {compatibility.browserName}
          </p>
          <p>
            <strong>Estado:</strong> {compatibility.isSupported ? 'Soporte limitado' : 'No soportado'}
          </p>
          <p>
            <strong>Recomendación:</strong> {compatibility.recommendedAction}
          </p>
        </div>

        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium text-yellow-800 mb-2">✅ Navegadores Compatibles:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Google Chrome (recomendado)</li>
            <li>• Microsoft Edge</li>
            <li>• Firefox (funcionalidad limitada)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header con controles principales */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🎤</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Captura de Audio en Tiempo Real
              </h2>
              <p className="text-sm text-gray-500">
                STT gratuito con Web Speech API - Costo: $0.00
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-lg ${getStatusColor()}`}>
              {getStatusIcon()}
            </span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {audioCaptureRef.current?.getStatusMessage() || 'Inicializando...'}
            </span>
          </div>
        </div>

        {/* Controles de captura */}
        <div className="flex items-center space-x-3">
          {captureStatus === 'idle' ? (
            <button
              onClick={handleStartCapture}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>🎙️</span>
              <span>Iniciar Captura</span>
            </button>
          ) : (
            <button
              onClick={handleStopCapture}
              disabled={captureStatus === 'stopping' || captureStatus === 'requesting_permission'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <span>⏹️</span>
              <span>Detener Captura</span>
            </button>
          )}

          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value as 'es' | 'en';
              audioCaptureRef.current?.setLanguage(newLang);
            }}
            disabled={captureStatus === 'recording'}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            aria-label="Seleccionar idioma de transcripción"
          >
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇺🇸 English</option>
          </select>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de sesión */}
      {sessionStats && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">📊 Estadísticas de Sesión</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg text-blue-600">{sessionStats.segmentsCount}</div>
              <div className="text-gray-600">Segmentos</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{sessionStats.duration}s</div>
              <div className="text-gray-600">Duración</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-purple-600">{sessionStats.wordsTranscribed}</div>
              <div className="text-gray-600">Palabras</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-orange-600">{Math.round(sessionStats.averageConfidence * 100)}%</div>
              <div className="text-gray-600">Confianza</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-emerald-600">${sessionStats.cost.toFixed(2)}</div>
              <div className="text-gray-600">Costo</div>
            </div>
          </div>
        </div>
      )}

      {/* Transcripción en tiempo real */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            📝 Transcripción en Tiempo Real
          </h3>
          <span className="text-sm text-gray-500">
            {transcriptionSegments.length} segmentos
          </span>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transcriptionSegments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {captureStatus === 'recording' ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-pulse">🎤</span>
                  <span>Esperando audio...</span>
                </div>
              ) : (
                <span>No hay transcripción disponible</span>
              )}
            </div>
          ) : (
            transcriptionSegments.map((segment) => (
              <div 
                key={segment.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActorBadgeColor(segment.actor)}`}>
                      {segment.actor}
                    </span>
                    <span className={`text-xs font-medium ${getConfidenceColor(segment.confidence)}`}>
                      {segment.confidence}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(segment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {segment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeAudioCapture; 