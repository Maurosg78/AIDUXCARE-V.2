/**
 * 🔥 Firebase Auth Service - Migración desde Supabase
 * FASE 0.5: ESTABILIZACIÓN FINAL DE INFRAESTRUCTURA
 * 
 * Servicio de autenticación completo usando Firebase Auth
 * Reemplaza completamente Supabase Auth para migración total
 */

import { getAuth, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User as FirebaseUser, UserCredential, AuthError } from 'firebase/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

import { app, db } from '../firebase/firebaseClient';

import logger from '@/shared/utils/logger';

const maskEmailForLog = (email?: string | null): string => {
  if (!email) {
    return 'missing';
  }

  const parts = email.split('@');
  const localPart = parts[0] || '';
  const domainPart = parts[1] || '';
  const visibleLocalPart = localPart.slice(0, 2);
  return `${visibleLocalPart}***@${domainPart || 'hidden'}`;
};

// Eliminar inicialización directa:
// const app: FirebaseApp = initializeApp(firebaseConfig);
// const auth: Auth = getAuth(app);
// const db: Firestore = getFirestore(app);

// Tipos de usuario
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'PHYSICIAN' | 'ADMIN';
  specialization?: string;
  createdAt: Date;
  updatedAt: Date;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean; // NUEVO
}

export interface AuthSession {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// Roles y permisos
const ROLES = {
  OWNER: {
    level: 3,
    permissions: ['all'] as string[]
  },
  ADMIN: {
    level: 2,
    permissions: ['manage_users', 'view_analytics', 'manage_content'] as string[]
  },
  PHYSICIAN: {
    level: 1,
    permissions: ['manage_patients', 'create_visits', 'view_own_data'] as string[]
  }
} as const;

/**
 * Servicio de autenticación Firebase
 */
export class FirebaseAuthService {
  private auth: Auth;
  private db: Firestore;

  constructor() {
    this.auth = getAuth(app);
    this.db = db;
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      console.log('🔥 Firebase Auth: Iniciando sesión...', {
        email: maskEmailForLog(email),
      });
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );

      const firebaseUser = userCredential.user;
      
      // Obtener perfil del usuario desde Firestore
      const userProfile = await this.getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        throw new Error('Perfil de usuario no encontrado');
      }

      // Validar email verificado
      if (!userProfile.emailVerified) {
        throw new Error('Email no verificado');
      }

      // Actualizar último login
      await this.updateLastLogin(firebaseUser.uid);

      console.log('✅ Firebase Auth: Sesión iniciada exitosamente', { 
        userId: userProfile.id, 
        role: userProfile.role 
      });

