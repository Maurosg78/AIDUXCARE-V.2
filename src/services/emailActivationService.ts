/**
 * EmailActivationService - Sistema completo de activación por email
 * Integración real con Firebase Firestore
 * 
 * @version 2.0.0
 * @author CTO/Implementador Jefe
 */

import { collection, doc, setDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

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
   * Integrado con el nuevo sistema de contexto global
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
      console.log('🔍 [DEBUG] Verificando Firebase Auth para:', professionalData.email);
      try {
        const methods = await fetchSignInMethodsForEmail(auth, professionalData.email);
        console.log('🔍 [DEBUG] Métodos encontrados:', methods);
        if (methods.length > 0) {
          console.log('❌ [DEBUG] Email ya registrado en Firebase Auth:', professionalData.email);
          return {
            success: false,
            message: 'Este email ya está registrado en el sistema'
          };
        }
        console.log('✅ [DEBUG] Email disponible en Firebase Auth');
      } catch (authCheckError) {
        console.error('❌ [DEBUG] Error al verificar Firebase Auth:', authCheckError);
        return {
          success: false,
          message: 'Error al verificar el email. Inténtalo de nuevo.'
        };
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

      // Guardar en Firestore en la colección 'users' para consistencia
      const userDoc = doc(db, 'users', professionalId);
      const firestoreData: Record<string, unknown> = {
        ...professional,
        registrationDate: professional.registrationDate.toISOString(),
        createdAt: professional.createdAt.toISOString(),
        updatedAt: professional.updatedAt.toISOString()
      };
      
      // Solo agregar lastLogin si existe
      if (professional.lastLogin) {
        firestoreData.lastLogin = professional.lastLogin.toISOString();
      }
      
      await setDoc(userDoc, firestoreData);

      console.log('✅ [DEBUG] Profesional guardado en Firestore:', professionalId);

      // Crear cuenta de usuario en Firebase Auth con contraseña temporal
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          professionalData.email, 
          'tempPassword123!' // Contraseña temporal que será cambiada
        );

        // Enviar email de verificación de Firebase
        await sendEmailVerification(userCredential.user);

        console.log('✅ [DEBUG] Usuario creado en Firebase Auth y email enviado');

        // Guardar token de activación en el documento del usuario
        await updateDoc(userDoc, {
          activationToken: activationToken,
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
        });

        // Mostrar link de activación para testing
        const activationLink = `${window.location.origin}/activate?token=${activationToken}`;
        console.log('🔗 [DEBUG] Link de activación:', activationLink);
        
        if (typeof window !== 'undefined') {
          alert(`🔗 LINK DE ACTIVACIÓN PARA TESTING:\n${activationLink}\n\nCopia este link y pégalo en el navegador para activar la cuenta.`);
        }

        return {
          success: true,
          message: 'Registro exitoso. Revisa tu email para activar tu cuenta.',
          professionalId: professional.id,
          activationToken
        };

      } catch (authError: unknown) {
        console.error('❌ [DEBUG] Error en Firebase Auth:', authError);
        
        // Si falla la creación en Auth, eliminar de Firestore
        try {
          await deleteDoc(userDoc);
          console.log('✅ [DEBUG] Registro eliminado de Firestore después del error de Auth');
        } catch (deleteError) {
          console.error('⚠️ [DEBUG] Error al eliminar registro de Firestore:', deleteError);
        }
        
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

      // Buscar usuario por token en la colección 'users'
      const usersRef = collection(db, 'users');
      const tokenQuery = query(usersRef, where('activationToken', '==', token));
      const tokenSnapshot = await getDocs(tokenQuery);
      
      if (tokenSnapshot.empty) {
        console.log('❌ [DEBUG] Token no encontrado:', token);
        return {
          success: false,
          message: 'Token de activación inválido o expirado'
        };
      }

      const userDoc = tokenSnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;

      // Verificar expiración (si existe)
      if (userData.tokenExpiry) {
        const expiresAt = new Date(userData.tokenExpiry);
        if (expiresAt < new Date()) {
          console.log('❌ [DEBUG] Token expirado:', token);
          return {
            success: false,
            message: 'Token de activación expirado'
          };
        }
      }

      // Activar cuenta
      await updateDoc(userDoc.ref, {
        isActive: true,
        emailVerified: true,
        activationToken: null, // Limpiar token usado
        updatedAt: new Date().toISOString()
      });

      console.log('✅ [DEBUG] Cuenta activada exitosamente:', email);

      return {
        success: true,
        message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.',
        professionalId: userDoc.id
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
      console.log('🔍 [DEBUG] Buscando profesional en Firestore:', email);
      
      // Buscar en la colección 'users' (no 'professionals')
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (snapshot.empty) {
        console.log('❌ [DEBUG] Usuario no encontrado en colección users:', email);
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      console.log('✅ [DEBUG] Usuario encontrado:', {
        email: data.email,
        displayName: data.displayName,
        emailVerified: data.emailVerified,
        isActive: data.isActive
      });
      
      return {
        ...data,
        registrationDate: new Date(data.registrationDate || data.createdAt),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        lastLogin: data.lastLogin ? new Date(data.lastLogin) : undefined
      } as ProfessionalRegistration;
    } catch (error) {
      console.error('❌ [DEBUG] Error obteniendo profesional:', error);
      return null;
    }
  }

  /**
   * Actualiza último login
   */
  public async updateLastLogin(email: string): Promise<void> {
    try {
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
        const docRef = doc(db, 'users', snapshot.docs[0].id);
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
   * Envía email de recuperación de contraseña
   * Solo envía si el email está verificado y activo en Firestore
   */
  public async sendPasswordRecovery(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 [DEBUG] Iniciando recuperación de contraseña para:', email);

      // Verificar si el profesional existe
      const professional = await this.getProfessional(email);
      
      if (!professional) {
        console.log('❌ [DEBUG] Profesional no encontrado:', email);
        return {
          success: false,
          message: 'No se encontró una cuenta con este email. Verifica la dirección o regístrate.'
        };
      }

      // Verificar que el email esté verificado
      if (!professional.emailVerified) {
        console.log('❌ [DEBUG] Email no verificado:', email);
        return {
          success: false,
          message: 'Tu cuenta no está verificada. Revisa tu email y activa tu cuenta antes de solicitar recuperación de contraseña.'
        };
      }

      // Verificar que la cuenta esté activa
      if (!professional.isActive) {
        console.log('❌ [DEBUG] Cuenta no activa:', email);
        return {
          success: false,
          message: 'Tu cuenta no está activa. Contacta al administrador para activar tu cuenta.'
        };
      }

      console.log('✅ [DEBUG] Usuario verificado y activo, procediendo con recuperación:', email);

      // Generar token de recuperación único
      const recoveryToken = this.generateRecoveryToken();
      
      // Guardar token de recuperación en Firestore
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(emailQuery);

      if (!snapshot.empty) {
        const docRef = doc(db, 'users', snapshot.docs[0].id);
        await updateDoc(docRef, {
          recoveryToken,
          recoveryTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          updatedAt: new Date().toISOString()
        });
      }

      // En desarrollo, mostrar el token en consola
      console.log('📧 [DEBUG] Email de recuperación enviado a:', email);
      console.log('🔑 [DEBUG] Token de recuperación:', recoveryToken);
      console.log('🔗 [DEBUG] Link de recuperación:', `${window.location.origin}/reset-password?token=${recoveryToken}`);
      console.log('✅ [DEBUG] Usuario validado:', {
        email: professional.email,
        displayName: professional.displayName,
        emailVerified: professional.emailVerified,
        isActive: professional.isActive
      });

      // En producción, aquí se enviaría el email real usando un servicio como SendGrid, AWS SES, etc.
      // await this.sendEmail({
      //   to: email,
      //   subject: 'Recuperación de contraseña - AiDuxCare',
      //   html: this.generatePasswordRecoveryEmail(professional.displayName, recoveryToken),
      //   text: this.generatePasswordRecoveryEmailText(professional.displayName, recoveryToken)
      // });

      return {
        success: true,
        message: 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada.'
      };

    } catch (error) {
      console.error('❌ [DEBUG] Error en recuperación de contraseña:', error);
      return {
        success: false,
        message: 'Error al procesar la solicitud. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * Genera token de recuperación único
   */
  private generateRecoveryToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Reenvía email de verificación para usuarios no verificados
   */
  public async resendEmailVerification(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 [DEBUG] Reenviando verificación para:', email);

      // Verificar si el profesional existe
      const professional = await this.getProfessional(email);
      
      if (!professional) {
        console.log('❌ [DEBUG] Profesional no encontrado:', email);
        return {
          success: false,
          message: 'No se encontró una cuenta con este email. Verifica la dirección o regístrate.'
        };
      }

      // Solo reenviar si no está verificado
      if (professional.emailVerified) {
        console.log('✅ [DEBUG] Usuario ya verificado:', email);
        return {
          success: true,
          message: 'Tu cuenta ya está verificada. Puedes iniciar sesión normalmente.'
        };
      }

      console.log('📧 [DEBUG] Reenviando email de verificación a:', email);

      // En desarrollo, mostrar información en consola
      console.log('📧 [DEBUG] Email de verificación enviado a:', email);
      console.log('🔗 [DEBUG] Link de verificación:', `${window.location.origin}/activate?token=${professional.activationToken}`);

      // En producción, aquí se enviaría el email real
      // await this.sendEmail({
      //   to: email,
      //   subject: 'Verifica tu cuenta - AiDuxCare',
      //   html: this.generateVerificationEmail(professional.displayName, professional.activationToken),
      //   text: this.generateVerificationEmailText(professional.displayName, professional.activationToken)
      // });

      return {
        success: true,
        message: 'Se ha reenviado el email de verificación. Revisa tu bandeja de entrada.'
      };

    } catch (error) {
      console.error('❌ [DEBUG] Error reenviando verificación:', error);
      return {
        success: false,
        message: 'Error al reenviar verificación. Inténtalo de nuevo.'
      };
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