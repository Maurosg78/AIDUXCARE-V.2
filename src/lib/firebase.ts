/// <reference types="node" />
/// <reference lib="dom" />
/// <reference path="../types/firebase-globals.d.ts" />

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";
import {
  initializeAuth,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

const __IS_TEST__ =
  typeof process !== 'undefined' && process?.env && !!process.env.VITEST;

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

function initFirebaseOnce() {
  if (__IS_TEST__) return;
  if (_app) return;
  _app = initializeApp(firebaseConfig);
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

  if (typeof window !== 'undefined') {
    try {
      _analytics = getAnalytics(_app);
      console.info("✅ Firebase Analytics initialized");
    } catch (error: any) {
      console.warn("⚠️ Firebase Analytics initialization failed:", error?.message || error);
    }
  }

  console.info("✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId);

  if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === "true") {
    try {
      const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost) {
        connectAuthEmulator(_auth, `http://${emulatorHost}`);
      }
      connectFirestoreEmulator(_db, "127.0.0.1", 8080);

      console.info(
        "✅ Firebase inicializado en modo EMULATOR. Auth:",
        emulatorHost,
        "Firestore: 127.0.0.1:8080"
);
   } catch (error: any) {
      console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error?.message || error);
    }
  }
}

export const auth = _auth;
export const db = _db;
export const storage = _storage;
export const analytics = _analytics;
