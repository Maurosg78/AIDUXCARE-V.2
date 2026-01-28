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
      {/* WO-07: Simplificado - solo header mínimo para follow-up */}
      {visitType === 'follow-up' ? (
        // Follow-up: header mínimo, sin ruido
        <div className="text-center py-4">
          <h2 className="text-xl font-semibold text-slate-900">SOAP Note</h2>
          <p className="text-sm text-slate-500 mt-1">Review and finalize your documentation</p>
        </div>
      ) : (
        // Initial: mantener header completo
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
      )}

      {/* ✅ WORKFLOW OPTIMIZATION: Display workflow metrics (solo initial) */}
      {workflowMetrics && workflowMetrics.workflowType === 'follow-up' && visitType !== 'follow-up' && (
        <WorkflowMetricsDisplay metrics={workflowMetrics} />
      )}

      {/* WO-07: Visit Type Selector ELIMINADO - ya está decidido en Patient context */}
      
      {/* WO-07: Treatment Plan Reminder ELIMINADO - duplicado, info ya está en Today's treatment session */}
      
      {/* WO-06.3: Eliminado bloque "Follow-up Visit Documentation" duplicado.
          En follow-up, el input único está en "Follow-up clinical update" (AnalysisTab).
          Este bloque (SOAPTab) solo muestra preview de SOAP generado, NO acepta input. */}

      {/* WO-07: Context Summary ELIMINADO - ruido innecesario para piloto */}

      {/* WO-07: Botón Generate SOAP al final de página (NO sticky) - fuerza a llegar al final */}
      {!localSoapNote ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm text-slate-600 mb-2">No SOAP note generated yet</p>
            {visitType === 'follow-up' ? (
              <p className="text-xs text-slate-500 mb-6">
                Complete your clinical update above, then generate SOAP note.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mb-6">
                Complete the analysis and physical evaluation tabs, then generate a SOAP note.
              </p>
            )}
            {/* WO-07: Botón Generate SOAP al final de página (no sticky) */}
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


