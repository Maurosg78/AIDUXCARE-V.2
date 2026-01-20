/// <reference types="node" />
/// <reference lib="dom" />
/// <reference path="../types/firebase-globals.d.ts" />

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFunctions, connectFunctionsEmulator, type Functions } from "firebase/functions";
import {
  initializeAuth,
  getAuth,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

const __IS_TEST__ =
  typeof process !== 'undefined' && process?.env && (
    !!process.env.VITEST ||
    process.env.NODE_ENV === 'test' ||
    import.meta.env?.MODE === 'test' ||
    import.meta.env?.VITEST === true
  );

interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _app: any;
let _auth: any;
let _db: any;
let _storage: any;
let _analytics: Analytics | null = null;
let _functions: Functions | null = null;

function initFirebaseOnce() {
  if (_app) return;
  // Check if app already exists (e.g., initialized in test setup)
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return;
  }
  // In tests, use minimal config if env vars not available
  const config = __IS_TEST__ && !firebaseConfig.projectId 
    ? { projectId: 'demo-notesrepo' }
    : firebaseConfig;
  _app = initializeApp(config);
}

function cleanupStaleAuthStateIfProjectChanged(projectId: string) {
  if (typeof window === "undefined") return;

  try {
    const key = "aidux_firebase_project_id";
    const prev = window.localStorage.getItem(key);
    if (prev && prev !== projectId) {
      console.warn("[AUTH] Project changed. Clearing persisted Firebase Auth state.", {
        prev,
        now: projectId,
      });

      const toDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("firebase:authUser:") || k.startsWith("firebase:authEvent:") || k.startsWith("firebase:redirectEvent:")) {
          toDelete.push(k);
        }
      }
      toDelete.forEach((k) => window.localStorage.removeItem(k));

      if (window.indexedDB?.deleteDatabase) {
        try {
          window.indexedDB.deleteDatabase("firebaseLocalStorageDb");
        } catch {
          // ignore
        }
      }
    }

    window.localStorage.setItem(key, projectId);
  } catch (e) {
    console.warn("[AUTH] cleanupStaleAuthStateIfProjectChanged failed (non-blocking)", e);
  }
}

function initAuthWithPersistence(): Auth {
  const projectId = firebaseConfig.projectId || "unknown";
  cleanupStaleAuthStateIfProjectChanged(projectId);

  return initializeAuth(_app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence,
    ],
  });
}

