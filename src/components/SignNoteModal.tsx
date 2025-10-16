import React, { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  soapPreview?: React.ReactNode; // Render SOAP preview fragment
  canSign: boolean; // result of SOAP validation
};

export default function SignNoteModal({ open, onClose, onConfirm, soapPreview, canSign }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // focus trap start
      firstBtnRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      aria-labelledby="sign-note-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div ref={dialogRef} className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="sign-note-title" className="text-xl font-semibold mb-2">Confirm signature</h2>
        <p className="text-sm text-gray-600 mb-4">Please review the SOAP summary before signing.</p>
        <div className="max-h-64 overflow-auto border rounded-md p-3 mb-4">
          {soapPreview ?? <em>No preview available.</em>}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button ref={firstBtnRef} onClick={onClose} className="px-3 py-2 rounded-lg border">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={!canSign}
            className="px-3 py-2 rounded-lg bg-black text-white disabled:opacity-40"
            aria-disabled={!canSign}
          >
            Sign note
          </button>
        </div>
      </div>
    </div>
  );
}
