/* @ts-nocheck */
import React, { useEffect, useMemo, useState } from 'react';
import { notesRepo } from '@/core/notes/notesRepo';
import { useCurrentPatient } from '@/context/CurrentPatientContext';
import { isProgressNotesEnabled } from '@/flags';

type Props = { patientId?: string };

type NoteLike = {
  id: string;
  status: 'draft' | 'submitted' | 'signed' | string;
  subjective?: string;
  createdAt?: any; // Date | Timestamp | string
};

function toDate(d: any): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  if (typeof d?.toDate === 'function') return d.toDate();
  const asDate = new Date(d);
  return isNaN(asDate.getTime()) ? null : asDate;
}

function fmtDate(d?: any): string {
  const date = toDate(d);
  if (!date) return 'Last visit: —';
  const fmt = new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Last visit: ${fmt.format(date)}`;
}

function truncate(s = '', max = 150): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function statusClass(status: string): string {
  switch (status) {
    case 'signed':
      return 'inline-block px-2 py-0.5 rounded bg-green-100 text-green-800';
    case 'submitted':
      return 'inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800';
    case 'draft':
    default:
      return 'inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800';
  }
}

export default function QuickRecallPanel({ patientId: pidProp }: Props) {
  if (!isProgressNotesEnabled()) return null;

  const { currentPatient } = useCurrentPatient();
  const patientId = pidProp ?? currentPatient?.id ?? '';
  const [loading, setLoading] = useState<boolean>(!!patientId);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<NoteLike | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!patientId) {
        setNote(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const last = await notesRepo.getLastNoteByPatient(patientId);
        if (!alive) return;
        setNote(last as any ?? null);
      } catch (e) {
        if (!alive) return;
        setError('Could not load previous notes');
        setNote(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [patientId]);

  const dateText = useMemo(() => fmtDate(note?.createdAt), [note?.createdAt]);

  if (!patientId) return null;

  return (
    <section aria-live="polite" className="mb-4">
      <h3>Previous visit</h3>

      {loading && <div role="status">Loading last visit…</div>}

      {!loading && error && <div role="alert">{error}</div>}

      {!loading && !error && !note && (
        <div>No previous visits</div>
      )}

      {!loading && !error && note && (
        <div className="border p-3 rounded">
          <div className="flex items-center gap-2">
            <span>{dateText}</span>
            <span data-testid="status-badge" className={statusClass(note.status)}>{note.status}</span>
          </div>
          <p className="mt-2">{truncate(note.subjective, 150)}</p>

          <div className="mt-2">
            <button type="button" onClick={() => setExpanded(v => !v)}>
              {expanded ? 'Hide details' : 'View details'}
            </button>
          </div>

          {expanded && (
            <div className="mt-2 text-sm opacity-80">
              <p><strong>Note ID:</strong> {note.id}</p>
              {/* Sin SOAP adicional por seguridad */}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
