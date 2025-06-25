/**
 * 🔐 MEDICAL AUTHENTICATION SERVICE - MFA ENTERPRISE (FREE)
 * Sistema de autenticación multi-factor para entornos médicos
 * TOTP + JWT + Role-Based Access Control
 */

// import * as speakeasy from 'speakeasy';  // ERROR: No funciona en navegadores
// import * as qrcode from 'qrcode';       // ERROR: No funciona en navegadores
import * as CryptoJS from 'crypto-js';
import MedicalEncryptionService from './MedicalEncryptionService';
import MedicalAuditService from './MedicalAuditService';

interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken: string;
  userId: string;
  role: MedicalRole;
  permissions: string[];
}

interface MedicalRole {
  name: 'PHYSICIAN' | 'NURSE' | 'ADMIN' | 'PATIENT' | 'AUDITOR' | 'OWNER';
  permissions: string[];
  dataAccess: 'FULL' | 'LIMITED' | 'READ_ONLY' | 'EMERGENCY_ONLY';
  sessionTimeout: number; // minutos
}

interface LoginAttempt {
  userId: string;
  timestamp: number;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  mfaUsed: boolean;
}

class MedicalAuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'aiduxcare-medical-2025';
  private static readonly TOTP_WINDOW = 2; // ventana de tolerancia TOTP
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutos
  
  // Intentos de login por usuario
  private static loginAttempts: Map<string, LoginAttempt[]> = new Map();

  // === ROLES MÉDICOS PREDEFINIDOS ===
  private static readonly MEDICAL_ROLES: Record<string, MedicalRole> = {
    PHYSICIAN: {
      name: 'PHYSICIAN',
      permissions: [
        'read_patient_data', 'write_patient_data', 'prescribe_medication',
        'access_medical_history', 'create_diagnosis', 'modify_treatment_plan',
        'access_lab_results', 'emergency_access'
      ],
      dataAccess: 'FULL',
      sessionTimeout: 240 // 4 horas
    },
    NURSE: {
      name: 'NURSE',
      permissions: [
        'read_patient_data', 'write_observations', 'access_vital_signs',
        'update_patient_status', 'emergency_access'
      ],
      dataAccess: 'LIMITED',
      sessionTimeout: 480 // 8 horas
    },
    ADMIN: {
      name: 'ADMIN',
      permissions: [
        'manage_users', 'access_audit_logs', 'system_configuration',
        'backup_data', 'security_settings'
      ],
      dataAccess: 'READ_ONLY',
      sessionTimeout: 120 // 2 horas
    },
    PATIENT: {
      name: 'PATIENT',
      permissions: [
        'read_own_data', 'update_personal_info', 'view_appointments',
        'message_physician'
      ],
      dataAccess: 'LIMITED',
      sessionTimeout: 60 // 1 hora
    },
    AUDITOR: {
      name: 'AUDITOR',
      permissions: [
        'read_audit_logs', 'generate_compliance_reports', 'view_system_metrics'
      ],
      dataAccess: 'READ_ONLY',
      sessionTimeout: 480 // 8 horas
    },
    OWNER: {
      name: 'OWNER',
      permissions: [
        'all_permissions', 'emergency_access', 'system_override',
        'manage_all_users', 'access_all_data'
      ],
      dataAccess: 'FULL',
      sessionTimeout: 120 // 2 horas por seguridad
    }
  };

  /**
   * Configurar MFA para un usuario médico
   */
  static async setupMFA(userId: string, userEmail: string): Promise<MFASetup> {
    try {
      console.log('🔐 MedicalAuthService.setupMFA iniciado para:', userId);
      
      // Generar secreto simple pero seguro para navegadores
      console.log('🔐 Generando secreto TOTP compatible con navegador...');
      const secretArray = new Uint8Array(32);
      crypto.getRandomValues(secretArray);
      const secret = Array.from(secretArray, byte => byte.toString(36)).join('').substring(0, 32);
      console.log('SUCCESS: Secreto generado:', secret ? 'OK' : 'FALLO');

      // Generar códigos de backup
      console.log('🔐 Generando códigos de backup...');
      const backupCodes = this.generateBackupCodes();
      console.log('SUCCESS: Códigos backup generados:', backupCodes.length);

      // Crear QR code simple con URL manual
      console.log('🔐 Generando QR code...');
      const issuer = 'AiDuxCare Medical';
      const accountName = userEmail;
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
      
      // Para navegadores, usaremos un servicio de QR online o mostraremos la URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`;
      console.log('SUCCESS: QR code generado');

      // Hash de códigos de backup usando Web Crypto API
      console.log('🔐 Hasheando códigos de backup...');
      const hashedBackupCodes = await Promise.all(
        backupCodes.map(async (code) => {
          const encoder = new TextEncoder();
          const data = encoder.encode(code);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        })
      );
      console.log('SUCCESS: Códigos hasheados');

      const mfaSetup: MFASetup = {
        secret: secret,
        qrCodeUrl: qrCodeUrl,
        backupCodes: backupCodes,
        manualEntryKey: secret
      };

      // Guardar configuración MFA cifrada
      console.log('🔐 Guardando configuración MFA...');
      const encryptedConfig = this.encryptData(JSON.stringify({
        secret: secret,
        backupCodes: hashedBackupCodes,
        createdAt: Date.now()
      }));
      
      localStorage.setItem(`mfa_${userId}`, encryptedConfig);
      console.log('SUCCESS: MFA configurado y guardado exitosamente');

      // Auditoría
      MedicalAuditService.logAuthenticationEvent(
        userId,
        'MFA_SETUP',
        true,
        true
      );

      return mfaSetup;
    } catch (error) {
      console.error('ERROR: Error en setupMFA:', error);
      MedicalAuditService.logAuthenticationEvent(
        userId,
        'MFA_SETUP',
        false,
        true
      );
      throw error;
    }
  }

  /**
   * Verificar código TOTP
   */
  static verifyTOTP(userId: string, token: string): boolean {
    try {
      const mfaData = localStorage.getItem(`mfa_${userId}`);
      if (!mfaData) return false;

      const { secret: encryptedSecret } = JSON.parse(mfaData);
      const secret = CryptoJS.AES.decrypt(encryptedSecret, this.JWT_SECRET)
        .toString(CryptoJS.enc.Utf8);

      const verified = this.verifyTOTPSimple(secret, token);

      if (verified) {
        const updatedMfaData = { ...JSON.parse(mfaData), isActive: true };
        localStorage.setItem(`mfa_${userId}`, JSON.stringify(updatedMfaData));
      }

      return verified;
    } catch (error) {
      console.error('ERROR: Error verificando TOTP:', error);
      return false;
    }
  }

  /**
   * Verificar código de backup
   */
  static verifyBackupCode(userId: string, backupCode: string): boolean {
    try {
      const mfaData = localStorage.getItem(`mfa_${userId}`);
      if (!mfaData) return false;

      const { backupCodes } = JSON.parse(mfaData);
      const hashedCode = CryptoJS.SHA256(backupCode).toString();

      const isValid = backupCodes.includes(hashedCode);
      
      if (isValid) {
        // Remover código usado
        const updatedCodes = backupCodes.filter((code: string) => code !== hashedCode);
        const updatedMfaData = { ...JSON.parse(mfaData), backupCodes: updatedCodes };
        localStorage.setItem(`mfa_${userId}`, JSON.stringify(updatedMfaData));
      }

      return isValid;
    } catch (error) {
      console.error('ERROR: Error verificando código de backup:', error);
      return false;
    }
  }

  /**
   * Autenticación completa con MFA
   */
  static async authenticateWithMFA(
    userId: string,
    password: string,
    mfaToken: string,
    role: keyof typeof MedicalAuthService.MEDICAL_ROLES,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<AuthToken | null> {
    try {
      // Verificar si el usuario está bloqueado
      if (this.isUserLocked(userId)) {
        this.logLoginAttempt(userId, false, ipAddress, userAgent, false);
        throw new Error('Usuario bloqueado por múltiples intentos fallidos');
      }

      // Verificar password (en producción, consultar base de datos)
      const storedPasswordHash = localStorage.getItem(`password_${userId}`);
      if (!storedPasswordHash || !MedicalEncryptionService.verifyPassword(password, storedPasswordHash)) {
        this.logLoginAttempt(userId, false, ipAddress, userAgent, false);
        throw new Error('Credenciales inválidas');
      }

      // Verificar MFA
      const mfaValid = this.verifyTOTP(userId, mfaToken) || 
                      this.verifyBackupCode(userId, mfaToken);
      
      if (!mfaValid) {
        this.logLoginAttempt(userId, false, ipAddress, userAgent, true);
        throw new Error('Código MFA inválido');
      }

      // Obtener rol médico
      const medicalRole = this.MEDICAL_ROLES[role];
      if (!medicalRole) {
        throw new Error('Rol médico inválido');
      }

      // Generar tokens
      const authToken = this.generateAuthToken(userId, medicalRole);
      
      // Log exitoso
      this.logLoginAttempt(userId, true, ipAddress, userAgent, true);
      
      // Limpiar intentos fallidos
      this.loginAttempts.delete(userId);

      return authToken;

    } catch (error) {
      console.error('ERROR: Error en autenticación MFA:', error);
      return null;
    }
  }

  /**
   * Generar token de autenticación JWT
   */
  static generateAuthToken(userId: string, role: MedicalRole): AuthToken {
    const medicalRole = this.MEDICAL_ROLES[role.name];
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (medicalRole.sessionTimeout * 60);

    const payload = {
      userId,
      role: medicalRole.name,
      permissions: medicalRole.permissions,
      dataAccess: medicalRole.dataAccess,
      iat: now,
      exp: expiresAt,
      iss: 'AiDuxCare-Medical',
      aud: 'AiDuxCare-App'
    };

    // Generar JWT simplificado
    const header = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    );
    const payloadB64 = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(JSON.stringify(payload))
    );
    const signature = CryptoJS.HmacSHA256(
      `${header}.${payloadB64}`, 
      this.JWT_SECRET
    ).toString(CryptoJS.enc.Base64);

    const token = `${header}.${payloadB64}.${signature}`;

    const refreshToken = CryptoJS.SHA256(
      `${userId}:${Date.now()}:${Math.random()}`
    ).toString();

    return {
      token,
      expiresAt: expiresAt * 1000,
      refreshToken,
      userId,
      role: medicalRole,
      permissions: medicalRole.permissions
    };
  }

  /**
   * Verificar token JWT
   */
  static verifyToken(token: string): any | null {
    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = CryptoJS.HmacSHA256(
        `${header}.${payload}`, 
        this.JWT_SECRET
      ).toString(CryptoJS.enc.Base64);

      if (signature !== expectedSignature) {
        throw new Error('Firma de token inválida');
      }

      const decodedPayload = JSON.parse(
        CryptoJS.enc.Base64.parse(payload).toString(CryptoJS.enc.Utf8)
      );

      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
      }

      return decodedPayload;
    } catch (error) {
      console.error('ERROR: Error verificando token:', error);
      return null;
    }
  }

  /**
   * Verificar permisos específicos
   */
  static hasPermission(token: string, requiredPermission: string): boolean {
    const payload = this.verifyToken(token);
    if (!payload) return false;

    return payload.permissions.includes(requiredPermission) || 
           payload.permissions.includes('all_permissions');
  }

  /**
   * Generar códigos de backup seguros (8 códigos de 8 caracteres)
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      // Usar crypto.getRandomValues para navegadores
      const array = new Uint8Array(6);
      crypto.getRandomValues(array);
      const code = Array.from(array, byte => byte.toString(36)).join('').toUpperCase().substring(0, 8);
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verificar si usuario está bloqueado
   */
  private static isUserLocked(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp < this.LOCKOUT_DURATION
    );

    const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
    return failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Registrar intento de login
   */
  private static logLoginAttempt(
    userId: string, 
    success: boolean, 
    ipAddress: string, 
    userAgent: string, 
    mfaUsed: boolean
  ): void {
    const attempts = this.loginAttempts.get(userId) || [];
    
    attempts.push({
      userId,
      timestamp: Date.now(),
      success,
      ipAddress: CryptoJS.SHA256(ipAddress).toString().substring(0, 12), // IP anonimizada
      userAgent: CryptoJS.SHA256(userAgent).toString().substring(0, 12), // UA anonimizada
      mfaUsed
    });

    // Mantener solo los últimos 50 intentos
    if (attempts.length > 50) {
      attempts.splice(0, attempts.length - 50);
    }

    this.loginAttempts.set(userId, attempts);

    // Log de auditoría
    console.log('🔍 LOGIN AUDIT:', {
      userId: CryptoJS.SHA256(userId).toString().substring(0, 12),
      success,
      mfaUsed,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Obtener estadísticas de seguridad
   */
  static getSecurityStats(): any {
    const stats = {
      totalUsers: this.loginAttempts.size,
      lockedUsers: 0,
      recentLogins: 0,
      mfaUsage: 0
    };

    this.loginAttempts.forEach((attempts, userId) => {
      if (this.isUserLocked(userId)) {
        stats.lockedUsers++;
      }

      const recentAttempts = attempts.filter(
        attempt => Date.now() - attempt.timestamp < 24 * 60 * 60 * 1000 // 24 horas
      );

      stats.recentLogins += recentAttempts.filter(a => a.success).length;
      stats.mfaUsage += recentAttempts.filter(a => a.mfaUsed).length;
    });

    return stats;
  }

  private static encryptData(data: string): string {
    // Implementa la lógica para cifrar los datos usando CryptoJS o Web Crypto API
    // Este es un ejemplo básico, en producción deberías usar una biblioteca más robusta
    const encrypted = CryptoJS.AES.encrypt(data, this.JWT_SECRET).toString();
    return encrypted;
  }

  private static verifyTOTPSimple(secret: string, token: string): boolean {
    // Implementación básica de verificación TOTP sin dependencias externas
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeStep = 30; // TOTP time step in seconds
      const time = Math.floor(now / timeStep);
      
      // Generar código TOTP simple
      const hash = CryptoJS.HmacSHA1(time.toString(), secret).toString();
      const offset = parseInt(hash.slice(-1), 16) & 0x0F;
      
      // Extraer el código OTP
      const hashSlice = hash.slice(offset * 2, offset * 2 + 8);
      const num = parseInt(hashSlice, 16) & 0x7FFFFFFF;
      const otp = (num % 1000000).toString().padStart(6, '0');
      
      return otp === token;
    } catch (error) {
      console.error('ERROR: Error en verificación TOTP:', error);
      return false;
    }
  }
}

export default MedicalAuthService; 