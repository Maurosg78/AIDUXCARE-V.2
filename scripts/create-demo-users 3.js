/**
 * Script para crear usuarios demo en Firebase
 * Ejecutar: node scripts/create-demo-users.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Usuarios demo a crear
const demoUsers = [
  {
    email: 'demo@aiduxcare.com',
    password: 'password123',
    name: 'Dr. Demo Profesional',
    role: 'PHYSICIAN',
    specialization: 'Fisioterapia'
  },
  {
    email: 'paciente@aiduxcare.com',
    password: 'password123',
    name: 'Paciente Demo',
    role: 'PHYSICIAN',
    specialization: 'Medicina General'
  },
  {
    email: 'admin@aiduxcare.com',
    password: 'password123',
    name: 'Admin Demo',
    role: 'ADMIN',
    specialization: 'Administración'
  },
  {
    email: 'msobarzo78@gmail.com',
    password: 'aidux2025',
    name: 'Mauricio Sobarzo',
    role: 'OWNER',
    specialization: 'CEO & Founder'
  }
];

async function createUser(userData) {
  try {
    console.log(`🔄 Creando usuario: ${userData.email}`);
    
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const user = userCredential.user;
    
    // Crear perfil en Firestore
    const userProfile = {
      id: user.uid,
      email: user.email,
      name: userData.name,
      role: userData.role,
      specialization: userData.specialization,
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false
    };
    
    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    console.log(`✅ Usuario creado exitosamente: ${userData.email} (${userData.role})`);
    return userProfile;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Usuario ya existe: ${userData.email}`);
      return null;
    } else {
      console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      return null;
    }
  }
}

async function createAllDemoUsers() {
  console.log('🚀 Iniciando creación de usuarios demo...\n');
  
  const results = [];
  
  for (const userData of demoUsers) {
    const result = await createUser(userData);
    results.push({ user: userData.email, success: !!result });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa entre usuarios
  }
  
  console.log('\n📊 Resumen de creación:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.user}`);
  });
  
  console.log('\n🎉 Proceso completado. Los usuarios están listos para usar.');
}

// Ejecutar script
createAllDemoUsers().catch(console.error); 