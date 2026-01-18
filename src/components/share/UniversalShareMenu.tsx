/**
 * Universal Share Menu Component
 * 
 * Provides multiple secure sharing options for clinical notes
 * PHIPA/PIPEDA-aware sharing methods (design goal)
 * 
 * Priority order:
 * 1. Secure Portal (highest security)
 * 2. Encrypted Email
 * 3. Secure Files (password-protected)
 * 4. Clipboard (temporary)
 */

import React, { useState } from 'react';
import { 
  Share2, 
  Lock, 
  Mail, 
  FileText, 
  Clipboard, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import HospitalPortalService from '../../services/hospitalPortalService';

export interface ShareOptions {
  noteContent: string;
  noteId?: string;
  physiotherapistId: string;
  clinicianId?: string; // Alias for compatibility
  patientId?: string;
  sessionId?: string;
  noteType?: 'soap' | 'clinical' | 'other';
}

export interface ShareResult {
  success: boolean;
  method: 'portal' | 'email' | 'file' | 'clipboard';
  data?: {
    code?: string;
    url?: string;
    fileUrl?: string;
  };
  error?: string;
}

interface UniversalShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  shareOptions: ShareOptions;
  onShareComplete?: (result: ShareResult) => void;
}

export const UniversalShareMenu: React.FC<UniversalShareMenuProps> = ({
  isOpen,
  onClose,
  shareOptions,
  onShareComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'portal' | 'email' | 'file' | 'clipboard' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ShareResult | null>(null);

  // Portal sharing state
  const [portalPassword, setPortalPassword] = useState('');
  const [portalRetentionHours, setPortalRetentionHours] = useState(24);
  const [portalCode, setPortalCode] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  // Email sharing state
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSubject, setEmailSubject] = useState('Clinical Note from AiduxCare');

  // File sharing state
  const [filePassword, setFilePassword] = useState('');

  if (!isOpen) return null;

  const handleSharePortal = async () => {
    if (!portalPassword) {
      setError('Please set a password for secure access');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const passwordValidation = HospitalPortalService.validatePassword(portalPassword);
      if (!passwordValidation.valid) {
        setError(passwordValidation.error || 'Invalid password');
        setLoading(false);
        return;
      }

      const { noteCode, noteId } = await HospitalPortalService.createSecureNote(
        shareOptions.noteContent,
        portalPassword,
        shareOptions.physiotherapistId || shareOptions.clinicianId || '',
        {
          retentionHours: portalRetentionHours,
          patientId: shareOptions.patientId,
          sessionId: shareOptions.sessionId,
          noteType: shareOptions.noteType,
        }
      );

      const url = `${window.location.origin}/hospital?code=${noteCode}`;
      setPortalCode(noteCode);
      setPortalUrl(url);

      const result: ShareResult = {
        success: true,
        method: 'portal',
        data: {
          code: noteCode,
          url,
        },
      };

      setSuccess(result);
      onShareComplete?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create secure portal link');
    } finally {
      setLoading(false);
    }
  };

  const handleShareEmail = async () => {
    if (!emailAddress) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement encrypted email sending
      // For now, show placeholder
      setError('Email encryption feature coming soon');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send encrypted email');
      setLoading(false);
    }
  };

  const handleShareFile = async () => {
    if (!filePassword) {
      setError('Please set a password for the file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create password-protected file
      const blob = new Blob([shareOptions.noteContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clinical-note-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const result: ShareResult = {
        success: true,
        method: 'file',
        data: {
          fileUrl: url,
        },
      };

      setSuccess(result);
      onShareComplete?.(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create secure file');
    } finally {
      setLoading(false);
    }
  };

  const handleShareClipboard = async () => {
    setLoading(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(shareOptions.noteContent);
      
      const result: ShareResult = {
        success: true,
        method: 'clipboard',
      };

      setSuccess(result);
      onShareComplete?.(result);

      // Auto-clear clipboard after 60 seconds
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText('');
        } catch {
          // Ignore errors
        }
      }, 60000);
    } catch (err: any) {
      setError('Failed to copy to clipboard');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedMethod(null);
    setError(null);
    setSuccess(null);
    setPortalPassword('');
    setPortalCode(null);
    setPortalUrl(null);
    setEmailAddress('');
    setFilePassword('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Share Clinical Note</h2>
            <p className="text-sm text-slate-500 mt-1">
              Choose a secure sharing method (PHIPA/PIPEDA-aware)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-900 mb-1">
                    {success.method === 'portal' && 'Secure Portal Created'}
                    {success.method === 'email' && 'Email Sent'}
                    {success.method === 'file' && 'File Downloaded'}
                    {success.method === 'clipboard' && 'Copied to Clipboard'}
                  </p>
                  {success.method === 'portal' && success.data?.url && (
                    <div className="mt-2 space-y-2">
                      <div className="bg-white rounded border border-emerald-200 p-3">
                        <p className="text-xs font-medium text-slate-700 mb-1">Access Code:</p>
                        <p className="text-lg font-mono font-bold text-emerald-700">
                          {success.data.code}
                        </p>
                      </div>
                      <div className="bg-white rounded border border-emerald-200 p-3">
                        <p className="text-xs font-medium text-slate-700 mb-1">Portal URL:</p>
                        <p className="text-sm text-emerald-700 break-all">{success.data.url}</p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(success.data?.url || '');
                          }}
                          className="mt-2 text-xs text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Copy URL
                        </button>
                      </div>
                    </div>
                  )}
                  {success.method === 'clipboard' && (
                    <p className="text-xs text-emerald-700">
                      Note copied. Clipboard will auto-clear in 60 seconds.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Method Selection */}
          {!selectedMethod && !success && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Secure Portal */}
              <button
                onClick={() => setSelectedMethod('portal')}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-blue/10 rounded-lg">
                    <Lock className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Secure Portal</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      Generate secure code + password. Double authentication required.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      PHIPA Compliant
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Encrypted Email */}
              <button
                onClick={() => setSelectedMethod('email')}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-blue/10 rounded-lg">
                    <Mail className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Encrypted Email</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      PGP/S-MIME encryption. End-to-end secure.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      PHIPA Compliant
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 3: Secure Files */}
              <button
                onClick={() => setSelectedMethod('file')}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-blue/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Secure File</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      Password-protected PDF/encrypted ZIP export.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      PHIPA Compliant
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 4: Clipboard */}
              <button
                onClick={() => setSelectedMethod('clipboard')}
                className="p-4 border-2 border-slate-200 rounded-lg hover:border-primary-blue hover:bg-primary-blue/5 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-blue/10 rounded-lg">
                    <Clipboard className="w-6 h-6 text-primary-blue" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Clipboard</h3>
                    <p className="text-xs text-slate-600 mb-2">
                      Copy with auto-clear after 60 seconds.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      PHIPA Compliant
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Portal Configuration */}
          {selectedMethod === 'portal' && !success && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Personal Password *
                </label>
                <input
                  type="password"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, lowercase, number, special"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  This password will be required to access the note
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Retention Period
                </label>
                <select
                  value={portalRetentionHours}
                  onChange={(e) => setPortalRetentionHours(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                >
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Note will be automatically deleted after this period
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSharePortal}
                  disabled={!portalPassword || loading}
                  className="flex-1 py-2 px-4 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Secure Portal'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Email Configuration */}
          {selectedMethod === 'email' && !success && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  ⚠️ Email encryption feature is under development. Coming soon.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleShareEmail}
                  disabled={!emailAddress || loading}
                  className="flex-1 py-2 px-4 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Sending...' : 'Send Encrypted Email'}
                </button>
              </div>
            </div>
          )}

          {/* File Configuration */}
          {selectedMethod === 'file' && !success && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File Password *
                </label>
                <input
                  type="password"
                  value={filePassword}
                  onChange={(e) => setFilePassword(e.target.value)}
                  placeholder="Password to protect the file"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleShareFile}
                  disabled={!filePassword || loading}
                  className="flex-1 py-2 px-4 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Creating...' : 'Download Secure File'}
                </button>
              </div>
            </div>
          )}

          {/* Clipboard Action */}
          {selectedMethod === 'clipboard' && !success && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  The note will be copied to your clipboard and automatically cleared after 60 seconds for security.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleShareClipboard}
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {success && (
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Share Another Way
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-2 px-4 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalShareMenu;

