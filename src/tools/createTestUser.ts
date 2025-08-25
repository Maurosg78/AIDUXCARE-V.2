/**
 * @fileoverview Script para crear usuario de prueba en Firebase
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { auth } from '../lib/firebase';

import logger from '@/shared/utils/logger';

/**
 * Crear usuario de prueba
 */
async function createTestUser(): Promise<void> {
  try {
    logger.info('Creando usuario de prueba...');
    
    const email = 'mauricio@aiduxcare.com';
    const password = 'aidux2025';
    
    // Crear usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    logger.info('✅ Usuario creado exitosamente:');
    logger.info(`   Email: ${user.email}`);
    logger.info(`   UID: ${user.uid}`);
    logger.info(`   Email verificado: ${user.emailVerified}`);
    
    // Enviar email de verificación
    await sendEmailVerification(user);
    logger.info('Email de verificación enviado');
    
    logger.info('\nUsuario de prueba creado exitosamente!');
    logger.info('   Puedes hacer login con:');
    logger.info(`   Email: ${email}`);
    logger.info(`   Password: ${password}`);
    
  } catch (error: unknown) {
    logger.error('❌ Error creando usuario de prueba:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('email-already-in-use')) {
        logger.info('ℹ️  El usuario ya existe. Puedes hacer login directamente.');
      } else {
        logger.info('Asegúrate de que Firebase esté configurado correctamente.');
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
