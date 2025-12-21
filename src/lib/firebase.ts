import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  type Auth,
} from "firebase/auth";

// ✅ Firebase configuración real (CLOUD)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 🚀 Inicialización en la nube (sin emuladores)
const app = initializeApp(firebaseConfig);

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
  return initializeAuth(app, {
    persistence: [
      indexedDBLocalPersistence,
      browserLocalPersistence,
      browserSessionPersistence,
      inMemoryPersistence,
    ],
  });
}

export const auth = initAuthWithPersistence();
export const db = getFirestore(app);
export const storage = getStorage(app);

console.info("✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId);

// ✅ Configuración de emulators para desarrollo local
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === "true") {
  try {
    connectAuthEmulator(auth, `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`);
    connectFirestoreEmulator(db, "127.0.0.1", 8080);

    console.info(
      "✅ Firebase inicializado en modo EMULATOR. Auth:",
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST,
      "Firestore: 127.0.0.1:8080"
    );
  } catch (error: any) {
    console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error?.message || error);
  }
}
