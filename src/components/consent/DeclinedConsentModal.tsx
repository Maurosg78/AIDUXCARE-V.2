/**
 * ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Declined Consent Modal
 * 
 * Hard block modal shown when patient has declined consent.
 * AiDux cannot be used with this patient - redirect to Command Center.
 * 
 * Compliance:
 * - PHIPA: Respects patient's decision to decline
 * - PIPEDA: No coercion, clear explanation
 * - Product: AiDux is AI-only, no fallback workflow
 */

import React from 'react';
import { XCircle, AlertTriangle, Home, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DeclinedConsentModalProps {
  patientName?: string;
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Accept both string (from Firestore) and array formats
  declineReasons?: string[] | string;
  onClose?: () => void;
  // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Allow recording new consent if patient changes mind
  onRecordNewConsent?: () => void;
  patientId?: string;
}

export function DeclinedConsentModal({
  patientName,
  declineReasons,
  onClose,
  onRecordNewConsent,
  patientId
}: DeclinedConsentModalProps) {
  const navigate = useNavigate();

  const handleReturnToCommandCenter = () => {
    console.log('[DeclinedConsent] Redirecting to command-center');
    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Hard redirect to Command Center
    navigate('/command-center');
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-red-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Consent Declined</h2>
                <p className="text-sm text-red-100 mt-1">
                  {patientName || 'The patient'} has declined to authorize the use of AI tools
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-red-900">
                  AiDux cannot be used with this patient.
                </p>
                <p className="text-sm text-red-700">
                  Please continue care and documentation in your usual EMR.
                </p>
                {/* ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Clarify that the block is only for this patient */}
                <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                  <strong>Note:</strong> This block applies only to {patientName || 'this patient'}. 
                  You may use AiDux with other patients normally.
                </p>
                {/* ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Required legal copy (English for Canadian compliance) */}
                <p className="text-xs text-red-600 italic mt-2 pt-2 border-t border-red-200">
                  AiDux is an AI-based support tool. If the patient does not authorize its use, 
                  care must continue outside this platform.
                </p>
              </div>
            </div>
          </div>

          {/* Decline reasons (if available) */}
          {declineReasons && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Recorded reasons:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {/* ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Handle both array and string formats */}
                {(() => {
                  // Normalize to array: if string, split by comma; if array, use as-is
                  const reasonsArray = Array.isArray(declineReasons) 
                    ? declineReasons 
                    : typeof declineReasons === 'string' 
                      ? declineReasons.split(',').map(r => r.trim()).filter(Boolean)
                      : [];
                  
                  return reasonsArray.length > 0 ? (
                    reasonsArray.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span>{reason}</span>
                      </li>
                    ))
                  ) : null;
                })()}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* ✅ WO-CONSENT-DECLINED-REVERSAL-01: Allow recording new consent if patient changes mind */}
            {onRecordNewConsent && (
              <button
                onClick={() => {
                  console.log('[DeclinedConsent] Recording new consent - patient changed mind');
                  if (onRecordNewConsent) {
                    onRecordNewConsent();
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Patient changed their mind - Record new consent
              </button>
            )}
            
            <button
              onClick={handleReturnToCommandCenter}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return to Command Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
