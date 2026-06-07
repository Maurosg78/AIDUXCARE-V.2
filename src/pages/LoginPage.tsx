import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfessionalProfile } from "../context/ProfessionalProfileContext";
import { emailActivationService } from "../services/emailActivationService";
import { firebaseAuthService } from "@/services/firebaseAuthService";
import { isProfileComplete } from "../utils/professionalProfileValidation";
import Button from "../components/ui/button";
import { auth } from "../lib/firebase";
import { isSpainPilot } from '@/core/pilotDetection';

import logger from "@/shared/utils/logger";
import styles from '@/styles/wizard.module.css';
import { safeLogger } from "@/utils/safeLogger";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resendVerificationLoading, setResendVerificationLoading] = useState(false);
  const [showPendingActivationResend, setShowPendingActivationResend] = useState(false);
  const hasRedirectedRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfessionalProfile();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // ✅ CRITICAL FIX: Handle redirect when profile finishes loading after login
  useEffect(() => {
    // ✅ CRITICAL: Prevent multiple redirects
    if (hasRedirectedRef.current) {
      return;
    }

    // ✅ CRITICAL: Only redirect if we're waiting AND profile is actually loaded
    // Check both: !profileLoading (finished loading) AND profile exists
    if (isWaitingForProfile && user) {
      // If still loading, wait
      if (profileLoading) {
        safeLogger.profileOperation('login_profile_loading_wait', false);
        return;
      }

      // If profile error, let AuthGuard handle it
      if (profileError) {
        safeLogger.profileOperation('login_profile_error_soft_fail', false);
        hasRedirectedRef.current = false; // Allow retry on error
        setIsWaitingForProfile(false);
        return;
      }

      // If profile doesn't exist yet, wait for it
      if (!profile) {
        safeLogger.profileOperation('login_profile_missing_wait', false);
        return;
      }

      // Profile is loaded, proceed with redirect
      hasRedirectedRef.current = true;
      setIsWaitingForProfile(false);

      if (isProfileComplete(profile)) {
        safeLogger.profileOperation('login_profile_complete_redirect', Boolean(profile.licenseNumber));
        navigate("/command-center", {
          replace: true,
          state: { from: "login" },
        });
      } else {
        safeLogger.profileOperation('login_profile_incomplete_redirect', Boolean(profile.licenseNumber));
        navigate("/professional-onboarding", {
          replace: true,
          state: { from: "login" },
        });
      }
    }
  }, [isWaitingForProfile, profileLoading, profile, user, profileError, navigate]);

  // Caps Lock detection (global listener)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.getModifierState && event.getModifierState('CapsLock')) {
        setCapsLockActive(true);
      } else {
        setCapsLockActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyPress);
    };
  }, []);

  // WO-13: Función para manejar redirección post-login usando isProfileComplete como fuente única de verdad
  const handlePostLoginRedirect = () => {
    // ✅ CRITICAL FIX: Don't redirect if profile is still loading
    if (profileLoading) {
      safeLogger.profileOperation('login_profile_loading_defer_redirect', false);
      return;
    }

    // Si hay error de Firestore (adblock, etc.), NO navegar - AuthGuard mostrará soft-fail
    if (profileError) {
      safeLogger.profileOperation('login_profile_error_soft_fail', false);
      // No navegar - dejar que AuthGuard maneje el error
      return;
    }

    // ✅ CRITICAL FIX: If profile is null, don't redirect - let AuthGuard handle it
    if (!profile) {
      safeLogger.profileOperation('login_profile_missing_authguard_redirect', false);
      return;
    }

    // WO-13: Usar isProfileComplete (criterio unificado) en lugar de registrationStatus
    // NO usar emailVerified para routing en piloto
    if (isProfileComplete(profile)) {
      // Perfil completo → Command Center
      safeLogger.profileOperation('login_profile_complete_redirect', Boolean(profile.licenseNumber));
      navigate("/command-center", {
        replace: true,
        state: { from: "login" },
      });
    } else {
      // Perfil incompleto → Onboarding
      safeLogger.profileOperation('login_profile_incomplete_redirect', Boolean(profile.licenseNumber));
      navigate("/professional-onboarding", {
        replace: true,
        state: { from: "login" },
      });
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    // ✅ CRITICAL: Prevent duplicate login attempts
    if (isLoggingIn) {
      safeLogger.authEvent('login_duplicate_ignored', false);
      return;
    }

    // ✅ CRITICAL FIX: Manual validation in English (compliance requirement)
    if (!email.trim()) {
      setError(t('login.errorEmailRequired'));
      return;
    }

    if (!password.trim()) {
      setError(t('login.errorPasswordRequired'));
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('login.errorInvalidEmail'));
      return;
    }

    setIsLoggingIn(true);
    setLoading(true);
    setError("");
    setIsWaitingForProfile(false);
    hasRedirectedRef.current = false; // Reset redirect flag for new login attempt

    try {
      safeLogger.authEvent('login_attempt', true);
      await login(email, password);

      const currentUserAfterLogin = auth.currentUser;

      // 🔎 Legacy email-activation path (kept for backwards compatibility)
      // For the official pilot we DO NOT block login if there is no legacy
      // professional document; onboarding + ProfessionalProfileContext own the truth.
      // Use uid + getDoc(users/{uid}) so Firestore rules allow read (email queries are denied).
      const professional = await emailActivationService.getProfessional(email, currentUserAfterLogin?.uid);

      if (!professional) {
        safeLogger.profileOperation('legacy_professional_document_missing', false);
        // Do NOT block – let profile loader + onboarding handle new pilot users
      }

      // Pilot: if Firebase Auth says email is verified, don't block on legacy isActive
      const firebaseEmailVerified = currentUserAfterLogin?.emailVerified === true;
      if (professional && professional.isActive === false && !firebaseEmailVerified) {
        setError(t('login.errorPendingActivation'));
        setShowPendingActivationResend(true);
        return;
      }
      if (professional && professional.isActive === false && firebaseEmailVerified) {
        safeLogger.authEvent('legacy_inactive_email_verified', true);
      }
      setShowPendingActivationResend(false);

      // Enterprise-grade: Use uid directly to avoid Firestore rules issues
      await emailActivationService.updateLastLogin(email, currentUserAfterLogin?.uid);

      // WO-AUTH-GATE-LOOP-06 ToDo 3: Landing post-login según registrationStatus
      // ✅ CRITICAL FIX: Always use useEffect to handle redirect
      // This ensures we wait for profile to be fully loaded, not just profileLoading === false
      setIsWaitingForProfile(true);
      const loginSuccess = Boolean(currentUserAfterLogin);
      safeLogger.authEvent('login_waiting_for_profile', loginSuccess);
      // useEffect will handle the redirect when profile is ready
    } catch (err) {
      const loginErrorCode = (err as { code?: string })?.code ?? 'unknown';
      const loginHasMessage = Boolean((err as { message?: string })?.message);
      safeLogger.errorOccurred('LoginPage', loginErrorCode, loginHasMessage);
      setError(t('login.errorInvalidCredentials'));
      setShowPendingActivationResend(false);
      hasRedirectedRef.current = false; // Reset on error to allow retry
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center overflow-x-hidden px-4 py-4 sm:py-6">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] md:items-center md:gap-8 lg:gap-12">
        {/* Header Section - Apple-Style Thin Typography */}
        <div className="text-center md:text-left">
          <p className="text-[10px] font-light text-gray-500 uppercase tracking-[0.02em] mb-4 font-apple">
            {t('landing.headerBadge')}
          </p>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light mb-3 tracking-[-0.02em] leading-[1.1] font-apple">
            {t('landing.welcomeTitle')}{' '}
            <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-medium">
              AiduxCare
            </span>
            {!isSpainPilot() && <span className="ml-2 text-2xl">🍁</span>}
          </h1>

          <p className="text-base sm:text-lg text-gray-600 font-light leading-[1.3] font-apple max-w-xl md:max-w-md">
            {t('landing.tagline')}
          </p>
        </div>

        <div>
        {/* Single Login Card - Compact Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-5 text-center font-apple">
            {t('login.title')}
          </h2>

          {/* Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
              {showPendingActivationResend && (
                <button
                  type="button"
                  onClick={async () => {
                    setResendVerificationLoading(true);
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                      setError(t('login.errorSignInToResend'));
                      setResendVerificationLoading(false);
                      return;
                    }
                    const result = await firebaseAuthService.sendEmailVerification(currentUser);
                    setResendVerificationLoading(false);
                    if (result.success) {
                      setSuccessMessage(t('login.successVerificationSent'));
                      setError("");
                      setShowPendingActivationResend(false);
                    } else {
                      setError(result.message || t('login.errorResendFailed'));
                    }
                  }}
                  disabled={resendVerificationLoading}
                  className="w-full py-2.5 px-4 text-sm font-medium text-primary-blue border border-primary-blue/50 rounded-lg bg-primary-blue/5 hover:bg-primary-blue/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-apple"
                >
                  {resendVerificationLoading ? t('login.sending') : t('login.resendVerification')}
                </button>
              )}
            </div>
          )}

          {/* Profile Loading Indicator */}
          {(isWaitingForProfile || profileLoading) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('login.loadingProfile')}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form" noValidate>
            <div>
              <label htmlFor="email-address" className="block text-sm font-normal text-gray-700 mb-2 font-apple">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
                placeholder="mauricio@aiduxcare.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-normal text-gray-700 mb-2 font-apple">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full h-11 px-4 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    const capsLockOn = event.getModifierState && event.getModifierState('CapsLock');
                    setCapsLockActive(capsLockOn);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {capsLockActive && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{t('login.capsLockOn')}</span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              variant="gradient"
              disabled={loading}
              className="w-full h-11 text-[15px] font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 font-apple"
            >
              {loading ? t('login.signingIn') : t('login.title')}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-blue hover:text-primary-purple transition-colors font-apple font-light"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
          </div>

          {/* Signup Section - Secondary Action */}
          <div className="text-center space-y-3">
            <p className="text-gray-600 text-[15px] font-apple font-light">
              {t('landing.notPartYet')}
            </p>
            <Button
              variant="outline"
              className="w-full h-11 text-[15px] font-medium transition-all duration-200 font-apple"
              onClick={() => navigate('/professional-onboarding')}
            >
              {t('landing.signUpHere')}
            </Button>
          </div>
        </div>

        {/* Trust Footer — Canada: PHIPA; Spain pilot: RGPD */}
        <div className="text-center mt-4">
          <p className="text-[12px] text-gray-500 font-apple font-light flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {!isSpainPilot() && <span>🍁</span>}
            <span>
              {isSpainPilot()
                ? 'Cumplimiento RGPD • SSL • Datos seguros'
                : 'PHIPA Compliant • SSL Secured • 100% Canadian Data'}
            </span>
          </p>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
