/**
 * Pruebas de evidencia: flujo de alimentación de sesiones (backend).
 *
 * Casos ficticios con datos concretos para entender:
 * - Cómo el Initial Assessment (snapshot) alimenta al Follow-up (baselineSOAP).
 * - Mapeo exacto snapshot → baselineSOAP.
 * - Qué entra y qué NO entra (precauciones, etc.).
 *
 * Sin teoría: solo asserts con valores esperados. Luego se valida en UI con pacientes en Aidux.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetPatientById = vi.fn<
  (patientId: string) => Promise<{ id: string; activeBaselineId?: string } | null>
>();
const mockGetBaselineById = vi.fn<
  (baselineId: string) => Promise<{
    id: string;
    patientId: string;
    sourceSoapId: string;
    sourceSessionId?: string;
    snapshot: {
      primaryAssessment: string;
      keyFindings: string[];
      precautions?: string[];
      planSummary: string;
    };
    createdAt: Date | { toDate: () => Date };
    createdBy: string;
  } | null>
>();
const mockCheckConsentViaServer = vi.fn<
  (patientId: string) => Promise<{
    success: boolean;
    hasValidConsent: boolean;
    status: 'ongoing' | 'session-only' | 'declined' | null;
  }>
>();
const mockIsFirstSession = vi.fn<(patientId: string, userId?: string) => Promise<boolean>>();

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
// Casos ficticios (mismo formato que ProfessionalWorkflowPage → createBaseline)
// ---------------------------------------------------------------------------

/** SOAP ficticio de Initial Assessment cerrado (como lo arma handleCloseInitialAssessment). */
const SOAP_INITIAL_FICTICIO = {
  subjective: 'Paciente refiere dolor lumbar de 2 semanas, sin irradiación. Mejoría con reposo.',
  objective: 'ROM lumbar limitado en flexión. Prueba de elevación pierna recta negativa. Sin déficit neurológico.',
  assessment: 'Lumbalgia mecánica aguda, sin banderas rojas.',
  plan: 'Interventions: MT lumbar, movilización. Home Exercises: estiramiento isquiotibiales 2x/día. Goals: retorno a ADL en 2 semanas. Follow-up: 1 semana.',
  precautions: 'Evitar flexión repetida y carga pesada hasta revaloración.',
};

/** Snapshot tal como se persiste en clinical_baselines (desde SOAP arriba). */
function snapshotDesdeSOAPFicticio() {
  return {
    primaryAssessment: SOAP_INITIAL_FICTICIO.assessment,
    keyFindings: [
      SOAP_INITIAL_FICTICIO.subjective,
      SOAP_INITIAL_FICTICIO.objective,
    ].filter(Boolean),
    precautions: SOAP_INITIAL_FICTICIO.precautions
      ? [SOAP_INITIAL_FICTICIO.precautions]
      : undefined,
    planSummary: SOAP_INITIAL_FICTICIO.plan,
  };
}

/** Baseline ficticio como lo devolvería getBaselineById (Firestore). */
function baselineFicticio(patientId: string, baselineId: string) {
  const snap = snapshotDesdeSOAPFicticio();
  const createdAt = new Date('2026-01-20T10:00:00Z');
  return {
    id: baselineId,
    patientId,
    sourceSoapId: 'session-ia-001',
    sourceSessionId: 'session-ia-001',
    snapshot: snap,
    createdAt,
    createdBy: 'user-fisio-001',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckConsentViaServer.mockResolvedValue({
    success: true,
    hasValidConsent: true,
    status: 'ongoing',
  });
  mockIsFirstSession.mockResolvedValue(false);
});

// ---------------------------------------------------------------------------
// Evidencia 1: Flujo completo Initial → Follow-up (alimentación)
// ---------------------------------------------------------------------------

