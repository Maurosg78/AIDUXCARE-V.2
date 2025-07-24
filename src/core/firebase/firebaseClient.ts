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

// Configurar emuladores solo en desarrollo
const isEmulatorMode = process.env.NODE_ENV === 'development' || 
                      getEnv('VITE_USE_FIREBASE_EMULATOR') === 'true';

// Configuración de Firestore
export const db = getFirestore(firebaseApp);

// Configuración de Auth
export const auth = getAuth(firebaseApp);

// Conectar emuladores solo si no se han conectado antes
if (isEmulatorMode) {
  try {
    // Verificar si los emuladores están ejecutándose
    const firestoreConnected = (db as any)._delegate?._databaseId?.database?.includes('localhost');
    const authConnected = auth.config.emulator;

    if (!firestoreConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔥 Firestore Emulator conectado: localhost:8080');
    }

    if (!authConnected) {
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔥 Auth Emulator conectado: localhost:9099');
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron conectar los emuladores:', error);
  }
}

export const app = firebaseApp; 