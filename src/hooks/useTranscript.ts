import { useState, useCallback, useRef } from 'react';
import { OpenAIWhisperService } from '../services/OpenAIWhisperService';

interface UseTranscriptReturn {
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  isTranscribing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  error: string | null;
  reset: () => void;
}

export const useTranscript = (): UseTranscriptReturn => {
  const [transcript, setTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setTranscript('');
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing chunks:', chunksRef.current.length);
        setIsTranscribing(true);
        
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          console.log('Processing with Whisper:', audioBlob.size, 'bytes');
          
          const transcriptionText = await OpenAIWhisperService.transcribe(audioBlob);
          console.log('Whisper transcription complete:', transcriptionText.length, 'characters');
          
          setTranscript(transcriptionText);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Error transcribiendo audio';
          console.error('Transcription error:', errorMsg);
          setError(errorMsg);
        } finally {
          setIsTranscribing(false);
        }
        
        // Limpiar stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setIsRecording(true);
      console.log('Recording started - Whisper will process when stopped');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error iniciando grabación';
      console.error('Recording error:', errorMsg);
      setError(errorMsg);
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  const reset = useCallback((): void => {
    setTranscript('');
    setIsRecording(false);
    setIsTranscribing(false);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    transcript,
    setTranscript,  // Agregado para permitir edición manual
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    error,
    reset
  };
};
