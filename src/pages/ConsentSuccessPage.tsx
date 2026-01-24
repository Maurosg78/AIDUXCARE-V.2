/**
 * Consent Success Page - Terminal State
 * 
 * Static success page shown after consent is recorded.
 * Prevents user confusion and back navigation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function ConsentSuccessPage() {
  const [searchParams] = useSearchParams();
  const decision = searchParams.get('decision');
  const isDeclined = decision === 'declined';
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [attemptingClose, setAttemptingClose] = useState(true);

  // ✅ Prevent back navigation (history lock)
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  // ✅ Attempt to close automatically, show button if it fails
  useEffect(() => {
    // Try to close after 2 seconds
    const closeTimer = setTimeout(() => {
      try {
        // window.close() only works if window was opened by JavaScript
        // If it fails (user opened from SMS), show close button
        const wasClosed = window.close();
        
        // If close() didn't work, show button after 1 more second
        setTimeout(() => {
          if (!document.hidden) {
            setShowCloseButton(true);
            setAttemptingClose(false);
          }
        }, 1000);
      } catch (error) {
        // Close failed, show button
        setShowCloseButton(true);
        setAttemptingClose(false);
      }
    }, 2000);

    return () => clearTimeout(closeTimer);
  }, []);

  const handleManualClose = () => {
    // Try to close programmatically first
    try {
      window.close();
    } catch (error) {
      // If that fails, show instructions
      alert('Please close this tab or window manually.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {isDeclined ? (
          <>
            <XCircle className="w-20 h-20 text-orange-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Declined</h1>
            <p className="text-gray-600 mb-6">
              Your decision has been recorded. No AI-assisted documentation will be used for your care.
            </p>
            {attemptingClose && !showCloseButton && (
              <p className="text-sm text-gray-500">
                This window will close automatically...
              </p>
            )}
            {showCloseButton && (
              <button
                onClick={handleManualClose}
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <X className="w-5 h-5" />
                Close This Page
              </button>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Consent Recorded</h1>
            <p className="text-gray-600 mb-6">
              Thank you for providing your consent. Your response has been recorded successfully.
            </p>
            {attemptingClose && !showCloseButton && (
              <p className="text-sm text-gray-500">
                This window will close automatically...
              </p>
            )}
            {showCloseButton && (
              <button
                onClick={handleManualClose}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <X className="w-5 h-5" />
                Close This Page
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
