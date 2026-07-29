import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface DiscontinueHomeProgramItemModalProps {
  isOpen: boolean;
  itemLabel: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export function DiscontinueHomeProgramItemModal({
  isOpen,
  itemLabel,
  onClose,
  onConfirm,
}: DiscontinueHomeProgramItemModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen, itemLabel]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    const normalizedReason = reason.trim();
    onConfirm(normalizedReason || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 font-apple">
              {t('workflow.homeProgram.removePermanentTitle')}
            </h2>
            <p className="mt-1 text-sm text-slate-700 font-apple">
              {itemLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('workflow.homeProgram.closeRemovalDialog')}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-700 font-apple">
            {t('workflow.homeProgram.removePermanentDescription')}
          </p>
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 font-apple">
            {t('workflow.homeProgram.removePermanentWarning')}
          </p>

          <label
            htmlFor={reasonId}
            className="mt-4 block text-sm font-medium text-slate-700 font-apple"
          >
            {t('workflow.homeProgram.removalReasonLabel')}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder={t('workflow.homeProgram.removalReasonPlaceholder')}
            className="mt-1 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 font-apple"
          >
            {t('workflow.homeProgram.keepInPlan')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 font-apple"
          >
            {t('workflow.homeProgram.confirmPermanentRemoval')}
          </button>
        </div>
      </div>
    </div>
  );
}
