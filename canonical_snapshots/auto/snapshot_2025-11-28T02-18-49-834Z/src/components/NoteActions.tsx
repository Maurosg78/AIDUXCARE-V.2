import React, { useMemo, useState } from 'react';
import SignNoteModal from './SignNoteModal';
import { signNote } from '../api/notes';
import { useToast } from '../hooks/useToast';

type SOAP = { subjective?: string; objective?: string; assessment?: string; plan?: string };
type Props = {
  noteId: string;
  status: 'draft' | 'submitted' | 'signed';
  soap: SOAP;
  onSigned?: () => void; // notify parent to refresh
};

function isSoapComplete(soap: SOAP) {
  return Boolean(soap?.subjective && soap?.objective && soap?.assessment && soap?.plan);
}

export default function NoteActions({ noteId, status, soap, onSigned }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  const canSign = useMemo(() => isSoapComplete(soap), [soap]);

  const handleConfirm = async () => {
    setBusy(true);
    const res = await signNote(noteId);
    setBusy(false);
    setOpen(false);
    if (res.ok) {
      notify('Note signed successfully.');
      onSigned?.();
    } else {
      notify(res.message || 'Failed to sign note.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'submitted' && (
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple text-white hover:from-primary-blue-hover hover:to-primary-purple-hover disabled:opacity-40 font-apple text-[15px] font-medium"
          disabled={!canSign || busy}
          aria-disabled={!canSign || busy}
          aria-label="Sign Note"
        >
          {busy ? 'Signing…' : 'Sign Note'}
        </button>
      )}

      <SignNoteModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        soapPreview={
          <div className="text-sm space-y-2">
            <p><strong>Subjective:</strong> {soap?.subjective ?? '—'}</p>
            <p><strong>Objective:</strong> {soap?.objective ?? '—'}</p>
            <p><strong>Assessment:</strong> {soap?.assessment ?? '—'}</p>
            <p><strong>Plan:</strong> {soap?.plan ?? '—'}</p>
          </div>
        }
        canSign={canSign}
      />
    </div>
  );
}
