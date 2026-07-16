import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  CarriedForwardDiscardReason,
  TodayQuickItem,
} from '../features/command-center/components/TodayPatientsPanel';
import logger from '../shared/utils/logger';

export const MAX_CARRIED_FORWARD_DISCARD_RANGE_DAYS = 60;
const MILLISECONDS_PER_DAY = 86400000;

const todayListDoc = (uid: string, dateKey: string) =>
  doc(db, 'users', uid, 'todayLists', dateKey);

export function normalizeTodayQuickItems(raw: TodayQuickItem[]): TodayQuickItem[] {
  const visibleItems = raw.filter((item) => {
    const persistedStatus = item.status as string | undefined;
    return persistedStatus !== 'discarded';
  });

  return visibleItems.map((item) => {
    const persistedStatus = item.status;
    const normalizedDocumentedStatus =
      persistedStatus === 'done'
        ? 'documented'
        : persistedStatus;
    const normalizedStatus =
      normalizedDocumentedStatus === 'incomplete'
        ? 'pending'
        : normalizedDocumentedStatus ?? 'pending';
    const normalizedItem = {
      ...item,
      status: normalizedStatus,
    };
    return normalizedItem;
  });
}

function sanitizeTodayQuickItems(items: TodayQuickItem[]): TodayQuickItem[] {
  return items.map((item) => {
    const sanitized: TodayQuickItem = {
      patientId: item.patientId,
      patientName: item.patientName,
      sessionType: item.sessionType,
    };

    if (item.resumeSessionId !== undefined) {
      sanitized.resumeSessionId = item.resumeSessionId;
    }

    if (item.sourceDateKey !== undefined) {
      sanitized.sourceDateKey = item.sourceDateKey;
    }

    if (item.addedManuallyToday !== undefined) {
      sanitized.addedManuallyToday = item.addedManuallyToday;
    }

    if (item.status !== undefined) {
      sanitized.status = item.status;
    }

    if (item.discardedReason !== undefined) {
      sanitized.discardedReason = item.discardedReason;
    }

    if (item.discardedReasonText !== undefined) {
      sanitized.discardedReasonText = item.discardedReasonText;
    }

    if (item.discardedAt !== undefined) {
      sanitized.discardedAt = item.discardedAt;
    }

    if (item.discardedBy !== undefined) {
      sanitized.discardedBy = item.discardedBy;
    }

    return sanitized;
  });
}

export interface DiscardCarriedForwardTodayItemParams {
  userId: string;
  currentDateKey: string;
  sourceDateKey: string;
  patientId: string;
  sessionType: TodayQuickItem['sessionType'];
  discardedReason: CarriedForwardDiscardReason | null;
  discardedReasonText: string | null;
  discardedAt: string;
}

interface DiscardedHistoricalItems {
  items: TodayQuickItem[];
  occurrenceFound: boolean;
}

function toUtcDateKey(date: Date): string {
  const isoTimestamp = date.toISOString();
  const dateKey = isoTimestamp.slice(0, 10);
  return dateKey;
}

