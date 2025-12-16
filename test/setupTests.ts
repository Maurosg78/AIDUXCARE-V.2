import '@testing-library/jest-dom/vitest';
// --- Firebase init for tests (emulators:exec sets env vars) ---
import { getApps, initializeApp } from 'firebase/app';
if (!getApps().length) {
  initializeApp({ projectId: 'demo-notesrepo' });
}
