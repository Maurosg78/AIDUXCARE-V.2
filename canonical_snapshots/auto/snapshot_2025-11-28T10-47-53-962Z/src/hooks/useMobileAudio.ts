/**
 * Mobile Audio Hook
 * 
 * Enhanced audio recording hook with mobile-specific handling
 * Includes permission management, error handling, and mobile optimizations
 */

import { useState, useCallback, useRef } from 'react';
import { isIOS, isAndroid, hasMicrophoneAccess, hasMediaRecorderSupport } from '../utils/mobileDetection';
import { classifyError } from '../core/audio-pipeline/errorClassification';

export interface MobileAudioState {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
  isSupported: boolean;
}

export interface MobileAudioControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  requestPermission: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook for mobile-optimized audio recording
 */
export function useMobileAudio(): MobileAudioState & MobileAudioControls {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check support on mount
  useState(() => {
    const hasMic = hasMicrophoneAccess();
    const hasRecorder = hasMediaRecorderSupport();
    setIsSupported(hasMic && hasRecorder);
    
    if (!hasMic || !hasRecorder) {
      setError('Audio recording not supported on this device');
    }
  });

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!hasMicrophoneAccess()) {
        setError('Microphone access not available');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      // Stop stream immediately after permission granted
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionGranted(true);
      setPermissionDenied(false);
      setError(null);
      return true;
    } catch (err) {
      const classified = classifyError(err);
      
      if (classified.type === 'network_error' || err instanceof Error) {
        // Permission denied or error
        setPermissionDenied(true);
        setPermissionGranted(false);
        setError('Microphone permission denied. Please enable microphone access in your browser settings.');
        return false;
      }
      
      setError(classified.message);
      return false;
    }
  }, []);

  /**
   * Start recording with mobile optimizations
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Check support
      if (!isSupported) {
        throw new Error('Audio recording not supported');
      }

      // Request permission if not granted
      if (!permissionGranted) {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      // Get media stream
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

      // Select best MIME type for mobile
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Handle stop in parent component
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        const error = (event as any).error || new Error('Recording error');
        const classified = classifyError(error);
        setError(classified.message);
        setIsRecording(false);
      };

      // Start recording with mobile-optimized interval
      const chunkInterval = isIOS() ? 5000 : 3000; // Longer chunks for iOS
      recorder.start(chunkInterval);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      const classified = classifyError(err);
      setError(classified.message);
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isSupported, permissionGranted, requestPermission]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      setIsRecording(false);
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    stopRecording();
    setError(null);
    setIsTranscribing(false);
    audioChunksRef.current = [];
  }, [stopRecording]);

  return {
    isRecording,
    isTranscribing,
    error,
    permissionGranted,
    permissionDenied,
    isSupported,
    startRecording,
    stopRecording,
    requestPermission,
    reset
  };
}

