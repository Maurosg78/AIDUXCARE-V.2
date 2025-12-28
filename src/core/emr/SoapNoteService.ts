import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db as sharedDb } from "@/lib/firebase";

export async function appendPlanSnippet(encounterId: string, snippet: string): Promise<void> {
  const db = sharedDb;
  const ref = doc(db, 'encounters', encounterId);
  const snap = await getDoc(ref);
  const currentPlan = snap.exists() && (snap.data().soap?.plan as string | undefined);
  const newPlan = currentPlan ? `${currentPlan}\n${snippet}` : snippet;
  await updateDoc(ref, { 'soap.plan': newPlan });
}


