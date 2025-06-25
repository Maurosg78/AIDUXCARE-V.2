/**
 * 🔐 MEDICAL ENCRYPTION SERVICE - ENTERPRISE GRADE (FREE)
 * Cifrado de grado hospitalario usando herramientas nativas
 * HIPAA/GDPR Compliant - Field Level Encryption
 */

import CryptoJS from 'crypto-js';

interface EncryptedMedicalData {
  data: string;
  iv: string;
  salt: string;
  timestamp: string;
  version: string;
}

interface MedicalField {
  fieldName: string;
  classification: 'PUBLIC' | 'SENSITIVE' | 'RESTRICTED' | 'PHI';
  requiresAudit: boolean;
}

class MedicalEncryptionService {
  private static readonly ALGORITHM = 'aes-256-cbc'; // Cambiado a CBC
  private static readonly ITERATIONS = 100000; // PBKDF2 iterations
  private static readonly MASTER_KEY = 'aiduxcare-medical-encryption-key-2025'; // Clave maestra por defecto

  // === MEDICAL FIELD CLASSIFICATIONS ===
  private static readonly MEDICAL_FIELDS: Record<string, MedicalField> = {
    // PHI (Protected Health Information) - Máxima protección
    'patientName': { fieldName: 'patientName', classification: 'PHI', requiresAudit: true },
    'patientId': { fieldName: 'patientId', classification: 'PHI', requiresAudit: true },
    'diagnosis': { fieldName: 'diagnosis', classification: 'RESTRICTED', requiresAudit: true },
    'medications': { fieldName: 'medications', classification: 'RESTRICTED', requiresAudit: true },
    'medicalHistory': { fieldName: 'medicalHistory', classification: 'RESTRICTED', requiresAudit: true },
    'symptoms': { fieldName: 'symptoms', classification: 'SENSITIVE', requiresAudit: false },
    'observations': { fieldName: 'observations', classification: 'SENSITIVE', requiresAudit: false }
  };

  /**
   * Obtener clave maestra
   */
  private static getMasterKey(): string {
    return this.MASTER_KEY;
  }

  /**
   * Cifrar datos médicos con clasificación automática
   */
  static encryptMedicalData(
    data: any, 
    masterPassword: string, 
    userId: string
  ): Record<string, EncryptedMedicalData> {
    const encryptedFields: Record<string, EncryptedMedicalData> = {};

    // Procesar cada campo según su clasificación
    Object.entries(data).forEach(([fieldName, fieldValue]) => {
      const fieldConfig = this.MEDICAL_FIELDS[fieldName];
      const classification = fieldConfig?.classification || 'SENSITIVE';
      
      // Solo cifrar campos sensibles o superiores
      if (['SENSITIVE', 'RESTRICTED', 'PHI'].includes(classification)) {
        const salt = CryptoJS.lib.WordArray.random(256/8);
        const iv = CryptoJS.lib.WordArray.random(128/8);
        
        // Crear contexto de cifrado único por campo
        const fieldContext = `${userId}:${fieldName}:${Date.now()}`;
        const fieldKey = CryptoJS.PBKDF2(masterPassword, fieldContext, {
          keySize: 256/32,
          iterations: 10000
        });
        
        // Cifrar con AES-256-CBC
        const encrypted = CryptoJS.AES.encrypt(
          JSON.stringify(fieldValue),
          fieldKey,
          {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );
        
        encryptedFields[fieldName] = {
          data: encrypted.toString(),
          iv: iv.toString(),
          salt: salt.toString(),
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        // Audit log para campos PHI
        if (fieldConfig?.requiresAudit) {
          this.logFieldAccess(userId, fieldName, 'ENCRYPT', classification);
        }
      }
    });

    return encryptedFields;
  }

  /**
   * Descifrar datos médicos
   */
  static decryptMedicalData(
    encryptedFields: Record<string, EncryptedMedicalData>,
    masterPassword: string,
    userId: string
  ): any {
    const decryptedData: any = {};

    Object.entries(encryptedFields).forEach(([fieldName, encryptedField]) => {
      try {
        const salt = CryptoJS.enc.Hex.parse(encryptedField.salt);
        const iv = CryptoJS.enc.Hex.parse(encryptedField.iv);

        // Recrear contexto de cifrado
        const fieldContext = `${userId}:${fieldName}:${encryptedField.timestamp}`;
        const fieldKey = CryptoJS.PBKDF2(masterPassword, fieldContext, {
          keySize: 256/32,
          iterations: 10000
        });

        // Descifrar usando CBC (consistente con cifrado)
        const decrypted = CryptoJS.AES.decrypt(
          encryptedField.data,
          fieldKey,
          {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
          }
        );

        decryptedData[fieldName] = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

        // Audit log para campos PHI
        const fieldConfig = this.MEDICAL_FIELDS[fieldName];
        if (fieldConfig?.requiresAudit) {
          this.logFieldAccess(userId, fieldName, 'DECRYPT', fieldConfig.classification);
        }

      } catch (error) {
        console.error(`ERROR: Error descifrando campo ${fieldName}:`, error);
      }
    });

    return decryptedData;
  }

  /**
   * Generar hash seguro para passwords
   */
  static hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128/8);
    const hash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512/32,
      iterations: this.ITERATIONS
    });
    return `${salt.toString()}:${hash.toString()}`;
  }

  /**
   * Verificar password
   */
  static verifyPassword(password: string, hash: string): boolean {
    const [saltStr, originalHash] = hash.split(':');
    const salt = CryptoJS.enc.Hex.parse(saltStr);
    const testHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 512/32,
      iterations: this.ITERATIONS
    });
    return testHash.toString() === originalHash;
  }

  /**
   * Anonimizar datos para logs (GDPR compliant)
   */
  static anonymizeForLogs(data: any): any {
    const anonymized = { ...data };
    
    // Campos que deben ser anonimizados
    const sensitiveFields = ['patientName', 'patientId', 'diagnosis', 'medications'];
    
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        // Crear hash consistente para el mismo valor
        const hash = CryptoJS.SHA256(anonymized[field].toString()).toString();
        anonymized[field] = `***${hash.substring(0, 8)}`;
      }
    });

    return anonymized;
  }

  /**
   * Log de acceso a campos médicos (Audit Trail)
   */
  private static logFieldAccess(
    userId: string, 
    fieldName: string, 
    action: 'ENCRYPT' | 'DECRYPT' | 'ACCESS', 
    classification: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: CryptoJS.SHA256(userId).toString().substring(0, 12), // Usuario anonimizado
      fieldName,
      action,
      classification,
      sessionId: this.generateSessionId()
    };

    console.log('🔍 MEDICAL AUDIT:', logEntry);
  }

  /**
   * Generar ID de sesión único
   */
  private static generateSessionId(): string {
    return CryptoJS.SHA256(Date.now().toString() + Math.random().toString()).toString().substring(0, 16);
  }
}

export default MedicalEncryptionService; 