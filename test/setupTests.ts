import { expect } from 'vitest';
import matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Firebase app bootstrap (idempotente)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const app = getApps().length ? getApp() : initializeApp({
  projectId: process.env.FB_PROJECT_ID || 'demo-notesrepo',
});
const db = getFirestore(app);

// Conexión al emulador si está seteado (CI y local .env.test)
const host = process.env.FIRESTORE_EMULATOR_HOST;
if (host) {
  const [h, p] = host.split(':');
  try { connectFirestoreEmulator(db, h, Number(p)); } catch { /* idempotente */ }
}
