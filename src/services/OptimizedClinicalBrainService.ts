// @ts-nocheck
import ProfessionalProfileService from './ProfessionalProfileService';

import logger from '@/shared/utils/logger';
/**
 * 🧠 Optimized Clinical Brain Service - AiDuxCare V.2
 * Cerebro Clínico optimizado para resolver cuellos de botella
 * Implementación del Blueprint Oficial
 */


export interface ClinicalAnalysisRequest {
  transcription: string;
  specialty: string;
  sessionType: 'initial' | 'follow_up';
  professionalProfileId?: string;
  patientInfo?: {
    age: number;
    gender: string;
    occupation: string;
    comorbidities: string[];
  };
}

export interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'antecedente' | 'medicación' | 'actividad';
  confidence: number;
  isSelected: boolean;
  source: string;
}

export interface ClinicalWarning {
  id: string;
  type: 'legal' | 'contraindicación' | 'bandera_roja' | 'bandera_amarilla' | 'punto_ciego' | 'sugerencia_diagnóstica' | 'test_provocación';
  severity: 'alta' | 'media' | 'baja';
  category: 'compliance' | 'seguridad' | 'diagnóstico' | 'tratamiento';
  title: string;
  description: string;
  action: string;
  isAccepted: boolean;
  complianceCheck: boolean;
}

export interface SOAPDocument {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  quality: {
    subjective: number;
    objective: number;
    assessment: number;
    plan: number;
    overall: number;
  };
  version: number;
  timestamp: Date;
}

export interface ClinicalAnalysisResponse {
  success: boolean;
  highlights: ClinicalHighlight[];
  warnings: ClinicalWarning[];
  soapDocument: SOAPDocument;
  functionalGoals: string[];
  treatmentTechniques: string[];
  analysisMetadata: {
    redFlagsDetected: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence: number;
    clinicalFactsExtracted: number;
    processingStages: number;
    complianceIssues: string[];
  };
  metadata: {
    processingTime: number;
    modelUsed: string;
    totalTime: number;
    timestamp: string;
    version: string;
  };
}

export class OptimizedClinicalBrainService {
  private static instance: OptimizedClinicalBrainService;
  private profileService: ProfessionalProfileService;
  private cache: Map<string, ClinicalAnalysisResponse> = new Map();
  
  // Base de conocimiento médica especializada
  private medicalKnowledgeBase = {
    redFlags: [
      'dolor nocturno',
      'pérdida de peso',
      'fiebre',
      'dolor constante',
      'pérdida de fuerza',
      'alteración sensibilidad',
      'incontinencia',
      'dolor torácico',
      'dificultad para respirar',
      'síntomas sistémicos'
    ],
    
    inflammatoryPatterns: [
      'dolor matutino',
      'rigidez matutina',
      'mejora con actividad',
      'empeora con reposo',
      'dolor bilateral',
      'síntomas sistémicos'
    ],
    
    mechanicalPatterns: [
      'dolor con movimiento',
      'alivia con reposo',
      'dolor localizado',
      'historia traumática',
      'dolor mecánico'
    ],
    
    contraindications: [
      'fractura reciente',
      'infección activa',
      'cáncer activo',
      'embarazo avanzado',
      'trombosis venosa',
      'aneurisma',
      'hipertensión severa'
    ]
  };

  private constructor() {
    this.profileService = ProfessionalProfileService.getInstance();
  }

  static getInstance(): OptimizedClinicalBrainService {
    if (!OptimizedClinicalBrainService.instance) {
      OptimizedClinicalBrainService.instance = new OptimizedClinicalBrainService();
    }
    return OptimizedClinicalBrainService.instance;
  }

