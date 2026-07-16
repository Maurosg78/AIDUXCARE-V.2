import React, { useEffect, useId, useState } from 'react';
import { X } from 'lucide-react';

import type { CarriedForwardDiscardReason } from './TodayPatientsPanel';

export interface CarriedForwardDiscardSelection {
  discardedReason: CarriedForwardDiscardReason | null;
  discardedReasonText: string | null;
}

interface DiscardCarriedForwardPatientModalProps {
  isOpen: boolean;
  patientName: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (selection: CarriedForwardDiscardSelection) => void | Promise<void>;
}

const DISCARD_REASON_OPTIONS: Array<{
  value: CarriedForwardDiscardReason;
  label: string;
}> = [
  { value: 'no_show', label: 'No se presentó' },
  { value: 'rescheduled', label: 'Reagendado' },
  { value: 'patient_cancelled', label: 'Paciente cancela' },
  { value: 'discharged', label: 'Se da de baja' },
  { value: 'other', label: 'Otro' },
];

export const DiscardCarriedForwardPatientModal: React.FC<DiscardCarriedForwardPatientModalProps> = ({
  isOpen,
  patientName,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  const titleId = useId();
  const [selectedReason, setSelectedReason] = useState<CarriedForwardDiscardReason | null>(null);
  const [otherReasonText, setOtherReasonText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedReason(null);
    setOtherReasonText('');
  }, [isOpen, patientName]);

  if (!isOpen) {
    return null;
  }

  const isOtherReasonSelected = selectedReason === 'other';
  const normalizedOtherReasonText = otherReasonText.trim();
  const hasOtherReasonText = normalizedOtherReasonText !== '';
  const shouldPersistOtherReasonText = isOtherReasonSelected && hasOtherReasonText;
  const discardedReasonText = shouldPersistOtherReasonText
    ? normalizedOtherReasonText
    : null;
  const isOtherReasonTextDisabled = !isOtherReasonSelected;
  const isOtherReasonTextUnavailable = isOtherReasonTextDisabled || isSubmitting;

  const handleConfirm = (): void => {
    const discardSelection: CarriedForwardDiscardSelection = {
      discardedReason: selectedReason,
      discardedReasonText,
    };
    void onConfirm(discardSelection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 font-apple">
              ¿Por qué descartas esta cita?
            </h2>
            <p className="mt-1 truncate text-sm text-slate-600 font-apple">
              {patientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">
          <fieldset className="space-y-3">
            <legend className="sr-only">Razón del descarte</legend>
            {DISCARD_REASON_OPTIONS.map((option) => {
              const optionId = `${titleId}-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className="flex cursor-pointer items-center gap-3 text-sm text-slate-800 font-apple"
                >
                  <input
                    id={optionId}
                    type="radio"
                    name="carried-forward-discard-reason"
                    value={option.value}
                    checked={selectedReason === option.value}
                    onChange={() => setSelectedReason(option.value)}
                    disabled={isSubmitting}
                    className="h-4 w-4 border-slate-300 text-red-700 focus:ring-red-600"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </fieldset>

          <label className="mt-4 block text-sm font-medium text-slate-700 font-apple" htmlFor={`${titleId}-other-text`}>
            Otro
          </label>
          <textarea
            id={`${titleId}-other-text`}
            value={otherReasonText}
            onChange={(event) => setOtherReasonText(event.target.value)}
            disabled={isOtherReasonTextUnavailable}
            rows={3}
            className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          />

          {errorMessage ? (
            <p role="alert" className="mt-3 text-sm text-red-700 font-apple">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-apple"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50 font-apple"
          >
            {isSubmitting ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
