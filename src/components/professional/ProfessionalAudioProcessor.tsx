/**
 * MIC: Professional Audio Processor - AiDuxCare V.2
 * Componente para grabación y procesamiento de audio con IA
 * REFACTORIZADO: Usa hooks centralizados para eliminar memory leaks
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AudioProcessingServiceProfessional } from '@/services/AudioProcessingServiceProfessional';
import { AudioProcessingResult } from '@/services/AudioProcessingServiceProfessional';
import { TranscriptionResult } from '@/types/audio';
import { AuditLogger } from '@/services/AuditLogger';
import { Button } from '@/shared/components/UI/Button';
import { Card } from '@/shared/components/UI/Card';
import LoadingSpinner from '@/shared/components/UI/LoadingSpinner';
import { Icon } from '@/shared/components/UI/Icon';
import { useInterval } from '@/hooks/useInterval';

interface ProfessionalAudioProcessorProps {
  visitId: string;
  userId: string;
  patientId: string;
  onProcessingComplete: (result: AudioProcessingResult) => void;
  onError: (error: unknown) => void;
}

interface AudioState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  audioLevel: number;
  hasRecording: boolean;
}

export const ProfessionalAudioProcessor: React.FC<ProfessionalAudioProcessorProps> = ({
  visitId,
  userId,
  patientId,
  onProcessingComplete,
  onError
}) => {
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isProcessing: false,
    recordingTime: 0,
    audioLevel: 0,
    hasRecording: false
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // REFACTORIZADO: Timer usando requestAnimationFrame para mejor rendimiento
  useEffect(() => {
    let animationId: number;
    
    if (audioState.isRecording) {
      const updateTimer = () => {
        setAudioState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
          audioLevel: Math.random() * 100 // Simulación del nivel de audio
        }));
        
        setTimeout(() => {
          if (audioState.isRecording) {
            animationId = requestAnimationFrame(updateTimer);
          }
        }, 1000);
      };
      
      animationId = requestAnimationFrame(updateTimer);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [audioState.isRecording]);

  /**
   * Iniciar grabación de audio
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('MIC: Iniciando grabación de audio...');
      
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MIC: Grabación detenida, procesando audio...');
        handleRecordingComplete();
      };
      
      // Iniciar grabación
      mediaRecorder.start(1000); // Capturar datos cada segundo
      
      setAudioState(prev => ({
        ...prev,
        isRecording: true,
        recordingTime: 0
      }));
      
    } catch (error) {
      console.error('ERROR: Error al iniciar grabación:', error);
      onError({
        userMessage: 'No se pudo acceder al micrófono. Verifica los permisos.',
        technicalDetails: error instanceof Error ? error.message : 'Error desconocido',
        retryable: true,
        fallbackAvailable: false
      });
    }
  }, [onError]);

  /**
   * Detener grabación de audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && audioState.isRecording) {
      mediaRecorderRef.current.stop();
      
      // Detener stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setAudioState(prev => ({
        ...prev,
        isRecording: false,
        hasRecording: true
      }));
    }
  }, [audioState.isRecording]);

  /**
   * Procesar grabación completada
   */
  const handleRecordingComplete = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      onError({
        userMessage: 'No se capturó audio. Intenta grabar de nuevo.',
        technicalDetails: 'Audio chunks array is empty',
        retryable: true,
        fallbackAvailable: false
      });
      return;
    }

    setAudioState(prev => ({
      ...prev,
      isProcessing: true
    }));

    try {
      // Crear blob de audio
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      console.log('RELOAD: Enviando audio para procesamiento...', {
        size: audioBlob.size,
        type: audioBlob.type,
        duration: audioState.recordingTime
      });

      // Procesar con el servicio de IA
      const result = await AudioProcessingServiceProfessional.processAudioRecording(
        audioBlob,
        {
          visitId,
          userId,
          patientId,
          recordingDuration: audioState.recordingTime,
          audioQuality: 'high'
        }
      );

      console.log('SUCCESS: Audio procesado exitosamente:', result);
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));

      onProcessingComplete(result);

    } catch (error) {
      console.error('ERROR: Error procesando audio:', error);
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));

      onError(error);
    }
  }, [audioState.recordingTime, visitId, userId, patientId, onProcessingComplete, onError]);

  /**
   * Reiniciar el proceso
   */
  const resetRecording = useCallback(() => {
    // Limpiar estados
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    audioChunksRef.current = [];
    
    setAudioState({
      isRecording: false,
      isProcessing: false,
      recordingTime: 0,
      audioLevel: 0,
      hasRecording: false
    });
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  /**
   * Formatear tiempo de grabación
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Indicador Visual de Estado */}
      <div className="flex items-center justify-center">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
          audioState.isRecording ? 'bg-red-100 animate-pulse' : 
          audioState.isProcessing ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          {/* Onda de sonido animada durante grabación */}
          {audioState.isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
          )}
          
          {/* Icono central */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            audioState.isRecording ? 'bg-red-500' : 
            audioState.isProcessing ? 'bg-blue-500' : 'bg-gray-400'
          }`}>
            {audioState.isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Información de Estado */}
      <div className="text-center space-y-2">
        {audioState.isRecording && (
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">
              {formatTime(audioState.recordingTime)}
            </div>
            <div className="text-sm text-gray-600">
              Grabando... Nivel: {Math.round(audioState.audioLevel)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${audioState.audioLevel}%` }}
              ></div>
            </div>
          </div>
        )}

        {audioState.isProcessing && (
          <div className="space-y-1">
            <div className="text-lg font-semibold text-blue-600">
              Procesando con IA...
            </div>
            <div className="text-sm text-gray-600">
              Generando transcripción y notas SOAP automáticamente
            </div>
          </div>
        )}

        {!audioState.isRecording && !audioState.isProcessing && audioState.hasRecording && (
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600">
              SUCCESS: Grabación Completada
            </div>
            <div className="text-sm text-gray-600">
              Duración: {formatTime(audioState.recordingTime)}
            </div>
          </div>
        )}

        {!audioState.isRecording && !audioState.isProcessing && !audioState.hasRecording && (
          <div className="space-y-1">
            <div className="text-lg font-semibold text-gray-700">
              Listo para Grabar
            </div>
            <div className="text-sm text-gray-600">
              El audio será procesado automáticamente con IA
            </div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex justify-center space-x-4">
        {!audioState.isRecording && !audioState.isProcessing && (
          <Button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
            MIC: Iniciar Grabación
          </Button>
        )}

        {audioState.isRecording && (
          <Button
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            STOP: Detener y Procesar
          </Button>
        )}

        {(audioState.hasRecording || audioState.isProcessing) && (
          <Button
            onClick={resetRecording}
            variant="outline"
            disabled={audioState.isProcessing}
            className="flex items-center gap-2 px-4 py-3"
          >
            RELOAD: Nueva Grabación
          </Button>
        )}
      </div>

      {/* Información Técnica */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Estado:</span>
            {audioState.isRecording ? ' RED: Grabando' :
             audioState.isProcessing ? ' RELOAD: Procesando' :
             audioState.hasRecording ? ' SUCCESS: Completado' : ' ⚪ Esperando'}
          </div>
          <div>
            <span className="font-medium">Calidad:</span> Alta (44.1kHz)
          </div>
          <div>
            <span className="font-medium">Formato:</span> WebM/Opus
          </div>
          <div>
                            <span className="font-medium">IA:</span> Google Cloud AI + Whisper
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAudioProcessor; 