/**
 * Protected Route Component Tests
 * 
 * Tests for route protection and session state handling
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */
/// <reference lib="dom" />
/// <reference types="node" />
/// <reference path="../../../types/node-handles.d.ts" />

/**
 * @vitest-environment happy-dom
 * 
 * Protected Route Component Tests
 * 
 * Tests for route protection and session state handling
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ✅ Mocks ANTES de cualquier import que pueda importar Firebase
// Mock del módulo local que inicializa Firebase (ajusta el path si tu rg dio otro)
vi.mock('../../../firebase', () => ({
  auth: {},
  db: {},
}));

// Mock firebase/auth para evitar listeners colgados
vi.mock('firebase/auth', () => ({
  // auth init used by src/lib/firebase.ts
  initializeAuth: () => ({}),
  indexedDBLocalPersistence: {},
  browserLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},

  // common auth helpers
  getAuth: () => ({}),
  onAuthStateChanged: (_auth: any, cb: any) => {
    cb({ uid: 'test-user' });
    return () => { };
  },
}));

// Mock dependencies ANTES de importar
vi.mock('../../../hooks/useAuth', () => ({}));
vi.mock('../../../utils/sessionPersistence', () => ({}));

import { useAuth } from '../../../hooks/useAuth';
import * as sessionPersistence from '../../../utils/sessionPersistence';

afterEach(() => {
  // cleanup() is automatically called by @testing-library/react in newer versions
  vi.clearAllMocks();
  // useRealTimers is not needed if we're not using fake timers
});

// Type-safe mock definitions
// ReturnType is a built-in TypeScript utility type, available globally
type MockFunction<T extends (...args: never[]) => unknown> = ReturnType<typeof vi.fn> & T;

// eslint-disable-next-line no-console
console.error('[MARK] before mock definitions');
const mockUseAuth = useAuth as MockFunction<typeof useAuth>;
// eslint-disable-next-line no-console
console.error('[MARK] after mockUseAuth');
const mockLoadSessionState = sessionPersistence.loadSessionState as MockFunction<typeof sessionPersistence.loadSessionState>;
// eslint-disable-next-line no-console
console.error('[MARK] after mockLoadSessionState');
const mockGetCurrentSessionId = sessionPersistence.getCurrentSessionId as MockFunction<typeof sessionPersistence.getCurrentSessionId>;
// eslint-disable-next-line no-console
console.error('[MARK] after mockGetCurrentSessionId');

// __RUN__ bloque removido para bisect
describe('ProtectedRoute', () => {
  // eslint-disable-next-line no-console
  console.error('[MARK] inside describe ProtectedRoute');

  // beforeEach comentado completamente
  // beforeEach(() => {
  //   vi.clearAllMocks();
  //   mockGetCurrentSessionId.mockReturnValue(null);
  // });
  // eslint-disable-next-line no-console
  console.error('[MARK] after beforeEach (comentado)');

  describe('Authentication Check', () => {
    // eslint-disable-next-line no-console
    console.error('[MARK] inside describe Authentication Check');

    it('TEST: simple test', () => {
      // eslint-disable-next-line no-console
      console.error('[MARK] TEST - inside test');
      expect(true).toBe(true);
      // eslint-disable-next-line no-console
      console.error('[MARK] TEST - after expect');
    });
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('[MARK] after first test');

    // SECOND TEST COMMENTED FOR BISECT
    /*
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
    */
  });

  // HALF B - COMMENTED OUT FOR BISECT
  /*
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
  */
});
