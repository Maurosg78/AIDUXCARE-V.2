// @ts-nocheck
/**
 * FirebaseAuthService - Servicio de autenticación con Firebase
 * Maneja login, logout y verificación de email
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  User as FirebaseUser,
  ActionCodeSettings
} from 'firebase/auth';

import { auth } from '../lib/firebase';

import logger from '@/shared/utils/logger';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: FirebaseUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Servicio de autenticación Firebase
 */
export class FirebaseAuthService {
  
  /**
   * Iniciar sesión con email y contraseña
   */
  public static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      
      // Normalizar email
      const normalizedEmail = email.trim().toLowerCase();
      
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;
      
      // Verificar si el email está verificado
      if (!user.emailVerified) {
        await signOut(auth);
        return {
          success: false,
          message: 'Email no verificado. Revisa tu bandeja de entrada.'
        };
      }
      
      return {
        success: true,
        message: 'Sesión iniciada exitosamente',
        user
      };
      
    } catch (error: unknown) {
      console.error('Error en login:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage.includes('user-not-found') || errorMessage.includes('wrong-password')) {
        return {
          success: false,
          message: 'Email o contraseña incorrectos'
        };
      }
      
      if (errorMessage.includes('too-many-requests')) {
        return {
          success: false,
          message: 'Demasiados intentos. Inténtalo más tarde.'
        };
      }
      
      return {
        success: false,
        message: 'Error al iniciar sesión. Inténtalo de nuevo.'
      };
    }
  }
  
  /**
   * Verificar si un email ya está registrado
   */
  public static async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('=== VERIFICACIÓN DE EMAIL ===');
      console.log('Email a verificar:', email);
      console.log('Proyecto Firebase:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
      console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      
      const normalizedEmail = email.trim().toLowerCase();
      
      // Usar try-catch específico para esta operación
      try {
        const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
        console.log('Métodos de autenticación encontrados:', methods);
        console.log('¿Email existe?', methods.length > 0);
        console.log('=============================');
        return methods.length > 0;
      } catch (fetchError) {
        console.log('Error en fetchSignInMethodsForEmail:', fetchError);
        
        // Si hay error, intentar con createUserWithEmailAndPassword para verificar
        try {
          // Crear un usuario temporal para verificar si existe
          const tempPassword = 'TempPassword123!';
          const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, tempPassword);
          
          // Si llegamos aquí, el usuario se creó (no existía)
          // Lo eliminamos inmediatamente
          await userCredential.user.delete();
          
          console.log('Email NO existe (verificación por creación exitosa)');
          console.log('=============================');
          return false;
        } catch (createError) {
          console.log('Error en creación temporal:', createError);
          
          // Si el error es email-already-in-use, entonces existe
          if (createError instanceof Error && createError.message.includes('email-already-in-use')) {
            console.log('Email SÍ existe (verificación por error de creación)');
            console.log('=============================');
            return true;
          }
          
          // Otro tipo de error
          console.log('Error desconocido, asumiendo que email existe');
          console.log('=============================');
          return true;
        }
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      return false;
    }
  }

  /**
   * Registrar nuevo usuario con email y contraseña
   */
  public static async register(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('=== REGISTRO DE USUARIO ===');
      console.log('Email a registrar:', credentials.email);
      console.log('Proyecto Firebase:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
      console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      
      // VERIFICACIÓN CRÍTICA: Asegurar que estamos usando UAT DEV
      const currentProject = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      if (!currentProject || !currentProject.includes('uat')) {
        console.error('❌ ERROR CRÍTICO: No estamos usando UAT!');
        console.error('Proyecto actual:', currentProject);
        console.error('Se requiere: proyecto que contenga "uat"');
        return {
          success: false,
          message: 'Error de configuración: Debe usar UAT para desarrollo'
        };
      }
      
      console.log('✅ CONFIGURACIÓN CORRECTA: Usando UAT');
      
      const { email, password } = credentials;
      
      // Normalizar email
      const normalizedEmail = email.trim().toLowerCase();
      
      // Crear usuario en Firebase Auth (Firebase manejará la verificación)
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const user = userCredential.user;
      
      console.log('Usuario creado exitosamente:', user.uid);
      console.log('Email verificado:', user.emailVerified);
      
      // Enviar email de verificación
      await this.sendEmailVerification(user);
      
      // Cerrar sesión para forzar verificación de email
      await signOut(auth);
      
      console.log('Email de verificación enviado');
      console.log('=============================');
      
      return {
        success: true,
        message: 'Usuario registrado exitosamente. Revisa tu email para verificar tu cuenta.',
        user
      };
      
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage.includes('email-already-in-use')) {
        return {
          success: false,
          message: 'Este email ya está registrado. Intenta iniciar sesión o usa un email diferente.'
        };
      }
      
      if (errorMessage.includes('weak-password')) {
        return {
          success: false,
          message: 'La contraseña es demasiado débil. Usa al menos 6 caracteres.'
        };
      }
      
      if (errorMessage.includes('invalid-email')) {
        return {
          success: false,
          message: 'El formato del email no es válido.'
        };
      }
      
      return {
        success: false,
        message: 'Error al registrar usuario. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  public static async logout(): Promise<AuthResult> {
    try {
      await signOut(auth);
      
      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
      
    } catch (error: unknown) {
      console.error('Error en logout:', error);
      
      return {
        success: false,
        message: 'Error al cerrar sesión'
      };
    }
  }
  
  /**
   * Enviar email de verificación
   */
  public static async sendEmailVerification(user: FirebaseUser): Promise<AuthResult> {
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/email-verified`,
        handleCodeInApp: true,
      };
      
      await sendEmailVerification(user, actionCodeSettings);
      
      return {
        success: true,
        message: 'Email de verificación enviado'
      };
      
    } catch (error: unknown) {
      console.error('Error enviando verificación:', error);
      
      return {
        success: false,
        message: 'Error al enviar email de verificación'
      };
    }
  }
  
  /**
   * Verificar si el email está verificado
   */
  public static isEmailVerified(user: FirebaseUser): boolean {
    return user.emailVerified;
  }

  /**
   * Enviar email de reset de contraseña
   */
  public static async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/reset-complete`
      });
      
      return {
        success: true,
        message: 'Email de recuperación enviado'
      };
      
    } catch (error: unknown) {
      console.error('Error enviando reset de contraseña:', error);
      
      // No revelar si el email existe o no
      return {
        success: true,
        message: 'Si el email está registrado, recibirás un enlace de recuperación'
      };
    }
  }

  /**
   * Enviar link mágico para re-engagement de registro incompleto
   */
  public static async sendReEngagementEmail(email: string): Promise<AuthResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/resume-onboarding`,
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
      
      return {
        success: true,
        message: 'Link de re-engagement enviado'
      };
      
    } catch (error: unknown) {
      console.error('Error enviando link de re-engagement:', error);
      
      return {
        success: false,
        message: 'Error al enviar link de re-engagement'
      };
    }
  }
}

// Exportar instancia singleton
export const firebaseAuthService = FirebaseAuthService;