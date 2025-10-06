import React, { useState } from 'react';
import { createNote, updateNote, getLastNoteByPatient } from '@/repositories/notesRepo';
import type { ClinicalNote } from '@/types/notes';

type Props = {
  patientId: string;
  clinicianUid: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  onSaved?: (note: ClinicalNote) => void;
};

export function SaveNoteButton(props: Props) {
  const { patientId, clinicianUid, subjective, objective, assessment, plan, onSaved } = props;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const last = await getLastNoteByPatient(patientId);
      const payload = {
        patientId,
        clinicianUid,
        status: 'submitted' as const,
        subjective,
        objective,
        assessment,
        plan,
      };
      let id: string;
      if (last && last.status !== 'signed') {
        await updateNote(last.id, payload);
        id = last.id;
      } else {
        id = await createNote(payload as any);
      }
      setOk('Saved');
      onSaved && onSaved({ ...(last as any), id, ...payload } as ClinicalNote);
    } catch (e: any) {
      setError(e?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
        aria-busy={saving}
      >
        {saving ? 'Saving…' : 'Save note'}
      </button>
      {ok && <span role="status" className="text-green-700 text-sm">{ok}</span>}
      {error && <span role="alert" className="text-red-700 text-sm">{error}</span>}
    </div>
  );
}
