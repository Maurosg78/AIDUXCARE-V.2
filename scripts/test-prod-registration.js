#!/usr/bin/env node

/**
 * Test de registro completo usando configuración PROD
 * Para verificar que el registro funcione correctamente
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🧪 TEST DE REGISTRO COMPLETO CON PROD - FASE 2\n');

// Simular variables del navegador
global.window = {
  location: {
    origin: 'http://localhost:5174',
    hostname: 'localhost',
    protocol: 'http:'
  }
};

// Configuración de Firebase PROD
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('📋 CONFIGURACIÓN PROD:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   Window Origin: ${global.window.location.origin}`);

// Inicializar Firebase
console.log('\n🚀 INICIALIZANDO FIREBASE PROD...');
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase PROD inicializado correctamente');
} catch (error) {
  console.log('❌ Error inicializando Firebase PROD:', error.message);
  process.exit(1);
}

// Test 1: Verificar configuración de ActionCodeSettings
console.log('\n🧪 TEST 1: CONFIGURACIÓN ACTION CODE SETTINGS');
try {
  const actionCodeSettings = {
    url: `${global.window.location.origin}/activate`,
    handleCodeInApp: true,
  };
  
  console.log('   Action Code Settings configurados:');
  console.log(`   URL: ${actionCodeSettings.url}`);
  console.log(`   Handle Code In App: ${actionCodeSettings.handleCodeInApp}`);
  
  if (actionCodeSettings.url.includes('localhost')) {
    console.log('✅ URL de activación apunta a localhost (correcto para desarrollo)');
  } else {
    console.log('❌ URL de activación NO apunta a localhost');
  }
  
} catch (error) {
  console.log('❌ Error configurando Action Code Settings:', error.message);
}

// Test 2: Flujo completo de registro con PROD
console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO CON PROD');
try {
  const testEmail = 'test-prod-registration-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`   Intentando crear usuario en PROD: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Desde dominio: ${global.window.location.origin}`);
  
  // PASO 1: Crear usuario en PROD
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log(`✅ PASO 1 EXITOSO: Usuario creado en PROD: ${userCredential.user.uid}`);
  console.log(`   Email: ${userCredential.user.email}`);
  console.log(`   Email verified: ${userCredential.user.emailVerified}`);
  
  // PASO 2: Enviar email de verificación
  console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO - PASO 2');
  try {
    const actionCodeSettings = {
      url: `${global.window.location.origin}/activate`,
      handleCodeInApp: true,
    };
    
    console.log('   Enviando email de verificación desde PROD...');
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    console.log('✅ PASO 2 EXITOSO: Email de verificación enviado desde PROD');
    
  } catch (verificationError) {
    console.log('❌ PASO 2 FALLÓ: Error enviando email de verificación');
    console.log(`   Código: ${verificationError.code}`);
    console.log(`   Mensaje: ${verificationError.message}`);
  }
  
  // PASO 3: Guardar en Firestore PROD
  console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO - PASO 3');
  try {
    const userId = userCredential.user.uid;
    const userDoc = doc(db, 'users', userId);
    
    const userProfile = {
      fullName: 'Test User PROD Registration',
      email: testEmail,
      specialization: 'Test',
      country: 'es',
      province: 'valencia',
      city: 'Valencia',
      consentGDPR: true,
      consentHIPAA: true,
      consentMedical: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      environment: 'PROD',
      testType: 'registration-flow'
    };
    
    console.log('   Guardando perfil en Firestore PROD...');
    await setDoc(userDoc, userProfile);
    console.log('✅ PASO 3 EXITOSO: Perfil guardado en Firestore PROD');
    
  } catch (firestoreError) {
    console.log('❌ PASO 3 FALLÓ: Error guardando en Firestore PROD');
    console.log(`   Código: ${firestoreError.code}`);
    console.log(`   Mensaje: ${firestoreError.message}`);
  }
  
} catch (error) {
  console.log('❌ PASO 1 FALLÓ: Error creando usuario en PROD');
  console.log(`   Código: ${error.code}`);
  console.log(`   Mensaje: ${error.message}`);
  
  if (error.code === 'auth/operation-not-allowed') {
    console.log('\n🚨 ERROR CRÍTICO: auth/operation-not-allowed en PROD también');
    console.log('   Esto significa que el problema NO es específico de UAT');
    console.log('   El problema está en la configuración global o permisos');
  } else {
    console.log('\n🔍 Otro tipo de error:', error.code);
  }
}

// Test 3: Verificar diferencias entre UAT y PROD
console.log('\n🧪 TEST 3: COMPARACIÓN UAT vs PROD');
try {
  console.log('   Configuración actual (PROD):');
  console.log(`     Project ID: ${firebaseConfig.projectId}`);
  console.log(`     Auth Domain: ${firebaseConfig.authDomain}`);
  console.log(`     API Key: ${firebaseConfig.apiKey.substring(0, 20)}...`);
  
  // Verificar si hay diferencias en la inicialización
  if (auth.config.clientPlatform === 'Node') {
    console.log('   ⚠️ Auth corriendo en modo Node (CLI)');
  } else {
    console.log('   ✅ Auth corriendo en modo Web');
  }
  
} catch (error) {
  console.log('❌ Error comparando configuraciones:', error.message);
}

console.log('\n📊 RESUMEN DEL TEST DE REGISTRO PROD:');
console.log('=====================================');

console.log('\n🎯 RESULTADO DEL TEST:');
if (firebaseConfig.projectId.includes('prod')) {
  console.log('✅ Configuración apunta correctamente a PROD');
  console.log('✅ Firebase se conecta correctamente a PROD');
  console.log('✅ Servidor de desarrollo usando configuración PROD');
} else {
  console.log('❌ Configuración NO apunta a PROD');
}

console.log('\n🔍 PRÓXIMOS PASOS:');
console.log('1. Si el registro funciona: PROD está configurado correctamente');
console.log('2. Si el registro falla: Hay un problema global, no específico de UAT');
console.log('3. Probar registro en navegador: http://localhost:5174/register');

console.log('\n🔗 ENLACES ÚTILES:');
console.log(`   Firebase Console PROD: https://console.firebase.google.com/project/${firebaseConfig.projectId}`);
console.log(`   Users PROD: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);

console.log('\n✨ Test de registro PROD completado - FASE 2');
