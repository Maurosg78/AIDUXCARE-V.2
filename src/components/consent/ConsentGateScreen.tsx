/**
 * Consent gate: shown when domain says consent is required (channel !== 'none').
 * Shows verbal consent option; when consent is granted, parent detects via checkConsentViaServer (polling or onConsentGranted).
 */
import React, { useState } from 'react';
import { Shield, MessageCircle } from 'lucide-react';
import { VerbalConsentModal } from './VerbalConsentModal';
import type { ConsentResolution } from '@/domain/consent/resolveConsentChannel';

export interface ConsentGateScreenProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  clinicName?: string;
  consentResolution: ConsentResolution;
  /** Required for VerbalConsentModal (obtained by parent from useAuth) */
  physiotherapistId?: string;
  physiotherapistName?: string;
  onConsentDeclined?: () => Promise<void>;
  /** When provided, called after verbal consent is recorded so parent can run immediate check and unmount gate */
  onConsentGranted?: () => Promise<void>;
}

export const ConsentGateScreen: React.FC<ConsentGateScreenProps> = ({
  patientId,
  patientName,
  patientPhone,
  clinicName,
  consentResolution,
  physiotherapistId,
  physiotherapistName,
  onConsentDeclined,
  onConsentGranted,
}) => {
  const [showVerbalModal, setShowVerbalModal] = useState(false);

  const handleConsentObtained = async (consentId: string) => {
    console.log('[ConsentGate] ✅ Verbal consent recorded - parent will detect via polling/check', { consentId: consentId ? '***' : '' });
    setShowVerbalModal(false);
    if (onConsentGranted) {
      await new Promise((r) => setTimeout(r, 300));
      await onConsentGranted();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Consent required</h2>
        <p className="text-slate-600 text-sm mb-6">
          Patient consent is required before using the clinical workflow (including voice recording and attachments).
        </p>
        <button
          type="button"
          onClick={() => setShowVerbalModal(true)}
          className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Obtain verbal consent
        </button>
      </div>

      <VerbalConsentModal
        isOpen={showVerbalModal}
        onClose={() => setShowVerbalModal(false)}
        patientId={patientId}
        patientName={patientName}
        physiotherapistId={physiotherapistId ?? ''}
        physiotherapistName={physiotherapistName}
        onConsentObtained={handleConsentObtained}
        onConsentDenied={onConsentDeclined}
      />
    </div>
  );
};
