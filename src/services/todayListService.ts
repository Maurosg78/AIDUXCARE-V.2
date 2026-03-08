import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { TodayQuickItem } from '../features/command-center/components/TodayPatientsPanel';

const todayListDoc = (uid: string, dateKey: string) =>
  doc(db, 'users', uid, 'todayLists', dateKey);

export async function getTodayList(
  uid: string,
  dateKey: string
): Promise<TodayQuickItem[]> {
  try {
    const snap = await getDoc(todayListDoc(uid, dateKey));
    if (!snap.exists()) return [];
    const data = snap.data();
    const items: TodayQuickItem[] = Array.isArray(data?.items) ? data.items : [];
    return items.map((item) => ({ ...item, status: item.status ?? 'pending' }));
  } catch {
    return [];
  }
}

export async function saveTodayList(
  uid: string,
  dateKey: string,
  items: TodayQuickItem[]
): Promise<void> {
  try {
    await setDoc(todayListDoc(uid, dateKey), {
      items,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // silent — list still works from memory
  }
}
