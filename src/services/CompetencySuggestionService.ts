import { AgentSuggestion, SuggestionField } from '../types/agent';

import { CompetencyGuardService } from './CompetencyGuardService';
import { professionalCompetencyService } from './ProfessionalCompetencyService';

export interface CompetencySuggestion extends AgentSuggestion {
  type: 'warning' | 'recommendation' | 'info';
  field: SuggestionField;
  competencyId?: string;
  region: string;
  legalBasis: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresAction: boolean;
  geolocationSpecific: boolean;
}

export interface CompetencySuggestionContext {
  region: string;
  userCertifications: string[];
  isPublicSector: boolean;
  mentionedTechniques: string[];
  soapData?: Record<string, unknown>;
}

/**
 * Servicio que integra verificaciones de competencias profesionales
 * en el sistema de sugerencias existente de forma geolocalizada
 */
class CompetencySuggestionService {
  private userRegion: string = 'Madrid';
  private userCertifications: string[] = [];
  private isPublicSector: boolean = false;

  /**
   * Configura el contexto del usuario
   */
  setUserContext(region: string, certifications: string[], publicSector: boolean = false) {
    this.userRegion = region;
    this.userCertifications = certifications;
    this.isPublicSector = publicSector;
    
    // Configurar también el CompetencyGuard
    competencyGuardService.setUserContext(region, certifications, publicSector);
  }

  /**
   * Analiza transcripción y genera sugerencias de competencias
   */
  async analyzeTranscriptionForCompetencies(
    transcript: string,
    context: CompetencySuggestionContext
  ): Promise<CompetencySuggestion[]> {
    const suggestions: CompetencySuggestion[] = [];
    
    // Extraer técnicas mencionadas
    const mentionedTechniques = this.extractTechniquesFromTranscript(transcript);
    
    // Verificar cada técnica mencionada
    for (const technique of mentionedTechniques) {
      const competencyId = this.mapTechniqueToCompetency(technique);
      
      if (competencyId) {
        const check = await competencyGuardService.checkBeforeAction(competencyId);
        
        if (check.warning) {
          const suggestion = this.createCompetencySuggestion({
            type: 'warning',
            content: check.warning.message,
            explanation: check.warning.recommendation,
            competencyId,
            region: context.region,
            riskLevel: check.warning.riskLevel,
            requiresAction: true,
            geolocationSpecific: this.isGeolocationSpecific(competencyId, context.region)
          });
          
          suggestions.push(suggestion);
        }
      }
    }

    // Verificar competencias regionales específicas
    const regionalSuggestions = await this.checkRegionalSpecificCompetencies(context);
    suggestions.push(...regionalSuggestions);

    return suggestions;
  }

