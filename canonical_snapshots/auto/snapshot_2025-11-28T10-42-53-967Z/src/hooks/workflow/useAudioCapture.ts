import { useState, useRef, useCallback } from 'react';

export const useAudioCapture = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const requestPermission = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      setStream(mediaStream);
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setError('Microphone permission denied');
      console.error('Permission error:', err);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!stream || !hasPermission) return;

    // Limpiar chunks anteriores
    audioChunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        console.log('Audio chunk captured:', event.data.size, 'bytes');
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    
    // Iniciar con fragmentos cada 3 segundos
    mediaRecorder.start(3000);
    setIsRecording(true);
  }, [stream, hasPermission]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Esperar a que se genere el blob
      return new Promise<Blob | null>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = () => {
            if (audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              console.log('Final audio blob size:', audioBlob.size, 'bytes');
              resolve(audioBlob);
            } else {
              resolve(null);
            }
            
            // Liberar micrófono
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
          };
        }
      });
    }
    
    return null;
  }, [isRecording, stream]);

  return {
    hasPermission,
    isRecording,
    stream,
    error,
    requestPermission,
    startRecording,
    stopRecording,
  };
};
