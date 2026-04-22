/**
 * AnalysisTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles patient information display, consent management, and clinical analysis.
 * 
 * @compliance PHIPA-aware (design goal), security audit logging
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertCircle, Loader2, ChevronsRight, Brain } from 'lucide-react';
import { isSpainPilot } from '@/core/pilotDetection';
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
import { filterTrivialRedFlagEntries, normalizeRedFlagsForDisplay } from '@/utils/normalizeRedFlagsForDisplay';
import { trackRedFlagAccepted } from '../../../services/analytics/AnalyticsEvents';
import type { AsyncState } from '../../../features/command-center/hooks/useUserProfile';

/** Strings aligned with TranscriptArea follow-up Vertex CTA (pilot-aware). */
const FOLLOW_UP_VERTEX_CTA = isSpainPilot()
  ? {
      analyzingBtnFollowUp: 'Generando nota de seguimiento…',
      analyzeBtnFollowUp: 'Generar nota de seguimiento',
    }
  : {
      analyzingBtnFollowUp: 'Generating follow-up note...',
      analyzeBtnFollowUp: 'Generate Follow-up Note',
    };

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

interface DismissedRedFlagEntry {
  timestamp: string;
  note: string;
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
  lastEncounter: AsyncState<any>;
  isFirstSession: boolean | null;
  formatLastSessionDate: (encounter: any) => string | null;
  
  // Visit and session type
  visitType: VisitType;
  visitCount: AsyncState<number>;
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
  isGeneratingSOAP?: boolean;
  audioStream: MediaStream | null;
  handleAnalyzeWithVertex: () => Promise<void>;
  attachments: ClinicalAttachment[];
  isUploadingAttachment: boolean;
  attachmentError: string | null;
  removingAttachmentId: string | null;
  handleAttachmentUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAttachmentRemove: (attachment: ClinicalAttachment) => Promise<void>;
  handleAttachmentReviewedToggle?: (attachmentId: string) => void;
  
