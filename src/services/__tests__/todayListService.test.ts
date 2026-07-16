import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TodayQuickItem } from '../../features/command-center/components/TodayPatientsPanel';
import { collectPendingTodayItemsForMigration } from '../../features/command-center/utils/migratePendingTodayItems';
import logger from '../../shared/utils/logger';

const firestoreMocks = vi.hoisted(() => ({
  document: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: firestoreMocks.document,
    runTransaction: firestoreMocks.runTransaction,
    serverTimestamp: firestoreMocks.serverTimestamp,
  };
});

vi.mock('../../lib/firebase', () => ({
  db: { id: 'firestore-db' },
}));

import {
  applyDiscardDecisionToHistoricalItems,
  discardCarriedForwardTodayItem,
  normalizeTodayQuickItems,
  removeCarriedForwardOccurrenceFromCurrentItems,
} from '../todayListService';

function buildQuickItem(overrides: Partial<TodayQuickItem> = {}): TodayQuickItem {
  return {
    patientId: 'patient-001',
    patientName: 'Paciente de prueba',
    sessionType: 'followup',
    status: 'pending',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  firestoreMocks.document.mockImplementation((...segments: unknown[]) => segments.join('/'));
});

describe('discardCarriedForwardTodayItem', () => {
  it('persiste la razón en la fecha origen y elimina la copia de la cola actual', async () => {
    const sourceItems = [buildQuickItem()];
    const intermediateItems = [buildQuickItem({ sourceDateKey: '2026-07-14' })];
    const currentItems = [buildQuickItem({ sourceDateKey: '2026-07-14' })];
    const transactionGet = vi.fn(async (documentRef: string) => {
      const isSourceDocument = documentRef.endsWith('/2026-07-14');
      const isIntermediateDocument = documentRef.endsWith('/2026-07-15');
      const isCurrentDocument = documentRef.endsWith('/2026-07-16');
      let items: TodayQuickItem[] = [];

      if (isSourceDocument) {
        items = sourceItems;
      }

      if (isIntermediateDocument) {
        items = intermediateItems;
      }

      if (isCurrentDocument) {
        items = currentItems;
      }

      return {
        data: () => ({ items }),
      };
    });
    const transactionSet = vi.fn();
    firestoreMocks.runTransaction.mockImplementation(async (_db, operation) => {
      await operation({
        get: transactionGet,
        set: transactionSet,
      });
    });

    await discardCarriedForwardTodayItem({
      userId: 'clinician-001',
      currentDateKey: '2026-07-16',
      sourceDateKey: '2026-07-14',
      patientId: 'patient-001',
      sessionType: 'followup',
      discardedReason: 'no_show',
      discardedReasonText: null,
      discardedAt: '2026-07-16T10:30:00.000Z',
    });

    const sourceWriteCall = transactionSet.mock.calls.find((call) => {
      const documentRef = String(call[0]);
      return documentRef.endsWith('/2026-07-14');
    });
    const intermediateWriteCall = transactionSet.mock.calls.find((call) => {
      const documentRef = String(call[0]);
      return documentRef.endsWith('/2026-07-15');
    });
    const currentWriteCall = transactionSet.mock.calls.find((call) => {
      const documentRef = String(call[0]);
      return documentRef.endsWith('/2026-07-16');
    });
    const sourceWrite = sourceWriteCall?.[1];
    const intermediateWrite = intermediateWriteCall?.[1];
    const currentWrite = currentWriteCall?.[1];
    const persistedSourceItem = sourceWrite?.items?.[0];
    const persistedIntermediateItem = intermediateWrite?.items?.[0];

    expect(persistedSourceItem).toMatchObject({
      patientId: 'patient-001',
      status: 'discarded',
      discardedReason: 'no_show',
      discardedReasonText: null,
      discardedAt: '2026-07-16T10:30:00.000Z',
      discardedBy: 'clinician-001',
    });
    expect(persistedIntermediateItem).toMatchObject({
      patientId: 'patient-001',
      sourceDateKey: '2026-07-14',
      status: 'discarded',
      discardedReason: 'no_show',
    });
    expect(currentWrite?.items).toEqual([]);
  });

  it('marca una copia intermedia fuera del lookback de siete días', async () => {
    const sourceItems = [buildQuickItem()];
    const intermediateItems = [buildQuickItem({ sourceDateKey: '2026-07-01' })];
    const currentItems = [buildQuickItem({ sourceDateKey: '2026-07-01' })];
    const transactionGet = vi.fn(async (documentRef: string) => {
      const isSourceDocument = documentRef.endsWith('/2026-07-01');
      const isIntermediateDocument = documentRef.endsWith('/2026-07-05');
      const isCurrentDocument = documentRef.endsWith('/2026-07-15');
      let items: TodayQuickItem[] = [];

      if (isSourceDocument) {
        items = sourceItems;
      }

      if (isIntermediateDocument) {
        items = intermediateItems;
      }

      if (isCurrentDocument) {
        items = currentItems;
      }

      return {
        data: () => ({ items }),
      };
    });
    const transactionSet = vi.fn();
    firestoreMocks.runTransaction.mockImplementation(async (_db, operation) => {
      await operation({
        get: transactionGet,
        set: transactionSet,
      });
    });

    await discardCarriedForwardTodayItem({
      userId: 'clinician-001',
      currentDateKey: '2026-07-15',
      sourceDateKey: '2026-07-01',
      patientId: 'patient-001',
      sessionType: 'followup',
      discardedReason: 'no_show',
      discardedReasonText: null,
      discardedAt: '2026-07-15T10:30:00.000Z',
    });

    const intermediateWriteCall = transactionSet.mock.calls.find((call) => {
      const documentRef = String(call[0]);
      return documentRef.endsWith('/2026-07-05');
    });
    const intermediateWrite = intermediateWriteCall?.[1];
    const persistedIntermediateItem = intermediateWrite?.items?.[0];

    expect(transactionGet).toHaveBeenCalledTimes(15);
    expect(persistedIntermediateItem).toMatchObject({
      patientId: 'patient-001',
      sourceDateKey: '2026-07-01',
      status: 'discarded',
      discardedReason: 'no_show',
    });
  });

  it('falla antes de la transacción cuando el rango supera sesenta días', async () => {
    const loggerWarning = vi.spyOn(logger, 'warn');
    loggerWarning.mockImplementation(() => undefined);

    await expect(discardCarriedForwardTodayItem({
      userId: 'clinician-001',
      currentDateKey: '2026-03-03',
      sourceDateKey: '2026-01-01',
      patientId: 'patient-001',
      sessionType: 'followup',
      discardedReason: null,
      discardedReasonText: null,
      discardedAt: '2026-03-03T10:30:00.000Z',
    })).rejects.toThrow('60-day safety limit');

    expect(firestoreMocks.runTransaction).not.toHaveBeenCalled();
    expect(loggerWarning).toHaveBeenCalledWith(
      '[TodayList] Carried-forward discard range requires manual review',
      {
        sourceDateKey: '2026-01-01',
        currentDateKey: '2026-03-03',
        elapsedDays: 61,
        maximumRangeDays: 60,
      }
    );

    loggerWarning.mockRestore();
  });

  it('acepta un descarte sin razón seleccionada', () => {
    const sourceItems = [buildQuickItem()];
    const currentItems = [buildQuickItem({ sourceDateKey: '2026-07-14' })];
    const discardParams = {
      userId: 'clinician-001',
      currentDateKey: '2026-07-16',
      sourceDateKey: '2026-07-14',
      patientId: 'patient-001',
      sessionType: 'followup' as const,
      discardedReason: null,
      discardedReasonText: null,
      discardedAt: '2026-07-15T10:30:00.000Z',
    };

    const discardedSourceItems = applyDiscardDecisionToHistoricalItems(
      sourceItems,
      '2026-07-14',
      discardParams
    );
    const remainingCurrentItems = removeCarriedForwardOccurrenceFromCurrentItems(
      currentItems,
      discardParams
    );

    expect(discardedSourceItems.items[0]).toMatchObject({
      status: 'discarded',
      discardedReason: null,
      discardedReasonText: null,
    });
    expect(remainingCurrentItems).toEqual([]);
  });

  it('no remigra la ocurrencia descartada y permite una nueva ocurrencia futura', async () => {
    const originalSourceItems = [buildQuickItem()];
    const currentItems = [buildQuickItem({ sourceDateKey: '2026-07-14' })];
    const discardParams = {
      userId: 'clinician-001',
      currentDateKey: '2026-07-16',
      sourceDateKey: '2026-07-14',
      patientId: 'patient-001',
      sessionType: 'followup' as const,
      discardedReason: 'rescheduled' as const,
      discardedReasonText: null,
      discardedAt: '2026-07-16T10:30:00.000Z',
    };
    const discardedSourceItems = applyDiscardDecisionToHistoricalItems(
      originalSourceItems,
      '2026-07-14',
      discardParams
    );
    const remainingCurrentItems = removeCarriedForwardOccurrenceFromCurrentItems(
      currentItems,
      discardParams
    );
    const intermediateItems = [buildQuickItem({ sourceDateKey: '2026-07-14' })];
    const discardedIntermediateItems = applyDiscardDecisionToHistoricalItems(
      intermediateItems,
      '2026-07-15',
      discardParams
    );
    const visibleOriginalSourceItems = normalizeTodayQuickItems(discardedSourceItems.items);
    const visibleIntermediateItems = normalizeTodayQuickItems(
      discardedIntermediateItems.items
    );
    const futurePendingItems = [buildQuickItem()];
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-17') {
        return futurePendingItems;
      }

      if (dateKey === '2026-07-14') {
        return visibleOriginalSourceItems;
      }

      if (dateKey === '2026-07-15') {
        return visibleIntermediateItems;
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async () => false);

    const futureMigrationResult = await collectPendingTodayItemsForMigration({
      userId: 'clinician-001',
      targetDate: new Date('2026-07-18T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(remainingCurrentItems).toEqual([]);
    expect(visibleOriginalSourceItems).toEqual([]);
    expect(visibleIntermediateItems).toEqual([]);
    expect(futureMigrationResult.migratedPendingItems).toHaveLength(1);
    expect(futureMigrationResult.migratedPendingItems[0]).toMatchObject({
      patientId: 'patient-001',
      sourceDateKey: '2026-07-17',
    });
  });
});
