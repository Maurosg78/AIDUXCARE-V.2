#!/usr/bin/env node

/**
 * Test que simula el contexto del navegador
 * Para identificar diferencias entre CLI y frontend
 * @author AiDuxCare Development Team
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🌐 TEST CONTEXTO NAVEGADOR - AiDuxCare V.2\n');

// Simular variables del navegador
global.window = {
  location: {
    origin: 'http://localhost:5174',
    hostname: 'localhost',
    protocol: 'http:'
  }
};

global.document = {
  createElement: () => ({}),
  getElementById: () => null
};

// Configuración de Firebase UAT
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('🔧 CONFIGURACIÓN:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   Window Origin: ${global.window.location.origin}`);
console.log(`   Hostname: ${global.window.location.hostname}`);

// Inicializar Firebase
console.log('\n🚀 INICIALIZANDO FIREBASE...');
let app, auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.log('❌ Error inicializando Firebase:', error.message);
  process.exit(1);
}

// Test 1: Verificar configuración de auth
console.log('\n🧪 TEST 1: CONFIGURACIÓN AUTH');
try {
  console.log(`   Auth config:`, {
    app: app.name,
    authDomain: auth.config.authDomain,
    projectId: auth.config.projectId
  });
  console.log('✅ Configuración de auth correcta');
} catch (error) {
  console.log('❌ Error en configuración de auth:', error.message);
}

// Test 2: Intentar crear usuario (simulando el frontend)
console.log('\n🧪 TEST 2: CREACIÓN DE USUARIO (SIMULACIÓN FRONTEND)');
try {
  const testEmail = 'test-browser-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`   Intentando crear usuario: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  console.log(`✅ Usuario creado exitosamente: ${userCredential.user.uid}`);
  console.log(`   Email: ${userCredential.user.email}`);
  console.log(`   Email verified: ${userCredential.user.emailVerified}`);
  
} catch (error) {
  console.log('❌ ERROR EN CREACIÓN DE USUARIO:');
  console.log(`   Código: ${error.code}`);
  console.log(`   Mensaje: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
  
  if (error.code === 'auth/operation-not-allowed') {
    console.log('\n🚨 DIAGNÓSTICO: auth/operation-not-allowed');
    console.log('   Esto significa que el método Email/Password NO está habilitado');
    console.log('   en el proyecto Firebase UAT, a pesar de que el CLI dice que sí.');
    console.log('\n🔍 POSIBLES CAUSAS:');
    console.log('   1. Firebase Console no sincronizado con la API');
    console.log('   2. Reglas de seguridad bloqueando la operación');
    console.log('   3. Configuración de dominios autorizados incorrecta');
    console.log('   4. Proyecto UAT en estado de mantenimiento');
  }
}

// Test 3: Verificar si hay diferencias de configuración
console.log('\n🧪 TEST 3: VERIFICACIÓN DE CONFIGURACIÓN DETALLADA');
try {
  // Verificar si hay configuraciones ocultas
  console.log('   Verificando configuraciones adicionales...');
  
  // Intentar acceder a configuraciones internas
  if (auth.config) {
    console.log('   Auth config disponible:', Object.keys(auth.config));
  } else {
    console.log('   Auth config no disponible');
  }
  
  if (app.options) {
    console.log('   App options disponibles:', Object.keys(app.options));
  } else {
    console.log('   App options no disponibles');
  }
  
} catch (error) {
  console.log('❌ Error verificando configuraciones:', error.message);
}

console.log('\n📊 RESUMEN DEL TEST DE CONTEXTO:');
console.log('=====================================');

console.log('\n🎯 CONCLUSIÓN:');
console.log('Si el CLI funciona pero el frontend falla con auth/operation-not-allowed,');
console.log('el problema está en la configuración del proyecto Firebase UAT, no en el código.');

console.log('\n🔗 ACCIONES REQUERIDAS:');
console.log('1. Ir a Firebase Console UAT');
console.log('2. Authentication → Sign-in method → Email/Password');
console.log('3. Verificar que esté realmente habilitado');
console.log('4. Verificar dominios autorizados');
console.log('5. Verificar reglas de seguridad');

console.log('\n✨ Test de contexto completado');
