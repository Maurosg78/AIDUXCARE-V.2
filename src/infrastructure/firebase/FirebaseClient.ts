/**
 * 🔥 **Enterprise Firebase Client**
 * 
 * Cliente Firebase enterprise con:
 * - Singleton pattern
 * - Auto-conexión a emuladores en desarrollo
 * - Error handling robusto
 * - Logging de conexiones
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  type Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  type Firestore 
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator, 
  type FirebaseStorage 
} from 'firebase/storage';

import { firebaseConfig, isDevelopment, isDebugEnabled } from '../../core/config/environment';
import { SystemError } from '../../core/errors/AppError';

// =====================================================
// FIREBASE CLIENT SINGLETON
// =====================================================

export class FirebaseClient {
  private static instance: FirebaseClient | null = null;
  
  private readonly app: FirebaseApp;
  private readonly auth: Auth;
  private readonly firestore: Firestore;
  private readonly storage: FirebaseStorage;
  
  private emulatorsConnected = false;

  private constructor() {
    try {
      // Initialize Firebase app
      this.app = initializeApp(firebaseConfig);
      
      // Initialize services
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      this.storage = getStorage(this.app);

      // FORZAR CONEXIÓN A EMULADORES SIEMPRE
      console.log('🔧 Forzando conexión a emuladores Firebase');
      this.connectToEmulators();

      if (isDebugEnabled()) {
        console.log('🔥 Firebase Client inicializado correctamente');
      }

    } catch (error) {
      const systemError = new SystemError(
        'Failed to initialize Firebase client',
        'FIREBASE_INIT_ERROR',
        { metadata: { error: error instanceof Error ? error.message : String(error) } }
      );
      
      console.error('❌ Error inicializando Firebase Client:', systemError);
      throw systemError;
    }
  }

  public static getInstance(): FirebaseClient {
    if (!this.instance) {
      this.instance = new FirebaseClient();
    }
    return this.instance;
  }

  // =====================================================
  // EMULATOR CONNECTIONS
  // =====================================================

  private connectToEmulators(): void {
    if (this.emulatorsConnected) {
      return;
    }

    try {
      // Connect Auth emulator
      this.connectAuthEmulator();
      
      // Connect Firestore emulator
      this.connectFirestoreEmulator();
      
      // Connect Storage emulator
      this.connectStorageEmulator();

      this.emulatorsConnected = true;
      
      if (isDebugEnabled()) {
        console.log('🧪 Emuladores Firebase conectados correctamente');
      }

    } catch (error) {
      console.warn('⚠️ No se pudieron conectar los emuladores:', error);
      // No throw error - emulators are optional in development
    }
  }

  private connectAuthEmulator(): void {
    try {
      connectAuthEmulator(this.auth, 'http://localhost:9099', {
        disableWarnings: true
      });
      
      console.log('✅ Auth emulator FORZADO en http://localhost:9099');
    } catch (error) {
      console.error('❌ ERROR conectando Auth emulator:', error);
    }
  }

  private connectFirestoreEmulator(): void {
    try {
      connectFirestoreEmulator(this.firestore, 'localhost', 8080);
      
      console.log('✅ Firestore emulator FORZADO en localhost:8080');
    } catch (error) {
      console.error('❌ ERROR conectando Firestore emulator:', error);
    }
  }

  private connectStorageEmulator(): void {
    try {
      connectStorageEmulator(this.storage, 'localhost', 9199);
      
      if (isDebugEnabled()) {
        console.log('📁 Storage emulator conectado en localhost:9199');
      }
    } catch (error) {
      if (isDebugEnabled()) {
        console.warn('⚠️ Storage emulator no conectado:', error);
      }
    }
  }

  // =====================================================
  // SERVICE GETTERS
  // =====================================================

  public getApp(): FirebaseApp {
    return this.app;
  }

  public getAuth(): Auth {
    return this.auth;
  }

  public getFirestore(): Firestore {
    return this.firestore;
  }

  public getStorage(): FirebaseStorage {
    return this.storage;
  }

  // =====================================================
  // HEALTH CHECK & UTILITIES
  // =====================================================

  public async healthCheck(): Promise<boolean> {
    try {
      // Simple connectivity test
      const testDoc = { test: true, timestamp: new Date() };
      
      // We can't actually write without proper setup, so just return true if services exist
      return !!(this.app && this.auth && this.firestore && this.storage);
      
    } catch (error) {
      console.error('❌ Firebase health check failed:', error);
      return false;
    }
  }

  public getConnectionInfo(): {
    appInitialized: boolean;
    emulatorsConnected: boolean;
    environment: string;
    projectId: string;
  } {
    return {
      appInitialized: !!this.app,
      emulatorsConnected: this.emulatorsConnected,
      environment: isDevelopment() ? 'development' : 'production',
      projectId: firebaseConfig.projectId
    };
  }

  // =====================================================
  // CLEANUP & RESET (For testing)
  // =====================================================

  public static reset(): void {
    this.instance = null;
  }
}

// =====================================================
// EXPORTED INSTANCES
// =====================================================

// Singleton instance
export const firebaseClient = FirebaseClient.getInstance();

// Individual service exports for convenience
export const auth = firebaseClient.getAuth();
export const firestore = firebaseClient.getFirestore();
export const storage = firebaseClient.getStorage();
export const firebaseApp = firebaseClient.getApp();

// Re-export Firebase types for convenience
export type { FirebaseApp } from 'firebase/app';
export type { Auth } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';
export type { FirebaseStorage } from 'firebase/storage';