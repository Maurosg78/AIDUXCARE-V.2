/**
 * @fileoverview Script para diagnosticar el estado del usuario en Firebase
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { emailActivationService } from '../services/emailActivationService';

const TEST_EMAIL = 'mauricio@aiduxcare.com';
const TEST_PASSWORD = 'aidux2025';

async function diagnoseUser() {
  console.log('🔍 Iniciando diagnóstico del usuario...\n');

  try {
    // 1. Verificar si el email existe en Firebase Auth
    console.log('1️⃣ Verificando si el email existe en Firebase Auth...');
    const signInMethods = await fetchSignInMethodsForEmail(auth, TEST_EMAIL);
    
    if (signInMethods.length === 0) {
      console.log('❌ El email NO existe en Firebase Auth');
      console.log('💡 Solución: Crear usuario en Firebase Auth');
      return;
    }
    
    console.log('✅ El email existe en Firebase Auth');
    console.log('📋 Métodos de autenticación:', signInMethods);

    // 2. Intentar login con Firebase Auth
    console.log('\n2️⃣ Intentando login con Firebase Auth...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      console.log('✅ Login exitoso con Firebase Auth');
      console.log('👤 Usuario:', userCredential.user.email);
      console.log('📧 Email verificado:', userCredential.user.emailVerified);
    } catch (authError) {
      console.log('❌ Error en login con Firebase Auth:', authError);
      return;
    }

    // 3. Verificar si existe en Firestore
    console.log('\n3️⃣ Verificando si existe en Firestore...');
    const professional = await emailActivationService.getProfessional(TEST_EMAIL);
    
    if (!professional) {
      console.log('❌ El usuario NO existe en Firestore');
      console.log('💡 Solución: Crear registro en Firestore');
      
      // Crear usuario en Firestore
      console.log('\n🛠️ Creando usuario en Firestore...');
      const result = await emailActivationService.registerProfessional({
        email: TEST_EMAIL,
        displayName: 'Mauricio Sobarzo',
        professionalTitle: 'Fisioterapeuta',
        specialty: 'Fisioterapia',
        country: 'España',
        city: 'Madrid',
        province: 'Madrid',
        phone: '+34600000000',
        licenseNumber: 'FIS-12345',
        registrationDate: new Date()
      });
      
      if (result.success) {
        console.log('✅ Usuario creado exitosamente en Firestore');
        console.log('🆔 Professional ID:', result.professionalId);
        console.log('🔑 Activation Token:', result.activationToken);
      } else {
        console.log('❌ Error creando usuario en Firestore:', result.message);
      }
    } else {
      console.log('✅ El usuario existe en Firestore');
      console.log('📋 Datos del profesional:', {
        email: professional.email,
        displayName: professional.displayName,
        isActive: professional.isActive,
        emailVerified: professional.emailVerified,
        lastLogin: professional.lastLogin
      });
    }

    // 4. Verificar estado de activación
    console.log('\n4️⃣ Verificando estado de activación...');
    const isActive = await emailActivationService.isProfessionalActive(TEST_EMAIL);
    console.log('🟢 Cuenta activa:', isActive);

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseUser().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
