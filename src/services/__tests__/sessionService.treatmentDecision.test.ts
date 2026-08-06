import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TreatmentDecision } from '../sessionService';
import {
  hydrateTreatmentDecisionItems,
  isActiveTreatmentDecisionItem,
} from '../../utils/treatmentDecisionItems';

type SessionFixture = {
  id: string;
  data: Record<string, unknown>;
};

type QueryConstraintFixture =
  | { kind: 'where'; field: string; operator: string; value: unknown }
  | { kind: 'orderBy'; field: string; direction: string }
  | { kind: 'startAfter'; documentId: string }
  | { kind: 'limit'; count: number };

const firestoreState = vi.hoisted(() => ({
  sessions: [] as SessionFixture[],
  rejectOrderedQueries: false,
}));

const firestoreMocks = vi.hoisted(() => ({
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  startAfter: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => {
  const toDocument = (fixture: SessionFixture) => ({
    id: fixture.id,
    data: () => fixture.data,
  });

  firestoreMocks.where.mockImplementation((field: string, operator: string, value: unknown) => ({
    kind: 'where',
    field,
    operator,
    value,
  } satisfies QueryConstraintFixture));
  firestoreMocks.orderBy.mockImplementation((field: string, direction: string) => ({
    kind: 'orderBy',
    field,
    direction,
  } satisfies QueryConstraintFixture));
  firestoreMocks.startAfter.mockImplementation((document: { id: string }) => ({
    kind: 'startAfter',
    documentId: document.id,
  } satisfies QueryConstraintFixture));
  firestoreMocks.limit.mockImplementation((count: number) => ({
    kind: 'limit',
    count,
  } satisfies QueryConstraintFixture));
  firestoreMocks.query.mockImplementation((...args: unknown[]) => args.slice(1));
  firestoreMocks.getDocs.mockImplementation(async (constraints: QueryConstraintFixture[]) => {
    const orderedConstraint = constraints.find((constraint) => constraint.kind === 'orderBy');
    if (orderedConstraint && firestoreState.rejectOrderedQueries) {
      throw new Error('FAILED_PRECONDITION: missing composite index');
    }

    let rows = [...firestoreState.sessions];
    for (const constraint of constraints) {
      if (constraint.kind !== 'where') continue;
      rows = rows.filter((fixture) => fixture.data[constraint.field] === constraint.value);
    }
    if (orderedConstraint?.kind === 'orderBy') {
      const direction = orderedConstraint.direction === 'desc' ? -1 : 1;
      rows.sort((a, b) => (
        String(a.data[orderedConstraint.field] || '').localeCompare(
          String(b.data[orderedConstraint.field] || ''),
        ) * direction
      ));
    }
    const cursor = constraints.find((constraint) => constraint.kind === 'startAfter');
    if (cursor?.kind === 'startAfter') {
      const cursorIndex = rows.findIndex((fixture) => fixture.id === cursor.documentId);
      rows = cursorIndex >= 0 ? rows.slice(cursorIndex + 1) : rows;
    }
    const limitConstraint = constraints.find((constraint) => constraint.kind === 'limit');
    if (limitConstraint?.kind === 'limit') {
      rows = rows.slice(0, limitConstraint.count);
    }
    const docs = rows.map(toDocument);
    return { docs, empty: docs.length === 0 };
  });

  return {
    collection: vi.fn(() => ({ path: 'sessions' })),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: firestoreMocks.getDocs,
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: firestoreMocks.query,
    where: firestoreMocks.where,
    orderBy: firestoreMocks.orderBy,
    startAfter: firestoreMocks.startAfter,
    serverTimestamp: vi.fn(),
    limit: firestoreMocks.limit,
  };
});

import sessionService from '../sessionService';

const PATIENT_ID = 'SOOZY6swk9FCz1GDWE6I';
const USER_ID = 'ff0w27nBbmMoVe1MnUOKq7gKEd32';
const MOBILE_HEP_LABEL = 'Teclear con pulgar en móvil: Integrar función móvil';

function buildDecision(
  sourceSessionId: string,
  removedPermanently: boolean,
  acceptedAt: string,
): TreatmentDecision {
  return {
    source: 'physio_final_decision',
    updatedAt: acceptedAt,
    acceptedAt,
    acceptedBy: USER_ID,
    sourceSessionId,
    confirmationMethod: 'edited',
    inClinicItems: [],
    homeProgramItems: [
      {
        id: 'hep-4',
        label: MOBILE_HEP_LABEL,
        completed: !removedPermanently,
        ...(removedPermanently
          ? {
              removedPermanently: true,
              removedPermanentlyAt: acceptedAt,
              removedPermanentlyBy: USER_ID,
            }
          : {}),
      },
    ],
  };
}

function buildCompletedSession(
  id: string,
  updatedAt: string,
  removedPermanently = false,
): SessionFixture {
  return {
    id,
    data: {
      patientId: PATIENT_ID,
      userId: USER_ID,
      status: 'completed',
      soapStatus: 'finalized',
      sessionType: 'followup',
      sessionDateKey: updatedAt.slice(0, 10),
      timestamp: updatedAt,
      createdAt: updatedAt,
      updatedAt,
      treatmentDecision: buildDecision(id, removedPermanently, updatedAt),
    },
  };
}

function isoAtDay(day: number): string {
  return new Date(Date.UTC(2026, 0, day, 10, 0, 0)).toISOString();
}

describe('SessionService.getLatestFinalizedTreatmentDecision', () => {
  beforeEach(() => {
    firestoreState.sessions = [];
    firestoreState.rejectOrderedQueries = false;
    vi.clearAllMocks();
  });

  it('ordena en Firestore antes de limitar para un paciente con más de 50 sesiones', async () => {
    firestoreState.sessions = Array.from({ length: 65 }, (_, index) => {
      const id = `session-${String(index).padStart(3, '0')}`;
      return buildCompletedSession(id, isoAtDay(index + 1), index === 64);
    });

    const result = await sessionService.getLatestFinalizedTreatmentDecision(
      PATIENT_ID,
      USER_ID,
      { asOfDateKey: '2026-03-31' },
    );

    expect(result?.sourceSessionId).toBe('session-064');
    expect(result?.homeProgramItems[0]).toMatchObject({ removedPermanently: true });
    const userIdQuery = firestoreMocks.query.mock.calls.find((call) => (
      call.some((constraint: QueryConstraintFixture) => (
        constraint.kind === 'where' && constraint.field === 'userId'
      ))
    ));
    const queryConstraints = userIdQuery?.slice(1) as QueryConstraintFixture[];
    const orderIndex = queryConstraints.findIndex((constraint) => constraint.kind === 'orderBy');
    const limitIndex = queryConstraints.findIndex((constraint) => constraint.kind === 'limit');
    expect(queryConstraints[orderIndex]).toEqual({
      kind: 'orderBy',
      field: 'updatedAt',
      direction: 'desc',
    });
    expect(orderIndex).toBeLessThan(limitIndex);
  });

  it('pagina cuando los 50 documentos más recientes no contienen una decisión finalizada', async () => {
    const finalized = buildCompletedSession('session-finalized-older', isoAtDay(1), true);
    const newerDrafts = Array.from({ length: 60 }, (_, index) => ({
      id: `draft-${String(index).padStart(3, '0')}`,
      data: {
        patientId: PATIENT_ID,
        userId: USER_ID,
        status: 'draft',
        soapStatus: 'draft',
        sessionType: 'followup',
        sessionDateKey: '2026-03-01',
        updatedAt: isoAtDay(index + 2),
      },
    }));
    firestoreState.sessions = [finalized, ...newerDrafts];

    const result = await sessionService.getLatestFinalizedTreatmentDecision(
      PATIENT_ID,
      USER_ID,
      { asOfDateKey: '2026-03-31' },
    );

    expect(result?.sourceSessionId).toBe('session-finalized-older');
    expect(firestoreMocks.startAfter).toHaveBeenCalled();
  });

  it('reconstruye las 169 sesiones de Luciana y selecciona julio, no mayo', async () => {
    const oldSessions = Array.from({ length: 167 }, (_, index) => buildCompletedSession(
      `luciana-history-${String(index).padStart(3, '0')}`,
      new Date(Date.UTC(2026, 2, 1, 0, index, 0)).toISOString(),
      false,
    ));
    const mayDecisionWithoutTombstone = buildCompletedSession(
      'ff0w27nBbmMoVe1MnUOKq7gKEd32-1780043857587',
      '2026-05-29T08:37:37.587Z',
      false,
    );
    const julyTombstoneSession = buildCompletedSession(
      'ff0w27nBbmMoVe1MnUOKq7gKEd32-1785485302428',
      '2026-07-31T08:11:48.722Z',
      true,
    );
    firestoreState.sessions = [
      ...oldSessions,
      mayDecisionWithoutTombstone,
      julyTombstoneSession,
    ];

    expect(firestoreState.sessions).toHaveLength(169);
    const result = await sessionService.getLatestFinalizedTreatmentDecision(
      PATIENT_ID,
      USER_ID,
      { asOfDateKey: '2026-07-31' },
    );

    expect(result?.sourceSessionId).toBe('ff0w27nBbmMoVe1MnUOKq7gKEd32-1785485302428');
    const hydratedState = hydrateTreatmentDecisionItems(result?.homeProgramItems ?? []);
    expect(hydratedState).toEqual([
      expect.objectContaining({
        id: 'hep-4',
        removedPermanently: true,
      }),
    ]);
    expect(hydratedState.filter(isActiveTreatmentDecisionItem)).toEqual([]);
  });

  it('mantiene corrección mediante fallback mientras el índice compuesto no esté desplegado', async () => {
    firestoreState.rejectOrderedQueries = true;
    firestoreState.sessions = Array.from({ length: 65 }, (_, index) => {
      const id = `fallback-${String(index).padStart(3, '0')}`;
      return buildCompletedSession(id, isoAtDay(index + 1), index === 64);
    });

    const result = await sessionService.getLatestFinalizedTreatmentDecision(
      PATIENT_ID,
      USER_ID,
      { asOfDateKey: '2026-03-31' },
    );

    expect(result?.sourceSessionId).toBe('fallback-064');
    expect(result?.homeProgramItems[0]).toMatchObject({ removedPermanently: true });
  });
});
