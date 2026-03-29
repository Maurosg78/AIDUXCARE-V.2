import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type ArchivableVisitSource = 'session' | 'encounter' | 'consultation';

/**
 * Soft-archive a visit record (session, encounter, or consultation). Never deletes the document.
 */
export async function archivePatientVisitRecord(
  visitId: string,
  visitSource: ArchivableVisitSource,
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    const authError = new Error('Not authenticated');
    throw authError;
  }

  const collectionName = resolveArchiveCollectionName(visitSource);
  const docRef = doc(db, collectionName, visitId);
  const snapshot = await getDoc(docRef);
  const docExists = snapshot.exists();
  if (!docExists) {
    const missingError = new Error('Record not found');
    throw missingError;
  }

  const docData = snapshot.data();
  const isOwner = userOwnsArchivedDoc(docData, currentUser.uid);
  if (!isOwner) {
    const deniedError = new Error('Not authorized to archive this record');
    throw deniedError;
  }

  const archivePayload = {
    archived: true,
    archivedAt: serverTimestamp(),
    archivedByUid: currentUser.uid,
  };
  await updateDoc(docRef, archivePayload);
}

function resolveArchiveCollectionName(visitSource: ArchivableVisitSource): string {
  if (visitSource === 'session') {
    return 'sessions';
  }
  if (visitSource === 'encounter') {
    return 'encounters';
  }
  const consultationsCollection = 'consultations';
  return consultationsCollection;
}

function userOwnsArchivedDoc(data: Record<string, unknown>, uid: string): boolean {
  const userIdField = data.userId;
  const authorUidField = data.authorUid;
  const userIdMatches = userIdField === uid;
  const authorUidMatches = authorUidField === uid;
  const ownerMatches = userIdMatches || authorUidMatches;
  return ownerMatches;
}
