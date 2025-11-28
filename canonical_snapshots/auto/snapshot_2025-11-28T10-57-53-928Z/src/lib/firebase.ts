import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectAuthEmulator } from "firebase/auth";

// ✅ Firebase configuración real (CLOUD)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 🚀 Inicialización en la nube (sin emuladores)
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.info("✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId);

// ✅ Configuración de emulators para desarrollo local  
if (import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true') {
  try {
    // Conectar Auth Emulator
    connectAuthEmulator(auth, `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`);
    
    // Conectar Firestore Emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    
    console.info("✅ Firebase inicializado en modo EMULATOR. Auth:", import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST, "Firestore: 127.0.0.1:8080");
  } catch (error) {
    console.warn("⚠️ Error conectando emulators (normal si ya conectados):", error.message);
  }
}
