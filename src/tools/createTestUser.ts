/**
 * @fileoverview Script para crear usuario de prueba en Firebase
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * Crear usuario de prueba
 */
async function createTestUser(): Promise<void> {
  try {
    console.log('Creando usuario de prueba...');
    
    const email = 'mauricio@aiduxcare.com';
    const password = 'aidux2025';
    
    // Crear usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Usuario creado exitosamente:');
    console.log(`   Email: ${user.email}`);
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email verificado: ${user.emailVerified}`);
    
    // Enviar email de verificación
    await sendEmailVerification(user);
    console.log('Email de verificación enviado');
    
    console.log('\nUsuario de prueba creado exitosamente!');
    console.log('   Puedes hacer login con:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
  } catch (error: unknown) {
    console.error('❌ Error creando usuario de prueba:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('email-already-in-use')) {
        console.log('ℹ️  El usuario ya existe. Puedes hacer login directamente.');
      } else {
        console.log('Asegúrate de que Firebase esté configurado correctamente.');
      }
    }
  }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  // Solo ejecutar en entorno Node.js
  createTestUser();
}

export { createTestUser };
