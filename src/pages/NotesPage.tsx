import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PersistenceService, type SOAPData, type SavedNote } from '@/services/PersistenceService';

export const NotesListPage = () => <div>Notes List</div>;

interface NoteDetailPageProps {
  id: string;
}

/**
 * Note Detail — loads a saved note by id and displays SOAP content (read-only).
 * Used when "View SOAP" from the history view points to a consultation/note.
 */
export const NoteDetailPage: React.FC<NoteDetailPageProps> = ({ id }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [note, setNote] = useState<SavedNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSOAP, setEditedSOAP] = useState<SOAPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('errorNoId');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const loaded = await PersistenceService.getNoteById(id);
        if (cancelled) return;
        if (!loaded) {
          setError('errorNotFound');
          setNote(null);
          setEditedSOAP(null);
        } else {
          setNote(loaded);
          setEditedSOAP(loaded.soapData);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError('errorLoad');
          setNote(null);
          setEditedSOAP(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const soap = note?.soapData;
  const soapToRender = isEditing ? editedSOAP : soap;

  const handleSOAPFieldChange = (field: keyof SOAPData, value: string) => {
    const currentSOAP = editedSOAP;
    if (!currentSOAP) return;
    const updatedSOAP = {
      ...currentSOAP,
      [field]: value,
    };
    setEditedSOAP(updatedSOAP);
  };

  const handleCancelEdit = () => {
    const originalSOAP = note?.soapData ?? null;
    setEditedSOAP(originalSOAP);
    setIsEditing(false);
    setSaveSuccessMessage(null);
    setError(null);
  };

  const handleSaveChanges = async () => {
    const currentNote = note;
    const currentSOAP = editedSOAP;
    if (!currentNote || !currentSOAP) return;

    try {
      setError(null);
      setSaveSuccessMessage(null);
      const updatedTimestamp = new Date().toISOString();
      const updatedSOAP = {
        ...currentSOAP,
        timestamp: updatedTimestamp,
      };
      const updatedNote = {
        ...currentNote,
        soapData: updatedSOAP,
        updatedAt: updatedTimestamp,
      };
      const savedNoteId = await PersistenceService.saveSOAPNote(
        updatedNote.soapData,
        currentNote.patientId,
        currentNote.sessionId,
        currentNote.id,
      );
      const persistedNote = {
        ...updatedNote,
        id: savedNoteId,
      };
      setNote(persistedNote);
      setEditedSOAP(persistedNote.soapData);
      setIsEditing(false);
      setSaveSuccessMessage('Cambios guardados correctamente.');
    } catch (saveError) {
      console.error('Error saving note changes:', saveError);
      setError('No se pudieron guardar los cambios.');
    }
  };

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
            ← {t('shell.nav.backToCommandCenter')}
          </button>
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600 mb-4">{error ? t(`notes.${error}`) : t('notes.notFoundFallback')}</p>
            <button
              onClick={() => navigate('/command-center')}
              className="text-brand-in-500 hover:text-brand-in-600 font-medium"
            >
              {t('shell.nav.goToCommandCenter')}
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
            ← {t('notes.back')}
          </button>
          <h1 className="text-xl font-semibold text-slate-900">{t('notes.pageTitle')}</h1>
          <button
            onClick={() => navigate('/command-center')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {t('shell.nav.goToCommandCenter')}
          </button>
        </div>

        {saveSuccessMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {saveSuccessMessage}
          </div>
        )}

        {error && error !== 'errorNoId' && error !== 'errorNotFound' && error !== 'errorLoad' && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center justify-end gap-3">
          {!isEditing ? (
            <button
              onClick={() => {
                setIsEditing(true);
                setSaveSuccessMessage(null);
                setError(null);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={!editedSOAP}
                className="rounded-lg bg-brand-in-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-in-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar cambios
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {(isEditing || soapToRender?.subjective) && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.subjective')}</h2>
              {isEditing ? (
                <textarea
                  value={editedSOAP?.subjective ?? ''}
                  onChange={(event) => handleSOAPFieldChange('subjective', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              ) : (
                <div className="text-slate-800 whitespace-pre-wrap">{soapToRender?.subjective}</div>
              )}
            </section>
          )}
          {(isEditing || soapToRender?.objective) && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.objective')}</h2>
              {isEditing ? (
                <textarea
                  value={editedSOAP?.objective ?? ''}
                  onChange={(event) => handleSOAPFieldChange('objective', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              ) : (
                <div className="text-slate-800 whitespace-pre-wrap">{soapToRender?.objective}</div>
              )}
            </section>
          )}
          {(isEditing || soapToRender?.assessment) && (
            <section className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.assessment')}</h2>
              {isEditing ? (
                <textarea
                  value={editedSOAP?.assessment ?? ''}
                  onChange={(event) => handleSOAPFieldChange('assessment', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              ) : (
                <div className="text-slate-800 whitespace-pre-wrap">{soapToRender?.assessment}</div>
              )}
            </section>
          )}
          {(isEditing || soapToRender?.plan) && (
            <section className="p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.plan')}</h2>
              {isEditing ? (
                <textarea
                  value={editedSOAP?.plan ?? ''}
                  onChange={(event) => handleSOAPFieldChange('plan', event.target.value)}
                  className="min-h-[160px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              ) : (
                <div className="text-slate-800 whitespace-pre-wrap">{soapToRender?.plan}</div>
              )}
            </section>
          )}
          {!isEditing && !soap?.subjective && !soap?.objective && !soap?.assessment && !soap?.plan && (
            <section className="p-6">
              <p className="text-slate-500">{t('notes.noContent')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
