import React, { useRef, useState, useEffect } from 'react';
import { MessageCircle, Mic, Loader2, AlertCircle, PanelsTopLeft } from 'lucide-react';

interface AiDuxFloatingButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  hasError?: boolean;
  panelOpen: boolean;
  onActivateVoice: () => void;
  onTogglePanel: () => void;
  onLongPressPlaceholder?: () => void;
}

const LONG_PRESS_THRESHOLD = 600;

export const AiDuxFloatingButton: React.FC<AiDuxFloatingButtonProps> = ({
  isListening,
  isProcessing,
  hasError,
  panelOpen,
  onActivateVoice,
  onTogglePanel,
  onLongPressPlaceholder,
}) => {
  const timeoutRef = useRef<number | null>(null);
  const infoTimeoutRef = useRef<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handlePointerDown = () => {
    if (!onLongPressPlaceholder) return;
    timeoutRef.current = window.setTimeout(() => {
      onLongPressPlaceholder();
    }, LONG_PRESS_THRESHOLD);
  };

  const clearLongPress = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const triggerInfoCard = () => {
    if (infoTimeoutRef.current) {
      window.clearTimeout(infoTimeoutRef.current);
    }
    setShowInfo(true);
    infoTimeoutRef.current = window.setTimeout(() => {
      setShowInfo(false);
      infoTimeoutRef.current = null;
    }, 4500);
  };

  const handleVoiceClick = () => {
    triggerInfoCard();
    onActivateVoice();
  };

  useEffect(() => {
    return () => {
      clearLongPress();
      if (infoTimeoutRef.current) {
        window.clearTimeout(infoTimeoutRef.current);
        infoTimeoutRef.current = null;
      }
    };
  }, []);

  const buttonLabel = isProcessing
    ? 'AiDux is processing…'
    : isListening
    ? 'AiDux is listening…'
    : 'AiDux Assistant';

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePanel}
          className={`inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs transition shadow-sm ${
            panelOpen
              ? 'border-transparent bg-gradient-to-r from-[#7c3aed] to-[#38bdf8] text-white shadow'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
          }`}
          aria-label={panelOpen ? 'Hide AiDux panel' : 'Show AiDux panel'}
        >
          <PanelsTopLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleVoiceClick}
          onPointerDown={handlePointerDown}
          onPointerUp={clearLongPress}
          onPointerLeave={clearLongPress}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            hasError
              ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-500 hover:to-rose-700 focus:ring-rose-400'
              : isListening
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-600 focus:ring-emerald-300'
                : 'bg-gradient-to-r from-[#7c3aed] via-[#6366f1] to-[#38bdf8] text-white hover:via-[#7c3aed] focus:ring-[#8b5cf6]'
          }`}
          aria-label="Activate AiDux voice assistant"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          <span>{buttonLabel}</span>
        </button>
      </div>
      {showInfo && (
        <div className="max-w-sm rounded-3xl border border-slate-100 bg-white/95 px-5 py-4 text-sm text-slate-600 shadow-2xl backdrop-blur">
          <p className="font-semibold text-slate-800">AiDux Assistant (beta)</p>
          <p className="mt-2 text-slate-600">
            Say: “Aidux, start dictation”, “Aidux, dame parámetros de tecar…”, “Aidux, what flag criteria apply here?”.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Informational only — not medical advice. Audio is never stored.
          </p>
        </div>
      )}
    </div>
  );
};

export default AiDuxFloatingButton;
