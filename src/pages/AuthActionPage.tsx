import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * AuthActionPage
 * 
 * Handles Firebase action codes (email verification, password reset, etc.)
 * This page is used as the landing page for Firebase action links.
 */
const AuthActionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');
  const apiKey = searchParams.get('apiKey');

  useEffect(() => {
    if (!mode || !oobCode) {
      // User may have been redirected here after verification on Firebase's page (no params).
      // Show success-like message so they can close or go to login.
      setStatus('success');
      setActionMode('verifyEmail');
      return;
    }

    setActionMode(mode);
    handleActionCode(mode, oobCode);
  }, [mode, oobCode]);

  const handleActionCode = async (actionMode: string, code: string) => {
    try {
      const auth = getAuth();

      switch (actionMode) {
        case 'verifyEmail':
          await applyActionCode(auth, code);
          setStatus('success');
          // No auto-redirect: show "close this window" + "Continue to sign in" so user chooses
          break;

        case 'resetPassword':
          // Verify the code is valid (this doesn't reset the password yet)
          await verifyPasswordResetCode(auth, code);
          setStatus('success');
          // Redirect to reset complete page with the code
          navigate(`/reset-complete?oobCode=${code}&mode=resetPassword`, {
            replace: true
          });
          break;

        case 'recoverEmail':
          // Handle email recovery
          await applyActionCode(auth, code);
          setStatus('success');
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Email recovered successfully.',
                type: 'success'
              }
            });
          }, 2000);
          break;

        default:
          setStatus('error');
          setErrorMessage(`Unsupported action mode: ${actionMode}`);
      }
    } catch (error: any) {
      console.error('Error processing action code:', error);
      const errorCode = error?.code || '';
      const errorMsg = error?.message || 'Error processing the action.';

      // Check for common Firebase errors
      if (errorCode.includes('expired') || errorMsg.toLowerCase().includes('expired')) {
        setErrorMessage('EXPIRED');
      } else if (errorCode.includes('invalid') || errorMsg.toLowerCase().includes('invalid')) {
        setErrorMessage('INVALID');
      } else {
        setErrorMessage(errorMsg);
      }
      setStatus('error');
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Processing...
          </h1>
          <p className="text-gray-600">
            Please wait while we process your request.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    const isExpired = errorMessage === 'EXPIRED';
    const isInvalid = errorMessage === 'INVALID';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {isExpired ? 'Link expired' : isInvalid ? 'Invalid link' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpired
              ? 'This link has expired. Please request a new one.'
              : isInvalid
                ? 'This link is invalid or has already been used. Please request a new one.'
                : errorMessage || 'There was a problem processing your request. Please try again.'}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Success state: for verifyEmail, no button — just message so user closes tab and returns to existing login (avoids duplicate sessions)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {actionMode === 'verifyEmail' ? 'Email verified' : 'Action complete'}
        </h1>
        <p className="text-gray-600 mb-4">
          {actionMode === 'verifyEmail'
            ? 'Your email has been verified successfully.'
            : actionMode === 'resetPassword'
              ? 'Redirecting to password reset...'
              : 'Your request has been processed successfully.'}
        </p>
        {actionMode === 'verifyEmail' && (
          <p className="text-sm text-gray-500">
            You can close this window and return to your login.
          </p>
        )}
        {actionMode !== 'verifyEmail' && (
          <p className="text-sm text-gray-400">Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default AuthActionPage;