      return userProfile;
    } catch (_error) {
      console.error('❌ Firebase Auth: Error al iniciar sesión', _error);
      throw this.handleAuthError(_error as AuthError);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async signUp(email: string, password: string, name: string, specialization?: string): Promise<UserProfile> {
    try {
      console.log('🔥 Firebase Auth: Registrando nuevo usuario...', {
        email: maskEmailForLog(email),
        hasName: Boolean(name),
      });
      
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );

      const firebaseUser = userCredential.user;
      
      // Determinar rol basado en el nombre (Mauricio = OWNER)
      const role = this.determineUserRole(name);
      
      // Crear perfil de usuario en Firestore
      const isSuperUser = firebaseUser.email === 'mauricio@aiduxcare.com';
      const userProfile: UserProfile = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || '',
        role: isSuperUser ? 'OWNER' : role,
        specialization: specialization,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaEnabled: false,
        emailVerified: firebaseUser.emailVerified
      };

      await this.createUserProfile(userProfile);

      console.log('✅ Firebase Auth: Usuario registrado exitosamente', { 
        userId: userProfile.id, 
        role: userProfile.role 
      });

      return userProfile;
    } catch (_error) {
      console.error('❌ Firebase Auth: Error al registrar usuario', _error);
      throw this.handleAuthError(_error as AuthError);
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      console.log('🔥 Firebase Auth: Cerrando sesión...');
      
      // Obtener usuario actual antes de cerrar sesión
      const currentUser = this.auth.currentUser;
      let userProfile: UserProfile | null = null;
      
      if (currentUser) {
        userProfile = await this.getUserProfile(currentUser.uid);
      }
      
      await firebaseSignOut(this.auth);
      
      // Registrar evento de logout exitoso
      if (userProfile) {
        // Import estático para optimizar bundle
        const { FirestoreAuditLogger } = await import(/* webpackChunkName: "audit" */ '../audit/FirestoreAuditLogger');
        await FirestoreAuditLogger.logEvent({
          type: 'logout_success',
          userId: userProfile.id,
          userRole: userProfile.role,
          metadata: { 
            hasEmail: Boolean(userProfile.email),
            sessionDuration: userProfile.lastLoginAt ? 
              Date.now() - userProfile.lastLoginAt.getTime() : null
          },
        });
      }
      
      console.log('✅ Firebase Auth: Sesión cerrada exitosamente');
    } catch (_error) {
      console.error('❌ Firebase Auth: Error al cerrar sesión', _error);
      
      // Registrar evento de logout fallido
      try {
        const { FirestoreAuditLogger } = await import('../audit/FirestoreAuditLogger');
        await FirestoreAuditLogger.logEvent({
          type: 'logout_failed',
          userId: 'unknown',
          userRole: 'unknown',
          metadata: { error: (_error instanceof Error ? _error.message : String(_error)) },
        });
      } catch (auditError) {
        console.error('Error registrando logout fallido:', auditError);
      }
      
      throw this.handleAuthError(_error as AuthError);
    }
  }

  /**
   * Obtener sesión actual
   */
  async getCurrentSession(): Promise<AuthSession> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            try {
              const userProfile = await this.getUserProfile(firebaseUser.uid);
              resolve({
                user: userProfile,
                loading: false,
                error: null
              });
            } catch (_error) {
              resolve({
                user: null,
                loading: false,
                error: 'Error al cargar perfil de usuario'
              });
            }
          } else {
            resolve({
              user: null,
              loading: false,
              error: null
            });
          }
          unsubscribe();
        },
        (error) => {
          resolve({
            user: null,
            loading: false,
            error: error.message
          });
        }
      );
    });
  }

  /**
   * Escuchar cambios en el estado de autenticación
   */
  onAuthStateChange(callback: (session: AuthSession) => void): () => void {
    return onAuthStateChanged(
      this.auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const userProfile = await this.getUserProfile(firebaseUser.uid);
            callback({
              user: userProfile,
              loading: false,
              error: null
            });
          } catch (_error) {
            callback({
              user: null,
              loading: false,
              error: 'Error al cargar perfil de usuario'
            });
          }
        } else {
          callback({
            user: null,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        callback({
          user: null,
          loading: false,
          error: error.message
        });
      }
    );
  }

  /**
   * Reenviar correo de verificación a un usuario dado su email
   */
  async sendVerificationEmail(email: string): Promise<void> {
    // Buscar usuario autenticado actual
    const user = this.auth.currentUser;
    if (!user || user.email !== email) {
      throw new Error('Debes iniciar sesión para reenviar el correo de verificación.');
    }
    if (user.emailVerified) {
      throw new Error('El email ya está verificado.');
    }
    await (user as FirebaseUser & { sendEmailVerification: () => Promise<void> }).sendEmailVerification();
  }

  /**
   * Obtener perfil de usuario desde Firestore
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = doc(this.db, 'users', userId);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        const isSuperUser = data.email === 'mauricio@aiduxcare.com';
        const userProfile: UserProfile = {
          id: userId,
          email: data.email,
          name: data.name,
          role: isSuperUser ? 'OWNER' : data.role,
          specialization: data.specialization,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          mfaEnabled: data.mfaEnabled || false,
          lastLoginAt: data.lastLoginAt?.toDate(),
          emailVerified: data.emailVerified || false
        };
        return userProfile;
      }
      
      return null;
    } catch (error: unknown) {
      console.error('Error al obtener perfil de usuario:', error);
      return null;
    }
  }

  /**
   * Crear perfil de usuario en Firestore
   */
  private async createUserProfile(userProfile: UserProfile): Promise<void> {
    try {
      const userDoc = doc(this.db, 'users', userProfile.id);
      await setDoc(userDoc, {
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        specialization: userProfile.specialization,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
        mfaEnabled: userProfile.mfaEnabled,
        emailVerified: userProfile.emailVerified
      });
    } catch (error: unknown) {
      console.error('Error al crear perfil de usuario:', error);
      throw new Error('Error al crear perfil de usuario');
    }
  }

  /**
   * Actualizar último login
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      const userDoc = doc(this.db, 'users', userId);
      await updateDoc(userDoc, {
        lastLoginAt: new Date()
      });
    } catch (error: unknown) {
      console.error('Error al actualizar último login:', error);
    }
  }

  /**
   * Determinar rol de usuario basado en el nombre
   */
  private determineUserRole(name: string): 'OWNER' | 'PHYSICIAN' | 'ADMIN' {
    const normalizedName = name.toLowerCase().trim();
    
    // Mauricio Sobarzo = OWNER
    if (normalizedName.includes('mauricio') || normalizedName.includes('sobarzo')) {
      return 'OWNER';
    }
    
    // Por defecto, PHYSICIAN
    return 'PHYSICIAN';
  }

  /**
   * Manejar errores de autenticación
   */
  private handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/user-not-found':
        return new Error('Usuario no encontrado');
      case 'auth/wrong-password':
        return new Error('Contraseña incorrecta');
      case 'auth/email-already-in-use':
        return new Error('El email ya está registrado');
      case 'auth/weak-password':
        return new Error('La contraseña es demasiado débil');
      case 'auth/invalid-email':
        return new Error('Email inválido');
      case 'auth/too-many-requests':
        return new Error('Demasiados intentos. Intenta más tarde');
      default:
        return new Error('Error de autenticación: ' + error.message);
    }
  }

  /**
   * Verificar si el usuario tiene permisos
   */
  hasPermission(user: UserProfile, permission: string): boolean {
    const userRole = ROLES[user.role];
    return userRole.permissions.includes('all') || userRole.permissions.includes(permission);
  }

  /**
   * Obtener nivel de rol del usuario
   */
  getRoleLevel(user: UserProfile): number {
    return ROLES[user.role].level;
  }
}

// Instancia singleton
export const firebaseAuthService = new FirebaseAuthService();

// Exportar para compatibilidad
export default firebaseAuthService; 
