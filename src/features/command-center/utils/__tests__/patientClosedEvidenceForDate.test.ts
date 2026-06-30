import { Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { patientHasClosedClinicalEvidenceForDate } from '../patientClosedEvidenceForDate';

vi.mock('../../../../repositories/encountersRepo', () => ({
  encountersRepo: {
    getEncountersByPatient: vi.fn(),
  },
}));

vi.mock('../../../../services/PersistenceService', () => ({
  PersistenceService: {
    getNotesByPatient: vi.fn(),
  },
}));

import { encountersRepo } from '../../../../repositories/encountersRepo';
import { PersistenceService } from '../../../../services/PersistenceService';

type EncounterRecord = Awaited<ReturnType<typeof encountersRepo.getEncountersByPatient>>[number];
type NoteRecord = Awaited<ReturnType<typeof PersistenceService.getNotesByPatient>>[number];
type EncounterStatusForTest = EncounterRecord['status'] | 'in_progress';
type EncounterMockOverrides = Partial<Omit<EncounterRecord, 'status' | 'encounterDate'>> & {
  status?: EncounterStatusForTest;
  encounterDate?: EncounterRecord['encounterDate'];
};
type NoteMockOverrides = Partial<NoteRecord> & {
  soapStatus?: string;
};

const mockGetEncountersByPatient = vi.mocked(encountersRepo.getEncountersByPatient);
const mockGetNotesByPatient = vi.mocked(PersistenceService.getNotesByPatient);

function buildEncounterMock(overrides: EncounterMockOverrides = {}): EncounterRecord {
  const defaultEncounter: EncounterRecord = {
    id: 'encounter-test-001',
    patientId: 'patient-test-001',
    authorUid: 'professional-test-001',
    status: 'completed',
    encounterDate: Timestamp.fromDate(new Date('2026-06-29T10:00:00Z')),
    createdAt: Timestamp.fromDate(new Date('2026-06-29T10:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2026-06-29T10:00:00Z')),
  };
  const mergedEncounter = {
    ...defaultEncounter,
    ...overrides,
    status: (overrides.status ?? defaultEncounter.status) as EncounterRecord['status'],
  };

  return mergedEncounter;
}

function buildNoteMock(overrides: NoteMockOverrides = {}): NoteRecord {
  const defaultNote: NoteRecord = {
    id: 'note-test-001',
    patientId: 'patient-test-001',
    sessionId: 'session-test-001',
    clinicalDate: '2026-06-29',
    soapData: {
      subjective: 'Paciente refiere mejoría',
      objective: 'ROM conservado',
      assessment: 'Evolución favorable',
      plan: 'Continuar plan',
      confidence: 0.9,
      timestamp: '2026-06-29T10:00:00.000Z',
    },
    encryptedData: {
      iv: 'iv-test',
      encryptedData: 'encrypted-test',
    },
    createdAt: '2026-06-29T10:00:00.000Z',
    updatedAt: '2026-06-29T10:00:00.000Z',
    ownerUid: 'professional-test-001',
    status: 'finalized',
  };
  const mergedNote = {
    ...defaultNote,
    ...overrides,
  };

  return mergedNote;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEncountersByPatient.mockResolvedValue([]);
  mockGetNotesByPatient.mockResolvedValue([]);
});

describe('patientHasClosedClinicalEvidenceForDate — Validación de inputs', () => {
  it('protege la migración cuando patientId está vacío', async () => {
    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
    expect(mockGetEncountersByPatient).not.toHaveBeenCalled();
    expect(mockGetNotesByPatient).not.toHaveBeenCalled();
  });

  it('protege la migración cuando patientId contiene solo espacios', async () => {
    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('   ', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
    expect(mockGetEncountersByPatient).not.toHaveBeenCalled();
    expect(mockGetNotesByPatient).not.toHaveBeenCalled();
  });

  it('protege la migración cuando la fecha clínica no usa formato YYYY-MM-DD', async () => {
    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '29-06-2026');

    expect(hasClosedEvidence).toBe(false);
    expect(mockGetEncountersByPatient).not.toHaveBeenCalled();
    expect(mockGetNotesByPatient).not.toHaveBeenCalled();
  });

  it('protege la migración cuando la fecha clínica está vacía', async () => {
    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '');

    expect(hasClosedEvidence).toBe(false);
    expect(mockGetEncountersByPatient).not.toHaveBeenCalled();
    expect(mockGetNotesByPatient).not.toHaveBeenCalled();
  });
});

