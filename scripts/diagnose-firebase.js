// Script de diagnóstico completo para Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

console.log('=== DIAGNÓSTICO COMPLETO FIREBASE ===');

// Configuración Firebase UAT
const firebaseConfig = {
  projectId: 'aiduxcare-mvp-uat',
  apiKey: 'AIzaSyC1coa0W0LEsj_g-dzferIdmAEVvEep40I',
  authDomain: 'aiduxcare-mvp-uat.firebaseapp.com',
  storageBucket: 'aiduxcare-mvp-uat.appspot.com',
  messagingSenderId: '53031427369',
  appId: '1:53031427369:web:66b77032bc65a98b77eb38'
};

console.log('1. Configuración Firebase:', firebaseConfig);

try {
  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  console.log('2. ✅ Firebase inicializado correctamente');
  console.log('   Proyecto:', app.options.projectId);
  console.log('   Auth Domain:', app.options.authDomain);
  console.log('   API Key:', app.options.apiKey);
  
  // Verificar si el usuario existe
  const testEmail = 'mauricio@aiduxcare.com';
  console.log('\n3. Verificando usuario:', testEmail);
  
  const methods = await fetchSignInMethodsForEmail(auth, testEmail);
  console.log('   Métodos de autenticación disponibles:', methods);
  console.log('   ¿Usuario existe?', methods.length > 0 ? 'SÍ' : 'NO');
  
  if (methods.length > 0) {
    console.log('   ✅ Usuario encontrado, intentando login...');
    
    // Intentar login
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        testEmail, 
        'aidux2025'
      );
      
      console.log('   ✅ Login exitoso!');
      console.log('   UID:', userCredential.user.uid);
      console.log('   Email verificado:', userCredential.user.emailVerified);
      
    } catch (loginError) {
      console.log('   ❌ Error en login:', loginError.code);
      console.log('   Mensaje:', loginError.message);
      
      if (loginError.code === 'auth/invalid-credential') {
        console.log('\n   🔍 DIAGNÓSTICO: Credenciales inválidas');
        console.log('   Posibles causas:');
        console.log('   1. Contraseña incorrecta');
        console.log('   2. Usuario no existe realmente');
        console.log('   3. Problema con la configuración de Firebase');
        console.log('   4. Usuario creado en otro proyecto');
      }
    }
  } else {
    console.log('   ❌ Usuario NO encontrado');
    console.log('   🔍 DIAGNÓSTICO: El usuario no existe en este proyecto');
    console.log('   Posibles causas:');
    console.log('   1. Usuario creado en otro proyecto Firebase');
    console.log('   2. Usuario eliminado');
    console.log('   3. Proyecto incorrecto');
  }
  
  console.log('\n4. ✅ Diagnóstico completado');
  
} catch (error) {
  console.error('❌ Error crítico en diagnóstico:', error);
}

console.log('=============================');
