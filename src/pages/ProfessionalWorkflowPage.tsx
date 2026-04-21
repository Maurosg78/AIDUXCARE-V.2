import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Play, Square, Mic, Loader2, CheckCircle, Download, Copy, Brain, Stethoscope, ClipboardList, ChevronsRight, AlertCircle, UploadCloud, Paperclip, X, Users, Plus, Info, LogOut, ArrowLeft, FileText } from "lucide-react";
import type { WhisperSupportedLanguage } from "../services/OpenAIWhisperService";
import { useSharedWorkflowState } from "../hooks/useSharedWorkflowState";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import sessionService from "../services/sessionService";
import { useAuth } from "../hooks/useAuth";
import { useProfessionalProfile as useProfessionalProfileContext } from "../context/ProfessionalProfileContext";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import { filterTrivialRedFlagEntries, normalizeRedFlagsForDisplay } from "../utils/normalizeRedFlagsForDisplay";
import type { SOAPNote } from "../types/vertex-ai";
import { ClinicalAnalysisResults } from "../components/ClinicalAnalysisResults";
import ClinicalAttachmentService, { ClinicalAttachment } from "../services/clinicalAttachmentService";
import { FileProcessorService } from "../services/FileProcessorService";
import { matchTestName } from "@/core/msk-tests/matching/fuzzyMatch";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";
import { buildSOAPContext, detectVisitType, validateSOAPContext, type VisitType } from "../core/soap/SOAPContextBuilder";
import { generateSOAPNote as generateSOAPNoteFromService, generateFollowUpAnalysis, deriveSOAPDataFromRawText } from "../services/vertex-ai-soap-service";
import { getClinicalState } from "../services/clinicalStateService";
import { buildPhysicalExamResults, buildPhysicalEvaluationSummary } from "../core/soap/PhysicalExamResultBuilder";
import { organizeSOAPData, validateUnifiedData, createDataSummary, type UnifiedClinicalData } from "../core/soap/SOAPDataOrganizer";
import { AnalyticsService } from "../services/analyticsService";
import { checkConsentViaServer } from "../services/consentServerService";
import {
  getConsentLanguageForJurisdiction,
  getConsentVersionForPortal,
  VerbalConsentService,
} from "../services/verbalConsentService";
import { SMSService } from "../services/smsService";
import { PatientConsentService } from "../services/patientConsentService";
import { resolveConsentChannel } from "@/domain/consent/resolveConsentChannel";
import { getCurrentJurisdiction } from "@/core/consent/consentJurisdiction";
import { isSpainPilot } from "@/core/pilotDetection";
import { ConsentVerificationService } from "../services/consentVerificationService";
import { PatientService, type Patient } from "../services/patientService";
import { useSearchParams, useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import treatmentPlanService from "../services/treatmentPlanService";
import PersistenceService, { type SavedNote } from "../services/PersistenceService";
import { encountersRepo } from "../repositories/encountersRepo";
import { FeedbackWidget } from "../components/feedback/FeedbackWidget";
import { FeedbackService } from "../services/feedbackService";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { SuccessMessage } from "../components/ui/SuccessMessage";
import { LoadingSpinner, InlineLoading } from "../components/ui/LoadingSpinner";
import { InitialPlanModal } from "../components/treatment-plan/InitialPlanModal";
import UniversalShareMenu, { ShareOptions } from "../components/share/UniversalShareMenu";
import { VerbalConsentModal } from "../components/consent/VerbalConsentModal";
import { ConsentGateScreen } from "../components/consent/ConsentGateScreen";
import { DeclinedConsentModal } from "../components/consent/DeclinedConsentModal";
import {
  MSK_TEST_LIBRARY,
  regions,
  regionLabels,
  type MSKRegion,
  type MskTestDefinition,
  type PhysicalTest,
  type TestFieldDefinition,
  hasFieldDefinitions,
  getTestDefinition,
} from "@/core/msk-tests/library/mskTestLibrary";
import { localizeMskTestForEs } from "@/core/msk-tests/library/mskTestLibrary.es";
import { sortPhysicalTestsByImportance, getTopPhysicalTests } from "@/utils/sortPhysicalTestsByImportance";
import { deriveClinicName, deriveClinicianDisplayName } from "@/utils/clinicProfile";
import { getTimeBasedGreeting } from "@/utils/timeGreeting";
import { getSessionOrdinalLabel } from "@/utils/sessionOrdinalLabel";
import { AudioWaveform } from "../components/AudioWaveform";
import SessionComparison from "../components/SessionComparison";
import { SessionComparisonService, type Session } from "../services/sessionComparisonService";
import { PatientTrajectoryMemoryService } from "../services/patientTrajectoryMemoryService";
import { FollowUpClinicalContextService, type FollowUpClinicalContext } from "../services/followUpClinicalContextService";
import { getAuth, signOut } from "firebase/auth";
import { Timestamp, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import tokenTrackingService from "../services/tokenTrackingService";
import logger from "@/shared/utils/logger";
import { useLastEncounter } from "../features/patient-dashboard/hooks/useLastEncounter";
import { useActiveEpisode } from "../features/patient-dashboard/hooks/useActiveEpisode";
import { usePatientVisitCount } from "../features/patient-dashboard/hooks/usePatientVisitCount";
import { SessionTypeService } from "../services/sessionTypeService";
import { getPublicBaseUrl } from "../utils/urlHelpers";
import { SessionStorage } from "../services/session-storage";
import { createBaseline, createBaselineFromMinimalSOAP } from "../services/clinicalBaselineService";
import { CloseInitialAssessmentConfirmModal } from "../components/workflow/CloseInitialAssessmentConfirmModal";
import { setSessionCompleted } from "@/features/command-center/todayListSessionStorage";
import ReferralReportModal from "../components/ReferralReportModal";
import CertificateEsModal from "../components/CertificateEsModal";
import type { ReferralReportData } from "../services/referralReportGenerator";
import { generateBaselineSOAPFromFreeText } from "../services/vertex-ai-soap-service";
// FIX 1: WorkflowSelector commented out - system auto-detects Initial vs Follow-up
// import WorkflowSelector, { type WorkflowSelectorProps } from "../components/workflow/WorkflowSelector";
import { routeWorkflow, shouldSkipTab, getInitialTab, type WorkflowRoute } from "../services/workflowRouterService";
import type { FollowUpDetectionInput } from "../services/followUpDetectionService";
import WorkflowFeedback from "../components/workflow/WorkflowFeedback";
import {
  trackWorkflowSessionStart,
  trackSOAPGeneration,
  trackUserClick,
  trackWorkflowSessionEnd,
  getWorkflowEfficiencySummary,
  type WorkflowMetrics
} from "../services/workflowMetricsService";
import {
  trackSessionStarted,
  trackSessionCompleted,
  trackSOAPGenerationStarted,
  trackSOAPGenerationCompleted,
  trackRecordingStarted,
  trackRecordingStopped,
  trackTranscriptionStarted,
  trackTranscriptionCompleted,
  trackTranscriptionFailed,
  trackAnalysisRequested,
  trackAnalysisCompleted,
  trackAnalysisFailed,
  trackEvaluationPhaseEntered,
  trackEvaluationTestSelected,
  trackEvaluationTestCompleted,
  trackEvaluationCompleted,
  trackSOAPFinalized,
  trackError,
} from "@/services/analytics/AnalyticsEvents";
import { lazy, Suspense } from "react";
import type { TodayFocusItem } from "../utils/parsePlanToFocus";
import { SuggestedFocusEditor } from "../components/workflow/SuggestedFocusEditor";
import TranscriptArea from "../components/workflow/TranscriptArea";
import { derivePlanFromText } from "../utils/derivePlanFromText";
import {
  buildSoapReviewMetadata,
  buildValueMetricsEvent,
} from "@/features/workflow/finalization/finalizationAnalytics";

// ✅ ISO COMPLIANCE: Lazy load heavy components for better performance and memory management
const AnalysisTab = lazy(() => import("../components/workflow/tabs/AnalysisTab").then(m => ({ default: m.default })));
const EvaluationTab = lazy(() => import("../components/workflow/tabs/EvaluationTab").then(m => ({ default: m.default })));
const SOAPTab = lazy(() => import("../components/workflow/tabs/SOAPTab").then(m => ({ default: m.default })));

type ActiveTab = "analysis" | "evaluation" | "soap";

// Workflow state persistence key
const WORKFLOW_STORAGE_KEY = (patientId: string) => `aidux_workflow_${patientId}`;

type EvaluationResult = "normal" | "positive" | "negative" | "inconclusive";

type EvaluationTestEntry = {
  id: string;
  name: string;
  region: MSKRegion | null;
  source: "ai" | "manual" | "custom";
  description?: string;
  result: EvaluationResult;
  notes: string;
  values?: Record<string, number | string | boolean | null>; // NEW: specific field values
  _prefillDefaults?: Record<string, number | null>; // Internal: track pre-filled normal values
};

const demoPatient = {
  id: "CA-TEST-001",
  name: "Sofia Bennett",
  email: "sofia.bennett@example.com",
  phone: "+18777804236", // Twilio Virtual Phone number for testing (E.164 format)
  province: "Ontario",
  specialty: "Physiotherapy",
};

const RESULT_LABELS: Record<EvaluationResult, string> = {
  normal: "Normal",
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
};

const RESULT_OPTIONS: EvaluationResult[] = ["normal", "positive", "negative", "inconclusive"];

const isValidResult = (value: any): value is EvaluationResult =>
  value === "normal" || value === "positive" || value === "negative" || value === "inconclusive";

const sanitizeSource = (value: any): EvaluationTestEntry["source"] =>
  value === "ai" || value === "custom" ? value : "manual";

const isLibraryTestDefinition = (
  value: MskTestDefinition | PhysicalTest | null | undefined
): value is MskTestDefinition => {
  return Boolean(value && 'normalTemplate' in value);
};

const sanitizeEvaluationEntry = (
  entry: Partial<EvaluationTestEntry> & { id: string; name: string }
): EvaluationTestEntry => ({
  id: entry.id,
  name: entry.name,
  region: entry.region ?? null,
  source: sanitizeSource(entry.source),
  description: entry.description,
  result: isValidResult(entry.result) ? entry.result : "normal",
  notes: entry.notes ?? "",
  values: entry.values ?? {}, // Initialize empty if not present
});

const TEMP_USER_ID = "temp-user";

const LANGUAGE_OPTIONS: Array<{ value: WhisperSupportedLanguage; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English (EN-CA)" },
  { value: "es", label: "Español (LatAm)" },
  { value: "fr", label: "Français (Canada)" }
];

const MODE_LABELS: Record<"live" | "dictation", string> = {
  live: "Live session",
  dictation: "Dictation",
};

const formatDetectedLanguage = (value: string | null | undefined) => {
  if (!value) return "Not detected";
  const normalized = value.toLowerCase();
  if (normalized.startsWith("en")) return "Detected: English";
  if (normalized.startsWith("fr")) return "Detected: French";
  if (normalized.startsWith("es")) return "Detected: Spanish";
  return `Detected: ${value}`;
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
};

const ProfessionalWorkflowPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ DIFFERENT APPROACH: Get URL params and clear localStorage IMMEDIATELY before any state
  const patientIdFromUrl = searchParams.get('patientId');
  // WO-P0-GATE-01: single source of truth — normalize type vs sessionType (priority: type)
  const rawType = searchParams.get('type') ?? searchParams.get('sessionType');
  const sessionTypeFromUrl = (rawType === 'followup' || rawType === 'follow-up'
    ? 'followup'
    : (rawType || null)) as 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate' | null;

  const isSpainPilotActive = isSpainPilot();
  const isExplicitFollowUp = sessionTypeFromUrl === 'followup';

  // WO-IA-RESUME-01: Resume Initial Assessment — load existing session, do not create new one
  const resumeFromUrl = searchParams.get('resume') === 'true';
  const sessionIdFromUrl = searchParams.get('sessionId') || null;

  // ✅ FIX: Use refs to track if localStorage was already cleared (only clear once)
  const localStorageClearedRef = useRef(false);
  const useEffectClearedRef = useRef(false);
  // ✅ WO-FIX-DATA-PERSISTENCE: Track if we've cleaned for this specific initial session
  const hasCleanedForInitial = useRef<string | null>(null);
  // Guard against duplicate SOAP saves (double-tap / double-click)
  const isFinalizingRef = useRef(false);
  /** WO-IA-RESUME-01: Dedupe resume fetch per (sessionId, visitType) — visitType can settle after first mount (e.g. initial → follow-up). */
  const hasResumeLoadAttemptedRef = useRef<string | null>(null);
  const restoreTranscriptPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ FIX: Clear localStorage ONLY ONCE on initial mount for follow-up (not on every render)
  if (isExplicitFollowUp && patientIdFromUrl && typeof window !== 'undefined' && !localStorageClearedRef.current) {
    try {
      const storageKey = `aidux_${patientIdFromUrl}`;
      const existingData = localStorage.getItem(storageKey);

      // Only clear if there's no transcript saved (don't delete user's work)
      if (!existingData || !JSON.parse(existingData)?.transcript?.trim()) {
        localStorage.removeItem(storageKey);
      }

      localStorageClearedRef.current = true; // Mark as cleared
    } catch (e) {
      console.warn('[WORKFLOW] Error clearing localStorage:', e);
      localStorageClearedRef.current = true; // Mark as attempted even if failed
    }
  }

  // URL params processed (debug logs removed to reduce re-renders)

  // State for real patient data
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // WO-REDFLAG-FOLLOWUP-002: follow-up red flags from generateFollowUpAnalysis alerts
  const [followUpAlerts, setFollowUpAlerts] = useState<{
    red_flags?: string[];
    yellow_flags?: string[];
  } | null>(null);
  /** Fase C: AI clinical considerations (reflections only; not part of medical record until clinician inserts). */
  const [followUpConsiderations, setFollowUpConsiderations] = useState<string[] | null>(null);
  /** Patient Clinical Memory: pattern insight from trajectory events (observation only; not part of record). */
  const [followUpPatternInsight, setFollowUpPatternInsight] = useState<{ patternId: string; description: string } | null>(null);

  // ✅ WO-CONSENT-VERBAL-01: Gate state for verbal consent
  const [workflowBlocked, setWorkflowBlocked] = useState(false);
  const [showVerbalConsentModal, setShowVerbalConsentModal] = useState(false);
  const [consentCheckComplete, setConsentCheckComplete] = useState(false);
  // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Allow recording new consent if patient changes mind after decline
  const [showVerbalConsentForDeclined, setShowVerbalConsentForDeclined] = useState(false);
  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Única fuente de verdad - solo workflowConsentStatus del backend
  // NO más estados duplicados: hasValidConsentForUI eliminado
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status
  const [workflowConsentStatus, setWorkflowConsentStatus] = useState<{
    hasValidConsent: boolean;
    isDeclined?: boolean;
    status?: string | null;
    consentMethod?: string | null;
    declineReasons?: string[];
  } | null>(null);

  // ✅ CRITICAL FIX: Initialize tab and visit type based on URL parameter. Follow-up always starts on Analysis (conversation + red-flag flow).
  const [activeTab, setActiveTab] = useState<ActiveTab>(isExplicitFollowUp ? "analysis" : "analysis");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [selectedRedFlagIds, setSelectedRedFlagIds] = useState<string[]>([]);
  const [redFlagDecisions, setRedFlagDecisions] = useState<Record<string, {
    decision: 'continue' | 'referral_stop' | 'referral_continue_partial';
    continuationNote?: string;
  }>>({});
  const [followUpDecisionResolved, setFollowUpDecisionResolved] = useState(false);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [visitType, setVisitType] = useState<VisitType>(isExplicitFollowUp ? 'follow-up' : 'initial');

  const hasUndecidedFollowUpRedFlags = (forceFollowUp?: boolean) => {
    const isFollowUp = forceFollowUp || visitType === 'follow-up';
    if (!isFollowUp) return false;
    if (!interactiveResults?.redFlags?.length) return false;

    return (interactiveResults.redFlags as any[]).some((flag: any) => {
      const id = typeof flag === 'string' ? flag : flag.label;
      return !redFlagDecisions[id]?.decision;
    });
  };

  useEffect(() => {
    if (visitType !== 'follow-up' || !(followUpAlerts?.red_flags?.length)) {
      setFollowUpDecisionResolved(false);
      return;
    }
    // All follow-up red flags have a decision → resolved (use same id as AnalysisTab: string | flag.label | red-${idx})
    const allResolved = followUpAlerts.red_flags.every((flag: unknown, idx: number) => {
      const id = typeof flag === 'string' ? flag : (flag as { label?: string })?.label ?? `red-${idx}`;
      const decision = redFlagDecisions[id]?.decision;
      return decision === 'continue' || decision === 'referral_stop' || decision === 'referral_continue_partial';
    });
    setFollowUpDecisionResolved(allResolved);
  }, [visitType, followUpAlerts, redFlagDecisions]);

  // WO-05-FIX: Estado para todayFocus (focos clínicos editables del plan previo; usado en initial y legacy follow-up)
  const [todayFocus, setTodayFocus] = useState<TodayFocusItem[]>([]);
  // WO-FU-PLAN-SPLIT-01: In-clinic vs HEP — FOLLOW-UP ONLY; poblado solo cuando visitType === 'follow-up'
  const [inClinicItems, setInClinicItems] = useState<TodayFocusItem[]>([]);
  const [homeProgramItems, setHomeProgramItems] = useState<TodayFocusItem[]>([]);
  // Follow-up path: baseline for SOAP (no Niagara). Single source of truth — loaded when visitType === 'follow-up'.
  const [followUpClinicalState, setFollowUpClinicalState] = useState<{ baselineSOAP: { subjective: string; objective: string; assessment: string; plan: string } } | null>(null);
  /** True once getClinicalState has settled for follow-up; used to gate "no baseline → cannot start follow-up". */
  const [followUpBaselineChecked, setFollowUpBaselineChecked] = useState(false);

  // WO-PILOT-FIX-07: Time-based greeting for header
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  useEffect(() => {
    const interval = setInterval(() => setGreeting(getTimeBasedGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ WORKFLOW OPTIMIZATION: Follow-up detection and routing
  const [workflowRoute, setWorkflowRoute] = useState<WorkflowRoute | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics | null>(null);
  const [workflowDetected, setWorkflowDetected] = useState(false);
  const [showWorkflowFeedback, setShowWorkflowFeedback] = useState(false);
  const [soapTokenOptimization, setSoapTokenOptimization] = useState<{
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  } | undefined>();
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  /** When resume=true fails (session not found), show recovery links (View note / Back to history view). */
  const [resumeLoadFailed, setResumeLoadFailed] = useState<{ sessionId: string; patientId: string } | null>(null);
  const setAnalysisErrorWithRecovery = useCallback((err: string | null) => {
    setAnalysisError(err);
    if (err === null) setResumeLoadFailed(null);
  }, []);
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [followUpContext, setFollowUpContext] = useState<FollowUpClinicalContext | null>(null);

  // ✅ Day 3: Session Comparison Integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSessionForComparison, setCurrentSessionForComparison] = useState<Session | null>(null);

  // WO-IA-CLOSE-01: Initial assessment closed — button hide and session state
  const [initialAssessmentClosedAt, setInitialAssessmentClosedAt] = useState<string | null>(null);
  const [baselineIdFromSession, setBaselineIdFromSession] = useState<string | null>(null);
  const [showCloseInitialConfirmModal, setShowCloseInitialConfirmModal] = useState(false);
  const [closeInitialConfirmData, setCloseInitialConfirmData] = useState<{ patientName?: string; baselineId?: string } | null>(null);
  const [showCPOBlockModal, setShowCPOBlockModal] = useState(false);

  // Value Metrics Tracking - Timestamps
  const [sessionStartTime] = useState<Date>(new Date());
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<Date | null>(null);
  const [transcriptionEndTime, setTranscriptionEndTime] = useState<Date | null>(null);
  const [soapGenerationStartTime, setSoapGenerationStartTime] = useState<Date | null>(null);
  const [soapGenerationEndTime, setSoapGenerationEndTime] = useState<Date | null>(null);
  const [hasRestoredFromAutoSave, setHasRestoredFromAutoSave] = useState(false);
  const [autoSaveRestoreAttempted, setAutoSaveRestoreAttempted] = useState(false);
  const [isRestoringTranscript, setIsRestoringTranscript] = useState(false);
  const [restoredFromInterrupted, setRestoredFromInterrupted] = useState(false);
  const [deploymentVersionMismatch, setDeploymentVersionMismatch] = useState<{
    currentBuildId: string;
    latestBuildId: string;
  } | null>(null);

  // WO-RESILIENCE-001: auto-hide restore banner after a few seconds
  useEffect(() => {
    if (!hasRestoredFromAutoSave) return;
    const timeout = setTimeout(() => setHasRestoredFromAutoSave(false), 7000);
    return () => clearTimeout(timeout);
  }, [hasRestoredFromAutoSave]);

  // Patient Consent - PHIPA s. 18 compliance (SMS-based approach)
  const [isFirstSession, setIsFirstSession] = useState<boolean | null>(null); // null = checking, true/false = result
  const [checkingFirstSession, setCheckingFirstSession] = useState(true);
  const [patientHasConsent, setPatientHasConsent] = useState<boolean | null>(null); // null = checking
  const [consentStatus, setConsentStatus] = useState<'ongoing' | 'session-only' | 'declined' | null>(null); // Current consent status
  const [consentPending, setConsentPending] = useState(false); // True if SMS sent, waiting for patient
  const [consentToken, setConsentToken] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [copyConsentFeedback, setCopyConsentFeedback] = useState<'idle' | 'success' | 'error'>('idle');

  const resolveFollowUpClinicalContext = useCallback(async (resolvedPatientId: string, currentAttachments: ClinicalAttachment[] = []) => {
    const service = new FollowUpClinicalContextService();
    const resolvedContext = await service.resolve(resolvedPatientId, currentAttachments);
    return resolvedContext;
  }, []);

  const { sharedState, updatePhysicalEvaluation } = useSharedWorkflowState();
  const { user } = useAuth(); // Must be called before useEffect that uses it
  const { profile: professionalProfile } = useProfessionalProfileContext();
  const consentSmsJurisdiction = useMemo(() => {
    const practiceCountry = `${professionalProfile?.practiceCountry || professionalProfile?.country || ''}`.trim().toUpperCase();
    if (practiceCountry === 'ES') return 'ES-ES';
    if (practiceCountry === 'CA') return 'CA-ON';

    const patientPhone = `${currentPatient?.phone || currentPatient?.personalInfo?.phone || ''}`.trim();
    if (patientPhone.startsWith('+34')) return 'ES-ES';
    if (patientPhone.startsWith('+1')) return 'CA-ON';

    return getCurrentJurisdiction();
  }, [
    professionalProfile?.practiceCountry,
    professionalProfile?.country,
    currentPatient?.phone,
    currentPatient?.personalInfo?.phone,
  ]);

  // Professional profile loaded (debug logs removed to reduce re-renders)

  // ✅ CRITICAL FIX: Get professional display info early for header

  // Get patient ID for hooks
  const patientId = patientIdFromUrl || demoPatient.id;

  // Hooks for data fetching - called at component level
  const lastEncounter = useLastEncounter(patientId);
  const activeEpisode = useActiveEpisode(patientId);
  const visitCount = usePatientVisitCount(patientId);

  // Get session type from URL or default to visitType
  const currentSessionType = sessionTypeFromUrl || (visitType === 'initial' ? 'initial' : 'followup');
  const sessionTypeConfig = SessionTypeService.getSessionTypeConfig(currentSessionType);

  // WO-RESUME-INTERRUPTED: Refs for onTranscriptionComplete (runs after unmount; refs keep latest values)
  const sessionIdRef = useRef<string | null>(null);
  /** Set only when recording starts; never overwritten by state so onTranscriptionComplete still has id after new instance mounts */
  const sessionIdForTranscriptRef = useRef<string | null>(null);
  /** WO-BUG2-RACE: Stable Firestore doc id before sessionId state + before first autosave (skip when resuming from URL). */
  const workflowReservedSessionIdRef = useRef<string | null>(null);
  const patientIdForPersistRef = useRef<string | null>(null);
  const userForPersistRef = useRef<{ uid: string } | null>(null);
  const lastFirestoreTranscriptRef = useRef<string>('');
  const lastFirestoreTranscriptSessionIdRef = useRef<string | null>(null);
  const currentClientBuildId =
    typeof __AIDUX_BUILD_ID__ !== 'undefined'
      ? __AIDUX_BUILD_ID__
      : 'dev-build';
  const currentClientAppVersion =
    typeof __AIDUX_APP_VERSION__ !== 'undefined'
      ? __AIDUX_APP_VERSION__
      : 'dev-version';
  sessionIdRef.current = sessionId;
  patientIdForPersistRef.current = patientIdFromUrl ?? null;
  userForPersistRef.current = user ? { uid: user.uid } : null;

  useEffect(() => {
    const authenticatedUid = user?.uid;
    if (!authenticatedUid) return;
    const resumeSessionKey = sessionIdFromUrl;
    if (resumeSessionKey) return;
    const priorReserved = workflowReservedSessionIdRef.current;
    if (priorReserved) return;
    const reservedEpochMs = Date.now();
    const nextWorkflowSessionKey = `${authenticatedUid}-${reservedEpochMs}`;
    workflowReservedSessionIdRef.current = nextWorkflowSessionKey;
  }, [user?.uid, sessionIdFromUrl]);

  // ✅ CRITICAL: Initialize hooks BEFORE using their values in useMemo
  // These hooks must be called before detectedCaseRegion which depends on them
  const {
    transcript,
    isRecording,
    isTranscribing,
    error: transcriptError,
    languagePreference,
    setLanguagePreference,
    mode,
    setMode,
    meta: transcriptMeta,
    audioStream,
    startRecording: _startRecording,
    stopRecording: _stopRecording,
    setTranscript,
  } = useTranscript({
    onTranscriptionComplete: (text) => {
      const sid = sessionIdForTranscriptRef.current;
      const pid = patientIdForPersistRef.current;
      const uid = userForPersistRef.current?.uid;
      if (!text?.trim()) return;
      if (sid && pid && uid) {
        sessionService.updateSession(sid, {
          transcript: text,
          clientBuildId: currentClientBuildId,
          clientAppVersion: currentClientAppVersion,
        }).catch(() => {});
        lastFirestoreTranscriptRef.current = text;
        lastFirestoreTranscriptSessionIdRef.current = sid;
        const latest = SessionStorage.getLatestInitialSession(pid, uid);
        if (latest && String(latest.sessionId || '').trim() === sid) {
          SessionStorage.saveLatestInitialSession(pid, uid, { ...latest, transcript: text, sessionId: sid });
          console.log('[WORKFLOW] ✅ Persisted transcript to SessionStorage (onTranscriptionComplete)', { sessionIdTail: sid.slice(-10) });
        }
      }
    },
  });

  const [evaluationTests, setEvaluationTests] = useState<EvaluationTestEntry[]>(() =>
    (sharedState.physicalEvaluation?.selectedTests ?? []).map(sanitizeEvaluationEntry)
  );
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const {
    processText,
    generateSOAPNote,
    niagaraResults,
    soapNote,
    isProcessing,
    reset: resetNiagaraProcessor,
  } = useNiagaraProcessor();
  const [editedAnalysisResults, setEditedAnalysisResults] = useState<any>(null);

  const hasActiveWorkflowDraft = Boolean(
    transcript?.trim() ||
    evaluationTests.length > 0 ||
    niagaraResults ||
    localSoapNote ||
    attachments.length > 0 ||
    inClinicItems.length > 0 ||
    homeProgramItems.length > 0
  );

  useEffect(() => {
    if (!hasActiveWorkflowDraft) {
      setDeploymentVersionMismatch(null);
      return;
    }
    if (import.meta.env.MODE === 'test') {
      setDeploymentVersionMismatch(null);
      return;
    }
    let cancelled = false;
    const detectServedBuildVersion = async () => {
      try {
        const requestOrigin = window.location.origin || 'http://localhost';
        const requestUrl = new URL(`/index.html?aidux-build-check=${Date.now()}`, requestOrigin);
        const response = await fetch(requestUrl.toString(), {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const html = await response.text();
        const buildIdMatch = html.match(/<meta name="aidux-build-id" content="([^"]+)"/i);
        const latestBuildId = buildIdMatch?.[1]?.trim() || '';
        if (!latestBuildId || cancelled) {
          return;
        }
        if (latestBuildId !== currentClientBuildId) {
          setDeploymentVersionMismatch({
            currentBuildId: currentClientBuildId,
            latestBuildId,
          });
          return;
        }
        setDeploymentVersionMismatch(null);
      } catch (error) {
        console.warn('[Workflow] Could not check served build version:', error);
      }
    };
    void detectServedBuildVersion();
    const intervalId = setInterval(() => {
      void detectServedBuildVersion();
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [hasActiveWorkflowDraft, currentClientBuildId]);

  useEffect(() => {
    if (!deploymentVersionMismatch || !hasActiveWorkflowDraft) {
      return;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [deploymentVersionMismatch, hasActiveWorkflowDraft]);

  const hydrateResumeFromNote = useCallback(
    async (
      note: SavedNote,
      requestedSessionId: string,
      source: 'missing-session' | 'session-load-error'
    ): Promise<void> => {
      const noteSoapData = note.soapData;
      const hydratedSoapNote = {
        subjective: noteSoapData.subjective ?? '',
        objective: noteSoapData.objective ?? '',
        assessment: noteSoapData.assessment ?? '',
        plan: noteSoapData.plan ?? '',
      } as SOAPNote;
      const noteHasExplicitFinalizedStatus =
        (note.soapData as { status?: string })?.status === 'finalized';
      const resolvedNoteStatus = noteHasExplicitFinalizedStatus ? 'finalized' : 'draft';
      const sessionOwnerId = user?.uid ?? null;
      const sessionPatientId = patientIdFromUrl ?? note.patientId;
      const sessionPatientName =
        currentPatient?.fullName ||
        `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() ||
        demoPatient.name;
      const canCreateRecoverySession =
        sessionOwnerId != null &&
        sessionPatientId != null &&
        sessionPatientId.trim() !== '';
      let resolvedSessionId = note.sessionId;

      if (canCreateRecoverySession) {
        const recoveryAnchorMs = Date.now();
        const recoverySessionId = `${sessionOwnerId}-${recoveryAnchorMs}`;
        const recoverySessionDateKey = toLocalDateKey(sessionStartTime);
        const recoverySessionPayload = {
          userId: sessionOwnerId,
          patientName: sessionPatientName,
          patientId: sessionPatientId,
          transcript: '',
          sessionDateKey: recoverySessionDateKey,
          soapNote: hydratedSoapNote,
          physicalTests: [],
          status: resolvedNoteStatus === 'finalized' ? 'completed' as const : 'draft' as const,
          soapStatus: resolvedNoteStatus,
          sessionType: currentSessionType,
          clientBuildId: currentClientBuildId,
          clientAppVersion: currentClientAppVersion,
        };
        const createdRecoverySessionId = await sessionService.createSessionWithId(
          recoverySessionId,
          recoverySessionPayload
        );
        resolvedSessionId = createdRecoverySessionId;
      }

      logger.info('[WO-IA-RESUME-01] hydrated from note fallback', {
        noteId: note.id,
        requestedSessionId,
        resolvedSessionId,
        source,
      });
      sessionIdRef.current = resolvedSessionId;
      sessionIdForTranscriptRef.current = resolvedSessionId;
      setSessionId(resolvedSessionId);
      setLocalSoapNote(hydratedSoapNote);
      setSoapStatus(resolvedNoteStatus as SOAPStatus);
      if (hasUndecidedFollowUpRedFlags()) {
        console.warn('[RED-FLAG-GATE] Follow-up blocked — decisions pending');
        return;
      }
      setActiveTab('soap');
      setAnalysisError(null);
      setResumeLoadFailed(null);
    },
    [
      currentClientAppVersion,
      currentClientBuildId,
      currentPatient?.firstName,
      currentPatient?.fullName,
      currentPatient?.lastName,
      currentSessionType,
      demoPatient.name,
      patientIdFromUrl,
      user?.uid,
    ]
  );

  // ✅ WO-04: Recording events tracking
  const recordingStartTimeRef = useRef<number | null>(null);
  const transcriptionStartTimeRef = useRef<number | null>(null);

  const startRecording = useCallback(() => {
    try {
      trackRecordingStarted();
      recordingStartTimeRef.current = Date.now();
      _startRecording();
    } catch (error) {
      trackError('recording_failed', {
        errorType: error instanceof Error ? error.message : 'unknown',
        phase: 'start'
      });
      throw error;
    }
  }, [_startRecording]);

  const stopRecording = useCallback(() => {
    try {
      if (recordingStartTimeRef.current) {
        const duration = Date.now() - recordingStartTimeRef.current;
        trackRecordingStopped({
          duration,
          mode: mode || 'live'
        });
        recordingStartTimeRef.current = null;
      }
      _stopRecording();
    } catch (error) {
      trackError('recording_failed', {
        errorType: error instanceof Error ? error.message : 'unknown',
        phase: 'stop'
      });
      throw error;
    }
  }, [_stopRecording, mode]);

  // WO-MIC-LIFECYCLE-001: ensure recording is stopped when leaving workflow
  useEffect(() => {
    console.log('[WORKFLOW] Mounted ProfessionalWorkflowPage');
    return () => {
      console.log('[WORKFLOW] Unmounting ProfessionalWorkflowPage - force stopRecording');
      stopRecording();
    };
  }, [stopRecording]);

  // WO-MIC-LIFECYCLE-001: also stop recording when switching patients on same route
  useEffect(() => {
    if (!patientIdFromUrl) return;
    return () => {
      stopRecording();
    };
  }, [patientIdFromUrl, stopRecording]);

  // ✅ WO-04: Transcription events tracking
  useEffect(() => {
    if (isTranscribing && !transcriptionStartTimeRef.current) {
      // Transcription started
      transcriptionStartTimeRef.current = Date.now();
      trackTranscriptionStarted({
        service: 'gpt-4o-audio',
        mode: mode || 'live',
        languagePreference: languagePreference || 'auto'
      });
    } else if (!isTranscribing && transcriptionStartTimeRef.current) {
      // Transcription completed
      const duration = Date.now() - transcriptionStartTimeRef.current;
      trackTranscriptionCompleted({
        duration,
        transcriptLength: transcript?.length || 0,
        service: 'gpt-4o-audio',
        detectedLanguage: transcriptMeta?.detectedLanguage || null
      });
      transcriptionStartTimeRef.current = null;
    }
  }, [isTranscribing, transcript, transcriptMeta, mode, languagePreference]);

  // ✅ WO-04: Track transcription errors
  useEffect(() => {
    if (transcriptError) {
      trackTranscriptionFailed({
        errorType: transcriptError,
        service: 'gpt-4o-audio'
      });
    }
  }, [transcriptError]);

  const { time: recordingTime } = useTimer(isRecording);

  const clinicName = useMemo(
    () => deriveClinicName(professionalProfile),
    [professionalProfile]
  );

  // Prioridad 1.1: Hardening extra - validar que el profile pertenece al user.uid
  const safeProfile = useMemo(
    () => (professionalProfile?.uid === user?.uid ? professionalProfile : null),
    [professionalProfile, user?.uid]
  );

  const clinicianDisplayName = useMemo(
    () => deriveClinicianDisplayName(safeProfile, user),
    [safeProfile, user]
  );

  // WO-PILOT-FIX-07: Logout handler for header
  const handleLogout = useCallback(async () => {
    try {
      await signOut(getAuth());
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[WORKFLOW] Error during logout:', error);
    }
  }, [navigate]);

  // ✅ P2.1: Use getPublicBaseUrl for mobile-accessible links
  const consentBaseUrl = useMemo(() => {
    try {
      return getPublicBaseUrl();
    } catch (error) {
      // Fallback to window.location.origin if urlHelpers not available
      console.warn('[WORKFLOW] Failed to get public base URL, using window.location.origin:', error);
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
  }, []);

  const consentLink = useMemo(
    () => (consentToken ? `${consentBaseUrl}/consent/${consentToken}` : null),
    [consentBaseUrl, consentToken]
  );

  const handleCopyConsentLink = useCallback(async () => {
    if (!consentLink || !navigator?.clipboard) {
      setCopyConsentFeedback('error');
      return;
    }
    try {
      await navigator.clipboard.writeText(consentLink);
      setCopyConsentFeedback('success');
      setTimeout(() => setCopyConsentFeedback('idle'), 3000);
    } catch (err) {
      console.error('[WORKFLOW] Failed to copy consent link:', err);
      setCopyConsentFeedback('error');
    }
  }, [consentLink]);

  // Enterprise-grade: Function to resend consent SMS
  // Extracted from checkFirstSessionAndConsent for reusability
  const handleResendConsentSMS = useCallback(async () => {
    if (!currentPatient || !user?.uid) {
      setSmsError('Patient or user information not available');
      return;
    }

    const patientId = currentPatient.id || patientIdFromUrl;
    if (!patientId) {
      setSmsError('Patient ID not available');
      return;
    }

    try {
      setSmsError(null);
      setConsentPending(true);

      // Validate phone number format
      const phoneNumber = currentPatient.phone?.trim();
      if (!phoneNumber) {
        throw new Error('Patient phone number not available');
      }

      // Format phone number for SMS (E.164 format)
      let formattedPhone = phoneNumber.trim();
      const cleanPhone = formattedPhone.replace(/[^\d+]/g, '');

      if (cleanPhone.startsWith('+1') && cleanPhone.length === 12) {
        formattedPhone = cleanPhone;
      } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
        formattedPhone = `+${cleanPhone}`;
      } else if (cleanPhone.length === 10) {
        formattedPhone = `+1${cleanPhone}`;
      } else if (cleanPhone.startsWith('+') && cleanPhone.length >= 11) {
        formattedPhone = cleanPhone;
      } else {
        const digits = cleanPhone.replace(/\D/g, '');
        if (digits.length === 10) {
          formattedPhone = `+1${digits}`;
        } else if (digits.length === 11 && digits.startsWith('1')) {
          formattedPhone = `+${digits}`;
        } else {
          throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }
      }

      // Final validation: must be E.164 format
      if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
        throw new Error(`Invalid phone number format: ${formattedPhone}`);
      }

      // Generate new consent token
      const pilotIsSpain = isSpainPilot();
      const phoneIsSpain = formattedPhone?.startsWith('+34') ?? false;
      const tokenConsentJurisdiction = (pilotIsSpain || phoneIsSpain) ? 'ES-ES' : 'CA-ON';
      const tokenConsentLanguage = tokenConsentJurisdiction === 'ES-ES' ? 'es' : 'en';
      const tokenConsentTextVersion = tokenConsentJurisdiction === 'ES-ES' ? 'v1-es-ES-written' : 'v2-en-CA';
      const token = await PatientConsentService.generateConsentToken(
        patientId,
        currentPatient.fullName || `${currentPatient.firstName} ${currentPatient.lastName}`.trim(),
        formattedPhone,
        currentPatient.email || undefined,
        clinicName,
        user.uid,
        clinicianDisplayName,
        undefined,
        {
          jurisdiction: tokenConsentJurisdiction,
          language: tokenConsentLanguage,
          consentTextVersion: tokenConsentTextVersion,
        }
      );

      setConsentToken(token);

      // Get physio name from token snapshot
      const tokenDoc = await PatientConsentService.getConsentByToken(token);
      const physioNameForSms = tokenDoc?.physiotherapistName?.trim() || clinicianDisplayName;

      // Send SMS with consent link
      await SMSService.sendConsentLink(
        formattedPhone,
        currentPatient.fullName || `${currentPatient.firstName} ${currentPatient.lastName}`.trim(),
        clinicName,
        physioNameForSms,
        token,
        { jurisdiction: consentSmsJurisdiction }
      );

      setConsentPending(true);
      setSmsError(null);
      console.log('[WORKFLOW] Consent SMS resent to patient:', {
        hasPhone: Boolean(formattedPhone),
      });
    } catch (error) {
      console.error('[WORKFLOW] Error resending consent SMS:', error);
      const message = error instanceof Error ? error.message : 'Failed to resend SMS consent link.';
      setSmsError(message);
      setConsentPending(false);
    }
  }, [currentPatient, user?.uid, patientIdFromUrl, clinicName, clinicianDisplayName, consentSmsJurisdiction]);

  // ✅ PILOT METRICS: Track session start (only once per session)
  // Use a stable session key based on patientId + user.uid to prevent duplicates
  const sessionTrackingKey = useMemo(() => {
    if (!patientId || !user?.uid) return null;
    return `pilot-session-${patientId}-${user.uid}`;
  }, [patientId, user?.uid]);
  const trackedSessionsRef = useRef<Set<string>>(new Set());

  // ✅ STRICTMODE FIX: Idempotent tracking to prevent duplicate events in dev
  const trackedOnceRef = useRef<Set<string>>(new Set());
  const trackOnce = useCallback((key: string, fn: () => void | Promise<void>) => {
    if (trackedOnceRef.current.has(key)) return;
    trackedOnceRef.current.add(key); // Mark as tracked BEFORE executing (synchronous)
    fn(); // Execute async function (fire and forget)
  }, []);

  useEffect(() => {
    // Only track once per unique session key
    if (!sessionTrackingKey || !patientId || !user?.uid) return;

    // ✅ STRICTMODE FIX: Use trackOnce at the top level to prevent duplicate execution
    trackOnce(`pilot_session_started_effect:${sessionTrackingKey}`, () => {
      const trackSessionStart = async () => {
        try {
          // Check if user is pilot user (from registration date)
          const pilotStartDate = new Date('2024-12-19T00:00:00Z');
          const isPilotUser = new Date() >= pilotStartDate;

          if (isPilotUser) {
            // ✅ CRITICAL FIX: Use explicit URL parameter for visitType in tracking
            const trackingVisitType = sessionTypeFromUrl === 'followup' ? 'follow-up' : visitType;
            console.log('[WORKFLOW] 📊 Analytics tracking:', {
              sessionTypeFromUrl,
              visitType,
              trackingVisitType,
              isExplicitFollowUp: sessionTypeFromUrl === 'followup',
              hasPatientId: Boolean(patientId),
            });

            // ✅ STRICTMODE FIX: Idempotent tracking to prevent duplicate events
            trackOnce(`pilot_session_started:${patientId}:${trackingVisitType}`, () => {
              AnalyticsService.trackEvent('pilot_session_started', {
                patientId,
                userId: user.uid,
                sessionStartTime: sessionStartTime.toISOString(),
                visitType: trackingVisitType,
                isPilotUser: true
              }).catch((error) => {
                console.error('⚠️ [PILOT METRICS] Error tracking session start:', error);
              });
              console.log('✅ [PILOT METRICS] Session start tracked:', {
                hasPatientId: Boolean(patientId),
                visitType: trackingVisitType,
              });
            });
          }
        } catch (error) {
          console.error('⚠️ [PILOT METRICS] Error tracking session start:', error);
          // Non-blocking: don't fail session if analytics fails
        }
      };

      trackSessionStart();
    });

  }, [sessionTrackingKey, trackOnce, patientId, user?.uid, sessionTypeFromUrl, visitType, sessionStartTime]); // Include all dependencies

  // Load patient data from Firestore
  useEffect(() => {
    const loadPatient = async () => {
      if (!patientIdFromUrl) {
        setLoadingPatient(false);
        return;
      }

      try {
        setLoadingPatient(true);
        const patient = await PatientService.getPatientById(patientIdFromUrl);
        if (patient) {
          setCurrentPatient(patient);
          console.log('[WORKFLOW] Patient loaded successfully');
        } else {
          console.warn('[WORKFLOW] Patient not found for requested workflow route');
        }
      } catch (error) {
        console.error('[WORKFLOW] Error loading patient:', error);
      } finally {
        setLoadingPatient(false);
      }
    };

    loadPatient();
  }, [patientIdFromUrl]);

  // ✅ WORKFLOW OPTIMIZATION: Detect workflow type when patient is loaded
  useEffect(() => {
    const detectWorkflow = async () => {
      if (!patientId || !user?.uid || !currentPatient) {
        return;
      }

      try {
        // ✅ CRITICAL FIX: If sessionTypeFromUrl is 'followup', use it as explicit follow-up
        const isExplicitFollowUp = sessionTypeFromUrl === 'followup';

        const input: FollowUpDetectionInput = {
          patientId,
          // TODO: Add chief complaint from transcript or form when available
          consultationType: sessionTypeFromUrl || undefined,
          // ✅ CRITICAL FIX: Use manual override if explicitly set to followup
          manualOverride: isExplicitFollowUp ? 'follow-up' : undefined,
        };

        const route = await routeWorkflow(input, user.uid);
        setWorkflowRoute(route);
        setWorkflowDetected(true);

        // Set visit type based on detection or explicit type
        if (route.type === 'follow-up' || isExplicitFollowUp) {
          setVisitType('follow-up');
        } else {
          setVisitType('initial');
        }

        // Navigate to initial tab based on workflow
        // ✅ CRITICAL FIX: For follow-up, start with analysis (for conversation recording)
        const initialTab = isExplicitFollowUp || route.type === 'follow-up'
          ? 'analysis'  // ✅ FIX: Start with analysis for follow-up conversation
          : getInitialTab(route);

        if (['analysis', 'evaluation', 'soap'].includes(initialTab)) {
          setActiveTab(initialTab as ActiveTab);
        }

        // ✅ WORKFLOW OPTIMIZATION: Track workflow session start
        const sessionIdForMetrics = sessionId || `${user.uid}-${Date.now()}`;
        const workflowTypeForTracking = route.type === 'follow-up' || isExplicitFollowUp ? 'follow-up' : 'initial';

        // ✅ STRICTMODE FIX: Idempotent tracking to prevent duplicate events
        trackOnce(`workflow_session_started:${patientId}:${workflowTypeForTracking}:${route.type}`, () => {
          trackWorkflowSessionStart(
            sessionIdForMetrics,
            patientId,
            user.uid,
            workflowTypeForTracking,
            route.skipTabs.length
          ).catch((error) => {
            console.error('[WORKFLOW] Error tracking workflow session start:', error);
          });
        });

        console.log('[WORKFLOW] Workflow detected:', {
          routeType: route.type,
          explicitFollowUp: isExplicitFollowUp,
          sessionTypeFromUrl,
          initialTab,
          skipTabCount: route.skipTabs.length,
        });
      } catch (error) {
        console.error('[WORKFLOW] Error detecting workflow:', error);
        // Fallback: if explicit followup, still set it
        if (sessionTypeFromUrl === 'followup') {
          setVisitType('follow-up');
          if (hasUndecidedFollowUpRedFlags(true)) {
            console.warn('[RED-FLAG-GATE] Follow-up blocked — decisions pending');
            return;
          }
          setActiveTab('soap');
        }
        setWorkflowDetected(true);
      }
    };

    detectWorkflow();
  }, [patientId, user?.uid, currentPatient, sessionTypeFromUrl]);

  // Follow-up path: load baseline for SOAP. Priority: (1) baselineFromOngoing from navigate state (Ongoing intake just completed), (2) getClinicalState from Firestore.
  useEffect(() => {
    const isFollowUp = sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up';
    if (!isFollowUp || !patientId || !user?.uid) {
      setFollowUpClinicalState(null);
      setFollowUpBaselineChecked(false);
      return;
    }
    setFollowUpClinicalState(null);
    setFollowUpBaselineChecked(false);

    const baselineFromOngoing = (location.state as { baselineFromOngoing?: { subjective: string; objective: string; assessment: string; plan: string } })?.baselineFromOngoing;
    if (baselineFromOngoing && baselineFromOngoing.plan?.trim()) {
      setFollowUpClinicalState({
        baselineSOAP: {
          subjective: baselineFromOngoing.subjective ?? '',
          objective: baselineFromOngoing.objective ?? '',
          assessment: baselineFromOngoing.assessment ?? '',
          plan: baselineFromOngoing.plan ?? '',
        },
      });
      setFollowUpBaselineChecked(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
      return;
    }

    let cancelled = false;
    getClinicalState(patientId, user.uid)
      .then(async (state) => {
        if (cancelled) return;
        if (!state?.hasBaseline || !state.baselineSOAP) {
          setFollowUpClinicalState(null);
        } else {
          setFollowUpClinicalState({
            baselineSOAP: {
              subjective: state.baselineSOAP.subjective ?? '',
              objective: state.baselineSOAP.objective ?? '',
              assessment: state.baselineSOAP.assessment ?? '',
              plan: state.baselineSOAP.plan ?? '',
            },
          });
          try {
            const patientRecord = await PatientService.getPatientById(patientId);
            const resolvedBaselineId = patientRecord?.activeBaselineId ?? null;
            if (resolvedBaselineId !== null) {
              setBaselineIdFromSession(resolvedBaselineId);
            }
          } catch {
            /* do not clear baselineIdFromSession */
          }
        }
        setFollowUpBaselineChecked(true);
      })
      .catch(() => {
        if (!cancelled) {
          setFollowUpClinicalState(null);
          setFollowUpBaselineChecked(true);
        }
      });
    return () => { cancelled = true; };
  }, [patientId, user?.uid, sessionTypeFromUrl, workflowRoute?.type, location.state]);

  // ✅ CRITICAL FIX: Auto-navigate to SOAP tab after Niagara analysis for follow-up visits (legacy path only; follow-up now uses SOAP-only, no Niagara)
  useEffect(() => {
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;

    // WO-REDFLAG-FOLLOWUP-001: only auto-navigate if no red flags — with red flags, stay in Analysis for clinical decision
    const followUpHasRedFlags = (niagaraResults?.red_flags?.length ?? 0) > 0;
    if (isFollowUpWorkflow && niagaraResults && activeTab !== 'soap' && !followUpHasRedFlags) {
      console.log('[WORKFLOW] 🎯 Auto-navigating to SOAP tab after Niagara analysis (follow-up, no red flags)');
      if (hasUndecidedFollowUpRedFlags()) {
        console.warn('[RED-FLAG-GATE] Follow-up blocked — decisions pending');
        return;
      }
      setActiveTab('soap');
    }
    if (isFollowUpWorkflow && niagaraResults && followUpHasRedFlags) {
      console.log('[WORKFLOW] ⚠️ Follow-up red flags detected — navigating to Analysis tab for clinical decision', {
        redFlagCount: niagaraResults.red_flags.length,
      });
      if (activeTab !== 'analysis') {
        setActiveTab('analysis');
      }
    }
  }, [niagaraResults, sessionTypeFromUrl, workflowRoute?.type, activeTab]);

  // WO-REDFLAG-FOLLOWUP: after followUpAlerts is set with red flags, switch to Analysis so the same render has both (fixes async state race)
  useEffect(() => {
    const isFollowUp = sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up';
    if (!isFollowUp) return;
    if ((followUpAlerts?.red_flags?.length ?? 0) > 0) {
      console.log('[REDFLAG-EFFECT] firing setActiveTab analysis', {
        followUpAlertsLen: followUpAlerts?.red_flags?.length,
        activeTab,
      });
      setActiveTab('analysis');
    }
  }, [followUpAlerts, sessionTypeFromUrl, workflowRoute?.type]);

  // ✅ FIX: Memoize onWorkflowSelected to prevent infinite loop
  const handleWorkflowSelected = useCallback((route: WorkflowRoute) => {
    setWorkflowRoute(route);
    // Update visit type
    if (route.type === 'follow-up') {
      setVisitType('follow-up');
    } else {
      setVisitType('initial');
    }
    // Navigate to initial tab
    const initialTab = getInitialTab(route);
    if (['analysis', 'evaluation', 'soap'].includes(initialTab)) {
      setActiveTab(initialTab as ActiveTab);
    }
  }, []);

  // Check consent verification before allowing workflow access
  // ✅ FIX: Make this non-blocking - don't redirect if service fails
  useEffect(() => {
    const checkConsentVerification = async () => {
      const patientId = patientIdFromUrl || demoPatient.id;

      try {
        // Check if consent is verified
        const isVerified = await ConsentVerificationService.isConsentVerified(patientId);

        if (!isVerified) {
          const verificationParams = new URLSearchParams();

          if (sessionTypeFromUrl) {
            verificationParams.set('type', sessionTypeFromUrl);
          }

          const verificationQuery = verificationParams.toString();
          const verificationPath = verificationQuery
            ? `/consent-verification/${patientId}?${verificationQuery}`
            : `/consent-verification/${patientId}`;

          // Only redirect if verification explicitly returns false
          // Don't redirect on errors - allow workflow to continue
          console.log('[WORKFLOW] Consent not verified, redirecting to verification...');
          navigate(verificationPath);
        }
      } catch (error) {
        // If verification check fails, log but don't block workflow
        // This allows the workflow to render even if consent service is unavailable
        console.warn('[WORKFLOW] Consent verification check failed, allowing workflow to continue:', error);
      }
    };

    if (patientIdFromUrl) {
      checkConsentVerification();
    }
  }, [patientIdFromUrl, navigate, sessionTypeFromUrl]);

  // ✅ WO-CONSENT-GATE-UI-01: Gate - Check for valid consent (verbal OR digital) with jurisdiction validation
  // This is the ABSOLUTE gate - if no consent, NO clinical UI is rendered
  useEffect(() => {
    const checkValidConsent = async () => {
      if (!patientIdFromUrl || !user?.uid || !currentPatient) {
        // Still loading, don't check yet
        return;
      }

      try {
        // ✅ WO-CONSENT-VERBAL-01-LANG: Pass jurisdiction to validation
        const { getCurrentJurisdiction } = await import('../core/consent/consentJurisdiction');
        const jurisdiction = getCurrentJurisdiction();
        const hasValid = await VerbalConsentService.hasValidConsent(patientIdFromUrl, user.uid, jurisdiction);

        if (!hasValid) {
          console.log('[WORKFLOW] ❌ No valid consent (verbal or digital) - blocking ALL clinical UI', { jurisdiction });
          setWorkflowBlocked(true);
          setShowVerbalConsentModal(false); // Don't show modal here - ConsentGateScreen handles it
          // ✅ WO-CONSENT-SINGLE-SOURCE-01: Actualizar solo workflowConsentStatus (única fuente de verdad)
          // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status
          setWorkflowConsentStatus({
            hasValidConsent: false,
            isDeclined: false, // Not declined, just missing
            status: null,
            consentMethod: null
          });
        } else {
          console.log('[WORKFLOW] ✅ Valid consent found - workflow unlocked', { jurisdiction });
          setWorkflowBlocked(false);
          setShowVerbalConsentModal(false);
          // ✅ WO-CONSENT-SINGLE-SOURCE-01: Actualizar solo workflowConsentStatus (única fuente de verdad)
          // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status
          setWorkflowConsentStatus({
            hasValidConsent: true,
            isDeclined: false,
            status: 'ongoing',
            consentMethod: 'verbal' // VerbalConsentService indicates verbal consent
          });
        }

        setConsentCheckComplete(true);
      } catch (error) {
        console.error('[WORKFLOW] Error checking valid consent:', error);
        // Fail-safe: Block if check fails
        setWorkflowBlocked(true);
        setShowVerbalConsentModal(false);
        // ✅ WO-CONSENT-SINGLE-SOURCE-01: Actualizar solo workflowConsentStatus (única fuente de verdad)
        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status
        setWorkflowConsentStatus({
          hasValidConsent: false,
          isDeclined: false, // Error, not declined
          status: null,
          consentMethod: null
        });
        setConsentCheckComplete(true);
      }
    };

    if (patientIdFromUrl && user?.uid && currentPatient && !consentCheckComplete) {
      checkValidConsent();
    }
  }, [patientIdFromUrl, user?.uid, currentPatient, consentCheckComplete]);

  // WO-RESUME-INTERRUPTED: On unmount, persist state so user can resume after accidental leave (battery, click, etc.)
  // Placed here so evaluationTests (and all other state below) are in scope.
  const unmountPersistRef = useRef<{
    patientId: string;
    patientName?: string;
    userId: string;
    visitType: string;
    sessionId: string | null;
    transcript: string;
    evaluationTests: unknown[];
    activeTab: string;
    selectedEntityIds: string[];
    localSoapNote: unknown;
    soapStatus: string;
    niagaraResults: unknown;
    selectedRedFlagIds: string[];
    redFlagDecisions: Record<string, {
      decision: 'continue' | 'referral_stop' | 'referral_continue_partial';
      continuationNote?: string;
    }>;
    initialAssessmentClosedAt: string | null;
    baselineIdFromSession: string | null;
    isRecording: boolean;
  } | null>(null);
  useEffect(() => {
    if (!patientIdFromUrl || !user?.uid) return;
    unmountPersistRef.current = {
      patientId: patientIdFromUrl,
      patientName: currentPatient?.fullName || `${(currentPatient as any)?.firstName ?? ''} ${(currentPatient as any)?.lastName ?? ''}`.trim() || 'Patient',
      userId: user.uid,
      visitType: visitType || 'initial',
      sessionId,
      transcript: transcript || '',
      evaluationTests: evaluationTests || [],
      activeTab,
      selectedEntityIds: selectedEntityIds || [],
      localSoapNote: localSoapNote ?? null,
      soapStatus,
      niagaraResults: niagaraResults ?? null,
      selectedRedFlagIds: selectedRedFlagIds ?? [],
      redFlagDecisions: redFlagDecisions ?? {},
      initialAssessmentClosedAt: initialAssessmentClosedAt ?? null,
      baselineIdFromSession: baselineIdFromSession ?? null,
      isRecording,
    };
    return () => {
      const state = unmountPersistRef.current;
      if (!state) return;
      const hasProgress = state.soapStatus !== "finalized" && (state.isRecording || (state.transcript?.trim().length ?? 0) > 0 || (state.evaluationTests?.length ?? 0) > 0);
      if (!hasProgress) return;
      const isInitialSession = state.visitType === 'initial' || state.visitType === '';
      if (isInitialSession) {
        const reservedWorkflowKey = workflowReservedSessionIdRef.current;
        const effectiveSessionId =
          state.sessionId || sessionIdRef.current || reservedWorkflowKey || null;
        const normalizedSessionId = typeof effectiveSessionId === 'string' ? effectiveSessionId.trim() : '';
        const hasValidSessionId = normalizedSessionId.length > 0;
        if (!hasValidSessionId) {
          console.log('[WORKFLOW] ⏭️ Skipping interrupted initial save without valid sessionId');
          return;
        }
        try {
          SessionStorage.saveLatestInitialSession(state.patientId, state.userId, {
            transcript: state.transcript,
            evaluationTests: state.evaluationTests,
            activeTab: state.activeTab,
            selectedEntityIds: state.selectedEntityIds,
            localSoapNote: state.localSoapNote,
            soapStatus: state.soapStatus,
            niagaraResults: state.niagaraResults,
            redFlagsAccepted: state.selectedRedFlagIds,
            redFlagDecisions: state.redFlagDecisions,
            initialAssessmentClosedAt: state.initialAssessmentClosedAt,
            baselineId: state.baselineIdFromSession,
            visitType: state.visitType,
            sessionId: normalizedSessionId,
            timestamp: new Date().toISOString(),
            version: '1.0',
          });
          console.log('[WORKFLOW] 💾 Saved state on unmount for resume (initial interrupted)', {
            hasSessionId: Boolean(normalizedSessionId),
          });
        } catch (e) {
          console.warn('[WORKFLOW] Failed to save state on unmount:', e);
        }
        if (hasValidSessionId) {
          const updateSessionPromise = sessionService.updateSession(normalizedSessionId, {
            status: 'interrupted',
            transcript: state.transcript,
            patientId: state.patientId,
            patientName: state.patientName || 'Patient',
            userId: state.userId,
          });
          const hasCatchHandler =
            updateSessionPromise != null &&
            typeof updateSessionPromise.catch === 'function';
          if (hasCatchHandler) {
            updateSessionPromise.catch(() => {});
          }
        }
      }
    };
  }, [patientIdFromUrl, user?.uid, sessionTypeFromUrl, visitType, sessionId, transcript, evaluationTests, activeTab, selectedEntityIds, localSoapNote, soapStatus, niagaraResults, selectedRedFlagIds, redFlagDecisions, initialAssessmentClosedAt, baselineIdFromSession, isRecording, currentPatient]);

  const [customTestName, setCustomTestName] = useState("");
  const [customTestRegion, setCustomTestRegion] = useState<MSKRegion | "other">("shoulder");
  const [customTestResult, setCustomTestResult] = useState<EvaluationResult | "">("");
  const [customTestNotes, setCustomTestNotes] = useState("");
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<number[]>([]);
  const evaluationPersistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestEvaluationPersistRef = useRef<EvaluationTestEntry[]>([]);

  // ✅ P1.1: Detect case region from transcript/motivo consulta to filter tests
  const detectedCaseRegion = useMemo<MSKRegion | null>(() => {
    const motivo = niagaraResults?.motivo_consulta?.toLowerCase() || '';
    const transcriptLower = transcript?.toLowerCase() || '';
    const combined = `${motivo} ${transcriptLower}`;

    // Detect region from combined text
    if (combined.includes('lumbar') || combined.includes('low back') || combined.includes('lower back') || combined.includes('espalda baja')) {
      return 'lumbar';
    }
    if (combined.includes('cervical') || combined.includes('neck') || combined.includes('cuello')) {
      return 'cervical';
    }
    if (combined.includes('shoulder') || combined.includes('hombro')) {
      return 'shoulder';
    }
    if (combined.includes('knee') || combined.includes('rodilla')) {
      return 'knee';
    }
    if (combined.includes('ankle') || combined.includes('tobillo')) {
      return 'ankle';
    }
    if (combined.includes('hip') || combined.includes('cadera')) {
      return 'hip';
    }
    if (combined.includes('thoracic') || combined.includes('torácico') || combined.includes('dorsal')) {
      return 'thoracic';
    }
    if (combined.includes('wrist') || combined.includes('muñeca')) {
      return 'wrist';
    }

    return null; // No region detected
  }, [niagaraResults?.motivo_consulta, transcript]);

  // ✅ P1.1: Filter evaluationTests by detected region (only show tests matching case region)
  const filteredEvaluationTests = useMemo(() => {
    if (!detectedCaseRegion) {
      // If no region detected, show all tests (backward compatibility)
      return evaluationTests;
    }

    // Filter tests: only show tests that match the detected region OR have no region specified (custom tests)
    return evaluationTests.filter(test => {
      // Allow tests with no region (custom tests) or tests matching detected region
      return !test.region || test.region === detectedCaseRegion;
    });
  }, [evaluationTests, detectedCaseRegion]);

  // ✅ Day 3: Build current session for comparison
  const buildCurrentSession = useCallback((): Session | null => {
    if (!currentPatient?.id && !patientIdFromUrl) return null;
    if (!localSoapNote) return null; // Only show comparison when SOAP is generated

    const patientId = currentPatient?.id || patientIdFromUrl || demoPatient.id;
    const patientName = currentPatient?.fullName ||
      `${currentPatient?.personalInfo?.firstName || ''} ${currentPatient?.personalInfo?.lastName || ''}`.trim() ||
      demoPatient.name;

    const currentSessionId = sessionId || `${TEMP_USER_ID}-${sessionStartTime.getTime()}`;

    return {
      id: currentSessionId,
      userId: user?.uid || TEMP_USER_ID,
      patientId: patientId,
      patientName: patientName,
      transcript: transcript || '',
      soapNote: localSoapNote,
      physicalTests: evaluationTests,
      timestamp: new Date(),
      status: soapStatus === 'finalized' ? 'completed' : 'draft',
      transcriptionMeta: transcriptMeta ? {
        lang: transcriptMeta.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
        languagePreference: languagePreference,
        mode: mode,
        averageLogProb: transcriptMeta.averageLogProb ?? null,
        durationSeconds: transcriptMeta.durationSeconds ?? null,
        recordedAt: transcriptMeta.recordedAt || new Date().toISOString(),
      } : undefined,
    };
  }, [
    currentPatient,
    patientIdFromUrl,
    localSoapNote,
    sessionId,
    sessionStartTime,
    user?.uid,
    transcript,
    evaluationTests,
    soapStatus,
    transcriptMeta,
    languagePreference,
    mode,
  ]);

  // ✅ Day 3: Update current session when relevant data changes
  useEffect(() => {
    const session = buildCurrentSession();
    setCurrentSessionForComparison(session);
  }, [buildCurrentSession]);

  // ✅ WO-RESILIENCE-001: Restore transcript from Firestore auto-save for follow-up sessions
  useEffect(() => {
    if (!user?.uid || !patientIdFromUrl) return;
    if (autoSaveRestoreAttempted) return;
    if (soapStatus === 'finalized') return;
    if (sessionTypeFromUrl !== 'followup') return;

    let cancelled = false;

    const restoreFromFirestore = async () => {
      try {
        const sessions = await sessionService.getInProgressSessions(user.uid);
        if (cancelled) return;

        const match = sessions.find(
          (s) => s.patientId === patientIdFromUrl && s.sessionType === 'followup',
        );

        if (match?.transcript?.trim()) {
          setTranscript(match.transcript);
          setHasRestoredFromAutoSave(true);
          setAutoSaveRestoreAttempted(true);
          console.log('[RESILIENCE] Restored transcript from auto-save for follow-up session:', {
            hasPatientId: Boolean(patientIdFromUrl),
            sessionTypeFromUrl,
          });
        } else {
          // Firestore respondió y no hay sesión válida para ESTE paciente
          const userId = user.uid || TEMP_USER_ID;
          const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
          SessionStorage.clearSession(patientIdFromUrl, userId, 'follow-up', currentSessionId);
          setAutoSaveRestoreAttempted(true);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[RESILIENCE] Failed to restore from auto-save:', error);
          // Importante: nunca limpiar en error
        }
      }
    };

    restoreFromFirestore();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, patientIdFromUrl, sessionTypeFromUrl, autoSaveRestoreAttempted, soapStatus]);

  // ✅ WORKFLOW PERSISTENCE: Restore workflow state from localStorage on mount
  // ✅ CRITICAL FIX: URL parameters take priority over localStorage
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect - localStorage/auto-save restore check starting...');
    console.log('🔍 [DEBUG] useEffect - sessionTypeFromUrl:', sessionTypeFromUrl);
    console.log('🔍 [DEBUG] useEffect - hasPatientId:', Boolean(patientId));
    console.log('🔍 [DEBUG] useEffect - hasPatientIdFromUrl:', Boolean(patientIdFromUrl));

    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';

    const restoreWorkflowState = () => {
      try {
        const userId = user?.uid || TEMP_USER_ID;
        // ✅ FIX: For initial evaluations (type=initial or no type), DON'T restore ANY state
        // Everything should start fresh and empty for initial evaluations
        const isInitialSession = sessionTypeFromUrl === 'initial' || !sessionTypeFromUrl;

        if (isInitialSession) {
          // WO-IA-RESUME-01: Don't clear when resuming — we load from Firestore and hydrate state
          if (resumeFromUrl && sessionIdFromUrl) {
            return;
          }
          // ✅ WO-FIX-DATA-PERSISTENCE: Only clean ONCE per initial session
          const cleanupKey = `${patientId}-${sessionTypeFromUrl || 'initial'}`;

          // ✅ Verificar si ya limpiamos para esta combinación
          if (hasCleanedForInitial.current === cleanupKey) {
            console.log('[WORKFLOW] ⏭️ Already cleaned for this initial session, skipping cleanup');
            return; // Don't clean again
          }

          // ✅ WO-FIX-DATA-PERSISTENCE: Protection - don't clear if user has important data
          const shouldClearData = () => {
            // Check if there's important data that shouldn't be cleared
            const hasTranscript = transcript && transcript.length > 100;
            const hasAnalysis = niagaraResults !== null; // Use niagaraResults which is available from useNiagaraProcessor
            const hasTests = evaluationTests.length > 0;
            const hasAttachments = attachments.length > 0;

            if (hasTranscript || hasAnalysis || hasTests || hasAttachments) {
              console.log('[WORKFLOW] ⚠️ Data exists, preventing cleanup to preserve user work', {
                hasTranscript: !!hasTranscript,
                hasAnalysis: !!hasAnalysis,
                hasTests: hasTests,
                hasAttachments: hasAttachments
              });
              return false; // Don't clear if user has data
            }

            return true; // Safe to clear
          };

          // Only clear if no important data exists
          if (!shouldClearData()) {
            // Mark as cleaned anyway to prevent repeated checks
            hasCleanedForInitial.current = cleanupKey;
            return; // Don't clear, preserve user data
          }

          // Clear ALL saved state from localStorage for initial evaluations
          // This ensures a completely fresh start with empty transcript, tests, SOAP, etc.
          // ✅ T1: Use v2 key structure with userId, visitType, sessionId (userId already declared above in this block)
          const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
          SessionStorage.clearSession(patientId, userId, 'initial', currentSessionId);
          console.log('[WORKFLOW] ✅ Clearing saved state for initial evaluation (ONCE)');

          // Explicitly reset ALL state to empty/initial values for initial evaluations
          setTranscript('');
          setEvaluationTests([]);
          setSelectedEntityIds([]);
          setSelectedRedFlagIds([]);
          setRedFlagDecisions({});
          setLocalSoapNote(null);
          setActiveTab('analysis'); // Always start at analysis tab for initial evaluations
          setPhysioNotes(''); // Clear physio notes
          setAttachments([]); // Clear clinical attachments
          setAnalysisError(null); // Clear any previous errors
          setSuccessMessage(null); // Clear any previous success messages
          setAttachmentError(null); // Clear attachment errors
          resetNiagaraProcessor(); // Clear niagaraResults and soapNote from previous sessions

          // ✅ Mark as cleaned for this session
          hasCleanedForInitial.current = cleanupKey;
          console.log('[WORKFLOW] ✅ All state reset to empty for initial evaluation');
          return; // Don't restore anything for initial sessions - everything starts empty
        }

        // For other session types (wsib, mva, certificate), restore state normally
        // ✅ T1: Use v2 key structure with userId, visitType, sessionId (with legacy fallback)
        const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
        const savedState = SessionStorage.getSession(patientId, userId, visitType || 'initial', currentSessionId);

        if (!savedState) {
          setSelectedRedFlagIds([]);
          setRedFlagDecisions({});
          setInitialAssessmentClosedAt(null);
          setBaselineIdFromSession(null);
          return;
        }

        // Restore analysis results (niagaraResults)
        // Note: niagaraResults is managed by useNiagaraProcessor hook, so we need to check if there's a way to restore it
        // For now, we'll restore it through the sharedState if available

        // Restore evaluation tests (only for non-initial sessions)
        if (savedState.evaluationTests && Array.isArray(savedState.evaluationTests) && savedState.evaluationTests.length > 0) {
          const sanitized = savedState.evaluationTests.map(sanitizeEvaluationEntry);
          setEvaluationTests(sanitized);
          updatePhysicalEvaluation(sanitized);
          console.log('[WORKFLOW] ✅ Restored evaluation tests:', sanitized.length);
        }

        // Restore active tab (only for non-initial sessions)
        if (savedState.activeTab && ['analysis', 'evaluation', 'soap'].includes(savedState.activeTab)) {
          setActiveTab(savedState.activeTab as ActiveTab);
          console.log('[WORKFLOW] ✅ Restored active tab:', {
            activeTab: savedState.activeTab,
          });
        }

        // Restore SOAP note if exists (only for non-initial sessions)
        if (savedState.localSoapNote) {
          setLocalSoapNote(savedState.localSoapNote);
          console.log('[WORKFLOW] ✅ Restored SOAP note', {
            hasSoapNote: Boolean(savedState.localSoapNote),
          });
        }

        // Restore selected entity IDs (only for non-initial sessions)
        if (savedState.selectedEntityIds && Array.isArray(savedState.selectedEntityIds)) {
          setSelectedEntityIds(savedState.selectedEntityIds);
          console.log('[WORKFLOW] ✅ Restored selected entity IDs:', savedState.selectedEntityIds.length);
        }

        if (savedState.redFlagsAccepted && Array.isArray(savedState.redFlagsAccepted)) {
          setSelectedRedFlagIds(savedState.redFlagsAccepted);
          console.log('[WORKFLOW] ✅ Restored selected red flag IDs:', savedState.redFlagsAccepted.length);
        } else {
          setSelectedRedFlagIds([]);
        }

        if (savedState.redFlagDecisions && typeof savedState.redFlagDecisions === 'object') {
          setRedFlagDecisions(savedState.redFlagDecisions);
          console.log('[WORKFLOW] ✅ Restored red flag decisions:', Object.keys(savedState.redFlagDecisions).length);
        } else {
          setRedFlagDecisions({});
        }

        // Restore transcript (only for non-initial sessions)
        if (savedState.transcript && typeof savedState.transcript === 'string' && !transcript?.trim()) {
          setTranscript(savedState.transcript);
          console.log('[WORKFLOW] ✅ Restored transcript', {
            transcriptLength: savedState.transcript.length,
          });
        }

        // WO-IA-CLOSE-01: Restore initial assessment closed state (clear when not in savedState to avoid bleed between patients)
        setInitialAssessmentClosedAt(savedState.initialAssessmentClosedAt != null && savedState.initialAssessmentClosedAt !== '' ? savedState.initialAssessmentClosedAt : null);
        setBaselineIdFromSession(savedState.baselineId != null && savedState.baselineId !== '' ? savedState.baselineId : null);
      } catch (error) {
        console.error('[WORKFLOW] Error restoring workflow state:', error);
      }
    };

    // Only restore if we have a patient ID and haven't already restored
    if (patientId) {
      restoreWorkflowState();
    }
    return () => {
      if (restoreTranscriptPollRef.current) {
        clearInterval(restoreTranscriptPollRef.current);
        restoreTranscriptPollRef.current = null;
      }
    };
  }, [patientId, sessionTypeFromUrl]); // Only run when patientId or sessionTypeFromUrl changes

  // WO-IA-RESUME-01: Load existing session when resume=true&sessionId=YYY — do not create new session
  // Fallback: when session doc does not exist in sessions (e.g. legacy note-only flow), hydrate from consultation/note so user can close initial assessment without redoing
  useEffect(() => {
    const resumeLoadSupportedForVisitType = visitType === 'initial' || visitType === 'follow-up';
    if (!resumeFromUrl || !resumeLoadSupportedForVisitType) return;
    if (!sessionIdFromUrl) {
      setAnalysisError('Cannot resume: session ID is missing.');
      hasResumeLoadAttemptedRef.current = 'no-session-id';
      return;
    }
    const resumeLoadDedupeKey = `${sessionIdFromUrl}:${visitType}`;
    if (hasResumeLoadAttemptedRef.current === resumeLoadDedupeKey) return;
    hasResumeLoadAttemptedRef.current = resumeLoadDedupeKey;

    logger.info('[WO-IA-RESUME-01] resume detected from URL — loading session', { sessionId: sessionIdFromUrl });
    let cancelled = false;
    (async () => {
      try {
        const sessionData = await sessionService.getSessionById(sessionIdFromUrl);
        if (cancelled) return;
        if (sessionData && sessionData.soapNote) {
          logger.info('[WO-IA-RESUME-01] loadSession(sessionId)', { sessionId: sessionIdFromUrl });
          setSessionId(sessionIdFromUrl);
          setLocalSoapNote(sessionData.soapNote as SOAPNote);
          const soapNoteHasExplicitFinalizedStatus =
            (sessionData.soapNote as { status?: string })?.status === 'finalized';
          const sessionIsExplicitlyFinalized =
            visitType === 'follow-up'
              ? sessionData.status === 'completed' && soapNoteHasExplicitFinalizedStatus
              : sessionData.status === 'completed';
          const resolvedSoapStatus = sessionIsExplicitlyFinalized ? 'finalized' : 'draft';
          setSoapStatus(resolvedSoapStatus as SOAPStatus);
          if (hasUndecidedFollowUpRedFlags()) {
            console.warn('[RED-FLAG-GATE] Follow-up blocked — decisions pending');
            return;
          }
          setActiveTab('soap');
          setAnalysisError(null);
          setResumeLoadFailed(null);
          if (sessionData.transcript && typeof sessionData.transcript === 'string') {
            setTranscript(sessionData.transcript);
          }
          if (sessionData.physicalTests && Array.isArray(sessionData.physicalTests) && sessionData.physicalTests.length > 0) {
            const sanitized = (sessionData.physicalTests as EvaluationTestEntry[]).map(sanitizeEvaluationEntry);
            setEvaluationTests(sanitized);
            updatePhysicalEvaluation(sanitized);
          }
          return;
        }
        // Fallback: session doc missing (e.g. note saved but session never written). Hydrate from consultation/note.
        if (!patientIdFromUrl) {
          setAnalysisError('Session not found or could not be loaded. The data may be saved as a note — use the links below.');
          setResumeLoadFailed(null);
          return;
        }
        const notes = await PersistenceService.getNotesByPatient(patientIdFromUrl);
        if (cancelled) return;
        const note = notes.find((n) => n.sessionId === sessionIdFromUrl) ?? notes[0];
        if (note?.soapData) {
          await hydrateResumeFromNote(note, sessionIdFromUrl, 'missing-session');
          return;
        }
        setAnalysisError('Session not found or could not be loaded. The data may be saved as a note — use the links below.');
        setResumeLoadFailed(patientIdFromUrl ? { sessionId: sessionIdFromUrl, patientId: patientIdFromUrl } : null);
      } catch (err) {
        if (cancelled) return;
        try {
          const notes = await PersistenceService.getNotesByPatient(patientIdFromUrl ?? '');
          if (cancelled) return;
          const note = notes.find((n) => n.sessionId === sessionIdFromUrl) ?? notes[0];
          if (note?.soapData) {
            await hydrateResumeFromNote(note, sessionIdFromUrl, 'session-load-error');
            return;
          }
        } catch (_) {
          // ignore
        }
        setAnalysisError('Session not found or could not be loaded. The data may be saved as a note — use the links below.');
        setResumeLoadFailed(patientIdFromUrl ? { sessionId: sessionIdFromUrl, patientId: patientIdFromUrl } : null);
        console.error('[WO-IA-RESUME-01] Failed to load session:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [hydrateResumeFromNote, patientIdFromUrl, resumeFromUrl, sessionIdFromUrl, visitType]);

  // ✅ WORKFLOW PERSISTENCE: Auto-save workflow state to localStorage
  // Use refs to track previous values and only save when there are actual changes
  const prevStateRef = useRef<string>('');

  useEffect(() => {
    if (!patientId) return;

    const saveWorkflowState = () => {
      try {
        const workflowState = {
          transcript: transcript || '',
          niagaraResults: niagaraResults || null,
          evaluationTests: evaluationTests || [],
          activeTab: activeTab,
          selectedEntityIds: selectedEntityIds || [],
          redFlagsDetected: niagaraResults?.red_flags ?? [],
          redFlagsAccepted: selectedRedFlagIds ?? [],
          redFlagDecisions: redFlagDecisions || {},
          localSoapNote: localSoapNote || null,
          soapStatus: soapStatus,
          visitType: visitType,
          timestamp: new Date().toISOString(),
          version: '1.0',
          ...(initialAssessmentClosedAt != null && { initialAssessmentClosedAt }),
          ...(baselineIdFromSession != null && { baselineId: baselineIdFromSession }),
        };

        // Create a stable key to compare states
        const stateKey = JSON.stringify({
          transcriptLength: transcript?.length || 0,
          testCount: evaluationTests.length,
          activeTab: activeTab,
          selectedEntityIdsCount: selectedEntityIds.length,
          redFlagsAcceptedCount: selectedRedFlagIds.length,
          redFlagDecisionCount: Object.keys(redFlagDecisions || {}).length,
          soapStatus: soapStatus,
          visitType: visitType,
          initialAssessmentClosedAt,
          baselineIdFromSession,
        });

        // Only save if state actually changed
        if (prevStateRef.current === stateKey) {
          return; // Skip save if nothing changed
        }

        prevStateRef.current = stateKey;
        // ✅ T1: Use v2 key structure with userId, visitType, sessionId
        const userId = user?.uid || TEMP_USER_ID;
        const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
        SessionStorage.saveSession(patientId, workflowState, userId, visitType || 'initial', currentSessionId);
        console.log('[WORKFLOW] 💾 Auto-saved workflow state:', {
          transcriptLength: transcript?.length || 0,
          testCount: evaluationTests.length,
          activeTab: activeTab
        });
      } catch (error) {
        console.error('[WORKFLOW] Error saving workflow state:', error);
      }
    };

    // Save every 30 seconds
    const interval = setInterval(saveWorkflowState, 30000);

    // Save on beforeunload (when user leaves page)
    const handleBeforeUnload = () => {
      saveWorkflowState();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial save
    saveWorkflowState();

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final save on cleanup
      saveWorkflowState();
    };
  }, [patientId, transcript, niagaraResults, evaluationTests, activeTab, selectedEntityIds, selectedRedFlagIds, redFlagDecisions, localSoapNote, soapStatus, visitType, initialAssessmentClosedAt, baselineIdFromSession]);

  // WO-BUG-011: Auto-save transcript to Firestore every 30s while recording (survives browser close)
  useEffect(() => {
    if (!isRecording || !transcript?.trim()) return;

    const autoSaveToFirestore = async () => {
      try {
        const practitionerUid = user?.uid;
        if (!practitionerUid) return;

        const stateSessionKey = sessionId;
        const reservedWorkflowId = workflowReservedSessionIdRef.current;
        const mountAnchorMs = sessionStartTime.getTime();
        const legacyFallbackId = `${practitionerUid}-${mountAnchorMs}`;
        const proposedNewDocId = reservedWorkflowId ?? legacyFallbackId;
        const activeDocIdForRead = stateSessionKey ?? proposedNewDocId;

        const transcriptBody = transcript;
        const autosaveIsoTime = new Date().toISOString();
        const payloadPatientKey = patientId;
        const payloadSessionKind = currentSessionType;
        const lastPersistedTranscript = lastFirestoreTranscriptRef.current;
        const lastPersistedSessionId = lastFirestoreTranscriptSessionIdRef.current;
        const transcriptUnchanged =
          lastPersistedSessionId === activeDocIdForRead &&
          lastPersistedTranscript === transcriptBody;
        if (transcriptUnchanged) {
          return;
        }
        const payload = {
          transcript: transcriptBody,
          transcriptAutoSavedAt: autosaveIsoTime,
          patientId: payloadPatientKey,
          patientName:
            currentPatient?.fullName ||
            `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() ||
            demoPatient.name,
          userId: practitionerUid,
          sessionDateKey: toLocalDateKey(sessionStartTime),
          status: 'recording_in_progress' as const,
          sessionType: payloadSessionKind,
          clientBuildId: currentClientBuildId,
          clientAppVersion: currentClientAppVersion,
        };

        if (stateSessionKey) {
          const updateTargetId = stateSessionKey;
          await sessionService.updateSession(updateTargetId, payload);
          lastFirestoreTranscriptRef.current = transcriptBody;
          lastFirestoreTranscriptSessionIdRef.current = updateTargetId;
        } else {
          const idempotencyPatient = patientId;
          const idempotencyUser = practitionerUid;
          const idempotencyKind = currentSessionType;
          const lookupReferenceDate = new Date();
          const reuseCandidateId = await sessionService.findReusableSessionForDayAndType(
            idempotencyPatient,
            idempotencyUser,
            idempotencyKind,
            lookupReferenceDate
          );
          const hasReuse = reuseCandidateId != null;
          const createTargetId = hasReuse ? reuseCandidateId : proposedNewDocId;
          const mergeForWrite = hasReuse;
          const persistedSessionId = await sessionService.createSessionWithId(createTargetId, payload, {
            merge: mergeForWrite,
          });
          const nextStateSessionId = persistedSessionId;
          lastFirestoreTranscriptRef.current = transcriptBody;
          lastFirestoreTranscriptSessionIdRef.current = nextStateSessionId;
          setSessionId(nextStateSessionId);
        }

        console.log('[AutoSave] Transcript guardado en Firestore:', {
          sessionId: activeDocIdForRead,
          transcriptLength: transcript.length,
        });
      } catch (error) {
        console.warn('[AutoSave] No se pudo guardar transcript en Firestore:', error);
      }
    };

    const interval = setInterval(autoSaveToFirestore, 10000);
    return () => clearInterval(interval);
  }, [isRecording, transcript, sessionId, sessionStartTime, patientId, user?.uid, currentSessionType]);

  // WO-RESUME: Create Firestore session as soon as recording starts so sessionId is set before unmount (transcript only exists after stop)
  useEffect(() => {
    if (!isRecording || sessionId || !user?.uid || !patientIdFromUrl) return;
    const patientName =
      currentPatient?.fullName ||
      `${(currentPatient as any)?.firstName ?? ''} ${(currentPatient as any)?.lastName ?? ''}`.trim() ||
      'Patient';
    const authUid = user.uid;
    const reservedWorkflowId = workflowReservedSessionIdRef.current;
    const anchorMs = sessionStartTime.getTime();
    const computedFallbackId = `${authUid}-${anchorMs}`;
    const proposedRecordingId = reservedWorkflowId ?? computedFallbackId;
    void (async () => {
      const pid = patientIdFromUrl;
      const kind = currentSessionType;
      const referenceDate = new Date();
      const reuseId = await sessionService.findReusableSessionForDayAndType(pid, authUid, kind, referenceDate);
      const hasReuse = reuseId != null;
      const targetRecordingId = hasReuse ? reuseId : proposedRecordingId;
      const mergeBootstrap = hasReuse;
      try {
        const actualId = await sessionService.createSessionWithId(
          targetRecordingId,
          {
            patientId: patientIdFromUrl,
            patientName,
            userId: authUid,
            sessionDateKey: toLocalDateKey(sessionStartTime),
            status: 'recording_in_progress',
            transcript: '',
            sessionType: currentSessionType,
            clientBuildId: currentClientBuildId,
            clientAppVersion: currentClientAppVersion,
          },
          { merge: mergeBootstrap }
        );
        const transcriptPersistId = actualId;
        sessionIdRef.current = transcriptPersistId;
        sessionIdForTranscriptRef.current = transcriptPersistId;
        lastFirestoreTranscriptRef.current = '';
        lastFirestoreTranscriptSessionIdRef.current = transcriptPersistId;
        setSessionId(transcriptPersistId);
      } catch {
        /* non-blocking */
      }
    })();
  }, [isRecording, sessionId, user?.uid, patientIdFromUrl, sessionStartTime, currentPatient, currentSessionType]);

  // ✅ PHASE 2: Track if we're actively adding tests to prevent useEffect from overwriting
  const isAddingTestsRef = useRef(false);
  const lastSharedStateRef = useRef<string>(''); // Track last sharedState to prevent unnecessary updates
  const prevPatientIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ✅ PHASE 2: Skip if we're actively adding tests (to prevent overwriting)
    // ✅ FIX: Detect patient change and clear tests
    if (prevPatientIdRef.current && prevPatientIdRef.current !== patientId) {
      console.log('[PHASE2] Patient changed, clearing evaluation tests');
      setEvaluationTests([]);
      lastSharedStateRef.current = '';
      prevPatientIdRef.current = patientId;
      return;
    }
    prevPatientIdRef.current = patientId;

    if (isAddingTestsRef.current) {
      console.log(`[PHASE2] useEffect - Skipping load (actively adding tests)`);
      return;
    }

    // ✅ FIX: Create a stable reference to compare
    const currentSharedStateKey = JSON.stringify(sharedState.physicalEvaluation?.selectedTests?.map(t => t.id).sort() || []);

    // ✅ FIX: Skip if sharedState hasn't actually changed
    if (lastSharedStateRef.current === currentSharedStateKey) {
      console.log(`[PHASE2] useEffect - SharedState unchanged, skipping update`);
      return;
    }

    // ✅ PHASE 2: Enhanced logging for debugging
    console.log(`[PHASE2] useEffect - Loading from sharedState:`, {
      hasSelectedTests: !!sharedState.physicalEvaluation?.selectedTests,
      selectedTestsCount: sharedState.physicalEvaluation?.selectedTests?.length || 0,
      hasDetectedCaseRegion: Boolean(detectedCaseRegion),
    });

    if (sharedState.physicalEvaluation?.selectedTests) {
      const sanitized = sharedState.physicalEvaluation.selectedTests.map(sanitizeEvaluationEntry);
      console.log(`[PHASE2] Sanitized tests from sharedState:`, {
        sanitizedCount: sanitized.length,
      });

      // ✅ FIX: Update ref before setting state to prevent re-trigger
      lastSharedStateRef.current = currentSharedStateKey;

      // ✅ PHASE 2 FIX: Use functional update to compare with latest state
      setEvaluationTests((currentTests) => {
        // ✅ PHASE 2: Only update if sharedState has more tests than current (to avoid overwriting new additions)
        // OR if current tests are empty (initial load)
        const currentTestIds = new Set(currentTests.map(t => t.id));
        const sharedTestIds = new Set(sanitized.map(t => t.id));
        const hasNewTests = sanitized.some(t => !currentTestIds.has(t.id));
        const isInitialLoad = currentTests.length === 0;
        const currentTestsHaveResults = currentTests.some((testEntry) => {
          const hasResult = testEntry.result !== 'normal' || testEntry.notes.trim() !== '';
          return hasResult;
        });
        if (!hasNewTests && !isInitialLoad) {
          console.log(`[PHASE2] No new tests in sharedState and not initial load, preserving current ${currentTests.length} tests`);
          return currentTests;
        }
        // ✅ BUG-SOAP-001: If current tests already have documented results, don't overwrite with sharedState
        if (currentTestsHaveResults && !isInitialLoad) {
          console.log(`[PHASE2] Current tests have documented results, preserving to avoid overwriting with sharedState`);
          return currentTests;
        }

        // ✅ PHASE 2 FIX: Don't filter AI-recommended tests by region - they're already validated
        // Only filter manual tests from wrong region
        let testsToSet = sanitized;
        if (detectedCaseRegion) {
          testsToSet = sanitized.filter(test => {
            // ✅ PHASE 2: Allow AI-recommended tests (source === "ai") regardless of region
            // Only filter manual/custom tests from wrong region
            if (test.source === "ai") {
              return true; // Always allow AI-recommended tests
            }

            // For manual/custom tests, check region match
            if (test.region && test.region !== detectedCaseRegion) {
              console.warn(`[PHASE2] Filtering out manual test "${test.name}" (${test.region}) - wrong region for case (${detectedCaseRegion})`);
              return false;
            }
            return true;
          });
          console.log(`[PHASE2] Filtered tests by region (${detectedCaseRegion}):`, {
            filteredCount: testsToSet.length,
          });
        }

        console.log(`[PHASE2] Setting evaluationTests (${testsToSet.length} tests)`);
        return testsToSet;
      });
    } else {
      // ✅ PHASE 2: Clear tests if sharedState is empty (new session)
      if (evaluationTests.length > 0) {
        console.log(`[PHASE2] sharedState has no selectedTests, clearing evaluationTests`);
        lastSharedStateRef.current = '';
        setEvaluationTests([]);
      } else {
        console.log(`[PHASE2] No selectedTests in sharedState, skipping load`);
      }
    }
  }, [sharedState.physicalEvaluation?.selectedTests, detectedCaseRegion, patientId]); // ✅ FIX: Added patientId to detect patient changes

  // Check if this is the first session and handle patient consent via SMS
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Reset consent state when patient changes
  // Use ref to track current patient and prevent multiple executions per patient
  const consentCheckRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPatientId = patientIdFromUrl || demoPatient.id;

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Reset state when patient changes
    if (consentCheckRef.current !== currentPatientId) {
      console.log('[WORKFLOW] Patient changed - resetting consent state', {
        previousPatient: consentCheckRef.current,
        newPatient: currentPatientId
      });

      // Reset consent state for new patient
      setWorkflowConsentStatus(null);
      setConsentCheckComplete(false);
      setPatientHasConsent(false);
      consentGrantedRef.current = false;

      // Cleanup polling for previous patient
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }

      // Update ref to new patient
      consentCheckRef.current = currentPatientId;
    } else {
      // Same patient - prevent multiple executions
      return;
    }

    const checkFirstSessionAndConsent = async () => {

      try {
        setCheckingFirstSession(true);

        // Use real patient from URL or fallback to demo
        const patientId = patientIdFromUrl || demoPatient.id;
        // Get patient data (real or demo)
        // IMPORTANT: Always try to load patient from Firestore if we have patientIdFromUrl
        let patient = currentPatient;

        // If currentPatient is not loaded yet but we have patientIdFromUrl, try to load it
        if (!patient && patientIdFromUrl && patientIdFromUrl !== demoPatient.id) {
          try {
            const loadedPatient = await PatientService.getPatientById(patientIdFromUrl);
            if (loadedPatient) {
              patient = loadedPatient;
              setCurrentPatient(loadedPatient); // Update state for future use
            }
          } catch (error) {
            console.warn('[WORKFLOW] Could not load patient, using demo:', error);
          }
        }

        // Fallback to demo patient only if no real patient found
        if (!patient) {
          patient = {
            id: patientId,
            fullName: demoPatient.name,
            firstName: demoPatient.name.split(' ')[0] || '',
            lastName: demoPatient.name.split(' ').slice(1).join(' ') || '',
            email: demoPatient.email,
            phone: demoPatient.phone,
            dateOfBirth: '',
            gender: 'other',
            idNumber: '',
            medicalHistory: '',
            allergies: '',
            medications: '',
            previousInjuries: '',
            referringPhysician: '',
            referringCenter: '',
            referralDate: '',
            referralReason: '',
            insuranceProvider: '',
            insurancePolicy: '',
            insuranceGroup: '',
            copayAmount: 0,
            deductibleAmount: 0,
            emergencyContact: { name: '', relationship: '', phone: '', email: '' },
            occupation: '',
            workplace: '',
            workPhone: '',
            workEmail: '',
            billingAddress: { street: '', city: '', state: '', zipCode: '', country: '' },
            preferredContactMethod: 'email',
            preferredAppointmentTime: 'morning',
            notes: '',
            source: 'direct',
            marketingChannel: 'direct',
            initialConsultationType: 'assessment',
            status: 'active',
            lastVisit: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        const longitudinalContext = await resolveFollowUpClinicalContext(patientId, attachments);
        const isFirst = longitudinalContext.comparisonState.isFirstSession;
        setFollowUpContext(longitudinalContext);
        setIsFirstSession(isFirst);

        // ✅ WO-CONSENT-CLEANUP-03: Check consent via Cloud Function (server-side only)
        // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Never re-check if consent already granted
        if (consentGrantedRef.current === true) {
          console.log('[WORKFLOW] Consent already granted, skipping initial check');
          setPatientHasConsent(true);
          // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Still update status for gate (even if already granted)
          setWorkflowConsentStatus({
            hasValidConsent: true,
            isDeclined: false,
            status: 'ongoing', // Assume ongoing if already granted
            consentMethod: 'verbal' // Assume verbal if already granted
          });
          return;
        }

        const consentResult = await checkConsentViaServer(patientId);
        const hasConsent = consentResult.hasValidConsent;

        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Si declined, NO iniciar polling
        if (consentResult.isDeclined === true) {
          console.warn('[WORKFLOW] 🚫 Declined consent detected - NO polling will be started');
          setWorkflowConsentStatus({
            hasValidConsent: false,
            isDeclined: true,
            status: 'declined',
            consentMethod: consentResult.consentMethod || null,
            declineReasons: consentResult.declineReasons || undefined
          });
          setConsentCheckComplete(true);
          // ❌ NO iniciar polling - declined es permanente
          return;
        }

        // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Store full consent status for gate
        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status
        setWorkflowConsentStatus({
          hasValidConsent: consentResult.hasValidConsent,
          isDeclined: Boolean(consentResult.isDeclined),
          status: consentResult.status || null,
          consentMethod: consentResult.consentMethod || null,
          declineReasons: consentResult.declineReasons || undefined
        });

        // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Mark as granted if true (irreversible)
        if (hasConsent) {
          consentGrantedRef.current = true;
        }

        setPatientHasConsent(hasConsent);
        setConsentStatus(consentResult.status ?? null);

        // ✅ WO-CONSENT-01: DO NOT send SMS automatically
        // The physiotherapist must explicitly click "Send Consent via SMS" button
        // We only check consent status here, not send SMS
        if (isFirst && !hasConsent) {
          // Set consent as pending (will show UI buttons for manual action)
          setConsentPending(true);
          console.log('[WORKFLOW] Consent required for first session. Physiotherapist must send SMS manually.');
        }
      } catch (error) {
        console.error('[WORKFLOW] Error checking first session:', error);
        // Fail-safe: don't block workflow if check fails
        setIsFirstSession(false);
        setPatientHasConsent(false);
      } finally {
        setCheckingFirstSession(false);
      }
    };

    // Only run if we have a patient ID
    if (patientIdFromUrl || currentPatient) {
      checkFirstSessionAndConsent();
    }
  }, [user?.uid, patientIdFromUrl, currentPatient, resolveFollowUpClinicalContext, attachments]); // Re-check if user or patient changes

  // ✅ WO-CONSENT-POLLING-FIX-04: Polling with single instance guard and max attempts
  // NO Firestore listeners - all checks go through Cloud Functions
  const consentPollingRef = useRef<NodeJS.Timeout | null>(null);
  const consentPollingAttemptsRef = useRef<number>(0);
  const consentPollingPatientIdRef = useRef<string | null>(null);

  // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Guard to prevent re-blocking once consent is granted
  // Consent is IRREVERSIBLE in session (PHIPA/ISO compliance + clinical common sense)
  const consentGrantedRef = useRef<boolean>(false);

  const hasValidConsent =
    consentGrantedRef.current === true ||
    workflowConsentStatus?.hasValidConsent === true;

  const handleConsentGrantedImmediate = useCallback(async () => {
    const immediateConsentResult = {
      hasValidConsent: true,
      status: 'ongoing' as const,
      consentMethod: 'verbal' as const,
    };
    const updatedWorkflowStatus = {
      hasValidConsent: immediateConsentResult.hasValidConsent,
      isDeclined: false,
      status: immediateConsentResult.status,
      consentMethod: immediateConsentResult.consentMethod,
    };
    consentGrantedRef.current = true;
    setWorkflowConsentStatus(updatedWorkflowStatus);
    setPatientHasConsent(true);
    setConsentStatus('ongoing');
    setConsentPending(false);
    setSmsError(null);
  }, []);


  useEffect(() => {
    const patientId = patientIdFromUrl || (currentPatient?.id);

    // Skip if no patient ID or demo patient or no user
    if (!patientId || patientId === demoPatient.id || !user?.uid) {
      // Cleanup if patient/user invalid
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }
      return;
    }

    // ✅ P1.3: Stop polling immediately if consent already valid
    if (hasValidConsent) {
      console.log('[WORKFLOW] ✅ Consent granted! UI updated. Stopping polling permanently.');
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      } return;
    }

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: NO iniciar polling si consentimiento está declined
    // Declined es permanente - no tiene sentido seguir preguntando
    if (workflowConsentStatus?.isDeclined === true) {
      console.log('[WORKFLOW] Consent declined - skipping polling setup (permanent block)');
      // Cleanup any existing polling
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }
      return;
    }

    // ✅ WO-CONSENT-DECLINED-REVERSAL-01: NO iniciar polling si consentimiento ya fue otorgado
    // Esto previene que el polling se reinicie después de una reversión
    if (consentGrantedRef.current === true || workflowConsentStatus?.hasValidConsent === true) {
      console.log('[WORKFLOW] Consent already granted - skipping polling setup');
      // Cleanup any existing polling
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }
      return;
    }

    // ✅ Regla 1: Solo se inicia UNA vez por patientId
    // Check if polling is already active for this patient
    if (consentPollingRef.current !== null) {
      if (consentPollingPatientIdRef.current === patientId) {
        console.log('[WORKFLOW] Polling already active for current patient');
        return;
      } else {
        // Patient changed, cleanup previous polling
        console.log('[WORKFLOW] Patient changed, cleaning up previous polling');
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }
    }

    console.log('[WORKFLOW] Setting up consent polling for current patient');
    consentPollingPatientIdRef.current = patientId;
    consentPollingAttemptsRef.current = 0;

    const MAX_ATTEMPTS = 20; // ✅ Regla 3: Límite de polling (ISO/PHIPA friendly)

    // Poll every 5 seconds if consent is pending
    consentPollingRef.current = setInterval(async () => {
      try {
        // ✅ Regla 3: Límite de intentos
        if (++consentPollingAttemptsRef.current >= MAX_ATTEMPTS) {
          console.warn('[WORKFLOW] Consent polling timeout after', MAX_ATTEMPTS, 'attempts');
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
          }
          return;
        }

        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: NO polling si consentimiento está declined
        // Declined es permanente - no tiene sentido seguir preguntando
        if (workflowConsentStatus?.isDeclined === true) {
          console.log('[WORKFLOW] Consent declined - stopping polling immediately (permanent block)');
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
            consentPollingAttemptsRef.current = 0;
            consentPollingPatientIdRef.current = null;
          }
          return;
        }

        // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Never re-check if consent already granted
        if (consentGrantedRef.current === true) {
          console.log('[WORKFLOW] Consent already granted, skipping poll check');
          return;
        }

        const consentResult = await checkConsentViaServer(patientId);

        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: CRITICAL - Check declined FIRST
        // If declined, update state immediately, stop polling, and return
        if (consentResult.isDeclined === true) {
          console.warn('[WORKFLOW] 🚫 Declined consent detected via polling - stopping immediately and updating state');

          // Update state FIRST (this triggers re-render with hard block)
          setWorkflowConsentStatus({
            hasValidConsent: false,
            isDeclined: true,
            status: 'declined',
            consentMethod: consentResult.consentMethod || null,
            declineReasons: consentResult.declineReasons || undefined
          });

          // Stop polling immediately
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
            consentPollingAttemptsRef.current = 0;
            consentPollingPatientIdRef.current = null;
          }

          // Return immediately - no further processing
          return;
        }

        // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Store full consent status for gate
        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Include declined status (should be false here)
        setWorkflowConsentStatus({
          hasValidConsent: consentResult.hasValidConsent,
          isDeclined: false, // Explicit false if not declined
          status: consentResult.status || null,
          consentMethod: consentResult.consentMethod || null,
          declineReasons: undefined // Only set if declined
        });

        // ✅ Regla 2: Se cancela inmediatamente al tener consentimiento
        if (consentResult.hasValidConsent) {
          // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Mark as granted (irreversible)
          consentGrantedRef.current = true;
          setPatientHasConsent(true);
          setConsentStatus(consentResult.status ?? null);
          setConsentPending(false);
          setSmsError(null);
          console.log('[WORKFLOW] ✅ Consent granted! UI updated. Stopping polling permanently.');

          // Stop polling immediately
          if (consentPollingRef.current) {
            clearInterval(consentPollingRef.current);
            consentPollingRef.current = null;
            consentPollingAttemptsRef.current = 0;
            consentPollingPatientIdRef.current = null;
          }
        } else {
          // ✅ WO-CONSENT-SINGLE-SOURCE-OF-TRUTH-05: Only update if not already granted
          if (!consentGrantedRef.current) {
            setPatientHasConsent(false);
            setConsentStatus(consentResult.status ?? null);
          }
        }
      } catch (error) {
        console.warn('[WORKFLOW] Error polling consent status:', error);
        // Don't update state on error - keep current state
      }
    }, 5000); // Poll every 5 seconds

    // ✅ Regla 3: Cleanup REAL
    return () => {
      console.log('[WORKFLOW] Cleaning up consent polling for current patient');
      if (consentPollingRef.current) {
        clearInterval(consentPollingRef.current);
        consentPollingRef.current = null;
        consentPollingAttemptsRef.current = 0;
        consentPollingPatientIdRef.current = null;
      }
    };
  }, [patientIdFromUrl, currentPatient?.id, user?.uid, workflowConsentStatus?.isDeclined, hasValidConsent]); // ✅ Regla 4: Dependencias estables + declined check

  const persistEvaluation = useCallback((next: EvaluationTestEntry[]) => {
    // ✅ PHASE 2: Enhanced logging for debugging
    console.log(`[PHASE2] persistEvaluation called:`, {
      nextCount: next.length,
      hasTests: next.length > 0,
    });

    const sanitized = next.map(sanitizeEvaluationEntry);
    console.log(`[PHASE2] Sanitized tests:`, {
      sanitizedCount: sanitized.length,
      hasSanitizedTests: sanitized.length > 0,
    });

    // ✅ FIX: Use functional update to get current state and compare
    setEvaluationTests((currentTests) => {
      // ✅ FIX: Deep comparison - check IDs, values, notes, and result
      const currentTestIds = new Set(currentTests.map(t => t.id));
      const newTestIds = new Set(sanitized.map(t => t.id));

      // Check for added/removed tests
      const hasTestChanges = sanitized.length !== currentTests.length ||
        sanitized.some(t => !currentTestIds.has(t.id)) ||
        currentTests.some(t => !newTestIds.has(t.id));

      // ✅ FIX: Check for value changes within existing tests
      const hasValueChanges = sanitized.some(newTest => {
        const currentTest = currentTests.find(t => t.id === newTest.id);
        if (!currentTest) return false; // New test, already detected above

        // Compare values (deep comparison)
        const currentValuesStr = JSON.stringify(currentTest.values || {});
        const newValuesStr = JSON.stringify(newTest.values || {});
        if (currentValuesStr !== newValuesStr) {
          console.log(`[PHASE2] Value change detected in test ${newTest.id}:`, {
            hasCurrentValues: Boolean(currentTest.values),
            hasNewValues: Boolean(newTest.values),
          });
          return true;
        }

        // Compare notes
        if ((currentTest.notes || '') !== (newTest.notes || '')) {
          console.log(`[PHASE2] Notes change detected in test ${newTest.id}`);
          return true;
        }

        // Compare result
        if (currentTest.result !== newTest.result) {
          console.log(`[PHASE2] Result change detected in test ${newTest.id}: ${currentTest.result} -> ${newTest.result}`);
          return true;
        }

        return false;
      });

      const hasChanges = hasTestChanges || hasValueChanges;

      if (!hasChanges) {
        console.log(`[PHASE2] No changes detected, skipping update`);
        return currentTests; // Return unchanged
      }

      console.log(`[PHASE2] Changes detected (tests: ${hasTestChanges}, values: ${hasValueChanges}), updating evaluationTests...`);

      // ✅ FIX: Update ref to prevent useEffect from re-triggering
      // Use a more comprehensive key that includes values to detect real changes
      const stateKey = JSON.stringify(sanitized.map(t => ({
        id: t.id,
        values: t.values,
        notes: t.notes,
        result: t.result
      })).sort((a, b) => a.id.localeCompare(b.id)));
      lastSharedStateRef.current = stateKey;

      // ✅ FIX: Set flag to prevent useEffect from overwriting
      isAddingTestsRef.current = true;
      setTimeout(() => {
        isAddingTestsRef.current = false;
      }, 100);

      latestEvaluationPersistRef.current = sanitized;
      if (evaluationPersistTimeoutRef.current) {
        clearTimeout(evaluationPersistTimeoutRef.current);
      }
      evaluationPersistTimeoutRef.current = setTimeout(() => {
        const testsToPersist = latestEvaluationPersistRef.current;
        console.log(`[PHASE2] Calling updatePhysicalEvaluation...`);
        updatePhysicalEvaluation(testsToPersist);
        console.log(`[PHASE2] persistEvaluation completed`);
        evaluationPersistTimeoutRef.current = null;
      }, 800);

      return sanitized;
    });
  }, [updatePhysicalEvaluation]); // ✅ FIX: Removed evaluationTests from dependencies

  useEffect(() => {
    return () => {
      if (evaluationPersistTimeoutRef.current) {
        clearTimeout(evaluationPersistTimeoutRef.current);
        evaluationPersistTimeoutRef.current = null;
      }
    };
  }, []);

  const normalizeName = (value: string) => value.toLowerCase().trim();

  /**
   * Normalize test name for deduplication
   * Removes common prefixes and normalizes formatting
   * WO-FIX-TESTS-DUPLICADOS-03
   */
  const normalizeTestName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/^consider assessing\s+/i, '')
      .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  /**
   * Check if a test with similar name already exists
   * Uses normalized comparison to catch duplicates with different formatting
   * WO-FIX-TESTS-DUPLICADOS-03
   */
  const testAlreadyExists = (
    testName: string,
    existingTests: EvaluationTestEntry[]
  ): boolean => {
    const normalizedNew = normalizeTestName(testName);

    return existingTests.some(test => {
      const normalizedExisting = normalizeTestName(test.name);

      // Exact match after normalization
      if (normalizedNew === normalizedExisting) {
        console.log(`[DEDUP] Exact match found`, {
          hasIncomingName: Boolean(testName),
          hasExistingName: Boolean(test.name),
        });
        return true;
      }

      // One contains the other (fuzzy match) - only for reasonably long names
      const minLength = Math.min(normalizedNew.length, normalizedExisting.length);
      if (minLength > 10) {
        if (normalizedNew.includes(normalizedExisting) ||
          normalizedExisting.includes(normalizedNew)) {
          console.log(`[DEDUP] Fuzzy match found`, {
            hasIncomingName: Boolean(testName),
            hasExistingName: Boolean(test.name),
          });
          return true;
        }
      }

      return false;
    });
  };

  const resetCustomForm = useCallback(() => {
    setCustomTestName("");
    setCustomTestNotes("");
    setCustomTestResult("");
    setCustomTestRegion("shoulder");
  }, []);

  const addEvaluationTest = useCallback(
    (entry: EvaluationTestEntry) => {
      // ✅ PHASE 2: Enhanced logging for debugging
      console.log(`[PHASE2] addEvaluationTest called:`, {
        hasName: Boolean(entry.name),
        hasId: Boolean(entry.id),
        region: entry.region,
        source: entry.source,
        detectedCaseRegion: detectedCaseRegion,
        currentTestsCount: evaluationTests.length
      });

      // ✅ PHASE 1: Allow AI-recommended tests even if region doesn't match exactly
      // The AI has full context and may recommend related tests (e.g., hand/ankle tests
      // when patient reports pain in those areas during acute episodes)
      const isAIRecommended = entry.source === "ai";

      // ✅ P1.1: Validate region match before adding test, but allow AI recommendations
      if (detectedCaseRegion && entry.region && entry.region !== detectedCaseRegion && !isAIRecommended) {
        console.warn(`[PHASE2] Test "${entry.name}" region (${entry.region}) does not match case region (${detectedCaseRegion}). Skipping.`);
        setAnalysisError(`Test "${entry.name}" is for ${regionLabels[entry.region]}, but this case is for ${regionLabels[detectedCaseRegion]}. Please select tests appropriate for the current case.`);
        return; // Block adding test from different region (unless AI-recommended)
      }

      // Log when AI-recommended test from different region is allowed
      if (isAIRecommended && detectedCaseRegion && entry.region && entry.region !== detectedCaseRegion) {
        console.log(`[PHASE2] Allowing AI-recommended test from different region`, {
          hasName: Boolean(entry.name),
          entryRegion: entry.region,
          detectedCaseRegion,
        });
      }

      // ✅ PHASE 2 FIX: Use functional update to ensure we have latest state
      setEvaluationTests((currentTests) => {
        const exists = currentTests.some(
          (test) => test.id === entry.id || normalizeName(test.name) === normalizeName(entry.name)
        );

        if (exists) {
          console.log(`[PHASE2] Test already exists, skipping`, {
            hasName: Boolean(entry.name),
          });
          return currentTests; // Return current state unchanged
        }

        console.log(`[PHASE2] ✅ Adding test "${entry.name}" to evaluationTests`);
        const newTests = [...currentTests, entry];
        console.log(`[PHASE2] New tests array (${newTests.length} tests):`, newTests.map(t => t.name));

        // ✅ PHASE 2 FIX: Persist immediately with new state using setTimeout to avoid batching issues
        setTimeout(() => {
          persistEvaluation(newTests);
        }, 0);

        return newTests;
      });
    },
    [persistEvaluation, detectedCaseRegion, normalizeName]
  );

  const removeEvaluationTest = useCallback(
    (id: string) => {
      setEvaluationTests((currentTests) => {
        const next = currentTests.filter((test) => test.id !== id);
        persistEvaluation(next);
        return next;
      });
    },
    [persistEvaluation]
  );

  const updateEvaluationTest = useCallback(
    (id: string, updates: Partial<EvaluationTestEntry>) => {
      setEvaluationTests((currentTests) => {
        const next = currentTests.map((test) =>
          test.id === id ? { ...test, ...updates } : test
        );
        persistEvaluation(next);
        return next;
      });
    },
    [persistEvaluation]
  );

  const createEntryFromLibrary = useCallback(

    (
      test: PhysicalTest | MskTestDefinition,
      source: "ai" | "manual"
    ): EvaluationTestEntry => {
      const definition = getTestDefinition(test.id);
      const hasFields = definition && hasFieldDefinitions(definition);

      // Initialize values for tests with fields - PREfill numeric values (ROM, Strength) with normal ranges
      // If physio changes these values, it means they don't match normal ranges
      // NOTE: Units (kg, etc.) will be subject to geolocation or physical practice location
      // to respect locally used measurement units (future enhancement)
      const initialValues: Record<string, number | string | boolean | null> = {};
      const prefillDefaults: Record<string, number | null> = {}; // Track pre-filled defaults

      if (hasFields && definition.fields) {
        definition.fields.forEach((field) => {
          if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
            // PREfill ROM and strength measurements with normal range max (optimal value)
            if (field.normalRange) {
              const normalValue = field.normalRange.max; // Use max of normal range as prefill
              initialValues[field.id] = normalValue;
              prefillDefaults[field.id] = normalValue; // Store for comparison
            } else if (field.unit === 'kg' || field.unit === 'cm') {
              // For measurements without normal range, leave empty for manual entry
              initialValues[field.id] = null;
              prefillDefaults[field.id] = null;
            } else {
              initialValues[field.id] = null;
              prefillDefaults[field.id] = null;
            }
          } else if (field.kind === 'yes_no') {
            // Checkboxes default to false (unchecked)
            initialValues[field.id] = false;
          } else if (field.kind === 'score_0_10') {
            // Score fields default to 0 (no pain)
            initialValues[field.id] = 0;
          } else {
            // Text fields default to empty string
            initialValues[field.id] = '';
          }
        });
      }

      const shouldLocalizeLibraryTest = isSpainPilot();
      const localizedTest = shouldLocalizeLibraryTest
        ? localizeMskTestForEs(test)
        : test;

      return {
        id: test.id,
        name: localizedTest.name,
        region: test.region,
        source,
        description: localizedTest.description,
        result: "normal",
        notes: "", // Do not prefill written text - leave empty for manual entry
        values: hasFields ? initialValues : undefined,
        _prefillDefaults: hasFields ? prefillDefaults : undefined, // Internal: track pre-filled values
      };
    },
    []
  );

  const createCustomEntry = (
    name: string,
    source: "ai" | "manual" | "custom",
    region: MSKRegion | null = null
  ): EvaluationTestEntry => ({
    id:
      source === "custom"
        ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : `ai-${normalizeName(name)}`,
    name,
    region,
    source,
    result: "normal",
    notes: "",
  });

  const isTestAlreadySelected = useCallback(
    (id: string, name: string) =>
      evaluationTests.some(
        (test) => test.id === id || normalizeName(test.name) === normalizeName(name)
      ),
    [evaluationTests]
  );

  const handleAddCustomTest = useCallback(() => {
    if (!customTestName.trim()) return;
    const region = customTestRegion === "other" ? null : customTestRegion;
    const entry = {
      ...createCustomEntry(customTestName.trim(), "custom", region),
      result: customTestResult || "normal",
      notes: customTestNotes.trim(),
    };
    addEvaluationTest(entry);
    resetCustomForm();
    setIsCustomFormOpen(false);
  }, [
    addEvaluationTest,
    createCustomEntry,
    customTestName,
    customTestNotes,
    customTestResult,
    customTestRegion,
    resetCustomForm,
  ]);


  useEffect(() => {
    // WO-FOLLOWUP-SOAP-03: Follow-up generates SOAP via generateFollowUpAnalysis (Fase C: documentation + considerations),
    // not via useNiagaraProcessor. Skip overwrite when visitType is follow-up.
    if (soapNote && visitType !== 'follow-up') {
      const derivedSoapNote = deriveSOAPDataFromRawText(soapNote);
      if (derivedSoapNote) {
        setLocalSoapNote(derivedSoapNote);
      }
    }
  }, [soapNote, visitType]);

  useEffect(() => {
    // ✅ PHASE 2: Clear selections when new analysis starts
      console.log('[PHASE2] Clearing selectedEntityIds due to new motivo_consulta');
    setSelectedEntityIds([]);
  }, [niagaraResults?.motivo_consulta]);

  // ✅ PHASE 2: Clear evaluation tests only when patient actually changed (both ids defined and different)
  // WO-RESUME-INTERRUPTED: Don't clear when currentPatient is still loading (undefined) on remount — avoids wiping restored state
  useEffect(() => {
    if (!patientIdFromUrl || !currentPatient?.id) return;
    if (patientIdFromUrl !== currentPatient.id) {
      console.log('[PHASE2] Patient changed, clearing evaluation tests');
      setEvaluationTests([]);
      isAddingTestsRef.current = false;
    }
  }, [patientIdFromUrl, currentPatient?.id]);

  // ✅ WO-FIX-TESTS-DUPLICADOS-03: Clean up old test names with "Consider assessing" prefix
  // Run once on mount to clean up legacy test names
  useEffect(() => {
    setEvaluationTests(prev => {
      let cleaned = false;
      const cleanedTests = prev.map(test => {
        if (test.name.toLowerCase().startsWith('consider assessing')) {
          cleaned = true;
          const newName = test.name.replace(/^consider assessing\s+/i, '');
          console.log(`[CLEANUP] Renaming legacy test label`, {
            hasOriginalName: Boolean(test.name),
            hasNewName: Boolean(newName),
          });
          return { ...test, name: newName };
        }
        return test;
      });

      if (cleaned) {
        console.log(`[CLEANUP] Cleaned up old test names`);
        // Persist cleaned names
        setTimeout(() => {
          persistEvaluation(cleanedTests);
        }, 0);
        return cleanedTests;
      }
      return prev;
    });
  }, []); // Run once on mount

  // Track transcription timestamps
  useEffect(() => {
    // Capture start when recording starts or transcript first appears
    if ((isRecording || (transcript && transcript.trim().length > 0)) && !transcriptionStartTime) {
      setTranscriptionStartTime(new Date());
    }

    // Capture end when transcript has content and recording stopped
    if (transcript && transcript.trim().length > 0 && !isRecording && !transcriptionEndTime && transcriptionStartTime) {
      setTranscriptionEndTime(new Date());
    }
  }, [isRecording, transcript, transcriptionStartTime, transcriptionEndTime]);

  const resolveVoiceLanguage = useCallback((): 'en' | 'es' | 'fr' => {
    if (languagePreference !== 'auto') {
      return languagePreference as 'en' | 'es' | 'fr';
    }
    const detected = transcriptMeta?.detectedLanguage?.toLowerCase() ?? '';
    if (detected.startsWith('es')) return 'es';
    if (detected.startsWith('fr')) return 'fr';
    return 'en';
  }, [languagePreference, transcriptMeta?.detectedLanguage]);

  useEffect(() => {
    setDismissedSuggestionKeys([]);
  }, [niagaraResults?.evaluaciones_fisicas_sugeridas]);

  const aiSuggestions = useMemo<Array<{
    key: number;
    originalIndex: number;
    rawName: string;
    displayName: string;
    match: MskTestDefinition | null;
  }>>(() => {
    // ✅ CRITICAL FIX 3: Skip physical tests for follow-up visits
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;
    if (isFollowUpWorkflow) {
      console.log('[WORKFLOW] ⚠️ Skipping physical test suggestions for follow-up visit');
      return [];
    }

    if (!niagaraResults?.evaluaciones_fisicas_sugeridas) return [];
    // ✅ PHASE 2 FIX: Filter out null/undefined tests to match interactiveResults.physicalTests
    // This ensures indices match between selectedEntityIds and aiSuggestions
    return niagaraResults.evaluaciones_fisicas_sugeridas
      .map((test: any, originalIndex: number) => {
        if (!test) return null; // Mark null tests for filtering

        if (typeof test === "string") {
          const trimmed = test.trim();
          return {
            key: originalIndex, // Keep original index for mapping
            originalIndex, // Store original index
            rawName: trimmed,
            displayName: trimmed,
            match: (() => {
              const libraryMatch = matchTestName(trimmed, detectedCaseRegion);
              return isLibraryTestDefinition(libraryMatch) ? libraryMatch : null;
            })(),
          };
        }
        const name = test.test || test.name || `Suggested test ${originalIndex + 1}`;
        const objective = test.objetivo || test.indicacion || "";
        const description = objective || test.justificacion || "";
        return {
          key: originalIndex, // Keep original index for mapping
          originalIndex, // Store original index
          rawName: name,
          displayName: description ? `${name} — ${description}` : name,
          match: (() => {
            const libraryMatch = matchTestName(name, detectedCaseRegion);
            return isLibraryTestDefinition(libraryMatch) ? libraryMatch : null;
          })(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null); // Filter nulls but keep original indices
  }, [niagaraResults, sessionTypeFromUrl, workflowRoute?.type, detectedCaseRegion, followUpAlerts]); // ✅ FIX: Add detectedCaseRegion to dependencies

  const pendingAiSuggestions = useMemo(() => {
    const toKey = (value: string) => value?.toLowerCase().trim() ?? "";
    return aiSuggestions.filter((item) => {
      const candidateName = item.match ? item.match.name : item.rawName || item.displayName || "";
      const candidateId = item.match ? item.match.id : `ai-${toKey(candidateName)}`;
      const alreadySelected = filteredEvaluationTests.some( // ✅ P1.1: Check against filtered tests
        (test) => test.id === candidateId || toKey(test.name) === toKey(candidateName)
      );
      const isDismissed = dismissedSuggestionKeys.includes(item.key);
      return !alreadySelected && !isDismissed;
    });
  }, [aiSuggestions, filteredEvaluationTests, dismissedSuggestionKeys]);

  const interactiveResults = useMemo(() => {
    // WO-REDFLAG-FOLLOWUP-002: follow-up with red flags uses followUpAlerts, not niagaraResults
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;
    if (isFollowUpWorkflow) {
      const rawFollowUpRedFlags = followUpAlerts?.red_flags;
      const normalizedFollowUpFlags = normalizeRedFlagsForDisplay(rawFollowUpRedFlags);
      const followUpFlagsForUi = filterTrivialRedFlagEntries(normalizedFollowUpFlags);
      const followUpRedFlagCount = followUpFlagsForUi.length;
      if (followUpRedFlagCount > 0) {
        return {
          redFlags: followUpFlagsForUi,
          evaluaciones_fisicas_sugeridas: [],
        } as any;
      }
      // No red flags in follow-up — return null (static message in AnalysisTab)
      return null;
    }
    if (!niagaraResults) return null;

    const rawTests = niagaraResults.evaluaciones_fisicas_sugeridas || [];
    // ✅ PHASE 2 FIX: Keep original index in physicalTests to match aiSuggestions
    // ✅ FASE 1 FIX: Only show top 5 tests in Phase 1 (AnalysisTab)
    // Tests 6+ will be available in sidebar during Phase 2 (EvaluationTab)
    const allPhysicalTests = rawTests
      .map((test: any, originalIndex: number) => {
        if (!test) return null;

        const testName = typeof test === "string" ? test : (test.test || test.name || "Physical test");
        // ✅ FIX: Match with library to get sensitivity/specificity values for score calculation
        // ✅ FIX: Pass detectedCaseRegion for region filtering (prevents wrist tests in lumbar cases)
        const libraryMatch = matchTestName(testName, detectedCaseRegion);

        if (typeof test === "string") {
          return {
            originalIndex, // ✅ PHASE 2: Store original index for ID mapping
            name: testName,
            test: testName, // Add test field for compatibility
            // ✅ FIX: Use library match values for score calculation if available
            sensitivity: libraryMatch?.sensitivity ? Number(libraryMatch.sensitivity) : undefined,
            specificity: libraryMatch?.specificity ? Number(libraryMatch.specificity) : undefined,
            sensitivityQualitative: (libraryMatch as any)?.sensitivityQualitative || undefined,
            specificityQualitative: (libraryMatch as any)?.specificityQualitative || undefined,
            evidence_level: (libraryMatch as any)?.evidence_level,
            evidencia: (libraryMatch as any)?.evidence_level,
            indication: "",
            justification: "",
            libraryMatch: libraryMatch // Store match for reference
          };
        }

        return {
          originalIndex, // ✅ PHASE 2: Store original index for ID mapping
          name: testName,
          test: testName, // Add test field for compatibility
          // ✅ FIX: Priority: Library match values > Vertex AI values > undefined
          sensitivity:
            libraryMatch?.sensitivity !== undefined
              ? Number(libraryMatch.sensitivity)
              : test.sensibilidad !== undefined
                ? Number(test.sensibilidad)
                : test.sensitivity !== undefined
                  ? Number(test.sensitivity)
                  : undefined,
          specificity:
            libraryMatch?.specificity !== undefined
              ? Number(libraryMatch.specificity)
              : test.especificidad !== undefined
                ? Number(test.especificidad)
                : test.specificity !== undefined
                  ? Number(test.specificity)
                  : undefined,
          sensitivityQualitative: (libraryMatch as any)?.sensitivityQualitative || test.sensitivityQualitative || undefined,
          specificityQualitative: (libraryMatch as any)?.specificityQualitative || test.specificityQualitative || undefined,
          evidence_level: test.evidence_level || test.evidencia || (libraryMatch as any)?.evidence_level,
          evidencia: test.evidencia || test.evidence_level || (libraryMatch as any)?.evidence_level,
          indication: test.objetivo || test.indicacion || "",
          justification: test.justificacion || test.rationale || "",
          libraryMatch: libraryMatch // Store match for reference
        };
      })
      .filter(Boolean) ?? [];

    // ✅ FASE 1 FIX: Sort by importance using average score (sensitivity + specificity) / 2
    // Then limit to top 5 for Phase 1 display
    // Tests 6+ will be shown in sidebar during Phase 2 (EvaluationTab)
    const sortedTests = sortPhysicalTestsByImportance(allPhysicalTests);
    const { topTests: physicalTests, remainingTests: additionalPhysicalTests } = getTopPhysicalTests(sortedTests, 5);

    // ✅ CRITICAL: Ensure physicalTests only contains top 5 for Phase 1
    // Use slice to guarantee exactly 5 tests, even if getTopPhysicalTests returns more
    const finalPhysicalTests = Array.isArray(physicalTests) ? physicalTests.slice(0, 5) : [];

    // ✅ VALIDATION: Ensure we have exactly 5 or fewer tests
    if (finalPhysicalTests.length > 5) {
      console.error('[interactiveResults] ❌ ERROR: finalPhysicalTests has more than 5 tests, forcing to exactly 5');
      finalPhysicalTests.splice(5); // Force to exactly 5
    }

    console.log('[interactiveResults] Physical tests calculation:', {
      totalTestsFromVertex: allPhysicalTests.length,
      topTestsCount: physicalTests.length,
      finalPhysicalTestsCount: finalPhysicalTests.length,
      remainingTestsCount: additionalPhysicalTests.length,
      hasTopTests: finalPhysicalTests.length > 0,
      hasAdditionalTests: additionalPhysicalTests.length > 0,
    });

    // ✅ ASSERTION: Final validation before returning
    if (finalPhysicalTests.length > 5) {
      console.error('[interactiveResults] ❌ CRITICAL ERROR: finalPhysicalTests still has more than 5 tests after all validations!');
    }

    const symptomEntities =
      (niagaraResults.hallazgos_clinicos || []).map((text: string, index: number) => ({
        id: `symptom-${index}`,
        text,
        type: "symptom" as const
      })) || [];

    const medicationEntities =
      (niagaraResults.medicacion_actual || []).map((text: string, index: number) => ({
        id: `medication-${index}`,
        text,
        type: "medication" as const
      })) || [];

    const historyEntities =
      (niagaraResults.antecedentes_medicos || []).map((text: string, index: number) => ({
        id: `history-${index}`,
        text,
        type: "history" as const
      })) || [];

    const psychosocial = niagaraResults.contexto_psicosocial || [];
    const occupational = niagaraResults.contexto_ocupacional || [];

    // Extract all biopsychosocial factors from the normalized results
    const biopsychosocial_psychological = niagaraResults.biopsychosocial_psychological || [];
    const biopsychosocial_social = niagaraResults.biopsychosocial_social || [];
    const biopsychosocial_occupational = niagaraResults.biopsychosocial_occupational || [];
    const biopsychosocial_protective = niagaraResults.biopsychosocial_protective || [];
    const biopsychosocial_functional_limitations = niagaraResults.biopsychosocial_functional_limitations || [];
    const biopsychosocial_patient_strengths = niagaraResults.biopsychosocial_patient_strengths || [];

    // ✅ FASE 1 FIX: Build interactiveResults with ONLY top 5 tests for Phase 1 display
    // Tests 6+ will be shown in sidebar during Phase 2 (EvaluationTab)
    const {
      evaluaciones_fisicas_sugeridas: _,
      red_flags: _niagaraRedFlagsStripped,
      ...niagaraResultsWithoutTests
    } = niagaraResults;

    const rawNiagaraRedFlags = niagaraResults.red_flags;
    const normalizedNiagaraRedFlags = normalizeRedFlagsForDisplay(rawNiagaraRedFlags);
    const niagaraRedFlagsForUi = filterTrivialRedFlagEntries(normalizedNiagaraRedFlags);

    // ✅ CRITICAL: Return interactiveResults with ONLY top 5 tests for Phase 1
    return {
      ...niagaraResultsWithoutTests, // Spread without evaluaciones_fisicas_sugeridas to avoid confusion
      entities: [...symptomEntities, ...medicationEntities, ...historyEntities],
      physicalTests: finalPhysicalTests, // ✅ FASE 1 FIX: ONLY top 5 tests (limited above, sorted by average score)
      // ✅ IMPORTANT: evaluaciones_fisicas_sugeridas is NOT included here - we use physicalTests instead
      // Tests 6+ are available via aiSuggestions in EvaluationTab sidebar
      yellowFlags: [
        ...(niagaraResults.yellow_flags || []),
        ...psychosocial,
        ...occupational
      ],
      red_flags: niagaraRedFlagsForUi,
      redFlags: niagaraRedFlagsForUi,
      biopsychosocial: {
        psychosocial,
        occupational
      },
      // Include all biopsychosocial factors for proper UI display
      biopsychosocial_psychological,
      biopsychosocial_social,
      biopsychosocial_occupational,
      biopsychosocial_protective,
      biopsychosocial_functional_limitations,
      biopsychosocial_patient_strengths
    };
  }, [niagaraResults, sessionTypeFromUrl, workflowRoute?.type, detectedCaseRegion, followUpAlerts]); // ✅ FIX: Add detectedCaseRegion to dependencies for region filtering

  const physicalExamResults = useMemo(
    () =>
      filteredEvaluationTests.map((entry) => { // ✅ P1.1: Use filtered tests for SOAP generation
        const definition = getTestDefinition(entry.id);
        const hasFields = definition && hasFieldDefinitions(definition);

        // Build rich notes from field values if available
        let enrichedNotes = entry.notes?.trim() || undefined;
        if (hasFields && entry.values && Object.keys(entry.values).length > 0) {
          const testDef = definition as MskTestDefinition;
          const valueParts: string[] = [];

          testDef.fields?.forEach((field) => {
            const value = entry.values?.[field.id];
            if (value !== null && value !== undefined && value !== '') {
              if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
                valueParts.push(`${field.label}: ${value}°`);
              } else if (field.kind === 'yes_no') {
                if (value === true) {
                  valueParts.push(`${field.label}: Sí`);
                }
              } else if (field.kind === 'score_0_10') {
                valueParts.push(`${field.label}: ${value}/10`);
              } else if (field.kind === 'text' && typeof value === 'string' && value.trim()) {
                valueParts.push(`${field.label}: ${value}`);
              }
            }
          });

          if (valueParts.length > 0) {
            enrichedNotes = valueParts.join('; ') + (entry.notes?.trim() ? ` — ${entry.notes.trim()}` : '');
          }
        }

        return {
          testName: entry.name,
          result: entry.result ?? "normal",
          notes: enrichedNotes,
          values: entry.values,
        };
      }),
    [filteredEvaluationTests] // ✅ P1.1: Use filtered tests
  );

  const completedCount = useMemo(
    () => filteredEvaluationTests.filter((entry) => entry.notes.trim() !== '' || entry.result !== 'normal').length,
    [filteredEvaluationTests]
  );

  const handleAnalyzeWithVertex = async () => {
    // Follow-up path: do NOT call Niagara (no highlights, no biopsychosocial). Only generate SOAP.
    if (visitType === 'follow-up') {
      await handleGenerateSOAPFollowUp();
      return;
    }

    // Ensure transcript is always a string
    const transcriptText = typeof transcript === 'string' ? transcript : String(transcript || '');

    // ✅ FIX: Allow analysis with attachments only (no transcript required)
    const hasTranscript = transcriptText.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0 && attachments.some(att => att.extractedText);

    if (!hasTranscript && !hasAttachments) {
      console.warn('[Workflow] Cannot analyze: no transcript and no attachments with extracted text');
      return;
    }

    // ✅ WO-04: Track analysis requested
    trackAnalysisRequested({
      transcriptLength: transcriptText.length,
      hasAttachments: hasAttachments,
      attachmentCount: attachments?.length || 0
    });

    const analysisStartTime = Date.now();

    try {
      // Map ClinicalAttachment to prompt format (extract only needed fields)
      const promptAttachments = attachments && attachments.length > 0
        ? attachments.map(att => ({
          fileName: att.name,
          fileType: att.contentType || 'unknown',
          extractedText: att.extractedText,
          pageCount: att.pageCount,
          error: att.error,
        }))
        : undefined;

      const payload = {
        text: transcriptText, // Can be empty if only analyzing attachments
        lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : undefined),
        mode,
        timestamp: Date.now(),
        visitType: 'initial' as const,
        attachments: promptAttachments && promptAttachments.length > 0 ? promptAttachments : undefined
      };
      await processText({
        ...payload,
        professionalProfile: professionalProfile || undefined
      });
      setAnalysisError(null);

      // ✅ WO-04: Track analysis completed (use niagaraResults from next render or wait)
      // We'll track this in a useEffect that watches niagaraResults
      setTimeout(() => {
        trackAnalysisCompleted({
          duration: Date.now() - analysisStartTime,
          testsIdentified: niagaraResults?.evaluaciones_fisicas_sugeridas?.length || 0,
          hasFindings: Boolean(niagaraResults?.hallazgos_clinicos?.length)
        });
      }, 100); // Small delay to allow state update
    } catch (error: any) {
      const message = error?.message || 'Unable to analyze transcript with our AI system.';
      setAnalysisError(message);
      console.error('[Workflow] Vertex analysis failed:', message);

      // ✅ WO-04: Track analysis failed
      trackAnalysisFailed({
        errorType: error instanceof Error ? error.message : 'unknown'
      });

      // Submit error feedback automatically
      if (error instanceof Error) {
        FeedbackService.submitErrorFeedback(error, {
          workflowStep: 'AI analysis',
          hasTranscript: !!transcript?.trim(),
        }).catch((err) => {
          console.error('[Workflow] Failed to submit error feedback:', err);
        });
      }

      // Suggest fallback for network errors
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setAnalysisError(
          message + ' Check your internet connection. You can still document manually.'
        );
      }
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setAttachmentError(null);
    setIsUploadingAttachment(true);

    try {
      const uploads: ClinicalAttachment[] = [];
      for (const file of files) {
        const uploaded = await ClinicalAttachmentService.upload(file, TEMP_USER_ID);
        uploads.push(uploaded);
      }

      setAttachments((prev) => [...prev, ...uploads]);

      for (let i = 0; i < uploads.length; i++) {
        const file = files[i];
        const attachment = uploads[i];
        try {
          console.log("[Workflow] Starting processing attachment", {
            hasAttachmentName: Boolean(attachment.name),
          });
          const result = await FileProcessorService.processFile(file, attachment.downloadURL);
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? { ...a, extractedText: result.extractedText ?? "", error: result.error, processingComplete: true }
                : a
            )
          );
          console.log("[Workflow] Processing completed attachment", {
            hasAttachmentName: Boolean(attachment.name),
          });
        } catch (error) {
          console.error("[Workflow] Processing error:", error);
          setAttachments((prev) =>
            prev.map((a) =>
              a.id === attachment.id
                ? { ...a, error: error instanceof Error ? error.message : "Processing failed", processingComplete: true }
                : a
            )
          );
        }
      }
    } catch (error) {
      console.error("Attachment upload failed", error);
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "Failed to upload attachment. Try again."
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachmentRemove = async (attachment: ClinicalAttachment) => {
    if (!attachment) return;
    setAttachmentError(null);
    setRemovingAttachmentId(attachment.id);
    try {
      await ClinicalAttachmentService.delete(attachment.storagePath);
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    } catch (error) {
      console.error("Failed to delete attachment", error);
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "Unable to remove attachment right now."
      );
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const handleAttachmentReviewedToggle = (attachmentId: string) => {
    setAttachments((previousAttachments) => {
      const updatedAttachments = previousAttachments.map((attachment) => {
        if (attachment.id !== attachmentId) {
          return attachment;
        }

        const currentReviewedValue = attachment.reviewedToday === true;
        const nextReviewedValue = !currentReviewedValue;

        return {
          ...attachment,
          reviewedToday: nextReviewedValue,
        };
      });

      return updatedAttachments;
    });
  };

  const continueToEvaluation = () => {
    // ✅ PHASE 2: Enhanced logging for debugging test transfer
    console.log('[PHASE2] continueToEvaluation called');
    console.log('[PHASE2] transfer summary:', {
      selectedEntityCount: selectedEntityIds.length,
      suggestionCount: aiSuggestions.length,
      suggestedPhysicalTestCount: niagaraResults?.evaluaciones_fisicas_sugeridas?.length || 0,
      interactivePhysicalTestCount: interactiveResults?.physicalTests?.length || 0,
      currentEvaluationTestCount: evaluationTests.length,
      hasDetectedCaseRegion: Boolean(detectedCaseRegion),
    });

    // ✅ PHASE 2: Set flag to prevent useEffect from overwriting
    isAddingTestsRef.current = true;

    const additions: EvaluationTestEntry[] = [];
    const entriesToAdd: EvaluationTestEntry[] = [];

    // ✅ PHASE 2 FIX: Use aiSuggestions directly - they're already mapped correctly
    // aiSuggestions has the correct key (originalIndex) and includes library matches
    console.log('[PHASE2] Using aiSuggestions directly for mapping');
    console.log('[PHASE2] aiSuggestions keys summary:', {
      suggestionCount: aiSuggestions.length,
    });

    // ✅ PHASE 2 FIX: Create a map from key (originalIndex) to suggestion
    const suggestionMap = new Map(aiSuggestions.map((item) => [item.key, item]));
    console.log('[PHASE2] suggestionMap created:', {
      suggestionMapSize: suggestionMap.size,
    });

    // ✅ PHASE 2 FIX: Get physical test IDs and map them correctly
    const physicalTestIds = selectedEntityIds.filter((id) => id.startsWith("physical-"));
    console.log('[PHASE2] physicalTestIds found:', {
      physicalTestCount: physicalTestIds.length,
    });

    // ✅ PHASE 2 FIX: Collect all entries first, then add them all at once
    physicalTestIds.forEach((entityId) => {
      const originalIndex = parseInt(entityId.split("-")[1], 10);
      console.log(`[PHASE2] Processing physical test selection`, {
        hasEntityId: Boolean(entityId),
        originalIndex,
      });

      // ✅ PHASE 2 FIX: Get suggestion directly by key (originalIndex)
      const suggestion = suggestionMap.get(originalIndex);
      if (!suggestion) {
        console.error(`[PHASE2] ❌ CRITICAL: No suggestion found for originalIndex ${originalIndex}`);
        console.error(`[PHASE2] Missing suggestion context:`, {
          suggestionMapSize: suggestionMap.size,
          aiSuggestionCount: aiSuggestions.length,
          suggestedPhysicalTestCount: niagaraResults?.evaluaciones_fisicas_sugeridas?.length || 0,
        });
        return;
      }

      console.log(`[PHASE2] ✅ Found suggestion for originalIndex ${originalIndex}:`, {
        key: suggestion.key,
        hasRawName: Boolean(suggestion.rawName),
        hasMatch: !!suggestion.match,
        hasMatchName: Boolean(suggestion.match?.name),
      });

      let entry: EvaluationTestEntry;
      if (suggestion.match) {
        // ✅ PHASE 2 FIX: Use library match if available (has region, fields, etc.)
        console.log(`[PHASE2] Creating entry from library match`, {
          hasMatchName: Boolean(suggestion.match.name),
        });
        entry = createEntryFromLibrary(suggestion.match, "ai");
      } else {
        // ✅ PHASE 2 FIX: Clean "Consider assessing" prefix from rawName
        const cleanName = suggestion.rawName.replace(/^Consider assessing\s+/i, '').trim();
        console.log(`[PHASE2] Creating custom entry`, {
          hasCleanName: Boolean(cleanName),
        });
        entry = createCustomEntry(cleanName, "ai");
      }

      console.log(`[PHASE2] Created entry:`, {
        hasName: Boolean(entry.name),
        hasId: Boolean(entry.id),
        region: entry.region,
        source: entry.source
      });

      additions.push(entry);
      entriesToAdd.push(entry);
    });

    console.log(`[PHASE2] Total entries collected: ${entriesToAdd.length}`, {
      totalEntriesCollected: entriesToAdd.length,
    });

    // ✅ PHASE 2 FIX: Add all tests at once using functional update to avoid race conditions
    // ✅ WO-FIX-TESTS-DUPLICADOS-03: Enhanced deduplication
    if (entriesToAdd.length > 0) {
      setEvaluationTests((currentTests) => {
        // Deduplicate: only add tests that don't already exist (using improved matching)
        const uniqueNewTests = entriesToAdd.filter(newTest => {
          const exists = testAlreadyExists(newTest.name, currentTests);
          if (exists) {
            console.log(`[PHASE2] ⏭️ Skipping duplicate test`, {
              hasName: Boolean(newTest.name),
            });
          }
          return !exists;
        });

        if (uniqueNewTests.length === 0) {
          console.log(`[PHASE2] All tests already exist, no new tests to add`);
          return currentTests;
        }

        const finalTests = [...currentTests, ...uniqueNewTests];
        const duplicatesSkipped = entriesToAdd.length - uniqueNewTests.length;

        console.log(`[PHASE2] ✅ Adding ${uniqueNewTests.length} unique tests (${duplicatesSkipped} duplicates skipped). Total: ${finalTests.length}`);
        console.log(`[PHASE2] Final test list summary:`, {
          finalTestCount: finalTests.length,
        });

        // Persist all tests at once
        setTimeout(() => {
          persistEvaluation(finalTests);
        }, 0);

        return finalTests;
      });
    }

    console.log(`[PHASE2] Expected vs Actual:`, {
      expected: physicalTestIds.length,
      actual: entriesToAdd.length,
      missing: physicalTestIds.length - entriesToAdd.length
    });

    // ✅ PHASE 2 FIX: Wait for all state updates to complete before clearing flag
    setTimeout(() => {
      console.log(`[PHASE2] Checking state after additions...`);
      setEvaluationTests((currentTests) => {
        console.log(`[PHASE2] Current evaluationTests summary:`, {
          expectedTests: entriesToAdd.length,
          currentTests: currentTests.length,
        });

        // Clear flag after delay
        setTimeout(() => {
          isAddingTestsRef.current = false;
          console.log(`[PHASE2] ✅ Flag cleared - ${currentTests.length} tests in state`);
        }, 500);

        return currentTests; // Return unchanged
      });
    }, 500);

    // ✅ FIX: Only dismiss top 5 tests that were NOT selected (don't dismiss tests 6+)
    // Tests 6+ should remain available in sidebar as additional options for the physio
    const selectedKeys = new Set(
      selectedEntityIds
        .filter((id) => id.startsWith("physical-"))
        .map((id) => parseInt(id.split("-")[1], 10))
    );

    // ✅ CRITICAL: Only dismiss tests from top 5 (indices 0-4) that were NOT selected
    // Tests 6+ (indices 5+) should NOT be dismissed - they should appear in sidebar
    const top5Tests = aiSuggestions.filter(item => item.key < 5); // Top 5 tests (indices 0-4)
    const top5NotSelected = top5Tests
      .filter((item) => !selectedKeys.has(item.key))
      .map((item) => item.key);

    // Tests 6+ (indices 5+) are NEVER dismissed - they remain available in sidebar
    const tests6Plus = aiSuggestions.filter(item => item.key >= 5);

    console.log(`[PHASE2] Top 5 tests status:`, {
      totalTop5: top5Tests.length,
      selected: Array.from(selectedKeys).filter(k => k < 5).length,
      notSelected: top5NotSelected.length,
      tests6PlusCount: tests6Plus.length,
    });

    // ✅ FIX: Only dismiss top 5 tests that were NOT selected
    // Tests 6+ will remain available in sidebar (not dismissed)
    if (top5NotSelected.length > 0) {
      console.log(`[PHASE2] Dismissing ${top5NotSelected.length} top 5 tests that were NOT selected`);
      setDismissedSuggestionKeys((prev) => Array.from(new Set([...prev, ...top5NotSelected])));
    } else {
      console.log(`[PHASE2] ✅ All top 5 tests were selected - nothing to dismiss`);
    }

    if (tests6Plus.length > 0) {
      console.log(`[PHASE2] ✅ Keeping ${tests6Plus.length} additional tests (6+) available in sidebar`);
    }

    console.log(`[PHASE2] Switching to evaluation tab`);
    setActiveTab("evaluation");
  };

  const handleLibrarySelect = useCallback(
    (event) => {
      const value = event.target.value;
      if (!value) return;
      const libraryTest = MSK_TEST_LIBRARY.find((test) => test.id === value);
      if (libraryTest) {
        addEvaluationTest(createEntryFromLibrary(libraryTest, "manual"));
      }
      event.target.value = "";
    },
    [addEvaluationTest, createEntryFromLibrary]
  );

  // Treatment reminder state
  const [treatmentReminder, setTreatmentReminder] = useState<string | null>(null);
  const [previousTreatmentPlan, setPreviousTreatmentPlan] = useState<any>(null);

  // Physio notes for TODAY'S PLAN section
  const [physioNotes, setPhysioNotes] = useState<string>('');

  // WO-PART-C-REFERRAL-REPORT: Referral report modal state
  const [referralReportOpen, setReferralReportOpen] = useState(false);
  const [referralReportData, setReferralReportData] = useState<ReferralReportData | null>(null);
  const [isBuildingReferralReport, setIsBuildingReferralReport] = useState(false);
  const [isCertificateEsModalOpen, setIsCertificateEsModalOpen] = useState(false);

  // Initial Plan Modal state (for existing patients without initial assessment)
  const [isInitialPlanModalOpen, setIsInitialPlanModalOpen] = useState(false);

  // Universal Share Menu state
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  const buildReferralReportData = useCallback((clinicalEvolutionSummary?: string | null): ReferralReportData | null => {
    if (!currentPatient || !interactiveResults) {
      return null;
    }

    const patientName =
      (currentPatient as any).fullName ||
      [currentPatient.firstName, currentPatient.lastName].filter(Boolean).join(" ") ||
      "Unknown patient";

    let patientDOB: string | undefined;
    const dobRaw = (currentPatient as any).dateOfBirth;
    if (dobRaw instanceof Date) {
      patientDOB = dobRaw.toLocaleDateString("en-CA");
    } else if (dobRaw && typeof dobRaw === "object" && "toDate" in dobRaw) {
      patientDOB = (dobRaw as any).toDate().toLocaleDateString("en-CA");
    } else if (typeof dobRaw === "string") {
      patientDOB = dobRaw;
    }

    const sessionDate = new Date().toLocaleDateString("en-CA");
    const profileFullName = (professionalProfile as any)?.fullName;
    const profileFirstName = professionalProfile?.firstName;
    const profileLastName = professionalProfile?.lastName;
    const profileDisplayName = professionalProfile?.displayName;
    const userDisplayName = user?.displayName;
    const physiotherapistName =
      profileFirstName && profileLastName
        ? `Ft. ${profileFirstName} ${profileLastName}`
        : profileFullName
          ? `Ft. ${profileFullName}`
          : profileDisplayName
            ? `Ft. ${profileDisplayName}`
            : userDisplayName
              ? `Ft. ${userDisplayName}`
              : 'Ft.';
    const physiotherapistLicense = professionalProfile?.licenseNumber || '';
    const referringDoctor = currentPatient.referringDoctor || 'No especificado';

    const redFlagsSource = (interactiveResults as any).redFlags as
      | (string | { label: string; evidence?: string; suggested_action?: string; urgency?: string })[]
      | undefined;

    const redFlags =
      redFlagsSource?.flatMap((flag, idx) => {
        const id = typeof flag === "string" ? flag : (flag?.label ?? `red-${idx}`);
        const decision = redFlagDecisions[id]?.decision;
        if (decision !== "referral_stop" && decision !== "referral_continue_partial") {
          return [];
        }
        if (!selectedRedFlagIds.includes(id)) {
          return [];
        }

        const label = typeof flag === "string" ? flag : (flag?.label ?? id);
        const evidence =
          typeof flag === "object" && flag && "evidence" in flag
            ? (flag as { evidence?: string }).evidence
            : undefined;
        const urgency =
          typeof flag === "object" && flag && "urgency" in flag
            ? (flag as { urgency?: string }).urgency
            : undefined;

        return [
          {
            label,
            decision,
            continuationNote: redFlagDecisions[id]?.continuationNote,
            urgency,
            evidence,
          } as ReferralReportData["redFlags"][number],
        ];
      }) ?? [];

    const chiefComplaint =
      (interactiveResults as any).chief_complaint ||
      (interactiveResults as any).chiefComplaint ||
      undefined;

    const clinicalNotes = physioNotes || undefined;

    return {
      patientName,
      patientDOB,
      sessionDate,
      physiotherapistName,
      physiotherapistLicense,
      referringDoctor,
      redFlags,
      chiefComplaint,
      clinicalEvolutionSummary: clinicalEvolutionSummary ?? undefined,
      clinicalNotes,
    };
  }, [
    currentPatient,
    interactiveResults,
    physioNotes,
    redFlagDecisions,
    selectedRedFlagIds,
    user,
    professionalProfile,
  ]);

  const certificateProfessionalName =
    professionalProfile?.fullName ||
    [professionalProfile?.firstName, professionalProfile?.lastName].filter(Boolean).join(' ') ||
    professionalProfile?.displayName ||
    user?.displayName ||
    clinicianDisplayName ||
    'Fisioterapeuta';
  const certificateProfessionalLicense = professionalProfile?.licenseNumber || '';
  const certificateProfessionalSpecialty =
    professionalProfile?.profession ||
    professionalProfile?.specialty ||
    'Fisioterapia';
  const certificatePatientName =
    currentPatient?.fullName ||
    `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() ||
    demoPatient.name;
  const certificatePatientBirthDate = currentPatient?.dateOfBirth || '';
  const certificateClinicName =
    professionalProfile?.clinic?.name ||
    professionalProfile?.workplace ||
    '';

  const handleOpenReferralReport = useCallback(async () => {
    setIsBuildingReferralReport(true);
    try {
      const patientId = patientIdFromUrl ?? (currentPatient as any)?.id ?? '';
      const evolution =
        patientId ? await new SessionComparisonService().getReferralEvolutionSentence(patientId) : null;
      const data = buildReferralReportData(evolution ?? undefined);
      if (data) {
        setReferralReportData(data);
        setReferralReportOpen(true);
      }
    } finally {
      setIsBuildingReferralReport(false);
    }
  }, [patientIdFromUrl, currentPatient, buildReferralReportData]);

  // Detect visit type on mount or when data changes
  useEffect(() => {
    // TODO: Check Firestore for previous SOAP notes
    // For now, default to initial assessment
    const detection = detectVisitType(false); // No previous SOAP for MVP
    setVisitType(detection.detectedType);
  }, []);

  // Load treatment plan and reminder for follow-up visits
  useEffect(() => {
    if (visitType === 'follow-up') {
      const loadTreatmentPlan = async () => {
        try {
          const patientId = patientIdFromUrl || demoPatient.id;

          // Load the most recent treatment plan
          const plan = await treatmentPlanService.getTreatmentPlan(patientId);
          if (plan) {
            setPreviousTreatmentPlan(plan);

            // Also load reminder for backward compatibility
            const reminder = await treatmentPlanService.getTreatmentReminder(
              patientId,
              visitCount.data ? visitCount.data + 1 : 2
            );
            if (reminder) {
              setTreatmentReminder(reminder.reminderText);
            }
          } else {
            // No plan found - this could be an existing patient without initial assessment
            setPreviousTreatmentPlan(null);
          }
        } catch (error) {
          console.error('[Workflow] Failed to load treatment plan:', error);
        }
      };
      loadTreatmentPlan();
    } else {
      setTreatmentReminder(null);
      setPreviousTreatmentPlan(null);
    }
  }, [visitType, patientIdFromUrl, visitCount.data]);

  /** Stable Firestore doc id for HEP compliance (same day + patient + baseline → survives full reload). */
  const hepSessionKey = useMemo(() => {
    const uid = user?.uid;
    const pid = patientIdFromUrl;
    const bid = baselineIdFromSession;
    const today = new Date().toISOString().slice(0, 10);
    if (!uid || !pid || !bid) return null;
    return `${uid}-hep-${pid}-${bid}-${today}`;
  }, [user?.uid, patientIdFromUrl, baselineIdFromSession]);

  /** Sprint A: persist HEP checkbox state to `sessions/{id}.hepCompliance` (merge). */
  const updateHomeProgramItems = useCallback(
    (next: TodayFocusItem[]) => {
      setHomeProgramItems(next);
      if (visitType !== 'follow-up') return;
      const uid = user?.uid;
      if (!uid) return;
      const stableKey = hepSessionKey;
      const sid = stableKey ?? sessionId ?? `${uid}-${sessionStartTime.getTime()}`;
      const hepCompliance = next.map((i) => ({
        itemId: i.id,
        done: i.completed,
        date: new Date().toISOString(),
      }));
      const patientName =
        currentPatient?.fullName ||
        `${currentPatient?.firstName ?? ''} ${currentPatient?.lastName ?? ''}`.trim() ||
        'Unknown';
      sessionService
        .updateSession(sid, {
          hepCompliance,
          userId: uid,
          patientId: patientId || '',
          patientName,
          sessionType: visitType === 'follow-up' ? 'followup' : sessionTypeFromUrl || 'initial',
        })
        .catch(() => {});
    },
    [
      visitType,
      user?.uid,
      hepSessionKey,
      sessionId,
      sessionStartTime,
      currentPatient?.fullName,
      currentPatient?.firstName,
      currentPatient?.lastName,
      patientId,
      sessionTypeFromUrl,
    ],
  );

  // WO-FU-PLAN-SPLIT-01: derive In-Clinic vs HEP — FOLLOW-UP ONLY; baseline as primary source (no mock)
  // Single source of truth: baselineSOAP.plan from clinical_baselines; fallback to treatment plan only if no baseline
  // Sprint A: optional hydrate of `hepCompliance` from the session doc (does not overwrite local toggles).
  useEffect(() => {
    if (visitType !== 'follow-up') {
      setInClinicItems([]);
      setHomeProgramItems([]);
      return;
    }
    const previousPlanInput = previousTreatmentPlan
      ? {
          planText: previousTreatmentPlan.planText,
          inClinicText: previousTreatmentPlan.inClinicText,
          homeProgramText: previousTreatmentPlan.homeProgramText,
        }
      : null;
    const hasStructuredPreviousPlan = Boolean(
      previousTreatmentPlan?.inClinicText?.trim() || previousTreatmentPlan?.homeProgramText?.trim(),
    );
    const baselinePlanText = followUpClinicalState?.baselineSOAP?.plan?.trim() || '';
    const derived = hasStructuredPreviousPlan
      ? derivePlanFromText(previousPlanInput)
      : derivePlanFromText(baselinePlanText || previousPlanInput);
    const hasDerivedPlan = derived.inClinic.length > 0 || derived.homeProgram.length > 0;
    if (!hasDerivedPlan) {
      setInClinicItems([]);
      setHomeProgramItems([]);
      return;
    }
    setInClinicItems(
      derived.inClinic.map((label, i) => ({
        id: `in-clinic-${i}`,
        label,
        completed: false,
        source: 'plan' as const,
      })),
    );
    const hepItems = derived.homeProgram.map((label, i) => ({
      id: `hep-${i}`,
      label,
      completed: false,
      source: 'plan' as const,
    }));
    setHomeProgramItems(hepItems);

    const uid = user?.uid;
    if (!uid) return;
    const stableKey = hepSessionKey;
    const sid = stableKey ?? sessionId ?? `${uid}-${sessionStartTime.getTime()}`;
    let cancelled = false;

    (async () => {
      try {
        const docSnap = await sessionService.getSessionById(sid);
        if (cancelled || !docSnap) return;
        const compliance = docSnap.hepCompliance;
        if (!Array.isArray(compliance) || compliance.length === 0) return;
        const merged = hepItems.map((item) => {
          const row = compliance.find((c: { itemId?: string; done?: boolean }) => c?.itemId === item.id);
          return row ? { ...item, completed: Boolean(row.done) } : item;
        });
        setHomeProgramItems((current) => {
          const sameShape =
            current.length === hepItems.length &&
            current.every((c, i) => c.id === hepItems[i].id && c.label === hepItems[i].label);
          if (!sameShape) return current;
          const allStillIncomplete = current.every((c) => !c.completed);
          if (!allStillIncomplete) return current;
          return merged;
        });
      } catch {
        /* ignore — offline or rules */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    visitType,
    patientIdFromUrl,
    followUpClinicalState?.baselineSOAP?.plan,
    previousTreatmentPlan?.inClinicText,
    previousTreatmentPlan?.homeProgramText,
    previousTreatmentPlan?.planText,
    hepSessionKey,
    sessionId,
    user?.uid,
    sessionStartTime,
  ]);

  // Handler to reload treatment plan after manual creation
  const handlePlanCreated = async () => {
    try {
      const patientId = patientIdFromUrl || demoPatient.id;
      const plan = await treatmentPlanService.getTreatmentPlan(patientId);
      if (plan) {
        setPreviousTreatmentPlan(plan);
      }
    } catch (error) {
      console.error('[Workflow] Failed to reload treatment plan:', error);
    }
  };

  const handleGenerateSoap = async () => {
    if (!niagaraResults) {
      console.warn('[Workflow] Cannot generate clinical note: no analysis results');
      return;
    }
    setIsGeneratingSOAP(true);
    setAnalysisError(null);

    // ✅ WO-CONSENT-VERBAL-01-LANG: Patient Consent Gate with jurisdiction validation
    const patientId = patientIdFromUrl || demoPatient.id;
    // ✅ WO-CONSENT-GATE-ALIGN-WORKFLOW-01: Use same source of truth as workflow
    // Check consent via server (same as workflow check)
    const consentCheck = await checkConsentViaServer(patientId);

    if (!consentCheck.hasValidConsent) {
      setIsGeneratingSOAP(false);
      // Show notification that consent is required
      setAnalysisError(
        t('workflow.consentRequiredForSoap')
      );
      // ✅ WO-CONSENT-SINGLE-SOURCE-01: Verificar desde dominio, no desde estado duplicado
      const jurisdiction = getCurrentJurisdiction();
      const isFirstSession = true; // TODO: Pass as prop when available
      const currentResolution = resolveConsentChannel({
        hasValidConsent: consentCheck.hasValidConsent,
        jurisdiction,
        isFirstSession,
      });
      // Solo mostrar modal si dominio dice que no hay consentimiento válido
      if (currentResolution.channel !== 'none') {
        setShowVerbalConsentModal(true);
      }
      return; // Block AI processing until consent is given
    }

    try {
      // Capture SOAP generation start timestamp
      if (!soapGenerationStartTime) {
        setSoapGenerationStartTime(new Date());
      }

      // Step 1: Organize unified data from Tab 1 and Tab 2
      const analysisSource = editedAnalysisResults ?? niagaraResults;
      const localizedLibrary = MSK_TEST_LIBRARY.filter((definition): definition is MskTestDefinition => {
        return 'normalTemplate' in definition;
      });
      const unifiedData: UnifiedClinicalData = {
        tab1: {
          transcript: transcript || '',
          analysis: analysisSource,
          attachments: attachments,
        },
        tab2: {
          evaluationTests: filteredEvaluationTests, // ✅ P1.1: Use filtered tests (only matching region)
          library: localizedLibrary,
        },
        visit: {
          type: visitType,
          patientId: patientIdFromUrl || demoPatient.id,
          patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
          patientAge: currentPatient?.dateOfBirth ? calculateAge(currentPatient.dateOfBirth) ?? undefined : undefined,
        },
      };

      // Step 2: Validate unified data
      const validation = validateUnifiedData(unifiedData);
      if (!validation.isValid) {
        setAnalysisError(`Missing required data: ${validation.missingFields.join(', ')}`);
        setIsGeneratingSOAP(false);
        return;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('[Workflow] Clinical note validation warnings:', {
          warningCount: validation.warnings.length,
        });
      }

      // Step 3: Organize all data into structured format for SOAP prompt
      const organized = organizeSOAPData(unifiedData);

      // WO-05-FIX / WO-FOLLOWUP-PROMPT: Inyectar todayFocus y homeProgramPrescribed solo en follow-up; initial no se toca
      const focusToInject = visitType === 'follow-up' ? inClinicItems : todayFocus;
      if (focusToInject.length > 0) {
        organized.context.todayFocus = focusToInject.map(item => ({
          id: item.id,
          label: item.label,
          notes: item.notes,
          source: 'plan' as const,
        }));

        console.info(
          '[WO-05-FIX][PROOF] Injecting todayFocus into SOAPContext',
          {
            count: focusToInject.length,
            items: focusToInject.map(i => ({
              id: i.id,
              label: i.label,
              completed: i.completed,
              hasNotes: !!i.notes
            }))
          }
        );
      }
      if (visitType === 'follow-up' && homeProgramItems.length > 0) {
        organized.context.homeProgramPrescribed = homeProgramItems.map((i) => i.label);
      }

      // Log data summary for debugging
      console.log('[Workflow] Clinical data organization summary:', createDataSummary(organized));

      // Step 4: Generate SOAP using organized context
      // ✅ WORKFLOW OPTIMIZATION: Pass analysisLevel from workflowRoute
      const analysisLevel =
        workflowRoute?.analysisLevel === 'follow-up'
          ? 'optimized'
          : workflowRoute?.analysisLevel || 'full';

      // Track SOAP generation started
      await trackSOAPGenerationStarted({
        hasEvaluationData: (organized.structuredData?.physicalExamResults?.length || 0) > 0,
        testsCount: organized.structuredData?.physicalExamResults?.length || 0,
      });
      const response = await generateSOAPNoteFromService(organized.context, {
        analysisLevel,
        sessionType: currentSessionType,
        professionalProfile: professionalProfile || undefined,
      });

      if (!response || !response.soap) {
        throw new Error('Failed to generate SOAP note: empty response from AI system');
      }

      // ✅ WORKFLOW OPTIMIZATION: Track SOAP generation with token metrics
      const sessionIdForMetrics = sessionId || `${user?.uid || TEMP_USER_ID}-${sessionStartTime.getTime()}`;
      await trackSOAPGeneration(
        sessionIdForMetrics,
        response.metadata.tokens,
        response.metadata.tokenOptimization

      );
      // Track SOAP generation completed
      await trackSOAPGenerationCompleted({
        duration: Date.now() - sessionStartTime.getTime(),
        soapLength: JSON.stringify(response.soap).length,
        sectionsGenerated: Object.keys(response.soap || {}),
      });

      // P2: Token accounting - cobrar al completar SOAP (1 vez con flag anti-doble-cobro)
      const userIdForCharging = user?.uid || TEMP_USER_ID;
      const sessionRef = doc(db, 'sessions', sessionIdForMetrics);

      try {
        // Leer doc de sesión para verificar si ya se cobró
        const sessionSnap = await getDoc(sessionRef);
        const sessionData = sessionSnap.exists() ? sessionSnap.data() : null;
        const tokensCharged = sessionData?.tokensCharged === true;

        if (!tokensCharged) {
          // Obtener token budget del session type
          const tokensToCharge = SessionTypeService.getTokenBudget(currentSessionType);

          // Cobrar tokens
          await tokenTrackingService.recordTokenUsage(
            userIdForCharging,
            sessionIdForMetrics,
            tokensToCharge
          );

          // Marcar como cobrado en el doc de sesión
          await setDoc(sessionRef, {
            tokensCharged: true,
            tokensChargedAmount: tokensToCharge,
            tokensChargedAt: serverTimestamp(),
            tokensChargedUserId: userIdForCharging,
          }, { merge: true });

          logger.info('[TOKENS] Charged', {
            userId: userIdForCharging,
            sessionId: sessionIdForMetrics,
            tokensToCharge
          });
        } else {
          logger.info('[TOKENS] Already charged', {
            userId: userIdForCharging,
            sessionId: sessionIdForMetrics
          });
        }
      } catch (tokenError: any) {
        // Si falla el cobro, no crashear la app pero loggear
        logger.error('[TOKENS] Charge failed', {
          userId: userIdForCharging,
          sessionId: sessionIdForMetrics,
          error: tokenError.message || tokenError
        });

        // Si el error es por falta de tokens, mostrar mensaje al usuario
        if (tokenError.message?.includes('insufficient') || tokenError.message?.includes('not enough')) {
          setAnalysisError('Insufficient tokens to generate SOAP. Please purchase more tokens or contact support.');
        }
        // No marcar como cobrado si falló
      }

      // Store token optimization for display in SOAPEditor
      if (response.metadata.tokenOptimization) {
        setSoapTokenOptimization(response.metadata.tokenOptimization);
      }

      // ✅ SPRINT 2: Validate SOAP Objective only includes tested regions
      const { validateSOAPObjective } = await import('../core/soap/SOAPObjectiveValidator');
      const objectiveValidation = validateSOAPObjective(
        response.soap.objective || '',
        organized.structuredData.physicalExamResults
      );

      if (!objectiveValidation.isValid) {
        console.warn('[SOAP Validation] Objective section violations:', objectiveValidation);
        // Log violations but don't block - flag for review
        // The requiresReview flag will ensure clinician reviews this
      }

      // ✅ DÍA 2: Marcar como requiere review (CPO requirement: AI-generated content must be reviewed)
      const soapWithReviewFlags = {
        ...response.soap,
        requiresReview: true, // CPO requirement: AI-generated content must be reviewed
        isReviewed: false, // Aún no reviewado
        aiGenerated: true, // Flag para transparency
        aiProcessor: 'AiduxCare Clinical AI', // Para transparency report DÍA 3
        processedAt: new Date(), // Timestamp de cuando se procesó con AI
        // ✅ SPRINT 2: Add validation metadata
        validationMetadata: objectiveValidation.isValid ? undefined : {
          testedRegions: objectiveValidation.testedRegions,
          mentionedRegions: objectiveValidation.mentionedRegions,
          violations: objectiveValidation.violations,
          warnings: objectiveValidation.warnings,
        },
      };

      setSoapGenerationEndTime(new Date());
      setLocalSoapNote(soapWithReviewFlags);
      setSoapStatus('draft');
      setActiveTab("soap");

      // Step 5: Save to session — WO-IA-RESUME-01: update existing if sessionId set (resume), else create new
      if (!user?.uid) {
        throw new Error("Auth not ready: cannot persist session without authenticated user");
      }
      const sessionOwnerId = user.uid;
      const sessionDateKey = toLocalDateKey(sessionStartTime);
      const sessionPayload = {
        userId: sessionOwnerId,
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
        patientId: patientIdFromUrl || demoPatient.id,
        transcript: transcript || "",
        sessionDateKey,
        soapNote: soapWithReviewFlags,
        physicalTests: organized.structuredData.physicalExamResults,
        status: "draft" as const,
        sessionType: currentSessionType,
        transcriptionMeta: {
          lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
          languagePreference,
          mode,
          averageLogProb: transcriptMeta?.averageLogProb ?? null,
          durationSeconds: transcriptMeta?.durationSeconds,
          recordedAt: new Date().toISOString(),
        },
        attachments,
        organizedData: {
          metadata: organized.metadata,
          physicalEvaluationStructured: organized.structuredData.physicalEvaluationStructured,
        },
      };
      if (sessionId) {
        await sessionService.updateSession(sessionId, sessionPayload);
      } else {
        const reservedWorkflowId = workflowReservedSessionIdRef.current;
        const soapAnchorMs = sessionStartTime.getTime();
        const soapUid = sessionOwnerId;
        const soapFallbackId = `${soapUid}-${soapAnchorMs}`;
        const proposedSoapSessionId = reservedWorkflowId ?? soapFallbackId;
        const soapPatientKey = patientIdFromUrl || demoPatient.id;
        const soapLookupUser = sessionOwnerId;
        const soapSessionKind = currentSessionType;
        const soapReferenceDate = new Date();
        const soapReuseId = await sessionService.findReusableSessionForDayAndType(
          soapPatientKey,
          soapLookupUser,
          soapSessionKind,
          soapReferenceDate
        );
        const soapHasReuse = soapReuseId != null;
        const soapTargetId = soapHasReuse ? soapReuseId : proposedSoapSessionId;
        const soapMergeWrite = soapHasReuse;
        const soapActualId = await sessionService.createSessionWithId(soapTargetId, sessionPayload, {
          merge: soapMergeWrite,
        });
        setSessionId(soapActualId);
        await trackSessionStarted({
          userId: sessionOwnerId,
          patientId: patientIdFromUrl || demoPatient.id,
          sessionType: currentSessionType,
        });
      }
    } catch (error: any) {
      console.error('[Workflow] Clinical note generation failed:', error);

      // Submit error feedback automatically
      if (error instanceof Error) {
        FeedbackService.submitErrorFeedback(error, {
          workflowStep: 'SOAP generation',
          hasConsent: patientHasConsent || false,
          hasAnalysis: !!niagaraResults,
        }).catch((err) => {
          console.error('[Workflow] Failed to submit error feedback:', err);
        });
      }

      // Set user-friendly error message
      const errorMessage = error?.message || 'Failed to generate SOAP note. Please try again.';
      setAnalysisError(errorMessage);

      // If error is network-related, suggest fallback
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setAnalysisError(
          errorMessage + ' Check your internet connection. You can still create SOAP notes manually.'
        );
      }
    } finally {
      setIsGeneratingSOAP(false);
    }
  };

  // Follow-up path only: ONE Vertex call — SOAP from baseline + transcript + in-clinic/HEP (no Niagara, no analysis_requested).
  // Single source of truth: baseline comes only from followUpClinicalState (built by getClinicalState on load). No fallbacks.
  const handleGenerateSOAPFollowUp = useCallback(async () => {
    if (visitType === 'follow-up' && (followUpAlerts?.red_flags?.length ?? 0) > 0 && !followUpDecisionResolved) {
      console.warn('[FOLLOWUP-HARD-GATE] SOAP generation blocked — decision not resolved');
      return;
    }
    const baseline = followUpClinicalState?.baselineSOAP ?? null;
    if (!baseline) {
      setAnalysisError('Follow-up requires prior clinical baseline (complete an initial assessment first).');
      return;
    }
    const followUpClinicalUpdate = (transcript?.trim() ?? '') || '';
    const hasPendingAttachmentProcessing = attachments.some(
      (attachment) => attachment.processingComplete !== true,
    );
    const hasChecklist = inClinicItems.length > 0 || homeProgramItems.length > 0;
    const hasClinicalUpdate = followUpClinicalUpdate.length > 0;
    if (hasPendingAttachmentProcessing) {
      setAnalysisError('Espera a que los archivos adjuntos terminen de procesarse antes de generar la nota SOAP.');
      return;
    }
    if (!hasChecklist && !hasClinicalUpdate) {
      setAnalysisError('Add at least one confirmed treatment or a clinical update to generate the SOAP note.');
      return;
    }
    setAnalysisError(null);
    setIsGeneratingSOAP(true);
    const startTime = Date.now();
    try {
      await trackSOAPGenerationStarted({ visitType: 'follow-up', source: 'followup_single_call' });
      const currentJurisdiction = getCurrentJurisdiction();
      const hepCompletedCount = homeProgramItems.filter((item) => item.completed).length;
      const hepTotalCount = homeProgramItems.length;
      const hasHepChecklist = hepTotalCount > 0;
      const hepAdherencePercent = hasHepChecklist ? Math.round((hepCompletedCount / hepTotalCount) * 100) : undefined;
      // Optional longitudinal context from last completed encounter comparison + trajectory pattern + pain series
      let longitudinalSummary: string | undefined;
      let trajectoryPattern: string | undefined;
      let trajectoryConfidence: string | undefined;
      let painSeriesSummary: string | undefined;
      let patternInsightSummary: string | undefined;
      let reviewedAttachmentsSummary: string | undefined;
      let currentHepAdherenceSummary: string | undefined;
      if (hasHepChecklist && hepAdherencePercent !== undefined) {
        const adherenceSummaryEs = `Adherencia HEP hoy: ${hepCompletedCount}/${hepTotalCount} completados (${hepAdherencePercent}%).`;
        const adherenceSummaryEn = `HEP adherence today: ${hepCompletedCount}/${hepTotalCount} completed (${hepAdherencePercent}%).`;
        currentHepAdherenceSummary = currentJurisdiction === 'ES-ES' ? adherenceSummaryEs : adherenceSummaryEn;
      }
      try {
        const pid = patientIdFromUrl || demoPatient.id;
        if (pid) {
          const longitudinalContext = await resolveFollowUpClinicalContext(pid, attachments);
          const resolvedComparisonState = longitudinalContext.comparisonState;
          const resolvedIsFirstSession = resolvedComparisonState.isFirstSession;
          setFollowUpContext(longitudinalContext);

          longitudinalSummary = longitudinalContext.longitudinalSummary;
          trajectoryPattern = longitudinalContext.trajectoryPattern;
          trajectoryConfidence = longitudinalContext.trajectoryConfidence;
          painSeriesSummary = longitudinalContext.painSeriesSummary;
          patternInsightSummary = longitudinalContext.patternInsightSummary;
          reviewedAttachmentsSummary = longitudinalContext.reviewedAttachmentsSummary;

          if (isFirstSession !== resolvedIsFirstSession) {
            setIsFirstSession(resolvedIsFirstSession);
          }
        }
      } catch (error) {
        console.warn('[Workflow] Longitudinal summary unavailable, continuing without it.', error);
      }
      // Fase B: previous plan as context only (guardrails in prompt)
      const previousPlansSummary = previousTreatmentPlan?.planText?.trim()
        ? (previousTreatmentPlan.nextSessionFocus
            ? `Focus for today (from last plan): ${String(previousTreatmentPlan.nextSessionFocus).trim()}\n\n`
            : '') +
          (Array.isArray(previousTreatmentPlan.interventions) && previousTreatmentPlan.interventions.length > 0
            ? `Interventions: ${previousTreatmentPlan.interventions.slice(0, 5).join('; ')}\n\n`
            : '') +
          `Plan text (previous):\n${String(previousTreatmentPlan.planText).trim().slice(0, 1500)}`
        : undefined;
      const followUpInput = {
        baselineSOAP: baseline,
        clinicalUpdate: followUpClinicalUpdate,
        longitudinalSummary,
        trajectoryPattern,
        trajectoryConfidence,
        painSeriesSummary,
        patternInsightSummary,
        reviewedAttachmentsSummary,
        currentHepAdherenceSummary,
        previousPlansSummary,
        inClinicItems: inClinicItems.length > 0 ? inClinicItems.map((i) => i.label) : undefined,
        homeProgram: homeProgramItems.length > 0 ? homeProgramItems.map((i) => i.label) : undefined,
        jurisdiction: currentJurisdiction,
      };
      // Fase C: documentation + considerations (considerations not part of record until clinician inserts).
      const result = await generateFollowUpAnalysis(followUpInput);
      const { documentation: soap, considerations, alerts, error: followUpError } = result;
      if (followUpError) {
        setAnalysisError('La generación automática no está disponible en este momento. No se ha producido ningún contenido por IA.');
        setFollowUpAlerts(null);
        setFollowUpConsiderations(null);
        return;
      }
      setFollowUpConsiderations(considerations?.length ? considerations : null);
      try {
        const memoryService = new PatientTrajectoryMemoryService();
        const insight = await memoryService.getPatternInsight(patientIdFromUrl || '');
        setFollowUpPatternInsight(insight ?? null);
      } catch {
        setFollowUpPatternInsight(null);
      }
      const safeAlerts = {
        red_flags: Array.isArray((alerts as any)?.red_flags) ? (alerts as any).red_flags : [],
      };
      const hasStructuredContent = soap?.subjective?.trim() || soap?.objective?.trim() || soap?.assessment?.trim() || soap?.plan?.trim();
      const hasFollowUpBlock = (soap as any)?.followUp?.trim?.();
      if (!soap || (!hasStructuredContent && !hasFollowUpBlock)) {
        setAnalysisError('La generación automática no está disponible en este momento. No se ha producido ningún contenido por IA.');
        setFollowUpAlerts(null);
        return;
      }
      setLocalSoapNote({
        ...soap,
        requiresReview: true,
        isReviewed: false,
        aiGenerated: true,
        aiProcessor: 'AiduxCare Clinical AI',
        processedAt: new Date(),
      });
      await trackSOAPGenerationCompleted({
        visitType: 'follow-up',
        duration: Date.now() - startTime,
        soapLength: JSON.stringify(soap).length,
        source: 'followup_single_call',
      });
      // WO-REDFLAG-FOLLOWUP-002/003: if red flags detected, stay in Analysis; otherwise go to SOAP
      // Set followUpAlerts first; navigation to Analysis is done in useEffect so the same render has both (avoids async state race).
      if (safeAlerts.red_flags.length > 0) {
        setFollowUpAlerts({ ...alerts, red_flags: safeAlerts.red_flags } as any);
        console.log('[WORKFLOW] ⚠️ Follow-up red flags from alerts — staying in Analysis tab', {
          redFlagCount: safeAlerts.red_flags.length,
          yellowFlagCount: Array.isArray((alerts as any)?.yellow_flags) ? (alerts as any).yellow_flags.length : 0,
        });
        // Do NOT setActiveTab('analysis') here — see useEffect below so AnalysisTab mounts with followUpAlerts already in state
      } else {
        setFollowUpAlerts(null);
        if (hasUndecidedFollowUpRedFlags()) {
          console.warn('[RED-FLAG-GATE] Follow-up blocked — decisions pending');
          return;
        }
        setActiveTab('soap');
        document.querySelector('[data-section="soap"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to generate SOAP note. Please try again.';
      setAnalysisError(message);
      console.error('[Workflow] Follow-up SOAP generation failed:', err);
    } finally {
      setIsGeneratingSOAP(false);
    }
  }, [attachments, followUpClinicalState, transcript, inClinicItems, homeProgramItems, previousTreatmentPlan, patientIdFromUrl]);

  // Helper function to clean undefined values from objects
  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const toLocalDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    return dateKey;
  };

  type FinalizationWriteState =
    | 'soap_generated'
    | 'soap_saved'
    | 'encounter_saved'
    | 'fully_committed'
    | 'commit_failed';

  const createFinalizationOperationId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const timestampPart = Date.now().toString();
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `finalize-${timestampPart}-${randomPart}`;
  };

  const getActiveWorkflowSessionId = () => {
    const currentSessionId = sessionId;
    if (currentSessionId) {
      return currentSessionId;
    }
    const currentSessionRefId = sessionIdRef.current;
    if (currentSessionRefId) {
      return currentSessionRefId;
    }
    const reservedSessionId = workflowReservedSessionIdRef.current;
    if (reservedSessionId) {
      return reservedSessionId;
    }
    const fallbackUserId = user?.uid || TEMP_USER_ID;
    const fallbackSessionId = `${fallbackUserId}-${sessionStartTime.getTime()}`;
    return fallbackSessionId;
  };

  const updateSessionFinalizationState = async (
    targetSessionId: string,
    state: FinalizationWriteState,
    operationId: string,
    step: string,
    extras?: Record<string, unknown>
  ) => {
    const currentSession = await sessionService.getSessionById(targetSessionId);
    const currentAttemptCountRaw = currentSession?.commitAttemptCount;
    const currentAttemptCount =
      typeof currentAttemptCountRaw === 'number' ? currentAttemptCountRaw : 0;
    const shouldIncrementAttempt =
      state === 'soap_generated' &&
      currentSession?.finalizationOperationId !== operationId;
    const nextAttemptCount =
      shouldIncrementAttempt ? currentAttemptCount + 1 : currentAttemptCount;
      const payload = {
        writeState: state,
        lastCommitStep: step,
        lastCommitError: null,
        finalizationOperationId: operationId,
        commitAttemptCount: nextAttemptCount,
        clientBuildId: currentClientBuildId,
        clientAppVersion: currentClientAppVersion,
        ...(extras || {}),
      };
    await sessionService.updateSession(targetSessionId, payload);
  };

  const markSessionFinalizationFailed = async (
    targetSessionId: string,
    operationId: string,
    step: string,
    error: unknown,
    extras?: Record<string, unknown>
  ) => {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown finalization error';
    const payload: {
      writeState: FinalizationWriteState;
      lastCommitStep: string;
      lastCommitError: string;
      finalizationOperationId: string;
      clientBuildId: string;
      clientAppVersion: string;
    } & Record<string, unknown> = {
      writeState: 'commit_failed',
      lastCommitStep: step,
      lastCommitError: errorMessage,
      finalizationOperationId: operationId,
      clientBuildId: currentClientBuildId,
      clientAppVersion: currentClientAppVersion,
      ...(extras || {}),
    };
    try {
      await sessionService.updateSession(targetSessionId, payload);
    } catch (sessionError) {
      console.error('[Workflow] Failed to persist commit_failed session state:', sessionError);
    }
  };

  // Calculate and track value metrics when SOAP is finalized
  const calculateAndTrackValueMetrics = useCallback(async (finalizedAt: Date) => {
    try {
      const activeUserId = user?.uid || TEMP_USER_ID;
      const activeSessionId = getActiveWorkflowSessionId();
      const metrics = buildValueMetricsEvent({
        filteredEvaluationTestsCount: filteredEvaluationTests.length,
        finalizedAt,
        localSoapNote,
        region: undefined,
        sessionId: activeSessionId,
        sessionStartTime,
        soapGenerationEndTime,
        soapGenerationStartTime,
        transcriptionEndTime,
        transcriptionStartTime,
        transcript: transcript || "",
        userId: activeUserId,
        visitType,
        wasClinicalAnalysisGenerated: Boolean(sharedState.analysisResults),
      });

      // Track metrics
      await AnalyticsService.trackValueMetrics(metrics);
      console.log('[VALUE METRICS] Metrics tracked successfully:', {
        totalTime: metrics.calculatedTimes.totalDocumentationTime,
        featuresUsed: Object.values(metrics.featuresUsed).filter(Boolean).length,
      });
    } catch (error) {
      console.error('❌ [VALUE METRICS] Error tracking value metrics:', error);
      // Don't throw - analytics should not break main flow
    }
  }, [
    sessionStartTime,
    transcriptionStartTime,
    transcriptionEndTime,
    soapGenerationStartTime,
    soapGenerationEndTime,
    user?.uid,
    transcript,
    filteredEvaluationTests,
    sharedState.analysisResults,
    localSoapNote,
    visitType,
  ]);

  const handleSaveSOAP = async (soap: SOAPNote, status: SOAPStatus) => {
    // ✅ DÍA 2: CPO Review Gate - Bloquear finalización sin review
    if (status === 'finalized') {
      // Check si requiere review y no fue reviewado
      if (soap.requiresReview && !soap.isReviewed) {
        setShowCPOBlockModal(true);
        return; // Bloquear finalización
      }

      // Si requiere review y fue reviewado, agregar metadata de review
      if (soap.requiresReview && soap.isReviewed && !soap.reviewed) {
        const reviewerId = user?.uid || TEMP_USER_ID;
        const reviewerName = clinicianDisplayName || 'Unknown clinician';
        const reviewedAt = new Date();
        soap.reviewed = buildSoapReviewMetadata(
          reviewerId,
          reviewerName,
          reviewedAt
        );
      }
    }

    setLocalSoapNote(soap);
    setSoapStatus(status);

    // Clean SOAP note: replace undefined with null for Firestore compatibility
    const cleanSoap: SOAPNote = {
      subjective: soap.subjective || '',
      objective: soap.objective || '',
      assessment: soap.assessment || '',
      plan: soap.plan || '',
      ...(soap.referrals && { referrals: soap.referrals }),
      ...(soap.precautions && { precautions: soap.precautions }),
      ...(soap.additionalNotes ? { additionalNotes: soap.additionalNotes } : {}), // ✅ FIX: Only include if defined and truthy
      ...(soap.followUp && { followUp: soap.followUp }),
      // ✅ DÍA 2: Incluir campos de review en saved SOAP
      ...(soap.requiresReview !== undefined && { requiresReview: soap.requiresReview }),
      ...(soap.isReviewed !== undefined && { isReviewed: soap.isReviewed }),
      ...(soap.reviewed && { reviewed: soap.reviewed }),
      ...(soap.aiGenerated !== undefined && { aiGenerated: soap.aiGenerated }),
      ...(soap.aiProcessor && { aiProcessor: soap.aiProcessor }),
      ...(soap.processedAt && { processedAt: soap.processedAt }),
    };

    // Clean transcriptionMeta to remove undefined values
    const cleanTranscriptionMeta = {
      lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
      languagePreference,
      mode,
      averageLogProb: transcriptMeta?.averageLogProb ?? null,
      durationSeconds: transcriptMeta?.durationSeconds ?? null,
      recordedAt: new Date().toISOString(),
    };

    // Remove undefined values from cleanTranscriptionMeta
    const finalTranscriptionMeta = cleanUndefined(cleanTranscriptionMeta);

    // Clean SOAP note to remove undefined values before saving to Firestore
    const cleanedSoap = cleanUndefined(cleanSoap);

    // Save to session — WO-IA-RESUME-01: update existing if sessionId set (resume), else create new
    try {
      if (!user?.uid) {
        throw new Error("Auth not ready: cannot persist session without authenticated user");
      }
      const sessionOwnerId = user.uid;
      const persistedSessionStatus: 'completed' | 'draft' =
        status === 'finalized' ? 'completed' : 'draft';
      const persistedSoapStatus: 'finalized' | 'draft' =
        status === 'finalized' ? 'finalized' : 'draft';
      const sessionDateKey = toLocalDateKey(sessionStartTime);
      const savePayload = {
        userId: sessionOwnerId,
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
        patientId: patientIdFromUrl || demoPatient.id,
        transcript: transcript || "",
        sessionDateKey,
        soapNote: cleanedSoap,
        physicalTests: physicalExamResults || [],
        status: persistedSessionStatus,
        soapStatus: persistedSoapStatus,
        sessionType: currentSessionType,
        transcriptionMeta: finalTranscriptionMeta,
        attachments: attachments || [],
        clientBuildId: currentClientBuildId,
        clientAppVersion: currentClientAppVersion,
      };
      const reservedWorkflowId = workflowReservedSessionIdRef.current;
      const effectiveSessionId = sessionId ?? sessionIdRef.current ?? reservedWorkflowId;
      if (effectiveSessionId) {
        const saveUpdateTarget = effectiveSessionId;
        await sessionService.updateSession(saveUpdateTarget, savePayload);
      } else {
        const saveAnchorMs = sessionStartTime.getTime();
        const saveUid = sessionOwnerId;
        const saveFallbackId = `${saveUid}-${saveAnchorMs}`;
        const proposedSaveSessionId = reservedWorkflowId ?? saveFallbackId;
        const savePatientKey = patientIdFromUrl || demoPatient.id;
        const saveLookupUser = sessionOwnerId;
        const saveSessionKind = currentSessionType;
        const saveReferenceDate = new Date();
        const saveReuseId = await sessionService.findReusableSessionForDayAndType(
          savePatientKey,
          saveLookupUser,
          saveSessionKind,
          saveReferenceDate
        );
        const saveHasReuse = saveReuseId != null;
        const saveTargetId = saveHasReuse ? saveReuseId : proposedSaveSessionId;
        const saveMergeWrite = saveHasReuse;
        const saveActualId = await sessionService.createSessionWithId(saveTargetId, savePayload, {
          merge: saveMergeWrite,
        });
        const persistedSessionId = saveActualId;
        sessionIdRef.current = persistedSessionId;
        sessionIdForTranscriptRef.current = persistedSessionId;
        lastFirestoreTranscriptSessionIdRef.current = persistedSessionId;
        setSessionId(persistedSessionId);
        await trackSessionStarted({
          userId: sessionOwnerId,
          patientId: patientIdFromUrl || demoPatient.id,
          sessionType: currentSessionType,
        });
      }

      // Track value metrics when SOAP is finalized
      if (status === 'finalized') {
        await calculateAndTrackValueMetrics(new Date());
      }
    } catch (error) {
      console.error('[Workflow] Failed to save clinical note:', error);
    }
  };

  const handleUnfinalizeSOAP = async (soap: SOAPNote) => {
    // When unfinalizing, save as draft and create edit history
    console.log('[Workflow] Unfinalizing note for editing', {
      hasSubjective: Boolean(soap.subjective),
      hasObjective: Boolean(soap.objective),
      hasAssessment: Boolean(soap.assessment),
      hasPlan: Boolean(soap.plan),
    });
    // The actual unfinalization is handled by the component state
    // This handler can be used to log or track the unfinalization event
  };

  // WO-IA-CLOSE-01: Close Initial Assessment — persist baseline, update patient/session, redirect
  const handleCloseInitialAssessment = useCallback(async () => {
    if (soapStatus !== 'finalized') {
      setAnalysisError('SOAP note must be finalized before closing the initial assessment.');
      return;
    }
    if (initialAssessmentClosedAt != null && initialAssessmentClosedAt !== '') {
      return;
    }
    if (!localSoapNote) {
      setAnalysisError('No SOAP note to save as baseline.');
      return;
    }
    const pid = patientIdFromUrl || demoPatient.id;
    const uid = user?.uid;
    if (!uid) {
      setAnalysisError('User not authenticated.');
      return;
    }
    setAnalysisError(null);
    try {
      const sourceSessionId = sessionId || `${uid}-${sessionStartTime.getTime()}`;
      const baselineId = await createBaseline({
        patientId: pid,
        sourceSoapId: sourceSessionId,
        sourceSessionId,
        snapshot: {
          primaryAssessment: localSoapNote.assessment ?? '',
          keyFindings: [localSoapNote.subjective ?? '', localSoapNote.objective ?? ''].filter(Boolean),
          precautions: localSoapNote.precautions ? [localSoapNote.precautions] : undefined,
          planSummary: localSoapNote.plan ?? '',
        },
        createdBy: uid,
      });
      await PatientService.updatePatient(pid, { activeBaselineId: baselineId });
      const now = new Date().toISOString();
      setInitialAssessmentClosedAt(now);
      setBaselineIdFromSession(baselineId);
      const userId = uid || TEMP_USER_ID;
      const currentSessionId = sessionId || `${userId}-${sessionStartTime.getTime()}`;
      SessionStorage.saveSession(pid, {
        transcript: transcript || '',
        niagaraResults: niagaraResults || null,
        evaluationTests: evaluationTests || [],
        activeTab,
        selectedEntityIds: selectedEntityIds || [],
        redFlagsDetected: niagaraResults?.red_flags ?? [],
        redFlagsAccepted: selectedRedFlagIds ?? [],
        redFlagDecisions: redFlagDecisions || {},
        localSoapNote: localSoapNote || null,
        soapStatus,
        visitType: visitType || 'initial',
        timestamp: now,
        version: '1.0',
        initialAssessmentClosedAt: now,
        baselineId,
      }, userId, visitType || 'initial', currentSessionId);
      setCloseInitialConfirmData({
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || 'Patient',
        baselineId,
      });
      setShowCloseInitialConfirmModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close initial assessment.';
      setAnalysisError(message);
    }
  }, [soapStatus, initialAssessmentClosedAt, localSoapNote, patientIdFromUrl, user?.uid, sessionId, sessionStartTime, transcript, niagaraResults, evaluationTests, activeTab, selectedEntityIds, selectedRedFlagIds, redFlagDecisions, visitType, currentPatient]);

  const handleFinalizeSOAP = async (soap: SOAPNote) => {
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;
    try {
    await handleSaveSOAP(soap, 'finalized');
    const activeSessionId = getActiveWorkflowSessionId();
    const finalizationOperationId = createFinalizationOperationId();
    await updateSessionFinalizationState(
      activeSessionId,
      'soap_generated',
      finalizationOperationId,
      'soap_generated'
    );

    // ✅ P1.3: Save finalized SOAP to Clinical Vault (Firestore)
    try {
      const patientId = patientIdFromUrl || demoPatient.id;
      const linkedSession = await sessionService.getSessionById(activeSessionId);
      const linkedSessionTimestamp = linkedSession?.timestamp;
      const linkedSessionCreatedAt = linkedSession?.createdAt;
      const openedAtFromTimestamp = linkedSessionTimestamp?.toDate?.();
      const openedAtFromCreatedAt = linkedSessionCreatedAt?.toDate?.();
      const clinicalVisitDate = openedAtFromTimestamp || openedAtFromCreatedAt || sessionStartTime;

      // WO-FOLLOWUP-PLAN-NEXT: If note only has followUp (raw JSON/text), derive S/O/A/P so the next follow-up has baseline/plan
      const hasStructured = (soap.subjective || soap.objective || soap.assessment || soap.plan || '').trim().length > 0;
      const followUpRaw = (soap as { followUp?: string }).followUp?.trim() ?? '';
      const derived = !hasStructured && followUpRaw.length > 0 ? deriveSOAPDataFromRawText(followUpRaw) : null;
      let s = derived ? derived.subjective : (soap.subjective || '');
      let o = derived ? derived.objective : (soap.objective || '');
      let a = derived ? derived.assessment : (soap.assessment || '');
      let p = derived ? derived.plan : (soap.plan || '');
      if (derived) {
        console.info('[Workflow] WO-FOLLOWUP-PLAN-NEXT: Derived S/O/A/P from followUp for persistence so next follow-up has baseline/plan');
      } else if (!hasStructured && followUpRaw.length > 0) {
        // Parse failed: persist raw in plan so next follow-up has at least plan (validation requires all four)
        s = o = a = 'Not documented.';
        p = followUpRaw;
        console.info('[Workflow] WO-FOLLOWUP-PLAN-NEXT: Could not parse followUp; persisting raw as plan so next follow-up has baseline/plan');
      }

      // ✅ P1.3: Save finalized SOAP to Clinical Vault with detailed logging
      // WO-FIX-FOLLOWUP-VISITTYPE-SESSION-COUNT: persist visitType + source for correct History and future session count
      const soapDataToSave = {
        subjective: s,
        objective: o,
        assessment: a,
        plan: p,
        confidence: 0.85, // Default confidence for finalized notes
        timestamp: new Date().toISOString(),
        visitType,           // initial | follow-up
        source: 'workflow',
      };

      console.log('[Workflow] Saving SOAP to Clinical Vault:', {
        hasPatientId: Boolean(patientId),
        hasSessionId: Boolean(activeSessionId),
        soapDataLength: {
          subjective: soapDataToSave.subjective.length,
          objective: soapDataToSave.objective.length,
          assessment: soapDataToSave.assessment.length,
          plan: soapDataToSave.plan.length,
        }
      });

      // ✅ SPRINT 2 P2: Use enhanced persistence with retry and backup
      await updateSessionFinalizationState(
        activeSessionId,
        'soap_generated',
        finalizationOperationId,
        'soap_save_started'
      );
      const { saveSOAPNoteWithRetry } = await import('../services/PersistenceServiceEnhanced');
      const result = await saveSOAPNoteWithRetry(
        soapDataToSave,
        patientId,
        activeSessionId,
        {
          maxRetries: 3,
          retryDelay: 1000,
          enableBackup: true,
          validateBeforeSave: true,
          noteOptions: {
            requestedStatus: 'finalized',
            acceptedAt: new Date().toISOString(),
            acceptedBy: user?.uid,
            acceptanceOperationId: finalizationOperationId,
          },
        }
      );

      if (result.success && result.noteId) {
        const persistedNoteStatusFromResult = result.noteStatus;
        const requiresPersistedNoteLookup =
          persistedNoteStatusFromResult == null;
        const persistedNote =
          requiresPersistedNoteLookup
            ? await PersistenceService.getNoteById(result.noteId)
            : null;
        const persistedNoteStatus =
          persistedNoteStatusFromResult ?? persistedNote?.status;
        const persistedNoteWasForkedToDraft =
          persistedNoteStatus === 'draft';
        if (persistedNoteWasForkedToDraft) {
          const forkWarningMessage =
            'SOAP version forked to draft. Explicit acceptance is still required before clinical closure.';
          await markSessionFinalizationFailed(
            activeSessionId,
            finalizationOperationId,
            'soap_requires_acceptance',
            new Error(forkWarningMessage),
            {
              soapNoteId: result.noteId,
              persistedNoteStatus,
            }
          );
          console.warn('[SOAP-VERSION] Note forked to draft — requires explicit acceptance', {
            noteId: result.noteId,
            persistedNoteStatus,
          });
          setAnalysisError(forkWarningMessage);
          return;
        }
        await updateSessionFinalizationState(
          activeSessionId,
          'soap_saved',
          finalizationOperationId,
          'soap_saved',
          {
            soapNoteId: result.noteId,
          }
        );
        console.log('[Workflow] ✅ SOAP note saved to Clinical Vault:', {
          noteId: result.noteId,
          hasPatientId: Boolean(patientId),
          hasSessionId: Boolean(activeSessionId),
          retries: result.retries,
          usedBackup: result.usedBackup,
          timestamp: new Date().toISOString()
        });
        const subjectiveLength = soapDataToSave.subjective?.length || 0;
        const objectiveLength = soapDataToSave.objective?.length || 0;
        const assessmentLength = soapDataToSave.assessment?.length || 0;
        const planLength = soapDataToSave.plan?.length || 0;
        const soapCharacterCount = subjectiveLength + objectiveLength + assessmentLength + planLength;
        const finalizedAt = new Date().toISOString();
        void trackSOAPFinalized({
          characterCount: soapCharacterCount,
          character_count: soapCharacterCount,
          finalizedAt,
          visitType,
        });
        setSuccessMessage('SOAP note saved successfully to Clinical Vault.');
        const requiresEncounterPersistence =
          (visitType === 'follow-up' || visitType === 'initial') &&
          Boolean(user?.uid);
        let encounterPersistenceSatisfied = !requiresEncounterPersistence;

        // WO-FOLLOWUP-CREATES-ENCOUNTER: ensure follow-up creates or completes clinical encounter for session count
        if (visitType === 'follow-up' && user?.uid) {
          try {
            await updateSessionFinalizationState(
              activeSessionId,
              'soap_saved',
              finalizationOperationId,
              'encounter_save_started',
              {
                soapNoteId: result.noteId,
              }
            );
            const memoryService = new PatientTrajectoryMemoryService();
            const hepCompletedCount = homeProgramItems.filter((item) => item.completed).length;
            const hepTotalCount = homeProgramItems.length;
            const hepAdherenceRate = hepTotalCount > 0 ? hepCompletedCount / hepTotalCount : undefined;
            const longitudinalSnapshot = await memoryService.buildEncounterLongitudinalSnapshot(patientId, s, {
              hepAdherenceRate,
              objectiveText: o,
              assessmentText: a,
            });
            const encounterId = await encountersRepo.createEncounterCompleted({
              patientId,
              sessionId: activeSessionId,
              visitType,
              authorUid: user.uid,
              encounterDate: clinicalVisitDate,
              soap: { subjective: s, objective: o, assessment: a, plan: p },
              longitudinalSnapshot,
            });
            await updateSessionFinalizationState(
              activeSessionId,
              'encounter_saved',
              finalizationOperationId,
              'encounter_saved',
              {
                soapNoteId: result.noteId,
                encounterId,
                encounterPersisted: true,
              }
            );
            encounterPersistenceSatisfied = true;
            console.log('[Workflow] ✅ Follow-up encounter persisted as completed:', {
              hasEncounterId: Boolean(encounterId),
            });
            // Patient Clinical Memory: record trajectory event for pattern detection (non-blocking)
            try {
              await memoryService.recordEncounterTrajectory(patientId, encounterId, s);
            } catch (memErr) {
              console.warn('[Workflow] Patient trajectory memory record failed (non-blocking):', memErr);
            }
          } catch (encErr) {
            await markSessionFinalizationFailed(
              activeSessionId,
              finalizationOperationId,
              'encounter_save_failed',
              encErr,
              {
                soapNoteId: result.noteId,
              }
            );
            encounterPersistenceSatisfied = false;
            console.error('[Workflow] Failed to create follow-up encounter (non-blocking):', encErr);
          }
        }

        // WO-INITIAL-CREATES-ENCOUNTER: create exactly 1 encounter on initial assessment completion (Session 1)
        if (visitType === 'initial' && user?.uid) {
          try {
            const existing = await encountersRepo.getEncountersByPatient(patientId, 1);
            if (existing.length === 0) {
              await updateSessionFinalizationState(
                activeSessionId,
                'soap_saved',
                finalizationOperationId,
                'encounter_save_started',
                {
                  soapNoteId: result.noteId,
                }
              );
              const memoryService = new PatientTrajectoryMemoryService();
              const longitudinalSnapshot = await memoryService.buildEncounterLongitudinalSnapshot(patientId, s, {
                objectiveText: o,
                assessmentText: a,
              });
              const encounterId = await encountersRepo.createEncounterCompleted({
                patientId,
                sessionId: activeSessionId,
                visitType,
                authorUid: user.uid,
                encounterDate: clinicalVisitDate,
                soap: { subjective: s, objective: o, assessment: a, plan: p },
                longitudinalSnapshot,
              });
              await updateSessionFinalizationState(
                activeSessionId,
                'encounter_saved',
                finalizationOperationId,
                'encounter_saved',
                {
                  soapNoteId: result.noteId,
                  encounterId,
                  encounterPersisted: true,
                }
              );
              encounterPersistenceSatisfied = true;
              console.log('[Workflow] ✅ Initial assessment encounter created and completed:', {
                hasEncounterId: Boolean(encounterId),
              });
            } else {
              const existingEncounterId = existing[0]?.id || null;
              await updateSessionFinalizationState(
                activeSessionId,
                'encounter_saved',
                finalizationOperationId,
                'encounter_already_present',
                {
                  soapNoteId: result.noteId,
                  encounterId: existingEncounterId,
                  encounterPersisted: true,
                }
              );
              encounterPersistenceSatisfied = true;
            }
          } catch (encErr) {
            await markSessionFinalizationFailed(
              activeSessionId,
              finalizationOperationId,
              'encounter_save_failed',
              encErr,
              {
                soapNoteId: result.noteId,
              }
            );
            encounterPersistenceSatisfied = false;
            console.error('[Workflow] Failed to create initial encounter (non-blocking):', encErr);
          }
        }
        if (encounterPersistenceSatisfied) {
          await updateSessionFinalizationState(
            activeSessionId,
            'fully_committed',
            finalizationOperationId,
            'fully_committed',
            {
              soapNoteId: result.noteId,
            }
          );
          const completedPatientId = patientIdFromUrl;
          const completedSessionType =
            visitType === 'initial' ? 'initial' : 'followup';
          const completedSessionDateKey =
            toLocalDateKey(sessionStartTime);
          if (completedPatientId) {
            setSessionCompleted(
              completedPatientId,
              completedSessionType,
              completedSessionDateKey
            );
          }

          // ✅ HOSPITAL PORTAL: Show share menu after finalization
          // The share menu will allow physiotherapists to share the note securely
          // This is especially important for hospital workflows
          // Note: Share menu will be opened via onShare callback in SOAPEditor

          // ✅ WORKFLOW OPTIMIZATION: Track workflow session end and show feedback
          try {
            const hasWorkflowTrackingContext =
              Boolean(sessionId) &&
              Boolean(user?.uid) &&
              Boolean(workflowRoute);
            if (!hasWorkflowTrackingContext) {
              console.warn(
                '[WORKFLOW] Skipping workflow end tracking (missing sessionId or user)',
                {
                  hasSessionId: Boolean(sessionId),
                  hasUserId: Boolean(user?.uid),
                  hasWorkflowRoute: Boolean(workflowRoute),
                }
              );
            } else {
              const trackedWorkflowSessionId = sessionId as string;
              const trackedWorkflowUserId = user?.uid as string;
              const trackedWorkflowPatientId =
                patientIdFromUrl || demoPatient.id;
              const metrics = await trackWorkflowSessionEnd(
                trackedWorkflowSessionId,
                trackedWorkflowUserId,
                trackedWorkflowPatientId
              );
              if (metrics) {
                const hasWorkflowTimes =
                  Boolean(metrics.endTime) &&
                  Boolean(metrics.startTime);
                const workflowDurationMs =
                  hasWorkflowTimes
                    ? new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime()
                    : 0;
                console.log('[WORKFLOW] Workflow session metrics:', {
                  totalDurationMs: workflowDurationMs,
                  tabCount: 0,
                  errorCount: 0,
                  wasCompleted: Boolean(metrics.endTime),
                });
                const workflowType =
                  workflowRoute?.type === 'follow-up' ? 'follow-up' : 'initial';
                const workflowMetricsData: WorkflowMetrics = {
                  workflowType,
                  timeToSOAP: metrics.timeToSOAP || 0,
                  tokenUsage: metrics.tokenUsage || { input: 0, output: 0, total: 0 },
                  tokenOptimization: metrics.tokenOptimization,
                  userClicks: metrics.userClicks,
                  tabsSkipped: metrics.tabsSkipped,
                  timestamp: metrics.endTime || new Date(),
                };
                setWorkflowMetrics(workflowMetricsData);
                setTimeout(() => {
                  setShowWorkflowFeedback(true);
                }, 2000);
              }
            }
          } catch (error) {
            console.error('[WORKFLOW] Error tracking workflow session end:', error);
          }

          // ✅ PILOT METRICS: Track session completion
          try {
            const pilotStartDate = new Date('2024-12-19T00:00:00Z');
            const currentDate = new Date();
            const isPilotUser = currentDate >= pilotStartDate;
            const hasPilotTrackingContext =
              isPilotUser &&
              Boolean(user?.uid);
            if (hasPilotTrackingContext) {
              const sessionDuration =
                Math.round((currentDate.getTime() - sessionStartTime.getTime()) / 1000 / 60);
              const trackedPilotPatientId =
                patientIdFromUrl || demoPatient.id;
              const trackedPilotUserId = user?.uid as string;
              await AnalyticsService.trackEvent('pilot_session_completed', {
                patientId: trackedPilotPatientId,
                userId: trackedPilotUserId,
                sessionStartTime: sessionStartTime.toISOString(),
                sessionEndTime: currentDate.toISOString(),
                sessionDurationMinutes: sessionDuration,
                visitType,
                soapFinalized: true,
                hasTranscript: !!transcript?.trim(),
                hasPhysicalTests: evaluationTests.length > 0,
                isPilotUser: true
              });
              console.log('✅ [PILOT METRICS] Session completion tracked:', {
                hasPatientId: Boolean(completedPatientId),
                durationMinutes: sessionDuration,
              });
            }
          } catch (error) {
            console.error('⚠️ [PILOT METRICS] Error tracking session completion:', error);
          }
        } else {
          await markSessionFinalizationFailed(
            activeSessionId,
            finalizationOperationId,
            'encounter_incomplete',
            new Error('Encounter persistence incomplete after SOAP finalization'),
            {
              soapNoteId: result.noteId,
            }
          );
        }
      } else {
        throw new Error(result.error || 'Failed to save after retries');
      }
    } catch (error) {
      await markSessionFinalizationFailed(
        activeSessionId,
        finalizationOperationId,
        'soap_save_failed',
        error
      );
      console.error('[Workflow] Failed to save SOAP to Clinical Vault:', error);
      // Non-blocking: show warning but don't block finalization
      // ✅ SPRINT 2 P2: Inform user about backup
      setAnalysisError(
        'Note finalized but failed to save to Clinical Vault. ' +
        'Your note has been backed up locally and will be retried automatically. ' +
        'Please check your connection and try again.'
      );
    }

    if (soap.plan) {
      try {
        const patientKeyForTreatmentPlan = patientIdFromUrl || demoPatient.id;
        const patientLabelForTreatmentPlan =
          currentPatient?.fullName ||
          `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() ||
          demoPatient.name;
        const authorUidForTreatmentPlan = user?.uid;
        const finalizedPlanText = soap.plan;
        const visitTypeForTreatmentPlan = visitType;
        if (authorUidForTreatmentPlan) {
          await treatmentPlanService.saveTreatmentPlan(
            patientKeyForTreatmentPlan,
            patientLabelForTreatmentPlan,
            authorUidForTreatmentPlan,
            finalizedPlanText,
            visitTypeForTreatmentPlan
          );
          console.log('[Workflow] Treatment plan saved for reminders');
        }
      } catch (error) {
        console.error('[Workflow] Failed to save treatment plan:', error);
      }
    }
    } finally {
      isFinalizingRef.current = false;
    }
  };

  const handleRegenerateSOAP = async () => {
    // Regenerate with same context
    const isSpainMarket = isSpainPilot();
    const regeneratePayload = {
      visitType,
      isSpainMarket,
    };
    void AnalyticsService.trackEvent('workflow_soap_regenerated', regeneratePayload).catch(() => {});
    await handleGenerateSoap();
  };

  const handleGenerateSoapFromEvaluation = async (): Promise<void> => {
    const testCount = filteredEvaluationTests.length;
    const trackingPayload = { testCount };
    await trackEvaluationCompleted(trackingPayload);
    await handleGenerateSoap();
  };

  const copySoapToClipboard = async () => {
    if (!localSoapNote) return;
    const plain = [
      isSpainPilotActive ? "SUBJETIVO:" : "Subjective:",
      localSoapNote.subjective || "Not documented.",
      "",
      isSpainPilotActive ? "OBJETIVO:" : "Objective:",
      localSoapNote.objective || "Not documented.",
      "",
      isSpainPilotActive ? "VALORACIÓN:" : "Assessment:",
      localSoapNote.assessment || "Pending clinician review.",
      "",
      isSpainPilotActive ? "PLAN:" : "Plan:",
      localSoapNote.plan || "To be defined with patient.",
    ].join("\n");

    await navigator.clipboard.writeText(plain);
  };


  // Format last session date helper
  const formatLastSessionDate = useCallback((encounter: any) => {
    if (!encounter?.encounterDate) return null;
    const date = encounter.encounterDate instanceof Timestamp
      ? encounter.encounterDate.toDate()
      : encounter.encounterDate instanceof Date
        ? encounter.encounterDate
        : new Date(encounter.encounterDate);
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

  // Calculate patient age from dateOfBirth
  const calculateAge = useCallback((dateOfBirth: string | Date | undefined): number | null => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
      if (isNaN(birthDate.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  }, []);

  // Extract allergies and contraindications from patient and analysis
  const patientClinicalInfo = useMemo(() => {
    const allergies: string[] = [];
    const contraindications: string[] = [];

    // Get allergies from patient record
    if (currentPatient?.allergies) {
      if (typeof currentPatient.allergies === 'string') {
        const parsed = currentPatient.allergies.trim();
        if (parsed) {
          // Split by comma or semicolon if multiple allergies
          allergies.push(...parsed.split(/[,;]/).map(a => a.trim()).filter(Boolean));
        }
      } else if (Array.isArray(currentPatient.allergies)) {
        const allergyList = currentPatient.allergies;
        allergies.push(...allergyList.filter(Boolean));
      }
    }

    // Extract contraindications from Niagara analysis results
    if (niagaraResults) {
      // Red flags often indicate contraindications
      if (niagaraResults.red_flags && Array.isArray(niagaraResults.red_flags)) {
        contraindications.push(...niagaraResults.red_flags.filter(Boolean));
      }

      // Medical history may contain contraindications
      if (niagaraResults.antecedentes_medicos && Array.isArray(niagaraResults.antecedentes_medicos)) {
        // Filter for conditions that might be contraindications
        const medicalHistory = niagaraResults.antecedentes_medicos;
        medicalHistory.forEach((item: string) => {
          const lower = item.toLowerCase();
          // Look for conditions that might contraindicate certain treatments
          if (lower.includes('contraindic') ||
            lower.includes('no debe') ||
            lower.includes('evitar') ||
            lower.includes('precaución') ||
            lower.includes('riesgo') ||
            lower.includes('cardiac') ||
            lower.includes('cardíac') ||
            lower.includes('hipertensión') ||
            lower.includes('diabetes') ||
            lower.includes('osteoporosis') ||
            lower.includes('fractura') ||
            lower.includes('cirugía') ||
            lower.includes('surgery')) {
            contraindications.push(item);
          }
        });
      }
    }

    return {
      allergies: allergies.length > 0 ? allergies : null,
      contraindications: contraindications.length > 0 ? contraindications : null
    };
  }, [currentPatient?.allergies, niagaraResults]);

  // ✅ ISO COMPLIANCE: Render functions extracted to separate components for better code organization
  // Components are lazy-loaded for optimal performance and memory management

  // Follow-up requires patient context; avoid running longitudinal flow without it
  if (isExplicitFollowUp && !patientIdFromUrl) {
    return <Navigate to="/command-center" replace />;
  }

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Dominio es única fuente de verdad
  // Resolver consentimiento desde workflowConsentStatus (backend) → dominio → render
  let consentResolution = null;
  if (patientIdFromUrl && user?.uid && currentPatient && consentCheckComplete && workflowConsentStatus !== null) {
    const jurisdiction = getCurrentJurisdiction();
    const isFirstSession = true; // TODO: Pass as prop when available
    consentResolution = resolveConsentChannel({
      hasValidConsent: workflowConsentStatus.hasValidConsent,
      // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Pass declined status to domain
      isDeclined: workflowConsentStatus.isDeclined === true,
      jurisdiction,
      isFirstSession,
    });

  }

  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Hard block guard - ANTES de renderizar nada
  // Si consentimiento está declined, AiDux NO puede usarse - redirect inmediato
  if (consentResolution?.hardBlock === true) {
    console.warn('[WORKFLOW] 🚫 HARD BLOCK: Patient declined consent - AiDux cannot be used', {
      hasPatientId: Boolean(patientIdFromUrl),
      blockReason: consentResolution.blockReason,
      hasConsentStatus: Boolean(workflowConsentStatus),
    });

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Track analytics event
    if (patientIdFromUrl && user?.uid) {
      AnalyticsService.trackEvent('aidux_patient_blocked_due_to_consent_decline', {
        patientId: patientIdFromUrl,
        userId: user.uid,
        declineReasons: workflowConsentStatus?.declineReasons || [],
        timestamp: new Date().toISOString()
      }).catch(err => {
        console.warn('[WORKFLOW] Error tracking declined consent analytics:', err);
      });
    }

    // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Show declined consent modal
    // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Allow recording new consent if patient changes mind
    // If user wants to record new consent, show verbal consent modal
    if (showVerbalConsentForDeclined) {
      return (
        <VerbalConsentModal
          isOpen={showVerbalConsentForDeclined}
          patientId={patientIdFromUrl}
          patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim()}
          physiotherapistId={user.uid}
          physiotherapistName={clinicianDisplayName}
          onClose={() => {
            console.log('[WORKFLOW] Verbal consent modal closed for declined patient');
            setShowVerbalConsentForDeclined(false);
          }}
          onConsentObtained={async () => {
            console.log('[WORKFLOW] New consent granted after decline - triggering check');
            setShowVerbalConsentForDeclined(false);

            // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Small delay to allow Firestore propagation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trigger immediate check to update workflowConsentStatus
            if (patientIdFromUrl) {
              const consentResult = await checkConsentViaServer(patientIdFromUrl);
              console.log('[WORKFLOW] Reversal check result:', {
                hasValidConsent: consentResult.hasValidConsent,
                isDeclined: consentResult.isDeclined,
                hasStatus: Boolean(consentResult.status),
              });

              if (consentResult.hasValidConsent === true) {
                console.log('[WORKFLOW] ✅ New consent confirmed - hard block removed');
                setWorkflowConsentStatus({
                  hasValidConsent: true,
                  isDeclined: false,
                  status: consentResult.status || 'ongoing',
                  consentMethod: consentResult.consentMethod || null,
                  declineReasons: undefined
                });
                // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Update consentStatus to remove "Consent Required" banner
                setConsentStatus(consentResult.status || 'ongoing');
                // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Mark check as complete so consentResolution recalculates
                setConsentCheckComplete(true);
                // Mark as granted to prevent re-checking
                consentGrantedRef.current = true;
                // ✅ WO-CONSENT-DECLINED-REVERSAL-01: Ensure patientHasConsent is updated
                setPatientHasConsent(true);
              } else {
                console.warn('[WORKFLOW] ⚠️ New consent not yet detected - will be picked up by polling');
                // Even if not detected yet, mark check as complete to allow recalculation
                setConsentCheckComplete(true);
              }
            }
          }}
        />
      );
    }

    return (
      <DeclinedConsentModal
        patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim()}
        declineReasons={workflowConsentStatus?.declineReasons}
        patientId={patientIdFromUrl}
        onRecordNewConsent={() => {
          console.log('[WORKFLOW] User wants to record new consent for declined patient');
          setShowVerbalConsentForDeclined(true);
        }}
      />
    );
  }

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Gate se desmonta si dominio dice channel === 'none' o 'blocked'
  // NO hay estados duplicados, solo dominio decide
  // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: 'blocked' también desmonta el Gate (hard block se maneja arriba)
  if (patientIdFromUrl && user?.uid && currentPatient && consentCheckComplete &&
    consentResolution && consentResolution.channel !== 'none' && consentResolution.channel !== 'blocked') {

    console.log('[WORKFLOW] Rendering ConsentGateScreen (domain says channel !== none)', {
      consentChannel: consentResolution.channel,
      hasWorkflowConsentStatus: Boolean(workflowConsentStatus),
    });

    return (
      <ConsentGateScreen
        patientId={patientIdFromUrl}
        patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim()}
        patientPhone={currentPatient?.phone || currentPatient?.personalInfo?.phone}
        clinicName={clinicName}
        consentJurisdiction={consentSmsJurisdiction}
        consentResolution={consentResolution}
        physiotherapistId={user?.uid}
        physiotherapistName={clinicianDisplayName}
        onConsentGranted={handleConsentGrantedImmediate}
        // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Callback para check inmediato cuando se declina
        onConsentDeclined={async () => {
          console.log('[WORKFLOW] Consent declined - triggering immediate check');
          if (!patientIdFromUrl || !user?.uid) return;

          // ✅ WO-CONSENT-DECLINED-HARD-BLOCK-01: Small delay to allow Firestore propagation
          // Firestore writes are eventually consistent, so we wait a bit before checking
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check immediately to update workflowConsentStatus
          const consentResult = await checkConsentViaServer(patientIdFromUrl);

          console.log('[WORKFLOW] Immediate check result after decline:', {
            isDeclined: consentResult.isDeclined,
            hasStatus: Boolean(consentResult.status),
            hasValidConsent: consentResult.hasValidConsent,
          });

          if (consentResult.isDeclined === true) {
            console.warn('[WORKFLOW] 🚫 Declined consent confirmed via immediate check');
            setWorkflowConsentStatus({
              hasValidConsent: false,
              isDeclined: true,
              status: 'declined',
              consentMethod: consentResult.consentMethod || null,
              declineReasons: consentResult.declineReasons || undefined
            });

            // Stop polling immediately
            if (consentPollingRef.current) {
              clearInterval(consentPollingRef.current);
              consentPollingRef.current = null;
              consentPollingAttemptsRef.current = 0;
              consentPollingPatientIdRef.current = null;
            }
          } else {
            // If declined not detected yet, the polling will pick it up
            console.warn('[WORKFLOW] ⚠️ Declined not detected yet - polling will retry');
          }
        }}
        // ✅ WO-CONSENT-UX: Allow clinician to safely exit without starting a session
        onCancel={() => {
          console.log('[WORKFLOW] Consent gate cancelled by user - returning to command-center');
          navigate('/command-center');
        }}
      />
    );
  }

  // ✅ WO-CONSENT-SINGLE-SOURCE-01: Si dominio dice channel === 'none', Gate NO se renderiza
  // El workflow clínico continúa normalmente (Gate desmontado)
  if (consentResolution && consentResolution.channel === 'none') {
    console.log('[WORKFLOW] ✅ Domain says consent valid (channel === none) - Gate UNMOUNTED, rendering clinical workflow');
  }

  // ✅ WO-CONSENT-GATE-UI-01: Show loading while checking consent
  if (patientIdFromUrl && user?.uid && currentPatient && !consentCheckComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-600">Verifying patient consent...</p>
        </div>
      </div>
    );
  }

  // WO-REDFLAG-FOLLOWUP: When follow-up has red flags, force Analysis tab at render time so SOAP never mounts until decisions are done
  const isFollowUpWithRedFlags = (sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && ((followUpAlerts?.red_flags?.length ?? 0) > 0);
  const effectiveActiveTab: ActiveTab = isFollowUpWithRedFlags ? 'analysis' : activeTab;

  const showClinicalBriefing =
    visitType === 'follow-up' &&
    followUpClinicalState?.baselineSOAP != null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* WO-CPO-BLOCK-MODAL-001 — jurisdiction-aware (CPO / normativa europea-española-autonómica) */}
      {showCPOBlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="bg-red-600 rounded-t-2xl p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-full p-2"><span className="text-2xl">⚠️</span></div>
                <div>
                  <h2 className="text-xl font-bold">{t('clinical.soap.cannotFinalize.title')}</h2>
                  <p className="text-sm text-red-100 mt-1">{t('clinical.soap.cannotFinalize.subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-900">{t('clinical.soap.cannotFinalize.body')}</p>
              </div>
              <button type="button" onClick={() => setShowCPOBlockModal(false)} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium">{t('clinical.soap.cannotFinalize.button')}</button>
            </div>
          </div>
        </div>
      )}
      <CloseInitialAssessmentConfirmModal
        isOpen={showCloseInitialConfirmModal}
        onClose={() => {
          setShowCloseInitialConfirmModal(false);
          setCloseInitialConfirmData(null);
        }}
        patientId={patientIdFromUrl ?? undefined}
        patientName={closeInitialConfirmData?.patientName}
        baselineId={closeInitialConfirmData?.baselineId}
        sessionDateKey={toLocalDateKey(sessionStartTime)}
      />
      {/* WO-PILOT-FIX-07: Two-line header - Professional identity + Session context */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex flex-col gap-2">
          {/* LINE 1: Professional Identity & Context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-900 font-medium font-apple">
                  {greeting}, {clinicianDisplayName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors font-apple"
              title={t('shell.common.logout')}
              aria-label={t('shell.common.logout')}
            >
              <LogOut className="w-4 h-4" />
              {t('shell.common.logout')}
            </button>
          </div>

          {/* LINE 2: Session Context */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-slate-900 font-apple">
                {currentPatient
                  ? visitType === 'initial'
                    ? t('shell.professionalWorkflow.initialAssessment')
                    : t('shell.professionalWorkflow.followUp')
                  : t('shell.professionalWorkflow.clinicalWorkflow')}
              </span>
              {currentPatient && (
                <>
                  <span className="text-slate-400">—</span>
                  <span className="text-base text-slate-700 font-apple">
                    {currentPatient.fullName ||
                      `${currentPatient.firstName || ''} ${currentPatient.lastName || ''}`.trim() ||
                      'Patient'}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const uid = user?.uid;
                if (uid) {
                  void (async () => {
                    const stateExitId = sessionId;
                    const reservedExitId = workflowReservedSessionIdRef.current;
                    const exitAnchorMs = sessionStartTime.getTime();
                    const exitFallbackId = `${uid}-${exitAnchorMs}`;
                    const exitBaseId = stateExitId ?? reservedExitId ?? exitFallbackId;
                    const exitPatientKey = patientId || '';
                    const exitSessionKind = currentSessionType;
                    const exitReferenceDate = new Date();
                    const exitReuseId = await sessionService.findReusableSessionForDayAndType(
                      exitPatientKey,
                      uid,
                      exitSessionKind,
                      exitReferenceDate
                    );
                    const exitHasReuse = exitReuseId != null;
                    const exitTargetId = exitHasReuse ? exitReuseId : exitBaseId;
                    const exitMergeWrite = exitHasReuse;
                    const interruptDocPayload = {
                      status: 'interrupted' as const,
                      patientId: patientId || '',
                      patientName: currentPatient?.fullName || 'Unknown',
                      userId: uid,
                      sessionDateKey: toLocalDateKey(sessionStartTime),
                      sessionType: currentSessionType,
                      transcript: transcript || '',
                      clientBuildId: currentClientBuildId,
                      clientAppVersion: currentClientAppVersion,
                    };
                    sessionService.updateSession(exitTargetId, interruptDocPayload).catch(() => {
                      sessionService
                        .createSessionWithId(exitTargetId, interruptDocPayload, { merge: exitMergeWrite })
                        .catch(() => {});
                    });
                  })();
                }
                navigate('/command-center');
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-primary-blue hover:bg-blue-50 rounded-lg transition-colors font-apple"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('shell.commandCenter.title')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {deploymentVersionMismatch && hasActiveWorkflowDraft && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">
                  Nueva versión detectada durante una visita activa
                </p>
                <p className="text-sm text-amber-900">
                  No refresques ni cierres esta página hasta finalizar la ficha o salir de forma segura al command center.
                </p>
                <p className="text-xs text-amber-800">
                  Build actual: {deploymentVersionMismatch.currentBuildId}
                </p>
                <p className="text-xs text-amber-800">
                  Build servido: {deploymentVersionMismatch.latestBuildId}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* ✅ WORKFLOW OPTIMIZATION: Workflow Selector */}
        {/* WO-002: Removed manual session type selector - system auto-detects Initial vs Follow-up */}
        {/* {workflowDetected && currentPatient && user?.uid && !isExplicitFollowUp && (
          <WorkflowSelector
            patientId={patientId}
            userId={user.uid}
            consultationType={sessionTypeFromUrl || undefined}
            onWorkflowSelected={handleWorkflowSelected}
            onManualOverride={(type) => {
              // Manual override handled by WorkflowSelector
            }}
          />
        )} */}

        {/* WO-06: Follow-up indicator removed - now shown in header context */}

        {/* WO-07 FIX: Layout condicional - Tabs para Initial, Vertical para Follow-up */}
        {visitType === 'follow-up' ? (
          !followUpBaselineChecked ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <Loader2 className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-slate-600">Checking baseline…</p>
            </div>
          ) : followUpBaselineChecked && !followUpClinicalState ? (
            <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No baseline — follow-up not available</h2>
              <p className="text-sm text-slate-700 mb-4 max-w-md mx-auto">
                You cannot start a follow-up without a prior initial assessment. Complete an initial assessment for this patient first; the baseline is then built from that and is the single source of truth for follow-up.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(patientId ? `/workflow?patientId=${patientId}` : '/command-center')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
                >
                  Start initial assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECCIÓN 1: Patient context — Sprint B redesign (follow-up; single sticky card, no 3-col grid) */}
              <div className="overflow-hidden bg-white border border-blue-100 rounded-xl shadow-sm">
                {(() => {
                  const patientContextDisplayName =
                    currentPatient?.fullName ||
                    `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() ||
                    demoPatient.name;
                  const patientContextEmail = currentPatient?.email || demoPatient.email;
                  const patientContextDob = currentPatient?.dateOfBirth || (currentPatient as any)?.birthDate;
                  const patientContextAgeYears = patientContextDob ? calculateAge(patientContextDob) : null;
                  const visitTypeLabelForContext =
                    visitType === 'follow-up' ? t('workflow.visit.followupVisit') : t('workflow.visit.initialVisit');
                  const sessionOrdinalForContext =
                    visitType === 'follow-up' && followUpContext?.nextSessionOrdinalLabel
                      ? followUpContext.nextSessionOrdinalLabel
                      : getSessionOrdinalLabel((visitCount.data ?? 0) + 1);
                  const visitTypeAndOrdinalLine = `${visitTypeLabelForContext} · ${sessionOrdinalForContext}`;
                  let lastSessionDateForContext = '';
                  if (lastEncounter.loading) {
                    lastSessionDateForContext = isSpainPilot() ? 'Cargando...' : 'Loading...';
                  } else if (lastEncounter.error) {
                    lastSessionDateForContext = isSpainPilot() ? 'Error al cargar la sesión' : 'Error loading session';
                  } else if (lastEncounter.data) {
                    lastSessionDateForContext =
                      formatLastSessionDate(lastEncounter.data) || (isSpainPilot() ? 'Sesión previa' : 'Previous session');
                  } else if (visitType === 'follow-up' && followUpContext?.historyStatusLabel) {
                    lastSessionDateForContext = followUpContext.historyStatusLabel;
                  } else if (isFirstSession === false) {
                    lastSessionDateForContext = isSpainPilot() ? 'Historial clínico previo disponible' : 'Previous clinical history available';
                  } else {
                    lastSessionDateForContext = isSpainPilot() ? 'Sesión 1' : 'Session 1';
                  }
                  const baselineAssessmentRaw = followUpClinicalState?.baselineSOAP?.assessment ?? '';
                  const baselineAssessmentTrimmed = baselineAssessmentRaw.trim();
                  const hasBriefingAssessmentColumn = baselineAssessmentTrimmed.length > 0;
                  const hasBriefingHepColumn = homeProgramItems.length > 0;
                  const shouldShowBriefingBodyRow =
                    showClinicalBriefing && (hasBriefingAssessmentColumn || hasBriefingHepColumn);
                  const briefingGridUsesTwoColumns =
                    hasBriefingAssessmentColumn && hasBriefingHepColumn;
                  const todayFocusRaw = previousTreatmentPlan?.nextSessionFocus ?? '';
                  const todayFocusTrimmed = todayFocusRaw.trim();
                  const shouldShowTodayFocusRow = showClinicalBriefing && todayFocusTrimmed.length > 0;
                  const shouldShowProposedInClinicReadOnlyRow =
                    showClinicalBriefing && inClinicItems.length > 0;
                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-4 pb-3 border-b border-slate-100">
                        <span className="text-base font-semibold text-slate-900 font-apple">{patientContextDisplayName}</span>
                        {patientContextAgeYears !== null ? (
                          <span className="text-sm text-slate-500 font-apple font-light">
                            {patientContextAgeYears} {isSpainPilot() ? 'años' : 'years'}
                          </span>
                        ) : null}
                        <span className="text-sm text-slate-500 font-apple font-light">{patientContextEmail}</span>
                        <span className="text-sm text-slate-500 font-apple font-light">{visitTypeAndOrdinalLine}</span>
                        <span className="text-sm text-slate-500 font-apple font-light inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                          {lastSessionDateForContext}
                          {lastEncounter.data?.soap ? (
                            <button
                              type="button"
                              onClick={() => {
                                const sidLastSoap = lastEncounter.data?.sessionId || lastEncounter.data?.id;
                                if (sidLastSoap) {
                                  window.open(`/documents?session=${sidLastSoap}`, '_blank', 'noopener,noreferrer');
                                }
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline font-apple font-light"
                            >
                              View last SOAP note →
                            </button>
                          ) : null}
                        </span>
                        {workflowConsentStatus?.hasValidConsent ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 font-apple font-light">
                            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                            Consentimiento válido (activo)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 font-apple">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            Consentimiento requerido
                          </span>
                        )}
                        {(patientClinicalInfo.allergies || patientClinicalInfo.contraindications) && (
                          <div className="w-full basis-full flex flex-wrap gap-3 pt-1 border-t border-slate-100 mt-1">
                            {patientClinicalInfo.allergies && (
                              <div className="flex items-start gap-2 min-w-[12rem] flex-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-amber-800 font-apple">Allergies</p>
                                  <p className="text-xs text-amber-700 font-apple font-light mt-0.5">
                                    {patientClinicalInfo.allergies.join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}
                            {patientClinicalInfo.contraindications && (
                              <div className="flex items-start gap-2 min-w-[12rem] flex-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-red-800 font-apple">Contraindications</p>
                                  <p className="text-xs text-red-700 font-apple font-light mt-0.5">
                                    {patientClinicalInfo.contraindications.slice(0, 2).join('; ')}
                                    {patientClinicalInfo.contraindications.length > 2 &&
                                      ` (+${patientClinicalInfo.contraindications.length - 2} more)`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {shouldShowBriefingBodyRow ? (
                        <div
                          className={
                            briefingGridUsesTwoColumns
                              ? 'grid grid-cols-2 gap-0 divide-x divide-slate-100'
                              : 'grid grid-cols-1 gap-0'
                          }
                        >
                          {hasBriefingAssessmentColumn ? (
                            <div className="px-5 py-4">
                              <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-semibold mb-2">
                                {t('workflow.visit.briefingLastAssessment')}
                              </p>
                              <p className="text-sm text-slate-700 font-apple font-light leading-relaxed whitespace-pre-wrap">
                                {baselineAssessmentTrimmed}
                              </p>
                            </div>
                          ) : null}
                          {hasBriefingHepColumn ? (
                            <div className="px-5 py-4">
                              <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-semibold mb-2">
                                {t('workflow.visit.briefingHepColumnHeader')}
                              </p>
                              <ul className="space-y-2">
                                {homeProgramItems.map((item) => {
                                  const hepCheckboxId = `patient-context-hep-${item.id}`;
                                  return (
                                    <li key={item.id} className="flex items-start gap-3">
                                      <input
                                        id={hepCheckboxId}
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={() => {
                                          const toggledHepItems = homeProgramItems.map((h) =>
                                            h.id === item.id ? { ...h, completed: !h.completed } : h,
                                          );
                                          updateHomeProgramItems(toggledHepItems);
                                        }}
                                        className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 shrink-0"
                                      />
                                      <label
                                        htmlFor={hepCheckboxId}
                                        className="text-sm text-slate-800 font-apple font-light cursor-pointer flex-1"
                                      >
                                        <span className="font-medium text-slate-900">{item.label}</span>
                                      </label>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {shouldShowProposedInClinicReadOnlyRow ? (
                        <div className="px-5 py-4 border-t border-slate-100">
                          <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-semibold mb-2">
                            {t('workflow.visit.proposedTreatmentToday')}
                          </p>
                          <ul className="space-y-1">
                            {inClinicItems.map((proposedInClinicItem) => (
                              <li
                                key={proposedInClinicItem.id}
                                className="text-sm text-slate-700 font-apple font-light"
                              >
                                {proposedInClinicItem.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {shouldShowTodayFocusRow ? (
                        <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                          <p className="text-sm font-semibold text-blue-800 font-apple">
                            {t('workflow.visit.briefingFocusPrefix')}: {todayFocusTrimmed}
                          </p>
                        </div>
                      ) : null}
                      {previousTreatmentPlan ? (
                        <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-slate-600 font-apple font-light">
                            {t('workflow.visit.previousPlanLoaded')}
                          </span>
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>

              {visitType === 'follow-up' && (
                <div className="bg-white border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-2xl">🎙️</span>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-900 mb-1">
                        {t('workflow.visit.howPatientArrivesToday')}
                      </h2>
                      <p className="text-sm text-slate-600">
                        {t('workflow.visit.howPatientArrivesDesc')}
                      </p>
                    </div>
                  </div>
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
                    hideAnalyzeButton={true}
                  />
                </div>
              )}

              {/* WO-FU-PLAN-SPLIT-01: Bloque 1 — In-Clinic + HEP; FOLLOW-UP ONLY (visitType === 'follow-up'); initial assessment no muestra este bloque */}
              {visitType === 'follow-up' && inClinicItems.length > 0 && (
                <>
                  {inClinicItems.length > 0 && (() => {
                    const allInClinicDone = inClinicItems.every((i) => i.completed);
                    return (
                      <div className="bg-white border border-blue-200 rounded-lg p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="text-2xl">🗓️</span>
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900 mb-1">
                              {t('workflow.followupSurface.inClinicTitle')}
                            </h2>
                            <p className="text-sm text-slate-600">
                              {t('workflow.followupSurface.inClinicSubtitle')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setInClinicItems((prev) =>
                                  prev.map((i) => ({ ...i, completed: !allInClinicDone }))
                                )
                              }
                              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors"
                              title={allInClinicDone ? t('shell.professionalWorkflow.unmarkAll') : t('shell.professionalWorkflow.markAllDone')}
                            >
                              <input
                                type="checkbox"
                                checked={allInClinicDone}
                                readOnly
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span>{t('shell.professionalWorkflow.allDoneLabel')}</span>
                            </button>
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>{t('shell.professionalWorkflow.todayTreatmentConfirmed')}</span>
                            </div>
                          </div>
                        </div>
                        <SuggestedFocusEditor
                          items={inClinicItems}
                          onChange={setInClinicItems}
                          onFinishSession={undefined}
                          hideHeader={true}
                          allowAdd={true}
                        />
                      </div>
                    );
                  })()}
                </>
              )}

              {/* Bloque 2: Clinical notes / Follow-up clinical update */}
              <div className="bg-white border border-blue-200 rounded-lg p-6">
                {/* WO-06.1: Micro-copy de continuidad (solo follow-up) */}
                {visitType === 'follow-up' && (
                  <p className="text-xs text-slate-500 mb-3 font-apple font-light">
                    {t('workflow.visit.followupContextHint')}
                  </p>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">{visitType === 'follow-up' ? '📝' : '🎙️'}</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      {visitType === 'follow-up' ? t('workflow.visit.followupClinicalUpdate') : t('workflow.visit.clinicalNotes')}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {visitType === 'follow-up'
                        ? t('workflow.visit.followupNotesDesc')
                        : t('workflow.visit.initialNotesDesc')}
                    </p>
                  </div>
                  {transcript?.trim() && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{visitType === 'follow-up' ? t('workflow.visit.clinicalUpdateCaptured') : t('workflow.visit.clinicalNotesCaptured')}</span>
                    </div>
                  )}
                </div>
                  {hasRestoredFromAutoSave && (
                    <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900">
                      {restoredFromInterrupted
                        ? 'Sesión reanudada. El nuevo audio se añadirá al transcript anterior.'
                        : 'Session restored from auto-save.'}
                    </div>
                  )}
                  {isRestoringTranscript && (
                    <div className="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Cargando transcript anterior…
                    </div>
                  )}
                  <Suspense fallback={<LoadingSpinner />}>
                  <AnalysisTab
                    currentPatient={currentPatient}
                    patientIdFromUrl={patientIdFromUrl}
                    patientClinicalInfo={patientClinicalInfo}
                    calculateAge={calculateAge}
                    consentStatus={consentStatus}
                    consentPending={consentPending}
                    consentToken={consentToken}
                    consentLink={consentLink}
                    smsError={smsError}
                    user={user}
                    setConsentStatus={setConsentStatus}
                    setPatientHasConsent={setPatientHasConsent}
                    setConsentPending={setConsentPending}
                    setSmsError={setSmsError}
                    handleCopyConsentLink={handleCopyConsentLink}
                    handleResendConsentSMS={handleResendConsentSMS}
                    lastEncounter={lastEncounter}
                    isFirstSession={isFirstSession}
                    formatLastSessionDate={formatLastSessionDate}
                    visitType={visitType}
                    visitCount={visitCount}
                    sessionTypeConfig={sessionTypeConfig}
                    previousTreatmentPlan={previousTreatmentPlan}
                    setIsInitialPlanModalOpen={setIsInitialPlanModalOpen}
                    physioNotes={physioNotes}
                    setPhysioNotes={setPhysioNotes}
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
                    isGeneratingSOAP={isGeneratingSOAP}
                    audioStream={audioStream}
                    handleAnalyzeWithVertex={handleAnalyzeWithVertex}
                    attachments={attachments}
                    isUploadingAttachment={isUploadingAttachment}
                    attachmentError={attachmentError}
                    removingAttachmentId={removingAttachmentId}
                    handleAttachmentUpload={handleAttachmentUpload}
                    handleAttachmentRemove={handleAttachmentRemove}
                    handleAttachmentReviewedToggle={handleAttachmentReviewedToggle}
                    niagaraResults={niagaraResults}
                    interactiveResults={interactiveResults}
                    onEditedResultsChange={setEditedAnalysisResults}
                    selectedEntityIds={selectedEntityIds}
                    setSelectedEntityIds={setSelectedEntityIds}
                    continueToEvaluation={continueToEvaluation}
                    analysisError={analysisError}
                    successMessage={successMessage}
                    setAnalysisError={setAnalysisErrorWithRecovery}
                    setSuccessMessage={setSuccessMessage}
                    onTodayFocusChange={setTodayFocus}
                    onFinishSession={undefined}
                    hideHeader={true}
                    hideTranscriptArea={visitType === 'follow-up'}
                    followUpHasContent={
                      visitType === 'follow-up'
                        ? Boolean(transcript?.trim() || inClinicItems.length > 0 || homeProgramItems.length > 0)
                        : undefined
                    }
                    todayFocusBlockRenderedByParent={visitType === 'follow-up'}
                    resumeLoadFailed={resumeLoadFailed}
                    selectedRedFlagIds={selectedRedFlagIds}
                    onRedFlagSelectionChange={setSelectedRedFlagIds}
                    redFlagDecisions={redFlagDecisions}
                    onRedFlagDecisionChange={setRedFlagDecisions}
                    onConfirmFollowUpRedFlags={() => {
                      const hasReferralStop = Object.values(redFlagDecisions).some((d) => d.decision === 'referral_stop');
                      if (hasReferralStop) {
                        handleOpenReferralReport();
                      } else {
                        setActiveTab('soap');
                        setTimeout(() => document.querySelector('[data-section="soap"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                      }
                    }}
                    onGenerateReferralReport={handleOpenReferralReport}
                  />
                </Suspense>
              </div>

              {/* WO-REDFLAG-FOLLOWUP: Hide Documentation (SOAP) section until red-flag decisions are done; avoids SOAPTab mounting with red flags pending */}
              {(!(followUpAlerts?.red_flags?.length) || followUpDecisionResolved) && (
              <div className="bg-white border border-blue-200 rounded-lg p-6" data-section="soap">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">📝</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      {t('workflow.followupSurface.documentationTitle')}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {t('workflow.followupSurface.documentationSubtitle')}
                    </p>
                  </div>
                  {localSoapNote && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('workflow.followupSurface.soapGenerated')}</span>
                    </div>
                  )}
                </div>
                {/* Patient Clinical Memory: pattern insight (observation only; not part of the medical record) */}
                {visitType === 'follow-up' && followUpPatternInsight && (
                  <div className="mb-6 rounded-lg border border-slate-200 bg-sky-50/50 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">
                      {t('workflow.followupSurface.patternInsightTitle')}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">{t('workflow.followupSurface.notPartOfMedicalRecord')}</p>
                    <p className="text-sm text-slate-700">{followUpPatternInsight.description}</p>
                  </div>
                )}
                {/* Hidden from UI - internal AI scaffolding, not for clinician view */}
                {false && visitType === 'follow-up' && followUpConsiderations && followUpConsiderations.length > 0 && (
                  <div className="mb-6 rounded-lg border border-slate-200 bg-amber-50/50 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">
                      {t('workflow.followupSurface.clinicalConsiderationsTitle')}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">{t('workflow.followupSurface.notPartOfMedicalRecord')}</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 mb-3">
                      {followUpConsiderations.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        const block = '\n\n[AI considerations reviewed]\n' + followUpConsiderations.map((c) => `- ${c}`).join('\n');
                        setLocalSoapNote((prev) => {
                          if (!prev) return prev;
                          const current = (prev.plan || '').trim();
                          return { ...prev, plan: current + block };
                        });
                        setFollowUpConsiderations(null);
                      }}
                      className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                    >
                      {t('workflow.followupSurface.insertIntoPlan')}
                    </button>
                  </div>
                )}
                <Suspense fallback={<LoadingSpinner />}>
                  <SOAPTab
                    localSoapNote={localSoapNote}
                    soapStatus={soapStatus}
                    visitType={visitType}
                    isGeneratingSOAP={isGeneratingSOAP}
                    patientId={patientId}
                    sessionId={sessionId}
                    handleGenerateSoap={visitType === 'follow-up' ? handleGenerateSOAPFollowUp : handleGenerateSoap}
                    handleSaveSOAP={handleSaveSOAP}
                    handleRegenerateSOAP={handleRegenerateSOAP}
                    handleFinalizeSOAP={handleFinalizeSOAP}
                    handleUnfinalizeSOAP={handleUnfinalizeSOAP}
                    setIsShareMenuOpen={setIsShareMenuOpen}
                    skipPlanValidation={Object.values(redFlagDecisions).some(d => d.decision === 'referral_stop')}
                    workflowMetrics={workflowMetrics}
                    workflowRoute={workflowRoute}
                    soapTokenOptimization={soapTokenOptimization}
                    niagaraResults={visitType === 'follow-up' ? null : niagaraResults}
                    transcript={transcript}
                    physicalExamResults={physicalExamResults}
                    treatmentReminder={treatmentReminder}
                    analysisError={analysisError}
                    successMessage={successMessage}
                    setAnalysisError={setAnalysisError}
                    setSuccessMessage={setSuccessMessage}
                    setVisitType={setVisitType}
                    // ✅ FOLLOW-UP WORKFLOW: Transcript input props for follow-up visits
                    recordingTime={recordingTime}
                    isRecording={isRecording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
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
                    onCloseInitialAssessment={undefined}
                    onBackToCommandCenter={() => {
                      if (sessionId) {
                        sessionService.updateSession(sessionId, { status: 'interrupted' }).catch(() => {});
                      }
                      navigate('/command-center');
                    }}
                    patientEmail={currentPatient?.email}
                    patientFirstName={currentPatient?.firstName || (currentPatient as any)?.personalInfo?.firstName || ''}
                    professionalName={clinicianDisplayName || ''}
                    professionalTitle={professionalProfile?.profession || 'Fisioterapeuta'}
                    patientName={currentPatient?.fullName ?? `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim()}
                    redFlagDecisions={redFlagDecisions}
                  />
                </Suspense>
                {isSpainPilotActive && localSoapNote && soapStatus === 'finalized' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCertificateEsModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      Certificado
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* WO-07: Botón sticky ELIMINADO en follow-up - fuerza a llegar al final y rellenar datos mínimos */}
              {visitType !== 'follow-up' && (
                (() => {
                  const hasClinicalNotes = transcript?.trim().length > 0;
                  const analysisDone = niagaraResults !== null;
                  const soapGenerated = localSoapNote !== null;

                  let buttonAction: () => void;
                  let buttonLabel: string;
                  let buttonDisabled = false;
                  let buttonIsLoading = false;

                  if (!hasClinicalNotes) {
                    buttonAction = () => {
                      // Focus en el área de transcript
                      document.querySelector('textarea')?.focus();
                    };
                    buttonLabel = "Add clinical notes";
                  } else if (!analysisDone) {
                    buttonAction = handleAnalyzeWithVertex;
                    buttonLabel = "Analyze clinical notes";
                    buttonDisabled = isProcessing;
                  } else if (!soapGenerated) {
                    buttonAction = handleGenerateSoapFromEvaluation;
                    buttonLabel = "Generate SOAP note";
                    buttonDisabled = isGeneratingSOAP;
                    buttonIsLoading = isGeneratingSOAP;
                  } else {
                    buttonAction = () => {
                      // Scroll a SOAP section
                      document.querySelector('[data-section="soap"]')?.scrollIntoView({ behavior: 'smooth' });
                    };
                    buttonLabel = "Review & export SOAP";
                  }

                  return (
                    <div className="sticky bottom-0 bg-white border-t border-blue-200 p-4 mt-6 shadow-lg z-10">
                      <button
                        onClick={buttonAction}
                        disabled={buttonDisabled}
                        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${buttonDisabled
                          ? 'bg-blue-300 text-blue-100 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                      >
                        {buttonIsLoading ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating SOAP note...</span>
                          </span>
                        ) : (
                          buttonDisabled ? 'Processing...' : buttonLabel
                        )}
                      </button>
                    </div>
                  );
                })()
              )}
            </div>
          )
        ) : (
          <>
            <nav className="flex flex-wrap gap-2">
              {[
                { id: "analysis", label: `1 · ${t('workflow.initialAnalysis')}` },
                { id: "evaluation", label: `2 · ${t('workflow.physicalEvaluation')}` },
                { id: "soap", label: `3 · ${t('workflow.soapReport')}` },
              ]
                .filter((tab) => {
                  // WO-REDFLAG-FOLLOWUP: Show analysis tab in follow-up when red flags need clinical decision (niagara or followUpAlerts)
                  const isFollowUpWorkflow = sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up';
                  const hasRedFlags = (niagaraResults?.red_flags?.length ?? 0) > 0 || (followUpAlerts?.red_flags?.length ?? 0) > 0;
                  if (isFollowUpWorkflow && tab.id === 'analysis' && !hasRedFlags) {
                    return false;
                  }

                  if (workflowRoute) {
                    return !shouldSkipTab(workflowRoute, tab.id);
                  }
                  return true; // Show all tabs if no route detected yet
                })
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`rounded-full px-4 py-2 text-sm transition ${effectiveActiveTab === tab.id
                      ? "bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow font-apple"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
            </nav>

            {/* WO-REDFLAG-FOLLOWUP: Always mount AnalysisTab when analysis tab is active; internal logic handles red-flag display. */}
            {effectiveActiveTab === "analysis" && (
              <Suspense fallback={<LoadingSpinner />}>
                <AnalysisTab
                  key={`analysis-${(followUpAlerts?.red_flags?.length ?? 0)}`}
                  currentPatient={currentPatient}
                  patientIdFromUrl={patientIdFromUrl}
                  patientClinicalInfo={patientClinicalInfo}
                  calculateAge={calculateAge}
                  consentStatus={consentStatus}
                  consentPending={consentPending}
                  consentToken={consentToken}
                  consentLink={consentLink}
                  smsError={smsError}
                  user={user}
                  setConsentStatus={setConsentStatus}
                  setPatientHasConsent={setPatientHasConsent}
                  setConsentPending={setConsentPending}
                  setSmsError={setSmsError}
                  handleCopyConsentLink={handleCopyConsentLink}
                  handleResendConsentSMS={handleResendConsentSMS}
                  lastEncounter={lastEncounter}
                  isFirstSession={isFirstSession}
                  formatLastSessionDate={formatLastSessionDate}
                  visitType={visitType}
                  visitCount={visitCount}
                  sessionTypeConfig={sessionTypeConfig}
                  previousTreatmentPlan={previousTreatmentPlan}
                  setIsInitialPlanModalOpen={setIsInitialPlanModalOpen}
                  physioNotes={physioNotes}
                  setPhysioNotes={setPhysioNotes}
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
                  handleAttachmentReviewedToggle={handleAttachmentReviewedToggle}
                  niagaraResults={niagaraResults}
                  interactiveResults={interactiveResults}
                  onEditedResultsChange={setEditedAnalysisResults}
                  selectedEntityIds={selectedEntityIds}
                  setSelectedEntityIds={setSelectedEntityIds}
                  continueToEvaluation={continueToEvaluation}
                  analysisError={analysisError}
                  successMessage={successMessage}
                  setAnalysisError={setAnalysisErrorWithRecovery}
                  setSuccessMessage={setSuccessMessage}
                  onTodayFocusChange={setTodayFocus}
                  onFinishSession={undefined}
                  hideHeader={false}
                  hideTranscriptArea={currentSessionType === 'followup'}
                  followUpHasContent={currentSessionType === 'followup' ? Boolean(transcript?.trim() || inClinicItems.length > 0 || homeProgramItems.length > 0) : undefined}
                  resumeLoadFailed={resumeLoadFailed}
                  selectedRedFlagIds={selectedRedFlagIds}
                  onRedFlagSelectionChange={setSelectedRedFlagIds}
                  redFlagDecisions={redFlagDecisions}
                  onRedFlagDecisionChange={setRedFlagDecisions}
                  onConfirmFollowUpRedFlags={() => {
                    const hasReferralStop = Object.values(redFlagDecisions).some((d) => d.decision === 'referral_stop');
                    if (hasReferralStop) {
                      handleOpenReferralReport();
                    } else {
                      setActiveTab('soap');
                      setTimeout(() => document.querySelector('[data-section="soap"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    }
                  }}
                  onGenerateReferralReport={handleOpenReferralReport}
                />
              </Suspense>
            )}
            {effectiveActiveTab === "evaluation" && (
              <Suspense fallback={<LoadingSpinner />}>
                <EvaluationTab
                  visitType={visitType}
                  filteredEvaluationTests={filteredEvaluationTests}
                  evaluationTests={evaluationTests}
                  completedCount={completedCount}
                  detectedCaseRegion={detectedCaseRegion}
                  pendingAiSuggestions={pendingAiSuggestions}
                  allAiSuggestions={aiSuggestions}
                  isTestAlreadySelected={isTestAlreadySelected}
                  addEvaluationTest={addEvaluationTest}
                  removeEvaluationTest={removeEvaluationTest}
                  updateEvaluationTest={updateEvaluationTest}
                  createEntryFromLibrary={createEntryFromLibrary}
                  createCustomEntry={createCustomEntry}
                  customTestName={customTestName}
                  customTestRegion={customTestRegion}
                  customTestResult={customTestResult}
                  customTestNotes={customTestNotes}
                  isCustomFormOpen={isCustomFormOpen}
                  setCustomTestName={setCustomTestName}
                  setCustomTestRegion={setCustomTestRegion}
                  setCustomTestResult={setCustomTestResult}
                  setCustomTestNotes={setCustomTestNotes}
                  setIsCustomFormOpen={setIsCustomFormOpen}
                  resetCustomForm={resetCustomForm}
                  handleAddCustomTest={handleAddCustomTest}
                  handleLibrarySelect={handleLibrarySelect}
                  isGeneratingSOAP={isGeneratingSOAP}
                  handleGenerateSoap={handleGenerateSoapFromEvaluation}
                  sessionTypeFromUrl={sessionTypeFromUrl}
                  workflowRoute={workflowRoute}
                />
              </Suspense>
            )}
            {effectiveActiveTab === "soap" && (
              <>
                <Suspense fallback={<LoadingSpinner />}>
                  <SOAPTab
                    localSoapNote={localSoapNote}
                    soapStatus={soapStatus}
                    visitType={visitType}
                    isGeneratingSOAP={isGeneratingSOAP}
                    patientId={patientId}
                    sessionId={sessionId}
                    handleGenerateSoap={currentSessionType === 'followup' ? handleGenerateSOAPFollowUp : handleGenerateSoap}
                    handleSaveSOAP={handleSaveSOAP}
                    handleRegenerateSOAP={handleRegenerateSOAP}
                    handleFinalizeSOAP={handleFinalizeSOAP}
                    handleUnfinalizeSOAP={handleUnfinalizeSOAP}
                    setIsShareMenuOpen={setIsShareMenuOpen}
                    skipPlanValidation={Object.values(redFlagDecisions).some(d => d.decision === 'referral_stop')}
                    workflowMetrics={workflowMetrics}
                    workflowRoute={workflowRoute}
                    soapTokenOptimization={soapTokenOptimization}
                    niagaraResults={niagaraResults}
                    transcript={transcript}
                    physicalExamResults={physicalExamResults}
                    treatmentReminder={treatmentReminder}
                    analysisError={analysisError}
                    successMessage={successMessage}
                    setAnalysisError={setAnalysisError}
                    setSuccessMessage={setSuccessMessage}
                    setVisitType={setVisitType}
                    onBackToCommandCenter={() => {
                      if (sessionId) {
                        sessionService.updateSession(sessionId, { status: 'interrupted' }).catch(() => {});
                      }
                      navigate('/command-center');
                    }}
                    patientEmail={currentPatient?.email}
                    patientFirstName={currentPatient?.firstName || (currentPatient as any)?.personalInfo?.firstName || ''}
                    professionalName={clinicianDisplayName || ''}
                    professionalTitle={professionalProfile?.profession || 'Fisioterapeuta'}
                    patientName={currentPatient?.fullName ?? `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim()}
                    redFlagDecisions={redFlagDecisions}
                  />
                </Suspense>
                {isSpainPilotActive && localSoapNote && soapStatus === 'finalized' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsCertificateEsModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <FileText className="h-4 w-4" />
                      Certificado
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Feedback Widget - Always visible for beta testing */}
      <FeedbackWidget />

      <ReferralReportModal
        isOpen={referralReportOpen}
        onClose={() => setReferralReportOpen(false)}
        reportData={referralReportData}
      />

      {/* Initial Plan Modal for existing patients without initial assessment */}
      {currentPatient && (
        <InitialPlanModal
          isOpen={isInitialPlanModalOpen}
          onClose={() => setIsInitialPlanModalOpen(false)}
          patientId={patientIdFromUrl || demoPatient.id}
          patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name}
          onPlanCreated={handlePlanCreated}
        />
      )}

      {/* ✅ WO-CONSENT-VERBAL-01: Verbal Consent Modal - Gate for clinical workflow */}
      {/* ✅ WO-CONSENT-SINGLE-SOURCE-01: Solo mostrar si dominio dice que no hay consentimiento válido */}
      {(() => {
        if (!currentPatient || !user?.uid || !workflowConsentStatus) return false;
        const jurisdiction = getCurrentJurisdiction();
        const isFirstSession = visitType === 'initial';
        const currentResolution = resolveConsentChannel({
          hasValidConsent: workflowConsentStatus.hasValidConsent,
          jurisdiction,
          isFirstSession,
        });
        return currentResolution.channel !== 'none';
      })() && (
          <VerbalConsentModal
            isOpen={showVerbalConsentModal}
            onClose={() => {
              // Don't allow closing if workflow is blocked
              if (workflowBlocked) {
                return; // Modal must stay open until consent is obtained
              }
              setShowVerbalConsentModal(false);
            }}
            patientId={patientIdFromUrl || demoPatient.id}
            patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name}
            physiotherapistId={user.uid}
            physiotherapistName={clinicianDisplayName}
            onConsentObtained={async (consentId) => {
              console.log('[WORKFLOW] ✅ Verbal consent obtained:', {
                hasConsentId: Boolean(consentId),
              });
              handleConsentGrantedImmediate();
              setWorkflowBlocked(false);
              setShowVerbalConsentModal(false);
              setConsentCheckComplete(false); // Reset to re-check
              setSuccessMessage(t('workflow.consentObtainedProceed'));
            }}
            onConsentDenied={() => {
              console.log('[WORKFLOW] ❌ Consent denied by patient');
              setAnalysisError(t('workflow.consentRequiredProceed'));
            }}
          />
        )}

      {/* ✅ WORKFLOW OPTIMIZATION: Workflow Feedback - Show after finalization */}
      {showWorkflowFeedback && workflowRoute && user?.uid && (
        <div className="fixed bottom-4 right-4 max-w-md z-50">
          <WorkflowFeedback
            sessionId={sessionId || `${user.uid}-${sessionStartTime.getTime()}`}
            patientId={patientIdFromUrl || demoPatient.id}
            userId={user.uid}
            workflowType={workflowRoute.type === 'follow-up' ? 'follow-up' : 'initial'}
            detectionConfidence={workflowRoute.auditLog.detectionResult.confidence}
            onClose={() => setShowWorkflowFeedback(false)}
          />
        </div>
      )}

      <CertificateEsModal
        isOpen={isSpainPilotActive && isCertificateEsModalOpen && Boolean(localSoapNote) && soapStatus === 'finalized'}
        onClose={() => setIsCertificateEsModalOpen(false)}
        soapAssessment={localSoapNote?.assessment || ''}
        professional={{
          nombre: certificateProfessionalName,
          numeroColegiado: certificateProfessionalLicense,
          especialidad: certificateProfessionalSpecialty,
        }}
        patient={{
          nombre: certificatePatientName,
          fechaNacimiento: certificatePatientBirthDate,
        }}
        defaultClinicName={certificateClinicName}
      />

      {/* Universal Share Menu - Available after SOAP is finalized */}
      {localSoapNote && soapStatus === 'finalized' && user?.uid && (
        <UniversalShareMenu
          isOpen={isShareMenuOpen}
          onClose={() => setIsShareMenuOpen(false)}
          shareOptions={{
            noteContent: [
              isSpainPilotActive ? "SUBJETIVO:" : "Subjective:",
              localSoapNote.subjective || "Not documented.",
              "",
              isSpainPilotActive ? "OBJETIVO:" : "Objective:",
              localSoapNote.objective || "Not documented.",
              "",
              isSpainPilotActive ? "VALORACIÓN:" : "Assessment:",
              localSoapNote.assessment || "Pending clinician review.",
              "",
              isSpainPilotActive ? "PLAN:" : "Plan:",
              localSoapNote.plan || "To be defined with patient.",
            ].join("\n"),
            noteId: sessionId,
            physiotherapistId: user.uid,
            clinicianId: user.uid, // Alias for compatibility
            patientId: patientIdFromUrl || demoPatient.id,
            sessionId: sessionId,
            noteType: 'soap',
          }}
          onShareComplete={(result) => {
            console.log('[Workflow] Share completed:', {
              success: result.success,
              method: result.method,
              hasData: Boolean(result.data),
            });
            if (result.success) {
              setSuccessMessage(
                result.method === 'portal'
                  ? `Secure portal created! Code: ${result.data?.code}. Share the URL with hospital staff.`
                  : result.method === 'clipboard'
                    ? 'Note copied to clipboard. Will auto-clear in 60 seconds.'
                    : 'Note shared successfully.'
              );
            }
          }}
        />
      )}
    </div>
  );
}

export default ProfessionalWorkflowPage;
