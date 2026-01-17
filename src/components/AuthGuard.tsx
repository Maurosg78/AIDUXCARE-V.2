import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useProfessionalProfile } from '../context/ProfessionalProfileContext';
import { isProfileComplete } from '../utils/professionalProfileValidation';

import logger from '@/shared/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireEmailVerification = true
}) => {
  const { user, loading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    errorType: profileErrorType,
    retryProfileLoad
  } = useProfessionalProfile();

  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const location = useLocation();

  const hasRedirectedRef = useRef(false);
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    if (user && requireEmailVerification && emailVerified === null) {
      setCheckingEmail(true);
      try {
        if (!user.email) setEmailVerified(false);
        else setEmailVerified(user.emailVerified || false);
      } catch (error) {
        logger.error('Error checking email verification:', error);
        setEmailVerified(false);
      } finally {
        setCheckingEmail(false);
      }
    } else if (!requireEmailVerification && emailVerified === null) {
      setEmailVerified(true);
    }
  }, [user?.uid, user?.email, user?.emailVerified, requireEmailVerification]);

  if (user && !loading && !profileLoading && profileError) {
    const isBlockedByClient =
      profileErrorType === 'blocked' ||
      profileError.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
      profileError.message?.includes('blocked');

    const isPermissionError =
      profileErrorType === 'permission' ||
      profileError.message?.includes('permission') ||
      profileError.message?.includes('PERMISSION_DENIED') ||
      (profileError as any).code === 'permission-denied';

    const isNetworkError =
      profileErrorType === 'network' ||
      profileError.message?.includes('network') ||
      profileError.message?.includes('offline') ||
      profileError.message?.includes('Failed to fetch');

    const handleRetry = () => {
      if (profileLoading) return;
      retryProfileLoad();
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
            <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Profile</h1>

          <p className="text-gray-600 mb-4">
            {isBlockedByClient
              ? "We couldn't load your profile. This may be caused by an ad blocker or browser extension blocking Firestore access."
              : isPermissionError
                ? "We couldn't load your profile due to a permissions issue. Please contact support if this persists."
                : isNetworkError
                  ? "We couldn't load your profile. Please check your network connection and try again."
                  : "We couldn't load your profile. Please try again."}
          </p>

          {isBlockedByClient && (
            <p className="text-sm text-gray-500 mb-6">
              Please disable ad blockers for this site if applicable, or check your browser settings.
            </p>
          )}

          <button
            onClick={handleRetry}
            disabled={profileLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {profileLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (loading || checkingEmail || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 font-light">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireEmailVerification && emailVerified === false && user.email) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  const isOnboardingRoute =
    location.pathname === '/onboarding' ||
    location.pathname === '/professional-onboarding' ||
    location.pathname === '/resume-onboarding' ||
    location.pathname.startsWith('/professional-onboarding/');

  const isPublicRoute =
    location.pathname === '/verify-email' ||
    location.pathname === '/email-verified' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth/action';

  if (lastPathRef.current !== location.pathname) {
    hasRedirectedRef.current = false;
    lastPathRef.current = location.pathname;
  }

  if (!isOnboardingRoute && !isPublicRoute && !hasRedirectedRef.current) {
    if (profileError) {
      logger.info("[AUTHGUARD] Profile error detected, NOT redirecting to onboarding", {
        error: profileError.message,
        hasProfile: !!profile
      });
    } else if (!profile) {
      hasRedirectedRef.current = true;
      logger.info("[AUTHGUARD] No profile found (confirmed 'not found'), redirecting to professional onboarding");
      return <Navigate to="/professional-onboarding" replace />;
    } else {
      const profileIsComplete = isProfileComplete(profile);

      if (!profileIsComplete) {
        hasRedirectedRef.current = true;

        // WO-21 extra diagnostics (kept)
        const firstName = profile.fullName?.split(' ')[0] || profile.displayName?.split(' ')[0] || '';
        const hasFirstName = firstName.trim() !== '';
        const hasProfessionalTitle =
          !!((profile.professionalTitle && profile.professionalTitle.trim() !== '') ||
            (profile.profession && profile.profession.trim() !== ''));
        const hasSpecialty = !!(profile.specialty && profile.specialty.trim() !== '');
        const practiceCountry = (profile.practiceCountry || profile.country || '').trim();
        const hasPracticeCountry = practiceCountry !== '';
        const hasPilotConsent = (profile as any).pilotConsent?.accepted === true;

        const missingFields = {
          firstName: !hasFirstName,
          professionalTitle: !hasProfessionalTitle,
          specialty: !hasSpecialty,
          practiceCountry: !hasPracticeCountry,
          pilotConsent: !hasPilotConsent
        };

        const missingFieldsList = Object.entries(missingFields)
          .filter(([_, missing]) => missing)
          .map(([field]) => field);

        const missingFieldsStr = missingFieldsList.length > 0 ? missingFieldsList.join(', ') : 'NONE';
        console.error('[AUTHGUARD] ❌ Profile INCOMPLETE - Missing fields:', missingFieldsStr, {
          uid: user?.uid,
          email: user?.email,
          hasFirstName,
          hasProfessionalTitle,
          hasSpecialty,
          hasPracticeCountry,
          hasPilotConsent,
          practiceCountry: practiceCountry || 'EMPTY',
          country: profile.country || 'EMPTY',
          pilotConsent: (profile as any).pilotConsent || 'MISSING'
        });

        logger.info("[AUTHGUARD] Profile incomplete (WO-13 criteria), redirecting to professional onboarding", {
          uid: user?.uid,
          email: user?.email,
          registrationStatus: profile.registrationStatus,
          missingFields,
          MISSING_FIELDS: missingFieldsStr
        });

        return <Navigate to="/professional-onboarding" replace />;
      }
    }
  }

  return <>{children}</>;
};
