// @ts-nocheck
// WO-08: Follow-up workflow page - Independent page for follow-up visits
// Hardcoded visitType = 'follow-up', no conditionals, minimal implementation

import { useEffect, useMemo, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, FileText, Users } from "lucide-react";
import { Timestamp } from "firebase/firestore";

// Hooks
import { useAuth } from "../hooks/useAuth";
import { useProfessionalProfile as useProfessionalProfileContext } from "../context/ProfessionalProfileContext";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useLastEncounter } from "../features/patient-dashboard/hooks/useLastEncounter";
import { usePatientVisitCount } from "../features/patient-dashboard/hooks/usePatientVisitCount";

// Services
import { PatientService, type Patient } from "../services/patientService";
import treatmentPlanService from "../services/treatmentPlanService";
import { SessionTypeService } from "../services/sessionTypeService";
import { deriveClinicName, deriveClinicianDisplayName } from "@/utils/clinicProfile";
import { generateFollowUpSOAPV2Raw } from "../services/vertex-ai-soap-service";
import { parsePlanToFocusItems } from "../utils/parsePlanToFocus";
import { FOLLOW_UP_PROMPT_V2 } from "../constants/followUpPromptV2";

// Components
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { SuggestedFocusEditor } from "../components/workflow/SuggestedFocusEditor";
import type { TodayFocusItem } from "../utils/parsePlanToFocus";
import type { SOAPNote, FollowUpAlerts, FollowUpPlanItem } from "../types/vertex-ai";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";

