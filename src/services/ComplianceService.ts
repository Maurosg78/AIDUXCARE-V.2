import ProfessionalProfileService from './ProfessionalProfileService';

import logger from '@/shared/utils/logger';
/**
 * ⚖️ Compliance Service - AiDuxCare V.2
 * Sistema de compliance automático para HIPAA/GDPR y normativas por país
 * Implementación del Blueprint Oficial
 */


export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: 'data_protection' | 'medical_practice' | 'documentation' | 'referral';
  country: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  professionalProfileId: string;
  actionRequired: string;
  isResolved: boolean;
}

export interface DataRetentionPolicy {
  transcriptionRetentionHours: number;
  soapRetentionDays: number;
  auditLogRetentionYears: number;
  automaticDeletion: boolean;
  encryptionRequired: boolean;
}

export interface ComplianceReport {
  professionalProfileId: string;
  timestamp: Date;
  violations: ComplianceViolation[];
  complianceScore: number;
  recommendations: string[];
  nextAuditDate: Date;
}

export class ComplianceService {
  private static instance: ComplianceService;
  private profileService: ProfessionalProfileService;
  private violations: Map<string, ComplianceViolation[]> = new Map();
  
  // Base de reglas de compliance por país
  private complianceRules: Map<string, ComplianceRule[]> = new Map();

  private constructor() {
    this.profileService = ProfessionalProfileService.getInstance();
    this.initializeComplianceRules();
  }

  static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  /**
   * Inicializar reglas de compliance por país
   */
  private initializeComplianceRules(): void {
    // Reglas para España
    this.complianceRules.set('España', [
      {
        id: 'ES-001',
        name: 'Prohibición de Prescripción de Medicamentos',
        description: 'Los fisioterapeutas no pueden prescribir medicamentos en España',
        category: 'medical_practice',
        country: 'España',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'ES-002',
        name: 'Ley de Protección de Datos (GDPR)',
        description: 'Cumplimiento del Reglamento General de Protección de Datos',
        category: 'data_protection',
        country: 'España',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'ES-003',
        name: 'Documentación Clínica Obligatoria',
        description: 'Historia clínica y consentimiento informado obligatorios',
        category: 'documentation',
        country: 'España',
        severity: 'high',
        isActive: true
      },
      {
        id: 'ES-004',
        name: 'Manipulaciones Vertebrales',
        description: 'Manipulaciones vertebrales requieren formación específica',
        category: 'medical_practice',
        country: 'España',
        severity: 'high',
        isActive: true
      }
    ]);

    // Reglas para México
    this.complianceRules.set('México', [
      {
        id: 'MX-001',
        name: 'Prohibición de Prescripción de Medicamentos',
        description: 'Los fisioterapeutas no pueden prescribir medicamentos en México',
        category: 'medical_practice',
        country: 'México',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'MX-002',
        name: 'Ley General de Protección de Datos (LGPD)',
        description: 'Cumplimiento de la LGPD mexicana',
        category: 'data_protection',
        country: 'México',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'MX-003',
        name: 'Acupuntura Requiere Certificación',
        description: 'Acupuntura requiere certificación específica en México',
        category: 'medical_practice',
        country: 'México',
        severity: 'high',
        isActive: true
      },
      {
        id: 'MX-004',
        name: 'NOM-035 Compliance',
        description: 'Cumplimiento de la NOM-035 para factores de riesgo psicosocial',
        category: 'documentation',
        country: 'México',
        severity: 'medium',
        isActive: true
      }
    ]);

    // Reglas para Estados Unidos
    this.complianceRules.set('Estados Unidos', [
      {
        id: 'US-001',
        name: 'HIPAA Compliance',
        description: 'Cumplimiento de la Ley de Portabilidad y Responsabilidad de Seguros de Salud',
        category: 'data_protection',
        country: 'Estados Unidos',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'US-002',
        name: 'Prohibición de Prescripción de Medicamentos',
        description: 'Los fisioterapeutas no pueden prescribir medicamentos en EE.UU.',
        category: 'medical_practice',
        country: 'Estados Unidos',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'US-003',
        name: 'State-Specific Regulations',
        description: 'Cumplimiento de regulaciones específicas del estado',
        category: 'medical_practice',
        country: 'Estados Unidos',
        severity: 'high',
        isActive: true
      },
      {
        id: 'US-004',
        name: 'HITECH Act Compliance',
        description: 'Cumplimiento de la Ley HITECH para tecnología de información de salud',
        category: 'data_protection',
        country: 'Estados Unidos',
        severity: 'high',
        isActive: true
      }
    ]);

    // Reglas para Canadá
    this.complianceRules.set('Canadá', [
      {
        id: 'CA-001',
        name: 'PIPEDA Compliance',
        description: 'Cumplimiento de la Ley de Protección de Información Personal y Documentos Electrónicos',
        category: 'data_protection',
        country: 'Canadá',
        severity: 'critical',
        isActive: true
      },
      {
        id: 'CA-002',
        name: 'Provincial Health Acts',
        description: 'Cumplimiento de leyes de salud provinciales',
        category: 'medical_practice',
        country: 'Canadá',
        severity: 'high',
        isActive: true
      },
      {
        id: 'CA-003',
        name: 'Prohibición de Prescripción de Medicamentos',
        description: 'Los fisioterapeutas no pueden prescribir medicamentos en Canadá',
        category: 'medical_practice',
        country: 'Canadá',
        severity: 'critical',
        isActive: true
      }
    ]);
  }

