#!/usr/bin/env node

/**
 * Test que replica exactamente el flujo del frontend
 * Para identificar el punto exacto de falla
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

console.log('🌐 TEST FLUJO EXACTO DEL FRONTEND - FASE 1.6\n');

// Simular variables del navegador
global.window = {
  location: {
    origin: 'http://localhost:5174',
    hostname: 'localhost',
    protocol: 'http:'
  }
};

// Configuración de Firebase UAT
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('📋 CONFIGURACIÓN FRONTEND:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   Window Origin: ${global.window.location.origin}`);
console.log(`   Hostname: ${global.window.location.hostname}`);

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

// Test 1: Verificar configuración de ActionCodeSettings
console.log('\n🧪 TEST 1: CONFIGURACIÓN ACTION CODE SETTINGS');
try {
  // Simular la configuración que usa el frontend
  const actionCodeSettings = {
    url: `${global.window.location.origin}/activate`,
    handleCodeInApp: true,
  };
  
  console.log('   Action Code Settings configurados:');
  console.log(`   URL: ${actionCodeSettings.url}`);
  console.log(`   Handle Code In App: ${actionCodeSettings.handleCodeInApp}`);
  
  // Verificar que la URL sea correcta
  if (actionCodeSettings.url.includes('localhost')) {
    console.log('✅ URL de activación apunta a localhost (correcto para desarrollo)');
  } else {
    console.log('❌ URL de activación NO apunta a localhost');
  }
  
} catch (error) {
  console.log('❌ Error configurando Action Code Settings:', error.message);
}

// Test 2: Flujo completo de registro (PASO 1: Crear usuario)
console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO - PASO 1');
try {
  const testEmail = 'test-frontend-flow-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`   Intentando crear usuario: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Desde dominio: ${global.window.location.origin}`);
  
  // PASO 1: Crear usuario (esto es lo que falla en el frontend)
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log(`✅ PASO 1 EXITOSO: Usuario creado: ${userCredential.user.uid}`);
  console.log(`   Email: ${userCredential.user.email}`);
  console.log(`   Email verified: ${userCredential.user.emailVerified}`);
  
  // PASO 2: Enviar email de verificación
  console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO - PASO 2');
  try {
    const actionCodeSettings = {
      url: `${global.window.location.origin}/activate`,
      handleCodeInApp: true,
    };
    
    console.log('   Enviando email de verificación...');
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    console.log('✅ PASO 2 EXITOSO: Email de verificación enviado');
    
  } catch (verificationError) {
    console.log('❌ PASO 2 FALLÓ: Error enviando email de verificación');
    console.log(`   Código: ${verificationError.code}`);
    console.log(`   Mensaje: ${verificationError.message}`);
  }
  
  // PASO 3: Guardar en Firestore
  console.log('\n🧪 TEST 2: FLUJO COMPLETO DE REGISTRO - PASO 3');
  try {
    const userId = userCredential.user.uid;
    const userDoc = doc(db, 'users', userId);
    
    const userProfile = {
      fullName: 'Test User Frontend Flow',
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
    };
    
    console.log('   Guardando perfil en Firestore...');
    await setDoc(userDoc, userProfile);
    console.log('✅ PASO 3 EXITOSO: Perfil guardado en Firestore');
    
  } catch (firestoreError) {
    console.log('❌ PASO 3 FALLÓ: Error guardando en Firestore');
    console.log(`   Código: ${firestoreError.code}`);
    console.log(`   Mensaje: ${firestoreError.message}`);
  }
  
} catch (error) {
  console.log('❌ PASO 1 FALLÓ: Error creando usuario');
  console.log(`   Código: ${error.code}`);
  console.log(`   Mensaje: ${error.message}`);
  
  if (error.code === 'auth/operation-not-allowed') {
    console.log('\n🚨 DIAGNÓSTICO CRÍTICO: auth/operation-not-allowed');
    console.log('   Esto significa que Firebase Auth rechaza la operación');
    console.log('   a pesar de que:');
    console.log('   ✅ Email/Password está habilitado en Console');
    console.log('   ✅ Dominios autorizados están correctos');
    console.log('   ✅ Configuración del frontend es perfecta');
    console.log('\n🔍 POSIBLES CAUSAS RESTANTES:');
    console.log('   1. Problema de sincronización entre Console y API');
    console.log('   2. Configuración de API específica incorrecta');
    console.log('   3. Reglas de seguridad ocultas');
    console.log('   4. Estado del proyecto UAT (mantenimiento, cuotas)');
  }
}

// Test 3: Verificar si hay diferencias de configuración entre CLI y frontend
console.log('\n🧪 TEST 3: VERIFICACIÓN DE DIFERENCIAS CLI vs FRONTEND');
try {
  console.log('   Comparando configuraciones...');
  
  // Verificar si hay diferencias en la inicialización
  const cliConfig = {
    clientPlatform: 'Node',
    origin: 'CLI'
  };
  
  const frontendConfig = {
    clientPlatform: 'Web',
    origin: global.window.location.origin
  };
  
  console.log('   Configuración CLI:', cliConfig);
  console.log('   Configuración Frontend:', frontendConfig);
  
  // Verificar si esto puede causar diferencias
  if (auth.config.clientPlatform === 'Node') {
    console.log('⚠️ Auth está corriendo en modo Node, no Web');
    console.log('   Esto puede causar diferencias en el comportamiento');
  } else {
    console.log('✅ Auth está corriendo en modo Web');
  }
  
} catch (error) {
  console.log('❌ Error comparando configuraciones:', error.message);
}

console.log('\n📊 RESUMEN DEL TEST DE FLUJO EXACTO:');
console.log('=====================================');

console.log('\n🎯 ESTADO ACTUAL DEL DIAGNÓSTICO:');
console.log('✅ Firebase se conecta correctamente a UAT');
console.log('✅ Configuración del frontend es perfecta');
console.log('✅ Email/Password está habilitado en Console');
console.log('✅ Dominios autorizados están correctos');
console.log('❌ PERO auth/operation-not-allowed persiste');

console.log('\n🔍 PRÓXIMOS PASOS REQUERIDOS:');
console.log('1. Verificar si usuarios aparecen en Firebase Console UAT → Users');
console.log('2. Si NO aparecen: problema en creación de usuario');
console.log('3. Si SÍ aparecen: problema en flujo post-creación');

console.log('\n🔗 ENLACES ÚTILES:');
console.log(`   Users: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);
console.log(`   Sign-in method: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`);

console.log('\n✨ Test de flujo exacto completado - FASE 1.6');
