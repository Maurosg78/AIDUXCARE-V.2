
export interface TranscriptionAreaProps {
  text: string;
}

export function TranscriptionArea({ text }: TranscriptionAreaProps) {
  return (
    <div className="transcription-area">
      <div className="transcription-field">
        <textarea
          id="transcription-textarea"
          name="transcription"
          className="transcription-text"
          value={text}
          readOnly
          rows={10}
          aria-label="Área de transcripción en tiempo real"
          placeholder="La transcripción aparecerá aquí..."
        />
      </div>
    </div>
  );
}
