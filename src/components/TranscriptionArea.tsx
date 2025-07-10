import React from 'react';

export interface TranscriptionAreaProps {
  text: string;
}

export function TranscriptionArea({ text }: TranscriptionAreaProps) {
  return (
    <div className="transcription-area">
      <form className="transcription-form">
        <div className="transcription-field">
          <label htmlFor="transcription-textarea">
            Transcripción en tiempo real
          </label>
          <textarea
            id="transcription-textarea"
            name="transcription"
            className="transcription-text"
            value={text}
            readOnly
            rows={10}
            aria-label="Área de transcripción en tiempo real"
          />
        </div>
      </form>
    </div>
  );
}
