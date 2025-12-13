/**
 * Hospital Portal Page
 * 
 * Secure portal for hospital staff to access physiotherapy notes
 * 
 * Features:
 * - Double authentication (note code + password)
 * - 5-minute session timeout
 * - Auto-logout after copy
 * - Mobile-responsive design
 * - WCAG 2.1 AA compliance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Copy, CheckCircle, XCircle, AlertCircle, Shield } from 'lucide-react';
import HospitalPortalService, { PortalAuthResponse } from '../services/hospitalPortalService';

const HospitalPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Step 1: Note Code
  const [noteCode, setNoteCode] = useState('');
  const [step, setStep] = useState<'code' | 'password' | 'view' | 'copied'>('code');
  
  // Step 2: Password
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Authentication state
  const [authResponse, setAuthResponse] = useState<PortalAuthResponse | null>(null);
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Session management
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const sessionTimeoutRef = useRef<number | null>(null);
  const idleTimeoutRef = useRef<number | null>(null);
  
  // Copy state
  const [copied, setCopied] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // ✅ FIX: Get note code from URL if provided (only once on mount)
  // ✅ NEW: Check if already authenticated from landing page
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    const isAuthenticated = searchParams.get('authenticated') === 'true';
    
    if (codeFromUrl && codeFromUrl.toUpperCase() !== noteCode) {
      setNoteCode(codeFromUrl.toUpperCase());
      
      // If already authenticated from landing page, load note content directly
      if (isAuthenticated) {
        const storedToken = sessionStorage.getItem(`portal_auth_${codeFromUrl.toUpperCase()}`);
        const storedExpires = sessionStorage.getItem(`portal_expires_${codeFromUrl.toUpperCase()}`);
        
        if (storedToken && storedExpires) {
          const expiresAt = new Date(storedExpires);
          if (expiresAt > new Date()) {
            // Valid session, load note content
            setStep('view');
            setSessionExpiresAt(expiresAt);
            loadNoteContent(codeFromUrl.toUpperCase(), storedToken);
          } else {
            // Expired, clear and show password step
            sessionStorage.removeItem(`portal_auth_${codeFromUrl.toUpperCase()}`);
            sessionStorage.removeItem(`portal_expires_${codeFromUrl.toUpperCase()}`);
            setStep('password');
          }
        } else {
          // No stored token, show password step
          setStep('password');
        }
      }
    }
     
  }, []); // Only run once on mount - searchParams is stable
  
  // Helper function to load note content (for pre-authenticated sessions)
  const loadNoteContent = useCallback(async (code: string, token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const clientInfo = await getClientInfo();
      const contentResult = await HospitalPortalService.getNoteContent(
        code.toUpperCase(),
        token,
        clientInfo
      );
      
      if ('error' in contentResult) {
        setError(contentResult.error);
        setStep('code');
        return;
      }
      
      setNoteContent(contentResult.content);
      setAuthResponse({
        success: true,
        token: token,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        noteId: code
      });
    } catch (err: any) {
      console.error('[HospitalPortal] Error loading note:', err);
      setError(err.message || 'Error loading note content');
      setStep('code');
    } finally {
      setLoading(false);
    }
  }, [getClientInfo]);

  // ✅ FIX: Memoize handleSessionTimeout to prevent infinite loops
  const handleSessionTimeout = useCallback(() => {
    setError('Your session has expired due to inactivity. Please authenticate again.');
    setStep('code');
    setNoteContent(null);
    setAuthResponse(null);
    setSessionExpiresAt(null);
    setPassword('');
  }, []); // Empty deps - this function should be stable

  // Session timeout management
  useEffect(() => {
    if (step === 'view' && sessionExpiresAt) {
      // Clear existing timeouts
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      // Set session timeout (5 minutes)
      const timeUntilExpiry = sessionExpiresAt.getTime() - Date.now();
      if (timeUntilExpiry > 0) {
        sessionTimeoutRef.current = window.setTimeout(() => {
          handleSessionTimeout();
        }, timeUntilExpiry);
      }

      // Set idle timeout (5 minutes of inactivity)
      let lastActivity = Date.now();
      const checkIdle = () => {
        const idleTime = Date.now() - lastActivity;
        if (idleTime > 5 * 60 * 1000) {
          handleSessionTimeout();
        } else {
          idleTimeoutRef.current = window.setTimeout(checkIdle, 60000); // Check every minute
        }
      };

      // Track user activity
      const updateActivity = () => {
        lastActivity = Date.now();
      };

      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => {
        window.addEventListener(event, updateActivity);
      });

      checkIdle();

      return () => {
        events.forEach(event => {
          window.removeEventListener(event, updateActivity);
        });
        if (sessionTimeoutRef.current) {
          clearTimeout(sessionTimeoutRef.current);
        }
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
      };
    }
  }, [step, sessionExpiresAt, handleSessionTimeout]); // ✅ FIX: Added handleSessionTimeout to deps

  // ✅ FIX: Memoize getClientInfo to prevent recreating on every render
  const getClientInfo = useCallback(async () => {
    const ipAddress = await HospitalPortalService.getClientIpAddress();
    return {
      ipAddress,
      userAgent: navigator.userAgent,
    };
  }, []); // Empty deps - navigator.userAgent is stable

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!noteCode || noteCode.length !== 6) {
      setError('Please enter a valid 6-character note code');
      return;
    }

    setError(null);
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clientInfo = await getClientInfo();
      const response = await HospitalPortalService.authenticateNote(
        noteCode.toUpperCase(),
        password,
        clientInfo
      );

      if (!response.success) {
        setError(response.error || 'Authentication failed');
        setPassword('');
        return;
      }

      setAuthResponse(response);
      setSessionExpiresAt(response.expiresAt || null);

      // Load note content
      if (response.token && response.noteId) {
        const clientInfo = await getClientInfo();
        const contentResult = await HospitalPortalService.getNoteContent(
          noteCode.toUpperCase(),
          response.token,
          clientInfo
        );

        if ('error' in contentResult) {
          setError(contentResult.error);
          return;
        }

        setNoteContent(contentResult.content);
        setStep('view');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNote = async () => {
    if (!noteContent || !authResponse?.token) {
      return;
    }

    try {
      const clientInfo = await getClientInfo();
      const result = await HospitalPortalService.copyNote(
        noteCode.toUpperCase(),
        authResponse.token,
        clientInfo
      );

      if (!result.success) {
        setError(result.error || 'Failed to copy note');
        return;
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(result.content || noteContent);
      setCopied(true);
      setCopySuccess(true);
      setStep('copied');

      // Auto-logout after copy
      setTimeout(() => {
        handleSessionTimeout();
      }, 2000);
    } catch (err: any) {
      setError('Failed to copy note to clipboard');
    }
  };

  const handleReset = () => {
    setStep('code');
    setNoteCode('');
    setPassword('');
    setError(null);
    setNoteContent(null);
    setAuthResponse(null);
    setSessionExpiresAt(null);
    setCopied(false);
    setCopySuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-blue rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            AiduxCare Secure Portal
          </h1>
          <p className="text-sm text-slate-600">
            Secure access to physiotherapy notes
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          {/* Step 1: Note Code */}
          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label htmlFor="noteCode" className="block text-sm font-medium text-slate-700 mb-2">
                  Note Code
                </label>
                <input
                  id="noteCode"
                  type="text"
                  value={noteCode}
                  onChange={(e) => setNoteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue text-center text-2xl font-mono tracking-wider"
                  autoFocus
                  required
                />
                <p className="mt-2 text-xs text-slate-500 text-center">
                  Enter the 6-character code provided by your physiotherapist
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={noteCode.length !== 6}
                className="w-full py-3 px-4 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Personal Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue pr-12"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Enter the personal password set by your physiotherapist
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('code')}
                  className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!password || loading}
                  className="flex-1 py-3 px-4 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: View Note */}
          {step === 'view' && noteContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    Authenticated
                  </span>
                </div>
                {sessionExpiresAt && (
                  <span className="text-xs text-slate-500">
                    Session expires in {Math.max(0, Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000 / 60))} min
                  </span>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {noteContent}
                </pre>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-900 mb-1">
                      Security Notice
                    </p>
                    <p className="text-xs text-amber-700">
                      Copying this note will automatically log you out for security. Your session will expire in 5 minutes of inactivity.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopyNote}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Note
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2 px-4 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition text-sm"
              >
                Logout
              </button>
            </div>
          )}

          {/* Step 4: Copied */}
          {step === 'copied' && copySuccess && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Note Copied Successfully
                </h2>
                <p className="text-sm text-slate-600">
                  The note has been copied to your clipboard. You have been automatically logged out for security.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 px-4 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue-hover transition"
              >
                Access Another Note
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 PHIPA/PIPEDA Compliant • Canadian Data Storage • Encrypted Transmission
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortalPage;

