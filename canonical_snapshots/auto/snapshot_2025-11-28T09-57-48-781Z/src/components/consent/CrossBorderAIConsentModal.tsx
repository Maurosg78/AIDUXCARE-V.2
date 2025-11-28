/**
 * Cross-Border AI Consent Modal
 * 
 * Modal for obtaining explicit consent for cross-border AI processing
 * Required for PHIPA s. 18 compliance (cross-border processing with express consent)
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

import React, { useState } from 'react';
import { X, AlertTriangle, Shield, Info } from 'lucide-react';
import { CrossBorderAIConsentService } from '../../services/crossBorderAIConsentService';
import type { CrossBorderAIConsent } from '../../services/crossBorderAIConsentService';

export interface CrossBorderAIConsentModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** User ID for consent tracking */
  userId: string;
  /** Patient ID for patient-specific consent (first session) */
  patientId?: string;
  /** Callback when consent is accepted */
  onConsent: (consent: CrossBorderAIConsent) => void;
  /** Callback when user declines consent */
  onReject: () => void;
  /** Callback to close modal (optional - can use onReject) */
  onClose?: () => void;
}

export const CrossBorderAIConsentModal: React.FC<CrossBorderAIConsentModalProps> = ({
  open,
  userId,
  patientId,
  onConsent,
  onReject,
  onClose,
}) => {
  const [cloudActAcknowledged, setCloudActAcknowledged] = useState(false);
  const [dataRetentionAcknowledged, setDataRetentionAcknowledged] = useState(false);
  const [rightToWithdrawAcknowledged, setRightToWithdrawAcknowledged] = useState(false);
  const [complaintRightsAcknowledged, setComplaintRightsAcknowledged] = useState(false);
  const [consentScope, setConsentScope] = useState<'ongoing' | 'session-only'>('ongoing'); // Default to ongoing
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleAccept = async () => {
    if (!canSubmit()) return;

    try {
      setSubmitting(true);

      const consent: Omit<CrossBorderAIConsent, 'consentDate' | 'consentVersion'> = {
        userId,
        patientId, // Include patientId if provided (first session)
        consented: true,
        consentScope, // Include consent scope (ongoing or session-only)
        cloudActAcknowledged,
        dataRetentionAcknowledged,
        rightToWithdrawAcknowledged,
        complaintRightsAcknowledged,
      };

      CrossBorderAIConsentService.saveConsent(consent);
      
      // Read back the saved consent to get the full object
      const savedConsentData = localStorage.getItem('aiduxcare_crossborder_ai_consent');
      const savedConsent: CrossBorderAIConsent = savedConsentData 
        ? JSON.parse(savedConsentData) as CrossBorderAIConsent
        : {
            ...consent,
            consentDate: new Date(),
            consentVersion: CrossBorderAIConsentService.getConsentVersion(),
          };

      onConsent(savedConsent);
      
      // Reset form
      resetForm();
    } catch (error) {
      console.error('❌ [CROSS-BORDER CONSENT] Error saving consent:', error);
      // Keep modal open on error (user can retry)
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = () => {
    resetForm();
    onReject();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      handleReject();
    }
  };

  const resetForm = () => {
    setCloudActAcknowledged(false);
    setDataRetentionAcknowledged(false);
    setRightToWithdrawAcknowledged(false);
    setComplaintRightsAcknowledged(false);
    setConsentScope('ongoing'); // Reset to default
  };

  const canSubmit = (): boolean => {
    return (
      cloudActAcknowledged &&
      dataRetentionAcknowledged &&
      rightToWithdrawAcknowledged &&
      complaintRightsAcknowledged &&
      !submitting
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cross-border-ai-consent-title"
      className="fixed inset-0 z-50 grid place-items-center bg-gray-900/50 backdrop-blur-sm"
      onClick={(e) => {
        // Close on backdrop click (but not on modal content)
        if (e.target === e.currentTarget) {
          // Prevent closing on backdrop click (user must explicitly accept or decline)
          // handleClose();
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 id="cross-border-ai-consent-title" className="text-xl font-semibold">
              Cross-Border AI Processing Consent
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Critical Warning - All Processing in US */}
          <div className="bg-red-50 border-2 border-red-300 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-2 text-lg">⚠️ IMPORTANT: All AI Processing Occurs in the United States</h3>
                <p className="text-sm text-red-800 leading-relaxed mb-2">
                  <strong>AiduxCare uses advanced AI methods developed specifically for clinical documentation.</strong>
                </p>
                <p className="text-sm text-red-800 leading-relaxed mb-2">
                  <strong>ALL AI processing occurs in the United States (us-central1 region).</strong>
                </p>
                <p className="text-sm text-red-800 leading-relaxed">
                  <strong>There is NO local AI processing in Canada.</strong> All clinical data sent for AI analysis will cross the border to US-based servers.
                </p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <div className="space-y-3">
            <p className="text-gray-700 leading-relaxed">
              Before using AI-powered features, we need your explicit consent for cross-border data processing as required by{' '}
              <strong>PHIPA s. 18</strong> (Personal Health Information Protection Act, 2004 - Ontario).
            </p>
            <p className="text-gray-700 leading-relaxed">
              This consent applies to this session and, if you choose, all future sessions with this patient.
            </p>
          </div>

          {/* AI Processing Disclosure */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">AI Processing Disclosure</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Session recordings and clinical notes will be processed using AiduxCare's specialized AI methods 
                  for documentation generation. This processing occurs to assist with creating SOAP notes and clinical assessments.
                </p>
              </div>
            </div>
          </div>

          {/* CLOUD Act Risk Disclosure */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">US CLOUD Act Risk Disclosure</h3>
                <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                  Because ALL AI processing occurs in the United States, your health information will be processed by US-based AI services 
                  subject to US laws, including the US CLOUD Act. Under the CLOUD Act, US authorities may access your 
                  health data without notice. <strong>No Canadian data sovereignty applies to AI processing.</strong>
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloudActAcknowledged}
                    onChange={(e) => setCloudActAcknowledged(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    required
                  />
                  <span className="text-sm text-yellow-900">
                    I acknowledge the CLOUD Act risk and understand that US authorities may access my health data
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Data Retention Disclosure */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Data Retention</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Audio recordings and AI-generated notes will be retained for <strong>10+ years</strong> per College of 
              Physiotherapists of Ontario (CPO) requirements for clinical records.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dataRetentionAcknowledged}
                onChange={(e) => setDataRetentionAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                required
              />
              <span className="text-sm text-gray-900">
                I understand that my health information will be retained for 10+ years per CPO requirements
              </span>
            </label>
          </div>

          {/* Right to Withdraw */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Right to Withdraw Consent</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              You may withdraw consent for AI processing at any time. Alternative documentation methods are available 
              (manual entry) without AI assistance.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rightToWithdrawAcknowledged}
                onChange={(e) => setRightToWithdrawAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                required
              />
              <span className="text-sm text-gray-900">
                I understand I can withdraw consent for AI processing at any time
              </span>
            </label>
          </div>

          {/* Complaint Rights */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Complaint Rights</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              You have the right to complain to the Information and Privacy Commissioner of Ontario (IPC) regarding 
              data processing if you believe your privacy rights have been violated.
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={complaintRightsAcknowledged}
                onChange={(e) => setComplaintRightsAcknowledged(e.target.checked)}
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                required
              />
              <span className="text-sm text-gray-900">
                I understand my right to complain to the IPC Ontario regarding data processing
              </span>
            </label>
          </div>

          {/* Consent Scope Selection (for first session) */}
          {patientId && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
              <h3 className="font-semibold text-indigo-900 mb-3">Consent Scope</h3>
              <p className="text-sm text-indigo-800 leading-relaxed mb-3">
                Choose how long this consent applies:
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consentScope"
                    value="ongoing"
                    checked={consentScope === 'ongoing'}
                    onChange={(e) => setConsentScope('ongoing')}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-indigo-900">
                    <strong>Ongoing consent</strong> - Apply to this session and all future sessions with this patient. 
                    You can withdraw consent at any time in settings.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="consentScope"
                    value="session-only"
                    checked={consentScope === 'session-only'}
                    onChange={(e) => setConsentScope('session-only')}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-indigo-900">
                    <strong>This session only</strong> - Apply consent only to this current session. 
                    You will be asked again for future sessions.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Alternative Option */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800 leading-relaxed">
              <strong>Alternative:</strong> If you decline AI processing, you can still use AiduxCare with manual 
              documentation entry. AI features will be disabled, but all other functionality remains available.
            </p>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="border-t bg-gray-50 p-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            Decline & Use Manual Entry
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-6 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!canSubmit()}
            aria-disabled={!canSubmit()}
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Accept & Continue with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

