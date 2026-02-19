/**
 * AnalysisTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles patient information display, consent management, and clinical analysis.
 * 
 * @compliance PHIPA-aware (design goal), security audit logging
 */

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2, ChevronsRight, AlertTriangle } from 'lucide-react';
import type { Patient } from '../../../services/patientService';
import type { ClinicalAnalysis } from '../../../utils/cleanVertexResponse';
import { ClinicalAnalysisResults } from '../../ClinicalAnalysisResults';
import { ErrorMessage } from '../../ui/ErrorMessage';
import { SuccessMessage } from '../../ui/SuccessMessage';
import TranscriptArea from '../TranscriptArea';
import type { ClinicalAttachment } from '../../../services/clinicalAttachmentService';
import type { WhisperSupportedLanguage } from '../../../services/OpenAIWhisperService';
import { PatientConsentService } from '../../../services/patientConsentService';
import type { User } from 'firebase/auth';
import type { VisitType } from '../../../core/soap/SOAPContextBuilder';
import type { WorkflowRoute } from '../../../services/workflowRouterService';
import { SuggestedFocusEditor } from '../SuggestedFocusEditor';
import { parsePlanToFocusItems, type TodayFocusItem } from '../../../utils/parsePlanToFocus';

const demoPatient = {
  id: "CA-TEST-001",
  name: "Sofia Bennett",
  email: "sofia.bennett@example.com",
  phone: "+18777804236",
  province: "Ontario",
  specialty: "Physiotherapy",
};

export interface AnalysisTabProps {
  // Patient data
  currentPatient: Patient | null;
  patientIdFromUrl: string | null;
  
  // Clinical info
  patientClinicalInfo: {
    allergies: string[] | null;
    contraindications: string[] | null;
  };
  calculateAge: (dateOfBirth: string | Date | undefined) => number | null;
  
  // Consent management
  consentStatus: 'ongoing' | 'session-only' | 'declined' | null;
  consentPending: boolean;
  consentToken: string | null;
  consentLink: string | null;
  smsError: string | null;
  user: User | null;
  setConsentStatus: (status: 'ongoing' | 'session-only' | 'declined' | null) => void;
  setPatientHasConsent: (hasConsent: boolean) => void;
  setConsentPending: (pending: boolean) => void;
  setSmsError: (error: string | null) => void;
  handleCopyConsentLink: () => Promise<void>;
  handleResendConsentSMS: () => Promise<void>;
  
  // Session data
  lastEncounter: {
    loading: boolean;
    error: any;
    data: any;
  };
  isFirstSession: boolean | null;
  formatLastSessionDate: (encounter: any) => string | null;
  
  // Visit and session type
  visitType: VisitType;
  visitCount: {
    loading: boolean;
    data: number | null;
  };
  sessionTypeConfig: {
    label: string;
  };
  
  // Treatment plan
  previousTreatmentPlan: any;
  setIsInitialPlanModalOpen: (open: boolean) => void;
  
  // Physio notes
  physioNotes: string;
  setPhysioNotes: (notes: string) => void;
  
  // Transcript area props
  recordingTime: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  transcript: string;
  setTranscript: (value: string) => void;
  transcriptError: string | null;
  transcriptMeta?: {
    detectedLanguage?: string | null;
    averageLogProb?: number;
    durationSeconds?: number;
  } | null;
  languagePreference: WhisperSupportedLanguage;
  setLanguagePreference: (lang: WhisperSupportedLanguage) => void;
  mode: 'live' | 'dictation';
  setMode: (mode: 'live' | 'dictation') => void;
  isTranscribing: boolean;
  isProcessing: boolean;
  audioStream: MediaStream | null;
  handleAnalyzeWithVertex: () => Promise<void>;
  attachments: ClinicalAttachment[];
  isUploadingAttachment: boolean;
  attachmentError: string | null;
  removingAttachmentId: string | null;
  handleAttachmentUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAttachmentRemove: (attachment: ClinicalAttachment) => Promise<void>;
  
