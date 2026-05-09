import React, { useEffect, useState } from 'react';

import type { MedicationDecisionState } from '@/core/clinical-decisions/types';

interface AddMedicationModalProps {
  isOpen: boolean;
  onConfirm: (medication: {
    name: string;
    dose?: string;
    frequency?: string;
    state: MedicationDecisionState;
    note?: string;
  }) => void;
  onCancel: () => void;
}

const MEDICATION_STATES: Array<{
  value: MedicationDecisionState;
  label: string;
}> = [
  { value: 'initiated', label: 'Iniciado' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'changed', label: 'Cambiado' },
  { value: 'confirmed_active', label: 'Confirmado activo' },
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [state, setState] = useState<MedicationDecisionState | ''>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDose('');
      setFrequency('');
      setState('');
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const trimmedName = name.trim();
  const trimmedDose = dose.trim();
  const trimmedFrequency = frequency.trim();
  const trimmedNote = note.trim();
  const canConfirm = trimmedName.length > 0 && state !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Añadir medicamento</h2>
          <p className="mt-1 text-sm text-slate-600">
            Registra el medicamento como decision clinica del fisioterapeuta.
          </p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nombre del medicamento</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Dosis</span>
            <input
              type="text"
              value={dose}
              onChange={(event) => setDose(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Frecuencia</span>
            <input
              type="text"
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Estado</span>
          <select
            value={state}
            onChange={(event) => setState(event.target.value as MedicationDecisionState | '')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Seleccionar estado</option>
            {MEDICATION_STATES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Nota</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
            disabled={!canConfirm}
            onClick={() => {
              if (!canConfirm) return;
              onConfirm({
                name: trimmedName,
                ...(trimmedDose ? { dose: trimmedDose } : {}),
                ...(trimmedFrequency ? { frequency: trimmedFrequency } : {}),
                state,
                ...(trimmedNote ? { note: trimmedNote } : {}),
              });
            }}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Añadir medicamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMedicationModal;
