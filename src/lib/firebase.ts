/// <reference types="node" />
/// <reference lib="dom" />
/// <reference path="../types/firebase-globals.d.ts" />

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import {
  initializeAuth,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

// ✅ Detectar ambiente de test
const __IS_TEST__ =
  typeof process !== 'undefined' && process?.env && !!process.env.VITEST;

// ✅ Firebase configuración real (CLOUD)
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

// 🚀 Lazy initialization: NO inicializar en tests
let _app: any;
let _auth: any;
let _db: any;
let _storage: any;
let _functions: any;

function initFirebaseOnce() {
  if (__IS_TEST__) return; // NO inicializar en tests
  if (_app) return; // Ya inicializado

  _app = initializeApp(firebaseConfig);
}

/**
 * ✅ HARDENING: si cambió el proyecto, limpiamos credenciales viejas (evita 400 accounts:lookup)
 * Firebase Auth persiste usuarios en IndexedDB/localStorage; si hay mismatch/corrupción => 400.
 */
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

      // 1) localStorage keys usadas por Firebase Auth
      const toDelete: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("firebase:authUser:") || k.startsWith("firebase:authEvent:") || k.startsWith("firebase:redirectEvent:")) {
          toDelete.push(k);
        }
      }
      toDelete.forEach((k) => window.localStorage.removeItem(k));

      // 2) IndexedDB donde Firebase guarda el usuario
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

/**
 * ✅ Auth con persistencia explícita (reduce loops / estados raros)
 */
function initAuthWithPersistence(): Auth {
  const projectId = firebaseConfig.projectId || "unknown";
  cleanupStaleAuthStateIfProjectChanged(projectId);

  // Try in order: indexedDB -> localStorage -> session -> memory
  // (initializeAuth acepta array de persistencias)
  return initializeAuth(_app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence,
    ],
  });
}

// ✅ Inicializar solo si NO es test (lazy init)
if (!__IS_TEST__) {
  initFirebaseOnce();
  _auth = initAuthWithPersistence();
  _db = initializeFirestore(_app, { experimentalForceLongPolling: true });
  _storage = getStorage(_app);
  _functions = getFunctions(_app, 'northamerica-northeast1');

  // eslint-disable-next-line no-console
  console.info("✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId);

  // ✅ Configuración de emulators para desarrollo local
  if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === "true") {
    try {
      const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost) {
        connectAuthEmulator(_auth, `http://${emulatorHost}`);
      }
      connectFirestoreEmulator(_db, "127.0.0.1", 8080);

      // eslint-disable-next-line no-console
      console.info(
        "✅ Firebase inicializado en modo EMULATOR. Auth:",
        emulatorHost,
        "Firestore: 127.0.0.1:8080"
      );
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error?.message || error);
    }
  }
}

// Exportar: en tests serán undefined (mockeados), en producción serán los valores reales
export const auth = _auth;
export const db = _db;
export const storage = _storage;
export const functions = _functions;