  // Analysis results
  niagaraResults: ClinicalAnalysis | null;
  interactiveResults: any;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  continueToEvaluation: () => void;
  
  /** WO-001: Red flags from analysis — require acknowledgement before continuing */
  redFlags?: string[];
  redFlagsAcknowledgements?: Record<string, { decision: 'refer' | 'treat_with_monitoring'; justification?: string }>;
  setRedFlagsAcknowledgements?: (value: Record<string, { decision: 'refer' | 'treat_with_monitoring'; justification?: string }>) => void;
  
  // Messages
  analysisError: string | null;
  successMessage: string | null;
  setAnalysisError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  
  // WO-FLOW-005: Callback opcional para exponer focos editables al contexto de SOAP
  onTodayFocusChange?: (focus: TodayFocusItem[]) => void;
  // WO-FLOW-005: Callback para cambiar a tab SOAP al finalizar sesión
  onFinishSession?: () => void;
  // WO-06: Ocultar header para layout vertical único
  hideHeader?: boolean;
  // WO-FU-PLAN-SPLIT-01: Si true, el parent ya muestra In-Clinic + HEP; no duplicar "Today's treatment session"
  todayFocusBlockRenderedByParent?: boolean;
  /** When resume failed (session not found), show links to view note or go back to Patient History */
  resumeLoadFailed?: { sessionId: string; patientId: string } | null;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  currentPatient,
  patientIdFromUrl,
  patientClinicalInfo,
  calculateAge,
  consentStatus,
  consentPending,
  consentToken,
  consentLink,
  smsError,
  user,
  setConsentStatus,
  setPatientHasConsent,
  setConsentPending,
  setSmsError,
  handleCopyConsentLink,
  handleResendConsentSMS,
  lastEncounter,
  isFirstSession,
  formatLastSessionDate,
  visitType,
  visitCount,
  sessionTypeConfig,
  previousTreatmentPlan,
  setIsInitialPlanModalOpen,
  physioNotes,
  setPhysioNotes,
  recordingTime,
  isRecording,
  startRecording,
  stopRecording,
  transcript,
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
  niagaraResults,
  interactiveResults,
  selectedEntityIds,
  setSelectedEntityIds,
  continueToEvaluation,
  redFlags = [],
  redFlagsAcknowledgements = {},
  setRedFlagsAcknowledgements,
  analysisError,
  successMessage,
  setAnalysisError,
  setSuccessMessage,
  onTodayFocusChange,
  onFinishSession,
  hideHeader = false,
  todayFocusBlockRenderedByParent = false,
  resumeLoadFailed = null,
}) => {
  // WO-FLOW-005: Estado local para focos clínicos editables
  const [todayFocus, setTodayFocus] = useState<TodayFocusItem[]>([]);
  
  // Exponer cambios de focos al padre (para contexto de SOAP)
  const handleFocusChange = (focus: TodayFocusItem[]) => {
    setTodayFocus(focus);
    onTodayFocusChange?.(focus);
  };

  // WO-05-FIX: Mapping explícito del treatment plan a todayFocus (solo follow-up; initial assessment no usa este bloque)
  useEffect(() => {
    if (visitType === 'follow-up') {
      let planText: string | null = null;
      
      // Prioridad: previousTreatmentPlan > lastEncounter.soap.plan
      if (previousTreatmentPlan?.planText) {
        planText = previousTreatmentPlan.planText;
        console.info('[WO-05-FIX][PROOF] Using previousTreatmentPlan.planText as source');
      } else if (lastEncounter.data?.soap?.plan) {
        planText = lastEncounter.data.soap.plan;
        console.info('[WO-05-FIX][PROOF] Using lastEncounter.soap.plan as source');
      }
      
      if (planText && planText.trim().length > 0) {
        const parsed = parsePlanToFocusItems(planText);
        
        console.info(
          '[WO-05-FIX][PROOF] todayFocus initialized from treatmentPlan',
          {
            source: previousTreatmentPlan ? 'previousTreatmentPlan' : 'lastEncounter',
            planTextLength: planText.length,
            parsedCount: parsed.length,
            items: parsed.map(item => ({ id: item.id, label: item.label, completed: item.completed }))
          }
        );
        
        setTodayFocus(parsed);
      } else {
        console.info('[WO-05-FIX][PROOF] No planText found, todayFocus remains empty');
        setTodayFocus([]);
      }
    } else {
      // Reset en initial assessment
      setTodayFocus([]);
    }
  }, [visitType, lastEncounter.data?.soap?.plan, previousTreatmentPlan?.planText]);

  // WO-05-FIX: Log solo cuando este tab realmente renderiza "Today's treatment session" (follow-up; parent no muestra ya In-Clinic+HEP)
  useEffect(() => {
    if (visitType === 'follow-up' && !todayFocusBlockRenderedByParent && todayFocus.length > 0) {
      console.info(
        '[WO-05-FIX][PROOF] Rendering Today\'s treatment session (AnalysisTab)',
        { count: todayFocus.length, items: todayFocus.map(i => ({ id: i.id, label: i.label, completed: i.completed })) }
      );
    }
  }, [visitType, todayFocusBlockRenderedByParent, todayFocus]);

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-[-0.02em] leading-[1.1] font-apple mb-3">
            Professional Workflow
          </h1>
          <p className="text-lg text-slate-500 font-light leading-[1.3] font-apple">
            Canada · Patient data stored under PHIPA/PIPEDA controls · Clinical AI processing verified.
          </p>
        </header>
      )}

      {/* WO-FLOW-005 / WO-FU-PLAN-SPLIT-01: Suggested Focus Editor (solo si parent no muestra ya In-Clinic + HEP) */}
      {visitType === 'follow-up' && !todayFocusBlockRenderedByParent && todayFocus.length > 0 && (
        <SuggestedFocusEditor
          items={todayFocus}
          onChange={handleFocusChange}
          onFinishSession={onFinishSession}
        />
      )}

      {/* ✅ FOLLOW-UP: Header específico para follow-up conversation (sin duplicación de focus) */}
      {visitType === 'follow-up' && !todayFocusBlockRenderedByParent && todayFocus.length === 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Follow-up Conversation
          </h2>
          <p className="text-sm text-blue-700 mb-3">
            Record your conversation with the patient about their progress since last visit. 
            Focus on changes, what they can do now, and what's still limiting them.
          </p>
        </div>
      )}

      {/* WO-06.4: Patient context moved to Section 1 (ProfessionalWorkflowPage).
          AnalysisTab now only contains the unified clinical input (Follow-up clinical update).
          Removed duplicate patient context, last session, and "Today's Plan" sections. */}

      <TranscriptArea
        recordingTime={recordingTime}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        transcript={transcript}
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
        visitType={visitType}
      />

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {mode === 'dictation' ? 'Processing dictation audio...' : 'Processing live audio sample...'}
        </div>
      )}

      {analysisError && (
        <>
          <ErrorMessage
            message={analysisError}
            onDismiss={() => setAnalysisError(null)}
            variant="inline"
            className="mt-4"
          />
          {resumeLoadFailed && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <a
                href={`/notes/${resumeLoadFailed.sessionId}`}
                className="text-brand-in-600 hover:text-brand-in-700 font-medium underline"
              >
                View as saved note
              </a>
              <span className="text-slate-400">|</span>
              <a
                href={`/patients/${resumeLoadFailed.patientId}/history`}
                className="text-brand-in-600 hover:text-brand-in-700 font-medium underline"
              >
                Back to Patient History
              </a>
            </div>
          )}
        </>
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

      {/* Follow-up path: no highlights, no biopsychosocial, no physical tests. Only SOAP from Documentation. */}
      {visitType === 'follow-up' ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          Generate your SOAP note in the Documentation section below. No separate analysis step — follow-up uses baseline, treatments, and clinical notes only.
        </div>
      ) : niagaraResults && interactiveResults ? (
        <>
          <div className="mt-4">
            <ClinicalAnalysisResults
              results={interactiveResults}
              selectedIds={selectedEntityIds}
              onSelectionChange={setSelectedEntityIds}
              visitType={visitType}
            />
          </div>
          {/* WO-001: Red flags acknowledgement — capture justification before Physical Evaluation */}
          {redFlags.length > 0 && setRedFlagsAcknowledgements && (
            <div className="mt-4 p-4 border-2 border-amber-500 bg-amber-50 rounded-xl">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900">Red flags detected</h4>
                  <p className="text-sm text-amber-800 mt-1">
                    Acknowledge each finding and decide how to proceed. If treating with monitoring, provide your clinical justification.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {redFlags.map((flag) => {
                  const ack = redFlagsAcknowledgements[flag];
                  const decision = ack?.decision;
                  const justification = ack?.justification ?? '';
                  const needsJustification = decision === 'treat_with_monitoring' && justification.trim().length < 20;
                  return (
                    <div key={flag} className="p-3 bg-white rounded-lg border border-amber-200">
                      <h5 className="font-medium text-amber-900 mb-2">{flag}</h5>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setRedFlagsAcknowledgements((prev) => ({
                            ...prev,
                            [flag]: { decision: 'refer' },
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            decision === 'refer'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Refer to specialist
                        </button>
                        <button
                          type="button"
                          onClick={() => setRedFlagsAcknowledgements((prev) => ({
                            ...prev,
                            [flag]: { decision: 'treat_with_monitoring', justification: prev[flag]?.justification ?? '' },
                          }))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            decision === 'treat_with_monitoring'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Treat with monitoring
                        </button>
                      </div>
                      {decision === 'treat_with_monitoring' && (
                        <div>
                          <label className="block text-xs font-medium text-amber-900 mb-1">
                            Clinical justification (required, min 20 characters):
                          </label>
                          <textarea
                            value={justification}
                            onChange={(e) => setRedFlagsAcknowledgements((prev) => ({
                              ...prev,
                              [flag]: { decision: 'treat_with_monitoring', justification: e.target.value },
                            }))}
                            placeholder="Explain your clinical reasoning for proceeding with treatment..."
                            rows={3}
                            className="w-full px-3 py-2 border border-amber-300 rounded text-sm"
                          />
                          {needsJustification && (
                            <p className="text-xs text-amber-700 mt-1">Minimum 20 characters required</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            This justification will be included in your SOAP note.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-600">
                Select the physical tests you plan to perform. You can edit or add items before moving to the next step.
              </p>
            </div>
            <button
              onClick={continueToEvaluation}
              disabled={
                ((interactiveResults.physicalTests?.length ?? 0) > 0 &&
                  !selectedEntityIds.some((id) => id.startsWith("physical-"))) ||
                (redFlags.length > 0 &&
                  !redFlags.every((flagId) => {
                    const ack = redFlagsAcknowledgements[flagId];
                    if (!ack) return false;
                    if (ack.decision === 'refer') return true;
                    if (ack.decision === 'treat_with_monitoring') return (ack.justification?.trim?.()?.length ?? 0) >= 20;
                    return false;
                  }))
              }
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm hover:from-primary-blue-hover hover:to-primary-purple-hover disabled:bg-slate-300 disabled:text-slate-100 disabled:shadow-none disabled:cursor-not-allowed transition font-apple text-[15px] font-medium"
            >
              <ChevronsRight className="w-4 h-4" />
              Continue to physical evaluation
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Run the analysis to unlock AI insights, patient safety checks, and suggested physical evaluations.
        </div>
      )}
    </div>
  );
};

export default AnalysisTab;


