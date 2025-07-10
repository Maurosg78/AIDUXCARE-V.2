import React from 'react';

interface RecordingStatus {
  status: 'idle' | 'recording' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
}

export interface TranscriptionAreaProps {
  text: string;
}

export function TranscriptionArea({ text }: TranscriptionAreaProps) {
  return (
    <div className="transcription-area">
      <label htmlFor="transcription-text">
        Transcripción en tiempo real:
      </label>
      <textarea
        id="transcription-text"
        className="transcription-text"
        value={text}
        readOnly
        aria-label="Transcripción en tiempo real"
      />
    </div>
  );
}
