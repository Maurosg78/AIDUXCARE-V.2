/**
 * AnalysisTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles patient information display, consent management, and clinical analysis.
 * 
 * @compliance PHIPA-aware (design goal), security audit logging
 */

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2, ChevronsRight } from 'lucide-react';
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

interface RedFlagDecision {
  decision: 'continue' | 'referral_stop' | 'referral_continue_partial';
  continuationNote?: string;
}

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
  // WO-BUG-008: Red flags — which ones the physio selected (for acceptance stats)
  selectedRedFlagIds: string[];
  onRedFlagSelectionChange: (ids: string[]) => void;
  redFlagsDetected?: Array<{ id: string; description: string; severity?: string }>;
  redFlagDecisions?: Record<string, RedFlagDecision>;
  onRedFlagDecisionChange?: (decisions: Record<string, RedFlagDecision>) => void;
  // WO-PART-C-REFERRAL-REPORT: Optional callback to trigger medical referral report generation
  onGenerateReferralReport?: () => void;
  // WO-REDFLAG-ANALYSIS-UI-001: Optional callback when follow-up red flag decisions are confirmed
  onConfirmFollowUpRedFlags?: () => void;
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
  analysisError,
  successMessage,
  setAnalysisError,
  setSuccessMessage,
  onTodayFocusChange,
  onFinishSession,
  hideHeader = false,
  todayFocusBlockRenderedByParent = false,
  resumeLoadFailed = null,
  selectedRedFlagIds,
  onRedFlagSelectionChange,
  redFlagsDetected = [],
  redFlagDecisions = {},
  onRedFlagDecisionChange,
  onGenerateReferralReport,
  onConfirmFollowUpRedFlags,
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

      {/* WO-REDFLAG-FOLLOWUP-003: Single source of truth for red flags = interactiveResults.redFlags (from alerts.red_flags). No fallback from SOAP assessment. */}
      {visitType === 'follow-up' ? (
        interactiveResults?.redFlags?.length > 0 ? (
          <>
            {console.log('[ANALYSIS-TAB] Rendering red flag decision block')}
            {/* WO-BUG-008 / WO-PART-B-REDFLAG-DECISION: Red flags — physio selects which apply + per-flag clinical decision */}
            {interactiveResults?.redFlags?.length > 0 && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-3">🚨 Red flags detected — clinical decision required</h3>
                <p className="text-xs text-slate-700 mb-3">
                  Before accessing the SOAP note, document your clinical decision for each red flag.
                </p>
                <div className="space-y-3">
                  {(interactiveResults.redFlags as (string | { label: string; evidence?: string; suggested_action?: string; urgency?: string })[]).map((flag, idx) => {
                    const id = typeof flag === 'string' ? flag : (flag?.label ?? `red-${idx}`);
                    const label = typeof flag === 'string' ? flag : (flag?.label ?? '');
                    const evidence = typeof flag === 'object' && flag && 'evidence' in flag ? (flag as { evidence?: string }).evidence : undefined;
                    const suggestedAction = typeof flag === 'object' && flag && 'suggested_action' in flag ? (flag as { suggested_action?: string }).suggested_action : undefined;
                    const urgency = typeof flag === 'object' && flag && 'urgency' in flag ? (flag as { urgency?: string }).urgency : undefined;
                    const isChecked = selectedRedFlagIds.includes(id);
                    const urgencyBadgeClass = urgency === 'immediate' ? 'bg-red-600 text-white' : urgency === 'today' ? 'bg-amber-500 text-white' : urgency === 'monitor' ? 'bg-slate-500 text-white' : '';
                    return (
                      <label
                        key={`redflag-${idx}-${id}`}
                        className="flex flex-col gap-2 rounded-lg border border-red-200 bg-white p-3 cursor-pointer hover:bg-red-50/50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = isChecked ? selectedRedFlagIds.filter((x) => x !== id) : [...selectedRedFlagIds, id];
                              onRedFlagSelectionChange(next);
                            }}
                            className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-red-900">{label}</span>
                            {urgency && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${urgencyBadgeClass}`}>{urgency}</span>
                            )}
                            {evidence && <p className="mt-1 text-xs text-slate-600">{evidence}</p>}
                            {suggestedAction && <p className="mt-0.5 text-xs text-slate-500 italic">Suggested: {suggestedAction}</p>}
                          </div>
                        </div>

                        {isChecked && (
                          <div className="mt-2 ml-7 space-y-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-slate-700">
                                Clinical decision for this red flag:
                              </label>
                              <div className="flex flex-col gap-1">
                                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`decision-${id}`}
                                    value="continue"
                                    checked={redFlagDecisions[id]?.decision === 'continue'}
                                    onChange={() =>
                                      onRedFlagDecisionChange?.({
                                        ...redFlagDecisions,
                                        [id]: { decision: 'continue' },
                                      })
                                    }
                                  />
                                  Continue — does not alter treatment plan
                                </label>

                                <label className="flex items-center gap-2 text-xs text-red-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`decision-${id}`}
                                    value="referral_stop"
                                    checked={redFlagDecisions[id]?.decision === 'referral_stop'}
                                    onChange={() =>
                                      onRedFlagDecisionChange?.({
                                        ...redFlagDecisions,
                                        [id]: { decision: 'referral_stop' },
                                      })
                                    }
                                  />
                                  Referral + Stop — generate report, pause physiotherapy
                                </label>

                                <label className="flex items-center gap-2 text-xs text-amber-700 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`decision-${id}`}
                                    value="referral_continue_partial"
                                    checked={redFlagDecisions[id]?.decision === 'referral_continue_partial'}
                                    onChange={() =>
                                      onRedFlagDecisionChange?.({
                                        ...redFlagDecisions,
                                        [id]: {
                                          decision: 'referral_continue_partial',
                                          continuationNote: redFlagDecisions[id]?.continuationNote,
                                        },
                                      })
                                    }
                                  />
                                  Referral + Continue partially — generate report, continue safe modalities
                                </label>

                                {(redFlagDecisions[id]?.decision === 'referral_continue_partial' ||
                                  redFlagDecisions[id]?.decision === 'continue') && (
                                  <textarea
                                    className="mt-1 w-full text-xs border border-amber-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                                    rows={2}
                                    placeholder="Clinical justification (required when continuing with monitoring or partial physiotherapy)."
                                    value={redFlagDecisions[id]?.continuationNote ?? ''}
                                    onChange={(e) =>
                                      onRedFlagDecisionChange?.({
                                        ...redFlagDecisions,
                                        [id]: {
                                          decision: redFlagDecisions[id]?.decision ?? 'continue',
                                          continuationNote: e.target.value,
                                        },
                                      })
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                {(() => {
                  const flags = (interactiveResults.redFlags as (string | { label?: string })[]) || [];
                  const allDecided = flags.length > 0 && flags.every((flag, idx) => {
                    const id = typeof flag === 'string' ? flag : (flag?.label ?? `red-${idx}`);
                    return !!redFlagDecisions[id]?.decision;
                  });
                  const allJustified = flags.every((flag, idx) => {
                    const id = typeof flag === 'string' ? flag : (flag?.label ?? `red-${idx}`);
                    const decision = redFlagDecisions[id]?.decision;
                    if (decision === 'continue' || decision === 'referral_continue_partial') {
                      return Boolean(redFlagDecisions[id]?.continuationNote?.trim());
                    }
                    return true;
                  });
                  const canConfirm = allDecided && allJustified;
                  return (
                    <button
                      type="button"
                      disabled={!canConfirm}
                      onClick={() => onConfirmFollowUpRedFlags?.()}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                        canConfirm
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Confirm decisions and proceed to SOAP
                    </button>
                  );
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            Generate your SOAP note in the Documentation section below. No separate analysis step — follow-up uses baseline, treatments, and clinical notes only.
          </div>
        )
      ) : niagaraResults && interactiveResults ? (
        <>
          {/* WO-BUG-008 / WO-PART-B-REDFLAG-DECISION: Red flags — physio selects which apply + per-flag clinical decision */}
          {interactiveResults?.redFlags?.length > 0 && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-3">⚠️ Red Flags detected</h3>
              <div className="space-y-3">
                {(interactiveResults.redFlags as (string | { label: string; evidence?: string; suggested_action?: string; urgency?: string })[]).map((flag, idx) => {
                  const id = typeof flag === 'string' ? flag : (flag?.label ?? `red-${idx}`);
                  const label = typeof flag === 'string' ? flag : (flag?.label ?? '');
                  const evidence = typeof flag === 'object' && flag && 'evidence' in flag ? (flag as { evidence?: string }).evidence : undefined;
                  const suggestedAction = typeof flag === 'object' && flag && 'suggested_action' in flag ? (flag as { suggested_action?: string }).suggested_action : undefined;
                  const urgency = typeof flag === 'object' && flag && 'urgency' in flag ? (flag as { urgency?: string }).urgency : undefined;
                  const isChecked = selectedRedFlagIds.includes(id);
                  const urgencyBadgeClass = urgency === 'immediate' ? 'bg-red-600 text-white' : urgency === 'today' ? 'bg-amber-500 text-white' : urgency === 'monitor' ? 'bg-slate-500 text-white' : '';
                  return (
                    <label
                      key={`redflag-${idx}-${id}`}
                      className="flex flex-col gap-2 rounded-lg border border-red-200 bg-white p-3 cursor-pointer hover:bg-red-50/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked ? selectedRedFlagIds.filter((x) => x !== id) : [...selectedRedFlagIds, id];
                            onRedFlagSelectionChange(next);
                          }}
                          className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-red-900">{label}</span>
                          {urgency && (
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${urgencyBadgeClass}`}>{urgency}</span>
                          )}
                          {evidence && <p className="mt-1 text-xs text-slate-600">{evidence}</p>}
                          {suggestedAction && <p className="mt-0.5 text-xs text-slate-500 italic">Suggested: {suggestedAction}</p>}
                        </div>
                      </div>

                      {isChecked && (
                        <div className="mt-2 ml-7 space-y-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-700">
                              Clinical decision for this red flag:
                            </label>
                            <div className="flex flex-col gap-1">
                              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`decision-${id}`}
                                  value="continue"
                                  checked={redFlagDecisions[id]?.decision === 'continue'}
                                  onChange={() =>
                                    onRedFlagDecisionChange?.({
                                      ...redFlagDecisions,
                                      [id]: { decision: 'continue' },
                                    })
                                  }
                                  />
                                  Continue physiotherapy with monitoring
                                </label>

                                <label className="flex items-center gap-2 text-xs text-red-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`decision-${id}`}
                                  value="referral_stop"
                                  checked={redFlagDecisions[id]?.decision === 'referral_stop'}
                                  onChange={() =>
                                    onRedFlagDecisionChange?.({
                                      ...redFlagDecisions,
                                      [id]: { decision: 'referral_stop' },
                                    })
                                  }
                                  />
                                  Refer to specialist — stop physiotherapy treatment
                                </label>

                                <label className="flex items-center gap-2 text-xs text-amber-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`decision-${id}`}
                                  value="referral_continue_partial"
                                  checked={redFlagDecisions[id]?.decision === 'referral_continue_partial'}
                                  onChange={() =>
                                    onRedFlagDecisionChange?.({
                                      ...redFlagDecisions,
                                      [id]: {
                                        decision: 'referral_continue_partial',
                                        continuationNote: redFlagDecisions[id]?.continuationNote,
                                      },
                                    })
                                  }
                                  />
                                  Refer to specialist — continue partial physiotherapy
                                </label>

                                {(redFlagDecisions[id]?.decision === 'referral_continue_partial' ||
                                  redFlagDecisions[id]?.decision === 'continue') && (
                                <textarea
                                  className="mt-1 w-full text-xs border border-amber-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                                  rows={2}
                                    placeholder="Clinical justification (required when continuing with monitoring or partial physiotherapy)."
                                  value={redFlagDecisions[id]?.continuationNote ?? ''}
                                  onChange={(e) =>
                                    onRedFlagDecisionChange?.({
                                      ...redFlagDecisions,
                                      [id]: {
                                        decision: 'referral_continue_partial',
                                        continuationNote: e.target.value,
                                      },
                                    })
                                  }
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {Object.values(redFlagDecisions).some((d) => d.decision === 'referral_stop') && (
                <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-300 text-xs text-red-800 font-medium">
                  ⛔ A medical referral report will be generated. Physiotherapy treatment will be paused pending specialist response.
                </div>
              )}

              {Object.values(redFlagDecisions).some(
                (d) =>
                  d.decision === 'referral_stop' || d.decision === 'referral_continue_partial'
              ) && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onGenerateReferralReport?.()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition shadow-sm"
                  >
                    <span>📋</span>
                    <span>Generate Medical Referral Report</span>
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-600">
                Select the red flags relevant to this case. All detected flags are recorded for clinical quality tracking.
              </p>
            </div>
          )}
          {/* WO-REDFLAG-FOLLOWUP-003: SoT — if follow-up and red flags already shown above, do not show duplicate block below */}
          {!(visitType === 'follow-up' && (interactiveResults?.redFlags?.length ?? 0) > 0) && (
            <div className="mt-4">
              <ClinicalAnalysisResults
                results={interactiveResults}
                selectedIds={selectedEntityIds}
                onSelectionChange={setSelectedEntityIds}
                visitType={visitType}
                selectedRedFlagIds={selectedRedFlagIds}
                redFlagsDetected={redFlagsDetected}
              />
            </div>
          )}

          {/* WO-BUTTON-POSITION-001: physical tests info + Continue button at end of tab */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-600">
                Select the physical tests you plan to perform. You can edit or add items before moving to the next step.
              </p>
            </div>
            <button
              onClick={continueToEvaluation}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-apple text-[15px] font-medium"
            >
              <ChevronsRight className="w-4 h-4" />
              Continue to physical evaluation
            </button>
            {/* WO-P2-PHYSICAL-GATE-UNBLOCK-001: warning when tests suggested but none selected — no block */}
            {(interactiveResults.physicalTests?.length ?? 0) > 0 &&
              !selectedEntityIds.some((id) => id.startsWith('physical-')) && (
              <p className="mt-2 text-xs text-amber-700">
                No physical tests selected. You can continue and add tests in the evaluation step.
              </p>
            )}
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


