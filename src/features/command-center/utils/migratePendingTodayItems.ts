import type { TodayQuickItem } from '../components/TodayPatientsPanel';

export const PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS = 7;

type LoadTodayList = (userId: string, dateKey: string) => Promise<TodayQuickItem[]>;

type HasClosedClinicalEvidence = (patientId: string, dateKey: string) => Promise<boolean>;

type CollectPendingTodayItemsForMigrationParams = {
  userId: string;
  targetDate: Date;
  loadTodayList: LoadTodayList;
  hasClosedClinicalEvidence: HasClosedClinicalEvidence;
  lookbackDays?: number;
};

export type PendingTodayItemsMigrationResult = {
  migratedPendingItems: TodayQuickItem[];
  sourceDateKeysWithCandidates: string[];
  sourceDateKeysWithMigratedPatients: string[];
  totalCandidates: number;
  filteredOutWithClosedEvidence: number;
  orphanedPendingPatientCount: number;
  lookbackDays: number;
};

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTodayQuickItemKey(item: TodayQuickItem): string {
  return `${item.patientId}::${item.sessionType}`;
}

export function mergeTodayItemsWithMigratedPendingItems(
  existingItems: TodayQuickItem[],
  migratedItems: TodayQuickItem[]
): TodayQuickItem[] {
  const mergedByClinicalQueueKey = new Map<string, TodayQuickItem>();

  for (const existingItem of existingItems) {
    const clinicalQueueKey = getTodayQuickItemKey(existingItem);
    mergedByClinicalQueueKey.set(clinicalQueueKey, existingItem);
  }

  for (const migratedItem of migratedItems) {
    const clinicalQueueKey = getTodayQuickItemKey(migratedItem);
    const existingItem = mergedByClinicalQueueKey.get(clinicalQueueKey);
    const shouldPreserveExistingItem = Boolean(existingItem);

    if (shouldPreserveExistingItem) {
      continue;
    }

    mergedByClinicalQueueKey.set(clinicalQueueKey, migratedItem);
  }

  return Array.from(mergedByClinicalQueueKey.values());
}

export async function collectPendingTodayItemsForMigration(
  params: CollectPendingTodayItemsForMigrationParams
): Promise<PendingTodayItemsMigrationResult> {
  const resolvedLookbackDays = params.lookbackDays ?? PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS;
  const sourceClinicalDateKeys: string[] = [];
  const migrationCandidateEntries: Array<{ item: TodayQuickItem; sourceDateKey: string }> = [];
  const migrationCandidateKeys = new Set<string>();

  for (let lookbackDay = 1; lookbackDay <= resolvedLookbackDays; lookbackDay += 1) {
    const sourceClinicalDate = new Date(params.targetDate.getTime() - lookbackDay * 86400000);
    const sourceClinicalDateKey = toLocalDateKey(sourceClinicalDate);
    const sourceClinicalItems = await params.loadTodayList(params.userId, sourceClinicalDateKey);
    const sourcePendingItems = sourceClinicalItems.filter((item) => {
      const status = item.status as string | undefined;
      return status !== 'discarded';
    });

    sourceClinicalDateKeys.push(sourceClinicalDateKey);

    for (const sourcePendingItem of sourcePendingItems) {
      const sourcePendingItemKey = getTodayQuickItemKey(sourcePendingItem);
      const wasAlreadyCarriedForward = migrationCandidateKeys.has(sourcePendingItemKey);

      if (wasAlreadyCarriedForward) {
        continue;
      }

      migrationCandidateKeys.add(sourcePendingItemKey);
      migrationCandidateEntries.push({
        item: sourcePendingItem,
        sourceDateKey: sourceClinicalDateKey,
      });
    }
  }

  const evidenceChecks = await Promise.all(
    migrationCandidateEntries.map(async (entry) => {
      const clinicalEvidenceChecks = await Promise.all(
        sourceClinicalDateKeys.map(async (sourceClinicalDateKey) => {
          const hasClosedEvidence = await params.hasClosedClinicalEvidence(
            entry.item.patientId,
            sourceClinicalDateKey
          );

          return hasClosedEvidence;
        })
      );
      const hasClosedEvidenceInLookback = clinicalEvidenceChecks.some(Boolean);

      return {
        item: entry.item,
        sourceDateKey: entry.sourceDateKey,
        hasClosedEvidence: hasClosedEvidenceInLookback,
      };
    })
  );
  const migratedPendingItems = evidenceChecks
    .filter(({ hasClosedEvidence }) => !hasClosedEvidence)
    .map(({ item }) => item);
  const sourceDateKeysWithCandidates = Array.from(
    new Set(migrationCandidateEntries.map((entry) => entry.sourceDateKey))
  );
  const sourceDateKeysWithMigratedPatients = Array.from(
    new Set(
      evidenceChecks
        .filter(({ hasClosedEvidence }) => !hasClosedEvidence)
        .map((entry) => entry.sourceDateKey)
    )
  );
  const orphanedPendingPatientCount = migratedPendingItems.length;

  return {
    migratedPendingItems,
    sourceDateKeysWithCandidates,
    sourceDateKeysWithMigratedPatients,
    totalCandidates: migrationCandidateEntries.length,
    filteredOutWithClosedEvidence: migrationCandidateEntries.length - migratedPendingItems.length,
    orphanedPendingPatientCount,
    lookbackDays: resolvedLookbackDays,
  };
}
