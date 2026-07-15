import { describe, expect, it, vi } from 'vitest';
import type { TodayQuickItem } from '../../components/TodayPatientsPanel';
import {
  collectPendingTodayItemsForMigration,
  filterOpenTodayItemsByClosedClinicalEvidence,
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

    expect(result.migratedPendingItems).toHaveLength(1);
    expect(result.migratedPendingItems[0]?.patientId).toBe('patient-001');
    expect(result.migratedPendingItems[0]?.sourceDateKey).toBe('2026-07-06');
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
