// @ts-nocheck
// WO-08: Follow-up workflow page — PARALLEL PATH (not initial assessment).
//
// Follow-up does NOT use Niagara/analyze (no highlights, no physical tests, no biopsychosocial).
// Hydration for Vertex = exactly three inputs:
//   1. Patient data (who + injury/condition) — from baseline SOAP (previous evaluation).
//   2. Exercises: in-clinic treatment today + home program (HEP) — from UI checklists.
//   3. Clinical notes — from transcription area (what the clinician captured this visit).
// Output = SOAP only (updated note). No analysis JSON, no intermediate highlights.

import { useEffect, useMemo, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, FileText, Users } from "lucide-react";
import { Timestamp } from "firebase/firestore";

// Hooks
import { useAuth } from "../hooks/useAuth";
import { useProfessionalProfile as useProfessionalProfileContext } from "../context/ProfessionalProfileContext";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import { useLastEncounter } from "../features/patient-dashboard/hooks/useLastEncounter";
import { usePatientVisitCount } from "../features/patient-dashboard/hooks/usePatientVisitCount";

// Services
import { PatientService, type Patient } from "../services/patientService";
import treatmentPlanService from "../services/treatmentPlanService";
import { SessionTypeService } from "../services/sessionTypeService";
import { deriveClinicName, deriveClinicianDisplayName } from "@/utils/clinicProfile";
import { generateFollowUpSOAPV2Raw } from "../services/vertex-ai-soap-service";
import { derivePlanFromText } from "../utils/derivePlanFromText";
import { getClinicalState, type ClinicalState } from "../services/clinicalStateService";
import { buildFollowUpPromptV3 } from "../core/soap/followUp/buildFollowUpPromptV3";
import { resolveConsentChannel } from "../domain/consent/resolveConsentChannel";

// Components
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { SuggestedFocusEditor } from "../components/workflow/SuggestedFocusEditor";
import { HomeProgramBlock } from "../components/workflow/HomeProgramBlock";
import type { TodayFocusItem } from "../utils/parsePlanToFocus";
import type { SOAPNote, FollowUpAlerts, FollowUpPlanItem } from "../types/vertex-ai";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";

// WO-14: Follow-up uses FollowUpConversationCapture (no AnalysisTab)
import { FollowUpConversationCapture } from "../components/followup";
import { ConsentGateScreen } from "../components/consent/ConsentGateScreen";
import { lazy } from "react";
const SOAPTab = lazy(() => import("../components/workflow/tabs/SOAPTab").then(m => ({ default: m.default })));

// Types
type VisitType = 'follow-up';

const demoPatient = {
  id: "CA-TEST-001",
  name: "Sofia Bennett",
  email: "sofia.bennett@example.com",
};

const FollowUpWorkflowPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const patientIdFromUrl = searchParams.get('patientId');
  
  // Hardcoded for follow-up
  const visitType: VisitType = 'follow-up';
  const sessionTypeFromUrl = 'followup' as const;

  // Patient state
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  // SOAP state
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);
  // WO-11.1: parsed ALERTS and plan[] for UI
  const [followUpAlerts, setFollowUpAlerts] = useState<FollowUpAlerts | null>(null);
  const [followUpPlanItems, setFollowUpPlanItems] = useState<FollowUpPlanItem[] | null>(null);

  // WO-12: ref for auto-navigate to Documentation on SOAP success
  const documentationSectionRef = useRef<HTMLDivElement | null>(null);
  // WO-13.1: ref for auto-scroll to Clinical Conversation Capture when activity is completed
  const clinicalConversationRef = useRef<HTMLDivElement | null>(null);

  // WO-FOLLOWUP-UI-GATE-002: single source of truth — ClinicalState only
  const [clinicalStateLoading, setClinicalStateLoading] = useState(true);
  const [clinicalState, setClinicalState] = useState<ClinicalState | null>(null);

  // WO-FU-PLAN-SPLIT-01: In-clinic (checkboxes) vs HEP (no checkbox); HEP compliance (what patient did at home)
  const [inClinicItems, setInClinicItems] = useState<TodayFocusItem[]>([]);
  const [homeProgramItems, setHomeProgramItems] = useState<TodayFocusItem[]>([]);
  const [hepComplianceNotes, setHepComplianceNotes] = useState<string>('');
  const [previousTreatmentPlan, setPreviousTreatmentPlan] = useState<any>(null);

  // Hooks
  const { user } = useAuth();
  const { profile: professionalProfile } = useProfessionalProfileContext();
  const patientId = patientIdFromUrl || demoPatient.id;
  const lastEncounter = useLastEncounter(patientId);
  const visitCount = usePatientVisitCount(patientId);

  // Transcript hook
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

  // Follow-up path: no Niagara/analysis. Vertex is hydrated only with baseline + exercises + transcript → SOAP only.
  const isProcessing = isGeneratingSOAP;

  // Session type config
  const currentSessionType = sessionTypeFromUrl;
  const sessionTypeConfig = SessionTypeService.getSessionTypeConfig(currentSessionType);

  // Professional profile
  const clinicName = useMemo(
    () => deriveClinicName(professionalProfile),
    [professionalProfile]
  );

  const safeProfile = useMemo(
    () => (professionalProfile?.uid === user?.uid ? professionalProfile : null),
    [professionalProfile, user?.uid]
  );

  const clinicianDisplayName = useMemo(
    () => deriveClinicianDisplayName(safeProfile, user),
    [safeProfile, user]
  );

  // Helper functions
  const formatLastSessionDate = useCallback((encounter: any) => {
    if (!encounter?.encounterDate) return null;
    const date = encounter.encounterDate instanceof Timestamp
      ? encounter.encounterDate.toDate()
      : encounter.encounterDate instanceof Date
        ? encounter.encounterDate
        : new Date(encounter.encounterDate);
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }, []);

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

  const patientClinicalInfo = useMemo(() => {
    const allergies: string[] = [];
    const contraindications: string[] = [];

    if (currentPatient?.allergies) {
      if (typeof currentPatient.allergies === 'string') {
        const parsed = currentPatient.allergies.trim();
        if (parsed) {
          allergies.push(...parsed.split(/[,;]/).map(a => a.trim()).filter(Boolean));
        }
      } else if (Array.isArray(currentPatient.allergies)) {
        allergies.push(...currentPatient.allergies.filter(Boolean));
      }
    }

    // Follow-up path: no Niagara; contraindications from patient only (no analysis red_flags).
    if (currentPatient?.contraindications) {
      if (typeof currentPatient.contraindications === 'string') {
        const parsed = currentPatient.contraindications.trim();
        if (parsed) contraindications.push(...parsed.split(/[,;]/).map(c => c.trim()).filter(Boolean));
      } else if (Array.isArray(currentPatient.contraindications)) {
        contraindications.push(...currentPatient.contraindications.filter(Boolean));
      }
    }

    return { allergies, contraindications };
  }, [currentPatient]);

  // Load patient
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
        }
      } catch (error) {
        console.error('[FollowUpWorkflow] Error loading patient:', error);
      } finally {
        setLoadingPatient(false);
      }
    };

    loadPatient();
  }, [patientIdFromUrl]);

  // Load treatment plan
  useEffect(() => {
    const loadTreatmentPlan = async () => {
      try {
        const plan = await treatmentPlanService.getTreatmentPlan(patientId);
        if (plan) {
          setPreviousTreatmentPlan(plan);
        }
      } catch (error) {
        console.error('[FollowUpWorkflow] Failed to load treatment plan:', error);
      }
    };

    loadTreatmentPlan();
  }, [patientId]);

  // WO-FOLLOWUP-UI-GATE-002: single call to getClinicalState on mount — UI only obeys ClinicalState
  useEffect(() => {
    if (!patientId?.trim() || !user?.uid) {
      setClinicalStateLoading(false);
      setClinicalState(null);
      return;
    }
    let cancelled = false;
    setClinicalStateLoading(true);
    setClinicalState(null);
    getClinicalState(patientId, user.uid)
      .then((state) => {
        if (!cancelled) setClinicalState(state);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[FollowUpWorkflow] getClinicalState error:', err);
          setClinicalState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setClinicalStateLoading(false);
      });
    return () => { cancelled = true; };
  }, [patientId, user?.uid]);

  // Derived from ClinicalState (single source of truth)
  const followUpBlockedReason: 'no-baseline' | 'no-consent' | null =
    clinicalState == null ? null
      : !clinicalState.hasBaseline ? 'no-baseline'
      : !clinicalState.consent.hasValidConsent ? 'no-consent'
      : null;
  const followUpReady = clinicalState?.hasBaseline === true && clinicalState?.consent.hasValidConsent === true;
  const isFirstSession = clinicalState?.isFirstSession ?? false;

  // WO-FU-PLAN-SPLIT-01: derive In-Clinic vs HEP from baselineSOAP.plan (presentation only)
  useEffect(() => {
    if (!clinicalState?.baselineSOAP?.plan) {
      setInClinicItems([]);
      setHomeProgramItems([]);
      return;
    }
    const derived = derivePlanFromText(clinicalState.baselineSOAP.plan);
    setInClinicItems(
      derived.inClinic.map((label, i) => ({
        id: `in-clinic-${i}`,
        label,
        completed: false,
        source: 'plan' as const,
      }))
    );
    setHomeProgramItems(
      derived.homeProgram.map((label, i) => ({
        id: `hep-${i}`,
        label,
        completed: false,
        source: 'plan' as const,
      }))
    );
  }, [clinicalState?.baselineSOAP?.plan]);

  /**
   * WO-11 + WO-FOLLOWUP-UI-GATE-002: Handler único follow-up.
   * Solo se llama cuando followUpReady (ClinicalState); se obtiene baseline completo para el prompt.
   */
  const handleGenerateSOAPFollowUp = useCallback(async () => {
    if (!clinicalState?.hasBaseline) {
      setSoapError('Follow-up requires prior clinical baseline.');
      return;
    }
    const followUpClinicalUpdate = (transcript?.trim() ?? '') || '';
    const hasChecklist = inClinicItems.length > 0;
    const hasClinicalUpdate = followUpClinicalUpdate.length > 0;
    if (!hasChecklist && !hasClinicalUpdate) {
      setSoapError('Add at least one confirmed treatment or a clinical update to generate the SOAP note.');
      return;
    }

    setSoapError(null);
    setIsGeneratingSOAP(true);

    try {
      // WO-IA-CLOSE-01: use persisted baseline from clinicalState (no buildFollowUpClinicalBaseline as primary)
      if (!clinicalState?.baselineSOAP) {
        setSoapError('Follow-up requires prior clinical baseline.');
        setIsGeneratingSOAP(false);
        return;
      }
      const fullPrompt = buildFollowUpPromptV3({
        baselineSOAP: {
          subjective: clinicalState.baselineSOAP.subjective ?? '',
          objective: clinicalState.baselineSOAP.objective ?? '',
          assessment: clinicalState.baselineSOAP.assessment ?? '',
          plan: clinicalState.baselineSOAP.plan ?? '',
          date: clinicalState.baselineSOAP.date,
          encounterId: clinicalState.baselineSOAP.encounterId,
        },
        clinicalUpdate: followUpClinicalUpdate,
        inClinicItems: inClinicItems.length > 0 ? inClinicItems.map((i) => i.label) : undefined,
        homeProgram: homeProgramItems.length > 0 ? homeProgramItems.map((i) => i.label) : undefined,
      });

      const { raw, soap, alerts, planItems } = await generateFollowUpSOAPV2Raw(fullPrompt);

      const hasSOAP_NOTE = Boolean(soap);
      const hasALERTS = raw.includes('ALERTS') || raw.includes('none');
      if (process.env.NODE_ENV === 'development') {
        console.info('[WO-11][PROOF] vertex response received', { hasSOAP_NOTE, hasALERTS });
      }

      if (!soap) {
        setSoapError('SOAP generation returned no result. Please try again.');
        return;
      }

      const emptyOrPlaceholder = (s: string) => !s?.trim() || s.trim().toLowerCase() === 'not documented.';
      if (
        emptyOrPlaceholder(soap.subjective) &&
        emptyOrPlaceholder(soap.objective) &&
        emptyOrPlaceholder(soap.assessment) &&
        emptyOrPlaceholder(soap.plan)
      ) {
        setSoapError('SOAP invalid / missing fields. Please try again or enter manually.');
        return;
      }

      setLocalSoapNote(soap);
      setFollowUpAlerts(alerts ?? null);
      setFollowUpPlanItems(planItems ?? null);
      setSoapError(null);
      setTimeout(() => documentationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err: any) {
      const message = err?.message || 'Failed to generate SOAP note. Please try again.';
      setSoapError(message);
      console.error('[FollowUpWorkflow] handleGenerateSOAPFollowUp error:', err);
    } finally {
      setIsGeneratingSOAP(false);
    }
  }, [clinicalState?.hasBaseline, patientId, inClinicItems, homeProgramItems, transcript, hepComplianceNotes]);

  const handleAnalyzeWithVertex = handleGenerateSOAPFollowUp;
  const handleGenerateSoap = handleGenerateSOAPFollowUp;

  const handleSaveSOAP = async () => {
    // TODO: Implement
  };

  const handleRegenerateSOAP = async () => {
    // TODO: Implement
  };

  const handleFinalizeSOAP = async () => {
    // TODO: Implement
  };

  const handleUnfinalizeSOAP = async () => {
    // TODO: Implement
  };

  if (loadingPatient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // WO-FOLLOWUP-UI-GATE-002: ClinicalState loading → spinner
  if (clinicalStateLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner />
          <p className="text-sm text-slate-600 font-apple font-light">Checking clinical history…</p>
        </div>
      </div>
    );
  }

  const showFollowUpFlow = followUpReady;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.02em] text-slate-400 font-apple font-light">AiduxCare <span className="ml-1">🍁</span></p>
            <p className="text-[15px] font-medium text-slate-800 font-apple">Follow-up Visit — Canada</p>
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
        {/* Layout vertical - 4 secciones */}
        <div className="space-y-6">
          {/* SECCIÓN 1: Patient context (READ-ONLY) */}
          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Patient context</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Patient Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light mb-2">Patient</p>
                <p className="text-lg font-semibold text-slate-900 font-apple">
                  {currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || demoPatient.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-slate-500 font-apple font-light">{currentPatient?.email || demoPatient.email}</p>
                  {(() => {
                    const dob = currentPatient?.dateOfBirth || (currentPatient as any)?.birthDate;
                    const age = dob ? calculateAge(dob) : null;
                    return age !== null ? (
                      <span className="text-sm text-slate-500 font-apple font-light">
                        · {age} years
                      </span>
                    ) : null;
                  })()}
                </div>
                {/* Red Flags */}
                {(patientClinicalInfo.allergies || patientClinicalInfo.contraindications) && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    {patientClinicalInfo.allergies && (
                      <div className="flex items-start gap-2">
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
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-800 font-apple">Contraindications</p>
                          <p className="text-xs text-red-700 font-apple font-light mt-0.5">
                            {patientClinicalInfo.contraindications.slice(0, 2).join('; ')}
                            {patientClinicalInfo.contraindications.length > 2 && ` (+${patientClinicalInfo.contraindications.length - 2} more)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Consent Status — from ClinicalState only */}
                {clinicalState?.consent.hasValidConsent ? (
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-slate-600 font-apple font-light">
                      Consent valid (ON)
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-800 font-apple">
                            Consent Required
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Last Session */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light">Last Session</p>
                </div>
                {lastEncounter.loading ? (
                  <p className="text-sm text-slate-500 font-apple font-light">Loading...</p>
                ) : lastEncounter.error ? (
                  <p className="text-sm text-red-600 font-apple font-light">Error loading session</p>
                ) : lastEncounter.data ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 font-apple">
                      {formatLastSessionDate(lastEncounter.data) || 'Previous session'}
                    </p>
                    {lastEncounter.data.soap && (
                      <button
                        onClick={() => {
                          const sessionId = lastEncounter.data?.sessionId || lastEncounter.data?.id;
                          if (sessionId) {
                            window.open(`/documents?session=${sessionId}`, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline font-apple font-light"
                      >
                        View last SOAP note →
                      </button>
                    )}
                  </div>
                ) : isFirstSession ? (
                  <p className="text-sm text-slate-700 font-apple font-light">First session</p>
                ) : (
                  <p className="text-sm text-slate-500 font-apple font-light">No previous sessions</p>
                )}
              </div>

              {/* Visit Type Indicator — session ordinal: Follow-up = Second / Third / … */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light mb-2">Visit Type</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-900 font-apple">
                      Follow-up visit
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-apple font-light">
                    {(['Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'][(visitCount.data ?? 1) - 1] ?? `Session ${(visitCount.data ?? 0) + 1}`) + ' session'}
                  </p>
                </div>
                {previousTreatmentPlan && (
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-slate-600 font-apple font-light">Previous treatment plan loaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* WO-IA-CLOSE-01: No baseline (no activeBaselineId) → block with message */}
          {followUpBlockedReason === 'no-baseline' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
              <h2 className="text-lg font-semibold text-amber-900 mb-2">Follow-up no disponible</h2>
              <p className="text-slate-700 font-apple font-light max-w-xl mx-auto">
                Initial assessment required before follow-up.
              </p>
            </div>
          )}

          {/* WO-FOLLOWUP-UI-GATE-002: Baseline exists but no consent → ConsentGateScreen; no recording, no SOAP */}
          {followUpBlockedReason === 'no-consent' && clinicalState && (
            <ConsentGateScreen
              patientId={patientId}
              patientName={currentPatient?.fullName || `${currentPatient?.firstName || ''} ${currentPatient?.lastName || ''}`.trim() || undefined}
              clinicName={clinicName ?? undefined}
              consentResolution={resolveConsentChannel({
                hasValidConsent: false,
                isDeclined: clinicalState.consent.status === 'declined',
                jurisdiction: 'CA-ON',
                isFirstSession: clinicalState.isFirstSession,
              })}
            />
          )}

          {/* In-clinic treatment (proposed for today): editable; check when performed in clinic */}
          {showFollowUpFlow && inClinicItems.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">🟦</span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">
                    In-clinic treatment (proposed for today)
                  </h2>
                  <p className="text-sm text-slate-600">
                    Proposed treatment for this session. Modify as needed. Check when performed in clinic today. Add notes (dictated or typed) per item if needed.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>In-clinic</span>
                </div>
              </div>
              <SuggestedFocusEditor
                items={inClinicItems}
                onChange={setInClinicItems}
                onFinishSession={undefined}
                hideHeader={true}
                conversationSectionRef={clinicalConversationRef}
              />
            </div>
          )}

          {/* What the patient did at home (HEP compliance): dictated or typed */}
          {showFollowUpFlow && (
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-lg">📋</span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 font-apple">
                    What the patient did at home (HEP compliance)
                  </h2>
                  <p className="text-sm text-slate-600 font-apple font-light mt-1">
                    What did the patient report doing at home since last visit? (e.g. completed exercises, partial, barriers). Dictated or typed.
                  </p>
                </div>
              </div>
              <textarea
                value={hepComplianceNotes}
                onChange={(e) => setHepComplianceNotes(e.target.value)}
                placeholder="e.g. Completed ROM 3x/day; did not do strengthening due to pain. Patient reports better compliance this week."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple resize-y min-h-[80px]"
                rows={3}
              />
            </div>
          )}

          {/* Home Exercise Program (HEP): prescribed for home; edit as needed; allow adding items */}
          {showFollowUpFlow && (
            <HomeProgramBlock items={homeProgramItems} onChange={setHomeProgramItems} allowAdd={true} />
          )}

          {/* SECCIÓN 3: Clinical Conversation Capture — WO-FOLLOWUP-UI-GATE-002: only when followUpReady (ClinicalState) */}
          {showFollowUpFlow && (
          <div ref={clinicalConversationRef} className="bg-white border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🎙️</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Clinical Conversation Capture
                </h2>
                <p className="text-sm text-slate-600">
                  Capture patient response, progress, setbacks, and modifications for the SOAP note.
                </p>
              </div>
              {transcript?.trim() && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Clinical update captured</span>
                </div>
              )}
            </div>
            {/* WO-14: Follow-up–only capture; no AnalysisTab, no duplicate Today's treatment session */}
            <FollowUpConversationCapture
              visitType="follow-up"
              transcript={transcript}
              setTranscript={setTranscript}
              onGenerateSoap={handleGenerateSOAPFollowUp}
              isLoading={isGeneratingSOAP}
              recordingTime={recordingTime}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              transcriptError={transcriptError}
              transcriptMeta={transcriptMeta}
              languagePreference={languagePreference}
              setLanguagePreference={setLanguagePreference}
              mode={mode}
              setMode={setMode}
              isTranscribing={isTranscribing}
              isProcessing={isGeneratingSOAP}
              audioStream={audioStream ?? null}
            />
          </div>
          )}

          {/* SECCIÓN 4: Documentation (SOAP) — only when followUpReady (WO-FOLLOWUP-UI-GATE-002) */}
          {showFollowUpFlow && (
          <div ref={documentationSectionRef} className="bg-white border border-blue-200 rounded-lg p-6" data-section="soap">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">📝</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Documentation
                </h2>
                <p className="text-sm text-slate-600">
                  Review and finalize your SOAP note.
                </p>
              </div>
              {localSoapNote && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>SOAP note generated</span>
                </div>
              )}
            </div>

            {/* WO-11.1: ALERTS (red / yellow) */}
            {followUpAlerts && !followUpAlerts.none && (
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Clinical alerts</h3>
                {followUpAlerts.red_flags && followUpAlerts.red_flags.length > 0 && (
                  <div className="space-y-2">
                    {followUpAlerts.red_flags.map((flag, i) => (
                      <div
                        key={`red-${i}`}
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
                      >
                        <p className="font-semibold text-red-800">{flag.label}</p>
                        {flag.evidence && <p className="mt-1 text-red-700">{flag.evidence}</p>}
                        {flag.suggested_action && (
                          <p className="mt-1 text-red-600 italic">Suggested: {flag.suggested_action}</p>
                        )}
                        {flag.urgency && (
                          <span className="mt-2 inline-block text-xs font-medium text-red-600">
                            Urgency: {flag.urgency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {followUpAlerts.yellow_flags && followUpAlerts.yellow_flags.length > 0 && (
                  <div className="space-y-2">
                    {followUpAlerts.yellow_flags.map((flag, i) => (
                      <div
                        key={`yellow-${i}`}
                        className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm"
                      >
                        <p className="font-semibold text-amber-800">{flag.label}</p>
                        {flag.evidence && <p className="mt-1 text-amber-700">{flag.evidence}</p>}
                        {flag.suggested_action && (
                          <p className="mt-1 text-amber-600 italic">Suggested: {flag.suggested_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {followUpAlerts.medico_legal && followUpAlerts.medico_legal.length > 0 && (
                  <div className="space-y-2">
                    {followUpAlerts.medico_legal.map((flag, i) => (
                      <div
                        key={`ml-${i}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm"
                      >
                        <p className="font-semibold text-slate-800">{flag.label}</p>
                        {flag.evidence && <p className="mt-1 text-slate-700">{flag.evidence}</p>}
                        {flag.suggested_action && (
                          <p className="mt-1 text-slate-600 italic">Suggested: {flag.suggested_action}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WO-11.1: Plan checklist (for next follow-up) */}
            {followUpPlanItems && followUpPlanItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Plan items (for next session)</h3>
                <ul className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {followUpPlanItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2 text-sm">
                      <span
                        className={
                          item.status === 'completed'
                            ? 'text-emerald-600'
                            : item.status === 'modified'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }
                      >
                        {item.status === 'completed' ? '✓' : '○'} {item.action}
                      </span>
                      {item.notes && <span className="text-slate-500">— {item.notes}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Suspense fallback={<LoadingSpinner />}>
              <SOAPTab
                localSoapNote={localSoapNote}
                soapStatus={soapStatus}
                visitType={visitType}
                isGeneratingSOAP={isGeneratingSOAP}
                patientId={patientId}
                sessionId={null}
                handleGenerateSoap={handleGenerateSoap}
                handleSaveSOAP={handleSaveSOAP}
                handleRegenerateSOAP={handleRegenerateSOAP}
                handleFinalizeSOAP={handleFinalizeSOAP}
                handleUnfinalizeSOAP={handleUnfinalizeSOAP}
                setIsShareMenuOpen={() => {}}
                workflowMetrics={null}
                workflowRoute={null}
                soapTokenOptimization={undefined}
                niagaraResults={null}
                followUpHasContent={Boolean(transcript?.trim() || inClinicItems.length > 0 || homeProgramItems.length > 0)}
                transcript={transcript}
                physicalExamResults={[]}
                treatmentReminder={null}
                analysisError={soapError}
                successMessage={null}
                setAnalysisError={setSoapError}
                setSuccessMessage={() => {}}
                setVisitType={() => {}}
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
                attachments={[]}
                isUploadingAttachment={false}
                attachmentError={null}
                removingAttachmentId={null}
                handleAttachmentUpload={() => {}}
                handleAttachmentRemove={() => {}}
              />
            </Suspense>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowUpWorkflowPage;
