/**
 * Script para limpiar la sesión de Firebase
 * Ejecutar: node scripts/clear-firebase-session.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function clearFirebaseSession() {
  console.log('🚀 Limpiando sesión de Firebase...');
  console.log('📋 Configuración:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
  
  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    console.log('📱 Estado actual de autenticación:', auth.currentUser ? 'Usuario logueado' : 'Sin usuario');
    
    if (auth.currentUser) {
      console.log('🔐 Usuario actual:', auth.currentUser.email);
      console.log('🔄 Cerrando sesión...');
      
      await signOut(auth);
      console.log('✅ Sesión cerrada exitosamente');
    } else {
      console.log('ℹ️ No hay sesión activa para cerrar');
    }
    
    console.log('🧹 Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error limpiando sesión:', error.message);
  }
}

// Ejecutar limpieza
clearFirebaseSession(); 