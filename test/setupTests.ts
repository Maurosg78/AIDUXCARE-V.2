import '@testing-library/jest-dom/vitest';
// --- Firebase init for tests (compliance: real Firebase, no mocks) ---
import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, inMemoryPersistence, connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// Initialize Firebase App for tests
if (!getApps().length) {
  initializeApp({ projectId: 'demo-notesrepo' });
}

// Initialize Firebase Auth for tests (PHIPA/PIPEDA compliant - real Firebase, no mocks)
let testAuth: Auth | null = null;
try {
  const apps = getApps();
  if (apps.length > 0) {
    // Try to get existing auth first
    try {
      testAuth = getAuth(apps[0]);
    } catch {
      // If no auth exists, initialize it
      testAuth = initializeAuth(apps[0], {
        persistence: [indexedDBLocalPersistence, inMemoryPersistence],
      });

      // Connect to emulator if env var is set (for local testing with emulators)
      const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost && !testAuth._delegate?._config?.emulator) {
        connectAuthEmulator(testAuth, `http://${emulatorHost}`, { disableWarnings: true });
      }
    }
  }
} catch (error) {
  // Non-blocking: if auth init fails, tests can still proceed with minimal setup
  console.warn('[TEST SETUP] Firebase Auth initialization warning (non-blocking):', error instanceof Error ? error.message : String(error));
}

// Export for tests that need direct access to auth
if (typeof global !== 'undefined') {
  (global as any).__TEST_AUTH__ = testAuth;
}
