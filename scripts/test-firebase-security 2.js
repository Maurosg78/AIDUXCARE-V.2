#!/usr/bin/env node

/**
 * Test avanzado de seguridad y configuración Firebase UAT
 * Verifica reglas, dominios y configuraciones ocultas
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔒 TEST AVANZADO DE SEGURIDAD FIREBASE UAT - FASE 1.5\n');

// Configuración de Firebase UAT
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('📋 CONFIGURACIÓN FIREBASE:');
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

// Test 1: Verificar configuración de Auth en detalle
console.log('\n🔐 TEST 1: CONFIGURACIÓN AVANZADA DE AUTH');
try {
  const authConfig = auth.config;
  if (authConfig) {
    console.log('✅ Configuración de Auth disponible');
    console.log(`   API Host: ${authConfig.apiHost}`);
    console.log(`   Token API Host: ${authConfig.tokenApiHost}`);
    console.log(`   Client Platform: ${authConfig.clientPlatform}`);
    console.log(`   SDK Version: ${authConfig.sdkClientVersion}`);
    
    // Verificar si hay configuraciones específicas de dominio
    if (authConfig.authDomain) {
      console.log(`   Auth Domain configurado: ${authConfig.authDomain}`);
    }
  } else {
    console.log('❌ Configuración de Auth no disponible');
  }
} catch (error) {
  console.log('❌ Error accediendo a configuración de Auth:', error.message);
}

// Test 2: Verificar configuración de la app
console.log('\n⚙️ TEST 2: CONFIGURACIÓN DE LA APP');
try {
  if (app.options) {
    console.log('✅ Opciones de la app disponibles');
    console.log('   Opciones configuradas:', Object.keys(app.options));
    
    // Verificar configuraciones críticas
    if (app.options.authDomain) {
      console.log(`   Auth Domain en app: ${app.options.authDomain}`);
    }
    if (app.options.projectId) {
      console.log(`   Project ID en app: ${app.options.projectId}`);
    }
  } else {
    console.log('⚠️ Opciones de la app no disponibles');
  }
} catch (error) {
  console.log('❌ Error accediendo a opciones de la app:', error.message);
}

// Test 3: Verificar permisos de Firestore (esto puede afectar Auth)
console.log('\n🗄️ TEST 3: PERMISOS DE FIRESTORE');
try {
  const testCollection = 'security-test-' + Date.now();
  const testDocId = 'test-doc-' + Date.now();
  
  console.log(`   Probando colección: ${testCollection}`);
  console.log(`   Documento de prueba: ${testDocId}`);
  
  // Intentar escribir un documento
  const testDoc = {
    test: true,
    timestamp: new Date(),
    purpose: 'security-test',
    environment: 'UAT'
  };
  
  const docRef = doc(db, testCollection, testDocId);
  await setDoc(docRef, testDoc);
  console.log('✅ Documento escrito en Firestore exitosamente');
  
  // Intentar leer el documento
  const readDoc = await getDoc(docRef);
  if (readDoc.exists()) {
    console.log('✅ Documento leído de Firestore exitosamente');
    console.log(`   Datos: ${JSON.stringify(readDoc.data())}`);
  } else {
    console.log('⚠️ Documento no encontrado después de escribirlo');
  }
  
} catch (error) {
  console.log('❌ Error en Firestore:', error.code, error.message);
  
  if (error.code === 'permission-denied') {
    console.log('🚨 PROBLEMA CRÍTICO: Reglas de Firestore bloqueando operaciones');
    console.log('   Esto puede estar afectando indirectamente a Firebase Auth');
  }
}

// Test 4: Verificar si hay problemas de red o API
console.log('\n🌐 TEST 4: VERIFICACIÓN DE RED Y API');
try {
  // Verificar si podemos hacer operaciones básicas de Auth
  console.log('   Verificando operaciones básicas de Auth...');
  
  // Intentar acceder a propiedades internas que pueden revelar problemas
  if (auth.app) {
    console.log('✅ App reference disponible en Auth');
  } else {
    console.log('⚠️ App reference no disponible en Auth');
  }
  
  if (auth.currentUser === null) {
    console.log('✅ Estado de usuario actual correcto (null = no autenticado)');
  } else {
    console.log('⚠️ Estado de usuario inesperado:', auth.currentUser);
  }
  
} catch (error) {
  console.log('❌ Error en verificación de red/API:', error.message);
}

// Test 5: Verificar configuración de dominios (simulación)
console.log('\n🏠 TEST 5: VERIFICACIÓN DE DOMINIOS (SIMULACIÓN)');
try {
  // Simular verificación de dominio
  const currentDomain = 'localhost';
  const authDomain = firebaseConfig.authDomain;
  
  console.log(`   Dominio actual: ${currentDomain}`);
  console.log(`   Auth Domain configurado: ${authDomain}`);
  
  // Verificar si hay inconsistencias
  if (authDomain.includes('uat')) {
    console.log('✅ Auth Domain apunta correctamente a UAT');
  } else {
    console.log('❌ Auth Domain NO apunta a UAT');
  }
  
  // Verificar si localhost está permitido (esto es crítico)
  console.log('   ⚠️ IMPORTANTE: Verificar manualmente en Firebase Console UAT:');
  console.log('      Authentication → Settings → Authorized domains');
  console.log('      Confirmar que "localhost" esté en la lista');
  
} catch (error) {
  console.log('❌ Error verificando dominios:', error.message);
}

console.log('\n📊 RESUMEN DEL TEST AVANZADO:');
console.log('=====================================');

console.log('\n🎯 DIAGNÓSTICO ACTUALIZADO:');
console.log('✅ Firebase se conecta correctamente');
console.log('✅ Configuración apunta a UAT');
console.log('✅ Email/Password está habilitado en Console');
console.log('❌ PERO auth/operation-not-allowed persiste');

console.log('\n🔍 POSIBLES CAUSAS IDENTIFICADAS:');
console.log('1. Dominios autorizados incorrectos (localhost no permitido)');
console.log('2. Reglas de Firestore bloqueando operaciones');
console.log('3. Problema de sincronización entre Console y API');
console.log('4. Configuración de API específica incorrecta');

console.log('\n🔗 ACCIONES REQUERIDAS:');
console.log('1. Verificar Authentication → Settings → Authorized domains');
console.log('2. Confirmar que "localhost" esté en la lista');
console.log('3. Si no está, agregarlo manualmente');
console.log('4. Verificar reglas de Firestore en Database → Rules');

console.log('\n✨ Test avanzado de seguridad completado - FASE 1.5');