// Lazy load tabs
import { lazy } from "react";
const AnalysisTab = lazy(() => import("../components/workflow/tabs/AnalysisTab").then(m => ({ default: m.default })));
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

  // Consent state (simplified)
  const [workflowConsentStatus, setWorkflowConsentStatus] = useState<{
    hasValidConsent: boolean;
  } | null>(null);

  // SOAP state
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [soapError, setSoapError] = useState<string | null>(null);
  // WO-11.1: parsed ALERTS and plan[] for UI
  const [followUpAlerts, setFollowUpAlerts] = useState<FollowUpAlerts | null>(null);
  const [followUpPlanItems, setFollowUpPlanItems] = useState<FollowUpPlanItem[] | null>(null);

  // Today's focus (treatment plan)
  const [todayFocus, setTodayFocus] = useState<TodayFocusItem[]>([]);
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

  // Niagara processor
  const {
    processText,
    niagaraResults,
    isProcessing,
  } = useNiagaraProcessor();

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

    if (niagaraResults) {
      if (niagaraResults.red_flags && Array.isArray(niagaraResults.red_flags)) {
        contraindications.push(...niagaraResults.red_flags.filter(Boolean));
      }
    }

    return { allergies, contraindications };
  }, [currentPatient, niagaraResults]);

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

  // WO-11: Populate todayFocus from previous SOAP plan (last encounter)
  useEffect(() => {
    if (lastEncounter.loading || lastEncounter.error || !lastEncounter.data?.soap?.plan) {
      if (!lastEncounter.loading && !lastEncounter.error && !lastEncounter.data?.soap?.plan) {
        const count = 0;
        console.info('[WO-11][PROOF] todayTreatmentSession derived', { count });
      }
      return;
    }
    const planText =
      typeof lastEncounter.data.soap.plan === 'string'
        ? lastEncounter.data.soap.plan
        : JSON.stringify(lastEncounter.data.soap.plan ?? '');
    const items = parsePlanToFocusItems(planText);
    setTodayFocus(items);
    console.info('[WO-11][PROOF] todayTreatmentSession derived', { count: items.length });
  }, [lastEncounter.loading, lastEncounter.error, lastEncounter.data]);

  /**
   * WO-11: Handler único follow-up. Payload 4 fuentes + prompt v2. No análisis visible.
   */
  const handleGenerateSOAPFollowUp = useCallback(async () => {
    const followUpClinicalUpdate = (transcript?.trim() ?? '') || '';
    const hasChecklist = todayFocus.length > 0;
    const hasClinicalUpdate = followUpClinicalUpdate.length > 0;
    if (!hasChecklist && !hasClinicalUpdate) {
      setSoapError('Add at least one confirmed treatment or a clinical update to generate the SOAP note.');
      return;
    }

    setSoapError(null);
    setIsGeneratingSOAP(true);

    try {
      // WO-11 — 1.1 PATIENT_CONTEXT
      const lastVisitDate = lastEncounter.data?.encounterDate
        ? formatLastSessionDate(lastEncounter.data)
        : undefined;
      const patientContext = {
        patientId: patientIdFromUrl || demoPatient.id,
        demographics: {
          name:
            currentPatient?.fullName ||
            `${currentPatient?.firstName ?? ''} ${currentPatient?.lastName ?? ''}`.trim() ||
            demoPatient.name,
          email: currentPatient?.email ?? demoPatient.email,
          age: currentPatient?.dateOfBirth
            ? (() => {
                const dob = currentPatient?.dateOfBirth ?? (currentPatient as any)?.birthDate;
                return dob ? calculateAge(dob) : null;
              })()
            : null,
        },
        antecedents: patientClinicalInfo.allergies?.length || patientClinicalInfo.contraindications?.length ? patientClinicalInfo : undefined,
        consentStatus: workflowConsentStatus?.hasValidConsent ?? false,
        previousVisits: visitCount.data ?? undefined,
        lastVisitDate,
      };
      console.info('[WO-11][PROOF] patientContext ready', {
        keys: Object.keys(patientContext),
      });

      // WO-11 — 1.2 PREVIOUS_SOAP
      const previousSoap = lastEncounter.data?.soap ?? null;
      const hasPreviousSoap = Boolean(previousSoap);
      if (!hasPreviousSoap) {
        console.warn('[WO-11] No previous SOAP; continuing with empty baseline.');
      }
      console.info('[WO-11][PROOF] previousSOAP loaded', { hasPreviousSoap });

      // WO-11 — 1.3 TODAY_TREATMENT_SESSION (already in todayFocus; log)
      const todayTreatmentSession = todayFocus.map((i) => ({
        id: i.id,
        action: i.label,
        status: i.completed ? ('completed' as const) : ('not_performed' as const),
        notes: i.notes,
      }));
      console.info('[WO-11][PROOF] todayTreatmentSession derived', { count: todayTreatmentSession.length });

      // WO-11 — 1.4 FOLLOW_UP_CLINICAL_UPDATE
      const hasAttachments = false;
      console.info('[WO-11][PROOF] followUpClinicalUpdate ready', {
        chars: followUpClinicalUpdate.length,
        hasAttachments,
      });

      // WO-11 — 2. Prompt v2 (inmutable)
      const promptV2 = FOLLOW_UP_PROMPT_V2;
      const charCount = promptV2.length;
      const preview = promptV2.slice(0, 40).replace(/\n/g, ' ');
      console.info('[WO-11][PROOF] follow-up prompt loaded', { charCount, preview: `${preview}...` });

      // WO-11 — 3. Payload + full prompt
      const payloadText = [
        'PATIENT_CONTEXT:',
        JSON.stringify(patientContext, null, 2),
        '',
        'PREVIOUS_SOAP:',
        previousSoap ? JSON.stringify(previousSoap, null, 2) : 'No previous SOAP.',
        '',
        'TODAY_TREATMENT_SESSION:',
        JSON.stringify(todayTreatmentSession, null, 2),
        '',
        'FOLLOW_UP_CLINICAL_UPDATE:',
        followUpClinicalUpdate || '(No typed/transcribed update.)',
      ].join('\n');

      const fullPrompt = promptV2 + '\n\n---\n\nINPUT:\n\n' + payloadText;
      console.info('[WO-11][PROOF] payload ready', {
        hasPatientContext: true,
        hasPreviousSoap,
        countTodayFocus: todayTreatmentSession.length,
        clinicalUpdateChars: followUpClinicalUpdate.length,
      });

      const { raw, soap, alerts, planItems } = await generateFollowUpSOAPV2Raw(fullPrompt);

      const hasSOAP_NOTE = Boolean(soap);
      const hasALERTS = raw.includes('ALERTS') || raw.includes('none');
      console.info('[WO-11][PROOF] vertex response received', { hasSOAP_NOTE, hasALERTS });

      if (!soap) {
        setSoapError('SOAP generation returned no result. Please try again.');
        return;
      }

      setLocalSoapNote(soap);
      setFollowUpAlerts(alerts ?? null);
      setFollowUpPlanItems(planItems ?? null);
    } catch (err: any) {
      const message = err?.message || 'Failed to generate SOAP note. Please try again.';
      setSoapError(message);
      console.error('[FollowUpWorkflow] handleGenerateSOAPFollowUp error:', err);
    } finally {
      setIsGeneratingSOAP(false);
    }
  }, [
    todayFocus,
    transcript,
    currentPatient,
    patientIdFromUrl,
    lastEncounter.data,
    visitCount.data,
    patientClinicalInfo,
    workflowConsentStatus,
    formatLastSessionDate,
    calculateAge,
  ]);

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

  const isFirstSession = false; // TODO: Determine from lastEncounter

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
                {/* Consent Status */}
                {workflowConsentStatus?.hasValidConsent ? (
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

              {/* Visit Type Indicator */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light mb-2">Visit Type</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900 font-apple">
                    Follow-up visit
                  </span>
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

          {/* SECCIÓN 2: Today's treatment session */}
          {todayFocus.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">🗓️</span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">
                    Today's treatment session
                  </h2>
                  <p className="text-sm text-slate-600">
                    Confirm or adjust what was planned previously.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Today's treatment confirmed</span>
                </div>
              </div>
              <SuggestedFocusEditor
                items={todayFocus}
                onChange={setTodayFocus}
                onFinishSession={undefined}
                hideHeader={true}
              />
            </div>
          )}

          {/* SECCIÓN 3: Follow-up clinical update */}
          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <p className="text-xs text-slate-500 mb-3 font-apple font-light">
              Based on the initial assessment and previous sessions.
            </p>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">📝</span>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Follow-up clinical update
                </h2>
                <p className="text-sm text-slate-600">
                  Update based on patient response, progress, setbacks, and modifications applied today.
                </p>
              </div>
              {transcript?.trim() && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Clinical update captured</span>
                </div>
              )}
            </div>
            <Suspense fallback={<LoadingSpinner />}>
              <AnalysisTab
                currentPatient={currentPatient}
                patientIdFromUrl={patientIdFromUrl}
                patientClinicalInfo={patientClinicalInfo}
                calculateAge={calculateAge}
                consentStatus={null}
                consentPending={false}
                consentToken={null}
                consentLink={null}
                smsError={null}
                user={user}
                setConsentStatus={() => {}}
                setPatientHasConsent={() => {}}
                setConsentPending={() => {}}
                setSmsError={() => {}}
                handleCopyConsentLink={() => {}}
                handleResendConsentSMS={() => {}}
                lastEncounter={lastEncounter}
                isFirstSession={isFirstSession}
                formatLastSessionDate={formatLastSessionDate}
                visitType={visitType}
                visitCount={visitCount}
                sessionTypeConfig={sessionTypeConfig}
                previousTreatmentPlan={previousTreatmentPlan}
                setIsInitialPlanModalOpen={() => {}}
                physioNotes={''}
                setPhysioNotes={() => {}}
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
                attachments={[]}
                isUploadingAttachment={false}
                attachmentError={null}
                removingAttachmentId={null}
                handleAttachmentUpload={() => {}}
                handleAttachmentRemove={() => {}}
                niagaraResults={niagaraResults}
                interactiveResults={null}
                selectedEntityIds={[]}
                setSelectedEntityIds={() => {}}
                continueToEvaluation={() => {}}
                analysisError={null}
                successMessage={null}
                setAnalysisError={() => {}}
                setSuccessMessage={() => {}}
                onTodayFocusChange={setTodayFocus}
                onFinishSession={undefined}
                hideHeader={true}
              />
            </Suspense>
          </div>

          {/* SECCIÓN 4: Documentation (SOAP) */}
          <div className="bg-white border border-blue-200 rounded-lg p-6" data-section="soap">
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
                niagaraResults={niagaraResults}
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
        </div>
      </div>
    </div>
  );
};

export default FollowUpWorkflowPage;
