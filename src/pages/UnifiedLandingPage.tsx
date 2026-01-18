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

import React, { useState } from 'react';
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

const UnifiedLandingPage: React.FC = () => {
  const navigate = useNavigate();
  
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              SECURE PROFESSIONAL ACCESS • PHIPA COMPLIANT
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Main Title */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 mb-4 tracking-tight leading-tight">
            Welcome to <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent font-normal">AiduxCare</span> 🍁
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 font-light">
            Your Best Medico-Legal Copilot
          </p>
          <p className="text-sm text-gray-500 mt-4 font-light">
            Choose your workflow
          </p>
        </div>

        {/* Compliance Badge */}
        <div className="flex justify-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 via-blue-50 to-green-50 border border-green-300/50 rounded-full text-xs font-medium text-gray-700 shadow-sm">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span>Designed for Canadian privacy workflows • Audit logging • Encryption in transit and at rest</span>
          </div>
        </div>

        {/* Three Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* CARD 1: Hospital Patient */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-200/80">
                <Building2 className="w-11 h-11 text-gray-700" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-normal text-gray-900 mb-2">Hospital Patient</h2>
              <p className="text-sm text-gray-500 font-light">Enter visit code for instant SOAP note</p>
            </div>

            <form onSubmit={handleInpatientAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Code
                </label>
                <input
                  type="text"
                  value={visitCode}
                  onChange={(e) => {
                    setVisitCode(e.target.value.toUpperCase());
                    setInpatientError(null);
                  }}
                  placeholder="ENTER VISIT CODE (E.G., AUX-HSC-001234)"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase bg-white text-gray-900 text-sm placeholder-gray-400 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5 font-light">
                  Code created exclusively by the physiotherapist
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={visitPassword}
                  onChange={(e) => {
                    setVisitPassword(e.target.value);
                    setInpatientError(null);
                  }}
                  placeholder="Enter password for this visit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm placeholder-gray-400 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1.5 font-light">
                  Password set by the physiotherapist who created this code
                </p>
              </div>

              {inpatientError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-light">{inpatientError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !visitCode.trim() || !visitPassword.trim()}
                  className={`w-full px-6 py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-base shadow-lg ${
                    isLoading || !visitCode.trim() || !visitPassword.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-xl shadow-blue-500/30'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Accessing...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Access Patient Note</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <Shield className="w-4 h-4 mt-0.5 text-gray-700 flex-shrink-0" />
                <div className="font-light">
                  <p className="font-medium text-gray-900 mb-1">Secure Access</p>
                  <p>Visit code and password are exclusively linked. Only the physiotherapist who created the code can access it.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: Private Practice */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_rgba(59,130,246,0.35)] ring-4 ring-blue-100/50">
                <User className="w-11 h-11 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-normal text-gray-900 mb-2">Private Practice</h2>
              <p className="text-sm text-gray-500 font-light">Full documentation workflow</p>
            </div>

            <div className="space-y-6 mb-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl shadow-blue-500/30 text-base"
              >
                <span>Login to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Access Command Center</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Complete SOAP workflow</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Patient management tools</span>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center font-light">
                Command Center → Workflow → SOAP Note
              </p>
            </div>
          </div>

          {/* CARD 3: Get Started (Onboarding) - PROTAGONISTA */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-blue-400/50 ring-4 ring-blue-100/50 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-[0_10px_40px_rgba(99,102,241,0.45)] ring-4 ring-indigo-100/50">
                <UserPlus className="w-11 h-11 text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-normal text-gray-900 mb-2">Get Started</h2>
              <p className="text-sm text-gray-500 font-light">New to AiduxCare?</p>
            </div>

            <div className="space-y-6 mb-6">
              <button
                onClick={() => navigate('/professional-onboarding')}
                className="w-full px-6 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-semibold hover:bg-blue-50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl shadow-blue-500/30 text-base"
              >
                <span>Sign Up Here</span>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Create your account</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Complete professional setup</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="font-light">Verify credentials</span>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center font-light">
                Not part of AiduxCare yet?
              </p>
            </div>
          </div>

        </div>

        {/* Footer Compliance Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center gap-12 flex-wrap text-center">
            <div className="flex items-center gap-3 bg-green-50 px-4 py-2.5 rounded-xl border border-green-200/50">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700 font-medium">PHIPA Compliant</span>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-200/50">
              <Lock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700 font-medium">SSL Secured</span>
            </div>
            <div className="flex items-center gap-3 bg-red-50 px-4 py-2.5 rounded-xl border border-red-200/50">
              <span className="text-lg">🍁</span>
              <span className="text-sm text-gray-700 font-medium">100% Canadian Data</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-600 font-light">
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