if (!__IS_TEST__) {
  initFirebaseOnce();
  _auth = initAuthWithPersistence();
  _db = initializeFirestore(_app, { experimentalForceLongPolling: true });
  _storage = getStorage(_app);
  
  // ✅ CRITICAL FIX: Initialize Firebase Functions
  // Functions must be initialized before use, especially for regional functions
  try {
    // Initialize Functions with default region (us-central1)
    // Individual services can override with specific regions (e.g., northamerica-northeast1)
    _functions = getFunctions(_app);
    console.info("✅ Firebase Functions initialized");
  } catch (error: any) {
    console.error("❌ Firebase Functions initialization failed:", error?.message || error);
    // Don't throw - some features may not need Functions
  }
  
  // WO-FS-ENV-02: Log Firestore database instance info
  if (typeof window !== 'undefined' && _db) {
    console.info("[PROOF] Firestore database initialized for project:", _app.options.projectId);
  }

  if (typeof window !== 'undefined') {
    try {
      _analytics = getAnalytics(_app);
      console.info("✅ Firebase Analytics initialized");
    } catch (error: any) {
      console.warn("⚠️ Firebase Analytics initialization failed:", error?.message || error);
    }
  }

  console.info("✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId);
  
  // WO-FS-ENV-02: Runtime Firestore Proof of Project - Log configuration evidence
  if (typeof window !== 'undefined' && _app) {
    console.info("[PROOF] Firebase runtime config:", {
      projectId: _app.options.projectId,
      apiKey: _app.options.apiKey ? `${_app.options.apiKey.substring(0, 10)}...` : 'undefined',
      authDomain: _app.options.authDomain,
      storageBucket: _app.options.storageBucket,
    });
  }

  if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === "true") {
    try {
      const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost) {
        connectAuthEmulator(_auth, `http://${emulatorHost}`);
      }
      connectFirestoreEmulator(_db, "127.0.0.1", 8080);
      
      // Connect Functions emulator if configured
      const functionsEmulatorHost = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST;
      if (functionsEmulatorHost && _functions) {
        connectFunctionsEmulator(_functions, "127.0.0.1", 5001);
      }

      console.info(
        "✅ Firebase inicializado en modo EMULATOR. Auth:",
        emulatorHost,
        "Firestore: 127.0.0.1:8080",
        "Functions:",
        functionsEmulatorHost ? "127.0.0.1:5001" : "not configured"
);
   } catch (error: any) {
      console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error?.message || error);
    }
  }
} else {
  // ✅ PHIPA/PIPEDA-aware: Inicializar Firebase real en tests (sin mocks)
  initFirebaseOnce();
  // Inicializar Auth en tests - se ejecuta inmediatamente al cargar el módulo
  if (!_auth) {
    try {
      // First, try to get auth from test/setupTests.ts (if available)
      if (typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
        _auth = (global as any).__TEST_AUTH__;
      } else if (_app) {
        // Try to get existing auth from app (initialized by test/setupTests.ts)
        try {
          _auth = getAuth(_app);
          // Verify auth is actually valid (has _delegate)
          if (!_auth || !(_auth as any)._delegate) {
            throw new Error('Auth exists but is invalid');
          }
        } catch {
          // If no auth exists, initialize it with minimal config (no API key required)
          _auth = initializeAuth(_app, {
            persistence: [indexedDBLocalPersistence, inMemoryPersistence],
          });
        }
      }
      // Conectar a emulador si está configurado (para tests locales)
      const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || import.meta.env?.VITE_FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost && _auth && !(_auth as any)._delegate?._config?.emulator) {
        try {
          connectAuthEmulator(_auth, `http://${emulatorHost}`, { disableWarnings: true });
        } catch {
          // Ignore if already connected
        }
      }
    } catch (error) {
      console.warn('[FIREBASE TEST] Auth initialization failed (non-blocking):', error instanceof Error ? error.message : String(error));
    }
  }
}

// Fallback: Si aún no hay auth en modo test, intentar obtenerlo del app o inicializar
if (__IS_TEST__ && !_auth) {
  try {
    // Try global test auth first (from test/setupTests.ts)
    if (typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
      _auth = (global as any).__TEST_AUTH__;
    } else {
      // Ensure _app is initialized
      if (!_app) {
        initFirebaseOnce();
      }
      if (_app) {
        // Try to get existing auth first
        try {
          _auth = getAuth(_app);
          // Verify auth is actually valid
          if (!_auth || !(_auth as any)._delegate) {
            throw new Error('Auth exists but is invalid');
          }
        } catch {
          // Initialize with minimal persistence (no API key needed for emulator mode)
          try {
            _auth = initializeAuth(_app, {
              persistence: [inMemoryPersistence],
            });
          } catch (initError) {
            // If initialization fails, try to get from global again (maybe it was set after initFirebaseOnce)
            if (typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
              _auth = (global as any).__TEST_AUTH__;
            } else {
              throw initError;
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('[FIREBASE TEST] Fallback auth initialization failed (non-blocking):', error instanceof Error ? error.message : String(error));
  }
}

// Final check: in test mode, try to get auth from global if not yet initialized
if (__IS_TEST__ && !_auth && typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
  _auth = (global as any).__TEST_AUTH__;
}

export const auth = _auth;
export const db = _db;
export const storage = _storage;
export const analytics = _analytics;
export const functions = _functions;
// Bloque 6: Export app para compatibilidad con VertexAIServiceViaFirebase
export { _app as app };
export default _app; // Default export para compatibilidad