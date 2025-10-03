import { getApp, getApps, initializeApp } from "firebase/app";
function ensureApp() {
  if (!getApps().length) {
    initializeApp({ projectId: process.env.FB_PROJECT_ID || "demo-notesrepo" });
  }
  return getApp();
}
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, updateDoc, addDoc, Timestamp
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { ClinicalNote, NoteStatus } from '@/types/notes';
import { NoteError } from '@/types/notes';

/** Firestore -> dominio */
const fromFirestore = (snap: any): ClinicalNote => {
  const d = snap.data();
  return {
    id: snap.id,
    patientId: d.patientId,
    visitId: d.visitId,
    clinicianUid: d.clinicianUid,
    status: d.status,
    subjective: d.subjective,
    objective: d.objective,
    assessment: d.assessment,
    plan: d.plan,
    signedHash: d.signedHash,
    createdAt: (d.createdAt instanceof Timestamp) ? d.createdAt.toDate() : new Date(d.createdAt),
    updatedAt: (d.updatedAt instanceof Timestamp) ? d.updatedAt.toDate() : new Date(d.updatedAt),
  };
};

/** dominio -> Firestore (campos auditables server-side) */
const toFirestore = (note: Omit<ClinicalNote, 'id'|'createdAt'|'updatedAt'>) => ({
  ...note,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

/** Crea una nota (solo 'draft' | 'submitted') */
export const createNote = async (
  payload: Omit<ClinicalNote, 'id'|'createdAt'|'updatedAt'>
): Promise<ClinicalNote> => {
  if (!['draft','submitted'].includes(payload.status)) {
    throw new Error(NoteError.INVALID_STATUS);
  }
  const db = getFirestore(ensureApp());
  const ref = await addDoc(collection(db, 'notes'), toFirestore(payload));
  const snap = await getDoc(ref);
  return fromFirestore(snap);
};

/** Obtiene por id */
export const getNoteById = async (id: string): Promise<ClinicalNote> => {
  const db = getFirestore(ensureApp());
  const ref = doc(db, 'notes', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(NoteError.NOT_FOUND);
  return fromFirestore(snap);
};

/** Última nota firmada/submitted de un paciente */
export const getLastNoteByPatient = async (patientId: string): Promise<ClinicalNote | null> => {
  const db = getFirestore(ensureApp());
  const q = query(
    collection(db, 'notes'),
    where('patientId', '==', patientId),
    where('status', 'in', ['submitted','signed'] as NoteStatus[]),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const s = await getDocs(q);
  if (s.empty) return null;
  return fromFirestore(s.docs[0]);
};

/** Últimas N notas firmadas/submitted de un paciente */
export const getLastNotes = async (patientId: string, n: number): Promise<ClinicalNote[]> => {
  const db = getFirestore(ensureApp());
  const q = query(
    collection(db, 'notes'),
    where('patientId', '==', patientId),
    where('status', 'in', ['submitted','signed'] as NoteStatus[]),
    orderBy('createdAt', 'desc'),
    limit(n)
  );
  const s = await getDocs(q);
  return s.docs.map(fromFirestore);
};

/**
 * Actualiza nota. Guardas:
 * - Notas firmadas son inmutables.
 * - Si se firma en este update, no se pueden cambiar campos SOAP en el mismo patch.
 */
export const updateNote = async (
  id: string,
  patch: Partial<Pick<ClinicalNote,
    'status'|'subjective'|'objective'|'assessment'|'plan'|'signedHash'|'visitId'
  >>
): Promise<ClinicalNote> => {
  const db = getFirestore(ensureApp());
  const ref = doc(db, 'notes', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error(NoteError.NOT_FOUND);
  const current = fromFirestore(snap);

  if (current.status === 'signed') {
    throw new Error(NoteError.IMMUTABLE);
  }

  const nextStatus = (patch.status ?? current.status) as NoteStatus;
  const transitioningToSigned = current.status !== 'signed' && nextStatus === 'signed';

  if (transitioningToSigned) {
    const soapKeys: Array<keyof ClinicalNote> = ['subjective','objective','assessment','plan'];
    const soapChanged = soapKeys.some(k => Object.prototype.hasOwnProperty.call(patch, k));
    if (soapChanged) {
      throw new Error(NoteError.IMMUTABLE);
    }
  }

  if (!['draft','submitted','signed'].includes(nextStatus)) {
    throw new Error(NoteError.INVALID_STATUS);
  }

  const updatePayload: Record<string, unknown> = {
    ...patch,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(ref, updatePayload);
  const after = await getDoc(ref);
  return fromFirestore(after);
};
