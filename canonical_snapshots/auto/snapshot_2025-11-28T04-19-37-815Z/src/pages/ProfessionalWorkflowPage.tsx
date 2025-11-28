// @ts-nocheck
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Play, Square, Mic, Loader2, CheckCircle, Download, Copy, Brain, Stethoscope, ClipboardList, ChevronsRight, AlertCircle, UploadCloud, Paperclip, X, FileText, Users, Plus, Info } from "lucide-react";
import type { WhisperSupportedLanguage } from "../services/OpenAIWhisperService";
import { useSharedWorkflowState } from "../hooks/useSharedWorkflowState";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import sessionService from "../services/sessionService";
import { useAuth } from "../hooks/useAuth";
import { useProfessionalProfile as useProfessionalProfileContext } from "../context/ProfessionalProfileContext";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { SOAPNote } from "../types/vertex-ai";
import { ClinicalAnalysisResults } from "../components/ClinicalAnalysisResults";
import ClinicalAttachmentService, { ClinicalAttachment } from "../services/clinicalAttachmentService";
import { matchTestName } from "@/core/msk-tests/matching/fuzzyMatch";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";
import { buildSOAPContext, detectVisitType, validateSOAPContext, type VisitType } from "../core/soap/SOAPContextBuilder";
import { generateSOAPNote as generateSOAPNoteFromService } from "../services/vertex-ai-soap-service";
import { buildPhysicalExamResults, buildPhysicalEvaluationSummary } from "../core/soap/PhysicalExamResultBuilder";
import { organizeSOAPData, validateUnifiedData, createDataSummary, type UnifiedClinicalData } from "../core/soap/SOAPDataOrganizer";
import { AnalyticsService } from "../services/analyticsService";
import type { ValueMetricsEvent } from "../services/analyticsService";
import { PatientConsentService } from "../services/patientConsentService";
import { SMSService } from "../services/smsService";
import { ConsentVerificationService } from "../services/consentVerificationService";
import { PatientService, type Patient } from "../services/patientService";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { FeedbackWidget } from "../components/feedback/FeedbackWidget";
import { FeedbackService } from "../services/feedbackService";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { SuccessMessage } from "../components/ui/SuccessMessage";
import { LoadingSpinner, InlineLoading } from "../components/ui/LoadingSpinner";
import { InitialPlanModal } from "../components/treatment-plan/InitialPlanModal";
import UniversalShareMenu, { ShareOptions } from "../components/share/UniversalShareMenu";
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
import { deriveClinicName, deriveClinicianDisplayName } from "@/utils/clinicProfile";
import { AudioWaveform } from "../components/AudioWaveform";
import { SessionComparison } from "../components/SessionComparison";
import type { Session } from "../services/sessionComparisonService";
import { Timestamp } from "firebase/firestore";
import { useLastEncounter } from "../features/patient-dashboard/hooks/useLastEncounter";
import { useActiveEpisode } from "../features/patient-dashboard/hooks/useActiveEpisode";
import { usePatientVisitCount } from "../features/patient-dashboard/hooks/usePatientVisitCount";
import { SessionTypeService } from "../services/sessionTypeService";
import { getPublicBaseUrl } from "../utils/urlHelpers";
import { SessionStorage } from "../services/session-storage";
import WorkflowSelector, { type WorkflowSelectorProps } from "../components/workflow/WorkflowSelector";
import { routeWorkflow, shouldSkipTab, getInitialTab, type WorkflowRoute } from "../services/workflowRouterService";
import type { FollowUpDetectionInput } from "../services/followUpDetectionService";
import { 
  trackWorkflowSessionStart, 
  trackSOAPGeneration, 
  trackUserClick, 
  trackWorkflowSessionEnd,
  getWorkflowEfficiencySummary,
  type WorkflowMetrics 
} from "../services/workflowMetricsService";
import WorkflowFeedback from "../components/workflow/WorkflowFeedback";
import WorkflowMetricsDisplay from "../components/workflow/WorkflowMetricsDisplay";
import TranscriptArea from "../components/workflow/TranscriptArea";
import { lazy, Suspense } from "react";

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
  // 🚨 EMERGENCY DEBUG - MUST APPEAR FIRST
  console.log('🚨 [EMERGENCY DEBUG] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
  console.log('🚨 [EMERGENCY DEBUG] URL params:', typeof window !== 'undefined' ? window.location.search : 'N/A');
  
  if (typeof window !== 'undefined' && window.location.search.includes('type=followup')) {
    console.log('✅ [EMERGENCY DEBUG] FOLLOW-UP DETECTED IN URL');
  } else {
    console.log('❌ [EMERGENCY DEBUG] NO FOLLOW-UP IN URL');
  }
  
  // ✅ STEP 1: URL Parameter Verification - IMMEDIATE DEBUG LOGGING
  console.log('🔍 [DEBUG] Component starting...');
  console.log('🔍 [DEBUG] Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A (SSR)');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ DIFFERENT APPROACH: Get URL params and clear localStorage IMMEDIATELY before any state
  const patientIdFromUrl = searchParams.get('patientId');
  const sessionTypeFromUrl = searchParams.get('type') as 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate' | null;
  
  // ✅ STEP 1: Debug URL parameters
  console.log('🔍 [DEBUG] searchParams entries:', Array.from(searchParams.entries()));
  console.log('🔍 [DEBUG] sessionTypeFromUrl:', sessionTypeFromUrl);
  console.log('🔍 [DEBUG] patientIdFromUrl:', patientIdFromUrl);
  
  const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
  console.log('🔍 [DEBUG] isExplicitFollowUp:', isExplicitFollowUp);
  
  // ✅ STEP 2: localStorage Clear Debug - BEFORE/AFTER LOGGING
  console.log('🔍 [DEBUG] About to check localStorage clear conditions...');
  console.log('🔍 [DEBUG] isExplicitFollowUp:', isExplicitFollowUp);
  console.log('🔍 [DEBUG] patientIdFromUrl:', patientIdFromUrl);
  console.log('🔍 [DEBUG] window exists:', typeof window !== 'undefined');
  
  // ✅ AGGRESSIVE EARLY CLEAR: Clear localStorage BEFORE any useState if follow-up
  if (isExplicitFollowUp && patientIdFromUrl && typeof window !== 'undefined') {
    try {
      const storageKey = `aidux_${patientIdFromUrl}`;
      console.log('🗑️ [DEBUG] CLEARING localStorage key:', storageKey);
      console.log('🗑️ [DEBUG] localStorage BEFORE clear:', localStorage.getItem(storageKey));
      
      localStorage.removeItem(storageKey);
      
      console.log('🗑️ [DEBUG] localStorage AFTER clear:', localStorage.getItem(storageKey));
      console.log('✅ [WORKFLOW] 🗑️ EARLY CLEAR: Removing localStorage for follow-up visit');
    } catch (e) {
      console.warn('[WORKFLOW] Error clearing localStorage:', e);
    }
  } else {
    console.log('❌ [DEBUG] localStorage clear conditions NOT met:', {
      isExplicitFollowUp,
      patientIdFromUrl,
      windowExists: typeof window !== 'undefined'
    });
  }
  
  // ✅ DEBUG: Log URL parameters immediately
  console.log('[WORKFLOW] 🚀 Initializing with URL params:', {
    patientIdFromUrl,
    sessionTypeFromUrl,
    isExplicitFollowUp,
    allSearchParams: Object.fromEntries(searchParams.entries())
  });
  
  console.log('[WORKFLOW] 🎯 Explicit follow-up detected:', isExplicitFollowUp);
  
  // State for real patient data
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  
  // ✅ CRITICAL FIX: Initialize tab and visit type based on URL parameter
  const [activeTab, setActiveTab] = useState<ActiveTab>(isExplicitFollowUp ? "soap" : "analysis");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [visitType, setVisitType] = useState<VisitType>(isExplicitFollowUp ? 'follow-up' : 'initial');
  
  // ✅ WORKFLOW OPTIMIZATION: Follow-up detection and routing
  const [workflowRoute, setWorkflowRoute] = useState<WorkflowRoute | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics | null>(null);
  const [workflowDetected, setWorkflowDetected] = useState(false);
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
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  
  // ✅ Day 3: Session Comparison Integration
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSessionForComparison, setCurrentSessionForComparison] = useState<Session | null>(null);
  
  // Value Metrics Tracking - Timestamps
  const [sessionStartTime] = useState<Date>(new Date());
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<Date | null>(null);
  const [transcriptionEndTime, setTranscriptionEndTime] = useState<Date | null>(null);
  const [soapGenerationStartTime, setSoapGenerationStartTime] = useState<Date | null>(null);
  
  // Patient Consent - PHIPA s. 18 compliance (SMS-based approach)
  const [isFirstSession, setIsFirstSession] = useState<boolean | null>(null); // null = checking, true/false = result
  const [checkingFirstSession, setCheckingFirstSession] = useState(true);
  const [patientHasConsent, setPatientHasConsent] = useState<boolean | null>(null); // null = checking
  const [consentStatus, setConsentStatus] = useState<'ongoing' | 'session-only' | 'declined' | null>(null); // Current consent status
  const [consentPending, setConsentPending] = useState(false); // True if SMS sent, waiting for patient
  const [consentToken, setConsentToken] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [copyConsentFeedback, setCopyConsentFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  
  const { sharedState, updatePhysicalEvaluation } = useSharedWorkflowState();
  const { user } = useAuth(); // Must be called before useEffect that uses it
  const { profile: professionalProfile } = useProfessionalProfileContext();
  
  // ✅ DEBUG: Log professional profile data
  console.log('🔍 [DEBUG] Professional Profile:', {
    hasProfile: !!professionalProfile,
    profile: professionalProfile,
    user: user ? { email: user.email, displayName: user.displayName } : null
  });
  
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
    startRecording, 
    stopRecording,
    setTranscript,
  } = useTranscript();

  const { time: recordingTime } = useTimer(isRecording);

  const {
    processText,
    generateSOAPNote,
    runVoiceSummary,
    runVoiceClinicalInfoQuery,
    niagaraResults,
    soapNote,
    isProcessing,
  } = useNiagaraProcessor();

  const clinicName = useMemo(
    () => {
      const name = deriveClinicName(professionalProfile);
      console.log('🔍 [DEBUG] clinicName derived:', name);
      return name;
    },
    [professionalProfile]
  );

  const clinicianDisplayName = useMemo(
    () => {
      const name = deriveClinicianDisplayName(professionalProfile, user);
      console.log('🔍 [DEBUG] clinicianDisplayName derived:', name, {
        preferredSalutation: professionalProfile?.preferredSalutation,
        lastNamePreferred: professionalProfile?.lastNamePreferred,
        fullName: professionalProfile?.fullName,
        displayName: professionalProfile?.displayName,
        userDisplayName: user?.displayName,
        userEmail: user?.email
      });
      return name;
    },
    [professionalProfile, user]
  );

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

  // ✅ PILOT METRICS: Track session start (only once per session)
  // Use a stable session key based on patientId + user.uid to prevent duplicates
  const sessionTrackingKey = useMemo(() => {
    if (!patientId || !user?.uid) return null;
    return `pilot-session-${patientId}-${user.uid}`;
  }, [patientId, user?.uid]);
  const trackedSessionsRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    // Only track once per unique session key
    if (!sessionTrackingKey || !patientId || !user?.uid) return;
    if (trackedSessionsRef.current.has(sessionTrackingKey)) {
      return; // Already tracked
    }
    
    const trackSessionStart = async () => {
      try {
        // Check if user is pilot user (from registration date)
        const pilotStartDate = new Date('2024-12-19T00:00:00Z');
        const isPilotUser = new Date() >= pilotStartDate;
        
        if (isPilotUser) {
          // Mark as tracked BEFORE making the call to prevent duplicate calls
          trackedSessionsRef.current.add(sessionTrackingKey);
          
          // ✅ CRITICAL FIX: Use explicit URL parameter for visitType in tracking
          const trackingVisitType = sessionTypeFromUrl === 'followup' ? 'follow-up' : visitType;
          console.log('[WORKFLOW] 📊 Analytics tracking:', {
            sessionTypeFromUrl,
            visitType,
            trackingVisitType,
            isExplicitFollowUp: sessionTypeFromUrl === 'followup'
          });
          await AnalyticsService.trackEvent('pilot_session_started', {
            patientId,
            userId: user.uid,
            sessionStartTime: sessionStartTime.toISOString(),
            visitType: trackingVisitType,
            isPilotUser: true
          });
          console.log('✅ [PILOT METRICS] Session start tracked:', patientId, 'with visitType:', trackingVisitType);
        }
      } catch (error) {
        console.error('⚠️ [PILOT METRICS] Error tracking session start:', error);
        // Remove from tracked set on error so it can retry if needed
        trackedSessionsRef.current.delete(sessionTrackingKey);
        // Non-blocking: don't fail session if analytics fails
      }
    };

    trackSessionStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTrackingKey]); // Only depend on sessionTrackingKey - patientId, user.uid, sessionStartTime, visitType are stable or captured in closure

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
          console.log('[WORKFLOW] Patient loaded:', patient.fullName);
        } else {
          console.warn('[WORKFLOW] Patient not found:', patientIdFromUrl);
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
        // ✅ CRITICAL FIX: For follow-up, skip analysis tab and go directly to SOAP
        const initialTab = isExplicitFollowUp || route.type === 'follow-up' 
          ? 'soap' 
          : getInitialTab(route);
        
        if (['analysis', 'evaluation', 'soap'].includes(initialTab)) {
          setActiveTab(initialTab as ActiveTab);
        }

        // ✅ WORKFLOW OPTIMIZATION: Track workflow session start
        const sessionIdForMetrics = sessionId || `${user.uid}-${Date.now()}`;
        await trackWorkflowSessionStart(
          sessionIdForMetrics,
          patientId,
          user.uid,
          route.type === 'follow-up' || isExplicitFollowUp ? 'follow-up' : 'initial',
          route.skipTabs.length
        );

        console.log('[WORKFLOW] Workflow detected:', {
          routeType: route.type,
          explicitFollowUp: isExplicitFollowUp,
          sessionTypeFromUrl,
          initialTab,
          skipTabs: route.skipTabs,
        });
      } catch (error) {
        console.error('[WORKFLOW] Error detecting workflow:', error);
        // Fallback: if explicit followup, still set it
        if (sessionTypeFromUrl === 'followup') {
          setVisitType('follow-up');
          setActiveTab('soap');
        }
        setWorkflowDetected(true);
      }
    };

    detectWorkflow();
  }, [patientId, user?.uid, currentPatient, sessionTypeFromUrl]);

  // ✅ CRITICAL FIX: Auto-navigate to SOAP tab after Niagara analysis for follow-up visits
  useEffect(() => {
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;
    
    // If follow-up and Niagara analysis is complete, navigate to SOAP tab
    if (isFollowUpWorkflow && niagaraResults && activeTab !== 'soap') {
      console.log('[WORKFLOW] 🎯 Auto-navigating to SOAP tab after Niagara analysis (follow-up workflow)');
      setActiveTab('soap');
    }
  }, [niagaraResults, sessionTypeFromUrl, workflowRoute?.type, activeTab]);

  // Check consent verification before allowing workflow access
  // ✅ FIX: Make this non-blocking - don't redirect if service fails
  useEffect(() => {
    const checkConsentVerification = async () => {
      const patientId = patientIdFromUrl || demoPatient.id;
      
      try {
        // Check if consent is verified
        const isVerified = await ConsentVerificationService.isConsentVerified(patientId);
        
        if (!isVerified) {
          // Only redirect if verification explicitly returns false
          // Don't redirect on errors - allow workflow to continue
          console.log('[WORKFLOW] Consent not verified, redirecting to verification...');
          navigate(`/consent-verification/${patientId}`);
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
  }, [patientIdFromUrl, navigate]);
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTestEntry[]>(() =>
    (sharedState.physicalEvaluation?.selectedTests ?? []).map(sanitizeEvaluationEntry)
  );
  const [customTestName, setCustomTestName] = useState("");
  const [customTestRegion, setCustomTestRegion] = useState<MSKRegion | "other">("shoulder");
  const [customTestResult, setCustomTestResult] = useState<EvaluationResult | "">("");
  const [customTestNotes, setCustomTestNotes] = useState("");
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<number[]>([]);
  
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
      status: soapStatus === 'completed' ? 'completed' : 'draft',
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
  
  // ✅ WORKFLOW PERSISTENCE: Restore workflow state from localStorage on mount
  // ✅ CRITICAL FIX: URL parameters take priority over localStorage
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect - localStorage restore check starting...');
    console.log('🔍 [DEBUG] useEffect - sessionTypeFromUrl:', sessionTypeFromUrl);
    console.log('🔍 [DEBUG] useEffect - patientId:', patientId);
    console.log('🔍 [DEBUG] useEffect - patientIdFromUrl:', patientIdFromUrl);
    
    // ✅ AGGRESSIVE FIX: Clear localStorage for follow-up visits IMMEDIATELY
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    console.log('🔍 [DEBUG] useEffect - isExplicitFollowUp:', isExplicitFollowUp);
    
    if (isExplicitFollowUp && patientId) {
      console.log('[WORKFLOW] 🗑️ CLEARING localStorage for follow-up visit (useEffect)');
      console.log('🗑️ [DEBUG] useEffect - Clearing key:', `aidux_${patientId}`);
      SessionStorage.clearSession(patientId);
      // Force state to follow-up
      setVisitType('follow-up');
      setActiveTab('soap');
      console.log('✅ [DEBUG] useEffect - Early return, NO restore for follow-up');
      return; // Don't restore anything
    }

    const restoreWorkflowState = () => {
      try {
        // ✅ DEBUG: Log URL parameters
        console.log('[WORKFLOW] 🔍 Checking URL parameters:', {
          sessionTypeFromUrl,
          patientId,
          isExplicitFollowUp: sessionTypeFromUrl === 'followup'
        });

        const savedState = SessionStorage.getSession(patientId);
        console.log('🔍 [DEBUG] useEffect - savedState exists:', !!savedState);
        
        if (!savedState) {
          console.log('[WORKFLOW] No saved state found in localStorage');
          return;
        }

        // ✅ CRITICAL FIX: Don't restore if URL explicitly specifies followup
        if (isExplicitFollowUp) {
          console.log('[WORKFLOW] ⚠️ Skipping localStorage restore - explicit followup from URL');
          return;
        }
        
        console.log('⚠️ [DEBUG] useEffect - About to restore localStorage (NOT follow-up)');

        console.log('⚠️ [WORKFLOW] Restoring workflow state from localStorage:', {
          hasTranscript: !!savedState.transcript,
          hasAnalysis: !!savedState.niagaraResults,
          hasTests: !!savedState.evaluationTests,
          testCount: savedState.evaluationTests?.length || 0,
          activeTab: savedState.activeTab
        });

        // Restore transcript
        if (savedState.transcript && typeof savedState.transcript === 'string') {
          setTranscript(savedState.transcript);
          console.log('[WORKFLOW] ✅ Restored transcript:', savedState.transcript.substring(0, 50) + '...');
        }

        // Restore analysis results (niagaraResults)
        // Note: niagaraResults is managed by useNiagaraProcessor hook, so we need to check if there's a way to restore it
        // For now, we'll restore it through the sharedState if available

        // Restore evaluation tests
        if (savedState.evaluationTests && Array.isArray(savedState.evaluationTests) && savedState.evaluationTests.length > 0) {
          const sanitized = savedState.evaluationTests.map(sanitizeEvaluationEntry);
          setEvaluationTests(sanitized);
          updatePhysicalEvaluation(sanitized);
          console.log('[WORKFLOW] ✅ Restored evaluation tests:', sanitized.length);
        }

        // ✅ CRITICAL FIX: Only restore active tab if URL doesn't specify a type
        // If URL has type=followup, we already set it to 'soap' in initial state
        if (!sessionTypeFromUrl && savedState.activeTab && ['analysis', 'evaluation', 'soap'].includes(savedState.activeTab)) {
          setActiveTab(savedState.activeTab as ActiveTab);
          console.log('[WORKFLOW] ✅ Restored active tab:', savedState.activeTab);
        }

        // Restore SOAP note if exists
        if (savedState.localSoapNote) {
          setLocalSoapNote(savedState.localSoapNote);
          console.log('[WORKFLOW] ✅ Restored SOAP note');
        }

        // Restore selected entity IDs
        if (savedState.selectedEntityIds && Array.isArray(savedState.selectedEntityIds)) {
          setSelectedEntityIds(savedState.selectedEntityIds);
          console.log('[WORKFLOW] ✅ Restored selected entity IDs:', savedState.selectedEntityIds.length);
        }
      } catch (error) {
        console.error('[WORKFLOW] Error restoring workflow state:', error);
      }
    };

    // Only restore if we have a patient ID and haven't already restored
    if (patientId) {
      restoreWorkflowState();
    }
  }, [patientId, sessionTypeFromUrl]); // Only run once on mount

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
          localSoapNote: localSoapNote || null,
          soapStatus: soapStatus,
          visitType: visitType,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };

        // Create a stable key to compare states
        const stateKey = JSON.stringify({
          transcriptLength: transcript?.length || 0,
          testCount: evaluationTests.length,
          activeTab: activeTab,
          selectedEntityIdsCount: selectedEntityIds.length,
          soapStatus: soapStatus,
          visitType: visitType
        });

        // Only save if state actually changed
        if (prevStateRef.current === stateKey) {
          return; // Skip save if nothing changed
        }

        prevStateRef.current = stateKey;
        SessionStorage.saveSession(patientId, workflowState);
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
  }, [patientId, transcript, niagaraResults, evaluationTests, activeTab, selectedEntityIds, localSoapNote, soapStatus, visitType]);

  // ✅ PHASE 2: Track if we're actively adding tests to prevent useEffect from overwriting
  const isAddingTestsRef = useRef(false);
  const lastSharedStateRef = useRef<string>(''); // Track last sharedState to prevent unnecessary updates
  
  useEffect(() => {
    // ✅ PHASE 2: Skip if we're actively adding tests (to prevent overwriting)
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
      selectedTests: sharedState.physicalEvaluation?.selectedTests,
      detectedCaseRegion: detectedCaseRegion,
    });
    
    if (sharedState.physicalEvaluation?.selectedTests) {
      const sanitized = sharedState.physicalEvaluation.selectedTests.map(sanitizeEvaluationEntry);
      console.log(`[PHASE2] Sanitized tests from sharedState:`, sanitized.map(t => ({ name: t.name, id: t.id, region: t.region })));
      
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
        
        if (!hasNewTests && !isInitialLoad) {
          console.log(`[PHASE2] No new tests in sharedState and not initial load, preserving current ${currentTests.length} tests`);
          return currentTests; // Return current state unchanged
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
          console.log(`[PHASE2] Filtered tests by region (${detectedCaseRegion}):`, testsToSet.map(t => ({ name: t.name, id: t.id, region: t.region, source: t.source })));
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
  }, [sharedState.physicalEvaluation?.selectedTests, detectedCaseRegion]); // ✅ FIX: Removed evaluationTests.length to prevent infinite loop

  // Check if this is the first session and handle patient consent via SMS
  // Use ref to prevent multiple executions in React Strict Mode
  const consentCheckRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple executions
    if (consentCheckRef.current) {
      return;
    }
    
    const checkFirstSessionAndConsent = async () => {
      // Mark as executing
      consentCheckRef.current = true;
      
      try {
        setCheckingFirstSession(true);
        
        // Use real patient from URL or fallback to demo
        const patientId = patientIdFromUrl || demoPatient.id;
        const userId = user?.uid || TEMP_USER_ID;
        
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
          };
        }
        
        // Check if this is the first session
        const isFirst = await sessionService.isFirstSession(patientId, userId);
        setIsFirstSession(isFirst);
        
        // Check if patient has consent
        const hasConsent = await PatientConsentService.hasConsent(patientId);
        setPatientHasConsent(hasConsent);
        
        // Get consent status for display
        const status = await PatientConsentService.getConsentStatus(patientId);
        setConsentStatus(status);
        
        // If first session and no consent, generate token and send SMS
        if (isFirst && !hasConsent) {
          try {
            // Validate phone number format for Twilio
            const phoneNumber = patient.phone?.trim();
            if (!phoneNumber) {
              console.warn('[WORKFLOW] Patient phone not available, cannot send SMS');
              return;
            }

            setSmsError(null);
            setCopyConsentFeedback('idle');
            
            // Format phone number for Twilio (ensure E.164 format)
            let formattedPhone = phoneNumber.trim();
            
            // Remove all non-digit characters except +
            const cleanPhone = formattedPhone.replace(/[^\d+]/g, '');
            
            // Validate and format
            if (cleanPhone.startsWith('+1') && cleanPhone.length === 12) {
              // Already in E.164 format: +1XXXXXXXXXX
              formattedPhone = cleanPhone;
            } else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) {
              // North American without +: 1XXXXXXXXXX
              formattedPhone = `+${cleanPhone}`;
            } else if (cleanPhone.length === 10) {
              // North American without country code: XXXXXXXXXX
              formattedPhone = `+1${cleanPhone}`;
            } else if (cleanPhone.startsWith('+') && cleanPhone.length >= 11) {
              // Already has + and looks valid
              formattedPhone = cleanPhone;
            } else {
              // Try to fix: assume North American
              const digits = cleanPhone.replace(/\D/g, '');
              if (digits.length === 10) {
                formattedPhone = `+1${digits}`;
              } else if (digits.length === 11 && digits.startsWith('1')) {
                formattedPhone = `+${digits}`;
              } else {
                throw new Error(`Invalid phone number format: ${phoneNumber}. Expected E.164 format (e.g., +14161234567)`);
              }
            }
            
            // Final validation: must be E.164 format
            if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
              throw new Error(`Invalid phone number format: ${formattedPhone}. Must be E.164 format (e.g., +14161234567)`);
            }
            
            // Generate consent token
            const token = await PatientConsentService.generateConsentToken(
              patientId,
              patient.fullName || `${patient.firstName} ${patient.lastName}`.trim(),
              formattedPhone,
              patient.email || undefined,
              clinicName,
              userId,
              clinicianDisplayName
            );
            
            setConsentToken(token);
            
            // Send SMS with consent link
            await SMSService.sendConsentLink(
              formattedPhone,
              patient.fullName || `${patient.firstName} ${patient.lastName}`.trim(),
              clinicName,
              clinicianDisplayName,
              token
            );
            setConsentPending(true);
            console.log('[WORKFLOW] Consent SMS sent to patient:', formattedPhone);
            console.log('[WORKFLOW] ✅ SMS sent via Vonage. Check Firestore → sms_delivery_receipts for delivery status.');
          } catch (error) {
            console.error('[WORKFLOW] Error generating consent token or sending SMS:', error);
            // Don't block workflow if SMS fails
            const message = error instanceof Error ? error.message : 'Failed to send SMS consent link.';
            setSmsError(message);
            setConsentPending(false);
          }
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
  }, [user?.uid, patientIdFromUrl, currentPatient]); // Re-check if user or patient changes

  const persistEvaluation = useCallback((next: EvaluationTestEntry[]) => {
    // ✅ PHASE 2: Enhanced logging for debugging
    console.log(`[PHASE2] persistEvaluation called:`, {
      nextCount: next.length,
      nextTests: next.map(t => ({ name: t.name, id: t.id, region: t.region })),
    });
    
    const sanitized = next.map(sanitizeEvaluationEntry);
    console.log(`[PHASE2] Sanitized tests:`, sanitized.map(t => ({ name: t.name, id: t.id, region: t.region })));
    
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
            current: currentTest.values,
            new: newTest.values
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
      
      // ✅ FIX: Update sharedState AFTER state update
      setTimeout(() => {
        console.log(`[PHASE2] Calling updatePhysicalEvaluation...`);
    updatePhysicalEvaluation(sanitized);
        console.log(`[PHASE2] persistEvaluation completed`);
      }, 0);
      
      return sanitized;
    });
  }, [updatePhysicalEvaluation]); // ✅ FIX: Removed evaluationTests from dependencies

  const normalizeName = (value: string) => value.toLowerCase().trim();

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
        name: entry.name,
        id: entry.id,
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
        console.log(`[PHASE2] Allowing AI-recommended test "${entry.name}" (${entry.region}) for case region (${detectedCaseRegion}) - AI has full context`);
      }
      
      // ✅ PHASE 2 FIX: Use functional update to ensure we have latest state
      setEvaluationTests((currentTests) => {
        const exists = currentTests.some(
        (test) => test.id === entry.id || normalizeName(test.name) === normalizeName(entry.name)
      );
        
        if (exists) {
          console.log(`[PHASE2] Test "${entry.name}" already exists, skipping`);
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
      const next = evaluationTests.filter((test) => test.id !== id);
      persistEvaluation(next);
    },
    [evaluationTests, persistEvaluation]
  );

  const updateEvaluationTest = useCallback(
    (id: string, updates: Partial<EvaluationTestEntry>) => {
      const next = evaluationTests.map((test) => (test.id === id ? { ...test, ...updates } : test));
      persistEvaluation(next);
    },
    [evaluationTests, persistEvaluation]
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

      return {
        id: test.id,
        name: test.name,
        region: test.region,
        source,
        description: test.description,
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
    if (soapNote) {
      setLocalSoapNote(soapNote);
    }
  }, [soapNote]);

  useEffect(() => {
    // ✅ PHASE 2: Clear selections when new analysis starts
    console.log('[PHASE2] Clearing selectedEntityIds due to new motivo_consulta');
    setSelectedEntityIds([]);
  }, [niagaraResults?.motivo_consulta]);
  
  // ✅ PHASE 2: Clear evaluation tests when patient changes or new session starts
  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== currentPatient?.id) {
      console.log('[PHASE2] Patient changed, clearing evaluation tests');
      setEvaluationTests([]);
      isAddingTestsRef.current = false;
    }
  }, [patientIdFromUrl, currentPatient?.id]);

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

  const aiSuggestions = useMemo(() => {
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
          match: matchTestName(trimmed),
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
        match: matchTestName(name),
      };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null); // Filter nulls but keep original indices
  }, [niagaraResults, sessionTypeFromUrl, workflowRoute?.type]);

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
  }, [aiSuggestions, evaluationTests, dismissedSuggestionKeys]);

  const interactiveResults = useMemo(() => {
    if (!niagaraResults) return null;

    // ✅ CRITICAL FIX 3: Skip physical tests for follow-up visits
    const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
    const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;
    if (isFollowUpWorkflow) {
      // Return results without physical tests for follow-ups
      return {
        ...niagaraResults,
        evaluaciones_fisicas_sugeridas: []
      };
    }

    const rawTests = niagaraResults.evaluaciones_fisicas_sugeridas || [];
    // ✅ PHASE 2 FIX: Keep original index in physicalTests to match aiSuggestions
    const physicalTests = rawTests
      .map((test: any, originalIndex: number) => {
        if (!test) return null;

        if (typeof test === "string") {
          return {
            originalIndex, // ✅ PHASE 2: Store original index for ID mapping
            name: test,
            sensitivity: undefined,
            specificity: undefined,
            indication: "",
            justification: ""
          };
        }

        return {
          originalIndex, // ✅ PHASE 2: Store original index for ID mapping
          name: test.test || test.name || "Physical test",
          sensitivity:
            test.sensibilidad !== undefined
              ? Number(test.sensibilidad)
              : test.sensitivity !== undefined
                ? Number(test.sensitivity)
                : undefined,
          specificity:
            test.especificidad !== undefined
              ? Number(test.especificidad)
              : test.specificity !== undefined
                ? Number(test.specificity)
                : undefined,
          indication: test.objetivo || test.indicacion || "",
          justification: test.justificacion || ""
        };
      })
      .filter(Boolean) ?? [];

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

    return {
      ...niagaraResults,
      entities: [...symptomEntities, ...medicationEntities, ...historyEntities],
      physicalTests,
      yellowFlags: [
        ...(niagaraResults.yellow_flags || []),
        ...psychosocial,
        ...occupational
      ],
      redFlags: niagaraResults.red_flags || [],
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
  }, [niagaraResults]);

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
    () => filteredEvaluationTests.filter((entry) => entry.result && entry.result !== "").length, // ✅ P1.1: Use filtered tests
    [filteredEvaluationTests]
  );

  const handleAnalyzeWithVertex = async () => {
    // Ensure transcript is always a string
    const transcriptText = typeof transcript === 'string' ? transcript : String(transcript || '');
    if (!transcriptText.trim()) return;
    try {
      const payload = {
        text: transcriptText,
        lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : undefined),
        mode,
        timestamp: Date.now(),
      };
      await processText({
        ...payload,
        professionalProfile: professionalProfile || undefined
      });
      setAnalysisError(null);
    } catch (error: any) {
      const message = error?.message || 'Unable to analyze transcript with our AI system.';
      setAnalysisError(message);
      console.error('[Workflow] Vertex analysis failed:', message);
      
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

  const continueToEvaluation = () => {
    // ✅ PHASE 2: Enhanced logging for debugging test transfer
    console.log('[PHASE2] continueToEvaluation called');
    console.log('[PHASE2] selectedEntityIds:', selectedEntityIds);
    console.log('[PHASE2] aiSuggestions:', aiSuggestions);
    console.log('[PHASE2] niagaraResults.evaluaciones_fisicas_sugeridas:', niagaraResults?.evaluaciones_fisicas_sugeridas);
    console.log('[PHASE2] interactiveResults.physicalTests:', interactiveResults?.physicalTests);
    console.log('[PHASE2] current evaluationTests:', evaluationTests);
    console.log('[PHASE2] detectedCaseRegion:', detectedCaseRegion);
    
    // ✅ PHASE 2: Set flag to prevent useEffect from overwriting
    isAddingTestsRef.current = true;
    
    const additions: EvaluationTestEntry[] = [];
    const entriesToAdd: EvaluationTestEntry[] = [];

    // ✅ PHASE 2 FIX: Use aiSuggestions directly - they're already mapped correctly
    // aiSuggestions has the correct key (originalIndex) and includes library matches
    console.log('[PHASE2] Using aiSuggestions directly for mapping');
    console.log('[PHASE2] aiSuggestions keys:', aiSuggestions.map(s => s.key));
    
    // ✅ PHASE 2 FIX: Create a map from key (originalIndex) to suggestion
    const suggestionMap = new Map(aiSuggestions.map((item) => [item.key, item]));
    console.log('[PHASE2] suggestionMap created:', Array.from(suggestionMap.entries()).map(([k, v]) => [k, v.rawName]));

    // ✅ PHASE 2 FIX: Get physical test IDs and map them correctly
    const physicalTestIds = selectedEntityIds.filter((id) => id.startsWith("physical-"));
    console.log('[PHASE2] physicalTestIds found:', physicalTestIds);
    
    // ✅ PHASE 2 FIX: Collect all entries first, then add them all at once
    physicalTestIds.forEach((entityId) => {
      const originalIndex = parseInt(entityId.split("-")[1], 10);
      console.log(`[PHASE2] Processing physical test ID: ${entityId}, originalIndex: ${originalIndex}`);
      
      // ✅ PHASE 2 FIX: Get suggestion directly by key (originalIndex)
      const suggestion = suggestionMap.get(originalIndex);
      if (!suggestion) {
        console.error(`[PHASE2] ❌ CRITICAL: No suggestion found for originalIndex ${originalIndex}`);
        console.error(`[PHASE2] Available keys in suggestionMap:`, Array.from(suggestionMap.keys()));
        console.error(`[PHASE2] aiSuggestions:`, aiSuggestions.map(s => ({ key: s.key, rawName: s.rawName })));
        console.error(`[PHASE2] niagaraResults.evaluaciones_fisicas_sugeridas length:`, niagaraResults?.evaluaciones_fisicas_sugeridas?.length);
        return;
      }
      
      console.log(`[PHASE2] ✅ Found suggestion for originalIndex ${originalIndex}:`, {
        key: suggestion.key,
        rawName: suggestion.rawName,
        hasMatch: !!suggestion.match,
        matchName: suggestion.match?.name
      });
      
      let entry: EvaluationTestEntry;
        if (suggestion.match) {
        // ✅ PHASE 2 FIX: Use library match if available (has region, fields, etc.)
        console.log(`[PHASE2] Creating entry from library match:`, suggestion.match.name);
        entry = createEntryFromLibrary(suggestion.match, "ai");
        } else {
        // ✅ PHASE 2 FIX: Use suggestion rawName
        console.log(`[PHASE2] Creating custom entry for:`, suggestion.rawName);
        entry = createCustomEntry(suggestion.rawName, "ai");
      }
      
      console.log(`[PHASE2] Created entry:`, {
        name: entry.name,
        id: entry.id,
        region: entry.region,
        source: entry.source
      });
      
      additions.push(entry);
      entriesToAdd.push(entry);
    });

    console.log(`[PHASE2] Total entries collected: ${entriesToAdd.length}`, entriesToAdd.map(e => e.name));
    
    // ✅ PHASE 2 FIX: Add all tests at once using functional update to avoid race conditions
    if (entriesToAdd.length > 0) {
      setEvaluationTests((currentTests) => {
        // Filter out duplicates
        const newTests = entriesToAdd.filter(entry => {
          const exists = currentTests.some(
          (test) => test.id === entry.id || normalizeName(test.name) === normalizeName(entry.name)
        );
          if (exists) {
            console.log(`[PHASE2] Test "${entry.name}" already exists, skipping`);
            return false;
          }
          return true;
        });
        
        if (newTests.length === 0) {
          console.log(`[PHASE2] All tests already exist, no new tests to add`);
          return currentTests;
        }
        
        const finalTests = [...currentTests, ...newTests];
        console.log(`[PHASE2] ✅ Adding ${newTests.length} new tests. Total: ${finalTests.length}`, finalTests.map(t => t.name));
        
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
        console.log(`[PHASE2] Current evaluationTests:`, currentTests.map(t => t.name));
        console.log(`[PHASE2] Expected ${entriesToAdd.length} tests, current: ${currentTests.length}`);
        
        // Clear flag after delay
        setTimeout(() => {
          isAddingTestsRef.current = false;
          console.log(`[PHASE2] ✅ Flag cleared - ${currentTests.length} tests in state`);
        }, 500);
        
        return currentTests; // Return unchanged
      });
    }, 500);

    const selectedKeys = new Set(
      selectedEntityIds
        .filter((id) => id.startsWith("physical-"))
        .map((id) => parseInt(id.split("-")[1], 10))
    );
    const newlyDismissed = aiSuggestions
      .filter((item) => !selectedKeys.has(item.key))
      .map((item) => item.key);

    console.log(`[PHASE2] Dismissing ${newlyDismissed.length} suggestions:`, newlyDismissed);
    setDismissedSuggestionKeys((prev) => Array.from(new Set([...prev, ...newlyDismissed])));

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
  
  // Initial Plan Modal state (for existing patients without initial assessment)
  const [isInitialPlanModalOpen, setIsInitialPlanModalOpen] = useState(false);
  
  // Universal Share Menu state
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

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
          const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
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
  
  // Handler to reload treatment plan after manual creation
  const handlePlanCreated = async () => {
    try {
      const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
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

    // ✅ Patient Consent Gate (PHIPA s. 18 compliance) - SMS-based approach
    const patientId = patientIdFromUrl || demoPatient.id;
    const hasConsent = await PatientConsentService.hasConsent(patientId);
    
    if (!hasConsent) {
      // Show notification that consent is pending
      setAnalysisError(
        'Patient consent is required before generating SOAP notes. ' +
        'An SMS with a consent link has been sent to the patient. ' +
        'Please wait for the patient to provide consent, or use manual documentation entry.'
      );
      return; // Block AI processing until consent is given
    }

    try {
      // Capture SOAP generation start timestamp
      if (!soapGenerationStartTime) {
        setSoapGenerationStartTime(new Date());
      }
      
      setIsGeneratingSOAP(true);
      setAnalysisError(null);

      // Step 1: Organize unified data from Tab 1 and Tab 2
      const unifiedData: UnifiedClinicalData = {
        tab1: {
          transcript: transcript || '',
          analysis: niagaraResults,
          attachments: attachments,
        },
        tab2: {
          evaluationTests: filteredEvaluationTests, // ✅ P1.1: Use filtered tests (only matching region)
          library: MSK_TEST_LIBRARY,
        },
        visit: {
          type: visitType,
          patientId: patientIdFromUrl || demoPatient.id,
          patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
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
        console.warn('[Workflow] Clinical note validation warnings:', validation.warnings);
      }

      // Step 3: Organize all data into structured format for SOAP prompt
      const organized = organizeSOAPData(unifiedData);

      // Log data summary for debugging
      console.log('[Workflow] Clinical data organization summary:', createDataSummary(organized));

      // Step 4: Generate SOAP using organized context
      // ✅ WORKFLOW OPTIMIZATION: Pass analysisLevel from workflowRoute
      const analysisLevel = workflowRoute?.analysisLevel || 'full';
      const response = await generateSOAPNoteFromService(organized.context, {
        analysisLevel,
        sessionType: currentSessionType,
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

      setLocalSoapNote(soapWithReviewFlags);
      setSoapStatus('draft');
      setActiveTab("soap");

      // Step 5: Save to session with all structured data
      await sessionService.createSession({
        userId: TEMP_USER_ID,
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
        patientId: patientIdFromUrl || demoPatient.id,
        transcript: transcript || "",
        soapNote: soapWithReviewFlags,
        physicalTests: organized.structuredData.physicalExamResults,
        status: "draft",
        transcriptionMeta: {
          lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
          languagePreference,
          mode,
          averageLogProb: transcriptMeta?.averageLogProb ?? null,
          durationSeconds: transcriptMeta?.durationSeconds,
          recordedAt: new Date().toISOString(),
        },
        attachments,
        // Store organized data for future reference
        organizedData: {
          metadata: organized.metadata,
          physicalEvaluationStructured: organized.structuredData.physicalEvaluationStructured,
        },
      });
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

  // Calculate and track value metrics when SOAP is finalized
  const calculateAndTrackValueMetrics = useCallback(async (finalizedAt: Date) => {
    try {
      // Calculate times (in minutes)
      const transcriptionTime = transcriptionStartTime && transcriptionEndTime
        ? (transcriptionEndTime.getTime() - transcriptionStartTime.getTime()) / 1000 / 60
        : undefined;
      
      const aiGenerationTime = soapGenerationStartTime && transcriptionEndTime
        ? (new Date().getTime() - soapGenerationStartTime.getTime()) / 1000 / 60
        : undefined;
      
      const totalDocumentationTime = (finalizedAt.getTime() - sessionStartTime.getTime()) / 1000 / 60;
      
      const manualEditingTime = aiGenerationTime && transcriptionTime
        ? totalDocumentationTime - aiGenerationTime - (transcriptionTime || 0)
        : undefined;
      
      // Detect features used
      const featuresUsed = {
        transcription: !!(transcript && transcript.trim().length > 0),
        physicalTests: filteredEvaluationTests.length > 0, // ✅ P1.1: Use filtered tests
        aiSuggestions: !!(sharedState.clinicalAnalysis?.physicalTests && sharedState.clinicalAnalysis.physicalTests.length > 0),
        soapGeneration: !!localSoapNote,
      };
      
      // Calculate quality metrics
      const soapSectionsCompleted = {
        subjective: !!(localSoapNote?.subjective && localSoapNote.subjective.trim().length > 0),
        objective: !!(localSoapNote?.objective && localSoapNote.objective.trim().length > 0),
        assessment: !!(localSoapNote?.assessment && localSoapNote.assessment.trim().length > 0),
        plan: !!(localSoapNote?.plan && localSoapNote.plan.trim().length > 0),
      };
      
      // For now, estimate suggestions offered/accepted/rejected from available data
      // TODO: Track these in real-time during workflow for more accurate metrics
      const suggestionsOffered = sharedState.clinicalAnalysis?.physicalTests?.length || 0;
      const suggestionsAccepted = filteredEvaluationTests.filter(test => test.source === 'ai').length; // ✅ P1.1: Use filtered tests
      const suggestionsRejected = suggestionsOffered - suggestionsAccepted;
      
      // Estimate edits made to SOAP (for now, just check if SOAP was modified)
      // TODO: Track actual edits in real-time for more accurate metrics
      const editsMadeToSOAP = localSoapNote ? 1 : 0; // Placeholder - would need to track actual edits
      
      // Generate session ID (simple hash for now)
      const sessionId = `${TEMP_USER_ID}-${sessionStartTime.getTime()}`;
      
      // Prepare metrics event
      const metrics: Omit<ValueMetricsEvent, 'timestamp'> = {
        hashedUserId: TEMP_USER_ID, // Will be pseudonymized in AnalyticsService
        hashedSessionId: sessionId,
        timestamps: {
          sessionStart: sessionStartTime,
          transcriptionStart: transcriptionStartTime || undefined,
          transcriptionEnd: transcriptionEndTime || undefined,
          soapGenerationStart: soapGenerationStartTime || undefined,
          soapFinalized: finalizedAt,
        },
        calculatedTimes: {
          totalDocumentationTime,
          transcriptionTime: transcriptionTime || undefined,
          aiGenerationTime: aiGenerationTime || undefined,
          manualEditingTime: manualEditingTime || undefined,
        },
        featuresUsed,
        quality: {
          soapSectionsCompleted,
          suggestionsOffered,
          suggestionsAccepted,
          suggestionsRejected,
          editsMadeToSOAP,
        },
        sessionType: visitType,
        region: undefined, // TODO: Extract from patient data or session metadata
      };
      
      // Track metrics
      await AnalyticsService.trackValueMetrics(metrics);
      console.log('[VALUE METRICS] Metrics tracked successfully:', {
        totalTime: totalDocumentationTime,
        featuresUsed: Object.values(featuresUsed).filter(Boolean).length,
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
    transcript,
    filteredEvaluationTests,
    sharedState.clinicalAnalysis,
    localSoapNote,
    visitType,
  ]);

  const handleSaveSOAP = async (soap: SOAPNote, status: SOAPStatus) => {
    // ✅ DÍA 2: CPO Review Gate - Bloquear finalización sin review
    if (status === 'finalized') {
      // Check si requiere review y no fue reviewado
      if (soap.requiresReview && !soap.isReviewed) {
        setAnalysisError(
          '❌ CPO Compliance: This SOAP note requires review before finalization. ' +
          'Please review and verify all AI-generated content before finalizing.'
        );
        return; // Bloquear finalización
      }
      
      // Si requiere review y fue reviewado, agregar metadata de review
      if (soap.requiresReview && soap.isReviewed && !soap.reviewed) {
        soap.reviewed = {
          reviewedBy: TEMP_USER_ID,
          reviewedAt: new Date(),
          reviewerName: 'Current User', // TODO: Get from auth
        };
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
    
    // Save to session
    try {
      const newSessionId = await sessionService.createSession({
        userId: TEMP_USER_ID,
        patientName: currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
        patientId: patientIdFromUrl || demoPatient.id,
        transcript: transcript || "",
        soapNote: cleanedSoap, // Use cleaned version to avoid Firestore undefined errors
        physicalTests: physicalExamResults || [],
        status: status === 'finalized' ? 'completed' : 'draft',
        transcriptionMeta: finalTranscriptionMeta,
        attachments: attachments || [],
      });
      
      // ✅ Day 3: Store sessionId for comparison
      if (newSessionId) {
        setSessionId(newSessionId);
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
    console.log('[Workflow] Unfinalizing note for editing. Original note:', soap);
    // The actual unfinalization is handled by the component state
    // This handler can be used to log or track the unfinalization event
  };

  const handleFinalizeSOAP = async (soap: SOAPNote) => {
    await handleSaveSOAP(soap, 'finalized');
    
    // ✅ HOSPITAL PORTAL: Show share menu after finalization
    // The share menu will allow physiotherapists to share the note securely
    // This is especially important for hospital workflows
    // Note: Share menu will be opened via onShare callback in SOAPEditor
    
      // ✅ WORKFLOW OPTIMIZATION: Track workflow session end and show feedback
      try {
        const sessionIdForMetrics = sessionId || `${user?.uid || TEMP_USER_ID}-${sessionStartTime.getTime()}`;
        if (user?.uid && workflowRoute) {
          const metrics = await trackWorkflowSessionEnd(sessionIdForMetrics, user.uid, patientIdFromUrl || demoPatient.id);
          if (metrics) {
            console.log('[WORKFLOW] Workflow session metrics:', metrics);
            // Build WorkflowMetrics from session metrics
            const workflowMetricsData: WorkflowMetrics = {
              workflowType: workflowRoute.type === 'follow-up' ? 'follow-up' : 'initial',
              timeToSOAP: metrics.timeToSOAP || 0,
              tokenUsage: metrics.tokenUsage || { input: 0, output: 0, total: 0 },
              tokenOptimization: metrics.tokenOptimization,
              userClicks: metrics.userClicks,
              tabsSkipped: metrics.tabsSkipped,
              timestamp: metrics.endTime || new Date(),
            };
            setWorkflowMetrics(workflowMetricsData);
            // Show feedback after a short delay
            setTimeout(() => {
              setShowWorkflowFeedback(true);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('[WORKFLOW] Error tracking workflow session end:', error);
        // Non-blocking
      }
    
    // ✅ PILOT METRICS: Track session completion
    try {
      const pilotStartDate = new Date('2024-12-19T00:00:00Z');
      const isPilotUser = new Date() >= pilotStartDate;
      
      if (isPilotUser && user?.uid) {
        const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000 / 60); // minutes
        await AnalyticsService.trackEvent('pilot_session_completed', {
          patientId: patientIdFromUrl || demoPatient.id,
          userId: user.uid,
          sessionStartTime: sessionStartTime.toISOString(),
          sessionEndTime: new Date().toISOString(),
          sessionDurationMinutes: sessionDuration,
          visitType,
          soapFinalized: true,
          hasTranscript: !!transcript?.trim(),
          hasPhysicalTests: evaluationTests.length > 0,
          isPilotUser: true
        });
        console.log('✅ [PILOT METRICS] Session completion tracked:', patientId, `Duration: ${sessionDuration} min`);
      }
    } catch (error) {
      console.error('⚠️ [PILOT METRICS] Error tracking session completion:', error);
      // Non-blocking: don't fail finalization if analytics fails
    }
    
    // ✅ P1.3: Save finalized SOAP to Clinical Vault (Firestore)
    try {
      const { PersistenceService } = await import('../services/PersistenceService');
      const patientId = patientIdFromUrl || demoPatient.id;
      const sessionId = `${TEMP_USER_ID}-${sessionStartTime.getTime()}`;
      
      // ✅ P1.3: Save finalized SOAP to Clinical Vault with detailed logging
      const soapDataToSave = {
        subjective: soap.subjective || '',
        objective: soap.objective || '',
        assessment: soap.assessment || '',
        plan: soap.plan || '',
        confidence: 0.85, // Default confidence for finalized notes
        timestamp: new Date().toISOString(),
      };
      
      console.log('[Workflow] Saving SOAP to Clinical Vault:', {
        patientId,
        sessionId,
        soapDataLength: {
          subjective: soapDataToSave.subjective.length,
          objective: soapDataToSave.objective.length,
          assessment: soapDataToSave.assessment.length,
          plan: soapDataToSave.plan.length,
        }
      });
      
      // ✅ SPRINT 2 P2: Use enhanced persistence with retry and backup
      const { saveSOAPNoteWithRetry } = await import('../services/PersistenceServiceEnhanced');
      const result = await saveSOAPNoteWithRetry(
        soapDataToSave,
        patientId,
        sessionId,
        {
          maxRetries: 3,
          retryDelay: 1000,
          enableBackup: true,
          validateBeforeSave: true,
        }
      );

      if (result.success && result.noteId) {
        console.log('[Workflow] ✅ SOAP note saved to Clinical Vault:', {
          noteId: result.noteId,
          patientId,
          sessionId,
          retries: result.retries,
          usedBackup: result.usedBackup,
          timestamp: new Date().toISOString()
        });
        setSuccessMessage('SOAP note saved successfully to Clinical Vault.');
      } else {
        throw new Error(result.error || 'Failed to save after retries');
      }
    } catch (error) {
      console.error('[Workflow] Failed to save SOAP to Clinical Vault:', error);
      // Non-blocking: show warning but don't block finalization
      // ✅ SPRINT 2 P2: Inform user about backup
      setAnalysisError(
        'Note finalized but failed to save to Clinical Vault. ' +
        'Your note has been backed up locally and will be retried automatically. ' +
        'Please check your connection and try again.'
      );
    }
    
    // Save treatment plan for future reminders
    if (soap.plan) {
      try {
        const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
        await treatmentPlanService.saveTreatmentPlan(
          patientIdFromUrl || demoPatient.id,
          currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name,
          TEMP_USER_ID,
          soap.plan,
          visitType
        );
        console.log('[Workflow] Treatment plan saved for reminders');
      } catch (error) {
        console.error('[Workflow] Failed to save treatment plan:', error);
        // Non-blocking: continue even if plan save fails
      }
    }
  };

  const handleRegenerateSOAP = async () => {
    // Regenerate with same context
    await handleGenerateSoap();
  };

  const copySoapToClipboard = async () => {
    if (!localSoapNote) return;
    const plain = [
      "Subjective:",
      localSoapNote.subjective || "Not documented.",
      "",
      "Objective:",
      localSoapNote.objective || "Not documented.",
      "",
      "Assessment:",
      localSoapNote.assessment || "Pending clinician review.",
      "",
      "Plan:",
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
        allergies.push(...currentPatient.allergies.filter(Boolean));
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.02em] text-slate-400 font-apple font-light">AiduxCare <span className="ml-1">🍁</span></p>
            <p className="text-[15px] font-medium text-slate-800 font-apple">Clinical Workflow — Canada</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/command-center"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-colors"
            >
              <Users className="w-4 h-4" />
              Command Center
            </Link>
          <div className="flex items-center gap-3 text-sm">
            {/* ✅ CRITICAL FIX: Show professional information */}
            {clinicianDisplayName && (
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{clinicianDisplayName}</span>
                {clinicName && <span className="text-slate-500">· {clinicName}</span>}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Email verified · Access granted
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* ✅ WORKFLOW OPTIMIZATION: Workflow Selector */}
        {workflowDetected && currentPatient && user?.uid && (
          <WorkflowSelector
            patientId={patientId}
            userId={user.uid}
            consultationType={sessionTypeFromUrl || undefined}
            onWorkflowSelected={(route) => {
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
            }}
            onManualOverride={(type) => {
              // Manual override handled by WorkflowSelector
            }}
          />
        )}

        <nav className="flex flex-wrap gap-2">
          {[
            { id: "analysis", label: "1 · Initial Analysis" },
            { id: "evaluation", label: "2 · Physical Evaluation" },
            { id: "soap", label: "3 · SOAP Report" },
          ]
          .filter((tab) => {
            // ✅ WORKFLOW OPTIMIZATION: Hide tabs that should be skipped
            // ✅ CRITICAL FIX: Also check if explicit followup from URL
            const isExplicitFollowUp = sessionTypeFromUrl === 'followup';
            const isFollowUpWorkflow = workflowRoute?.type === 'follow-up' || isExplicitFollowUp;
            
            // Skip analysis tab for follow-ups
            if (isFollowUpWorkflow && tab.id === 'analysis') {
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
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow font-apple"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ✅ WORKFLOW OPTIMIZATION: Skip analysis tab for follow-ups */}
        {/* ✅ ISO COMPLIANCE: Lazy-loaded components with Suspense for better performance */}
        {activeTab === "analysis" && !(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
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
              niagaraResults={niagaraResults}
              interactiveResults={interactiveResults}
              selectedEntityIds={selectedEntityIds}
              setSelectedEntityIds={setSelectedEntityIds}
              continueToEvaluation={continueToEvaluation}
              analysisError={analysisError}
              successMessage={successMessage}
              setAnalysisError={setAnalysisError}
              setSuccessMessage={setSuccessMessage}
            />
          </Suspense>
        )}
        {activeTab === "evaluation" && (
          <Suspense fallback={<LoadingSpinner />}>
            <EvaluationTab
              filteredEvaluationTests={filteredEvaluationTests}
              evaluationTests={evaluationTests}
              completedCount={completedCount}
              detectedCaseRegion={detectedCaseRegion}
              pendingAiSuggestions={pendingAiSuggestions}
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
              handleGenerateSoap={handleGenerateSoap}
              isGeneratingSOAP={isGeneratingSOAP}
              sessionTypeFromUrl={sessionTypeFromUrl}
              workflowRoute={workflowRoute}
            />
          </Suspense>
        )}
        {activeTab === "soap" && (
          <Suspense fallback={<LoadingSpinner />}>
            <SOAPTab
              localSoapNote={localSoapNote}
              soapStatus={soapStatus}
              visitType={visitType}
              isGeneratingSOAP={isGeneratingSOAP}
              patientId={patientId}
              sessionId={sessionId}
              handleGenerateSoap={handleGenerateSoap}
              handleSaveSOAP={handleSaveSOAP}
              handleRegenerateSOAP={handleRegenerateSOAP}
              handleFinalizeSOAP={handleFinalizeSOAP}
              handleUnfinalizeSOAP={handleUnfinalizeSOAP}
              setIsShareMenuOpen={setIsShareMenuOpen}
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
            />
          </Suspense>
        )}
      </div>


      {/* Feedback Widget - Always visible for beta testing */}
      <FeedbackWidget />
      
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

      {/* Universal Share Menu - Available after SOAP is finalized */}
      {localSoapNote && soapStatus === 'finalized' && user?.uid && (
        <UniversalShareMenu
          isOpen={isShareMenuOpen}
          onClose={() => setIsShareMenuOpen(false)}
          shareOptions={{
            noteContent: [
              "Subjective:",
              localSoapNote.subjective || "Not documented.",
              "",
              "Objective:",
              localSoapNote.objective || "Not documented.",
              "",
              "Assessment:",
              localSoapNote.assessment || "Pending clinician review.",
              "",
              "Plan:",
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
            console.log('[Workflow] Share completed:', result);
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
};

export default ProfessionalWorkflowPage;
