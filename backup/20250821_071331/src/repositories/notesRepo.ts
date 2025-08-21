import { collection, getDocs, getFirestore, limit, orderBy, query, where } from 'firebase/firestore';

export type ClinicalNote = {
  id: string;
  patientId: string;
  patientName?: string;
  status: 'draft' | 'returned' | 'submitted' | 'signed';
  updatedAt?: unknown;
};

export async function fetchPendingNotes(clinicianUid: string, patientId?: string): Promise<ClinicalNote[]> {
  const { db } = await import('../lib/firebase'); // Usar instancia blindada
  const col = collection(db, 'notes');
  const base = [
    where('clinicianUid', '==', clinicianUid),
    where('status', 'in', ['draft', 'returned']),
    orderBy('updatedAt', 'desc'),
    limit(50),
  ] as const;

  const q = query(col, ...base);
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as unknown as ClinicalNote[];
  if (patientId) rows = rows.filter((r) => r.patientId === patientId);
  return rows;
}


