/**
 * 🏛️ Legal Consent Service - AiDuxCare V.2
 * Servicio para manejo seguro del consentimiento legal
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

export interface LegalConsent {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  medicalDisclaimerAccepted: boolean;
  consentTimestamp: Date | null;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  version: string;
}

export interface ConsentAuditLog {
  id: string;
  userId: string;
  action: 'GRANTED' | 'REVOKED' | 'UPDATED';
  consentType: 'TERMS' | 'PRIVACY' | 'MEDICAL_DISCLAIMER';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
  metadata?: Record<string, unknown>;
}

export class LegalConsentService {
  private static instance: LegalConsentService;
  private consentStorageKey = 'aiduxcare_legal_consent';
  private auditLogKey = 'aiduxcare_consent_audit';

  private constructor() {}

  public static getInstance(): LegalConsentService {
    if (!LegalConsentService.instance) {
      LegalConsentService.instance = new LegalConsentService();
    }
    return LegalConsentService.instance;
  }

  /**
   * Guarda el consentimiento legal de forma segura
   */
  public async saveConsent(consent: LegalConsent): Promise<void> {
    try {
      // Validar que todos los consentimientos estén aceptados
      if (!this.validateConsent(consent)) {
        throw new Error('Todos los consentimientos deben ser aceptados');
      }

      // Agregar metadatos de auditoría
      const consentWithMetadata: LegalConsent = {
        ...consent,
        version: '1.0.0',
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        // IP address se obtendría del backend en producción
      };

      // Guardar en localStorage (en producción sería en base de datos)
      localStorage.setItem(this.consentStorageKey, JSON.stringify(consentWithMetadata));

      // Registrar en auditoría
      await this.logConsentAction({
        action: 'GRANTED',
        consentType: 'TERMS',
        userId: consent.userId || 'anonymous',
        timestamp: new Date(),
        ipAddress: 'client-side', // En producción se obtendría del servidor
        userAgent: navigator.userAgent,
        version: '1.0.0'
      });

      console.log('✅ Consentimiento legal guardado exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar consentimiento:', error);
      throw error;
    }
  }

  /**
   * Obtiene el consentimiento actual del usuario
   */
  public getCurrentConsent(): LegalConsent | null {
    try {
      const stored = localStorage.getItem(this.consentStorageKey);
      if (!stored) return null;

      const consent = JSON.parse(stored) as LegalConsent;
      return {
        ...consent,
        consentTimestamp: consent.consentTimestamp ? new Date(consent.consentTimestamp) : null
      };
    } catch (error) {
      console.error('❌ Error al obtener consentimiento:', error);
      return null;
    }
  }

  /**
   * Verifica si el usuario tiene consentimiento válido
   */
  public hasValidConsent(): boolean {
    const consent = this.getCurrentConsent();
    if (!consent) return false;

    return this.validateConsent(consent);
  }

  /**
   * Valida que todos los consentimientos requeridos estén aceptados
   */
  private validateConsent(consent: LegalConsent): boolean {
    return (
      consent.termsAccepted &&
      consent.privacyAccepted &&
      consent.medicalDisclaimerAccepted &&
      consent.consentTimestamp !== null
    );
  }

  /**
   * Revoca el consentimiento del usuario
   */
  public async revokeConsent(userId: string): Promise<void> {
    try {
      // Eliminar consentimiento
      localStorage.removeItem(this.consentStorageKey);

      // Registrar revocación
      await this.logConsentAction({
        action: 'REVOKED',
        consentType: 'TERMS',
        userId,
        timestamp: new Date(),
        ipAddress: 'client-side',
        userAgent: navigator.userAgent,
        version: '1.0.0'
      });

      console.log('✅ Consentimiento revocado exitosamente');
    } catch (error) {
      console.error('❌ Error al revocar consentimiento:', error);
      throw error;
    }
  }

  /**
   * Registra acciones de consentimiento para auditoría
   */
  private async logConsentAction(auditEntry: Omit<ConsentAuditLog, 'id'>): Promise<void> {
    try {
      const auditLog = this.getAuditLog();
      const newEntry: ConsentAuditLog = {
        ...auditEntry,
        id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      auditLog.push(newEntry);
      localStorage.setItem(this.auditLogKey, JSON.stringify(auditLog));

      // En producción, esto se enviaría al servidor
      console.log('📝 Acción de consentimiento registrada:', newEntry);
    } catch (error) {
      console.error('❌ Error al registrar acción de consentimiento:', error);
    }
  }

  /**
   * Obtiene el log de auditoría
   */
  private getAuditLog(): ConsentAuditLog[] {
    try {
      const stored = localStorage.getItem(this.auditLogKey);
      if (!stored) return [];

      const log = JSON.parse(stored) as ConsentAuditLog[];
      return log.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('❌ Error al obtener log de auditoría:', error);
      return [];
    }
  }

  /**
   * Genera un reporte de consentimiento para compliance
   */
  public generateConsentReport(): {
    hasValidConsent: boolean;
    consentDate: Date | null;
    lastUpdated: Date | null;
    auditEntries: number;
  } {
    const consent = this.getCurrentConsent();
    const auditLog = this.getAuditLog();

    return {
      hasValidConsent: this.hasValidConsent(),
      consentDate: consent?.consentTimestamp || null,
      lastUpdated: consent?.consentTimestamp || null,
      auditEntries: auditLog.length
    };
  }

  /**
   * Exporta datos de consentimiento para cumplimiento regulatorio
   */
  public exportConsentData(): {
    consent: LegalConsent | null;
    auditLog: ConsentAuditLog[];
    report: ReturnType<typeof this.generateConsentReport>;
  } {
    return {
      consent: this.getCurrentConsent(),
      auditLog: this.getAuditLog(),
      report: this.generateConsentReport()
    };
  }
}

// Exportar instancia singleton
export const legalConsentService = LegalConsentService.getInstance(); 