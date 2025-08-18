/**
 * Configuración y inicialización de Firebase
 * @version 2.0.0 - Pipeline PROD sin emuladores
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/firebase-functions';

// GUARDRAILS: NO emuladores en PROD
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const envTarget = import.meta.env.VITE_ENV_TARGET || 'PROD';

// BLOQUEO DE SEGURIDAD: Si es PROD, emuladores están PROHIBIDOS
if (envTarget === 'PROD' && useEmulators) {
  throw new Error(' SEGURIDAD: Emuladores PROHIBIDOS en PROD. VITE_USE_EMULATORS debe ser false');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validación de configuración
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(' CONFIGURACIÓN: VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID son obligatorios');
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1');

// PROD: Configurar persistencia local
setPersistence(auth, browserLocalPersistence);

// Log de conexión con guardrails
console.log(` Firebase conectado a ${useEmulators ? 'EMULADORES' : 'PROD'}: ${firebaseConfig.projectId}`);
console.log(` Entorno: ${envTarget} | Emuladores: ${useEmulators ? 'PERMITIDOS' : 'BLOQUEADOS'}`);

// BLOQUEO FINAL: Si es PROD, verificar que no hay conexiones a localhost
if (envTarget === 'PROD') {
  const currentUrl = window.location.href;
  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    console.warn('⚠️ ADVERTENCIA: Ejecutando PROD en localhost. Verificar configuración.');
  }
}

export default app;
