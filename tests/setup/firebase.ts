import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Timestamp } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import * as admin from 'firebase-admin';

let app: FirebaseApp | undefined;

export function initTestFirebase() {
  if (app) return app;
  app = initializeApp({ projectId: 'aiduxcare-emulator' });
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'aiduxcare-emulator' });
  }
  return app;
}

export async function ensureSignedIn(email = 'test@aidux.dev', password = 'secret1234') {
  const auth = getAuth(initTestFirebase());
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch {}
  await signInWithEmailAndPassword(auth, email, password);
  return auth.currentUser;
}

export async function seedBasicData(opts: { uid: string; patientId: string }) {
  const db = admin.firestore();
  const now = new Date();
  // Patient
  await db.collection('patients').doc(opts.patientId).set({
    orgId: 'org1',
    ownerId: opts.uid,
    birthDate: Timestamp.fromDate(new Date('1990-01-01')),
  });
  // MRI report
  await db.collection('reports').add({
    orgId: 'org1', patientId: opts.patientId, type: 'MRI', date: Timestamp.fromDate(now), summary: 'Hallazgos compatibles.'
  });
  // Appointments today
  await db.collection('appointments').add({ orgId: 'org1', clinicianUid: opts.uid, status: 'scheduled', date: Timestamp.fromDate(now) });
  await db.collection('appointments').add({ orgId: 'org1', clinicianUid: opts.uid, status: 'scheduled', date: Timestamp.fromDate(new Date(now.getTime()+3600000)) });
  // Notes pending
  await db.collection('notes').add({ orgId: 'org1', clinicianUid: opts.uid, status: 'draft', updatedAt: Timestamp.fromDate(now) });
}


