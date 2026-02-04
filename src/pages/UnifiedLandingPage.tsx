/**
 * Unified Landing Page - Official AiduxCare Design
 * 
 * Three access pathways with official branding:
 * 1. Hospital Patient - Visit code access
 * 2. Private Practice - Login to dashboard
 * 3. Get Started - New user onboarding
 * 
 * PHIPA Compliant • SSL Secured • 100% Canadian Data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  UserPlus,
  ArrowRight,
  Shield,
  AlertCircle,
  FileText,
  Lock,
  CheckCircle
} from 'lucide-react';
import HospitalPortalService from "../services/hospitalPortalService";
import { useAuth } from '../context/AuthContext';
import { useProfessionalProfile } from '../context/ProfessionalProfileContext';
import { isProfileComplete } from '../utils/professionalProfileValidation';

const UnifiedLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfessionalProfile();

  // Pilot: if already logged in with complete profile, go straight to command center (avoid showing "Choose your workflow")
  useEffect(() => {
    if (profileLoading || !user) return;
    if (profile && isProfileComplete(profile)) {
      navigate('/command-center', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

  // Inpatient state
  const [visitCode, setVisitCode] = useState('');
  const [visitPassword, setVisitPassword] = useState('');
  const [inpatientError, setInpatientError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInpatientAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setInpatientError(null);

    if (!visitCode.trim()) {
      setInpatientError('Please enter a visit code');
      return;
    }

    if (!visitPassword.trim()) {
      setInpatientError('Please enter the password');
      return;
    }

    setIsLoading(true);

    try {
      const ipAddress = await HospitalPortalService.getClientIpAddress();
      const clientInfo = {
        ipAddress,
        userAgent: navigator.userAgent
      };

      const authResult = await HospitalPortalService.authenticateNote(
        visitCode.trim().toUpperCase(),
        visitPassword,
        clientInfo
      );

      if (!authResult.success) {
        setInpatientError(authResult.error || 'Invalid visit code or password');
        return;
      }

      if (authResult.token) {
        sessionStorage.setItem(`portal_auth_${visitCode.trim().toUpperCase()}`, authResult.token);
        sessionStorage.setItem(`portal_expires_${visitCode.trim().toUpperCase()}`, authResult.expiresAt?.toISOString() || '');
      }

      navigate(`/hospital/inpatient?code=${visitCode.trim().toUpperCase()}&authenticated=true`);
    } catch (err) {
      console.error('[UnifiedLanding] Authentication error:', err);
      setInpatientError('Error authenticating. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden overflow-x-hidden flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
              SECURE PROFESSIONAL ACCESS • PHIPA COMPLIANT
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden max-w-7xl xl:max-w-[90rem] 2xl:max-w-[100rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Main Title - compact */}
        <div className="flex-shrink-0 text-center mb-2 sm:mb-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-0.5 sm:mb-1 tracking-tight leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-normal">AiduxCare</span> 🍁
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-light">
            Your Best Medico-Legal Copilot
          </p>
          <p className="text-xs text-gray-500 font-light">
            Choose your workflow
          </p>
        </div>

        {/* Compliance Badge - compact */}
        <div className="flex-shrink-0 flex justify-center mb-2 sm:mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border border-green-300/50 rounded-full text-[10px] sm:text-xs font-medium text-gray-700 shadow-sm max-w-2xl">
            <Shield className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span className="truncate">Designed for Canadian privacy workflows • Audit logging • Encryption in transit and at rest</span>
          </div>
        </div>

        {/* Three Cards Grid - takes remaining space */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3">
          {/* CARD 1: Hospital Patient */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col min-h-0 overflow-auto">
            <div className="text-center mb-2 flex-shrink-0">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-2 shadow border border-gray-200/80">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" strokeWidth={1.5} />
              </div>
              <h2 className="text-base sm:text-lg font-normal text-gray-900 mb-0.5">Hospital Patient</h2>
              <p className="text-xs text-gray-500 font-light">Enter visit code for instant SOAP note</p>
            </div>

            <form onSubmit={handleInpatientAccess} className="space-y-2 flex-1 min-h-0 flex flex-col">
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Visit Code</label>
                <input
                  type="text"
                  value={visitCode}
                  onChange={(e) => {
                    setVisitCode(e.target.value.toUpperCase());
                    setInpatientError(null);
                  }}
                  placeholder="E.G. AUX-HSC-001234"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase bg-white text-gray-900 text-xs placeholder-gray-400 transition-all"
                />
              </div>

              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={visitPassword}
                  onChange={(e) => {
                    setVisitPassword(e.target.value);
                    setInpatientError(null);
                  }}
                  placeholder="Password for this visit code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-xs placeholder-gray-400 transition-all"
                />
              </div>

              {inpatientError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex-shrink-0">
                  <div className="flex items-start gap-2 text-red-800 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span className="font-light">{inpatientError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !visitCode.trim() || !visitPassword.trim()}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 text-sm shadow flex-shrink-0 ${isLoading || !visitCode.trim() || !visitPassword.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-lg shadow-blue-500/30'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Accessing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Access Patient Note</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-start gap-1.5 text-[10px] text-gray-600">
                <Shield className="w-3 h-3 mt-0.5 text-gray-700 flex-shrink-0" />
                <p className="font-light">Secure: only the physiotherapist who created the code can access it.</p>
              </div>
            </div>
          </div>

          {/* CARD 2: Private Practice */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col min-h-0">
            <div className="text-center mb-2 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-2 shadow ring-2 ring-blue-100/50">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-base sm:text-lg font-normal text-gray-900 mb-0.5">Private Practice</h2>
              <p className="text-xs text-gray-500 font-light">Full documentation workflow</p>
            </div>

            <div className="flex-shrink-0 mb-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 shadow hover:shadow-lg shadow-blue-500/30 text-sm"
              >
                <span>Login to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 mb-2 flex-shrink-0">
              <div className="flex items-start gap-1.5 text-xs text-gray-700">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Command Center, SOAP workflow, patient tools</span>
              </div>
            </div>

            <div className="mt-auto pt-2 border-t border-gray-200 flex-shrink-0">
              <p className="text-[10px] text-gray-500 text-center font-light">
                Command Center → Workflow → SOAP Note
              </p>
            </div>
          </div>

          {/* CARD 3: Get Started (Onboarding) - PROTAGONISTA */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-xl p-3 sm:p-4 border-2 border-blue-400/50 ring-2 ring-blue-100/50 hover:shadow-2xl transition-all duration-300 flex flex-col min-h-0">
            <div className="text-center mb-2 flex-shrink-0">
              <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-2 shadow ring-2 ring-indigo-100/50">
                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-base sm:text-lg font-normal text-gray-900 mb-0.5">Get Started</h2>
              <p className="text-xs text-gray-500 font-light">New to AiduxCare?</p>
            </div>

            <div className="flex-shrink-0 mb-2">
              <button
                onClick={() => navigate('/professional-onboarding')}
                className="w-full px-4 py-2.5 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all flex items-center justify-center shadow text-sm"
              >
                Sign Up Here
              </button>
            </div>

            <div className="space-y-1 mb-2 flex-shrink-0">
              <div className="flex items-start gap-1.5 text-xs text-gray-700">
                <CheckCircle className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Create account, professional setup, verify credentials</span>
              </div>
            </div>

            <div className="mt-auto pt-2 border-t border-gray-200 flex-shrink-0">
              <p className="text-[10px] text-gray-500 text-center font-light">
                Not part of AiduxCare yet?
              </p>
            </div>
          </div>

        </div>

        {/* Footer Compliance Bar - compact */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm rounded-lg shadow p-3 border border-gray-200">
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-center">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200/50">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-700 font-medium">PHIPA Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/50">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-700 font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200/50">
              <span className="text-sm">🍁</span>
              <span className="text-xs text-gray-700 font-medium">100% Canadian Data</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex-shrink-0 text-center py-2">
          <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs text-gray-600 font-light">
            <button
              onClick={() => navigate('/privacy')}
              className="hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => navigate('/terms')}
              className="hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLandingPage;

