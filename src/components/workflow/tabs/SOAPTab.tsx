/**
 * SOAPTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles SOAP note generation and editing.
 * 
 * @compliance PHIPA-aware (design goal), security audit logging
 */

import React from 'react';
import { FileText, Loader2, ClipboardList } from 'lucide-react';
import type { SOAPNote } from '../../../types/vertex-ai';
import type { SOAPStatus } from '../../../components/SOAPEditor';
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


