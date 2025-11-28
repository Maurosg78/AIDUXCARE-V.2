import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

export async function appendPlanSnippet(encounterId: string, snippet: string): Promise<void> {
  const db = getFirestore();
  const ref = doc(db, 'encounters', encounterId);
  const snap = await getDoc(ref);
  const currentPlan = snap.exists() && (snap.data().soap?.plan as string | undefined);
  const newPlan = currentPlan ? `${currentPlan}\n${snippet}` : snippet;
  await updateDoc(ref, { 'soap.plan': newPlan });
}


