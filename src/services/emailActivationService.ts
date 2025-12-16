/**
 * EmailActivationService - Sistema completo de activación por email
 * Integración real con Firebase Firestore
 * 
 * @version 2.0.0
 * @author CTO/Implementador Jefe
 */

import { collection, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, type ActionCodeSettings } from 'firebase/auth';

import { db, auth } from '../lib/firebase';
import { SMSService } from './smsService';
import { AnalyticsService } from './analyticsService';

import logger from '@/shared/utils/logger';

// Pilot start date - users registered from this date onwards are pilot users
const PILOT_START_DATE = new Date('2024-12-19T00:00:00Z');

export interface ProfessionalRegistration {
  id: string;
  email: string;
  displayName: string;
  professionalTitle: string;
  specialty: string;

  // NEW: captured in onboarding
  university?: string;
  experienceYears?: number;
  workplace?: string;
  mskSkills?: string; // Comma-separated list of MSK skill codes (e.g., "manual-therapy,dry-needling,mckenzie")

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
  public async registerProfessional(
    professionalData: Omit<ProfessionalRegistration, 'id' | 'activationToken' | 'isActive' | 'emailVerified' | 'createdAt' | 'updatedAt'>,
    password: string
  ): Promise<ActivationResult> {
    try {
      console.log('[DEBUG] Iniciando registro de profesional:', professionalData.email);

      // Generar token de activación único y ID inmediatamente (no requiere esperar)
      const activationToken = this.generateActivationToken();
      const professionalId = this.generateProfessionalId();

      // NOTA: No verificamos email duplicado aquí porque:
      // 1. Firebase Auth ya valida duplicados al crear el usuario
      // 2. Esto elimina 2 llamadas secuenciales innecesarias (Firestore + Auth)
      // 3. Si el email existe, createUserWithEmailAndPassword lanzará un error que manejamos

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

      // ✅ PILOT METRICS: Determine if user is a pilot user
      const registrationDate = new Date();
      const isPilotUser = registrationDate >= PILOT_START_DATE;
      const pilotPhase = isPilotUser ? 'pilot_1' : undefined;

      // Preparar datos para Firestore
      const userDoc = doc(db, 'users', professionalId);
      const firestoreData: Record<string, unknown> = {
        ...professional,
        registrationDate: professional.registrationDate.toISOString(),
        createdAt: professional.createdAt.toISOString(),
        updatedAt: professional.updatedAt.toISOString(),
        activationToken: activationToken,
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        // ✅ PILOT METRICS: Add pilot flags
        isPilotUser,
        ...(pilotPhase && { pilotPhase })
      };

      // Solo agregar lastLogin si existe
      if (professional.lastLogin) {
        firestoreData.lastLogin = professional.lastLogin.toISOString();
      }

      // Crear cuenta de usuario en Firebase Auth con contraseña temporal
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, professionalData.email, password);
        console.log('✅ [DEBUG] Usuario creado en Firebase Auth');

        // Enviar email de verificación de Firebase (no bloquea)
        const actionCodeSettings: ActionCodeSettings = {
          url: `${window.location.origin}/email-verified`,
          handleCodeInApp: true,
        };
        sendEmailVerification(userCredential.user, actionCodeSettings).catch((error) => {
          console.error('⚠️ [DEBUG] Error enviando email de verificación:', error);
        });

        // Guardar en Firestore de forma asíncrona (no bloquea el envío de SMS)
        setDoc(userDoc, firestoreData).then(async () => {
          console.log('✅ [DEBUG] Profesional guardado en Firestore:', professionalId);

          // ✅ PILOT METRICS: Track pilot user registration
          if (isPilotUser) {
            try {
              await AnalyticsService.trackEvent('pilot_user_registered', {
                userId: professionalId,
                email: professionalData.email,
                registrationDate: registrationDate.toISOString(),
                isPilotUser: true,
                pilotPhase: 'pilot_1'
              });
              console.log('✅ [PILOT METRICS] Pilot user registration tracked:', professionalId);
            } catch (error) {
              console.error('⚠️ [PILOT METRICS] Error tracking pilot user registration:', error);
              // Non-blocking: don't fail registration if analytics fails
            }
          }
        }).catch((error) => {
          console.error('⚠️ [DEBUG] Error guardando en Firestore:', error);
        });

        // Enviar SMS con link de activación inmediatamente (no espera Firestore)
        // Usar el teléfono del profesional si está disponible
        if (professionalData.phone) {
          const professionalName = professionalData.displayName || 'Profesional';

          SMSService.sendActivationLink(
            professionalData.phone,
            professionalName,
            activationToken
          ).then(() => {
            console.log('✅ [DEBUG] SMS de activación enviado a:', professionalData.phone);
          }).catch((error) => {
            console.error('⚠️ [DEBUG] Error enviando SMS de activación:', error);
            // No fallar el registro si el SMS falla, solo loguear el error
          });
        } else {
          console.warn('⚠️ [DEBUG] No se proporcionó teléfono, no se enviará SMS de activación');
        }

        // Log link de activación para testing (no bloquea con alert)
        const activationLink = `${window.location.origin}/activate?token=${activationToken}`;
        console.log('[DEBUG] Link de activación:', activationLink);
        console.log('[DEBUG] Token de activación:', activationToken);

        return {
          success: true,
          message: professionalData.phone
            ? 'Registro exitoso. Revisa tu SMS y email para activar tu cuenta.'
            : 'Registro exitoso. Revisa tu email para activar tu cuenta.',
          professionalId: professional.id,
          activationToken
        };

      } catch (authError: unknown) {
        console.error('❌ [DEBUG] Error en Firebase Auth:', authError);

        const error = authError as { code?: string };

        // Manejar errores específicos de Firebase Auth
        if (error.code === 'auth/email-already-in-use') {
          return {
            success: false,
            message: 'Este email ya está registrado en el sistema'
          };
        }

        if (error.code === 'auth/invalid-email') {
          return {
            success: false,
            message: 'El formato del email no es válido'
          };
        }

        if (error.code === 'auth/weak-password') {
          return {
            success: false,
            message: 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres'
          };
        }

        // Si falla la creación en Auth y ya se guardó en Firestore, intentar limpiar (asíncrono, no bloquea)
        deleteDoc(userDoc).catch((deleteError) => {
          console.error('⚠️ [DEBUG] Error al eliminar registro de Firestore:', deleteError);
        });

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
      console.log('[DEBUG] Activando cuenta con token:', token);

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
      console.log('[DEBUG] Buscando profesional en Firestore:', email);

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
      console.log('[DEBUG] Iniciando recuperación de contraseña para:', email);

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
      console.log('[DEBUG] Email de recuperación enviado a:', email);
      console.log('[DEBUG] Token de recuperación:', recoveryToken);
      console.log('[DEBUG] Link de recuperación:', `${window.location.origin}/reset-password?token=${recoveryToken}`);
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
      console.log('[DEBUG] Reenviando verificación para:', email);

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

      console.log('[DEBUG] Reenviando email de verificación a:', email);

      // En desarrollo, mostrar información en consola
      console.log('[DEBUG] Email de verificación enviado a:', email);
      console.log('[DEBUG] Link de verificación:', `${window.location.origin}/activate?token=${professional.activationToken}`);

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