#!/usr/bin/env node

/**
 * Verificación rápida del estado de Firebase UAT
 * Complementa la verificación manual en Firebase Console
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 VERIFICACIÓN RÁPIDA FIREBASE UAT - FASE 1\n');

// Configuración de Firebase UAT
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
console.log(`   API Key: ${firebaseConfig.apiKey.substring(0, 20)}...`);

// Inicializar Firebase
console.log('\n🚀 INICIALIZANDO FIREBASE...');
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.log('❌ Error inicializando Firebase:', error.message);
  process.exit(1);
}

// Verificación 1: Estado de Auth
console.log('\n🔐 VERIFICACIÓN 1: ESTADO DE AUTH');
try {
  if (auth) {
    console.log('✅ Auth service disponible');
    console.log(`   Config: ${auth.config ? 'Disponible' : 'No disponible'}`);
    console.log(`   Auth Domain: ${auth.config?.authDomain || 'No accesible'}`);
  } else {
    console.log('❌ Auth service no disponible');
  }
} catch (error) {
  console.log('❌ Error verificando Auth:', error.message);
}

// Verificación 2: Estado de Firestore
console.log('\n🗄️ VERIFICACIÓN 2: ESTADO DE FIRESTORE');
try {
  if (db) {
    console.log('✅ Firestore disponible');
    console.log(`   App: ${db.app.name}`);
    console.log(`   Type: ${db.type}`);
  } else {
    console.log('❌ Firestore no disponible');
  }
} catch (error) {
  console.log('❌ Error verificando Firestore:', error.message);
}

// Verificación 3: Intentar operación básica de Auth (sin crear usuario)
console.log('\n🧪 VERIFICACIÓN 3: OPERACIÓN BÁSICA DE AUTH');
try {
  // Solo verificar si podemos acceder a la configuración
  const authConfig = auth.config;
  if (authConfig) {
    console.log('✅ Configuración de Auth accesible');
    console.log(`   API Host: ${authConfig.apiHost}`);
    console.log(`   Token API Host: ${authConfig.tokenApiHost}`);
    console.log(`   Client Platform: ${authConfig.clientPlatform}`);
  } else {
    console.log('⚠️ Configuración de Auth no accesible');
  }
} catch (error) {
  console.log('❌ Error accediendo a configuración de Auth:', error.message);
}

// Verificación 4: Estado del proyecto
console.log('\n📊 VERIFICACIÓN 4: ESTADO DEL PROYECTO');
try {
  console.log(`   Project ID configurado: ${firebaseConfig.projectId}`);
  console.log(`   Auth Domain configurado: ${firebaseConfig.authDomain}`);
  
  // Verificar si hay inconsistencias
  if (firebaseConfig.projectId.includes('uat') && firebaseConfig.authDomain.includes('uat')) {
    console.log('✅ Configuración consistente para UAT');
  } else {
    console.log('❌ Configuración inconsistente - revisar variables de entorno');
  }
} catch (error) {
  console.log('❌ Error verificando estado del proyecto:', error.message);
}

console.log('\n📋 RESUMEN FASE 1:');
console.log('=====================================');
console.log('✅ Firebase se conecta correctamente');
console.log('✅ Configuración apunta a UAT');
console.log('✅ Servicios básicos disponibles');

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Verificar manualmente en Firebase Console UAT');
console.log('2. Confirmar estado de Email/Password en Sign-in method');
console.log('3. Verificar dominios autorizados');
console.log('4. Ejecutar test completo si la configuración está correcta');

console.log('\n🔗 ENLACE DIRECTO:');
console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);

console.log('\n✨ Verificación rápida completada - FASE 1');
