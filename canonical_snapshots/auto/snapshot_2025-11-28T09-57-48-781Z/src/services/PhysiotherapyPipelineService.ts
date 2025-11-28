import logger from '@/shared/utils/logger';
/**
 * 🏥 Physiotherapy Pipeline Service - AiDuxCare V.2
 * Pipeline completo de procesamiento de consultas fisioterapéuticas
 */

export interface TranscriptionSegment {
  speaker: 'paciente' | 'terapeuta';
  text: string;
  timestamp: number;
}

export interface ClinicalHighlight {
  id: string;
  text: string;
  category: 'síntoma' | 'hallazgo' | 'antecedente' | 'medicación' | 'actividad';
  confidence: number;
  isSelected: boolean;
}

export interface ClinicalWarning {
  id: string;
  type: 'legal' | 'contraindicación' | 'bandera_roja' | 'bandera_amarilla' | 'punto_ciego' | 'sugerencia_diagnóstica' | 'test_provocación';
  description: string;
  severity: 'alta' | 'media' | 'baja';
  category: 'compliance' | 'seguridad' | 'diagnóstico' | 'tratamiento';
  isAccepted: boolean;
}

export interface SOAPDocument {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  timestamp: Date;
  version: number;
}

export interface ProfessionalProfile {
  license: string;
  country: string;
  city: string;
  state?: string;
  specialties: string[];
  certifications: string[];
  practiceType: 'clínica' | 'hospital' | 'consultorio' | 'domicilio';
}

export class PhysiotherapyPipelineService {
  private professionalProfile: ProfessionalProfile | null = null;

  constructor(profile?: ProfessionalProfile) {
    if (profile) {
      this.professionalProfile = profile;
    }
  }

  /**
   * FASE 1: Procesamiento de Transcripción Médica
   * Convierte texto desordenado en highlights y advertencias estructuradas
   */
  async processMedicalTranscription(
    rawTranscription: string
  ): Promise<{
    highlights: ClinicalHighlight[];
    warnings: ClinicalWarning[];
    complianceIssues: string[];
  }> {
    console.log('🏥 Procesando transcripción médica...');
    
    // Simulación de procesamiento con IA médica especializada
    const segments = this.parseTranscription(rawTranscription);
    const highlights = this.extractClinicalHighlights(segments);
    const warnings = this.generateClinicalWarnings(segments, highlights);
    const complianceIssues = this.checkComplianceIssues(warnings);

    return {
      highlights,
      warnings,
      complianceIssues
    };
  }

  /**
   * FASE 2: Generación de Tests Clínicos Sugeridos
   * Basado en highlights seleccionados y advertencias
   */
  async generateSuggestedTests(
    highlights: ClinicalHighlight[]
  ): Promise<Array<Record<string, unknown>>> {
    console.log('🔍 Generando tests clínicos sugeridos...');
    
    const symptoms = highlights.filter(h => h.category === 'síntoma');
    
    const suggestedTests: Array<{
      name: string;
      category: 'ortopédico' | 'neurológico' | 'cardiorrespiratorio' | 'funcional';
      description: string;
      contraindications: string[];
      expectedResults: string[];
    }> = [];

    // Tests ortopédicos
    if (symptoms.some(s => s.text.toLowerCase().includes('dolor'))) {
      suggestedTests.push({
        name: 'Test de Lasègue',
        category: 'ortopédico',
        description: 'Evaluación de irritación radicular lumbar',
        contraindications: ['Dolor agudo severo', 'Fractura vertebral'],
        expectedResults: ['Positivo/Negativo', 'Ángulo de reproducción del dolor']
      });
    }

    if (symptoms.some(s => s.text.toLowerCase().includes('hombro'))) {
      suggestedTests.push({
        name: 'Test de Neer',
        category: 'ortopédico',
        description: 'Evaluación de pinzamiento subacromial',
        contraindications: ['Fractura de hombro', 'Luxación reciente'],
        expectedResults: ['Positivo/Negativo', 'Reproducción del dolor']
      });
    }

    // Tests neurológicos
    if (symptoms.some(s => s.text.toLowerCase().includes('adormecimiento') || s.text.toLowerCase().includes('hormigueo'))) {
      suggestedTests.push({
        name: 'Test de Sensibilidad',
        category: 'neurológico',
        description: 'Evaluación de alteraciones sensitivas',
        contraindications: ['Heridas abiertas', 'Infección activa'],
        expectedResults: ['Normal/Disminuida/Ausente', 'Patrón de distribución']
      });
    }

    // Tests funcionales
    suggestedTests.push({
      name: 'Test de Timed Up and Go',
      category: 'funcional',
      description: 'Evaluación de movilidad y equilibrio',
      contraindications: ['Inestabilidad severa', 'Dolor agudo'],
      expectedResults: ['<10s Normal', '10-20s Riesgo leve', '>20s Riesgo alto']
    });

    return suggestedTests;
  }

