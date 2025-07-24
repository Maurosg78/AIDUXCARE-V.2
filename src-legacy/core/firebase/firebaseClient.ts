import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Helper para obtener variable de entorno compatible con Vite y Node
function getEnv(key: string): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key];
  }
  return undefined;
}

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
};

// Inicializar solo si no existe
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const app = firebaseApp;
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Configuración global: DESACTIVAR completamente Phone Auth/SMS
window.DISABLE_PHONE_AUTH = true;
window.FORCE_EMAIL_ONLY = true;

// Conexión automática a emuladores en entorno local
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  // Conectar Auth al emulador
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    // eslint-disable-next-line no-console
    console.info('[Firebase] Auth conectado al emulador en http://localhost:9099');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] No se pudo conectar al emulador de Auth:', e);
  }

  // Conectar Firestore al emulador
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    // eslint-disable-next-line no-console
    console.info('[Firebase] Firestore conectado al emulador en localhost:8080');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] No se pudo conectar al emulador de Firestore:', e);
  }
}

// Override global para bloquear signInWithPhoneNumber
if (typeof window !== 'undefined') {
  const originalSignInWithPhoneNumber = window.signInWithPhoneNumber;
  window.signInWithPhoneNumber = function() {
    throw new Error('Phone Auth está desactivado. Usa solo verificación por email.');
  };
} 