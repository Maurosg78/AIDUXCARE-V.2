import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SOAPNote } from '../../types/vertex-ai';
import ProfessionalWorkflowPage from '../ProfessionalWorkflowPage';

const testState = vi.hoisted(() => {
  const mariaDoloresSoap = {
    subjective: 'Paciente refiere evolución favorable y tolerancia parcial a las actividades.',
    objective: 'Movilidad y tolerancia funcional reevaluadas durante la sesión.',
    assessment: 'Evolución funcional en seguimiento.',
    plan: [
      'TRATAMIENTO EN CLÍNICA:',
      '- Diatermia (Tecarterapia) en RI',
      '- Movilizaciones y fortalecimiento supervisado',
      '- Masoterapia',
      '- Ejercicios de fortalecimiento en cadena cinética abierta',
      'PROGRAMA DE EJERCICIOS EN CASA:',
      '- Mantener movilidad activa dentro de tolerancia',
    ].join('\n'),
  };

  return {
    mariaDoloresSoap,
    soapTabProps: null as Record<string, unknown> | null,
    focusEditorProps: null as Record<string, unknown> | null,
    createSessionWithId: vi.fn(),
    updateSession: vi.fn(),
    saveSOAPNoteWithRetry: vi.fn(),
  };
});

const MARIA_DOLORES_SOAP: SOAPNote = testState.mariaDoloresSoap;

const MARIA_DOLORES_IN_CLINIC_ITEMS = [
  {
    id: 'in-clinic-0',
    label: 'Diatermia (Tecarterapia) en RI',
    completed: false,
    source: 'plan',
  },
  {
    id: 'in-clinic-1',
    label: 'Movilizaciones y fortalecimiento supervisado',
    completed: true,
    source: 'plan',
  },
  {
    id: 'in-clinic-2',
    label: 'Masoterapia',
    completed: true,
    source: 'plan',
  },
  {
    id: 'in-clinic-3',
    label: 'Ejercicios de fortalecimiento en cadena cinética abierta',
    completed: true,
    source: 'plan',
  },
];

vi.mock('../../components/workflow/tabs/SOAPTab', () => {
  const SOAPTab = (props: Record<string, unknown>) => {
    testState.soapTabProps = props;
    return <div data-testid="golden-master-soap-tab" />;
  };

  return {
    SOAPTab,
    default: SOAPTab,
  };
});

vi.mock('../../components/workflow/SuggestedFocusEditor', () => {
  const SuggestedFocusEditor = (props: Record<string, unknown>) => {
    testState.focusEditorProps = props;
    return <div data-testid="golden-master-focus-editor" />;
  };

  return {
    SuggestedFocusEditor,
    default: SuggestedFocusEditor,
  };
});

vi.mock('../../components/workflow/tabs/AnalysisTab', () => ({
  AnalysisTab: () => null,
  default: () => null,
}));

vi.mock('../../components/workflow/tabs/EvaluationTab', () => ({
  EvaluationTab: () => null,
  default: () => null,
}));

vi.mock('../../services/sessionService', () => ({
  default: {
    createSession: vi.fn().mockResolvedValue('session-maria-dolores'),
    createSessionWithId: testState.createSessionWithId,
    findReusableSessionForDayAndType: vi.fn().mockResolvedValue(null),
    getInProgressSessions: vi.fn().mockResolvedValue([]),
    getLatestFinalizedTreatmentDecision: vi.fn().mockResolvedValue(null),
    getNotesByPatient: vi.fn().mockResolvedValue([]),
    getSessionById: vi.fn().mockResolvedValue({
      id: 'session-maria-dolores',
      patientId: 'patient-maria-dolores',
      patientName: 'Maria Dolores',
      userId: 'physio-test',
      sessionType: 'followup',
      sessionDateKey: '2026-07-07',
      status: 'draft',
      soapStatus: 'draft',
      soapNote: testState.mariaDoloresSoap,
      transcript: 'Seguimiento sintético de regresión.',
      physicalTests: [],
      attachments: [],
    }),
    isFirstSession: vi.fn().mockResolvedValue(false),
    updateSession: testState.updateSession,
  },
}));

