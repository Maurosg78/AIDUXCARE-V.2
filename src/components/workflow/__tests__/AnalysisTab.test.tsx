import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalysisTab } from '../tabs/AnalysisTab';
import type { ClinicalDataPoint } from '@/types/clinicalProvenance';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/core/pilotDetection', () => ({
  isSpainPilot: () => true,
}));

vi.mock('@/components/clinical-decisions/RedFlagDismissModal', () => ({
  RedFlagDismissModal: () => null,
}));

vi.mock('@/components/clinical-decisions/AddMedicationModal', () => ({
  AddMedicationModal: () => null,
}));

vi.mock('../TranscriptArea', () => ({
  default: () => null,
}));

vi.mock('../AdditionalClinicalContextInput', () => ({
  default: () => null,
}));

vi.mock('../SuggestedFocusEditor', () => ({
  SuggestedFocusEditor: () => null,
}));

vi.mock('@/core/clinical-decisions/clinicalDecisionService', () => ({
  getPatientClinicalDecisions: vi.fn(async () => []),
  saveClinicalDecision: vi.fn(),
}));

const noop = () => {};

function buildProps(overrides: Record<string, unknown> = {}) {
  return {
    currentPatient: null,
    patientIdFromUrl: 'patient-1',
    patientClinicalInfo: {
      allergies: null,
      contraindications: null,
    },
    calculateAge: vi.fn(() => null),
    consentStatus: null,
    consentPending: false,
    consentToken: null,
    consentLink: null,
    smsError: null,
    user: null,
    setConsentStatus: vi.fn(),
    setPatientHasConsent: vi.fn(),
    setConsentPending: vi.fn(),
    setSmsError: vi.fn(),
    handleCopyConsentLink: vi.fn(async () => {}),
    handleResendConsentSMS: vi.fn(async () => {}),
    lastEncounter: {
      data: null,
      loading: false,
      error: null,
    },
    isFirstSession: false,
    formatLastSessionDate: vi.fn(() => null),
    visitType: 'follow-up',
    visitCount: {
      data: 2,
      loading: false,
      error: null,
    },
    sessionTypeConfig: {
      label: 'Follow-up',
    },
    previousTreatmentPlan: null,
    setIsInitialPlanModalOpen: vi.fn(),
    physioNotes: 'Current session note with enough clinical context.',
    setPhysioNotes: vi.fn(),
    currentPainEva: null,
    setCurrentPainEva: vi.fn(),
    historicalPainEva: null,
    recordingTime: '00:00',
    isRecording: false,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    transcript: '',
    setTranscript: vi.fn(),
    transcriptError: null,
    transcriptMeta: null,
    languagePreference: 'auto',
    setLanguagePreference: vi.fn(),
    mode: 'live',
    setMode: vi.fn(),
    isTranscribing: false,
    isProcessing: false,
    isGeneratingSOAP: false,
    audioStream: null,
    handleAnalyzeWithVertex: vi.fn(async () => {}),
    attachments: [],
    isUploadingAttachment: false,
    attachmentError: null,
    removingAttachmentId: null,
    handleAttachmentUpload: vi.fn(async () => {}),
    handleAttachmentRemove: vi.fn(async () => {}),
    handleAttachmentReviewedToggle: vi.fn(),
    niagaraResults: null,
    interactiveResults: null,
    selectedEntityIds: [],
    setSelectedEntityIds: vi.fn(),
    physicalTestAssistanceChoice: 'manual',
    onPhysicalTestAssistanceChoiceChange: vi.fn(),
    onEditedResultsChange: vi.fn(),
    continueToEvaluation: vi.fn(),
    analysisError: null,
    successMessage: null,
    setAnalysisError: vi.fn(),
    setSuccessMessage: vi.fn(),
    onTodayFocusChange: vi.fn(),
    onFinishSession: vi.fn(),
    hideHeader: true,
    todayFocusBlockRenderedByParent: true,
    hideTranscriptArea: true,
    followUpHasContent: true,
    hasSoapContent: false,
    resumeLoadFailed: null,
    selectedRedFlagIds: [],
    onRedFlagSelectionChange: vi.fn(),
    dismissedRedFlagIds: [],
    onRedFlagDismiss: vi.fn(),
    redFlagsDetected: [],
    redFlagDecisions: {},
    onRedFlagDecisionChange: vi.fn(),
    currentUserId: 'user-1',
    currentSessionId: 'session-1',
    currentPatientId: 'patient-1',
    previouslyReviewedRedFlags: [],
    onGenerateReferralReport: vi.fn(),
    onConfirmFollowUpRedFlags: vi.fn(),
    ...overrides,
  };
}