describe('patientHasClosedClinicalEvidenceForDate — Evidencia desde encounters', () => {
  it('reconoce atención cerrada cuando existe encounter completed en la fecha clínica', async () => {
    mockGetEncountersByPatient.mockResolvedValue([buildEncounterMock()]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(true);
  });

  it('reconoce atención cerrada cuando existe encounter signed en la fecha clínica', async () => {
    mockGetEncountersByPatient.mockResolvedValue([
      buildEncounterMock({
        status: 'signed',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(true);
  });

  it('mantiene pendiente cuando los encounters no están cerrados en la fecha clínica', async () => {
    mockGetEncountersByPatient.mockResolvedValue([
      buildEncounterMock({
        status: 'draft',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });

  it('mantiene pendiente cuando los encounters cerrados pertenecen a otra fecha clínica', async () => {
    mockGetEncountersByPatient.mockResolvedValue([
      buildEncounterMock({
        encounterDate: Timestamp.fromDate(new Date('2026-06-28T10:00:00Z')),
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });

  it('mantiene pendiente cuando el encounter está draft o in_progress en esa fecha clínica', async () => {
    mockGetEncountersByPatient.mockResolvedValue([
      buildEncounterMock({
        status: 'draft',
      }),
      buildEncounterMock({
        status: 'in_progress',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });
});

describe('patientHasClosedClinicalEvidenceForDate — Evidencia desde notes', () => {
  it('reconoce atención cerrada cuando existe note finalized en clinicalDate', async () => {
    mockGetNotesByPatient.mockResolvedValue([buildNoteMock()]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(true);
  });

  it('reconoce atención cerrada cuando existe soapStatus finalized legacy', async () => {
    mockGetNotesByPatient.mockResolvedValue([
      buildNoteMock({
        status: 'draft',
        soapStatus: 'finalized',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(true);
  });

  it('mantiene pendiente cuando las notes no están finalizadas en la fecha clínica', async () => {
    mockGetNotesByPatient.mockResolvedValue([
      buildNoteMock({
        status: 'draft',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });

  it('mantiene pendiente cuando las notes finalizadas pertenecen a otra fecha clínica', async () => {
    mockGetNotesByPatient.mockResolvedValue([
      buildNoteMock({
        clinicalDate: '2026-06-28',
      }),
    ]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });
});

describe('patientHasClosedClinicalEvidenceForDate — Comportamiento fail-safe', () => {
  it('mantiene pendiente cuando la lectura de encounters falla', async () => {
    mockGetEncountersByPatient.mockRejectedValue(new Error('encounters unavailable'));

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });

  it('mantiene pendiente cuando la lectura de notes falla', async () => {
    mockGetNotesByPatient.mockRejectedValue(new Error('notes unavailable'));

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(false);
  });

  it('no propaga excepciones y siempre devuelve booleano de seguridad', async () => {
    mockGetEncountersByPatient.mockRejectedValue(new Error('firestore unavailable'));

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(typeof hasClosedEvidence).toBe('boolean');
    expect(hasClosedEvidence).toBe(false);
  });
});

describe('patientHasClosedClinicalEvidenceForDate — Optimización de orden', () => {
  it('evita consultar notes cuando encounters ya prueban cierre clínico', async () => {
    mockGetEncountersByPatient.mockResolvedValue([buildEncounterMock()]);

    const hasClosedEvidence = await patientHasClosedClinicalEvidenceForDate('patient-test-001', '2026-06-29');

    expect(hasClosedEvidence).toBe(true);
    expect(mockGetNotesByPatient).not.toHaveBeenCalled();
  });
});
