import type { TodayQuickItem } from '../components/TodayPatientsPanel';

export const PENDING_PATIENT_MIGRATION_LOOKBACK_DAYS = 7;
export const MAX_MIGRATED_CLINICAL_QUEUE_DRAIN_WRITES = 5;

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

export type ClosedEvidenceFilterResult = {
  openItems: TodayQuickItem[];
  removedClosedEvidenceCount: number;
};

type DrainMigratedClinicalQueueWritesParams = {
  dateKey: string;
  initialClinicalQueueItems: TodayQuickItem[];
  shouldPersistInitialClinicalQueue: boolean;
  pendingTodayQuickItems: Map<string, TodayQuickItem>;
  removedTodayQuickItemScopedKeys: Set<string>;
  hasLocalTodayQuickChanges: () => boolean;
  onQueuedManualAddStateChange: (hasQueuedManualAdd: boolean) => void;
  onDrainWriteLimitReached?: (pendingItemCount: number) => void;
  saveClinicalQueue: (items: TodayQuickItem[]) => Promise<void>;
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

function isOpenClinicalQueueStatus(status: string | undefined): boolean {
  if (status == null) {
    return true;
  }

  const isPendingStatus = status === 'pending';
  const isIncompleteStatus = status === 'incomplete';

  return isPendingStatus || isIncompleteStatus;
}

function getClinicalEvidenceDateKeys(item: TodayQuickItem, fallbackDateKey: string): string[] {
  const dateKeys = new Set<string>();
  const sourceDateKey = item.sourceDateKey;
  const hasSourceDateKey = sourceDateKey != null;
  const trimmedSourceDateKey = hasSourceDateKey ? sourceDateKey.trim() : '';
  const hasNonEmptySourceDateKey = trimmedSourceDateKey !== '';

  if (hasSourceDateKey && hasNonEmptySourceDateKey) {
    dateKeys.add(sourceDateKey);
  }

  dateKeys.add(fallbackDateKey);

  return Array.from(dateKeys);
}

async function hasClosedClinicalEvidenceForAnyDate(
  item: TodayQuickItem,
  fallbackDateKey: string,
  hasClosedClinicalEvidence: HasClosedClinicalEvidence
): Promise<boolean> {
  const clinicalEvidenceDateKeys = getClinicalEvidenceDateKeys(item, fallbackDateKey);

  for (const clinicalEvidenceDateKey of clinicalEvidenceDateKeys) {
    const hasClosedEvidence = await hasClosedClinicalEvidence(item.patientId, clinicalEvidenceDateKey);

    if (hasClosedEvidence) {
      return true;
    }
  }

  return false;
}

export async function filterOpenTodayItemsByClosedClinicalEvidence(
  items: TodayQuickItem[],
  fallbackDateKey: string,
  hasClosedClinicalEvidence: HasClosedClinicalEvidence
): Promise<ClosedEvidenceFilterResult> {
  const openItems: TodayQuickItem[] = [];
  let removedClosedEvidenceCount = 0;

  for (const item of items) {
    const status = item.status as string | undefined;
    const shouldCheckClinicalEvidence = isOpenClinicalQueueStatus(status);

    if (!shouldCheckClinicalEvidence) {
      openItems.push(item);
      continue;
    }

    const hasClosedEvidence = await hasClosedClinicalEvidenceForAnyDate(
      item,
      fallbackDateKey,
      hasClosedClinicalEvidence
    );

    if (hasClosedEvidence) {
      removedClosedEvidenceCount += 1;
      continue;
    }

    openItems.push(item);
  }

  return {
    openItems,
    removedClosedEvidenceCount,
  };
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

export async function drainMigratedClinicalQueueWrites(
  params: DrainMigratedClinicalQueueWritesParams
): Promise<TodayQuickItem[]> {
  let mergedClinicalQueueItems = params.initialClinicalQueueItems;
  let shouldPersistMigratedClinicalQueue = params.shouldPersistInitialClinicalQueue;
  let drainWriteCount = 0;

  while (
    shouldPersistMigratedClinicalQueue &&
    drainWriteCount < MAX_MIGRATED_CLINICAL_QUEUE_DRAIN_WRITES
  ) {
    const queuedManualAddItems = Array.from(params.pendingTodayQuickItems.values()).filter((item) => {
      const scopedKey = `${params.dateKey}::${getTodayQuickItemKey(item)}`;
      return !params.removedTodayQuickItemScopedKeys.has(scopedKey);
    });
    const queuedManualAddKeys = queuedManualAddItems.map(getTodayQuickItemKey);
    const hasQueuedManualAddDuringMigration =
      params.hasLocalTodayQuickChanges() ||
      queuedManualAddItems.length > 0;
    const clinicalQueueItemsToPersist = hasQueuedManualAddDuringMigration
      ? mergeTodayItemsWithMigratedPendingItems(mergedClinicalQueueItems, queuedManualAddItems)
      : mergedClinicalQueueItems;

    drainWriteCount += 1;

    await params.saveClinicalQueue(clinicalQueueItemsToPersist);

    for (const queuedManualAddKey of queuedManualAddKeys) {
      params.pendingTodayQuickItems.delete(queuedManualAddKey);
    }

    mergedClinicalQueueItems = clinicalQueueItemsToPersist;

    const queuedManualAddDuringWrite = params.pendingTodayQuickItems.size > 0;
    params.onQueuedManualAddStateChange(queuedManualAddDuringWrite);
    shouldPersistMigratedClinicalQueue = queuedManualAddDuringWrite;
  }

  if (shouldPersistMigratedClinicalQueue) {
    params.onDrainWriteLimitReached?.(params.pendingTodayQuickItems.size);
  }

  return mergedClinicalQueueItems;
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
      return isOpenClinicalQueueStatus(status);
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
        item: {
          ...sourcePendingItem,
          sourceDateKey: sourcePendingItem.sourceDateKey ?? sourceClinicalDateKey,
        },
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
