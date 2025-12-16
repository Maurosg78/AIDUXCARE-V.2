/**
 * Script para crear perfil de usuario en Firestore
 * Ejecutar: node scripts/create-user-profile.js
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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

// Credenciales del usuario
const userCredentials = {
  email: 'maurosg.2023@gmail.com',
  password: 'Mauro7812#'
};

async function createUserProfile() {
  try {
    console.log('🚀 Iniciando creación de perfil de usuario...');
    
    // 1. Autenticar usuario
    console.log('🔐 Autenticando usuario...');
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      userCredentials.email, 
      userCredentials.password
    );
    
    const user = userCredential.user;
    console.log('✅ Usuario autenticado:', user.uid);
    
    // 2. Crear perfil en Firestore
    console.log('📝 Creando perfil en Firestore...');
    const userProfile = {
      email: userCredentials.email,
      name: 'Mauricio Sobarzo',
      role: 'OWNER', // Mauricio es OWNER
      specialization: 'Desarrollo de Software Médico',
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      lastLoginAt: new Date()
    };
    
    const userDoc = doc(db, 'users', user.uid);
    await setDoc(userDoc, userProfile);
    
    console.log('✅ Perfil creado exitosamente en Firestore');
    console.log('📊 Datos del perfil:', userProfile);
    
    // 3. Verificar que se creó correctamente
    console.log('🔍 Verificando perfil creado...');
    const createdDoc = await getDoc(userDoc);
    if (createdDoc.exists()) {
      console.log('✅ Perfil verificado en Firestore');
      console.log('📋 Datos almacenados:', createdDoc.data());
    } else {
      console.log('❌ Error: El perfil no se creó correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error creando perfil:', error);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 El usuario no existe en Firebase Auth. Primero ejecuta: node scripts/create-auth-users.js');
    } else if (error.code === 'permission-denied') {
      console.log('💡 Error de permisos. Verifica las reglas de Firestore.');
    }
  }
}

// Ejecutar script
createUserProfile(); 