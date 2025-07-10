import React from 'react';

export interface TranscriptionAreaProps {
  text: string;
}

export function TranscriptionArea({ text }: TranscriptionAreaProps) {
  return (
    <div className="transcription-area">
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
