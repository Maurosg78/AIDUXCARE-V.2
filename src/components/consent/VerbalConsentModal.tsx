/**
 * Verbal Consent Modal - PHIPA/PIPEDA/ISO 27001 Compliant
 * 
 * Compliance Framework:
 * - PHIPA s.18: Knowledgeable consent requirements
 * - PIPEDA Principle 4.3: Knowledge and consent
 * - ISO 27001 A.18.1.4: Privacy and protection of PII
 * - ISO 27001 A.12.4.1: Event logging (audit trail)
 * 
 * Features:
 * - No mandatory recording (physiotherapist reads verbally)
 * - Explicit patient response documentation (granted/declined)
 * - Declined consent reasons tracking (compliance requirement)
 * - Complete audit trail with timestamps
 */

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Shield, FileText } from 'lucide-react';
import { getVerbalConsentText, getDefaultConsentTextVersion } from '../../services/verbalConsentService';
import { getCurrentJurisdiction } from '../../core/consent/consentJurisdiction';
import { PatientConsentService } from '../../services/patientConsentService';
import { useAuth } from '../../hooks/useAuth';

interface VerbalConsentModalProps {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onConsentGranted: () => void;
}

const DECLINE_REASONS = [
  { value: 'no_recording', label: 'Does not want to be recorded' },
  { value: 'no_ai', label: 'Does not trust AI technology' },
  { value: 'privacy_concerns', label: 'Has privacy concerns' },
  { value: 'traditional_method', label: 'Prefers traditional documentation' },
  { value: 'needs_time', label: 'Needs more time to decide' },
  { value: 'language_barrier', label: 'Language barrier - did not understand' },
  { value: 'other', label: 'Other reason' },
];

export function VerbalConsentModal({
  patientId,
  patientName,
  onClose,
  onConsentGranted,
}: VerbalConsentModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'read' | 'response'>('read');
  const [hasReadToPatient, setHasReadToPatient] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReasons, setDeclineReasons] = useState<string[]>([]);
  const [declineNotes, setDeclineNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get consent text
  const jurisdiction = getCurrentJurisdiction();
  const textVersion = getDefaultConsentTextVersion();
  const consentText = getVerbalConsentText(textVersion);

  const handleGrantConsent = async () => {
    if (!hasReadToPatient) {
      setError('You must confirm that you have read the consent to the patient.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Record verbal consent (granted)
      await PatientConsentService.recordVerbalConsent({
        patientId,
        professionalId: user?.uid || '',
        patientName,
        consentStatus: 'granted',
        consentTextVersion: textVersion,
        witnessStatement: 'Physiotherapist read consent verbally and patient provided oral authorization',
        patientUnderstanding: 'Patient confirmed understanding of consent terms',
      });

      console.log('[VerbalConsent] ✅ Consent granted and recorded:', patientId);

      // ✅ FIX: Call parent callback (may be async, so await it just in case)
      if (onConsentGranted) {
        await Promise.resolve(onConsentGranted());
      }

      // ✅ Close modal after successful registration
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      console.error('[VerbalConsent] Error recording granted consent:', err);
      setError('Failed to record consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeclineConsent = async () => {
    if (declineReasons.length === 0) {
      setError('Please select at least one reason for declining consent.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Record verbal consent (declined) - CRITICAL for compliance
      await PatientConsentService.recordVerbalConsent({
        patientId,
        professionalId: user?.uid || '',
        patientName,
        consentStatus: 'declined',
        consentTextVersion: textVersion,
        witnessStatement: 'Physiotherapist read consent verbally and patient declined authorization',
        declineReasons: declineReasons.join(', '),
        declineNotes: declineNotes || undefined,
      });

      console.log('[VerbalConsent] Consent declined and recorded:', { patientId, reasons: declineReasons });

      // Show confirmation and close
      alert(`Consent declined by ${patientName}. This session cannot proceed without consent. Documented reasons: ${declineReasons.join(', ')}`);
      onClose();
    } catch (err) {
      console.error('[VerbalConsent] Error recording declined consent:', err);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white sticky top-0 z-10 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Verbal Consent</h2>
                <p className="text-sm text-indigo-100 mt-1">Patient: {patientName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Read to Patient */}
          {step === 'read' && (
            <>
              {/* Instructions */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-indigo-900">
                    <p className="font-semibold mb-2">Instructions for Physiotherapist:</p>
                    <ol className="list-decimal list-inside space-y-1 text-indigo-800">
                      <li>Read the consent statement below to the patient <strong>verbally</strong></li>
                      <li>Ensure the patient understands what they are consenting to</li>
                      <li>Answer any questions the patient may have</li>
                      <li>Obtain the patient's oral authorization (Yes or No)</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Consent Text */}
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Consent Statement ({jurisdiction})
                </h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {consentText}
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasReadToPatient}
                  onChange={(e) => setHasReadToPatient(e.target.checked)}
                  className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-amber-900">
                  <strong className="font-semibold">I confirm that I have:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Read this consent statement to the patient verbally</li>
                    <li>Ensured the patient understands the consent terms</li>
                    <li>Answered all questions to the patient's satisfaction</li>
                  </ul>
                </span>
              </label>

              {/* Next Button */}
              <button
                onClick={() => setStep('response')}
                disabled={!hasReadToPatient}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Record Patient's Response
                <CheckCircle className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Step 2: Patient Response */}
          {step === 'response' && !showDeclineForm && (
            <>
              <div className="text-center py-6">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Record Patient's Decision
                </h3>
                <p className="text-gray-600">
                  After reading the consent, did the patient grant or decline authorization?
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Grant Consent Button */}
              <button
                onClick={handleGrantConsent}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-6 px-6 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
              >
                <CheckCircle className="w-6 h-6" />
                {submitting ? 'Recording...' : 'Patient GRANTS Consent'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Decline Consent Button */}
              <button
                onClick={() => setShowDeclineForm(true)}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-6 px-6 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl"
              >
                <XCircle className="w-6 h-6" />
                Patient DECLINES Consent
              </button>
            </>
          )}

          {/* Decline Form */}
          {showDeclineForm && (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-orange-900">
                    <p className="font-semibold mb-2">Consent Declined - Documentation Required</p>
                    <p className="text-orange-800">
                      PHIPA and PIPEDA require documentation of declined consent, including reasons.
                      This information is critical for compliance and patient care continuity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decline Reasons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Reason(s) for Declining Consent: <span className="text-red-600">*</span>
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
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Any additional context about why the patient declined consent..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineReasons([]);
                    setDeclineNotes('');
                    setError(null);
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDeclineConsent}
                  disabled={submitting || declineReasons.length === 0}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  {submitting ? 'Recording...' : 'Confirm Declined Consent'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerbalConsentModal;
