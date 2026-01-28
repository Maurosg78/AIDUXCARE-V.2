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
}) => {
  // WO-FLOW-005: Estado local para focos clínicos editables
  const [todayFocus, setTodayFocus] = useState<TodayFocusItem[]>([]);
  
  // Exponer cambios de focos al padre (para contexto de SOAP)
  const handleFocusChange = (focus: TodayFocusItem[]) => {
    setTodayFocus(focus);
    onTodayFocusChange?.(focus);
  };

  // WO-05-FIX: Mapping explícito del treatment plan a todayFocus
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

  // WO-05-FIX: Log de evidencia cuando se renderiza el componente
  useEffect(() => {
    if (visitType === 'follow-up' && todayFocus.length > 0) {
      console.info(
        '[WO-05-FIX][PROOF] Rendering Today\'s treatment session',
        { 
          count: todayFocus.length, 
          items: todayFocus.map(i => ({ id: i.id, label: i.label, completed: i.completed })) 
        }
      );
    }
  }, [visitType, todayFocus]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl sm:text-4xl font-light text-slate-900 tracking-[-0.02em] leading-[1.1] font-apple mb-3">
          Professional Workflow
        </h1>
        <p className="text-lg text-slate-500 font-light leading-[1.3] font-apple">
          Canada · Patient data stored under PHIPA/PIPEDA controls · Clinical AI processing verified.
        </p>
      </header>

      {/* WO-FLOW-005: Suggested Focus Editor (solo en follow-up) */}
      {visitType === 'follow-up' && todayFocus.length > 0 && (
        <SuggestedFocusEditor
          items={todayFocus}
          onChange={handleFocusChange}
          onFinishSession={onFinishSession}
        />
      )}

      {/* ✅ FOLLOW-UP: Header específico para follow-up conversation (sin duplicación de focus) */}
      {visitType === 'follow-up' && todayFocus.length === 0 && (
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Column 1: PATIENT */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light">Patient</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 font-apple">
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
            
          {/* Clinical Information: Allergies and Contraindications */}
          {(patientClinicalInfo.allergies || patientClinicalInfo.contraindications) && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
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
          {consentStatus && (consentStatus === 'ongoing' || consentStatus === 'session-only') && (
            <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue font-apple"
              />
              <span className="text-xs text-slate-600 font-apple font-light">
                Consent approved
              </span>
            </div>
          )}
          {/* Consent Required Banner */}
          {!consentStatus && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-800 font-apple">
                      Consent Required
                    </p>
                    <p className="mt-1 text-xs text-red-700 font-apple font-light">
                      {smsError 
                        ? `SMS delivery failed: ${smsError}. Please use verbal consent or try sending SMS again.`
                        : consentLink
                        ? 'Consent link sent to patient via SMS. Waiting for patient to provide consent.'
                        : 'Patient consent is required. Please obtain verbal consent or send consent link via SMS.'}
                    </p>
                  </div>
                </div>
                {consentLink ? (
                  <div className="flex flex-wrap gap-2">
                    {/* ✅ WO-CONSENT-GATE-UI-01: "Mark Authorized" removed - consent must be obtained via ConsentGateScreen */}
                    <button
                      type="button"
                      onClick={() => {
                        window.open('/privacy-policy', '_blank', 'noopener,noreferrer');
                      }}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition font-apple min-h-[32px]"
                    >
                      Read Privacy Policy
                    </button>
                    <button
                      type="button"
                      onClick={handleResendConsentSMS}
                      disabled={!currentPatient || !user}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition font-apple min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Re-send SMS
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleResendConsentSMS}
                      disabled={!currentPatient || !user}
                      className="inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-primary-blue to-primary-purple px-3 py-1.5 text-xs font-medium text-white hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-apple min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Consent via SMS
                    </button>
                    {/* ✅ WO-CONSENT-GATE-UI-01: "Mark Manual Consent" removed - consent must be obtained via ConsentGateScreen */}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Column 2: LAST SESSION */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
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
              {lastEncounter.data.soap?.subjective && (
                <p className="text-xs text-slate-500 font-apple font-light mt-1 line-clamp-2">
                  {lastEncounter.data.soap.subjective.substring(0, 60)}...
                </p>
              )}
            </div>
          ) : isFirstSession === true ? (
            <p className="text-sm text-slate-700 font-apple font-light">First session</p>
          ) : (
            <p className="text-sm text-slate-500 font-apple font-light">No previous sessions</p>
          )}
        </div>

        {/* Column 3: TODAY'S PLAN */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-xs uppercase tracking-wide text-slate-400 font-apple font-light">Today's Plan</p>
            <span className="ml-auto text-xs font-semibold text-slate-600 font-apple">
              {visitCount.loading ? '...' : visitCount.data ? `#${visitCount.data + 1}` : '#1'}
            </span>
          </div>
            
          {/* Session Type */}
          <p className="text-sm font-semibold text-slate-900 font-apple mb-1">
            {sessionTypeConfig.label}
          </p>
            
          {/* WO-FLOW-005: En follow-up, el plan previo se muestra en SuggestedFocusEditor (arriba) */}
          {/* Aquí solo mostramos información de referencia si NO hay focos editables */}
          {visitType === 'follow-up' && todayFocus.length === 0 && previousTreatmentPlan && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-apple font-light italic">
                Review previous plan above to set today's focus
              </p>
            </div>
          )}
          
          {/* Initial assessment: mostrar plan previo si existe (read-only) */}
          {visitType === 'initial' && previousTreatmentPlan && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              {previousTreatmentPlan.nextSessionFocus && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 font-apple mb-1">Previous focus:</p>
                  <p className="text-xs text-slate-600 font-apple font-light">
                    {previousTreatmentPlan.nextSessionFocus}
                  </p>
                </div>
              )}
            </div>
          )}
            
          {/* Fallback: Last Visit Summary (solo si no hay plan estructurado y no es follow-up con focos) */}
          {!previousTreatmentPlan && lastEncounter.data && lastEncounter.data.soap && visitType !== 'follow-up' && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-700 font-apple mb-1">Last visit:</p>
                {lastEncounter.data.interventions && lastEncounter.data.interventions.length > 0 ? (
                  <ul className="text-xs text-slate-600 font-apple font-light space-y-0.5">
                    {lastEncounter.data.interventions.slice(0, 2).map((intervention: any, idx: number) => (
                      <li key={idx}>• {intervention.type}: {intervention.description}</li>
                    ))}
                    {lastEncounter.data.interventions.length > 2 && (
                      <li className="text-slate-400">+{lastEncounter.data.interventions.length - 2} more</li>
                    )}
                  </ul>
                ) : lastEncounter.data.soap.plan ? (
                  <p className="text-xs text-slate-600 font-apple font-light line-clamp-2">
                    {lastEncounter.data.soap.plan.substring(0, 80)}...
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-apple font-light italic">No interventions documented</p>
                )}
              </div>
            </div>
          )}
            
          {/* First Session Message or No Plan Warning */}
          {!lastEncounter.loading && !lastEncounter.data && !previousTreatmentPlan && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-apple font-light italic mb-2">First session - Initial assessment</p>
            </div>
          )}
            
          {/* Show option to create initial plan for existing patients without Plan */}
          {visitType === 'follow-up' && !previousTreatmentPlan && !lastEncounter.loading && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-900 font-apple mb-1">
                  No Treatment Plan Found
                </p>
                <p className="text-xs text-amber-700 font-apple font-light mb-2">
                  This patient doesn't have an initial treatment plan documented. Create one to enable "Today's Plan" tracking for future visits.
                </p>
                <button
                  onClick={() => setIsInitialPlanModalOpen(true)}
                  className="text-xs font-medium text-amber-900 hover:text-amber-950 underline font-apple"
                >
                  Create Initial Treatment Plan
                </button>
              </div>
            </div>
          )}
            
          {/* Physio Additional Notes */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 font-apple mb-1.5">
              Additional notes:
            </label>
            <textarea
              value={physioNotes}
              onChange={(e) => setPhysioNotes(e.target.value)}
              rows={2}
              placeholder="Add any additional notes or observations for today's session..."
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-apple font-light resize-none"
            />
          </div>
        </div>
      </section>

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
      />

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
};

export default AnalysisTab;


