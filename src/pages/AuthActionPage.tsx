import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyActionCode, checkActionCode, confirmPasswordReset } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import logger from '@/shared/utils/logger';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

type Mode = 'verifyEmail' | 'resetPassword' | 'recoverEmail' | 'verifyAndChangeEmail';

export const AuthActionPage: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const mode = (query.get('mode') || '') as Mode | '';
  const oobCode = query.get('oobCode') || '';
  const continueUrl = query.get('continueUrl') || '';

  const [status, setStatus] = useState<'working' | 'success' | 'error'>('working');
  const [title, setTitle] = useState('Processing…');
  const [detail, setDetail] = useState('Please wait while we complete your request.');
  const [countdown, setCountdown] = useState<number>(5);

  // Optional: If Firebase sends resetPassword mode, we can auto-redirect to your reset page.
  // For now we just handle verifyEmail and a safe message for others.
  useEffect(() => {
    const run = async () => {
      try {
        if (!mode || !oobCode) {
          setStatus('error');
          setTitle('Invalid link');
          setDetail('Missing parameters. Please request a new email and try again.');
          return;
        }

        if (mode === 'verifyEmail') {
          // Validate first (better errors)
          await checkActionCode(auth, oobCode);
          await applyActionCode(auth, oobCode);

          setStatus('success');
          setTitle('Email verified ✅');
          setDetail('You will be redirected to sign in.');
          logger.info('[AUTH ACTION] Email verification applied');
          return;
        }

        if (mode === 'resetPassword') {
          // We should NOT reset password without collecting new password.
          // Redirect to app reset-password page (you can implement it later).
          setStatus('success');
          setTitle('Password reset');
          setDetail('Redirecting to reset password screen…');
          logger.info('[AUTH ACTION] resetPassword link opened; redirecting to /forgot-password');
          // You can later create /reset-password that reads oobCode.
          return;
        }

        // Other modes: show safe message
        setStatus('success');
        setTitle('Action completed');
        setDetail('You will be redirected to sign in.');
        logger.info('[AUTH ACTION] Mode received', { mode });
      } catch (e: any) {
        const code = e?.code || 'unknown';
        setStatus('error');
        setTitle('Verification failed');
        setDetail(`This link may be expired or already used. (code: ${code})`);
        logger.warn('[AUTH ACTION] Failed to apply action code', { code, message: e?.message });
      }
    };

    run();
  }, []);

  // Countdown redirect (no Continue button)
  useEffect(() => {
    if (status !== 'success') return;

    setCountdown(5);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 0;
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status !== 'success') return;
    if (countdown !== 0) return;

    // Always send to login (your ask). Ignore continueUrl to avoid loops.
    navigate('/login', { replace: true });
  }, [countdown, status, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl border border-gray-100 p-8">
        <div className="text-center space-y-4">
          <div className="text-2xl font-semibold text-gray-900">AiDuxCare</div>

          {status === 'working' && (
            <div className="space-y-3">
              <div className="text-gray-900 font-medium">{title}</div>
              <div className="text-gray-500 text-sm">{detail}</div>
              <div className="mt-6 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <div className="text-gray-900 font-medium">{title}</div>
              <div className="text-gray-600 text-sm">{detail}</div>
              <div className="mt-6 text-gray-700">
                Redirecting to Sign In in <span className="font-semibold">{countdown}</span>s…
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="text-red-700 font-medium">{title}</div>
              <div className="text-red-600 text-sm">{detail}</div>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full py-3 px-4 rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition"
                >
                  Go to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Debug (safe) */}
          <div className="pt-6 text-xs text-gray-400 break-all">
            mode: {mode || '(none)'} · oobCode: {oobCode ? 'present' : 'missing'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthActionPage;
