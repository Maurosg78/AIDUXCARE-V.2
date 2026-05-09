import React, { useEffect, useState } from 'react';

import type { ClinicalDecisionReason } from '@/core/clinical-decisions/types';

interface RedFlagDismissModalProps {
  flagText: string;
  isOpen: boolean;
  onConfirm: (reason: ClinicalDecisionReason, note?: string) => void;
  onCancel: () => void;
}

const DISMISS_REASONS: Array<{
  value: Exclude<ClinicalDecisionReason, null>;
  label: string;
}> = [
  { value: 'false_positive', label: 'Falso positivo' },
  { value: 'controlled_condition', label: 'Condicion controlada/conocida' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'not_clinically_relevant_today', label: 'No relevante clinicamente hoy' },
];

export const RedFlagDismissModal: React.FC<RedFlagDismissModalProps> = ({
  flagText,
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState<ClinicalDecisionReason>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason(null);
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const trimmedNote = note.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Descartar alerta clinica</h2>
          <p className="mt-1 text-sm text-slate-600">
            Registra el motivo clinico antes de descartar esta alerta.
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">
          {flagText}
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Motivo</span>
          <select
            value={reason ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              setReason(value === '' ? null : (value as Exclude<ClinicalDecisionReason, null>));
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Seleccionar motivo</option>
            {DISMISS_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nota adicional (opcional)</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Nota adicional (opcional)"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={() => {
              if (!reason) return;
              onConfirm(reason, trimmedNote || undefined);
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Confirmar descarte
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedFlagDismissModal;
