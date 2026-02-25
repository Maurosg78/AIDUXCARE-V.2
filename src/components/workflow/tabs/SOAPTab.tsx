/**
 * SOAPTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles SOAP note generation and editing.
 * 
 * @compliance PHIPA compliant, ISO 27001 auditable
 */

import React, { useState, useCallback } from 'react';
import { FileText, Loader2, ClipboardList, AlertTriangle } from 'lucide-react';
import type { SOAPNote, SOAPStatus } from '../../../components/SOAPEditor';
import { SOAPEditor } from '../../../components/SOAPEditor';
import { ErrorMessage } from '../../ui/ErrorMessage';
import { SuccessMessage } from '../../ui/SuccessMessage';
import WorkflowMetricsDisplay from '../WorkflowMetricsDisplay';
import TranscriptArea from '../TranscriptArea';
import ErrorBoundary from '../../ErrorBoundary';
import type { WorkflowMetrics } from '../../../services/workflowMetricsService';
import type { VisitType } from '../../../core/soap/SOAPContextBuilder';
import type { ClinicalAnalysis } from '../../../utils/cleanVertexResponse';
import type { WorkflowRoute } from '../../../services/workflowRouterService';
import type { ClinicalAttachment } from '../../../services/clinicalAttachmentService';
import type { WhisperSupportedLanguage } from '../../../services/OpenAIWhisperService';
import { updateSOAPNoteRedFlags } from '../../../services/soapPartialUpdateService';
import type { RedFlagJustification } from '../../../services/soapPartialUpdateService';
import { Timestamp } from 'firebase/firestore';
import { useSession } from '../../../context/SessionContext';

export interface SOAPTabProps {
  // SOAP note state
  localSoapNote: SOAPNote | null;
  soapStatus: SOAPStatus;
  visitType: VisitType;
  isGeneratingSOAP: boolean;
  
  // Patient and session
  patientId: string;
  sessionId: string | null;
  
  // Handlers
  handleGenerateSoap: () => Promise<void>;
  handleSaveSOAP: (soap: SOAPNote, status: SOAPStatus) => Promise<void>;
  handleRegenerateSOAP: () => Promise<void>;
  handleFinalizeSOAP: (soap: SOAPNote) => Promise<void>;
  handleUnfinalizeSOAP: (soap: SOAPNote) => Promise<void>;
  setIsShareMenuOpen: (open: boolean) => void;
  
  // Workflow optimization
  workflowMetrics: WorkflowMetrics | null;
  workflowRoute: WorkflowRoute | null;
  soapTokenOptimization?: {
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  };
  
  // Context data
  niagaraResults: ClinicalAnalysis | null;
  transcript: string;
  physicalExamResults: any[];
  /** WO-001: Red flag justifications from Physical Evaluation step (pre-fill, no repeat) */
  redFlagsAcknowledgements?: Array<{ flagId: string; justification?: string }>;
  
  // Treatment reminder
  treatmentReminder: string | null;
  
  // Messages
  analysisError: string | null;
  successMessage: string | null;
  setAnalysisError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  
  // Visit type setter
  setVisitType: (type: VisitType) => void;
  
  // ✅ FOLLOW-UP WORKFLOW: Transcript input props for follow-up visits
  workflowRoute?: WorkflowRoute | null;
  recordingTime?: string;
  isRecording?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
  setTranscript?: (value: string) => void;
  transcriptError?: string | null;
  transcriptMeta?: {
    detectedLanguage?: string | null;
    averageLogProb?: number;
    durationSeconds?: number;
  } | null;
  languagePreference?: WhisperSupportedLanguage;
  setLanguagePreference?: (lang: WhisperSupportedLanguage) => void;
  mode?: 'live' | 'dictation';
  setMode?: (mode: 'live' | 'dictation') => void;
  isTranscribing?: boolean;
  isProcessing?: boolean;
  audioStream?: MediaStream | null;
  handleAnalyzeWithVertex?: () => Promise<void>;
  attachments?: ClinicalAttachment[];
  isUploadingAttachment?: boolean;
  attachmentError?: string | null;
  removingAttachmentId?: string | null;
  handleAttachmentUpload?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAttachmentRemove?: (attachment: ClinicalAttachment) => Promise<void>;
}

