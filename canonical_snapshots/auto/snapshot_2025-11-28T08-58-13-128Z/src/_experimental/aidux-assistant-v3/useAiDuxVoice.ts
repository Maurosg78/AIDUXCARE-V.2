import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenAIWhisperService, WhisperSupportedLanguage, WhisperMode } from '../services/OpenAIWhisperService';
import AiDuxVoiceService from '../services/AiDuxVoiceService';
import type { AiDuxVoiceCommand } from '../services/AiDuxVoiceTypes';

interface ClinicalInfoResult {
  query: string;
  answer: string;
  category: 'medication' | 'tecartherapy';
}

interface UseAiDuxVoiceOptions {
  languagePreference: WhisperSupportedLanguage;
  onSetMode: (mode: WhisperMode) => void;
  onStopTranscription: () => void;
  onSummaryResult: (summary: string) => void;
  onClinicalInfoResult: (result: ClinicalInfoResult) => void;
  onClinicalInfoLoading?: (category: 'medication' | 'tecartherapy', query: string) => void;
  onClinicalInfoError?: (message: string) => void;
  runSummary: () => Promise<string | null>;
  runClinicalInfoQuery: (params: {
    queryText: string;
    category: 'medication' | 'tecartherapy';
    language: 'en' | 'es' | 'fr';
  }) => Promise<{ answerText: string } | null>;
}

interface UseAiDuxVoiceReturn {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  listenForCommand: () => Promise<void>;
}

export const useAiDuxVoice = ({
  languagePreference,
  onSetMode,
  onStopTranscription,
  onSummaryResult,
  onClinicalInfoResult,
  onClinicalInfoLoading,
  onClinicalInfoError,
  runSummary,
  runClinicalInfoQuery,
}: UseAiDuxVoiceOptions): UseAiDuxVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanupStream = useCallback(() => {
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping media recorder', err);
      }
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping track', err);
        }
      });
      streamRef.current = null;
    }
  }, []);

  const handleCommand = useCallback(async (command: AiDuxVoiceCommand) => {
    switch (command.intent) {
      case 'start_live':
        onSetMode('live');
        break;
      case 'start_dictation':
        onSetMode('dictation');
        break;
      case 'stop_transcription':
        onStopTranscription();
        break;
      case 'summarize_for_record': {
        setIsProcessing(true);
        try {
          const summary = await runSummary();
          if (summary) {
            onSummaryResult(summary);
          } else {
            setError('No transcript available to summarize.');
          }
        } catch (err) {
          console.error('Voice summary failed', err);
          setError('Unable to summarize right now.');
        } finally {
          setIsProcessing(false);
        }
        break;
      }
      case 'ask_medication_info':
      case 'ask_medication_effect':
      case 'ask_tecartherapy_info':
      case 'ask_tecar_parameters':
      case 'ask_modality_info':
      case 'ask_exercise_prescription_safety':
      case 'ask_flag_criteria':
      case 'ask_range_of_motion_norms': {
        const language = command.payload?.language ?? languagePreference ?? 'en';
        const categoryMap: Record<string, 'medication' | 'tecartherapy' | 'modality' | 'exercise_safety' | 'flag_criteria' | 'rom_norms'> = {
          ask_medication_info: 'medication',
          ask_medication_effect: 'medication',
          ask_tecartherapy_info: 'tecartherapy',
          ask_tecar_parameters: 'tecartherapy',
          ask_modality_info: 'modality',
          ask_exercise_prescription_safety: 'exercise_safety',
          ask_flag_criteria: 'flag_criteria',
          ask_range_of_motion_norms: 'rom_norms',
        };
        const category = categoryMap[command.intent];
        const context = {
          medicationName: command.payload?.medicationName,
          conditionOrRegion: command.payload?.conditionOrRegion,
          modalityName: command.payload?.modalityName,
        };
        onClinicalInfoLoading?.(category, command.rawText);
        setIsProcessing(true);
        try {
          const response = await runClinicalInfoQuery({
            queryText: command.rawText,
            category,
            language: language as 'en' | 'es' | 'fr',
            context,
          });
          if (response?.answerText) {
            onClinicalInfoResult({
              query: command.rawText,
              answer: response.answerText,
              category,
            });
          } else {
            const message = 'No clinical information available for that query.';
            setError(message);
            onClinicalInfoError?.(message);
          }
        } catch (err) {
          console.error('Clinical info query failed', err);
          const message = 'Unable to fetch clinical info.';
          setError(message);
          onClinicalInfoError?.(message);
        } finally {
          setIsProcessing(false);
        }
        break;
      }
      case 'unknown':
      default:
        setError('AiDux no entendió ese comando. Usa frases como “Aidux, start dictation”.');
        break;
    }
  }, [languagePreference, onClinicalInfoError, onClinicalInfoLoading, onClinicalInfoResult, onSetMode, onStopTranscription, onSummaryResult, runClinicalInfoQuery, runSummary]);

  const processAudioChunks = useCallback(async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];
    if (blob.size === 0) {
      setError('No audio detected.');
      return;
    }

    try {
      setIsProcessing(true);
      const whisperResult = await OpenAIWhisperService.transcribe(blob, {
        languageHint: languagePreference,
        mode: 'live',
      });
      const command = AiDuxVoiceService.mapToCommand(whisperResult.text);
      await handleCommand(command);
    } catch (err) {
      console.error('AiDux Voice transcription error', err);
      setError('Could not process voice command.');
    } finally {
      setIsProcessing(false);
    }
  }, [handleCommand, languagePreference]);

  const listenForCommand = useCallback(async () => {
    setError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Browser does not support microphone access.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsListening(false);
        await processAudioChunks();
        cleanupStream();
      };

      recorder.start();
      setIsListening(true);

      // Stop after ~2 seconds to keep commands short
      window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 2000);
    } catch (err) {
      console.error('Microphone access denied or failed', err);
      setError('Microphone not available. Check permissions.');
      cleanupStream();
    }
  }, [cleanupStream, processAudioChunks]);

  useEffect(() => () => {
    cleanupStream();
  }, [cleanupStream]);

  return {
    isListening,
    isProcessing,
    error,
    listenForCommand,
  };
};

export default useAiDuxVoice;
