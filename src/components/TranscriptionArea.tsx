import React from 'react';

export interface TranscriptionAreaProps {
  text: string;
}

export function TranscriptionArea({ text }: TranscriptionAreaProps) {
  return (
    <div className="transcription-area">
      <div className="transcription-container">
        <label htmlFor="transcription-textarea">
          Transcripción en tiempo real
        </label>
        <textarea
          id="transcription-textarea"
          className="transcription-text"
          value={text}
          readOnly
          aria-label="Transcripción en tiempo real"
        />
      </div>
    </div>
  );
}