function getDiscardCandidateDateKeys(
  currentDateKey: string,
  sourceDateKey: string
): string[] {
  const candidateDateKeys: string[] = [];
  const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const hasValidCurrentDateKeyFormat = dateKeyPattern.test(currentDateKey);
  const hasValidSourceDateKeyFormat = dateKeyPattern.test(sourceDateKey);

  if (!hasValidCurrentDateKeyFormat) {
    throw new Error('Clinical queue date keys must use YYYY-MM-DD format.');
  }

  if (!hasValidSourceDateKeyFormat) {
    throw new Error('Clinical queue date keys must use YYYY-MM-DD format.');
  }

  const currentClinicalDate = new Date(`${currentDateKey}T00:00:00.000Z`);
  const sourceClinicalDate = new Date(`${sourceDateKey}T00:00:00.000Z`);
  const currentClinicalTime = currentClinicalDate.getTime();
  const sourceClinicalTime = sourceClinicalDate.getTime();
  const hasValidCurrentClinicalDate = Number.isFinite(currentClinicalTime);
  const hasValidSourceClinicalDate = Number.isFinite(sourceClinicalTime);
  if (!hasValidCurrentClinicalDate) {
    throw new Error('Current clinical queue date is invalid.');
  }

  if (!hasValidSourceClinicalDate) {
    throw new Error('Source clinical queue date is invalid.');
  }

  const normalizedCurrentDateKey = toUtcDateKey(currentClinicalDate);
  const normalizedSourceDateKey = toUtcDateKey(sourceClinicalDate);
  const currentDateMatchesInput = normalizedCurrentDateKey === currentDateKey;
  const sourceDateMatchesInput = normalizedSourceDateKey === sourceDateKey;

  if (!currentDateMatchesInput) {
    throw new Error('Current clinical queue date is invalid.');
  }

  if (!sourceDateMatchesInput) {
    throw new Error('Source clinical queue date is invalid.');
  }

  const sourceOccursAfterCurrent = sourceClinicalTime > currentClinicalTime;
  if (sourceOccursAfterCurrent) {
    throw new Error('Source clinical queue date cannot be after current date.');
  }

  const elapsedMilliseconds = currentClinicalTime - sourceClinicalTime;
  const elapsedDays = elapsedMilliseconds / MILLISECONDS_PER_DAY;
  const exceedsSafeDiscardRange = elapsedDays > MAX_CARRIED_FORWARD_DISCARD_RANGE_DAYS;

  if (exceedsSafeDiscardRange) {
    logger.warn('[TodayList] Carried-forward discard range requires manual review', {
      sourceDateKey,
      currentDateKey,
      elapsedDays,
      maximumRangeDays: MAX_CARRIED_FORWARD_DISCARD_RANGE_DAYS,
    });
    throw new Error('Carried-forward discard range exceeds the 60-day safety limit.');
  }

  for (
    let dayOffset = 0;
    dayOffset <= elapsedDays;
    dayOffset += 1
  ) {
    const elapsedOffsetMilliseconds = dayOffset * MILLISECONDS_PER_DAY;
    const candidateClinicalTime = sourceClinicalTime + elapsedOffsetMilliseconds;
    const candidateClinicalDate = new Date(candidateClinicalTime);
    const candidateDateKey = toUtcDateKey(candidateClinicalDate);
    candidateDateKeys.push(candidateDateKey);
  }

  return candidateDateKeys;
}

export function applyDiscardDecisionToHistoricalItems(
  historicalItems: TodayQuickItem[],
  historicalDateKey: string,
  params: DiscardCarriedForwardTodayItemParams
): DiscardedHistoricalItems {
  let occurrenceFound = false;
  const isOriginalSourceDate = historicalDateKey === params.sourceDateKey;
  const updatedHistoricalItems = historicalItems.map((historicalItem) => {
    const matchesPatient = historicalItem.patientId === params.patientId;
    const matchesSessionType = historicalItem.sessionType === params.sessionType;
    const matchesQueueIdentity = matchesPatient && matchesSessionType;
    const matchesOriginalSource = historicalItem.sourceDateKey === params.sourceDateKey;
    const matchesCarriedForwardCopy = matchesQueueIdentity && matchesOriginalSource;
    const matchesOriginalOccurrence = matchesQueueIdentity && isOriginalSourceDate;
    const shouldDiscardOccurrence = matchesOriginalOccurrence || matchesCarriedForwardCopy;

    if (!shouldDiscardOccurrence) {
      return historicalItem;
    }

    occurrenceFound = true;
    const discardedHistoricalItem: TodayQuickItem = {
      ...historicalItem,
      status: 'discarded',
      discardedReason: params.discardedReason,
      discardedReasonText: params.discardedReasonText,
      discardedAt: params.discardedAt,
      discardedBy: params.userId,
    };
    return discardedHistoricalItem;
  });

  return {
    items: updatedHistoricalItems,
    occurrenceFound,
  };
}

export function removeCarriedForwardOccurrenceFromCurrentItems(
  currentItems: TodayQuickItem[],
  params: DiscardCarriedForwardTodayItemParams
): TodayQuickItem[] {
  const remainingCurrentItems = currentItems.filter((currentItem) => {
    const matchesPatient = currentItem.patientId === params.patientId;
    const matchesSessionType = currentItem.sessionType === params.sessionType;
    const matchesSourceDate = currentItem.sourceDateKey === params.sourceDateKey;
    const matchesCarriedForwardOccurrence = matchesPatient && matchesSessionType;
    const isTargetOccurrence = matchesCarriedForwardOccurrence && matchesSourceDate;
    return !isTargetOccurrence;
  });

  return remainingCurrentItems;
}

