import { describe, expect, it, vi } from 'vitest';
import type { TodayQuickItem } from '../../components/TodayPatientsPanel';
import {
  collectPendingTodayItemsForMigration,
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
});
