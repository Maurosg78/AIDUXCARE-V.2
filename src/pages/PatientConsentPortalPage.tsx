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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Shield, FileText, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getVerbalConsentText, getDefaultConsentTextVersion } from '../services/verbalConsentService';
import { getCurrentJurisdiction } from '../core/consent/consentJurisdiction';

interface ConsentToken {
  patientId: string;
  patientName: string;
  professionalId: string;
  clinicName?: string;
  expiresAt: Date;
  used: boolean;
}

const DECLINE_REASONS = [
  { value: 'no_recording', label: 'I do not want to be recorded' },
  { value: 'no_ai', label: 'I do not trust AI technology' },
  { value: 'privacy_concerns', label: 'I have privacy concerns' },
  { value: 'traditional_method', label: 'I prefer traditional documentation' },
  { value: 'needs_time', label: 'I need more time to decide' },
  { value: 'not_understand', label: 'I do not understand what I am consenting to' },
  { value: 'other', label: 'Other reason' },
];

export default function PatientConsentPortalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

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

  // Get consent text
  const jurisdiction = getCurrentJurisdiction();
  const textVersion = getDefaultConsentTextVersion(jurisdiction);
  const consentText = getVerbalConsentText(textVersion);

  useEffect(() => {
    if (!token) {
      setError('Invalid consent link');
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
        setError('Consent link not found or expired');
        setLoading(false);
        return;
      }

      const data = tokenSnap.data();
      
      // Check if already used
      if (data.used) {
        setError('This consent link has already been used');
        setLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = data.expiresAt?.toDate();
      if (expiresAt && expiresAt < new Date()) {
        setError('This consent link has expired');
        setLoading(false);
        return;
      }

      setTokenData({
        patientId: data.patientId,
        patientName: data.patientName,
        professionalId: data.professionalId,
        clinicName: data.clinicName,
        expiresAt: expiresAt || new Date(),
        used: data.used || false,
      });
      setLoading(false);
    } catch (err) {
      console.error('[ConsentPortal] Error loading token:', err);
      setError('Failed to load consent information');
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
        
        // User-friendly error messages
        if (errorCode === 'TOKEN_EXPIRED') {
          setError('This consent link has expired. Please request a new one from your clinic.');
        } else if (errorCode === 'INVALID_TOKEN') {
          setError('Invalid consent link. Please request a new one from your clinic.');
        } else if (errorCode === 'CONSENT_ALREADY_RECORDED') {
          setError('This consent has already been recorded. The link can only be used once.');
        } else {
          setError('Failed to record consent. Please try again.');
        }
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('[ConsentPortal] Consent accepted via Cloud Function:', tokenData.patientId);
        setConsentDecision('accept');
        setSubmitted(true);

        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        setError('Failed to record consent. Please try again.');
      }
    } catch (err) {
      // ✅ T6: Logging mejorado para DX (sin cambiar mensaje al paciente)
      console.error('[ConsentPortal] accept failed', {
        message: err?.message,
        url: functionsUrl
      });
      setError('Failed to record consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineConsent = async () => {
    if (!tokenData || !token) return;

    if (declineReasons.length === 0) {
      setError('Please select at least one reason for declining consent');
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
        
        // User-friendly error messages
        if (errorCode === 'TOKEN_EXPIRED') {
          setError('This consent link has expired. Please request a new one from your clinic.');
        } else if (errorCode === 'INVALID_TOKEN') {
          setError('Invalid consent link. Please request a new one from your clinic.');
        } else if (errorCode === 'CONSENT_ALREADY_RECORDED') {
          setError('This consent has already been recorded. The link can only be used once.');
        } else {
          setError('Failed to record declined consent. Please try again.');
        }
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('[ConsentPortal] Consent declined via Cloud Function:', { 
          patientId: tokenData.patientId, 
          reasons: declineReasons 
        });

        setConsentDecision('decline');
        setSubmitted(true);

        // Auto-close after 5 seconds
        setTimeout(() => {
          window.close();
        }, 5000);
      } else {
        setError('Failed to record declined consent. Please try again.');
      }
    } catch (err) {
      // ✅ T6: Logging mejorado para DX (sin cambiar mensaje al paciente)
      console.error('[ConsentPortal] decline failed', {
        message: err?.message,
        url: functionsUrl
      });
      setError('Failed to record declined consent. Please try again.');
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading consent information...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Consent</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact your healthcare provider.
          </p>
        </div>
      </div>
    );
  }

  // Success state (after submission)
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {consentDecision === 'accept' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Recorded</h1>
              <p className="text-gray-600 mb-6">
                Thank you for providing your consent. Your response has been recorded.
              </p>
              <p className="text-sm text-gray-500">
                This window will close automatically in a few seconds...
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Declined</h1>
              <p className="text-gray-600 mb-6">
                Your decision has been recorded. No AI-assisted documentation will be used for your care.
              </p>
              <p className="text-sm text-gray-500">
                This window will close automatically in a few seconds...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main consent form
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Consent for AI-Assisted Clinical Documentation</h1>
          </div>
          <p className="text-indigo-100">
            Patient: <span className="font-semibold">{tokenData?.patientName}</span>
          </p>
          {tokenData?.clinicName && (
            <p className="text-indigo-100 text-sm mt-1">
              Clinic: {tokenData.clinicName}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Please read the consent statement below carefully:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>This explains how your health information will be used</li>
                  <li>You can accept or decline this consent</li>
                  <li>Your decision will be recorded for compliance purposes</li>
                  <li>You can withdraw consent at any time by contacting your provider</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Consent Statement ({jurisdiction})
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
                    <p className="font-medium mb-2">You are declining consent</p>
                    <p className="text-orange-800">
                      Please help us understand why by selecting at least one reason below.
                      This information helps us improve our services.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decline Reasons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Reason(s) for declining: <span className="text-red-600">*</span>
                </label>
                {DECLINE_REASONS.map((reason) => (
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
                  Additional comments (optional)
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Any additional information you'd like to share..."
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
                  Back
                </button>
                <button
                  onClick={handleDeclineConsent}
                  disabled={submitting || declineReasons.length === 0}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Confirm: I Decline
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-6 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <Clock className="w-6 h-6 animate-spin" />
                    Recording your consent...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    I Accept and Provide Consent
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-800 font-semibold py-6 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-lg border-2 border-gray-300"
              >
                <XCircle className="w-6 h-6" />
                I Decline Consent
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200">
            <p>This consent is governed by Ontario's Personal Health Information Protection Act (PHIPA)</p>
            <p className="mt-1">You can withdraw consent at any time by contacting your healthcare provider</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Named export for router compatibility
export { PatientConsentPortalPage };
