import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Send, CheckCircle, Clock, Mic, X } from 'lucide-react';
import { SMSService } from '../../services/smsService';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PatientConsentService } from '../../services/patientConsentService';
import { checkConsentViaServer } from '../../services/consentServerService';
import { VerbalConsentModal } from './VerbalConsentModal';

interface ConsentGateScreenProps {
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  clinicName?: string;
  onConsentVerified?: () => void;
  // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Workflow is source of truth
  consentStatus?: {
    hasValidConsent: boolean;
    status?: string | null;
    consentMethod?: string | null;
  } | null;
}

function ConsentGateScreen({
  patientId,
  patientName,
  patientPhone,
  clinicName = 'AiDuxCare Clinic',
  onConsentVerified,
  consentStatus
}: ConsentGateScreenProps) {
  const { user } = useAuth();
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [physioNameForSms, setPhysioNameForSms] = useState<string>('');
  const [showVerbalModal, setShowVerbalModal] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [smsRequested, setSmsRequested] = useState(false);
  const [processingVerbalConsent, setProcessingVerbalConsent] = useState(false);

  // ✅ WO-CONSENT-POLLING-FIX-04: Refs for polling control
  const consentPollingRef = useRef<NodeJS.Timeout | null>(null);
  const consentPollingAttemptsRef = useRef<number>(0);

  // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Guard to prevent re-blocking once consent is granted
  const consentGrantedRef = useRef<boolean>(false);

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

  // ✅ CRITICAL FIX: Check Firestore/Cloud Function FIRST on mount (persists across sessions)
  // sessionStorage is only for optimization within the same session
  const [checkingConsent, setCheckingConsent] = useState(true);
  const verificationExecutedRef = useRef(false);
  
  // ✅ Log component mount
  useEffect(() => {
    console.log('[ConsentGate] 🚀 Component mounted/updated', {
      patientId,
      hasUser: !!user?.uid,
      hasConsent,
      consentGrantedRef: consentGrantedRef.current,
      checkingConsent
    });
  }, [patientId, user?.uid]);
  
  useEffect(() => {
    console.log('[ConsentGate] 🔄 useEffect triggered', {
      patientId,
      hasUser: !!user?.uid,
      verificationExecuted: verificationExecutedRef.current
    });
    
    if (!patientId || !user?.uid) {
      console.log('[ConsentGate] ⚠️ Missing patientId or user, skipping verification');
      setCheckingConsent(false);
      return;
    }

    // ✅ Prevent multiple executions
    if (verificationExecutedRef.current) {
      console.log('[ConsentGate] ⚠️ Verification already executed, skipping');
      return;
    }

    const checkExistingConsent = async () => {
      verificationExecutedRef.current = true;
      setCheckingConsent(true);
      try {
        console.log('[ConsentGate] 🔍 Checking existing consent from Firestore for patient:', patientId);
        const consentResult = await checkConsentViaServer(patientId);
        console.log('[ConsentGate] 📊 Consent check result:', {
          hasValidConsent: consentResult.hasValidConsent,
          status: consentResult.status,
          method: consentResult.consentMethod,
          error: consentResult.error
        });
        
        if (consentResult.hasValidConsent) {
          console.log('[ConsentGate] ✅ Patient already has consent in Firestore - loading immediately', {
            patientId,
            status: consentResult.status,
            method: consentResult.consentMethod
          });
          // ✅ Consent exists in Firestore - load it immediately
          consentGrantedRef.current = true;
          setHasConsent(true);
          
          // ✅ Also update sessionStorage for optimization (prevent re-mounts in same session)
          const consentKey = `consent_granted_${patientId}`;
          sessionStorage.setItem(consentKey, 'true');
          sessionStorage.setItem(`${consentKey}_timestamp`, Date.now().toString());
          
          // ✅ CRITICAL: Set checkingConsent to false AFTER setting state
          // This allows the render check to work correctly
          setCheckingConsent(false);
          
          console.log('[ConsentGate] ✅ State updated (consent already existed - NO navigation)', {
            hasConsent: true,
            consentGrantedRef: consentGrantedRef.current,
            checkingConsent: false
          });
          
          // ✅ CRITICAL: Do NOT call onConsentVerified if consent already existed
          // onConsentVerified should only be called when consent is NEWLY granted
          // If consent already exists, we're already in the workflow - don't navigate away
          
          // Return early - don't continue to show gate
          return;
        } else {
          console.log('[ConsentGate] ❌ No existing consent found - will show gate', {
            patientId,
            result: consentResult
          });
          // ✅ Check sessionStorage as fallback (for same-session optimization)
          const consentKey = `consent_granted_${patientId}`;
          const wasGranted = sessionStorage.getItem(consentKey);
          if (wasGranted === 'true') {
            console.log('[ConsentGate] Consent was granted in this session (sessionStorage), skipping gate');
            consentGrantedRef.current = true;
            setHasConsent(true);
            setCheckingConsent(false); // Set to false so render check works
            // ✅ CRITICAL: Do NOT call onConsentVerified if consent already existed
            // This prevents navigation when consent was already granted
            return; // Return early
          }
          // No consent found - will show gate
          setCheckingConsent(false);
        }
      } catch (error: any) {
        console.error('[ConsentGate] ❌ Error checking existing consent (will show gate):', {
          error: error?.message,
          patientId
        });
        // On error, show gate (fail-safe)
        setCheckingConsent(false);
      }
    };

    checkExistingConsent();
  }, [patientId, user?.uid, onConsentVerified]);

  // ✅ WO-CONSENT-POLLING-FIX-04: Polling with single instance guard and max attempts
  // NO Firestore listeners - all checks go through Cloud Functions
  useEffect(() => {
    if (!patientId || !user?.uid) {
      // Cleanup if patient/user invalid
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
      }
      return;
    }

    // ✅ Skip polling if consent already granted (checked from Firestore on mount)
    if (consentGrantedRef.current || hasConsent) {
      console.log('[ConsentGate] Consent already granted (from Firestore check), skipping polling setup');
      return;
    }

    // ✅ Regla 1: Solo se inicia UNA vez por patientId
    if (consentPollingRef.current) {
      console.log('[ConsentGate] Polling already active for patient:', patientId);
      return;
    }

    console.log('[ConsentGate] Setting up consent polling for patient:', patientId);
    consentPollingAttemptsRef.current = 0;

    const MAX_ATTEMPTS = 40; // ✅ Regla 3: Límite de polling (40 * 3s = 2 min max)

    // Poll every 3 seconds if consent is pending
    consentPollingRef.current = setInterval(async () => {
      try {
        // ✅ WO-CONSENT-VERBAL-OPTIMISTIC-UI-01: Check FIRST - if consent already granted, stop polling immediately
        if (consentGrantedRef.current === true) {
          console.log('[ConsentGate] Consent already granted (optimistic), stopping polling');
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
            consentPollingAttemptsRef.current = 0;
          }
          return;
        }

        // ✅ Regla 3: Límite de intentos
        if (++consentPollingAttemptsRef.current >= MAX_ATTEMPTS) {
          console.warn('[ConsentGate] Consent polling timeout after', MAX_ATTEMPTS, 'attempts');
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
          }
          return;
        }

        const consentResult = await checkConsentViaServer(patientId);

        // ✅ Regla 2: Se cancela inmediatamente al tener consentimiento
        if (consentResult.hasValidConsent) {
          // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Mark as granted (irreversible)
          consentGrantedRef.current = true;
          console.log('[ConsentGate] ✅ Consent detected! Closing modal permanently...');
          setHasConsent(true);
          setSmsRequested(false);

          // Stop polling immediately
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
            consentPollingAttemptsRef.current = 0;
          }

          // ✅ CRITICAL: Only call onConsentVerified when consent is NEWLY detected via polling
          // This means consent was just granted (e.g., via SMS), so we should navigate
          if (onConsentVerified) {
            console.log('[ConsentGate] 📞 Calling onConsentVerified (consent newly detected via polling)');
            onConsentVerified();
          }
        }
      } catch (error: any) {
        console.warn('[ConsentGate] Error polling consent status:', error?.message || 'Unknown error');
      }
    }, 3000); // Poll every 3 seconds

    // ✅ Regla 3: Cleanup REAL
    return () => {
      console.log('[ConsentGate] Cleaning up consent polling for patient:', patientId);
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
      }
    };
  }, [patientId, user?.uid]); // ✅ Regla 4: Dependencias estables (sin onConsentVerified)

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
    console.log('[ConsentGate] Verbal consent completed (OPTIMISTIC)');

    // ✅ WO-CONSENT-VERBAL-OPTIMISTIC-UI-01: Optimistic UI Update
    // 1. Persistir en sessionStorage para sobrevivir re-mounts
    const consentKey = `consent_granted_${patientId}`;
    sessionStorage.setItem(consentKey, 'true');
    sessionStorage.setItem(`${consentKey}_timestamp`, Date.now().toString());
    console.log('[ConsentGate] Consent persisted to sessionStorage:', consentKey);

    // 2. Bloqueo inmediato de cualquier re-render y polling
    consentGrantedRef.current = true;

    // ✅ Detener polling inmediatamente (no esperar al siguiente ciclo)
    if (consentPollingRef.current) {
      clearInterval(consentPollingRef.current);
      consentPollingRef.current = null;
      consentPollingAttemptsRef.current = 0;
      console.log('[ConsentGate] Polling stopped immediately after optimistic consent');
    }

    // 3. Cerrar modal y gate de forma definitiva
    setProcessingVerbalConsent(false);
    setShowVerbalModal(false);
    setHasConsent(true);

    // 3. Notificar al workflow (desbloquea UI clínica)
    // ✅ Forzar navegación directamente para garantizar que ocurra
    console.log('[ConsentGate] ✅ Verbal consent granted - updating state and navigating', {
      patientId,
      hasConsent: true,
      consentGrantedRef: consentGrantedRef.current
    });
    
    // ✅ CTO DECISION: Parent handles navigation - we only notify
    if (onConsentVerified) {
      console.log('[ConsentGate] 📞 Calling onConsentVerified callback (parent will navigate)');
      onConsentVerified();
    }

    // 4. Verificación en background SOLO para logging / audit
    //    (NO puede volver a bloquear la UI)
    checkConsentViaServer(patientId)
      .then(result => {
        if (!result.hasValidConsent) {
          console.warn(
            '[ConsentGate] Background consent verification did not detect consent yet (expected eventual consistency)',
            result
          );
        } else {
          console.log('[ConsentGate] Background consent verification confirmed consent');
        }
      })
      .catch(err => {
        console.warn(
          '[ConsentGate] Background consent verification failed (non-blocking)',
          err
        );
      });
  };

  // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Guard absoluto - workflow is source of truth
  // 🔒 ABSOLUTE GUARD — workflow decides, gate only reflects
  console.log('[ConsentGate] 🎨 Render check', {
    consentStatus,
    hasValidConsent: consentStatus?.hasValidConsent,
    method: consentStatus?.consentMethod,
    status: consentStatus?.status,
    patientId,
    willRenderGate: consentStatus?.hasValidConsent !== true
  });
  
  if (consentStatus?.hasValidConsent === true) {
    console.log('[ConsentGate] 🔒 Consent already valid → gate disabled', {
      method: consentStatus.consentMethod,
      status: consentStatus.status,
      patientId
    });
    return null;
  }

  // ✅ Fallback guard (for backwards compatibility during transition)
  const consentKey = patientId ? `consent_granted_${patientId}` : null;
  const sessionConsentGranted = consentKey ? sessionStorage.getItem(consentKey) === 'true' : false;
  
  if (hasConsent || consentGrantedRef.current || sessionConsentGranted) {
    // Sync state if sessionStorage says yes but state doesn't
    if (sessionConsentGranted && !hasConsent) {
      setHasConsent(true);
      consentGrantedRef.current = true;
    }
    
    // Stop checking if still in progress
    if (checkingConsent) {
      setCheckingConsent(false);
    }
    
    // Ensure polling is stopped
    if (consentPollingRef.current) {
      clearInterval(consentPollingRef.current);
      consentPollingRef.current = null;
      consentPollingAttemptsRef.current = 0;
    }

    // ✅ CTO DECISION: Return null IMMEDIATELY - no gate, no modal, nothing
    return null;
  }

  // ✅ Show loading state while checking consent from Firestore
  // This only shows if consent doesn't exist
  if (checkingConsent) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Consent...</h2>
          <p className="text-gray-600">Checking patient consent status...</p>
        </div>
      </div>
    );
  }

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

            {/* Two options: Verbal or SMS */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Choose consent method:</p>

              {/* Option 1: Verbal Consent */}
              <button
                onClick={async () => {
                  // ✅ Check if consent already exists or is being processed
                  if (hasConsent || consentGrantedRef.current || processingVerbalConsent) {
                    console.log('[ConsentGate] Consent already exists or being processed, skipping verbal modal');
                    return;
                  }

                  // ✅ Check if consent already exists before showing modal
                  // This prevents unnecessary verbal consent when digital consent already exists
                  try {
                    const consentResult = await checkConsentViaServer(patientId);
                    if (consentResult.hasValidConsent) {
                      console.log('[ConsentGate] Consent already exists, skipping verbal modal');
                      // Consent already exists, close the gate immediately
                      consentGrantedRef.current = true;
                      setHasConsent(true);
                      // ✅ CRITICAL: Do NOT call onConsentVerified - consent already existed
                      return;
                    }
                  } catch (error) {
                    console.warn('[ConsentGate] Error checking consent before showing verbal modal:', error);
                    // Continue to show modal if check fails
                  }
                  setShowVerbalModal(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                Read & Record Verbal Consent
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Option 2: SMS Consent */}
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
            </div>

            {/* Waiting message */}
            {smsRequested && (
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
                    onClick={async () => {
                      // ✅ Check if consent already exists or is being processed
                      if (hasConsent || consentGrantedRef.current || processingVerbalConsent) {
                        console.log('[ConsentGate] Consent already exists or being processed, skipping verbal modal');
                        return;
                      }

                      // ✅ Check if consent already exists before showing modal
                      try {
                        const consentResult = await checkConsentViaServer(patientId);
                        if (consentResult.hasValidConsent) {
                          console.log('[ConsentGate] Consent already exists, skipping verbal modal');
                          consentGrantedRef.current = true;
                          setHasConsent(true);
                          // ✅ CRITICAL: Do NOT call onConsentVerified - consent already existed
                          return;
                        }
                      } catch (error) {
                        console.warn('[ConsentGate] Error checking consent before showing verbal modal:', error);
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
      {/* ✅ WO-CONSENT-VERBAL-OPTIMISTIC-UI-01: Quadruple guard - modal NEVER shows if consent granted */}
      {(() => {
        const consentKey = patientId ? `consent_granted_${patientId}` : null;
        const sessionConsentGranted = consentKey ? sessionStorage.getItem(consentKey) === 'true' : false;

        // Never show modal if consent was granted (any source)
        if (hasConsent || consentGrantedRef.current || sessionConsentGranted || processingVerbalConsent) {
          return null;
        }

        // Only show if explicitly requested and no consent exists
        if (!showVerbalModal) {
          return null;
        }

        return (
          <VerbalConsentModal
            patientId={patientId}
            patientName={patientName || 'Patient'}
            onClose={() => {
              console.log('[ConsentGate] Verbal modal closed');
              setShowVerbalModal(false);
            }}
            onConsentGranted={handleVerbalConsentComplete}
          />
        );
      })()}
    </>
  );
}

export default ConsentGateScreen;
export { ConsentGateScreen };
