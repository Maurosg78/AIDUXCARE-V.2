/**
 * Consent gate: shown when domain says consent is required (channel !== 'none').
 * Three options: canonical form (in-clinic), SMS link, verbal consent.
 */
import React, { useState } from 'react';
import { Shield, MessageCircle, FileText, Smartphone } from 'lucide-react';
import { VerbalConsentModal } from './VerbalConsentModal';
import { PatientConsentService } from '@/services/patientConsentService';
import { SMSService } from '@/services/smsService';
import { useAuth } from '@/hooks/useAuth';
import type { ConsentResolution } from '@/domain/consent/resolveConsentChannel';

export interface ConsentGateScreenProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  clinicName?: string;
  consentResolution: ConsentResolution;
  physiotherapistId?: string;
  physiotherapistName?: string;
  onConsentDeclined?: () => Promise<void>;
  onConsentGranted?: () => Promise<void>;
  /** Optional: e.g. navigate back to command-center */
  onCancel?: () => void;
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
  onCancel,
}) => {
  const { user } = useAuth();
  const [showVerbalModal, setShowVerbalModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);

  const handleConsentObtained = async (consentId: string) => {
    console.log('[ConsentGate] ✅ Verbal consent recorded', { consentId: consentId ? '***' : '' });
    setShowVerbalModal(false);
    if (onConsentGranted) {
      await new Promise((r) => setTimeout(r, 300));
      await onConsentGranted();
    }
  };

  const handleOpenCanonicalForm = async () => {
    if (!physiotherapistId || !user?.uid) return;
    setFormLoading(true);
    setSmsError(null);
    try {
      const token = await PatientConsentService.generateConsentToken(
        patientId,
        patientName ?? 'Patient',
        patientPhone ?? undefined,
        undefined,
        clinicName ?? 'Clinic',
        physiotherapistId,
        physiotherapistName ?? 'Physiotherapist'
      );
      const url = `${window.location.origin}/consent/${token}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Failed to open form');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!physiotherapistId || !user?.uid || !patientPhone?.trim()) {
      setSmsError('Patient phone number is required to send SMS');
      return;
    }
    setSmsLoading(true);
    setSmsError(null);
    try {
      const token = await PatientConsentService.generateConsentToken(
        patientId,
        patientName ?? 'Patient',
        patientPhone.trim(),
        undefined,
        clinicName ?? 'Clinic',
        physiotherapistId,
        physiotherapistName ?? 'Physiotherapist'
      );
      const tokenDoc = await PatientConsentService.getConsentByToken(token);
      const physioName = tokenDoc?.physiotherapistName?.trim() || physiotherapistName || 'Physiotherapist';
      let formattedPhone = patientPhone.trim().replace(/[^\d+]/g, '');
      if (formattedPhone.length === 10) formattedPhone = `+1${formattedPhone}`;
      else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) formattedPhone = `+${formattedPhone}`;
      else if (!formattedPhone.startsWith('+')) formattedPhone = `+${formattedPhone}`;
      await SMSService.sendConsentLink(
        formattedPhone,
        patientName ?? 'Patient',
        clinicName ?? 'Clinic',
        physioName,
        token
      );
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'Failed to send SMS');
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-indigo-200/60 p-8">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-blue via-indigo-600 to-primary-purple bg-clip-text text-transparent mb-2 text-center">Consent required</h2>
        <p className="text-slate-600 text-sm mb-6 text-center">
          Patient consent is required before using the clinical workflow (including voice recording and attachments).
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleOpenCanonicalForm}
            disabled={formLoading || !physiotherapistId}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-blue to-indigo-500 text-white rounded-lg font-medium hover:from-primary-blue-hover hover:to-indigo-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            {formLoading ? 'Opening...' : 'Fill consent form (in-clinic)'}
          </button>

          <button
            type="button"
            onClick={handleSendSMS}
            disabled={smsLoading || !patientPhone?.trim() || !physiotherapistId}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-primary-purple text-white rounded-lg font-medium hover:from-indigo-600 hover:to-primary-purple-hover transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smartphone className="w-4 h-4" />
            {smsLoading ? 'Sending...' : 'Send SMS link'}
          </button>
          {!patientPhone?.trim() && (
            <p className="text-xs text-indigo-600 -mt-1">Patient phone required for SMS</p>
          )}

          <button
            type="button"
            onClick={() => setShowVerbalModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-purple to-fuchsia-600 text-white rounded-lg font-medium hover:from-primary-purple-hover hover:to-fuchsia-700 transition shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            Obtain verbal consent
          </button>
        </div>

        {smsError && (
          <p className="mt-3 text-sm text-red-600">{smsError}</p>
        )}

        <p className="mt-4 text-xs text-indigo-600/80 text-center">
          After patient completes the form or gives verbal consent, this page will update automatically.
        </p>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-primary-purple transition-colors"
          >
            Cancel — Return to command center
          </button>
        )}
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
