import { useState, useCallback, useRef, useEffect } from 'react';
import { firebaseWhisperService, WhisperTranscriptionResult } from '../services/FirebaseWhisperService';
import type { WhisperMode, WhisperSupportedLanguage } from '../services/OpenAIWhisperService';

type TranscriptMeta = {
  detectedLanguage: string | null;
  averageLogProb: number | null;
  durationSeconds?: number;
};

const LIVE_CHUNK_INTERVAL_MS = 3000;
const DICTATION_CHUNK_INTERVAL_MS = 10000;

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

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
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTranscriptRef = useRef<string>('');
  const pendingChunksRef = useRef<Blob[]>([]);
  const isTranscribingChunkRef = useRef<boolean>(false);

  const appendTranscript = useCallback((text: string, isInterim: boolean = false) => {
    if (!text) return;
    
    if (isInterim) {
      // For interim results, show current transcript + interim text
      interimTranscriptRef.current = text;
      setTranscriptState(prev => {
        const cleanedPrev = prev.trim();
        const cleanedNew = text.trim();
        if (!cleanedNew) return cleanedPrev;
        // Replace interim text if it exists, otherwise append
        return cleanedPrev ? `${cleanedPrev} ${cleanedNew}` : cleanedNew;
      });
    } else {
      // For final results, append to transcript
      setTranscriptState(prev => {
        const cleanedPrev = prev.trim();
        const cleanedNew = text.trim();
        if (!cleanedNew) return cleanedPrev;
        // Remove any interim text and add final
        const withoutInterim = cleanedPrev.replace(interimTranscriptRef.current, '').trim();
        return withoutInterim ? `${withoutInterim} ${cleanedNew}` : cleanedNew;
      });
      interimTranscriptRef.current = '';
    }
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

  // Check if Web Speech API is available
  const isWebSpeechAvailable = useCallback(() => {
    return typeof window !== 'undefined' && 
           (window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  // Map language preference to Web Speech API language codes
  const getSpeechRecognitionLang = useCallback((lang: WhisperSupportedLanguage): string => {
    switch (lang) {
      case 'en': return 'en-CA';
      case 'es': return 'es-MX';
      case 'fr': return 'fr-CA';
      case 'auto': return 'en-CA'; // Default to English
      default: return 'en-CA';
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscriptState(''); // Clear previous transcript
      interimTranscriptRef.current = '';

      // ✅ SPRINT 2 P3: Get microphone stream FIRST (single permission request)
      // PRIMARY: Use Whisper for accurate medical transcription
      // Whisper is better for:
      // - Medical vocabulary and terminology
      // - Multiple speakers (patient + physiotherapist)
      // - Ambient audio and background noise
      // - Accents and technical terms
      // - Clinical documentation quality
      
      // NOTE: Web Speech API disabled to avoid double microphone permission request
      // Web Speech API cannot share the same stream as MediaRecorder, causing two permission prompts
      // Whisper provides better accuracy for medical transcription anyway
      
      // Start Whisper transcription (primary method)
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('El navegador no soporta captura de audio');
      }

      // ✅ SPRINT 2 P3: Single getUserMedia call - reuse stream for MediaRecorder
      console.log('[useTranscript] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      console.log('[useTranscript] Microphone access granted, stream active:', stream.active);
      streamRef.current = stream;
      setAudioStream(stream);
      audioChunksRef.current = [];
      setMeta(null);

      // ✅ SPRINT 2 P3: Detect best MIME type for current device
      // Priority: webm (Chrome/Android) > mp4 (Safari/iOS) > mpeg (fallback)
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      }
      
      // ✅ SPRINT 2 P3: Normalize MIME type to prevent malformed types
      // Fix common issues: multiple slashes, typos, etc.
      mimeType = mimeType
        .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
        .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
        .trim();
      
      console.log(`[useTranscript] Using MIME type: ${mimeType}`);

      const recorder = new MediaRecorder(stream, { mimeType });
      
      // Reset chunk tracking
      pendingChunksRef.current = [];
      isTranscribingChunkRef.current = false;

      // ✅ PHASE 1: Function to handle large audio files
      // IMPORTANT: Blob.slice() creates invalid WebM chunks (same problem as MediaRecorder chunks)
      // Instead, we'll attempt full transcription with timeout, and if it fails, suggest manual splitting
      const handleLargeAudio = async (largeBlob: Blob, blobType: string) => {
        const fileSizeMB = largeBlob.size / (1024 * 1024);
        
        // ✅ PHASE 1: Enhanced logging for large audio handling
        console.log(`[useTranscript] 📊 Handling large audio:`, {
          fileSizeMB: fileSizeMB.toFixed(2),
          fileSizeBytes: largeBlob.size,
          mimeType: blobType,
          strategy: 'full transcription with timeout',
          timeoutSeconds: 300,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[useTranscript] Attempting to transcribe large audio (${fileSizeMB.toFixed(2)} MB) with extended timeout...`);
        setError(`Processing large audio file (${fileSizeMB.toFixed(2)} MB). This may take several minutes. Please wait...`);
        setIsTranscribing(true);
        
        try {
          // Attempt full transcription with timeout (handled by FirebaseWhisperService)
          const result = await firebaseWhisperService.transcribe(
            largeBlob,
            largeBlob.type || mimeType,
            {
              language: languagePreference === 'auto' ? undefined : languagePreference,
              timeout: 300000 // 5 minutes
            }
          );
          
          if (result.text?.trim()) {
            appendTranscript(result.text);
            setError(null);
            console.log(`[useTranscript] ✅ Large audio transcription successful: ${result.text.length} characters`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          
          // ✅ PHASE 1: Enhanced logging for large audio errors
          console.error(`[useTranscript] ❌ Error transcribing large audio:`, {
            fileSizeMB: fileSizeMB.toFixed(2),
            error: errorMessage,
            errorType: err instanceof Error ? err.constructor.name : typeof err,
            timestamp: new Date().toISOString(),
            fullError: err
          });
          
          console.error(`[useTranscript] Error transcribing large audio:`, errorMessage);
          
          // If timeout or size error, provide helpful guidance
          if (errorMessage.includes('tiempo') || errorMessage.includes('timeout') || errorMessage.includes('muy grande') || errorMessage.includes('too long')) {
            setError(`The audio file is very long (${fileSizeMB.toFixed(2)} MB) and transcription is taking too long. Please record in shorter segments (maximum 10-15 minutes each) or contact support for assisted processing.`);
          } else {
            setError(`Error processing large audio: ${errorMessage}. Please try recording in shorter segments (10-15 minutes each).`);
          }
        } finally {
          setIsTranscribing(false);
        }
      };

      // Transcribe chunks in real-time while recording
      const transcribeChunk = async (chunkBlob: Blob) => {
        // ✅ SPRINT 2 P3: Validate chunk before transcribing
        // Whisper requires minimum audio size (typically ~2KB for reliable transcription)
        const MIN_CHUNK_SIZE = 2000; // 2KB minimum for better reliability
        if (!chunkBlob || chunkBlob.size < MIN_CHUNK_SIZE) {
          console.log(`[useTranscript] Skipping chunk - too small: ${chunkBlob?.size || 0} bytes (minimum: ${MIN_CHUNK_SIZE} bytes)`);
          return;
        }
        
        // ✅ SPRINT 2 P3: Normalize blob type before validation
        let normalizedType = chunkBlob.type || mimeType;
        normalizedType = normalizedType
          .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
          .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
          .trim();
        
        // ✅ SPRINT 2 P3: Validate audio blob integrity
        if (!normalizedType || !normalizedType.startsWith('audio/')) {
          console.warn(`[useTranscript] Invalid audio type: "${chunkBlob.type}" -> normalized: "${normalizedType}"`);
          setError(`Formato de audio inválido: ${normalizedType}. Por favor, intente grabar nuevamente.`);
          return;
        }
        
        // ✅ SPRINT 2 P3: Create normalized blob if type was malformed
        const normalizedBlob = normalizedType !== chunkBlob.type
          ? new Blob([chunkBlob], { type: normalizedType })
          : chunkBlob;
        
        // ✅ PHASE 1: Enhanced logging for chunk processing
        console.log(`[useTranscript] 📝 Chunk processing:`, {
          chunkNumber: audioChunksRef.current.length,
          size: `${normalizedBlob.size} bytes`,
          sizeKB: `${(normalizedBlob.size / 1024).toFixed(2)} KB`,
          originalType: chunkBlob.type,
          normalizedType: normalizedType,
          wasNormalized: normalizedType !== chunkBlob.type,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[useTranscript] Transcribing chunk: ${normalizedBlob.size} bytes, original type: "${chunkBlob.type}", normalized type: "${normalizedType}"`);

        if (isTranscribingChunkRef.current) {
          // If already transcribing, queue this chunk
          pendingChunksRef.current.push(chunkBlob);
          console.log(`[useTranscript] Queuing chunk (${chunkBlob.size} bytes) - already transcribing`);
          return;
        }

        isTranscribingChunkRef.current = true;
        setIsTranscribing(true);

        console.log(`[useTranscript] Transcribing chunk: ${chunkBlob.size} bytes, type: ${chunkBlob.type}`);

        try {
          const result = await firebaseWhisperService.transcribe(
            normalizedBlob,
            normalizedType,
            {
              language: languagePreference === 'auto' ? undefined : languagePreference,
              timeout: 300000 // 5 minutes
            }
          );
          
          console.log(`[useTranscript] Transcription success: "${result.text?.substring(0, 50)}..."`);
          
          // Append transcribed text immediately
          if (result.text?.trim()) {
            appendTranscript(result.text);
          }
          
          // Update meta with latest result
          setMeta({
            detectedLanguage: result.language ?? null,
            averageLogProb: null, // FirebaseWhisperService doesn't provide this
            durationSeconds: result.duration
          });
          setError(null);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error('[useTranscript] Error transcribiendo chunk:', errorMessage, err);
          
          // ✅ FALLBACK: Show helpful message when Whisper fails with auth errors
          const isAuthError = errorMessage.includes('401') || 
                             errorMessage.includes('Unauthorized') || 
                             errorMessage.includes('no configurado') || 
                             errorMessage.includes('API key');
          
          if (isAuthError) {
            console.warn('[useTranscript] Whisper failed with auth error. Web Speech API fallback not available for blob transcription.');
            console.warn('[useTranscript] NOTE: Web Speech API only works in real-time, not with recorded blobs.');
            // Web Speech API cannot transcribe blobs - it only works in real-time
            // The fallback would require a complete rewrite to use Web Speech from the start
            setError('OpenAI API key error. Please check your API key configuration in .env.local or paste your transcript manually.');
          } else {
            // ✅ SPRINT 2 P3: Show error for ALL failures (user needs to know)
            // Previously errors were hidden, causing confusion
            if (errorMessage.includes('no configurado') || errorMessage.includes('API key')) {
              setError('Transcription service not configured. Please contact support or paste your transcript manually.');
            } else if (errorMessage.includes('timeout')) {
              setError('Transcription timeout. Please check your connection and try again.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
              setError('Network error during transcription. Please check your connection.');
          } else if (errorMessage.includes('corrupted') || errorMessage.includes('corrupt') || errorMessage.includes('unsupported')) {
            // Audio format/corruption errors - provide helpful guidance
            setError(errorMessage); // Already user-friendly from FirebaseWhisperService
            } else {
              // Show all other errors to user with context
              setError(`Transcription error: ${errorMessage}. Recording continues, but transcription may be incomplete.`);
            }
            
            // Log for debugging
            console.warn('[useTranscript] Chunk transcription failed, but recording continues...');
          }
        } finally {
          isTranscribingChunkRef.current = false;

          // Process next pending chunk if any
          if (pendingChunksRef.current.length > 0) {
            const nextChunk = pendingChunksRef.current.shift();
            if (nextChunk) {
              // Keep isTranscribing true while processing queue
              setIsTranscribing(true);
              // Process next chunk after a short delay to avoid overwhelming the API
              setTimeout(() => transcribeChunk(nextChunk), 200); // Increased delay for stability
            } else {
              // Only set to false if no more chunks to process
              setIsTranscribing(false);
            }
          } else {
            // Only set to false if no more chunks to process
            setIsTranscribing(false);
          }
        }
      };

      recorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          // ✅ SPRINT 2 P3: Normalize blob type immediately when received
          let blobType = event.data.type || mimeType;
          
          // Fix malformed MIME types from MediaRecorder
          blobType = blobType
            .replace(/\/+/g, '/') // Fix multiple slashes (//, ///, etc.)
            .replace(/webrm/gi, 'webm') // Fix typo: webrm -> webm
            .trim();
          
          // Create normalized blob if type was changed
          const normalizedBlob = blobType !== event.data.type 
            ? new Blob([event.data], { type: blobType })
            : event.data;
          
          console.log(`[useTranscript] Audio chunk received: ${event.data.size} bytes, original type: "${event.data.type}", normalized type: "${blobType}", recorder state: ${recorder.state}`);
          
          // Store chunk for final transcription if needed
          audioChunksRef.current.push(normalizedBlob);
          
          // WO-FIX-PRE-ANALYSIS: Disabled first chunk transcription - it's confusing to users
          // Only transcribe complete audio when recording stops (no intermediate transcriptions)
          if (audioChunksRef.current.length > 1) {
            console.log(`[useTranscript] Skipping intermediate chunk ${audioChunksRef.current.length} - will transcribe complete audio on stop`);
          } else {
            console.log(`[useTranscript] Chunk ${audioChunksRef.current.length} stored - will transcribe complete audio when recording stops`);
          }
        } else {
          console.warn('[useTranscript] Received empty or invalid audio chunk');
        }
      };

      // ✅ SPRINT 2 P3: Handle recorder errors
      recorder.onerror = (event: Event) => {
        const errorEvent = event as any;
        const errorMessage = errorEvent.error?.message || 'Unknown recorder error';
        console.error('[useTranscript] MediaRecorder error:', errorMessage, errorEvent);
        setError(`Recording error: ${errorMessage}. Please try again.`);
        setIsRecording(false);
        setIsTranscribing(false);
      };

      // ✅ SPRINT 2 P3: Monitor recorder state changes
      recorder.onstart = () => {
        // ✅ PHASE 1: Enhanced logging for recorder start
        console.log('[useTranscript] ✅ MediaRecorder started:', {
          state: recorder.state,
          mimeType: mimeType,
          streamActive: streamRef.current?.active || false,
          timestamp: new Date().toISOString()
        });
        console.log('[useTranscript] MediaRecorder started successfully');
      };

      recorder.onpause = () => {
        // ✅ PHASE 1: Enhanced logging for unexpected pause
        console.warn('[useTranscript] ⚠️ MediaRecorder paused unexpectedly:', {
          state: recorder.state,
          isRecording: isRecording,
          timestamp: new Date().toISOString()
        });
        console.warn('[useTranscript] MediaRecorder paused unexpectedly');
        setError('Recording paused unexpectedly. Please restart recording.');
      };

      recorder.onresume = () => {
        // ✅ PHASE 1: Enhanced logging for recorder resume
        console.log('[useTranscript] ▶️ MediaRecorder resumed:', {
          state: recorder.state,
          timestamp: new Date().toISOString()
        });
        console.log('[useTranscript] MediaRecorder resumed');
      };

      recorder.onstop = async () => {
        console.log('[useTranscript] MediaRecorder stopped. Final chunks:', audioChunksRef.current.length, 'Pending:', pendingChunksRef.current.length);
        
        // ✅ SPRINT 2 P3: Check if stop was unexpected
        if (isRecording) {
          console.warn('[useTranscript] Recorder stopped unexpectedly while recording flag is still true');
          setError('Recording stopped unexpectedly. Please check microphone permissions and try again.');
          setIsRecording(false);
        }
        
        // ✅ SPRINT 2 P3: Transcribe complete audio when recording stops
        // This ensures we have a complete, valid audio file instead of partial chunks
        if (audioChunksRef.current.length > 0 && pendingChunksRef.current.length === 0) {
          // ✅ SPRINT 2 P3: Ensure final blob has normalized MIME type
          const normalizedMimeType = mimeType
            .replace(/\/+/g, '/') // Fix multiple slashes
            .replace(/webrm/gi, 'webm') // Fix typo
            .trim();
          
          const finalBlob = new Blob(audioChunksRef.current, { type: normalizedMimeType });
          const fileSizeMB = finalBlob.size / (1024 * 1024);
          
          // ✅ PHASE 1: Enhanced production logging
          const durationMinutes = audioChunksRef.current.length > 0 
            ? (audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0) / (1024 * 1024) / 16) * 60 // Rough estimate
            : 0;
          const estimatedBitrate = durationMinutes > 0 
            ? (fileSizeMB * 8 * 1024) / durationMinutes 
            : 0;
          
          console.log(`[useTranscript] 📊 Audio stats:`, {
            duration: durationMinutes > 0 ? `${durationMinutes.toFixed(1)} min` : 'unknown',
            size: `${fileSizeMB.toFixed(2)} MB`,
            sizeBytes: finalBlob.size,
            estimatedBitrate: estimatedBitrate > 0 ? `${estimatedBitrate.toFixed(0)} kbps` : 'unknown',
            mimeType: normalizedMimeType,
            originalMimeType: mimeType,
            chunks: audioChunksRef.current.length,
            limit: '25 MB',
            margin: `${(25 - fileSizeMB).toFixed(2)} MB`,
            timestamp: new Date().toISOString()
          });
          
          console.log(`[useTranscript] Final blob created: ${finalBlob.size} bytes (${fileSizeMB.toFixed(2)} MB), type: "${normalizedMimeType}"`);
          
          // ✅ SPRINT 2 P3: Check if audio is too large
          // NOTE: We don't split manually because Blob.slice() creates invalid WebM chunks
          // Instead, we attempt full transcription with timeout, or suggest manual splitting
          const MAX_FILE_SIZE_MB = 25; // Whisper API practical limit
          if (fileSizeMB > MAX_FILE_SIZE_MB) {
            console.warn(`[useTranscript] Audio very large (${fileSizeMB.toFixed(2)} MB), attempting full transcription with extended timeout`);
            setError(`The audio file is very large (${fileSizeMB.toFixed(2)} MB). Processing with extended timeout. This may take several minutes. For best results, please record in segments of 10-15 minutes each.`);
            setIsTranscribing(true);
            
            // Attempt full transcription (will timeout if too large)
            await handleLargeAudio(finalBlob, normalizedMimeType);
          } else if (finalBlob.size >= 2000 && !isTranscribingChunkRef.current) {
            console.log('[useTranscript] Transcribing complete audio recording...');
            await transcribeChunk(finalBlob);
          } else if (finalBlob.size < 2000) {
            console.warn(`[useTranscript] Final audio too small to transcribe: ${finalBlob.size} bytes`);
          }
        }
        
        // Wait for any pending transcriptions to complete before clearing
        setTimeout(() => {
          audioChunksRef.current = [];
          pendingChunksRef.current = [];
          setIsTranscribing(false);
        }, 500);
      };

      const chunkInterval = mode === 'dictation' ? DICTATION_CHUNK_INTERVAL_MS : LIVE_CHUNK_INTERVAL_MS;

      // ✅ SPRINT 2 P3: Verify recorder state before starting
      if (recorder.state === 'inactive') {
        recorder.start(chunkInterval);
        console.log(`[useTranscript] Recording started with ${chunkInterval}ms interval, MIME: ${mimeType}`);
        
        // ✅ SPRINT 2 P3: Verify recorder actually started
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            const currentState = mediaRecorderRef.current.state;
            console.log(`[useTranscript] Recorder state after start: ${currentState}`);
            if (currentState === 'inactive' || currentState === 'paused') {
              console.error('[useTranscript] Recorder stopped unexpectedly after start');
              setError('Recording stopped unexpectedly. Please check microphone permissions and try again.');
              setIsRecording(false);
            }
          }
        }, 1000); // Check after 1 second
        
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } else {
        console.warn('[useTranscript] Recorder already active, state:', recorder.state);
        throw new Error('Recorder already active');
      }
    } catch (err) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setAudioStream(null);
    }
      setError(err instanceof Error ? err.message : 'Error iniciando grabación');
      setIsRecording(false);
    }
  }, [appendTranscript, languagePreference, mode, isWebSpeechAvailable, getSpeechRecognitionLang, isRecording]);

  const stopRecording = useCallback(() => {
    // ✅ SPRINT 2 P3: Web Speech API disabled - no need to stop it
    // Web Speech API was causing double microphone permission requests
    
    // Stop MediaRecorder if active
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
    setIsTranscribing(false);
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
