import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useProfessionalProfile } from "../context/ProfessionalProfileContext";
import { emailActivationService } from "../services/emailActivationService";
import { isProfileComplete } from "../utils/professionalProfileValidation";
import Button from "../components/ui/button";
import { auth } from "../lib/firebase";

import logger from "@/shared/utils/logger";
import styles from '@/styles/wizard.module.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfessionalProfile();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // WO-13: Función para manejar redirección post-login usando isProfileComplete como fuente única de verdad
  const handlePostLoginRedirect = () => {
    // Si hay error de Firestore (adblock, etc.), NO navegar - AuthGuard mostrará soft-fail
    if (profileError) {
      logger.warn("[LOGIN] Profile error detected, AuthGuard will handle soft-fail");
      // No navegar - dejar que AuthGuard maneje el error
      return;
    }

    // WO-13: Usar isProfileComplete (criterio unificado) en lugar de registrationStatus
    // NO usar emailVerified para routing en piloto
    if (isProfileComplete(profile)) {
      // Perfil completo → Command Center
      logger.info("[LOGIN] Profile complete (WO-13 criteria), redirecting to command-center");
      navigate("/command-center", {
        replace: true,
        state: { from: "login" },
      });
    } else {
      // Perfil incompleto → Onboarding
      logger.info("[LOGIN] Profile incomplete (WO-13 criteria), redirecting to professional-onboarding");
      navigate("/professional-onboarding", {
        replace: true,
        state: { from: "login" },
      });
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      logger.info("[LOGIN] Attempting sign-in", { email });
      await login(email, password);

      const professional = await emailActivationService.getProfessional(email);

      if (!professional) {
        setError("Email not registered. Complete the onboarding process first.");
        return;
      }

      if (professional.isActive === false) {
        setError("Your account is pending activation. Check your inbox.");
        return;
      }

      // Enterprise-grade: Use uid directly to avoid Firestore rules issues
      const currentUser = auth.currentUser;
      await emailActivationService.updateLastLogin(email, currentUser?.uid);
      
      // WO-AUTH-GATE-LOOP-06 ToDo 3: Landing post-login según registrationStatus
      // Esperar a que el perfil se cargue (si está cargando)
      if (profileLoading) {
        // Esperar un momento para que el perfil se cargue
        setTimeout(() => {
          handlePostLoginRedirect();
        }, 500);
      } else {
        handlePostLoginRedirect();
      }
    } catch (err) {
      logger.error("[LOGIN] Authentication error", err);
      setError("We couldn't validate your credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-6">
      <div className="w-full max-w-md">
        {/* Header Section - Apple-Style Thin Typography */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-light text-gray-500 uppercase tracking-[0.02em] mb-4 font-apple">
            SECURE PROFESSIONAL ACCESS • PHIPA COMPLIANT
          </p>
          
          <h1 className="text-3xl sm:text-4xl font-light mb-3 tracking-[-0.02em] leading-[1.1] font-apple">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-medium">
              AiduxCare
            </span>
            <span className="ml-2 text-2xl">🍁</span>
          </h1>
          
          <p className="text-lg text-gray-600 font-light leading-[1.3] font-apple">
            Your Best Medico-Legal Copilot
          </p>
        </div>

        {/* Single Login Card - Compact Design */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-medium text-gray-900 mb-5 text-center font-apple">
            Sign In
          </h2>

          {/* Messages */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-normal text-gray-700 mb-2 font-apple">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-[15px] bg-white font-apple font-light"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            
            <Button
              type="submit"
              variant="gradient"
              disabled={loading}
              className="w-full h-11 text-[15px] font-medium shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 font-apple"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-blue hover:text-primary-purple transition-colors font-apple font-light"
              >
                Forgot your password?
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
              Not part of AiduxCare yet?
            </p>
            <Button
              variant="outline"
              className="w-full h-11 text-[15px] font-medium transition-all duration-200 font-apple"
              onClick={() => navigate('/professional-onboarding')}
            >
              Sign Up Here
            </Button>
          </div>
        </div>

        {/* Trust Footer - Professional with Canadian Identity */}
        <div className="text-center">
          <p className="text-[12px] text-gray-500 font-apple font-light flex items-center justify-center gap-1">
            <span>🍁</span>
            <span>PHIPA Compliant • SSL Secured • 100% Canadian Data</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
