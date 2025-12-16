/**
 * Protected Route Component Tests
 * 
 * Tests for route protection and session state handling
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../hooks/useAuth';
import * as sessionPersistence from '../../../utils/sessionPersistence';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../utils/sessionPersistence');

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockLoadSessionState = sessionPersistence.loadSessionState as ReturnType<typeof vi.fn>;
const mockGetCurrentSessionId = sessionPersistence.getCurrentSessionId as ReturnType<typeof vi.fn>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentSessionId.mockReturnValue(null);
  });

  const renderWithRouter = (element: React.ReactElement, initialEntries = ['/test']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        {element}
      </MemoryRouter>
    );
  };

  describe('Authentication Check', () => {
    it('should redirect to login if not authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        logout: vi.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Should redirect to login
      expect(window.location.pathname).toBe('/login');
    });

    it('should render children if authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Session Requirement', () => {
    it('should redirect if session required but not found', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockResolvedValue(null);

      renderWithRouter(
        <ProtectedRoute requireSession={true} redirectTo="/command-center">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockLoadSessionState).toHaveBeenCalledWith('session-123');
      });
    });

    it('should render children if session required and found', async () => {
      const mockSessionState = {
        sessionId: 'session-123',
        patientId: 'patient-456',
        sessionType: 'initial' as const,
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress' as const,
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockResolvedValue(mockSessionState);

      renderWithRouter(
        <ProtectedRoute requireSession={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Patient Requirement', () => {
    it('should redirect if patient required but session has no patient', async () => {
      const mockSessionState = {
        sessionId: 'session-123',
        patientId: '',
        sessionType: 'initial' as const,
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress' as const,
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockResolvedValue(mockSessionState);

      renderWithRouter(
        <ProtectedRoute requirePatient={true} redirectTo="/command-center">
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockLoadSessionState).toHaveBeenCalled();
      });
    });

    it('should render children if patient required and session has patient', async () => {
      const mockSessionState = {
        sessionId: 'session-123',
        patientId: 'patient-456',
        sessionType: 'initial' as const,
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress' as const,
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockResolvedValue(mockSessionState);

      renderWithRouter(
        <ProtectedRoute requirePatient={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while checking session', async () => {
      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 100))
      );

      renderWithRouter(
        <ProtectedRoute requireSession={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Combined Requirements', () => {
    it('should check both session and patient requirements', async () => {
      const mockSessionState = {
        sessionId: 'session-123',
        patientId: 'patient-456',
        sessionType: 'initial' as const,
        additionalOutputs: [],
        transcript: '',
        isRecording: false,
        startTime: new Date(),
        lastUpdated: new Date(),
        status: 'in-progress' as const,
      };

      mockUseAuth.mockReturnValue({
        user: { uid: 'user-123', email: 'test@example.com' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      mockGetCurrentSessionId.mockReturnValue('session-123');
      mockLoadSessionState.mockResolvedValue(mockSessionState);

      renderWithRouter(
        <ProtectedRoute requireSession={true} requirePatient={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockLoadSessionState).toHaveBeenCalledWith('session-123');
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });
});

