import '@testing-library/jest-dom';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Asegura app (idempotente)
const app = getApps().length ? getApp() : initializeApp({
  projectId: process.env.FB_PROJECT_ID || 'demo-notesrepo'
});

// Firestore + conexión al emulador si está configurado
const db = getFirestore(app);
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (host) {
  const [h, p] = host.split(':');
  try { connectFirestoreEmulator(db, h, Number(p)); } catch { /* idempotente */ }
}
