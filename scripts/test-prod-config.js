#!/usr/bin/env node

/**
 * Test rápido para verificar configuración de PROD
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🧪 TEST CONFIGURACIÓN PROD - VERIFICACIÓN RÁPIDA\n');

// Configuración actual
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('📋 CONFIGURACIÓN ACTUAL:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   API Key: ${firebaseConfig.apiKey?.substring(0, 20)}...`);

// Verificar si es PROD o UAT
if (firebaseConfig.projectId?.includes('prod')) {
  console.log('✅ Configuración apunta a PROD');
} else if (firebaseConfig.projectId?.includes('uat')) {
  console.log('⚠️ Configuración apunta a UAT');
} else {
  console.log('❌ Configuración no reconocida');
}

// Inicializar Firebase
console.log('\n🚀 INICIALIZANDO FIREBASE...');
try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log('✅ Firebase inicializado correctamente');
  console.log(`   Proyecto: ${firebaseConfig.projectId}`);
} catch (error) {
  console.log('❌ Error inicializando Firebase:', error.message);
}

console.log('\n✨ Test de configuración PROD completado');
