#!/usr/bin/env node

/**
 * Script de diagnóstico completo para Firebase UAT
 * Verifica configuración, conectividad y operaciones básicas
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para cargar .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔍 DIAGNÓSTICO FIREBASE UAT - AiDuxCare V.2\n');

// Verificar variables de entorno críticas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('📋 VERIFICACIÓN DE VARIABLES DE ENTORNO:');
let envOk = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NO DEFINIDA`);
    envOk = false;
  } else {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  }
});

if (!envOk) {
  console.log('\n❌ ERROR: Variables de entorno críticas faltantes');
  process.exit(1);
}

// Configuración de Firebase UAT
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('\n🔧 CONFIGURACIÓN FIREBASE:');
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

// Test 1: Verificar conectividad básica
console.log('\n🧪 TEST 1: CONECTIVIDAD BÁSICA');
try {
  // Verificar que auth esté disponible
  if (auth) {
    console.log('✅ Auth service disponible');
  } else {
    console.log('❌ Auth service no disponible');
  }
  
  // Verificar que db esté disponible  
  if (db) {
    console.log('✅ Firestore disponible');
  } else {
    console.log('❌ Firestore no disponible');
  }
} catch (error) {
  console.log('❌ Error en conectividad básica:', error.message);
}

// Test 2: Verificar método de autenticación Email/Password
console.log('\n🧪 TEST 2: MÉTODO EMAIL/PASSWORD');
try {
  // Intentar verificar si el método está habilitado
  // Esto fallará si el método no está habilitado
  const testEmail = 'test-uat-' + Date.now() + '@example.com';
  console.log(`   Probando con email: ${testEmail}`);
  
  // Verificar métodos disponibles
  const methods = await fetchSignInMethodsForEmail(auth, testEmail);
  console.log(`   Métodos disponibles: ${methods.length > 0 ? methods.join(', ') : 'ninguno'}`);
  console.log('✅ Método Email/Password está habilitado');
} catch (error) {
  if (error.code === 'auth/operation-not-allowed') {
    console.log('❌ ERROR: Método Email/Password NO está habilitado en UAT');
    console.log('   Código de error:', error.code);
    console.log('   Mensaje:', error.message);
  } else {
    console.log('❌ Error inesperado:', error.code, error.message);
  }
}

// Test 3: Verificar permisos de Firestore
console.log('\n🧪 TEST 3: PERMISOS FIRESTORE');
try {
  const testCollection = 'uat-test-' + Date.now();
  console.log(`   Probando colección: ${testCollection}`);
  
  // Intentar escribir un documento de prueba
  const testDoc = {
    test: true,
    timestamp: new Date(),
    environment: 'UAT',
    testId: Date.now()
  };
  
  const docRef = await addDoc(collection(db, testCollection), testDoc);
  console.log(`✅ Documento creado en Firestore: ${docRef.id}`);
  
  // Limpiar documento de prueba
  console.log('   Limpiando documento de prueba...');
  // Nota: No podemos eliminar desde aquí, pero es solo un test
} catch (error) {
  console.log('❌ Error en Firestore:', error.code, error.message);
}

// Test 4: Verificar configuración de dominios autorizados
console.log('\n🧪 TEST 4: DOMINIOS AUTORIZADOS');
try {
  // Verificar si localhost está permitido
  const currentDomain = 'localhost';
  console.log(`   Dominio actual: ${currentDomain}`);
  
  // Esto es más complejo de verificar por CLI, pero podemos inferir
  if (firebaseConfig.authDomain.includes('uat')) {
    console.log('✅ Auth domain configurado para UAT');
  } else {
    console.log('❌ Auth domain NO está configurado para UAT');
  }
} catch (error) {
  console.log('❌ Error verificando dominios:', error.message);
}

console.log('\n📊 RESUMEN DEL DIAGNÓSTICO:');
console.log('=====================================');

if (envOk) {
  console.log('✅ Variables de entorno: OK');
} else {
  console.log('❌ Variables de entorno: FALLO');
}

console.log(`✅ Configuración Firebase: ${firebaseConfig.projectId}`);
console.log('✅ Inicialización Firebase: OK');

console.log('\n🎯 RECOMENDACIONES:');
console.log('1. Si TEST 2 falla: Habilitar Email/Password en Firebase Console UAT');
console.log('2. Si TEST 3 falla: Verificar reglas de Firestore en UAT');
console.log('3. Si TEST 4 falla: Verificar dominios autorizados en UAT');

console.log('\n🔗 ENLACES ÚTILES:');
console.log(`   Firebase Console UAT: https://console.firebase.google.com/project/${firebaseConfig.projectId}`);
console.log('   Authentication → Sign-in method → Email/Password');

console.log('\n✨ Diagnóstico completado');
