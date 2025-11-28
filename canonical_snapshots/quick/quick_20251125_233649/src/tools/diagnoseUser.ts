/**
 * @fileoverview Script para diagnosticar el estado del usuario en Firebase
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { signInWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

import { auth } from '../lib/firebase';
import { emailActivationService } from '../services/emailActivationService';

import logger from '@/shared/utils/logger';

const TEST_EMAIL = 'mauricio@aiduxcare.com';
const TEST_PASSWORD = 'aidux2025';

async function diagnoseUser() {
  logger.info('Iniciando diagnóstico del usuario...\n');

  try {
    // 1. Verificar si el email existe en Firebase Auth
    logger.info('1) Verificando si el email existe en Firebase Auth...');
    const signInMethods = await fetchSignInMethodsForEmail(auth, TEST_EMAIL);
    
    if (signInMethods.length === 0) {
      logger.info('El email NO existe en Firebase Auth');
      logger.info('Solución: Crear usuario en Firebase Auth');
      return;
    }
    
    logger.info('El email existe en Firebase Auth');
    logger.info('Métodos de autenticación:', signInMethods);

    // 2. Intentar login con Firebase Auth
    logger.info('\n2) Intentando login con Firebase Auth...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
      logger.info('Login exitoso con Firebase Auth');
      logger.info('Usuario:', userCredential.user.email);
      logger.info('Email verificado:', userCredential.user.emailVerified);
    } catch (authError) {
      logger.info('Error en login con Firebase Auth:', authError);
      return;
    }

    // 3. Verificar si existe en Firestore
    logger.info('\n3) Verificando si existe en Firestore...');
    const professional = await emailActivationService.getProfessional(TEST_EMAIL);
    
    if (!professional) {
      logger.info('El usuario NO existe en Firestore');
      logger.info('Solución: Crear registro en Firestore');
      
      // Crear usuario en Firestore
      logger.info('\nCreando usuario en Firestore...');
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
      }, 'AiduxCare#2025');
      
      if (result.success) {
        logger.info('Usuario creado exitosamente en Firestore');
        logger.info('Professional ID:', result.professionalId);
        logger.info('Activation Token:', result.activationToken);
      } else {
        logger.info('Error creando usuario en Firestore:', result.message);
      }
    } else {
      logger.info('El usuario existe en Firestore');
      logger.info('Datos del profesional:', {
        email: professional.email,
        displayName: professional.displayName,
        isActive: professional.isActive,
        emailVerified: professional.emailVerified,
        lastLogin: professional.lastLogin
      });
    }

    // 4. Verificar estado de activación
    logger.info('\n4) Verificando estado de activación...');
    const isActive = await emailActivationService.isProfessionalActive(TEST_EMAIL);
    logger.info('Cuenta activa:', isActive);

  } catch (error) {
    logger.error('Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnoseUser().then(() => {
  logger.info('\nDiagnóstico completado');
  // No usar process.exit en entorno de testing
}).catch((error) => {
  logger.error('Error fatal:', error);
  // No usar process.exit en entorno de testing
});
