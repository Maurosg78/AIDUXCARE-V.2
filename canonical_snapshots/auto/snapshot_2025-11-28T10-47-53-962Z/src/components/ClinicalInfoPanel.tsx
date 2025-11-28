import React from 'react';
import { X } from 'lucide-react';

type ClinicalInfoStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ClinicalInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  answer: string;
  status: ClinicalInfoStatus;
  errorMessage?: string | null;
  category?: 'medication' | 'tecartherapy';
}

export const ClinicalInfoPanel: React.FC<ClinicalInfoPanelProps> = ({
  isOpen,
  onClose,
  query,
  answer,
  status,
  errorMessage,
  category,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end bg-gray-900/30">
      <div className="h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Clinical Info (AiDux Voice)</p>
            {category && (
              <p className="text-xs uppercase tracking-wide text-slate-500">{category === 'medication' ? 'Medication context' : 'Tecar therapy context'}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close clinical info"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Query</p>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
              {query || '—'}
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AiDux Answer</p>
            <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 whitespace-pre-wrap">
              {status === 'loading' && 'Generating response…'}
              {status === 'error' && (errorMessage || 'AiDux could not complete this request. Try again later.')}
              {status === 'ready' && (answer || 'No answer provided.')}
              {status === 'idle' && 'Awaiting command…'}
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            This information is advisory, based on general evidence. It does not constitute a prescription nor replace clinical judgment. Always review local guidelines and technical specifications.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ClinicalInfoPanel;
