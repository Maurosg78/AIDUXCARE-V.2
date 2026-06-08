/**
 * Consent gate: shown when domain says consent is required (channel !== 'none').
 * Three options: canonical form (in-clinic), SMS link, verbal consent.
 */
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, MessageCircle, FileText, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VerbalConsentModal } from './VerbalConsentModal';
import { PatientConsentService } from '@/services/patientConsentService';
import { SMSService } from '@/services/smsService';
import {
  getConsentLanguageForJurisdiction,
  getConsentVersionForPortal,
  normalizeConsentJurisdiction,
} from '@/services/verbalConsentService';
import { isSpainPilot } from '@/core/pilotDetection';
import { useAuth } from '@/hooks/useAuth';
import { isMinorForConsentGate } from '@/utils/ageUtils';
import { db } from '@/lib/firebase';
import type { ConsentResolution } from '@/domain/consent/resolveConsentChannel';

export interface ConsentGateScreenProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientDateOfBirth?: string | null;
  clinicName?: string;
  consentJurisdiction?: string;
  consentResolution: ConsentResolution;
  physiotherapistId?: string;
  physiotherapistName?: string;
  onConsentDeclined?: () => Promise<void>;
  onConsentGranted?: () => Promise<void>;
  /** Optional: e.g. navigate back to command-center */
  onCancel?: () => void;
}

