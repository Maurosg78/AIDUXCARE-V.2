/**
 * Documents & Forms Modal
 * 
 * Provides access to WSIB/MVA form generators from Command Center
 * Sprint 2B: Document Templates - Integration
 */

import React, { useState, useEffect } from 'react';
import { X, FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Patient } from '@/services/patientService';
import { WSIBFormGenerator } from '@/components/WSIBFormGenerator';
import { MVAFormGenerator } from '@/components/MVAFormGenerator';
import { CertificateFormGenerator } from '@/components/CertificateFormGenerator';
import type { SOAPNote } from '@/types/vertex-ai';
import type { Session } from '@/services/sessionComparisonService';
import { useAuth } from '@/hooks/useAuth';
import { useProfessionalProfile } from '@/context/ProfessionalProfileContext';
import PatientService from '@/services/patientService';
import PersistenceService, { SavedNote } from '@/services/PersistenceService';
import logger from '@/shared/utils/logger';

interface DocumentsFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

type FormCategory = 'wsib' | 'mva' | 'certificate' | null;

export const DocumentsFormsModal: React.FC<DocumentsFormsModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const { user } = useAuth();
  const { profile: professionalProfile } = useProfessionalProfile();
  const [selectedCategory, setSelectedCategory] = useState<FormCategory>(null);
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentNotes, setRecentNotes] = useState<SavedNote[]>([]);

  // Load recent SOAP notes for this patient
  useEffect(() => {
    if (isOpen && patient) {
      loadRecentNotes();
    }
  }, [isOpen, patient]);

  const loadRecentNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allNotes = await PersistenceService.getAllNotes();
      const patientNotes = allNotes
        .filter(note => note.patientId === patient.id)
        .sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5); // Get 5 most recent
      
      setRecentNotes(patientNotes);
      
      // Auto-select most recent note if available
      if (patientNotes.length > 0) {
        const mostRecent = patientNotes[0];
        convertNoteToSOAP(mostRecent);
      }
    } catch (err) {
      logger.error('Error loading recent notes:', err);
      setError('Failed to load recent SOAP notes. Please generate a SOAP note first.');
    } finally {
      setLoading(false);
    }
  };

  const convertNoteToSOAP = (note: SavedNote) => {
    try {
      const soap: SOAPNote = {
        subjective: note.soapData.subjective || '',
        objective: note.soapData.objective || '',
        assessment: note.soapData.assessment || '',
        plan: note.soapData.plan || '',
      };
      
      setSoapNote(soap);
      
      // Create a minimal session object
      const sessionData: Session = {
        id: note.sessionId || note.id,
        patientId: note.patientId,
        createdAt: new Date(note.createdAt),
        type: 'followup', // Default, could be improved
        soapNote: soap,
      };
      
      setSession(sessionData);
    } catch (err) {
      logger.error('Error converting note to SOAP:', err);
      setError('Failed to process SOAP note');
    }
  };

  const handleNoteSelect = (note: SavedNote) => {
    convertNoteToSOAP(note);
  };

  const handleGeneratePDF = (formType: string, pdfBlob: Blob) => {
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formType}-${patient.id}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.info('PDF generated and downloaded:', formType);
  };

  if (!isOpen) return null;

  // If no SOAP note available, show message
  if (!soapNote && !loading && recentNotes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Documents & Forms</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No SOAP Notes Available
            </h3>
            <p className="text-slate-600 mb-4">
              You need to generate a SOAP note first before creating WSIB/MVA forms or certificates.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show category selection or form generator
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Documents & Forms</h2>
            <p className="text-sm text-slate-500 mt-1">
              {patient.fullName || `${patient.firstName} ${patient.lastName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="ml-3 text-slate-600">Loading recent SOAP notes...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          ) : selectedCategory === null ? (
            /* Category Selection */
            <div className="space-y-4">
              {/* SOAP Note Selector */}
              {recentNotes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select SOAP Note:
                  </label>
                  <select
                    onChange={(e) => {
                      const note = recentNotes.find(n => n.id === e.target.value);
                      if (note) handleNoteSelect(note);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    defaultValue={recentNotes[0]?.id}
                  >
                    {recentNotes.map((note) => (
                      <option key={note.id} value={note.id}>
                        {new Date(note.createdAt).toLocaleDateString('en-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* WSIB */}
                <button
                  onClick={() => setSelectedCategory('wsib')}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">WSIB Forms</h3>
                  <p className="text-xs text-slate-600">
                    Form 8, Form 9, Form 26, Progress Reports
                  </p>
                </button>

                {/* MVA */}
                <button
                  onClick={() => setSelectedCategory('mva')}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">MVA Forms</h3>
                  <p className="text-xs text-slate-600">
                    OCF-18, OCF-19, OCF-23
                  </p>
                </button>

                {/* Certificates */}
                <button
                  onClick={() => setSelectedCategory('certificate')}
                  className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <FileText className="w-8 h-8 text-indigo-600 mb-2" />
                  <h3 className="font-semibold text-slate-900 mb-1">Certificates</h3>
                  <p className="text-xs text-slate-600">
                    Return-to-Work, Medical, Fitness, Disability
                  </p>
                </button>
              </div>
            </div>
          ) : soapNote && session ? (
            /* Form Generator */
            <div>
              {/* Back Button */}
              <button
                onClick={() => setSelectedCategory(null)}
                className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                ← Back to Categories
              </button>

              {/* Render appropriate generator */}
              {selectedCategory === 'wsib' && (
                <WSIBFormGenerator
                  soapNote={soapNote}
                  session={session}
                  patientData={patient}
                  professionalData={professionalProfile || {}}
                  onGenerate={handleGeneratePDF}
                  onClose={() => setSelectedCategory(null)}
                />
              )}
              
              {selectedCategory === 'mva' && (
                <MVAFormGenerator
                  soapNote={soapNote}
                  session={session}
                  patientData={patient}
                  professionalData={professionalProfile || {}}
                  onGenerate={handleGeneratePDF}
                  onClose={() => setSelectedCategory(null)}
                />
              )}
              
              {selectedCategory === 'certificate' && (
                <CertificateFormGenerator
                  soapNote={soapNote}
                  session={session}
                  patientData={patient}
                  professionalData={professionalProfile || {}}
                  onGenerate={handleGeneratePDF}
                  onClose={() => setSelectedCategory(null)}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

