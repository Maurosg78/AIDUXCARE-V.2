import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getAuth, applyActionCode } from 'firebase/auth';

export const EmailVerifiedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Get email and action code from URL params
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    // Si hay un código de acción de Firebase, verificar automáticamente
    if (mode === 'verifyEmail' && oobCode) {
      handleEmailVerification(oobCode);
    } else {
      // Si no hay token/código, mostrar un mensaje estático
      setIsVerifying(false);
      setVerificationError('INVALID_LINK');
    }
  }, [mode, oobCode]);

  const handleEmailVerification = async (code: string) => {
    try {
      const auth = getAuth();
      await applyActionCode(auth, code);
      setIsVerifying(false);
    } catch (error: any) {
      console.error('Error verificando email:', error);
      // Firebase error codes for expired/already used links
      const errorCode = error?.code || '';
      const errorMessage = error?.message || 'Error verifying email';

      // Check if it's an expired or already used link
      const isExpired = errorCode.includes('expired') || errorMessage.toLowerCase().includes('expired');
      const isAlreadyUsed = errorCode.includes('invalid') || errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('used');

      if (isExpired || isAlreadyUsed) {
        setVerificationError('EXPIRED_OR_USED');
      } else {
        setVerificationError(errorMessage);
      }
      setIsVerifying(false);
    }
  };

  // Mostrar estado de carga mientras se verifica
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verifying Email...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si hubo problema
  if (verificationError) {
    const isExpiredOrUsed = verificationError === 'EXPIRED_OR_USED' ||
      verificationError.toLowerCase().includes('expired') ||
      verificationError.toLowerCase().includes('already') ||
      verificationError.toLowerCase().includes('used');
    const isInvalidLink = verificationError === 'INVALID_LINK';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <CheckCircleIcon className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email verification
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpiredOrUsed || isInvalidLink
              ? 'Your email is already verified. You can close this tab and return to the pilot.'
              : 'There was a problem verifying your email. You can close this tab and try again from the pilot.'}
          </p>
          <p className="text-sm text-gray-500">
            Your email is already verified. You can close this tab and return to the pilot.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Email Verified
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 mb-6">
          Your email has been verified successfully.
        </p>

        {/* Instruction */}
        <p className="text-gray-500 mb-8">
          Your email is already verified. You can close this tab and return to the pilot.
        </p>
      </div>
    </div>
  );
};