export async function getTodayList(
  uid: string,
  dateKey: string
): Promise<TodayQuickItem[]> {
  try {
    const snap = await getDoc(todayListDoc(uid, dateKey));
    if (!snap.exists()) return [];
    const data = snap.data();
    const rawItems: TodayQuickItem[] = Array.isArray(data?.items) ? data.items : [];
    return normalizeTodayQuickItems(rawItems);
  } catch {
    return [];
  }
}

/**
 * Real-time subscription to a user's today list for a given date.
 * Returns an unsubscribe function — must be called on cleanup.
 */
export function subscribeTodayList(
  uid: string,
  dateKey: string,
  onData: (items: TodayQuickItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = todayListDoc(uid, dateKey);
  const unsubscribe = onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onData([]);
        return;
      }
      const data = snap.data();
      const rawItems: TodayQuickItem[] = Array.isArray(data?.items) ? data.items : [];
      const normalizedItems = normalizeTodayQuickItems(rawItems);
      onData(normalizedItems);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
  return unsubscribe;
}

export async function saveTodayList(
  uid: string,
  dateKey: string,
  items: TodayQuickItem[]
): Promise<void> {
  const sanitizedItems = sanitizeTodayQuickItems(items);
  await setDoc(todayListDoc(uid, dateKey), {
    items: sanitizedItems,
    updatedAt: serverTimestamp(),
  });
}

export async function discardCarriedForwardTodayItem(
  params: DiscardCarriedForwardTodayItemParams
): Promise<void> {
  if (params.currentDateKey === params.sourceDateKey) {
    throw new Error('A carried-forward item must have a previous source date.');
  }

  const candidateDateKeys = getDiscardCandidateDateKeys(
    params.currentDateKey,
    params.sourceDateKey
  );
  const candidateTodayListRefs = candidateDateKeys.map((dateKey) => {
    const todayListRef = todayListDoc(params.userId, dateKey);
    return todayListRef;
  });

  await runTransaction(db, async (transaction) => {
    const candidateSnapshots = await Promise.all(
      candidateTodayListRefs.map((todayListRef) => transaction.get(todayListRef))
    );
    let historicalOccurrenceFound = false;

    for (let index = 0; index < candidateDateKeys.length; index += 1) {
      const candidateDateKey = candidateDateKeys[index];
      const candidateTodayListRef = candidateTodayListRefs[index];
      const candidateSnapshot = candidateSnapshots[index];
      const candidateData = candidateSnapshot.data();
      const candidateItems: TodayQuickItem[] = Array.isArray(candidateData?.items)
        ? candidateData.items
        : [];
      const isCurrentDateDocument = candidateDateKey === params.currentDateKey;

      if (isCurrentDateDocument) {
        const currentItemsWithoutDiscardedOccurrence =
          removeCarriedForwardOccurrenceFromCurrentItems(candidateItems, params);
        const sanitizedCurrentItems = sanitizeTodayQuickItems(
          currentItemsWithoutDiscardedOccurrence
        );
        const currentDocumentUpdate = {
          items: sanitizedCurrentItems,
          updatedAt: serverTimestamp(),
        };
        transaction.set(candidateTodayListRef, currentDocumentUpdate, { merge: true });
        continue;
      }

      const discardedHistoricalItems = applyDiscardDecisionToHistoricalItems(
        candidateItems,
        candidateDateKey,
        params
      );
      if (!discardedHistoricalItems.occurrenceFound) {
        continue;
      }

      historicalOccurrenceFound = true;
      const sanitizedHistoricalItems = sanitizeTodayQuickItems(
        discardedHistoricalItems.items
      );
      const historicalDocumentUpdate = {
        items: sanitizedHistoricalItems,
        updatedAt: serverTimestamp(),
      };
      transaction.set(candidateTodayListRef, historicalDocumentUpdate, { merge: true });
    }

    if (!historicalOccurrenceFound) {
      throw new Error('Carried-forward source occurrence was not found.');
    }
  });
}
