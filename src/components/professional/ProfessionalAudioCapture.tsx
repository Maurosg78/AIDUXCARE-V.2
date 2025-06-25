/**
 * MIC: Professional Audio Capture - AiDuxCare V.2
 * Captura de audio profesional sin memory leaks
 * REFACTORIZADO: Eliminados todos los setInterval problemáticos
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/UI/Button';
import { useInterval } from '@/hooks/useInterval';

interface ProfessionalAudioCaptureProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  className?: string;
}

export const ProfessionalAudioCapture: React.FC<ProfessionalAudioCaptureProps> = ({
  onRecordingComplete,
  isProcessing = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPermission, setAudioPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // REFACTORIZADO: Timer usando hook centralizado
  useInterval(
    () => {
      setRecordingTime(prev => prev + 1);
    },
    isRecording ? 1000 : null
  );

  /**
   * Solicitar permisos de micrófono
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission('granted');
    } catch (error) {
      console.error('ERROR: Error al solicitar permisos de micrófono:', error);
      setAudioPermission('denied');
    }
  }, []);

  /**
   * Verifica permisos automáticamente al montar
   */
  useEffect(() => {
    requestMicrophonePermission();
  }, [requestMicrophonePermission]);

  /**
   * Inicia la grabación
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioChunksRef.current = [];
      setRecordingTime(0);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        
        // Detener todas las pistas de audio
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Grabar en chunks de 100ms
      setIsRecording(true);
      
    } catch (error) {
      console.error('ERROR: Error al iniciar grabación:', error);
      setAudioPermission('denied');
    }
  }, [onRecordingComplete]);

  /**
   * Detiene la grabación
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  /**
   * Formatea el tiempo de grabación
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * REFACTORIZADO: Simulación simplificada sin setInterval
   */
  const simulateRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // Usar timeout simple en lugar de interval
    setTimeout(() => {
      setIsRecording(false);
      setRecordingTime(0);
      
      // Crear blob simulado
      const simulatedBlob = new Blob(['simulated audio'], { type: 'audio/wav' });
      onRecordingComplete(simulatedBlob);
    }, 3000);
  }, [onRecordingComplete]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex flex-col items-center">
        
        {/* Estado del Micrófono */}
        <div className="mb-4">
          {audioPermission === 'pending' && (
            <div className="text-center">
              <div className="text-yellow-600 mb-2">AUDIO: Acceso al micrófono requerido</div>
              <Button
                onClick={requestMicrophonePermission}
                variant="outline"
                className="text-sm"
              >
                Permitir Micrófono
              </Button>
            </div>
          )}
          
          {audioPermission === 'denied' && (
            <div className="text-center">
              <div className="text-red-600 mb-2">ERROR: Micrófono no disponible</div>
              <Button
                onClick={simulateRecording}
                variant="secondary"
                className="text-sm"
                disabled={isRecording || isProcessing}
              >
                🎬 Usar Demo Simulado
              </Button>
            </div>
          )}
          
          {audioPermission === 'granted' && (
            <div className="text-center">
              <div className="text-green-600 mb-2">SUCCESS: Micrófono listo</div>
            </div>
          )}
        </div>

        {/* Control de Grabación Principal */}
        <div className="flex flex-col items-center mb-4">
          {!isRecording ? (
            <Button
              onClick={audioPermission === 'granted' ? startRecording : simulateRecording}
              disabled={isProcessing}
              className={`w-32 h-32 rounded-full text-white text-xl font-bold shadow-lg transition-all ${
                isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                  <span className="text-sm">Procesando...</span>
                </div>
              ) : (
                <>
                  MIC:
                  <br />
                  <span className="text-sm">Iniciar</span>
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col items-center">
              <Button
                onClick={stopRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white text-xl font-bold shadow-lg animate-pulse"
              >
                STOP:
                <br />
                <span className="text-sm">Detener</span>
              </Button>
              
              <div className="mt-4 text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-gray-600">Grabando sesión clínica...</div>
              </div>
            </div>
          )}
        </div>

        {/* Estado de Procesamiento */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div className="text-blue-800">
                <div className="font-medium">Procesando Audio...</div>
                <div className="text-sm text-blue-600">
                  STT → NLP → Entidades → SOAP → Agentes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 w-full">
          <h4 className="text-sm font-medium text-gray-900 mb-2">TIP Instrucciones de Uso</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Hable claramente y a volumen normal</li>
            <li>• Identifique si habla el profesional o paciente</li>
            <li>• Evite ruidos de fondo excesivos</li>
            <li>• La transcripción aparecerá automáticamente</li>
          </ul>
        </div>

        {/* Información Técnica */}
        <div className="mt-4 flex justify-center w-full text-xs text-gray-500">
          <span>SECURE Audio procesado localmente con total privacidad</span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAudioCapture; 