// Script de diagnóstico específico para autenticación
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

// Configuración UAT exacta
const firebaseConfig = {
  apiKey: 'AIzaSyC1coa0W0LEsj_g-dzferIdmAEVvEep40I',
  authDomain: 'aiduxcare-mvp-uat.firebaseapp.com',
  projectId: 'aiduxcare-mvp-uat',
  storageBucket: 'aiduxcare-mvp-uat.appspot.com',
  messagingSenderId: '53031427369',
  appId: '1:53031427369:web:66b77032bc65a98b77eb38',
};

console.log('🔍 DIAGNÓSTICO DE AUTENTICACIÓN FIREBASE UAT');
console.log('==============================================');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('✅ Firebase inicializado correctamente');
console.log('📁 Proyecto:', firebaseConfig.projectId);
console.log('🌐 Dominio:', firebaseConfig.authDomain);

// Verificar métodos de autenticación disponibles
const email = 'mauricio@aiduxcare.com';
console.log('\n🔐 VERIFICANDO MÉTODOS DE AUTENTICACIÓN');
console.log('Email:', email);

try {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  console.log('✅ Usuario encontrado en Firebase');
  console.log('📋 Métodos de autenticación disponibles:', methods);
  
  if (methods.length === 0) {
    console.log('⚠️  Usuario existe pero NO tiene métodos de autenticación configurados');
    console.log('💡 Esto puede indicar que el usuario fue creado manualmente sin contraseña');
  } else if (methods.includes('password')) {
    console.log('✅ Usuario tiene autenticación por contraseña habilitada');
  } else {
    console.log('⚠️  Usuario NO tiene autenticación por contraseña');
    console.log('📋 Métodos disponibles:', methods);
  }
  
} catch (error) {
  console.error('❌ Error al verificar métodos de autenticación:', error);
  console.log('💡 Posibles causas:');
  console.log('   - Usuario no existe realmente');
  console.log('   - Problema de permisos en Firebase');
  console.log('   - Configuración incorrecta del proyecto');
}

console.log('\n🔍 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('1. Verificar en Firebase Console que el usuario tenga email/password habilitado');
console.log('2. Si no tiene contraseña, crear una nueva contraseña desde Firebase Console');
console.log('3. Verificar que el usuario esté en el proyecto correcto (aiduxcare-mvp-uat)');
console.log('4. Comprobar que las reglas de Firestore permitan autenticación');

console.log('\n✨ Diagnóstico completado');
