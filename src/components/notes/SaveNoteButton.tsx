import React, { useEffect, useMemo, useState } from 'react';
import { notesRepo, NoteError } from '@/core/notes/notesRepo';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import { isProgressNotesEnabled } from '@/flags';

type Props = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  /** opcionales: pueden venir por props o contexto/preview */
  patientId?: string;
  visitId?: string;
  clinicianUid?: string;
  /** si ya existe desde fuera (p.ej. rehidratación) */
  existingNoteId?: string;
};

function mapErrorToMessage(err: unknown): string {
  // Normalizamos por code/message o directamente string
  const code = (err as any)?.code ?? (err as any)?.message ?? String(err);
  switch (code) {
    case 'ERR_NOTE_NOT_FOUND':
    case 'NOT_FOUND':
      return 'Note could not be found';
    case 'ERR_NOTE_IMMUTABLE':
    case NoteError.IMMUTABLE:
    case 'IMMUTABLE':
      return 'This note is signed and cannot be edited';
    case 'ERR_INVALID_STATUS':
    case NoteError.INVALID_STATUS:
    case 'INVALID_STATUS':
      return 'Invalid note status';
    case 'ERR_UNAUTHORIZED':
    case NoteError.UNAUTHORIZED:
    case 'UNAUTHORIZED':
      return "You don't have permission to modify this note";
    default:
      return 'There was a problem saving the note';
  }
}

export function SaveNoteButton(props: Props) {
  if (!isProgressNotesEnabled()) return null;

  const { currentPatient, currentVisit } = useCurrentPatient();
  const patientId = props.patientId ?? currentPatient?.id ?? '';
  const visitId = props.visitId ?? currentVisit?.id ?? '';
  const clinicianUid = props.clinicianUid ?? '';

  const [noteId, setNoteId] = useState<string | undefined>(props.existingNoteId);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isMissingRequired = useMemo(() => {
    const required = [props.subjective, props.objective, props.assessment, props.plan];
    return required.some(s => !s || !s.trim()) || !patientId;
  }, [props.subjective, props.objective, props.assessment, props.plan, patientId]);

  useEffect(() => {
    let t: any;
    if (successMsg) {
      t = setTimeout(() => setSuccessMsg(null), 3000);
    }
    return () => t && clearTimeout(t);
  }, [successMsg]);

  async function handleSave() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);
    try {
      if (!noteId) {
        const res = await notesRepo.createNote({
          patientId,
          visitId,
          clinicianUid,
          subjective: props.subjective,
          objective: props.objective,
          assessment: props.assessment,
          plan: props.plan,
          status: 'draft',
        });
        const createdId = (res as any)?.id ?? res; // tolerante a forma devuelta
        setNoteId(createdId);
        console.info('[Notes] Saved (create)', { noteId: createdId }); // no log clínico
      } else {
        await notesRepo.updateNote(noteId, {
          subjective: props.subjective,
          objective: props.objective,
          assessment: props.assessment,
          plan: props.plan,
        });
        console.info('[Notes] Saved (update)', { noteId }); // no log clínico
      }
      setSuccessMsg('Note saved successfully.');
    } catch (e) {
      setErrorMsg(mapErrorToMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div aria-live="polite" className="mt-3 flex flex-col gap-2">
      <button
        aria-label="Save Note"
        type="button"
        disabled={isSaving || isMissingRequired}
        aria-busy={isSaving ? 'true' : 'false'}
        onClick={handleSave}
      >
        {isSaving ? 'Saving…' : 'Save Note'}
      </button>

      {successMsg && (
        <div role="status">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div role="alert">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default SaveNoteButton;
