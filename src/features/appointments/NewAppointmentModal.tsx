// @ts-nocheck
import { useState } from 'react';

import { createAppointment } from '../../repositories/appointmentsRepo';
import { useAuth } from '../../context/AuthContext';
import { usePatientQuickSearch } from '../../hooks/usePatientQuickSearch';
import { logAction } from '../../analytics/events';

type Props = { open: boolean; onClose: () => void; onCreated?: (id: string) => void };

export default function NewAppointmentModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const { results, loading } = usePatientQuickSearch(query);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  
  // Inicializar fecha con valor válido (mañana a las 10:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const [date, setDate] = useState<string>(tomorrow.toISOString().slice(0, 16));
  const [duration, setDuration] = useState<number>(45);
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const canCreate = Boolean(selectedPatient && date);

  const handleCreate = async () => {
    if (!user?.uid || !selectedPatient || !date) return;
    const id = await createAppointment({
      clinicianUid: user.uid,
      patientId: selectedPatient.id,
      date: new Date(date),
      durationMin: duration,
      notes,
    });
    logAction('create_appointment_success', '/command-center');
    onCreated?.(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Nueva cita</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>

        <div className="mb-1 block text-sm font-medium text-slate-700">Paciente</div>
        {!selectedPatient ? (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="patientSearch"
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-in-end"
              placeholder="Buscar por nombre o email"
            />
            <div className="max-h-40 overflow-auto rounded-lg border border-slate-200">
              {loading && <div className="px-3 py-2 text-sm text-slate-500">Buscando…</div>}
              {!loading && results.length === 0 && query && (
                <div className="px-3 py-2 text-sm text-slate-500">Sin resultados</div>
              )}
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedPatient({ id: r.id, name: r.name })}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {r.name} {r.email ? <span className="text-slate-500">· {r.email}</span> : null}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
            <div className="text-sm">
              <div className="font-medium">{selectedPatient.name}</div>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="text-sm text-slate-500 hover:text-slate-700">
              cambiar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="apptDate" className="mb-1 block text-sm font-medium text-slate-700">Fecha y hora</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              id="apptDate"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-in-end"
            />
          </div>
          <div>
            <label htmlFor="apptDuration" className="mb-1 block text-sm font-medium text-slate-700">Duración (min)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              id="apptDuration"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-in-end"
            />
          </div>
        </div>

        <label htmlFor="apptNotes" className="mb-1 mt-4 block text-sm font-medium text-slate-700">Notas (opcional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          id="apptNotes"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-in-end"
          placeholder="Motivo breve, indicaciones…"
        />

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2">Cancelar</button>
          <button disabled={!canCreate} onClick={handleCreate} className="btn-in disabled:opacity-50">Crear cita</button>
        </div>
      </div>
    </div>
  );
}