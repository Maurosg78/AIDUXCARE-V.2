/**
 * 🎤 AudioCaptureComponent - Componente React para Captura de Audio Médico
 * 
 * Versión temporal mientras los archivos están en cuarentena
 */

import React, { useState, useEffect, useRef } from 'react';

// Interfaces temporales
interface AudioQualityMetrics {
  quality: number;
  volume: number;
  clarity: number;
}

interface AudioCaptureSession {
  id: string;
  status: 'idle' | 'capturing' | 'completed' | 'error';
  duration: number;
  segments: any[];
}

interface TranscriptionSegment {
  text: string;
  confidence: number;
  timestamp: number;
}

interface AudioCaptureComponentProps {
  onCaptureComplete?: (session: AudioCaptureSession) => void;
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  onQualityUpdate?: (metrics: AudioQualityMetrics) => void;
  onError?: (error: string) => void;
  className?: string;
  language?: 'es' | 'en';
  autoStart?: boolean;
  maxDuration?: number;
}

interface AudioCaptureState {
  isCapturing: boolean;
  status: AudioCaptureSession['status'];
  currentMethod: string | null;
  qualityMetrics: AudioQualityMetrics | null;
  segments: TranscriptionSegment[];
  error: string | null;
  elapsedTime: number;
  sessionId: string | null;
}

const AudioCaptureComponent: React.FC<AudioCaptureComponentProps> = ({
  onCaptureComplete,
  onTranscriptionUpdate,
  onQualityUpdate,
  onError,
  className = '',
  language = 'es',
  autoStart = false,
  maxDuration = 1800
}) => {
  const [state, setState] = useState<AudioCaptureState>({
    isCapturing: false,
    status: 'idle',
    currentMethod: null,
    qualityMetrics: null,
    segments: [],
    error: null,
    elapsedTime: 0,
    sessionId: null
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartCapture = async () => {
    setState(prev => ({ 
      ...prev, 
      isCapturing: true, 
      status: 'capturing',
      error: null 
    }));
    
    // Simular captura de audio
    console.log('🎤 Iniciando captura de audio...');
  };

  const handleStopCapture = async () => {
    setState(prev => ({ 
      ...prev, 
      isCapturing: false, 
      status: 'completed' 
    }));
    
    // Simular finalización
    console.log('⏹️ Deteniendo captura de audio...');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = (): string => {
    switch (state.status) {
      case 'idle':
        return 'Listo para grabar';
      case 'capturing':
        return 'Grabando...';
      case 'completed':
        return 'Grabación completada';
      case 'error':
        return 'Error en la grabación';
      default:
        return 'Estado desconocido';
    }
  };

  return (
    <div className={`audio-capture-component ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎤 Captura de Audio Médico
        </h3>
        
        <div className="space-y-4">
          {/* Estado actual */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estado:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              state.status === 'capturing' ? 'bg-green-100 text-green-800' :
              state.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              state.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusMessage()}
            </span>
          </div>

          {/* Tiempo transcurrido */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tiempo:</span>
            <span className="text-lg font-mono text-gray-900">
              {formatTime(state.elapsedTime)}
            </span>
          </div>

          {/* Controles */}
          <div className="flex space-x-3">
            {!state.isCapturing ? (
              <button
                onClick={handleStartCapture}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                🎤 Iniciar Grabación
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ⏹️ Detener Grabación
              </button>
            )}
          </div>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Este es un componente temporal mientras los archivos de audio están en cuarentena.
              La funcionalidad completa estará disponible próximamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioCaptureComponent; 