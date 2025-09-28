// @ts-nocheck
import logger from '@/shared/utils/logger';
/**
 * 🏥 Professional Profile Service - AiDuxCare V.2
 * Sistema de perfiles profesionales con compliance por país
 * Implementación del Blueprint Oficial
 */

export interface ProfessionalProfile {
  id: string;
  license: string;
  country: string;
  city: string;
  state?: string;
  specialties: string[];
  certifications: string[];
  practiceType: 'clínica' | 'hospital' | 'consultorio' | 'domicilio';
  licenseExpiry: Date;
  isActive: boolean;
  complianceSettings: ComplianceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceSettings {
  country: string;
  regulations: string[];
  allowedTechniques: string[];
  forbiddenTechniques: string[];
  medicationRestrictions: string[];
  referralRequirements: string[];
  documentationStandards: string[];
  dataRetentionPolicy: string;
}

export interface CountryRegulations {
  [country: string]: {
    name: string;
    regulations: string[];
    allowedTechniques: string[];
    forbiddenTechniques: string[];
    medicationRestrictions: string[];
    referralRequirements: string[];
    documentationStandards: string[];
    dataRetentionPolicy: string;
  };
}

export class ProfessionalProfileService {
  private static instance: ProfessionalProfileService;
  private profiles: Map<string, ProfessionalProfile> = new Map();
  
  // Base de conocimiento de normativas por país
  private countryRegulations: CountryRegulations = {
    'España': {
      name: 'España',
      regulations: ['Ley 44/2003', 'Real Decreto 1001/2002', 'GDPR'],
      allowedTechniques: [
        'Terapia Manual',
        'Ejercicio Terapéutico',
        'Punción Seca',
        'Electroterapia',
        'Hidroterapia',
        'Termoterapia',
        'Crioterapia'
      ],
      forbiddenTechniques: [
        'Prescripción de medicamentos',
        'Manipulaciones vertebrales sin formación específica',
        'Acupuntura sin certificación'
      ],
      medicationRestrictions: [
        'NO prescripción de medicamentos',
        'NO recomendación de fármacos',
        'Solo derivación médica para medicación'
      ],
      referralRequirements: [
        'Dolor agudo severo',
        'Banderas rojas',
        'Sospecha de patología sistémica',
        'Falta de mejoría en 2 semanas'
      ],
      documentationStandards: [
        'Historia clínica obligatoria',
        'Consentimiento informado',
        'Documentación SOAP',
        'Registro de modificaciones'
      ],
      dataRetentionPolicy: 'Eliminación automática post-aprobación según GDPR'
    },
    
    'México': {
      name: 'México',
      regulations: ['NOM-035', 'Ley General de Salud', 'LGPD'],
      allowedTechniques: [
        'Terapia Manual',
        'Ejercicio Terapéutico',
        'Punción Seca',
        'Electroterapia',
        'Acupuntura (con certificación)',
        'Hidroterapia'
      ],
      forbiddenTechniques: [
        'Prescripción de medicamentos',
        'Manipulaciones sin formación',
        'Acupuntura sin certificación específica'
      ],
      medicationRestrictions: [
        'NO prescripción de medicamentos',
        'NO recomendación de fármacos',
        'Derivación médica obligatoria'
      ],
      referralRequirements: [
        'Dolor agudo severo',
        'Banderas rojas',
        'Patología sistémica',
        'Falta de mejoría'
      ],
      documentationStandards: [
        'Historia clínica',
        'Consentimiento informado',
        'Documentación SOAP',
        'Registro de cambios'
      ],
      dataRetentionPolicy: 'Eliminación automática según LGPD'
    },
    
    'Estados Unidos': {
      name: 'Estados Unidos',
      regulations: ['HIPAA', 'HITECH Act', 'State Regulations'],
      allowedTechniques: [
        'Physical Therapy',
        'Manual Therapy',
        'Therapeutic Exercise',
        'Dry Needling (licensed states)',
        'Electrotherapy',
        'Hydrotherapy'
      ],
      forbiddenTechniques: [
        'Medication prescription',
        'Manipulation without certification',
        'Acupuncture without license'
      ],
      medicationRestrictions: [
        'NO medication prescription',
        'NO drug recommendations',
        'Medical referral required'
      ],
      referralRequirements: [
        'Acute severe pain',
        'Red flags',
        'Systemic pathology',
        'No improvement'
      ],
      documentationStandards: [
        'Clinical documentation',
        'Informed consent',
        'SOAP documentation',
        'Change tracking'
      ],
      dataRetentionPolicy: 'Automatic deletion post-approval per HIPAA'
    },
    
    'Canadá': {
      name: 'Canadá',
      regulations: ['PIPEDA', 'Provincial Health Acts'],
      allowedTechniques: [
        'Physical Therapy',
        'Manual Therapy',
        'Therapeutic Exercise',
        'Acupuncture (certified)',
        'Electrotherapy'
      ],
      forbiddenTechniques: [
        'Medication prescription',
        'Manipulation without certification',
        'Acupuncture without certification'
      ],
      medicationRestrictions: [
        'NO medication prescription',
        'NO drug recommendations',
        'Medical referral required'
      ],
      referralRequirements: [
        'Acute severe pain',
        'Red flags',
        'Systemic pathology',
        'No improvement'
      ],
      documentationStandards: [
        'Clinical documentation',
        'Informed consent',
        'SOAP documentation',
        'Change tracking'
      ],
      dataRetentionPolicy: 'Automatic deletion post-approval per PIPEDA'
    }
  };

