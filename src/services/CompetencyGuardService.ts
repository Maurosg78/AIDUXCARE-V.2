// @ts-nocheck
import { professionalCompetencyService } from './ProfessionalCompetencyService';

import logger from '@/shared/utils/logger';

export interface CompetencyGuardResult {
  isAllowed: boolean;
  warning?: {
    message: string;
    recommendation: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  silentLog?: {
    competency: string;
    region: string;
    timestamp: string;
    result: 'safe' | 'warned' | 'blocked';
  };
}

/**
 * Servicio Guard para verificación silenciosa de competencias
 * Funciona en segundo plano para salvaguardar la práctica profesional
 */
class CompetencyGuardService {
  private userRegion: string = 'Madrid'; // Por defecto, se detectaría automáticamente
  private userCertifications: string[] = [];
  private isPublicSector: boolean = false;

  /**
   * Configura el contexto del usuario (se llamaría automáticamente al login)
   */
  setUserContext(region: string, certifications: string[], publicSector: boolean = false) {
    this.userRegion = region;
    this.userCertifications = certifications;
    this.isPublicSector = publicSector;
    
    console.log('🔒 CompetencyGuard configurado:', {
      region: this.userRegion,
      certifications: this.userCertifications.length,
      publicSector: this.isPublicSector
    });
  }

  /**
   * Verificación silenciosa antes de permitir una acción
   * Retorna true si es seguro, false si debe bloquearse
   */
  async checkBeforeAction(competencyId: string): Promise<CompetencyGuardResult> {
    try {
      const check = await professionalCompetencyService.simulateSilentCheck(
        competencyId,
        this.userRegion,
        this.userCertifications
      );

      const result: CompetencyGuardResult = {
        isAllowed: check.isSafe,
        silentLog: {
          competency: competencyId,
          region: this.userRegion,
          timestamp: new Date().toISOString(),
          result: check.isSafe ? 'safe' : (check.shouldWarn ? 'warned' : 'blocked')
        }
      };

      // Solo mostrar advertencia si es necesario
      if (check.shouldWarn && check.warningMessage) {
        result.warning = {
          message: check.warningMessage,
          recommendation: check.recommendation || 'Contactar con soporte',
          riskLevel: check.riskLevel === 'none' ? 'low' : check.riskLevel
        };
      }

      // Log silencioso para auditoría
      this.logCompetencyCheck(result);

      return result;
    } catch (error) {
      console.error('Error en verificación de competencia:', error);
      return {
        isAllowed: false,
        warning: {
          message: 'Error en verificación de competencia',
          recommendation: 'Contactar con soporte técnico',
          riskLevel: 'high'
        }
      };
    }
  }

  /**
   * Verificación para técnicas invasivas (más estricta)
   */
  async checkInvasiveTechnique(techniqueId: string): Promise<CompetencyGuardResult> {
    const result = await this.checkBeforeAction(techniqueId);
    
    // Para técnicas invasivas, siempre verificar certificación
    if (result.isAllowed && !this.hasInvasiveCertification(techniqueId)) {
      return {
        isAllowed: false,
        warning: {
          message: 'Certificación requerida para técnica invasiva',
          recommendation: 'Obtener formación especializada antes de continuar',
          riskLevel: 'high'
        },
        silentLog: {
          competency: techniqueId,
          region: this.userRegion,
          timestamp: new Date().toISOString(),
          result: 'blocked'
        }
      };
    }

    return result;
  }

  /**
   * Verificación para prescripción de productos sanitarios
   */
  async checkPrescriptionAuthority(): Promise<CompetencyGuardResult> {
    // Verificar si el usuario tiene autoridad para prescribir
    const hasPrescriptionAuth = this.userCertifications.some(cert => 
      cert.toLowerCase().includes('prescripción') ||
      cert.toLowerCase().includes('prescription')
    );

    if (!hasPrescriptionAuth) {
      return {
        isAllowed: false,
        warning: {
          message: 'Autorización de prescripción requerida',
          recommendation: 'Verificar competencias de prescripción con el colegio profesional',
          riskLevel: 'high'
        },
        silentLog: {
          competency: 'prescription-authority',
          region: this.userRegion,
          timestamp: new Date().toISOString(),
          result: 'blocked'
        }
      };
    }

    return {
      isAllowed: true,
      silentLog: {
        competency: 'prescription-authority',
        region: this.userRegion,
        timestamp: new Date().toISOString(),
        result: 'safe'
      }
    };
  }

  /**
   * Verificar si tiene certificación para técnicas invasivas
   */
  private hasInvasiveCertification(techniqueId: string): boolean {
    const invasiveTechniques = [
      'invasive-dry-needling',
      'invasive-ventilation',
      'advanced-ultrasound'
    ];

    if (!invasiveTechniques.includes(techniqueId)) {
      return true; // No es invasiva
    }

    return this.userCertifications.some(cert => 
      cert.toLowerCase().includes(techniqueId.replace('invasive-', '')) ||
      cert.toLowerCase().includes('invasiva') ||
      cert.toLowerCase().includes('invasive')
    );
  }

  /**
   * Log silencioso para auditoría (no visible al usuario)
   */
  private logCompetencyCheck(result: CompetencyGuardResult) {
    if (result.silentLog) {
      console.log('🔒 CompetencyGuard Log:', {
        ...result.silentLog,
        userRegion: this.userRegion,
        hasCertifications: this.userCertifications.length > 0,
        publicSector: this.isPublicSector
      });
    }
  }

  /**
   * Obtener estadísticas de uso (solo para administradores)
   */
  getGuardStatistics() {
    return {
      userRegion: this.userRegion,
      certificationCount: this.userCertifications.length,
      publicSector: this.isPublicSector,
      lastCheck: new Date().toISOString()
    };
  }
}

export const competencyGuardService = new CompetencyGuardService(); 