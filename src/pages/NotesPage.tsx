import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PersistenceService, type NoteStatus, type SOAPData, type SavedNote } from '@/services/PersistenceService';

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
  const [searchParams] = useSearchParams();
  const isCreateMode = id === 'new';
  const requestedPatientId = searchParams.get('patientId') ?? '';
  const [note, setNote] = useState<SavedNote | null>(null);
  const [isEditing, setIsEditing] = useState(isCreateMode);
  const [editedSOAP, setEditedSOAP] = useState<SOAPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [clinicalDate, setClinicalDate] = useState('');
  const [visitType, setVisitType] = useState<'initial' | 'follow-up'>('follow-up');
  const [manualSessionId, setManualSessionId] = useState('');
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayDay = String(today.getDate()).padStart(2, '0');
  const maxClinicalDate = `${todayYear}-${todayMonth}-${todayDay}`;

  useEffect(() => {
    if (!id) {
      setError('errorNoId');
      setLoading(false);
      return;
    }
    if (isCreateMode) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const defaultClinicalDate = `${year}-${month}-${day}`;
      const initialTimestamp = new Date().toISOString();
      const initialSoapData = {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        confidence: 0,
        timestamp: initialTimestamp,
      };
      setClinicalDate(defaultClinicalDate);
      setEditedSOAP(initialSoapData);
      setNote(null);
      setError(null);
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
          const loadedClinicalDate = loaded.clinicalDate ?? '';
          setClinicalDate(loadedClinicalDate);
          if (loaded.visitType) {
            setVisitType(loaded.visitType);
          }
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
  }, [id, isCreateMode]);

  const soap = note?.soapData;
  const soapToRender = isEditing ? editedSOAP : soap;
  const currentNoteStatus = note?.status ?? 'draft';
  const canFinalize = isCreateMode || currentNoteStatus === 'draft';

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
    if (isCreateMode) {
      navigate(-1);
      return;
    }
    const originalSOAP = note?.soapData ?? null;
    setEditedSOAP(originalSOAP);
    setIsEditing(false);
    setSaveSuccessMessage(null);
    setError(null);
  };

  const handlePersistNote = async (requestedStatus: NoteStatus) => {
    const currentNote = note;
    const currentSOAP = editedSOAP;
    const isMissingPatientId = requestedPatientId.trim() === '';
    if (isCreateMode && isMissingPatientId) {
      setError('Falta el paciente para crear la nota.');
      return;
    }
    if (!currentSOAP) return;

    try {
      setError(null);
      setSaveSuccessMessage(null);
      const updatedTimestamp = new Date().toISOString();
      const updatedSOAP = {
        ...currentSOAP,
        timestamp: updatedTimestamp,
      };
      const currentPatientId = isCreateMode ? requestedPatientId : currentNote?.patientId ?? '';
      const hasManualSessionId = manualSessionId.trim() !== '';
      const normalizedVisitType = visitType;
      const normalizedClinicalDate = clinicalDate.trim();
      const persistedClinicalDate = currentNote?.clinicalDate;
      const clinicalDateForWrite = isCreateMode
        ? normalizedClinicalDate
        : persistedClinicalDate;
      const generatedManualSessionId = `manual_${currentPatientId}_${normalizedClinicalDate.replace(/-/g, '')}_${normalizedVisitType === 'follow-up' ? 'followup' : 'initial'}_${Date.now()}`;
      const sessionIdForWrite = isCreateMode
        ? (hasManualSessionId ? manualSessionId : generatedManualSessionId)
        : currentNote?.sessionId ?? '';
      if (isCreateMode && !hasManualSessionId) {
        setManualSessionId(generatedManualSessionId);
      }
      const savedNoteId = await PersistenceService.saveSOAPNote(
        updatedSOAP,
        currentPatientId,
        sessionIdForWrite,
        currentNote?.id,
        {
          requestedStatus,
          clinicalDate: clinicalDateForWrite,
          visitType: normalizedVisitType,
          source: 'consultation',
        }
      );
      const persistedNote = await PersistenceService.getNoteById(savedNoteId);
      const nextNote = persistedNote ?? {
        ...(currentNote ?? {
          id: savedNoteId,
          patientId: currentPatientId,
          sessionId: sessionIdForWrite,
          ownerUid: '',
          encryptedData: { iv: '', encryptedData: '' },
          createdAt: updatedTimestamp,
        }),
        id: savedNoteId,
        clinicalDate: clinicalDateForWrite,
        soapData: updatedSOAP,
        updatedAt: updatedTimestamp,
        status: requestedStatus,
        visitType: normalizedVisitType,
        source: 'consultation',
      };
      setNote(nextNote);
      if (nextNote.clinicalDate) {
        setClinicalDate(nextNote.clinicalDate);
      }
      if (nextNote.visitType) {
        setVisitType(nextNote.visitType);
      }
      setEditedSOAP(nextNote.soapData);
      setIsEditing(false);
      const successMessage = requestedStatus === 'finalized'
        ? 'Nota finalizada correctamente.'
        : 'Nueva revisión guardada correctamente.';
      setSaveSuccessMessage(successMessage);
      if (isCreateMode || savedNoteId !== id) {
        navigate(`/notes/${savedNoteId}`, { replace: true });
      }
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
    if (isCreateMode && editedSOAP) {
      const isCreateModeEditing = true;
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
              <h1 className="text-xl font-semibold text-slate-900">Documentar atención pasada</h1>
              <button
                onClick={() => navigate('/command-center')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                {t('shell.nav.goToCommandCenter')}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Fecha de atención
                  </label>
                  <input
                    type="date"
                    value={clinicalDate}
                    max={maxClinicalDate}
                    onChange={(event) => setClinicalDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Tipo de visita
                  </label>
                  <select
                    value={visitType}
                    onChange={(event) => setVisitType(event.target.value as 'initial' | 'follow-up')}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                  >
                    <option value="initial">Inicial</option>
                    <option value="follow-up">Seguimiento</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handlePersistNote('draft')}
                disabled={!editedSOAP || clinicalDate.trim() === ''}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar borrador
              </button>
              {isCreateModeEditing && (
                <button
                  onClick={() => handlePersistNote('finalized')}
                  disabled={!editedSOAP || clinicalDate.trim() === ''}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Finalizar nota
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <section className="p-6 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.subjective')}</h2>
                <textarea
                  value={editedSOAP?.subjective ?? ''}
                  onChange={(event) => handleSOAPFieldChange('subjective', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              </section>
              <section className="p-6 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.objective')}</h2>
                <textarea
                  value={editedSOAP?.objective ?? ''}
                  onChange={(event) => handleSOAPFieldChange('objective', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              </section>
              <section className="p-6 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.assessment')}</h2>
                <textarea
                  value={editedSOAP?.assessment ?? ''}
                  onChange={(event) => handleSOAPFieldChange('assessment', event.target.value)}
                  className="min-h-[140px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              </section>
              <section className="p-6">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('soap.plan')}</h2>
                <textarea
                  value={editedSOAP?.plan ?? ''}
                  onChange={(event) => handleSOAPFieldChange('plan', event.target.value)}
                  className="min-h-[160px] w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-brand-in-500 focus:outline-none focus:ring-2 focus:ring-brand-in-200"
                />
              </section>
            </div>
          </div>
        </div>
      );
    }
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

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de atención</div>
              <div className="mt-1 text-sm text-slate-900">{note.clinicalDate || 'No registrada'}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Creada</div>
              <div className="mt-1 text-sm text-slate-900">{note.createdAt}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cerrada</div>
              <div className="mt-1 text-sm text-slate-900">{note.acceptedAt || 'Pendiente'}</div>
            </div>
          </div>
        </div>

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
                onClick={() => handlePersistNote('draft')}
                disabled={!editedSOAP}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar borrador
              </button>
              {canFinalize && (
                <button
                  onClick={() => handlePersistNote('finalized')}
                  disabled={!editedSOAP}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Finalizar nota
                </button>
              )}
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
