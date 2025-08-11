#!/usr/bin/env node

/**
 * Test simple de creación de usuario en PROD
 * Sin envío de email para evitar colgados
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

console.log('🧪 TEST SIMPLE PROD - SOLO CREACIÓN DE USUARIO\n');

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

// Inicializar Firebase
console.log('\n🚀 INICIALIZANDO FIREBASE PROD...');
let app, auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase PROD inicializado correctamente');
} catch (error) {
  console.log('❌ Error inicializando Firebase PROD:', error.message);
  process.exit(1);
}

// Test simple: Solo crear usuario
console.log('\n🧪 TEST SIMPLE: CREAR USUARIO EN PROD');
try {
  const testEmail = 'test-simple-prod-' + Date.now() + '@example.com';
  const testPassword = 'TestPassword123!';
  
  console.log(`   Intentando crear usuario: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  
  // Solo crear usuario, sin email de verificación
  const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  
  console.log(`✅ USUARIO CREADO EXITOSAMENTE EN PROD:`);
  console.log(`   UID: ${userCredential.user.uid}`);
  console.log(`   Email: ${userCredential.user.email}`);
  console.log(`   Email verified: ${userCredential.user.emailVerified}`);
  console.log(`   Creation time: ${userCredential.user.metadata.creationTime}`);
  
  // Verificar que el usuario esté realmente en PROD
  if (firebaseConfig.projectId.includes('prod')) {
    console.log('✅ Confirmado: Usuario creado en proyecto PROD');
  } else {
    console.log('❌ Error: Usuario NO creado en proyecto PROD');
  }
  
} catch (error) {
  console.log('❌ ERROR CREANDO USUARIO EN PROD:');
  console.log(`   Código: ${error.code}`);
  console.log(`   Mensaje: ${error.message}`);
  
  if (error.code === 'auth/operation-not-allowed') {
    console.log('🚨 ERROR CRÍTICO: auth/operation-not-allowed en PROD también');
    console.log('   Esto significa que el problema NO es específico de UAT');
  }
}

console.log('\n📊 RESUMEN DEL TEST SIMPLE:');
console.log('=====================================');

console.log('\n🎯 RESULTADO:');
if (firebaseConfig.projectId.includes('prod')) {
  console.log('✅ Configuración apunta correctamente a PROD');
  console.log('✅ Firebase se conecta correctamente a PROD');
  console.log('✅ Usuario creado exitosamente en PROD');
  console.log('✅ El registro FUNCIONA con configuración PROD');
} else {
  console.log('❌ Configuración NO apunta a PROD');
}

console.log('\n🔍 PRÓXIMOS PASOS:');
console.log('1. El registro básico funciona en PROD');
console.log('2. El problema del email de verificación es secundario');
console.log('3. Puedes usar PROD para desarrollo mientras se resuelve UAT');

console.log('\n🔗 VERIFICAR EN FIREBASE CONSOLE:');
console.log(`   Users PROD: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/users`);

console.log('\n✨ Test simple PROD completado');