vi.mock('../../services/session-storage', () => ({
  SessionStorage: {
    clearSession: vi.fn(),
    getLatestInitialSession: vi.fn(),
    getSession: vi.fn(),
    saveLatestInitialSession: vi.fn(),
    saveSession: vi.fn(),
  },
  default: {
    clearSession: vi.fn(),
    getLatestInitialSession: vi.fn(),
    getSession: vi.fn(),
    saveLatestInitialSession: vi.fn(),
    saveSession: vi.fn(),
  },
}));

vi.mock('../../services/workflowRouterService', () => ({
  routeWorkflow: vi.fn().mockResolvedValue({
    type: 'follow-up',
    skipTabs: [],
    directToTab: 'soap',
    analysisLevel: 'follow-up',
    auditLog: {
      detectionResult: {
        isFollowUp: true,
        confidence: 100,
      },
      routingDecision: null,
      timestamp: new Date('2026-07-07T09:00:00.000Z'),
      patientId: 'patient-maria-dolores',
    },
  }),
  shouldSkipTab: vi.fn().mockReturnValue(false),
  getInitialTab: vi.fn().mockReturnValue('soap'),
}));

vi.mock('../../services/clinicalStateService', () => ({
  getClinicalState: vi.fn().mockResolvedValue({
    hasBaseline: true,
    baselineSOAP: testState.mariaDoloresSoap,
  }),
}));

