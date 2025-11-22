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

type ActiveTab = "analysis" | "evaluation" | "soap";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get patient ID from URL
  const patientIdFromUrl = searchParams.get('patientId');
  
  // State for real patient data
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>("analysis");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [visitType, setVisitType] = useState<VisitType>('initial');
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
    () => deriveClinicName(professionalProfile),
    [professionalProfile]
  );

  const clinicianDisplayName = useMemo(
    () => deriveClinicianDisplayName(professionalProfile, user),
    [professionalProfile, user]
  );

  // ✅ P2.1: Use getPublicBaseUrl for mobile-accessible links
  const consentBaseUrl = useMemo(() => {
    try {
      const { getPublicBaseUrl } = require('../utils/urlHelpers');
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

  // Check consent verification before allowing workflow access
  useEffect(() => {
    const checkConsentVerification = async () => {
      const patientId = patientIdFromUrl || demoPatient.id;
      
      // Check if consent is verified
      const isVerified = await ConsentVerificationService.isConsentVerified(patientId);
      
      if (!isVerified) {
        // Redirect to consent verification
        console.log('[WORKFLOW] Consent not verified, redirecting to verification...');
        navigate(`/consent-verification/${patientId}`);
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
      // ✅ FIX: Check if tests actually changed before updating
      const currentTestIds = new Set(currentTests.map(t => t.id));
      const newTestIds = new Set(sanitized.map(t => t.id));
      const hasChanges = sanitized.length !== currentTests.length || 
                         sanitized.some(t => !currentTestIds.has(t.id)) ||
                         currentTests.some(t => !newTestIds.has(t.id));
      
      if (!hasChanges) {
        console.log(`[PHASE2] No changes detected, skipping update`);
        return currentTests; // Return unchanged
      }
      
      console.log(`[PHASE2] Changes detected, updating evaluationTests...`);
      
      // ✅ FIX: Update ref to prevent useEffect from re-triggering
      lastSharedStateRef.current = JSON.stringify(sanitized.map(t => t.id).sort());
      
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
  }, [niagaraResults]);

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
    if (!transcript?.trim()) return;
    try {
      const payload = {
        text: transcript,
        lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : undefined),
        mode,
        timestamp: Date.now(),
      };
      await processText(payload);
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

  // Detect visit type on mount or when data changes
  useEffect(() => {
    // TODO: Check Firestore for previous SOAP notes
    // For now, default to initial assessment
    const detection = detectVisitType(false); // No previous SOAP for MVP
    setVisitType(detection.detectedType);
  }, []);

  // Load treatment reminder for follow-up visits
  useEffect(() => {
    if (visitType === 'follow-up') {
      const loadReminder = async () => {
        try {
          const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
          const reminder = await treatmentPlanService.getTreatmentReminder(
            demoPatient.id,
            2 // Visit number (2 = second visit)
          );
          if (reminder) {
            setTreatmentReminder(reminder.reminderText);
          }
        } catch (error) {
          console.error('[Workflow] Failed to load treatment reminder:', error);
        }
      };
      loadReminder();
    } else {
      setTreatmentReminder(null);
    }
  }, [visitType]);

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
      const response = await generateSOAPNoteFromService(organized.context);
      
      if (!response || !response.soap) {
        throw new Error('Failed to generate SOAP note: empty response from AI system');
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
    evaluationTests,
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

  const renderTranscriptArea = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900 font-apple mb-2">Clinical Conversation Capture</h2>
          <p className="text-[15px] text-slate-500 font-light font-apple">
            Use the built-in recorder or paste a transcript from your recording.
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 max-w-md">
            <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
            <p>
              AiDuxCare automatically detects English, Canadian French, or Spanish. Accents are supported, but clarity helps the medico-legal record.
            </p>
        </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Mic className="w-4 h-4 text-slate-400" />
            {recordingTime}
          </span>
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-danger hover:bg-gradient-danger-hover text-white shadow-sm transition font-apple text-[15px] font-medium"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 font-apple text-[15px]"
            >
              <Play className="w-4 h-4" />
              Start Recording
            </button>
          )}
        </div>
      </div>

      {/* Audio Waveform Visualization */}
      {isRecording && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary-blue animate-pulse" />
            <span className="text-sm font-medium text-primary-blue font-apple">Listening...</span>
          </div>
          <AudioWaveform isActive={isRecording} stream={audioStream} />
        </div>
      )}

      {/* Processing Audio Indicator */}
      {isTranscribing && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 font-apple">Processing audio...</p>
              <p className="text-xs text-amber-600 mt-0.5 font-apple font-light">
                Transcribing audio. This may take a few moments for longer recordings.
              </p>
              <p className="text-xs text-amber-500 mt-1 font-apple font-light">
                💡 Tip: For best results, keep recordings under 15 minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Transcription Indicator */}
      {isProcessing && !isTranscribing && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary-blue animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-blue font-apple">Analyzing transcript...</p>
              <p className="text-xs text-primary-blue/80 mt-0.5 font-apple font-light">Analyzing clinical data with our specialized AI methods</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Language</span>
          <select
            value={languagePreference}
            onChange={(event) => setLanguagePreference(event.target.value as WhisperSupportedLanguage)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue font-apple"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Mode</span>
          <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 shadow-sm">
            {(['live', 'dictation'] as Array<'live' | 'dictation'>).map((key) => (
            <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm transition ${
                  mode === key
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {MODE_LABELS[key]}
            </button>
            ))}
          </div>
        </div>
      </div>

      {transcriptError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-apple">
          <p className="font-medium">Transcription error</p>
          <p>{transcriptError}</p>
        </div>
      )}

      <textarea
        className="mt-4 w-full min-h-[160px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
        placeholder="Paste the transcript or record directly from the browser..."
        value={transcript}
        onChange={(event) => {
          // Direct update for textarea (no debounce needed for immediate feedback)
          setTranscript(event.target.value);
        }}
      />

      {transcriptMeta && (
        <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
          <span>{formatDetectedLanguage(transcriptMeta.detectedLanguage)}</span>
          {typeof transcriptMeta.averageLogProb === 'number' && (
            <span>Average log-probability: {transcriptMeta.averageLogProb.toFixed(2)}</span>
          )}
          {typeof transcriptMeta.durationSeconds === 'number' && (
            <span>Duration: {transcriptMeta.durationSeconds.toFixed(1)}s</span>
          )}
          <span>Mode: {MODE_LABELS[mode]}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Audio is captured locally. No data is transmitted until you trigger the analysis.
        </p>
            <button
          onClick={handleAnalyzeWithVertex}
          disabled={isProcessing || !transcript?.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-sm disabled:opacity-50 transition font-apple text-[15px] font-medium"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyze with AiduxCare AI
            </>
          )}
            </button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Paperclip className="w-4 h-4 text-slate-500" />
            Clinical attachments
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 cursor-pointer transition">
            <UploadCloud className="w-4 h-4" />
            {isUploadingAttachment ? 'Uploading…' : 'Add files'}
            <input
              type="file"
              multiple
              accept="image/*,application/pdf,text/plain,.txt,.rtf,.doc,.docx"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={isUploadingAttachment}
            />
          </label>
        </div>

        {attachmentError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {attachmentError}
          </div>
        )}

        {attachments.length === 0 ? (
          <p className="text-xs text-slate-500">
            Attach lab work, imaging reports, or patient-provided photos. Files stay in encrypted Firebase Storage.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{attachment.name}</span>
                  <span className="text-xs text-slate-500">
                    {formatFileSize(attachment.size)} · Uploaded {new Date(attachment.uploadedAt).toLocaleString("en-CA")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={attachment.downloadURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View
                  </a>
            <button
                    type="button"
                    onClick={() => handleAttachmentRemove(attachment)}
                    disabled={removingAttachmentId === attachment.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 font-apple"
                  >
                    <X className="w-3.5 h-3.5" />
                    {removingAttachmentId === attachment.id ? 'Removing…' : 'Remove'}
            </button>
          </div>
              </li>
            ))}
          </ul>
        )}
        </div>

      </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-[-0.02em] leading-[1.1] font-apple mb-3">
          Professional Workflow
        </h1>
        <p className="text-lg text-slate-500 font-light leading-[1.3] font-apple">
          Market: Canada · Patient data stored under PHIPA/PIPEDA controls · Clinical AI processing verified.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name}
          </p>
          <p className="text-sm text-slate-500">{currentPatient?.email || demoPatient.email}</p>
          {/* ✅ P2.2: Unified Consent Banner - Single banner with official palette */}
          {!consentStatus && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-800 font-apple">
                      Patient consent required
                    </p>
                    <p className="mt-1 text-xs text-red-700 font-apple">
                      {smsError 
                        ? `SMS delivery failed: ${smsError}. Use the link below or mark as authorized manually.`
                        : consentPending
                        ? 'Consent link sent via SMS. Patient can authorize via link or you can mark as authorized below.'
                        : 'Send consent link to patient or mark as authorized manually.'}
                    </p>
                  </div>
                </div>
                {consentLink && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.open(consentLink, '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-primary-blue to-primary-purple px-3 py-1.5 text-xs font-medium text-white hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-apple min-h-[32px]"
                    >
                      Open consent portal
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyConsentLink}
                      className="inline-flex items-center rounded-md border border-primary-blue/30 bg-white px-3 py-1.5 text-xs font-medium text-primary-blue hover:bg-primary-blue/5 transition font-apple min-h-[32px]"
                    >
                      {copyConsentFeedback === 'success' ? 'Link copied' : 'Copy consent link'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!consentToken || !user?.uid) return;
                        try {
                          await PatientConsentService.markConsentAsAuthorized(
                            consentToken,
                            'ongoing',
                            user.uid
                          );
                          // Refresh consent status
                          const patientId = patientIdFromUrl || demoPatient.id;
                          const status = await PatientConsentService.getConsentStatus(patientId);
                          setConsentStatus(status);
                          const hasConsent = await PatientConsentService.hasConsent(patientId);
                          setPatientHasConsent(hasConsent);
                          setConsentPending(false);
                          setSmsError(null);
                        } catch (error) {
                          console.error('[WORKFLOW] Error marking consent as authorized:', error);
                          setSmsError('Failed to mark consent as authorized');
                        }
                      }}
                      className="inline-flex items-center rounded-md border border-primary-blue/30 bg-white px-3 py-1.5 text-xs font-medium text-primary-blue hover:bg-primary-blue/5 transition font-apple min-h-[32px]"
                    >
                      Mark as authorized
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {consentStatus && (
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={consentStatus === 'ongoing' || consentStatus === 'session-only'}
                readOnly
                className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue font-apple"
              />
              <span className="text-xs text-slate-600 font-apple">
                {consentStatus === 'ongoing' && 'Consent approved'}
                {consentStatus === 'session-only' && 'Approved for one session'}
                {consentStatus === 'declined' && 'Not approved'}
              </span>
            </div>
          )}
          {/* ✅ P2.2: SMS error is now handled in unified consent banner above - removed duplicate */}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Province</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{demoPatient.province}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Specialty</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{demoPatient.specialty}</p>
        </div>
      </section>

      {renderTranscriptArea()}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {mode === 'dictation' ? 'Processing dictation audio...' : 'Processing live audio sample...'}
        </div>
      )}

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

      {niagaraResults && interactiveResults ? (
        <>
          <div className="mt-4">
            <ClinicalAnalysisResults
              results={interactiveResults}
              selectedIds={selectedEntityIds}
              onSelectionChange={setSelectedEntityIds}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-600">
                Select the physical tests you plan to perform. You can edit or add items before moving to the next step.
              </p>
            </div>
            <button
              onClick={continueToEvaluation}
              disabled={
                (interactiveResults.physicalTests?.length ?? 0) > 0 &&
                !selectedEntityIds.some((id) => id.startsWith("physical-"))
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

  // Generate dynamic summary from field values
  const generateTestSummary = useCallback((
    entry: EvaluationTestEntry,
    testDefinition: MskTestDefinition | null
  ): string => {
    if (!testDefinition?.fields || !entry.values) {
      return entry.notes || testDefinition?.normalTemplate || '';
    }

    const parts: string[] = [];
    let hasModifiedValues = false;

    // Build summary from actual values, only including meaningful data
    testDefinition.fields.forEach((field) => {
      const value = entry.values?.[field.id];
      
      if (value === null || value === undefined || value === '' || value === false) {
        return; // Skip empty/null values
      }

      // Check if this is a modified value (not just a pre-filled default)
      let isModified = true;
      if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
        // If value equals the pre-filled max and result is normal, it's likely unmodified
        if (field.normalRange && value === field.normalRange.max && entry.result === 'normal') {
          isModified = false;
        }
      }

      if (isModified) {
        hasModifiedValues = true;
        
        if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
          const unit = field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : '';
          // Format more naturally for bilateral tests
          if (field.label.toLowerCase().includes('right') || field.label.toLowerCase().includes('left')) {
            parts.push(`${field.label}: ${value}${unit}`);
          } else {
            parts.push(`${field.label}: ${value}${unit}`);
          }
        } else if (field.kind === 'yes_no' && value === true) {
          parts.push(`${field.label}: positive`);
        } else if (field.kind === 'score_0_10') {
          parts.push(`${field.label}: ${value}/10`);
        } else if (field.kind === 'text' && typeof value === 'string' && value.trim()) {
          parts.push(`${field.label}: ${value.trim()}`);
        }
      }
    });

    // If result is not normal, always include it
    if (entry.result && entry.result !== 'normal') {
      parts.push(`Result: ${RESULT_LABELS[entry.result]}`);
    }

    // If we have modified values or abnormal result, return the generated summary
    if (hasModifiedValues || entry.result !== 'normal') {
      return parts.length > 0 ? parts.join('. ') : testDefinition.normalTemplate || '';
    }

    // Otherwise return empty (will use normalTemplate as placeholder)
    return '';
  }, []);

  // Render field input based on field kind
  const renderFieldInput = (
    field: TestFieldDefinition,
    value: number | string | boolean | null,
    onChange: (newValue: number | string | boolean | null) => void,
    entry?: EvaluationTestEntry,
    updateTest?: (id: string, updates: Partial<EvaluationTestEntry>) => void
  ) => {
    switch (field.kind) {
      case 'angle_bilateral':
      case 'angle_unilateral':
        return (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              {field.label}
              {/* Only add unit if not already in label */}
              {field.unit === 'deg' && !field.label.includes('°') && !field.label.includes('deg') && ' (°)'}
              {/* NOTE: Units (kg, etc.) will be subject to geolocation/physical practice location in future */}
              {field.unit === 'kg' && !field.label.includes('(kg)') && !field.label.includes('kg)') && ' (kg)'}
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => {
                const newValue = e.target.value === '' ? null : Number(e.target.value);
                onChange(newValue);
                
                // If value changed from pre-filled default, automatically mark as abnormal
                // This means the measurement doesn't match normal range
                if (entry && entry._prefillDefaults && updateTest && 
                    entry._prefillDefaults[field.id] !== null && 
                    entry._prefillDefaults[field.id] !== undefined) {
                  const prefillValue = entry._prefillDefaults[field.id];
                  if (newValue !== null && newValue !== prefillValue) {
                    // Value was changed from pre-filled normal → mark as positive/abnormal
                    // Clear prefill defaults since value was manually changed
                    const updatedPrefills = { ...entry._prefillDefaults };
                    updatedPrefills[field.id] = null; // Mark this field as manually changed
                    updateTest(entry.id, { 
                      result: "positive",
                      _prefillDefaults: updatedPrefills
                    });
                  }
                }
              }}
            />
            {field.normalRange && (
              <p className="text-[11px] text-slate-500">
                Normal: {field.normalRange.min}–{field.normalRange.max} {field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : ''}
              </p>
            )}
          </div>
        );
      case 'yes_no':
        return (
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
            />
            {field.label}
          </label>
        );
      case 'score_0_10':
        return (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              {field.label} (0–10)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) =>
                onChange(e.target.value === '' ? null : Number(e.target.value))
              }
            />
          </div>
        );
      case 'text':
      default:
        return (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              {field.label}
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              rows={2}
              placeholder={field.notesPlaceholder}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );
    }
  };

  const renderEvaluationTab = () => {
    const totalTests = filteredEvaluationTests.length; // ✅ P1.1: Use filtered tests
    const progressPercent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);

    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Physical Evaluation</h2>
            <p className="text-sm text-slate-500">
              Select the tests you performed and record the outcome. These findings feed the SOAP draft.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            {pendingAiSuggestions.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Suggested Tests (AI)</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Matches from Vertex analysis. Click to add to your evaluation.
                </p>
                <div className="mt-3 space-y-2">
                  {pendingAiSuggestions.map((item) => {
                    const matched = item.match;
                    const displayName = matched ? matched.name : item.rawName;
                    return (
                      <div
                        key={`ai-${item.key}`}
                        className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700">{displayName}</p>
                          <p className="text-[11px] text-slate-500">
                            {matched ? matched.description : 'Custom entry sourced from transcript.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (matched) {
                              addEvaluationTest(createEntryFromLibrary(matched, "ai"));
                            } else {
                              addEvaluationTest(createCustomEntry(item.rawName, "ai"));
                            }
                          }}
                          className="ml-2 rounded-full bg-[#8b5cf6] px-3 py-1 text-xs text-white transition hover:bg-[#7c3aed]"
                        >
                          Add to evaluation
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ✅ Day 3: Session Comparison Component */}
            {(currentPatient?.id || patientIdFromUrl) && (
              <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
                <SessionComparison
                  patientId={currentPatient?.id || patientIdFromUrl || ''}
                  currentSessionId={sessionId || undefined}
                  currentSession={currentSessionForComparison}
                  onComparisonLoad={(comparison) => {
                    // Analytics tracking
                    AnalyticsService.trackSystemEvent({
                      event: 'session_comparison_loaded',
                      module: 'professional_workflow',
                      userId: user?.uid,
                      metadata: {
                        patientId: currentPatient?.id || patientIdFromUrl,
                        hasImprovement: comparison.deltas.overallProgress === 'improved',
                        hasRegression: comparison.alerts.length > 0,
                        daysBetween: comparison.deltas.daysBetweenSessions,
                      },
                    }).catch(err => {
                      console.error('[Analytics] Failed to track comparison load:', err);
                    });
                  }}
                />
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Add Tests</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Choose from the library or add a custom test. Once added, tests appear on the right for documentation.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Library tests
                  </label>
                  <select
                    onChange={handleLibrarySelect}
                    defaultValue=""
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="">Select a test…</option>
                    {regions.map((region) => (
                      <optgroup key={region} label={regionLabels[region]}>
                        {MSK_TEST_LIBRARY.filter((test) => test.region === region).map((test) => {
                          const disabled = isTestAlreadySelected(test.id, test.name);
                          return (
                            <option key={test.id} value={test.id} disabled={disabled}>
                              {test.name}
                              {disabled ? " (added)" : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Tests already in your evaluation are disabled in this list.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Custom test
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Log additional assessments not in the library.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetCustomForm();
                        setIsCustomFormOpen(true);
                      }}
                      disabled={isCustomFormOpen}
                      className="rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      Add custom test
                    </button>
                  </div>

                  {isCustomFormOpen && (
                    <div className="mt-3 space-y-3">
                      <input
                        value={customTestName}
                        onChange={(event) => setCustomTestName(event.target.value)}
                        placeholder="Test name"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={customTestRegion}
                          onChange={(event) => setCustomTestRegion(event.target.value as MSKRegion | 'other')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          {Object.entries(regionLabels).map(([regionKey, label]) => (
                            <option key={regionKey} value={regionKey}>
                              {label}
                            </option>
                          ))}
                          <option value="other">Other / General</option>
                        </select>
                        <select
                          value={customTestResult}
                          onChange={(event) => setCustomTestResult(event.target.value as EvaluationResult | '')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          <option value="">Result (optional)</option>
                          {RESULT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {RESULT_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={customTestNotes}
                        onChange={(event) => setCustomTestNotes(event.target.value)}
                        rows={2}
                        placeholder="Notes (optional)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetCustomForm();
                            setIsCustomFormOpen(false);
                          }}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomTest}
                          className="rounded-full bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9]"
                        >
                          Save custom test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-800">Selected Tests</p>
                <span className="text-xs text-slate-500">
                  {filteredEvaluationTests.length} selected
                  {detectedCaseRegion && filteredEvaluationTests.length !== evaluationTests.length && (
                    <span className="text-amber-600 ml-1">
                      ({evaluationTests.length - filteredEvaluationTests.length} filtered by region)
                    </span>
                  )}
                </span>
              </div>
              {filteredEvaluationTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  {detectedCaseRegion 
                    ? `Add or select tests for ${regionLabels[detectedCaseRegion]} to document your findings.`
                    : 'Add or select tests to document your findings.'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvaluationTests.map((entry) => {
                    const definition = getTestDefinition(entry.id);
                    const hasFields = definition && hasFieldDefinitions(definition);
                    const testDefinition = hasFields ? definition as MskTestDefinition : null;

                    return (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800">{entry.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {entry.region ? regionLabels[entry.region] : 'General'} · Source: {entry.source.toUpperCase()}
                            </p>
                            {entry.description && (
                              <p className="mt-1 text-[11px] text-slate-500">{entry.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvaluationTest(entry.id)}
                            className="text-xs text-slate-400 hover:text-rose-500"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Render specific fields if test has field definitions */}
                        {hasFields && testDefinition?.fields && testDefinition.fields.length > 0 ? (
                          <div className="space-y-4">
                            {/* Test-specific fields */}
                            <div className="space-y-3 bg-white rounded-lg p-3 border border-slate-100">
                              {testDefinition.fields.map((field) => (
                                <div key={field.id}>
                                  {renderFieldInput(
                                    field,
                                    entry.values?.[field.id] ?? null,
                                    (newValue) => {
                                      const updatedValues = { ...(entry.values ?? {}), [field.id]: newValue };
                                      updateEvaluationTest(entry.id, { values: updatedValues });
                                    },
                                    entry,
                                    updateEvaluationTest
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Result selection section */}
                            <div className="space-y-3 pt-2 border-t border-slate-200">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                  Status: {RESULT_LABELS[entry.result] || "Pending"}
                                </span>
                                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={entry.result === "positive" || entry.result === "abnormal"}
                                    onChange={(event) =>
                                      updateEvaluationTest(entry.id, {
                                        result: event.target.checked ? "positive" : "normal",
                                      })
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                                  />
                                  Abnormal result
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {RESULT_OPTIONS.map((option) => (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                                      entry.result === option
                                        ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-blue/30 hover:bg-primary-blue/5'
                                    }`}
                                  >
                                    {RESULT_LABELS[option]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Add Notes field - always available for manual entry, will be considered for second Vertex call */}
                                <div className="pt-2 border-t border-slate-200">
                                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Add Notes
                                  </label>
                                  <textarea
                                value={entry.notes || ''}
                                    onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                                    rows={2}
                                placeholder="Additional clinical notes, observations, or findings..."
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                                  />
                              <p className="mt-1 text-[10px] text-slate-400">
                                Notes will be included in the SOAP generation process.
                              </p>
                                </div>
                          </div>
                        ) : (
                          /* Fallback: generic form for tests without fields */
                          <>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                Status: {RESULT_LABELS[entry.result] || "Pending"}
                              </span>
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={entry.result === "positive"}
                                  onChange={(event) =>
                                    updateEvaluationTest(entry.id, {
                                      result: event.target.checked ? "positive" : "normal",
                                    })
                                  }
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                                />
                                Abnormal result
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {RESULT_OPTIONS.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                  className={`px-3 py-1.5 rounded-full text-xs transition ${
                                    entry.result === option
                                      ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-200'
                                  }`}
                                >
                                  {RESULT_LABELS[option]}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={entry.notes}
                              onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                              rows={3}
                              placeholder="Clinical notes, pain provocation, mobility restrictions..."
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-slate-500">
            Progress: {completedCount} of {totalTests} tests documented ({progressPercent}%)
          </div>
          <button
            onClick={handleGenerateSoap}
            disabled={filteredEvaluationTests.length === 0 || isGeneratingSOAP}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isGeneratingSOAP ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating SOAP Note...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate SOAP Note
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSoapTab = () => {

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
                Complete the analysis and physical evaluation tabs, then generate a SOAP note
              </p>
              <button
                onClick={handleGenerateSoap}
                disabled={!niagaraResults || physicalExamResults.length === 0 || isGeneratingSOAP}
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
            onSave={handleSaveSOAP}
            onRegenerate={handleRegenerateSOAP}
            onFinalize={handleFinalizeSOAP}
            onUnfinalize={handleUnfinalizeSOAP}
            onPreview={(soap) => {
              // Preview is handled internally by SOAPEditor component
              console.log('[Workflow] Clinical note preview requested', soap);
            }}
          />
        )}
      </div>
    );
  };

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
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Email verified · Access granted
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <nav className="flex flex-wrap gap-2">
          {[
            { id: "analysis", label: "1 · Initial Analysis" },
            { id: "evaluation", label: "2 · Physical Evaluation" },
            { id: "soap", label: "3 · SOAP Report" },
          ].map((tab) => (
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

        {activeTab === "analysis" && renderAnalysisTab()}
        {activeTab === "evaluation" && renderEvaluationTab()}
        {activeTab === "soap" && renderSoapTab()}
      </div>


      {/* Feedback Widget - Always visible for beta testing */}
      <FeedbackWidget />
    </div>
  );
};

export default ProfessionalWorkflowPage;
