// Script de prueba para verificar conexión Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

// Configuración Firebase UAT
const firebaseConfig = {
  projectId: 'aiduxcare-mvp-uat',
  apiKey: 'AIzaSyC1coa0W0LEsj_g-dzferIdmAEVvEep40I',
  authDomain: 'aiduxcare-mvp-uat.firebaseapp.com',
  storageBucket: 'aiduxcare-mvp-uat.appspot.com',
  messagingSenderId: '53031427369',
  appId: '1:53031427369:web:66b77032bc65a98b77eb38'
};

console.log('=== PRUEBA DE CONEXIÓN FIREBASE ===');
console.log('Configuración:', firebaseConfig);

try {
  // Inicializar Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  console.log('✅ Firebase inicializado correctamente');
  console.log('Proyecto:', app.options.projectId);
  console.log('Auth Domain:', app.options.authDomain);
  
  // Probar verificación de email
  const testEmail = 'test@aiduxcare.com';
  console.log('Probando verificación de email:', testEmail);
  
  const methods = await fetchSignInMethodsForEmail(auth, testEmail);
  console.log('Métodos encontrados:', methods);
  console.log('¿Email existe?', methods.length > 0);
  
  console.log('✅ Conexión a Firebase UAT exitosa');
  
} catch (error) {
  console.error('❌ Error en conexión Firebase:', error);
}

console.log('=============================');
