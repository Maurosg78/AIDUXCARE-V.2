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
    import.meta.env?.VITEST === 'true'
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
  const existingApps = getApps();
  if (existingApps.length > 0) {
    _app = existingApps[0];
    return;
  }
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

// ✅ CRITICAL FIX: Lazy initialization function for Functions
function getFirebaseFunctions(): Functions {
  if (!_functions) {
    if (!_app) {
      throw new Error('Firebase app is not initialized');
    }
    try {
      _functions = getFunctions(_app, 'northamerica-northeast1');
      console.info("✅ Firebase Functions initialized on-demand for region: northamerica-northeast1");
    } catch (error: any) {
      console.error("❌ Firebase Functions initialization failed:", error?.message || error);
      throw new Error('Firebase Functions is not available. Please refresh the page.');
    }
  }
  return _functions;
}

if (!__IS_TEST__) {
  initFirebaseOnce();
  _auth = initAuthWithPersistence();
  _db = initializeFirestore(_app, { experimentalForceLongPolling: true });
  _storage = getStorage(_app);

  // ✅ CRITICAL FIX: Do NOT initialize Functions at module load time
  console.info("✅ Firebase Functions ready (will initialize on first use)");

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

      const functionsEmulatorHost = import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST;
      if (functionsEmulatorHost) {
        const funcs = getFirebaseFunctions();
        connectFunctionsEmulator(funcs, "127.0.0.1", 5001);
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
  initFirebaseOnce();
  if (!_auth) {
    try {
      if (typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
        _auth = (global as any).__TEST_AUTH__;
      } else if (_app) {
        try {
          _auth = getAuth(_app);
          if (!_auth || !(_auth as any)._delegate) {
            throw new Error('Auth exists but is invalid');
          }
        } catch {
          _auth = initializeAuth(_app, {
            persistence: [indexedDBLocalPersistence, inMemoryPersistence],
          });
        }
      }
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

if (__IS_TEST__ && !_auth) {
  try {
    if (typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
      _auth = (global as any).__TEST_AUTH__;
    } else {
      if (!_app) {
        initFirebaseOnce();
      }
      if (_app) {
        try {
          _auth = getAuth(_app);
          if (!_auth || !(_auth as any)._delegate) {
            throw new Error('Auth exists but is invalid');
          }
        } catch {
          try {
            _auth = initializeAuth(_app, {
              persistence: [inMemoryPersistence],
            });
          } catch (initError) {
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

if (__IS_TEST__ && !_auth && typeof global !== 'undefined' && (global as any).__TEST_AUTH__) {
  _auth = (global as any).__TEST_AUTH__;
}

export const auth = _auth;
export const db = _db;
export const storage = _storage;
export const analytics = _analytics;
export const getFunctionsInstance = getFirebaseFunctions;
export { _app as app };
export default _app;