  /**
   * Verificar compliance de una sugerencia o técnica
   */
  async checkCompliance(
    professionalProfileId: string,
    content: string,
    category: 'suggestion' | 'technique' | 'documentation' | 'data_handling'
  ): Promise<{ compliant: boolean; violations: ComplianceViolation[]; recommendations: string[] }> {
    const profile = this.profileService.getProfile(professionalProfileId);
    if (!profile) {
      return {
        compliant: false,
        violations: [{
          id: `violation-${Date.now()}`,
          ruleId: 'PROFILE-001',
          ruleName: 'Perfil Profesional No Encontrado',
          description: 'No se pudo verificar compliance: perfil profesional no encontrado',
          severity: 'critical',
          timestamp: new Date(),
          professionalProfileId,
          actionRequired: 'Crear o actualizar perfil profesional',
          isResolved: false
        }],
        recommendations: ['Crear perfil profesional completo']
      };
    }

    const countryRules = this.complianceRules.get(profile.country) || [];
    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];

    // Verificar reglas específicas por categoría
    for (const rule of countryRules) {
      if (!rule.isActive) continue;

      let isViolated = false;
      const violationDescription = '';

      switch (category) {
        case 'suggestion':
          isViolated = this.checkSuggestionCompliance(content, rule);
          break;
        case 'technique':
          isViolated = this.checkTechniqueCompliance(content, rule);
          break;
        case 'documentation':
          isViolated = this.checkDocumentationCompliance(content, rule);
          break;
        case 'data_handling':
          isViolated = this.checkDataHandlingCompliance(content, rule);
          break;
      }

      if (isViolated) {
        const violation: ComplianceViolation = {
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          description: violationDescription || rule.description,
          severity: rule.severity,
          timestamp: new Date(),
          professionalProfileId,
          actionRequired: this.getActionRequired(rule),
          isResolved: false
        };

        violations.push(violation);
        recommendations.push(this.getRecommendation(rule));
      }
    }

