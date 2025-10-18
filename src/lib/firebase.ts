/**
 * Firebase bootstrap – DEV con emuladores
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const envTarget = import.meta.env.VITE_ENV_TARGET || 'PROD';
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

if (envTarget === 'PROD' && useEmulators) {
  throw new Error('SEGURIDAD: Emuladores PROHIBIDOS en PROD. VITE_USE_EMULATORS debe ser false');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true, experimentalAutoDetectLongPolling: true, useFetchStreams: false });

if (useEmulators) {
  // 🔌 Conecta a emuladores locales explícitamente
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

console.log(` Firebase conectado a ${useEmulators ? 'EMULADORES' : 'PROD'}: ${firebaseConfig.projectId}`);
console.log(` Entorno: ${envTarget} | Emuladores: ${useEmulators ? 'PERMITIDOS' : 'BLOQUEADOS'}`);

export { app, auth, db };
