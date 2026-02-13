/**
 * WO-MINIMAL-BASELINE: Modal para establecer "Resumen clínico inicial" en pacientes existentes.
 * Permite pegar notas del EMR (vía principal) o un solo campo "Current treatment status" (secundaria).
 * Requiere Plan explícito (guard-rail); copy alineado con docs/product/BASELINE_PACIENTES_EXISTENTES.md.
 */

import React, { useState, useCallback } from 'react';
import { FileText, Loader2, AlertCircle, Info } from 'lucide-react';

export type InitialSummaryInputMode = 'paste' | 'form';

export interface InitialClinicalSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  onSuccess?: () => void;
  /** Called with (freeText, mode). Returns baseline id or throws. */
  onSubmit: (freeText: string, mode: InitialSummaryInputMode) => Promise<string>;
}

const PASTE_PLACEHOLDER =
  'Paste a recent session (or several) you have for this patient from your EMR or notes. We use this to generate context for upcoming follow-ups.';
const FORM_PLACEHOLDER =
  'Describe the current treatment status: condition, relevant findings, and what treatment is in progress.';
const DISCLAIMER =
  'This summary does not replace an initial assessment. It is only a starting point to document follow-ups for patients already in treatment.';
const PLAN_REQUIRED_MSG =
  'To generate follow-ups, we need to know what treatment is in progress.';

export function InitialClinicalSummaryModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess,
  onSubmit,
}: InitialClinicalSummaryModalProps) {
  const [mode, setMode] = useState<InitialSummaryInputMode>('paste');
  const [pasteText, setPasteText] = useState('');
  const [formText, setFormText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentText = mode === 'paste' ? pasteText : formText;
  const setCurrentText = mode === 'paste' ? setPasteText : setFormText;
  const hasContent = currentText.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    const text = currentText.trim();
    if (!text) {
      setError('Please type or paste content before continuing.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit(text, mode);
      onSuccess?.();
      onClose();
      setPasteText('');
      setFormText('');
    } catch (e: any) {
      setError(e?.message ?? 'Error saving summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentText, mode, onSubmit, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setError(null);
      setPasteText('');
      setFormText('');
      onClose();
    }
  }, [loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-800 rounded-t-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Initial clinical summary</h2>
                <p className="text-sm text-slate-200 mt-1">
                  Is this patient already in treatment with you? To run follow-ups in the app we need an initial clinical summary.
                </p>
                {patientName && (
                  <p className="text-sm text-slate-300 mt-2">
                    <strong>Patient:</strong> {patientName}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-slate-300 hover:text-white p-1 rounded"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">{DISCLAIMER}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex-shrink-0 px-6 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === 'paste'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Paste from EMR / notes
          </button>
          <button
            type="button"
            onClick={() => setMode('form')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              mode === 'form'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Current treatment status
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder={mode === 'paste' ? PASTE_PLACEHOLDER : FORM_PLACEHOLDER}
            className="w-full h-40 min-h-[120px] rounded-xl border border-slate-200 p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 resize-y"
            disabled={loading}
          />
          {error && (
            <div className="mt-3 flex gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pb-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasContent || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Set summary and continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
