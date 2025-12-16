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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Pending Notes</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700" aria-label="Close">✕</button>
        </div>

        <div className="mb-3">
          <label htmlFor="notesPatientSearch" className="mb-1 block text-sm font-medium text-slate-700">Search Patient</label>
          <input
            id="notesPatientSearch"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Type name or email…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-primary-blue"
          />
          {term && (
            <div className="mt-2 max-h-40 overflow-auto rounded-lg border border-slate-200">
              {patients.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500">No results</div>
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
              Remove patient filter
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200">
          {loading && <div className="px-4 py-6 text-sm text-slate-500">Loading…</div>}
          {!loading && notes.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">You have no pending notes.</div>
          )}
          {!loading && notes.length > 0 && (
            <ul className="divide-y divide-slate-200">
              {notes.map((n) => (
                <li key={n.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{n.patientName ?? 'Patient'}</div>
                    <div className="text-xs text-slate-500">Status: {n.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/patients/${n.patientId}/dashboard`} className="rounded-lg border border-primary-blue/30 bg-white text-primary-blue px-3 py-1.5 text-sm hover:bg-primary-blue/10 hover:border-primary-blue transition-colors font-medium">
                      View Patient
                    </Link>
                    {n.id && (
                      <Link to={`/notes/${n.id}/edit`} className="bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white px-3 py-1.5 text-sm rounded-lg font-medium transition-all">
                        Continue Note
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="rounded-xl border border-primary-blue/30 bg-white text-primary-blue px-4 py-2 hover:bg-primary-blue/10 hover:border-primary-blue transition-colors font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}


