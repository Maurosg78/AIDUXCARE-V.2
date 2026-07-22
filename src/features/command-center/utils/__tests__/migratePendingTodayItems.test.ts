import { describe, expect, it, vi } from 'vitest';
import type { TodayQuickItem } from '../../components/TodayPatientsPanel';
import {
  collectPendingTodayItemsForMigration,
  drainMigratedClinicalQueueWrites,
  filterOpenTodayItemsByClosedClinicalEvidence,
  MAX_MIGRATED_CLINICAL_QUEUE_DRAIN_WRITES,
  mergeTodayItemsWithMigratedPendingItems,
  PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS,
} from '../migratePendingTodayItems';

function buildQuickItem(overrides: Partial<TodayQuickItem> = {}): TodayQuickItem {
  return {
    patientId: 'patient-001',
    patientName: 'Patient One',
    sessionType: 'followup',
    ...overrides,
  };
}

describe('collectPendingTodayItemsForMigration — migración multi-día', () => {
  it('migra paciente pendiente de hace 3 días si no hay evidencia clínica cerrada y no se abrió la app en días intermedios', async () => {
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-06') {
        return [buildQuickItem({
          addedManuallyToday: true,
          addedManuallyOnDateKey: '2026-07-06',
        })];
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async () => false);

    const result = await collectPendingTodayItemsForMigration({
      userId: 'user-001',
      targetDate: new Date('2026-07-09T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(result.migratedPendingItems).toHaveLength(1);
    expect(result.migratedPendingItems[0]?.patientId).toBe('patient-001');
    expect(result.migratedPendingItems[0]?.sourceDateKey).toBe('2026-07-06');
    expect(result.migratedPendingItems[0]?.addedManuallyOnDateKey).toBe('2026-07-06');
    expect(result.sourceDateKeysWithMigratedPatients).toContain('2026-07-06');
  });

  it('no migra paciente si tiene evidencia clínica cerrada en cualquier día dentro del rango de lookback', async () => {
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-06') {
        return [buildQuickItem()];
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async (patientId: string, dateKey: string) => {
      const isTargetPatient = patientId === 'patient-001';
      const isClosedClinicalDate = dateKey === '2026-07-08';
      return isTargetPatient && isClosedClinicalDate;
    });

    const result = await collectPendingTodayItemsForMigration({
      userId: 'user-001',
      targetDate: new Date('2026-07-09T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(result.migratedPendingItems).toHaveLength(0);
    expect(result.filteredOutWithClosedEvidence).toBe(1);
  });

  it('deduplica correctamente si el mismo paciente aparece en múltiples días dentro del rango de lookback', async () => {
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-08') {
        return [buildQuickItem({ patientName: 'Patient One Latest' })];
      }

      if (dateKey === '2026-07-06') {
        return [buildQuickItem({ patientName: 'Patient One Older' })];
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async () => false);

    const result = await collectPendingTodayItemsForMigration({
      userId: 'user-001',
      targetDate: new Date('2026-07-09T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(result.migratedPendingItems).toHaveLength(1);
    expect(result.migratedPendingItems[0]?.patientName).toBe('Patient One Latest');
    expect(result.totalCandidates).toBe(1);
  });

  it('no migra pacientes más allá de PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS', async () => {
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-01') {
        return [buildQuickItem()];
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async () => false);

    const result = await collectPendingTodayItemsForMigration({
      userId: 'user-001',
      targetDate: new Date('2026-07-09T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(result.migratedPendingItems).toHaveLength(0);
    expect(loadTodayList).toHaveBeenCalledTimes(PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS);
    expect(loadTodayList).not.toHaveBeenCalledWith('user-001', '2026-07-01');
  });

  it('fusiona paciente pendiente huérfano con pacientes ya agendados hoy, sin reemplazar la agenda existente', () => {
    const existingTodayItems = [
      buildQuickItem({
        patientId: 'today-001',
        patientName: 'Today Patient One',
        sessionType: 'initial',
        status: 'pending',
      }),
      buildQuickItem({
        patientId: 'today-002',
        patientName: 'Today Patient Two',
        sessionType: 'followup',
        status: 'pending',
      }),
      buildQuickItem({
        patientId: 'today-003',
        patientName: 'Today Patient Three',
        sessionType: 'followup',
        status: 'pending',
      }),
    ];
    const migratedPendingItems = [
      buildQuickItem({
        patientId: 'orphan-001',
        patientName: 'Orphan Pending Patient',
        sessionType: 'followup',
      }),
    ];

    const mergedClinicalQueueItems = mergeTodayItemsWithMigratedPendingItems(
      existingTodayItems,
      migratedPendingItems
    );

    expect(mergedClinicalQueueItems).toHaveLength(4);
    expect(mergedClinicalQueueItems.slice(0, 3)).toEqual(existingTodayItems);
    expect(mergedClinicalQueueItems[3]).toEqual(migratedPendingItems[0]);
  });

  it('drena una adición manual que ocurre mientras el guardado de migración está pendiente', async () => {
    let releaseFirstSave!: () => void;
    let firstSaveStarted!: () => void;
    let hasLocalTodayQuickChanges = false;
    const firstSaveStartedPromise = new Promise<void>((resolve) => {
      firstSaveStarted = resolve;
    });
    const releaseFirstSavePromise = new Promise<void>((resolve) => {
      releaseFirstSave = resolve;
    });
    const pendingTodayQuickItems = new Map<string, TodayQuickItem>();
    const removedTodayQuickItemScopedKeys = new Set<string>();
    const migratedPendingItems = [
      buildQuickItem({
        patientId: 'migrated-001',
        patientName: 'Marta Santamaria',
        sessionType: 'initial',
        sourceDateKey: '2026-07-14',
        status: 'pending',
      }),
    ];
    const queuedManualAddDuringMigration = buildQuickItem({
      patientId: 'manual-001',
      patientName: 'Ryan Murdock',
      sessionType: 'followup',
    });
    const savedClinicalQueuePayloads: TodayQuickItem[][] = [];
    const saveClinicalQueue = vi.fn(async (items: TodayQuickItem[]) => {
      savedClinicalQueuePayloads.push(items);

      if (savedClinicalQueuePayloads.length === 1) {
        firstSaveStarted();
        await releaseFirstSavePromise;
      }
    });
    const drainPromise = drainMigratedClinicalQueueWrites({
      dateKey: '2026-07-15',
      initialClinicalQueueItems: migratedPendingItems,
      shouldPersistInitialClinicalQueue: true,
      pendingTodayQuickItems,
      removedTodayQuickItemScopedKeys,
      hasLocalTodayQuickChanges: () => hasLocalTodayQuickChanges,
      onQueuedManualAddStateChange: (hasQueuedManualAdd) => {
        hasLocalTodayQuickChanges = hasQueuedManualAdd;
      },
      saveClinicalQueue,
    });

    await firstSaveStartedPromise;

    pendingTodayQuickItems.set('manual-001::followup', queuedManualAddDuringMigration);
    hasLocalTodayQuickChanges = true;
    releaseFirstSave();

    const finalClinicalQueueItems = await drainPromise;

    expect(saveClinicalQueue).toHaveBeenCalledTimes(2);
    expect(savedClinicalQueuePayloads[0]).toEqual(migratedPendingItems);
    expect(savedClinicalQueuePayloads[1]).toEqual([
      migratedPendingItems[0],
      queuedManualAddDuringMigration,
    ]);
    expect(finalClinicalQueueItems).toEqual(savedClinicalQueuePayloads[1]);
    expect(pendingTodayQuickItems.size).toBe(0);
    expect(hasLocalTodayQuickChanges).toBe(false);
  });

  it('termina en 5 escrituras y deja pendientes para el ciclo normal si siguen entrando adds manuales', async () => {
    let hasLocalTodayQuickChanges = false;
    const pendingTodayQuickItems = new Map<string, TodayQuickItem>();
    const removedTodayQuickItemScopedKeys = new Set<string>();
    const migratedPendingItems = [
      buildQuickItem({
        patientId: 'migrated-001',
        patientName: 'Marta Santamaria',
        sessionType: 'initial',
        sourceDateKey: '2026-07-14',
        status: 'pending',
      }),
    ];
    const savedClinicalQueuePayloads: TodayQuickItem[][] = [];
    const onDrainWriteLimitReached = vi.fn();
    const saveClinicalQueue = vi.fn(async (items: TodayQuickItem[]) => {
      savedClinicalQueuePayloads.push(items);

      const nextManualAddIndex = savedClinicalQueuePayloads.length;
      const nextManualAdd = buildQuickItem({
        patientId: `manual-${nextManualAddIndex}`,
        patientName: `Manual Patient ${nextManualAddIndex}`,
        sessionType: 'followup',
      });

      pendingTodayQuickItems.set(
        `${nextManualAdd.patientId}::${nextManualAdd.sessionType}`,
        nextManualAdd
      );
      hasLocalTodayQuickChanges = true;
    });

    const finalClinicalQueueItems = await drainMigratedClinicalQueueWrites({
      dateKey: '2026-07-15',
      initialClinicalQueueItems: migratedPendingItems,
      shouldPersistInitialClinicalQueue: true,
      pendingTodayQuickItems,
      removedTodayQuickItemScopedKeys,
      hasLocalTodayQuickChanges: () => hasLocalTodayQuickChanges,
      onQueuedManualAddStateChange: (hasQueuedManualAdd) => {
        hasLocalTodayQuickChanges = hasQueuedManualAdd;
      },
      onDrainWriteLimitReached,
      saveClinicalQueue,
    });

    expect(saveClinicalQueue).toHaveBeenCalledTimes(MAX_MIGRATED_CLINICAL_QUEUE_DRAIN_WRITES);
    expect(onDrainWriteLimitReached).toHaveBeenCalledWith(1);
    expect(pendingTodayQuickItems.size).toBe(1);
    expect(pendingTodayQuickItems.has('manual-5::followup')).toBe(true);
    expect(hasLocalTodayQuickChanges).toBe(true);
    expect(finalClinicalQueueItems.some((item) => item.patientId === 'manual-4')).toBe(true);
    expect(finalClinicalQueueItems.some((item) => item.patientId === 'manual-5')).toBe(false);
  });

  it('no vuelve a migrar items ya documentados como deuda clínica pendiente', async () => {
    const loadTodayList = vi.fn(async (_userId: string, dateKey: string) => {
      if (dateKey === '2026-07-08') {
        return [
          buildQuickItem({
            status: 'documented',
          }),
        ];
      }

      return [];
    });
    const hasClosedClinicalEvidence = vi.fn(async () => false);

    const result = await collectPendingTodayItemsForMigration({
      userId: 'user-001',
      targetDate: new Date('2026-07-09T12:00:00'),
      loadTodayList,
      hasClosedClinicalEvidence,
    });

    expect(result.migratedPendingItems).toHaveLength(0);
    expect(result.totalCandidates).toBe(0);
  });

  it('elimina de la cola actual un pendiente migrado cuando su fecha clínica fuente ya tiene evidencia cerrada', async () => {
    const existingTodayItems = [
      buildQuickItem({
        patientId: 'closed-001',
        patientName: 'Closed Patient',
        sourceDateKey: '2026-07-14',
        status: 'pending',
      }),
      buildQuickItem({
        patientId: 'open-001',
        patientName: 'Open Patient',
        sourceDateKey: '2026-07-14',
        status: 'pending',
      }),
    ];
    const hasClosedClinicalEvidence = vi.fn(async (patientId: string, dateKey: string) => {
      const isClosedPatient = patientId === 'closed-001';
      const isSourceClinicalDate = dateKey === '2026-07-14';
      const shouldReportClosedEvidence =
        isClosedPatient &&
        isSourceClinicalDate;
      return shouldReportClosedEvidence;
    });

    const result = await filterOpenTodayItemsByClosedClinicalEvidence(
      existingTodayItems,
      '2026-07-15',
      hasClosedClinicalEvidence
    );

    expect(result.openItems).toHaveLength(1);
    expect(result.openItems[0]?.patientId).toBe('open-001');
    expect(result.removedClosedEvidenceCount).toBe(1);
  });
});
