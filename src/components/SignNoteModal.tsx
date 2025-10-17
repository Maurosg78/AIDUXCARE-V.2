import React, { useEffect, useRef, useState } from 'react';

type SignNoteModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  /** Preview de SOAP (read-only) ya formateado por el padre */
  soapPreview: React.ReactNode;
  /** Controla validación previa (todos los campos SOAP completos) */
  canSign: boolean;
};
export default function SignNoteModal({
  open,
  onClose,
  onConfirm,
  soapPreview,
  canSign,
}: SignNoteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = 'sign-note-modal-title';
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar con ESC y focus trap básico
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        // Focus trap simple entre botones
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === firstButtonRef.current) {
            e.preventDefault();
            lastButtonRef.current?.focus();
          }
        } else {
          if (active === lastButtonRef.current) {
            e.preventDefault();
            firstButtonRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    // Focus inicial
    firstButtonRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  // Evitar scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleConfirm = async () => {
    if (!canSign || submitting) return;
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-hidden={false}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-xl font-semibold text-slate-900">
          Sign Clinical Note
        </h2>
        <p className="mt-1 text-sm text-red-700">
          Once signed, this note cannot be edited.
        </p>

        <div className="mt-4 space-y-4">
          <div className="border rounded-lg p-4 bg-slate-50">
            {soapPreview}
          </div>

          {!canSign && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              Please complete all SOAP fields before signing.
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={firstButtonRef}
            type="button"
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            ref={lastButtonRef}
            type="button"
            className="px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
            onClick={handleConfirm}
            disabled={!canSign || submitting}
            aria-disabled={!canSign || submitting}
            aria-busy={submitting ? 'true' : 'false'}
          >
            {submitting ? 'Signing…' : 'Sign Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
