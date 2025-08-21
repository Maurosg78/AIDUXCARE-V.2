/**
 * @fileoverview useTranscript Hook - Real-time Transcription Management
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { isFeatureEnabled } from '../config/featureFlags';

// Tipos para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export interface TranscriptState {
  transcript: string;
  loading: boolean;
  error: string | null;
  isRecording: boolean;
}

export interface UseTranscriptOptions {
  sessionId?: string;
  enableDemo?: boolean;
}

/**
 * Hook for managing real-time transcription
 * In production, this would connect to Web Speech API or audio capture service
 * In demo mode, it provides simulated transcription for testing
 */
export const useTranscript = ({ enableDemo = false }: UseTranscriptOptions): TranscriptState & {
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
} => {
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // Refs para Web Speech API
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Demo transcript for testing when APP_DEMO is enabled
  const demoTranscript = `El paciente refiere dolor cervical irradiado hacia el brazo derecho, con parestesias en los dedos índice y medio. El dolor se agrava con movimientos de flexión cervical y rotación hacia la derecha. No refiere traumatismo previo. El dolor comenzó hace 3 semanas de forma progresiva.`;

  const startRecording = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Si audio está deshabilitado o en modo demo, usar demo
      if (!isFeatureEnabled('audioCapture') || enableDemo) {
        setTimeout(() => {
          setLoading(false);
          setIsRecording(true);
          setTranscript(demoTranscript);
        }, 1000);
        return;
      }

      // Verificar soporte de Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Web Speech API no soportada en este navegador');
      }

      // Solicitar permisos de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true 
        } 
      });
      streamRef.current = stream;

      // Configurar reconocimiento de voz
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES';
      
      recognition.onstart = () => {
        setLoading(false);
        setIsRecording(true);
        console.log('🎤 Grabación iniciada');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          currentTranscript += result[0].transcript;
        }
        setTranscript(prev => prev + ' ' + currentTranscript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Error en reconocimiento:', event.error);
        setError(`Error de transcripción: ${event.error}`);
        setIsRecording(false);
        setLoading(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        console.log('🎤 Grabación finalizada');
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (error) {
      console.error('Error iniciando grabación:', error);
      setError(error instanceof Error ? error.message : 'Error iniciando grabación');
      setLoading(false);
      setIsRecording(false);
    }
  }, [enableDemo, demoTranscript]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setLoading(false);
    
    // Detener reconocimiento de voz
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Detener stream de audio
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (!transcript || transcript === 'Iniciando grabación...') {
      setError('No se pudo capturar transcripción. Intente nuevamente.');
    }
  }, [transcript]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsRecording(false);
    };
  }, []);

  return {
    transcript,
    loading,
    error,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscript
  };
};

export default useTranscript;
