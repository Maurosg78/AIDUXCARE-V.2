import { useState, useCallback, useRef } from 'react';
import { OpenAIWhisperService } from '../services/OpenAIWhisperService';

export const useTranscript = () => {
  const [transcript, setTranscriptState] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const appendTranscript = useCallback((text: string) => {
    if (!text) return;
    setTranscriptState(prev => {
      const cleanedPrev = prev.trim();
      const cleanedNew = text.trim();
      if (!cleanedNew) return cleanedPrev;
      return cleanedPrev ? `${cleanedPrev}\n${cleanedNew}` : cleanedNew;
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('El navegador no soporta captura de audio');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        setIsTranscribing(true);
        try {
          const transcription = await OpenAIWhisperService.transcribe(audioBlob);
          appendTranscript(transcription);
        } catch (err) {
          console.error('Error transcribiendo audio con Whisper:', err);
          setError(err instanceof Error ? err.message : 'Error transcribiendo audio');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setError(err instanceof Error ? err.message : 'Error iniciando grabación');
      setIsRecording(false);
    }
  }, [appendTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error deteniendo pista de audio', e);
        }
      });
      streamRef.current = null;
    }

    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscriptState('');
    setError(null);
    setIsTranscribing(false);
  }, []);

  const setTranscript = useCallback((text: string) => {
    setTranscriptState(text);
  }, []);

  return {
    transcript,
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
    reset,
    setTranscript
  };
};
