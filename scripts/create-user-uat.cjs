#!/usr/bin/env node

/**
 * Script para crear usuario en Firestore UAT
 * Soluciona el problema de usuario no encontrado
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc } = require('firebase/firestore');

// Configuración UAT
const firebaseConfig = {
  apiKey: "AIzaSyDfZP98XKzx71vA4ctX9HIUWI1tp0W9EKQ",
  authDomain: "aiduxcare-v2-uat-dev.firebaseapp.com",
  projectId: "aiduxcare-v2-uat-dev",
  storageBucket: "aiduxcare-v2-uat-dev.appspot.com",
  messagingSenderId: "935285025887",
  appId: "1:935285025887:web:192bab3e9ef5aef2ee3fea"
};

async function createUserInUAT() {
  try {
    console.log('🚀 INICIANDO CREACIÓN DE USUARIO EN UAT...');
    
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado para UAT');
    
    // Datos del usuario
    const userData = {
      email: 'mauricio@aiduxcare.com',
      displayName: 'Mauricio Sobarzo',
      professionalTitle: 'CTO',
      specialty: 'Tecnología Médica',
      country: 'España',
      city: 'Madrid',
      province: 'Madrid',
      phone: '+34 600 000 000',
      licenseNumber: 'CTO-001',
      registrationDate: new Date().toISOString(),
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: 'OWNER'
    };
    
    console.log('📋 Datos del usuario preparados:', userData.email);
    
    // Crear documento en colección 'users'
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, userData);
    
    console.log('✅ Usuario creado exitosamente en Firestore UAT');
    console.log('🆔 Document ID:', docRef.id);
    console.log('📧 Email:', userData.email);
    console.log('🔑 Role:', userData.role);
    
    // Verificar creación
    console.log('\n🔍 VERIFICACIÓN:');
    console.log('1. Ir a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore');
    console.log('2. Buscar colección "users"');
    console.log('3. Verificar documento con email: mauricio@aiduxcare.com');
    
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar
createUserInUAT();
