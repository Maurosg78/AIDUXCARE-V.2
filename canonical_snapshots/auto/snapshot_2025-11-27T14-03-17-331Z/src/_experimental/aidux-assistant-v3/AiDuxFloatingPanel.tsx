import React from 'react';
import { X } from 'lucide-react';
import type { AssistantInteraction } from '../hooks/useAiDuxAssistant';

interface AiDuxFloatingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: AssistantInteraction[];
  currentInteraction: AssistantInteraction | null;
  onSelect: (id: string) => void;
  onClear: (id: string) => void;
}

export const AiDuxFloatingPanel: React.FC<AiDuxFloatingPanelProps> = ({
  isOpen,
  onClose,
  interactions,
  currentInteraction,
  onSelect,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="fixed bottom-28 right-6 z-40">
      <div className="w-[280px] rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AiDux Assistant</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
            aria-label="Close assistant panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
          {interactions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 text-center">
              Say “Aidux, start dictation” to begin.
            </div>
          ) : (
            interactions.map((interaction) => (
              <button
                key={interaction.id}
                type="button"
                onClick={() => onSelect(interaction.id)}
                className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                  currentInteraction?.id === interaction.id
                    ? 'border-[#7c3aed] bg-[#f5f3ff] text-slate-900 shadow'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-[#c4b5fd] hover:bg-[#f8f6ff]'
                }`}
              >
                <p className="line-clamp-2 text-xs font-medium text-slate-700">
                  {interaction.type === 'summary'
                    ? 'Summary request'
                    : interaction.type === 'system'
                      ? interaction.query
                      : interaction.query}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {new Date(interaction.timestamp).toLocaleTimeString('en-CA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))
          )}
        </div>
        {currentInteraction && (
          <div className="px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 whitespace-pre-wrap">
              {currentInteraction.error
                ? `⚠️ ${currentInteraction.error}`
                : currentInteraction.answer || currentInteraction.query}
            </div>
          </div>
        )}
        <footer className="px-4 pb-4 text-[10px] leading-tight text-slate-500">
          Informational only. Audio never stored.
        </footer>
      </div>
    </aside>
  );
};

export default AiDuxFloatingPanel;
