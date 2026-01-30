/**
 * WO-CLINICAL-STATE-REHYDRATION-001 Fase 1: Tests for ClinicalStateService
 *
 * DoD:
 * - baseline existe → hasBaseline = true
 * - no SOAP previo → hasBaseline = false
 * - consentimiento válido rehidratado
 * - primer sesión correctamente detectada
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

interface MockBaseline {
  patientId: string;
  previousSOAP: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    encounterId: string;
    date: Date;
  };
  derivedFocus: unknown[];
  daysSinceLastVisit: number;
}

const mockBuildFollowUpClinicalBaseline = vi.fn< (patientId: string) => Promise<MockBaseline> >();
const mockCheckConsentViaServer = vi.fn< (patientId: string) => Promise<{
  success: boolean;
  hasValidConsent: boolean;
  status: 'ongoing' | 'session-only' | 'declined' | null;
}> >();
const mockIsFirstSession = vi.fn< (patientId: string, userId?: string) => Promise<boolean> >();

vi.mock('../followUp/FollowUpClinicalBaselineBuilder', () => ({
  buildFollowUpClinicalBaseline: (patientId: string) => mockBuildFollowUpClinicalBaseline(patientId),
  FollowUpNotAllowedError: class FollowUpNotAllowedError extends Error {
    constructor(m = 'Follow-up requires prior clinical history') {
      super(m);
      this.name = 'FollowUpNotAllowedError';
    }
  },
}));

vi.mock('../consentServerService', () => ({
  checkConsentViaServer: (patientId: string) => mockCheckConsentViaServer(patientId),
}));

vi.mock('../sessionService', () => ({
  default: {
    isFirstSession: (patientId: string, userId?: string) => mockIsFirstSession(patientId, userId),
  },
}));

import { getClinicalState } from '../clinicalStateService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBaseline(patientId: string): MockBaseline {
  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return {
    patientId,
    previousSOAP: {
      subjective: 'S',
      objective: 'O',
      assessment: 'A',
      plan: 'P',
      date,
      encounterId: 'enc-1',
    },
    derivedFocus: [],
    daysSinceLastVisit: 7,
  };
}

function makeNotAllowedError(): Error {
  const e = new Error('Follow-up requires prior clinical history');
  e.name = 'FollowUpNotAllowedError';
  return e;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClinicalStateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckConsentViaServer.mockResolvedValue({
      success: true,
      hasValidConsent: true,
      status: 'ongoing',
    });
    mockIsFirstSession.mockResolvedValue(false);
  });

  describe('baseline existe → hasBaseline = true', () => {
    it('returns hasBaseline true and baselineSOAP when buildFollowUpClinicalBaseline succeeds', async () => {
      const baseline = makeBaseline('p-1');
      mockBuildFollowUpClinicalBaseline.mockResolvedValue(baseline);

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.hasBaseline).toBe(true);
      expect(state.baselineSOAP).toBeDefined();
      expect(state.baselineSOAP?.encounterId).toBe('enc-1');
      expect(state.baselineSOAP?.plan).toBe('P');
      expect(state.baselineSOAP?.date).toBeInstanceOf(Date);
    });
  });

  describe('no SOAP previo → hasBaseline = false', () => {
    it('returns hasBaseline false when FollowUpNotAllowedError is thrown', async () => {
      mockBuildFollowUpClinicalBaseline.mockRejectedValue(makeNotAllowedError());

      const state = await getClinicalState('p-none', 'user-1');

      expect(state.hasBaseline).toBe(false);
      expect(state.baselineSOAP).toBeUndefined();
    });
  });

  describe('consentimiento válido rehidratado', () => {
    it('returns consent from checkConsentViaServer', async () => {
      mockBuildFollowUpClinicalBaseline.mockRejectedValue(makeNotAllowedError());
      mockCheckConsentViaServer.mockResolvedValue({
        success: true,
        hasValidConsent: true,
        status: 'session-only',
      });

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.consent.hasValidConsent).toBe(true);
      expect(state.consent.status).toBe('session-only');
    });

    it('returns consent declined when checkConsentViaServer says so', async () => {
      mockBuildFollowUpClinicalBaseline.mockRejectedValue(makeNotAllowedError());
      mockCheckConsentViaServer.mockResolvedValue({
        success: true,
        hasValidConsent: false,
        status: 'declined',
      });

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.consent.hasValidConsent).toBe(false);
      expect(state.consent.status).toBe('declined');
    });
  });

  describe('primer sesión correctamente detectada', () => {
    it('returns isFirstSession true when sessionService.isFirstSession returns true', async () => {
      mockBuildFollowUpClinicalBaseline.mockRejectedValue(makeNotAllowedError());
      mockIsFirstSession.mockResolvedValue(true);

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.isFirstSession).toBe(true);
    });

    it('returns isFirstSession false when sessionService.isFirstSession returns false', async () => {
      mockBuildFollowUpClinicalBaseline.mockRejectedValue(makeNotAllowedError());
      mockIsFirstSession.mockResolvedValue(false);

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.isFirstSession).toBe(false);
    });
  });
});