export const SOAPTab: React.FC<SOAPTabProps> = ({
  localSoapNote,
  soapStatus,
  visitType,
  isGeneratingSOAP,
  patientId,
  sessionId,
  handleGenerateSoap,
  handleSaveSOAP,
  handleRegenerateSOAP,
  handleFinalizeSOAP,
  handleUnfinalizeSOAP,
  setIsShareMenuOpen,
  workflowMetrics,
  workflowRoute,
  soapTokenOptimization,
  niagaraResults,
  transcript,
  physicalExamResults,
  redFlagsAcknowledgements,
  treatmentReminder,
  analysisError,
  successMessage,
  setAnalysisError,
  setSuccessMessage,
  setVisitType,
  // ✅ FOLLOW-UP WORKFLOW: Optional transcript input props
  recordingTime,
  isRecording,
  startRecording,
  stopRecording,
  setTranscript,
  transcriptError,
  transcriptMeta,
  languagePreference,
  setLanguagePreference,
  mode,
  setMode,
  isTranscribing,
  isProcessing,
  audioStream,
  handleAnalyzeWithVertex,
  attachments,
  isUploadingAttachment,
  attachmentError,
  removingAttachmentId,
  handleAttachmentUpload,
  handleAttachmentRemove,
}) => {
  const { sessionData, updateSessionData } = useSession();
  const redFlags = niagaraResults?.red_flags ?? [];
  
  // WO-002: State for red flags justifications added AFTER SOAP generation
  const [postSOAPJustifications, setPostSOAPJustifications] = useState<Record<string, string>>({});
  const [editingFlagId, setEditingFlagId] = useState<string | null>(null);

  // Find red flags without justification (from EvaluationTab or post-SOAP)
  const redFlagsWithoutJustification = redFlags
    .map((flag, index) => {
      const flagId = `rf_${index}`;
      const existingAck = redFlagsAcknowledgements?.find(a => a.flagId === flagId);
      const postSOAPJustif = postSOAPJustifications[flagId];
      return {
        flagId,
        flagText: flag,
        hasJustification: !!(existingAck?.justification || postSOAPJustif),
      };
    })
    .filter(rf => !rf.hasJustification);

  // WO-002: Handle red flag justification AFTER SOAP generation (partial update)
  const handlePostSOAPRedFlagJustification = useCallback(async (flagId: string, justification: string) => {
    if (!localSoapNote) return;

    try {
      // 1. Save justification to local state
      setPostSOAPJustifications(prev => ({ ...prev, [flagId]: justification }));
      setEditingFlagId(null);

      // 2. Update session data (for persistence)
      const existingAcknowledgements = sessionData?.analysis?.redFlagsAcknowledgements ?? [];
      const updatedAcknowledgements = [...existingAcknowledgements];
      const existingIndex = updatedAcknowledgements.findIndex(a => a.flagId === flagId);
      
      const flagIndex = parseInt(flagId.replace('rf_', ''));
      const flagTitle = redFlags[flagIndex] || flagId;
      
      const newAck = {
        flagId,
        acknowledged: true,
        acknowledgedAt: Timestamp.now(),
        decision: 'treat_with_monitoring' as const,
        justification,
        justifiedAt: Timestamp.now(),
      };

      if (existingIndex >= 0) {
        updatedAcknowledgements[existingIndex] = newAck;
      } else {
        updatedAcknowledgements.push(newAck);
      }

      updateSessionData('analysis', { redFlagsAcknowledgements: updatedAcknowledgements });

      // 3. WO-002: Partial update - only update red flags section, preserve user edits
      // Combine all justifications (from EvaluationTab + post-SOAP)
      const allJustifications = new Map<string, RedFlagJustification>();
      
      // Add existing justifications from EvaluationTab
      (redFlagsAcknowledgements ?? []).forEach(a => {
        if (a.justification) {
          const idx = parseInt(a.flagId.replace('rf_', ''));
          allJustifications.set(a.flagId, {
            flagId: a.flagId,
            flagTitle: redFlags[idx] || a.flagId,
            justification: a.justification,
            justifiedAt: Timestamp.now(),
          });
        }
      });
      
      // Add/update with new post-SOAP justification
      allJustifications.set(flagId, {
        flagId,
        flagTitle,
        justification,
        justifiedAt: Timestamp.now(),
      });
      
      const redFlagJustifications = Array.from(allJustifications.values());

      const updatedSOAP = updateSOAPNoteRedFlags(localSoapNote, redFlagJustifications);

      // 4. Save updated SOAP (preserves user manual edits)
      await handleSaveSOAP(updatedSOAP as SOAPNote, soapStatus);

      setSuccessMessage('Red flag justification added. SOAP note updated (your manual edits preserved).');
    } catch (error) {
      console.error('[SOAPTab] Error updating red flag justification:', error);
      setAnalysisError('Failed to update red flag justification. Please try again.');
    }
  }, [localSoapNote, redFlags, redFlagsAcknowledgements, sessionData, updateSessionData, handleSaveSOAP, soapStatus, setSuccessMessage, setAnalysisError]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-slate-900" />
          <div>
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">SOAP Note Generation</h2>
            <p className="text-sm text-slate-500">
              Generate professional SOAP notes from your clinical data. AI-assisted documentation.
            </p>
          </div>
        </div>
      </header>

      {/* ✅ WORKFLOW OPTIMIZATION: Display workflow metrics */}
      {workflowMetrics && workflowMetrics.workflowType === 'follow-up' && (
        <WorkflowMetricsDisplay metrics={workflowMetrics} />
      )}

      {/* Visit Type Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Visit Type
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="visitType"
                  value="initial"
                  checked={visitType === 'initial'}
                  onChange={(e) => setVisitType(e.target.value as VisitType)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700">Initial Assessment</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="visitType"
                  value="follow-up"
                  checked={visitType === 'follow-up'}
                  onChange={(e) => setVisitType(e.target.value as VisitType)}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700">Follow-up Visit</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment Reminder for Follow-up */}
      {treatmentReminder && visitType === 'follow-up' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <ClipboardList className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Treatment Plan Reminder
              </h3>
              <p className="text-sm text-blue-800">
                {treatmentReminder}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FOLLOW-UP WORKFLOW: Clinical Input Interface for Follow-up Visits */}
      {visitType === 'follow-up' && workflowRoute?.type === 'follow-up' && (!transcript || !transcript.trim()) && (
        <ErrorBoundary
          fallback={
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="text-sm text-red-700">
                There was an error loading the transcript input. Please refresh the page.
              </p>
            </div>
          }
        >
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Follow-up Visit Documentation</h3>
              <p className="text-sm text-slate-600">
                Document the follow-up visit content. Focus on progress assessment, treatment response, and any changes since the last visit.
              </p>
            </div>
            {recordingTime !== undefined && isRecording !== undefined && startRecording && stopRecording && 
             setTranscript && transcriptError !== undefined && transcriptMeta !== undefined &&
             languagePreference !== undefined && setLanguagePreference && mode !== undefined && setMode &&
             isTranscribing !== undefined && isProcessing !== undefined && audioStream !== undefined &&
             handleAnalyzeWithVertex && attachments !== undefined && isUploadingAttachment !== undefined &&
             attachmentError !== undefined && removingAttachmentId !== undefined &&
             handleAttachmentUpload && handleAttachmentRemove ? (
              <TranscriptArea
              recordingTime={recordingTime}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              transcript={transcript || ''}
              setTranscript={setTranscript}
              transcriptError={transcriptError}
              transcriptMeta={transcriptMeta}
              languagePreference={languagePreference}
              setLanguagePreference={setLanguagePreference}
              mode={mode}
              setMode={setMode}
              isTranscribing={isTranscribing}
              isProcessing={isProcessing}
              audioStream={audioStream}
              handleAnalyzeWithVertex={handleAnalyzeWithVertex}
              attachments={attachments}
              isUploadingAttachment={isUploadingAttachment}
              attachmentError={attachmentError}
              removingAttachmentId={removingAttachmentId}
              handleAttachmentUpload={handleAttachmentUpload}
              handleAttachmentRemove={handleAttachmentRemove}
              />
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  Transcript input interface is being initialized. Please wait...
                </p>
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* WO-001: Red flag justifications from Physical Evaluation — no repeat, pre-fill note */}
      {(niagaraResults?.red_flags?.length ?? 0) > 0 && (redFlagsAcknowledgements ?? []).some((a) => a.justification) ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-emerald-900 mb-2">Red flag justifications (from Physical Evaluation)</h3>
          <p className="text-xs text-emerald-800 mb-3">
            These justifications will be included in your SOAP note. To change them, go back to step 2.
          </p>
          <ul className="space-y-2">
            {(redFlagsAcknowledgements ?? [])
              .filter((a) => a.justification)
              .map((ack, i) => (
                <li key={ack.flagId} className="text-sm text-emerald-900 pl-3 border-l-2 border-emerald-300 italic">
                  {ack.justification}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {/* WO-REDFLAG-UX-TOP: Red flags without justification — gentle reminder, no duplicate form */}
      {localSoapNote && redFlagsWithoutJustification.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">
              {redFlagsWithoutJustification.length} red flag{redFlagsWithoutJustification.length > 1 ? 's' : ''} pending decision
            </h3>
          </div>
          <p className="text-xs text-amber-800">
            Go back to <strong>Physical Evaluation</strong> (Step 2) to record your decision for each red flag. Flags marked as &quot;Refer&quot; do not require a rationale.
          </p>
        </div>
      )}

      {/* REMOVED by WO-REDFLAG-UX-TOP: duplicate justification block — decisions captured once in EvaluationTab */}

      {/* Context Summary */}
      {niagaraResults && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Context Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500">Transcript</p>
              <p className="text-sm font-medium text-slate-900">{(transcript || '').split(/\s+/).filter(Boolean).length} words</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Red Flags</p>
              <p className="text-sm font-medium text-slate-900">{niagaraResults.red_flags?.length || 0} identified</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Physical Tests</p>
              <p className="text-sm font-medium text-slate-900">{physicalExamResults.length} completed</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Medications</p>
              <p className="text-sm font-medium text-slate-900">{niagaraResults.medicacion_actual?.length || 0} documented</p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button or SOAP Editor */}
      {!localSoapNote ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm text-slate-600 mb-2">No SOAP note generated yet</p>
            <p className="text-xs text-slate-500 mb-6">
              {visitType === 'follow-up' 
                ? 'Enter clinical content above and analyze, then generate SOAP note'
                : 'Complete the analysis and physical evaluation tabs, then generate a SOAP note'}
            </p>
            {/* ✅ FOLLOW-UP WORKFLOW: Show different requirements for follow-up */}
            {visitType === 'follow-up' && !niagaraResults && transcript && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  ⚠️ Please click "Analyze with AiduxCare AI" above to process your transcript before generating SOAP note.
                </p>
              </div>
            )}
            <button
              onClick={handleGenerateSoap}
              disabled={
                !niagaraResults || 
                (visitType !== 'follow-up' && physicalExamResults.length === 0) || 
                isGeneratingSOAP
              }
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-primary text-white font-medium shadow-sm hover:bg-gradient-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isGeneratingSOAP ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating SOAP Note...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate SOAP Note
                </>
              )}
            </button>
            {analysisError && (
              <ErrorMessage
                message={analysisError}
                onDismiss={() => setAnalysisError(null)}
                variant="inline"
                className="mt-4"
              />
            )}
            {successMessage && (
              <SuccessMessage
                message={successMessage}
                onDismiss={() => setSuccessMessage(null)}
                variant="inline"
                autoDismiss={5000}
                className="mt-4"
              />
            )}
          </div>
        </div>
      ) : (
        <SOAPEditor
          soap={localSoapNote}
          status={soapStatus}
          visitType={visitType}
          isGenerating={isGeneratingSOAP}
          patientId={patientId}
          sessionId={sessionId}
          onSave={handleSaveSOAP}
          onRegenerate={handleRegenerateSOAP}
          onFinalize={handleFinalizeSOAP}
          onUnfinalize={handleUnfinalizeSOAP}
          onPreview={(soap) => {
            console.log('[Workflow] Clinical note preview requested', soap);
          }}
          onShare={() => {
            setIsShareMenuOpen(true);
          }}
          // ✅ WORKFLOW OPTIMIZATION: Pass optimization props
          isOptimized={workflowRoute?.analysisLevel === 'optimized'}
          tokenOptimization={soapTokenOptimization}
        />
      )}
    </div>
  );
};

export default SOAPTab;


