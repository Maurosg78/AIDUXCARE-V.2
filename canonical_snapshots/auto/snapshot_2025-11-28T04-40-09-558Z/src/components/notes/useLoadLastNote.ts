import { useEffect, useState } from 'react';
import { getLastNoteByPatient } from '@/repositories/notesRepo';
import type { ClinicalNote } from '@/types/notes';

export function useLoadLastNote(patientId: string) {
  const [lastNote, setLastNote] = useState<ClinicalNote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const note = await getLastNoteByPatient(patientId);
        if (alive) setLastNote(note);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? 'Load failed');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [patientId]);

  return { lastNote, loading: loading, error: err };
}
