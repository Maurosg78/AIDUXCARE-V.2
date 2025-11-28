import { useState, useCallback, useRef } from 'react';
import { OpenAIWhisperService, WhisperMode, WhisperSupportedLanguage, WhisperTranscriptionResult } from '../services/OpenAIWhisperService';

type TranscriptMeta = {
  detectedLanguage: string | null;
  averageLogProb: number | null;
  durationSeconds?: number;
};

const LIVE_CHUNK_INTERVAL_MS = 3000;
const DICTATION_CHUNK_INTERVAL_MS = 10000;

export const useTranscript = () => {
  const [transcript, setTranscriptState] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [languagePreference, setLanguagePreference] = useState<WhisperSupportedLanguage>('auto');
  const [mode, setMode] = useState<WhisperMode>('live');
  const [meta, setMeta] = useState<TranscriptMeta | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const appendTranscript = useCallback((text: string) => {
    if (!text) return;
    setTranscriptState(prev => {
      const cleanedPrev = prev.trim();
      const cleanedNew = text.trim();
      if (!cleanedNew) return cleanedPrev;
      return cleanedPrev ? `${cleanedPrev}\n${cleanedNew}` : cleanedNew;
    });
  }, []);

  const handleTranscriptionSuccess = useCallback((result: WhisperTranscriptionResult) => {
    appendTranscript(result.text);
    setMeta({
      detectedLanguage: result.detectedLanguage ?? null,
      averageLogProb: result.averageLogProb ?? null,
      durationSeconds: result.durationSeconds
    });
    setError(null);
  }, [appendTranscript]);

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
      setAudioStream(stream);
      audioChunksRef.current = [];
      setMeta(null);

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
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio chunks captured; skipping transcription');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        setIsTranscribing(true);
        try {
          const result = await OpenAIWhisperService.transcribe(audioBlob, {
            languageHint: languagePreference,
            mode
          });
          handleTranscriptionSuccess(result);
        } catch (err) {
          console.error('Error transcribiendo audio con Whisper:', err);
          setError(err instanceof Error ? err.message : 'Error transcribiendo audio');
        } finally {
          setIsTranscribing(false);
        }
      };

      const chunkInterval = mode === 'dictation' ? DICTATION_CHUNK_INTERVAL_MS : LIVE_CHUNK_INTERVAL_MS;

      recorder.start(chunkInterval);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setAudioStream(null);
    }
      setError(err instanceof Error ? err.message : 'Error iniciando grabación');
      setIsRecording(false);
    }
  }, [handleTranscriptionSuccess, languagePreference, mode]);

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
      }
    } catch (err) {
      console.warn('Error deteniendo MediaRecorder', err);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          if (track.readyState === 'live') {
            track.stop();
          }
        } catch (e) {
          console.warn('Error deteniendo pista de audio', e);
        }
      });
      streamRef.current = null;
      setAudioStream(null);
    }

    setIsRecording(false);
  }, []);

  const reset = useCallback(() => {
    setTranscriptState('');
    setError(null);
    setIsTranscribing(false);
    setMeta(null);
  }, []);

  const setTranscript = useCallback((text: string) => {
    setTranscriptState(text);
  }, []);

  const updateLanguagePreference = useCallback((language: WhisperSupportedLanguage) => {
    setLanguagePreference(language);
  }, []);

  const updateMode = useCallback((nextMode: WhisperMode) => {
    setMode(nextMode);
  }, []);

  return {
    transcript,
    isRecording,
    isTranscribing,
    error,
    languagePreference,
    mode,
    meta,
    audioStream, // Expose audio stream for waveform visualization
    startRecording,
    stopRecording,
    reset,
    setTranscript,
    setLanguagePreference: updateLanguagePreference,
    setMode: updateMode
  };
};