  /**
   * Analiza SOAP y genera sugerencias de competencias
   */
  async analyzeSOAPForCompetencies(
    soapData: Record<string, unknown>,
    context: CompetencySuggestionContext
  ): Promise<CompetencySuggestion[]> {
    const suggestions: CompetencySuggestion[] = [];

    // Verificar técnicas en el plan de tratamiento
    const plan = soapData.plan as Record<string, unknown>;
    if (plan && plan.treatments) {
      const treatments = plan.treatments as Array<{ name: string }>;
      for (const treatment of treatments) {
        const competencyId = this.mapTechniqueToCompetency(treatment.name);
        
        if (competencyId) {
          const check = await competencyGuardService.checkBeforeAction(competencyId);
          
          if (check.warning) {
            const suggestion = this.createCompetencySuggestion({
              type: 'warning',
              content: `Técnica "${treatment.name}" requiere verificación de competencia`,
              explanation: check.warning.recommendation,
              competencyId,
              region: context.region,
              riskLevel: check.warning.riskLevel,
              requiresAction: true,
              geolocationSpecific: this.isGeolocationSpecific(competencyId, context.region)
            });
            
            suggestions.push(suggestion);
          }
        }
      }
    }

    // Verificar prescripciones
    if (plan && plan.prescriptions) {
      const prescriptionCheck = await competencyGuardService.checkPrescriptionAuthority();
      
      if (prescriptionCheck.warning) {
        const suggestion = this.createCompetencySuggestion({
          type: 'warning',
          content: 'Autorización de prescripción requerida',
          explanation: prescriptionCheck.warning.recommendation,
          region: context.region,
          riskLevel: prescriptionCheck.warning.riskLevel,
          requiresAction: true,
          geolocationSpecific: false
        });
        
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Genera sugerencias preventivas basadas en la región
   */
  async generatePreventiveSuggestions(context: CompetencySuggestionContext): Promise<CompetencySuggestion[]> {
    const suggestions: CompetencySuggestion[] = [];
    
    // Obtener checklist legal para la región
    const legalChecklist = professionalCompetencyService.generateLegalChecklist(context.region);
    
    // Convertir items críticos en sugerencias
    for (const item of legalChecklist.items) {
      if (item.priority === 'critical' || item.priority === 'high') {
        const suggestion = this.createCompetencySuggestion({
          type: item.priority === 'critical' ? 'warning' : 'recommendation',
          content: item.description,
          explanation: `Requisito legal específico de ${context.region}`,
          region: context.region,
          riskLevel: item.priority === 'critical' ? 'high' : 'medium',
          requiresAction: item.priority === 'critical',
          geolocationSpecific: true
        });
        
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Verifica competencias regionales específicas
   */
  private async checkRegionalSpecificCompetencies(context: CompetencySuggestionContext): Promise<CompetencySuggestion[]> {
    const suggestions: CompetencySuggestion[] = [];

    // Verificaciones específicas por región
    switch (context.region) {
      case 'Cataluña': {
        // Verificar registro de punción seca
        const hasDryNeedlingCert = context.userCertifications.some(cert => 
          cert.toLowerCase().includes('punción seca') || 
          cert.toLowerCase().includes('dry needling')
        );
        
        if (hasDryNeedlingCert) {
          const suggestion = this.createCompetencySuggestion({
            type: 'recommendation',
            content: 'Registro obligatorio de Punción Seca en Col·legi de Fisioterapeutes de Catalunya',
            explanation: 'Contactar con el colegio para completar el registro obligatorio',
            region: context.region,
            riskLevel: 'high',
            requiresAction: true,
            geolocationSpecific: true
          });
          
          suggestions.push(suggestion);
        }
        break;
      }

      case 'Cantabria': {
        // Verificar comisión de técnicas invasivas
        const hasInvasiveCert = context.userCertifications.some(cert => 
          cert.toLowerCase().includes('invasiva') || 
          cert.toLowerCase().includes('invasive')
        );
        
        if (hasInvasiveCert) {
          const suggestion = this.createCompetencySuggestion({
            type: 'recommendation',
            content: 'Consultar Comisión de Fisioterapia Invasiva del ICPFC',
            explanation: 'Verificar requisitos específicos para técnicas invasivas en Cantabria',
            region: context.region,
            riskLevel: 'medium',
            requiresAction: false,
            geolocationSpecific: true
          });
          
          suggestions.push(suggestion);
        }
        break;
      }

      case 'La Rioja': {
        // Verificar técnicas invasivas en fisioterapia deportiva
        const hasSportsCert = context.userCertifications.some(cert => 
          cert.toLowerCase().includes('deportiva') || 
          cert.toLowerCase().includes('sports')
        );
        
        if (hasSportsCert) {
          const suggestion = this.createCompetencySuggestion({
            type: 'info',
            content: 'Técnicas invasivas permitidas en fisioterapia deportiva',
            explanation: 'Incluye punción seca y EPI según normativa regional',
            region: context.region,
            riskLevel: 'low',
            requiresAction: false,
            geolocationSpecific: true
          });
          
          suggestions.push(suggestion);
        }
        break;
      }
    }

    return suggestions;
  }

  /**
   * Extrae técnicas mencionadas de la transcripción
   */
  private extractTechniquesFromTranscript(transcript: string): string[] {
    const techniques = [];
    const lowerTranscript = transcript.toLowerCase();
    
    const techniqueKeywords = [
      'punción seca', 'dry needling', 'ventilación', 'ecografía',
      'osteopatía', 'quiropraxia', 'electroterapia', 'terapia manual',
      'manipulación', 'masaje', 'ejercicio terapéutico', 'ultrasonido',
      'corrientes', 'tens', 'epi', 'punción', 'acupuntura'
    ];

    for (const keyword of techniqueKeywords) {
      if (lowerTranscript.includes(keyword)) {
        techniques.push(keyword);
      }
    }

    return techniques;
  }

  /**
   * Mapea técnicas a IDs de competencia
   */
  private mapTechniqueToCompetency(technique: string): string | null {
    const techniqueMapping: { [key: string]: string } = {
      'punción seca': 'invasive-dry-needling',
      'dry needling': 'invasive-dry-needling',
      'ventilación': 'invasive-ventilation',
      'ventilación mecánica': 'invasive-ventilation',
      'ecografía': 'advanced-ultrasound',
      'ultrasonido': 'advanced-ultrasound',
      'osteopatía': 'advanced-osteopathy',
      'quiropraxia': 'advanced-chiropractic',
      'electroterapia': 'basic-electrotherapy',
      'corrientes': 'basic-electrotherapy',
      'tens': 'basic-electrotherapy',
      'terapia manual': 'basic-manual-therapy',
      'manipulación': 'basic-manual-therapy',
      'masaje': 'basic-manual-therapy',
      'ejercicio terapéutico': 'basic-therapeutic-exercise',
      'epi': 'invasive-dry-needling'
    };

    return techniqueMapping[technique.toLowerCase()] || null;
  }

  /**
   * Verifica si una competencia es específica de la geolocalización
   */
  private isGeolocationSpecific(competencyId: string, region: string): boolean {
    const competency = professionalCompetencyService.getAvailableCompetencies(region)
      .find(c => c.id === competencyId);
    
    return competency?.regionalLevel[region] !== undefined;
  }

  /**
   * Crea una sugerencia de competencia
   */
  private createCompetencySuggestion(params: {
    type: 'warning' | 'recommendation' | 'info';
    content: string;
    explanation: string;
    competencyId?: string;
    region: string;
    riskLevel: 'low' | 'medium' | 'high';
    requiresAction: boolean;
    geolocationSpecific: boolean;
  }): CompetencySuggestion {
    return {
      id: `competency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      field: 'plan' as SuggestionField, // Por defecto en plan, se puede ajustar
      content: params.content,
      sourceBlockId: 'competency-check',
      explanation: params.explanation,
      createdAt: new Date(),
      updatedAt: new Date(),
      competencyId: params.competencyId,
      region: params.region,
      legalBasis: params.competencyId ? 
        professionalCompetencyService.getAvailableCompetencies(params.region)
          .find(c => c.id === params.competencyId)?.nationalLevel.baseLegal || 'No especificado' :
        'Verificación general de competencias',
      riskLevel: params.riskLevel,
      requiresAction: params.requiresAction,
      geolocationSpecific: params.geolocationSpecific,
      context_origin: {
        source_block: 'competency-verification',
        text: `Verificación de competencia profesional en ${params.region}`
      }
    };
  }

  /**
   * Filtra sugerencias por región y prioridad
   */
  filterSuggestionsByRegion(
    suggestions: CompetencySuggestion[],
    region: string,
    priority: 'all' | 'high' | 'medium' | 'low' = 'all'
  ): CompetencySuggestion[] {
    return suggestions.filter(suggestion => {
      const regionMatch = suggestion.region === region;
      const priorityMatch = priority === 'all' || suggestion.riskLevel === priority;
      return regionMatch && priorityMatch;
    });
  }

  /**
   * Obtiene estadísticas de sugerencias por región
   */
  getSuggestionStatistics(suggestions: CompetencySuggestion[]): {
    total: number;
    byRegion: { [region: string]: number };
    byRiskLevel: { [level: string]: number };
    geolocationSpecific: number;
  } {
    const stats = {
      total: suggestions.length,
      byRegion: {} as { [region: string]: number },
      byRiskLevel: {} as { [level: string]: number },
      geolocationSpecific: 0
    };

    for (const suggestion of suggestions) {
      // Contar por región
      stats.byRegion[suggestion.region] = (stats.byRegion[suggestion.region] || 0) + 1;
      
      // Contar por nivel de riesgo
      stats.byRiskLevel[suggestion.riskLevel] = (stats.byRiskLevel[suggestion.riskLevel] || 0) + 1;
      
      // Contar específicas de geolocalización
      if (suggestion.geolocationSpecific) {
        stats.geolocationSpecific++;
      }
    }

    return stats;
  }
}

export const competencySuggestionService = new CompetencySuggestionService(); 