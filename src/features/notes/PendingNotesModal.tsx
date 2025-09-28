// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { fetchPendingNotes } from '../../repositories/notesRepo';
import { usePatientQuickSearch } from '../../hooks/usePatientQuickSearch';
import { logAction } from '../../analytics/events';

type Props = { open: boolean; onClose: () => void };

export default function PendingNotesModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [term, setTerm] = useState('');
  const { results: patients } = usePatientQuickSearch(term);
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>();
  type NoteRow = { id: string; patientId: string; patientName?: string; status: string };
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user?.uid) return;
    setLoading(true);
    fetchPendingNotes(user.uid, selectedPatientId)
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [open, user?.uid, selectedPatientId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Notas pendientes</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Cerrar">✕</button>
        </div>

        <div className="mb-3">
          <label htmlFor="notesPatientSearch" className="mb-1 block text-sm font-medium text-slate-700">Buscar paciente</label>
          <input
            id="notesPatientSearch"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Escribe nombre o email…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-in-end"
          />
          {term && (
            <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200">
              {patients.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">Sin resultados</div>
              )}
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    logAction('filter_notes_by_patient', '/command-center');
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {p.name} {p.email ? <span className="text-slate-500">· {p.email}</span> : null}
                </button>
              ))}
            </div>
          )}
          {selectedPatientId && (
            <button onClick={() => setSelectedPatientId(undefined)} className="mt-2 text-sm text-slate-600 hover:text-slate-800">
              Quitar filtro de paciente
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200">
          {loading && <div className="px-4 py-6 text-sm text-slate-500">Cargando…</div>}
          {!loading && notes.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">No tienes notas pendientes.</div>
          )}
          {!loading && notes.length > 0 && (
            <ul className="divide-y divide-slate-200">
              {notes.map((n) => (
                <li key={n.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{n.patientName ?? 'Paciente'}</div>
                    <div className="text-xs text-slate-500">Estado: {n.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/patients/${n.patientId}/dashboard`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
                      Ver paciente
                    </Link>
                    {n.id && (
                      <Link to={`/notes/${n.id}/edit`} className="btn-in px-3 py-1.5 text-sm">
                        Continuar nota
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2">Cerrar</button>
        </div>
      </div>
    </div>
  );
}