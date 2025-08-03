/**
 * Firebase Client Centralizado - AiDuxCare V.2
 * Cliente único para toda la aplicación
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuración Firebase
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase solo si no hay apps existentes
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Exportar instancias
export const db = getFirestore(app);
export const auth = getAuth(app);
export { app }; 