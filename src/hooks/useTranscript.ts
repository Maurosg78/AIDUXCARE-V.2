// @ts-nocheck
import { useState, useCallback, useRef } from 'react';

export const useTranscript = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar micrófono con configuración optimizada
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                               (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Navegador no soporta reconocimiento de voz');
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento:', event.error);
        // Reintentar en errores de red
        if (event.error === 'network' && isRecording) {
          setTimeout(() => recognition.start(), 1000);
        } else if (event.error !== 'aborted') {
          setError(`Error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Reiniciar si seguimos grabando
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Reconocimiento terminado');
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error iniciando grabación');
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    transcript,
    isRecording,
    error,
    startRecording,
    stopRecording,
    reset,
    setTranscript
  };
};