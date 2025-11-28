import React from 'react';
import { runCpoRules } from '@/core/compliance/cpo/CpoRules';
import { assertCpoCompliance } from '@/core/compliance/cpo/ComplianceRunner';
import { renderMarkdown } from '@/core/notes/SOAPRenderer';

type PatientId = string & { readonly __brand: 'PatientId' };
type UserId = string & { readonly __brand: 'UserId' };

type SOAPNote = unknown; // TODO: reemplaza con tu DTO real

type Props = {
  currentSOAPNote: SOAPNote;
  currentPatient: { id: PatientId };
  currentUser: { id: UserId };
  /** Hook de persistencia cuando la nota pasa CPO */
  onCompliant?: () => Promise<void> | void;
};

type CpoContext = {
  patientId: string;
  clinicianId: string;
  noteMarkdown: string;
  createdAtISO: string; // ISO-8601
};

export default function SaveNoteCPOGate({
  currentSOAPNote,
  currentPatient,
  currentUser,
  onCompliant,
}: Props) {
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  const handleSaveNote = React.useCallback(async () => {
    const noteMarkdown = renderMarkdown(currentSOAPNote);
    const context: CpoContext = {
      patientId: currentPatient.id,
      clinicianId: currentUser.id,
      noteMarkdown,
      createdAtISO: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      // Guardrail principal (puede lanzar)
      await assertCpoCompliance(context);

      // Pasó CPO → persistimos (si hay hook)
      if (onCompliant) await onCompliant();
    } catch {
      // Fallback determinístico: ejecuta reglas y muestra fallos
      const result = runCpoRules(context) as { failures?: string[] } | undefined;
      const errs =
        result?.failures && result.failures.length > 0
          ? result.failures
          : ['Unknown CPO validation error'];

      setValidationErrors(errs);
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  }, [currentSOAPNote, currentPatient.id, currentUser.id, onCompliant]);

  // A11y: enfocar botón de cierre al abrir el modal
  React.useEffect(() => {
    if (showErrorModal) {
      closeBtnRef.current?.focus();
    }
  }, [showErrorModal]);

  return (
    <>
      <button
        type="button"
        onClick={handleSaveNote}
        disabled={isSaving}
        aria-busy={isSaving}
        className="mt-4 w-full md:w-auto bg-gradient-to-r from-primary-blue to-primary-purple text-white px-4 py-2 rounded-lg hover:from-primary-blue-hover hover:to-primary-purple-hover disabled:opacity-60 font-apple text-[15px] font-medium"
      >
        {isSaving ? 'Saving…' : 'Save Note'}
      </button>

      {showErrorModal && (
        <div
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cpo-modal-title"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 id="cpo-modal-title" className="text-lg font-bold text-red-700 mb-4">
              CPO Compliance Failed
            </h3>

            <ul className="space-y-2 mb-6 list-disc list-inside">
              {validationErrors.map((msg, idx) => (
                <li key={idx} className="text-sm text-gray-800">
                  {msg}
                </li>
              ))}
            </ul>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
