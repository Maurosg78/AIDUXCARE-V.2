/**
 * EmailActivationService - Sistema completo de activación por email
 * Integración real con Firebase Firestore
 * 
 * @version 2.0.0
 * @author CTO/Implementador Jefe
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';

// Configuración Firebase
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export interface ProfessionalRegistration {
  id: string;
  email: string;
  displayName: string;
  professionalTitle: string;
  specialty: string;
  country: string;
  city?: string;
  province?: string;
  phone?: string;
  licenseNumber?: string;
  registrationDate: Date;
  activationToken: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  professionalId?: string;
  activationToken?: string;
}

export class EmailActivationService {
  private static instance: EmailActivationService;

  public static getInstance(): EmailActivationService {
    if (!EmailActivationService.instance) {
      EmailActivationService.instance = new EmailActivationService();
    }
    return EmailActivationService.instance;
  }

  /**
   * Registra un nuevo profesional y envía email de activación
   */
  public async registerProfessional(professionalData: Omit<ProfessionalRegistration, 'id' | 'activationToken' | 'isActive' | 'emailVerified' | 'createdAt' | 'updatedAt'>): Promise<ActivationResult> {
    try {
      console.log('🔍 [DEBUG] Iniciando registro de profesional:', professionalData.email);

      // Verificar si el email ya existe en Firestore
      const professionalsRef = collection(db, 'professionals');
      const emailQuery = query(professionalsRef, where('email', '==', professionalData.email.toLowerCase()));
      const emailSnapshot = await getDocs(emailQuery);

      if (!emailSnapshot.empty) {
        console.log('❌ [DEBUG] Email ya registrado en Firestore:', professionalData.email);
        return {
          success: false,
          message: 'Este email ya está registrado en el sistema'
        };
      }

      // Verificar si el email ya existe en Firebase Auth
      try {
        const methods = await fetchSignInMethodsForEmail(auth, professionalData.email);
        if (methods.length > 0) {
          console.log('❌ [DEBUG] Email ya registrado en Firebase Auth:', professionalData.email);
          return {
            success: false,
            message: 'Este email ya está registrado en el sistema'
          };
        }
      } catch (authCheckError) {
        console.log('⚠️ [DEBUG] No se pudo verificar Firebase Auth, continuando:', authCheckError);
      }

      // Generar token de activación único
      const activationToken = this.generateActivationToken();
      const professionalId = this.generateProfessionalId();
      
      // Crear registro del profesional
      const professional: ProfessionalRegistration = {
        ...professionalData,
        id: professionalId,
        activationToken,
        isActive: false,
        emailVerified: false,
        registrationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Guardar en Firestore
      const professionalDoc = doc(db, 'professionals', professionalId);
      const firestoreData: any = {
        ...professional,
        registrationDate: professional.registrationDate.toISOString(),
        createdAt: professional.createdAt.toISOString(),
        updatedAt: professional.updatedAt.toISOString()
      };
      
      // Solo agregar lastLogin si existe
      if (professional.lastLogin) {
        firestoreData.lastLogin = professional.lastLogin.toISOString();
      }
      
      await setDoc(professionalDoc, firestoreData);

      console.log('✅ [DEBUG] Profesional guardado en Firestore:', professionalId);

      // Crear cuenta de usuario en Firebase Auth
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          professionalData.email, 
          'tempPassword123!' // Contraseña temporal
        );

        // Enviar email de verificación de Firebase
        await sendEmailVerification(userCredential.user);

        console.log('✅ [DEBUG] Usuario creado en Firebase Auth y email enviado');

        // Guardar token de activación en Firestore
        const tokenDoc = doc(db, 'activationTokens', activationToken);
        await setDoc(tokenDoc, {
          email: professionalData.email,
          professionalId: professionalId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        });

        return {
          success: true,
          message: 'Registro exitoso. Revisa tu email para activar tu cuenta.',
          professionalId: professional.id,
          activationToken
        };

      } catch (authError: unknown) {
        console.error('❌ [DEBUG] Error en Firebase Auth:', authError);
        
        // Si falla la creación en Auth, eliminar de Firestore
        await deleteDoc(professionalDoc);
        
        const error = authError as { code?: string };
        if (error.code === 'auth/email-already-in-use') {
          return {
            success: false,
            message: 'Este email ya está registrado en el sistema'
          };
        }
        
        return {
          success: false,
          message: 'Error al crear la cuenta de usuario. Inténtalo de nuevo.'
        };
      }

    } catch (error) {
      console.error('❌ [DEBUG] Error en registro de profesional:', error);
      return {
        success: false,
        message: 'Error interno del sistema. Contacta soporte.'
      };
    }
  }

  /**
   * Activa la cuenta usando el token
   */
  public async activateAccount(token: string): Promise<ActivationResult> {
    try {
      console.log('🔍 [DEBUG] Activando cuenta con token:', token);

      // Buscar token en Firestore
      const tokenDoc = doc(db, 'activationTokens', token);
      const tokenSnapshot = await getDoc(tokenDoc);
      
      if (!tokenSnapshot.exists()) {
        console.log('❌ [DEBUG] Token no encontrado:', token);
        return {
          success: false,
          message: 'Token de activación inválido o expirado'
        };
      }

      const tokenData = tokenSnapshot.data();
      const email = tokenData.email;
      const professionalId = tokenData.professionalId;

      // Verificar expiración
      const expiresAt = new Date(tokenData.expiresAt);
      if (expiresAt < new Date()) {
        console.log('❌ [DEBUG] Token expirado:', token);
        await deleteDoc(tokenDoc);
        return {
          success: false,
          message: 'Token de activación expirado'
        };
      }

      // Buscar profesional en Firestore
      const professionalDoc = doc(db, 'professionals', professionalId);
      const professionalSnapshot = await getDoc(professionalDoc);

      if (!professionalSnapshot.exists()) {
        console.log('❌ [DEBUG] Profesional no encontrado:', professionalId);
        return {
          success: false,
          message: 'Profesional no encontrado'
        };
      }

      // Activar cuenta
      await updateDoc(professionalDoc, {
        isActive: true,
        emailVerified: true,
        updatedAt: new Date().toISOString()
      });

      // Eliminar token usado
      await deleteDoc(tokenDoc);

      console.log('✅ [DEBUG] Cuenta activada exitosamente:', email);

      return {
        success: true,
        message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.',
        professionalId: professionalId
      };

    } catch (error) {
      console.error('❌ [DEBUG] Error en activación:', error);
      return {
        success: false,
        message: 'Error interno del sistema. Contacta soporte.'
      };
    }
  }

  /**
   * Verifica si un profesional está activo
   */
  public async isProfessionalActive(email: string): Promise<boolean> {
    try {
      const professionalsRef = collection(db, 'professionals');
      const emailQuery = query(professionalsRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) return false;

      const professional = snapshot.docs[0].data();
      return professional.isActive === true;
    } catch (error) {
      console.error('Error verificando estado del profesional:', error);
      return false;
    }
  }

  /**
   * Obtiene datos del profesional
   */
  public async getProfessional(email: string): Promise<ProfessionalRegistration | null> {
    try {
      const professionalsRef = collection(db, 'professionals');
      const emailQuery = query(professionalsRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        registrationDate: new Date(data.registrationDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined
      } as ProfessionalRegistration;
    } catch (error) {
      console.error('Error obteniendo profesional:', error);
      return null;
    }
  }

  /**
   * Actualiza último login
   */
  public async updateLastLogin(email: string): Promise<void> {
    try {
      const professionalsRef = collection(db, 'professionals');
      const emailQuery = query(professionalsRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
        const docRef = doc(db, 'professionals', snapshot.docs[0].id);
        await updateDoc(docRef, {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error actualizando último login:', error);
    }
  }

  /**
   * Obtiene estadísticas del sistema
   */
  public async getSystemStats() {
    try {
      const professionalsRef = collection(db, 'professionals');
      const snapshot = await getDocs(professionalsRef);
      
      const total = snapshot.size;
      const active = snapshot.docs.filter(doc => doc.data().isActive).length;
      const pending = total - active;

      return {
        total,
        active,
        pending,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        total: 0,
        active: 0,
        pending: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Genera ID único para profesional
   */
  private generateProfessionalId(): string {
    return `prof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera token de activación único
   */
  private generateActivationToken(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }
}

// Exportar instancia singleton
export const emailActivationService = EmailActivationService.getInstance(); 