  /**
   * FASE 3: Generación de SOAP
   * Con toda la información recopilada
   */
  async generateSOAPDocument(
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[],
    testResults: Array<Record<string, unknown>>
  ): Promise<SOAPDocument> {
    console.log('📝 Generando documento clínico...');
    
    const subjective = this.generateSubjective(highlights);
    const objective = this.generateObjective(highlights, testResults);
    const assessment = this.generateAssessment(highlights, warnings, testResults);
    const plan = this.generatePlan(highlights, warnings);

    return {
      subjective,
      objective,
      assessment,
      plan,
      timestamp: new Date(),
      version: 1
    };
  }

  /**
   * Verificación de Compliance
   * Asegura que no se sugieran medicamentos y se cumplan normativas
   */
  private checkComplianceIssues(
    warnings: ClinicalWarning[]
  ): string[] {
    const issues: string[] = [];
    
    // Verificar que no se sugieran medicamentos
    const medicationWarnings = warnings.filter(w => 
      w.description.toLowerCase().includes('medicamento') ||
      w.description.toLowerCase().includes('fármaco') ||
      w.description.toLowerCase().includes('analgésico')
    );
    
    if (medicationWarnings.length > 0) {
      issues.push('❌ VIOLACIÓN: Se detectaron sugerencias de medicamentos (prohibido en fisioterapia)');
    }

    // Verificar normativas por país
    if (this.professionalProfile) {
      if (this.professionalProfile.country === 'España') {
        // Verificar normativas españolas
        if (warnings.some(w => w.description.toLowerCase().includes('manipulación vertebral'))) {
          issues.push('⚠️ ADVERTENCIA: Manipulaciones vertebrales requieren formación específica en España');
        }
      }
      
      if (this.professionalProfile.country === 'México') {
        // Verificar normativas mexicanas
        if (warnings.some(w => w.description.toLowerCase().includes('acupuntura'))) {
          issues.push('⚠️ ADVERTENCIA: Acupuntura requiere certificación específica en México');
        }
      }
    }

    return issues;
  }

