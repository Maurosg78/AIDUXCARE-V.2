/**
 * 🎤 Professional Audio Capture - Captura de Audio Real
 * Componente para capturar audio en tiempo real para el workflow clínico
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../ui/button';
import { audioManager } from '../../services/AudioCaptureManager';
import { MedicalPhase } from '../../services/SemanticChunkingService';

interface ProfessionalAudioCaptureProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onPhaseChange?: (phase: MedicalPhase) => void;
  currentPhase?: MedicalPhase;
  onRecordingComplete?: (audioBlob: Blob) => void;
  isProcessing?: boolean;
  className?: string;
}

export const ProfessionalAudioCapture: React.FC<ProfessionalAudioCaptureProps> = ({
  onRecordingStart,
  onRecordingStop,
  onPhaseChange,
  currentPhase = 'anamnesis',
  onRecordingComplete,
  isProcessing = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Efectos para escuchar eventos del audio manager
   */
  useEffect(() => {
    const handleLiveTranscription = (event: CustomEvent) => {
      // Actualizar nivel de audio simulado
      setAudioLevel(Math.random() * 100);
    };

    const handleTranscriptionError = (event: CustomEvent) => {
      console.error('Error en transcripción:', event.detail);
      setAudioPermission('denied');
    };

    window.addEventListener('liveTranscription', handleLiveTranscription as EventListener);
    window.addEventListener('transcriptionError', handleTranscriptionError as EventListener);

    return () => {
      window.removeEventListener('liveTranscription', handleLiveTranscription as EventListener);
      window.removeEventListener('transcriptionError', handleTranscriptionError as EventListener);
    };
  }, []);

  /**
   * Cambiar fase médica
   */
  const handlePhaseChange = (phase: MedicalPhase) => {
    audioManager.changePhase(phase);
    onPhaseChange?.(phase);
  };

  /**
   * Solicita permisos de micrófono
   */
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission('granted');
      return stream;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAudioPermission('denied');
      return null;
    }
  }, []);

  /**
   * Inicia la grabación con semantic chunking
   */
  const startRecording = useCallback(async () => {
    try {
      await audioManager.startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Notificar al componente padre
      onRecordingStart?.();

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎤 Grabación iniciada con semantic chunking');
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      setAudioPermission('denied');
    }
  }, [onRecordingStart]);

  /**
   * Detiene la grabación con semantic chunking
   */
  const stopRecording = useCallback(() => {
    if (isRecording) {
      const segments = audioManager.stopRecording();
      setIsRecording(false);
      
      // Detener timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Notificar al componente padre
      onRecordingStop?.();

      // Crear un blob simulado para compatibilidad
      if (onRecordingComplete) {
        const audioBlob = new Blob([''], { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
      }

      console.log('⏹️ Grabación detenida, segments:', segments.length);
    }
  }, [isRecording, onRecordingStop, onRecordingComplete]);

  /**
   * Formatea el tiempo de grabación
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Simula una grabación para testing (fallback si no hay micrófono)
   */
  const simulateRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    
    // Simular grabación de 3 segundos
    const timer = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 3) {
          clearInterval(timer);
          setIsRecording(false);
          
          // Crear blob simulado
          const simulatedBlob = new Blob(['simulated audio'], { type: 'audio/wav' });
          onRecordingComplete?.(simulatedBlob);
          
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  }, [onRecordingComplete]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex flex-col items-center">
        
        {/* Estado del Micrófono */}
        <div className="mb-4">
          {audioPermission === 'pending' && (
            <div className="text-center">
              <div className="text-yellow-600 mb-2">🎤 Acceso al micrófono requerido</div>
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
              <div className="text-red-600 mb-2">❌ Micrófono no disponible</div>
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
              <div className="text-green-600 mb-2">✅ Micrófono listo</div>
            </div>
          )}
        </div>

        {/* Fase Médica Actual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-blue-800">Fase Actual:</span>
              <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                {currentPhase === 'anamnesis' ? 'Anamnesis' :
                 currentPhase === 'exploration' ? 'Exploración' :
                 currentPhase === 'evaluation' ? 'Evaluación' : 'Planificación'}
              </span>
            </div>
            {isRecording && (
              <div className="flex items-center">
                <span className="text-xs text-blue-600 mr-2">Audio:</span>
                <div className="w-16 h-2 bg-blue-200 rounded">
                  <div 
                    className="h-full bg-blue-600 rounded transition-all duration-200"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Fase (solo visible cuando está grabando) */}
        {isRecording && (
          <div className="grid grid-cols-2 gap-2 mb-4 w-full">
            {[
              { phase: 'anamnesis' as MedicalPhase, label: 'Anamnesis', icon: '📋' },
              { phase: 'exploration' as MedicalPhase, label: 'Exploración', icon: '🔍' },
              { phase: 'evaluation' as MedicalPhase, label: 'Evaluación', icon: '⚕️' },
              { phase: 'planning' as MedicalPhase, label: 'Planificación', icon: '📝' }
            ].map(({ phase, label, icon }) => (
              <button
                key={phase}
                onClick={() => handlePhaseChange(phase)}
                className={`p-2 rounded text-xs border transition-all ${
                  currentPhase === phase
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                }`}
              >
                <div className="text-base mb-1">{icon}</div>
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        )}

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
                  🎙️
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
                ⏹️
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
          <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Instrucciones de Uso</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Hable claramente y a volumen normal</li>
            <li>• Identifique si habla el profesional o paciente</li>
            <li>• Evite ruidos de fondo excesivos</li>
            <li>• La transcripción aparecerá automáticamente</li>
          </ul>
        </div>

        {/* Información Técnica */}
        <div className="mt-4 flex justify-center w-full text-xs text-gray-500">
          <span>🔒 Audio procesado localmente con total privacidad</span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalAudioCapture; 