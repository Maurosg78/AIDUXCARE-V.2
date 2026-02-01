import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersistenceService, type SavedNote } from '@/services/PersistenceService';

export const NotesListPage = () => <div>Notes List</div>;

interface NoteDetailPageProps {
  id: string;
}

/**
 * Note Detail — loads a saved note by id and displays SOAP content (read-only).
 * Used when "View SOAP" from Patient History points to a consultation/note.
 */
export const NoteDetailPage: React.FC<NoteDetailPageProps> = ({ id }) => {
  const navigate = useNavigate();
  const [note, setNote] = useState<SavedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No note ID provided.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const loaded = await PersistenceService.getNoteById(id);
        if (cancelled) return;
        if (!loaded) {
          setError('Note not found or you do not have access.');
          setNote(null);
        } else {
          setNote(loaded);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError('Could not load the note.');
          setNote(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const soap = note?.soapData;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-32 bg-slate-200 rounded" />
            <div className="h-32 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/command-center')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mb-6"
          >
            ← Back to Command Center
          </button>
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600 mb-4">{error || 'Note not found.'}</p>
            <button
              onClick={() => navigate('/command-center')}
              className="text-brand-in-500 hover:text-brand-in-600 font-medium"
            >
              Go to Command Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-slate-900">SOAP Note</h1>
          <button
            onClick={() => navigate('/command-center')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Command Center
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {soap?.subjective && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Subjective</h2>
              <div className="text-slate-800 whitespace-pre-wrap">{soap.subjective}</div>
            </section>
          )}
          {soap?.objective && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Objective</h2>
              <div className="text-slate-800 whitespace-pre-wrap">{soap.objective}</div>
            </section>
          )}
          {soap?.assessment && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Assessment</h2>
              <div className="text-slate-800 whitespace-pre-wrap">{soap.assessment}</div>
            </section>
          )}
          {soap?.plan && (
            <section className="p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Plan</h2>
              <div className="text-slate-800 whitespace-pre-wrap">{soap.plan}</div>
            </section>
          )}
          {!soap?.subjective && !soap?.objective && !soap?.assessment && !soap?.plan && (
            <section className="p-6">
              <p className="text-slate-500">No SOAP content in this note.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