const ConsentGateScreenComponent: React.FC<ConsentGateScreenProps> = ({
  patientId,
  patientName,
  patientPhone,
  patientDateOfBirth,
  clinicName,
  consentJurisdiction,
  consentResolution,
  physiotherapistId,
  physiotherapistName,
  onConsentDeclined,
  onConsentGranted,
  onCancel,
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showVerbalModal, setShowVerbalModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formOpened, setFormOpened] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [adultConfirmLoading, setAdultConfirmLoading] = useState(false);
  const normalizedJurisdiction = normalizeConsentJurisdiction(consentJurisdiction);
  const consentLanguage = getConsentLanguageForJurisdiction(normalizedJurisdiction);
  const consentTextVersion = getConsentVersionForPortal(normalizedJurisdiction);
  const pilotIsSpain = isSpainPilot();
  const phoneIsSpain = patientPhone?.trim().startsWith('+34') ?? false;
  const tokenJurisdiction = normalizeConsentJurisdiction((pilotIsSpain || phoneIsSpain) ? 'ES-ES' : normalizedJurisdiction);
  const tokenLanguage = tokenJurisdiction === 'ES-ES' ? 'es' : 'en';
  const tokenConsentTextVersion = tokenJurisdiction === 'ES-ES' ? 'v1-es-ES-written' : 'v2-en-CA';
  const patientIsMinor = isMinorForConsentGate(patientDateOfBirth);
  const ageUnknownBlocked = consentResolution.blockReason === 'age_unknown_dob_required';
  const ageUnknownConfirmationRequired =
    consentResolution.blockReason === 'age_unknown_confirmation_required';
  const representativeConsentInsufficient =
    consentResolution.channel === 'insufficient' ||
    consentResolution.blockReason === 'minor_requires_representative';

  const handleConsentObtained = async (consentId: string) => {
    console.log('[ConsentGate] ✅ Verbal consent recorded', { consentId: consentId ? '***' : '' });
    setShowVerbalModal(false);
    if (onConsentGranted) {
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
        physiotherapistName ?? 'Physiotherapist',
        undefined,
        {
          jurisdiction: tokenJurisdiction,
          language: tokenLanguage,
          consentTextVersion: tokenConsentTextVersion,
        }
      );
      const url = `${window.location.origin}/consent/${token}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      setFormOpened(true);
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
        physiotherapistName ?? 'Physiotherapist',
        undefined,
        {
          jurisdiction: tokenJurisdiction,
          language: tokenLanguage,
          consentTextVersion: tokenConsentTextVersion,
        }
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
        token,
        { jurisdiction: normalizedJurisdiction }
      );
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : t('consent.failedToSendSms'));
    } finally {
      setSmsLoading(false);
    }
  };

  const handleConfirmAdultForExistingPatient = async () => {
    if (!physiotherapistId) return;

    setAdultConfirmLoading(true);
    setSmsError(null);

    try {
      const consentStatusRef = doc(db, 'patients', patientId, 'consent_status', 'latest');
      const adultConfirmedByClinicianAt = new Date().toISOString();
      const adultConfirmedByClinician = physiotherapistId;
      await setDoc(
        consentStatusRef,
        {
          adultConfirmedByClinicianAt,
          adultConfirmedByClinician,
        },
        { merge: true }
      );

      if (onConsentGranted) {
        await onConsentGranted();
      }
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : 'No se pudo registrar la confirmación.');
    } finally {
      setAdultConfirmLoading(false);
    }
  };

  if (ageUnknownBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-red-200 p-8">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-red-700" />
          </div>
          <div role="alert" className="text-center">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Fecha de nacimiento requerida</h2>
            <p className="text-slate-700 text-sm mb-6">
              No es posible iniciar la sesión. La fecha de nacimiento del paciente es obligatoria para verificar si requiere consentimiento de representante.
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-sm text-slate-500 hover:text-primary-purple transition-colors"
            >
              {t('consent.cancelReturnToCommandCenter')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (ageUnknownConfirmationRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-amber-200 p-8">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-700" />
          </div>
          <div role="alert" className="text-center">
            <h2 className="text-xl font-semibold text-amber-900 mb-2">Confirmación de edad requerida</h2>
            <p className="text-slate-700 text-sm mb-6">
              La fecha de nacimiento de este paciente no está registrada. Por favor confirma que es mayor de edad para continuar.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirmAdultForExistingPatient}
            disabled={!physiotherapistId || adultConfirmLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-purple to-fuchsia-600 text-white rounded-lg font-medium hover:from-primary-purple-hover hover:to-fuchsia-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4" />
            {adultConfirmLoading ? 'Registrando confirmación...' : 'Confirmo que el paciente es mayor de edad'}
          </button>

          {smsError && (
            <p className="mt-3 text-sm text-red-600">{smsError}</p>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-primary-purple transition-colors"
            >
              {t('consent.cancelReturnToCommandCenter')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (patientIsMinor || representativeConsentInsufficient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-amber-200 p-8">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-700" />
          </div>
          <div role="alert" className="text-center">
            <h2 className="text-xl font-semibold text-amber-900 mb-2">Consentimiento con representante requerido</h2>
            <p className="text-slate-700 text-sm mb-6">
              Este paciente es menor de edad. Se requiere consentimiento del representante legal (padre, madre o tutor).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowVerbalModal(true)}
            disabled={!physiotherapistId}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-purple to-fuchsia-600 text-white rounded-lg font-medium hover:from-primary-purple-hover hover:to-fuchsia-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4" />
            Registrar consentimiento con representante legal
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-primary-purple transition-colors"
            >
              {t('consent.cancelReturnToCommandCenter')}
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
          jurisdiction={normalizedJurisdiction}
          forceRepresentativeConsent
          onConsentObtained={handleConsentObtained}
          onConsentDenied={onConsentDeclined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-indigo-200/60 p-8">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-blue via-indigo-600 to-primary-purple bg-clip-text text-transparent mb-2 text-center">{t('consent.requiredTitle')}</h2>
        <p className="text-slate-600 text-sm mb-6 text-center">
          {t('consent.requiredWorkflowBody')}
        </p>

        <div className="space-y-3">
          {formOpened ? (
            <div className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-green-800">{t('consent.formOpenedTitle')}</p>
                <p className="text-xs text-green-600">{t('consent.formOpenedBody')}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenCanonicalForm}
              disabled={formLoading || !physiotherapistId}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-blue to-indigo-500 text-white rounded-lg font-medium hover:from-primary-blue-hover hover:to-indigo-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              {formLoading ? t('consent.opening') : t('consent.fillForm')}
            </button>
          )}

          <button
            type="button"
            onClick={handleSendSMS}
            disabled={smsLoading || !patientPhone?.trim() || !physiotherapistId}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-primary-purple text-white rounded-lg font-medium hover:from-indigo-600 hover:to-primary-purple-hover transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smartphone className="w-4 h-4" />
            {smsLoading ? t('consent.sending') : t('consent.sendSms')}
          </button>
          {!patientPhone?.trim() && (
            <p className="text-xs text-indigo-600 -mt-1">{t('consent.patientPhoneRequired')}</p>
          )}

          <button
            type="button"
            onClick={() => setShowVerbalModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-purple to-fuchsia-600 text-white rounded-lg font-medium hover:from-primary-purple-hover hover:to-fuchsia-700 transition shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            {t('consent.obtainVerbal')}
          </button>
        </div>

        {smsError && (
          <p className="mt-3 text-sm text-red-600">{smsError}</p>
        )}

        <p className="mt-4 text-xs text-indigo-600/80 text-center">
          {t('consent.autoUpdateAfterConsent')}
        </p>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-primary-purple transition-colors"
          >
            {t('consent.cancelReturnToCommandCenter')}
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
        jurisdiction={normalizedJurisdiction}
        forceRepresentativeConsent={false}
        onConsentObtained={handleConsentObtained}
        onConsentDenied={onConsentDeclined}
      />
    </div>
  );
};

export const ConsentGateScreen = ConsentGateScreenComponent;
export default ConsentGateScreenComponent;
