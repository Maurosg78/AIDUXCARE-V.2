/**
 * Configuración y inicialización de Firebase
 * @version 2.0.0 - Sin fallbacks hardcodeados, solo variables de entorno
 * @author AiDuxCare Development Team
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Interfaz para configuración de Firebase
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Valida que todas las variables de entorno estén configuradas
 * NO hay fallbacks hardcodeados - falla ruidosamente si falta algo
 */
function assertEnv(): void {
  const requiredKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missingKeys = requiredKeys.filter(key => !import.meta.env[key]);
  
  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase configuration error: Missing environment variables: ${missingKeys.join(', ')}`
    );
  }
}

/**
 * Carga configuración de Firebase desde variables de entorno
 * Única fuente de verdad - sin hardcodeos
 */
function loadFirebaseConfig(): FirebaseConfig {
  assertEnv();
  
  const config: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
    appId: import.meta.env.VITE_FIREBASE_APP_ID!,
  };

  // --- Guardarraíles de entorno (añadir en src/lib/firebase.ts) ---
  const ENV_TARGET = (import.meta.env.VITE_ENV_TARGET || '').toUpperCase().trim();
  const PROJECT_ID = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const AUTH_DOMAIN = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();

  // Validación mínima
  if (!ENV_TARGET || !PROJECT_ID || !AUTH_DOMAIN) {
    throw new Error('[Firebase Guardrails] Variables de entorno incompletas: VITE_ENV_TARGET / VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_AUTH_DOMAIN');
  }

  // Mapa simple esperado por target (ajusta IDs exactos si ya definidos)
  const EXPECTED = {
    UAT: { mustContain: 'uat' },
    PROD: { mustContain: 'prod' },
  };

  const expected = EXPECTED[ENV_TARGET as keyof typeof EXPECTED];
  if (!expected) {
    throw new Error(`[Firebase Guardrails] VITE_ENV_TARGET desconocido: ${ENV_TARGET}`);
  }
  if (!PROJECT_ID.toLowerCase().includes(expected.mustContain)) {
    throw new Error(`[Firebase Guardrails] PROJECT_ID (${PROJECT_ID}) no coincide con target (${ENV_TARGET})`);
  }
  if (import.meta.env.DEV) {
    // Bloquea accidentalmente usar PROD en localhost
    const isLocalhost = typeof window !== 'undefined' && window?.location?.hostname === 'localhost';
    if (isLocalhost && ENV_TARGET === 'PROD') {
      throw new Error('[Firebase Guardrails] Uso de PROD en localhost bloqueado');
    }
    // Log honesto en dev
    console.info(`[Firebase] Target=${ENV_TARGET} · projectId=${PROJECT_ID} · authDomain=${AUTH_DOMAIN}`);
  }
  // --- Fin guardarraíles ---

  return config;
}

/**
 * Inicializa la aplicación Firebase
 * NO hay fallbacks - falla si la configuración no es válida
 */
let app: FirebaseApp;

try {
  const firebaseConfig = loadFirebaseConfig();
  
  // Log informativo único al inicializar (solo en dev)
  if (import.meta.env.DEV) {
    const apiKeyHash = `${firebaseConfig.apiKey.substring(0, 6)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`;
    const envTarget = import.meta.env.VITE_ENV_TARGET || 'NO_DEFINIDO';
    
    console.info('[Firebase] Configuración cargada:');
    console.info('  projectId:', firebaseConfig.projectId);
    console.info('  authDomain:', firebaseConfig.authDomain);
    console.info('  apiKey hash:', apiKeyHash);
    console.info('  envTarget:', envTarget);
    console.info('  actionUrl:', import.meta.env.VITE_PUBLIC_ACTION_URL || 'NO_DEFINIDO');
  }
  
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('❌ CRÍTICO: Error initializing Firebase:', error);
  throw error; // NO hay fallback - falla completamente
}

/**
 * Instancias de Firebase - únicos singletons
 */
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

/**
 * Configuración de Firestore
 */
export const firestoreSettings = {
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
  experimentalForceLongPolling: false,
  useFetchStreams: false,
};

/**
 * Configuración de Storage
 */
export const storageSettings = {
  maxUploadRetryTime: 60000, // 1 minuto
  maxOperationRetryTime: 120000, // 2 minutos
};

/**
 * Configuración de Auth
 */
export const authSettings = {
  persistence: 'local' as const,
  languageCode: 'es',
  tenantId: undefined,
};

export default app;