describe('Evidencia: flujo de alimentación Initial Assessment → Follow-up', () => {
  it('E1: Paciente con activeBaselineId recibe baselineSOAP con contenido exacto del snapshot', async () => {
    const patientId = 'patient-ficticio-001';
    const baselineId = 'baseline-ficticio-001';
    mockGetPatientById.mockResolvedValue({ id: patientId, activeBaselineId: baselineId });
    mockGetBaselineById.mockResolvedValue(baselineFicticio(patientId, baselineId));

    const state = await getClinicalState(patientId, 'user-fisio-001');

    expect(state.hasBaseline).toBe(true);
    expect(state.baselineSOAP).toBeDefined();

    // Evidencia concreta: mapeo snapshot → baselineSOAP
    expect(state.baselineSOAP?.subjective).toBe(SOAP_INITIAL_FICTICIO.subjective);
    expect(state.baselineSOAP?.objective).toBe(SOAP_INITIAL_FICTICIO.objective);
    expect(state.baselineSOAP?.assessment).toBe(SOAP_INITIAL_FICTICIO.assessment);
    expect(state.baselineSOAP?.plan).toBe(SOAP_INITIAL_FICTICIO.plan);
    expect(state.baselineSOAP?.encounterId).toBe('session-ia-001');
    expect(state.baselineSOAP?.date).toBeInstanceOf(Date);
  });

  it('E2: Sin activeBaselineId el follow-up no tiene baseline (gate)', async () => {
    mockGetPatientById.mockResolvedValue({
      id: 'patient-sin-baseline',
      activeBaselineId: undefined,
    });

    const state = await getClinicalState('patient-sin-baseline', 'user-1');

    expect(state.hasBaseline).toBe(false);
    expect(state.baselineSOAP).toBeUndefined();
    expect(mockGetBaselineById).not.toHaveBeenCalled();
  });

  it('E3: activeBaselineId presente pero documento no encontrado → hasBaseline false', async () => {
    mockGetPatientById.mockResolvedValue({
      id: 'p-1',
      activeBaselineId: 'baseline-borrado-o-inexistente',
    });
    mockGetBaselineById.mockResolvedValue(null);

    const state = await getClinicalState('p-1', 'user-1');

    expect(state.hasBaseline).toBe(false);
    expect(state.baselineSOAP).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Evidencia 2: Mapeo keyFindings → subjective / objective
// ---------------------------------------------------------------------------

describe('Evidencia: mapeo keyFindings → subjective y objective', () => {
  it('E4: keyFindings[0] va a subjective, resto unido con \\n a objective', async () => {
    const patientId = 'p-map';
    const baselineId = 'bl-map';
    mockGetPatientById.mockResolvedValue({ id: patientId, activeBaselineId: baselineId });
    mockGetBaselineById.mockResolvedValue({
      id: baselineId,
      patientId,
      sourceSoapId: 's1',
      snapshot: {
        primaryAssessment: 'Assessment corto',
        keyFindings: [
          'S: primer hallazgo (subjective)',
          'O: segundo hallazgo (objective 1)',
          'O: tercer hallazgo (objective 2)',
        ],
        planSummary: 'Plan resumido',
      },
      createdAt: new Date(),
      createdBy: 'u1',
    });

    const state = await getClinicalState(patientId, 'u1');

    expect(state.baselineSOAP?.subjective).toBe('S: primer hallazgo (subjective)');
    expect(state.baselineSOAP?.objective).toBe(
      'O: segundo hallazgo (objective 1)\nO: tercer hallazgo (objective 2)'
    );
  });

  it('E5: keyFindings con un solo elemento → objective vacío', async () => {
    mockGetPatientById.mockResolvedValue({ id: 'p-1', activeBaselineId: 'bl-1' });
    mockGetBaselineById.mockResolvedValue({
      id: 'bl-1',
      patientId: 'p-1',
      sourceSoapId: 's1',
      snapshot: {
        primaryAssessment: 'A',
        keyFindings: ['Solo subjective'],
        planSummary: 'P',
      },
      createdAt: new Date(),
      createdBy: 'u1',
    });

    const state = await getClinicalState('p-1', 'u1');

    expect(state.baselineSOAP?.subjective).toBe('Solo subjective');
    expect(state.baselineSOAP?.objective).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Evidencia 3: Precautions en snapshot NO entran a baselineSOAP (gap conocido)
// ---------------------------------------------------------------------------

describe('Evidencia: precautions en snapshot no forman parte de baselineSOAP', () => {
  it('E6: Baseline con snapshot.precautions no expone precautions en baselineSOAP', async () => {
    mockGetPatientById.mockResolvedValue({ id: 'p-prec', activeBaselineId: 'bl-prec' });
    mockGetBaselineById.mockResolvedValue({
      id: 'bl-prec',
      patientId: 'p-prec',
      sourceSoapId: 's1',
      snapshot: {
        primaryAssessment: 'Lumbalgia.',
        keyFindings: ['Subj', 'Obj'],
        precautions: ['No flexión repetida', 'No carga >5kg'],
        planSummary: 'Plan.',
      },
      createdAt: new Date(),
      createdBy: 'u1',
    });

    const state = await getClinicalState('p-prec', 'u1');

    expect(state.baselineSOAP).toBeDefined();
    // baselineSOAP no tiene campo precautions (tipo ClinicalState.baselineSOAP)
    const keys = state.baselineSOAP ? Object.keys(state.baselineSOAP) : [];
    expect(keys).toEqual(
      expect.arrayContaining(['subjective', 'objective', 'assessment', 'plan', 'encounterId', 'date'])
    );
    expect(keys).not.toContain('precautions');
  });
});

// ---------------------------------------------------------------------------
// Evidencia 4: Consent y isFirstSession no alteran baseline (solo gate)
// ---------------------------------------------------------------------------

describe('Evidencia: consent e isFirstSession no modifican baselineSOAP', () => {
  it('E7: Con consent declined sigue llegando el mismo baselineSOAP', async () => {
    const patientId = 'p-consent';
    const baselineId = 'bl-consent';
    mockGetPatientById.mockResolvedValue({ id: patientId, activeBaselineId: baselineId });
    mockGetBaselineById.mockResolvedValue(baselineFicticio(patientId, baselineId));
    mockCheckConsentViaServer.mockResolvedValue({
      success: true,
      hasValidConsent: false,
      status: 'declined',
    });

    const state = await getClinicalState(patientId, 'u1');

    expect(state.hasBaseline).toBe(true);
    expect(state.baselineSOAP?.plan).toBe(SOAP_INITIAL_FICTICIO.plan);
    expect(state.consent.hasValidConsent).toBe(false);
  });
});
