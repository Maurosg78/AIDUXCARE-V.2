/**
 * Consent Verification Page
 * 
 * Mandatory step between patient registration and workflow access.
 * Verifies patient informed consent via SMS digital or manual fallback.
 * 
 * Route: /consent-verification/:patientId
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Loader2, Info, ExternalLink } from 'lucide-react';
import { ConsentVerificationService, type ConsentVerificationState, type SMSConsentStatus } from '../services/consentVerificationService';
import { PatientService } from '../services/patientService';
import { useAuth } from '../hooks/useAuth';
import { useProfessionalProfile as useProfessionalProfileContext } from '../context/ProfessionalProfileContext';
import logger from '@/shared/utils/logger';
import { deriveClinicName, deriveClinicianDisplayName } from '@/utils/clinicProfile';

export const ConsentVerificationPage: React.FC = () => {
  const { patientId, token } = useParams<{ patientId?: string; token?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: professionalProfile } = useProfessionalProfileContext();

  const clinicName = useMemo(
    () => deriveClinicName(professionalProfile),
    [professionalProfile]
  );

  const clinicianDisplayName = useMemo(
    () => deriveClinicianDisplayName(professionalProfile, user),
    [professionalProfile, user]
  );

  const [verificationState, setVerificationState] = useState<ConsentVerificationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualCheckboxChecked, setManualCheckboxChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [smsPolling, setSmsPolling] = useState<NodeJS.Timeout | null>(null);

  // Initialize verification on mount
  useEffect(() => {
    const initialize = async () => {
      if (!patientId) {
        setError('Invalid patient ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if already verified
        const isVerified = await ConsentVerificationService.isConsentVerified(patientId);
        if (isVerified) {
          // Already verified, redirect to workflow
          navigate(`/workflow?patientId=${patientId}`);
          return;
        }

        // Get existing state or initialize new
        let state = await ConsentVerificationService.getVerificationState(patientId);

        if (!state) {
          // Get patient data from patient service
          let patientName = 'Patient';
          let patientPhone: string | undefined = undefined;

          try {
            const patient = await PatientService.getPatientById(patientId);
            if (patient) {
              patientName = patient.fullName || 'Patient';
              patientPhone = patient.phone || undefined;
            }
          } catch (err) {
            console.warn('[CONSENT VERIFICATION] Could not fetch patient data:', err);
            // Continue with defaults - will use Virtual Phone for testing
          }

          // Initialize new verification with real patient data
          state = await ConsentVerificationService.initializeVerification(
            patientId,
            patientName,
            patientPhone || '+18777804236', // Default to Virtual Phone if no phone
            clinicName,
            user?.uid || 'temp-user',
            clinicianDisplayName
          );
        }

        setVerificationState(state);

        // Start polling for SMS confirmation if SMS was sent
        if (state.smsStatus === 'sent') {
          startSMSPolling(patientId);
        }
      } catch (err: any) {
        console.error('[CONSENT VERIFICATION] Initialization error:', err);
        setError(err.message || 'Error initializing consent verification');
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Cleanup polling on unmount
    return () => {
      if (smsPolling) {
        clearInterval(smsPolling);
      }
    };
  }, [patientId]);

  // Poll for SMS confirmation
  const startSMSPolling = (pid: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await ConsentVerificationService.checkSMSStatus(pid);

        if (status === 'confirmed') {
          // SMS confirmed, redirect to workflow
          clearInterval(interval);
          setSmsPolling(null);
          navigate(`/workflow?patientId=${pid}`);
        } else if (status === 'timeout' || status === 'failed') {
          // SMS failed or timed out, stop polling
          clearInterval(interval);
          setSmsPolling(null);
          const updatedState = await ConsentVerificationService.getVerificationState(pid);
          if (updatedState) {
            setVerificationState(updatedState);
          }
        }
      } catch (err) {
        console.error('[CONSENT VERIFICATION] Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    setSmsPolling(interval);

    // Auto-stop after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      setSmsPolling(null);
    }, 2 * 60 * 1000);
  };

  const handleManualConsent = async () => {
    if (!manualCheckboxChecked || !patientId) {
      setError('You must confirm that you have read the patient rights and obtained authorization.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await ConsentVerificationService.recordManualConsent(patientId);

      if (result.verified) {
        logger.info('[CONSENT VERIFICATION] Manual consent recorded:', {
          patientId,
          method: result.method,
          timestamp: result.timestamp,
        });

        // Redirect to workflow
        navigate(`/workflow?patientId=${patientId}`);
      }
    } catch (err: any) {
      console.error('[CONSENT VERIFICATION] Manual consent error:', err);
      setError(err.message || 'Error recording manual consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSMSStatusMessage = (status: SMSConsentStatus): string => {
    switch (status) {
      case 'sending':
        return 'Sending SMS...';
      case 'sent':
        return `SMS sent to ${verificationState?.patientPhone || 'patient'} - Waiting for confirmation...`;
      case 'confirmed':
        return 'SMS consent confirmed!';
      case 'failed':
        return 'SMS sending failed. Please use manual verification below.';
      case 'timeout':
        return 'SMS confirmation timeout (2 minutes). Please use manual verification below.';
      default:
        return 'Unknown status';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing consent verification...</p>
        </div>
      </div>
    );
  }

  if (error && !verificationState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-semibold text-gray-900">Error</h1>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!verificationState) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Patient Consent Verification
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Patient: <strong>{verificationState.patientName}</strong>
          </p>
        </div>

        {/* SMS Status (Path A) */}
        {verificationState.patientPhone && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Digital Consent via SMS
            </h2>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${verificationState.smsStatus === 'confirmed' ? 'bg-green-50 border border-green-200' :
                  verificationState.smsStatus === 'sent' ? 'bg-blue-50 border border-blue-200' :
                    verificationState.smsStatus === 'failed' || verificationState.smsStatus === 'timeout' ? 'bg-red-50 border border-red-200' :
                      'bg-yellow-50 border border-yellow-200'
                }`}>
                <div className="flex items-start gap-3">
                  {verificationState.smsStatus === 'confirmed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : verificationState.smsStatus === 'sent' ? (
                    <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${verificationState.smsStatus === 'confirmed' ? 'text-green-800' :
                        verificationState.smsStatus === 'sent' ? 'text-blue-800' :
                          'text-red-800'
                      }`}>
                      {getSMSStatusMessage(verificationState.smsStatus)}
                    </p>
                    {verificationState.smsStatus === 'sent' && (
                      <p className="text-xs text-blue-600 mt-2">
                        Maximum wait time: 2 minutes. If no confirmation is received, please use manual verification below.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Fallback (Path B) */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Manual Consent Verification
          </h2>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>Professional Responsibility:</strong> The responsibility for this confirmation is 100% that of the healthcare professional.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualCheckboxChecked}
                  onChange={(e) => setManualCheckboxChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  required
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    <strong>I CONFIRM</strong> that I have read to the patient their rights and responsibilities under PHIPA and the patient has authorized the processing of their personal health information.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    <a
                      href="/phipa-patient-rights"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-1"
                    >
                      View Patient Rights and Responsibilities under PHIPA
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleManualConsent}
              disabled={!manualCheckboxChecked || submitting}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify Consent and Proceed to Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8">
          <p>This verification step is required by PHIPA s. 18 before accessing patient workflow.</p>
          <p className="mt-2">
            All consent verification actions are logged for audit purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsentVerificationPage;