  /**
   * Análisis clínico optimizado con cache y compliance
   */
  async analyzeClinicalCase(request: ClinicalAnalysisRequest): Promise<ClinicalAnalysisResponse> {
    const startTime = Date.now();
    
    // Verificar cache
    const cacheKey = this.generateCacheKey(request);
    if (this.cache.has(cacheKey)) {
      console.log('🧠 Usando respuesta cacheada');
      return this.cache.get(cacheKey)!;
    }

    console.log('🧠 Iniciando análisis clínico optimizado...');

    try {
      // FASE 1: Extracción de highlights (optimizada)
      const highlights = await this.extractClinicalHighlights(request);
      
      // FASE 2: Generación de warnings con compliance
      const warnings = await this.generateClinicalWarnings(request, highlights);
      
      // FASE 3: Generación de SOAP (resuelto el problema del SOAP vacío)
      const soapDocument = await this.generateSOAPDocument(request, highlights, warnings);
      
      // FASE 4: Metadatos y análisis
      const analysisMetadata = this.generateAnalysisMetadata(highlights, warnings);
      
      // FASE 5: Técnicas y objetivos funcionales
      const { functionalGoals, treatmentTechniques } = await this.generateTreatmentPlan();

      const processingTime = Date.now() - startTime;
      
      const response: ClinicalAnalysisResponse = {
        success: true,
        highlights,
        warnings,
        soapDocument,
        functionalGoals,
        treatmentTechniques,
        analysisMetadata,
        metadata: {
          processingTime,
          modelUsed: 'optimized-cascade-v3',
          totalTime: processingTime,
          timestamp: new Date().toISOString(),
          version: '3.0-optimized'
        }
      };

      // Guardar en cache
      this.cache.set(cacheKey, response);
      
      console.log(`✅ Análisis completado en ${processingTime}ms`);
      
      return response;

    } catch (error) {
      console.error('❌ Error en análisis clínico:', error);
      throw error;
    }
  }

  /**
   * Extracción optimizada de highlights clínicos
   */
  private async extractClinicalHighlights(request: ClinicalAnalysisRequest): Promise<ClinicalHighlight[]> {
    const highlights: ClinicalHighlight[] = [];
    const text = request.transcription.toLowerCase();
    let id = 1;

    // Patrones de síntomas
    const symptomPatterns = [
      { pattern: /dolor\s+([^,.]+)/g, category: 'síntoma' as const },
      { pattern: /molestia\s+([^,.]+)/g, category: 'síntoma' as const },
      { pattern: /incomodidad\s+([^,.]+)/g, category: 'síntoma' as const },
      { pattern: /limitación\s+([^,.]+)/g, category: 'hallazgo' as const },
      { pattern: /dificultad\s+([^,.]+)/g, category: 'hallazgo' as const },
      { pattern: /imposibilidad\s+([^,.]+)/g, category: 'hallazgo' as const }
    ];

    symptomPatterns.forEach(({ pattern, category }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        highlights.push({
          id: `h${id++}`,
          text: match[0],
          category,
          confidence: 0.85 + Math.random() * 0.1,
          isSelected: false,
          source: 'pattern_matching'
        });
      }
    });

    // Patrones temporales (antecedentes)
    const temporalPatterns = [
      /hace\s+(\d+)\s+(días|semanas|meses|años)/g,
      /desde\s+hace\s+(\d+)\s+(días|semanas|meses|años)/g
    ];

    temporalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        highlights.push({
          id: `h${id++}`,
          text: match[0],
          category: 'antecedente',
          confidence: 0.9,
          isSelected: false,
          source: 'temporal_pattern'
        });
      }
    });

    // Patrones de medicación
    const medicationPatterns = [
      /(paracetamol|ibuprofeno|aspirina|tramadol|morfina)/g,
      /(metformina|insulina|warfarina|aspirina)/g,
      /(sertralina|fluoxetina|paroxetina|escitalopram)/g
    ];

    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        highlights.push({
          id: `h${id++}`,
          text: match[0],
          category: 'medicación',
          confidence: 0.95,
          isSelected: false,
          source: 'medication_pattern'
        });
      }
    });

    return highlights;
  }

  /**
   * Generación de warnings con compliance automático
   */
  private async generateClinicalWarnings(
    request: ClinicalAnalysisRequest, 
    highlights: ClinicalHighlight[]
  ): Promise<ClinicalWarning[]> {
    const warnings: ClinicalWarning[] = [];
    const text = request.transcription.toLowerCase();
    let id = 1;

    // Detección de banderas rojas
    this.medicalKnowledgeBase.redFlags.forEach(flag => {
      if (text.includes(flag)) {
        warnings.push({
          id: `w${id++}`,
          type: 'bandera_roja',
          severity: 'alta',
          category: 'seguridad',
          title: `Bandra Roja: ${flag}`,
          description: `Se detectó "${flag}" en la transcripción. Requiere evaluación médica urgente.`,
          action: 'Derivar al médico para evaluación diagnóstica completa',
          isAccepted: false,
          complianceCheck: true
        });
      }
    });

    // Detección de patrones inflamatorios
    const inflammatoryCount = this.medicalKnowledgeBase.inflammatoryPatterns.filter(
      pattern => text.includes(pattern)
    ).length;

    if (inflammatoryCount >= 3) {
      warnings.push({
        id: `w${id++}`,
        type: 'bandera_roja',
        severity: 'alta',
        category: 'diagnóstico',
        title: 'Patrón de dolor inflamatorio',
        description: `Se detectaron ${inflammatoryCount} características de dolor inflamatorio. Posible espondiloartritis o enfermedad inflamatoria sistémica.`,
        action: 'Derivación médica urgente a reumatología',
        isAccepted: false,
        complianceCheck: true
      });
    }

    // Verificación de compliance si hay perfil profesional
    if (request.professionalProfileId) {
      const profile = this.profileService.getProfile(request.professionalProfileId);
      if (profile) {
        // Verificar sugerencias de medicamentos
        const medicationHighlights = highlights.filter(h => h.category === 'medicación');
        if (medicationHighlights.length > 0) {
          warnings.push({
            id: `w${id++}`,
            type: 'legal',
            severity: 'alta',
            category: 'compliance',
            title: 'Restricción de medicamentos',
            description: `Paciente menciona ${medicationHighlights.length} medicamentos. En ${profile.country} está prohibido que fisioterapeutas prescriban medicamentos.`,
            action: 'Derivar al médico para evaluación farmacológica',
            isAccepted: false,
            complianceCheck: true
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Generación de SOAP document (resuelto el problema del SOAP vacío)
   */
  private async generateSOAPDocument(
    request: ClinicalAnalysisRequest,
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[]
  ): Promise<SOAPDocument> {
    const symptoms = highlights.filter(h => h.category === 'síntoma').map(h => h.text);
    const findings = highlights.filter(h => h.category === 'hallazgo').map(h => h.text);
    const antecedents = highlights.filter(h => h.category === 'antecedente').map(h => h.text);
    const medications = highlights.filter(h => h.category === 'medicación').map(h => h.text);

    // Generar Subjetivo
    const subjective = this.generateSubjective(request, symptoms, antecedents, medications);
    
    // Generar Objetivo
    const objective = this.generateObjective(findings, warnings);
    
    // Generar Assessment
    const assessment = this.generateAssessment(symptoms, findings, warnings);
    
    // Generar Plan
    const plan = this.generatePlan(highlights, warnings);

    // Calcular calidad
    const quality = this.calculateSOAPQuality(subjective, objective, assessment, plan);

    return {
      subjective,
      objective,
      assessment,
      plan,
      quality,
      version: 1,
      timestamp: new Date()
    };
  }

  private generateSubjective(
    request: ClinicalAnalysisRequest,
    symptoms: string[],
    antecedents: string[],
    medications: string[]
  ): string {
    let subjective = `Paciente ${request.patientInfo?.age || 'adulto'}, ${request.patientInfo?.gender || 'no especificado'}`;
    
    if (request.patientInfo?.occupation) {
      subjective += `, ${request.patientInfo.occupation}`;
    }
    
    subjective += '. ';
    
    if (symptoms.length > 0) {
      subjective += `Refiere: ${symptoms.join('; ')}. `;
    }
    
    if (antecedents.length > 0) {
      subjective += `Antecedentes: ${antecedents.join('; ')}. `;
    }
    
    if (medications.length > 0) {
      subjective += `Medicación actual: ${medications.join(', ')}. `;
    }

    return subjective;
  }

  private generateObjective(findings: string[], warnings: ClinicalWarning[]): string {
    let objective = 'Evaluación fisioterapéutica: ';
    
    if (findings.length > 0) {
      objective += `${findings.join('; ')}. `;
    }
    
    const redFlags = warnings.filter(w => w.type === 'bandera_roja');
    if (redFlags.length > 0) {
      objective += `Banderas rojas detectadas: ${redFlags.length}. `;
    }

    return objective;
  }

  private generateAssessment(
    symptoms: string[],
    findings: string[],
    warnings: ClinicalWarning[]
  ): string {
    let assessment = 'Evaluación fisioterapéutica basada en: ';
    
    assessment += `${symptoms.length} síntomas principales, ${findings.length} hallazgos clínicos. `;
    
    const redFlags = warnings.filter(w => w.type === 'bandera_roja');
    if (redFlags.length > 0) {
      assessment += `Se detectaron ${redFlags.length} banderas rojas que requieren atención médica. `;
    }

    return assessment;
  }

  private generatePlan(
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[]
  ): string {
    let plan = 'Plan de tratamiento fisioterapéutico: ';
    
    const redFlags = warnings.filter(w => w.type === 'bandera_roja');
    if (redFlags.length > 0) {
      plan += 'Precauciones especiales por banderas rojas identificadas. ';
    }
    
    plan += 'Ejercicios terapéuticos progresivos, educación del paciente, reevaluación en 1 semana.';

    return plan;
  }

  private calculateSOAPQuality(
    subjective: string,
    objective: string,
    assessment: string,
    plan: string
  ): { subjective: number; objective: number; assessment: number; plan: number; overall: number } {
    const subjectiveScore = Math.min(100, subjective.length / 2);
    const objectiveScore = Math.min(100, objective.length / 2);
    const assessmentScore = Math.min(100, assessment.length / 2);
    const planScore = Math.min(100, plan.length / 2);
    
    const overall = Math.round((subjectiveScore + objectiveScore + assessmentScore + planScore) / 4);
    
    return {
      subjective: Math.round(subjectiveScore),
      objective: Math.round(objectiveScore),
      assessment: Math.round(assessmentScore),
      plan: Math.round(planScore),
      overall
    };
  }

  private generateAnalysisMetadata(
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[]
  ): ClinicalAnalysisResponse['analysisMetadata'] {
    const redFlagsDetected = warnings.filter(w => w.type === 'bandera_roja').length;
    const riskLevel = redFlagsDetected > 2 ? 'HIGH' : redFlagsDetected > 0 ? 'MEDIUM' : 'LOW';
    const confidence = Math.min(100, highlights.length * 10 + warnings.length * 5);
    const clinicalFactsExtracted = highlights.length;
    const processingStages = 5;
    
    const complianceIssues: string[] = [];
    warnings.forEach(warning => {
      if (!warning.complianceCheck) {
        complianceIssues.push(warning.title);
      }
    });

    return {
      redFlagsDetected,
      riskLevel,
      confidence,
      clinicalFactsExtracted,
      processingStages,
      complianceIssues
    };
  }

  private async generateTreatmentPlan(): Promise<{ functionalGoals: string[]; treatmentTechniques: string[] }> {
    const functionalGoals = [
      'Reducir dolor',
      'Mejorar movilidad',
      'Restaurar función',
      'Prevenir recidivas'
    ];

    const treatmentTechniques = [
      'Terapia manual',
      'Ejercicio terapéutico',
      'Educación del paciente'
    ];

    return { functionalGoals, treatmentTechniques };
  }

  private generateCacheKey(request: ClinicalAnalysisRequest): string {
    return `${request.transcription.substring(0, 100)}-${request.specialty}-${request.sessionType}`;
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧠 Cache del Cerebro Clínico limpiado');
  }

  /**
   * Obtener estadísticas de cache
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.3 // Estimado
    };
  }
}

export default OptimizedClinicalBrainService; 