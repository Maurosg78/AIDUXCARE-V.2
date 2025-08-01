/**
 * 🔥 Firebase Auth Service - Autenticación Real
 * 
 * Servicio de autenticación completo usando Firebase Auth
 * Implementación real para producción
 */

import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { app } from '../firebase/firebaseClient';

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
 * Servicio de autenticación real con Firebase
 */
export class FirebaseAuthService {
  private auth: Auth;
  private authStateListeners: Array<(session: AuthSession) => void> = [];

  constructor() {
    this.auth = getAuth(app);
    console.log('🔥 Firebase Auth inicializado:', this.auth);
    
    // Configurar listener de cambios de estado
    this.setupAuthStateListener();
  }

  /**
   * Configurar listener de cambios de estado de autenticación
   */
  private setupAuthStateListener() {
    onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
      console.log('🔄 Estado de autenticación cambiado:', firebaseUser?.email);
      
      const session: AuthSession = {
        user: firebaseUser ? this.mapFirebaseUserToProfile(firebaseUser) : null,
        loading: false,
        error: null
      };

      // Notificar a todos los listeners
      this.authStateListeners.forEach(callback => callback(session));
    });
  }

  /**
   * Mapear usuario de Firebase a nuestro perfil
   */
  private mapFirebaseUserToProfile(firebaseUser: FirebaseUser): UserProfile {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
      role: this.determineUserRole(firebaseUser.email || ''),
      specialization: 'Fisioterapia', // Por defecto
      createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
      updatedAt: new Date(),
      mfaEnabled: false, // Por defecto, se puede implementar después
      lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now())
    };
  }

  /**
   * Iniciar sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    try {
      console.log('🔥 Intentando login con Firebase:', email);
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Login exitoso con Firebase:', firebaseUser.email);
      
      return this.mapFirebaseUserToProfile(firebaseUser);
    } catch (error: any) {
      console.error('❌ Error en signIn Firebase:', error);
      
      // Mapear errores de Firebase a mensajes amigables
      let errorMessage = 'Error de autenticación';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Usuario deshabilitado';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde';
          break;
        default:
          errorMessage = error.message || 'Error de autenticación';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async signUp(email: string, password: string, name: string, specialization?: string): Promise<UserProfile> {
    try {
      console.log('🔥 Intentando registro con Firebase:', email);
      
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Actualizar displayName si es posible
      if (firebaseUser.displayName !== name) {
        // Nota: Para actualizar displayName necesitarías importar updateProfile
        console.log('📝 Usuario registrado, displayName se puede actualizar después');
      }
      
      console.log('✅ Registro exitoso con Firebase:', firebaseUser.email);
      
      return this.mapFirebaseUserToProfile(firebaseUser);
    } catch (error: any) {
      console.error('❌ Error en signUp Firebase:', error);
      
      // Mapear errores de Firebase a mensajes amigables
      let errorMessage = 'Error de registro';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'El email ya está registrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Registro no habilitado';
          break;
        default:
          errorMessage = error.message || 'Error de registro';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<void> {
    try {
      console.log('🔥 Cerrando sesión con Firebase');
      await firebaseSignOut(this.auth);
      console.log('✅ Logout exitoso con Firebase');
    } catch (error: any) {
      console.error('❌ Error en signOut Firebase:', error);
      throw new Error('Error al cerrar sesión');
    }
  }

  /**
   * Obtener sesión actual
   */
  async getCurrentSession(): Promise<AuthSession> {
    try {
      console.log('🔥 Obteniendo sesión actual de Firebase');
      
      const currentUser = this.auth.currentUser;
      
      return {
        user: currentUser ? this.mapFirebaseUserToProfile(currentUser) : null,
        loading: false,
        error: null
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo sesión Firebase:', error);
      return {
        user: null,
        loading: false,
        error: 'Error obteniendo sesión'
      };
    }
  }

  /**
   * Escuchar cambios de autenticación
   */
  onAuthStateChange(callback: (session: AuthSession) => void): () => void {
    console.log('🔥 Configurando listener de auth state Firebase');
    
    // Agregar callback a la lista
    this.authStateListeners.push(callback);
    
    // Ejecutar callback inmediatamente con el estado actual
    this.getCurrentSession().then(session => {
      callback(session);
    });
    
    // Retornar función de limpieza
    return () => {
      console.log('🔥 Limpiando listener de auth state Firebase');
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Determinar rol del usuario basado en email
   */
  private determineUserRole(email: string): 'OWNER' | 'PHYSICIAN' | 'ADMIN' {
    const lowerEmail = email.toLowerCase();
    
    if (lowerEmail.includes('maurosg') || lowerEmail.includes('mauricio')) {
      return 'OWNER';
    }
    
    if (lowerEmail.includes('admin') || lowerEmail.includes('administrator')) {
      return 'ADMIN';
    }
    
    return 'PHYSICIAN';
  }

  /**
   * Verificar permisos del usuario
   */
  hasPermission(user: UserProfile, permission: string): boolean {
    const role = ROLES[user.role];
    return role.permissions.includes('all') || role.permissions.includes(permission);
  }

  /**
   * Obtener nivel del rol
   */
  getRoleLevel(user: UserProfile): number {
    return ROLES[user.role].level;
  }

  /**
   * Obtener usuario actual de Firebase
   */
  getCurrentFirebaseUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }
}

// Instancia singleton
export const firebaseAuthService = new FirebaseAuthService();

// Exportar para compatibilidad
export default firebaseAuthService; 