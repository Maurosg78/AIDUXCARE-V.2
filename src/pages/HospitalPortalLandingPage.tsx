/**
 * Hospital Portal Landing Page - Dual Path Decision Hub
 * 
 * Minimalist landing page with two clear paths:
 * - IN-PATIENT: Direct access with visit code (leads to clinical notes for copy-paste)
 * - OUT-PATIENT: Login button (leads to existing login page with registration)
 * 
 * PHIPA/PIPEDA/CPO Compliant - ISO Hospital Standards
 * All content in English for professional audience
 */

import React, { useState } from 'react';
import HospitalPortalService from "../services/hospitalPortalService";
import { useNavigate } from 'react-router-dom';
import { Building2, User, ArrowRight, Shield, AlertCircle, FileText } from 'lucide-react';

const HospitalPortalLandingPage: React.FC = () => {
  const navigate = useNavigate();
  
  // IN-PATIENT state (visit code + password)
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
      setInpatientError('Please enter the password for this visit code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Import HospitalPortalService dynamically
      
      // Get client info for authentication
      const ipAddress = await HospitalPortalService.getClientIpAddress();
      const clientInfo = {
        ipAddress,
        userAgent: navigator.userAgent
      };
      
      // Authenticate with visit code + password
      const authResult = await HospitalPortalService.authenticateNote(
        visitCode.trim().toUpperCase(),
        visitPassword,
        clientInfo
      );
      
      if (!authResult.success) {
        setInpatientError(authResult.error || 'Invalid visit code or password');
        return;
      }
      
      // Store auth token temporarily for portal page
      if (authResult.token) {
        sessionStorage.setItem(`portal_auth_${visitCode.trim().toUpperCase()}`, authResult.token);
        sessionStorage.setItem(`portal_expires_${visitCode.trim().toUpperCase()}`, authResult.expiresAt?.toISOString() || '');
      }
      
      // Navigate to inpatient portal with authenticated session
      navigate(`/hospital/inpatient?code=${visitCode.trim().toUpperCase()}&authenticated=true`);
    } catch (err) {
      console.error('[HospitalPortalLanding] Authentication error:', err);
      setInpatientError('Error authenticating. Please verify your visit code and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOutpatientLogin = () => {
    // Navigate to existing login page (with registration option)
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F7F7] via-white to-[#F7F7F7] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#2C3E50] to-[#34495E] rounded-lg p-2">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-light text-[#2C3E50] tracking-tight">
              AiDuxCare
            </h1>
          </div>
          
          <p className="text-xl text-[#475569] mb-4 font-light leading-relaxed">
            Your Best Clinical and Legal Copilot
          </p>
          
          <p className="text-sm text-[#95A5A6] mb-6 font-light">
            Choose your workflow
          </p>
          
          {/* Compliance Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A8E6CF]/20 to-[#C4F1DE]/20 border border-[#A8E6CF]/30 rounded-full text-xs font-medium text-[#2C3E50]">
            <Shield className="w-3.5 h-3.5" />
            <span>PHIPA • PIPEDA • CPO Compliant • Built under Strict ISO Hospital Standards</span>
          </div>
        </div>

        {/* Two Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* IN-PATIENT Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-[#BDC3C7]/20 hover:border-[#2C3E50]/30 transition-all">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-[#2C3E50]/10 to-[#34495E]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-[#2C3E50]" />
              </div>
              <h2 className="text-2xl font-medium text-[#2C3E50] mb-2">Hospital Patient</h2>
              <p className="text-sm text-[#95A5A6] font-light">Enter visit code for instant SOAP note</p>
            </div>

            <form onSubmit={handleInpatientAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
                  Visit Code
                </label>
                <input
                  type="text"
                  value={visitCode}
                  onChange={(e) => {
                    setVisitCode(e.target.value.toUpperCase());
                    setInpatientError(null);
                  }}
                  placeholder="Enter visit code (e.g., AUX-HSC-001234)"
                  maxLength={20}
                  required
                  className="w-full px-4 py-3 border border-[#BDC3C7]/40 rounded-lg focus:ring-2 focus:ring-[#2C3E50] focus:border-[#2C3E50] uppercase bg-white text-[#2C3E50] font-light"
                />
                <p className="text-xs text-[#95A5A6] mt-1 font-light">
                  Code created exclusively by the physiotherapist
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#2C3E50] mb-2">
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
                  required
                  className="w-full px-4 py-3 border border-[#BDC3C7]/40 rounded-lg focus:ring-2 focus:ring-[#2C3E50] focus:border-[#2C3E50] bg-white text-[#2C3E50] font-light"
                />
                <p className="text-xs text-[#95A5A6] mt-1 font-light">
                  Password set by the physiotherapist who created this code
                </p>
              </div>

              {inpatientError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-light">{inpatientError}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !visitCode.trim() || !visitPassword.trim()}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLoading || !visitCode.trim() || !visitPassword.trim()
                    ? 'bg-[#BDC3C7] text-[#95A5A6] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white hover:from-[#1B2631] hover:to-[#2C3E50] shadow-sm'
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

            <div className="mt-6 pt-6 border-t border-[#BDC3C7]/20">
              <div className="flex items-start gap-2 text-xs text-[#95A5A6]">
                <Shield className="w-4 h-4 mt-0.5 text-[#2C3E50] flex-shrink-0" />
                <div className="font-light">
                  <p className="font-medium text-[#2C3E50] mb-1">Secure Access</p>
                  <p>Visit code and password are exclusively linked. Only the physiotherapist who created the code can access it.</p>
                </div>
              </div>
            </div>
          </div>

          {/* OUT-PATIENT Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-[#BDC3C7]/20 hover:border-[#5DA5A3]/30 transition-all">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-[#5DA5A3]/10 to-[#7BB8B6]/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-[#5DA5A3]" />
              </div>
              <h2 className="text-2xl font-medium text-[#2C3E50] mb-2">Private Practice</h2>
              <p className="text-sm text-[#95A5A6] font-light">Full documentation workflow</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleOutpatientLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#5DA5A3] to-[#7BB8B6] text-white rounded-lg font-medium hover:from-[#4A8280] hover:to-[#5DA5A3] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Login to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[#BDC3C7]/20">
              <p className="text-xs text-[#95A5A6] text-center font-light">
                Command Center → Workflow → SOAP Note
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg shadow-sm p-6 max-w-3xl mx-auto border border-[#BDC3C7]/20 space-y-3">
            <p className="text-sm text-[#95A5A6] font-light">
              Secure • PHIPA | PIPEDA • Canadian Data Sovereignty
            </p>
            <div className="flex items-center justify-center gap-6 text-xs text-[#2C3E50] font-light">
              <button
                type="button"
                className="underline underline-offset-4 hover:text-[#1B2631]"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="underline underline-offset-4 hover:text-[#1B2631]"
                onClick={() => navigate('/terms')}
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortalLandingPage;
