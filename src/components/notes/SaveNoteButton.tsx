import React, { useState } from 'react';
import { createNote, updateNote, getLastNoteByPatient } from '@/repositories/notesRepo';
import type { ClinicalNote } from '@/types/notes';

type Props = {
  patientId: string;
  clinicianUid: string;
  visitId?: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  onSaved?: (note: ClinicalNote) => void;
};

export function SaveNoteButton(props: Props): JSX.Element {
  const { patientId, clinicianUid, visitId, subjective, objective, assessment, plan, onSaved } = props;
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const last = await getLastNoteByPatient(patientId);

      const payload = {
        patientId,
        clinicianUid,
        ...(visitId ? { visitId } : {}),
        status: 'submitted' as const,
        subjective,
        objective,
        assessment,
        plan,
      };

      const shouldUpdate =
        !!last &&
        last.status === 'draft' &&
        last.patientId === patientId &&
        (!visitId || last.visitId === visitId);

      // Nota: createNote/updateNote pueden retornar id (string), void o un objeto.
      const result = shouldUpdate
        ? await updateNote(last.id, payload)
        : await createNote(payload);

      // Intentamos obtener un ClinicalNote válido para onSaved si es posible
      let savedNote: ClinicalNote | null = null;

      if (result && typeof result === 'object') {
        // Si el repo retorna un objeto compatible con ClinicalNote
        savedNote = result as ClinicalNote;
      } else {
        // Si retorna string (id) o void, buscamos la última nota del paciente
        const latest = await getLastNoteByPatient(patientId);
        if (latest) savedNote = latest;
      }

      setOk('Saved');
      if (savedNote && onSaved) onSaved(savedNote);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error while saving the note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        aria-busy={saving}
        className="px-4 py-2 rounded-xl shadow-sm border"
      >
        {saving ? 'Saving…' : 'Save note'}
      </button>

      {ok && (
        <div role="status" className="text-green-700 text-sm">
          {ok}
        </div>
      )}
      {error && (
        <div role="alert" className="text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
