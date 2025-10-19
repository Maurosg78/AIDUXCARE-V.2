import * as React from "react";
import { Dialog } from "@headlessui/react";

export type SignNoteModalProps = {
  open: boolean;
  onClose: () => void;
  noteId?: string;
  onSigned?: (signatureId: string) => void;
};

export default function SignNoteModal({
  open,
  onClose,
  noteId,
  onSigned,
}: SignNoteModalProps) {
  const handleConfirm = () => {
    // TODO: integrar flujo de firma real (SoT)
    onSigned?.(crypto?.randomUUID?.() ?? "signature-placeholder");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold">
            Sign note
          </Dialog.Title>
          <p className="mt-2 text-sm text-gray-600">
            Signature flow pending implementation{noteId ? ` (note ${noteId})` : ""}.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-black px-3 py-1.5 text-sm text-white"
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