  // Analysis results
  niagaraResults: ClinicalAnalysis | null;
  interactiveResults: any;
  selectedEntityIds: string[];
  setSelectedEntityIds: (ids: string[]) => void;
  onEditedResultsChange?: (editedResults: any) => void;
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
  /** When true, parent renders TranscriptArea (e.g. follow-up "How patient arrives" block); skip duplicate here */
  hideTranscriptArea?: boolean;
  /** When follow-up captures transcript externally, allow rendering the generate button even if TranscriptArea is hidden. */
  followUpHasContent?: boolean;
  /** When resume failed (session not found), show recovery links to the note or history view. */
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
  isGeneratingSOAP,
  audioStream,
  handleAnalyzeWithVertex,
  attachments,
  isUploadingAttachment,
  attachmentError,
  removingAttachmentId,
  handleAttachmentUpload,
  handleAttachmentRemove,
  handleAttachmentReviewedToggle,
  niagaraResults,
  interactiveResults,
  selectedEntityIds,
  setSelectedEntityIds,
  onEditedResultsChange,
  continueToEvaluation,
  analysisError,
  successMessage,
  setAnalysisError,
  setSuccessMessage,
  onTodayFocusChange,
  onFinishSession,
  hideHeader = false,
  todayFocusBlockRenderedByParent = false,
  hideTranscriptArea = false,
  followUpHasContent = false,
  resumeLoadFailed = null,
  selectedRedFlagIds,
  onRedFlagSelectionChange,
  redFlagsDetected = [],
  redFlagDecisions = {},
  onRedFlagDecisionChange,
  onGenerateReferralReport,
  onConfirmFollowUpRedFlags,
}) => {
  const { t } = useTranslation();
  const rawRedFlagsFromInteraction = interactiveResults?.redFlags;
  const normalizedRedFlagsRaw = useMemo(
    () => normalizeRedFlagsForDisplay(rawRedFlagsFromInteraction),
    [rawRedFlagsFromInteraction]
  );
  const filteredRedFlagsForRender = useMemo(
    () => filterTrivialRedFlagEntries(normalizedRedFlagsRaw),
    [normalizedRedFlagsRaw]
  );
  const [dismissedRedFlags, setDismissedRedFlags] = useState<Record<string, DismissedRedFlagEntry>>({});
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);
  const [dismissNote, setDismissNote] = useState('');
  const getRedFlagId = (
    flag: string | { label?: string },
    idx: number
  ): string => {
    const stringFlag = typeof flag === 'string' ? flag : null;
    if (stringFlag) {
      return stringFlag;
    }
    const objectFlag = typeof flag === 'string' ? null : flag;
    const objectLabel = objectFlag?.label;
    const fallbackId = `red-${idx}`;
    const resolvedId = objectLabel ?? fallbackId;
    return resolvedId;
  };
  const visibleRedFlagsForRender = useMemo(() => {
    const nextVisibleFlags = filteredRedFlagsForRender.filter((flag, idx) => {
      const flagId = getRedFlagId(flag as string | { label?: string }, idx);
      const dismissalEntry = dismissedRedFlags[flagId];
      const isDismissed = dismissalEntry != null;
      return !isDismissed;
    });
    return nextVisibleFlags;
  }, [filteredRedFlagsForRender, dismissedRedFlags]);
  const redFlagsRenderCount = visibleRedFlagsForRender.length;
  const shouldShowRedFlagsBlock = redFlagsRenderCount > 0;

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
      let planInput: string | { inClinicText?: string | null; homeProgramText?: string | null; planText?: string | null } | null = null;
      
      // Prioridad: previousTreatmentPlan > lastEncounter.soap.plan
      if (previousTreatmentPlan?.inClinicText) {
        planInput = previousTreatmentPlan;
        console.info('[WO-05-FIX][PROOF] Using previousTreatmentPlan.inClinicText as source');
      } else if (previousTreatmentPlan?.planText) {
        planInput = previousTreatmentPlan.planText;
        console.info('[WO-05-FIX][PROOF] Using previousTreatmentPlan.planText as source');
      } else if (lastEncounter.data?.soap?.plan) {
        planInput = lastEncounter.data.soap.plan;
        console.info('[WO-05-FIX][PROOF] Using lastEncounter.soap.plan as source');
      }
      
      const planTextLength = typeof planInput === 'string'
        ? planInput.length
        : (planInput?.inClinicText ?? planInput?.planText ?? '').length;
      if (planInput && planTextLength > 0) {
        const parsed = parsePlanToFocusItems(planInput);
        
        console.info(
          '[WO-05-FIX][PROOF] todayFocus initialized from treatmentPlan',
          {
            source: previousTreatmentPlan ? 'previousTreatmentPlan' : 'lastEncounter',
            planTextLength,
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
  }, [
    visitType,
    lastEncounter.data?.soap?.plan,
    previousTreatmentPlan?.inClinicText,
    previousTreatmentPlan?.homeProgramText,
    previousTreatmentPlan?.planText,
  ]);

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
            {t('workflow.title')}
          </h1>
          <p className="text-lg text-slate-500 font-light leading-[1.3] font-apple">
            {t('workflow.subtitle')}
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
            {t('workflow.analysis.followUpConversation')}
          </h2>
          <p className="text-sm text-blue-700 mb-3">
            {t('workflow.analysis.followUpConversationBody')}
          </p>
        </div>
      )}

      {/* WO-06.4: Patient context moved to Section 1 (ProfessionalWorkflowPage).
          AnalysisTab now only contains the unified clinical input (Follow-up clinical update).
          Removed duplicate patient context, last session, and "Today's Plan" sections. */}

      {!hideTranscriptArea ? (
        <>
          <TranscriptArea
            recordingTime={recordingTime}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            transcript={transcript}
            setTranscript={setTranscript}
            additionalNotes={physioNotes}
            setAdditionalNotes={setPhysioNotes}
            transcriptError={transcriptError}
            transcriptMeta={transcriptMeta}
            languagePreference={languagePreference}
            setLanguagePreference={setLanguagePreference}
            mode={mode}
            setMode={setMode}
            isTranscribing={isTranscribing}
            isProcessing={isProcessing}
            isGeneratingSOAP={isGeneratingSOAP}
            visitType={visitType}
            audioStream={audioStream}
            handleAnalyzeWithVertex={handleAnalyzeWithVertex}
            attachments={attachments}
            isUploadingAttachment={isUploadingAttachment}
            attachmentError={attachmentError}
            removingAttachmentId={removingAttachmentId}
            handleAttachmentUpload={handleAttachmentUpload}
            handleAttachmentRemove={handleAttachmentRemove}
            handleAttachmentReviewedToggle={handleAttachmentReviewedToggle}
          />

          {isTranscribing && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === 'dictation' ? 'Processing dictation audio...' : 'Processing live audio sample...'}
            </div>
          )}
        </>
      ) : null}

      {/* WO-FU-GENERATE-BTN: follow-up may capture transcript outside AnalysisTab; keep SOAP trigger visible when content exists */}
      {hideTranscriptArea && followUpHasContent && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button
            onClick={handleAnalyzeWithVertex}
            disabled={isProcessing || isGeneratingSOAP}
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition font-apple text-[15px] font-medium"
          >
            {(isProcessing || isGeneratingSOAP) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {FOLLOW_UP_VERTEX_CTA.analyzingBtnFollowUp}
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                {FOLLOW_UP_VERTEX_CTA.analyzeBtnFollowUp}
              </>
            )}
          </button>
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
                {t('workflow.analysis.backToPatientHistory')}
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
        shouldShowRedFlagsBlock ? (
          <>
            {console.log('[ANALYSIS-TAB] Rendering red flag decision block')}
            {/* WO-BUG-008 / WO-PART-B-REDFLAG-DECISION: Red flags — physio selects which apply + per-flag clinical decision */}
            {(
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-3">{t('workflow.analysis.redFlagsDetectedTitle')}</h3>
                <p className="text-xs text-slate-700 mb-3">
                  {t('workflow.analysis.redFlagsDetectedBody')}
                </p>
                <div className="space-y-3">
                  {(visibleRedFlagsForRender as (string | { label: string; evidence?: string; suggested_action?: string; urgency?: string })[]).map((flag, idx) => {
                    const id = getRedFlagId(flag, idx);
                    const label = typeof flag === 'string' ? flag : (flag?.label ?? '');
                    const evidence = typeof flag === 'object' && flag && 'evidence' in flag ? (flag as { evidence?: string }).evidence : undefined;
                    const suggestedAction = typeof flag === 'object' && flag && 'suggested_action' in flag ? (flag as { suggested_action?: string }).suggested_action : undefined;
                    const urgency = typeof flag === 'object' && flag && 'urgency' in flag ? (flag as { urgency?: string }).urgency : undefined;
                    const isChecked = selectedRedFlagIds.includes(id);
                    const isDismissTarget = dismissTargetId === id;
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
                              const shouldTrackAcceptance = !isChecked;
                              if (shouldTrackAcceptance) {
                                void trackRedFlagAccepted({ visitType });
                              }
                              onRedFlagSelectionChange(next);
                            }}
                            className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-medium text-red-900">{label}</span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDismissTargetId(id);
                                  setDismissNote('');
                                }}
                                className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                              >
                                Eliminar
                              </button>
                            </div>
                            {urgency && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${urgencyBadgeClass}`}>{urgency}</span>
                            )}
                            {evidence && <p className="mt-1 text-xs text-slate-600">{evidence}</p>}
                            {suggestedAction && <p className="mt-0.5 text-xs text-slate-500 italic">{t('workflow.analysis.suggestedAction', { action: suggestedAction })}</p>}
                          </div>
                        </div>

                        {isDismissTarget && (
                          <div className="ml-7 mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                            <textarea
                              className="w-full text-xs border border-slate-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                              rows={2}
                              placeholder="Justificación opcional — para tu protección clínica"
                              value={dismissNote}
                              onChange={(event) => {
                                const nextDismissNote = event.target.value;
                                setDismissNote(nextDismissNote);
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const dismissalTimestamp = new Date().toISOString();
                                  const dismissalNote = dismissNote;
                                  const nextDismissedRedFlags = {
                                    ...dismissedRedFlags,
                                    [id]: {
                                      timestamp: dismissalTimestamp,
                                      note: dismissalNote,
                                    },
                                  };
                                  const nextSelectedRedFlagIds = selectedRedFlagIds.filter((flagId) => flagId !== id);
                                  const nextRedFlagDecisions = { ...redFlagDecisions };
                                  delete nextRedFlagDecisions[id];
                                  setDismissedRedFlags(nextDismissedRedFlags);
                                  onRedFlagSelectionChange(nextSelectedRedFlagIds);
                                  onRedFlagDecisionChange?.(nextRedFlagDecisions);
                                  setDismissTargetId(null);
                                  setDismissNote('');
                                }}
                                className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                              >
                                Confirmar eliminación
                              </button>
                            </div>
                          </div>
                        )}

                        {isChecked && (
                          <div className="mt-2 ml-7 space-y-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-slate-700">
                                {t('workflow.analysis.redFlag.clinicalDecision')}
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
                                  <span className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-700">
                                      {t('workflow.analysis.redFlag.options.continue')}
                                    </span>
                                    <span className="text-xs text-slate-500 block mt-0.5">
                                      Ej: sintomatología conocida y documentada, bajo control farmacológico, en seguimiento médico activo, informada al médico derivador.
                                    </span>
                                  </span>
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
                                  {t('workflow.analysis.redFlag.options.referralStop')}
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
                                  {t('workflow.analysis.redFlag.options.referralContinue')}
                                </label>

                                {(redFlagDecisions[id]?.decision === 'referral_continue_partial' ||
                                  redFlagDecisions[id]?.decision === 'continue') && (
                                  <textarea
                                    className="mt-1 w-full text-xs border border-amber-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                                    rows={2}
                                    placeholder={t('workflow.analysis.redFlag.justificationPlaceholder')}
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
              <div className="mt-4 flex justify-end">
                {(() => {
                  const flags = visibleRedFlagsForRender as (string | { label?: string })[];
                  const allDecided = flags.length > 0 && flags.every((flag, idx) => {
                    const flagId = getRedFlagId(flag, idx);
                    const hasDecision = !!redFlagDecisions[flagId]?.decision;
                    return hasDecision;
                  });
                  const allJustified = flags.every((flag, idx) => {
                    const flagId = getRedFlagId(flag, idx);
                    const decision = redFlagDecisions[flagId]?.decision;
                    if (decision === 'continue' || decision === 'referral_continue_partial') {
                      const continuationNote = redFlagDecisions[flagId]?.continuationNote?.trim();
                      const hasContinuationNote = Boolean(continuationNote);
                      return hasContinuationNote;
                    }
                    return true;
                  });
                  const canConfirm = allDecided && allJustified;
                  const hasReferralStop = Object.values(redFlagDecisions).some((d) => d.decision === 'referral_stop');
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
                      {hasReferralStop ? t('workflow.analysis.generateReferralReport') : t('workflow.analysis.confirmDecisions')}
                    </button>
                  );
                })()}
              </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
            {t('workflow.analysis.generateSoapHint')}
          </div>
        )
      ) : niagaraResults && interactiveResults ? (
        <>
          {/* WO-BUG-008 / WO-PART-B-REDFLAG-DECISION: Red flags — physio selects which apply + per-flag clinical decision */}
          {shouldShowRedFlagsBlock ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-3">⚠️ Red Flags detected</h3>
              <div className="space-y-3">
                {(visibleRedFlagsForRender as (string | { label: string; evidence?: string; suggested_action?: string; urgency?: string })[]).map((flag, idx) => {
                  const id = getRedFlagId(flag, idx);
                  const label = typeof flag === 'string' ? flag : (flag?.label ?? '');
                  const evidence = typeof flag === 'object' && flag && 'evidence' in flag ? (flag as { evidence?: string }).evidence : undefined;
                  const suggestedAction = typeof flag === 'object' && flag && 'suggested_action' in flag ? (flag as { suggested_action?: string }).suggested_action : undefined;
                  const urgency = typeof flag === 'object' && flag && 'urgency' in flag ? (flag as { urgency?: string }).urgency : undefined;
                  const isChecked = selectedRedFlagIds.includes(id);
                  const isDismissTarget = dismissTargetId === id;
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
                            const shouldTrackAcceptance = !isChecked;
                            if (shouldTrackAcceptance) {
                              void trackRedFlagAccepted({ visitType });
                            }
                            onRedFlagSelectionChange(next);
                          }}
                          className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-medium text-red-900">{label}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setDismissTargetId(id);
                                setDismissNote('');
                              }}
                              className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                            >
                              Eliminar
                            </button>
                          </div>
                          {urgency && (
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${urgencyBadgeClass}`}>{urgency}</span>
                          )}
                          {evidence && <p className="mt-1 text-xs text-slate-600">{evidence}</p>}
                          {suggestedAction && <p className="mt-0.5 text-xs text-slate-500 italic">{t('workflow.analysis.suggestedAction', { action: suggestedAction })}</p>}
                        </div>
                      </div>

                      {isDismissTarget && (
                        <div className="ml-7 mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <textarea
                            className="w-full text-xs border border-slate-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                            rows={2}
                            placeholder="Justificación opcional — para tu protección clínica"
                            value={dismissNote}
                            onChange={(event) => {
                              const nextDismissNote = event.target.value;
                              setDismissNote(nextDismissNote);
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const dismissalTimestamp = new Date().toISOString();
                                const dismissalNote = dismissNote;
                                const nextDismissedRedFlags = {
                                  ...dismissedRedFlags,
                                  [id]: {
                                    timestamp: dismissalTimestamp,
                                    note: dismissalNote,
                                  },
                                };
                                const nextSelectedRedFlagIds = selectedRedFlagIds.filter((flagId) => flagId !== id);
                                const nextRedFlagDecisions = { ...redFlagDecisions };
                                delete nextRedFlagDecisions[id];
                                setDismissedRedFlags(nextDismissedRedFlags);
                                onRedFlagSelectionChange(nextSelectedRedFlagIds);
                                onRedFlagDecisionChange?.(nextRedFlagDecisions);
                                setDismissTargetId(null);
                                setDismissNote('');
                              }}
                              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-white hover:bg-slate-800 transition"
                            >
                              Confirmar eliminación
                            </button>
                          </div>
                        </div>
                      )}

                      {isChecked && (
                        <div className="mt-2 ml-7 space-y-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-slate-700">
                              {t('workflow.analysis.redFlag.clinicalDecision')}
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
                                  <span className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-700">
                                      {t('workflow.analysis.redFlag.options.continue')}
                                    </span>
                                    <span className="text-xs text-slate-500 block mt-0.5">
                                      Ej: sintomatología conocida y documentada, bajo control farmacológico, en seguimiento médico activo, informada al médico derivador.
                                    </span>
                                  </span>
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
                                  {t('workflow.analysis.redFlag.options.referralStop')}
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
                                  {t('workflow.analysis.redFlag.options.referralContinue')}
                                </label>

                                {(redFlagDecisions[id]?.decision === 'referral_continue_partial' ||
                                  redFlagDecisions[id]?.decision === 'continue') && (
                                <textarea
                                  className="mt-1 w-full text-xs border border-amber-200 rounded p-2 text-slate-700 placeholder:text-slate-400"
                                  rows={2}
                                    placeholder={t('workflow.analysis.redFlag.justificationPlaceholder')}
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

              {Object.values(redFlagDecisions).some((d) => d.decision === 'referral_stop') && (
                <div className="mt-3 p-3 rounded-lg bg-red-100 border border-red-300 text-xs text-red-800 font-medium">
                  {t('workflow.analysis.referralWarning')}
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
                    <span>{t('workflow.analysis.generateReferralReport')}</span>
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-slate-600">
                {t('workflow.analysis.redFlagsHint')}
              </p>
            </div>
          ) : null}
          {/* WO-REDFLAG-FOLLOWUP-003: SoT — if follow-up and red flags already shown above, do not show duplicate block below */}
          {!((visitType as VisitType) === 'follow-up' && shouldShowRedFlagsBlock) && (
            <div className="mt-4">
              <ClinicalAnalysisResults
                results={interactiveResults}
                selectedIds={selectedEntityIds}
                onSelectionChange={setSelectedEntityIds}
                onEditedResultsChange={onEditedResultsChange}
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
                {t('workflow.evaluation.addTestsHint')}
              </p>
            </div>
            <button
              onClick={continueToEvaluation}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-apple text-[15px] font-medium"
            >
              <ChevronsRight className="w-4 h-4" />
              {t('workflow.analysis.continueToEvaluation')}
            </button>
            {/* WO-P2-PHYSICAL-GATE-UNBLOCK-001: warning when tests suggested but none selected — no block */}
            {(interactiveResults.physicalTests?.length ?? 0) > 0 &&
              !selectedEntityIds.some((id) => id.startsWith('physical-')) && (
              <p className="mt-2 text-xs text-amber-700">
                {t('workflow.analysis.noTestsSelectedWarning')}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {t('workflow.analysis.runAnalysisEmptyState')}
        </div>
      )}
    </div>
  );
};

export default AnalysisTab;
