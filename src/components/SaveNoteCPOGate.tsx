import { persistNoteWithMetrics } from "@/services/notePersistence";
import React, { useState } from 'react';
import { runCpoRules } from '@/core/compliance/cpo';
import { assertCpoCompliance } from '@/core/compliance/cpo';
import { renderMarkdown } from '@/core/notes/SOAPRenderer';

type Props = {
  currentSOAPNote: any;
  currentPatient: { id: string };
  currentUser: { id: string };
  onCompliant?: () => Promise<void> | void; // T4: persistNote hook
};
export default function SaveNoteCPOGate({
  currentSOAPNote,
  currentPatient,
  currentUser,
  onCompliant,
}: Props) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  async function handleSaveNote() {
    const noteMarkdown = renderMarkdown(currentSOAPNote);
    const context = {
      patientId: currentPatient?.id,
      clinicianId: currentUser?.id,
      noteMarkdown,
      createdAtISO: new Date().toISOString(),
    };
    try {
      setIsSaving(true);
      await assertCpoCompliance(context);
      if (onCompliant) await onCompliant(); else { await persistNoteWithMetrics({ visitId: (context as any).visitId, patientId: context.patientId, clinicianId: context.clinicianId, soapNote: currentSOAPNote }); setShowSuccessBanner(true); }
    } catch {
      const result = runCpoRules(context);
      setValidationErrors(result.failures ?? ['Unknown CPO validation error']);
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <>
      <button
        onClick={handleSaveNote}
        disabled={isSaving}
        className="mt-4 w-full md:w-auto bg-black text-white px-4 py-2 rounded-lg disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : 'Save Note'}
      </button>
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-red-600 mb-4">
              CPO Compliance Failed
            </h3>
            <ul className="space-y-2 mb-4">
              {validationErrors.map((e, i) => (
                <li key={i} className="text-sm text-gray-700">• {e}</li>
              ))}
            </ul>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
