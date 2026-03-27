/**
 * Patient Consent Portal Page - PHIPA/PIPEDA Compliant
 * 
 * Public-facing page where patients review and accept/decline consent
 * for AI-assisted clinical documentation.
 * 
 * Compliance Requirements:
 * - PHIPA s.18: Knowledgeable consent (patient must read full text)
 * - PIPEDA Principle 4.3: Consent must be meaningful and informed
 * - ISO 27001 A.18.1.4: Document consent decisions with audit trail
 * 
 * Key Features:
 * - Full consent text displayed before any action
 * - Explicit Accept/Decline buttons
 * - Decline reasons collection (compliance requirement)
 * - Auto-close after successful submission
 * - Mobile-responsive design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Shield, FileText, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  getConsentLanguageForJurisdiction,
  getVerbalConsentText,
  getConsentVersionForPortal,
  normalizeConsentJurisdiction,
} from '../services/verbalConsentService';

interface ConsentToken {
  patientId: string;
  patientName: string;
  professionalId: string;
  clinicName?: string;
  patientPhone?: string;
  jurisdiction?: string;
  language?: string;
  consentTextVersion?: string;
  expiresAt: Date;
  used: boolean;
}

const CONSENT_COPY = {
  en: {
    invalidLink: 'Invalid consent link',
    notFound: 'Consent link not found or expired',
    expired: 'This consent link has expired',
    accessDenied: 'Access denied. The consent link may not work from this domain. Contact your clinic.',
    unavailable: 'Unable to connect. Please check your connection and try again.',
    failedToLoad: 'Failed to load consent information. The link may have expired.',
    loading: 'Loading consent information...',
    unableToLoad: 'Unable to Load Consent',
    contactProvider: 'If you believe this is an error, please contact your healthcare provider.',
    alreadyRecordedTitle: 'Consent Already Recorded',
    alreadyRecordedBody: 'This consent link has already been used. You can safely close this page.',
    viewConfirmation: 'View confirmation',
    headerTitle: 'Consent for AI-Assisted Clinical Documentation',
    patientLabel: 'Patient',
    clinicLabel: 'Clinic',
    instructionsTitle: 'Please read the consent statement below carefully:',
    instructions: [
      'This explains how your health information will be used',
      'You can accept or decline this consent',
      'Your decision will be recorded for compliance purposes',
      'You can withdraw consent at any time by contacting your provider',
    ],
    consentStatement: 'Consent Statement',
    declineTitle: 'You are declining consent',
    declineBody: 'Please help us understand why by selecting at least one reason below. This information helps us improve our services.',
    declineReasonsLabel: 'Reason(s) for declining:',
    additionalComments: 'Additional comments (optional)',
    additionalCommentsPlaceholder: "Any additional information you'd like to share...",
    back: 'Back',
    recording: 'Recording...',
    confirmDecline: 'Confirm: I Decline',
    recordingConsent: 'Recording your consent...',
    acceptButton: 'I Accept and Provide Consent',
    or: 'or',
    declineButton: 'I Decline Consent',
    footerLaw: "This consent is governed by Ontario's Personal Health Information Protection Act (PHIPA)",
    footerWithdraw: 'You can withdraw consent at any time by contacting your healthcare provider',
    acceptRecorded: 'Consent accepted via Cloud Function',
    reasonRequired: 'Please select at least one reason for declining consent',
    expiredAction: 'This consent link has expired. Please request a new one from your clinic.',
    invalidAction: 'Invalid consent link. Please request a new one from your clinic.',
    alreadyUsedAction: 'This consent has already been recorded. The link can only be used once.',
    acceptFailed: 'Failed to record consent. Please try again.',
    declineFailed: 'Failed to record declined consent. Please try again.',
  },
  es: {
    invalidLink: 'Enlace de consentimiento no válido',
    notFound: 'No se encontró el enlace de consentimiento o ha caducado',
    expired: 'Este enlace de consentimiento ha caducado',
    accessDenied: 'Acceso denegado. Es posible que el enlace no funcione desde este dominio. Contacta con tu clínica.',
    unavailable: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
    failedToLoad: 'No se pudo cargar la información del consentimiento. Es posible que el enlace haya caducado.',
    loading: 'Cargando información del consentimiento...',
    unableToLoad: 'No se pudo cargar el consentimiento',
    contactProvider: 'Si crees que esto es un error, ponte en contacto con tu profesional sanitario.',
    alreadyRecordedTitle: 'Consentimiento ya registrado',
    alreadyRecordedBody: 'Este enlace de consentimiento ya se ha utilizado. Puedes cerrar esta página con seguridad.',
    viewConfirmation: 'Ver confirmación',
    headerTitle: 'Consentimiento para documentación clínica asistida por IA',
    patientLabel: 'Paciente',
    clinicLabel: 'Clínica',
    instructionsTitle: 'Lee atentamente la declaración de consentimiento:',
    instructions: [
      'Aquí se explica cómo se utilizará tu información de salud',
      'Puedes aceptar o rechazar este consentimiento',
      'Tu decisión quedará registrada por motivos de cumplimiento',
      'Puedes retirar el consentimiento en cualquier momento contactando con tu profesional',
    ],
    consentStatement: 'Declaración de consentimiento',
    declineTitle: 'Estás rechazando el consentimiento',
    declineBody: 'Ayúdanos a entender el motivo seleccionando al menos una razón. Esta información nos ayuda a mejorar el servicio.',
    declineReasonsLabel: 'Motivo(s) del rechazo:',
    additionalComments: 'Comentarios adicionales (opcional)',
    additionalCommentsPlaceholder: 'Cualquier información adicional que quieras compartir...',
    back: 'Volver',
    recording: 'Registrando...',
    confirmDecline: 'Confirmar: rechazo el consentimiento',
    recordingConsent: 'Registrando tu consentimiento...',
    acceptButton: 'Acepto y doy mi consentimiento',
    or: 'o',
    declineButton: 'Rechazo el consentimiento',
    footerLaw: 'Este consentimiento se rige por la normativa aplicable de protección de datos y documentación clínica.',
    footerWithdraw: 'Puedes retirar el consentimiento en cualquier momento contactando con tu profesional sanitario',
    acceptRecorded: 'Consentimiento aceptado mediante Cloud Function',
    reasonRequired: 'Selecciona al menos una razón para rechazar el consentimiento',
    expiredAction: 'Este enlace de consentimiento ha caducado. Solicita uno nuevo a tu clínica.',
    invalidAction: 'Enlace de consentimiento no válido. Solicita uno nuevo a tu clínica.',
    alreadyUsedAction: 'Este consentimiento ya ha sido registrado. El enlace solo puede utilizarse una vez.',
    acceptFailed: 'No se pudo registrar el consentimiento. Inténtalo de nuevo.',
    declineFailed: 'No se pudo registrar el rechazo del consentimiento. Inténtalo de nuevo.',
  },
} as const;

const DECLINE_REASON_LABELS = {
  en: [
    { value: 'no_recording', label: 'I do not want to be recorded' },
    { value: 'no_ai', label: 'I do not trust AI technology' },
    { value: 'privacy_concerns', label: 'I have privacy concerns' },
    { value: 'traditional_method', label: 'I prefer traditional documentation' },
    { value: 'needs_time', label: 'I need more time to decide' },
    { value: 'not_understand', label: 'I do not understand what I am consenting to' },
    { value: 'other', label: 'Other reason' },
  ],
  es: [
    { value: 'no_recording', label: 'No quiero que se me grabe' },
    { value: 'no_ai', label: 'No confío en la tecnología de IA' },
    { value: 'privacy_concerns', label: 'Tengo preocupaciones de privacidad' },
    { value: 'traditional_method', label: 'Prefiero la documentación tradicional' },
    { value: 'needs_time', label: 'Necesito más tiempo para decidir' },
    { value: 'not_understand', label: 'No entiendo aquello para lo que estoy dando consentimiento' },
    { value: 'other', label: 'Otro motivo' },
  ],
} as const;

export default function PatientConsentPortalPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<ConsentToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [consentDecision, setConsentDecision] = useState<'accept' | 'decline' | null>(null);

  // Decline form state
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReasons, setDeclineReasons] = useState<string[]>([]);
  const [declineNotes, setDeclineNotes] = useState('');
  const effectiveJurisdiction = useMemo(() => {
    const tokenJurisdiction = normalizeConsentJurisdiction(tokenData?.jurisdiction);
    const tokenLanguage = tokenData?.language === 'es' ? 'ES-ES' : tokenData?.language === 'en' ? 'CA-ON' : null;
    const phoneJurisdiction = `${tokenData?.patientPhone || ''}`.trim().startsWith('+34') ? 'ES-ES' : null;
    const fallbackJurisdiction = tokenLanguage || phoneJurisdiction || tokenJurisdiction;

    return normalizeConsentJurisdiction(fallbackJurisdiction);
  }, [tokenData?.jurisdiction, tokenData?.language, tokenData?.patientPhone]);
  const language = getConsentLanguageForJurisdiction(effectiveJurisdiction);
  const copy = CONSENT_COPY[language];
  const declineOptions = DECLINE_REASON_LABELS[language];
  const textVersion = tokenData?.consentTextVersion || getConsentVersionForPortal(effectiveJurisdiction);
  const consentText = getVerbalConsentText(textVersion);

  useEffect(() => {
    if (!token) {
      setError(CONSENT_COPY.en.invalidLink);
      setLoading(false);
      return;
    }

    loadTokenData();
  }, [token]);

  const loadTokenData = async () => {
    try {
      const tokenRef = doc(db, 'patient_consent_tokens', token!);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        setError(copy.notFound);
        setLoading(false);
        return;
      }

      const data = tokenSnap.data();

      // ✅ Check if already used - redirect to success page immediately
      if (data.used) {
        // Token was used - check what decision was made
        const consentGiven = data.consentGiven || {};
        const decision = consentGiven.scope === 'ongoing' ? 'accept' : 'decline';

        // Redirect immediately to terminal success page (no intermediate screen)
        window.location.replace(`${window.location.origin}/consent/success?decision=${decision}&lang=${language}`);
        return;
      }

      // Check if expired
      const expiresAt = data.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        setError(copy.expired);
        setLoading(false);
        return;
      }

      setTokenData({
        patientId: data.patientId,
        patientName: data.patientName,
        professionalId: data.professionalId,
        clinicName: data.clinicName,
        patientPhone: data.patientPhone,
        jurisdiction: data.jurisdiction,
        language: data.language,
        consentTextVersion: data.consentTextVersion,
        expiresAt: expiresAt || new Date(),
        used: data.used || false,
      });
      setLoading(false);
    } catch (err: any) {
      console.error('[ConsentPortal] Error loading token:', err);
      const msg = err?.code === 'permission-denied' || err?.message?.includes('permission')
        ? copy.accessDenied
        : err?.code === 'unavailable' || err?.message?.includes('unavailable')
          ? copy.unavailable
          : copy.failedToLoad;
      setError(msg);
      setLoading(false);
    }
  };

  const handleAcceptConsent = async () => {
    if (!tokenData || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      // ✅ WO-CONSENT-PORTAL-CF-01: Use Cloud Function instead of direct Firestore write
      // Patients cannot write directly to consent records - only controlled backend can
      // ✅ Region matches functions/index.js LOCATION: northamerica-northeast1 (Montreal, Canada)
      const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
      const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
      const functionsUrl = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/acceptPatientConsentByToken`;

      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          decision: 'granted',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error || 'INTERNAL_ERROR';

        if (errorCode === 'TOKEN_EXPIRED') {
          setError(copy.expiredAction);
        } else if (errorCode === 'INVALID_TOKEN') {
          setError(copy.invalidAction);
        } else if (errorCode === 'CONSENT_ALREADY_RECORDED') {
          setError(copy.alreadyUsedAction);
        } else {
          setError(copy.acceptFailed);
        }
        return;
      }

      const result = await response.json();

      if (result.success) {
        console.log('[ConsentPortal] Consent accepted via Cloud Function:', tokenData.patientId);
        window.location.replace(`${window.location.origin}/consent/success?decision=accept&lang=${language}`);
      } else {
        setError(copy.acceptFailed);
      }
    } catch (err: any) {
      // ✅ T6: Logging mejorado para DX (sin cambiar mensaje al paciente)
      console.error('[ConsentPortal] accept failed', {
        message: err?.message,
        url: `https://${import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1'}-${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev'}.cloudfunctions.net/acceptPatientConsentByToken`
      });
      setError(copy.acceptFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineConsent = async () => {
    if (!tokenData || !token) return;

    if (declineReasons.length === 0) {
      setError(copy.reasonRequired);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // ✅ WO-CONSENT-PORTAL-CF-01: Use Cloud Function instead of direct Firestore write
      // ✅ Region matches functions/index.js LOCATION: northamerica-northeast1 (Montreal, Canada)
      const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
      const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';
      const functionsUrl = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/acceptPatientConsentByToken`;

      const response = await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          decision: 'declined',
          declineReasons,
          declineNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error || 'INTERNAL_ERROR';

        if (errorCode === 'TOKEN_EXPIRED') {
          setError(copy.expiredAction);
        } else if (errorCode === 'INVALID_TOKEN') {
          setError(copy.invalidAction);
        } else if (errorCode === 'CONSENT_ALREADY_RECORDED') {
          setError(copy.alreadyUsedAction);
        } else {
          setError(copy.declineFailed);
        }
        return;
      }

      const result = await response.json();

      if (result.success) {
        console.log('[ConsentPortal] Consent declined via Cloud Function:', {
          patientId: tokenData.patientId,
          reasons: declineReasons
        });

        window.location.replace(`${window.location.origin}/consent/success?decision=declined&lang=${language}`);
      } else {
        setError(copy.declineFailed);
      }
    } catch (err: any) {
      // ✅ T6: Logging mejorado para DX (sin cambiar mensaje al paciente)
      console.error('[ConsentPortal] decline failed', {
        message: err?.message,
        url: `https://${import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1'}-${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev'}.cloudfunctions.net/acceptPatientConsentByToken`
      });
      setError(copy.declineFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDeclineReason = (reason: string) => {
    setDeclineReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{copy.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.unableToLoad}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            {copy.contactProvider}
          </p>
        </div>
      </div>
    );
  }

  // Success state (after submission) - Only show if token was already used (revisit)
  // For new submissions, we redirect immediately to /consent/success
  if (submitted && tokenData?.used === true) {
    // This only happens if user revisits a used token
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {consentDecision === 'accept' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.alreadyRecordedTitle}</h1>
              <p className="text-gray-600 mb-6">{copy.alreadyRecordedBody}</p>
              <button
                onClick={() => window.location.replace(`${window.location.origin}/consent/success?decision=accept&lang=${language}`)}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {copy.viewConfirmation}
              </button>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{copy.alreadyRecordedTitle}</h1>
              <p className="text-gray-600 mb-6">{copy.alreadyRecordedBody}</p>
              <button
                onClick={() => window.location.replace(`${window.location.origin}/consent/success?decision=declined&lang=${language}`)}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                {copy.viewConfirmation}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main consent form
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-blue via-indigo-600 to-primary-purple rounded-t-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">{copy.headerTitle}</h1>
          </div>
          <p className="text-indigo-100">
            {copy.patientLabel}: <span className="font-semibold">{tokenData?.patientName}</span>
          </p>
          {tokenData?.clinicName && (
            <p className="text-indigo-100 text-sm mt-1">
              {copy.clinicLabel}: {tokenData.clinicName}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary-purple flex-shrink-0 mt-0.5" />
              <div className="text-sm text-indigo-900">
                <p className="font-medium mb-2">{copy.instructionsTitle}</p>
                <ul className="list-disc list-inside space-y-1 text-indigo-800">
                  {copy.instructions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {copy.consentStatement}
            </h2>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {consentText}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Decline Form (if showing) */}
          {showDeclineForm ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-900">
                    <p className="font-medium mb-2">{copy.declineTitle}</p>
                    <p className="text-orange-800">
                      {copy.declineBody}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decline Reasons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  {copy.declineReasonsLabel} <span className="text-red-600">*</span>
                </label>
                {declineOptions.map((reason) => (
                  <label
                    key={reason.value}
                    className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={declineReasons.includes(reason.value)}
                      onChange={() => toggleDeclineReason(reason.value)}
                      className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-800">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {copy.additionalComments}
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder={copy.additionalCommentsPlaceholder}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReasons([]);
                    setDeclineNotes('');
                    setError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-4 px-6 rounded-lg transition-colors"
                >
                  {copy.back}
                </button>
                <button
                  onClick={handleDeclineConsent}
                  disabled={submitting || declineReasons.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      {copy.recording}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      {copy.confirmDecline}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Accept/Decline Buttons */
            <div className="space-y-4 pt-4">
              <button
                onClick={handleAcceptConsent}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary-blue via-indigo-600 to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover disabled:bg-gray-300 text-white font-semibold py-6 px-6 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                    <>
                      <Clock className="w-6 h-6 animate-spin" />
                      {copy.recordingConsent}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      {copy.acceptButton}
                    </>
                  )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">{copy.or}</span>
                </div>
              </div>

              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 disabled:bg-gray-50 text-indigo-900 font-semibold py-6 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-lg border-2 border-indigo-200"
              >
                <XCircle className="w-6 h-6" />
                {copy.declineButton}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
            <p>{copy.footerLaw}</p>
            <p className="mt-1">{copy.footerWithdraw}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Named export for router compatibility
export { PatientConsentPortalPage };
