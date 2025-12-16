/**
 * ✅ VerifyEmailPage (en-CA)
 * Market: CA | Language: en-CA | Compliance: PHIPA / PIPEDA / SOC2
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth, sendEmailVerification } from 'firebase/auth';
import logger from '@/shared/utils/logger';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      sendVerificationEmail();
    }
  }, []);

  const sendVerificationEmail = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSent(true);
        logger.info('Verification email sent to:', email);
      }
    } catch (err: any) {
      logger.error('Email verification error:', err);
      setError('Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E10098] via-pink-500 to-[#0072FF] font-sans px-4">
      <div className="max-w-md w-full bg-white/80 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-4">Verify Your Email</h1>
        {error && <p className="text-red-600 text-sm text-center mb-4">{error}</p>}
        {!sent ? (
          <>
            <p className="text-sm text-slate-600 text-center mb-6">
              A verification email will be sent to <strong>{email}</strong>.
            </p>
            <button
              onClick={sendVerificationEmail}
              disabled={loading}
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#E10098] to-[#0072FF] hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending…' : 'Send Verification Email'}
            </button>
          </>
        ) : (
          <>
            <div className="text-center text-green-600 text-lg font-medium mb-4">✓ Email sent!</div>
            <p className="text-sm text-slate-600 text-center mb-6">
              Please check your inbox and click the verification link.
            </p>
            <button
              onClick={() => navigate('/professional-workflow')}
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-gradient-to-r from-[#0072FF] to-[#E10098] hover:opacity-90 transition-all"
            >
              Continue to AiDuxCare
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
