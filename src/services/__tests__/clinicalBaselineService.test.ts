/**
 * Casos simulados: clinicalBaselineService (backend).
 *
 * Verifica:
 * - createBaselineFromMinimalSOAP: validación de plan, snapshot shape, source ongoing_intake.
 * - Conexión con el flujo Ongoing Patient First Time (modal → baseline → getClinicalState).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collection, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';

const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: (...args: unknown[]) => {
      mockCollection(...args);
      return {};
    },
    doc: (...args: unknown[]) => {
      mockDoc(...args);
      return { id: 'bl-simulated-001' };
    },
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    getDoc: (...args: unknown[]) => mockGetDoc(...args),
    getDocs: (...args: unknown[]) => mockGetDocs(...args),
    query: vi.fn((...a: unknown[]) => a),
    where: vi.fn((...a: unknown[]) => a),
    limit: vi.fn((n: number) => n),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

vi.mock('../lib/firebase', () => ({ db: {} }));

import {
  createBaselineFromMinimalSOAP,
  getBaselineById,
  hasBaselineForPatient,
  type SOAPForBaseline,
  type MinimalBaselineSource,
} from '../clinicalBaselineService';

beforeEach(() => {
  vi.clearAllMocks();
  mockSetDoc.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// createBaselineFromMinimalSOAP — validación de plan
// ---------------------------------------------------------------------------

describe('createBaselineFromMinimalSOAP — validación', () => {
  const validSoap: SOAPForBaseline = {
    subjective: 'Chief complaint / subjective',
    objective: 'Objective',
    assessment: 'Assessment',
    plan: 'Continuar MT lumbar 2x/semana. Reevaluar en 4 semanas.',
  };

  it('rechaza plan con menos de 15 caracteres', async () => {
    await expect(
      createBaselineFromMinimalSOAP({
        patientId: 'p1',
        soap: { ...validSoap, plan: 'Corto' },
        createdBy: 'user-1',
        source: 'ongoing_intake',
      })
    ).rejects.toThrow('Para poder generar follow-ups');

    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('rechaza plan genérico "paciente en tratamiento"', async () => {
    await expect(
      createBaselineFromMinimalSOAP({
        patientId: 'p1',
        soap: { ...validSoap, plan: 'paciente en tratamiento.' },
        createdBy: 'user-1',
        source: 'ongoing_intake',
      })
    ).rejects.toThrow('Para poder generar follow-ups');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('rechaza plan genérico "en tratamiento"', async () => {
    await expect(
      createBaselineFromMinimalSOAP({
        patientId: 'p1',
        soap: { ...validSoap, plan: 'en tratamiento' },
        createdBy: 'user-1',
        source: 'ongoing_intake',
      })
    ).rejects.toThrow('Para poder generar follow-ups');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('rechaza plan "n/a"', async () => {
    await expect(
      createBaselineFromMinimalSOAP({
        patientId: 'p1',
        soap: { ...validSoap, plan: 'n/a.' },
        createdBy: 'user-1',
        source: 'ongoing_intake',
      })
    ).rejects.toThrow('Para poder generar follow-ups');
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('acepta plan válido y llama setDoc con snapshot correcto (ongoing_intake)', async () => {
    const patientId = 'patient-ongoing-001';
    const soap: SOAPForBaseline = {
      subjective: 'Dolor lumbar crónico, primera vez en AiDuxCare.',
      objective: 'Objective to be documented.',
      assessment: 'Impresión clínica.',
      plan: 'Continuar MT lumbar 2x/semana. Reevaluar en 4 semanas. Objetivo: retorno a trabajo.',
    };

    const id = await createBaselineFromMinimalSOAP({
      patientId,
      soap,
      createdBy: 'user-pilot-001',
      source: 'ongoing_intake',
    });

    expect(id).toBe('bl-simulated-001');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockSetDoc.mock.calls[0];
    expect(payload.patientId).toBe(patientId);
    expect(payload.sourceSoapId).toBe('bl-simulated-001');
    expect(payload.createdBy).toBe('user-pilot-001');
    expect(payload.source).toBe('ongoing_intake');
    expect(payload.createdFrom).toBe('patient_existing');
    // Snapshot shape: mismo que usa getBaselineById → baselineSOAP en clinicalStateService
    expect(payload.snapshot.primaryAssessment).toBe(soap.assessment);
    expect(payload.snapshot.keyFindings).toEqual([soap.subjective, soap.objective]);
    expect(payload.snapshot.planSummary).toBe(soap.plan);
  });

  it('acepta source manual_minimal y vertex_from_paste', async () => {
    const soap: SOAPForBaseline = {
      subjective: 'S',
      objective: 'O',
      assessment: 'A',
      plan: 'Plan de al menos quince caracteres aquí.',
    };
    for (const source of ['manual_minimal', 'vertex_from_paste'] as MinimalBaselineSource[]) {
      mockSetDoc.mockClear();
      const id = await createBaselineFromMinimalSOAP({
        patientId: 'p1',
        soap,
        createdBy: 'u1',
        source,
      });
      expect(id).toBe('bl-simulated-001');
      expect(mockSetDoc.mock.calls[0][1].source).toBe(source);
    }
  });
});

// ---------------------------------------------------------------------------
// getBaselineById — lectura simulada
// ---------------------------------------------------------------------------

describe('getBaselineById', () => {
  it('devuelve null si el documento no existe', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await getBaselineById('bl-inexistente');

    expect(result).toBeNull();
  });

  it('devuelve baseline con snapshot cuando el documento existe', async () => {
    const baselineId = 'bl-001';
    const patientId = 'p-001';
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: baselineId,
      data: () => ({
        patientId,
        sourceSoapId: baselineId,
        snapshot: {
          primaryAssessment: 'Assessment',
          keyFindings: ['Subj', 'Obj'],
          planSummary: 'Plan summary',
        },
        createdAt: new Date(),
        createdBy: 'user-1',
      }),
    });

    const result = await getBaselineById(baselineId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(baselineId);
    expect(result!.patientId).toBe(patientId);
    expect(result!.snapshot.primaryAssessment).toBe('Assessment');
    expect(result!.snapshot.keyFindings).toEqual(['Subj', 'Obj']);
    expect(result!.snapshot.planSummary).toBe('Plan summary');
  });
});

// ---------------------------------------------------------------------------
// hasBaselineForPatient
// ---------------------------------------------------------------------------

describe('hasBaselineForPatient', () => {
  it('devuelve true si hay al menos un baseline para el paciente', async () => {
    mockGetDocs.mockResolvedValue({ empty: false });

    const result = await hasBaselineForPatient('p-001');

    expect(result).toBe(true);
  });

  it('devuelve false si no hay baselines para el paciente', async () => {
    mockGetDocs.mockResolvedValue({ empty: true });

    const result = await hasBaselineForPatient('p-sin-baseline');

    expect(result).toBe(false);
  });
});
