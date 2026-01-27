import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Send, CheckCircle, Clock, Mic, X } from 'lucide-react';
import { SMSService } from '../../services/smsService';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PatientConsentService } from '../../services/patientConsentService';
// ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más checkConsentViaServer en el Gate
// El parent maneja toda la verificación
import { VerbalConsentModal } from './VerbalConsentModal';
import type { ConsentResolution } from '@/domain/consent/resolveConsentChannel';

interface ConsentGateScreenProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  clinicName?: string;
  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Solo recibe consentResolution del dominio
  // NO más callbacks, NO más estados duplicados
  consentResolution: ConsentResolution;
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Callback para check inmediato cuando se declina
  onConsentDeclined?: () => Promise<void>;
}

function ConsentGateScreen({
  patientId,
  patientName,
  patientPhone,
  clinicName = 'AiDuxCare Clinic',
  consentResolution,
  onConsentDeclined
}: ConsentGateScreenProps) {
  const { user } = useAuth();
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [physioNameForSms, setPhysioNameForSms] = useState<string>('');
  const [showVerbalModal, setShowVerbalModal] = useState(false);
  const [smsRequested, setSmsRequested] = useState(false);
  const [processingVerbalConsent, setProcessingVerbalConsent] = useState(false);

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más estados de consentimiento en el Gate
  // El dominio decide todo, el Gate solo renderiza
  // NO más: hasConsent, consentGrantedRef, checkingConsent, polling, checkConsentViaServer

  // Load physiotherapist name
  useEffect(() => {
    async function loadPhysioName() {
      if (!user?.uid) return;
      try {
        const physioDoc = await getDoc(doc(db, 'professionals', user.uid));
        if (physioDoc.exists()) {
          const data = physioDoc.data();
          const firstName = data.firstName || data.displayName || 'Your Physiotherapist';
          setPhysioNameForSms(firstName);
        }
      } catch (error) {
        console.error('[ConsentGate] Error loading physio name:', error);
        setPhysioNameForSms('Your Physiotherapist');
      }
    }
    loadPhysioName();
  }, [user?.uid]);

  // Check for existing SMS consent request on mount
  useEffect(() => {
    async function checkSMSConsentRequest() {
      if (!patientId || !user?.uid) return;

      try {
        const hasRequest = await PatientConsentService.hasSMSConsentRequest(patientId, user.uid);
        if (hasRequest) {
          console.log('[ConsentGate] Found existing SMS consent request');
          setSmsRequested(true);
          setSmsSent(true);
        }
      } catch (error) {
        console.error('[ConsentGate] Error checking SMS consent request:', error);
      }
    }

    checkSMSConsentRequest();
  }, [patientId, user?.uid]);

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más verificación de consentimiento en el Gate
  // El parent (ProfessionalWorkflowPage) maneja todo el polling y verificación
  // El Gate solo renderiza según allowedActions del dominio

  const handleSendSMS = async () => {
    if (!patientPhone) {
      setSmsError('Patient phone number not available. Please update patient contact information.');
      return;
    }

    if (!user?.uid) {
      setSmsError('User not authenticated.');
      return;
    }

    // Protection against multi-click / spam: check for existing SMS request
    if (smsRequested) {
      setSmsError('A consent request is already pending for this patient. Waiting for patient response.');
      return;
    }

    // Additional check: verify no existing request in Firestore
    try {
      const hasExisting = await PatientConsentService.hasSMSConsentRequest(patientId, user.uid);
      if (hasExisting) {
        setSmsRequested(true);
        setSmsSent(true);
        setSmsError(null);
        return;
      }
    } catch (error) {
      console.warn('[ConsentGate] Error checking existing SMS request:', error);
      // Continue anyway - don't block if check fails
    }

    setSmsSending(true);
    setSmsError(null);

    try {
      const token = await PatientConsentService.generateConsentToken(
        patientId,
        patientName || 'Patient',
        patientPhone,
        undefined,
        clinicName,
        user.uid,
        physioNameForSms
      );

      await SMSService.sendConsentLink(
        patientPhone,
        patientName || 'Patient',
        clinicName,
        physioNameForSms,
        token
      );

      // Record SMS consent request state
      await PatientConsentService.recordSMSConsentRequest(
        patientId,
        user.uid,
        patientName || 'Patient',
        token
      );

      setSmsSent(true);
      setSmsRequested(true);
      console.log('[ConsentGate] SMS consent link sent and state recorded:', patientPhone);
    } catch (error) {
      console.error('[ConsentGate] Error sending SMS:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS consent link.';

      // Better UX when SMS service is not configured
      if (errorMessage.includes('SMS service is not configured')) {
        setSmsError('SMS service is not configured. Please read the consent verbally using the "Read & Record Verbal Consent" button above.');
      } else {
        setSmsError(errorMessage);
      }
    } finally {
      setSmsSending(false);
    }
  };

  const handleVerbalConsentComplete = async () => {
    console.log('[ConsentGate] Verbal consent completed');

    // ✅ WO-CONSENT-SINGLE-SOURCE-01: Gate NO actualiza estados de consentimiento
    // Solo cierra el modal localmente
    // El parent detecta el cambio vía workflowConsentStatus (actualizado por polling o check inmediato)
    setProcessingVerbalConsent(false);
    setShowVerbalModal(false);

    console.log('[ConsentGate] ✅ Verbal consent recorded - parent will detect via polling/check');
    // ❌ NO actualizar hasConsent, consentGrantedRef, sessionStorage
    // ❌ NO verificar backend - el parent maneja todo
    // El parent's polling detectará el cambio (declined o granted) en el siguiente ciclo
  };

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: ConsentResolution viene del parent (dominio)
  // NO se resuelve aquí, NO se infiere, solo se consume
  const { channel, allowedActions } = consentResolution;

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: El parent ya verificó que channel !== 'none' antes de renderizar
  // Si llegamos aquí, es porque el dominio dice que debemos renderizar el Gate

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Log para debugging
  console.log('[ConsentGate] 🎨 Render check (purely declarative)', {
    channel,
    allowedActions,
    patientId,
    willRenderGate: channel !== 'none'
  });

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más guards basados en estado local
  // El parent ya decidió si renderizar el Gate basándose en consentResolution
  // Si llegamos aquí, es porque el dominio dice que debemos renderizar

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {/* Modal at 35% width */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Consent Required</h2>
                  <p className="text-sm text-blue-100 mt-1">
                    {patientName || `Patient ID: ${patientId.slice(0, 8)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900">Clinical Workflow Blocked</p>
                <p className="text-amber-700 mt-1">
                  Patient consent is required before accessing any clinical features.
                </p>
              </div>
            </div>

            {/* Consent Text Preview */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Consent Statement</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                "We will record our physiotherapy session to automatically generate medical notes using artificial intelligence.
                The recording is securely stored on Canadian servers. Do you authorize this recording and processing of your data?"
              </p>
            </div>

            {/* ✅ WO-CONSENT-DOMAIN-ACTIONS-01: Render SOLO por acciones permitidas (sin inferencias) */}
            {allowedActions.sendSms && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Send Digital Consent Link
                  </label>
                  {patientPhone && (
                    <span className="text-xs text-gray-500">{patientPhone}</span>
                  )}
                </div>

                {!patientPhone && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    Patient phone number missing. Update patient contact info to send SMS.
                  </div>
                )}

                {smsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {smsError}
                  </div>
                )}

                {smsSent && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-700">
                      <p className="font-medium">SMS sent successfully!</p>
                      <p className="text-green-600 mt-1">Patient will receive a secure consent link.</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSendSMS}
                  disabled={smsSending || !patientPhone || smsSent}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {smsSending ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Sending SMS...
                    </>
                  ) : smsSent ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      SMS Sent
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Consent via SMS
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ✅ WO-CONSENT-DOMAIN-ACTIONS-01: Verbal solo si explícitamente permitido por dominio */}
            {allowedActions.recordVerbal && (
              <div className="space-y-3">
                {allowedActions.sendSms && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                )}
                <p className="text-sm font-medium text-gray-700">Verbal Consent:</p>
                <button
                  onClick={() => {
                    // ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más verificación de consentimiento
                    // Solo verificar estado local del modal
                    if (processingVerbalConsent) {
                      console.log('[ConsentGate] Verbal consent already being processed, skipping');
                      return;
                    }
                    setShowVerbalModal(true);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  Read & Record Verbal Consent
                </button>
              </div>
            )}

            {/* ✅ WO-CONSENT-DOMAIN-ACTIONS-01: Waiting message (solo si SMS está permitido) */}
            {allowedActions.sendSms && smsRequested && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 font-medium">Consent request has been sent to the patient via SMS.</p>
                    <p className="text-xs text-blue-700 mt-1">Waiting for patient response. This modal will close automatically when consent is received.</p>
                  </div>
                </div>

                {/* Actions available while waiting */}
                <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                  <button
                    onClick={handleSendSMS}
                    disabled={smsSending}
                    className="flex-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {smsSending ? 'Sending...' : 'Re-send SMS'}
                  </button>
                  <button
                    onClick={() => {
                      // ✅ WO-CONSENT-SINGLE-SOURCE-01: NO más verificación de consentimiento
                      // Solo verificar estado local del modal
                      if (processingVerbalConsent) {
                        console.log('[ConsentGate] Verbal consent already being processed, skipping');
                        return;
                      }
                      setShowVerbalModal(true);
                    }}
                    className="flex-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-medium py-2 px-3 rounded transition-colors"
                  >
                    Switch to Verbal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verbal Consent Modal */}
      {/* ✅ WO-CONSENT-SINGLE-SOURCE-01: Modal solo se muestra si allowedActions.recordVerbal === true */}
      {/* NO más guards basados en estado local de consentimiento */}
      {showVerbalModal && allowedActions.recordVerbal && (
        <VerbalConsentModal
          patientId={patientId}
          patientName={patientName || 'Patient'}
          // ✅ WO-CONSENT-VERBAL-NON-BLOCKING-01: Pass disclosure delivery info
          patientEmail={undefined} // TODO: Get from patient data if available
          patientPhone={patientPhone}
          onClose={() => {
            console.log('[ConsentGate] Verbal modal closed');
            setShowVerbalModal(false);
          }}
          onConsentGranted={handleVerbalConsentComplete}
          // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Trigger immediate check when consent is declined
          onConsentDeclined={async () => {
            console.log('[ConsentGate] Consent declined - triggering immediate check');
            // Close modal
            setProcessingVerbalConsent(false);
            setShowVerbalModal(false);
            // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Trigger immediate check in parent
            // This ensures workflowConsentStatus is updated immediately (no waiting for polling)
            if (onConsentDeclined) {
              await onConsentDeclined();
            }
          }}
        />
      )}
    </>
  );
}

export default ConsentGateScreen;
export { ConsentGateScreen };
