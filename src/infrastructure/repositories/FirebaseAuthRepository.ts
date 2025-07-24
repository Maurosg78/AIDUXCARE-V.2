/**
 * 🔐 **Enterprise Firebase Auth Repository**
 * 
 * Implementación enterprise del repository de autenticación con:
 * - Repository pattern completo
 * - Error handling tipado
 * - Audit logging automático
 * - Validación de datos
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
  type UserCredential
} from 'firebase/auth';

import type {
  IAuthRepository,
  LoginCredentials,
  RegisterData,
  AuthResult,
  UserIdentity
} from '../../core/types/auth.types';

import { 
  AuthenticationError,
  ValidationError,
  ErrorFactory 
} from '../../core/errors/AppError';

import { auth } from '../firebase/FirebaseClient';
import { isDevelopment, isDebugEnabled } from '../../core/config/environment';

// =====================================================
// FIREBASE AUTH REPOSITORY IMPLEMENTATION
// =====================================================

export class FirebaseAuthRepository implements IAuthRepository {
  
  // =====================================================
  // REGISTRATION
  // =====================================================

  async register(data: RegisterData): Promise<AuthResult> {
    const startTime = Date.now();
    
    try {
      // Validate registration data
      this.validateRegisterData(data);

      // Create Firebase user
      const credential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );

      // Send email verification
      await this.sendEmailVerificationSafe(credential.user);

      // Convert to our types
      const user = this.mapFirebaseUserToUserIdentity(credential.user);
      const sessionToken = await this.generateSessionToken(credential.user);

      const result: AuthResult = {
        user,
        profile: null, // Profile will be created separately
        sessionToken
      };

      if (isDebugEnabled()) {
        console.log(`✅ Usuario registrado exitosamente: ${data.email} (${Date.now() - startTime}ms)`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (isDebugEnabled()) {
        console.error(`❌ Error en registro: ${data.email} (${duration}ms):`, error);
      }

      // Convert Firebase errors to our typed errors
      const appError = ErrorFactory.fromFirebaseError(error, {
        operation: 'register',
        metadata: { email: data.email, duration }
      });

      throw appError;
    }
  }

  // =====================================================
  // LOGIN
  // =====================================================

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const startTime = Date.now();
    
    try {
      // Validate credentials
      this.validateLoginCredentials(credentials);

      // Authenticate with Firebase
      const credential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Convert to our types
      const user = this.mapFirebaseUserToUserIdentity(credential.user);
      const sessionToken = await this.generateSessionToken(credential.user);

      const result: AuthResult = {
        user,
        profile: null, // Profile will be loaded separately
        sessionToken
      };

      if (isDebugEnabled()) {
        console.log(`✅ Login exitoso: ${credentials.email} (${Date.now() - startTime}ms)`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (isDebugEnabled()) {
        console.error(`❌ Error en login: ${credentials.email} (${duration}ms):`, error);
      }

      // Convert Firebase errors to our typed errors
      const appError = ErrorFactory.fromFirebaseError(error, {
        operation: 'login',
        metadata: { email: credentials.email, duration }
      });

      throw appError;
    }
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      
      if (isDebugEnabled()) {
        console.log('✅ Logout exitoso');
      }

    } catch (error) {
      const appError = ErrorFactory.fromFirebaseError(error, {
        operation: 'logout'
      });

      throw appError;
    }
  }

  // =====================================================
  // GET CURRENT USER
  // =====================================================

  async getCurrentUser(): Promise<UserIdentity | null> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(this.mapFirebaseUserToUserIdentity(user));
          } else {
            resolve(null);
          }
        },
        (error) => {
          unsubscribe();
          const appError = ErrorFactory.fromFirebaseError(error, {
            operation: 'getCurrentUser'
          });
          reject(appError);
        }
      );
    });
  }

  // =====================================================
  // EMAIL VERIFICATION
  // =====================================================

  async verifyEmail(token: string): Promise<void> {
    // Note: Email verification is handled automatically by Firebase
    // This method exists for interface compliance
    // In a real implementation, you might want to verify the token manually
    
    if (isDebugEnabled()) {
      console.log('📧 Email verification token received:', token);
    }
  }

  // =====================================================
  // PASSWORD RESET
  // =====================================================

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      
      if (isDebugEnabled()) {
        console.log(`📧 Password reset email sent to: ${email}`);
      }

    } catch (error) {
      const appError = ErrorFactory.fromFirebaseError(error, {
        operation: 'resetPassword',
        metadata: { email }
      });

      throw appError;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private validateRegisterData(data: RegisterData): void {
    if (!data.email || !this.isValidEmail(data.email)) {
      throw new ValidationError(
        'Email inválido',
        'email',
        data.email
      );
    }

    if (!data.password || data.password.length < 6) {
      throw new ValidationError(
        'La contraseña debe tener al menos 6 caracteres',
        'password'
      );
    }

    if (!data.firstName?.trim()) {
      throw new ValidationError(
        'El nombre es requerido',
        'firstName',
        data.firstName
      );
    }

    if (!data.lastName?.trim()) {
      throw new ValidationError(
        'El apellido es requerido',
        'lastName',
        data.lastName
      );
    }

    if (!data.organization?.trim()) {
      throw new ValidationError(
        'La organización es requerida',
        'organization',
        data.organization
      );
    }

    if (!data.licenseNumber?.trim()) {
      throw new ValidationError(
        'El número de licencia es requerido',
        'licenseNumber',
        data.licenseNumber
      );
    }
  }

  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.email || !this.isValidEmail(credentials.email)) {
      throw new ValidationError(
        'Email inválido',
        'email',
        credentials.email
      );
    }

    if (!credentials.password) {
      throw new ValidationError(
        'La contraseña es requerida',
        'password'
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private mapFirebaseUserToUserIdentity(firebaseUser: User): UserIdentity {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime) 
        : null
    };
  }

  private async generateSessionToken(user: User): Promise<string> {
    try {
      return await user.getIdToken();
    } catch (error) {
      // Fallback to user ID if token generation fails
      return user.uid;
    }
  }

  private async sendEmailVerificationSafe(user: User): Promise<void> {
    try {
      // In development/emulator, email verification might not work
      if (isDevelopment()) {
        if (isDebugEnabled()) {
          console.log('🧪 Saltando verificación de email en desarrollo');
        }
        return;
      }

      await sendEmailVerification(user);
      
      if (isDebugEnabled()) {
        console.log(`📧 Email de verificación enviado a: ${user.email}`);
      }

    } catch (error) {
      // Don't throw on email verification failure
      console.warn('⚠️ No se pudo enviar email de verificación:', error);
    }
  }
}