function renderAnalysisTab(overrides: Record<string, unknown> = {}) {
  const props = buildProps(overrides);
  const view = render(<AnalysisTab {...(props as any)} />);
  const input = screen.getByLabelText('Dolor EVA de hoy');
  const generateButton = screen.getByRole('button', {
    name: /Generar nota de seguimiento/i,
  });
  return {
    ...view,
    props,
    input,
    generateButton,
  };
}

describe('AnalysisTab — Guardrail de EVA/dolor sin confirmar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra advertencia bloqueante si hay EVA escrito sin confirmar al intentar generar', () => {
    const { input, generateButton, props } = renderAnalysisTab();

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(generateButton);

    expect(screen.getByText('EVA escrito sin confirmar')).toBeInTheDocument();
    expect(props.handleAnalyzeWithVertex).not.toHaveBeenCalled();
  });

  it('procede directo a generar si el campo EVA está vacío', () => {
    const { generateButton, props } = renderAnalysisTab();

    fireEvent.click(generateButton);

    expect(screen.queryByText('EVA escrito sin confirmar')).not.toBeInTheDocument();
    expect(props.handleAnalyzeWithVertex).toHaveBeenCalledTimes(1);
  });

  it('procede directo a generar si el EVA ya está confirmado y coincide', () => {
    const currentPainEva: ClinicalDataPoint<number> = {
      value: 5,
      source: 'today',
      sourceDetail: 'physio_structured_input',
      sessionId: 'session-1',
      capturedAt: '2026-07-08T10:00:00.000Z',
      confirmedByClinician: true,
    };
    const { input, generateButton, props } = renderAnalysisTab({
      currentPainEva,
    });

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(generateButton);

    expect(screen.queryByText('EVA escrito sin confirmar')).not.toBeInTheDocument();
    expect(props.handleAnalyzeWithVertex).toHaveBeenCalledTimes(1);
  });

  it('opción confirmar EVA ejecuta confirmación y luego genera', async () => {
    const setCurrentPainEva = vi.fn();
    const handleAnalyzeWithVertex = vi.fn(async () => {});
    const { input, generateButton, props, rerender } = renderAnalysisTab({
      setCurrentPainEva,
      handleAnalyzeWithVertex,
    });

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(generateButton);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar EVA 5 antes de continuar/i }));

    expect(setCurrentPainEva).toHaveBeenCalledWith({
      value: 5,
      source: 'today',
      sourceDetail: 'physio_structured_input',
      sessionId: 'session-1',
      capturedAt: expect.any(String),
      confirmedByClinician: true,
    });
    expect(handleAnalyzeWithVertex).not.toHaveBeenCalled();

    const confirmedPainEva = setCurrentPainEva.mock.calls[0][0];
    const updatedProps = {
      ...props,
      currentPainEva: confirmedPainEva,
      setCurrentPainEva,
      handleAnalyzeWithVertex,
    };
    rerender(<AnalysisTab {...(updatedProps as any)} />);

    await waitFor(() => {
      expect(handleAnalyzeWithVertex).toHaveBeenCalledTimes(1);
    });
  });

  it('opción continuar sin EVA limpia el input y genera sin confirmar', () => {
    const { input, generateButton, props } = renderAnalysisTab();

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(generateButton);
    fireEvent.click(screen.getByRole('button', { name: /Continuar sin registrar EVA de hoy/i }));

    expect(props.handleAnalyzeWithVertex).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue(null);
  });

  it('opción volver y revisar cierra el modal sin generar', () => {
    const { input, generateButton, props } = renderAnalysisTab();

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(generateButton);
    fireEvent.click(screen.getByRole('button', { name: /Volver y revisar/i }));

    expect(screen.queryByText('EVA escrito sin confirmar')).not.toBeInTheDocument();
    expect(props.handleAnalyzeWithVertex).not.toHaveBeenCalled();
  });

  it('caso EVA = 0: no se pierde silenciosamente', () => {
    const { input, generateButton, props } = renderAnalysisTab();

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(generateButton);

    expect(screen.getByText('EVA escrito sin confirmar')).toBeInTheDocument();
    expect(props.handleAnalyzeWithVertex).not.toHaveBeenCalled();
  });
});
