import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TodayQuickItem } from '../features/command-center/components/TodayPatientsPanel';

const todayListDoc = (uid: string, dateKey: string) =>
  doc(db, 'users', uid, 'todayLists', dateKey);

function normalizeItems(raw: TodayQuickItem[]): TodayQuickItem[] {
  return raw.map((item) => {
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

    if (item.status !== undefined) {
      sanitized.status = item.status;
    }

    return sanitized;
  });
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
    return normalizeItems(rawItems);
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
      const normalizedItems = normalizeItems(rawItems);
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
  try {
    const sanitizedItems = sanitizeTodayQuickItems(items);
    await setDoc(todayListDoc(uid, dateKey), {
      items: sanitizedItems,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[todayListService] saveTodayList failed', {
      dateKey,
      itemCount: items.length,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