vi.mock('../../services/treatmentPlanService', () => ({
  default: {
    getTreatmentPlan: vi.fn().mockResolvedValue({
      planText: testState.mariaDoloresSoap.plan,
      inClinicText: [
        'Diatermia (Tecarterapia) en RI',
        'Movilizaciones y fortalecimiento supervisado',
        'Masoterapia',
        'Ejercicios de fortalecimiento en cadena cinética abierta',
      ].join('\n'),
      homeProgramText: 'Mantener movilidad activa dentro de tolerancia',
    }),
    getTreatmentReminder: vi.fn().mockResolvedValue(null),
    saveTreatmentPlan: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/PersistenceServiceEnhanced', () => ({
  saveSOAPNoteWithRetry: testState.saveSOAPNoteWithRetry,
}));

vi.mock('../../services/PersistenceService', () => ({
  default: {
    getNoteById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../../repositories/encountersRepo', () => ({
  encountersRepo: {
    createEncounterCompleted: vi.fn().mockResolvedValue('encounter-maria-dolores'),
    getEncountersByPatient: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/patientTrajectoryMemoryService', () => ({
  PatientTrajectoryMemoryService: vi.fn().mockImplementation(() => ({
    buildEncounterLongitudinalSnapshot: vi.fn().mockResolvedValue({}),
    getPatternInsight: vi.fn().mockResolvedValue(null),
    recordEncounterTrajectory: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../services/patientService', () => ({
  PatientService: {
    getPatientById: vi.fn().mockResolvedValue({
      id: 'patient-maria-dolores',
      firstName: 'Maria',
      lastName: 'Dolores',
      fullName: 'Maria Dolores',
      email: 'synthetic@example.test',
      activeBaselineId: 'baseline-maria-dolores',
      status: 'active',
    }),
    updatePatient: vi.fn().mockResolvedValue(undefined),
  },
  default: {
    getPatientById: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'physio-test',
      displayName: 'Physio Test',
    },
  }),
}));

vi.mock('../../context/ProfessionalProfileContext', () => ({
  useProfessionalProfile: () => ({
    profile: {
      uid: 'physio-test',
      firstName: 'Physio',
      lastName: 'Test',
      fullName: 'Physio Test',
      profession: 'Fisioterapeuta',
      licenseNumber: 'TEST-001',
    },
  }),
}));

vi.mock('../../hooks/useSharedWorkflowState', () => ({
  useSharedWorkflowState: () => ({
    sharedState: {
      physicalEvaluation: {
        selectedTests: [],
      },
    },
    updatePhysicalEvaluation: vi.fn(),
    resetSharedWorkflowState: vi.fn(),
  }),
}));

vi.mock('../../hooks/useTranscript', () => ({
  useTranscript: () => ({
    transcript: 'Seguimiento sintético de regresión.',
    isRecording: false,
    isTranscribing: false,
    error: null,
    languagePreference: 'es',
    setLanguagePreference: vi.fn(),
    mode: 'live',
    setMode: vi.fn(),
    meta: null,
    audioStream: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    setTranscript: vi.fn(),
  }),
}));

vi.mock('../../hooks/useTimer', () => ({
  useTimer: () => ({
    time: 0,
  }),
}));

vi.mock('../../hooks/useNiagaraProcessor', () => ({
  useNiagaraProcessor: () => ({
    error: null,
    generateSOAPNote: vi.fn(),
    isLoading: false,
    processText: vi.fn(),
    results: null,
    runVoiceClinicalInfoQuery: vi.fn(),
    runVoiceSummary: vi.fn(),
  }),
}));

vi.mock('../../services/analyticsService', () => {
  class AnalyticsService {
    static trackEvent = vi.fn().mockResolvedValue(undefined);
    static trackSystemEvent = vi.fn().mockResolvedValue(undefined);
    static trackValueMetrics = vi.fn().mockResolvedValue(undefined);
  }

  return {
    AnalyticsService,
    analyticsService: {
      trackEvent: vi.fn().mockResolvedValue(undefined),
      trackSystemEvent: vi.fn().mockResolvedValue(undefined),
      trackValueMetrics: vi.fn().mockResolvedValue(undefined),
    },
    default: AnalyticsService,
  };
});

vi.mock('../../services/analytics/AnalyticsEvents', () => ({
  trackAnalysisCompleted: vi.fn().mockResolvedValue(undefined),
  trackAnalysisFailed: vi.fn().mockResolvedValue(undefined),
  trackAnalysisRequested: vi.fn().mockResolvedValue(undefined),
  trackError: vi.fn().mockResolvedValue(undefined),
  trackEvaluationCompleted: vi.fn().mockResolvedValue(undefined),
  trackEvaluationPhaseEntered: vi.fn().mockResolvedValue(undefined),
  trackEvaluationTestCompleted: vi.fn().mockResolvedValue(undefined),
  trackEvaluationTestSelected: vi.fn().mockResolvedValue(undefined),
  trackRecordingStarted: vi.fn().mockResolvedValue(undefined),
  trackRecordingStopped: vi.fn().mockResolvedValue(undefined),
  trackSessionCompleted: vi.fn().mockResolvedValue(undefined),
  trackSessionStarted: vi.fn().mockResolvedValue(undefined),
  trackSOAPFinalized: vi.fn().mockResolvedValue(undefined),
  trackSOAPGenerationCompleted: vi.fn().mockResolvedValue(undefined),
  trackSOAPGenerationStarted: vi.fn().mockResolvedValue(undefined),
  trackTranscriptionCompleted: vi.fn().mockResolvedValue(undefined),
  trackTranscriptionFailed: vi.fn().mockResolvedValue(undefined),
  trackTranscriptionStarted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/workflowMetricsService', () => ({
  getWorkflowEfficiencySummary: vi.fn(),
  trackSOAPGeneration: vi.fn().mockResolvedValue(undefined),
  trackUserClick: vi.fn().mockResolvedValue(undefined),
  trackWorkflowSessionEnd: vi.fn().mockResolvedValue(null),
  trackWorkflowSessionStart: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/sessionComparisonService', () => ({
  SessionComparisonService: vi.fn().mockImplementation(() => ({
    buildLongitudinalSummaryForPrompt: vi.fn().mockReturnValue(null),
    compareSessions: vi.fn(),
    formatComparisonForUI: vi.fn(),
    getEncountersComparisonState: vi.fn().mockResolvedValue({
      isFirstSession: false,
      reason: 'previous_session_found',
    }),
    getLastNPainSeries: vi.fn().mockResolvedValue([]),
    getPreviousSession: vi.fn().mockResolvedValue(null),
  })),
}));

vi.mock('../../services/patientConsentService', () => ({
  PatientConsentService: {
    getConsentStatus: vi.fn().mockResolvedValue({
      hasConsent: true,
      status: 'ok',
    }),
    hasConsent: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../services/consentServerService', () => ({
  checkConsentViaServer: vi.fn().mockResolvedValue({
    consentMethod: 'verbal',
    hasValidConsent: true,
    isDeclined: false,
    status: 'ongoing',
  }),
}));

vi.mock('../../services/verbalConsentService', () => ({
  getConsentLanguageForJurisdiction: vi.fn().mockReturnValue('es'),
  getConsentVersionForPortal: vi.fn().mockReturnValue('1.0.0'),
  VerbalConsentService: {
    hasValidConsent: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../features/patient-dashboard/hooks/useLastEncounter', () => ({
  useLastEncounter: () => ({
    error: null,
    isLoading: false,
    lastEncounter: null,
  }),
}));

vi.mock('../../features/patient-dashboard/hooks/useActiveEpisode', () => ({
  useActiveEpisode: () => ({
    activeEpisode: null,
    error: null,
    isLoading: false,
  }),
}));

vi.mock('../../features/patient-dashboard/hooks/usePatientVisitCount', () => ({
  usePatientVisitCount: () => ({
    error: null,
    isLoading: false,
    visitCount: 2,
  }),
}));

vi.mock('../../core/audit/FirestoreAuditLogger', () => ({
  FirestoreAuditLogger: {
    logEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('handleFinalizeSOAP incremental Golden Master', () => {
  beforeEach(() => {
    testState.soapTabProps = null;
    testState.focusEditorProps = null;
    testState.createSessionWithId.mockReset();
    testState.createSessionWithId.mockResolvedValue('session-maria-dolores');
    testState.updateSession.mockReset();
    testState.updateSession.mockResolvedValue(undefined);
    testState.saveSOAPNoteWithRetry.mockReset();
    testState.saveSOAPNoteWithRetry.mockResolvedValue({
      noteId: 'note-maria-dolores',
      noteStatus: 'finalized',
      retries: 0,
      success: true,
      usedBackup: false,
    });
  });

  it('preserva Diatermia como no realizada al finalizar la decisión editada de Maria Dolores', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/workflow?type=followup&patientId=patient-maria-dolores&sessionId=session-maria-dolores&resume=true',
        ]}
      >
        <ProfessionalWorkflowPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(testState.focusEditorProps).not.toBeNull();
    });

    const onFocusChange = testState.focusEditorProps?.onChange as
      | ((items: typeof MARIA_DOLORES_IN_CLINIC_ITEMS) => void)
      | undefined;

    expect(onFocusChange).toBeTypeOf('function');

    act(() => {
      onFocusChange?.(MARIA_DOLORES_IN_CLINIC_ITEMS);
    });

    await waitFor(() => {
      expect(testState.soapTabProps?.isTreatmentDecisionConfirmed).toBe(true);
    });

    const handleFinalizeSOAP = testState.soapTabProps?.handleFinalizeSOAP as
      | ((soap: SOAPNote) => Promise<void>)
      | undefined;

    expect(handleFinalizeSOAP).toBeTypeOf('function');

    await act(async () => {
      await handleFinalizeSOAP?.(MARIA_DOLORES_SOAP);
    });

    const sessionPersistenceCalls = [
      ...testState.updateSession.mock.calls,
      ...testState.createSessionWithId.mock.calls,
    ];
    const finalizedSessionSaveCall = sessionPersistenceCalls.find((call) => {
      const payload = call[1] as Record<string, unknown> | undefined;
      const containsTreatmentDecision = payload != null && 'treatmentDecision' in payload;
      return (
        payload?.soapStatus === 'finalized' &&
        payload?.status === 'completed' &&
        containsTreatmentDecision
      );
    });

    expect(finalizedSessionSaveCall).toBeDefined();
    const persistedSessionId = finalizedSessionSaveCall?.[0];
    expect(persistedSessionId).toEqual(expect.any(String));
    expect(finalizedSessionSaveCall?.[1]).toEqual(
      expect.objectContaining({
        treatmentDecision: expect.objectContaining({
          confirmationMethod: 'edited',
          inClinicItems: [
            expect.objectContaining({
              completed: false,
              label: 'Diatermia (Tecarterapia) en RI',
            }),
            expect.objectContaining({
              completed: true,
              label: 'Movilizaciones y fortalecimiento supervisado',
            }),
            expect.objectContaining({
              completed: true,
              label: 'Masoterapia',
            }),
            expect.objectContaining({
              completed: true,
              label: 'Ejercicios de fortalecimiento en cadena cinética abierta',
            }),
          ],
          source: 'physio_final_decision',
          sourceSessionId: persistedSessionId,
        }),
      })
    );
  });
});
