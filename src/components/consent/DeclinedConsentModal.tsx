/**
 * Shown when patient has declined consent (hard block). Offers option to record new consent.
 */
import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export interface DeclinedConsentModalProps {
  patientName?: string;
  patientId?: string;
  declineReasons?: string[];
  onRecordNewConsent: () => void;
}

export const DeclinedConsentModal: React.FC<DeclinedConsentModalProps> = ({
  patientName,
  declineReasons,
  onRecordNewConsent,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 text-amber-700 mb-4">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <h2 className="text-lg font-semibold">Consent declined</h2>
        </div>
        <p className="text-slate-600 text-sm mb-4">
          {patientName ? `${patientName} has declined consent.` : 'Patient has declined consent.'}
          AiDux cannot be used until consent is obtained.
        </p>
        {declineReasons?.length ? (
          <p className="text-slate-500 text-xs mb-4">Reasons: {declineReasons.join(', ')}</p>
        ) : null}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRecordNewConsent}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-lg text-sm font-medium hover:from-primary-blue-hover hover:to-primary-purple-hover shadow-md"
          >
            Record new consent
          </button>
        </div>
      </div>
    </div>
  );
};
