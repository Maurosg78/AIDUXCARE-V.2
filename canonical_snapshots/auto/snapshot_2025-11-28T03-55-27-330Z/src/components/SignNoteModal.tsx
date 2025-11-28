import React, { useState } from "react";

export interface SignNoteModalProps {
  open: boolean;
  onClose: () => void;
  /** Acción asíncrona que efectúa la firma; si falla, deja el modal abierto. */
  onConfirm?: () => Promise<void>;
  soapPreview: React.ReactElement;
  /** Habilita/inhabilita la firma (ej. permisos). */
  canSign: boolean;
}

export default function SignNoteModal({
  open,
  onClose,
  onConfirm,
  soapPreview,
  canSign,
}: SignNoteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

  async function handleConfirm() {
    if (!canSign || submitting) return;
    if (!onConfirm) {
      onClose();
      return;
    }
    try {
      setSubmitting(true);
      await onConfirm();
      onClose();
    } catch {
      // opcional: toast/log; mantenemos el modal abierto si falla
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="sign-note-title" className="fixed inset-0 z-50 grid place-items-center bg-gray-900/40">
      <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-lg">
        <h2 id="sign-note-title" className="text-lg font-semibold mb-3">Review &amp; Sign</h2>
        <div className="max-h-[60vh] overflow-auto border rounded p-3 mb-4">
          {soapPreview}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded border"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={!canSign || submitting}
            aria-disabled={!canSign || submitting}
          >
            {submitting ? "Signing…" : "Confirm & Sign"}
          </button>
        </div>
      </div>
    </div>
  );
}
