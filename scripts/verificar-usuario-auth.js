/**
 * Script para verificar si un usuario existe en Firebase Authentication
 * 
 * Uso: node scripts/verificar-usuario-auth.js mauricio@aiduxcare.com
 */

import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = process.argv[2] || 'mauricio@aiduxcare.com';

async function verificarUsuario() {
  console.log(`\n🔍 Verificando usuario: ${email}\n`);

  try {
    // 1. Verificar en Firebase Authentication
    console.log('1️⃣ Verificando en Firebase Authentication...');
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    
    if (signInMethods.length > 0) {
      console.log(`   ✅ Usuario EXISTE en Firebase Authentication`);
      console.log(`   📋 Métodos de autenticación: ${signInMethods.join(', ')}`);
    } else {
      console.log(`   ❌ Usuario NO existe en Firebase Authentication`);
      console.log(`   ⚠️  Necesitas crear el usuario en Firebase Authentication primero`);
    }

    // 2. Verificar en Firestore
    console.log('\n2️⃣ Verificando en Firestore...');
    const emailNormalized = email.toLowerCase().trim();
    const professionalRef = doc(db, 'professionals', emailNormalized);
    const professionalSnap = await getDoc(professionalRef);
    
    if (professionalSnap.exists()) {
      const data = professionalSnap.data();
      console.log(`   ✅ Profesional EXISTE en Firestore`);
      console.log(`   📋 Datos:`, {
        email: data.email,
        isActive: data.isActive,
        emailVerified: data.emailVerified,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    } else {
      console.log(`   ❌ Profesional NO existe en Firestore`);
    }

    // 3. Resumen
    console.log('\n📊 RESUMEN:');
    const existeEnAuth = signInMethods.length > 0;
    const existeEnFirestore = professionalSnap.exists();
    
    if (existeEnAuth && existeEnFirestore) {
      console.log('   ✅ Usuario completo: existe en Auth y Firestore');
      console.log('   ✅ Debería poder hacer login');
    } else if (!existeEnAuth && existeEnFirestore) {
      console.log('   ⚠️  PROBLEMA: Usuario solo en Firestore, NO en Authentication');
      console.log('   🔧 SOLUCIÓN: Crear usuario en Firebase Authentication');
      console.log('   📝 Puedes hacerlo desde Firebase Console → Authentication → Add user');
    } else if (existeEnAuth && !existeEnFirestore) {
      console.log('   ⚠️  Usuario en Auth pero no en Firestore');
      console.log('   🔧 Necesita completar onboarding');
    } else {
      console.log('   ❌ Usuario no existe en ningún lado');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/invalid-email') {
      console.log('   ⚠️  Email inválido');
    }
  }
}

verificarUsuario().then(() => {
  console.log('\n✅ Verificación completada\n');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

