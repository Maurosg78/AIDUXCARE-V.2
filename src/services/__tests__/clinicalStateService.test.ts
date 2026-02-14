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
const mockGetNotesByPatient = vi.fn< (patientId: string) => Promise<Array<{
  id: string;
  sessionId: string;
  soapData: { subjective: string; objective: string; assessment: string; plan: string };
  createdAt: string;
}>> >();
const mockCreateBaseline = vi.fn< () => Promise<string> >();

vi.mock('../patientService', () => ({
  PatientService: {
    getPatientById: (patientId: string) => mockGetPatientById(patientId),
    updatePatient: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../clinicalBaselineService', () => ({
  getBaselineById: (baselineId: string) => mockGetBaselineById(baselineId),
  createBaseline: (...args: unknown[]) => mockCreateBaseline(...args),
}));

vi.mock('../PersistenceService', () => ({
  PersistenceService: {
    getNotesByPatient: (patientId: string) => mockGetNotesByPatient(patientId),
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
    mockGetNotesByPatient.mockResolvedValue([]);
    mockCreateBaseline.mockResolvedValue('auto-baseline-id');
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
    it('returns hasBaseline false when patient has no activeBaselineId and no notes', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-none' });
      mockGetNotesByPatient.mockResolvedValue([]);

      const state = await getClinicalState('p-none', 'user-1');

      expect(state.hasBaseline).toBe(false);
      expect(state.baselineSOAP).toBeUndefined();
    });
  });

  describe('WO-AUTO-BASELINE-01: fallback from finalized initial SOAP', () => {
    it('returns hasBaseline true and baselineSOAP when no activeBaselineId but last note exists', async () => {
      mockGetPatientById.mockResolvedValue({ id: 'p-fallback' });
      mockGetNotesByPatient.mockResolvedValue([
        {
          id: 'note-1',
          sessionId: 'session-1',
          soapData: {
            subjective: 'S',
            objective: 'O',
            assessment: 'A',
            plan: 'P',
          },
          createdAt: new Date().toISOString(),
        },
      ]);

      const state = await getClinicalState('p-fallback', 'user-1');

      expect(state.hasBaseline).toBe(true);
      expect(state.baselineSOAP).toBeDefined();
      expect(state.baselineSOAP?.subjective).toBe('S');
      expect(state.baselineSOAP?.objective).toBe('O');
      expect(state.baselineSOAP?.assessment).toBe('A');
      expect(state.baselineSOAP?.plan).toBe('P');
      expect(state.baselineSOAP?.encounterId).toBe('session-1');
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

  describe('FIX-PHASE0-BASELINE-HYDRATION: Same-day multiple FOLLOWUPs (Bug Zuw7dUjc9dEN8CQPGGkH)', () => {
    it('should use FOLLOWUP #1 as baseline for FOLLOWUP #2 (same day)', async () => {
      const patientId = 'test-patient-123';
      const userId = 'test-user-456';

      mockGetPatientById.mockResolvedValue({
        id: patientId,
        fullName: 'Test Patient',
        activeBaselineId: 'baseline-initial-2-weeks-ago',
      } as any);

      const followup1Note = {
        id: 'note-followup1-today',
        patientId,
        sessionId: 'session-followup1',
        soapData: {
          subjective: 'FOLLOWUP #1: Paciente refiere empeoramiento del dolor lumbar tras ejercicios',
          objective: 'FOLLOWUP #1: ROM limitado, dolor a palpación L4-L5',
          assessment: 'FOLLOWUP #1: Lumbalgia mecánica, respuesta inadecuada al tratamiento inicial',
          plan: 'FOLLOWUP #1: Modificar ejercicios, agregar terapia manual',
        },
        visitType: 'follow-up',
        createdAt: '2026-02-13T09:00:00.000Z',
      };

      const initialNote = {
        id: 'note-initial-2-weeks-ago',
        patientId,
        sessionId: 'session-initial',
        soapData: {
          subjective: 'INITIAL: Dolor lumbar crónico desde hace 6 meses',
          objective: 'INITIAL: ROM completo, sin limitaciones',
          assessment: 'INITIAL: Lumbalgia mecánica inespecífica',
          plan: 'INITIAL: Ejercicios de estabilización lumbar',
        },
        visitType: 'initial',
        createdAt: '2026-01-30T10:00:00.000Z',
      };

      mockGetNotesByPatient.mockResolvedValue([followup1Note as any, initialNote as any]);

      const state = await getClinicalState(patientId, userId);

      expect(state.hasBaseline).toBe(true);
      expect(state.baselineSOAP).toBeDefined();
      expect(state.baselineSOAP?.subjective).toContain('FOLLOWUP #1');
      expect(state.baselineSOAP?.plan).toContain('Modificar ejercicios');
      expect(state.baselineSOAP?.subjective).not.toContain('INITIAL');
      expect(new Date(state.baselineSOAP!.date).toISOString()).toBe('2026-02-13T09:00:00.000Z');
    });

    it('should fall back to activeBaselineId only when no notes exist', async () => {
      const patientId = 'test-patient-123';
      const userId = 'test-user-456';
      const activeBaselineId = 'baseline-123';

      mockGetPatientById.mockResolvedValue({
        id: patientId,
        fullName: 'Test Patient',
        activeBaselineId,
      } as any);

      mockGetNotesByPatient.mockResolvedValue([]);

      mockGetBaselineById.mockResolvedValue({
        id: activeBaselineId,
        patientId,
        sourceSoapId: 'soap-123',
        snapshot: {
          primaryAssessment: 'Fallback baseline assessment',
          keyFindings: ['Fallback subjective', 'Fallback objective'],
          planSummary: 'Fallback plan',
        },
        createdAt: new Date('2026-01-01'),
        createdBy: userId,
      } as any);

      const state = await getClinicalState(patientId, userId);

      expect(state.hasBaseline).toBe(true);
      expect(state.baselineSOAP?.assessment).toContain('Fallback');
    });
  });
});
