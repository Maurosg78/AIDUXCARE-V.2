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

const mockGetPatientById = vi.fn< (patientId: string) => Promise<{ id: string; activeBaselineId?: string } | null> >();
const mockGetBaselineById = vi.fn< (baselineId: string) => Promise<{
  id: string;
  patientId: string;
  sourceSoapId: string;
  snapshot: { primaryAssessment: string; keyFindings: string[]; planSummary: string };
  createdAt: Date;
} | null> >();
const mockCheckConsentViaServer = vi.fn< (patientId: string) => Promise<{
  success: boolean;
  hasValidConsent: boolean;
  status: 'ongoing' | 'session-only' | 'declined' | null;
}> >();
const mockIsFirstSession = vi.fn< (patientId: string, userId?: string) => Promise<boolean> >();

vi.mock('../patientService', () => ({
  PatientService: {
    getPatientById: (patientId: string) => mockGetPatientById(patientId),
  },
}));

vi.mock('../clinicalBaselineService', () => ({
  getBaselineById: (baselineId: string) => mockGetBaselineById(baselineId),
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

function makePersistedBaseline(patientId: string) {
  const date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return {
    id: 'bl-1',
    patientId,
    sourceSoapId: 'enc-1',
    snapshot: {
      primaryAssessment: 'A',
      keyFindings: ['S', 'O'],
      planSummary: 'P',
    },
    createdAt: date,
  };
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
    it('returns hasBaseline true and baselineSOAP when persisted baseline exists', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-1', activeBaselineId: 'bl-1' });
      mockGetBaselineById.mockResolvedValue(makePersistedBaseline('p-1'));

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.hasBaseline).toBe(true);
      expect(state.baselineSOAP).toBeDefined();
      expect(state.baselineSOAP?.encounterId).toBe('enc-1');
      expect(state.baselineSOAP?.plan).toBe('P');
      expect(state.baselineSOAP?.assessment).toBe('A');
      expect(state.baselineSOAP?.date).toBeInstanceOf(Date);
    });
  });

  describe('no SOAP previo → hasBaseline = false', () => {
    it('returns hasBaseline false when patient has no activeBaselineId', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-none' });

      const state = await getClinicalState('p-none', 'user-1');

      expect(state.hasBaseline).toBe(false);
      expect(state.baselineSOAP).toBeUndefined();
    });
  });

  describe('consentimiento válido rehidratado', () => {
    it('returns consent from checkConsentViaServer', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-1' });
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
      mockGetPatientById.mockResolvedValue({ id: 'p-1' });
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
      mockGetPatientById.mockResolvedValue({ id: 'p-1' });
      mockIsFirstSession.mockResolvedValue(true);

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.isFirstSession).toBe(true);
    });

    it('returns isFirstSession false when sessionService.isFirstSession returns false', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-1' });
      mockIsFirstSession.mockResolvedValue(false);

      const state = await getClinicalState('p-1', 'user-1');

      expect(state.isFirstSession).toBe(false);
    });
  });
});
