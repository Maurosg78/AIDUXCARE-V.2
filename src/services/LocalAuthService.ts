/**
 * 🔐 Local Authentication Service - AiDuxCare V.2
 * Gestión de autenticación local sin dependencias externas
 * Integrado con LocalStorageService para persistencia
 */

import { TherapistLocalData } from '@/types/session';
import { localStorageService } from './LocalStorageService';

export interface AuthenticationResult {
  success: boolean;
  therapist?: TherapistLocalData;
  error?: string;
}

export interface RegisterData {
  name: string;
  email?: string;
  specialization?: string;
  licenseNumber?: string;
}

class LocalAuthService {
  private currentSession: TherapistLocalData | null = null;

  constructor() {
    this.initializeSession();
  }

  // ========= INICIALIZACIÓN =========

  /**
   * Inicializar sesión al cargar la aplicación
   */
  private initializeSession(): void {
    const therapist = localStorageService.getCurrentTherapist();
    if (therapist) {
      this.currentSession = therapist;
    }
  }

  // ========= AUTENTICACIÓN =========

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Obtener terapeuta actualmente autenticado
   */
  getCurrentTherapist(): TherapistLocalData | null {
    return this.currentSession;
  }

  /**
   * Login simple (por nombre de terapeuta)
   */
  async authenticate(therapistName: string): Promise<AuthenticationResult> {
    try {
      // En modo local, buscamos o creamos el terapeuta
      let therapist = this.findTherapistByName(therapistName);
      
      if (!therapist) {
        // Si no existe, lo creamos automáticamente
        therapist = localStorageService.createTherapist(
          this.generateTherapistId(therapistName),
          therapistName
        );
      }

      // Actualizar último acceso
      therapist.lastActiveAt = new Date().toISOString();
      localStorageService.saveTherapistData(therapist);

      // Establecer sesión actual
      this.currentSession = therapist;

      return {
        success: true,
        therapist
      };

    } catch (error) {
      console.error('❌ Error en autenticación:', error);
      return {
        success: false,
        error: 'Error interno de autenticación'
      };
    }
  }

  /**
   * Registro de nuevo terapeuta
   */
  async register(registerData: RegisterData): Promise<AuthenticationResult> {
    try {
      // Verificar si ya existe
      const existing = this.findTherapistByName(registerData.name);
      if (existing) {
        return {
          success: false,
          error: 'Ya existe un terapeuta con ese nombre'
        };
      }

      // Crear nuevo terapeuta
      const therapistId = this.generateTherapistId(registerData.name);
      const therapist = localStorageService.createTherapist(
        therapistId,
        registerData.name,
        registerData.email
      );

      // Agregar datos adicionales si se proporcionaron
      if (registerData.specialization || registerData.licenseNumber) {
        therapist.preferences = {
          ...therapist.preferences,
          specialization: registerData.specialization,
          licenseNumber: registerData.licenseNumber
        };
        localStorageService.saveTherapistData(therapist);
      }

      // Establecer sesión actual
      this.currentSession = therapist;

      return {
        success: true,
        therapist
      };

    } catch (error) {
      console.error('❌ Error en registro:', error);
      return {
        success: false,
        error: 'Error interno en el registro'
      };
    }
  }

  /**
   * Cambiar a otro terapeuta
   */
  async switchTherapist(therapistName: string): Promise<AuthenticationResult> {
    try {
      const therapist = this.findTherapistByName(therapistName);
      
      if (!therapist) {
        return {
          success: false,
          error: 'Terapeuta no encontrado'
        };
      }

      // Actualizar último acceso
      therapist.lastActiveAt = new Date().toISOString();
      localStorageService.saveTherapistData(therapist);

      // Cambiar sesión actual
      this.currentSession = therapist;

      return {
        success: true,
        therapist
      };

    } catch (error) {
      console.error('❌ Error al cambiar terapeuta:', error);
      return {
        success: false,
        error: 'Error interno al cambiar terapeuta'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.currentSession = null;
    // No eliminamos datos del localStorage, solo la sesión actual
  }

  // ========= GESTIÓN DE TERAPEUTAS =========

  /**
   * Obtener lista de todos los terapeutas registrados
   */
  getAllTherapists(): string[] {
    try {
      // En la implementación actual, solo tenemos un terapeuta por vez
      // Esto se expandirá cuando implementemos múltiples terapeutas
      const current = localStorageService.getCurrentTherapist();
      return current ? [current.name] : [];
    } catch (error) {
      console.error('❌ Error al obtener terapeutas:', error);
      return [];
    }
  }

  /**
   * Eliminar terapeuta (con confirmación)
   */
  async deleteTherapist(therapistName: string): Promise<boolean> {
    try {
      const therapist = this.findTherapistByName(therapistName);
      if (!therapist) return false;

      // Si es el terapeuta actual, cerrar sesión
      if (this.currentSession?.name === therapistName) {
        this.logout();
      }

      // En la implementación actual, esto equivale a limpiar el storage
      // Se expandirá para manejar múltiples terapeutas
      if (therapist.name === localStorageService.getCurrentTherapist()?.name) {
        localStorage.removeItem('aiduxcare_v2_therapist_data');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error al eliminar terapeuta:', error);
      return false;
    }
  }

  // ========= UTILIDADES PRIVADAS =========

  /**
   * Buscar terapeuta por nombre
   */
  private findTherapistByName(name: string): TherapistLocalData | null {
    const current = localStorageService.getCurrentTherapist();
    return current && current.name === name ? current : null;
  }

  /**
   * Generar ID único para terapeuta
   */
  private generateTherapistId(name: string): string {
    const timestamp = Date.now();
    const nameSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `therapist-${nameSlug}-${timestamp}`;
  }

  // ========= VALIDACIONES =========

  /**
   * Validar datos de registro
   */
  validateRegisterData(data: RegisterData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('El email no tiene un formato válido');
    }

    if (data.name && data.name.trim().length > 50) {
      errors.push('El nombre no puede exceder 50 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Instancia singleton
export const localAuthService = new LocalAuthService();
export default LocalAuthService; 