  private constructor() {}

  static getInstance(): ProfessionalProfileService {
    if (!ProfessionalProfileService.instance) {
      ProfessionalProfileService.instance = new ProfessionalProfileService();
    }
    return ProfessionalProfileService.instance;
  }

  /**
   * Crear perfil profesional con compliance automático
   */
  async createProfile(profileData: Omit<ProfessionalProfile, 'id' | 'complianceSettings' | 'createdAt' | 'updatedAt'>): Promise<ProfessionalProfile> {
    const id = `PROF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Blindaje para inicializar arrays críticos
    const safeProfileData = {
      ...profileData,
      specialties: Array.isArray(profileData.specialties) ? profileData.specialties : [],
      certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
    };

    // Obtener compliance settings del país
    const complianceSettings = this.getComplianceSettings(profileData.country);
    
    const profile: ProfessionalProfile = {
      ...safeProfileData,
      id,
      complianceSettings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(id, profile);
    
    console.log(`🏥 Perfil profesional creado: ${profileData.license} (${profileData.country})`);
    console.log(`📋 Compliance aplicado: ${complianceSettings.regulations.length} normativas`);
    
    return profile;
  }

  /**
   * Obtener configuración de compliance por país
   */
  private getComplianceSettings(country: string): ComplianceSettings {
    const countryReg = this.countryRegulations[country];
    
    if (!countryReg) {
      // Configuración por defecto para países no especificados
      return {
        country,
        regulations: ['GDPR', 'Local Regulations'],
        allowedTechniques: ['Terapia Manual', 'Ejercicio Terapéutico'],
        forbiddenTechniques: ['Prescripción de medicamentos'],
        medicationRestrictions: ['NO medicamentos'],
        referralRequirements: ['Banderas rojas', 'Dolor agudo'],
        documentationStandards: ['Historia clínica', 'SOAP'],
        dataRetentionPolicy: 'Eliminación automática post-aprobación'
      };
    }

    return {
      country,
      regulations: countryReg.regulations,
      allowedTechniques: countryReg.allowedTechniques,
      forbiddenTechniques: countryReg.forbiddenTechniques,
      medicationRestrictions: countryReg.medicationRestrictions,
      referralRequirements: countryReg.referralRequirements,
      documentationStandards: countryReg.documentationStandards,
      dataRetentionPolicy: countryReg.dataRetentionPolicy
    };
  }

  /**
   * Validar técnica según compliance del profesional
   */
  validateTechnique(profileId: string, technique: string): { allowed: boolean; reason?: string } {
    const profile = this.profiles.get(profileId);
    
    if (!profile) {
      return { allowed: false, reason: 'Perfil no encontrado' };
    }

    const { allowedTechniques, forbiddenTechniques } = profile.complianceSettings;

    if (forbiddenTechniques.some(forbidden => 
      technique.toLowerCase().includes(forbidden.toLowerCase())
    )) {
      return { 
        allowed: false, 
        reason: `Técnica prohibida en ${profile.country}: ${technique}` 
      };
    }

    if (allowedTechniques.some(allowed => 
      technique.toLowerCase().includes(allowed.toLowerCase())
    )) {
      return { allowed: true };
    }

    // Verificar certificaciones específicas
    if (technique.toLowerCase().includes('acupuntura') && 
        !profile.certifications.some(cert => cert.toLowerCase().includes('acupuntura'))) {
      return { 
        allowed: false, 
        reason: 'Acupuntura requiere certificación específica' 
      };
    }

    if (technique.toLowerCase().includes('manipulación') && 
        !profile.certifications.some(cert => cert.toLowerCase().includes('manipulación'))) {
      return { 
        allowed: false, 
        reason: 'Manipulaciones requieren certificación específica' 
      };
    }

    return { allowed: true };
  }

  /**
   * Validar sugerencias según compliance
   */
  validateSuggestion(profileId: string, suggestion: string): { allowed: boolean; reason?: string; alternative?: string } {
    const profile = this.profiles.get(profileId);
    
    if (!profile) {
      return { allowed: false, reason: 'Perfil no encontrado' };
    }

    const { medicationRestrictions, forbiddenTechniques } = profile.complianceSettings;

    // Verificar restricciones de medicamentos
    if (medicationRestrictions.some(restriction => 
      suggestion.toLowerCase().includes(restriction.toLowerCase().replace('no ', ''))
    )) {
      return { 
        allowed: false, 
        reason: `Sugerencia de medicamento prohibida en ${profile.country}`,
        alternative: 'Derivar al médico para evaluación farmacológica'
      };
    }

    // Verificar técnicas prohibidas
    if (forbiddenTechniques.some(forbidden => 
      suggestion.toLowerCase().includes(forbidden.toLowerCase())
    )) {
      return { 
        allowed: false, 
        reason: `Técnica prohibida en ${profile.country}: ${suggestion}`,
        alternative: 'Considerar técnicas alternativas permitidas'
      };
    }

    return { allowed: true };
  }

  /**
   * Obtener recomendaciones personalizadas según perfil
   */
  getPersonalizedRecommendations(
    professionalProfileId: string
  ): string[] {
    const profile = this.profiles.get(professionalProfileId);
    
    if (!profile) {
      return [];
    }

    const recommendations: string[] = [];
    // Blindaje defensivo para arrays
    const allowedTechniques = Array.isArray(profile.complianceSettings?.allowedTechniques)
      ? profile.complianceSettings.allowedTechniques
      : [];
    const specialties = Array.isArray(profile.specialties) ? profile.specialties : [];

    // Recomendaciones basadas en especialidades
    if (specialties.includes('Ortopedia')) {
      recommendations.push('Evaluación biomecánica completa');
      recommendations.push('Programa de ejercicios progresivos');
    }

    if (specialties.includes('Neurología')) {
      recommendations.push('Evaluación funcional detallada');
      recommendations.push('Programa de rehabilitación neurológica');
    }

    if (specialties.includes('Deportiva')) {
      recommendations.push('Análisis de gesto deportivo');
      recommendations.push('Programa de retorno al deporte');
    }

    // Recomendaciones basadas en técnicas permitidas
    if (allowedTechniques.some((tech: string) => tech && tech.includes('Punción Seca'))) {
      recommendations.push('Evaluación de puntos gatillo');
    }

    if (allowedTechniques.some((tech: string) => tech && tech.includes('Acupuntura'))) {
      recommendations.push('Evaluación de meridianos');
    }

    return recommendations;
  }

  /**
   * Verificar expiración de licencia
   */
  checkLicenseExpiry(profileId: string): { valid: boolean; daysUntilExpiry: number; warning?: string } {
    const profile = this.profiles.get(profileId);
    
    if (!profile) {
      return { valid: false, daysUntilExpiry: -1, warning: 'Perfil no encontrado' };
    }

    const now = new Date();
    const expiry = profile.licenseExpiry;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { 
        valid: false, 
        daysUntilExpiry, 
        warning: 'Licencia expirada' 
      };
    }

    if (daysUntilExpiry <= 30) {
      return { 
        valid: true, 
        daysUntilExpiry, 
        warning: `Licencia expira en ${daysUntilExpiry} días` 
      };
    }

    return { valid: true, daysUntilExpiry };
  }

  /**
   * Obtener perfil por ID
   */
  getProfile(profileId: string): ProfessionalProfile | null {
    return this.profiles.get(profileId) || null;
  }

  /**
   * Actualizar perfil
   */
  updateProfile(profileId: string, updates: Partial<ProfessionalProfile>): ProfessionalProfile | null {
    const profile = this.profiles.get(profileId);
    
    if (!profile) {
      return null;
    }

    const updatedProfile: ProfessionalProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };

    this.profiles.set(profileId, updatedProfile);
    return updatedProfile;
  }

  /**
   * Listar todos los perfiles
   */
  getAllProfiles(): ProfessionalProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Obtener normativas por país
   */
  getCountryRegulations(country: string) {
    return this.countryRegulations[country] || null;
  }

  /**
   * Listar países soportados
   */
  getSupportedCountries(): string[] {
    return Object.keys(this.countryRegulations);
  }
}

export default ProfessionalProfileService; 