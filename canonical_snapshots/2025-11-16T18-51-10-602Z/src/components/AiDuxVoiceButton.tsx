import React from 'react';
import { Mic, Loader2 } from 'lucide-react';

interface AiDuxVoiceButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

export const AiDuxVoiceButton: React.FC<AiDuxVoiceButtonProps> = ({
  isListening,
  isProcessing,
  onClick,
}) => {
  const label = isProcessing ? 'Processing…' : isListening ? 'Listening…' : 'AiDux Voice (beta)';
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition shadow-sm ${
          isListening
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-900 text-white hover:bg-slate-800'
        } disabled:opacity-60`}
        onClick={onClick}
        disabled={isProcessing}
        title="Tap and speak: ‘AiDux, start dictation’, ‘AiDux, summarize this’, ‘AiDux, dame parámetros de tecar…’"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        <span>{label}</span>
      </button>
      <p className="text-xs text-slate-500">
        AiDux Voice es informativo y no reemplaza el juicio clínico. No almacenamos audio; solo comandos breves.
      </p>
    </div>
  );
};

export default AiDuxVoiceButton;
