/**
 * Script para crear usuarios demo solo en Firebase Auth
 * Ejecutar: node scripts/create-auth-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDMDl3Vj_0WSMhOtz6IbGiTXaWOtABeGyk",
  authDomain: "aiduxcare-mvp-uat.firebaseapp.com",
  projectId: "aiduxcare-mvp-uat",
  storageBucket: "aiduxcare-mvp-uat.firebasestorage.app",
  messagingSenderId: "438815206522",
  appId: "1:438815206522:web:4a3618eb72f42c73751fc3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Usuarios demo a crear
const demoUsers = [
  {
    email: 'demo@aiduxcare.com',
    password: 'password123',
    name: 'Dr. Demo Profesional'
  },
  {
    email: 'paciente@aiduxcare.com',
    password: 'password123',
    name: 'Paciente Demo'
  },
  {
    email: 'admin@aiduxcare.com',
    password: 'password123',
    name: 'Admin Demo'
  },
  {
    email: 'maurosg.2023@gmail.com',
    password: 'Mauro7812#',
    name: 'Mauricio Sobarzo'
  }
];

async function createUser(userData) {
  try {
    console.log(`🔄 Creando usuario en Auth: ${userData.email}`);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const user = userCredential.user;
    
    console.log(`✅ Usuario creado exitosamente en Auth: ${userData.email} (UID: ${user.uid})`);
    return user;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Usuario ya existe en Auth: ${userData.email}`);
      return null;
    } else {
      console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      return null;
    }
  }
}

async function createAllAuthUsers() {
  console.log('🚀 Iniciando creación de usuarios demo en Firebase Auth...\n');
  
  const results = [];
  
  for (const userData of demoUsers) {
    const result = await createUser(userData);
    results.push({ user: userData.email, success: !!result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre usuarios
  }
  
  console.log('\n📊 Resumen de creación en Auth:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.user}`);
  });
  
  console.log('\n🎉 Usuarios creados en Auth. Ahora puedes hacer login con:');
  console.log('📧 demo@aiduxcare.com / password123');
  console.log('📧 paciente@aiduxcare.com / password123');
  console.log('📧 admin@aiduxcare.com / password123');
  console.log('📧 maurosg.2023@gmail.com / Mauro7812#');
  console.log('\n⚠️  Nota: Los perfiles en Firestore se crearán automáticamente al hacer login.');
}

// Ejecutar script
createAllAuthUsers().catch(console.error); 