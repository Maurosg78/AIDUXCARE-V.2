/**
 * Integration Tests: ProfessionalWorkflowPage guardrails
 *
 * Focus on workflow render and draft-resume protections that must remain stable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProfessionalWorkflowPage from '../ProfessionalWorkflowPage';
import { SessionComparisonService } from '../../services/sessionComparisonService';
import sessionService from '../../services/sessionService';

const hoistedMocks = vi.hoisted(() => {
  const mockSetTranscript = vi.fn();
  const mockGetLatestInitialSession = vi.fn();
  const mockClearSession = vi.fn();

  return {
    mockSetTranscript,
    mockGetLatestInitialSession,
    mockClearSession,
  };
});

const mockSetTranscript = hoistedMocks.mockSetTranscript;
const mockGetLatestInitialSession = hoistedMocks.mockGetLatestInitialSession;
const mockClearSession = hoistedMocks.mockClearSession;

// Mock dependencies
vi.mock('../../services/sessionService', () => ({
  default: {
    createSession: vi.fn().mockResolvedValue('new-session-id'),
    isFirstSession: vi.fn(),
    updateSession: vi.fn().mockResolvedValue(undefined),
    getSessionById: vi.fn(),
    getNotesByPatient: vi.fn(),
    getInProgressSessions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/session-storage', () => ({
  SessionStorage: {
    getLatestInitialSession: hoistedMocks.mockGetLatestInitialSession,
    clearSession: hoistedMocks.mockClearSession,
    getSession: vi.fn(),
    saveSession: vi.fn(),
    saveLatestInitialSession: vi.fn(),
  },
  default: {
    getLatestInitialSession: hoistedMocks.mockGetLatestInitialSession,
    clearSession: hoistedMocks.mockClearSession,
    getSession: vi.fn(),
    saveSession: vi.fn(),
    saveLatestInitialSession: vi.fn(),
  },
}));

vi.mock('../../services/sessionComparisonService', () => ({
  SessionComparisonService: vi.fn().mockImplementation(() => ({
    getPreviousSession: vi.fn(),
    getEncountersComparisonState: vi.fn().mockResolvedValue({
      isFirstSession: true,
      reason: 'no_previous_session',
    }),
    getLastNPainSeries: vi.fn().mockResolvedValue([]),
    compareSessions: vi.fn(),
    formatComparisonForUI: vi.fn(),
    buildLongitudinalSummaryForPrompt: vi.fn().mockReturnValue(null),
  })),
}));

vi.mock('../../services/analyticsService', () => {
  class AnalyticsService {
    static trackEvent = vi.fn(() => Promise.resolve());
    static trackValueMetrics = vi.fn(() => Promise.resolve());
    static trackSystemEvent = vi.fn(() => Promise.resolve());
  }

  const analyticsService = {
    trackEvent: vi.fn(() => Promise.resolve()),
    trackValueMetrics: vi.fn(() => Promise.resolve()),
    trackSystemEvent: vi.fn(() => Promise.resolve()),
  };

  return { AnalyticsService, analyticsService, default: AnalyticsService };
});vi.mock('../../services/patientService', () => {
  const PatientService = {
    getPatientById: vi.fn().mockResolvedValue({
      id: 'test-patient-1',
      fullName: 'Test Patient',
      email: 'test@example.com',
      phone: '',
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
      createdAt: '',
      updatedAt: '',
    }),
  };

  return { PatientService, default: PatientService };
});

vi.mock('../../services/patientConsentService', () => ({
  PatientConsentService: {

    hasConsent: vi.fn().mockResolvedValue(true),
    getConsentStatus: vi.fn().mockResolvedValue({ hasConsent: true, status: 'ok' }),
    },
}));

vi.mock('../../services/consentVerificationService', () => ({
  ConsentVerificationService: {

    isConsentVerified: vi.fn().mockResolvedValue(true),
    getVerificationState: vi.fn().mockResolvedValue({ exists: () => true }),
    },
}));

vi.mock('../../services/consentServerService', () => ({
  checkConsentViaServer: vi.fn().mockResolvedValue({
    hasValidConsent: true,
    status: 'ongoing',
    consentMethod: 'verbal',
    isDeclined: false,
  }),
}));

vi.mock('../../services/verbalConsentService', () => ({
  VerbalConsentService: {
    hasValidConsent: vi.fn().mockResolvedValue(true),
  },
  getConsentLanguageForJurisdiction: vi.fn().mockReturnValue('en'),
  getConsentVersionForPortal: vi.fn().mockReturnValue('1.0.0'),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
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
  }),
}));

vi.mock('../../hooks/useTranscript', () => ({
  useTranscript: () => ({
    transcript: 'Test transcript',
    isRecording: false,
    isTranscribing: false,
    error: null,
    languagePreference: 'en',
    setLanguagePreference: vi.fn(),
    mode: 'live',
    setMode: vi.fn(),
    meta: null,
    audioStream: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    setTranscript: hoistedMocks.mockSetTranscript,
  }),
}));

vi.mock('../../hooks/useTimer', () => ({
  useTimer: () => ({
    time: 0,
  }),
}));

vi.mock('../../hooks/useNiagaraProcessor', () => ({
  useNiagaraProcessor: () => ({
    processText: vi.fn(),
    generateSOAPNote: vi.fn(),
    runVoiceSummary: vi.fn(),
    runVoiceClinicalInfoQuery: vi.fn(),
    isLoading: false,
    error: null,
    results: null,
  }),
}));

vi.mock('../../context/ProfessionalProfileContext', () => ({
  useProfessionalProfile: () => ({
    profile: {
      firstName: 'Test',
      lastName: 'Professional',
    },
  }),
}));

// Mock removed: using MemoryRouter instead for real router context

// Mock patient dashboard hooks
vi.mock('../../features/patient-dashboard/hooks/useLastEncounter', () => ({
  useLastEncounter: () => ({
    lastEncounter: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../features/patient-dashboard/hooks/useActiveEpisode', () => ({
  useActiveEpisode: () => ({
    activeEpisode: null,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../../features/patient-dashboard/hooks/usePatientVisitCount', () => ({
  usePatientVisitCount: () => ({
    visitCount: 0,
    isLoading: false,
    error: null,
  }),
}));

describe('ProfessionalWorkflowPage Integration - Workflow Guardrails', () => {
  let mockSessionComparisonService: any;
  let mockGetPreviousSession: any;
  let mockGetEncountersComparisonState: any;
  let mockGetLastNPainSeries: any;
  let mockCompareSessions: any;
  let mockFormatComparisonForUI: any;
  let mockBuildLongitudinalSummaryForPrompt: any;

  beforeEach(() => {
    mockGetPreviousSession = vi.fn();
    mockGetEncountersComparisonState = vi.fn().mockResolvedValue({
      isFirstSession: true,
      reason: 'no_previous_session',
    });
    mockGetLastNPainSeries = vi.fn().mockResolvedValue([]);
    mockCompareSessions = vi.fn();
    mockFormatComparisonForUI = vi.fn();
    mockBuildLongitudinalSummaryForPrompt = vi.fn().mockReturnValue(null);

    mockSessionComparisonService = {
      getPreviousSession: mockGetPreviousSession,
      getEncountersComparisonState: mockGetEncountersComparisonState,
      getLastNPainSeries: mockGetLastNPainSeries,
      compareSessions: mockCompareSessions,
      formatComparisonForUI: mockFormatComparisonForUI,
      buildLongitudinalSummaryForPrompt: mockBuildLongitudinalSummaryForPrompt,
    };

    (SessionComparisonService as any).mockImplementation(() => mockSessionComparisonService);
    vi.clearAllMocks();
    mockGetLatestInitialSession.mockReset();
    mockClearSession.mockReset();
    mockSetTranscript.mockReset();
  });

vi.mock('../../services/followUpDetectionService', () => ({
  detectFollowUp: vi.fn().mockResolvedValue({
    isFollowUp: false,
    recommendedWorkflow: 'initial',
    confidence: 1,
    reasons: ['test'],
  }),
  explainDetectionResult: vi.fn().mockReturnValue('test explanation'),}));

afterEach(() => {
    vi.restoreAllMocks();
  });

vi.mock('../../core/audit/FirestoreAuditLogger', () => ({
  FirestoreAuditLogger: {
    logEvent: vi.fn().mockResolvedValue(undefined),
  },
}));

  describe('Workflow Rendering', () => {
    it('should render the workflow shell without mounting the removed SessionComparison panel', async () => {
      mockGetPreviousSession.mockResolvedValue(null);
      mockFormatComparisonForUI.mockReturnValue({
        hasComparison: false,
        isFirstSession: true,
        previousSessionDate: null,
        currentSessionDate: new Date().toLocaleDateString('en-CA'),
        daysBetween: null,
        metrics: {
          painLevel: { previous: null, current: null, delta: null, trend: 'no_data' },
          rangeOfMotion: [],
          functionalTests: [],
        },
        overallProgress: 'no_data',
        alerts: [],
        summary: 'First session',
      });

      render(
        <MemoryRouter initialEntries={['/workflow?patientId=test-patient-1']}>
          <ProfessionalWorkflowPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Patient')).toBeInTheDocument();
      });

      expect(screen.queryByText(/First Session/i)).not.toBeInTheDocument();
      expect(mockGetEncountersComparisonState).toHaveBeenCalledWith('test-patient-1');
    });
  });

  describe('Initial Session Restore Guardrails', () => {
    it('should start a new initial evaluation without restoring the latest interrupted draft', async () => {
      const savedLatestDraft = {
        transcript: 'Draft transcript that must not be restored',
        evaluationTests: [{ name: 'SLR' }],
        sessionId: 'previous-session-id',
      };

      mockGetLatestInitialSession.mockReturnValue(savedLatestDraft);

      render(
        <MemoryRouter initialEntries={['/workflow?type=initial&patientId=test-patient-1']}>
          <ProfessionalWorkflowPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockGetLatestInitialSession).not.toHaveBeenCalled();
      });

      expect(mockGetLatestInitialSession).not.toHaveBeenCalled();
      expect(mockSetTranscript).not.toHaveBeenCalledWith(savedLatestDraft.transcript);
    });

    it('should restore an initial evaluation only when resume is explicit and sessionId is valid', async () => {
      const resumedTranscript = 'Recovered interrupted initial transcript';

      const resumedSession = {
        id: 'resume-session-id',
        transcript: resumedTranscript,
        soapNote: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
        },
        physicalTests: [],
        status: 'interrupted',
      };

      const getSessionByIdMock = vi.mocked(sessionService.getSessionById);

      getSessionByIdMock.mockResolvedValue(resumedSession as any);

      render(
        <MemoryRouter initialEntries={['/workflow?type=initial&patientId=test-patient-1&resume=true&sessionId=resume-session-id']}>
          <ProfessionalWorkflowPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(getSessionByIdMock).toHaveBeenCalledWith('resume-session-id');
      });

      expect(mockGetLatestInitialSession).not.toHaveBeenCalled();
      expect(mockSetTranscript).toHaveBeenCalledWith(resumedTranscript);
    });
  });
});
