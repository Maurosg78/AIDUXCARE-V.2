import '@testing-library/jest-dom/vitest';
// --- Firebase init for tests (compliance: real Firebase, no mocks) ---
import { getApps, initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, inMemoryPersistence, connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';

// T1-T2: Firebase config test-safe (sin strings vacíos para evitar warnings)
const getTestFirebaseConfig = () => {
  // Usar env vars si existen, sino placeholders no vacíos
  const apiKey = (process.env.VITE_FIREBASE_API_KEY || import.meta.env?.VITE_FIREBASE_API_KEY || '').trim() || 'test-api-key-placeholder';
  const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || import.meta.env?.VITE_FIREBASE_PROJECT_ID || '').trim() || 'demo-notesrepo';
  const authDomain = (process.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '').trim() || `${projectId}.firebaseapp.com`;
  const appId = (process.env.VITE_FIREBASE_APP_ID || import.meta.env?.VITE_FIREBASE_APP_ID || '').trim() || '1:test:web:test-app-id';
  
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: '123456789',
    appId,
  };
};

// Initialize Firebase App for tests
if (!getApps().length) {
  const testConfig = getTestFirebaseConfig();
  initializeApp(testConfig);
}

// Initialize Firebase Auth for tests (PHIPA/PIPEDA compliant - real Firebase, no mocks)
let testAuth: Auth | null = null;
const isUsingTestConfig = !process.env.VITE_FIREBASE_API_KEY && !import.meta.env?.VITE_FIREBASE_API_KEY;

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
      const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || import.meta.env?.FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost && !testAuth._delegate?._config?.emulator) {
        connectAuthEmulator(testAuth, `http://${emulatorHost}`, { disableWarnings: true });
      }
    }
  }
} catch (error) {
  // T3: Si usamos placeholder config, no registrar warning (es esperado)
  // Solo loguear si hay un error real (no es por apiKey placeholder)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isInvalidApiKeyError = errorMessage.includes('invalid-api-key');
  
  if (!isUsingTestConfig || !isInvalidApiKeyError) {
    // Solo registrar si no es el caso esperado de placeholder config
    console.warn('[TEST SETUP] Firebase Auth initialization warning (non-blocking):', errorMessage);
  }
  // Si es placeholder config con invalid-api-key, silenciar (comportamiento esperado)
}

// Export for tests that need direct access to auth
if (typeof global !== 'undefined') {
  (global as any).__TEST_AUTH__ = testAuth;
}