  // Métodos auxiliares privados
  private parseTranscription(rawText: string): TranscriptionSegment[] {
    // Simulación de parsing de transcripción
    const lines = rawText.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      speaker: line.toLowerCase().includes('paciente') ? 'paciente' : 'terapeuta',
      text: line.replace(/^(paciente|terapeuta):\s*/i, ''),
      timestamp: index * 1000
    }));
  }

  private extractClinicalHighlights(
    segments: TranscriptionSegment[]
  ): ClinicalHighlight[] {
    const highlights: ClinicalHighlight[] = [];
    let id = 1;

    segments.forEach(segment => {
      const text = segment.text.toLowerCase();
      
      // Extraer síntomas
      if (text.includes('dolor') || text.includes('molestia') || text.includes('incomodidad')) {
        highlights.push({
          id: `h${id++}`,
          text: segment.text,
          category: 'síntoma',
          confidence: 0.95,
          isSelected: false
        });
      }
      
      // Extraer hallazgos
      if (text.includes('limitación') || text.includes('dificultad') || text.includes('imposibilidad')) {
        highlights.push({
          id: `h${id++}`,
          text: segment.text,
          category: 'hallazgo',
          confidence: 0.88,
          isSelected: false
        });
      }
      
      // Extraer antecedentes
      if (text.includes('hace') && (text.includes('meses') || text.includes('años') || text.includes('días'))) {
        highlights.push({
          id: `h${id++}`,
          text: segment.text,
          category: 'antecedente',
          confidence: 0.92,
          isSelected: false
        });
      }
    });

    return highlights;
  }

  private generateClinicalWarnings(
    segments: TranscriptionSegment[],
    highlights: ClinicalHighlight[]
  ): ClinicalWarning[] {
    const warnings: ClinicalWarning[] = [];
    let id = 1;

    // Banderas rojas
    if (highlights.some(h => h.text.toLowerCase().includes('dolor nocturno'))) {
      warnings.push({
        id: `w${id++}`,
        type: 'bandera_roja',
        description: 'Dolor nocturno - Requiere evaluación médica urgente',
        severity: 'alta',
        category: 'seguridad',
        isAccepted: false
      });
    }

    // Contraindicaciones
    if (highlights.some(h => h.text.toLowerCase().includes('cirugía'))) {
      warnings.push({
        id: `w${id++}`,
        type: 'contraindicación',
        description: 'Antecedente quirúrgico - Precaución con movilizaciones',
        severity: 'media',
        category: 'seguridad',
        isAccepted: false
      });
    }

    // Puntos ciegos
    if (!highlights.some(h => h.text.toLowerCase().includes('alergia'))) {
      warnings.push({
        id: `w${id++}`,
        type: 'punto_ciego',
        description: 'No se mencionaron alergias - Investigar antes de tratamiento',
        severity: 'media',
        category: 'seguridad',
        isAccepted: false
      });
    }

    return warnings;
  }

  private generateSubjective(
    highlights: ClinicalHighlight[]
  ): string {
    const symptoms = highlights.filter(h => h.category === 'síntoma').map(h => h.text);
    
    let subjective = 'Paciente adulto. ';
    
    if (symptoms.length > 0) {
      subjective += `Refiere: ${symptoms.join('; ')}. `;
    }
    
    return subjective;
  }

  private generateObjective(
    highlights: ClinicalHighlight[],
    testResults: Array<Record<string, unknown>>
  ): string {
    const findings = highlights.filter(h => h.category === 'hallazgo').map(h => h.text);
    const tests = testResults.map(t => `${t.testName}: ${t.result}`);
    
    return `Hallazgos: ${findings.join('; ')}. 
Tests realizados: ${tests.join('; ')}.`;
  }

  private generateAssessment(
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[],
    testResults: Array<Record<string, unknown>>
  ): string {
    const symptoms = highlights.filter(h => h.category === 'síntoma');
    const findings = highlights.filter(h => h.category === 'hallazgo');
    
    return `Evaluación fisioterapéutica basada en: ${symptoms.length} síntomas principales, 
${findings.length} hallazgos clínicos, ${testResults.length} tests realizados. 
Consideraciones: ${warnings.filter(w => w.isAccepted).map(w => w.description).join('; ')}.`;
  }

  private generatePlan(
    highlights: ClinicalHighlight[],
    warnings: ClinicalWarning[]
  ): string {
    const acceptedWarnings = warnings.filter(w => w.isAccepted);
    const contraindications = acceptedWarnings.filter(w => w.type === 'contraindicación');
    
    let plan = 'Plan de tratamiento fisioterapéutico: ';
    
    if (contraindications.length > 0) {
      plan += 'Precauciones especiales por contraindicaciones identificadas. ';
    }
    
    plan += 'Ejercicios terapéuticos progresivos, educación del paciente, reevaluación en 1 semana.';
    
    return plan;
  }
}

export default PhysiotherapyPipelineService; 