    // Guardar violaciones
    if (violations.length > 0) {
      const existingViolations = this.violations.get(professionalProfileId) || [];
      this.violations.set(professionalProfileId, [...existingViolations, ...violations]);
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Verificar compliance de sugerencias
   */
  private checkSuggestionCompliance(content: string, rule: ComplianceRule): boolean {
    const contentLower = content.toLowerCase();
    
    switch (rule.id) {
      case 'ES-001':
      case 'MX-001':
      case 'US-002':
      case 'CA-003':
        // Verificar sugerencias de medicamentos
        return contentLower.includes('medicamento') || 
               contentLower.includes('fármaco') || 
               contentLower.includes('medication') ||
               contentLower.includes('drug') ||
               contentLower.includes('prescription');
      
      default:
        return false;
    }
  }

  /**
   * Verificar compliance de técnicas
   */
  private checkTechniqueCompliance(content: string, rule: ComplianceRule): boolean {
    const contentLower = content.toLowerCase();
    
    switch (rule.id) {
      case 'ES-004':
        // Verificar manipulaciones vertebrales sin certificación
        if (contentLower.includes('manipulación vertebral') || contentLower.includes('manipulation')) {
          return true; // Siempre violación si no hay certificación
        }
        break;
      
      case 'MX-003':
        // Verificar acupuntura sin certificación
        if (contentLower.includes('acupuntura') || contentLower.includes('acupuncture')) {
          return true; // Siempre violación si no hay certificación
        }
        break;
    }
    
    return false;
  }

  /**
   * Verificar compliance de documentación
   */
  private checkDocumentationCompliance(content: string, rule: ComplianceRule): boolean {
    // Verificar que la documentación incluya elementos obligatorios
    switch (rule.id) {
      case 'ES-003':
        return !content.includes('consentimiento') && !content.includes('historia clínica');
      
      case 'MX-004':
        return !content.includes('factores de riesgo psicosocial');
      
      default:
        return false;
    }
  }

  /**
   * Verificar compliance de manejo de datos
   */
  private checkDataHandlingCompliance(content: string, rule: ComplianceRule): boolean {
    // Verificar políticas de retención y eliminación de datos
    switch (rule.id) {
      case 'ES-002':
      case 'MX-002':
      case 'US-001':
      case 'CA-001':
        return content.includes('transcripción') && !content.includes('eliminación automática');
      
      default:
        return false;
    }
  }

  /**
   * Obtener acción requerida para una violación
   */
  private getActionRequired(rule: ComplianceRule): string {
    switch (rule.id) {
      case 'ES-001':
      case 'MX-001':
      case 'US-002':
      case 'CA-003':
        return 'Eliminar sugerencia de medicamento y derivar al médico';
      
      case 'ES-004':
        return 'Obtener certificación en manipulaciones vertebrales o usar técnicas alternativas';
      
      case 'MX-003':
        return 'Obtener certificación en acupuntura o usar técnicas alternativas';
      
      case 'ES-003':
        return 'Incluir consentimiento informado y historia clínica completa';
      
      case 'ES-002':
      case 'MX-002':
      case 'US-001':
      case 'CA-001':
        return 'Implementar eliminación automática de transcripciones según normativa';
      
      default:
        return 'Revisar y corregir según normativas locales';
    }
  }

  /**
   * Obtener recomendación para una violación
   */
  private getRecommendation(rule: ComplianceRule): string {
    switch (rule.id) {
      case 'ES-001':
      case 'MX-001':
      case 'US-002':
      case 'CA-003':
        return `En ${rule.country} está prohibido que fisioterapeutas prescriban medicamentos. Derivar al médico.`;
      
      case 'ES-004':
        return 'Considerar obtener certificación en manipulaciones vertebrales o usar técnicas alternativas.';
      
      case 'MX-003':
        return 'Considerar obtener certificación en acupuntura o usar técnicas alternativas.';
      
      case 'ES-003':
        return 'Asegurar que toda documentación incluya consentimiento informado y historia clínica.';
      
      case 'ES-002':
      case 'MX-002':
      case 'US-001':
      case 'CA-001':
        return 'Implementar eliminación automática de datos sensibles según normativa local.';
      
      default:
        return 'Revisar normativas específicas del país para cumplimiento completo.';
    }
  }

  /**
   * Obtener política de retención de datos por país
   */
  getDataRetentionPolicy(country: string): DataRetentionPolicy {
    switch (country) {
      case 'España':
        return {
          transcriptionRetentionHours: 1,
          soapRetentionDays: 15,
          auditLogRetentionYears: 5,
          automaticDeletion: true,
          encryptionRequired: true
        };
      
      case 'México':
        return {
          transcriptionRetentionHours: 1,
          soapRetentionDays: 10,
          auditLogRetentionYears: 3,
          automaticDeletion: true,
          encryptionRequired: true
        };
      
      case 'Estados Unidos':
        return {
          transcriptionRetentionHours: 1,
          soapRetentionDays: 7,
          auditLogRetentionYears: 6,
          automaticDeletion: true,
          encryptionRequired: true
        };
      
      case 'Canadá':
        return {
          transcriptionRetentionHours: 1,
          soapRetentionDays: 10,
          auditLogRetentionYears: 7,
          automaticDeletion: true,
          encryptionRequired: true
        };
      
      default:
        return {
          transcriptionRetentionHours: 1,
          soapRetentionDays: 15,
          auditLogRetentionYears: 5,
          automaticDeletion: true,
          encryptionRequired: true
        };
    }
  }

  /**
   * Generar reporte de compliance
   */
  async generateComplianceReport(professionalProfileId: string): Promise<ComplianceReport> {
    const profile = await this.profileService.getProfile(professionalProfileId);
    const violations = this.getViolations(professionalProfileId);
    
    if (!profile) {
      return {
        professionalProfileId,
        timestamp: new Date(),
        violations: [],
        complianceScore: 0,
        recommendations: ['Crear perfil profesional'],
        nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      };
    }
    
    // Calcular score de compliance
    const totalRules = this.complianceRules.get(profile.country)?.length || 0;
    const violationCount = violations.length;
    const complianceScore = totalRules > 0 ? Math.max(0, 100 - (violationCount * 10)) : 100;

    const recommendations = violations.map(v => {
      const rule = this.complianceRules.get(profile.country)?.find(r => r.id === v.ruleId);
      return rule ? this.getRecommendation(rule) : 'Revisar normativas específicas del país';
    });

    return {
      professionalProfileId,
      timestamp: new Date(),
      violations,
      complianceScore,
      recommendations: [...new Set(recommendations)],
      nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    };
  }

  /**
   * Resolver una violación de compliance
   */
  resolveViolation(professionalProfileId: string, violationId: string): boolean {
    const violations = this.violations.get(professionalProfileId);
    if (!violations) return false;

    const violation = violations.find(v => v.id === violationId);
    if (!violation) return false;

    violation.isResolved = true;
    this.violations.set(professionalProfileId, violations);
    
    console.log(`✅ Violación de compliance resuelta: ${violationId}`);
    return true;
  }

  /**
   * Obtener todas las violaciones de un profesional
   */
  getViolations(professionalProfileId: string): ComplianceViolation[] {
    return this.violations.get(professionalProfileId) || [];
  }

  /**
   * Limpiar violaciones resueltas antiguas
   */
  cleanResolvedViolations(): void {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 días
    
    for (const [profileId, violations] of this.violations.entries()) {
      const activeViolations = violations.filter(v => 
        !v.isResolved || v.timestamp > cutoffDate
      );
      this.violations.set(profileId, activeViolations);
    }
    
    console.log('🧹 Violaciones de compliance resueltas limpiadas');
  }
}

export default ComplianceService; 