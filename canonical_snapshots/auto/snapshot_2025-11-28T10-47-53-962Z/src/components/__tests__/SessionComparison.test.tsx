/**
 * Unit Tests: SessionComparison Component
 * 
 * Tests for session comparison UI component, including rendering,
 * data fetching, error handling, and visual indicators.
 * 
 * Sprint 1 - Day 2: UI Component
 * Coverage Target: >80%
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionComparison } from '../SessionComparison';
import { SessionComparisonService } from '../../services/sessionComparisonService';
import type { ComparisonDisplayData, Session } from '../../services/sessionComparisonService';
import { Timestamp } from 'firebase/firestore';

// Mock SessionComparisonService
vi.mock('../../services/sessionComparisonService', () => {
  const actual = vi.importActual('../../services/sessionComparisonService');
  return {
    ...actual,
    SessionComparisonService: vi.fn().mockImplementation(() => ({
      getPreviousSession: vi.fn(),
      compareSessions: vi.fn(),
      formatComparisonForUI: vi.fn(),
    })),
  };
});

// Mock LoadingSpinner
vi.mock('../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ text }: { text?: string }) => (
    <div data-testid="loading-spinner">{text || 'Loading...'}</div>
  ),
}));

// Mock ErrorMessage
vi.mock('../ui/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
    <div data-testid="error-message">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Retry
        </button>
      )}
    </div>
  ),
}));

describe('SessionComparison Component', () => {
  let mockService: any;
  let mockGetPreviousSession: any;
  let mockCompareSessions: any;
  let mockFormatComparisonForUI: any;

  beforeEach(() => {
    mockGetPreviousSession = vi.fn();
    mockCompareSessions = vi.fn();
    mockFormatComparisonForUI = vi.fn();

    mockService = {
      getPreviousSession: mockGetPreviousSession,
      compareSessions: mockCompareSessions,
      formatComparisonForUI: mockFormatComparisonForUI,
    };

    (SessionComparisonService as any).mockImplementation(() => mockService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading state correctly', () => {
      render(<SessionComparison patientId="patient-1" isLoading={true} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading session comparison...')).toBeInTheDocument();
    });

    it('should show loading while fetching data', async () => {
      mockGetPreviousSession.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SessionComparison patientId="patient-1" />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error state with retry button', async () => {
      mockGetPreviousSession.mockRejectedValue(new Error('Failed to fetch'));

      render(<SessionComparison patientId="patient-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('should retry when retry button is clicked', async () => {
      const user = userEvent.setup();
      mockGetPreviousSession
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(null);

      render(<SessionComparison patientId="patient-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('retry-button')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(mockGetPreviousSession).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle missing patient ID error', async () => {
      render(<SessionComparison patientId="" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/Patient ID is required/i)).toBeInTheDocument();
    });
  });

  describe('First Session State', () => {
    it('should render first session message when no previous session', async () => {
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
        summary: 'First session - no comparison available',
      });

      render(<SessionComparison patientId="patient-1" currentSession={{ id: 'current-1' } as Session} />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      expect(screen.getByText(/No comparison available/i)).toBeInTheDocument();
    });
  });

  describe('Comparison Data Rendering', () => {
    const mockComparisonData: ComparisonDisplayData = {
      hasComparison: true,
      isFirstSession: false,
      previousSessionDate: '2024-01-01',
      currentSessionDate: '2024-01-08',
      daysBetween: 7,
      metrics: {
        painLevel: {
          previous: 7,
          current: 5,
          delta: -0.4,
          trend: 'improved',
        },
        rangeOfMotion: [
          {
            region: 'shoulder',
            previous: 50,
            current: 70,
            delta: 40,
            trend: 'improved',
          },
        ],
        functionalTests: [
          {
            testName: 'Shoulder Impingement',
            previous: 'positive',
            current: 'negative',
            changed: true,
          },
        ],
      },
      overallProgress: 'improved',
      alerts: [],
      summary: 'Patient shows improvement since last session (7 days ago).',
    };

    it('should render comparison data with improvement indicators', async () => {
      const mockPreviousSession: Session = {
        id: 'previous-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      const mockCurrentSession: Session = {
        id: 'current-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      mockGetPreviousSession.mockResolvedValue(mockPreviousSession);
      mockCompareSessions.mockReturnValue({} as any);
      mockFormatComparisonForUI.mockReturnValue(mockComparisonData);

      render(
        <SessionComparison 
          patientId="patient-1" 
          currentSession={mockCurrentSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Session Comparison')).toBeInTheDocument();
      });

      // Check dates
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-01-08')).toBeInTheDocument();

      // Check pain level
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Improved')).toBeInTheDocument();

      // Check overall progress
      expect(screen.getByText(/Overall Progress/i)).toBeInTheDocument();
      expect(screen.getByText(/✅ Improved/i)).toBeInTheDocument();
    });

    it('should render regression indicators correctly', async () => {
      const regressionData: ComparisonDisplayData = {
        ...mockComparisonData,
        metrics: {
          ...mockComparisonData.metrics,
          painLevel: {
            previous: 3,
            current: 7,
            delta: 0.8,
            trend: 'worsened',
          },
        },
        overallProgress: 'regressed',
        alerts: [
          {
            type: 'pain',
            severity: 'moderate',
            metric: 'Pain Level',
            previousValue: 3,
            currentValue: 7,
            changePercentage: 133.3,
            message: 'Pain level increased from 3/10 to 7/10 (133.3% increase)',
          },
        ],
        summary: '⚠️ Patient shows regression since last session (7 days ago). 1 alert(s) detected.',
      };

      const mockPreviousSession: Session = {
        id: 'previous-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      const mockCurrentSession: Session = {
        id: 'current-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      mockGetPreviousSession.mockResolvedValue(mockPreviousSession);
      mockCompareSessions.mockReturnValue({} as any);
      mockFormatComparisonForUI.mockReturnValue(regressionData);

      render(
        <SessionComparison 
          patientId="patient-1" 
          currentSession={mockCurrentSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/⚠️ Regressed/i)).toBeInTheDocument();
      });

      // Check regression alerts
      expect(screen.getByText(/Regression Alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/Pain level increased/i)).toBeInTheDocument();
    });

    it('should render stable indicators correctly', async () => {
      const stableData: ComparisonDisplayData = {
        ...mockComparisonData,
        metrics: {
          ...mockComparisonData.metrics,
          painLevel: {
            previous: 5,
            current: 5,
            delta: 0,
            trend: 'stable',
          },
        },
        overallProgress: 'stable',
        summary: 'Patient status is stable since last session (7 days ago).',
      };

      const mockPreviousSession: Session = {
        id: 'previous-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      const mockCurrentSession: Session = {
        id: 'current-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      mockGetPreviousSession.mockResolvedValue(mockPreviousSession);
      mockCompareSessions.mockReturnValue({} as any);
      mockFormatComparisonForUI.mockReturnValue(stableData);

      render(
        <SessionComparison 
          patientId="patient-1" 
          currentSession={mockCurrentSession}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/→ Stable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Callback Integration', () => {
    it('should call onComparisonLoad callback when comparison is loaded', async () => {
      const onComparisonLoad = vi.fn();
      const mockPreviousSession: Session = {
        id: 'previous-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      const mockCurrentSession: Session = {
        id: 'current-1',
        userId: 'user-1',
        patientId: 'patient-1',
        patientName: 'Test Patient',
        transcript: '',
        soapNote: null,
        timestamp: Timestamp.now(),
        status: 'completed',
      };

      const mockComparison = {
        patientId: 'patient-1',
        previousSession: { id: 'previous-1', date: new Date(), metrics: {} },
        currentSession: { id: 'current-1', date: new Date(), metrics: {} },
        deltas: {},
        alerts: [],
      };

      mockGetPreviousSession.mockResolvedValue(mockPreviousSession);
      mockCompareSessions.mockReturnValue(mockComparison);
      mockFormatComparisonForUI.mockReturnValue({
        hasComparison: true,
        isFirstSession: false,
        previousSessionDate: '2024-01-01',
        currentSessionDate: '2024-01-08',
        daysBetween: 7,
        metrics: {
          painLevel: { previous: null, current: null, delta: null, trend: 'no_data' },
          rangeOfMotion: [],
          functionalTests: [],
        },
        overallProgress: 'stable',
        alerts: [],
        summary: 'Test summary',
      });

      render(
        <SessionComparison 
          patientId="patient-1" 
          currentSession={mockCurrentSession}
          onComparisonLoad={onComparisonLoad}
        />
      );

      await waitFor(() => {
        expect(onComparisonLoad).toHaveBeenCalledWith(mockComparison);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing current session data', async () => {
      mockGetPreviousSession.mockResolvedValue({
        id: 'previous-1',
      } as Session);

      render(<SessionComparison patientId="patient-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/Current session/i)).toBeInTheDocument();
    });

    it('should handle no comparison data gracefully', async () => {
      mockGetPreviousSession.mockResolvedValue(null);
      mockFormatComparisonForUI.mockReturnValue({
        hasComparison: false,
        isFirstSession: true, // This will trigger first session state
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
        summary: 'First session - no comparison available',
      });

      render(<SessionComparison patientId="patient-1" currentSession={{ id: 'current-1' } as Session} />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });
    });
  });
});

