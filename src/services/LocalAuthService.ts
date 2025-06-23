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
        
        // NUEVO: Asignar rol OWNER para UAT
        therapist.role = this.determineUserRole(therapistName);
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

      // NUEVO: Asignar rol OWNER automáticamente para UAT
      therapist.role = this.determineUserRole(registerData.name, registerData.email);

      // Agregar datos adicionales si se proporcionaron
      if (registerData.specialization || registerData.licenseNumber) {
        therapist.preferences = {
          ...therapist.preferences,
          specialization: registerData.specialization,
          licenseNumber: registerData.licenseNumber
        };
      }
      
      localStorageService.saveTherapistData(therapist);

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

  // ========= SISTEMA DE ROLES =========

  /**
   * Verifica si el usuario actual tiene rol OWNER
   */
  isOwner(): boolean {
    return this.currentSession?.role === 'OWNER';
  }

  /**
   * Verifica si el usuario puede realizar una acción sin límites
   */
  hasUnlimitedAccess(): boolean {
    return this.isOwner();
  }

  /**
   * Asigna rol OWNER al usuario actual (para UAT)
   */
  promoteToOwner(): boolean {
    if (this.currentSession) {
      this.currentSession.role = 'OWNER';
      localStorageService.saveTherapistData(this.currentSession);
      console.log('✅ Usuario promovido a OWNER para UAT');
      return true;
    }
    return false;
  }

  /**
   * Determina el rol del usuario según el nombre/email
   */
  private determineUserRole(name: string, email?: string): 'OWNER' | 'PROFESSIONAL' | 'TRIAL' {
    // Para UAT, asignar OWNER automáticamente
    const ownerIndicators = [
      'mauricio', 'cto', 'owner', 'admin', 'test',
      'aiduxcare', 'demo', 'fisio', 'physio',
      // NUEVOS INDICADORES PARA UAT
      'sobarzo', 'mauricio sobarzo', 'dr. mauricio',
      'fisioterapeuta', 'uattest', 'uat_test',
      'developer', 'dev', 'testing', 'qa'
    ];
    
    const nameOrEmail = `${name.toLowerCase()} ${email?.toLowerCase() || ''}`;
    
    // Log detallado para UAT
    console.log(`🔍 UAT: Analizando usuario para rol OWNER`);
    console.log(`👤 Nombre: "${name}"`);
    console.log(`📧 Email: "${email || 'no proporcionado'}"`);
    console.log(`🔎 Texto de búsqueda: "${nameOrEmail}"`);
    
    const matchedIndicators = ownerIndicators.filter(indicator => 
      nameOrEmail.includes(indicator)
    );
    
    if (matchedIndicators.length > 0) {
      console.log(`🔑 UAT: Asignando rol OWNER - Indicadores encontrados: ${matchedIndicators.join(', ')}`);
      return 'OWNER';
    }
    
    console.log(`👥 UAT: Asignando rol PROFESSIONAL - No se encontraron indicadores OWNER`);
    return 'PROFESSIONAL';
  }

  /**
   * MÉTODO PARA UAT: Fuerza la asignación de OWNER al usuario actual
   */
  forceOwnerRole(): boolean {
    if (this.currentSession) {
      console.log('🚀 UAT: Forzando rol OWNER para testing');
      this.currentSession.role = 'OWNER';
      localStorageService.saveTherapistData(this.currentSession);
      return true;
    }
    return false;
  }
}

// Instancia singleton
export const localAuthService = new LocalAuthService();
export default LocalAuthService; 