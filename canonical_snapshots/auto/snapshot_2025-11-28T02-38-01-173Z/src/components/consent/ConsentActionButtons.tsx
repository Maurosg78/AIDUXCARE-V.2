/**
 * Consent Action Buttons Component
 * Fixed footer with three consent options
 * Always visible, no need to scroll to bottom
 */

import React, { useState } from 'react';

export type ConsentScope = 'ongoing' | 'session-only' | 'declined';

interface ConsentActionButtonsProps {
  onConsent: (scope: ConsentScope, signature?: string) => void;
  submitting: boolean;
  selectedScope: ConsentScope;
  onScopeChange: (scope: ConsentScope) => void;
}

export const ConsentActionButtons: React.FC<ConsentActionButtonsProps> = ({
  onConsent,
  submitting,
  selectedScope,
  onScopeChange
}) => {
  const [signature, setSignature] = useState('');
  const [showSignatureField, setShowSignatureField] = useState(false);

  const handleScopeChange = (scope: ConsentScope) => {
    onScopeChange(scope);
    if (scope === 'ongoing') {
      setShowSignatureField(true);
    } else {
      setShowSignatureField(false);
      setSignature('');
    }
  };

  const handleSubmit = () => {
    if (selectedScope === 'ongoing' && !signature.trim()) {
      return;
    }
    onConsent(selectedScope, selectedScope === 'ongoing' ? signature.trim() : undefined);
  };

  // ✅ SPRINT 2 P3: Fix validation - canSubmit must check signature for ongoing consent
  const canSubmit = React.useMemo(() => {
    if (selectedScope === 'declined') {
      return true; // Decline can always be submitted
    }
    if (selectedScope === 'ongoing') {
      // Ongoing consent requires signature
      return signature.trim().length > 0;
    }
    // Session-only doesn't require signature
    return true;
  }, [selectedScope, signature]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-lg z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Consent Options */}
        <div className="mb-4 space-y-3">
          <label className="flex items-start gap-3 p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="consentScope"
              value="ongoing"
              checked={selectedScope === 'ongoing'}
              onChange={() => handleScopeChange('ongoing')}
              className="mt-1 w-4 h-4 border-gray-300 text-primary-blue focus:ring-primary-blue"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-900">
                Ongoing Consent
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Apply to this session and all future sessions. Requires digital signature.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="consentScope"
              value="session-only"
              checked={selectedScope === 'session-only'}
              onChange={() => handleScopeChange('session-only')}
              className="mt-1 w-4 h-4 border-gray-300 text-primary-blue focus:ring-primary-blue"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-900">
                This Session Only
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Apply consent only to this current session. No signature required.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="consentScope"
              value="declined"
              checked={selectedScope === 'declined'}
              onChange={() => handleScopeChange('declined')}
              className="mt-1 w-4 h-4 border-gray-300 text-primary-blue focus:ring-primary-blue"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-900">
                Decline Artificial Intelligence Processing
              </div>
              <div className="text-xs text-gray-600 mt-1">
                You will not be able to use AiduxCare. Your physiotherapist will use traditional EMR.
              </div>
            </div>
          </label>
        </div>

        {/* Digital Signature Field (for ongoing consent) */}
        {showSignatureField && selectedScope === 'ongoing' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-900 mb-2">
              Digital Signature (Type your full name):
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-blue"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {selectedScope === 'declined' ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-6 py-3 border border-gray-300 bg-white text-gray-900 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Confirm Decline'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex-1 px-6 py-3 border border-gray-300 bg-white text-gray-900 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Consent'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

