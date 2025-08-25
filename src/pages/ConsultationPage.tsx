import { useState, useCallback } from 'react';

import { TranscriptionArea } from '../components/TranscriptionArea';
import { ActionBar } from '../components/ActionBar';
import { AudioPipelineService } from '../services/AudioPipelineService';

interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp?: number;
}

interface ConsultationError {
  code: string;
  message: string;
  details?: unknown;
}

export default function ConsultationPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<ConsultationError | null>(null);

  const handleTranscriptionStart = useCallback(() => {
    setError(null);
    setTranscription('');
  }, []);

  const handleTranscriptionResult = useCallback((result: TranscriptionResult) => {
    setTranscription(result.text);
  }, []);

  const handleTranscriptionError = useCallback((error: ConsultationError) => {
    setError(error);
    setIsRecording(false);
  }, []);

  const handleTranscriptionEnd = useCallback(() => {
    setIsRecording(false);
  }, []);

  const audioPipeline = new AudioPipelineService({
    onTranscriptionStart: handleTranscriptionStart,
    onTranscriptionEnd: handleTranscriptionEnd,
    onTranscriptionResult: handleTranscriptionResult,
    onTranscriptionError: handleTranscriptionError
  });

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      audioPipeline.stopRecording();
    } else {
      try {
        await audioPipeline.startRecording();
        setIsRecording(true);
      } catch (err) {
        const consultationError: ConsultationError = {
          code: 'RECORDING_ERROR',
          message: err instanceof Error ? err.message : 'Error al iniciar grabación'
        };
        handleTranscriptionError(consultationError);
      }
    }
  }, [isRecording]);

  return (
    <div className="consultation-page">
      <h1>Consulta</h1>
      <ActionBar isRecording={isRecording} onAction={toggleRecording} />
      <TranscriptionArea text={transcription} />
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
}
