#!/usr/bin/env tsx

/**
 * Script de diagnóstico para Firebase Auth
 * Verifica configuración, usuarios existentes y estado de autenticación
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

// Cargar variables de entorno
const envLocalPath = resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

// Configuración Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function diagnoseFirebaseAuth() {
  console.log('🔍 DIAGNÓSTICO FIREBASE AUTH');
  console.log('================================');
  
  // 1. Verificar configuración
  console.log('\n1️⃣ Verificando configuración Firebase...');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Variables faltantes:', missingVars);
    return;
  }
  
  console.log('✅ Configuración Firebase válida');
  console.log(`   Project ID: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  console.log(`   Auth Domain: ${process.env.VITE_FIREBASE_AUTH_DOMAIN}`);
  
  // 2. Verificar conexión a Firebase
  console.log('\n2️⃣ Verificando conexión a Firebase...');
  try {
    // Intentar obtener usuarios (requiere Admin SDK, pero podemos probar con auth)
    console.log('✅ Conexión a Firebase establecida');
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return;
  }
  
  // 3. Verificar usuarios en Firestore...
  let testUsers: { email: string, uid: string }[] = [];
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    if (usersSnapshot.empty) {
      console.log('⚠️ No hay usuarios registrados en Firestore');
    } else {
      console.log(`✅ ${usersSnapshot.size} usuarios encontrados en Firestore:`);
      usersSnapshot.forEach(docSnap => {
        const userData = docSnap.data();
        const email = userData.email;
        const uid = docSnap.id;
        console.log(`   - ${email} (${userData.role}) - Email verificado: ${userData.emailVerified}`);
        // Detectar usuarios de test
        if (email && email.startsWith('testuser_')) {
          testUsers.push({ email, uid });
        }
      });
    }
  } catch (error) {
    console.error('❌ Error al acceder a Firestore:', error);
  }

  // 4. Probar autenticación con todos los usuarios de test
  console.log('\n4️⃣ Probando autenticación con usuarios de test...');
  const testPassword = 'TestUser2025!';
  for (const { email, uid } of testUsers) {
    try {
      console.log(`   Intentando login con: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, testPassword);
      const user = userCredential.user;
      console.log('   ✅ Login exitoso!');
      console.log(`      UID: ${user.uid}`);
      console.log(`      Email verificado: ${user.emailVerified}`);
      // Validar perfil onboarding
      const userDoc = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDoc);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const requiredFields = ['role', 'name', 'email', 'especializacion'];
        const missing = requiredFields.filter(f => !userData[f]);
        if (missing.length === 0) {
          console.log('      ✅ Perfil onboarding completo:', requiredFields.map(f => `${f}: ${userData[f]}`).join(', '));
        } else {
          console.log('      ⚠️ Faltan campos de onboarding:', missing);
        }
      } else {
        console.log('      ⚠️ Perfil no encontrado en Firestore');
      }
      // Probar recuperación de contraseña
      try {
        await sendPasswordResetEmail(auth, email);
        console.log('      ✅ Email de recuperación enviado correctamente');
      } catch (err) {
        console.log('      ❌ Error al enviar email de recuperación:', err.code || err.message);
      }
    } catch (error: any) {
      console.error('   ❌ Error de autenticación:', error.code, error.message);
    }
  }
  
  // 5. Crear usuario de prueba si no existe
  console.log('\n5️⃣ Opciones de resolución...');
  console.log('   Para crear un usuario de prueba, ejecuta:');
  console.log('   npm run create-test-user');
  
  console.log('\n   Para verificar en Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/authentication/users`);
  
  console.log('\n   Para verificar reglas de Firestore:');
  console.log(`   https://console.firebase.google.com/project/${process.env.VITE_FIREBASE_PROJECT_ID}/firestore/rules`);
}

// Ejecutar diagnóstico
diagnoseFirebaseAuth().catch(console.error); 